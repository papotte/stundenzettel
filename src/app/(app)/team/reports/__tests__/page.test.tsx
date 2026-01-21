import { render, screen, waitFor } from '@jest-setup'

import { useRouter, useSearchParams } from 'next/navigation'

import { useAuth } from '@/hooks/use-auth'
import { verifyTeamAccess } from '@/lib/team-auth'
import { getTeamMembers, getUserTeam } from '@/services/team-service'

import TeamReportsPage from '../page'

// Mock dependencies
jest.mock('@/hooks/use-auth', () => ({
  useAuth: jest.fn(),
}))
jest.mock('@/lib/team-auth')
jest.mock('@/services/team-service')
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
  usePathname: jest.fn(() => '/team/reports'),
}))

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

jest.mock('@/lib/excel-export', () => ({
  exportToExcel: jest.fn(),
}))

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
}

const mockSearchParams = new URLSearchParams()

describe('TeamReportsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(useSearchParams as jest.Mock).mockReturnValue(mockSearchParams)
  })

  it('redirects to login if user is not authenticated', async () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
    })

    render(<TeamReportsPage />)

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith(
        '/login?returnUrl=/team/reports',
      )
    })
  })

  it('redirects to team page if user is not admin/owner', async () => {
    const mockUser = { uid: 'user-1', email: 'user@example.com' }
    ;(useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
    })
    ;(getUserTeam as jest.Mock).mockResolvedValue({
      id: 'team-1',
      name: 'Test Team',
      ownerId: 'user-2',
    })
    ;(verifyTeamAccess as jest.Mock).mockResolvedValue({
      authorized: false,
      userRole: 'member',
      error: 'Insufficient permissions',
    })

    render(<TeamReportsPage />)

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/team')
    })
  })

  it('renders reports grid for authorized admin', async () => {
    const mockUser = { uid: 'user-1', email: 'admin@example.com' }
    ;(useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
    })
    ;(getUserTeam as jest.Mock).mockResolvedValue({
      id: 'team-1',
      name: 'Test Team',
      ownerId: 'user-1',
    })
    ;(verifyTeamAccess as jest.Mock).mockResolvedValue({
      authorized: true,
      userRole: 'admin',
    })
    ;(getTeamMembers as jest.Mock).mockResolvedValue([
      {
        id: 'user-1',
        email: 'admin@example.com',
        role: 'admin',
        joinedAt: new Date(),
        invitedBy: 'user-1',
      },
    ])

    render(<TeamReportsPage />)

    // Wait for the reports page to finish loading and show the month header and title
    await waitFor(() => {
      expect(screen.getByTestId('reports-month')).toBeInTheDocument()
      // Title may be the translation key or the resolved string depending on test i18n setup
      expect(screen.getByText('reports.title')).toBeInTheDocument()
    })

    // Should render the grid content for the team member (email shown in card)
    expect(await screen.findByText('adm***@example.com')).toBeInTheDocument()
  })
})
