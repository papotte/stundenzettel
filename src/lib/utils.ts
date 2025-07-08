import { type ClassValue, clsx } from 'clsx'
import {
  eachDayOfInterval,
  eachWeekOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
} from 'date-fns'
import { de, enUS } from 'date-fns/locale'
import { twMerge } from 'tailwind-merge'

import type { TimeEntry } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(seconds: number) {
  if (isNaN(seconds) || seconds < 0) {
    return '00:00:00'
  }
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return [h, m, s].map((v) => (v < 10 ? '0' + v : v)).join(':')
}

export function getWeeksForMonth(date: Date) {
  const firstDayOfMonth = startOfMonth(date)
  const lastDayOfMonth = endOfMonth(date)

  const weeks = eachWeekOfInterval(
    {
      start: firstDayOfMonth,
      end: lastDayOfMonth,
    },
    { weekStartsOn: 1 }, // Monday as the first day of the week
  )

  return weeks.map((weekStart) => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
    return eachDayOfInterval({ start: weekStart, end: weekEnd })
  })
}

export function formatDecimalHours(totalMinutes: number | undefined | null) {
  if (!totalMinutes) return '0.00'
  return (totalMinutes / 60).toFixed(2)
}

export function timeStringToMinutes(
  timeStr: string | undefined | null,
): number {
  if (!timeStr) return 0
  const parts = timeStr.split(':')
  if (parts.length !== 2) return 0
  const [hours, minutes] = parts.map(Number)
  if (isNaN(hours) || isNaN(minutes)) return 0
  return hours * 60 + minutes
}

export function formatHoursAndMinutes(totalMinutes: number): string {
  if (isNaN(totalMinutes) || totalMinutes <= 0) {
    return '0h 0m'
  }
  const hours = Math.floor(totalMinutes / 60)
  const minutes = Math.round(totalMinutes % 60)
  return `${hours}h ${minutes}m`
}

export function formatMinutesToTimeInput(
  totalMinutes: number | undefined | null,
): string {
  if (
    totalMinutes === null ||
    totalMinutes === undefined ||
    isNaN(totalMinutes) ||
    totalMinutes < 0
  ) {
    return '00:00'
  }
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

/**
 * Formats a date in a consistent, locale-aware way for the app (e.g., July 2nd, 2025).
 * Defaults to 'en' if no locale is provided or recognized.
 */
export function formatAppDate(date: Date, locale: string = 'en') {
  const localeObj = locale === 'de' ? de : enUS
  return format(date, 'PPPP', { locale: localeObj })
}

/**
 * Formats a number in a locale-aware way for the app (e.g., 1,234.56 or 1.234,56).
 * Defaults to 'en' if no locale is provided or recognized.
 */
export function formatAppNumber(
  value: number,
  locale: string = 'en',
  options?: Intl.NumberFormatOptions,
) {
  return new Intl.NumberFormat(locale, options).format(value)
}

/**
 * Formats a time in 24h format (HH:mm) in a locale-aware way for the app.
 * Defaults to 'en' if no locale is provided or recognized.
 */
export function formatAppTime(date: Date) {
  // Note: 'HH:mm' is not locale-sensitive, but we keep the locale param for future-proofing
  return format(date, 'HH:mm')
}

export function compareEntriesByStartTime(a: TimeEntry, b: TimeEntry) {
  const aIsDuration = typeof a.durationMinutes === 'number'
  const bIsDuration = typeof b.durationMinutes === 'number'
  if (aIsDuration && !bIsDuration) return 1
  if (!aIsDuration && bIsDuration) return -1
  if (!aIsDuration && !bIsDuration && a.startTime && b.startTime) {
    return b.startTime.getTime() - a.startTime.getTime()
  }
  if (!aIsDuration && !bIsDuration && a.startTime && !b.startTime) return -1
  if (!aIsDuration && !bIsDuration && !a.startTime && b.startTime) return 1
  // Both are duration entries, sort by startTime descending
  if (a.startTime && b.startTime) {
    return b.startTime.getTime() - a.startTime.getTime()
  }
  return 0
}
