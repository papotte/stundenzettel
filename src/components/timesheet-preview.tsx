'use client'

import React, { useCallback, useMemo } from 'react'

import { differenceInMinutes, format, getDay, isSameMonth } from 'date-fns'
import { de, enUS } from 'date-fns/locale'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useTranslation } from '@/context/i18n-context'
import { calculateWeekCompensatedTime } from '@/lib/time-utils'
import type { AuthenticatedUser, TimeEntry, UserSettings } from '@/lib/types'
import { formatDecimalHours, getWeeksForMonth } from '@/lib/utils'

import TimesheetHeader from './timesheet-header'

const dayOfWeekMap: { [key: number]: string } = {
  1: 'Mo',
  2: 'Di',
  3: 'Mi',
  4: 'Do',
  5: 'Fr',
  6: 'Sa',
  0: 'So',
}

interface TimesheetPreviewProps {
  selectedMonth: Date
  user: AuthenticatedUser | null
  entries: TimeEntry[]
  userSettings: UserSettings | null
  getEntriesForDay: (day: Date) => TimeEntry[]
  getLocationDisplayName: (location: string) => string
  onEdit: (entry: TimeEntry) => void
  onAdd: (date: Date) => void
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
}: TimesheetPreviewProps) {
  const { t, language } = useTranslation()
  const locale = language === 'de' ? de : enUS

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

  const monthEntries = useMemo(
    () =>
      relevantWeeks.flatMap((week: Date[]) => week.flatMap(getEntriesForDay)),
    [relevantWeeks, getEntriesForDay],
  )
  // For monthCompTotal, sum the weekCompTotal for each week
  const monthCompTotal = useMemo(
    () =>
      relevantWeeks.reduce(
        (acc: number, week: Date[]) =>
          acc +
          calculateWeekCompensatedTime(week, getEntriesForDay, userSettings),
        0,
      ),
    [relevantWeeks, getEntriesForDay, userSettings],
  )
  const monthPassengerTotal = useMemo(
    () => sumPassengerTime(monthEntries),
    [monthEntries],
  )

  const passengerCompPercent = userSettings?.passengerCompensationPercent ?? 90
  const compensatedPassengerHours =
    monthPassengerTotal * (passengerCompPercent / 100)

  return (
    <div
      className="printable-area rounded-md bg-white p-8 font-body shadow-md print:p-2 print:text-xs print:shadow-none"
      data-testid="timesheet-preview"
    >
      <div id="pdf-header-section">
        <TimesheetHeader userSettings={userSettings} t={t} />
        <header
          className="mb-4 flex items-start justify-between print:mb-2"
          data-testid="timesheet-title"
        >
          <h1 className="text-xl font-bold print:text-base">
            {t('export_preview.timesheetTitle', {
              month: format(selectedMonth, 'MMMM', { locale }),
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
                      {t('export_preview.headerWeek')}
                    </TableHead>
                    <TableHead
                      rowSpan={2}
                      className="w-[8%] border-r border-black align-middle print:h-auto print:p-1"
                    >
                      {t('export_preview.headerDate')}
                    </TableHead>
                    <TableHead
                      rowSpan={2}
                      className="w-auto border-r border-black text-left print:h-auto print:p-1"
                    >
                      {t('export_preview.headerLocation')}
                    </TableHead>
                    <TableHead
                      colSpan={2}
                      className="w-[18%] border-b border-black print:h-auto print:p-1"
                    >
                      {t('export_preview.headerWorkTime')}
                    </TableHead>
                    <TableHead
                      rowSpan={2}
                      className="w-[8%] border-l border-r border-black align-middle print:h-auto print:p-1"
                    >
                      {t('export_preview.headerPauseDuration')}
                    </TableHead>
                    <TableHead
                      rowSpan={2}
                      className="w-[8%] border-r border-black align-middle print:h-auto print:p-1"
                    >
                      {t('export_preview.headerDriverTime')}
                    </TableHead>
                    <TableHead
                      rowSpan={2}
                      className="w-[8%] border-r border-black align-middle print:h-auto print:p-1"
                    >
                      {t('export_preview.headerCompensatedTime')}
                    </TableHead>
                    <TableHead
                      rowSpan={2}
                      className="w-[8%] border-r border-black align-middle print:h-auto print:p-1"
                    >
                      {t('export_preview.headerPassengerTime')}
                    </TableHead>
                    <TableHead
                      rowSpan={2}
                      className="w-[8%] align-middle print:h-auto print:p-1"
                    >
                      {t('export_preview.headerMileage')}
                    </TableHead>
                  </TableRow>
                  <TableRow className="border-b border-black bg-table-header text-black hover:bg-table-header">
                    <TableHead className="border-r-0 print:h-auto print:p-1">
                      {t('export_preview.headerFrom')}
                    </TableHead>
                    <TableHead className="print:h-auto print:p-1">
                      {t('export_preview.headerTo')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {week.map((day: Date) => {
                    if (!isSameMonth(day, selectedMonth)) {
                      return null
                    }

                    const dayTestId = `timesheet-day-${format(day, 'yyyy-MM-dd')}`
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
                            {dayOfWeekMap[getDay(day)]}
                          </TableCell>
                          <TableCell className="group relative cursor-default border-r border-black text-right align-middle print:p-1">
                            {format(day, 'd/M/yyyy')}
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
                          <TableCell className="border-r border-black text-left text-muted-foreground print:p-1"></TableCell>
                          <TableCell className="text-right print:p-1"></TableCell>
                          <TableCell className="text-right print:p-1"></TableCell>
                          <TableCell className="border-l border-r border-black text-right print:p-1"></TableCell>
                          <TableCell className="border-r border-black text-right print:p-1"></TableCell>
                          <TableCell className="border-r border-black text-right print:p-1"></TableCell>
                          <TableCell className="border-r border-black text-right print:p-1"></TableCell>
                          <TableCell className="text-right print:p-1"></TableCell>
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
                          ? format(entry.startTime, 'HH:mm')
                          : ''
                        toValue = entry.endTime
                          ? format(entry.endTime, 'HH:mm')
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
                              {dayOfWeekMap[getDay(day)]}
                            </TableCell>
                          )}
                          {entryIndex === 0 && (
                            <TableCell
                              onClick={(e) => e.stopPropagation()}
                              rowSpan={dayEntries.length}
                              className="group relative cursor-default border-r border-black text-right align-middle print:p-1"
                            >
                              {format(day, 'd/M/yyyy')}
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
                          <TableCell className="border-r border-black text-left print:p-1">
                            {getLocationDisplayName(entry.location)}
                          </TableCell>
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
                          <TableCell className="border-l border-r border-black text-right print:p-1">
                            {/* Show blank if pause is 0 or 0.00 */}
                            {entry.pauseDuration && entry.pauseDuration !== 0
                              ? formatDecimalHours(entry.pauseDuration)
                              : ''}
                          </TableCell>
                          <TableCell className="border-r border-black text-right print:p-1">
                            {/* Show blank if driver time is 0 or 0.00 */}
                            {entry.driverTimeHours &&
                            entry.driverTimeHours !== 0
                              ? formatDecimalHours(entry.driverTimeHours * 60)
                              : ''}
                          </TableCell>
                          <TableCell className="border-r border-black text-right print:p-1">
                            {/* Show blank if compensated is 0 or 0.00 */}
                            {compensatedHours && compensatedHours !== 0
                              ? compensatedHours.toFixed(2)
                              : ''}
                          </TableCell>
                          <TableCell className="border-r border-black text-right print:p-1">
                            {/* Show blank if passenger time is 0 or 0.00 */}
                            {entry.passengerTimeHours &&
                            entry.passengerTimeHours !== 0
                              ? formatDecimalHours(
                                  entry.passengerTimeHours * 60,
                                )
                              : ''}
                          </TableCell>
                          <TableCell className="text-right print:p-1"></TableCell>
                        </TableRow>
                      )
                    })
                  })}
                </TableBody>
              </Table>
              <div className="mt-2 flex w-full justify-end print:mt-1 print:text-xs">
                <div className="flex w-full justify-end">
                  <div style={{ flex: '0 0 50%' }}></div>
                  <div className="flex gap-8 w-1/2 justify-between">
                    <div className="flex-1 text-right font-semibold">
                      {t('export_preview.footerTotalPerWeek')}
                    </div>
                    <div className="flex flex-1 gap-8 border-b-2 border-black pb-1">
                      <div
                        className="flex-1 text-right print:pb-0.5"
                        data-testid={`timesheet-week-${weekIndex}-total`}
                      >
                        {weekCompTotal.toFixed(2)}
                      </div>
                      <div
                        className="flex-1 text-right print:pb-0.5"
                        data-testid={`timesheet-week-${weekIndex}-passenger`}
                      >
                        {weekPassengerTotal.toFixed(2)}
                      </div>
                      <div className="flex-1 print:pb-1"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        {/* after all weeks, add monthly totals */}
        <div className="mt-8 flex w-full justify-end print:mt-4 print:text-xs">
          <div className="flex w-full justify-end">
            <div style={{ flex: '0 0 50%' }}></div>
            <div className="flex gap-8 w-1/2 justify-between">
              <div className="flex-1 text-right font-semibold">
                {t('export_preview.footerTotalHours')}
              </div>
              <div className="flex flex-1 gap-8 border-b-4 border-double border-black pb-2">
                <div
                  className="flex-1 text-right print:pb-1"
                  data-testid="timesheet-month-total"
                >
                  {monthCompTotal.toFixed(2)}
                </div>
                <div
                  className="flex-1 text-right print:pb-1"
                  data-testid="timesheet-month-passenger-total"
                >
                  {monthPassengerTotal.toFixed(2)}
                </div>
                <div className="flex-1 print:pb-1">Km:</div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 flex w-full justify-end print:text-xs">
          <div style={{ flex: '0 0 50%' }}></div>
          <div className="flex gap-8 w-1/2 justify-between">
            <div className="flex-1 text-right font-semibold">
              {t('export_preview.footerTotalAfterConversion')}
            </div>
            <div className="flex flex-1 gap-8 pb-2">
              <div
                className="flex-1 text-right print:pb-1"
                data-testid="timesheet-month-adjusted"
              >
                {(monthCompTotal + compensatedPassengerHours).toFixed(2)}
              </div>
              <div className="flex-1 text-right print:pb-1">
                {compensatedPassengerHours.toFixed(2)}
              </div>
              <div className="flex-1 print:pb-1"></div>
            </div>
          </div>
        </div>
        <div id="pdf-footer-section" className="flex w-full justify-end">
          <div className="mt-24 text-right print:mt-12 print:text-sm">
            <p className="mt-2">{t('export_preview.signatureLine')}</p>
          </div>
        </div>
      </main>
    </div>
  )
}
