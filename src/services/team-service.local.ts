import type {
  Subscription,
  Team,
  TeamInvitation,
  TeamMember,
} from '@/lib/types'

// Session storage keys
const STORAGE_KEYS = {
  TEAMS: 'timewise_local_teams',
  MEMBERS: 'timewise_local_members',
  INVITATIONS: 'timewise_local_invitations',
  SUBSCRIPTIONS: 'timewise_local_subscriptions',
  COUNTERS: 'timewise_local_counters',
} as const

// Helper functions for session storage
const getFromStorage = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue

  try {
    const stored = sessionStorage.getItem(key)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Convert date strings back to Date objects
      if (key === STORAGE_KEYS.TEAMS) {
        Object.values(parsed as Record<string, Team>).forEach((team) => {
          if (team.createdAt) team.createdAt = new Date(team.createdAt)
          if (team.updatedAt) team.updatedAt = new Date(team.updatedAt)
        })
      } else if (key === STORAGE_KEYS.MEMBERS) {
        Object.values(parsed as Record<string, TeamMember[]>).forEach(
          (members) => {
            members.forEach((member) => {
              if (member.joinedAt) member.joinedAt = new Date(member.joinedAt)
              if (member.seatAssignment?.assignedAt) {
                member.seatAssignment.assignedAt = new Date(
                  member.seatAssignment.assignedAt,
                )
              }
            })
          },
        )
      } else if (key === STORAGE_KEYS.INVITATIONS) {
        Object.values(parsed as Record<string, TeamInvitation[]>).forEach(
          (invitations) => {
            invitations.forEach((invitation) => {
              if (invitation.invitedAt)
                invitation.invitedAt = new Date(invitation.invitedAt)
              if (invitation.expiresAt)
                invitation.expiresAt = new Date(invitation.expiresAt)
            })
          },
        )
      } else if (key === STORAGE_KEYS.SUBSCRIPTIONS) {
        Object.values(parsed as Record<string, Subscription>).forEach(
          (subscription) => {
            if (subscription.currentPeriodStart)
              subscription.currentPeriodStart = new Date(
                subscription.currentPeriodStart,
              )
            if (subscription.cancelAt)
              subscription.cancelAt = new Date(subscription.cancelAt)
            if (subscription.updatedAt)
              subscription.updatedAt = new Date(subscription.updatedAt)
            if (subscription.trialEnd)
              subscription.trialEnd = new Date(subscription.trialEnd)
          },
        )
      }
      return parsed
    }
  } catch (error) {
    console.warn(`Failed to parse stored data for ${key}:`, error)
  }
  return defaultValue
}

const saveToStorage = (key: string, data: unknown): void => {
  if (typeof window === 'undefined') return

  try {
    sessionStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.warn(`Failed to save data to storage for ${key}:`, error)
  }
}

// Initialize data from session storage or use defaults
const mockTeams: Record<string, Team> = getFromStorage(STORAGE_KEYS.TEAMS, {})
const mockMembers: Record<string, TeamMember[]> = getFromStorage(
  STORAGE_KEYS.MEMBERS,
  {},
)
const mockInvitations: Record<string, TeamInvitation[]> = getFromStorage(
  STORAGE_KEYS.INVITATIONS,
  {},
)
const mockSubscriptions: Record<string, Subscription> = getFromStorage(
  STORAGE_KEYS.SUBSCRIPTIONS,
  {},
)

// Initialize counters from storage or use defaults
const storedCounters = getFromStorage(STORAGE_KEYS.COUNTERS, {
  nextTeamId: 1,
  nextMemberId: 1,
  nextInvitationId: 1,
})
let nextTeamId = storedCounters.nextTeamId
let nextMemberId = storedCounters.nextMemberId
let nextInvitationId = storedCounters.nextInvitationId

