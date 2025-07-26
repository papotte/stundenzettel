// moved from ../team-checkout-service.ts
import Stripe from 'stripe'

import { getPriceTrialInfo } from './utils'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

export interface CreateTeamCheckoutSessionParams {
  userId: string
  userEmail?: string
  teamId: string
  priceId: string
  quantity: number
  successUrl?: string
  cancelUrl?: string
  origin: string
  trialEnabled?: boolean // Optional: explicitly enable/disable trials
  requirePaymentMethod?: boolean // Optional: whether to require payment method upfront
}

export async function createTeamCheckoutSession({
  userId,
  userEmail,
  teamId,
  priceId,
  quantity,
  successUrl,
  cancelUrl,
  origin,
  trialEnabled = true, // Default to true for trials
  requirePaymentMethod = true, // Default to true for payment method collection
}: CreateTeamCheckoutSessionParams): Promise<{
  sessionId: string
  url: string
}> {
  if (!userId || !teamId || !priceId || !quantity) {
    throw new Error('Missing required parameters')
  }

  // Validate that trials are enabled globally
  const globalTrialEnabled =
    process.env.NEXT_PUBLIC_STRIPE_TRIAL_ENABLED === 'true'
  if (trialEnabled && !globalTrialEnabled) {
    console.warn(
      'Trial requested but globally disabled. Proceeding without trial.',
    )
    trialEnabled = false
  }

  // Create or retrieve customer
  let customer: Stripe.Customer
  const existingCustomers = await stripe.customers.list({
    email: userEmail,
    limit: 1,
  })

  if (existingCustomers.data.length > 0) {
    customer = existingCustomers.data[0]
    // Update metadata if needed for team subscription
    if (!customer.metadata.firebase_uid || !customer.metadata.team_id) {
      await stripe.customers.update(customer.id, {
        metadata: {
          firebase_uid: userId,
          team_id: teamId,
        },
      })
    }
  } else {
    customer = await stripe.customers.create({
      email: userEmail,
      metadata: {
        firebase_uid: userId,
        team_id: teamId,
      },
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
      console.info(
        `Creating team checkout session with ${trialDays}-day trial for price: ${priceId}`,
      )
    } else {
      console.info(
        `Trial requested but price ${priceId} has no trial period configured`,
      )
    }
  } else {
    console.info(
      `Creating team checkout session without trial for price: ${priceId}`,
    )
  }

  console.log(
    userEmail,
    'Creating team checkout session for user:',
    userId,
    'and team:',
    teamId,
  )
  // Prepare checkout session parameters
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    customer: customer.id,
    line_items: [
      {
        price: priceId,
        quantity: quantity,
      },
    ],
    mode: 'subscription',
    allow_promotion_codes: true,
    success_url: successUrl || `${origin}/team?success=true`,
    cancel_url: cancelUrl || `${origin}/team?cancelled=true`,
    metadata: {
      firebase_uid: userId,
      team_id: teamId,
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

  // Create checkout session for team subscription
  const session = await stripe.checkout.sessions.create(sessionParams)

  return {
    sessionId: session.id,
    url: session.url!,
  }
}
