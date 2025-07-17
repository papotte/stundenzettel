import { NextRequest, NextResponse } from 'next/server'

import { createCheckoutSession } from '@/services/stripe'

export async function POST(request: NextRequest) {
  try {
    const { userId, priceId, successUrl, cancelUrl } = await request.json()
    const origin = request.nextUrl.origin
    if (!userId || !priceId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 },
      )
    }
    const result = await createCheckoutSession({
      userId,
      priceId,
      successUrl,
      cancelUrl,
      origin,
    })
    return NextResponse.json(result)
  } catch (error: any) {
    const message =
      error?.message === 'Missing required parameters'
        ? error.message
        : 'Failed to create checkout session'
    const status = error?.message === 'Missing required parameters' ? 400 : 500
    console.error('Error creating checkout session:', error)
    return NextResponse.json({ error: message }, { status })
  }
}
