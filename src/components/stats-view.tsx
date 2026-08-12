'use client'

import { useCallback, useMemo, useState } from 'react'

import {
  differenceInCalendarDays,
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  parse,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subMonths,
  subWeeks,
} from 'date-fns'
import { useTranslations } from 'next-intl'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useTimeTrackerContext } from '@/context/time-tracker-context'
import { SPECIAL_LOCATION_KEYS, type SpecialLocationKey } from '@/lib/constants'
import {
  calculateExpectedMonthlyHours,
  calculateTimeOffInLieuHours,
  calculateTotalCompensatedMinutes,
  calculateWorkMinutes,
} from '@/lib/time-utils'
import type { TimeEntry } from '@/lib/types'

export type StatsPeriod =
  | 'thisWeek'
  | 'lastWeek'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisYear'

type PeriodOption = StatsPeriod | 'custom'

const MAX_RANGE_DAYS = 365

function getPeriodBounds(
  period: StatsPeriod,
  ref: Date,
): { start: Date; end: Date } {
  switch (period) {
    case 'thisWeek': {
      const start = startOfWeek(ref, { weekStartsOn: 1 })
      const end = endOfWeek(ref, { weekStartsOn: 1 })
      return { start, end }
    }
    case 'lastWeek': {
      const thisWeekStart = startOfWeek(ref, { weekStartsOn: 1 })
      const start = subWeeks(thisWeekStart, 1)
      const end = endOfWeek(start, { weekStartsOn: 1 })
      return { start, end }
    }
    case 'thisMonth': {
      return { start: startOfMonth(ref), end: endOfMonth(ref) }
    }
    case 'lastMonth': {
      const thisMonthStart = startOfMonth(ref)
      const start = subMonths(thisMonthStart, 1)
      const end = endOfMonth(start)
      return { start, end }
    }
    case 'thisYear': {
      return { start: startOfYear(ref), end: endOfYear(ref) }
    }
  }
}

function parseDateInput(value: string): Date | null {
  const parsed = parse(value, 'yyyy-MM-dd', new Date())
  if (isNaN(parsed.getTime())) return null
  return parsed
}

