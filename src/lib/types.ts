export interface TimeEntry {
  id: string;
  startTime: Date;
  endTime?: Date; // undefined if timer is running
  location: string;
  pauseDuration?: number; // in minutes
  travelTime?: number; // in decimal hours
  isDriver?: boolean;
  kilometers?: number;
}
