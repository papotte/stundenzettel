'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { addMonths, isSameDay, isSameMonth, subMonths } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/use-auth'
import { useProjects } from '@/hooks/use-projects'
import { useToast } from '@/hooks/use-toast'
import { useUserSettings } from '@/hooks/use-user-settings'
import { isSpecialLocation } from '@/lib/constants'
import { useFormatter } from '@/lib/date-formatter'
import { exportToExcel } from '@/lib/excel-export'
import type { TimeEntry } from '@/lib/types'
import {
  compareEntriesByStartTime,
  getLocationDisplayName as getSpecialAwareDisplayName,
  isProjectTrackingMode,
} from '@/lib/utils'
import type { ProjectScope } from '@/services/project-service'
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

import { ExportPreviewActions } from './export-preview-actions'
import TimeEntryForm from './time-entry-form'
import TimesheetPreview from './timesheet-preview'

export default function ExportPreview() {
  const { user } = useAuth()
  const t = useTranslations()
  const format = useFormatter()
  const { toast } = useToast()
  const { data: userSettings, isPending: settingsPending } = useUserSettings()
  const isProjectMode = isProjectTrackingMode(userSettings)
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [entriesLoading, setEntriesLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState<Date>()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)
  const [newEntryDate, setNewEntryDate] = useState<Date | null>(null)
  const [userTeam, setUserTeam] = useState<{ id: string } | null>(null)
  const projectScope: ProjectScope | null = useMemo(() => {
    if (userTeam) return { kind: 'team', teamId: userTeam.id }
    if (user) return { kind: 'user', userId: user.uid }
    return null
  }, [userTeam, user])
  const { data: projects } = useProjects(
    projectScope,
    isProjectMode && projectScope != null,
  )
  const [publishedAt, setPublishedAt] = useState<Date | null | undefined>(
    undefined,
  )
  const [isPublishing, setIsPublishing] = useState(false)

  useEffect(() => {
    if (!user) {
      return
    }
    const fetchAndSetEntries = async () => {
      setEntriesLoading(true)
      try {
        const [fetchedEntries, team] = await Promise.all([
          getTimeEntries(user.uid),
          getUserTeam(user.uid),
        ])
        setEntries(fetchedEntries)
        setUserTeam(team)
      } catch (error) {
        console.error('Failed to load initial data from Firestore.', error)
      }
      setSelectedMonth(new Date())
      setEntriesLoading(false)
    }
    void fetchAndSetEntries()
  }, [user])

  const monthKey = selectedMonth
    ? format.dateTime(selectedMonth, 'yearMonthISO')
    : ''
  useEffect(() => {
    if (!user || !userTeam || !monthKey) {
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

  let effectivePublishedAt: Date | null | undefined = publishedAt
  if (!user || !userTeam || !monthKey) {
    effectivePublishedAt = userTeam ? null : undefined
  }

  // Only offer projects that actually have entries in the loaded month,
  // using the same matching rule as the export filter itself.
  const projectsWithEntries = useMemo(
    () =>
      (projects ?? []).filter((project) =>
        entries.some(
          (entry) =>
            !isSpecialLocation(entry.location) &&
            (entry.projectId
              ? entry.projectId === project.id
              : entry.location === project.name),
        ),
      ),
    [projects, entries],
  )

  const selectedFilterProject =
    projectFilter === 'all'
      ? undefined
      : projectsWithEntries.find((p) => p.id === projectFilter)

  const filteredEntries = useMemo(() => {
    if (projectFilter === 'all' || !selectedFilterProject) return entries
    return entries.filter((entry) => {
      // Special entries (sick leave, PTO, ...) are not project-bound and are
      // always included.
      if (isSpecialLocation(entry.location)) {
        return true
      }
      if (entry.projectId) {
        return entry.projectId === selectedFilterProject.id
      }
      // Legacy entries predate projectId; fall back to the stored name.
      return entry.location === selectedFilterProject.name
    })
  }, [entries, projectFilter, selectedFilterProject])

  const getEntriesForDay = useCallback(
    (day: Date) => {
      return filteredEntries
        .filter((entry) => entry.startTime && isSameDay(entry.startTime, day))
        .sort(compareEntriesByStartTime)
    },
    [filteredEntries],
  )

  const getLocationDisplayName = useCallback(
    (location: string) => getSpecialAwareDisplayName(location, t),
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
      entries: filteredEntries,
      getEntriesForDay,
      getLocationDisplayName,
      projectFilterName: selectedFilterProject?.name,
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

  const showSkeleton =
    !user ||
    entriesLoading ||
    settingsPending ||
    !selectedMonth ||
    !userSettings

  if (showSkeleton) {
    return (
      <Card className="shadow-lg">
        <CardContent className="p-4 sm:p-6">
          <div className="mb-6 flex flex-col items-center justify-between sm:flex-row print:hidden">
            <div className="flex items-center gap-4">
              <Skeleton className="size-10" />
              <Skeleton className="h-8 w-48" />
              <Skeleton className="size-10" />
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
                <ChevronLeft className="size-4" />
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
                <ChevronRight className="size-4" />
              </Button>
            </div>
            <div className="flex flex-col items-stretch gap-3 sm:items-end">
              {isProjectMode && projectsWithEntries.length > 0 && (
                <Select
                  value={selectedFilterProject?.id ?? 'all'}
                  onValueChange={setProjectFilter}
                >
                  <SelectTrigger
                    className="w-full sm:w-56"
                    data-testid="export-project-filter"
                    aria-label={t('export.filterByProject')}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t('export.allProjects')}
                    </SelectItem>
                    {projectsWithEntries.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <ExportPreviewActions
                onExport={handleExport}
                onPdfExport={handlePdfExport}
                onPublish={handlePublish}
                entries={filteredEntries}
                selectedMonth={selectedMonth}
                userTeam={userTeam}
                publishedAt={effectivePublishedAt}
                isPublishing={isPublishing}
                publishHint={
                  isProjectMode && projectFilter !== 'all'
                    ? t('export.publishScopeHint')
                    : null
                }
              />
            </div>
          </div>

          <TimesheetPreview
            selectedMonth={selectedMonth}
            user={user}
            entries={filteredEntries}
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
