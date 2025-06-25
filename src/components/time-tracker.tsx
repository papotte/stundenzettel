"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { format, isSameDay, startOfDay, addMinutes, subDays } from "date-fns";
import {
  Clock,
  Play,
  Pause,
  Plus,
  Calendar as CalendarIcon,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { formatDuration } from "@/lib/utils";

const mockEntries: TimeEntry[] = [
  {
    id: "1",
    startTime: addMinutes(startOfDay(new Date()), 540), // 9:00 AM
    endTime: addMinutes(startOfDay(new Date()), 600), // 10:00 AM
    location: "Office",
    pauseDuration: 0,
    travelTime: 0,
  },
  {
    id: "2",
    startTime: addMinutes(startOfDay(new Date()), 660), // 11:00 AM
    endTime: addMinutes(startOfDay(new Date()), 750), // 12:30 PM
    location: "Home Office",
    pauseDuration: 30,
    travelTime: 0.5,
    isDriver: true,
  },
   {
    id: "3",
    startTime: addMinutes(startOfDay(subDays(new Date(), 1)), 600), // Yesterday 10:00 AM
    endTime: addMinutes(startOfDay(subDays(new Date(), 1)), 840), // Yesterday 2:00 PM
    location: "Client Site",
    pauseDuration: 60,
    travelTime: 1,
    isDriver: true,
    kilometers: 50
  },
];


export default function TimeTracker() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [runningTimer, setRunningTimer] = useState<TimeEntry | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [location, setLocation] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const storedEntries = localStorage.getItem("timeEntries");
    if (storedEntries && storedEntries.length > 2) { // check for more than just '[]'
      setEntries(JSON.parse(storedEntries, (key, value) => 
        (key === 'startTime' || key === 'endTime') ? new Date(value) : value
      ));
    } else {
      setEntries(mockEntries);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("timeEntries", JSON.stringify(entries));
  }, [entries]);

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
        pauseDuration: 0,
        travelTime: 0,
        isDriver: false,
        kilometers: 0,
      };
      setEntries([finishedEntry, ...entries]);
      setRunningTimer(null);
      setLocation("");
      setElapsedTime(0);
      toast({
        title: "Timer stopped!",
        description: `Logged ${formatDuration(elapsedTime)} for ${finishedEntry.location}.`,
        className: "bg-accent text-accent-foreground",
      });
    }
  };

  const handleSaveEntry = (entryData: TimeEntry) => {
    if (entryData.id && entries.some(e => e.id === entryData.id)) {
      setEntries(entries.map((e) => (e.id === entryData.id ? entryData : e)));
      toast({ title: "Entry Updated", description: `Changes to "${entryData.location}" have been saved.`});
    } else {
      setEntries([entryData, ...entries]);
      toast({ title: "Entry Added", description: `New entry for "${entryData.location}" created.`});
    }
    setIsFormOpen(false);
    setEditingEntry(null);
  };

  const handleEditEntry = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setIsFormOpen(true);
  };

  const handleDeleteEntry = (id: string) => {
    setEntries(entries.filter((entry) => entry.id !== id));
    toast({ title: "Entry Deleted", variant: 'destructive'});
  };

  const filteredEntries = useMemo(() =>
    entries.filter((entry) => isSameDay(entry.startTime, selectedDate)),
    [entries, selectedDate]
  );
  
  const totalDayDuration = useMemo(() =>
    filteredEntries.reduce((total, entry) => {
      if (entry.endTime) {
        return total + (entry.endTime.getTime() - entry.startTime.getTime());
      }
      return total;
    }, 0) / 1000,
    [filteredEntries]
  );

  const openNewEntryForm = useCallback(() => {
    setEditingEntry(null);
    setIsFormOpen(true);
  }, []);


  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Clock className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold tracking-tight">TimeWise Tracker</h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/export">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Preview & Export
              </Link>
            </Button>
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
                    <Input
                      placeholder="Where are you working from?"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="flex-1"
                    />
                  <Button onClick={handleStartTimer} size="lg" className="w-full transition-all duration-300 bg-accent hover:bg-accent/90">
                    <Play className="mr-2 h-4 w-4" />
                    Start Tracking
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div>
            <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h2 className="text-2xl font-bold">Time Entries</h2>
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-[240px] justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(selectedDate, "PPP")}
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
                  <SheetContent className="w-full max-w-none sm:max-w-md">
                    <TimeEntryForm
                      entry={editingEntry}
                      onSave={handleSaveEntry}
                      selectedDate={selectedDate}
                      onClose={() => setIsFormOpen(false)}
                    />
                  </SheetContent>
                </Sheet>
              </div>
            </div>
            
            <Card className="shadow-lg">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>
                            {isSameDay(selectedDate, new Date())
                            ? "Today's Entries"
                            : `Entries for ${format(selectedDate, "PPP")}`}
                        </CardTitle>
                        <div className="text-lg font-bold text-primary">{formatDuration(totalDayDuration)}</div>
                    </div>
                </CardHeader>
                <CardContent>
                    {filteredEntries.length > 0 ? (
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
        </div>
      </main>
    </div>
  );
}
