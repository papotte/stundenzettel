export interface TimeEntry {
  id: string;
  project: string;
  startTime: Date;
  endTime?: Date; // undefined if timer is running
  location: string;
}

export type TimeEntryFormData = Omit<TimeEntry, "id" | "startTime"> & {
  id?: string;
  date: Date;
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
};
