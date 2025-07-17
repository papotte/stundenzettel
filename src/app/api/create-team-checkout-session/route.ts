import { NextRequest, NextResponse } from 'next/server'

import { createTeamCheckoutSession } from '@/services/stripe'

export async function POST(request: NextRequest) {
  try {
    const { userId, teamId, priceId, quantity, successUrl, cancelUrl } =
      await request.json()
    const origin = request.nextUrl.origin
    if (!userId || !teamId || !priceId || !quantity) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 },
      )
    }
    const result = await createTeamCheckoutSession({
      userId,
      teamId,
      priceId,
      quantity,
      successUrl,
      cancelUrl,
      origin,
    })
    return NextResponse.json(result)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const message =
      errorMessage === 'Missing required parameters'
        ? errorMessage
        : 'Failed to create team checkout session'
    const status = errorMessage === 'Missing required parameters' ? 400 : 500
    console.error('Error creating team checkout session:', error)
    return NextResponse.json({ error: message }, { status })
  }
}
