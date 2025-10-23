import React from 'react'

import { render, screen } from '@jest-setup'

import { isSameDay } from 'date-fns'

import type { TimeEntry, UserSettings } from '@/lib/types'

import TimesheetPreviewTotals from '../timesheet-preview-totals'

// --- TEST SETUP ---
const mockUserSettings: UserSettings = {
  companyName: 'Test Inc.',
  defaultWorkHours: 8,
  defaultStartTime: '09:00',
  defaultEndTime: '17:00',
  language: 'en',
}

const mockEntries: TimeEntry[] = [
  {
    id: '1',
    userId: 'test-user',
    location: 'Office',
    startTime: new Date('2024-07-01T09:00:00'),
    endTime: new Date('2024-07-01T17:00:00'),
    pauseDuration: 30, // 0.5 hours
    driverTimeHours: 0.5, // 0.5 hours as driver
    passengerTimeHours: 0,
  },
  {
    id: '2',
    userId: 'test-user',
    location: 'SICK_LEAVE',
    startTime: new Date('2024-07-02T09:00:00'),
    endTime: new Date('2024-07-02T17:00:00'), // 8 hours
    pauseDuration: 0,
    driverTimeHours: 0,
    passengerTimeHours: 0,
  },
]

const mockGetEntriesForDay = (day: Date) =>
  mockEntries.filter((e) => isSameDay(e.startTime, day))

const mockRelevantWeeks = [
  [
    new Date('2024-07-01'),
    new Date('2024-07-02'),
    new Date('2024-07-03'),
    new Date('2024-07-04'),
    new Date('2024-07-05'),
  ],
]

const mockSelectedMonth = new Date('2024-07-15T00:00:00')

