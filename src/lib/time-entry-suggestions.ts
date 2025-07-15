import { format } from 'date-fns'

import type { TimeEntry } from './types'

/**
 * Returns the most frequent or recent locations from the user's time entries.
 * @param entries Array of TimeEntry objects
 * @param options Optional: { limit, recentFirst, filterText }
 */
export function suggestLocations(
  entries: TimeEntry[],
  options?: { limit?: number; recentFirst?: boolean; filterText?: string },
) {
  if (!entries.length) return []
  const locationMap = new Map<string, { count: number; lastUsed: number }>()
  entries.forEach((entry) => {
    if (!entry.location) return
    const key = entry.location
    const lastUsed = entry.startTime.getTime()
    if (!locationMap.has(key)) {
      locationMap.set(key, { count: 1, lastUsed })
    } else {
      const prev = locationMap.get(key)!
      locationMap.set(key, {
        count: prev.count + 1,
        lastUsed: Math.max(prev.lastUsed, lastUsed),
      })
    }
  })
  let sorted: [string, { count: number; lastUsed: number }][]
  if (options?.recentFirst) {
    sorted = Array.from(locationMap.entries()).sort(
      (a, b) => b[1].lastUsed - a[1].lastUsed,
    )
  } else {
    sorted = Array.from(locationMap.entries()).sort((a, b) => {
      if (b[1].count !== a[1].count) return b[1].count - a[1].count
      return b[1].lastUsed - a[1].lastUsed
    })
  }
  let filtered = sorted
  if (options?.filterText) {
    const filter = options.filterText.toLowerCase()
    filtered = filtered.filter(([location]) =>
      location.toLowerCase().includes(filter),
    )
  }
  const limit = options?.limit ?? 5
  return filtered.slice(0, limit).map(([location]) => location)
}

/**
 * Returns the most common start times, optionally filtered by location or day of week.
 * @param entries Array of TimeEntry objects
 * @param options Optional: { location, dayOfWeek, limit }
 */
export function suggestStartTimes(
  entries: TimeEntry[],
  options?: { location?: string; dayOfWeek?: number; limit?: number },
) {
  if (!entries.length) return []
  let filtered = entries.filter((e) => e.durationMinutes == undefined)
  if (options?.location) {
    filtered = filtered.filter((e) => e.location === options.location)
  }
  if (options?.dayOfWeek !== undefined) {
    filtered = filtered.filter(
      (e) => e.startTime.getDay() === options.dayOfWeek,
    )
  }
  const timeMap = new Map<string, { count: number; lastUsed: number }>()
  filtered.forEach((e) => {
    const timeStr = format(e.startTime, 'HH:mm')
    const lastUsed = e.startTime.getTime()
    if (!timeMap.has(timeStr)) {
      timeMap.set(timeStr, { count: 1, lastUsed })
    } else {
      const prev = timeMap.get(timeStr)!
      timeMap.set(timeStr, {
        count: prev.count + 1,
        lastUsed: Math.max(prev.lastUsed, lastUsed),
      })
    }
  })
  const sorted = Array.from(timeMap.entries()).sort((a, b) => {
    if (b[1].count !== a[1].count) return b[1].count - a[1].count
    return b[1].lastUsed - a[1].lastUsed
  })
  const limit = options?.limit ?? 3
  return sorted.slice(0, limit).map(([time]) => time)
}

/**
 * Returns the most common end times, optionally filtered by location or day of week.
 * @param entries Array of TimeEntry objects
 * @param options Optional: { location, dayOfWeek, limit }
 */
