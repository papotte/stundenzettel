import { set, subDays } from 'date-fns'

import type { TimeEntry } from '@/lib/types'
import { compareEntriesByStartTime } from '@/lib/utils'

// Session storage key for time entries
const STORAGE_KEY = 'timewise_local_time_entries'

// Helper functions for session storage
const getFromStorage = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue

  try {
    const stored = sessionStorage.getItem(key)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Convert date strings back to Date objects
      if (Array.isArray(parsed)) {
        parsed.forEach((entry: TimeEntry) => {
          if (entry.startTime) entry.startTime = new Date(entry.startTime)
          if (entry.endTime) entry.endTime = new Date(entry.endTime)
        })
      }
      return parsed
    }
  } catch (error) {
    console.warn(`Failed to parse stored data for ${key}:`, error)
  }
  return defaultValue
}

const saveToStorage = (key: string, data: unknown): void => {
  if (typeof window === 'undefined') return

  try {
    sessionStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.warn(`Failed to save data to storage for ${key}:`, error)
  }
}

// Initialize entries from session storage or use defaults
let entries: TimeEntry[] = getFromStorage(STORAGE_KEY, [])

// If no entries in storage and in development, add some sample data
if (
  entries.length === 0 &&
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'development'
) {
  entries = [
    {
      id: '1',
      userId: 'mock-user-1',
      location: 'On-site Installation',
      startTime: set(subDays(new Date(), 3), {
        hours: 9,
        minutes: 0,
        seconds: 0,
        milliseconds: 0,
      }),
      endTime: set(subDays(new Date(), 3), {
        hours: 16,
        minutes: 0,
        seconds: 0,
        milliseconds: 0,
      }),
      pauseDuration: 30,
      passengerTimeHours: 1,
    },
    {
      id: '2',
      userId: 'mock-user-1',
      location: 'Office Work',
      startTime: set(subDays(new Date(), 1), {
        hours: 9,
        minutes: 0,
        seconds: 0,
        milliseconds: 0,
      }),
      endTime: set(subDays(new Date(), 1), {
        hours: 17,
        minutes: 30,
        seconds: 0,
        milliseconds: 0,
      }),
      pauseDuration: 45,
      passengerTimeHours: 0.5,
    },
    {
      id: '3',
      userId: 'mock-user-1',
      location: 'Client Meeting',
      startTime: set(subDays(new Date(), 2), {
        hours: 10,
        minutes: 0,
        seconds: 0,
        milliseconds: 0,
      }),
      endTime: set(subDays(new Date(), 2), {
        hours: 12,
        minutes: 0,
        seconds: 0,
        milliseconds: 0,
      }),
      pauseDuration: 0,
      driverTimeHours: 1,
    },
    {
      id: '4',
      userId: 'mock-user-2',
      location: 'Home Office',
      startTime: set(subDays(new Date(), 1), {
        hours: 8,
        minutes: 15,
        seconds: 0,
        milliseconds: 0,
      }),
      endTime: set(subDays(new Date(), 1), {
        hours: 16,
        minutes: 45,
        seconds: 0,
        milliseconds: 0,
      }),
      pauseDuration: 30,
      passengerTimeHours: 0,
    },
    {
      id: '5',
      userId: 'mock-user-1',
      location: 'Prenzlau',
      startTime: set(new Date(), {
        hours: 7,
        minutes: 0,
        seconds: 0,
        milliseconds: 0,
      }),
      endTime: set(new Date(), {
        hours: 15,
        minutes: 0,
        seconds: 0,
        milliseconds: 0,
      }),
      pauseDuration: 30,
      driverTimeHours: 1.5,
      passengerTimeHours: 0.5,
    },
  ]

  // Save the initial data to storage
  saveToStorage(STORAGE_KEY, entries)
}

// Helper function to save entries to storage
const persistEntries = (): void => {
  saveToStorage(STORAGE_KEY, entries)
}

export const addTimeEntry = async (
  entry: Omit<TimeEntry, 'id'>,
): Promise<string> => {
  const id = `entry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const newEntry: TimeEntry = { ...entry, id }
  entries.push(newEntry)
  entries.sort(compareEntriesByStartTime)
  persistEntries()
  return id
}

export const updateTimeEntry = async (
  entryId: string,
  entryUpdate: Partial<TimeEntry>,
): Promise<void> => {
  const index = entries.findIndex((entry) => entry.id === entryId)
  if (index !== -1) {
    entries[index] = { ...entries[index], ...entryUpdate }
    entries.sort(compareEntriesByStartTime)
    persistEntries()
  }
}

export const deleteTimeEntry = async (
  userId: string,
  entryId: string,
): Promise<void> => {
  entries = entries.filter(
    (entry) => !(entry.id === entryId && entry.userId === userId),
  )
  persistEntries()
}

export const getTimeEntries = async (userId: string): Promise<TimeEntry[]> => {
  return entries
    .filter((entry) => entry.userId === userId)
    .sort(compareEntriesByStartTime)
}

export const deleteAllTimeEntries = async (userId: string): Promise<void> => {
  entries = entries.filter((entry) => entry.userId !== userId)
  persistEntries()
}

// Utility function to clear session storage data (useful for testing)
export function clearTimeEntriesStorage(): void {
  if (typeof window === 'undefined') return

  sessionStorage.removeItem(STORAGE_KEY)
  entries = []
}
