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
    return NextResponse.json(subscription)
  } catch (error: any) {
    const message =
      error?.message === 'User ID is required'
        ? error.message
        : 'Failed to fetch subscription'
    const status = error?.message === 'User ID is required' ? 400 : 500
    console.error('Error fetching subscription:', error)
    return NextResponse.json({ error: message }, { status })
  }
}
