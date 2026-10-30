'use client'

import { useQuery } from '@tanstack/react-query'

import { useAuth } from '@/hooks/use-auth'
import { projectKeys } from '@/lib/query-keys'
import { type ProjectScope, getProjects } from '@/services/project-service'
import { getUserTeamMembership } from '@/services/team-service'

/**
 * Resolves the project scope for the current user: team projects when the
 * user belongs to a team, personal projects otherwise.
 */
export function useProjectScope() {
  const { user } = useAuth()
  const uid = user?.uid ?? ''

  return useQuery({
    queryKey: ['projectScope', uid],
    queryFn: async () => {
      const membership = await getUserTeamMembership(uid)
      const scope: ProjectScope = membership
        ? { kind: 'team', teamId: membership.teamId }
        : { kind: 'user', userId: uid }
      return { scope, membership }
    },
    enabled: Boolean(uid),
  })
}

export function useProjects(
  scope: ProjectScope | null | undefined,
  enabled = true,
) {
  const scopeKey = scope
    ? projectScopeQueryKey(scope)
    : (['projects', 'none'] as const)

  return useQuery({
    queryKey: scopeKey,
    queryFn: () => getProjects(scope!),
    enabled: enabled && scope != null,
  })
}

export function projectScopeQueryKey(scope: ProjectScope) {
  return scope.kind === 'team'
    ? projectKeys.team(scope.teamId)
    : projectKeys.user(scope.userId)
}
