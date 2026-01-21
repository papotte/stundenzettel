import { useEffect, useState } from 'react'

import { getDisplayNamesForMembers } from '@/services/user-settings-service'

/**
 * Fetches displayName for each member via getDisplayNamesForMembers (which uses
 * getDisplayNameForMember). Use in team-members-list and seat-assignment-dialog.
 * Fall back to maskEmail(member.email) when displayNames.get(id) is ''.
 */
export function useMemberDisplayNames(memberIds: string[]) {
  const [displayNames, setDisplayNames] = useState<Map<string, string>>(
    () => new Map(),
  )

  const memberIdsKey = memberIds.join(',')

  useEffect(() => {
    if (memberIds.length === 0) {
      setDisplayNames(new Map())
      return
    }

    let cancelled = false

    getDisplayNamesForMembers(memberIds).then((map) => {
      if (!cancelled) setDisplayNames(map)
    })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- memberIdsKey is a stable serialization of memberIds; using memberIds would refire every render when the parent passes a new array ref (e.g. from .map()).
  }, [memberIdsKey])

  return { displayNames }
}
