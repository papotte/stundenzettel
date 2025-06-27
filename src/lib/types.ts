export interface TimeEntry {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date; // undefined if timer is running
  location: string;
  pauseDuration?: number; // in minutes
  travelTime?: number; // in decimal hours
  isDriver?: boolean;
}

export interface UserSettings {
  defaultWorkHours: number;
}
