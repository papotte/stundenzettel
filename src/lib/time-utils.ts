// time-utils.ts
// Utilities for time and compensation calculations shared across preview, export, and time tracking logic.
import { differenceInMinutes } from 'date-fns'

import type { TimeEntry, UserSettings } from './types'

/**
 * Parses a time string (HH:mm) into a Date object using a fixed date to avoid timezone issues.
 * This function is timezone-independent and should be used instead of date-fns parse for time strings.
 */
export function parseTimeString(
  timeStr: string,
  baseDate: Date = new Date(),
): Date {
  const [hours, minutes] = timeStr.split(':').map(Number)
  if (isNaN(hours) || isNaN(minutes)) {
    throw new Error('Invalid time format')
  }

  // Validate hours and minutes
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error('Invalid time format')
  }

  // Create a new date object with the same year/month/day as baseDate but with the specified time
  const result = new Date(baseDate)
  result.setHours(hours, minutes, 0, 0)
  return result
}

/**
 * Calculates the total compensated minutes for a list of entries, using compensation percentages for driver and passenger.
 * Used for daily, weekly, and monthly totals in the tracker.
 */
export function calculateTotalCompensatedMinutes(
  entriesToSum: TimeEntry[],
  driverCompPercent: number = 100,
  passengerCompPercent: number = 100,
): number {
  return entriesToSum.reduce((total, entry) => {
    if (typeof entry.durationMinutes === 'number') {
      return total + entry.durationMinutes
    } else if (entry.startTime && entry.endTime) {
      const workMinutes = differenceInMinutes(entry.endTime, entry.startTime)
      if (entry.location === 'TIME_OFF_IN_LIEU') {
        return total
      }
      // For special entries, only count work duration
      if (['SICK_LEAVE', 'PTO', 'BANK_HOLIDAY'].includes(entry.location)) {
        return total + workMinutes
      }
      const pauseMinutes = entry.pauseDuration || 0
      const driver = entry.driverTimeHours || 0
      const passenger = entry.passengerTimeHours || 0
      const driverPercent = driverCompPercent / 100
      const passengerPercent = passengerCompPercent / 100
      // Compensated: work - pause + driver time * driver% + passenger time * passenger%
      const compensated =
        workMinutes -
        pauseMinutes +
        driver * 60 * driverPercent +
        passenger * 60 * passengerPercent
      return total + (compensated > 0 ? compensated : 0)
    }
    return total
  }, 0)
}

/**
 * Calculates the total compensated time (in hours) for a week, using the same logic as the preview and export.
 * @param week Array of Date objects representing the days in the week
 * @param getEntriesForDay Function to get all TimeEntry objects for a given day
 * @param userSettings UserSettings object (for compensation percentages)
 * @returns Total compensated time in hours (number, may be fractional)
 */
export function calculateWeekCompensatedTime(
  week: Date[],
  getEntriesForDay: (day: Date) => TimeEntry[],
  userSettings: UserSettings | null,
): number {
  if (!userSettings) return 0
  return week.reduce((weekTotal, day) => {
    const entries = getEntriesForDay(day)
    return (
      weekTotal +
      entries.reduce((acc, entry) => {
        if (typeof entry.durationMinutes === 'number') {
          return acc + entry.durationMinutes / 60
        } else if (entry.endTime && entry.startTime) {
          const workDuration = differenceInMinutes(
            entry.endTime,
            entry.startTime,
          )
          const isCompensatedSpecialDay = [
            'SICK_LEAVE',
            'PTO',
            'BANK_HOLIDAY',
          ].includes(entry.location)
          if (isCompensatedSpecialDay) {
            return acc + workDuration / 60
          } else if (entry.location !== 'TIME_OFF_IN_LIEU') {
            const compensatedMinutes =
              workDuration -
              (entry.pauseDuration || 0) +
              ((entry.driverTimeHours || 0) *
                60 *
                (userSettings.driverCompensationPercent ?? 100)) /
                100
            return acc + (compensatedMinutes > 0 ? compensatedMinutes / 60 : 0)
          }
        }
        return acc
      }, 0)
    )
  }, 0)
}
