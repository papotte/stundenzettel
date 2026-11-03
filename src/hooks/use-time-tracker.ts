import { useCallback, useEffect, useMemo, useState } from 'react'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

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

import { useGeolocationAddress } from '@/hooks/use-geolocation-address'
import { useProjectScope, useProjects } from '@/hooks/use-projects'
import { useToast } from '@/hooks/use-toast'
import { useUserSettings } from '@/hooks/use-user-settings'
import type { SpecialLocationKey } from '@/lib/constants'
import { useFormatter } from '@/lib/date-formatter'
import { queryKeys } from '@/lib/query-keys'
import {
  calculateTotalCompensatedMinutes,
  shiftEntryToDate,
} from '@/lib/time-utils'
import type { TimeEntry, UserSettings } from '@/lib/types'
import { isProjectTrackingMode } from '@/lib/utils'
import {
  addTimeEntry,
  deleteAllTimeEntries,
  deleteTimeEntry,
  getTimeEntries,
  updateTimeEntry,
} from '@/services/time-entry-service'
import { DEFAULT_USER_SETTINGS } from '@/services/user-settings-service'

/**
 * Time entries for a user, sorted by startTime desc by the Firestore query.
 */
export function useTimeEntries(userId: string | undefined) {
  const uid = userId ?? ''
  return useQuery({
    queryKey: queryKeys.timeEntries(uid),
    queryFn: () => getTimeEntries(uid),
    enabled: Boolean(uid),
  })
}

/** Invalidates the entries query and the export-preview bundle that embeds it. */
function useInvalidateTimeEntries(userId: string | undefined) {
  const queryClient = useQueryClient()
  const uid = userId ?? ''
  return async () => {
    if (!uid) return
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: queryKeys.timeEntries(uid),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.exportPreviewData(uid),
      }),
    ])
  }
}

export function useAddEntry(userId: string | undefined) {
  const invalidate = useInvalidateTimeEntries(userId)
  return useMutation({
    mutationFn: (entry: Omit<TimeEntry, 'id'>) => addTimeEntry(entry),
    onSuccess: invalidate,
  })
}

export function useUpdateEntry(userId: string | undefined) {
  const invalidate = useInvalidateTimeEntries(userId)
  return useMutation({
    mutationFn: ({
      entryId,
      entry,
    }: {
      entryId: string
      entry: Partial<TimeEntry>
    }) => updateTimeEntry(entryId, entry),
    onSuccess: invalidate,
  })
}

export function useDeleteEntry(userId: string | undefined) {
  const invalidate = useInvalidateTimeEntries(userId)
  return useMutation({
    mutationFn: (entryId: string) => {
      if (!userId) throw new Error('User not authenticated')
      return deleteTimeEntry(userId, entryId)
    },
    onSuccess: invalidate,
  })
}

export function useClearEntries(userId: string | undefined) {
  const invalidate = useInvalidateTimeEntries(userId)
  return useMutation({
    mutationFn: () => {
      if (!userId) throw new Error('User not authenticated')
      return deleteAllTimeEntries(userId)
    },
    onSuccess: invalidate,
  })
}

/** Copies a batch of entries (already shifted to the target date). */
export function useCopyEntries(userId: string | undefined) {
  const invalidate = useInvalidateTimeEntries(userId)
  return useMutation({
    mutationFn: (newEntries: Array<Omit<TimeEntry, 'id'>>) =>
      Promise.all(newEntries.map((entry) => addTimeEntry(entry))),
    onSuccess: invalidate,
  })
}

