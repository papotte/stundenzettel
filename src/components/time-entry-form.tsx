'use client'

import React, { useMemo, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'

import { differenceInMinutes, parse, set } from 'date-fns'
import {
  AlertTriangle,
  Calendar as CalendarIcon,
  Info,
  Lightbulb,
  Save,
} from 'lucide-react'
import { useFormatter, useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { reverseGeocode } from '@/ai/flows/reverse-geocode-flow'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useTimeTrackerContext } from '@/context/time-tracker-context'
import { useIsMobile } from '@/hooks/use-mobile'
import { useToast } from '@/hooks/use-toast'
import { SPECIAL_LOCATION_KEYS, SpecialLocationKey } from '@/lib/constants'
import {
  suggestDriverTimes,
  suggestEndTimes,
  suggestLocations,
  suggestPassengerTimes,
  suggestStartTimes,
} from '@/lib/time-entry-suggestions'
import { calculateTotalCompensatedMinutes } from '@/lib/time-utils'
import type { TimeEntry, UserSettings } from '@/lib/types'
import {
  cn,
  formatHoursAndMinutes,
  formatMinutesToTimeInput,
  getLocationDisplayName,
  timeStringToMinutes,
} from '@/lib/utils'

import { LocationInput } from './location-input'
import { Calendar } from './ui/calendar'
import { Separator } from './ui/separator'
import { Switch } from './ui/switch'

const formSchema = z
  .object({
    mode: z.enum(['interval', 'duration']),
    location: z.string().min(2, {
      message: 'Location must be at least 2 characters.',
    }),
    date: z.date(),
    startTime: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)')
      .optional(),
    endTime: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)')
      .optional(),
    duration: z.coerce
      .number()
      .min(15, 'Minimum 15 minutes')
      .max(1440, 'Maximum 24 hours')
      .multipleOf(15, 'Must be a multiple of 15')
      .optional(),
    pauseDuration: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)')
      .optional(),
    driverTimeHours: z.coerce.number().min(0, 'Must be positive').optional(),
    passengerTimeHours: z.coerce.number().min(0, 'Must be positive').optional(),
  })
  .refine(
    (data) => {
      if (data.mode === 'interval') {
        if (!data.startTime || !data.endTime) return false
        try {
          const start = parse(data.startTime, 'HH:mm', new Date())
          const end = parse(data.endTime, 'HH:mm', new Date())
          return end > start
        } catch {
          return false
        }
      } else if (data.mode === 'duration') {
        if (!data.duration || Number.isNaN(data.duration)) return false
        return (
          data.duration >= 15 &&
          data.duration <= 1440 &&
          data.duration % 15 === 0
        )
      }
      return false
    },
    {
      message: 'End time must be after start time',
      path: ['endTime'],
    },
  )

interface TimeEntryFormProps {
  entry: TimeEntry | null
  selectedDate: Date
  onSave: (data: Omit<TimeEntry, 'userId'>) => void
  onClose: () => void
  userSettings: UserSettings | null
}

