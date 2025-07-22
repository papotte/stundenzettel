import { teamService } from '@/services/team-service'
import type { TeamMember } from '@/lib/types'

export interface TeamAuthResult {
  authorized: boolean
  userRole?: 'owner' | 'admin' | 'member'
  error?: string
}

export async function verifyTeamAccess(
  teamId: string,
  userId: string,
  requiredRole?: 'owner' | 'admin'
): Promise<TeamAuthResult> {
  try {
    // Get team members to check if user is a member and their role
    const members = await teamService.getTeamMembers(teamId)
    const userMember = members.find((member: TeamMember) => 
      member.email === userId || member.id === userId
    )

    if (!userMember) {
      return {
        authorized: false,
        error: 'User is not a member of this team'
      }
    }

    // Check if user has required role
    if (requiredRole) {
      const hasRequiredRole = 
        userMember.role === 'owner' || 
        (requiredRole === 'admin' && (userMember.role === 'admin' || userMember.role === 'owner'))

      if (!hasRequiredRole) {
        return {
          authorized: false,
          userRole: userMember.role,
          error: `Insufficient permissions. Required: ${requiredRole}, Current: ${userMember.role}`
        }
      }
    }

    return {
      authorized: true,
      userRole: userMember.role
    }
  } catch (error) {
    console.error('Error verifying team access:', error)
    return {
      authorized: false,
      error: 'Failed to verify team access'
    }
  }
}

export async function verifyTeamOwnership(teamId: string, userId: string): Promise<boolean> {
  try {
    const team = await teamService.getTeam(teamId)
    return team?.ownerId === userId
  } catch (error) {
    console.error('Error verifying team ownership:', error)
    return false
  }
}