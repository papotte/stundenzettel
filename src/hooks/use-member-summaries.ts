import { useCallback, useEffect, useMemo, useState } from 'react'

import { isSameDay } from 'date-fns'

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

export function useMemberSummaries(
  teamId: string | null,
  members: TeamMember[],
  selectedMonth: Date,
) {
  const [memberSummaries, setMemberSummaries] = useState<
    Map<string, MemberSummary>
  >(new Map())

  const getEntriesForDay = useCallback((entries: TimeEntry[], day: Date) => {
    return entries
      .filter((entry) => entry.startTime && isSameDay(entry.startTime, day))
      .sort(compareEntriesByStartTime)
  }, [])

  useEffect(() => {
    if (!teamId || members.length === 0) {
      setMemberSummaries(new Map())
      return
    }

    const monthKey = formatMonthKey(selectedMonth)

    const fetchMemberData = async () => {
      const summaries = new Map<string, MemberSummary>()

      members.forEach((member) => {
        summaries.set(member.id, {
          member,
          hoursWorked: 0,
          overtime: 0,
          percentage: 0,
          isLoading: true,
          userSettings: null,
          entries: [],
          isPublished: false,
        })
      })

      setMemberSummaries(summaries)

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
              calculateWeekPassengerTime(
                week,
                getEntriesForDayFn,
                selectedMonth,
              ),
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

      setMemberSummaries((prev) => {
        const next = new Map(prev)
        results.forEach(({ memberId, summary }) => next.set(memberId, summary))
        return next
      })
    }

    fetchMemberData()
  }, [teamId, members, selectedMonth, getEntriesForDay])

  const sortedSummaries = useMemo(() => {
    return Array.from(memberSummaries.values()).sort((a, b) =>
      (a.userSettings?.displayName ?? a.member.email)
        .trim()
        .localeCompare((b.userSettings?.displayName ?? b.member.email).trim()),
    )
  }, [memberSummaries])

  return { sortedSummaries, memberSummaries }
}
