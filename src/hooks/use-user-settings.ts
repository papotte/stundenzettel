import { useQuery, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/lib/query-keys'
import type { UserSettings } from '@/lib/types'
import {
  getUserSettings,
  setUserSettings,
} from '@/services/user-settings-service'

export interface UseUserSettingsOptions {
  /** When false, the query will not run. Default true when user is present. */
  enabled?: boolean
}

/**
 * Shared hook for reading and updating user settings with React Query cache.
 * Use this wherever you need current user settings (company page, preferences, etc.).
 *
 * After saving settings (e.g. setUserSettings), invalidate so other screens refetch:
 * - queryKeys.userSettings(userId)
 * - queryKeys.timeTrackerData(userId)  // tracker compensation
 * - queryKeys.exportPreviewData(userId) // export/company details
 */
export function useUserSettings(
  user: { uid: string } | null,
  options: UseUserSettingsOptions = {},
) {
  const queryClient = useQueryClient()
  const uid = user?.uid ?? ''
  const enabled = options.enabled ?? Boolean(uid)

  const {
    data: userSettings = null,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.userSettings(uid),
    queryFn: () => getUserSettings(uid),
    enabled,
  })

  const invalidate = () => {
    if (!uid) return
    void queryClient.invalidateQueries({
      queryKey: queryKeys.userSettings(uid),
    })
    void queryClient.invalidateQueries({
      queryKey: queryKeys.timeTrackerData(uid),
    })
    void queryClient.invalidateQueries({
      queryKey: queryKeys.exportPreviewData(uid),
    })
  }

  return {
    userSettings: userSettings ?? null,
    isLoading,
    error,
    refetch,
    invalidate,
  }
}

/**
 * Save user settings and invalidate related queries so tracker, export, and
 * any useUserSettings consumers get fresh data.
 */
export async function saveUserSettings(
  userId: string,
  settings: Partial<UserSettings> & Record<string, unknown>,
): Promise<void> {
  const current = await getUserSettings(userId)
  await setUserSettings(userId, { ...current, ...settings })
}
