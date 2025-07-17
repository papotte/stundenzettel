// moved from ../team-checkout-service.ts
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

export interface CreateTeamCheckoutSessionParams {
  userId: string
  teamId: string
  priceId: string
  quantity: number
  successUrl?: string
  cancelUrl?: string
  origin: string
}

export async function createTeamCheckoutSession({
  userId,
  teamId,
  priceId,
  quantity,
  successUrl,
  cancelUrl,
  origin,
}: CreateTeamCheckoutSessionParams): Promise<{
  sessionId: string
  url: string
}> {
  if (!userId || !teamId || !priceId || !quantity) {
    throw new Error('Missing required parameters')
  }

  // Create or retrieve customer
  let customer: Stripe.Customer
  const existingCustomers = await stripe.customers.list({
    email: userId, // Using userId as email for now
    limit: 1,
  })

  if (existingCustomers.data.length > 0) {
    customer = existingCustomers.data[0]
  } else {
    customer = await stripe.customers.create({
      email: userId,
      metadata: { userId },
    })
  }

  // Create checkout session for team subscription
  const session = await stripe.checkout.sessions.create({
    customer: customer.id,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: quantity,
      },
    ],
    mode: 'subscription',
    success_url: successUrl || `${origin}/team?success=true`,
    cancel_url: cancelUrl || `${origin}/pricing?canceled=true`,
    metadata: { userId, teamId },
  })

  return {
    sessionId: session.id,
    url: session.url!,
  }
}
