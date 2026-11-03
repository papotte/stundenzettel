'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/lib/query-keys'
import type { Team, TimeEntry, UserSettings } from '@/lib/types'
import {
  getPublishedMonth,
  publishMonthForTeam,
} from '@/services/published-export-service'
import { getUserTeam } from '@/services/team-service'
import { getTimeEntries } from '@/services/time-entry-service'
import { getUserSettings } from '@/services/user-settings-service'

export interface ExportPreviewData {
  entries: TimeEntry[]
  userSettings: UserSettings | null
  userTeam: Team | null
}

/**
 * Initial export-preview bundle: the user's entries, settings, and team.
 */
export function useExportPreviewData(user: { uid: string } | null) {
  const uid = user?.uid ?? ''
  return useQuery({
    queryKey: queryKeys.exportPreviewData(uid),
    queryFn: async (): Promise<ExportPreviewData> => {
      const [entries, userSettings, userTeam] = await Promise.all([
        getTimeEntries(uid),
        getUserSettings(uid),
        getUserTeam(uid),
      ])
      return { entries, userSettings, userTeam }
    },
    enabled: Boolean(uid),
  })
}

/**
 * Published snapshot for a member/month. Only runs when teamId and monthKey
 * are present; memberId defaults to the current user handled by the caller.
 */
export function usePublishedMonth(
  teamId: string | null | undefined,
  memberId: string | null | undefined,
  monthKey: string | null | undefined,
) {
  return useQuery({
    queryKey: queryKeys.publishedMonth(
      teamId ?? '',
      memberId ?? '',
      monthKey ?? '',
    ),
    queryFn: () => getPublishedMonth(teamId!, memberId!, monthKey!),
    enabled: Boolean(teamId && memberId && monthKey),
  })
}

export interface PublishMonthInput {
  teamId: string
  userId: string
  monthKey: string
  entries: TimeEntry[]
  userSettings: UserSettings
}

/** Publishes a month's timesheet for the team and refreshes the snapshot. */
export function usePublishMonth() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: PublishMonthInput) =>
      publishMonthForTeam(
        input.teamId,
        input.userId,
        input.monthKey,
        input.entries,
        input.userSettings,
      ),
    onSuccess: (_data, input) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.publishedMonth(
          input.teamId,
          input.userId,
          input.monthKey,
        ),
      })
      void queryClient.invalidateQueries({
        queryKey: ['memberSummaries', input.teamId],
      })
    },
  })
}
