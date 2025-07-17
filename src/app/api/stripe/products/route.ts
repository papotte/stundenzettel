import { NextResponse } from 'next/server'

import { getStripeProducts } from '@/services/stripe/products'

export async function GET() {
  try {
    const products = await getStripeProducts()
    return NextResponse.json(products)
  } catch (error: any) {
    const message = error?.message || 'Failed to fetch products'
    console.error('Error fetching Stripe products:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
