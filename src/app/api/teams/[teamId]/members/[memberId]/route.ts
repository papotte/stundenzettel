import { NextRequest, NextResponse } from 'next/server'

import { teamService } from '@/services/team-service'

interface RouteParams {
  params: { teamId: string; memberId: string }
}

// PUT /api/teams/[teamId]/members/[memberId] - Update team member role
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { teamId, memberId } = params
    const { role } = await request.json()

    if (!role) {
      return NextResponse.json(
        { error: 'Missing required field: role' },
        { status: 400 },
      )
    }

    if (!['owner', 'admin', 'member'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be owner, admin, or member' },
        { status: 400 },
      )
    }

    await teamService.updateTeamMemberRole(teamId, memberId, role)
    const members = await teamService.getTeamMembers(teamId)

    return NextResponse.json({ members })
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    console.error('Error updating team member role:', error)
    return NextResponse.json(
      { error: 'Failed to update team member role', details: errorMessage },
      { status: 500 },
    )
  }
}

// DELETE /api/teams/[teamId]/members/[memberId] - Remove team member
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { teamId, memberId } = params

    await teamService.removeTeamMember(teamId, memberId)
    const members = await teamService.getTeamMembers(teamId)

    return NextResponse.json({ members })
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    console.error('Error removing team member:', error)
    return NextResponse.json(
      { error: 'Failed to remove team member', details: errorMessage },
      { status: 500 },
    )
  }
}
