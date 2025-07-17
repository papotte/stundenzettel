import React from 'react'

import { render, screen, waitFor } from '@testing-library/react'

import { useRouter } from 'next/navigation'

import { AuthProvider } from '@/context/auth-context'
import { createMockAuthContext, createMockUser } from '@/test-utils/auth-mocks'

import TeamPage from '../page'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

const mockRouter = {
  replace: jest.fn(),
}

// Use centralized auth mock
const mockAuthContext = createMockAuthContext()
jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => mockAuthContext,
}))

const renderWithProviders = (component: React.ReactElement) => {
  return render(<AuthProvider>{component}</AuthProvider>)
}

describe('TeamPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    // Reset auth context to authenticated state
    mockAuthContext.user = createMockUser()
    mockAuthContext.loading = false
  })

  it('redirects to login when user is not authenticated', async () => {
    mockAuthContext.user = null

    renderWithProviders(<TeamPage />)

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/login')
    })
  })

  it('shows loading skeleton when auth is loading', () => {
    mockAuthContext.loading = true
    mockAuthContext.user = null

    renderWithProviders(<TeamPage />)

    expect(screen.getAllByTestId('skeleton')).toHaveLength(2)
  })

  it('shows team management coming soon message', async () => {
    renderWithProviders(<TeamPage />)

    await waitFor(
      () => {
        expect(screen.getByText('settings.manageTeam')).toBeInTheDocument()
        expect(
          screen.getByText('settings.teamManagementComingSoon'),
        ).toBeInTheDocument()
        expect(
          screen.getByText(
            'settings.teamManagementFunctionalityWillBeAvailable',
          ),
        ).toBeInTheDocument()
      },
      { timeout: 3000 },
    )
  })

  it('shows back to tracker button', async () => {
    renderWithProviders(<TeamPage />)

    await waitFor(
      () => {
        expect(screen.getByText('settings.backToTracker')).toBeInTheDocument()
      },
      { timeout: 3000 },
    )
  })

  it('renders without crashing when authenticated', async () => {
    renderWithProviders(<TeamPage />)

    await waitFor(
      () => {
        expect(screen.getByText('settings.manageTeam')).toBeInTheDocument()
      },
      { timeout: 3000 },
    )
  })
})
