import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

export interface SyncTeamWithStripeParams {
  userEmail: string
  firebaseUid: string
  teamId: string
}

export async function syncTeamWithStripe({
  userEmail,
  firebaseUid,
  teamId,
}: SyncTeamWithStripeParams): Promise<void> {
  if (!userEmail || !firebaseUid || !teamId) {
    throw new Error('Missing required parameters')
  }

  // Find customer by email
  const existingCustomers = await stripe.customers.list({
    email: userEmail,
    limit: 1,
  })

  if (existingCustomers.data.length > 0) {
    // Update existing customer metadata - only update team_id, preserve firebase_uid
    const customer = existingCustomers.data[0]
    await stripe.customers.update(customer.id, {
      metadata: {
        ...customer.metadata,
        team_id: teamId,
      },
    })
  } else {
    // Create new customer with metadata
    await stripe.customers.create({
      email: userEmail,
      metadata: {
        firebase_uid: firebaseUid,
        team_id: teamId,
      },
    })
  }
}
