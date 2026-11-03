'use client'

import { useEffect } from 'react'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/lib/query-keys'
import type {
  Subscription,
  Team,
  TeamInvitation,
  TeamMember,
} from '@/lib/types'
import {
  assignSeat,
  createTeam,
  createTeamInvitation,
  declineTeamInvitation,
  deleteTeam,
  getTeam,
  getTeamInvitation,
  getTeamInvitations,
  getTeamMembers,
  getTeamSubscription,
  getUserInvitations,
  getUserTeam,
  getUserTeamMembership,
  linkTeamSubscription,
  onTeamSubscriptionChange,
  removeTeamMember,
  unassignSeat,
  updateTeam,
  updateTeamMemberRole,
} from '@/services/team-service'

export interface TeamPageData {
  team: Team | null
  members: TeamMember[]
  invitations: TeamInvitation[]
  subscription: Subscription | null
  currentUserRole: 'owner' | 'admin' | 'member'
  userInvitations: TeamInvitation[]
}

export const EMPTY_TEAM_PAGE_DATA: TeamPageData = {
  team: null,
  members: [],
  invitations: [],
  subscription: null,
  currentUserRole: 'member',
  userInvitations: [],
}

async function fetchTeamPageData(
  userId: string,
  userEmail: string,
): Promise<TeamPageData> {
  const userTeam = await getUserTeam(userId)
  if (userTeam) {
    // Tolerate partial failures: the team still renders with empty sections
    // if members, invitations, or the subscription fail to load.
    const settle = <T>(promise: Promise<T>, fallback: T) =>
      Promise.resolve(promise).catch((error) => {
        console.error('Failed to load team page section:', error)
        return fallback
      })
    const [teamMembers, teamInvitations, subscriptionData] = await Promise.all([
      settle(getTeamMembers(userTeam.id), [] as TeamMember[]),
      settle(getTeamInvitations(userTeam.id), [] as TeamInvitation[]),
      settle(getTeamSubscription(userTeam.id), null as Subscription | null),
    ])
    const currentMember = teamMembers.find((m) => m.id === userId)
    return {
      team: userTeam,
      members: teamMembers,
      invitations: teamInvitations,
      subscription: subscriptionData,
      currentUserRole: currentMember?.role ?? 'member',
      userInvitations: [],
    }
  }
  const pendingInvitations = await getUserInvitations(userEmail)
  return { ...EMPTY_TEAM_PAGE_DATA, userInvitations: pendingInvitations }
}

/**
 * Team page data (team, members, invitations, subscription, role, or the
 * user's own pending invitations when they have no team).
 */
export function useTeamPageData(
  user: { uid: string; email?: string | null } | null,
) {
  const uid = user?.uid ?? ''
  return useQuery({
    queryKey: queryKeys.teamPageData(uid),
    queryFn: () => fetchTeamPageData(uid, user?.email ?? ''),
    enabled: Boolean(uid),
  })
}

/** The team the user belongs to (null when they have none). */
export function useUserTeam(user: { uid: string } | null) {
  const uid = user?.uid ?? ''
  return useQuery({
    queryKey: queryKeys.team(uid),
    queryFn: () => getUserTeam(uid),
    enabled: Boolean(uid),
  })
}

export function useTeam(teamId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.teamById(teamId ?? ''),
    queryFn: () => getTeam(teamId!),
    enabled: Boolean(teamId),
  })
}

export function useTeamInvitation(invitationId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.teamInvitation(invitationId ?? ''),
    queryFn: () => getTeamInvitation(invitationId!),
    enabled: Boolean(invitationId),
  })
}

export function useTeamMembers(teamId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.teamMembers(teamId ?? ''),
    queryFn: () => getTeamMembers(teamId!),
    enabled: Boolean(teamId),
  })
}

export function useTeamInvitations(teamId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.teamInvitations(teamId ?? ''),
    queryFn: () => getTeamInvitations(teamId!),
    enabled: Boolean(teamId),
  })
}

/** The user's own team membership record (teamId + role). */
export function useTeamMembership(user: { uid: string } | null) {
  const uid = user?.uid ?? ''
  return useQuery({
    queryKey: queryKeys.teamMembership(uid),
    queryFn: () => getUserTeamMembership(uid),
    enabled: Boolean(uid),
  })
}

export function useTeamSubscription(teamId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.teamSubscription(teamId ?? ''),
    queryFn: () => getTeamSubscription(teamId!),
    enabled: Boolean(teamId),
  })
}

/**
 * Bridges the Firestore realtime team-subscription listener into the
 * teamPageData cache via setQueryData (never into component state).
 */
export function useTeamSubscriptionListener(
  teamId: string | null | undefined,
  userId: string | undefined,
) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!teamId || !userId) return
    const unsubscribe = onTeamSubscriptionChange(
      teamId,
      (updatedSubscription) => {
        queryClient.setQueryData<TeamPageData>(
          queryKeys.teamPageData(userId),
          (prev) =>
            prev ? { ...prev, subscription: updatedSubscription } : prev,
        )
        queryClient.setQueryData(
          queryKeys.teamSubscription(teamId),
          updatedSubscription,
        )
      },
    )
    return () => unsubscribe()
  }, [teamId, userId, queryClient])
}

interface TeamInvalidationScope {
  userId?: string
  userEmail?: string
  teamId?: string
}

