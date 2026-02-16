import { useQuery } from '@tanstack/react-query'

import { useAuth } from '@/hooks/use-auth'
import { queryKeys } from '@/lib/query-keys'
import type { TeamInvitation } from '@/lib/types'
import { getUserInvitations } from '@/services/team-service'

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
    invitations,
    loading,
    refreshInvitations: refetch,
    hasPendingInvitations: invitations.length > 0,
  }
}
