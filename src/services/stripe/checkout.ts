// moved from ../checkout-service.ts
import Stripe from 'stripe'

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
}

export async function createCheckoutSession({
  userId,
  userEmail,
  priceId,
  successUrl,
  cancelUrl,
  origin,
}: CreateCheckoutSessionParams): Promise<{ sessionId: string; url: string }> {
  if (!userId || !userEmail || !priceId) {
    throw new Error('Missing required parameters')
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
    metadata: { firebase_uid: userId },
  })

  return {
    sessionId: session.id,
    url: session.url!,
  }
}
