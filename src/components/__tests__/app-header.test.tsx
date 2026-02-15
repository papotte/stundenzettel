import React from 'react'

import { render, screen } from '@jest-setup'

import AppHeader from '@/components/app-header'
import { TooltipProvider } from '@/components/ui/tooltip'
import { createMockAuthContext } from '@/test-utils/auth-mocks'

const signOut = jest.fn()
const mockAuthContext = createMockAuthContext({
  signOut,
  user: { uid: '123', displayName: 'Test User', email: 'test@example.com' },
})
jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => mockAuthContext,
}))

jest.mock('@/context/subscription-context', () => ({
  useSubscriptionContext: () => ({ hasValidSubscription: true }),
}))

jest.mock('@/hooks/use-user-invitations', () => ({
  useUserInvitations: () => ({ hasPendingInvitations: false, invitations: [] }),
}))

describe('AppHeader', () => {
  beforeEach(() => {
    signOut.mockClear()
  })

  function renderWithProvider(ui: React.ReactElement) {
    return render(<TooltipProvider>{ui}</TooltipProvider>)
  }

  it('renders app name, export link, and menu button', () => {
    renderWithProvider(<AppHeader />)
    expect(screen.getByText('common.appName')).toBeInTheDocument()
    expect(screen.getByText('tracker.headerExportLink')).toBeInTheDocument()
    expect(screen.getByTestId('user-menu-btn')).toBeInTheDocument()
  })

  it('links app name to tracker', () => {
    renderWithProvider(<AppHeader />)
    const homeLink = screen.getByRole('link', { name: /common\.home/i })
    expect(homeLink).toHaveAttribute('href', '/tracker')
  })
})
