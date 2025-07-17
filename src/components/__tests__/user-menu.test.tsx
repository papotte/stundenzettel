import React from 'react'

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { TooltipProvider } from '@/components/ui/tooltip'

import UserMenu from '../user-menu'

// Mock the auth hook
const mockSignOut = jest.fn()
const mockUseAuth = {
  user: null as any,
  signOut: mockSignOut,
}

jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => mockUseAuth,
}))

// Mock the toast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

const renderWithTooltipProvider = (component: React.ReactElement) => {
  return render(<TooltipProvider>{component}</TooltipProvider>)
}

describe('UserMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('when user is not logged in', () => {
    beforeEach(() => {
      mockUseAuth.user = null
    })

    it('renders login button', () => {
      renderWithTooltipProvider(<UserMenu />)

      const loginButton = screen.getByRole('link', { name: /topNav\.login/i })
      expect(loginButton).toBeInTheDocument()
      expect(loginButton).toHaveAttribute('href', '/login')
    })

    it('renders login button with custom variant and size', () => {
      renderWithTooltipProvider(<UserMenu variant="default" size="lg" />)

      const loginButton = screen.getByRole('link', { name: /topNav\.login/i })
      expect(loginButton).toBeInTheDocument()
    })
  })

  describe('when user is logged in', () => {
    beforeEach(() => {
      mockUseAuth.user = {
        uid: 'test-user-id',
        email: 'test@example.com',
        displayName: 'Test User',
      }
    })

    it('renders user menu button', () => {
      renderWithTooltipProvider(<UserMenu />)

      const menuButton = screen.getByRole('button')
      expect(menuButton).toBeInTheDocument()
    })

    it('shows tooltip on hover', async () => {
      const user = userEvent.setup()
      renderWithTooltipProvider(<UserMenu />)

      const menuButton = screen.getByRole('button')
      await user.hover(menuButton)

      await waitFor(() => {
        const tooltips = screen.getAllByText('tracker.headerUserMenuTooltip')
        expect(tooltips.length).toBeGreaterThan(0)
      })
    })

    it('opens dropdown menu when clicked', async () => {
      const user = userEvent.setup()
      renderWithTooltipProvider(<UserMenu />)

      const menuButton = screen.getByRole('button')
      await user.click(menuButton)

      // Check for user info
      expect(screen.getByText('Test User')).toBeInTheDocument()
      expect(screen.getByText('test@example.com')).toBeInTheDocument()

      // Check for menu items using translation keys
      expect(
        screen.getByRole('menuitem', { name: /settings\.preferences/i }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('menuitem', { name: /settings\.company/i }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('menuitem', { name: /settings\.security/i }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('menuitem', { name: /settings\.manageTeam/i }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('menuitem', { name: /settings\.manageSubscription/i }),
      ).toBeInTheDocument()
      expect(screen.getByTestId('sign-out-btn')).toBeInTheDocument()
    })

    it('navigates to preferences page', async () => {
      const user = userEvent.setup()
      renderWithTooltipProvider(<UserMenu />)

      const menuButton = screen.getByRole('button')
      await user.click(menuButton)

      const preferencesLink = screen.getByRole('menuitem', {
        name: /settings\.preferences/i,
      })
      expect(preferencesLink).toHaveAttribute('href', '/preferences')
    })

    it('navigates to company page', async () => {
      const user = userEvent.setup()
      renderWithTooltipProvider(<UserMenu />)

      const menuButton = screen.getByRole('button')
      await user.click(menuButton)

      const companyLink = screen.getByRole('menuitem', {
        name: /settings\.company/i,
      })
      expect(companyLink).toHaveAttribute('href', '/company')
    })

    it('navigates to security page', async () => {
      const user = userEvent.setup()
      renderWithTooltipProvider(<UserMenu />)

      const menuButton = screen.getByRole('button')
      await user.click(menuButton)

      const securityLink = screen.getByRole('menuitem', {
        name: /settings\.security/i,
      })
      expect(securityLink).toHaveAttribute('href', '/security')
    })

    it('navigates to team page', async () => {
      const user = userEvent.setup()
      renderWithTooltipProvider(<UserMenu />)

      const menuButton = screen.getByRole('button')
      await user.click(menuButton)

      const teamLink = screen.getByRole('menuitem', {
        name: /settings\.manageTeam/i,
      })
      expect(teamLink).toHaveAttribute('href', '/team')
    })

    it('navigates to subscription page', async () => {
      const user = userEvent.setup()
      renderWithTooltipProvider(<UserMenu />)

      const menuButton = screen.getByRole('button')
      await user.click(menuButton)

      const subscriptionLink = screen.getByRole('menuitem', {
        name: /settings\.manageSubscription/i,
      })
      expect(subscriptionLink).toHaveAttribute('href', '/subscription')
    })

    it('calls signOut when sign out button is clicked', async () => {
      const user = userEvent.setup()
      renderWithTooltipProvider(<UserMenu />)

      const menuButton = screen.getByRole('button')
      await user.click(menuButton)

      const signOutButton = screen.getByTestId('sign-out-btn')
      await user.click(signOutButton)

      expect(mockSignOut).toHaveBeenCalledTimes(1)
    })

    it('displays user email when displayName is not available', async () => {
      mockUseAuth.user = {
        uid: 'test-user-id',
        email: 'test@example.com',
        displayName: null,
      }

      const user = userEvent.setup()
      renderWithTooltipProvider(<UserMenu />)

      const menuButton = screen.getByRole('button')
      await user.click(menuButton)

      // Check that the email appears in the display name position (first paragraph)
      const displayNameElement = screen.getAllByText('test@example.com')[0]
      expect(displayNameElement).toBeInTheDocument()
    })

    it('applies custom className', () => {
      renderWithTooltipProvider(<UserMenu className="custom-class" />)

      const menuButton = screen.getByRole('button')
      expect(menuButton).toHaveClass('custom-class')
    })

    it('has correct styling for hover effects', () => {
      renderWithTooltipProvider(<UserMenu />)

      const menuButton = screen.getByRole('button')
      expect(menuButton).toHaveClass('rounded-full')
      expect(menuButton).toHaveClass('hover:bg-green-600')
      expect(menuButton).toHaveClass('hover:text-white')
      expect(menuButton).toHaveClass('transition-colors')
    })
  })
})
