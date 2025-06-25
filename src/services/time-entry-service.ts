import * as firestoreService from './time-entry-service.firestore';
import * as localService from './time-entry-service.local';
import type { TimeEntry } from '@/lib/types';

interface TimeEntryService {
  addTimeEntry: (entry: Omit<TimeEntry, 'id'>) => Promise<string>;
  updateTimeEntry: (entryId: string, entry: Partial<TimeEntry>) => Promise<void>;
  deleteTimeEntry: (userId: string, entryId: string) => Promise<void>;
  getTimeEntries: (userId: string) => Promise<TimeEntry[]>;
  deleteAllTimeEntries: (userId: string) => Promise<void>;
}

let service: TimeEntryService;

const useMockService = process.env.NEXT_PUBLIC_USE_MOCKS === 'true' || !process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

if (useMockService) {
  console.log("Using local time entry service for testing (or Firebase config is missing).");
  service = localService;
} else {
  service = firestoreService;
}

export const { 
  addTimeEntry, 
  updateTimeEntry, 
  deleteTimeEntry, 
  getTimeEntries, 
  deleteAllTimeEntries 
} = service;
