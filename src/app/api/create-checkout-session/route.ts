import { NextRequest, NextResponse } from 'next/server'

import { createCheckoutSession } from '@/services/stripe'

export async function POST(request: NextRequest) {
  try {
    const {
      userId,
      userEmail,
      priceId,
      successUrl,
      cancelUrl,
      trialEnabled,
      requirePaymentMethod,
    } = await request.json()
    const origin = request.nextUrl.origin
    if (!userId || !userEmail || !priceId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 },
      )
    }
    const result = await createCheckoutSession({
      userId,
      userEmail,
      priceId,
      successUrl,
      cancelUrl,
      origin,
      trialEnabled, // Pass through trial configuration
      requirePaymentMethod, // Pass through payment method requirement
    })
    return NextResponse.json(result)
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    const message =
      errorMessage === 'Missing required parameters'
        ? errorMessage
        : 'Failed to create checkout session'
    const status = errorMessage === 'Missing required parameters' ? 400 : 500
    console.error('Error creating checkout session:', error)
    return NextResponse.json({ error: message }, { status })
  }
}
