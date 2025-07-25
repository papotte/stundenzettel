import type {
  Subscription,
  Team,
  TeamInvitation,
  TeamMember,
} from '@/lib/types'

// Mock data store
const mockTeams: Record<string, Team> = {}
const mockMembers: Record<string, TeamMember[]> = {}
const mockInvitations: Record<string, TeamInvitation[]> = {}
const mockSubscriptions: Record<string, Subscription> = {}

let nextTeamId = 1
let nextMemberId = 1
let nextInvitationId = 1

// Team CRUD operations
export async function createTeam(
  name: string,
  description: string,
  ownerId: string,
  ownerEmail: string,
): Promise<string> {
  const teamId = `team-${nextTeamId++}`
  mockTeams[teamId] = {
    id: teamId,
    name,
    description,
    ownerId,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  mockMembers[teamId] = []

  // Add owner as first member
  await addTeamMember(teamId, ownerId, 'owner', ownerId, ownerEmail)

  return teamId
}

export async function getTeam(teamId: string): Promise<Team | null> {
  return mockTeams[teamId] || null
}

export async function updateTeam(
  teamId: string,
  updates: Partial<Pick<Team, 'name' | 'description'>>,
): Promise<void> {
  if (mockTeams[teamId]) {
    mockTeams[teamId] = {
      ...mockTeams[teamId],
      ...updates,
      updatedAt: new Date(),
    }
  }
}

export async function deleteTeam(teamId: string): Promise<void> {
  delete mockTeams[teamId]
  delete mockMembers[teamId]
  delete mockInvitations[teamId]
  delete mockSubscriptions[teamId]
}

// Team member operations
export async function addTeamMember(
  teamId: string,
  userId: string,
  role: TeamMember['role'],
  invitedBy: string,
  userEmail?: string,
): Promise<void> {
  if (!mockMembers[teamId]) {
    mockMembers[teamId] = []
  }

  const member: TeamMember = {
    id: `member-${nextMemberId++}`,
    email: userEmail || `user-${userId}@example.com`,
    role,
    joinedAt: new Date(),
    invitedBy,
  }

  mockMembers[teamId].push(member)
}

export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  return mockMembers[teamId] || []
}

export async function updateTeamMemberRole(
  teamId: string,
  memberId: string,
  role: TeamMember['role'],
): Promise<void> {
  const members = mockMembers[teamId] || []
  const member = members.find((m) => m.id === memberId)
  if (member) {
    member.role = role
  }
}

export async function removeTeamMember(
  teamId: string,
  memberId: string,
): Promise<void> {
  if (mockMembers[teamId]) {
    mockMembers[teamId] = mockMembers[teamId].filter((m) => m.id !== memberId)
  }
}

// Team invitations
export async function createTeamInvitation(
  teamId: string,
  email: string,
  role: TeamInvitation['role'],
  invitedBy: string,
): Promise<string> {
  const invitationId = `invitation-${nextInvitationId++}`
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const invitation: TeamInvitation = {
    id: invitationId,
    teamId,
    email,
    role,
    invitedBy,
    invitedAt: new Date(),
    expiresAt,
    status: 'pending',
  }

  if (!mockInvitations[teamId]) {
    mockInvitations[teamId] = []
  }
  mockInvitations[teamId].push(invitation)

  return invitationId
}

export async function getTeamInvitations(
  teamId: string,
): Promise<TeamInvitation[]> {
  return (mockInvitations[teamId] || []).filter(
    (inv) => inv.status === 'pending',
  )
}

export async function getUserInvitations(
  userEmail: string,
): Promise<TeamInvitation[]> {
  const userInvitations: TeamInvitation[] = []

  for (const invitations of Object.values(mockInvitations)) {
    const userInv = invitations.filter(
      (inv) => inv.email === userEmail && inv.status === 'pending',
    )
    userInvitations.push(...userInv)
  }

  return userInvitations.sort(
    (a, b) => b.invitedAt.getTime() - a.invitedAt.getTime(),
  )
}

export async function acceptTeamInvitation(
  invitationId: string,
  userId: string,
  userEmail: string,
): Promise<void> {
  // Find invitation across all teams
  let invitation: TeamInvitation | null = null
  let teamId: string | null = null

  for (const [tId, invitations] of Object.entries(mockInvitations)) {
    invitation = invitations.find((inv) => inv.id === invitationId) || null
    if (invitation) {
      teamId = tId
      break
    }
  }

  if (!invitation || !teamId) {
    throw new Error('Invitation not found')
  }

  // Update invitation status
  invitation.status = 'accepted'

  // Add user to team
  await addTeamMember(
    teamId,
    userId,
    invitation.role,
    invitation.invitedBy,
    userEmail,
  )
}

export async function declineTeamInvitation(
  invitationId: string,
): Promise<void> {
  // Find invitation across all teams
  for (const invitations of Object.values(mockInvitations)) {
    const invitation = invitations.find((inv) => inv.id === invitationId)
    if (invitation) {
      invitation.status = 'expired'
      break
    }
  }
}

// User's team (single)
export async function getUserTeam(userId: string): Promise<Team | null> {
  const userEmail = `user-${userId}@example.com`

  // Find team where user is a member
  for (const [teamId, members] of Object.entries(mockMembers)) {
    if (members.some((member) => member.email === userEmail)) {
      return mockTeams[teamId] || null
    }
  }

  return null
}

// Team subscription
export async function getTeamSubscription(
  teamId: string,
): Promise<Subscription | null> {
  return mockSubscriptions[teamId] || null
}

// Real-time listeners (simplified for mock)
export function onTeamMembersChange(
  teamId: string,
  callback: (members: TeamMember[]) => void,
): () => void {
  // In a real implementation, this would set up a real-time listener
  // For mock, we just call the callback with current data
  callback(mockMembers[teamId] || [])
  return () => {} // Unsubscribe function
}

export function onTeamSubscriptionChange(
  teamId: string,
  callback: (subscription: Subscription | null) => void,
): () => void {
  // In a real implementation, this would set up a real-time listener
  // For mock, we just call the callback with current data
  callback(mockSubscriptions[teamId] || null)
  return () => {} // Unsubscribe function
}
