import Stripe from 'stripe'

import type { Subscription as AppSubscription } from '@/lib/types'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

export async function getUserSubscription(
  userId: string,
): Promise<AppSubscription | null> {
  if (!userId) {
    throw new Error('User ID is required')
  }

  // Find customer by userId (using userId as email for now)
  const customers = await stripe.customers.list({
    email: userId,
    limit: 1,
  })

  if (customers.data.length === 0) {
    return null
  }

  const customer = customers.data[0]

  // Get active subscriptions for the customer
  const subscriptions = await stripe.subscriptions.list({
    customer: customer.id,
    status: 'all',
    limit: 1,
  })

  if (subscriptions.data.length === 0) {
    return null
  }

  const stripeSubscription = subscriptions.data[0]

  // Convert to our Subscription type
  return {
    stripeSubscriptionId: stripeSubscription.id,
    stripeCustomerId: stripeSubscription.customer as string,
    status: stripeSubscription.status as AppSubscription['status'],
    currentPeriodStart: new Date(
      (
        stripeSubscription as Stripe.Subscription & {
          current_period_start: number
        }
      ).current_period_start * 1000,
    ),
    currentPeriodEnd: new Date(
      (
        stripeSubscription as Stripe.Subscription & {
          current_period_end: number
        }
      ).current_period_end * 1000,
    ),
    cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    priceId: stripeSubscription.items.data[0]?.price.id || '',
    quantity: stripeSubscription.items.data[0]?.quantity,
    updatedAt: new Date(stripeSubscription.created * 1000),
  }
}
