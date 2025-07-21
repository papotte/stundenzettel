// moved from ../checkout-service.ts
import Stripe from 'stripe'

import { getPriceTrialInfo } from './utils'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

export interface CreateCheckoutSessionParams {
  userId: string
  userEmail: string
  priceId: string
  successUrl?: string
  cancelUrl?: string
  origin: string
  trialEnabled?: boolean // Optional: explicitly enable/disable trials
  requirePaymentMethod?: boolean // Optional: whether to require payment method upfront
}

export async function createCheckoutSession({
  userId,
  userEmail,
  priceId,
  successUrl,
  cancelUrl,
  origin,
  trialEnabled = true, // Default to true for trials
  requirePaymentMethod = true, // Default to true for payment method collection
}: CreateCheckoutSessionParams): Promise<{ sessionId: string; url: string }> {
  if (!userId || !userEmail || !priceId) {
    throw new Error('Missing required parameters')
  }

  // Validate that trials are enabled globally
  const globalTrialEnabled = process.env.NEXT_PUBLIC_STRIPE_TRIAL_ENABLED === 'true'
  if (trialEnabled && !globalTrialEnabled) {
    console.warn(
      'Trial requested but globally disabled. Proceeding without trial.',
    )
    trialEnabled = false
  }

  // Create or retrieve customer
  let customer: Stripe.Customer
  const existingCustomers = await stripe.customers.list({
    email: userEmail, // Using userId as email for now
    limit: 1,
  })

  if (existingCustomers.data.length > 0) {
    customer = existingCustomers.data[0]
    // Update metadata if needed
    if (!customer.metadata.firebase_uid) {
      await stripe.customers.update(customer.id, {
        metadata: { firebase_uid: userId },
      })
    }
  } else {
    customer = await stripe.customers.create({
      email: userEmail,
      metadata: { firebase_uid: userId },
    })
  }

  // Only query Stripe price if trial is requested
  let hasTrialPeriod = false
  let trialDays = 0

  if (trialEnabled) {
    // Get trial information from Stripe price
    const trialInfo = await getPriceTrialInfo(priceId)
    hasTrialPeriod = trialInfo.hasTrialPeriod
    trialDays = trialInfo.trialDays

    // Log trial information for debugging
    if (hasTrialPeriod) {
      console.log(
        `Creating checkout session with ${trialDays}-day trial for price: ${priceId}`,
      )
    } else {
      console.warn(
        `Trial requested but price ${priceId} has no trial period configured`,
      )
    }
  } else {
    console.log(`Creating checkout session without trial for price: ${priceId}`)
  }

  // Prepare checkout session parameters
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    customer: customer.id,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl || `${origin}/subscription?success=true`,
    cancel_url: cancelUrl || `${origin}/pricing?canceled=true`,
    metadata: {
      firebase_uid: userId,
      trial_enabled: trialEnabled.toString(),
      trial_days: trialDays.toString(),
      has_trial_period: hasTrialPeriod.toString(),
      require_payment_method: requirePaymentMethod.toString(),
    },
  }

  // Configure payment method collection based on trial settings
  if (requirePaymentMethod) {
    sessionParams.payment_method_types = ['card']
  } else {
    // Free trial without payment method
    sessionParams.payment_method_collection = 'if_required'
    sessionParams.subscription_data = {
      trial_period_days: trialDays || 14, // Use price trial or default to 14 days
      trial_settings: {
        end_behavior: {
          missing_payment_method: 'cancel', // Cancel subscription if no payment method
        },
      },
    }
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create(sessionParams)

  return {
    sessionId: session.id,
    url: session.url!,
  }
}
