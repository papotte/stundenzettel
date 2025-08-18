import React from 'react'

import { render, screen } from '@jest-setup'

import TimeTrackerHeader from '@/components/time-tracker-header'
import { TooltipProvider } from '@/components/ui/tooltip'
import { createMockAuthContext } from '@/test-utils/auth-mocks'

// Mock the context
const handleClearData = jest.fn()
const signOut = jest.fn()
jest.mock('@/context/time-tracker-context', () => ({
  useTimeTrackerContext: () => ({
    handleClearData,
  }),
}))

// Use centralized auth mock
const mockAuthContext = createMockAuthContext({
  signOut,
  user: { uid: '123', displayName: 'Test User', email: 'test@example.com' },
})
jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => mockAuthContext,
}))

describe('TimeTrackerHeader', () => {
  beforeEach(() => {
    handleClearData.mockClear()
    signOut.mockClear()
  })

  function renderWithProvider(ui: React.ReactElement) {
    return render(<TooltipProvider>{ui}</TooltipProvider>)
  }

  it('renders all buttons and links', () => {
    renderWithProvider(<TimeTrackerHeader />)
    expect(screen.getByText('common.appName')).toBeInTheDocument()
    expect(screen.getByText('tracker.headerExportLink')).toBeInTheDocument()
    expect(
      screen.getByText('tracker.headerClearDataTooltip'),
    ).toBeInTheDocument()
    expect(screen.getByTestId('user-menu-btn')).toBeInTheDocument()
  })
})
