'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/hooks/use-auth'
import { userSettingsKeys } from '@/lib/query-keys'
import { getUserSettings } from '@/services/user-settings-service'

const USER_SETTINGS_STALE_MS = 2 * 60 * 1000

export function useUserSettings() {
  const { user } = useAuth()
  const uid = user?.uid ?? ''

  return useQuery({
    queryKey: userSettingsKeys.detail(uid),
    queryFn: () => getUserSettings(uid),
    enabled: Boolean(uid),
    staleTime: USER_SETTINGS_STALE_MS,
  })
}

export function useInvalidateUserSettings() {
  const queryClient = useQueryClient()
  return (userId: string) =>
    queryClient.invalidateQueries({ queryKey: userSettingsKeys.detail(userId) })
}
