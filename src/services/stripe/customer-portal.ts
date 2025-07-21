import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

export interface CreateCustomerPortalSessionParams {
  userId: string
  returnUrl?: string
  origin: string
}

export async function createCustomerPortalSession({
  userId,
  returnUrl,
  origin,
}: CreateCustomerPortalSessionParams): Promise<{ url: string }> {
  if (!userId) {
    throw new Error('Missing required parameters')
  }

  // Find customer by userId
  const customers = await stripe.customers.list({
    email: userId, // Using userId as email for now
    limit: 1,
  })

  if (customers.data.length === 0) {
    throw new Error('Customer not found')
  }

  const customer = customers.data[0]

  // Create customer portal session
  const session = await stripe.billingPortal.sessions.create({
    customer: customer.id,
    return_url: returnUrl || `${origin}/settings`,
  })

  return {
    url: session.url,
  }
}
