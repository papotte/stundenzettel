
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { format, isSameDay, set, addHours, differenceInMinutes, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import {
  Clock,
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
import type { TimeEntry } from "@/lib/types";
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


export default function TimeTracker() {
  const { user, signOut } = useAuth();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [runningTimer, setRunningTimer] = useState<TimeEntry | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [location, setLocation] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setSelectedDate(new Date());
    if (!user) return;

    const fetchEntries = async () => {
      setIsLoading(true);
      try {
        const fetchedEntries = await getTimeEntries(user.uid);
        setEntries(fetchedEntries);
      } catch (error) {
        console.error("Error fetching time entries:", error);
        toast({
          title: "Failed to load data",
          description: "Could not retrieve time entries from the database. Please check your Firebase configuration in the .env file.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchEntries();
  }, [user, toast]);

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
        title: "Location required",
        description: "Please enter a location to start tracking.",
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
    
    // We create the final entry object directly from the form data.
    // No automatic calculations are performed on the pause duration.
    let entryWithUser = { ...entryData, userId: user.uid };
    
    // The only exception is for special non-work entries, where pause is irrelevant.
    const isNonWorkEntry = ["Sick Leave", "PTO", "Bank Holiday", "Time Off in Lieu"].includes(entryData.location);
    if (isNonWorkEntry) {
      entryWithUser.pauseDuration = 0;
    }
    
    setIsFormOpen(false);
    setEditingEntry(null);

    try {
      const existingEntry = entries.find(e => e.id === entryWithUser.id);
      if (existingEntry) {
        await updateTimeEntry(entryWithUser.id, entryWithUser);
        setEntries(entries.map((e) => (e.id === entryWithUser.id ? entryWithUser : e)));
        toast({ title: "Entry Updated", description: `Changes to "${entryWithUser.location}" have been saved.`});
      } else {
        const newId = await addTimeEntry(entryWithUser);
        const newEntry = {...entryWithUser, id: newId};
        setEntries(prev => [newEntry, ...prev].sort((a, b) => b.startTime.getTime() - a.startTime.getTime()));
        toast({ title: "Entry Added", description: `New entry for "${entryWithUser.location}" created.`});
      }
    } catch (error) {
      console.error("Error saving entry:", error);
      toast({ title: "Save Failed", description: "There was a problem saving your entry.", variant: "destructive" });
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
      toast({ title: "Entry Deleted", variant: 'destructive'});
    } catch (error) {
      console.error("Error deleting entry:", error);
      toast({ title: "Delete Failed", description: "There was a problem deleting your entry.", variant: "destructive" });
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
        title: "Data Cleared",
        description: "All your time entries have been removed from the database.",
      });
    } catch (error) {
      console.error("Error clearing data:", error);
      toast({ title: "Clear Failed", description: "There was a problem clearing your data.", variant: "destructive" });
    }
  };

  const handleAddSpecialEntry = async (location: string, hours: number) => {
    if (!selectedDate || !user) return;

    const startTime = set(selectedDate, { hours: 9, minutes: 0, seconds: 0, milliseconds: 0 });
    const endTime = hours > 0 ? addHours(startTime, hours) : startTime;

    const newEntry: Omit<TimeEntry, 'id' | 'userId'> = {
      location: location,
      startTime: startTime,
      endTime: endTime,
      pauseDuration: 0,
      travelTime: 0,
      isDriver: false,
    };

    const entryExists = entries.some(e => isSameDay(e.startTime, selectedDate) && e.location === location);
    if (entryExists) {
      toast({
        title: "Entry already exists",
        description: `An entry for "${location}" on this day already exists.`,
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
        title: "Entry Added",
        description: `New entry for "${location}" created.`,
        className: "bg-accent text-accent-foreground",
      });
    } catch (error) {
      console.error("Error adding special entry:", error);
      toast({ title: "Save Failed", description: "There was a problem saving the special entry.", variant: "destructive" });
    }
  };

  const handleGetCurrentLocation = async () => {
    if (isFetchingLocation) return;
    if (navigator.geolocation) {
      setIsFetchingLocation(true);
      toast({
        title: "Fetching location...",
        description: "Please wait while we get your address.",
      });
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const result = await reverseGeocode({ latitude, longitude });
            setLocation(result.address);
            toast({
              title: "Location fetched!",
              description: `Your location has been set to "${result.address}".`,
              className: "bg-accent text-accent-foreground",
            });
          } catch (error) {
            console.error("Error getting address", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
            toast({
              title: "Could not get address",
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
            title: "Could not get your coordinates",
            description: "Please ensure location services are enabled and permission is granted in your browser.",
            variant: "destructive",
          });
          setIsFetchingLocation(false);
        }
      );
    } else {
      toast({
        title: "Geolocation not supported",
        description: "Your browser does not support geolocation.",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    // The auth context and page guard will handle redirection
  };

  const filteredEntries = useMemo(() =>
    selectedDate ? entries.filter((entry) => isSameDay(entry.startTime, selectedDate)) : [],
    [entries, selectedDate]
  );
  
  const calculateTotalCompensatedMinutes = useCallback((entriesToSum: TimeEntry[]): number => {
    return entriesToSum.reduce((total, entry) => {
        if (!entry.endTime) return total;

        const workMinutes = differenceInMinutes(entry.endTime, entry.startTime);
        
        const isNonWorkEntry = ["Sick Leave", "PTO", "Bank Holiday"].includes(entry.location);
        if (isNonWorkEntry) {
            return total + workMinutes;
        }
        
        if (entry.location === "Time Off in Lieu") {
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
            <Clock className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold tracking-tight font-headline">TimeWise Tracker</h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
              <Button asChild variant="outline">
                <Link href="/export">
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Preview & Export
                </Link>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Tooltip>
                      <TooltipTrigger asChild>
                          <Button variant="destructive" size="icon">
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Clear All Data</span>
                          </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                          <p>Clear all data</p>
                      </TooltipContent>
                  </Tooltip>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete all
                      your time tracking data from the database.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleClearData}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Yes, delete everything
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4" />
                    <span className="sr-only">Sign Out</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Sign Out</p>
                </TooltipContent>
              </Tooltip>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="mx-auto grid max-w-6xl gap-8">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Live Time Tracking</CardTitle>
                <CardDescription>
                  Start the timer to track your work as it happens.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {runningTimer ? (
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between rounded-lg bg-muted p-4">
                      <div>
                        <p className="font-medium">{runningTimer.location}</p>
                      </div>
                      <p className="text-2xl font-bold font-mono tabular-nums tracking-wider text-primary">
                        {formatDuration(elapsedTime)}
                      </p>
                    </div>
                    <div className="flex">
                      <Button onClick={handleStopTimer} className="w-full bg-destructive hover:bg-destructive/90 transition-all duration-300">
                        <Pause className="mr-2 h-4 w-4" />
                        Stop
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    <div className="flex w-full items-center gap-2">
                      <Input
                        placeholder="Where are you working from?"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="flex-1"
                      />
                      <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" onClick={handleGetCurrentLocation} aria-label="Get current location" disabled={isFetchingLocation}>
                              {isFetchingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Get current location</p>
                          </TooltipContent>
                        </Tooltip>
                    </div>
                    <Button onClick={handleStartTimer} size="lg" className="w-full transition-all duration-300">
                      <Play className="mr-2 h-4 w-4" />
                      Start Tracking
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                  <CardTitle>Daily Actions</CardTitle>
                  <CardDescription>
                      Quickly add entries for the selected day: {selectedDate ? format(selectedDate, "PPP") : "Loading..."}
                  </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button onClick={() => handleAddSpecialEntry("Sick Leave", 7)} variant="outline">
                      <BedDouble className="mr-2 h-4 w-4" /> Sick Leave
                  </Button>
                  <Button onClick={() => handleAddSpecialEntry("PTO", 7)} variant="outline">
                      <Plane className="mr-2 h-4 w-4" /> PTO
                  </Button>
                  <Button onClick={() => handleAddSpecialEntry("Bank Holiday", 7)} variant="outline">
                      <Landmark className="mr-2 h-4 w-4" /> Bank Holiday
                  </Button>
                  <Button onClick={() => handleAddSpecialEntry("Time Off in Lieu", 0)} variant="outline">
                      <Hourglass className="mr-2 h-4 w-4" /> Time Off in Lieu
                  </Button>
              </CardContent>
            </Card>

            <div>
              <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold font-headline">Time Entries</h2>
                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full sm:w-[240px] justify-start text-left font-normal">
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
                  <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <SheetTrigger asChild>
                      <Button onClick={openNewEntryForm}>
                        <Plus className="mr-2 h-4 w-4" /> Add Entry
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="w-full max-w-none sm:max-w-md flex flex-col">
                      {selectedDate && <TimeEntryForm
                        entry={editingEntry}
                        onSave={handleSaveEntry}
                        selectedDate={selectedDate}
                        onClose={() => setIsFormOpen(false)}
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
                              ? "Today's Entries"
                              : selectedDate ? `Entries for ${format(selectedDate, "PPP")}` : "Loading..."}
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
                          <p className="text-muted-foreground">No entries for this day.</p>
                          <Button variant="link" onClick={openNewEntryForm} className="mt-2">Add your first entry</Button>
                      </div>
                      )}
                  </CardContent>
              </Card>
            </div>
            
            <Card className="shadow-lg">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <BarChart className="h-5 w-5 text-primary" />
                        <CardTitle>Hours Summary</CardTitle>
                    </div>
                    <CardDescription>
                        Total compensated hours for periods related to the selected date.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Selected Day</p>
                            <p className="text-2xl font-bold">{formatHoursAndMinutes(dailyTotal)}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">This Week</p>
                            <p className="text-2xl font-bold">{formatHoursAndMinutes(weeklyTotal)}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">This Month</p>
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
