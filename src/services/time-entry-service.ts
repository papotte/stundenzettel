import type { TimeEntry } from '@/lib/types'

import * as firestoreService from './time-entry-service.firestore'
import * as localService from './time-entry-service.local'

const useMockService =
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'test' ||
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'development'

const service = useMockService ? localService : firestoreService

if (useMockService) {
  console.log(
    `Using local time entry service (NEXT_PUBLIC_ENVIRONMENT=${process.env.NEXT_PUBLIC_ENVIRONMENT}).`,
  )
}

export const addTimeEntry = (entry: Omit<TimeEntry, 'id'>): Promise<string> => {
  return service.addTimeEntry(entry)
}

export const addMultipleTimeEntries = (
  userId: string,
  entries: Omit<TimeEntry, 'id' | 'userId'>[],
): Promise<TimeEntry[]> => {
  const entriesWithUser = entries.map((e) => ({ ...e, userId }))
  return service.addMultipleTimeEntries(userId, entriesWithUser)
}

export const updateTimeEntry = (
  entryId: string,
  entry: Partial<TimeEntry>,
): Promise<void> => {
  return service.updateTimeEntry(entryId, entry)
}

export const deleteTimeEntry = (
  userId: string,
  entryId: string,
): Promise<void> => {
  return service.deleteTimeEntry(userId, entryId)
}

export const getTimeEntries = (userId: string): Promise<TimeEntry[]> => {
  return service.getTimeEntries(userId)
}

export const deleteAllTimeEntries = (userId: string): Promise<void> => {
  return service.deleteAllTimeEntries(userId)
}
