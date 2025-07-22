import { NextRequest, NextResponse } from 'next/server'

import { teamService } from '@/services/team-service'

interface RouteParams {
  params: { invitationId: string }
}

// POST /api/invitations/[invitationId]/accept - Accept team invitation
export async function POST(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const { invitationId } = params
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 },
      )
    }

    await teamService.acceptTeamInvitation(invitationId, userId)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    console.error('Error accepting team invitation:', error)
    return NextResponse.json(
      { error: 'Failed to accept team invitation', details: errorMessage },
      { status: 500 },
    )
  }
}