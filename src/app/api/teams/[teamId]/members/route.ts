import { NextRequest, NextResponse } from 'next/server'

import { teamService } from '@/services/team-service'

interface RouteParams {
  params: { teamId: string }
}

// GET /api/teams/[teamId]/members - Get team members
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { teamId } = params

    const members = await teamService.getTeamMembers(teamId)
    return NextResponse.json({ members })
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    console.error('Error getting team members:', error)
    return NextResponse.json(
      { error: 'Failed to get team members', details: errorMessage },
      { status: 500 },
    )
  }
}

// POST /api/teams/[teamId]/members - Add team member
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { teamId } = params
    const { userId, role, invitedBy } = await request.json()

    if (!userId || !role || !invitedBy) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, role, invitedBy' },
        { status: 400 },
      )
    }

    if (!['admin', 'member'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be admin or member' },
        { status: 400 },
      )
    }

    await teamService.addTeamMember(teamId, userId, role, invitedBy)
    const members = await teamService.getTeamMembers(teamId)

    return NextResponse.json({ members }, { status: 201 })
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    console.error('Error adding team member:', error)
    return NextResponse.json(
      { error: 'Failed to add team member', details: errorMessage },
      { status: 500 },
    )
  }
}
