"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { format, isSameDay, set, addMinutes, differenceInMinutes, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, addDays, subDays } from "date-fns";
import {
  Play,
  Pause,
  Plus,
  Calendar as CalendarIcon,
  FileSpreadsheet,
  MapPin,
  Loader2,
  Trash2,
  BedDouble,
  Plane,
  Landmark,
  Hourglass,
  LogOut,
  BarChart,
  ChevronLeft,
  ChevronRight,
  Cog,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import TimeEntryForm from "./time-entry-form";
import TimeEntryCard from "./time-entry-card";
import type { TimeEntry, UserSettings } from "@/lib/types";
import { formatHoursAndMinutes, formatDuration } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { reverseGeocode } from "@/ai/flows/reverse-geocode-flow";
import { addTimeEntry, deleteAllTimeEntries, deleteTimeEntry, getTimeEntries, updateTimeEntry } from "@/services/time-entry-service";
import { Skeleton } from "./ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { getUserSettings } from "@/services/user-settings-service";
import { useTranslation } from "@/context/i18n-context";
import type { SpecialLocationKey } from "@/lib/constants";

const TimeWiseIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M7 9L9 15L12 11L15 15L17 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="12" r="1" fill="currentColor"/>
    </svg>
);

export default function TimeTracker() {
  const { user, signOut } = useAuth();
  const { t } = useTranslation();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [runningTimer, setRunningTimer] = useState<TimeEntry | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [location, setLocation] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setSelectedDate(new Date());
    if (!user) return;

    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const [fetchedEntries, settings] = await Promise.all([
          getTimeEntries(user.uid),
          getUserSettings(user.uid),
        ]);
        setEntries(fetchedEntries);
        setUserSettings(settings);
      } catch (error) {
        console.error("Error fetching initial data:", error);
        toast({
          title: t('toasts.databaseErrorTitle'),
          description: t('toasts.databaseConnectionError'),
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, [user, toast, t]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (runningTimer) {
      interval = setInterval(() => {
        setElapsedTime(
          Math.floor((new Date().getTime() - runningTimer.startTime.getTime()) / 1000)
        );
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [runningTimer]);

  const handleStartTimer = () => {
    if (!user) return;
    if (!location) {
      toast({
        title: t('toasts.locationRequiredTitle'),
        description: t('toasts.locationRequiredDescription'),
        variant: "destructive",
      });
      return;
    }
    const newTimer: TimeEntry = {
      id: Date.now().toString(),
      userId: user.uid,
      startTime: new Date(),
      location,
    };
    setRunningTimer(newTimer);
  };

  const handleStopTimer = () => {
    if (runningTimer) {
      const finishedEntry: TimeEntry = {
        ...runningTimer,
        endTime: new Date(),
      };
      setRunningTimer(null);
      setLocation("");
      setElapsedTime(0);
      setEditingEntry(finishedEntry);
      setIsFormOpen(true);
    }
  };

  const handleSaveEntry = async (entryData: Omit<TimeEntry, 'userId'>) => {
    if (!user) return;
    const entryWithUser = { ...entryData, userId: user.uid };

    setIsFormOpen(false);
    setEditingEntry(null);

    try {
      const existingEntry = entries.find(e => e.id === entryWithUser.id);
      if (existingEntry) {
        await updateTimeEntry(entryWithUser.id, entryWithUser);
        setEntries(entries.map((e) => (e.id === entryWithUser.id ? entryWithUser : e)));
        toast({ title: t('toasts.entryUpdatedTitle'), description: t('toasts.entryUpdatedDescription', {location: entryWithUser.location})});
      } else {
        const newId = await addTimeEntry(entryWithUser);
        const newEntry = {...entryWithUser, id: newId};
        setEntries(prev => [newEntry, ...prev].sort((a, b) => b.startTime.getTime() - a.startTime.getTime()));
        toast({ title: t('toasts.entryAddedTitle'), description: t('toasts.entryAddedDescription', {location: entryWithUser.location})});
      }
    } catch (error) {
      console.error("Error saving entry:", error);
      toast({ title: t('toasts.saveFailedTitle'), description: t('toasts.saveFailedDescription'), variant: "destructive" });
    }
  };

  const handleEditEntry = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setIsFormOpen(true);
  };

  const handleDeleteEntry = async (id: string) => {
    if (!user) return;
    try {
      await deleteTimeEntry(user.uid, id);
      setEntries(entries.filter((entry) => entry.id !== id));
      toast({ title: t('toasts.entryDeletedTitle'), variant: 'destructive'});
    } catch (error) {
      console.error("Error deleting entry:", error);
      toast({ title: t('toasts.deleteFailedTitle'), description: t('toasts.deleteFailedDescription'), variant: "destructive" });
    }
  };

  const handleClearData = async () => {
    if (!user) return;
    try {
      await deleteAllTimeEntries(user.uid);
      setEntries([]);
      if (runningTimer) {
        setRunningTimer(null);
        setLocation("");
        setElapsedTime(0);
      }
      toast({
        title: t('toasts.dataClearedTitle'),
        description: t('toasts.dataClearedDescription'),
      });
    } catch (error) {
      console.error("Error clearing data:", error);
      toast({ title: t('toasts.clearFailedTitle'), description: t('toasts.clearFailedDescription'), variant: "destructive" });
    }
  };

  const handleAddSpecialEntry = async (locationKey: SpecialLocationKey) => {
    if (!selectedDate || !user) return;

    // Fetch latest settings just-in-time to ensure data is not stale.
    const currentSettings = await getUserSettings(user.uid);
    setUserSettings(currentSettings); // Update local state as well for consistency.

    const isTimeOffInLieu = locationKey === 'TIME_OFF_IN_LIEU';
    const hours = isTimeOffInLieu ? 0 : (currentSettings.defaultWorkHours || 7);
    const startTime = set(selectedDate, { hours: 9, minutes: 0, seconds: 0, milliseconds: 0 });
    const endTime = hours > 0 ? addMinutes(startTime, hours * 60) : startTime;

    const newEntry: Omit<TimeEntry, 'id' | 'userId'> = {
      location: locationKey,
      startTime: startTime,
      endTime: endTime,
      pauseDuration: 0,
      travelTime: 0,
      isDriver: false,
    };

    const entryExists = entries.some(e => isSameDay(e.startTime, selectedDate) && e.location === locationKey);
    if (entryExists) {
      toast({
        title: t('toasts.entryExistsTitle'),
        description: t('toasts.entryExistsDescription', { location: t(`special_locations.${locationKey}`) }),
        variant: "destructive",
      });
      return;
    }

    try {
      const entryWithUser = { ...newEntry, userId: user.uid };
      const newId = await addTimeEntry(entryWithUser);
      const finalNewEntry = { ...entryWithUser, id: newId };
      setEntries(prev => [finalNewEntry, ...prev].sort((a, b) => b.startTime.getTime() - a.startTime.getTime()));
      toast({
        title: t('toasts.entryAddedTitle'),
        description: t('toasts.entryAddedDescription', { location: t(`special_locations.${locationKey}`) }),
        className: "bg-accent text-accent-foreground",
      });
    } catch (error) {
      console.error("Error adding special entry:", error);
      toast({ title: t('toasts.saveFailedTitle'), description: t('toasts.saveFailedDescription'), variant: "destructive" });
    }
  };

  const handleGetCurrentLocation = async () => {
    if (isFetchingLocation) return;
    if (navigator.geolocation) {
      setIsFetchingLocation(true);
      toast({
        title: t('time_entry_form.locationFetchToastTitle'),
        description: t('time_entry_form.locationFetchToastDescription'),
      });
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const result = await reverseGeocode({ latitude, longitude });
            setLocation(result.address);
            toast({
              title: t('time_entry_form.locationFetchedToastTitle'),
              description: t('time_entry_form.locationFetchedToastDescription', { address: result.address }),
              className: "bg-accent text-accent-foreground",
            });
          } catch (error) {
            console.error("Error getting address", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
            toast({
              title: t('time_entry_form.locationErrorToastTitle'),
              description: errorMessage,
              variant: "destructive",
            });
            // Fallback to coordinates
            setLocation(`Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`);
          } finally {
            setIsFetchingLocation(false);
          }
        },
        (error) => {
          console.error("Error getting location", error);
          toast({
            title: t('time_entry_form.locationCoordsErrorToastTitle'),
            description: t('time_entry_form.locationCoordsErrorToastDescription'),
            variant: "destructive",
          });
          setIsFetchingLocation(false);
        }
      );
    } else {
      toast({
        title: t('time_entry_form.geolocationNotSupportedToastTitle'),
        description: t('time_entry_form.geolocationNotSupportedToastDescription'),
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    // The auth context and page guard will handle redirection
  };

  const handlePreviousDay = () => {
    if (selectedDate) {
      setSelectedDate(subDays(selectedDate, 1));
    }
  };

  const handleNextDay = () => {
    if (selectedDate) {
      setSelectedDate(addDays(selectedDate, 1));
    }
  };

  const filteredEntries = useMemo(() =>
    selectedDate ? entries.filter((entry) => isSameDay(entry.startTime, selectedDate)) : [],
    [entries, selectedDate]
  );
  
  const calculateTotalCompensatedMinutes = useCallback((entriesToSum: TimeEntry[]): number => {
    return entriesToSum.reduce((total, entry) => {
        if (!entry.endTime) return total;

        const workMinutes = differenceInMinutes(entry.endTime, entry.startTime);
        
        const isNonWorkEntry = ["SICK_LEAVE", "PTO", "BANK_HOLIDAY"].includes(entry.location);
        if (isNonWorkEntry) {
            return total + workMinutes;
        }
        
        if (entry.location === "TIME_OFF_IN_LIEU") {
            return total;
        }
        
        const travelMinutes = (entry.travelTime || 0) * 60;
        const pauseMinutes = entry.pauseDuration || 0;

        return total + workMinutes - pauseMinutes + travelMinutes;
    }, 0);
  }, []);

  const { dailyTotal, weeklyTotal, monthlyTotal } = useMemo(() => {
    if (!selectedDate || !entries.length) {
      return { dailyTotal: 0, weeklyTotal: 0, monthlyTotal: 0 };
    }
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);

    const weekEntries = entries.filter(entry => isWithinInterval(entry.startTime, { start: weekStart, end: weekEnd }));
    const monthEntries = entries.filter(entry => isWithinInterval(entry.startTime, { start: monthStart, end: monthEnd }));

    return {
      dailyTotal: calculateTotalCompensatedMinutes(filteredEntries),
      weeklyTotal: calculateTotalCompensatedMinutes(weekEntries),
      monthlyTotal: calculateTotalCompensatedMinutes(monthEntries),
    };
  }, [entries, selectedDate, filteredEntries, calculateTotalCompensatedMinutes]);


  const openNewEntryForm = useCallback(() => {
    setEditingEntry(null);
    setIsFormOpen(true);
  }, []);


  return (
    <TooltipProvider>
      <div className="flex min-h-screen w-full flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
          <div className="flex items-center gap-2">
            <TimeWiseIcon className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold tracking-tight font-headline">{t('login.title')}</h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
              <Button asChild variant="outline">
                <Link href="/export">
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  {t('tracker.headerExportLink')}
                </Link>
              </Button>
              {(process.env.NEXT_PUBLIC_ENVIRONMENT === "development" || process.env.NEXT_PUBLIC_ENVIRONMENT === "test") && (
                <AlertDialog>
                  <Tooltip>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="icon">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">{t('tracker.headerClearDataTooltip')}</span>
                      </Button>
                    </AlertDialogTrigger>
                    <TooltipContent>
                      <p>{t('tracker.headerClearDataTooltip')}</p>
                    </TooltipContent>
                  </Tooltip>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('tracker.clearDataAlertTitle')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('tracker.clearDataAlertDescription')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('tracker.clearDataAlertCancel')}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleClearData}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        {t('tracker.clearDataAlertConfirm')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild variant="ghost" size="icon">
                      <Link href="/settings">
                          <Cog className="h-4 w-4" />
                          <span className="sr-only">{t('tracker.headerSettingsTooltip')}</span>
                      </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('tracker.headerSettingsTooltip')}</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4" />
                    <span className="sr-only">{t('tracker.headerSignOutTooltip')}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('tracker.headerSignOutTooltip')}</p>
                </TooltipContent>
              </Tooltip>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="mx-auto grid max-w-6xl gap-8">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>{t('tracker.liveTrackingTitle')}</CardTitle>
                <CardDescription>
                  {t('tracker.liveTrackingDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {runningTimer ? (
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between rounded-lg bg-muted p-4">
                      <div>
                        <p className="font-medium">{t('tracker.runningTimerLocation', { location: runningTimer.location })}</p>
                      </div>
                      <p className="text-2xl font-bold font-mono tabular-nums tracking-wider text-primary">
                        {formatDuration(elapsedTime)}
                      </p>
                    </div>
                    <div className="flex">
                      <Button onClick={handleStopTimer} className="w-full bg-destructive hover:bg-destructive/90 transition-all duration-300">
                        <Pause className="mr-2 h-4 w-4" />
                        {t('tracker.stopButton')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    <div className="flex w-full items-center gap-2">
                      <Input
                        placeholder={t('tracker.locationPlaceholder')}
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="flex-1"
                      />
                      <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" onClick={handleGetCurrentLocation} aria-label={t('tracker.getLocationTooltip')} disabled={isFetchingLocation}>
                              {isFetchingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t('tracker.getLocationTooltip')}</p>
                          </TooltipContent>
                        </Tooltip>
                    </div>
                    <Button onClick={handleStartTimer} size="lg" className="w-full transition-all duration-300">
                      <Play className="mr-2 h-4 w-4" />
                      {t('tracker.startButton')}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-lg" data-testid="daily-actions-card">
              <CardHeader>
                  <CardTitle>{t('tracker.dailyActionsTitle')}</CardTitle>
                  <CardDescription>
                      {selectedDate ? t('tracker.dailyActionsDescription', { date: format(selectedDate, "PPP") }) : "Loading..."}
                  </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button onClick={() => handleAddSpecialEntry("SICK_LEAVE")} variant="outline">
                      <BedDouble className="mr-2 h-4 w-4" /> {t('special_locations.SICK_LEAVE')}
                  </Button>
                  <Button onClick={() => handleAddSpecialEntry("PTO")} variant="outline">
                      <Plane className="mr-2 h-4 w-4" /> {t('special_locations.PTO')}
                  </Button>
                  <Button onClick={() => handleAddSpecialEntry("BANK_HOLIDAY")} variant="outline">
                      <Landmark className="mr-2 h-4 w-4" /> {t('special_locations.BANK_HOLIDAY')}
                  </Button>
                  <Button onClick={() => handleAddSpecialEntry("TIME_OFF_IN_LIEU")} variant="outline">
                      <Hourglass className="mr-2 h-4 w-4" /> {t('special_locations.TIME_OFF_IN_LIEU')}
                  </Button>
              </CardContent>
            </Card>

            <div data-testid="time-entries-card">
              <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold font-headline">{t('tracker.timeEntriesTitle')}</h2>
                <div className="flex w-full items-center gap-2 sm:w-auto">
                  <div className="flex flex-1 items-center gap-1">
                    <Button variant="outline" size="icon" onClick={handlePreviousDay} aria-label="Previous day">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start text-left font-normal"
                          data-selected-date={selectedDate ? selectedDate.toISOString().slice(0,10) : undefined}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, "PPP") : "Loading..."}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => date && setSelectedDate(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <Button variant="outline" size="icon" onClick={handleNextDay} aria-label="Next day">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <SheetTrigger asChild>
                      <Button onClick={openNewEntryForm}>
                        <Plus className="mr-2 h-4 w-4" /> {t('tracker.addEntryButton')}
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="w-full max-w-none sm:max-w-md flex flex-col">
                      {selectedDate && <TimeEntryForm
                        entry={editingEntry}
                        onSave={handleSaveEntry}
                        selectedDate={selectedDate}
                        onClose={() => setIsFormOpen(false)}
                        userSettings={userSettings}
                      />}
                    </SheetContent>
                  </Sheet>
                </div>
              </div>
              
              <Card className="shadow-lg">
                  <CardHeader>
                      <div className="flex justify-between items-center">
                          <CardTitle>
                              {selectedDate && isSameDay(selectedDate, new Date())
                              ? t('tracker.todaysEntries')
                              : selectedDate ? t('tracker.entriesForDate', { date: format(selectedDate, "PPP") }) : "Loading..."}
                          </CardTitle>
                          <div className="text-lg font-bold text-primary">{formatHoursAndMinutes(dailyTotal)}</div>
                      </div>
                  </CardHeader>
                  <CardContent>
                      {isLoading ? (
                        <div className="space-y-4">
                          <Skeleton className="h-24 w-full" />
                          <Skeleton className="h-24 w-full" />
                        </div>
                      ) : filteredEntries.length > 0 ? (
                      <div className="space-y-4">
                          {filteredEntries.map((entry) => (
                          <TimeEntryCard
                              key={entry.id}
                              entry={entry}
                              onEdit={handleEditEntry}
                              onDelete={handleDeleteEntry}
                          />
                          ))}
                      </div>
                      ) : (
                      <div className="text-center py-12">
                          <p className="text-muted-foreground">{t('tracker.noEntries')}</p>
                          <Button variant="link" onClick={openNewEntryForm} className="mt-2">{t('tracker.addFirstEntryLink')}</Button>
                      </div>
                      )}
                  </CardContent>
              </Card>
            </div>
            
            <Card className="shadow-lg" data-testid="summary-card">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <BarChart className="h-5 w-5 text-primary" />
                        <CardTitle>{t('tracker.summaryTitle')}</CardTitle>
                    </div>
                    <CardDescription>
                        {t('tracker.summaryDescription')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{t('tracker.summaryDay')}</p>
                            <p className="text-2xl font-bold">{formatHoursAndMinutes(dailyTotal)}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{t('tracker.summaryWeek')}</p>
                            <p className="text-2xl font-bold">{formatHoursAndMinutes(weeklyTotal)}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{t('tracker.summaryMonth')}</p>
                            <p className="text-2xl font-bold">{formatHoursAndMinutes(monthlyTotal)}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
