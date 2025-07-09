'use client'

import React, { useMemo, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'

import { differenceInMinutes, parse, set } from 'date-fns'
import {
  AlertTriangle,
  Calendar as CalendarIcon,
  Lightbulb,
  Save,
} from 'lucide-react'
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
import { Checkbox } from '@/components/ui/checkbox'
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
import { useTranslation } from '@/context/i18n-context'
import { useTimeTrackerContext } from '@/context/time-tracker-context'
import { useIsMobile } from '@/hooks/use-mobile'
import { useToast } from '@/hooks/use-toast'
import { SPECIAL_LOCATION_KEYS, SpecialLocationKey } from '@/lib/constants'
import {
  suggestEndTimes,
  suggestLocations,
  suggestStartTimes,
  suggestTravelTimes,
} from '@/lib/time-entry-suggestions'
import type { TimeEntry, UserSettings } from '@/lib/types'
import {
  cn,
  formatAppDate,
  formatAppTime,
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
      .min(5, 'Minimum 5 minutes')
      .max(1440, 'Maximum 24 hours')
      .multipleOf(5, 'Must be a multiple of 5')
      .optional(),
    pauseDuration: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)')
      .optional(),
    travelTime: z.coerce.number().min(0, 'Must be positive').optional(),
    isDriver: z.boolean().optional(),
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
          data.duration >= 5 && data.duration <= 1440 && data.duration % 5 === 0
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
  const { t, language } = useTranslation()
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
          ? formatAppTime(entry.startTime)
          : defaultStartTime,
      endTime:
        !isDurationEntry && entry?.endTime
          ? formatAppTime(entry.endTime)
          : defaultEndTime,
      duration: defaultDuration,
      pauseDuration: formatMinutesToTimeInput(entry?.pauseDuration ?? 0),
      travelTime: entry?.travelTime || 0,
      isDriver:
        entry?.isDriver !== undefined
          ? entry.isDriver
          : (userSettings?.defaultIsDriver ?? false),
    },
  })

  const { watch, setValue, getValues } = form
  const modeValue = watch('mode')
  const startTimeValue = watch('startTime')
  const endTimeValue = watch('endTime')
  const pauseDurationValue = watch('pauseDuration')
  const travelTimeValue = watch('travelTime')
  const locationValue = watch('location')

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
  const currentTravelTime = watch('travelTime')
  const travelTimeSuggestions = useMemo(() => {
    if (isSpecialEntry || !locationValue) return []
    return suggestTravelTimes(entries, {
      location: locationValue,
      limit: 3,
    }).filter((s) => s !== currentTravelTime)
  }, [entries, locationValue, isSpecialEntry, currentTravelTime])

  const pauseSuggestion = useMemo(() => {
    if (isSpecialEntry) return null
    try {
      const start = parse(startTimeValue || '00:00', 'HH:mm', new Date())
      const end = parse(endTimeValue || '00:00', 'HH:mm', new Date())
      if (end <= start) return null

      const workDurationInMinutes = differenceInMinutes(end, start)
      const travelTimeInMinutes = (travelTimeValue || 0) * 60
      const totalActivityInMinutes = workDurationInMinutes + travelTimeInMinutes

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
  }, [startTimeValue, endTimeValue, travelTimeValue, isSpecialEntry])

  const { workDurationInMinutes, totalCompensatedMinutes } = useMemo(() => {
    try {
      const start = parse(startTimeValue || '00:00', 'HH:mm', new Date())
      const end = parse(endTimeValue || '00:00', 'HH:mm', new Date())
      if (end <= start)
        return { workDurationInMinutes: 0, totalCompensatedMinutes: 0 }

      const workDuration = differenceInMinutes(end, start)

      if (isSpecialEntry) {
        return {
          workDurationInMinutes: workDuration,
          totalCompensatedMinutes: workDuration,
        }
      }

      const pauseInMinutes = timeStringToMinutes(String(pauseDurationValue))
      const travelInMinutes = (travelTimeValue || 0) * 60
      const total = workDuration - pauseInMinutes + travelInMinutes

      return {
        workDurationInMinutes: workDuration,
        totalCompensatedMinutes: total > 0 ? total : 0,
      }
    } catch {
      return { workDurationInMinutes: 0, totalCompensatedMinutes: 0 }
    }
  }, [
    startTimeValue,
    endTimeValue,
    pauseDurationValue,
    travelTimeValue,
    isSpecialEntry,
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
        travelTime: finalIsSpecial ? 0 : values.travelTime,
        isDriver: finalIsSpecial ? false : values.isDriver,
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
        travelTime: 0,
        isDriver: false,
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
                              formatAppDate(field.value, language)
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
                          initialFocus
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
                    <FormField
                      control={form.control}
                      name="travelTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t('time_entry_form.travelTimeLabel')}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.25"
                              placeholder={t(
                                'time_entry_form.travelTimePlaceholder',
                              )}
                              {...field}
                            />
                          </FormControl>
                          {/* Travel time suggestions */}
                          {travelTimeSuggestions.length > 0 && (
                            <div className="flex gap-2 mt-2">
                              {travelTimeSuggestions.map((s) => (
                                <Tooltip key={s}>
                                  <TooltipTrigger asChild>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-auto p-1 text-primary hover:bg-primary/10 flex items-center gap-1"
                                      onClick={() =>
                                        setValue('travelTime', s, {
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
                  <FormField
                    control={form.control}
                    name="isDriver"
                    render={({ field }) => (
                      <FormItem className="col-span-2 flex flex-row items-center space-x-3 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            {t('time_entry_form.driverLabel')}
                          </FormLabel>
                          <FormDescription>
                            {t('time_entry_form.driverDescription')}
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </>
              )}

              <div className="space-y-4 pt-4">
                <Separator />
                <div className="flex items-center justify-between font-medium">
                  <span className="text-muted-foreground">
                    {t('time_entry_form.totalTimeLabel')}
                  </span>
                  <span className="text-lg text-primary">
                    {formatHoursAndMinutes(totalCompensatedMinutes)}
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
                      {t('time_entry_form.cancelButton')}
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
