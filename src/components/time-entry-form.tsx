"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format, set, parse, addMinutes } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Calendar } from "./ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarIcon, Save } from "lucide-react";
import { cn, timeStringToMinutes } from "@/lib/utils";
import type { TimeEntry } from "@/lib/types";
import { Separator } from "./ui/separator";

const formSchema = z.object({
  location: z.string().min(2, {
    message: "Location must be at least 2 characters.",
  }),
  date: z.date(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)"),
  pauseDuration: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)").optional(),
  travelTime: z.coerce.number().min(0, "Must be positive").optional(),
  isDriver: z.boolean().optional(),
}).refine(data => {
    try {
      const start = parse(data.startTime, "HH:mm", new Date());
      const end = parse(data.endTime, "HH:mm", new Date());
      return end > start;
    } catch {
      return false;
    }
}, {
    message: "End time must be after start time",
    path: ["endTime"],
});

interface TimeEntryFormProps {
  entry: TimeEntry | null;
  selectedDate: Date;
  onSave: (data: TimeEntry) => void;
  onClose: () => void;
}

export default function TimeEntryForm({ entry, selectedDate, onSave, onClose }: TimeEntryFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      location: entry?.location || "",
      date: entry?.startTime || selectedDate,
      startTime: entry ? format(entry.startTime, "HH:mm") : "09:00",
      endTime: entry?.endTime ? format(entry.endTime, "HH:mm") : "10:00",
      pauseDuration: entry?.pauseDuration ? format(addMinutes(new Date(0), entry.pauseDuration), "HH:mm") : "00:00",
      travelTime: entry?.travelTime || 0,
      isDriver: entry?.isDriver || false,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const [startHours, startMinutes] = values.startTime.split(":").map(Number);
    const [endHours, endMinutes] = values.endTime.split(":").map(Number);

    const startTime = set(values.date, { hours: startHours, minutes: startMinutes, seconds: 0, milliseconds: 0 });
    const endTime = set(values.date, { hours: endHours, minutes: endMinutes, seconds: 0, milliseconds: 0 });

    const finalEntry: TimeEntry = {
      id: entry?.id || Date.now().toString(),
      location: values.location,
      startTime,
      endTime,
      pauseDuration: timeStringToMinutes(values.pauseDuration),
      travelTime: values.travelTime,
      isDriver: values.isDriver,
    };
    onSave(finalEntry);
  }

  return (
    <>
      <SheetHeader className="px-6 pt-6">
        <SheetTitle>{entry ? "Edit" : "Add"} Time Entry</SheetTitle>
        <SheetDescription>
          {entry ? "Update the details of your time entry." : "Manually add a new time entry for your records."}
        </SheetDescription>
      </SheetHeader>
      <div className="flex-1 overflow-y-auto p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Office, Home" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Start time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>End time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Separator />

            <p className="text-sm font-medium text-muted-foreground">Optional Details</p>

            <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="pauseDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pause</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormDescription>
                        Auto-calculated on save if needed.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="travelTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Travel Time (hours)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.25" placeholder="e.g. 1.5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="isDriver"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-end space-x-3 rounded-md border p-3">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Driver
                        </FormLabel>
                         <FormDescription>
                          Were you the designated driver?
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
            </div>


            <SheetFooter className="pt-6">
                <SheetClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                </SheetClose>
                <Button type="submit">
                    <Save className="mr-2 h-4 w-4" />
                    Save Entry
                </Button>
            </SheetFooter>
          </form>
        </Form>
      </div>
    </>
  );
}