export default function StatsView() {
  const t = useTranslations('stats')
  const tSpecial = useTranslations('special_locations')
  const { entries, userSettings, isLoading } = useTimeTrackerContext()
  const [period, setPeriod] = useState<PeriodOption>('thisMonth')
  const [customStart, setCustomStart] = useState<Date>(() =>
    startOfDay(startOfMonth(new Date())),
  )
  const [customEnd, setCustomEnd] = useState<Date>(() =>
    endOfDay(endOfMonth(new Date())),
  )

  const getLocationDisplayName = useCallback(
    (location: string) => {
      if (SPECIAL_LOCATION_KEYS.includes(location as SpecialLocationKey)) {
        return tSpecial(location)
      }
      return location
    },
    [tSpecial],
  )

  const { start, end } = useMemo(() => {
    if (period === 'custom') {
      return { start: startOfDay(customStart), end: endOfDay(customEnd) }
    }
    return getPeriodBounds(period, new Date())
  }, [period, customStart, customEnd])

  const handleStartChange = (value: string) => {
    const date = parseDateInput(value)
    if (!date) return
    setCustomStart(startOfDay(date))
    setPeriod('custom')
  }

  const handleEndChange = (value: string) => {
    const date = parseDateInput(value)
    if (!date) return
    setCustomEnd(endOfDay(date))
    setPeriod('custom')
  }

  const rangeError = useMemo(() => {
    if (customStart > customEnd) {
      return t('rangeError')
    }
    if (differenceInCalendarDays(customEnd, customStart) > MAX_RANGE_DAYS) {
      return t('rangeError')
    }
    return null
  }, [customStart, customEnd, t])

  const entriesInPeriod = useMemo(() => {
    if (rangeError) return []
    return entries.filter(
      (entry) =>
        entry.startTime &&
        entry.startTime.getTime() >= start.getTime() &&
        entry.startTime.getTime() <= end.getTime(),
    )
  }, [entries, start, end, rangeError])

  const driverComp = userSettings?.driverCompensationPercent ?? 100
  const passengerComp = userSettings?.passengerCompensationPercent ?? 100
  const defaultWorkHours = userSettings?.defaultWorkHours ?? 8

  type ProjectRow = {
    location: string
    workHours: number
    driverHours: number
    passengerHours: number
    sickLeaveHours: number
    ptoHours: number
    holidayHours: number
    timeOffInLieuHours: number
    totalHours: number
  }

  const byProjectCorrect = useMemo(() => {
    const map = new Map<string, TimeEntry[]>()
    for (const entry of entriesInPeriod) {
      const list = map.get(entry.location) ?? []
      list.push(entry)
      map.set(entry.location, list)
    }
    const result: ProjectRow[] = []
    const regularEntries = (entries: TimeEntry[]) =>
      entries.filter(
        (e) =>
          !SPECIAL_LOCATION_KEYS.includes(e.location as SpecialLocationKey),
      )
    map.forEach((groupEntries, location) => {
      const workMinutes = calculateWorkMinutes(regularEntries(groupEntries))
      const driverHours = groupEntries.reduce(
        (s, e) => s + (e.driverTimeHours ?? 0),
        0,
      )
      const passengerHours = groupEntries.reduce(
        (s, e) => s + (e.passengerTimeHours ?? 0),
        0,
      )
      const totalMinutes = calculateTotalCompensatedMinutes(
        groupEntries,
        driverComp,
        passengerComp,
      )
      const totalHours = totalMinutes / 60
      result.push({
        location,
        workHours: workMinutes / 60,
        driverHours,
        passengerHours,
        sickLeaveHours: location === 'SICK_LEAVE' ? totalHours : 0,
        ptoHours: location === 'PTO' ? totalHours : 0,
        holidayHours: location === 'BANK_HOLIDAY' ? totalHours : 0,
        timeOffInLieuHours:
          location === 'TIME_OFF_IN_LIEU'
            ? calculateTimeOffInLieuHours(groupEntries, defaultWorkHours)
            : 0,
        totalHours,
      })
    })
    result.sort((a, b) => b.totalHours - a.totalHours)
    return result
  }, [entriesInPeriod, driverComp, passengerComp, defaultWorkHours])

  const totals = useMemo(
    () =>
      byProjectCorrect.reduce(
        (acc, row) => ({
          workHours: acc.workHours + row.workHours,
          driverHours: acc.driverHours + row.driverHours,
          passengerHours: acc.passengerHours + row.passengerHours,
          sickLeaveHours: acc.sickLeaveHours + row.sickLeaveHours,
          ptoHours: acc.ptoHours + row.ptoHours,
          holidayHours: acc.holidayHours + row.holidayHours,
          timeOffInLieuHours: acc.timeOffInLieuHours + row.timeOffInLieuHours,
          totalHours: acc.totalHours + row.totalHours,
        }),
        {
          workHours: 0,
          driverHours: 0,
          passengerHours: 0,
          sickLeaveHours: 0,
          ptoHours: 0,
          holidayHours: 0,
          timeOffInLieuHours: 0,
          totalHours: 0,
        },
      ),
    [byProjectCorrect],
  )

  const expectedHoursForPeriod = useMemo(() => {
    if (!userSettings) return null
    const expectedMonthly = calculateExpectedMonthlyHours(userSettings)
    switch (period) {
      case 'thisWeek':
      case 'lastWeek':
        return (expectedMonthly * 12) / 52
      case 'thisMonth':
      case 'lastMonth':
        return expectedMonthly
      case 'thisYear':
        return expectedMonthly * 12
      case 'custom':
        return null
    }
  }, [userSettings, period])

  const overtimeHours =
    expectedHoursForPeriod !== null
      ? totals.totalHours - expectedHoursForPeriod
      : 0
  const showExpectedAndOvertime = expectedHoursForPeriod !== null

  const projectRows = useMemo(
    () =>
      byProjectCorrect.filter(
        (row) =>
          !SPECIAL_LOCATION_KEYS.includes(row.location as SpecialLocationKey),
      ),
    [byProjectCorrect],
  )
  const specialRows = useMemo(
    () =>
      byProjectCorrect.filter((row) =>
        SPECIAL_LOCATION_KEYS.includes(row.location as SpecialLocationKey),
      ),
    [byProjectCorrect],
  )

  const projectTotals = useMemo(
    () =>
      projectRows.reduce(
        (acc, row) => ({
          workHours: acc.workHours + row.workHours,
          driverHours: acc.driverHours + row.driverHours,
          passengerHours: acc.passengerHours + row.passengerHours,
          sickLeaveHours: acc.sickLeaveHours + row.sickLeaveHours,
          ptoHours: acc.ptoHours + row.ptoHours,
          holidayHours: acc.holidayHours + row.holidayHours,
          timeOffInLieuHours: acc.timeOffInLieuHours + row.timeOffInLieuHours,
          totalHours: acc.totalHours + row.totalHours,
        }),
        {
          workHours: 0,
          driverHours: 0,
          passengerHours: 0,
          sickLeaveHours: 0,
          ptoHours: 0,
          holidayHours: 0,
          timeOffInLieuHours: 0,
          totalHours: 0,
        },
      ),
    [projectRows],
  )
  const specialTotals = useMemo(
    () =>
      specialRows.reduce(
        (acc, row) => ({
          workHours: acc.workHours + row.workHours,
          driverHours: acc.driverHours + row.driverHours,
          passengerHours: acc.passengerHours + row.passengerHours,
          sickLeaveHours: acc.sickLeaveHours + row.sickLeaveHours,
          ptoHours: acc.ptoHours + row.ptoHours,
          holidayHours: acc.holidayHours + row.holidayHours,
          timeOffInLieuHours: acc.timeOffInLieuHours + row.timeOffInLieuHours,
          totalHours: acc.totalHours + row.totalHours,
        }),
        {
          workHours: 0,
          driverHours: 0,
          passengerHours: 0,
          sickLeaveHours: 0,
          ptoHours: 0,
          holidayHours: 0,
          timeOffInLieuHours: 0,
          totalHours: 0,
        },
      ),
    [specialRows],
  )

  const hasAnyData = projectRows.length > 0

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-7 w-48" />
          <Skeleton className="mt-2 h-10 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <CardTitle>{t('title')}</CardTitle>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-end">
          {period === 'custom' && (
            <div className="grid w-full grid-cols-2 gap-3 sm:w-auto">
              <div className="flex flex-col gap-1">
                <Label
                  htmlFor="stats-start-date"
                  className="text-xs text-muted-foreground"
                >
                  {t('startDate')}
                </Label>
                <Input
                  id="stats-start-date"
                  type="date"
                  value={format(customStart, 'yyyy-MM-dd')}
                  onChange={(e) => handleStartChange(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label
                  htmlFor="stats-end-date"
                  className="text-xs text-muted-foreground"
                >
                  {t('endDate')}
                </Label>
                <Input
                  id="stats-end-date"
                  type="date"
                  value={format(customEnd, 'yyyy-MM-dd')}
                  onChange={(e) => handleEndChange(e.target.value)}
                />
              </div>
            </div>
          )}

          <Select
            value={period}
            onValueChange={(v) => setPeriod(v as PeriodOption)}
          >
            <SelectTrigger className="w-full sm:w-45" aria-label={t('title')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="thisWeek">{t('periodThisWeek')}</SelectItem>
              <SelectItem value="lastWeek">{t('periodLastWeek')}</SelectItem>
              <SelectItem value="thisMonth">{t('periodThisMonth')}</SelectItem>
              <SelectItem value="lastMonth">{t('periodLastMonth')}</SelectItem>
              <SelectItem value="thisYear">{t('periodThisYear')}</SelectItem>
              <SelectItem value="custom">{t('periodCustom')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {!rangeError ? (
          <div className="space-y-6">
            <section
              className="rounded-lg border bg-muted/30 p-4"
              aria-labelledby="stats-summary-heading"
            >
              <h2
                id="stats-summary-heading"
                className="mb-3 text-sm font-semibold tracking-wide text-muted-foreground uppercase"
              >
                {t('summaryTitle')}
              </h2>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
                {showExpectedAndOvertime && (
                  <>
                    <dt className="text-muted-foreground">
                      {t('summaryExpectedHours')}
                    </dt>
                    <dd className="font-medium tabular-nums">
                      {expectedHoursForPeriod.toFixed(1)} h
                    </dd>
                  </>
                )}
                <dt className="text-muted-foreground">
                  {t('summaryTotalHours')}
                </dt>
                <dd className="font-medium tabular-nums">
                  {totals.totalHours.toFixed(1)} h
                </dd>
                {showExpectedAndOvertime && (
                  <>
                    <dt className="text-muted-foreground">
                      {t('summaryOvertime')}
                    </dt>
                    <dd className="font-medium tabular-nums">
                      {overtimeHours >= 0 ? '+' : ''}
                      {overtimeHours.toFixed(1)} h
                    </dd>
                  </>
                )}
                <dt className="text-muted-foreground">
                  {tSpecial('SICK_LEAVE')}
                </dt>
                <dd className="font-medium tabular-nums">
                  {specialTotals.sickLeaveHours.toFixed(1)} h
                </dd>
                <dt className="text-muted-foreground">{tSpecial('PTO')}</dt>
                <dd className="font-medium tabular-nums">
                  {specialTotals.ptoHours.toFixed(1)} h
                </dd>
                <dt className="text-muted-foreground">
                  {tSpecial('BANK_HOLIDAY')}
                </dt>
                <dd className="font-medium tabular-nums">
                  {specialTotals.holidayHours.toFixed(1)} h
                </dd>
                <dt className="text-muted-foreground">
                  {tSpecial('TIME_OFF_IN_LIEU')}
                </dt>
                <dd className="font-medium tabular-nums">
                  {specialTotals.timeOffInLieuHours.toFixed(1)} h
                </dd>
              </dl>
            </section>

            {!hasAnyData ? (
              <p className="text-sm text-muted-foreground">{t('noData')}</p>
            ) : (
              <section aria-labelledby="stats-projects-heading">
                <h2
                  id="stats-projects-heading"
                  className="mb-3 text-sm font-semibold tracking-wide text-muted-foreground uppercase"
                >
                  {t('sectionProjects')}
                </h2>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('project')}</TableHead>
                      <TableHead className="text-right">
                        {t('hoursWorked')}
                      </TableHead>
                      <TableHead className="text-right">
                        {t('hoursDriven')}
                      </TableHead>
                      <TableHead className="text-right">
                        {t('hoursPassenger')}
                      </TableHead>
                      <TableHead className="text-right">{t('total')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projectRows.map(
                      ({
                        location,
                        workHours,
                        driverHours,
                        passengerHours,
                        totalHours,
                      }) => (
                        <TableRow key={location}>
                          <TableCell>
                            {getLocationDisplayName(location)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {workHours.toFixed(1)} h
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {driverHours.toFixed(1)} h
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {passengerHours.toFixed(1)} h
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {totalHours.toFixed(1)} h
                          </TableCell>
                        </TableRow>
                      ),
                    )}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell className="font-medium">
                        {t('total')}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {projectTotals.workHours.toFixed(1)} h
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {projectTotals.driverHours.toFixed(1)} h
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {projectTotals.passengerHours.toFixed(1)} h
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {projectTotals.totalHours.toFixed(1)} h
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </section>
            )}
          </div>
        ) : (
          <p className="text-sm text-destructive">{rangeError}</p>
        )}
      </CardContent>
    </Card>
  )
}
