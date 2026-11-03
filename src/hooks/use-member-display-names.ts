import { useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'

import { queryKeys } from '@/lib/query-keys'
import { getDisplayNamesForMembers } from '@/services/user-settings-service'

const EMPTY_MAP = new Map<string, string>()

/**
 * Fetches displayName for each member via getDisplayNamesForMembers (which uses
 * getDisplayNameForMember). Use in team-members-list and seat-assignment-dialog.
 * Fall back to maskEmail(member.email) when displayNames.get(id) is ''.
 */
export function useMemberDisplayNames(memberIds: string[]) {
  const memberIdsKey = useMemo(
    () => [...memberIds].sort().join(','),
    [memberIds],
  )

  const { data } = useQuery({
    queryKey: queryKeys.memberDisplayNames(memberIdsKey),
    queryFn: () => getDisplayNamesForMembers(memberIds),
    enabled: memberIds.length > 0,
  })

  return { displayNames: data ?? EMPTY_MAP }
}
