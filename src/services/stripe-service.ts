import type { PricingPlan } from '@/lib/types'
import {
  getFallbackPlans,
  stripeProductsToPricingPlans,
} from '@/services/stripe/pricing-plans'

export class StripeService {
  private static async fetchStripeData(endpoint: string) {
    const response = await fetch(`/api/stripe/${endpoint}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch Stripe data: ${response.statusText}`)
    }
    return response.json()
  }

  static async getPricingPlans(): Promise<PricingPlan[]> {
    try {
      const products = await this.fetchStripeData('products')
      return stripeProductsToPricingPlans(products)
    } catch (error) {
      console.error('Error fetching pricing plans:', error)
      return getFallbackPlans()
    }
  }
}
