import type { PricingPlan } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'

interface StripeProduct {
  id: string
  name: string
  description: string | null
  metadata: Record<string, string>
}

interface StripePrice {
  id: string
  product: string
  unit_amount: number
  currency: string
  recurring: {
    interval: 'month' | 'year'
    trial_period_days?: number
  } | null
  metadata: Record<string, string>
  tiers?: Array<{
    up_to: number | null
    unit_amount: number
    flat_amount: number | null
  }>
}

interface StripeProductWithPrices extends StripeProduct {
  prices: StripePrice[]
}

export class StripeService {
  private static async fetchStripeData(
    endpoint: string,
  ): Promise<StripeProductWithPrices[]> {
    const response = await fetch(`/api/stripe/${endpoint}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch Stripe data: ${response.statusText}`)
    }
    return response.json()
  }

  static async getPricingPlans(): Promise<PricingPlan[]> {
    try {
      const products = await this.fetchStripeData('products')

      return products
        .map((product: StripeProductWithPrices) => {
          // Group prices by interval (month/year)
          const pricesByInterval = product.prices.reduce(
            (acc, price) => {
              const interval = price.recurring?.interval || 'month'
              if (!acc[interval]) {
                acc[interval] = []
              }
              acc[interval].push(price)
              return acc
            },
            {} as Record<string, StripePrice[]>,
          )

          return Object.entries(pricesByInterval).map(([interval, prices]) => {
            const isTeam =
              product.metadata.type === 'team' ||
              product.name.toLowerCase().includes('team') ||
              product.description?.toLowerCase().includes('team')

            // For tiered pricing, we need to determine the appropriate price
            const price = this.getDisplayPrice(prices, product.metadata)

            // Determine plan features based on product metadata
            const features = this.getFeaturesForProduct(product, price)

            // Check if any price has tiered pricing
            const hasTieredPricing = prices.some(
              (p) => p.tiers && p.tiers.length > 0,
            )

            // Check if this price has a trial period
            const hasTrialPeriod = Boolean(
              price.recurring?.trial_period_days &&
                price.recurring.trial_period_days > 0,
            )
            const trialDays = price.recurring?.trial_period_days || undefined

            return {
              id: `${product.name.toLowerCase().replace(/\s+/g, '-')}-${interval}`,
              name: `${product.name} ${interval === 'month' ? 'Monthly' : 'Yearly'}`,
              price: price.unit_amount ? price.unit_amount / 100 : 0, // Convert from cents, handle null
              currency: price.currency.toUpperCase(),
              interval: interval as 'month' | 'year',
              features,
              stripePriceId: price.id,
              maxUsers: isTeam
                ? parseInt(product.metadata.max_users || '50')
                : undefined,
              // Add tiered pricing info if applicable
              tieredPricing: hasTieredPricing
                ? this.getTieredPricingInfo(prices)
                : undefined,
              // Add trial information
              trialDays,
              trialEnabled: hasTrialPeriod,
            }
          })
        })
        .flat()
    } catch (error) {
      console.error('Error fetching pricing plans:', error)
      // Fallback to hardcoded plans if API fails
      return this.getFallbackPlans()
    }
  }

  private static getDisplayPrice(
    prices: StripePrice[],
    metadata: Record<string, string>,
  ): StripePrice {
    // If there's only one price, return it
    if (prices.length === 1) {
      return prices[0]
    }

    // For tiered pricing, we need to determine which price to show
    // Check if there's a display_price_id in metadata
    if (metadata.display_price_id) {
      const displayPrice = prices.find(
        (p) => p.id === metadata.display_price_id,
      )
      if (displayPrice) {
        return displayPrice
      }
    }

    // For tiered pricing, find the price with tiers and use the first tier's price
    const tieredPrice = prices.find((p) => p.tiers && p.tiers.length > 0)
    if (tieredPrice && tieredPrice.tiers && tieredPrice.tiers.length > 0) {
      // Create a modified price object with the first tier's unit_amount
      return {
        ...tieredPrice,
        unit_amount: tieredPrice.tiers[0].unit_amount,
      }
    }

    // If no specific display price, show the first non-zero price
    const nonZeroPrice = prices.find((p) => p.unit_amount && p.unit_amount > 0)
    if (nonZeroPrice) {
      return nonZeroPrice
    }

    // Fallback to first price
    return prices[0]
  }

  private static getTieredPricingInfo(prices: StripePrice[]): {
    tiers: Array<{ from: number; to?: number; price: number; currency: string }>
    displayText: string
  } {
    // Find a price with tiered pricing
    const tieredPrice = prices.find((p) => p.tiers && p.tiers.length > 0)

    if (tieredPrice && tieredPrice.tiers) {
      const tiers = tieredPrice.tiers.map((tier, index) => ({
        from: index === 0 ? 1 : (tieredPrice.tiers![index - 1].up_to || 0) + 1,
        to: tier.up_to || undefined,
        price: tier.unit_amount / 100,
        currency: tieredPrice.currency.toUpperCase(),
      }))

      // Create display text
      const firstTier = tiers[0]
      const lastTier = tiers[tiers.length - 1]

      let displayText = `Starting at ${formatCurrency(firstTier.price, firstTier.currency)}`
      if (firstTier.price !== lastTier.price) {
        displayText += `, up to ${formatCurrency(lastTier.price, lastTier.currency)}`
      }

      return {
        tiers,
        displayText,
      }
    }

    // Fallback: use the old logic for non-tiered prices
    const sortedPrices = prices
      .filter((p) => p.unit_amount !== null)
      .sort((a, b) => (a.unit_amount || 0) - (b.unit_amount || 0))

    const tiers = sortedPrices.map((price, index) => ({
      from: index === 0 ? 1 : (sortedPrices[index - 1]?.unit_amount || 0) + 1,
      to: undefined,
      price: (price.unit_amount || 0) / 100,
      currency: price.currency.toUpperCase(),
    }))

    const firstPrice = tiers[0]
    const lastPrice = tiers[tiers.length - 1]

    let displayText = `Starting at ${formatCurrency(firstPrice.price, firstPrice.currency)}`
    if (firstPrice.price !== lastPrice.price) {
      displayText += `, up to ${formatCurrency(lastPrice.price, lastPrice.currency)}`
    }

    return {
      tiers,
      displayText,
    }
  }

  private static getFeaturesForProduct(
    product: StripeProduct,
    price: StripePrice,
  ): string[] {
    const baseFeatures = [
      'Unlimited time tracking',
      'Export to Excel & PDF',
      'Mobile-friendly interface',
    ]

    // Determine if it's a team plan based on product name or metadata
    const isTeam =
      product.metadata.type === 'team' ||
      product.name.toLowerCase().includes('team') ||
      product.description?.toLowerCase().includes('team')
    const isYearly = price.recurring?.interval === 'year'

    if (isTeam) {
      return [
        ...baseFeatures,
        'Team collaboration',
        'Shared projects',
        'Admin dashboard',
        'Priority support',
        ...(isYearly ? ['2 months free'] : []),
      ]
    } else {
      return [
        ...baseFeatures,
        'Email support',
        ...(isYearly ? ['2 months free'] : []),
      ]
    }
  }

  private static getFallbackPlans(): PricingPlan[] {
    // Fallback plans if Stripe API is unavailable
    return [
      {
        id: 'individual-monthly',
        name: 'Individual Monthly',
        price: 10,
        currency: 'EUR',
        interval: 'month',
        features: [
          'Unlimited time tracking',
          'Export to Excel & PDF',
          'Mobile-friendly interface',
          'Email support',
        ],
        stripePriceId: 'price_fallback_individual_monthly',
        trialDays: 14,
        trialEnabled: true,
      },
      {
        id: 'individual-yearly',
        name: 'Individual Yearly',
        price: 100,
        currency: 'EUR',
        interval: 'year',
        features: [
          'Unlimited time tracking',
          'Export to Excel & PDF',
          'Mobile-friendly interface',
          'Email support',
          '2 months free',
        ],
        stripePriceId: 'price_fallback_individual_yearly',
        trialDays: 14,
        trialEnabled: true,
      },
      {
        id: 'team-monthly',
        name: 'Team Monthly',
        price: 10,
        currency: 'EUR',
        interval: 'month',
        features: [
          'Unlimited time tracking',
          'Export to Excel & PDF',
          'Mobile-friendly interface',
          'Team collaboration',
          'Shared projects',
          'Admin dashboard',
          'Priority support',
        ],
        stripePriceId: 'price_fallback_team_monthly',
        maxUsers: 50,
        trialDays: 14,
        trialEnabled: true,
      },
      {
        id: 'team-yearly',
        name: 'Team Yearly',
        price: 100,
        currency: 'EUR',
        interval: 'year',
        features: [
          'Unlimited time tracking',
          'Export to Excel & PDF',
          'Mobile-friendly interface',
          'Team collaboration',
          'Shared projects',
          'Admin dashboard',
          'Priority support',
          '2 months free',
        ],
        stripePriceId: 'price_fallback_team_yearly',
        maxUsers: 50,
        trialDays: 14,
        trialEnabled: true,
      },
    ]
  }
}
