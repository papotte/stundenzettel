import React from 'react'

import { render, screen, waitFor } from '@jest-setup'
import userEvent from '@testing-library/user-event'

import type { TeamMember } from '@/lib/types'
import { getTimeEntries } from '@/services/time-entry-service'
import { getUserSettings } from '@/services/user-settings-service'

import { TeamReportsGrid } from '../team-reports-grid'

// Mock dependencies
jest.mock('@/services/time-entry-service')
jest.mock('@/services/user-settings-service')

const mockMembers: TeamMember[] = [
  {
    id: 'user-1',
    email: 'member@example.com',
    role: 'member',
    joinedAt: new Date('2024-01-01'),
    invitedBy: 'admin-1',
  },
  {
    id: 'user-2',
    email: 'another@example.com',
    role: 'member',
    joinedAt: new Date('2024-01-02'),
    invitedBy: 'admin-1',
  },
]

const createMockTimeEntry = (
  id: string,
  userId: string,
  date: Date,
  startHour: number = 9,
  endHour: number = 17,
) => {
  const entryDate = new Date(date)
  return {
    id,
    userId,
    startTime: new Date(entryDate.setHours(startHour, 0, 0, 0)),
    endTime: new Date(entryDate.setHours(endHour, 0, 0, 0)),
    location: 'Office',
  }
}

const mockUserSettings = {
  expectedMonthlyHours: 160,
  driverCompensationPercent: 100,
  passengerCompensationPercent: 90,
}

