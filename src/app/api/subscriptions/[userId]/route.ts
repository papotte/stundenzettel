import { NextRequest, NextResponse } from 'next/server'

import { getUserSubscription } from '@/services/stripe/subscriptions'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 },
      )
    }

    const subscription = await getUserSubscription(userId)
    if (!subscription) {
      return NextResponse.json(undefined)
    }
    // Serialize Date fields to ISO strings
    return NextResponse.json(subscription)
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    const message =
      errorMessage === 'User ID is required'
        ? errorMessage
        : 'Failed to fetch subscription'
    const status = errorMessage === 'User ID is required' ? 400 : 500
    console.error('Error fetching subscription:', error)
    return NextResponse.json({ error: message }, { status })
  }
}
