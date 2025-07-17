import { Stripe, loadStripe } from '@stripe/stripe-js'

import type { PricingPlan } from '@/lib/types'

import { StripeService } from './stripe-service'

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
)

// Cache for pricing plans
let cachedPricingPlans: PricingPlan[] | null = null
let cacheExpiry: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// TEST-ONLY: Reset cache for tests
export function _resetPricingPlansCacheForTest() {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error(
      '_resetPricingPlansCacheForTest can only be called in test environment',
    )
  }
  cachedPricingPlans = null
  cacheExpiry = 0
}

// Get pricing plans with caching
export async function getPricingPlans(): Promise<PricingPlan[]> {
  const now = Date.now()

  if (cachedPricingPlans && now < cacheExpiry) {
    return cachedPricingPlans
  }

  try {
    cachedPricingPlans = await StripeService.getPricingPlans()
    cacheExpiry = now + CACHE_DURATION
    return cachedPricingPlans
  } catch (error) {
    console.error('Error fetching pricing plans:', error)
    // Return fallback plans if API fails
    return []
  }
}

// Legacy export for backward compatibility
export const PRICING_PLANS: PricingPlan[] = []

export class PaymentService {
  private static instance: PaymentService
  private stripe: Stripe | null = null

  private constructor() {}

  static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService()
    }
    return PaymentService.instance
  }

  async initialize(): Promise<void> {
    if (!this.stripe) {
      this.stripe = await stripePromise
    }
  }

  async createCheckoutSession(
    userId: string,
    priceId: string,
    successUrl?: string,
    cancelUrl?: string,
  ): Promise<{ sessionId: string; url: string }> {
    await this.initialize()

    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        priceId,
        successUrl,
        cancelUrl,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to create checkout session')
    }

    return response.json()
  }

  async createTeamCheckoutSession(
    userId: string,
    teamId: string,
    priceId: string,
    quantity: number,
    successUrl?: string,
    cancelUrl?: string,
  ): Promise<{ sessionId: string; url: string }> {
    await this.initialize()

    const response = await fetch('/api/create-team-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        teamId,
        priceId,
        quantity,
        successUrl,
        cancelUrl,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to create team checkout session')
    }

    return response.json()
  }

  async createCustomerPortalSession(
    userId: string,
    returnUrl?: string,
  ): Promise<{ url: string }> {
    await this.initialize()

    const response = await fetch('/api/create-customer-portal-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        returnUrl,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to create customer portal session')
    }

    return response.json()
  }

  async redirectToCheckout(sessionUrl: string): Promise<void> {
    await this.initialize()
    window.location.href = sessionUrl
  }

  async redirectToCustomerPortal(portalUrl: string): Promise<void> {
    await this.initialize()
    window.location.href = portalUrl
  }

  getPricingPlans(): PricingPlan[] {
    return PRICING_PLANS
  }

  getIndividualPlans(): PricingPlan[] {
    return PRICING_PLANS.filter((plan) => !plan.maxUsers)
  }

  getTeamPlans(): PricingPlan[] {
    return PRICING_PLANS.filter((plan) => plan.maxUsers)
  }

  getPlanById(id: string): PricingPlan | undefined {
    return PRICING_PLANS.find((plan) => plan.id === id)
  }

  getPlanByStripePriceId(stripePriceId: string): PricingPlan | undefined {
    return PRICING_PLANS.find((plan) => plan.stripePriceId === stripePriceId)
  }
}

export const paymentService = PaymentService.getInstance()
