import type { TimeEntry } from '@/lib/types'

import * as firestoreService from './time-entry-service.firestore'

// Always use Firestore service - local service has been removed
// The environment-specific database selection is handled in firebase.ts
const service = firestoreService

const environment = process.env.NEXT_PUBLIC_ENVIRONMENT || 'production'
console.info(
  `Using Firestore time entry service for environment '${environment}'`,
)

export const addTimeEntry = (entry: Omit<TimeEntry, 'id'>): Promise<string> => {
  return service.addTimeEntry(entry)
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
