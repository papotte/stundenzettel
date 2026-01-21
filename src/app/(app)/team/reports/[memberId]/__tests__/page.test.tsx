import React from 'react'

import { render, screen, waitFor } from '@jest-setup'

import { useParams, useSearchParams } from 'next/navigation'

import { useAuth } from '@/hooks/use-auth'
import { verifyTeamAccess } from '@/lib/team-auth'
import { getUserTeam } from '@/services/team-service'

import TeamMemberReportPage from '../page'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
  useParams: jest.fn(),
}))

// Mock auth and team services
jest.mock('@/hooks/use-auth', () => ({
  useAuth: jest.fn(),
}))
jest.mock('@/lib/team-auth')
jest.mock('@/services/team-service')

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
    ;(getUserTeam as jest.Mock).mockResolvedValue(null)

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
    ;(getUserTeam as jest.Mock).mockResolvedValue({
      id: 'team-1',
      name: 'Test Team',
      ownerId: 'admin-1',
    })
    ;(verifyTeamAccess as jest.Mock).mockResolvedValue({
      authorized: true,
      userRole: 'admin',
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
