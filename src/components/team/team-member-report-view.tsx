'use client'

import { useCallback, useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'

import { isSameDay } from 'date-fns'
import { Download, Printer } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useMemberDisplayNames } from '@/hooks/use-member-display-names'
import { SPECIAL_LOCATION_KEYS, SpecialLocationKey } from '@/lib/constants'
import { useFormatter } from '@/lib/date-formatter'
import { exportToExcel } from '@/lib/excel-export'
import { queryKeys } from '@/lib/query-keys'
import { compareEntriesByStartTime, maskEmail } from '@/lib/utils'
import { getPublishedMonth } from '@/services/published-export-service'

import TimesheetPreview from '../timesheet-preview'

interface TeamMemberReportViewProps {
  teamId: string | null
  memberId: string
  memberEmail: string
  selectedMonth: Date
}

export function TeamMemberReportView({
  teamId,
  memberId,
  memberEmail,
  selectedMonth,
}: TeamMemberReportViewProps) {
  const t = useTranslations()
  const format = useFormatter()
  const { displayNames } = useMemberDisplayNames([memberId])

  const monthKey = format.dateTime(selectedMonth, 'yearMonthISO')

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.publishedMonth(teamId ?? '', memberId, monthKey),
    queryFn: () => getPublishedMonth(teamId!, memberId, monthKey),
    enabled: Boolean(teamId),
  })

  const notPublished = !data
  const entries = useMemo(() => data?.entries ?? [], [data?.entries])
  const userSettings = data?.userSettings ?? null

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
    const monthStr = format.dateTime(selectedMonth, 'yearMonthISO')
    const url = `/team/reports/${memberId}?month=${monthStr}&email=${encodeURIComponent(memberEmail)}`
    window.open(url, '_blank')
  }

  const handleExport = async () => {
    if (!selectedMonth || !userSettings) return

    const displayName =
      displayNames.get(memberId) ||
      (userSettings.displayName ?? '').trim() ||
      memberEmail
    const mockUser = {
      uid: memberId,
      email: memberEmail,
      displayName,
    }

    await exportToExcel({
      selectedMonth,
      user: mockUser,
      userSettings,
      entries,
      getEntriesForDay,
      getLocationDisplayName,
      t,
      format,
    })
  }

  const handleEditEntry = useCallback(() => {}, [])
  const handleAddNewEntry = useCallback(() => {}, [])

  if (isLoading) {
    return (
      <div
        className="bg-white print:border-none print:shadow-none"
        data-testid="member-report-view-card"
      >
        <div className="p-4 sm:p-6">
          <div className="mb-6 flex flex-col items-center justify-end sm:flex-row print:hidden">
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
        </div>
      </div>
    )
  }

  if (notPublished || !userSettings) {
    return (
      <div
        className="bg-white p-6 print:border-none print:shadow-none"
        data-testid="member-report-view-card"
      >
        <p className="text-muted-foreground text-center">
          {t('reports.notPublishedDetail')}
        </p>
      </div>
    )
  }

  const email = maskEmail(memberEmail)
  const displayName =
    displayNames.get(memberId) ||
    (userSettings.displayName ?? '').trim() ||
    email ||
    memberEmail
  const mockUser = {
    uid: memberId,
    email,
    displayName,
  }

  return (
    <TooltipProvider>
      <div
        className="bg-white print:border-none print:shadow-none"
        data-testid="member-report-view-card"
      >
        <div className="p-4 sm:p-6 print:p-0">
          <div className="mb-6 flex flex-col items-center justify-end sm:flex-row print:hidden">
            <div className="mt-4 flex flex-col items-center gap-2 sm:mt-0 md:flex-row">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      onClick={handleExport}
                      data-testid="member-report-export-button"
                      disabled={entries.length === 0}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {t('export.exportButton')}
                    </Button>
                  </span>
                </TooltipTrigger>
                {entries.length === 0 && (
                  <TooltipContent side="top">
                    {t('export.noDataHint', {
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
                      data-testid="member-report-pdf-button"
                      disabled={entries.length === 0}
                    >
                      <Printer className="mr-2 h-4 w-4" />
                      {t('export.exportPdfButton')}
                    </Button>
                  </span>
                </TooltipTrigger>
                {entries.length === 0 && (
                  <TooltipContent side="top">
                    {t('export.noDataHint', {
                      defaultValue:
                        'No data available for export in this month.',
                    })}
                  </TooltipContent>
                )}
              </Tooltip>
            </div>
          </div>

          <div className="[&_.printable-area]:rounded-none [&_.printable-area]:shadow-none [&_.printable-area]:p-0">
            <TimesheetPreview
              selectedMonth={selectedMonth}
              user={mockUser}
              entries={entries}
              userSettings={userSettings}
              getEntriesForDay={getEntriesForDay}
              getLocationDisplayName={getLocationDisplayName}
              onEdit={handleEditEntry}
              onAdd={handleAddNewEntry}
              readOnly={true}
            />
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
