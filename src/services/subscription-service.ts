import type { Subscription } from '@/lib/types'

// Cache for subscription data
let cachedSubscription: Subscription | null = null
let cacheExpiry: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export class SubscriptionService {
  private static instance: SubscriptionService

  private constructor() {}

  static getInstance(): SubscriptionService {
    if (!SubscriptionService.instance) {
      SubscriptionService.instance = new SubscriptionService()
    }
    return SubscriptionService.instance
  }

  async getUserSubscription(userId: string): Promise<Subscription | null> {
    const now = Date.now()

    if (cachedSubscription && now < cacheExpiry) {
      return cachedSubscription
    }

    try {
      const response = await fetch(`/api/subscriptions/${userId}`)

      if (response.ok) {
        const subscription = await response.json()
        cachedSubscription = subscription
        cacheExpiry = now + CACHE_DURATION
        return subscription
      }

      // Log the error response
      const errorData = await response
        .json()
        .catch(() => ({ error: 'Failed to parse error response' }))
      console.error('Subscription API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      })

      return null
    } catch (error) {
      console.error('Error fetching subscription:', error)
      return null
    }
  }

  async hasActiveSubscription(userEmail: string): Promise<boolean> {
    const subscription = await this.getUserSubscription(userEmail)
    return subscription?.status === 'active'
  }

  clearCache(): void {
    cachedSubscription = null
    cacheExpiry = 0
  }

  // Helper method to check if subscription is in trial
  isInTrial(subscription: Subscription | null): boolean {
    return subscription?.status === 'trialing'
  }

  // Helper method to check if subscription is past due
  isPastDue(subscription: Subscription | null): boolean {
    return subscription?.status === 'past_due'
  }

  // Helper method to check if subscription is canceled
  isCanceled(subscription: Subscription | null): boolean {
    return subscription?.status === 'canceled'
  }

  // Helper method to get trial end date
  getTrialEndDate(subscription: Subscription | null): Date | undefined {
    return subscription?.trialEnd
  }

  // Helper method to check if trial is expiring soon (within X days)
  isTrialExpiringSoon(
    subscription: Subscription | null,
    daysThreshold: number = 3,
  ): boolean {
    if (!subscription?.trialEnd || subscription.status !== 'trialing') {
      return false
    }

    const now = new Date()
    const trialEnd = new Date(subscription.trialEnd)
    const daysUntilExpiry =
      (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)

    return daysUntilExpiry <= daysThreshold
  }

  // Helper method to get days remaining in trial
  getDaysRemainingInTrial(subscription: Subscription | null): number | null {
    if (!subscription?.trialEnd || subscription.status !== 'trialing') {
      return null
    }

    const now = new Date()
    const trialEnd = new Date(subscription.trialEnd)
    const daysRemaining =
      (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)

    return Math.max(0, Math.ceil(daysRemaining))
  }
}

export const subscriptionService = SubscriptionService.getInstance()
