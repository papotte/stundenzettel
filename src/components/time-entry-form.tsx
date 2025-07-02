'use client'

import { useMemo, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'

import { differenceInMinutes, format, parse, set } from 'date-fns'
import {
  AlertTriangle,
  Calendar as CalendarIcon,
  Lightbulb,
  Loader2,
  MapPin,
  Save,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { reverseGeocode } from '@/ai/flows/reverse-geocode-flow'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
  SheetClose,
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
import { useToast } from '@/hooks/use-toast'
import { SPECIAL_LOCATION_KEYS, SpecialLocationKey } from '@/lib/constants'
import type { TimeEntry, UserSettings } from '@/lib/types'
import {
  cn,
  formatHoursAndMinutes,
  formatMinutesToTimeInput,
  timeStringToMinutes,
} from '@/lib/utils'

import { Calendar } from './ui/calendar'
import { Separator } from './ui/separator'

const formSchema = z
  .object({
    location: z.string().min(2, {
      message: 'Location must be at least 2 characters.',
    }),
    date: z.date(),
    startTime: z
      .string()
      .regex(
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        'Invalid time format (HH:mm)',
      ),
    endTime: z
      .string()
      .regex(
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        'Invalid time format (HH:mm)',
      ),
    pauseDuration: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)')
      .optional(),
    travelTime: z.coerce.number().min(0, 'Must be positive').optional(),
    isDriver: z.boolean().optional(),
  })
  .refine(
    (data) => {
      try {
        const start = parse(data.startTime, 'HH:mm', new Date())
        const end = parse(data.endTime, 'HH:mm', new Date())
        return end > start
      } catch {
        return false
      }
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
  userSettings,
}: TimeEntryFormProps) {
  const { toast } = useToast()
  const { t } = useTranslation()
  const [isFetchingLocation, setIsFetchingLocation] = useState(false)

  const defaultStartTime = userSettings?.defaultStartTime || '09:00'
  const defaultEndTime = userSettings?.defaultEndTime || '17:00'

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      location: entry?.location || '',
      date: entry?.startTime || selectedDate,
      startTime: entry ? format(entry.startTime, 'HH:mm') : defaultStartTime,
      endTime: entry?.endTime ? format(entry.endTime, 'HH:mm') : defaultEndTime,
      pauseDuration: formatMinutesToTimeInput(entry?.pauseDuration),
      travelTime: entry?.travelTime || 0,
      isDriver: entry?.isDriver || false,
    },
  })

  const { watch, setValue, getValues } = form
  const startTimeValue = watch('startTime')
  const endTimeValue = watch('endTime')
  const pauseDurationValue = watch('pauseDuration')
  const travelTimeValue = watch('travelTime')
  const locationValue = watch('location')

  const isSpecialEntry = useMemo(() => {
    return SPECIAL_LOCATION_KEYS.includes(
      getValues('location') as SpecialLocationKey,
    )
  }, [locationValue, getValues])

  const pauseSuggestion = useMemo(() => {
    if (isSpecialEntry) return null
    try {
      const start = parse(startTimeValue, 'HH:mm', new Date())
      const end = parse(endTimeValue, 'HH:mm', new Date())
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
    } catch (_) {
      return null
    }
  }, [startTimeValue, endTimeValue, travelTimeValue, isSpecialEntry])

  const { workDurationInMinutes, totalCompensatedMinutes } = useMemo(() => {
    try {
      const start = parse(startTimeValue, 'HH:mm', new Date())
      const end = parse(endTimeValue, 'HH:mm', new Date())
      if (end <= start)
        return { workDurationInMinutes: 0, totalCompensatedMinutes: 0 }

      const workDuration = differenceInMinutes(end, start)

      if (isSpecialEntry) {
        return {
          workDurationInMinutes: workDuration,
          totalCompensatedMinutes: workDuration,
        }
      }

      const pauseInMinutes = timeStringToMinutes(pauseDurationValue)
      const travelInMinutes = (travelTimeValue || 0) * 60
      const total = workDuration - pauseInMinutes + travelInMinutes

      return {
        workDurationInMinutes: workDuration,
        totalCompensatedMinutes: total > 0 ? total : 0,
      }
    } catch (_) {
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
    const [startHours, startMinutes] = values.startTime.split(':').map(Number)
    const [endHours, endMinutes] = values.endTime.split(':').map(Number)

    const startTime = set(values.date, {
      hours: startHours,
      minutes: startMinutes,
      seconds: 0,
      milliseconds: 0,
    })
    const endTime = set(values.date, {
      hours: endHours,
      minutes: endMinutes,
      seconds: 0,
      milliseconds: 0,
    })

    const finalIsSpecial = SPECIAL_LOCATION_KEYS.includes(
      values.location as SpecialLocationKey,
    )

    const finalEntry: Omit<TimeEntry, 'userId'> = {
      id: entry?.id || Date.now().toString(),
      location: values.location,
      startTime,
      endTime,
      pauseDuration: finalIsSpecial
        ? 0
        : timeStringToMinutes(values.pauseDuration),
      travelTime: finalIsSpecial ? 0 : values.travelTime,
      isDriver: finalIsSpecial ? false : values.isDriver,
    }
    onSave(finalEntry)
  }

  const locationDisplayName = useMemo(() => {
    if (isSpecialEntry) {
      return t(`special_locations.${entry?.location}`)
    }
    return entry?.location || ''
  }, [entry, isSpecialEntry, t])

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
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => {
                  const displayValue = isSpecialEntry
                    ? locationDisplayName
                    : field.value
                  return (
                    <FormItem>
                      <FormLabel>
                        {t('time_entry_form.locationLabel')}
                      </FormLabel>
                      <div className="relative flex items-center">
                        <FormControl>
                          <Input
                            placeholder={t(
                              'time_entry_form.locationPlaceholder',
                            )}
                            {...field}
                            value={displayValue}
                            disabled={isSpecialEntry}
                            className="pr-10"
                          />
                        </FormControl>
                        {!isSpecialEntry && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                type="button"
                                onClick={handleGetCurrentLocation}
                                aria-label="Get current location"
                                disabled={isFetchingLocation}
                                className="absolute right-0 mr-1 h-8 w-8"
                              >
                                {isFetchingLocation ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MapPin className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{t('tracker.getLocationTooltip')}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )
                }}
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
                              format(field.value, 'PPP')
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>{t('time_entry_form.endTimeLabel')}</FormLabel>
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
                            <Input type="time" {...field} />
                          </FormControl>
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
                <SheetClose asChild>
                  <Button type="button" variant="outline">
                    {t('time_entry_form.cancelButton')}
                  </Button>
                </SheetClose>
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
