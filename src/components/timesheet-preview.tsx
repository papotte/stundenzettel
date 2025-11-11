'use client'

import React, { useCallback, useMemo } from 'react'

import { differenceInMinutes, getDay, isSameMonth } from 'date-fns'
import { Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useFormatter } from '@/lib/date-formatter'
import { calculateWeekCompensatedTime } from '@/lib/time-utils'
import type { AuthenticatedUser, TimeEntry, UserSettings } from '@/lib/types'
import { formatDecimalHours, getWeeksForMonth } from '@/lib/utils'

import TimesheetHeader from './timesheet-header'
import TimesheetPreviewTotals from './timesheet-preview-totals'

interface TimesheetPreviewProps {
  selectedMonth: Date
  user: AuthenticatedUser | null
  entries: TimeEntry[]
  userSettings: UserSettings | null
  getEntriesForDay: (day: Date) => TimeEntry[]
  getLocationDisplayName: (location: string) => string
  onEdit: (entry: TimeEntry) => void
  onAdd: (date: Date) => void
  visibleColumns?: {
    includeLocation?: boolean
    includePauseDuration?: boolean
    includeDrivingTime?: boolean
    includeMileage?: boolean
  }
}

// Helper for passenger time (local, not imported)
function sumPassengerTime(entries: TimeEntry[]): number {
  return entries.reduce(
    (acc, entry) => acc + (entry.passengerTimeHours || 0),
    0,
  )
}

