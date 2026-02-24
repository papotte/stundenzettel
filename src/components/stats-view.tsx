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
import { useTimeTrackerContext } from '@/context/time-tracker-context'
import { SPECIAL_LOCATION_KEYS, type SpecialLocationKey } from '@/lib/constants'
import { calculateTotalCompensatedMinutes } from '@/lib/time-utils'
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

  const byProjectCorrect = useMemo(() => {
    const map = new Map<string, TimeEntry[]>()
    for (const entry of entriesInPeriod) {
      const list = map.get(entry.location) ?? []
      list.push(entry)
      map.set(entry.location, list)
    }
    const result: { location: string; hours: number }[] = []
    map.forEach((groupEntries, location) => {
      const minutes = calculateTotalCompensatedMinutes(
        groupEntries,
        driverComp,
        passengerComp,
      )
      result.push({ location, hours: minutes / 60 })
    })
    result.sort((a, b) => b.hours - a.hours)
    return result
  }, [entriesInPeriod, driverComp, passengerComp])

  const totalHours = useMemo(
    () => byProjectCorrect.reduce((sum, row) => sum + row.hours, 0),
    [byProjectCorrect],
  )

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
        {byProjectCorrect.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t('noData')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="pb-2 text-left font-medium">{t('project')}</th>
                  <th className="pb-2 text-right font-medium">{t('hours')}</th>
                </tr>
              </thead>
              <tbody>
                {byProjectCorrect.map(({ location, hours }) => (
                  <tr key={location} className="border-b last:border-0">
                    <td className="py-2">{getLocationDisplayName(location)}</td>
                    <td className="py-2 text-right tabular-nums">
                      {hours.toFixed(1)} h
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 font-medium">
                  <td className="pt-2">{t('total')}</td>
                  <td className="pt-2 text-right tabular-nums">
                    {totalHours.toFixed(1)} h
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
