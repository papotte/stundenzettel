'use client'

import { useCallback, useMemo, useState } from 'react'

import {
  endOfMonth,
  endOfWeek,
  endOfYear,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subMonths,
  subWeeks,
} from 'date-fns'
import { useTranslations } from 'next-intl'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

export default function StatsView() {
  const t = useTranslations('stats')
  const tSpecial = useTranslations('special_locations')
  const { entries, userSettings, isLoading } = useTimeTrackerContext()
  const [period, setPeriod] = useState<StatsPeriod>('thisMonth')

  const getLocationDisplayName = useCallback(
    (location: string) => {
      if (SPECIAL_LOCATION_KEYS.includes(location as SpecialLocationKey)) {
        return tSpecial(location)
      }
      return location
    },
    [tSpecial],
  )

  const { start, end } = useMemo(
    () => getPeriodBounds(period, new Date()),
    [period],
  )

  const entriesInPeriod = useMemo(() => {
    return entries.filter(
      (entry) =>
        entry.startTime &&
        entry.startTime.getTime() >= start.getTime() &&
        entry.startTime.getTime() <= end.getTime(),
    )
  }, [entries, start, end])

  const driverComp = userSettings?.driverCompensationPercent ?? 100
  const passengerComp = userSettings?.passengerCompensationPercent ?? 100

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
        timeOffInLieuHours: location === 'TIME_OFF_IN_LIEU' ? totalHours : 0,
        totalHours,
      })
    })
    result.sort((a, b) => b.totalHours - a.totalHours)
    return result
  }, [entriesInPeriod, driverComp, passengerComp])

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
    if (!userSettings) return 0
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
    }
  }, [userSettings, period])

  const overtimeHours = totals.totalHours - expectedHoursForPeriod
  const showExpectedAndOvertime =
    !!userSettings &&
    (userSettings.expectedMonthlyHours != null ||
      userSettings.defaultWorkHours != null)

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
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>{t('title')}</CardTitle>
        <Select
          value={period}
          onValueChange={(v) => setPeriod(v as StatsPeriod)}
        >
          <SelectTrigger
            className="w-full sm:w-[180px]"
            aria-label={t('title')}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="thisWeek">{t('periodThisWeek')}</SelectItem>
            <SelectItem value="lastWeek">{t('periodLastWeek')}</SelectItem>
            <SelectItem value="thisMonth">{t('periodThisMonth')}</SelectItem>
            <SelectItem value="lastMonth">{t('periodLastMonth')}</SelectItem>
            <SelectItem value="thisYear">{t('periodThisYear')}</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <section
            className="rounded-lg border bg-muted/30 p-4"
            aria-labelledby="stats-summary-heading"
          >
            <h2
              id="stats-summary-heading"
              className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide"
            >
              {t('summaryTitle')}
            </h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
              {showExpectedAndOvertime && (
                <>
                  <dt className="text-muted-foreground">
                    {t('summaryExpectedHours')}
                  </dt>
                  <dd className="tabular-nums font-medium">
                    {expectedHoursForPeriod.toFixed(1)} h
                  </dd>
                </>
              )}
              <dt className="text-muted-foreground">
                {t('summaryTotalHours')}
              </dt>
              <dd className="tabular-nums font-medium">
                {totals.totalHours.toFixed(1)} h
              </dd>
              {showExpectedAndOvertime && (
                <>
                  <dt className="text-muted-foreground">
                    {t('summaryOvertime')}
                  </dt>
                  <dd className="tabular-nums font-medium">
                    {overtimeHours >= 0 ? '+' : ''}
                    {overtimeHours.toFixed(1)} h
                  </dd>
                </>
              )}
              <dt className="text-muted-foreground">
                {tSpecial('SICK_LEAVE')}
              </dt>
              <dd className="tabular-nums font-medium">
                {specialTotals.sickLeaveHours.toFixed(1)} h
              </dd>
              <dt className="text-muted-foreground">{tSpecial('PTO')}</dt>
              <dd className="tabular-nums font-medium">
                {specialTotals.ptoHours.toFixed(1)} h
              </dd>
              <dt className="text-muted-foreground">
                {tSpecial('BANK_HOLIDAY')}
              </dt>
              <dd className="tabular-nums font-medium">
                {specialTotals.holidayHours.toFixed(1)} h
              </dd>
              <dt className="text-muted-foreground">
                {tSpecial('TIME_OFF_IN_LIEU')}
              </dt>
              <dd className="tabular-nums font-medium">
                {specialTotals.timeOffInLieuHours.toFixed(1)} h
              </dd>
            </dl>
          </section>

          {!hasAnyData ? (
            <p className="text-muted-foreground text-sm">{t('noData')}</p>
          ) : (
            <section aria-labelledby="stats-projects-heading">
              <h2
                id="stats-projects-heading"
                className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide"
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
                    <TableCell className="font-medium">{t('total')}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {projectTotals.workHours.toFixed(1)} h
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {projectTotals.driverHours.toFixed(1)} h
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {projectTotals.passengerHours.toFixed(1)} h
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {projectTotals.totalHours.toFixed(1)} h
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </section>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
