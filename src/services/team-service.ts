import type {
  Subscription,
  Team,
  TeamInvitation,
  TeamMember,
} from '@/lib/types'

import * as firestoreService from './team-service.firestore'
import * as localService from './team-service.local'

const useMockService =
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'test' ||
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'development'

const service = useMockService ? localService : firestoreService

if (useMockService) {
  console.info(
    `Using local team service (NEXT_PUBLIC_ENVIRONMENT=${process.env.NEXT_PUBLIC_ENVIRONMENT}).`,
  )
}

// Team CRUD operations
export const createTeam = (
  name: string,
  description: string,
  ownerId: string,
  ownerEmail: string,
): Promise<string> => {
  return service.createTeam(name, description, ownerId, ownerEmail)
}

export const getTeam = (teamId: string): Promise<Team | null> => {
  return service.getTeam(teamId)
}

export const updateTeam = (
  teamId: string,
  updates: Partial<Pick<Team, 'name' | 'description'>>,
): Promise<void> => {
  return service.updateTeam(teamId, updates)
}

export const deleteTeam = (teamId: string): Promise<void> => {
  return service.deleteTeam(teamId)
}

// Team member operations
export const addTeamMember = (
  teamId: string,
  userId: string,
  role: TeamMember['role'],
  invitedBy: string,
): Promise<void> => {
  return service.addTeamMember(teamId, userId, role, invitedBy)
}

export const getTeamMembers = (teamId: string): Promise<TeamMember[]> => {
  return service.getTeamMembers(teamId)
}

export const updateTeamMemberRole = (
  teamId: string,
  memberId: string,
  role: TeamMember['role'],
): Promise<void> => {
  return service.updateTeamMemberRole(teamId, memberId, role)
}

export const removeTeamMember = (
  teamId: string,
  memberId: string,
): Promise<void> => {
  return service.removeTeamMember(teamId, memberId)
}

// Team invitations
export const createTeamInvitation = (
  teamId: string,
  email: string,
  role: TeamInvitation['role'],
  invitedBy: string,
): Promise<string> => {
  return service.createTeamInvitation(teamId, email, role, invitedBy)
}

export const getTeamInvitations = (
  teamId: string,
): Promise<TeamInvitation[]> => {
  return service.getTeamInvitations(teamId)
}

export const getUserInvitations = (
  userEmail: string,
): Promise<TeamInvitation[]> => {
  return service.getUserInvitations(userEmail)
}

export const acceptTeamInvitation = (
  invitationId: string,
  userId: string,
  userEmail: string,
): Promise<void> => {
  return service.acceptTeamInvitation(invitationId, userId, userEmail)
}

export const declineTeamInvitation = (invitationId: string): Promise<void> => {
  return service.declineTeamInvitation(invitationId)
}

// User's team (single)
export const getUserTeam = (userId: string): Promise<Team | null> => {
  return service.getUserTeam(userId)
}

// Team subscription
export const getTeamSubscription = (
  teamId: string,
): Promise<Subscription | null> => {
  return service.getTeamSubscription(teamId)
}

// Real-time listeners
export const onTeamMembersChange = service.onTeamMembersChange
export const onTeamSubscriptionChange = service.onTeamSubscriptionChange
