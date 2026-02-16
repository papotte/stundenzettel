import { useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'

import { isSameDay } from 'date-fns'

import { queryKeys } from '@/lib/query-keys'
import {
  calculateExpectedMonthlyHours,
  calculateWeekCompensatedTime,
  calculateWeekPassengerTime,
} from '@/lib/time-utils'
import type { MemberSummary, TeamMember, TimeEntry } from '@/lib/types'
import { compareEntriesByStartTime, getWeeksForMonth } from '@/lib/utils'
import { getPublishedMonth } from '@/services/published-export-service'

function formatMonthKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

const EMPTY_SUMMARIES = new Map<string, MemberSummary>()

async function fetchMemberSummaries(
  teamId: string,
  members: TeamMember[],
  monthKey: string,
  selectedMonth: Date,
): Promise<Map<string, MemberSummary>> {
  const summaries = new Map<string, MemberSummary>()

  const getEntriesForDay = (entries: TimeEntry[], day: Date) =>
    entries
      .filter((entry) => entry.startTime && isSameDay(entry.startTime, day))
      .sort(compareEntriesByStartTime)

  const fetchPromises = members.map(async (member) => {
    try {
      const data = await getPublishedMonth(teamId, member.id, monthKey)

      if (!data) {
        return {
          memberId: member.id,
          summary: {
            member,
            hoursWorked: 0,
            overtime: 0,
            percentage: 0,
            isLoading: false,
            userSettings: null,
            entries: [],
            isPublished: false,
          },
        }
      }

      const { entries: monthEntries, userSettings } = data
      const weeks = getWeeksForMonth(selectedMonth)
      const getEntriesForDayFn = (day: Date) =>
        getEntriesForDay(monthEntries, day)

      const compensatedHours = weeks.reduce(
        (total, week) =>
          total +
          calculateWeekCompensatedTime(
            week,
            getEntriesForDayFn,
            userSettings,
            selectedMonth,
          ),
        0,
      )

      const passengerHours = weeks.reduce(
        (total, week) =>
          total +
          calculateWeekPassengerTime(week, getEntriesForDayFn, selectedMonth),
        0,
      )

      const passengerCompPercent =
        userSettings?.passengerCompensationPercent ?? 90
      const compensatedPassengerHours =
        passengerHours * (passengerCompPercent / 100)

      const totalHoursWorked = compensatedHours + compensatedPassengerHours
      const expectedHours = calculateExpectedMonthlyHours(userSettings)
      const overtime = totalHoursWorked - expectedHours
      const percentage =
        expectedHours > 0 ? (totalHoursWorked / expectedHours) * 100 : 0

      return {
        memberId: member.id,
        summary: {
          member,
          hoursWorked: totalHoursWorked,
          overtime,
          percentage,
          isLoading: false,
          userSettings,
          entries: monthEntries,
          isPublished: true,
        },
      }
    } catch (error) {
      console.error(
        `Error fetching published data for member ${member.id}:`,
        error,
      )
      return {
        memberId: member.id,
        summary: {
          member,
          hoursWorked: 0,
          overtime: 0,
          percentage: 0,
          isLoading: false,
          userSettings: null,
          entries: [],
          isPublished: false,
        },
      }
    }
  })

  const results = await Promise.all(fetchPromises)
  results.forEach(({ memberId, summary }) => summaries.set(memberId, summary))
  return summaries
}

export function useMemberSummaries(
  teamId: string | null,
  members: TeamMember[],
  selectedMonth: Date,
) {
  const monthKey = formatMonthKey(selectedMonth)
  const memberIdsKey = useMemo(
    () =>
      members
        .map((m) => m.id)
        .sort()
        .join(','),
    [members],
  )

  const { data: memberSummaries = EMPTY_SUMMARIES } = useQuery({
    queryKey: queryKeys.memberSummaries(teamId ?? '', memberIdsKey, monthKey),
    queryFn: () =>
      fetchMemberSummaries(teamId!, members, monthKey, selectedMonth),
    enabled: Boolean(teamId && members.length > 0),
  })

  const hasInput = Boolean(teamId && members.length > 0)
  const effectiveSummaries = hasInput ? memberSummaries : EMPTY_SUMMARIES

  const sortedSummaries = useMemo(() => {
    return Array.from(effectiveSummaries.values()).sort((a, b) =>
      (a.userSettings?.displayName ?? a.member.email)
        .trim()
        .localeCompare((b.userSettings?.displayName ?? b.member.email).trim()),
    )
  }, [effectiveSummaries])

  return { sortedSummaries, memberSummaries: effectiveSummaries }
}