export function suggestEndTimes(
  entries: TimeEntry[],
  options?: { location?: string; dayOfWeek?: number; limit?: number },
) {
  if (!entries.length) return []
  let filtered = entries.filter((e) => e.endTime instanceof Date)
  if (options?.location) {
    filtered = filtered.filter((e) => e.location === options.location)
  }
  if (options?.dayOfWeek !== undefined) {
    filtered = filtered.filter(
      (e) => e.startTime && e.startTime.getDay() === options.dayOfWeek,
    )
  }
  const timeMap = new Map<string, { count: number; lastUsed: number }>()
  filtered.forEach((e) => {
    const timeStr = format(e.endTime!, 'HH:mm')
    const lastUsed = e.endTime!.getTime()
    if (!timeMap.has(timeStr)) {
      timeMap.set(timeStr, { count: 1, lastUsed })
    } else {
      const prev = timeMap.get(timeStr)!
      timeMap.set(timeStr, {
        count: prev.count + 1,
        lastUsed: Math.max(prev.lastUsed, lastUsed),
      })
    }
  })
  const sorted = Array.from(timeMap.entries()).sort((a, b) => {
    if (b[1].count !== a[1].count) return b[1].count - a[1].count
    return b[1].lastUsed - a[1].lastUsed
  })
  const limit = options?.limit ?? 3
  return sorted.slice(0, limit).map(([time]) => time)
}

/**
 * @deprecated This function is kept for compatibility but always returns an empty array.
 */
export function suggestTravelTimes() {
  return []
}

/**
 * Returns the most common driver times, optionally filtered by location.
 * @param entries Array of TimeEntry objects
 * @param options Optional: { location, limit }
 */
export function suggestDriverTimes(
  entries: TimeEntry[],
  options?: { location?: string; limit?: number },
) {
  if (!entries.length) return []
  let filtered = entries.filter(
    (e) => typeof e.driverTimeHours === 'number' && e.driverTimeHours > 0,
  )
  if (options?.location) {
    filtered = filtered.filter((e) => e.location === options.location)
  }
  const timeMap = new Map<number, { count: number; lastUsed: number }>()
  filtered.forEach((e) => {
    const driver = e.driverTimeHours!
    const lastUsed = e.startTime.getTime()
    if (!timeMap.has(driver)) {
      timeMap.set(driver, { count: 1, lastUsed })
    } else {
      const prev = timeMap.get(driver)!
      timeMap.set(driver, {
        count: prev.count + 1,
        lastUsed: Math.max(prev.lastUsed, lastUsed),
      })
    }
  })
  const sorted = Array.from(timeMap.entries()).sort((a, b) => {
    if (b[1].count !== a[1].count) return b[1].count - a[1].count
    return b[1].lastUsed - a[1].lastUsed
  })
  const limit = options?.limit ?? 3
  return sorted.slice(0, limit).map(([driver]) => driver)
}

/**
 * Returns the most common passenger times, optionally filtered by location.
 * @param entries Array of TimeEntry objects
 * @param options Optional: { location, limit }
 */
export function suggestPassengerTimes(
  entries: TimeEntry[],
  options?: { location?: string; limit?: number },
) {
  if (!entries.length) return []
  let filtered = entries.filter(
    (e) => typeof e.passengerTimeHours === 'number' && e.passengerTimeHours > 0,
  )
  if (options?.location) {
    filtered = filtered.filter((e) => e.location === options.location)
  }
  const timeMap = new Map<number, { count: number; lastUsed: number }>()
  filtered.forEach((e) => {
    const passenger = e.passengerTimeHours!
    const lastUsed = e.startTime.getTime()
    if (!timeMap.has(passenger)) {
      timeMap.set(passenger, { count: 1, lastUsed })
    } else {
      const prev = timeMap.get(passenger)!
      timeMap.set(passenger, {
        count: prev.count + 1,
        lastUsed: Math.max(prev.lastUsed, lastUsed),
      })
    }
  })
  const sorted = Array.from(timeMap.entries()).sort((a, b) => {
    if (b[1].count !== a[1].count) return b[1].count - a[1].count
    return b[1].lastUsed - a[1].lastUsed
  })
  const limit = options?.limit ?? 3
  return sorted.slice(0, limit).map(([passenger]) => passenger)
}
