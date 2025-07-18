import Stripe from 'stripe'

import type { Subscription as AppSubscription } from '@/lib/types'
import { Subscription } from '@/lib/types'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

export async function getUserSubscription(
  userId: string,
): Promise<Subscription | undefined> {
  if (!userId) {
    throw new Error('User ID is required')
  }

  // Find customer by userId (using userId as email for now)
  const customers = await stripe.customers.list({
    email: userId,
    limit: 1,
  })

  if (customers.data.length === 0) {
    return undefined
  }

  const customer = customers.data[0]

  // Get active subscriptions for the customer
  const subscriptions = await stripe.subscriptions.list({
    customer: customer.id,
    status: 'all',
    limit: 1,
  })

  if (subscriptions.data.length === 0) {
    return undefined
  }

  const stripeSubscription = subscriptions.data[0]

  // Get plan information for displaying
  if (
    !stripeSubscription.items.data.length ||
    !stripeSubscription.items.data[0]?.price
  ) {
    return undefined
  }
  const productId = stripeSubscription.items.data[0].price.product as string
  const product = await stripe.products.retrieve(productId)

  const startDate = stripeSubscription.start_date
  const cancelAt = stripeSubscription.cancel_at
  // Convert to our Subscription type
  return {
    stripeSubscriptionId: stripeSubscription.id,
    stripeCustomerId: stripeSubscription.customer as string,
    planName: product.name,
    planDescription: product.description || '',
    status: stripeSubscription.status as AppSubscription['status'],
    currentPeriodStart: new Date(startDate * 1000),
    cancelAt: cancelAt ? new Date(cancelAt * 1000) : undefined,
    cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    priceId: stripeSubscription.items.data[0]?.price.id || '',
    quantity: stripeSubscription.items.data[0]?.quantity,
    updatedAt: new Date(stripeSubscription.created * 1000),
  }
}
