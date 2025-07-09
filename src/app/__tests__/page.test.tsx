import React from 'react'

import { render, screen } from '@testing-library/react'

import { useAuth } from '@/hooks/use-auth'

import Home from '../page'

// Mocks
const mockReplace = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}))
const MockTimeTracker = () => <div data-testid="time-tracker" />
MockTimeTracker.displayName = 'MockTimeTracker'
jest.mock('@/components/time-tracker', () => MockTimeTracker)
jest.mock('@/hooks/use-auth', () => ({
  useAuth: jest.fn(),
}))

describe('Home Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('redirects to login if not authenticated', () => {
    ;(useAuth as jest.Mock).mockReturnValue({ user: null, loading: false })
    render(<Home />)
    expect(mockReplace).toHaveBeenCalledWith('/login')
  })

  it('renders nothing if loading', () => {
    ;(useAuth as jest.Mock).mockReturnValue({ user: null, loading: true })
    const { container } = render(<Home />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders TimeTracker if authenticated', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { uid: '123' },
      loading: false,
    })
    render(<Home />)
    expect(screen.getByTestId('time-tracker')).toBeInTheDocument()
  })
})
