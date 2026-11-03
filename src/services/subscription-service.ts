import type { Subscription } from '@/lib/types'
import { getTeamSubscription, getUserTeam } from '@/services/team-service'

export class SubscriptionService {
  private static instance: SubscriptionService

  private constructor() {}

  static getInstance(): SubscriptionService {
    if (!SubscriptionService.instance) {
      SubscriptionService.instance = new SubscriptionService()
    }
    return SubscriptionService.instance
  }

  async getUserSubscription(
    userId: string,
  ): Promise<{ subscription: Subscription | null; ownerId: string }> {
    try {
      // First, try to get individual subscription
      const response = await fetch(`/api/subscriptions/${userId}`)

      if (response.ok) {
        const subscription = await response.json()
        if (subscription && Object.keys(subscription).length > 0) {
          return { subscription, ownerId: userId }
        }
      }

      // If no individual subscription found, check if user is part of a team with subscription
      const userTeam = await getUserTeam(userId)
      if (userTeam) {
        const teamSubscription = await getTeamSubscription(userTeam.id)
        if (teamSubscription) {
          return {
            subscription: teamSubscription,
            ownerId: userTeam.ownerId,
          }
        }
      }
      // No subscription found (individual or team)
    } catch (error) {
      console.error('Error fetching subscription:', error)
    }
    return { subscription: null, ownerId: userId }
  }

  async hasActiveSubscription(userEmail: string): Promise<boolean> {
    const { subscription } = await this.getUserSubscription(userEmail)
    return subscription?.status === 'active'
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