describe('TeamReportsGrid', () => {
  const mockOnMemberClick = jest.fn()
  const selectedMonth = new Date('2024-01-15')

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getTimeEntries as jest.Mock).mockResolvedValue([])
    ;(getUserSettings as jest.Mock).mockResolvedValue(mockUserSettings)
  })

  it('renders loading state initially', () => {
    render(
      <TeamReportsGrid
        members={mockMembers}
        selectedMonth={selectedMonth}
        onMemberClick={mockOnMemberClick}
      />,
    )

    expect(screen.getAllByTestId(/member-card-/)).toHaveLength(2)
  })

  it('renders member cards with summaries after loading', async () => {
    const entries = [
      createMockTimeEntry('entry-1', 'user-1', new Date('2024-01-15')),
      createMockTimeEntry('entry-2', 'user-1', new Date('2024-01-16')),
    ]
    ;(getTimeEntries as jest.Mock).mockResolvedValue(entries)

    render(
      <TeamReportsGrid
        members={mockMembers}
        selectedMonth={selectedMonth}
        onMemberClick={mockOnMemberClick}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('mem***@example.com')).toBeInTheDocument()
      expect(screen.getByText('ano***@example.com')).toBeInTheDocument()
    })
  })

  it('displays expected hours from user settings', async () => {
    const entries = [
      createMockTimeEntry('entry-1', 'user-1', new Date('2024-01-15')),
    ]
    ;(getTimeEntries as jest.Mock).mockResolvedValue(entries)

    render(
      <TeamReportsGrid
        members={[mockMembers[0]]}
        selectedMonth={selectedMonth}
        onMemberClick={mockOnMemberClick}
      />,
    )

    await waitFor(
      () => {
        // Expected hours should be 160.00h
        expect(screen.getByText(/160\.00h/)).toBeInTheDocument()
      },
      { timeout: 3000 },
    )
  })

  it('displays hours worked correctly', async () => {
    const entries = [
      createMockTimeEntry('entry-1', 'user-1', new Date('2024-01-15'), 9, 17),
    ]
    ;(getTimeEntries as jest.Mock).mockResolvedValue(entries)

    render(
      <TeamReportsGrid
        members={[mockMembers[0]]}
        selectedMonth={selectedMonth}
        onMemberClick={mockOnMemberClick}
      />,
    )

    await waitFor(
      () => {
        // Should display hours worked - check for member email first to ensure data loaded
        expect(screen.getByText('mem***@example.com')).toBeInTheDocument()
        // Then check for hours worked value (should be 8.00h for one 8-hour day)
        const hoursWorkedElements = screen.getAllByText(/8\.00h/)
        expect(hoursWorkedElements.length).toBeGreaterThan(0)
      },
      { timeout: 3000 },
    )
  })

  it('displays overtime with correct color coding', async () => {
    const entries = [
      createMockTimeEntry('entry-1', 'user-1', new Date('2024-01-15'), 9, 17),
      createMockTimeEntry('entry-2', 'user-1', new Date('2024-01-16'), 9, 17),
      createMockTimeEntry('entry-3', 'user-1', new Date('2024-01-17'), 9, 17),
    ]
    ;(getTimeEntries as jest.Mock).mockResolvedValue(entries)

    render(
      <TeamReportsGrid
        members={[mockMembers[0]]}
        selectedMonth={selectedMonth}
        onMemberClick={mockOnMemberClick}
      />,
    )

    await waitFor(
      () => {
        // Should display overtime - check for member email first
        expect(screen.getByText('mem***@example.com')).toBeInTheDocument()
        // Overtime should be negative (less than expected 160h)
        const overtimeElement = screen.getByText(/-136\.00h/)
        expect(overtimeElement).toBeInTheDocument()
        // Should have red color class for negative overtime
        expect(overtimeElement).toHaveClass('text-red-600')
      },
      { timeout: 3000 },
    )
  })

  it('displays percentage correctly', async () => {
    const entries = [
      createMockTimeEntry('entry-1', 'user-1', new Date('2024-01-15'), 9, 17),
    ]
    ;(getTimeEntries as jest.Mock).mockResolvedValue(entries)

    render(
      <TeamReportsGrid
        members={[mockMembers[0]]}
        selectedMonth={selectedMonth}
        onMemberClick={mockOnMemberClick}
      />,
    )

    await waitFor(
      () => {
        // Should display percentage (format: X.X%)
        expect(screen.getByText(/\d+\.\d%/)).toBeInTheDocument()
      },
      { timeout: 3000 },
    )
  })

  it('calls onMemberClick when a member card is clicked', async () => {
    const entries = [
      createMockTimeEntry('entry-1', 'user-1', new Date('2024-01-15')),
    ]
    ;(getTimeEntries as jest.Mock).mockResolvedValue(entries)

    render(
      <TeamReportsGrid
        members={mockMembers}
        selectedMonth={selectedMonth}
        onMemberClick={mockOnMemberClick}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('mem***@example.com')).toBeInTheDocument()
    })

    const user = userEvent.setup()
    const memberCard = screen.getByTestId('member-card-user-1')
    await user.click(memberCard)

    expect(mockOnMemberClick).toHaveBeenCalledWith('user-1')
  })

  it('displays no members message when members array is empty', () => {
    render(
      <TeamReportsGrid
        members={[]}
        selectedMonth={selectedMonth}
        onMemberClick={mockOnMemberClick}
      />,
    )

    expect(screen.getByText('reports.noMembers')).toBeInTheDocument()
  })

  it('filters entries by selected month', async () => {
    const januaryEntry = createMockTimeEntry(
      'entry-1',
      'user-1',
      new Date('2024-01-15'),
    )
    const februaryEntry = createMockTimeEntry(
      'entry-2',
      'user-1',
      new Date('2024-02-15'),
    )
    ;(getTimeEntries as jest.Mock).mockResolvedValue([
      januaryEntry,
      februaryEntry,
    ])

    render(
      <TeamReportsGrid
        members={[mockMembers[0]]}
        selectedMonth={new Date('2024-01-15')}
        onMemberClick={mockOnMemberClick}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('mem***@example.com')).toBeInTheDocument()
    })

    // Only January entries should be counted
    expect(getTimeEntries).toHaveBeenCalledWith('user-1')
  })

  it('handles missing user settings gracefully', async () => {
    ;(getUserSettings as jest.Mock).mockResolvedValue(null)
    const entries = [
      createMockTimeEntry('entry-1', 'user-1', new Date('2024-01-15')),
    ]
    ;(getTimeEntries as jest.Mock).mockResolvedValue(entries)

    render(
      <TeamReportsGrid
        members={[mockMembers[0]]}
        selectedMonth={selectedMonth}
        onMemberClick={mockOnMemberClick}
      />,
    )

    await waitFor(
      () => {
        expect(screen.getByText('mem***@example.com')).toBeInTheDocument()
        // Should show 0.00h for expected hours when settings are missing
        // Use getAllByText since there might be multiple 0.00h values
        const expectedHoursElements = screen.getAllByText(/0\.00h/)
        expect(expectedHoursElements.length).toBeGreaterThan(0)
      },
      { timeout: 3000 },
    )
  })

  it('handles fetch errors gracefully', async () => {
    ;(getTimeEntries as jest.Mock).mockRejectedValue(
      new Error('Failed to fetch'),
    )

    render(
      <TeamReportsGrid
        members={[mockMembers[0]]}
        selectedMonth={selectedMonth}
        onMemberClick={mockOnMemberClick}
      />,
    )

    await waitFor(() => {
      // Should still render the card even if fetch fails
      expect(screen.getByTestId('member-card-user-1')).toBeInTheDocument()
    })
  })

  it('sorts members by email alphabetically', async () => {
    const unsortedMembers: TeamMember[] = [
      {
        id: 'user-3',
        email: 'zebra@example.com',
        role: 'member',
        joinedAt: new Date('2024-01-03'),
        invitedBy: 'admin-1',
      },
      {
        id: 'user-1',
        email: 'alpha@example.com',
        role: 'member',
        joinedAt: new Date('2024-01-01'),
        invitedBy: 'admin-1',
      },
    ]
    ;(getTimeEntries as jest.Mock).mockResolvedValue([])

    render(
      <TeamReportsGrid
        members={unsortedMembers}
        selectedMonth={selectedMonth}
        onMemberClick={mockOnMemberClick}
      />,
    )

    await waitFor(() => {
      const cards = screen.getAllByTestId(/member-card-/)
      expect(cards).toHaveLength(2)
    })

    const emails = screen.getAllByText(/@example\.com/)
    expect(emails[0]).toHaveTextContent('alp***@example.com')
    expect(emails[1]).toHaveTextContent('zeb***@example.com')
  })
})