// Helper function to save all data to storage
const persistData = (): void => {
  saveToStorage(STORAGE_KEYS.TEAMS, mockTeams)
  saveToStorage(STORAGE_KEYS.MEMBERS, mockMembers)
  saveToStorage(STORAGE_KEYS.INVITATIONS, mockInvitations)
  saveToStorage(STORAGE_KEYS.SUBSCRIPTIONS, mockSubscriptions)
  saveToStorage(STORAGE_KEYS.COUNTERS, {
    nextTeamId,
    nextMemberId,
    nextInvitationId,
  })
}

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
  const SYSTEM_USER_ID = 'system-user-id' // Replace with actual system user ID if needed
  await addTeamMember(teamId, ownerId, 'owner', SYSTEM_USER_ID, ownerEmail)

  persistData()
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
    persistData()
  }
}

export async function deleteTeam(teamId: string): Promise<void> {
  delete mockTeams[teamId]
  delete mockMembers[teamId]
  delete mockInvitations[teamId]
  delete mockSubscriptions[teamId]
  persistData()
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
    id: userId || `member-${nextMemberId++}`,
    email: userEmail || `user${userId}@example.com`,
    role,
    joinedAt: new Date(),
    invitedBy,
  }

  // Automatically assign seat to owners
  if (role === 'owner') {
    member.seatAssignment = {
      assignedAt: new Date(),
      assignedBy: invitedBy,
      isActive: true,
    }
  }

  mockMembers[teamId].push(member)
  persistData()
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
    persistData()
  }
}

export async function removeTeamMember(
  teamId: string,
  memberId: string,
): Promise<void> {
  if (mockMembers[teamId]) {
    mockMembers[teamId] = mockMembers[teamId].filter((m) => m.id !== memberId)
    persistData()
  }
}

// Seat assignment operations
export async function assignSeat(
  teamId: string,
  memberId: string,
  assignedBy: string,
): Promise<void> {
  const members = mockMembers[teamId] || []
  const member = members.find((m) => m.id === memberId)
  if (member) {
    member.seatAssignment = {
      assignedAt: new Date(),
      assignedBy,
      isActive: true,
    }
    persistData()
  }
}

export async function unassignSeat(
  teamId: string,
  memberId: string,
  unassignedBy: string,
): Promise<void> {
  const members = mockMembers[teamId] || []
  const member = members.find((m) => m.id === memberId)
  if (member) {
    member.seatAssignment = {
      assignedAt: new Date(),
      assignedBy: unassignedBy,
      isActive: false,
    }
    persistData()
  }
}

export async function getAssignedSeats(teamId: string): Promise<TeamMember[]> {
  const members = mockMembers[teamId] || []
  return members.filter((member) => member.seatAssignment?.isActive === true)
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

  persistData()
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

  persistData()
}

export async function declineTeamInvitation(
  invitationId: string,
): Promise<void> {
  // Find invitation across all teams
  for (const invitations of Object.values(mockInvitations)) {
    const invitation = invitations.find((inv) => inv.id === invitationId)
    if (invitation) {
      invitation.status = 'expired'
      persistData()
      break
    }
  }
}

// User's team (single)
export async function getUserTeam(userId: string): Promise<Team | null> {
  // Find team where user is the owner
  for (const [, team] of Object.entries(mockTeams)) {
    if (team.ownerId === userId) {
      return team
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

// Utility function to clear all session storage data (useful for testing)
export function clearSessionStorage(): void {
  if (typeof window === 'undefined') return

  Object.values(STORAGE_KEYS).forEach((key) => {
    sessionStorage.removeItem(key)
  })

  // Reset in-memory data
  Object.keys(mockTeams).forEach((key) => delete mockTeams[key])
  Object.keys(mockMembers).forEach((key) => delete mockMembers[key])
  Object.keys(mockInvitations).forEach((key) => delete mockInvitations[key])
  Object.keys(mockSubscriptions).forEach((key) => delete mockSubscriptions[key])

  nextTeamId = 1
  nextMemberId = 1
  nextInvitationId = 1
}
