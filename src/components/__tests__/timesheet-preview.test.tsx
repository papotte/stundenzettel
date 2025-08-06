import React from 'react'

import { render, screen } from '@jest-setup'
import userEvent from '@testing-library/user-event'

import { isSameDay } from 'date-fns'

import type { AuthenticatedUser, TimeEntry, UserSettings } from '@/lib/types'

import TimesheetPreview from '../timesheet-preview'

// --- TEST SETUP ---
const mockUser: AuthenticatedUser = {
  uid: 'test-user',
  displayName: 'John Doe',
  email: 'john.doe@test.com',
}

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
    pauseDuration: 30, // 0.5 hours -> 0.50
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

const mockGetLocationDisplayName = (location: string) =>
  location === 'SICK_LEAVE' ? 'Sick Leave' : location
const mockOnEdit = jest.fn()
const mockOnAdd = jest.fn()

const defaultProps = {
  selectedMonth: new Date('2024-07-15T00:00:00'),
  user: mockUser,
  entries: mockEntries,
  userSettings: mockUserSettings,
  getEntriesForDay: mockGetEntriesForDay,
  getLocationDisplayName: mockGetLocationDisplayName,
  onEdit: mockOnEdit,
  onAdd: mockOnAdd,
}

// --- TESTS ---
describe('TimesheetPreview', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the header with user and company details', () => {
    render(<TimesheetPreview {...defaultProps} />)
    expect(screen.getByText('export.timesheetTitle')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText(/Test Inc/)).toBeInTheDocument()
  })

  it('renders time entries correctly in the table', () => {
    render(<TimesheetPreview {...defaultProps} />)

    // Check first entry (Office)
    expect(screen.getByText('Office')).toBeInTheDocument()
    expect(screen.getAllByText('09:00').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('17:00').length).toBeGreaterThanOrEqual(1)

    // For the test data, there's one pause (30min -> 0.50) and one driver time (0.5 -> 0.50).
    expect(screen.getAllByText('0.50')).toHaveLength(2)

    // Compensated time: (8h - 0.5h pause + 0.5h driver) = 8.00 for Office, 8.00 for Sick Leave
    expect(screen.getAllByText('8.00')).toHaveLength(2)

    // Check second entry (Sick Leave)
    expect(screen.getByText('Sick Leave')).toBeInTheDocument()
  })

  it('displays weekly and monthly totals', () => {
    render(<TimesheetPreview {...defaultProps} />)
    // The component renders a "Total per week" for each week in the month.
    expect(
      screen.getAllByText('export.footerTotalPerWeek').length,
    ).toBeGreaterThan(0)

    // Only the week with entries, the grand total and the total after conversion should show "16.00" (8+8)
    expect(screen.getAllByText('16.00')).toHaveLength(3)

    // The other weeks should show "0.00"
    expect(screen.getAllByText('0.00').length).toBeGreaterThan(0)
  })

  it('calls onEdit when a row is clicked', async () => {
    const user = userEvent.setup()
    render(<TimesheetPreview {...defaultProps} />)

    const officeRow = screen.getByText('Office')
    await user.click(officeRow)

    expect(mockOnEdit).toHaveBeenCalledTimes(1)
    expect(mockOnEdit).toHaveBeenCalledWith(mockEntries[0])
  })

  it('calls onAdd when the plus button is clicked on an empty day', async () => {
    const user = userEvent.setup()
    render(<TimesheetPreview {...defaultProps} />)

    // Find the row for July 3rd, which is empty, and click its plus button
    // The row text is "7/3/2024" (month/day/year format in UTC).
    const dateCell = screen.getByText('7/3/2024')
    const row = dateCell.closest('tr')
    expect(row).not.toBeNull()
    const addButton = row!.querySelector('button')
    expect(addButton).not.toBeNull()

    await user.click(addButton!)

    expect(mockOnAdd).toHaveBeenCalledTimes(1)
    const calledDate = mockOnAdd.mock.calls[0][0] as Date

    // Compare the dates using local date components to avoid timezone issues
    expect(calledDate.getFullYear()).toBe(2024)
    expect(calledDate.getMonth()).toBe(6) // 0-indexed, so 6 is July
    expect(calledDate.getDate()).toBe(3)
  })

  it('displays correct converted totals with passenger hours', () => {
    const entriesWithPassenger: TimeEntry[] = [
      {
        id: '1',
        userId: 'test-user',
        location: 'Office',
        startTime: new Date('2024-07-01T09:00:00Z'),
        endTime: new Date('2024-07-01T17:00:00Z'),
        pauseDuration: 30,
        driverTimeHours: 0,
        passengerTimeHours: 2, // 2 hours as passenger
      },
    ]
    const userSettingsWithPassengerPercent: UserSettings = {
      ...mockUserSettings,
      passengerCompensationPercent: 80,
    }
    render(
      <TimesheetPreview
        {...defaultProps}
        entries={entriesWithPassenger}
        userSettings={userSettingsWithPassengerPercent}
        getEntriesForDay={(day) =>
          entriesWithPassenger.filter((e) => isSameDay(e.startTime, day))
        }
      />,
    )

    // Compensated time: (8h - 0.5h pause) + (2h * 0.8) = 7.5 + 1.6 = 9.10
    // Converted total: 7.5 + 2 = 9.5 (if that's how your UI displays it)
    // Compensated passenger: 2 * 0.8 = 1.6

    // Check for the converted total (Gesamtstd. nach Umr.)
    expect(screen.getAllByText('9.10').length).toBeGreaterThan(0) // compensated + converted
    expect(screen.getAllByText('1.60').length).toBeGreaterThan(0) // compensated passenger only
  })
})
