import React from 'react'

import { fireEvent, render, screen } from '@testing-library/react'

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
    renderWithProvider(<TimeTrackerHeader showClearData={true} />)
    expect(screen.getByText('common.appName')).toBeInTheDocument()
    expect(screen.getByText('tracker.headerExportLink')).toBeInTheDocument()
    expect(
      screen.getByText('tracker.headerClearDataTooltip'),
    ).toBeInTheDocument()
    expect(screen.getByTestId('user-menu-btn')).toBeInTheDocument()
  })

  it('calls handleClearData', async () => {
    renderWithProvider(<TimeTrackerHeader showClearData={true} />)

    // Click the clear data button and confirm
    fireEvent.click(screen.getByTestId('clear-data-btn'))
    fireEvent.click(screen.getByTestId('clear-data-confirm-btn'))

    expect(handleClearData).toHaveBeenCalled()
  })
})
