
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format, set, parse, addMinutes, differenceInMinutes } from "date-fns";
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
import { Calendar as CalendarIcon, Save, Lightbulb, AlertTriangle, MapPin, Loader2 } from "lucide-react";
import { cn, timeStringToMinutes, formatHoursAndMinutes, formatMinutesToTimeInput } from "@/lib/utils";
import type { TimeEntry, UserSettings } from "@/lib/types";
import { Separator } from "./ui/separator";
import { useMemo, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { reverseGeocode } from "@/ai/flows/reverse-geocode-flow";

const SPECIAL_LOCATIONS = ["Sick Leave", "PTO", "Bank Holiday", "Time Off in Lieu"];

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
  onSave: (data: Omit<TimeEntry, 'userId'>) => void;
  onClose: () => void;
  userSettings: UserSettings | null;
}

export default function TimeEntryForm({ entry, selectedDate, onSave, onClose, userSettings }: TimeEntryFormProps) {
  const { toast } = useToast();
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  const defaultStartTime = userSettings?.defaultStartTime || "09:00";
  const defaultEndTime = userSettings?.defaultEndTime || "17:00";
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      location: entry?.location || "",
      date: entry?.startTime || selectedDate,
      startTime: entry ? format(entry.startTime, "HH:mm") : defaultStartTime,
      endTime: entry?.endTime ? format(entry.endTime, "HH:mm") : defaultEndTime,
      pauseDuration: formatMinutesToTimeInput(entry?.pauseDuration),
      travelTime: entry?.travelTime || 0,
      isDriver: entry?.isDriver || false,
    },
  });

  const { watch, setValue, getValues } = form;
  const startTimeValue = watch("startTime");
  const endTimeValue = watch("endTime");
  const pauseDurationValue = watch("pauseDuration");
  const travelTimeValue = watch("travelTime");
  const locationValue = watch("location");

  const isSpecialEntry = useMemo(() => {
    return SPECIAL_LOCATIONS.includes(getValues("location"));
  }, [locationValue, getValues]);

  const pauseSuggestion = useMemo(() => {
    if (isSpecialEntry) return null;
    try {
      const start = parse(startTimeValue, "HH:mm", new Date());
      const end = parse(endTimeValue, "HH:mm", new Date());
      if (end <= start) return null;

      const workDurationInMinutes = differenceInMinutes(end, start);
      const travelTimeInMinutes = (travelTimeValue || 0) * 60;
      const totalActivityInMinutes = workDurationInMinutes + travelTimeInMinutes;

      if (totalActivityInMinutes >= 9 * 60) {
        return { minutes: 45, timeString: '00:45', reason: '9 hours' };
      }
      if (totalActivityInMinutes >= 6 * 60) {
        return { minutes: 30, timeString: '00:30', reason: '6 hours' };
      }
      return null;
    } catch (e) {
      return null;
    }
  }, [startTimeValue, endTimeValue, travelTimeValue, isSpecialEntry]);

  const { workDurationInMinutes, totalCompensatedMinutes } = useMemo(() => {
    try {
        const start = parse(startTimeValue, "HH:mm", new Date());
        const end = parse(endTimeValue, "HH:mm", new Date());
        if (end <= start) return { workDurationInMinutes: 0, totalCompensatedMinutes: 0 };

        const workDuration = differenceInMinutes(end, start);
        
        if (isSpecialEntry) {
            return {
                workDurationInMinutes: workDuration,
                totalCompensatedMinutes: workDuration,
            };
        }

        const pauseInMinutes = timeStringToMinutes(pauseDurationValue);
        const travelInMinutes = (travelTimeValue || 0) * 60;
        const total = workDuration - pauseInMinutes + travelInMinutes;

        return {
            workDurationInMinutes: workDuration,
            totalCompensatedMinutes: total > 0 ? total : 0
        };
    } catch (e) {
        return { workDurationInMinutes: 0, totalCompensatedMinutes: 0 };
    }
  }, [startTimeValue, endTimeValue, pauseDurationValue, travelTimeValue, isSpecialEntry]);

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
            form.setValue('location', result.address, { shouldValidate: true });
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
            form.setValue('location', `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`, { shouldValidate: true });
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


  function onSubmit(values: z.infer<typeof formSchema>) {
    const [startHours, startMinutes] = values.startTime.split(":").map(Number);
    const [endHours, endMinutes] = values.endTime.split(":").map(Number);

    const startTime = set(values.date, { hours: startHours, minutes: startMinutes, seconds: 0, milliseconds: 0 });
    const endTime = set(values.date, { hours: endHours, minutes: endMinutes, seconds: 0, milliseconds: 0 });
    
    const finalIsSpecial = SPECIAL_LOCATIONS.includes(values.location);

    const finalEntry: Omit<TimeEntry, 'userId'> = {
      id: entry?.id || Date.now().toString(),
      location: values.location,
      startTime,
      endTime,
      pauseDuration: finalIsSpecial ? 0 : timeStringToMinutes(values.pauseDuration),
      travelTime: finalIsSpecial ? 0 : values.travelTime,
      isDriver: finalIsSpecial ? false : values.isDriver,
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
        <TooltipProvider>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <div className="relative flex items-center">
                        <FormControl>
                            <Input placeholder="e.g., Office, Home" {...field} disabled={isSpecialEntry} className="pr-10" />
                        </FormControl>
                        {!isSpecialEntry && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" type="button" onClick={handleGetCurrentLocation} aria-label="Get current location" disabled={isFetchingLocation} className="absolute right-0 mr-1 h-8 w-8">
                                    {isFetchingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                                </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Get current location</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </div>
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
              
              {!isSpecialEntry && (
                <>
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
                            <FormMessage />
                            <div className="h-6 flex items-center">
                              {pauseSuggestion && (
                                  <Tooltip>
                                      <TooltipTrigger asChild>
                                      <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          className="h-auto p-1 text-primary hover:bg-primary/10"
                                          onClick={() => setValue('pauseDuration', pauseSuggestion.timeString, { shouldValidate: true })}
                                      >
                                          <Lightbulb className="mr-1 h-4 w-4" />
                                          Suggest: {pauseSuggestion.minutes} min
                                      </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                      <p>Activity over {pauseSuggestion.reason}. Recommended pause: {pauseSuggestion.minutes} mins.</p>
                                      </TooltipContent>
                                  </Tooltip>
                              )}
                            </div>
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
                  </div>
                  <FormField
                    control={form.control}
                    name="isDriver"
                    render={({ field }) => (
                      <FormItem className="col-span-2 flex flex-row items-end space-x-3 rounded-md border p-3">
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
                </>
              )}

              <div className="space-y-4 pt-4">
                  <Separator />
                  <div className="flex justify-between items-center font-medium">
                      <span className="text-muted-foreground">Total Compensated Time:</span>
                      <span className="text-lg text-primary">{formatHoursAndMinutes(totalCompensatedMinutes)}</span>
                  </div>
                  {workDurationInMinutes > 10 * 60 && !isSpecialEntry && (
                      <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>Warning: Exceeds 10 Hours</AlertTitle>
                          <AlertDescription>
                              The work duration exceeds the legal maximum of 10 hours per day.
                          </AlertDescription>
                      </Alert>
                  )}
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
        </TooltipProvider>
      </div>
    </>
  );
}
