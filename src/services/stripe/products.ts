import { cacheLife, cacheTag } from 'next/cache'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

export interface StripeProduct {
  id: string
  name: string
  description: string | null
  metadata: Record<string, string>
  prices: StripePrice[]
}

export interface StripePrice {
  id: string
  product: string
  currency: string
  unit_amount: number | null
  recurring: {
    interval: string
    interval_count: number
  } | null
  metadata: Record<string, string>
  tiers?: {
    up_to: number | null
    unit_amount: number | null
    flat_amount: number | null
  }[]
}

export async function getStripeProducts(): Promise<StripeProduct[]> {
  try {
    // Get all active products
    const products = await stripe.products.list({
      active: true,
      expand: ['data.default_price'],
    })

    // Get prices for each product
    return await Promise.all(
      products.data.map(async (product) => {
        const prices = await stripe.prices.list({
          product: product.id,
          active: true,
        })

        // For each price, fetch the full price object to get tiered pricing info
        const pricesWithTiers = await Promise.all(
          prices.data.map(async (price) => {
            // Fetch the full price object to get tiered pricing details
            const fullPrice = await stripe.prices.retrieve(price.id, {
              expand: ['tiers'],
            })

            return {
              id: fullPrice.id,
              product: fullPrice.product as string,
              unit_amount: fullPrice.unit_amount,
              currency: fullPrice.currency,
              recurring: fullPrice.recurring,
              metadata: fullPrice.metadata,
              // Add tiered pricing info if available
              tiers: fullPrice.tiers
                ? fullPrice.tiers.map((tier: Stripe.Price.Tier) => ({
                    up_to: tier.up_to,
                    unit_amount: tier.unit_amount,
                    flat_amount: tier.flat_amount,
                  }))
                : undefined,
            }
          }),
        )

        return {
          id: product.id,
          name: product.name,
          description: product.description,
          metadata: product.metadata,
          prices: pricesWithTiers,
        }
      }),
    )
  } catch (error) {
    console.error('Error fetching Stripe products:', error)
    throw new Error('Failed to fetch products')
  }
}

/**
 * Cached Stripe products for use in API routes and server components.
 * Revalidate with revalidateTag('stripe-products') when products/prices change.
 */
export async function getCachedStripeProducts(): Promise<StripeProduct[]> {
  'use cache'
  cacheLife('hours')
  cacheTag('stripe-products')
  return getStripeProducts()
}
