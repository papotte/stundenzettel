import { cacheLife, cacheTag } from 'next/cache'

import type { Subscription } from '@/lib/types'
import { getUserSubscription } from '@/services/stripe/subscriptions'
import { getTeamSubscription, getUserTeam } from '@/services/team-service'

export interface GetSubscriptionResult {
  hasValidSubscription: boolean
  subscription: Subscription | null
}

/**
 * Server-side subscription lookup, cached per userId.
 * Uses Stripe individual subscription first, then team subscription fallback.
 */
export async function getSubscriptionForUser(
  userId: string,
): Promise<GetSubscriptionResult> {
  'use cache'
  cacheLife('minutes')
  cacheTag('subscription')

  if (!userId) {
    return { hasValidSubscription: false, subscription: null }
  }

  try {
    const individual = await getUserSubscription(userId)
    if (individual) {
      const valid =
        individual.status === 'active' || individual.status === 'trialing'
      return {
        hasValidSubscription: valid,
        subscription: individual,
      }
    }

    const userTeam = await getUserTeam(userId)
    if (userTeam) {
      const teamSub = await getTeamSubscription(userTeam.id)
      if (teamSub) {
        const valid =
          teamSub.status === 'active' || teamSub.status === 'trialing'
        return {
          hasValidSubscription: valid,
          subscription: teamSub,
        }
      }
    }

    return { hasValidSubscription: false, subscription: null }
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return { hasValidSubscription: false, subscription: null }
  }
}
