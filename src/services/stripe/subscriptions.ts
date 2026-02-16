import Stripe from 'stripe'

import type { Subscription as AppSubscription } from '@/lib/types'
import { Subscription } from '@/lib/types'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

export async function getUserSubscription(
  userEmail: string,
): Promise<Subscription | undefined> {
  if (!userEmail) {
    throw new Error('User ID is required')
  }

  // Try to find customer by email first (if userId is an email)
  let customer: Stripe.Customer | undefined

  // Check if userId looks like an email
  if (userEmail.includes('@')) {
    const customersByEmail = await stripe.customers.list({
      email: userEmail,
      limit: 1,
    })
    customer = customersByEmail.data[0]
  }

  // If not found by email, search by firebase_uid metadata
  if (!customer) {
    const customers = await stripe.customers.list({
      limit: 100, // Get more customers to search through
    })
    customer = customers.data.find((c) => c.metadata.firebase_uid === userEmail)
  }

  if (!customer) {
    console.error(`No customer found for userId: ${userEmail}`)
    return undefined
  }

  // Get active subscriptions for the customer
  const subscriptions = await stripe.subscriptions.list({
    customer: customer.id,
    status: 'all',
    limit: 1,
  })

  if (subscriptions.data.length === 0) {
    console.warn(`No subscriptions found for customer ${customer.id}`)
    return undefined
  }

  const stripeSubscription = subscriptions.data[0]

  // Get plan information for displaying
  if (
    !stripeSubscription.items.data.length ||
    !stripeSubscription.items.data[0]?.price
  ) {
    console.warn('No subscription items found')
    return undefined
  }
  const productId = stripeSubscription.items.data[0].price.product as string
  const product = await stripe.products.retrieve(productId)

  const startDate = stripeSubscription.start_date
  const cancelAt = stripeSubscription.cancel_at
  const trialEnd = stripeSubscription.trial_end

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
    // Add trial information
    trialEnd: trialEnd ? new Date(trialEnd * 1000) : undefined,
  }
}