export default function TimesheetPreview({
  selectedMonth,
  user,
  userSettings,
  getEntriesForDay,
  getLocationDisplayName,
  onEdit,
  onAdd,
  visibleColumns,
}: TimesheetPreviewProps) {
  const t = useTranslations()
  const format = useFormatter()

  const showLocation = visibleColumns?.includeLocation ?? true
  const showPause = visibleColumns?.includePauseDuration ?? true
  const showDriving = visibleColumns?.includeDrivingTime ?? true
  const showMileage = visibleColumns?.includeMileage ?? true

  const weeksInMonth = useMemo(
    () => getWeeksForMonth(selectedMonth),
    [selectedMonth],
  )

  const weekHasEntries = useCallback(
    (week: Date[]): boolean => {
      return week.some((day) => {
        const isWorkingDay = getDay(day) !== 0
        return isSameMonth(day, selectedMonth) && isWorkingDay
      })
    },
    [selectedMonth],
  )

  const relevantWeeks = useMemo(
    () => weeksInMonth.filter(weekHasEntries),
    [weeksInMonth, weekHasEntries],
  )

  return (
    <div
      className="printable-area rounded-md bg-white p-8 font-body shadow-md print:p-2 print:text-xs print:shadow-none"
      data-testid="timesheet-preview"
    >
      <div id="pdf-header-section">
        <TimesheetHeader userSettings={userSettings} />
        <header
          className="mb-4 flex items-start justify-between print:mb-2"
          data-testid="timesheet-title"
        >
          <h1 className="text-xl font-bold print:text-base">
            {t('export.timesheetTitle', {
              month: format.dateTime(selectedMonth, 'month'),
            })}
          </h1>
          <div className="text-right font-semibold print:text-sm">
            {
              (userSettings?.displayName?.trim() ||
                user?.displayName ||
                user?.email) as string
            }
          </div>
        </header>
      </div>

      <main id="pdf-main-section">
        {relevantWeeks.map((week: Date[], weekIndex: number) => {
          // At the end of each week, add a totals row styled as in the screenshot
          const weekEntries = week.flatMap(getEntriesForDay)
          // Use the shared utility for compensated week total
          const weekCompTotal = calculateWeekCompensatedTime(
            week,
            getEntriesForDay,
            userSettings,
            selectedMonth,
          )
          const weekPassengerTotal = sumPassengerTime(weekEntries)
          return (
            <div
              key={weekIndex}
              className="mb-6 print:mb-3"
              data-testid={`timesheet-week-${weekIndex}`}
            >
              <Table className="border-collapse border border-black">
                <TableHeader>
                  <TableRow className="border-b-0 border-black bg-table-header text-left text-black hover:bg-table-header">
                    <TableHead
                      rowSpan={2}
                      className="w-[5%] border-r border-black align-middle print:h-auto print:p-1"
                    >
                      {t('export.headerWeek')}
                    </TableHead>
                    <TableHead
                      rowSpan={2}
                      className="w-[8%] border-r border-black align-middle print:h-auto print:p-1"
                    >
                      {t('export.headerDate')}
                    </TableHead>
                    {showLocation && (
                      <TableHead
                        rowSpan={2}
                        className="w-auto border-r border-black text-left print:h-auto print:p-1"
                      >
                        {t('export.headerLocation')}
                      </TableHead>
                    )}
                    <TableHead
                      colSpan={2}
                      className="w-[18%] border-b border-black print:h-auto print:p-1"
                    >
                      {t('export.headerWorkTime')}
                    </TableHead>
                    {showPause && (
                      <TableHead
                        rowSpan={2}
                        className="w-[8%] border-l border-r border-black align-middle print:h-auto print:p-1"
                      >
                        {t('export.headerPauseDuration')}
                      </TableHead>
                    )}
                    {showDriving && (
                      <TableHead
                        rowSpan={2}
                        className="w-[8%] border-r border-black align-middle print:h-auto print:p-1"
                      >
                        {t('export.headerDriverTime')}
                      </TableHead>
                    )}
                    <TableHead
                      rowSpan={2}
                      className="w-[8%] border-r border-black align-middle print:h-auto print:p-1"
                    >
                      {t('export.headerCompensatedTime')}
                    </TableHead>
                    {showDriving && (
                      <TableHead
                        rowSpan={2}
                        className="w-[8%] border-r border-black align-middle print:h-auto print:p-1"
                      >
                        {t('export.headerPassengerTime')}
                      </TableHead>
                    )}
                    {showMileage && (
                      <TableHead
                        rowSpan={2}
                        className="w-[8%] align-middle print:h-auto print:p-1"
                      >
                        {t('export.headerMileage')}
                      </TableHead>
                    )}
                  </TableRow>
                  <TableRow className="border-b border-black bg-table-header text-black hover:bg-table-header">
                    <TableHead className="border-r-0 print:h-auto print:p-1">
                      {t('export.headerFrom')}
                    </TableHead>
                    <TableHead className="print:h-auto print:p-1">
                      {t('export.headerTo')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {week.map((day: Date) => {
                    if (!isSameMonth(day, selectedMonth)) {
                      return null
                    }

                    const dayTestId = `timesheet-day-${format.dateTime(day, 'intl')}`
                    const dayEntries = getEntriesForDay(day)
                    const isSunday = getDay(day) === 0

                    if (dayEntries.length === 0) {
                      if (isSunday) return null // Don't render empty Sundays
                      return (
                        <TableRow
                          key={day.toISOString()}
                          className="border-b border-black last:border-b-0"
                          data-testid={dayTestId}
                        >
                          <TableCell className="border-r border-black bg-table-header text-left font-medium print:p-1">
                            {format.dateTime(day, 'weekday')}
                          </TableCell>
                          <TableCell className="group relative cursor-default border-r border-black text-right align-middle print:p-1">
                            {format.dateTime(day, 'short')}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute right-0.5 top-1/2 h-7 w-7 -translate-y-1/2 opacity-0 focus-visible:opacity-100 group-hover:opacity-100 print:hidden"
                              onClick={() => onAdd(day)}
                            >
                              <Plus className="h-4 w-4" />
                              <span className="sr-only">Add entry</span>
                            </Button>
                          </TableCell>
                          {showLocation && (
                            <TableCell className="border-r border-black text-left text-muted-foreground print:p-1"></TableCell>
                          )}
                          <TableCell className="text-right print:p-1"></TableCell>
                          <TableCell className="text-right print:p-1"></TableCell>
                          {showPause && (
                            <TableCell className="border-l border-r border-black text-right print:p-1"></TableCell>
                          )}
                          {showDriving && (
                            <TableCell className="border-r border-black text-right print:p-1"></TableCell>
                          )}
                          <TableCell className="border-r border-black text-right print:p-1"></TableCell>
                          {showDriving && (
                            <TableCell className="border-r border-black text-right print:p-1"></TableCell>
                          )}
                          {showMileage && (
                            <TableCell className="text-right print:p-1"></TableCell>
                          )}
                        </TableRow>
                      )
                    }

                    return dayEntries.map((entry, entryIndex) => {
                      let compensatedHours = 0
                      let fromValue = ''
                      let toValue = ''
                      if (typeof entry.durationMinutes === 'number') {
                        compensatedHours = entry.durationMinutes / 60
                        fromValue = t('time_entry_form.durationLabel')
                        toValue = `${entry.durationMinutes} min`
                      } else if (entry.endTime) {
                        const workDuration = differenceInMinutes(
                          entry.endTime,
                          entry.startTime!,
                        )
                        const isCompensatedSpecialDay = [
                          'SICK_LEAVE',
                          'PTO',
                          'BANK_HOLIDAY',
                        ].includes(entry.location)
                        if (isCompensatedSpecialDay) {
                          compensatedHours = workDuration / 60
                        } else if (entry.location !== 'TIME_OFF_IN_LIEU') {
                          // Compensated time: work - pause + driver time (with compensation percent)
                          const compensatedMinutes =
                            workDuration -
                            (entry.pauseDuration || 0) +
                            ((entry.driverTimeHours || 0) *
                              60 *
                              (userSettings?.driverCompensationPercent ??
                                100)) /
                              100
                          compensatedHours =
                            compensatedMinutes > 0 ? compensatedMinutes / 60 : 0
                        }
                        fromValue = entry.startTime
                          ? format.dateTime(entry.startTime, 'shortTime')
                          : ''
                        toValue = entry.endTime
                          ? format.dateTime(entry.endTime, 'shortTime')
                          : ''
                      }

                      return (
                        <TableRow
                          key={entry.id}
                          className="cursor-pointer border-b border-black last:border-b-0 hover:bg-muted/50"
                          onClick={() => onEdit(entry)}
                          data-testid={dayTestId}
                        >
                          {entryIndex === 0 && (
                            <TableCell
                              onClick={(e) => e.stopPropagation()}
                              rowSpan={dayEntries.length}
                              className="cursor-default border-r border-black bg-table-header text-left align-middle font-medium print:p-1"
                            >
                              {format.dateTime(day, 'weekday')}
                            </TableCell>
                          )}
                          {entryIndex === 0 && (
                            <TableCell
                              onClick={(e) => e.stopPropagation()}
                              rowSpan={dayEntries.length}
                              className="group relative cursor-default border-r border-black text-right align-middle print:p-1"
                            >
                              {format.dateTime(day, 'short')}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-0.5 top-1/2 h-7 w-7 -translate-y-1/2 opacity-0 focus-visible:opacity-100 group-hover:opacity-100 print:hidden"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onAdd(day)
                                }}
                              >
                                <Plus className="h-4 w-4" />
                                <span className="sr-only">Add entry</span>
                              </Button>
                            </TableCell>
                          )}
                          {showLocation && (
                            <TableCell className="border-r border-black text-left print:p-1">
                              {getLocationDisplayName(entry.location)}
                            </TableCell>
                          )}
                          <TableCell className="text-right print:p-1">
                            {/* For duration-only entries, leave blank */}
                            {typeof entry.durationMinutes === 'number'
                              ? ''
                              : fromValue}
                          </TableCell>
                          <TableCell className="text-right print:p-1">
                            {/* For duration-only entries, leave blank */}
                            {typeof entry.durationMinutes === 'number'
                              ? ''
                              : toValue}
                          </TableCell>
                          {showPause && (
                            <TableCell className="border-l border-r border-black text-right print:p-1">
                              {entry.pauseDuration && entry.pauseDuration !== 0
                                ? formatDecimalHours(entry.pauseDuration)
                                : ''}
                            </TableCell>
                          )}
                          {showDriving && (
                            <TableCell className="border-r border-black text-right print:p-1">
                              {entry.driverTimeHours &&
                              entry.driverTimeHours !== 0
                                ? formatDecimalHours(entry.driverTimeHours * 60)
                                : ''}
                            </TableCell>
                          )}
                          <TableCell className="border-r border-black text-right print:p-1">
                            {/* Show blank if compensated is 0 or 0.00 */}
                            {compensatedHours && compensatedHours !== 0
                              ? compensatedHours.toFixed(2)
                              : ''}
                          </TableCell>
                          {showDriving && (
                            <TableCell className="border-r border-black text-right print:p-1">
                              {entry.passengerTimeHours &&
                              entry.passengerTimeHours !== 0
                                ? formatDecimalHours(
                                    entry.passengerTimeHours * 60,
                                  )
                                : ''}
                            </TableCell>
                          )}
                          {showMileage && (
                            <TableCell className="text-right print:p-1"></TableCell>
                          )}
                        </TableRow>
                      )
                    })
                  })}
                </TableBody>
              </Table>
              <div className="mt-2 flex w-full justify-end print:mt-1 print:text-xs">
                <div className="flex w-full justify-end">
                  <div className="flex-1"></div>
                  <div className="flex flex-1 gap-8 sm:w-1/2 justify-between">
                    <div className="flex-1 text-right font-semibold">
                      {t('export.footerTotalPerWeek')}
                    </div>
                    <div className="flex flex-1 gap-8 border-b-2 border-black pb-1">
                      <div
                        className="flex-1 text-right print:pb-0.5"
                        data-testid={`timesheet-week-${weekIndex}-total`}
                      >
                        {weekCompTotal.toFixed(2)}
                      </div>
                      {showDriving && (
                        <div
                          className="flex-1 text-right print:pb-0.5"
                          data-testid={`timesheet-week-${weekIndex}-passenger`}
                        >
                          {weekPassengerTotal.toFixed(2)}
                        </div>
                      )}
                      {showMileage && <div className="flex-1 print:pb-1"></div>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        {/* after all weeks, add monthly totals */}
        <TimesheetPreviewTotals
          selectedMonth={selectedMonth}
          relevantWeeks={relevantWeeks}
          getEntriesForDay={getEntriesForDay}
          userSettings={userSettings || {}}
        />
        <div id="pdf-footer-section" className="flex w-full justify-end">
          <div className="mt-24 text-right print:mt-12 print:text-sm">
            <p className="mt-2">{t('export.signatureLine')}</p>
          </div>
        </div>
      </main>
    </div>
  )
}
