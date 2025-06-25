"use client";

import React from "react";
import { format } from "date-fns";
import { Edit, Trash2, Clock, MapPin } from "lucide-react";
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

export default function TimeEntryCard({ entry, onEdit, onDelete }: TimeEntryCardProps) {
  const durationInSeconds = entry.endTime
    ? (entry.endTime.getTime() - entry.startTime.getTime()) / 1000
    : 0;

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="grid gap-1 flex-1">
            <p className="font-semibold">{entry.project}</p>
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="mr-1.5 h-3.5 w-3.5" />
              <span>
                {format(entry.startTime, "p")} - {entry.endTime ? format(entry.endTime, "p") : "Now"}
              </span>
            </div>
            {entry.location && (
               <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="mr-1.5 h-3.5 w-3.5" />
                <span>{entry.location}</span>
               </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <p className="font-mono text-lg font-medium text-primary tabular-nums">
              {formatDuration(durationInSeconds)}
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
                    This action cannot be undone. This will permanently delete the time entry for "{entry.project}".
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