export function useTimeTracker(user: { uid: string } | null) {
  const { userSettings: settingsFromQuery } = useUserSettings(user)
  const { toast } = useToast()
  const t = useTranslations()
  const format = useFormatter().dateTime

  const uid = user?.uid
  const {
    data: entriesData,
    isLoading,
    error: entriesError,
  } = useTimeEntries(uid)
  const entries = useMemo(() => entriesData ?? [], [entriesData])

  const addEntryMutation = useAddEntry(uid)
  const updateEntryMutation = useUpdateEntry(uid)
  const deleteEntryMutation = useDeleteEntry(uid)
  const clearEntriesMutation = useClearEntries(uid)
  const copyEntriesMutation = useCopyEntries(uid)

  const [runningTimer, setRunningTimer] = useState<TimeEntry | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [location, setLocation] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  )
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date())
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)
  const {
    fetchCurrentLocationAddress: handleGetCurrentLocation,
    isFetchingLocation,
  } = useGeolocationAddress(setLocation)

  const userSettings: UserSettings | null =
    settingsFromQuery ?? DEFAULT_USER_SETTINGS
  const isProjectMode = isProjectTrackingMode(userSettings)
  const { data: projectScopeResult, isPending: scopePending } =
    useProjectScope()
  const projectScope = projectScopeResult?.scope ?? null
  const { data: projects, isPending: projectsPending } = useProjects(
    projectScope,
    isProjectMode,
  )

  useEffect(() => {
    if (entriesError) {
      console.error('Error fetching initial data:', entriesError)
      toast({
        title: t('toasts.databaseErrorTitle') ?? '',
        description: t('toasts.databaseConnectionError') ?? '',
        variant: 'destructive',
      })
    }
  }, [entriesError, t, toast])

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

  const handleStartTimer = () => {
    if (!user) return
    if (!location) {
      toast({
        title:
          t(
            isProjectMode
              ? 'toasts.projectRequiredTitle'
              : 'toasts.locationRequiredTitle',
          ) ?? '',
        description:
          t(
            isProjectMode
              ? 'toasts.projectRequiredDescription'
              : 'toasts.locationRequiredDescription',
          ) ?? '',
        variant: 'destructive',
      })
      return
    }
    const newTimer: TimeEntry = {
      id: Date.now().toString(),
      userId: user.uid,
      startTime: new Date(),
      location,
      ...(isProjectMode && selectedProjectId
        ? { projectId: selectedProjectId }
        : {}),
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
      setSelectedProjectId(null)
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
        await updateEntryMutation.mutateAsync({
          entryId: entryWithUser.id,
          entry: entryWithUser,
        })
        toast({
          title: t('toasts.entryUpdatedTitle') ?? '',
          description:
            t('toasts.entryUpdatedDescription', {
              location: entryWithUser.location,
            }) ?? '',
        })
      } else {
        await addEntryMutation.mutateAsync(entryWithUser)
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
      await deleteEntryMutation.mutateAsync(id)
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
      await clearEntriesMutation.mutateAsync()
      if (runningTimer) {
        setRunningTimer(null)
        setLocation('')
        setSelectedProjectId(null)
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
    if (!selectedDate || !user || !userSettings) return
    const isTimeOffInLieu = locationKey === 'TIME_OFF_IN_LIEU'
    const hours = isTimeOffInLieu ? 0 : userSettings.defaultWorkHours || 7
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
      await addEntryMutation.mutateAsync(entryWithUser)
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

  const handleCopyFromYesterday = async () => {
    if (!user || !selectedDate) return
    if (!isSameDay(selectedDate, new Date())) return
    const yesterday = subDays(selectedDate, 1)
    const yesterdayEntries = entries.filter(
      (e) => e.startTime && isSameDay(e.startTime, yesterday),
    )
    if (yesterdayEntries.length === 0) return
    try {
      const newEntries = yesterdayEntries.map((entry) => ({
        ...shiftEntryToDate(entry, selectedDate),
        userId: user.uid,
      }))
      await copyEntriesMutation.mutateAsync(newEntries)
      toast({
        title: t('toasts.entriesCopiedFromYesterdayTitle') ?? '',
        description:
          t('toasts.entriesCopiedFromYesterdayDescription', {
            count: newEntries.length,
          }) ?? '',
      })
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
      await copyEntriesMutation.mutateAsync([withUser])
      toast({
        title: t('toasts.entryCopiedTitle') ?? '',
        description:
          t('toasts.entryCopiedDescription', {
            location: entry.location,
          }) ?? '',
      })
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
      const newEntries = dayEntries.map((entry) => ({
        ...shiftEntryToDate(entry, targetDate),
        userId: user.uid,
      }))
      await copyEntriesMutation.mutateAsync(newEntries)
      toast({
        title: t('toasts.entriesCopiedToTitle') ?? '',
        description:
          t('toasts.entriesCopiedToDescription', {
            count: newEntries.length,
            date: format(targetDate, 'long'),
          }) ?? '',
      })
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
    selectedProjectId,
    setSelectedProjectId,
    isProjectMode,
    projects: projects ?? [],
    projectScope,
    isProjectsPending: isProjectMode && (scopePending || projectsPending),
    selectedDate,
    setSelectedDate,
    isFormOpen,
    setIsFormOpen,
    editingEntry,
    setEditingEntry,
    isFetchingLocation,
    userSettings,
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