// --- TESTS ---
describe('TimesheetPreviewTotals', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('displays expected hours and overtime correctly', () => {
    const settingsWithExpectedHours: UserSettings = {
      ...mockUserSettings,
      defaultWorkHours: 8,
      expectedMonthlyHours: 160,
    }

    const testEntry: TimeEntry = {
      id: '1',
      userId: 'test-user',
      location: 'Office',
      startTime: new Date('2024-07-01T09:00:00'),
      endTime: new Date('2024-07-01T17:00:00'),
      pauseDuration: 30, // 7.5 hours worked
      driverTimeHours: 0,
      passengerTimeHours: 0,
    }

    const testGetEntriesForDay = (day: Date) =>
      isSameDay(testEntry.startTime, day) ? [testEntry] : []

    render(
      <TimesheetPreviewTotals
        selectedMonth={mockSelectedMonth}
        relevantWeeks={mockRelevantWeeks}
        getEntriesForDay={testGetEntriesForDay}
        userSettings={settingsWithExpectedHours}
      />,
    )

    // Expected hours should be shown
    const expectedHoursElement = screen.getByTestId('timesheet-expected-hours')
    expect(expectedHoursElement).toBeInTheDocument()
    expect(expectedHoursElement.textContent).toBe('160.00')

    // Overtime should be shown
    const overtimeElement = screen.getByTestId('timesheet-overtime')
    expect(overtimeElement).toBeInTheDocument()
    expect(overtimeElement.textContent).toContain('-152.50') // 7.5 - 160
  })

  it('displays monthly totals correctly', () => {
    render(
      <TimesheetPreviewTotals
        selectedMonth={mockSelectedMonth}
        relevantWeeks={mockRelevantWeeks}
        getEntriesForDay={mockGetEntriesForDay}
        userSettings={mockUserSettings}
      />,
    )

    // Monthly compensated total: (8h - 0.5h pause + 0.5h driver) + 8h = 16.0
    const monthTotalElement = screen.getByTestId('timesheet-month-total')
    expect(monthTotalElement.textContent).toBe('16.00')

    // Monthly passenger total: 0 + 0 = 0
    const monthPassengerElement = screen.getByTestId(
      'timesheet-month-passenger-total',
    )
    expect(monthPassengerElement.textContent).toBe('0.00')

    // Monthly adjusted total (compensated + compensated passenger): 16.0 + 0 = 16.0
    const monthAdjustedElement = screen.getByTestId('timesheet-month-adjusted')
    expect(monthAdjustedElement.textContent).toBe('16.00')
  })

  it('displays correct converted totals with passenger hours', () => {
    const entriesWithPassenger: TimeEntry[] = [
      {
        id: '1',
        userId: 'test-user',
        location: 'Office',
        startTime: new Date('2024-07-01T09:00:00'),
        endTime: new Date('2024-07-01T17:00:00'),
        pauseDuration: 30, // 7.5 hours worked
        driverTimeHours: 0,
        passengerTimeHours: 2, // 2 hours as passenger
      },
    ]
    const userSettingsWithPassengerPercent: UserSettings = {
      ...mockUserSettings,
      passengerCompensationPercent: 80,
    }

    const testGetEntriesForDay = (day: Date) =>
      entriesWithPassenger.filter((e) => isSameDay(e.startTime, day))

    render(
      <TimesheetPreviewTotals
        selectedMonth={mockSelectedMonth}
        relevantWeeks={mockRelevantWeeks}
        getEntriesForDay={testGetEntriesForDay}
        userSettings={userSettingsWithPassengerPercent}
      />,
    )

    // Check for the converted total (monthCompTotal + compensatedPassengerHours)
    const monthAdjustedElement = screen.getByTestId('timesheet-month-adjusted')
    expect(monthAdjustedElement.textContent).toBe('9.10') // 7.5 + 1.6

    // Check compensated passenger hours display
    const compensatedPassengerElement = screen.getByText('1.60')
    expect(compensatedPassengerElement).toBeInTheDocument()
  })

  it('calculates overtime correctly with positive values', () => {
    const settingsWithExpectedHours: UserSettings = {
      ...mockUserSettings,
      expectedMonthlyHours: 160,
    }

    const testEntry: TimeEntry = {
      id: '1',
      userId: 'test-user',
      location: 'Office',
      startTime: new Date('2024-07-01T09:00:00'),
      endTime: new Date('2024-07-01T17:00:00'),
      pauseDuration: 0, // 8 hours worked
      driverTimeHours: 0,
      passengerTimeHours: 0,
    }

    const testGetEntriesForDay = (day: Date) =>
      isSameDay(testEntry.startTime, day) ? [testEntry] : []

    render(
      <TimesheetPreviewTotals
        selectedMonth={mockSelectedMonth}
        relevantWeeks={mockRelevantWeeks}
        getEntriesForDay={testGetEntriesForDay}
        userSettings={settingsWithExpectedHours}
      />,
    )

    const overtimeElement = screen.getByTestId('timesheet-overtime')
    expect(overtimeElement.textContent).toContain('-152.00') // 8 - 160
    expect(overtimeElement).toHaveClass('text-red-600')
  })

  it('calculates overtime correctly with negative values', () => {
    const settingsWithExpectedHours: UserSettings = {
      ...mockUserSettings,
      expectedMonthlyHours: 180,
    }

    const testEntry: TimeEntry = {
      id: '1',
      userId: 'test-user',
      location: 'Office',
      startTime: new Date('2024-07-01T09:00:00'),
      endTime: new Date('2024-07-01T17:00:00'),
      pauseDuration: 0, // 8 hours worked
      driverTimeHours: 0,
      passengerTimeHours: 0,
    }

    const testGetEntriesForDay = (day: Date) =>
      isSameDay(testEntry.startTime, day) ? [testEntry] : []

    render(
      <TimesheetPreviewTotals
        selectedMonth={mockSelectedMonth}
        relevantWeeks={mockRelevantWeeks}
        getEntriesForDay={testGetEntriesForDay}
        userSettings={settingsWithExpectedHours}
      />,
    )

    const overtimeElement = screen.getByTestId('timesheet-overtime')
    expect(overtimeElement.textContent).toContain('-172.00') // 8 - 180
    expect(overtimeElement).toHaveClass('text-red-600')
  })

  it('calculates expected hours from defaultWorkHours when expectedMonthlyHours is not set', () => {
    const settingsWithOnlyDefaultWorkHours: UserSettings = {
      ...mockUserSettings,
      defaultWorkHours: 8, // Should auto-calculate: 8 * 260 / 12 = 173.33
      // expectedMonthlyHours is not set, so it should auto-calculate
    }

    const testEntry: TimeEntry = {
      id: '1',
      userId: 'test-user',
      location: 'Office',
      startTime: new Date('2024-07-01T09:00:00'),
      endTime: new Date('2024-07-01T17:00:00'),
      pauseDuration: 0, // 8 hours worked
      driverTimeHours: 0,
      passengerTimeHours: 0,
    }

    const testGetEntriesForDay = (day: Date) =>
      isSameDay(testEntry.startTime, day) ? [testEntry] : []

    render(
      <TimesheetPreviewTotals
        selectedMonth={mockSelectedMonth}
        relevantWeeks={mockRelevantWeeks}
        getEntriesForDay={testGetEntriesForDay}
        userSettings={settingsWithOnlyDefaultWorkHours}
      />,
    )

    const expectedHoursElement = screen.getByTestId('timesheet-expected-hours')
    // Should auto-calculate: 8 * 260 / 12 = 173.33 -> 173.00 (rounded)
    expect(expectedHoursElement.textContent).toBe('173.00')

    const overtimeElement = screen.getByTestId('timesheet-overtime')
    // Overtime should be calculated with auto-calculated value: 8 - 173 = -165
    expect(overtimeElement.textContent).toContain('-165.00')
  })
})
