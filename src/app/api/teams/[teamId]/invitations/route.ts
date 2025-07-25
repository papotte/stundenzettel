import { NextRequest, NextResponse } from 'next/server'

import { teamService } from '@/services/team-service'

interface RouteParams {
  params: { teamId: string }
}

// GET /api/teams/[teamId]/invitations - Get team invitations
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { teamId } = params

    const invitations = await teamService.getTeamInvitations(teamId)
    return NextResponse.json({ invitations })
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    console.error('Error getting team invitations:', error)
    return NextResponse.json(
      { error: 'Failed to get team invitations', details: errorMessage },
      { status: 500 },
    )
  }
}

// POST /api/teams/[teamId]/invitations - Create team invitation
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { teamId } = params
    const { email, role, invitedBy } = await request.json()

    if (!email || !role || !invitedBy) {
      return NextResponse.json(
        { error: 'Missing required fields: email, role, invitedBy' },
        { status: 400 },
      )
    }

    if (!['admin', 'member'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be admin or member' },
        { status: 400 },
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 },
      )
    }

    const invitationId = await teamService.createTeamInvitation(
      teamId,
      email,
      role,
      invitedBy,
    )

    return NextResponse.json({ invitationId }, { status: 201 })
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    console.error('Error creating team invitation:', error)
    return NextResponse.json(
      { error: 'Failed to create team invitation', details: errorMessage },
      { status: 500 },
    )
  }
}
