'use server'

import type { GetSubscriptionResult } from '@/lib/subscription-server'
import { getSubscriptionForUser } from '@/lib/subscription-server'

/**
 * Server action: fetch subscription for userId (cached per userId on the server).
 */
export async function getSubscriptionForUserAction(
  userId: string | undefined,
): Promise<GetSubscriptionResult> {
  if (!userId) {
    return { hasValidSubscription: false, subscription: null }
  }
  return getSubscriptionForUser(userId)
}
