
"use client";

import React from "react";
import { format, differenceInMinutes } from "date-fns";
import { Edit, Trash2, Clock, CarFront, Timer, BedDouble, Plane, Landmark, Hourglass, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import type { TimeEntry } from "@/lib/types";
import { formatDuration } from "@/lib/utils";

interface TimeEntryCardProps {
  entry: TimeEntry;
  onEdit: (entry: TimeEntry) => void;
  onDelete: (id: string) => void;
}

const SpecialIcons: { [key: string]: React.ElementType } = {
  "Sick Leave": BedDouble,
  "PTO": Plane,
  "Bank Holiday": Landmark,
  "Time Off in Lieu": Hourglass,
};

export default function TimeEntryCard({ entry, onEdit, onDelete }: TimeEntryCardProps) {
  const SpecialIcon = SpecialIcons[entry.location];

  const calculateCompensatedSeconds = () => {
    if (!entry.endTime) {
      // Handle running timer case
      const runningSeconds = (new Date().getTime() - entry.startTime.getTime()) / 1000;
      return runningSeconds;
    };
    
    const workDurationInMinutes = differenceInMinutes(entry.endTime, entry.startTime);

    if (SpecialIcon || entry.location === "Time Off in Lieu") {
      // For special entries, the duration is just the time between start and end.
      return workDurationInMinutes * 60;
    }

    const pauseInMinutes = entry.pauseDuration || 0;
    const travelInMinutes = (entry.travelTime || 0) * 60;
    const totalCompensatedMinutes = workDurationInMinutes - pauseInMinutes + travelInMinutes;
    
    return totalCompensatedMinutes > 0 ? totalCompensatedMinutes * 60 : 0;
  };
  
  const totalCompensatedSeconds = calculateCompensatedSeconds();

  if (SpecialIcon) {
    return (
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <SpecialIcon className="h-5 w-5 text-primary" />
              <p className="font-semibold">{entry.location}</p>
            </div>
            <div className="flex items-center gap-2">
              <p className="font-mono text-lg font-medium text-primary tabular-nums">
                {totalCompensatedSeconds > 0 ? formatDuration(totalCompensatedSeconds) : "—"}
              </p>
              <Button variant="ghost" size="icon" onClick={() => onEdit(entry)}>
                <Edit className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the time entry for "{entry.location}".
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(entry.id)}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="grid gap-1 flex-1">
            <p className="font-semibold">{entry.location}</p>
            <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Clock className="mr-1.5 h-3.5 w-3.5" />
                <span>
                  {format(entry.startTime, "p")} - {entry.endTime ? format(entry.endTime, "p") : "Now"}
                </span>
              </div>
              {entry.pauseDuration && entry.pauseDuration > 0 ? (
                <div className="flex items-center">
                  <Coffee className="mr-1.5 h-3.5 w-3.5" />
                  <span>{entry.pauseDuration}m pause</span>
                </div>
              ) : null}
              {entry.travelTime && entry.travelTime > 0 ? (
                <div className="flex items-center">
                  <Timer className="mr-1.5 h-3.5 w-3.5" />
                  <span>{entry.travelTime}h travel</span>
                </div>
              ) : null}
              {entry.isDriver ? (
                <div className="flex items-center">
                  <CarFront className="mr-1.5 h-3.5 w-3.5" />
                  <span>Driver</span>
                </div>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <p className="font-mono text-lg font-medium text-primary tabular-nums">
              {formatDuration(totalCompensatedSeconds)}
            </p>
            <Button variant="ghost" size="icon" onClick={() => onEdit(entry)}>
              <Edit className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the time entry for "{entry.location}".
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(entry.id)}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
