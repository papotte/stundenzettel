import React from 'react'

import { render, screen } from '@jest-setup'

import StatsPage from '@/app/(app)/stats/page'
import { TimeTrackerProviderProps } from '@/context/time-tracker-context'
import { authScenarios } from '@/test-utils/auth-mocks'

const mockReplace = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}))

jest.mock('@/components/stats-view', () => {
  const MockStatsView = () => <div data-testid="stats-view" />
  MockStatsView.displayName = 'MockStatsView'
  return MockStatsView
})

jest.mock('@/context/time-tracker-context', () => ({
  TimeTrackerProvider: ({ children }: TimeTrackerProviderProps) => (
    <div data-testid="time-tracker-provider">{children}</div>
  ),
}))

const mockAuthContext = authScenarios.unauthenticated()
jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => mockAuthContext,
}))

describe('StatsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('redirects to login if not authenticated', () => {
    Object.assign(mockAuthContext, authScenarios.unauthenticated())
    render(<StatsPage />)
    expect(mockReplace).toHaveBeenCalledWith('/login?returnUrl=/stats')
  })

  it('renders nothing if loading', () => {
    Object.assign(mockAuthContext, authScenarios.loading())
    const { container } = render(<StatsPage />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders StatsView if authenticated', () => {
    Object.assign(mockAuthContext, authScenarios.authenticated({ uid: '123' }))
    render(<StatsPage />)
    expect(screen.getByTestId('stats-view')).toBeInTheDocument()
    expect(screen.getByTestId('time-tracker-provider')).toBeInTheDocument()
  })
})
