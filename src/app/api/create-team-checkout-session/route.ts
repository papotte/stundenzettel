import { NextRequest, NextResponse } from 'next/server'

import { createTeamCheckoutSession } from '@/services/stripe'
import { getTeamMembers } from '@/services/team-service'

export async function POST(request: NextRequest) {
  try {
    const {
      userId,
      userEmail,
      teamId,
      priceId,
      quantity,
      successUrl,
      cancelUrl,
      trialEnabled,
      requirePaymentMethod,
    } = await request.json()
    const origin = request.nextUrl.origin
    if (!userId || !teamId || !priceId || !quantity) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 },
      )
    }
    const teamMembers = await getTeamMembers(teamId)
    const isTeamAdmin = teamMembers.some(
      (member) =>
        (member.id === userId || member.email === userEmail) &&
        (member.role === 'owner' || member.role === 'admin'),
    )

    if (!isTeamAdmin) {
      return NextResponse.json(
        {
          error: 'Insufficient permissions to create team subscription',
        },
        { status: 403 },
      )
    }

    const result = await createTeamCheckoutSession({
      userId,
      userEmail,
      teamId,
      priceId,
      quantity,
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
        : 'Failed to create team checkout session'
    const status = errorMessage === 'Missing required parameters' ? 400 : 500
    console.error('Error creating team checkout session:', error)
    return NextResponse.json({ error: message }, { status })
  }
}
