import type { PricingPlan } from '@/lib/types'

import type { StripePrice, StripeProduct } from './products'

/**
 * Transforms raw Stripe products (from API or getCachedStripeProducts) into
 * PricingPlan[]. Shared by StripeService (client) and getCachedPricingPlans (server, in stripe-cached).
 */
export function stripeProductsToPricingPlans(
  products: StripeProduct[],
): PricingPlan[] {
  return products
    .map((product) => {
      const pricesByInterval = product.prices.reduce(
        (acc, price) => {
          const interval = price.recurring?.interval || 'month'
          if (!acc[interval]) acc[interval] = []
          acc[interval].push(price)
          return acc
        },
        {} as Record<string, StripePrice[]>,
      )

      return Object.entries(pricesByInterval).map(([interval, prices]) => {
        const isTeam =
          product.metadata.type === 'team' ||
          product.name.toLowerCase().includes('team') ||
          (product.description?.toLowerCase() ?? '').includes('team')

        const price = getDisplayPrice(prices, product.metadata)
        const features = getFeaturesForProduct(product, price)
        const hasTieredPricing = prices.some(
          (p) => p.tiers && p.tiers.length > 0,
        )
        const recurring = price.recurring as {
          trial_period_days?: number
        } | null
        const hasTrialPeriod = Boolean(
          recurring?.trial_period_days && recurring.trial_period_days > 0,
        )
        const trialDays = recurring?.trial_period_days

        return {
          id: `${product.name.toLowerCase().replace(/\s+/g, '-')}-${interval}`,
          name: `${product.name} ${interval === 'month' ? 'Monthly' : 'Yearly'}`,
          price: price.unit_amount ? price.unit_amount / 100 : 0,
          currency: price.currency.toUpperCase(),
          interval: interval as 'month' | 'year',
          features,
          stripePriceId: price.id,
          maxUsers: isTeam
            ? parseInt(product.metadata.max_users || '50', 10)
            : undefined,
          tieredPricing: hasTieredPricing
            ? getTieredPricingInfo(prices)
            : undefined,
          trialDays,
          trialEnabled: hasTrialPeriod,
        }
      })
    })
    .flat()
}

function getDisplayPrice(
  prices: StripePrice[],
  metadata: Record<string, string>,
): StripePrice {
  if (prices.length === 1) return prices[0]

  if (metadata.display_price_id) {
    const p = prices.find((x) => x.id === metadata.display_price_id)
    if (p) return p
  }

  const tiered = prices.find((p) => p.tiers && p.tiers.length > 0)
  if (tiered?.tiers?.length) {
    return {
      ...tiered,
      unit_amount: tiered.tiers[0].unit_amount ?? tiered.unit_amount,
    }
  }

  const nonZero = prices.find((p) => p.unit_amount != null && p.unit_amount > 0)
  if (nonZero) return nonZero
  return prices[0]
}

function getTieredPricingInfo(
  prices: StripePrice[],
): Array<{ from: number; to?: number; price: number; currency: string }> {
  const tiered = prices.find((p) => p.tiers && p.tiers.length > 0)
  if (tiered?.tiers) {
    return tiered.tiers.map((tier, i) => ({
      from: i === 0 ? 1 : (tiered.tiers![i - 1].up_to ?? 0) + 1,
      to: tier.up_to ?? undefined,
      price: (tier.unit_amount ?? 0) / 100,
      currency: tiered.currency.toUpperCase(),
    }))
  }

  const sorted = prices
    .filter((p) => p.unit_amount != null)
    .sort((a, b) => (a.unit_amount ?? 0) - (b.unit_amount ?? 0))
  return sorted.map((price, i) => ({
    from: i === 0 ? 1 : (sorted[i - 1]?.unit_amount ?? 0) + 1,
    to: undefined,
    price: (price.unit_amount ?? 0) / 100,
    currency: price.currency.toUpperCase(),
  }))
}

function getFeaturesForProduct(
  product: StripeProduct,
  price: StripePrice,
): string[] {
  const base = [
    'Unlimited time tracking',
    'Export to Excel & PDF',
    'Mobile-friendly interface',
  ]
  const isTeam =
    product.metadata.type === 'team' ||
    product.name.toLowerCase().includes('team') ||
    (product.description?.toLowerCase() ?? '').includes('team')
  const isYearly = price.recurring?.interval === 'year'

  if (isTeam) {
    return [
      ...base,
      'Team collaboration',
      'Shared projects',
      'Admin dashboard',
      'Priority support',
      ...(isYearly ? ['2 months free'] : []),
    ]
  }
  return [...base, 'Email support', ...(isYearly ? ['2 months free'] : [])]
}

export function getFallbackPlans(): PricingPlan[] {
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
