// moved from ../checkout-service.ts
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

export interface CreateCheckoutSessionParams {
  userId: string
  priceId: string
  successUrl?: string
  cancelUrl?: string
  origin: string
}

export async function createCheckoutSession({
  userId,
  priceId,
  successUrl,
  cancelUrl,
  origin,
}: CreateCheckoutSessionParams): Promise<{ sessionId: string; url: string }> {
  if (!userId || !priceId) {
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

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customer.id,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl || `${origin}/settings?success=true`,
    cancel_url: cancelUrl || `${origin}/pricing?canceled=true`,
    metadata: { userId },
  })

  return {
    sessionId: session.id,
    url: session.url!,
  }
}
