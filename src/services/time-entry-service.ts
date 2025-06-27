import * as firestoreService from './time-entry-service.firestore';
import * as localService from './time-entry-service.local';
import type { TimeEntry } from '@/lib/types';

const useMockService = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';

const service = useMockService ? localService : firestoreService;

if (useMockService) {
  console.log("Using local time entry service for testing.");
}

export const addTimeEntry = (entry: Omit<TimeEntry, 'id'>): Promise<string> => {
  return service.addTimeEntry(entry);
};

export const updateTimeEntry = (entryId: string, entry: Partial<TimeEntry>): Promise<void> => {
    return service.updateTimeEntry(entryId, entry);
};

export const deleteTimeEntry = (userId: string, entryId: string): Promise<void> => {
    return service.deleteTimeEntry(userId, entryId);
};

export const getTimeEntries = (userId: string): Promise<TimeEntry[]> => {
    return service.getTimeEntries(userId);
};

export const deleteAllTimeEntries = (userId: string): Promise<void> => {
    return service.deleteAllTimeEntries(userId);
};
