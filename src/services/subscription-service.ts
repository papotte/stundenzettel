import type { Subscription } from '@/lib/types'
import { getTeamSubscription, getUserTeam } from '@/services/team-service'

// Cache for subscription data - now includes team info in the key
const subscriptionCache = new Map<
  string,
  {
    subscription: Subscription | null
    ownerId: string
    hasValid: boolean
    cacheExpiry: number
  }
>()
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

  private setCacheAndReturn(
    userId: string,
    subscription: Subscription | null,
    ownerId: string,
    hasValid: boolean,
    cacheExpiry: number,
  ): { subscription: Subscription | null; ownerId: string } {
    subscriptionCache.set(userId, {
      subscription,
      ownerId,
      hasValid,
      cacheExpiry,
    })
    return { subscription, ownerId }
  }

  async getUserSubscription(
    userId: string,
  ): Promise<{ subscription: Subscription | null; ownerId: string }> {
    const now = Date.now()

    // Check cache first
    const cached = subscriptionCache.get(userId)
    if (cached && now < cached.cacheExpiry) {
      return {
        subscription: cached.subscription,
        ownerId: cached.ownerId as string,
      }
    }

    try {
      // First, try to get individual subscription
      const response = await fetch(`/api/subscriptions/${userId}`)

      if (response.ok) {
        const subscription = await response.json()
        if (subscription && Object.keys(subscription).length > 0) {
          const valid =
            subscription.status === 'active' ||
            subscription.status === 'trialing'
          return this.setCacheAndReturn(
            userId,
            subscription,
            userId,
            valid,
            now + CACHE_DURATION,
          )
        }
      }

      // If no individual subscription found, check if user is part of a team with subscription
      const userTeam = await getUserTeam(userId)
      if (userTeam) {
        const teamSubscription = await getTeamSubscription(userTeam.id)
        if (teamSubscription) {
          const valid =
            teamSubscription.status === 'active' ||
            teamSubscription.status === 'trialing'
          return this.setCacheAndReturn(
            userId,
            teamSubscription,
            userTeam.ownerId,
            valid,
            now + CACHE_DURATION,
          )
        }
      }

      // No subscription found (individual or team)
      throw new Error('No subscription found')
    } catch (error) {
      console.error('Error fetching subscription:', error)
      // Cache the error result to prevent repeated failed requests
      return this.setCacheAndReturn(
        userId,
        null,
        userId,
        false,
        now + CACHE_DURATION,
      )
    }
  }

  async hasActiveSubscription(userEmail: string): Promise<boolean> {
    const { subscription } = await this.getUserSubscription(userEmail)
    return subscription?.status === 'active'
  }

  clearCache(): void {
    subscriptionCache.clear()
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
