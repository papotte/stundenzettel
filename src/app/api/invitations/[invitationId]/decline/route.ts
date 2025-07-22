import { NextRequest, NextResponse } from 'next/server'

import { teamService } from '@/services/team-service'

interface RouteParams {
  params: { invitationId: string }
}

// POST /api/invitations/[invitationId]/decline - Decline team invitation
export async function POST(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const { invitationId } = params

    await teamService.declineTeamInvitation(invitationId)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    console.error('Error declining team invitation:', error)
    return NextResponse.json(
      { error: 'Failed to decline team invitation', details: errorMessage },
      { status: 500 },
    )
  }
}