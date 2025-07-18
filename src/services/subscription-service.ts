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
      // TODO: Implement actual subscription check from your backend
      // For now, we'll return null (no subscription)
      // This should be replaced with a call to your backend API
      const response = await fetch(`/api/subscriptions/${userId}`)

      if (response.ok) {
        const subscription = await response.json()
        cachedSubscription = subscription
        cacheExpiry = now + CACHE_DURATION
        return subscription
      }

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
}

export const subscriptionService = SubscriptionService.getInstance()
