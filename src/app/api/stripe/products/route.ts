import { NextResponse } from 'next/server'

import { getCachedStripeProducts } from '@/services/stripe/stripe-cached'

export async function GET() {
  try {
    const products = await getCachedStripeProducts()
    return NextResponse.json(products)
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    const message = errorMessage || 'Failed to fetch products'
    console.error('Error fetching Stripe products:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
