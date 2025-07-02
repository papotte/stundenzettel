'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  addMonths,
  subMonths,
  format,
  isSameMonth,
  isSameDay,
  differenceInMinutes,
} from 'date-fns'
import { de, enUS } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, Download, Printer } from 'lucide-react'
import type { TimeEntry, UserSettings } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'
import {
  getTimeEntries,
  updateTimeEntry,
  addTimeEntry,
} from '@/services/time-entry-service'
import { useAuth } from '@/hooks/use-auth'
import { useTranslation } from '@/context/i18n-context'
import { SPECIAL_LOCATION_KEYS } from '@/lib/constants'
import TimesheetPreview from './timesheet-preview'
import { getUserSettings } from '@/services/user-settings-service'
import { exportToExcel } from '@/lib/excel-export'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import TimeEntryForm from './time-entry-form'
import { useToast } from '@/hooks/use-toast'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip'

export default function ExportPreview() {
  const { user } = useAuth()
  const { t, language } = useTranslation()
  const { toast } = useToast()
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState<Date>()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)
  const [newEntryDate, setNewEntryDate] = useState<Date | null>(null)

  const locale = useMemo(() => (language === 'de' ? de : enUS), [language])

  useEffect(() => {
    if (!user) return
    const fetchAndSetEntries = async () => {
      setIsLoading(true)
      try {
        const [fetchedEntries, settings] = await Promise.all([
          getTimeEntries(user.uid),
          getUserSettings(user.uid),
        ])
        setEntries(fetchedEntries)
        setUserSettings(settings)
      } catch (error) {
        console.error('Failed to load initial data from Firestore.', error)
      }
      setSelectedMonth(new Date())
      setIsLoading(false)
    }
    fetchAndSetEntries()
  }, [user])

  const getEntriesForDay = useCallback(
    (day: Date) => {
      return entries
        .filter((entry) => entry.startTime && isSameDay(entry.startTime, day))
        .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
    },
    [entries],
  )

  const calculateWeekTotal = useCallback(
    (week: Date[]) => {
      if (!selectedMonth) return 0
      let totalMinutes = 0
      week.forEach((day) => {
        if (isSameMonth(day, selectedMonth)) {
          getEntriesForDay(day).forEach((entry) => {
            if (entry.endTime) {
              const workMinutes = differenceInMinutes(
                entry.endTime,
                entry.startTime,
              )
              const isCompensatedSpecialDay = [
                'SICK_LEAVE',
                'PTO',
                'BANK_HOLIDAY',
              ].includes(entry.location)

              if (isCompensatedSpecialDay) {
                totalMinutes += workMinutes
              } else if (entry.location !== 'TIME_OFF_IN_LIEU') {
                const compensatedMinutes =
                  workMinutes -
                  (entry.pauseDuration || 0) +
                  (entry.travelTime || 0) * 60
                totalMinutes += compensatedMinutes > 0 ? compensatedMinutes : 0
              }
            }
          })
        }
      })
      return totalMinutes / 60
    },
    [selectedMonth, getEntriesForDay],
  )

  const getLocationDisplayName = useCallback(
    (location: string) => {
      if (SPECIAL_LOCATION_KEYS.includes(location as any)) {
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
      t,
      locale,
      getEntriesForDay,
      calculateWeekTotal,
      getLocationDisplayName,
    })
  }

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
            [newEntry, ...prev].sort(
              (a, b) => b.startTime.getTime() - a.startTime.getTime(),
            ),
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
          <div className="mb-6 flex flex-col items-center justify-between sm:flex-row print:hidden">
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
                {format(selectedMonth, 'MMMM yyyy', { locale })}
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
            <div className="mt-4 flex items-center gap-2 sm:mt-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      onClick={handleExport}
                      data-testid="export-preview-export-button"
                      disabled={entries.length === 0}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {t('export_preview.exportButton')}
                    </Button>
                  </span>
                </TooltipTrigger>
                {entries.length === 0 && (
                  <TooltipContent side="top">
                    {t('export_preview.noDataHint', {
                      defaultValue:
                        'No data available for export in this month.',
                    })}
                  </TooltipContent>
                )}
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      onClick={handlePdfExport}
                      variant="outline"
                      data-testid="export-preview-pdf-button"
                      disabled={entries.length === 0}
                    >
                      <Printer className="mr-2 h-4 w-4" />
                      {t('export_preview.exportPdfButton')}
                    </Button>
                  </span>
                </TooltipTrigger>
                {entries.length === 0 && (
                  <TooltipContent side="top">
                    {t('export_preview.noDataHint', {
                      defaultValue:
                        'No data available for export in this month.',
                    })}
                  </TooltipContent>
                )}
              </Tooltip>
            </div>
          </div>

          <TimesheetPreview
            selectedMonth={selectedMonth}
            user={user}
            entries={entries}
            t={t}
            locale={locale}
            userSettings={userSettings}
            getEntriesForDay={getEntriesForDay}
            calculateWeekTotal={calculateWeekTotal}
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
