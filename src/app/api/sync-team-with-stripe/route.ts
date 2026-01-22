import { revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

import { syncTeamWithStripe } from '@/services/stripe'

export async function POST(request: NextRequest) {
  try {
    const { userEmail, firebaseUid, teamId } = await request.json()
    if (!userEmail || !firebaseUid || !teamId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 },
      )
    }
    await syncTeamWithStripe({
      userEmail,
      firebaseUid,
      teamId,
    })
    revalidateTag('subscription')
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    const message =
      errorMessage === 'Missing required parameters'
        ? errorMessage
        : 'Failed to sync team with Stripe'
    const status = errorMessage === 'Missing required parameters' ? 400 : 500
    console.error('Error syncing team with Stripe:', error)
    return NextResponse.json({ error: message }, { status })
  }
}
