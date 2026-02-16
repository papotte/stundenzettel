'use client'

import { useCallback, useEffect, useState } from 'react'

import { addMonths, isSameDay, isSameMonth, subMonths } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { SPECIAL_LOCATION_KEYS, SpecialLocationKey } from '@/lib/constants'
import { useFormatter } from '@/lib/date-formatter'
import { exportToExcel } from '@/lib/excel-export'
import type { TimeEntry, UserSettings } from '@/lib/types'
import { compareEntriesByStartTime } from '@/lib/utils'
import {
  getPublishedMonth,
  publishMonthForTeam,
} from '@/services/published-export-service'
import { getUserTeam } from '@/services/team-service'
import {
  addTimeEntry,
  getTimeEntries,
  updateTimeEntry,
} from '@/services/time-entry-service'
import { getUserSettings } from '@/services/user-settings-service'

import { ExportPreviewActions } from './export-preview-actions'
import TimeEntryForm from './time-entry-form'
import TimesheetPreview from './timesheet-preview'

export default function ExportPreview() {
  const { user } = useAuth()
  const t = useTranslations()
  const format = useFormatter()
  const { toast } = useToast()
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState<Date>()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)
  const [newEntryDate, setNewEntryDate] = useState<Date | null>(null)
  const [userTeam, setUserTeam] = useState<{ id: string } | null>(null)
  const [publishedAt, setPublishedAt] = useState<Date | null | undefined>(
    undefined,
  )
  const [isPublishing, setIsPublishing] = useState(false)

  useEffect(() => {
    if (!user) return
    const fetchAndSetEntries = async () => {
      setIsLoading(true)
      try {
        const [fetchedEntries, settings, team] = await Promise.all([
          getTimeEntries(user.uid),
          getUserSettings(user.uid),
          getUserTeam(user.uid),
        ])
        setEntries(fetchedEntries)
        setUserSettings(settings)
        setUserTeam(team)
      } catch (error) {
        console.error('Failed to load initial data from Firestore.', error)
      }
      setSelectedMonth(new Date())
      setIsLoading(false)
    }
    fetchAndSetEntries()
  }, [user])

  const monthKey = selectedMonth
    ? format.dateTime(selectedMonth, 'yearMonthISO')
    : ''
  useEffect(() => {
    if (!user || !userTeam || !monthKey) {
      setPublishedAt(userTeam ? null : undefined)
      return
    }
    let cancelled = false
    getPublishedMonth(userTeam.id, user.uid, monthKey).then((data) => {
      if (!cancelled) setPublishedAt(data?.publishedAt ?? null)
    })
    return () => {
      cancelled = true
    }
  }, [user, userTeam, monthKey])

  const getEntriesForDay = useCallback(
    (day: Date) => {
      return entries
        .filter((entry) => entry.startTime && isSameDay(entry.startTime, day))
        .sort(compareEntriesByStartTime)
    },
    [entries],
  )

  const getLocationDisplayName = useCallback(
    (location: string) => {
      if (SPECIAL_LOCATION_KEYS.includes(location as SpecialLocationKey)) {
        return t(`special_locations.${location}`)
      }
      return location
    },
    [t],
  )

  const handlePdfExport = () => {
    window.print()
  }

  const handleExport = async () => {
    if (!selectedMonth || !userSettings) return

    await exportToExcel({
      selectedMonth,
      user,
      userSettings,
      entries,
      getEntriesForDay,
      getLocationDisplayName,
      t,
      format,
    })
  }

  const handlePublish = useCallback(async () => {
    if (!user || !userTeam || !userSettings || !selectedMonth) return
    const monthKeyPublish = format.dateTime(selectedMonth, 'yearMonthISO')
    const entriesForMonth = entries.filter(
      (e) => e.startTime && isSameMonth(e.startTime, selectedMonth),
    )
    setIsPublishing(true)
    try {
      await publishMonthForTeam(
        userTeam.id,
        user.uid,
        monthKeyPublish,
        entriesForMonth,
        userSettings,
      )
      setPublishedAt(new Date())
      toast({
        title: t('export.publishSuccess'),
      })
    } catch (error) {
      console.error('Failed to publish month:', error)
      toast({
        title: t('common.error'),
        description: t('toasts.saveFailedDescription'),
        variant: 'destructive',
      })
    } finally {
      setIsPublishing(false)
    }
  }, [user, userTeam, userSettings, selectedMonth, entries, format, t, toast])

  const handleEditEntry = useCallback((entry: TimeEntry) => {
    setEditingEntry(entry)
    setNewEntryDate(null)
    setIsFormOpen(true)
  }, [])

  const handleAddNewEntry = useCallback((date: Date) => {
    setEditingEntry(null)
    setNewEntryDate(date)
    setIsFormOpen(true)
  }, [])

  const handleSaveEntry = useCallback(
    async (entryData: Omit<TimeEntry, 'userId'>) => {
      if (!user) return
      const entryWithUser = { ...entryData, userId: user.uid }

      setIsFormOpen(false)
      setEditingEntry(null)
      setNewEntryDate(null)

      try {
        const existingEntry = entries.find((e) => e.id === entryWithUser.id)
        if (existingEntry) {
          await updateTimeEntry(entryWithUser.id, entryWithUser)
          setEntries(
            entries.map((e) => (e.id === entryWithUser.id ? entryWithUser : e)),
          )
          toast({
            title: t('toasts.entryUpdatedTitle'),
            description: t('toasts.entryUpdatedDescription', {
              location: entryWithUser.location,
            }),
          })
        } else {
          const newId = await addTimeEntry(entryWithUser)
          const newEntry = { ...entryWithUser, id: newId }
          setEntries((prev) =>
            [newEntry, ...prev].sort((a, b) => compareEntriesByStartTime(b, a)),
          )
          toast({
            title: t('toasts.entryAddedTitle'),
            description: t('toasts.entryAddedDescription', {
              location: entryWithUser.location,
            }),
          })
        }
      } catch (error) {
        console.error('Error saving entry:', error)
        toast({
          title: t('toasts.saveFailedTitle'),
          description: t('toasts.saveFailedDescription'),
          variant: 'destructive',
        })
      }
    },
    [user, entries, t, toast],
  )

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingEntry(null)
    setNewEntryDate(null)
  }

  if (isLoading || !selectedMonth || !userSettings) {
    return (
      <Card className="shadow-lg">
        <CardContent className="p-4 sm:p-6">
          <div className="mb-6 flex flex-col items-center justify-between sm:flex-row print:hidden">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10" />
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-10 w-10" />
            </div>
            <Skeleton className="h-10 w-36" />
          </div>
          <div className="printable-area rounded-md bg-white p-8 shadow-md">
            <header className="mb-4 flex items-start justify-between">
              <Skeleton className="h-7 w-2/5" />
              <Skeleton className="h-7 w-1/4" />
            </header>
            <main>
              <div className="space-y-6">
                <Skeleton className="h-56 w-full" />
                <Skeleton className="h-56 w-full" />
              </div>
            </main>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card
        className="shadow-lg print:border-none print:shadow-none"
        data-testid="export-preview-card"
      >
        <CardContent className="p-4 sm:p-6 print:p-0">
          <div className="mb-6 flex flex-col items-start justify-between sm:flex-row print:hidden">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}
                data-testid="export-preview-previous-month-button"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2
                className="text-2xl font-bold"
                data-testid="export-preview-month"
              >
                {format.dateTime(selectedMonth, 'monthYear')}
              </h2>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
                data-testid="export-preview-next-month-button"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <ExportPreviewActions
              onExport={handleExport}
              onPdfExport={handlePdfExport}
              onPublish={handlePublish}
              entries={entries}
              selectedMonth={selectedMonth}
              userTeam={userTeam}
              publishedAt={publishedAt}
              isPublishing={isPublishing}
            />
          </div>

          <TimesheetPreview
            selectedMonth={selectedMonth}
            user={user}
            entries={entries}
            userSettings={userSettings}
            getEntriesForDay={getEntriesForDay}
            getLocationDisplayName={getLocationDisplayName}
            onEdit={handleEditEntry}
            onAdd={handleAddNewEntry}
          />
        </CardContent>
      </Card>

      <Sheet
        open={isFormOpen}
        onOpenChange={(open) => !open && handleCloseForm()}
      >
        <SheetContent className="flex w-full max-w-none flex-col sm:max-w-md">
          {userSettings && isFormOpen && (
            <TimeEntryForm
              entry={editingEntry}
              selectedDate={editingEntry?.startTime || newEntryDate!}
              onSave={handleSaveEntry}
              onClose={handleCloseForm}
              userSettings={userSettings}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
