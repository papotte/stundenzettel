import type { TimeEntry } from '@/lib/types';
import { subDays, set } from 'date-fns';

let entries: TimeEntry[] = [
    {
        id: '1',
        userId: 'mock-user-1',
        location: 'On-site Installation',
        startTime: set(subDays(new Date(), 3), { hours: 9, minutes: 0, seconds: 0, milliseconds: 0 }),
        endTime: set(subDays(new Date(), 3), { hours: 16, minutes: 0, seconds: 0, milliseconds: 0 }),
        pauseDuration: 30,
        travelTime: 1,
        isDriver: false,
    },
    {
        id: '2',
        userId: 'mock-user-1',
        location: 'Office Work',
        startTime: set(subDays(new Date(), 1), { hours: 9, minutes: 0, seconds: 0, milliseconds: 0 }),
        endTime: set(subDays(new Date(), 1), { hours: 17, minutes: 30, seconds: 0, milliseconds: 0 }),
        pauseDuration: 45,
        travelTime: 0.5,
        isDriver: false,
    },
    {
        id: '3',
        userId: 'mock-user-1',
        location: 'Client Meeting',
        startTime: set(subDays(new Date(), 2), { hours: 10, minutes: 0, seconds: 0, milliseconds: 0 }),
        endTime: set(subDays(new Date(), 2), { hours: 12, minutes: 0, seconds: 0, milliseconds: 0 }),
        pauseDuration: 0,
        travelTime: 1,
        isDriver: true,
    },
    {
        id: '4',
        userId: 'mock-user-2',
        location: 'Home Office',
        startTime: set(subDays(new Date(), 1), { hours: 8, minutes: 15, seconds: 0, milliseconds: 0 }),
        endTime: set(subDays(new Date(), 1), { hours: 16, minutes: 45, seconds: 0, milliseconds: 0 }),
        pauseDuration: 30,
        travelTime: 0,
        isDriver: false,
    },
     {
        id: '5',
        userId: 'mock-user-1',
        location: 'Workshop Prep',
        startTime: set(new Date(), { hours: 13, minutes: 0, seconds: 0, milliseconds: 0 }),
        endTime: set(new Date(), { hours: 15, minutes: 0, seconds: 0, milliseconds: 0 }),
        pauseDuration: 0,
        travelTime: 0,
        isDriver: false,
    }
];

export const addTimeEntry = async (entry: Omit<TimeEntry, 'id'>): Promise<string> => {
  const newEntry = { ...entry, id: Date.now().toString() };
  entries.push(newEntry);
  return newEntry.id;
};

export const updateTimeEntry = async (entryId: string, entryUpdate: Partial<TimeEntry>): Promise<void> => {
  entries = entries.map(e => e.id === entryId ? { ...e, ...entryUpdate } : e);
};

export const deleteTimeEntry = async (userId: string, entryId: string): Promise<void> => {
  entries = entries.filter(e => !(e.id === entryId && e.userId === userId));
};

export const getTimeEntries = async (userId: string): Promise<TimeEntry[]> => {
  return entries
    .filter(e => e.userId === userId)
    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
};

export const deleteAllTimeEntries = async (userId: string): Promise<void> => {
    entries = entries.filter(e => e.userId !== userId);
}
