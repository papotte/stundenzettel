'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/hooks/use-auth'
import { queryKeys } from '@/lib/query-keys'
import type { TeamInvitation } from '@/lib/types'
import {
  acceptTeamInvitation,
  declineTeamInvitation,
  getUserInvitations,
} from '@/services/team-service'

export function useUserInvitations() {
  const { user } = useAuth()

  const {
    data,
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: queryKeys.userInvitations(user?.email ?? ''),
    queryFn: () => getUserInvitations(user!.email),
    enabled: Boolean(user?.email),
  })

  const invitations: TeamInvitation[] = data ?? []

  return {
    invitations: user?.email ? invitations : [],
    loading,
    refreshInvitations: refetch,
    hasPendingInvitations: invitations.length > 0,
  }
}

/**
 * Accept a team invitation. Invalidates the user's invitation list and the
 * team page bundle so the new membership shows up everywhere.
 */
export function useAcceptInvitation() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (invitationId: string) => {
      if (!user?.email) throw new Error('User is required')
      return acceptTeamInvitation(invitationId, user.uid, user.email)
    },
    onSuccess: () => {
      if (user?.email) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.userInvitations(user.email),
        })
      }
      if (user?.uid) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.teamPageData(user.uid),
        })
        void queryClient.invalidateQueries({
          queryKey: queryKeys.projectScope(user.uid),
        })
      }
    },
  })
}

/**
 * Decline a team invitation. Invalidates the user's invitation list and the
 * team page bundle.
 */
export function useDeclineInvitation() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (invitationId: string) => declineTeamInvitation(invitationId),
    onSuccess: () => {
      if (user?.email) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.userInvitations(user.email),
        })
      }
      if (user?.uid) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.teamPageData(user.uid),
        })
      }
    },
  })
}
