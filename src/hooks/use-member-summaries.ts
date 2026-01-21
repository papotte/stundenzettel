import { useCallback, useEffect, useMemo, useState } from 'react'

import { isSameDay, isSameMonth } from 'date-fns'

import {
  calculateExpectedMonthlyHours,
  calculateWeekCompensatedTime,
  calculateWeekPassengerTime,
} from '@/lib/time-utils'
import type { MemberSummary, TeamMember, TimeEntry } from '@/lib/types'
import { compareEntriesByStartTime, getWeeksForMonth } from '@/lib/utils'
import { getTimeEntries } from '@/services/time-entry-service'
import { getUserSettings } from '@/services/user-settings-service'

export function useMemberSummaries(members: TeamMember[], selectedMonth: Date) {
  const [memberSummaries, setMemberSummaries] = useState<
    Map<string, MemberSummary>
  >(new Map())

  const getEntriesForDay = useCallback((entries: TimeEntry[], day: Date) => {
    return entries
      .filter((entry) => entry.startTime && isSameDay(entry.startTime, day))
      .sort(compareEntriesByStartTime)
  }, [])

  useEffect(() => {
    const fetchMemberData = async () => {
      const summaries = new Map<string, MemberSummary>()

      // Initialize all members with loading state
      members.forEach((member) => {
        summaries.set(member.id, {
          member,
          hoursWorked: 0,
          overtime: 0,
          percentage: 0,
          isLoading: true,
          userSettings: null,
          entries: [],
        })
      })

      setMemberSummaries(summaries)

      // Fetch data for all members in parallel
      const fetchPromises = members.map(async (member) => {
        try {
          const [entries, userSettings] = await Promise.all([
            getTimeEntries(member.id),
            getUserSettings(member.id),
          ])

          // Filter entries for the selected month
          const monthEntries = entries.filter(
            (entry) =>
              entry.startTime && isSameMonth(entry.startTime, selectedMonth),
          )

          // Calculate hours worked
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

          // Calculate expected hours and overtime
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
            },
          }
        } catch (error) {
          console.error(`Error fetching data for member ${member.id}:`, error)
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
            },
          }
        }
      })

      const results = await Promise.all(fetchPromises)
      const updatedSummaries = new Map(memberSummaries)

      results.forEach(({ memberId, summary }) => {
        updatedSummaries.set(memberId, summary)
      })

      setMemberSummaries(updatedSummaries)
    }

    if (members.length > 0) {
      fetchMemberData()
    }
  }, [members, selectedMonth, getEntriesForDay])

  const sortedSummaries = useMemo(() => {
    return Array.from(memberSummaries.values()).sort((a, b) =>
      (a.userSettings?.displayName ?? a.member.email)
        .trim()
        .localeCompare((b.userSettings?.displayName ?? b.member.email).trim()),
    )
  }, [memberSummaries])

  return { sortedSummaries, memberSummaries }
}
