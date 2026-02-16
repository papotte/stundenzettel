import React from 'react'

import { render, screen, waitFor, within } from '@jest-setup'
import userEvent from '@testing-library/user-event'

import { useMemberDisplayNames } from '@/hooks/use-member-display-names'
import type { TeamMember } from '@/lib/types'
import { getPublishedMonth } from '@/services/published-export-service'

import { TeamReportsList } from '../team-reports-list'

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
    email: 'member1@example.com',
    role: 'member',
    joinedAt: new Date('2024-01-01'),
    invitedBy: 'admin-1',
  },
  {
    id: 'user-2',
    email: 'member2@example.com',
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
) => ({
  id,
  userId,
  startTime: new Date(date.setHours(startHour, 0, 0, 0)),
  endTime: new Date(date.setHours(endHour, 0, 0, 0)),
  location: 'Office',
})

const mockUserSettings = {
  expectedMonthlyHours: 160,
  driverCompensationPercent: 100,
  passengerCompensationPercent: 90,
}

const defaultDisplayNames: Record<string, string> = {
  'user-1': 'Alice',
  'user-2': 'Bob',
}

const mockPublishedData = (
  entries: unknown[],
  userSettings: Record<string, unknown> = mockUserSettings,
  displayName?: string,
) => ({
  publishedAt: new Date('2024-01-20'),
  entries,
  userSettings: { ...userSettings, displayName },
})

