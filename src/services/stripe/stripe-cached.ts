'use cache'

import { cacheLife, cacheTag } from 'next/cache'

import type { PricingPlan } from '@/lib/types'

import { getFallbackPlans, stripeProductsToPricingPlans } from './pricing-plans'
import { type StripeProduct, getStripeProducts } from './products'

/**
 * Cached Stripe products for use in API routes and server components.
 * Revalidate with revalidateTag('stripe-products') when products/prices change.
 */
export async function getCachedStripeProducts(): Promise<StripeProduct[]> {
  cacheLife('hours')
  cacheTag('stripe-products')
  return getStripeProducts()
}

/**
 * Cached pricing plans for server components. Uses getCachedStripeProducts
 * and stripeProductsToPricingPlans. Revalidate with revalidateTag('stripe-products').
 */
export async function getCachedPricingPlans(): Promise<PricingPlan[]> {
  cacheLife('hours')
  cacheTag('stripe-products')
  try {
    const products = await getCachedStripeProducts()
    return stripeProductsToPricingPlans(products)
  } catch {
    return getFallbackPlans()
  }
}
