export interface TimeEntry {
  id: string
  userId: string
  startTime: Date
  endTime?: Date // undefined if timer is running
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
