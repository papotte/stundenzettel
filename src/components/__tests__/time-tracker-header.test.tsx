import React from 'react'

import { fireEvent, render, screen } from '@testing-library/react'

import TimeTrackerHeader from '@/components/time-tracker-header'
import { TooltipProvider } from '@/components/ui/tooltip'

// Mock the context
const handleClearData = jest.fn()
const handleSignOut = jest.fn()
jest.mock('@/context/time-tracker-context', () => ({
  useTimeTrackerContext: () => ({
    handleClearData,
    handleSignOut,
  }),
}))

describe('TimeTrackerHeader', () => {
  beforeEach(() => {
    handleClearData.mockClear()
    handleSignOut.mockClear()
  })

  function renderWithProvider(ui: React.ReactElement) {
    return render(<TooltipProvider>{ui}</TooltipProvider>)
  }

  it('renders all buttons and links', () => {
    renderWithProvider(<TimeTrackerHeader showClearData={true} />)
    expect(screen.getByText('login.title')).toBeInTheDocument()
    expect(screen.getByText('tracker.headerExportLink')).toBeInTheDocument()
    expect(
      screen.getByText('tracker.headerClearDataTooltip'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('tracker.headerSettingsTooltip'),
    ).toBeInTheDocument()
    expect(screen.getByText('tracker.headerSignOutTooltip')).toBeInTheDocument()
  })

  it('calls handleClearData and handleSignOut', () => {
    renderWithProvider(<TimeTrackerHeader showClearData={true} />)
    fireEvent.click(screen.getByTestId('clear-data-btn'))
    fireEvent.click(screen.getByTestId('clear-data-confirm-btn'))
    fireEvent.click(screen.getByTestId('sign-out-btn'))
    expect(handleClearData).toHaveBeenCalled()
    expect(handleSignOut).toHaveBeenCalled()
  })
})
