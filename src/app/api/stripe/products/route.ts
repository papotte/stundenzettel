import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

export async function GET() {
  try {
    // Fetch all products
    const products = await stripe.products.list({
      active: true,
      expand: ['data.default_price'],
    })

    // Fetch prices for each product
    const productsWithPrices = await Promise.all(
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

    return NextResponse.json(productsWithPrices)
  } catch (error) {
    console.error('Error fetching Stripe products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 },
    )
  }
}
