/**
 * TimeEntry represents a work entry for a user.
 * - All entries MUST have a startTime (used for date assignment).
 * - For interval-based entries: use startTime and endTime.
 * - For duration-only entries: set startTime to the correct date at 12:00 local time (midday), and set durationMinutes.
 * - endTime is optional for duration-only entries.
 */
export interface TimeEntry {
  id: string
  userId: string
  startTime: Date // Always required for date assignment (set to midday for duration-only)
  endTime?: Date // Only for interval-based entries
  durationMinutes?: number // Only for duration-only entries
  location: string
  pauseDuration?: number // in minutes
  travelTime?: number // in decimal hours
  isDriver?: boolean
}

export interface UserSettings {
  defaultWorkHours: number
  defaultStartTime: string
  defaultEndTime: string
  language: 'en' | 'de'
  companyName?: string
  companyEmail?: string
  companyPhone1?: string
  companyPhone2?: string
  companyFax?: string
}

export interface AuthenticatedUser {
  uid: string
  displayName: string | null
  email: string | null
}
