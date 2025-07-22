import { NextRequest, NextResponse } from 'next/server'

import { teamService } from '@/services/team-service'

// GET /api/teams - Get user's team
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 },
      )
    }

    const team = await teamService.getUserTeam(userId)
    return NextResponse.json({ team })
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    console.error('Error getting user team:', error)
    return NextResponse.json(
      { error: 'Failed to get team', details: errorMessage },
      { status: 500 },
    )
  }
}

// POST /api/teams - Create new team
export async function POST(request: NextRequest) {
  try {
    const { name, description, ownerId } = await request.json()

    if (!name || !ownerId) {
      return NextResponse.json(
        { error: 'Missing required fields: name, ownerId' },
        { status: 400 },
      )
    }

    const teamId = await teamService.createTeam(name, description || '', ownerId)
    const team = await teamService.getTeam(teamId)

    return NextResponse.json({ team }, { status: 201 })
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    console.error('Error creating team:', error)
    return NextResponse.json(
      { error: 'Failed to create team', details: errorMessage },
      { status: 500 },
    )
  }
}