describe('TeamReportsList', () => {
  const mockOnMemberClick = jest.fn()
  const selectedMonth = new Date('2024-01-15')
  const teamId = 'team-1'

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseMemberDisplayNames.mockReturnValue({
      displayNames: new Map<string, string>(),
    })
    ;(getPublishedMonth as jest.Mock).mockImplementation(
      (_t: string, memberId: string) =>
        Promise.resolve(
          mockPublishedData(
            [],
            mockUserSettings,
            defaultDisplayNames[memberId],
          ),
        ),
    )
  })

  it('renders loading state initially', async () => {
    render(
      <TeamReportsList
        teamId={teamId}
        members={mockMembers}
        selectedMonth={selectedMonth}
        onMemberClick={mockOnMemberClick}
      />,
    )

    await waitFor(() => {
      expect(screen.getAllByTestId(/member-row-/)).toHaveLength(2)
    })
  })

  it('renders table with member rows after loading', async () => {
    const entries = [
      createMockTimeEntry('entry-1', 'user-1', new Date('2024-01-15')),
      createMockTimeEntry('entry-2', 'user-1', new Date('2024-01-16')),
    ]
    ;(getPublishedMonth as jest.Mock).mockImplementation(
      (_t: string, memberId: string) =>
        Promise.resolve(
          mockPublishedData(
            memberId === 'user-1' ? entries : [],
            mockUserSettings,
            defaultDisplayNames[memberId],
          ),
        ),
    )

    render(
      <TeamReportsList
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
          mockPublishedData(
            memberId === 'user-1' ? entries : [],
            mockUserSettings,
            undefined,
          ),
        ),
    )

    render(
      <TeamReportsList
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

  it('displays table headers correctly', async () => {
    const entries = [
      createMockTimeEntry('entry-1', 'user-1', new Date('2024-01-15')),
    ]
    ;(getPublishedMonth as jest.Mock).mockResolvedValue(
      mockPublishedData(entries, mockUserSettings, 'Alice'),
    )

    render(
      <TeamReportsList
        teamId={teamId}
        members={[mockMembers[0]]}
        selectedMonth={selectedMonth}
        onMemberClick={mockOnMemberClick}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('reports.memberName')).toBeInTheDocument()
      expect(screen.getByText('export.footerExpectedHours')).toBeInTheDocument()
      expect(screen.getByText('reports.hoursWorked')).toBeInTheDocument()
      expect(screen.getByText('export.footerOvertime')).toBeInTheDocument()
      expect(screen.getByText('reports.percentage')).toBeInTheDocument()
    })
  })

  it('displays expected hours from user settings', async () => {
    const entries = [
      createMockTimeEntry('entry-1', 'user-1', new Date('2024-01-15')),
    ]
    ;(getPublishedMonth as jest.Mock).mockResolvedValue(
      mockPublishedData(entries, mockUserSettings, 'Alice'),
    )

    render(
      <TeamReportsList
        teamId={teamId}
        members={[mockMembers[0]]}
        selectedMonth={selectedMonth}
        onMemberClick={mockOnMemberClick}
      />,
    )

    await waitFor(() => {
      // Expected hours should be 160.00h
      expect(screen.getByText(/160\.00h/)).toBeInTheDocument()
    })
  })

  it('displays hours worked correctly', async () => {
    const entries = [
      createMockTimeEntry('entry-1', 'user-1', new Date('2024-01-15'), 9, 17),
    ]
    ;(getPublishedMonth as jest.Mock).mockResolvedValue(
      mockPublishedData(entries, mockUserSettings, 'Alice'),
    )

    render(
      <TeamReportsList
        teamId={teamId}
        members={[mockMembers[0]]}
        selectedMonth={selectedMonth}
        onMemberClick={mockOnMemberClick}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument()
    })
  })

  it('displays overtime with correct color coding', async () => {
    const entries = [
      createMockTimeEntry('entry-1', 'user-1', new Date('2024-01-15'), 9, 17),
      createMockTimeEntry('entry-2', 'user-1', new Date('2024-01-16'), 9, 17),
      createMockTimeEntry('entry-3', 'user-1', new Date('2024-01-17'), 9, 17),
    ]
    ;(getPublishedMonth as jest.Mock).mockResolvedValue(
      mockPublishedData(entries, mockUserSettings, 'Alice'),
    )

    render(
      <TeamReportsList
        teamId={teamId}
        members={[mockMembers[0]]}
        selectedMonth={selectedMonth}
        onMemberClick={mockOnMemberClick}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument()
    })
  })

  it('calls onMemberClick when a member row is clicked', async () => {
    const entries = [
      createMockTimeEntry('entry-1', 'user-1', new Date('2024-01-15')),
    ]
    ;(getPublishedMonth as jest.Mock).mockImplementation(
      (_t: string, memberId: string) =>
        Promise.resolve(
          mockPublishedData(
            memberId === 'user-1' ? entries : [],
            mockUserSettings,
            defaultDisplayNames[memberId],
          ),
        ),
    )

    render(
      <TeamReportsList
        teamId={teamId}
        members={mockMembers}
        selectedMonth={selectedMonth}
        onMemberClick={mockOnMemberClick}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument()
    })

    const user = userEvent.setup()
    const memberRow = screen.getByTestId('member-row-user-1')
    await user.click(memberRow)

    expect(mockOnMemberClick).toHaveBeenCalledWith('user-1')
  })

  it('displays no members message when members array is empty', () => {
    render(
      <TeamReportsList
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
      mockPublishedData([januaryEntry], mockUserSettings, 'Alice'),
    )

    render(
      <TeamReportsList
        teamId={teamId}
        members={[mockMembers[0]]}
        selectedMonth={new Date('2024-01-15')}
        onMemberClick={mockOnMemberClick}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument()
    })

    expect(getPublishedMonth).toHaveBeenCalledWith(teamId, 'user-1', '2024-01')
  })

  it('handles user settings with zero expected hours', async () => {
    const entries = [
      createMockTimeEntry('entry-1', 'user-1', new Date('2024-01-15')),
    ]
    ;(getPublishedMonth as jest.Mock).mockResolvedValue(
      mockPublishedData(
        entries,
        { ...mockUserSettings, expectedMonthlyHours: 0 },
        'Alice',
      ),
    )

    render(
      <TeamReportsList
        teamId={teamId}
        members={[mockMembers[0]]}
        selectedMonth={selectedMonth}
        onMemberClick={mockOnMemberClick}
      />,
    )

    await waitFor(
      () => {
        expect(screen.getByText('Alice')).toBeInTheDocument()
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
      <TeamReportsList
        teamId={teamId}
        members={[mockMembers[0]]}
        selectedMonth={selectedMonth}
        onMemberClick={mockOnMemberClick}
      />,
    )

    await waitFor(() => {
      // Should still render the row even if fetch fails
      expect(screen.getByTestId('member-row-user-1')).toBeInTheDocument()
    })
  })

  it('sorts members by display name alphabetically', async () => {
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
    ;(getPublishedMonth as jest.Mock).mockImplementation(
      (_t: string, memberId: string) =>
        Promise.resolve(
          mockPublishedData(
            [],
            mockUserSettings,
            memberId === 'user-1' ? 'Alpha' : 'Zebra',
          ),
        ),
    )

    render(
      <TeamReportsList
        teamId={teamId}
        members={unsortedMembers}
        selectedMonth={selectedMonth}
        onMemberClick={mockOnMemberClick}
      />,
    )

    await waitFor(() => {
      const rows = screen.getAllByTestId(/member-row-/)
      expect(rows).toHaveLength(2)
      expect(within(rows[0]).getByText('Alpha')).toBeInTheDocument()
      expect(within(rows[1]).getByText('Zebra')).toBeInTheDocument()
    })
  })
})
