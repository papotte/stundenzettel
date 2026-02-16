import React from 'react'

import { render, screen, waitFor } from '@jest-setup'
import userEvent from '@testing-library/user-event'

import { getPublishedMonth } from '@/services/published-export-service'

import { TeamMemberReportView } from '../team-member-report-view'

// Mock dependencies
jest.mock('@/services/published-export-service')
jest.mock('@/hooks/use-member-display-names', () => ({
  useMemberDisplayNames: () => ({ displayNames: new Map() }),
}))
jest.mock('@/lib/excel-export', () => ({
  exportToExcel: jest.fn(),
}))
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

const mockTimeEntries = [
  {
    id: 'entry-1',
    userId: 'user-1',
    startTime: new Date('2024-01-15T09:00:00'),
    endTime: new Date('2024-01-15T17:00:00'),
    location: 'Office',
  },
]

const mockUserSettings = {
  displayName: 'Test User',
  expectedMonthlyHours: 160,
  driverCompensationPercent: 100,
  passengerCompensationPercent: 90,
}

const mockPublishedData = {
  publishedAt: new Date('2024-01-20'),
  entries: mockTimeEntries,
  userSettings: mockUserSettings,
}

describe('TeamMemberReportView', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(getPublishedMonth as jest.Mock).mockResolvedValue(mockPublishedData)
  })

  it('renders loading state initially', () => {
    render(
      <TeamMemberReportView
        teamId="team-1"
        memberId="user-1"
        memberEmail="member@example.com"
        selectedMonth={new Date('2024-01-01')}
      />,
    )

    const skeletons = screen.getAllByTestId('skeleton')
    expect(skeletons.length).toBeGreaterThan(0)
    expect(screen.getByTestId('member-report-view-card')).toBeInTheDocument()
  })

  it('renders timesheet after loading', async () => {
    render(
      <TeamMemberReportView
        teamId="team-1"
        memberId="user-1"
        memberEmail="member@example.com"
        selectedMonth={new Date('2024-01-01')}
      />,
    )

    await waitFor(() => {
      expect(screen.getByTestId('timesheet-preview')).toBeInTheDocument()
    })
  })

  it('disables export buttons when no entries', async () => {
    ;(getPublishedMonth as jest.Mock).mockResolvedValue({
      ...mockPublishedData,
      entries: [],
    })

    render(
      <TeamMemberReportView
        teamId="team-1"
        memberId="user-1"
        memberEmail="member@example.com"
        selectedMonth={new Date('2024-01-01')}
      />,
    )

    await waitFor(() => {
      const exportButton = screen.getByTestId('member-report-export-button')
      expect(exportButton).toBeDisabled()
    })
  })

  it('enables export buttons when entries exist', async () => {
    render(
      <TeamMemberReportView
        teamId="team-1"
        memberId="user-1"
        memberEmail="member@example.com"
        selectedMonth={new Date('2024-01-01')}
      />,
    )

    await waitFor(() => {
      const exportButton = screen.getByTestId('member-report-export-button')
      expect(exportButton).not.toBeDisabled()
    })
  })

  it('opens PDF export in new window', async () => {
    const windowOpenSpy = jest
      .spyOn(window, 'open')
      .mockImplementation(() => null)

    render(
      <TeamMemberReportView
        teamId="team-1"
        memberId="user-1"
        memberEmail="member@example.com"
        selectedMonth={new Date('2024-01-01')}
      />,
    )

    await waitFor(() => {
      expect(screen.getByTestId('member-report-pdf-button')).toBeInTheDocument()
    })

    const user = userEvent.setup()
    const pdfButton = screen.getByTestId('member-report-pdf-button')
    await user.click(pdfButton)

    expect(windowOpenSpy).toHaveBeenCalledWith(
      expect.stringContaining('/team/reports/user-1'),
      '_blank',
    )

    windowOpenSpy.mockRestore()
  })

  it('shows not published message when getPublishedMonth returns null', async () => {
    ;(getPublishedMonth as jest.Mock).mockResolvedValue(null)

    render(
      <TeamMemberReportView
        teamId="team-1"
        memberId="user-1"
        memberEmail="member@example.com"
        selectedMonth={new Date('2024-01-01')}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('reports.notPublishedDetail')).toBeInTheDocument()
    })
  })
})
