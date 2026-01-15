import { type ClassValue, clsx } from 'clsx'
import {
  eachDayOfInterval,
  eachWeekOfInterval,
  endOfMonth,
  endOfWeek,
  startOfMonth,
} from 'date-fns'
import { twMerge } from 'tailwind-merge'

import { SPECIAL_LOCATION_KEYS, SpecialLocationKey } from './constants'
import type { TimeEntry } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeDate(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    12,
    0,
    0,
    0,
  )
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
  const normalizedDate = normalizeDate(date)
  const firstDayOfMonth = startOfMonth(normalizedDate)
  const lastDayOfMonth = endOfMonth(normalizedDate)

  const weeks = eachWeekOfInterval(
    {
      start: firstDayOfMonth,
      end: lastDayOfMonth,
    },
    { weekStartsOn: 1 }, // Monday as the first day of the week
  )

  return weeks.map((weekStart) => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd })
    // Ensure each day is timezone-independent by normalizing it
    return days.map((day) => normalizeDate(day))
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

export function getLocationDisplayName(
  location: string,
  t: (key: string) => string,
): string {
  if (SPECIAL_LOCATION_KEYS.includes(location as SpecialLocationKey)) {
    return t(`special_locations.${location}`)
  }
  return location
}

/**
 * Returns a unique user identifier, preferring uid but falling back to email for mock users.
 */
export function getUserId(
  user: { uid?: string; email?: string } | null | undefined,
): string | undefined {
  if (!user) return undefined
  return user.uid || user.email
}

/**
 * Safely converts a Firestore Timestamp or Date to a JavaScript Date object.
 * Handles various input types including Firestore Timestamps, Date objects, and null/undefined.
 *
 * @param value - The value to convert (Firestore Timestamp, Date, or null/undefined)
 * @returns A JavaScript Date object, or a new Date if the value is invalid
 */
export function toDate(value: unknown): Date {
  if (!value) return new Date()
  if (value instanceof Date) return value
  if (
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate()
  }
  return new Date()
}
