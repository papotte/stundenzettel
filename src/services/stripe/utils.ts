import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

export interface TrialPeriodInfo {
  hasTrialPeriod: boolean
  trialDays: number
}

/**
 * Retrieves a Stripe price and extracts trial period information
 * @param priceId - The Stripe price ID to retrieve
 * @returns Promise<TrialPeriodInfo> - Object containing trial period details
 * @throws Error if price ID is invalid
 */
export async function getPriceTrialInfo(
  priceId: string,
): Promise<TrialPeriodInfo> {
  let price: Stripe.Price
  try {
    price = await stripe.prices.retrieve(priceId)
  } catch (error) {
    console.error(`Error retrieving price with ID ${priceId}:`, error)
    throw new Error(`Invalid price ID: ${priceId}`)
  }

  // Check if the price has a trial period
  const hasTrialPeriod = Boolean(
    price.recurring?.trial_period_days && price.recurring.trial_period_days > 0,
  )
  const trialDays = price.recurring?.trial_period_days || 0

  return {
    hasTrialPeriod,
    trialDays,
  }
}
