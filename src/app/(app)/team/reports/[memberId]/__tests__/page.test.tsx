import React from 'react'

import { render, screen, waitFor } from '@jest-setup'
import { useParams, useSearchParams } from 'next/navigation'

import { useAuth } from '@/hooks/use-auth'
import { useTeamPageData } from '@/hooks/use-team'

import TeamMemberReportPage from '../page'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
  useParams: jest.fn(),
}))

// Mock auth and team data hooks
jest.mock('@/hooks/use-auth', () => ({
  useAuth: jest.fn(),
}))
jest.mock('@/hooks/use-team', () => ({
  useTeamPageData: jest.fn(),
}))

// Mock TeamMemberReportView to avoid hitting Firestore/services again
jest.mock('@/components/team/team-member-report-view', () => ({
  TeamMemberReportView: ({
    memberId,
    memberEmail,
  }: {
    memberId: string
    memberEmail: string
  }) => (
    <div data-testid="member-report-view">
      Member report for {memberId} ({memberEmail})
    </div>
  ),
}))

// Mock window.print so we can assert it was called
const mockPrint = jest.fn()
Object.defineProperty(window, 'print', {
  value: mockPrint,
  writable: true,
})

const mockSearchParams = new URLSearchParams()

describe('TeamMemberReportPage (print view)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPrint.mockClear()
    ;(useSearchParams as jest.Mock).mockReturnValue(mockSearchParams)
    ;(useParams as jest.Mock).mockReturnValue({
      memberId: 'member-1',
    })
    ;(useTeamPageData as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    })
  })

  it('shows loading skeleton while auth or access check is in progress', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: true,
    })

    render(<TeamMemberReportPage />)

    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0)
  })

  it('shows unauthorized message when user is not authorized', async () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { uid: 'user-1', email: 'user@example.com' },
      loading: false,
    })
    ;(useTeamPageData as jest.Mock).mockReturnValue({
      data: {
        team: { id: 'team-1', name: 'Test Team' },
        members: [],
        invitations: [],
        subscription: null,
        currentUserRole: 'member',
        userInvitations: [],
      },
      isLoading: false,
      isError: false,
    })

    render(<TeamMemberReportPage />)

    await waitFor(() => {
      expect(screen.getByText('Unauthorized access')).toBeInTheDocument()
    })
  })

  it('renders member report and triggers window.print when authorized', async () => {
    jest.useFakeTimers()
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { uid: 'admin-1', email: 'admin@example.com' },
      loading: false,
    })

    mockSearchParams.set('month', '2024-01')
    mockSearchParams.set('email', 'member@example.com')
    ;(useTeamPageData as jest.Mock).mockReturnValue({
      data: {
        team: { id: 'team-1', name: 'Test Team', ownerId: 'admin-1' },
        members: [],
        invitations: [],
        subscription: null,
        currentUserRole: 'admin',
        userInvitations: [],
      },
      isLoading: false,
      isError: false,
    })

    render(<TeamMemberReportPage />)

    // Wait for report view to appear
    await waitFor(() => {
      expect(screen.getByTestId('member-report-view')).toBeInTheDocument()
    })

    // Advance timers to trigger the print timeout
    jest.runAllTimers()

    expect(mockPrint).toHaveBeenCalled()

    jest.useRealTimers()
  })
})
