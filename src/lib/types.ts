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
  driverTimeHours?: number // optional, decimal hours spent as driver
  passengerTimeHours?: number // optional, decimal hours spent as passenger
}

export interface UserSettings {
  defaultWorkHours: number
  defaultStartTime: string
  defaultEndTime: string
  language: 'en' | 'de'
  displayName?: string
  companyName?: string
  companyEmail?: string
  companyPhone1?: string
  companyPhone2?: string
  companyFax?: string
  driverCompensationPercent?: number // percent, default 100
  passengerCompensationPercent?: number // percent, default 90
}

export interface AuthenticatedUser {
  uid: string
  displayName: string | null
  email: string
}

// Payment and Subscription Types
export interface Subscription {
  stripeSubscriptionId: string
  stripeCustomerId: string
  status:
    | 'active'
    | 'canceled'
    | 'incomplete'
    | 'incomplete_expired'
    | 'past_due'
    | 'trialing'
    | 'unpaid'
    | 'inactive'
  currentPeriodStart: Date
  cancelAt: Date | undefined
  cancelAtPeriodEnd: boolean
  priceId: string
  planName: string
  planDescription: string
  quantity?: number
  updatedAt: Date
}

export interface Payment {
  invoiceId: string
  amount: number
  status: 'succeeded' | 'failed' | 'pending'
  paidAt?: Date
  failedAt?: Date
}

export interface PricingPlan {
  id: string
  name: string
  price: number
  currency: string
  interval: 'month' | 'year'
  features: string[]
  stripePriceId: string
  maxUsers?: number // For team plans
  tieredPricing?: {
    tiers: Array<{ from: number; to?: number; price: number; currency: string }>
    displayText: string
  }
}

// Team Management Types
export interface Team {
  id: string
  name: string
  description?: string
  ownerId: string
  createdAt: Date
  updatedAt: Date
  subscription?: Subscription
}

export interface TeamMember {
  id: string
  email: string
  role: 'owner' | 'admin' | 'member'
  joinedAt: Date
  invitedBy: string
}

export interface TeamInvitation {
  id: string
  teamId: string
  email: string
  role: 'admin' | 'member'
  invitedBy: string
  invitedAt: Date
  expiresAt: Date
  status: 'pending' | 'accepted' | 'expired'
}

// User Profile with Subscription
export interface UserProfile extends AuthenticatedUser {
  subscription?: Subscription
  teams?: TeamMember[]
  isSubscribed: boolean
  isTeamMember: boolean
}
