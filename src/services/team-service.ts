import type {
  Subscription,
  Team,
  TeamInvitation,
  TeamMember,
} from '@/lib/types'

import * as firestoreService from './team-service.firestore'

// Always use Firestore service - local service has been removed
// The environment-specific database selection is handled in firebase.ts
const service = firestoreService

const environment = process.env.NEXT_PUBLIC_ENVIRONMENT || 'production'
console.info(`Using Firestore team service for environment '${environment}'`)

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

// Seat assignment operations
export const assignSeat = (
  teamId: string,
  memberId: string,
  assignedBy: string,
): Promise<void> => {
  return service.assignSeat(teamId, memberId, assignedBy)
}

export const unassignSeat = (
  teamId: string,
  memberId: string,
  unassignedBy: string,
): Promise<void> => {
  return service.unassignSeat(teamId, memberId, unassignedBy)
}

export const getAssignedSeats = (teamId: string): Promise<TeamMember[]> => {
  return service.getAssignedSeats(teamId)
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

export const getTeamInvitation = (
  invitationId: string,
): Promise<TeamInvitation | null> => {
  return service.getTeamInvitation(invitationId)
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