/**
 * Invalidates every cache that can be affected by a team mutation: the team
 * page bundle, per-team slices, the user's project scope (team membership
 * changes the scope), export preview (contains userTeam), and the user's own
 * invitation list.
 */
function useInvalidateTeamQueries() {
  const queryClient = useQueryClient()
  return ({ userId, userEmail, teamId }: TeamInvalidationScope) => {
    if (userId) {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.teamPageData(userId),
      })
      void queryClient.invalidateQueries({ queryKey: queryKeys.team(userId) })
      void queryClient.invalidateQueries({
        queryKey: queryKeys.projectScope(userId),
      })
      void queryClient.invalidateQueries({
        queryKey: queryKeys.exportPreviewData(userId),
      })
      void queryClient.invalidateQueries({
        queryKey: queryKeys.teamMembership(userId),
      })
    }
    if (teamId) {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.teamById(teamId),
      })
      void queryClient.invalidateQueries({
        queryKey: queryKeys.teamMembers(teamId),
      })
      void queryClient.invalidateQueries({
        queryKey: queryKeys.teamInvitations(teamId),
      })
      void queryClient.invalidateQueries({
        queryKey: queryKeys.teamSubscription(teamId),
      })
    }
    if (userEmail) {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.userInvitations(userEmail),
      })
    }
  }
}

export function useCreateTeam(userId: string | undefined) {
  const invalidate = useInvalidateTeamQueries()
  return useMutation({
    mutationFn: ({
      name,
      description,
      ownerEmail,
    }: {
      name: string
      description: string
      ownerEmail: string
    }) => {
      if (!userId) throw new Error('User is required')
      return createTeam(name, description, userId, ownerEmail)
    },
    onSuccess: () => invalidate({ userId }),
  })
}

export function useUpdateTeam(userId: string | undefined, teamId: string) {
  const invalidate = useInvalidateTeamQueries()
  return useMutation({
    mutationFn: (updates: Partial<Pick<Team, 'name' | 'description'>>) =>
      updateTeam(teamId, updates),
    onSuccess: () => invalidate({ userId, teamId }),
  })
}

export function useDeleteTeam(userId: string | undefined, teamId: string) {
  const invalidate = useInvalidateTeamQueries()
  return useMutation({
    mutationFn: () => deleteTeam(teamId),
    onSuccess: () => invalidate({ userId, teamId }),
  })
}

export function useUpdateMemberRole(
  userId: string | undefined,
  teamId: string,
) {
  const invalidate = useInvalidateTeamQueries()
  return useMutation({
    mutationFn: ({
      memberId,
      role,
    }: {
      memberId: string
      role: TeamMember['role']
    }) => updateTeamMemberRole(teamId, memberId, role),
    onSuccess: () => invalidate({ userId, teamId }),
  })
}

export function useRemoveMember(userId: string | undefined, teamId: string) {
  const invalidate = useInvalidateTeamQueries()
  return useMutation({
    mutationFn: (memberId: string) => removeTeamMember(teamId, memberId),
    onSuccess: () => invalidate({ userId, teamId }),
  })
}

export function useAssignSeats(
  userId: string | undefined,
  teamId: string,
  currentUserId: string,
) {
  const invalidate = useInvalidateTeamQueries()
  return useMutation({
    mutationFn: ({ memberId, assign }: { memberId: string; assign: boolean }) =>
      assign
        ? assignSeat(teamId, memberId, currentUserId)
        : unassignSeat(teamId, memberId, currentUserId),
    onSuccess: () => invalidate({ userId, teamId }),
  })
}

export function useCreateInvitation(
  userId: string | undefined,
  teamId: string,
) {
  const invalidate = useInvalidateTeamQueries()
  return useMutation({
    mutationFn: ({
      email,
      role,
      invitedBy,
    }: {
      email: string
      role: TeamInvitation['role']
      invitedBy: string
    }) => createTeamInvitation(teamId, email, role, invitedBy),
    onSuccess: () => invalidate({ userId, teamId }),
  })
}

export function useCancelInvitation(
  userId: string | undefined,
  teamId: string,
) {
  const invalidate = useInvalidateTeamQueries()
  return useMutation({
    mutationFn: (invitationId: string) => declineTeamInvitation(invitationId),
    onSuccess: () => invalidate({ userId, teamId }),
  })
}

/** Links an existing Stripe subscription to the team's subscription doc. */
export function useLinkTeamSubscription(
  userId: string | undefined,
  teamId: string,
) {
  const invalidate = useInvalidateTeamQueries()
  return useMutation({
    mutationFn: (subscription: Subscription) =>
      linkTeamSubscription(teamId, subscription),
    onSuccess: () => invalidate({ userId, teamId }),
  })
}

/**
 * Resend = decline the old invitation and create a fresh one for the same
 * email/role. Returns the new invitation id.
 */
export function useResendInvitation(
  userId: string | undefined,
  teamId: string,
) {
  const invalidate = useInvalidateTeamQueries()
  return useMutation({
    mutationFn: async (invitation: TeamInvitation) => {
      await declineTeamInvitation(invitation.id)
      return createTeamInvitation(
        invitation.teamId,
        invitation.email,
        invitation.role,
        invitation.invitedBy,
      )
    },
    onSuccess: () => invalidate({ userId, teamId }),
  })
}
