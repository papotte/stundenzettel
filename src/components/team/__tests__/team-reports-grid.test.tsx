import React from 'react'

import { render, screen, waitFor } from '@jest-setup'
import userEvent from '@testing-library/user-event'

import { useMemberDisplayNames } from '@/hooks/use-member-display-names'
import type { TeamMember } from '@/lib/types'
import { getPublishedMonth } from '@/services/published-export-service'

import { TeamReportsGrid } from '../team-reports-grid'

const mockUseMemberDisplayNames = useMemberDisplayNames as jest.MockedFunction<
  typeof useMemberDisplayNames
>

// Mock dependencies
jest.mock('@/services/published-export-service')
jest.mock('@/hooks/use-member-display-names', () => ({
  useMemberDisplayNames: jest.fn(() => ({
    displayNames: new Map<string, string>(),
  })),
}))

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

const mockPublishedData = (
  entries: unknown[],
  userSettings = mockUserSettings,
) => ({
  publishedAt: new Date('2024-01-20'),
  entries,
  userSettings,
})

describe('TeamReportsGrid', () => {
  const mockOnMemberClick = jest.fn()
  const selectedMonth = new Date('2024-01-15')
  const teamId = 'team-1'

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseMemberDisplayNames.mockReturnValue({
      displayNames: new Map<string, string>(),
    })
    ;(getPublishedMonth as jest.Mock).mockResolvedValue(mockPublishedData([]))
  })

  it('renders loading state initially', () => {
    render(
      <TeamReportsGrid
        teamId={teamId}
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
    ;(getPublishedMonth as jest.Mock).mockImplementation(
      (_t: string, memberId: string) =>
        Promise.resolve(
          memberId === 'user-1'
            ? mockPublishedData(entries)
            : mockPublishedData([]),
        ),
    )

    render(
      <TeamReportsGrid
        teamId={teamId}
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

  it('shows display names from useMemberDisplayNames when set', async () => {
    mockUseMemberDisplayNames.mockReturnValue({
      displayNames: new Map([
        ['user-1', 'Alice'],
        ['user-2', 'Bob'],
      ]),
    })
    const entries = [
      createMockTimeEntry('entry-1', 'user-1', new Date('2024-01-15')),
      createMockTimeEntry('entry-2', 'user-1', new Date('2024-01-16')),
    ]
    ;(getPublishedMonth as jest.Mock).mockImplementation(
      (_t: string, memberId: string) =>
        Promise.resolve(
          memberId === 'user-1'
            ? mockPublishedData(entries)
            : mockPublishedData([]),
        ),
    )

    render(
      <TeamReportsGrid
        teamId={teamId}
        members={mockMembers}
        selectedMonth={selectedMonth}
        onMemberClick={mockOnMemberClick}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('Bob')).toBeInTheDocument()
    })
  })

  it('displays expected hours from user settings', async () => {
    const entries = [
      createMockTimeEntry('entry-1', 'user-1', new Date('2024-01-15')),
    ]
    ;(getPublishedMonth as jest.Mock).mockResolvedValue(
      mockPublishedData(entries),
    )

    render(
      <TeamReportsGrid
        teamId={teamId}
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
    ;(getPublishedMonth as jest.Mock).mockResolvedValue(
      mockPublishedData(entries),
    )

    render(
      <TeamReportsGrid
        teamId={teamId}
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
    ;(getPublishedMonth as jest.Mock).mockResolvedValue(
      mockPublishedData(entries),
    )

    render(
      <TeamReportsGrid
        teamId={teamId}
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
    ;(getPublishedMonth as jest.Mock).mockResolvedValue(
      mockPublishedData(entries),
    )

    render(
      <TeamReportsGrid
        teamId={teamId}
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
    ;(getPublishedMonth as jest.Mock).mockResolvedValue(
      mockPublishedData(entries),
    )

    render(
      <TeamReportsGrid
        teamId={teamId}
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
        teamId={teamId}
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
    ;(getPublishedMonth as jest.Mock).mockResolvedValue(
      mockPublishedData([januaryEntry]),
    )

    render(
      <TeamReportsGrid
        teamId={teamId}
        members={[mockMembers[0]]}
        selectedMonth={new Date('2024-01-15')}
        onMemberClick={mockOnMemberClick}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('mem***@example.com')).toBeInTheDocument()
    })

    expect(getPublishedMonth).toHaveBeenCalledWith(teamId, 'user-1', '2024-01')
  })

  it('handles user settings with zero expected hours', async () => {
    const entries = [
      createMockTimeEntry('entry-1', 'user-1', new Date('2024-01-15')),
    ]
    ;(getPublishedMonth as jest.Mock).mockResolvedValue(
      mockPublishedData(entries, {
        ...mockUserSettings,
        expectedMonthlyHours: 0,
      }),
    )

    render(
      <TeamReportsGrid
        teamId={teamId}
        members={[mockMembers[0]]}
        selectedMonth={selectedMonth}
        onMemberClick={mockOnMemberClick}
      />,
    )

    await waitFor(
      () => {
        expect(screen.getByText('mem***@example.com')).toBeInTheDocument()
        const expectedHoursElements = screen.getAllByText(/0\.00h/)
        expect(expectedHoursElements.length).toBeGreaterThan(0)
      },
      { timeout: 3000 },
    )
  })

  it('handles fetch errors gracefully', async () => {
    ;(getPublishedMonth as jest.Mock).mockRejectedValue(
      new Error('Failed to fetch'),
    )

    render(
      <TeamReportsGrid
        teamId={teamId}
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
    ;(getPublishedMonth as jest.Mock).mockResolvedValue(mockPublishedData([]))

    render(
      <TeamReportsGrid
        teamId={teamId}
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
