import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  addDays,
  addMinutes,
  differenceInMinutes,
  endOfMonth,
  endOfWeek,
  isSameDay,
  isWithinInterval,
  set,
  startOfMonth,
  startOfWeek,
  subDays,
} from 'date-fns'

import { reverseGeocode } from '@/ai/flows/reverse-geocode-flow'
import type { Toast } from '@/hooks/use-toast'
import type { SpecialLocationKey } from '@/lib/constants'
import type { TimeEntry, UserSettings } from '@/lib/types'
import {
  addTimeEntry,
  deleteAllTimeEntries,
  deleteTimeEntry,
  getTimeEntries,
  updateTimeEntry,
} from '@/services/time-entry-service'
import { getUserSettings } from '@/services/user-settings-service'

export function useTimeTracker(
  user: { uid: string } | null,
  toast: (options: Toast) => void,
  t: (key: string, params?: Record<string, string | number>) => string,
) {
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [runningTimer, setRunningTimer] = useState<TimeEntry | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [location, setLocation] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)
  const [isFetchingLocation, setIsFetchingLocation] = useState(false)
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null)

  useEffect(() => {
    setSelectedDate(new Date())
    if (!user) return
    const fetchInitialData = async () => {
      setIsLoading(true)
      try {
        const [fetchedEntries, settings] = await Promise.all([
          getTimeEntries(user.uid),
          getUserSettings(user.uid),
        ])
        setEntries(fetchedEntries)
        setUserSettings(settings)
      } catch (error) {
        console.error('Error fetching initial data:', error)
        toast({
          title: t('toasts.databaseErrorTitle') ?? '',
          description: t('toasts.databaseConnectionError') ?? '',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }
    fetchInitialData()
  }, [user, toast, t])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (runningTimer) {
      interval = setInterval(() => {
        setElapsedTime(
          Math.floor(
            (new Date().getTime() - runningTimer.startTime.getTime()) / 1000,
          ),
        )
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [runningTimer])

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
        setEntries(
          entries.map((e) => (e.id === entryWithUser.id ? entryWithUser : e)),
        )
        toast({
          title: t('toasts.entryUpdatedTitle') ?? '',
          description:
            t('toasts.entryUpdatedDescription', {
              location: entryWithUser.location,
            }) ?? '',
        })
      } else {
        const newId = await addTimeEntry(entryWithUser)
        const newEntry = { ...entryWithUser, id: newId }
        setEntries((prev) =>
          [newEntry, ...prev].sort(
            (a, b) => b.startTime.getTime() - a.startTime.getTime(),
          ),
        )
        toast({
          title: t('toasts.entryAddedTitle') ?? '',
          description:
            t('toasts.entryAddedDescription', {
              location: entryWithUser.location,
            }) ?? '',
        })
      }
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
      setEntries(entries.filter((entry) => entry.id !== id))
      toast({
        title: t('toasts.entryDeletedTitle') ?? '',
        variant: 'destructive',
      })
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
      setEntries([])
      if (runningTimer) {
        setRunningTimer(null)
        setLocation('')
        setElapsedTime(0)
      }
      toast({
        title: t('toasts.dataClearedTitle') ?? '',
        description: t('toasts.dataClearedDescription') ?? '',
      })
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
    setUserSettings(currentSettings)
    const isTimeOffInLieu = locationKey === 'TIME_OFF_IN_LIEU'
    const hours = isTimeOffInLieu ? 0 : currentSettings.defaultWorkHours || 7
    const startTime = set(selectedDate, {
      hours: 9,
      minutes: 0,
      seconds: 0,
      milliseconds: 0,
    })
    const endTime = hours > 0 ? addMinutes(startTime, hours * 60) : startTime
    const newEntry: Omit<TimeEntry, 'id' | 'userId'> = {
      location: locationKey,
      startTime: startTime,
      endTime: endTime,
      pauseDuration: 0,
      travelTime: 0,
      isDriver: false,
    }
    const entryExists = entries.some(
      (e) => isSameDay(e.startTime, selectedDate) && e.location === locationKey,
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
      const newId = await addTimeEntry(entryWithUser)
      const finalNewEntry = { ...entryWithUser, id: newId }
      setEntries((prev) =>
        [finalNewEntry, ...prev].sort(
          (a, b) => b.startTime.getTime() - a.startTime.getTime(),
        ),
      )
      toast({
        title: t('toasts.entryAddedTitle') ?? '',
        description:
          t('toasts.entryAddedDescription', {
            location: t(`special_locations.${locationKey}`),
          }) ?? '',
        className: 'bg-accent text-accent-foreground',
      })
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

  const handleSignOut = async () => {
    // This should be passed in as a callback if needed
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
        ? entries.filter((entry) => isSameDay(entry.startTime, selectedDate))
        : [],
    [entries, selectedDate],
  )

  const calculateTotalCompensatedMinutes = useCallback(
    (entriesToSum: TimeEntry[]): number => {
      return entriesToSum.reduce((total, entry) => {
        if (!entry.endTime) return total
        const workMinutes = differenceInMinutes(entry.endTime, entry.startTime)
        const isNonWorkEntry = ['SICK_LEAVE', 'PTO', 'BANK_HOLIDAY'].includes(
          entry.location,
        )
        if (isNonWorkEntry) {
          return total + workMinutes
        }
        if (entry.location === 'TIME_OFF_IN_LIEU') {
          return total
        }
        const travelMinutes = (entry.travelTime || 0) * 60
        const pauseMinutes = entry.pauseDuration || 0
        return total + workMinutes - pauseMinutes + travelMinutes
      }, 0)
    },
    [],
  )

  const { dailyTotal, weeklyTotal, monthlyTotal } = useMemo(() => {
    if (!selectedDate || !entries.length) {
      return { dailyTotal: 0, weeklyTotal: 0, monthlyTotal: 0 }
    }
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 })
    const monthStart = startOfMonth(selectedDate)
    const monthEnd = endOfMonth(selectedDate)
    const weekEntries = entries.filter((entry) =>
      isWithinInterval(entry.startTime, { start: weekStart, end: weekEnd }),
    )
    const monthEntries = entries.filter((entry) =>
      isWithinInterval(entry.startTime, { start: monthStart, end: monthEnd }),
    )
    return {
      dailyTotal: calculateTotalCompensatedMinutes(filteredEntries),
      weeklyTotal: calculateTotalCompensatedMinutes(weekEntries),
      monthlyTotal: calculateTotalCompensatedMinutes(monthEntries),
    }
  }, [entries, selectedDate, filteredEntries, calculateTotalCompensatedMinutes])

  const openNewEntryForm = useCallback(() => {
    setEditingEntry(null)
    setIsFormOpen(true)
  }, [])

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
    setUserSettings,
    handleStartTimer,
    handleStopTimer,
    handleSaveEntry,
    handleEditEntry,
    handleDeleteEntry,
    handleClearData,
    handleAddSpecialEntry,
    handleGetCurrentLocation,
    handleSignOut,
    handlePreviousDay,
    handleNextDay,
    filteredEntries,
    calculateTotalCompensatedMinutes,
    dailyTotal,
    weeklyTotal,
    monthlyTotal,
    openNewEntryForm,
  }
}
