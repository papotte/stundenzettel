import React from 'react'

import { fireEvent, render, screen, within } from '@jest-setup'

import StatsView from '@/components/stats-view'
import type { TimeEntry, UserSettings } from '@/lib/types'

const defaultUserSettings: UserSettings = {
  driverCompensationPercent: 100,
  passengerCompensationPercent: 100,
  language: 'en',
}

let mockEntries: TimeEntry[] = []
let mockUserSettings: UserSettings | null = defaultUserSettings
let mockIsLoading = false

jest.mock('@/context/time-tracker-context', () => ({
  useTimeTrackerContext: () => ({
    entries: mockEntries,
    userSettings: mockUserSettings,
    isLoading: mockIsLoading,
  }),
}))

function entryInCurrentMonth(overrides: Partial<TimeEntry> = {}): TimeEntry {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 15, 9, 0, 0)
  const end = new Date(now.getFullYear(), now.getMonth(), 15, 17, 0, 0)
  return {
    id: '1',
    userId: 'u1',
    location: 'Project A',
    startTime: start,
    endTime: end,
    pauseDuration: 0,
    ...overrides,
  }
}

/** Entry on 15 Feb 2025 (in "this month" but not in "this week" when today is 24 Feb). */
function entryFeb15(): TimeEntry {
  const start = new Date(2025, 1, 15, 9, 0, 0)
  const end = new Date(2025, 1, 15, 17, 0, 0)
  return {
    id: '1',
    userId: 'u1',
    location: 'Project A',
    startTime: start,
    endTime: end,
    pauseDuration: 0,
  }
}

describe('StatsView', () => {
  beforeEach(() => {
    mockEntries = []
    mockUserSettings = defaultUserSettings
    mockIsLoading = false
  })

  it('shows loading skeleton when isLoading is true', () => {
    mockIsLoading = true
    render(<StatsView />)
    expect(
      document.querySelector('[class*="animate-pulse"]'),
    ).toBeInTheDocument()
  })

  it('renders title, period selector, and summary when not loading', () => {
    render(<StatsView />)
    expect(screen.getByText('stats.title')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByText('stats.summaryTitle')).toBeInTheDocument()
    expect(screen.getByText('stats.summaryTotalHours')).toBeInTheDocument()
  })

  it('shows no data message when there are no entries in the period', () => {
    render(<StatsView />)
    expect(screen.getByText('stats.noData')).toBeInTheDocument()
  })

  it('shows projects table when there are entries in the period', () => {
    mockEntries = [entryInCurrentMonth()]
    render(<StatsView />)
    expect(screen.getByText('stats.sectionProjects')).toBeInTheDocument()
    expect(screen.getByText('Project A')).toBeInTheDocument()
    expect(screen.getByText('stats.project')).toBeInTheDocument()
  })

  it('shows default period in the selector (this month)', () => {
    render(<StatsView />)
    expect(screen.getByText('stats.periodThisMonth')).toBeInTheDocument()
  })

  it('updates displayed period when user selects a different option', () => {
    render(<StatsView />)
    expect(screen.getByText('stats.periodThisMonth')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('combobox'))
    fireEvent.click(screen.getByText('stats.periodThisWeek'))
    expect(screen.getByText('stats.periodThisWeek')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('combobox'))
    fireEvent.click(screen.getByText('stats.periodThisYear'))
    expect(screen.getByText('stats.periodThisYear')).toBeInTheDocument()
  })

  it('filters data by period: entry in this month but not this week', () => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date(2025, 1, 24, 12, 0, 0)) // Monday 24 Feb 2025
    mockEntries = [entryFeb15()] // 15 Feb 2025 – in Feb, not in week 24 Feb–2 Mar

    render(<StatsView />)
    expect(screen.getByText('Project A')).toBeInTheDocument()
    expect(screen.queryByText('stats.noData')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('combobox'))
    fireEvent.click(screen.getByText('stats.periodThisWeek'))
    expect(screen.getByText('stats.noData')).toBeInTheDocument()
    expect(screen.queryByText('Project A')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('combobox'))
    fireEvent.click(screen.getByText('stats.periodThisMonth'))
    expect(screen.getByText('Project A')).toBeInTheDocument()
    expect(screen.queryByText('stats.noData')).not.toBeInTheDocument()

    jest.useRealTimers()
  })

  it('updates summary total hours when period changes', () => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date(2025, 1, 24, 12, 0, 0))
    mockEntries = [entryFeb15()] // 8 hours on 15 Feb

    render(<StatsView />)
    const summarySection = screen.getByRole('region', {
      name: /stats\.summaryTitle/i,
    })
    const totalHoursDt = within(summarySection).getByText(
      'stats.summaryTotalHours',
    )
    expect(totalHoursDt.nextElementSibling).toHaveTextContent('8.0 h')

    fireEvent.click(screen.getByRole('combobox'))
    fireEvent.click(screen.getByText('stats.periodThisWeek'))
    expect(totalHoursDt.nextElementSibling).toHaveTextContent('0.0 h')

    jest.useRealTimers()
  })
})
