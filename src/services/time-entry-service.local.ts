import { set, subDays } from 'date-fns'

import type { TimeEntry } from '@/lib/types'
import { compareEntriesByStartTime } from '@/lib/utils'

let entries: TimeEntry[] = []

if (process.env.NEXT_PUBLIC_ENVIRONMENT == 'development') {
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
      driverTimeHours: 1,
      passengerTimeHours: 1,
    },
    {
      id: '6',
      userId: 'mock-user-1',
      location: 'Büro',
      startTime: set(new Date(), {
        hours: 15,
        minutes: 30,
        seconds: 0,
        milliseconds: 0,
      }),
      endTime: set(new Date(), {
        hours: 15,
        minutes: 45,
        seconds: 0,
        milliseconds: 0,
      }),
      pauseDuration: 0,
      passengerTimeHours: 0,
    },
    {
      id: '7',
      userId: 'mock-user-1',
      location: 'Duration Only Example',
      durationMinutes: 15,
      startTime: set(new Date(), {
        hours: 12,
        minutes: 0,
        seconds: 0,
        milliseconds: 0,
      }),
      // No endTime
    },
  ]
}

export const addTimeEntry = async (
  entry: Omit<TimeEntry, 'id'>,
): Promise<string> => {
  const newEntry = { ...entry, id: Date.now().toString() }
  entries.push(newEntry)
  return newEntry.id
}

export const updateTimeEntry = async (
  entryId: string,
  entryUpdate: Partial<TimeEntry>,
): Promise<void> => {
  entries = entries.map((e) =>
    e.id === entryId ? { ...e, ...entryUpdate } : e,
  )
}

export const deleteTimeEntry = async (
  userId: string,
  entryId: string,
): Promise<void> => {
  entries = entries.filter((e) => !(e.id === entryId && e.userId === userId))
}

export const getTimeEntries = async (userId: string): Promise<TimeEntry[]> => {
  return entries
    .filter((e) => e.userId === userId)
    .sort(compareEntriesByStartTime)
}

export const deleteAllTimeEntries = async (userId: string): Promise<void> => {
  entries = entries.filter((e) => e.userId !== userId)
}
