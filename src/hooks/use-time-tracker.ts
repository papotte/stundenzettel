import { useCallback, useEffect, useMemo, useState } from 'react'

import { useQuery, useQueryClient } from '@tanstack/react-query'

import {
  addDays,
  endOfMonth,
  endOfWeek,
  isSameDay,
  isWithinInterval,
  set,
  startOfMonth,
  startOfWeek,
  subDays,
} from 'date-fns'
import { useTranslations } from 'next-intl'

import { reverseGeocode } from '@/ai/flows/reverse-geocode-flow'
import { useToast } from '@/hooks/use-toast'
import type { SpecialLocationKey } from '@/lib/constants'
import { useFormatter } from '@/lib/date-formatter'
import { queryKeys } from '@/lib/query-keys'
import {
  calculateTotalCompensatedMinutes,
  shiftEntryToDate,
} from '@/lib/time-utils'
import type { TimeEntry } from '@/lib/types'
import {
  addTimeEntry,
  deleteAllTimeEntries,
  deleteTimeEntry,
  getTimeEntries,
  updateTimeEntry,
} from '@/services/time-entry-service'
import { getUserSettings } from '@/services/user-settings-service'

export function useTimeTracker(user: { uid: string } | null) {
  const { toast } = useToast()
  const t = useTranslations()
  const format = useFormatter().dateTime
  const queryClient = useQueryClient()

  const {
    data,
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: queryKeys.timeTrackerData(user?.uid ?? ''),
    queryFn: async () => {
      const [entries, userSettings] = await Promise.all([
        getTimeEntries(user!.uid),
        getUserSettings(user!.uid),
      ])
      return { entries, userSettings }
    },
    enabled: Boolean(user?.uid),
  })

  const entries = useMemo(() => data?.entries ?? [], [data?.entries])
  const userSettings = data?.userSettings ?? null

  useEffect(() => {
    if (queryError) {
      toast({
        title: t('toasts.databaseErrorTitle') ?? '',
        description: t('toasts.databaseConnectionError') ?? '',
        variant: 'destructive',
      })
    }
  }, [queryError, t, toast])

  const setUserSettingsRefetch = useCallback(() => {
    if (user?.uid) {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.timeTrackerData(user.uid),
      })
    }
  }, [user?.uid, queryClient])

  const [runningTimer, setRunningTimer] = useState<TimeEntry | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [location, setLocation] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)
  const [isFetchingLocation, setIsFetchingLocation] = useState(false)

  useEffect(() => {
    setSelectedDate(new Date())
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (runningTimer) {
      interval = setInterval(() => {
        setElapsedTime(
          runningTimer.startTime
            ? Math.floor(
                (new Date().getTime() - runningTimer.startTime.getTime()) /
                  1000,
              )
            : 0,
        )
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [runningTimer])

  const invalidateTimeTracker = useCallback(() => {
    if (user?.uid) {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.timeTrackerData(user.uid),
      })
    }
  }, [user?.uid, queryClient])

  const handleStartTimer = () => {
    if (!user) return
    if (!location) {
      toast({
        title: t('toasts.locationRequiredTitle') ?? '',
        description: t('toasts.locationRequiredDescription') ?? '',
        variant: 'destructive',
      })
      return
    }
    const newTimer: TimeEntry = {
      id: Date.now().toString(),
      userId: user.uid,
      startTime: new Date(),
      location,
    }
    setRunningTimer(newTimer)
  }

  const handleStopTimer = () => {
    if (runningTimer) {
      const finishedEntry: TimeEntry = {
        ...runningTimer,
        endTime: new Date(),
      }
      setRunningTimer(null)
      setLocation('')
      setElapsedTime(0)
      setEditingEntry(finishedEntry)
      setIsFormOpen(true)
    }
  }

  const handleSaveEntry = async (entryData: Omit<TimeEntry, 'userId'>) => {
    if (!user) return
    const entryWithUser = { ...entryData, userId: user.uid }
    setIsFormOpen(false)
    setEditingEntry(null)
    try {
      const existingEntry = entries.find((e) => e.id === entryWithUser.id)
      if (existingEntry) {
        await updateTimeEntry(entryWithUser.id, entryWithUser)
        toast({
          title: t('toasts.entryUpdatedTitle') ?? '',
          description:
            t('toasts.entryUpdatedDescription', {
              location: entryWithUser.location,
            }) ?? '',
        })
      } else {
        await addTimeEntry(entryWithUser)
        toast({
          title: t('toasts.entryAddedTitle') ?? '',
          description:
            t('toasts.entryAddedDescription', {
              location: entryWithUser.location,
            }) ?? '',
        })
      }
      invalidateTimeTracker()
    } catch (error) {
      console.error('Error saving entry:', error)
      toast({
        title: t('toasts.saveFailedTitle') ?? '',
        description: t('toasts.saveFailedDescription') ?? '',
        variant: 'destructive',
      })
    }
  }

  const handleEditEntry = (entry: TimeEntry) => {
    setEditingEntry(entry)
    setIsFormOpen(true)
  }

  const handleDeleteEntry = async (id: string) => {
    if (!user) return
    try {
      await deleteTimeEntry(user.uid, id)
      toast({
        title: t('toasts.entryDeletedTitle') ?? '',
        variant: 'destructive',
      })
      invalidateTimeTracker()
    } catch (error) {
      console.error('Error deleting entry:', error)
      toast({
        title: t('toasts.deleteFailedTitle') ?? '',
        description: t('toasts.deleteFailedDescription') ?? '',
        variant: 'destructive',
      })
    }
  }

  const handleClearData = async () => {
    if (!user) return
    try {
      await deleteAllTimeEntries(user.uid)
      if (runningTimer) {
        setRunningTimer(null)
        setLocation('')
        setElapsedTime(0)
      }
      toast({
        title: t('toasts.dataClearedTitle') ?? '',
        description: t('toasts.dataClearedDescription') ?? '',
      })
      invalidateTimeTracker()
    } catch (error) {
      console.error('Error clearing data:', error)
      toast({
        title: t('toasts.clearFailedTitle') ?? '',
        description: t('toasts.clearFailedDescription') ?? '',
        variant: 'destructive',
      })
    }
  }

  const handleAddSpecialEntry = async (locationKey: SpecialLocationKey) => {
    if (!selectedDate || !user) return
    const currentSettings = await getUserSettings(user.uid)
    const isTimeOffInLieu = locationKey === 'TIME_OFF_IN_LIEU'
    const hours = isTimeOffInLieu ? 0 : currentSettings.defaultWorkHours || 7
    const startTime = set(selectedDate, {
      hours: 12,
      minutes: 0,
      seconds: 0,
      milliseconds: 0,
    })
    const durationMinutes = hours * 60
    const newEntry: Omit<TimeEntry, 'id' | 'userId'> = {
      location: locationKey,
      startTime,
      durationMinutes,
    }
    const entryExists = entries.some(
      (e) =>
        e.startTime &&
        isSameDay(e.startTime, selectedDate) &&
        e.location === locationKey,
    )
    if (entryExists) {
      toast({
        title: t('toasts.entryExistsTitle') ?? '',
        description:
          t('toasts.entryExistsDescription', {
            location: t(`special_locations.${locationKey}`),
          }) ?? '',
        variant: 'destructive',
      })
      return
    }
    try {
      const entryWithUser = { ...newEntry, userId: user.uid }
      await addTimeEntry(entryWithUser)
      toast({
        title: t('toasts.entryAddedTitle') ?? '',
        description:
          t('toasts.entryAddedDescription', {
            location: t(`special_locations.${locationKey}`),
          }) ?? '',
        className: 'bg-accent text-accent-foreground',
      })
      invalidateTimeTracker()
    } catch (error) {
      console.error('Error adding special entry:', error)
      toast({
        title: t('toasts.saveFailedTitle') ?? '',
        description: t('toasts.saveFailedDescription') ?? '',
        variant: 'destructive',
      })
    }
  }

  const handleGetCurrentLocation = async () => {
    if (isFetchingLocation) return
    if (navigator.geolocation) {
      setIsFetchingLocation(true)
      toast({
        title: t('time_entry_form.locationFetchToastTitle') ?? '',
        description: t('time_entry_form.locationFetchToastDescription') ?? '',
      })
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          try {
            const result = await reverseGeocode({ latitude, longitude })
            setLocation(result.address)
            toast({
              title: t('time_entry_form.locationFetchedToastTitle') ?? '',
              description:
                t('time_entry_form.locationFetchedToastDescription', {
                  address: result.address,
                }) ?? '',
              className: 'bg-accent text-accent-foreground',
            })
          } catch (error) {
            console.error('Error getting address', error)
            const errorMessage =
              error instanceof Error
                ? error.message
                : 'An unknown error occurred'
            toast({
              title: t('time_entry_form.locationErrorToastTitle') ?? '',
              description: errorMessage ?? '',
              variant: 'destructive',
            })
            setLocation(
              `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`,
            )
          } finally {
            setIsFetchingLocation(false)
          }
        },
        (error) => {
          console.error('Error getting location', error)
          toast({
            title: t('time_entry_form.locationCoordsErrorToastTitle') ?? '',
            description:
              t('time_entry_form.locationCoordsErrorToastDescription') ?? '',
            variant: 'destructive',
          })
          setIsFetchingLocation(false)
        },
      )
    } else {
      toast({
        title: t('time_entry_form.geolocationNotSupportedToastTitle') ?? '',
        description:
          t('time_entry_form.geolocationNotSupportedToastDescription') ?? '',
        variant: 'destructive',
      })
    }
  }

  const handleCopyFromYesterday = async () => {
    if (!user || !selectedDate) return
    if (!isSameDay(selectedDate, new Date())) return
    const yesterday = subDays(selectedDate, 1)
    const yesterdayEntries = entries.filter(
      (e) => e.startTime && isSameDay(e.startTime, yesterday),
    )
    if (yesterdayEntries.length === 0) return
    try {
      for (const entry of yesterdayEntries) {
        const shifted = shiftEntryToDate(entry, selectedDate)
        const withUser = { ...shifted, userId: user.uid }
        await addTimeEntry(withUser)
      }
      toast({
        title: t('toasts.entriesCopiedFromYesterdayTitle') ?? '',
        description:
          t('toasts.entriesCopiedFromYesterdayDescription', {
            count: yesterdayEntries.length,
          }) ?? '',
      })
      invalidateTimeTracker()
    } catch (error) {
      console.error('Error copying from yesterday:', error)
      toast({
        title: t('toasts.copyFailedTitle') ?? '',
        description: t('toasts.copyFailedDescription') ?? '',
        variant: 'destructive',
      })
    }
  }

  const handleCopyEntryTo = async (entry: TimeEntry, targetDate: Date) => {
    if (!user) return
    try {
      const shifted = shiftEntryToDate(entry, targetDate)
      const withUser = { ...shifted, userId: user.uid }
      await addTimeEntry(withUser)
      toast({
        title: t('toasts.entryCopiedTitle') ?? '',
        description:
          t('toasts.entryCopiedDescription', {
            location: entry.location,
          }) ?? '',
      })
      invalidateTimeTracker()
    } catch (error) {
      console.error('Error copying entry:', error)
      toast({
        title: t('toasts.copyFailedTitle') ?? '',
        description: t('toasts.copyFailedDescription') ?? '',
        variant: 'destructive',
      })
    }
  }

  const handleCopyDayTo = async (targetDate: Date) => {
    if (!user || !selectedDate) return
    const dayEntries = entries.filter(
      (e) => e.startTime && isSameDay(e.startTime, selectedDate),
    )
    if (dayEntries.length === 0) return
    try {
      for (const entry of dayEntries) {
        const shifted = shiftEntryToDate(entry, targetDate)
        const withUser = { ...shifted, userId: user.uid }
        await addTimeEntry(withUser)
      }
      toast({
        title: t('toasts.entriesCopiedToTitle') ?? '',
        description:
          t('toasts.entriesCopiedToDescription', {
            count: dayEntries.length,
            date: format(targetDate, 'long'),
          }) ?? '',
      })
      invalidateTimeTracker()
    } catch (error) {
      console.error('Error copying day:', error)
      toast({
        title: t('toasts.copyFailedTitle') ?? '',
        description: t('toasts.copyFailedDescription') ?? '',
        variant: 'destructive',
      })
    }
  }

  const handlePreviousDay = () => {
    if (selectedDate) {
      setSelectedDate(subDays(selectedDate, 1))
    }
  }

  const handleNextDay = () => {
    if (selectedDate) {
      setSelectedDate(addDays(selectedDate, 1))
    }
  }

  const filteredEntries = useMemo(
    () =>
      selectedDate
        ? entries.filter(
            (entry) =>
              entry.startTime && isSameDay(entry.startTime, selectedDate),
          )
        : [],
    [entries, selectedDate],
  )

  const { dailyTotal, weeklyTotal, monthlyTotal } = useMemo(() => {
    if (!selectedDate || !entries.length) {
      return { dailyTotal: 0, weeklyTotal: 0, monthlyTotal: 0 }
    }
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 })
    const monthStart = startOfMonth(selectedDate)
    const monthEnd = endOfMonth(selectedDate)
    const weekEntries = entries.filter(
      (entry) =>
        entry.startTime &&
        isWithinInterval(entry.startTime, { start: weekStart, end: weekEnd }),
    )
    const monthEntries = entries.filter(
      (entry) =>
        entry.startTime &&
        isWithinInterval(entry.startTime, { start: monthStart, end: monthEnd }),
    )
    const driverPercent = userSettings?.driverCompensationPercent ?? 100
    const passengerPercent = userSettings?.passengerCompensationPercent ?? 100
    return {
      dailyTotal: calculateTotalCompensatedMinutes(
        filteredEntries,
        driverPercent,
        passengerPercent,
      ),
      weeklyTotal: calculateTotalCompensatedMinutes(
        weekEntries,
        driverPercent,
        passengerPercent,
      ),
      monthlyTotal: calculateTotalCompensatedMinutes(
        monthEntries,
        driverPercent,
        passengerPercent,
      ),
    }
  }, [entries, selectedDate, filteredEntries, userSettings])

  const openNewEntryForm = useCallback(() => {
    setEditingEntry(null)
    setIsFormOpen(true)
  }, [])

  const formattedSelectedDate = selectedDate
    ? format(selectedDate, 'long')
    : t('common.loading')

  return {
    entries,
    isLoading,
    runningTimer,
    elapsedTime,
    location,
    setLocation,
    selectedDate,
    setSelectedDate,
    isFormOpen,
    setIsFormOpen,
    editingEntry,
    setEditingEntry,
    isFetchingLocation,
    setIsFetchingLocation,
    userSettings,
    setUserSettings: setUserSettingsRefetch,
    handleStartTimer,
    handleStopTimer,
    handleSaveEntry,
    handleEditEntry,
    handleDeleteEntry,
    handleClearData,
    handleAddSpecialEntry,
    handleGetCurrentLocation,
    handleCopyFromYesterday,
    handleCopyEntryTo,
    handleCopyDayTo,
    handlePreviousDay,
    handleNextDay,
    filteredEntries,
    calculateTotalCompensatedMinutes,
    dailyTotal,
    weeklyTotal,
    monthlyTotal,
    openNewEntryForm,
    formattedSelectedDate,
  }
}
