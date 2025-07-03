import React from 'react'

import { render, screen } from '@testing-library/react'

import { AuthContext } from '@/context/auth-context'

import TimeTracker from '../time-tracker'

// Mock subcomponents to focus on integration
jest.mock('../time-tracker-live-card', () => {
  function LiveTimerPanelMock() {
    return <div data-testid="live-timer-panel" />
  }
  LiveTimerPanelMock.displayName = 'LiveTimerPanelMock'
  return LiveTimerPanelMock
})

jest.mock('../daily-actions-card', () => {
  function DailyActionsCardMock() {
    return <div data-testid="daily-actions-panel" />
  }
  DailyActionsCardMock.displayName = 'DailyActionsCardMock'
  return DailyActionsCardMock
})

jest.mock('../time-entries-list', () => {
  function TimeEntriesListMock() {
    return <div data-testid="time-entries-panel" />
  }
  TimeEntriesListMock.displayName = 'TimeEntriesListMock'
  return TimeEntriesListMock
})

jest.mock('../summary-card', () => {
  function SummaryCardMock() {
    return <div data-testid="summary-panel" />
  }
  SummaryCardMock.displayName = 'SummaryCardMock'
  return SummaryCardMock
})

jest.mock('../time-tracker-header', () => {
  function TimeTrackerHeaderMock() {
    return <div data-testid="header-bar" />
  }
  TimeTrackerHeaderMock.displayName = 'TimeTrackerHeaderMock'
  return TimeTrackerHeaderMock
})

const mockUser = {
  uid: 'user-1',
  displayName: 'Test User',
  email: 'test@example.com',
}

type MockAuthContext = {
  user: typeof mockUser | null
  loading: boolean
  signOut: jest.Mock
}

const mockAuthContext: MockAuthContext = {
  user: mockUser,
  loading: false,
  signOut: jest.fn(),
}

function renderWithProviders(
  ui: React.ReactElement,
  authValue: MockAuthContext = mockAuthContext,
) {
  return render(
    <AuthContext.Provider value={authValue}>{ui}</AuthContext.Provider>,
  )
}

describe('TimeTracker (integration)', () => {
  it('renders all main panels and header', () => {
    renderWithProviders(<TimeTracker />)
    expect(screen.getByTestId('header-bar')).toBeInTheDocument()
    expect(screen.getByTestId('live-timer-panel')).toBeInTheDocument()
    expect(screen.getByTestId('daily-actions-panel')).toBeInTheDocument()
    expect(screen.getByTestId('time-entries-panel')).toBeInTheDocument()
    expect(screen.getByTestId('summary-panel')).toBeInTheDocument()
  })

  it('shows loading state if auth is loading', () => {
    renderWithProviders(<TimeTracker />, { ...mockAuthContext, loading: true })
    // Optionally check for a loading spinner or text if your component renders one
    // expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('handles null user gracefully', () => {
    renderWithProviders(<TimeTracker />, { ...mockAuthContext, user: null })
    expect(screen.getByTestId('header-bar')).toBeInTheDocument()
  })

  // Add more tests as needed for error states, context changes, etc.
})
