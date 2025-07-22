import { NextRequest, NextResponse } from 'next/server'

import { teamService } from '@/services/team-service'

interface RouteParams {
  params: { teamId: string }
}

// GET /api/teams/[teamId] - Get specific team
export async function GET(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const { teamId } = params

    const team = await teamService.getTeam(teamId)
    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 },
      )
    }

    return NextResponse.json({ team })
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    console.error('Error getting team:', error)
    return NextResponse.json(
      { error: 'Failed to get team', details: errorMessage },
      { status: 500 },
    )
  }
}

// PUT /api/teams/[teamId] - Update team
export async function PUT(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const { teamId } = params
    const { name, description } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Missing required field: name' },
        { status: 400 },
      )
    }

    await teamService.updateTeam(teamId, { name, description })
    const team = await teamService.getTeam(teamId)

    return NextResponse.json({ team })
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    console.error('Error updating team:', error)
    return NextResponse.json(
      { error: 'Failed to update team', details: errorMessage },
      { status: 500 },
    )
  }
}

// DELETE /api/teams/[teamId] - Delete team
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const { teamId } = params

    await teamService.deleteTeam(teamId)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    console.error('Error deleting team:', error)
    return NextResponse.json(
      { error: 'Failed to delete team', details: errorMessage },
      { status: 500 },
    )
  }
}