export default function TimeEntryForm({
  entry,
  selectedDate,
  onSave,
  onClose,
  userSettings,
}: TimeEntryFormProps) {
  const { toast } = useToast()
  const t = useTranslations()
  const format = useFormatter().dateTime
  const [isFetchingLocation, setIsFetchingLocation] = useState(false)
  const isMobile = useIsMobile()
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const { entries } = useTimeTrackerContext()

  const defaultStartTime = userSettings?.defaultStartTime || '09:00'
  const defaultEndTime = userSettings?.defaultEndTime || '17:00'
  const isDurationEntry = !!entry?.durationMinutes
  const defaultMode = isDurationEntry ? 'duration' : 'interval'
  const defaultDuration =
    isDurationEntry && entry?.durationMinutes != null
      ? entry.durationMinutes
      : 15

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      mode: defaultMode,
      location: entry?.location || '',
      date: entry?.startTime ?? selectedDate ?? new Date(),
      startTime:
        !isDurationEntry && entry && entry.startTime
          ? format(entry.startTime, 'timeShort')
          : defaultStartTime,
      endTime:
        !isDurationEntry && entry?.endTime
          ? format(entry.endTime, 'timeShort')
          : defaultEndTime,
      duration: defaultDuration,
      pauseDuration: formatMinutesToTimeInput(entry?.pauseDuration ?? 0),
      driverTimeHours: entry?.driverTimeHours || 0,
      passengerTimeHours: entry?.passengerTimeHours || 0,
    },
  })

  const { watch, setValue, getValues } = form
  const modeValue = watch('mode')
  const startTimeValue = watch('startTime')
  const endTimeValue = watch('endTime')
  const pauseDurationValue = watch('pauseDuration')
  const locationValue = watch('location')
  const driverTimeHoursValue = watch('driverTimeHours')
  const passengerTimeHoursValue = watch('passengerTimeHours')

  const isSpecialEntry = useMemo(() => {
    return SPECIAL_LOCATION_KEYS.includes(
      getValues('location') as SpecialLocationKey,
    )
  }, [getValues])

  // Compute location suggestions as user types
  const locationSuggestions = useMemo(() => {
    const loc = locationValue || ''
    if (isSpecialEntry || !loc.trim()) return []
    return suggestLocations(entries, { filterText: loc, limit: 5 })
  }, [entries, locationValue, isSpecialEntry])

  // Smart suggestions for start, end, and travel time
  const currentStartTime = watch('startTime')
  const startTimeSuggestions = useMemo(() => {
    if (isSpecialEntry || !locationValue) return []
    return suggestStartTimes(entries, {
      location: locationValue,
      limit: 3,
    }).filter((s) => s !== currentStartTime)
  }, [entries, locationValue, isSpecialEntry, currentStartTime])
  const currentEndTime = watch('endTime')
  const endTimeSuggestions = useMemo(() => {
    if (isSpecialEntry || !locationValue) return []
    return suggestEndTimes(entries, {
      location: locationValue,
      limit: 3,
    }).filter((s) => s !== currentEndTime)
  }, [entries, locationValue, isSpecialEntry, currentEndTime])

  const driverTimeSuggestions = useMemo(() => {
    if (isSpecialEntry || !locationValue) return []
    return suggestDriverTimes(entries, {
      location: locationValue,
      limit: 3,
    })
  }, [entries, locationValue, isSpecialEntry])

  const passengerTimeSuggestions = useMemo(() => {
    if (isSpecialEntry || !locationValue) return []
    return suggestPassengerTimes(entries, {
      location: locationValue,
      limit: 3,
    })
  }, [entries, locationValue, isSpecialEntry])

  const pauseSuggestion = useMemo(() => {
    if (isSpecialEntry) return null
    try {
      const start = parse(startTimeValue || '00:00', 'HH:mm', new Date())
      const end = parse(endTimeValue || '00:00', 'HH:mm', new Date())
      if (end <= start) return null

      const workDurationInMinutes = differenceInMinutes(end, start)
      const driver = Number(driverTimeHoursValue) || 0
      const passenger = Number(passengerTimeHoursValue) || 0
      const totalActivityInMinutes =
        workDurationInMinutes + (driver + passenger) * 60

      if (totalActivityInMinutes > 9 * 60) {
        return { minutes: 45, timeString: '00:45', reason: '9 hours' }
      }
      if (totalActivityInMinutes > 6 * 60) {
        return { minutes: 30, timeString: '00:30', reason: '6 hours' }
      }
      return null
    } catch {
      return null
    }
  }, [
    startTimeValue,
    endTimeValue,
    isSpecialEntry,
    driverTimeHoursValue,
    passengerTimeHoursValue,
  ])

  const { workDurationInMinutes, compensatedMinutes } = useMemo(() => {
    try {
      // Build a temporary TimeEntry object from form values
      const tempEntry: TimeEntry = {
        id: 'temp',
        userId: 'temp',
        location: locationValue,
        startTime:
          modeValue === 'interval' && startTimeValue
            ? parse(startTimeValue, 'HH:mm', new Date(getValues('date')))
            : set(getValues('date') || new Date(), {
                hours: 12,
                minutes: 0,
                seconds: 0,
                milliseconds: 0,
              }),
        endTime:
          modeValue === 'interval' && endTimeValue
            ? parse(endTimeValue, 'HH:mm', new Date(getValues('date')))
            : undefined,
        durationMinutes:
          modeValue === 'duration' ? Number(getValues('duration')) : undefined,
        pauseDuration: isSpecialEntry
          ? 0
          : timeStringToMinutes(String(pauseDurationValue)),
        driverTimeHours: isSpecialEntry ? 0 : Number(driverTimeHoursValue) || 0,
        passengerTimeHours: isSpecialEntry
          ? 0
          : Number(passengerTimeHoursValue) || 0,
      }
      const driverPercent = userSettings?.driverCompensationPercent ?? 100
      const passengerPercent = userSettings?.passengerCompensationPercent ?? 100
      const compensated = calculateTotalCompensatedMinutes(
        [tempEntry],
        driverPercent,
        passengerPercent,
      )
      let workDuration = 0
      if (modeValue === 'interval' && startTimeValue && endTimeValue) {
        const start = parse(startTimeValue, 'HH:mm', new Date())
        const end = parse(endTimeValue, 'HH:mm', new Date())
        workDuration = end > start ? differenceInMinutes(end, start) : 0
      } else if (modeValue === 'duration') {
        workDuration = Number(getValues('duration')) || 0
      }
      return {
        workDurationInMinutes: workDuration,
        compensatedMinutes: compensated,
      }
    } catch {
      return { workDurationInMinutes: 0, compensatedMinutes: 0 }
    }
  }, [
    startTimeValue,
    endTimeValue,
    pauseDurationValue,
    isSpecialEntry,
    driverTimeHoursValue,
    passengerTimeHoursValue,
    userSettings?.driverCompensationPercent,
    userSettings?.passengerCompensationPercent,
    modeValue,
    locationValue,
    getValues,
  ])

  const handleGetCurrentLocation = async () => {
    if (isFetchingLocation) return
    if (navigator.geolocation) {
      setIsFetchingLocation(true)
      toast({
        title: t('time_entry_form.locationFetchToastTitle'),
        description: t('time_entry_form.locationFetchToastDescription'),
      })
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          try {
            const result = await reverseGeocode({ latitude, longitude })
            form.setValue('location', result.address, { shouldValidate: true })
            toast({
              title: t('time_entry_form.locationFetchedToastTitle'),
              description: t(
                'time_entry_form.locationFetchedToastDescription',
                { address: result.address },
              ),
              className: 'bg-accent text-accent-foreground',
            })
          } catch (error) {
            console.error('Error getting address', error)
            const errorMessage =
              error instanceof Error
                ? error.message
                : 'An unknown error occurred'
            toast({
              title: t('time_entry_form.locationErrorToastTitle'),
              description: errorMessage,
              variant: 'destructive',
            })
            form.setValue(
              'location',
              `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`,
              { shouldValidate: true },
            )
          } finally {
            setIsFetchingLocation(false)
          }
        },
        (error) => {
          console.error('Error getting location', error)
          toast({
            title: t('time_entry_form.locationCoordsErrorToastTitle'),
            description: t(
              'time_entry_form.locationCoordsErrorToastDescription',
            ),
            variant: 'destructive',
          })
          setIsFetchingLocation(false)
        },
      )
    } else {
      toast({
        title: t('time_entry_form.geolocationNotSupportedToastTitle'),
        description: t(
          'time_entry_form.geolocationNotSupportedToastDescription',
        ),
        variant: 'destructive',
      })
    }
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    const finalIsSpecial = SPECIAL_LOCATION_KEYS.includes(
      values.location as SpecialLocationKey,
    )
    let finalEntry: Omit<TimeEntry, 'userId'>
    if (values.mode === 'interval') {
      if (!values.startTime || !values.endTime) {
        // Should not happen due to validation, but guard for type safety
        return
      }
      const [startHours, startMinutes] = (values.startTime ?? '')
        .split(':')
        .map(Number)
      const [endHours, endMinutes] = (values.endTime ?? '')
        .split(':')
        .map(Number)
      const date = values.date ?? new Date()
      const startTime = set(date, {
        hours: startHours,
        minutes: startMinutes,
        seconds: 0,
        milliseconds: 0,
      })
      const endTime = set(date, {
        hours: endHours,
        minutes: endMinutes,
        seconds: 0,
        milliseconds: 0,
      })
      finalEntry = {
        id: entry?.id || Date.now().toString(),
        location: values.location,
        startTime,
        endTime,
        pauseDuration: finalIsSpecial
          ? 0
          : timeStringToMinutes(String(values.pauseDuration || '')),
        driverTimeHours: finalIsSpecial ? 0 : values.driverTimeHours,
        passengerTimeHours: finalIsSpecial ? 0 : values.passengerTimeHours,
      }
    } else {
      // duration mode
      if (Number.isNaN(values.duration)) {
        // Should not happen due to validation, but guard for type safety
        return
      }
      // Set startTime to selected date at 12:00 local time for duration-only entries
      const date = values.date ?? new Date()
      const startTime = set(date, {
        hours: 12,
        minutes: 0,
        seconds: 0,
        milliseconds: 0,
      })
      finalEntry = {
        id: entry?.id || Date.now().toString(),
        location: values.location,
        durationMinutes: values.duration,
        startTime,
        pauseDuration: 0,
        driverTimeHours: 0,
        passengerTimeHours: 0,
      }
    }
    onSave(finalEntry)
  }

  // Helper to format input as HH:mm
  function formatDurationInput(value: string) {
    // Remove non-digits
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 2) return digits
    return digits.slice(0, 2) + ':' + digits.slice(2, 4)
  }

  // Helper to validate HH:mm format and valid duration
  function isValidDuration(value: string) {
    if (!/^\d{1,2}:\d{2}$/.test(value)) return false
    const [hh, mm] = value.split(':').map(Number)
    if (isNaN(hh) || isNaN(mm)) return false
    if (mm < 0 || mm > 59) return false
    return !(hh < 0 || hh > 23)
  }

  // Use the generalized getLocationDisplayName for displaying location
  const displayLocation = getLocationDisplayName(getValues('location'), t)

  let compensatedInfoTooltip = t('time_entry_form.compensatedInfo', {
    driver: userSettings?.driverCompensationPercent ?? 100,
    passenger: userSettings?.passengerCompensationPercent ?? 100,
  })
  return (
    <>
      <SheetHeader className="px-6 pt-6">
        <SheetTitle>
          {entry
            ? t('time_entry_form.editTitle')
            : t('time_entry_form.addTitle')}
        </SheetTitle>
        <SheetDescription>
          {entry
            ? t('time_entry_form.editDescription')
            : t('time_entry_form.addDescription')}
        </SheetDescription>
      </SheetHeader>
      <div className="flex-1 overflow-y-auto p-6">
        <TooltipProvider>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Location field using Controller for full RHF control */}
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t('time_entry_form.locationLabel')}</FormLabel>
                    <FormControl>
                      <LocationInput
                        {...field}
                        suggestions={locationSuggestions}
                        isSpecialEntry={isSpecialEntry}
                        placeholder={t('time_entry_form.locationPlaceholder')}
                        displayValue={displayLocation}
                        disabled={isSpecialEntry}
                        onGetCurrentLocation={
                          !isSpecialEntry ? handleGetCurrentLocation : undefined
                        }
                        isFetchingLocation={isFetchingLocation}
                        onBlur={() => {
                          field.onBlur()
                          form.trigger('location')
                        }}
                        onFocus={() => {}}
                      />
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
                    <FormLabel>{t('time_entry_form.dateLabel')}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !field.value && 'text-muted-foreground',
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? (
                              format(field.value, 'long')
                            ) : (
                              <span>{t('time_entry_form.pickDate')}</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mode"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-4 mb-2">
                    <FormLabel className="mr-2">
                      {t('time_entry_form.modeInterval')}
                    </FormLabel>
                    <Switch
                      aria-label={t('time_entry_form.modeDuration')}
                      data-testid="mode-switch"
                      checked={field.value === 'duration'}
                      onCheckedChange={(checked) =>
                        field.onChange(checked ? 'duration' : 'interval')
                      }
                      id="mode-switch"
                    />
                    <FormLabel htmlFor="mode-switch" className="ml-2">
                      {t('time_entry_form.modeDuration')}
                    </FormLabel>
                  </FormItem>
                )}
              />
              {modeValue === 'interval' ? (
                <div className="flex gap-4">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>
                          {t('time_entry_form.startTimeLabel')}
                        </FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        {/* Start time suggestions */}
                        {startTimeSuggestions.length > 0 && (
                          <div
                            className="flex gap-2 mt-2"
                            data-testid="start-time-suggestions"
                          >
                            {startTimeSuggestions.map((s) => (
                              <Tooltip key={s}>
                                <TooltipTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-auto p-1 text-primary hover:bg-primary/10 flex items-center gap-1"
                                    onClick={() =>
                                      setValue('startTime', s, {
                                        shouldValidate: true,
                                      })
                                    }
                                  >
                                    <Lightbulb className="h-4 w-4 mr-1 opacity-70" />
                                    {s}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {t('time_entry_form.smartSuggestionTooltip')}
                                </TooltipContent>
                              </Tooltip>
                            ))}
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>
                          {t('time_entry_form.endTimeLabel')}
                        </FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        {/* End time suggestions */}
                        {endTimeSuggestions.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {endTimeSuggestions.map((s) => (
                              <Tooltip key={s}>
                                <TooltipTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-auto p-1 text-primary hover:bg-primary/10 flex items-center gap-1"
                                    onClick={() =>
                                      setValue('endTime', s, {
                                        shouldValidate: true,
                                      })
                                    }
                                  >
                                    <Lightbulb className="h-4 w-4 mr-1 opacity-70" />
                                    {s}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {t('time_entry_form.smartSuggestionTooltip')}
                                </TooltipContent>
                              </Tooltip>
                            ))}
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ) : (
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('time_entry_form.durationFormLabel')}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={5}
                          max={1440}
                          step={5}
                          placeholder="e.g. 30"
                          {...field}
                          value={field.value?.toString() ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {!isSpecialEntry && modeValue === 'interval' && (
                <>
                  <Separator />
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('time_entry_form.optionalDetailsTitle')}
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="pauseDuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t('time_entry_form.pauseLabel')}
                          </FormLabel>
                          <FormControl>
                            {isMobile ? (
                              <Input
                                type="tel"
                                inputMode="numeric"
                                pattern="[0-9:]*"
                                placeholder="e.g. 00:30 for 30 minutes"
                                value={field.value}
                                onChange={(e) => {
                                  const formatted = formatDurationInput(
                                    e.target.value,
                                  )
                                  field.onChange(formatted)
                                }}
                                maxLength={5}
                              />
                            ) : (
                              <Input
                                type="time"
                                step="60"
                                placeholder="e.g. 00:30 for 30 minutes"
                                {...field}
                              />
                            )}
                          </FormControl>
                          {field.value && !isValidDuration(field.value) && (
                            <div className="text-sm font-medium text-destructive mt-1">
                              {t('time_entry_form.pauseDurationInvalid', {
                                example: '00:30',
                              })}
                            </div>
                          )}
                          <FormDescription>
                            {t('time_entry_form.pauseDurationDescription', {
                              example: '00:30',
                            })}
                          </FormDescription>
                          <FormMessage />
                          <div className="pt-2">
                            {pauseSuggestion && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-auto p-1 text-primary hover:bg-primary/10"
                                    onClick={() =>
                                      setValue(
                                        'pauseDuration',
                                        pauseSuggestion.timeString,
                                        { shouldValidate: true },
                                      )
                                    }
                                  >
                                    <Lightbulb className="mr-1 h-4 w-4" />
                                    {t('time_entry_form.pauseSuggestion', {
                                      minutes: pauseSuggestion.minutes,
                                    })}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    {t(
                                      'time_entry_form.pauseSuggestionTooltip',
                                      {
                                        hours: pauseSuggestion.reason,
                                        minutes: pauseSuggestion.minutes,
                                      },
                                    )}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </FormItem>
                      )}
                    />
                    <div className="flex flex-col gap-4">
                      <FormField
                        control={form.control}
                        name="driverTimeHours"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t('time_entry_form.driverTimeLabel')}
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                min={0}
                                step={0.25}
                                placeholder="e.g. 1.5"
                                value={field.value?.toString() ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value
                                  field.onChange(
                                    val === '' ? 0 : parseFloat(val),
                                  )
                                }}
                              />
                            </FormControl>
                            {driverTimeSuggestions.length > 0 && (
                              <div className="flex gap-2 mt-2">
                                {driverTimeSuggestions.map((s) => (
                                  <Tooltip key={s}>
                                    <TooltipTrigger asChild>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-auto p-1 text-primary hover:bg-primary/10 flex items-center gap-1"
                                        onClick={() =>
                                          setValue('driverTimeHours', s, {
                                            shouldValidate: true,
                                          })
                                        }
                                      >
                                        <Lightbulb className="h-4 w-4 mr-1 opacity-70" />
                                        {s}
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {t(
                                        'time_entry_form.smartSuggestionTooltip',
                                      )}
                                    </TooltipContent>
                                  </Tooltip>
                                ))}
                              </div>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="passengerTimeHours"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t('time_entry_form.passengerTimeLabel')}
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                min={0}
                                step={0.25}
                                placeholder="e.g. 1.5"
                                value={field.value?.toString() ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value
                                  field.onChange(
                                    val === '' ? 0 : parseFloat(val),
                                  )
                                }}
                              />
                            </FormControl>
                            {passengerTimeSuggestions.length > 0 && (
                              <div className="flex gap-2 mt-2">
                                {passengerTimeSuggestions.map((s) => (
                                  <Tooltip key={s}>
                                    <TooltipTrigger asChild>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-auto p-1 text-primary hover:bg-primary/10 flex items-center gap-1"
                                        onClick={() =>
                                          setValue('passengerTimeHours', s, {
                                            shouldValidate: true,
                                          })
                                        }
                                      >
                                        <Lightbulb className="h-4 w-4 mr-1 opacity-70" />
                                        {s}
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {t(
                                        'time_entry_form.smartSuggestionTooltip',
                                      )}
                                    </TooltipContent>
                                  </Tooltip>
                                ))}
                              </div>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-4 pt-4">
                <Separator />
                <div className="flex items-center justify-between font-medium">
                  <span className="text-muted-foreground flex items-center gap-2">
                    {t('time_entry_form.totalTimeLabel')}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            tabIndex={0}
                            aria-label={compensatedInfoTooltip}
                            className="ml-1 text-primary hover:text-primary/80 focus:outline-none"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          align="start"
                          className="max-w-xs text-xs"
                        >
                          {compensatedInfoTooltip}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </span>
                  <span className="text-lg text-primary">
                    {formatHoursAndMinutes(compensatedMinutes)}
                  </span>
                </div>
                {workDurationInMinutes > 10 * 60 && !isSpecialEntry && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>
                      {t('time_entry_form.warning10HoursTitle')}
                    </AlertTitle>
                    <AlertDescription>
                      {t('time_entry_form.warning10HoursDescription')}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <SheetFooter className="pt-6">
                <AlertDialog
                  open={showCancelDialog}
                  onOpenChange={setShowCancelDialog}
                >
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCancelDialog(true)}
                    >
                      {t('common.cancel')}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {t('time_entry_form.cancelConfirmTitle')}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('time_entry_form.cancelConfirmDescription')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel asChild>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowCancelDialog(false)}
                        >
                          {t('time_entry_form.cancelConfirmAbort')}
                        </Button>
                      </AlertDialogCancel>
                      <AlertDialogAction asChild>
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={onClose}
                        >
                          {t('time_entry_form.cancelConfirmConfirm')}
                        </Button>
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button type="submit">
                  <Save className="mr-2 h-4 w-4" />
                  {t('time_entry_form.saveButton')}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </TooltipProvider>
      </div>
    </>
  )
}
