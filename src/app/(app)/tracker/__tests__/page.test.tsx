import React from 'react'

import { render, screen } from '@testing-library/react'

import { authScenarios } from '@/test-utils/auth-mocks'

import Home from '../page'

// Mocks
const mockReplace = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}))
jest.mock('@/components/time-tracker', () => {
  const MockTimeTracker = () => <div data-testid="time-tracker" />
  MockTimeTracker.displayName = 'MockTimeTracker'
  return MockTimeTracker
})

// Use centralized auth mock
const mockAuthContext = authScenarios.unauthenticated()
jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => mockAuthContext,
}))

describe('Home Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('redirects to login if not authenticated', () => {
    Object.assign(mockAuthContext, authScenarios.unauthenticated())
    render(<Home />)
    expect(mockReplace).toHaveBeenCalledWith('/login')
  })

  it('renders nothing if loading', () => {
    Object.assign(mockAuthContext, authScenarios.loading())
    const { container } = render(<Home />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders TimeTracker if authenticated', () => {
    Object.assign(mockAuthContext, authScenarios.authenticated({ uid: '123' }))
    render(<Home />)
    expect(screen.getByTestId('time-tracker')).toBeInTheDocument()
  })
})
