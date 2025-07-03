import React from 'react'

import { fireEvent, render, screen } from '@testing-library/react'

import TimeTrackerLiveCard from '@/components/time-tracker-live-card'
import { TooltipProvider } from '@/components/ui/tooltip'

// Handler mocks
const handleStartTimer = jest.fn()
const handleStopTimer = jest.fn()
const handleGetCurrentLocation = jest.fn()
const setLocation = jest.fn()

// Mutable context mock
type MockTimeTrackerContext = {
  runningTimer: { location: string } | null
  elapsedTime: number
  location: string
  isFetchingLocation: boolean
  setLocation: jest.Mock
  handleStartTimer: jest.Mock
  handleStopTimer: jest.Mock
  handleGetCurrentLocation: jest.Mock
}

let mockContext: MockTimeTrackerContext = {
  runningTimer: null,
  elapsedTime: 0,
  location: '',
  isFetchingLocation: false,
  setLocation,
  handleStartTimer,
  handleStopTimer,
  handleGetCurrentLocation,
}

jest.mock('@/context/time-tracker-context', () => ({
  useTimeTrackerContext: () => mockContext,
}))

const renderWithTooltipProvider = (ui: React.ReactElement) =>
  render(<TooltipProvider>{ui}</TooltipProvider>)

describe('TimeTrackerLiveCard', () => {
  beforeEach(() => {
    handleStartTimer.mockClear()
    handleStopTimer.mockClear()
    handleGetCurrentLocation.mockClear()
    setLocation.mockClear()
    // Default context (stopped state)
    mockContext = {
      runningTimer: null,
      elapsedTime: 0,
      location: '',
      isFetchingLocation: false,
      setLocation,
      handleStartTimer,
      handleStopTimer,
      handleGetCurrentLocation,
    }
  })

  it('renders stopped state', () => {
    renderWithTooltipProvider(<TimeTrackerLiveCard />)
    expect(
      screen.getByPlaceholderText('tracker.locationPlaceholder'),
    ).toBeInTheDocument()
    expect(screen.getByText('tracker.startButton')).toBeInTheDocument()
  })

  it('renders running state', () => {
    mockContext.runningTimer = { location: 'Office' }
    mockContext.elapsedTime = 42
    mockContext.location = 'Office'
    renderWithTooltipProvider(<TimeTrackerLiveCard />)
    expect(screen.getByText('tracker.stopButton')).toBeInTheDocument()
    // Optionally check for translation keys or other elements as needed
  })

  it('calls setLocation on input change', () => {
    renderWithTooltipProvider(<TimeTrackerLiveCard />)
    fireEvent.change(
      screen.getByPlaceholderText('tracker.locationPlaceholder'),
      { target: { value: 'Home' } },
    )
    expect(setLocation).toHaveBeenCalledWith('Home')
  })

  it('calls handleStartTimer on start button click', () => {
    renderWithTooltipProvider(<TimeTrackerLiveCard />)
    fireEvent.click(screen.getByText('tracker.startButton'))
    expect(handleStartTimer).toHaveBeenCalled()
  })

  it('calls handleStopTimer on stop button click', () => {
    mockContext.runningTimer = { location: 'Office' }
    renderWithTooltipProvider(<TimeTrackerLiveCard />)
    fireEvent.click(screen.getByText('tracker.stopButton'))
    expect(handleStopTimer).toHaveBeenCalled()
  })

  it('calls handleGetCurrentLocation on location button click', () => {
    renderWithTooltipProvider(<TimeTrackerLiveCard />)
    fireEvent.click(screen.getByLabelText('tracker.getLocationTooltip'))
    expect(handleGetCurrentLocation).toHaveBeenCalled()
  })

  it('disables location button when fetching', () => {
    mockContext.isFetchingLocation = true
    renderWithTooltipProvider(<TimeTrackerLiveCard />)
    expect(screen.getByLabelText('tracker.getLocationTooltip')).toBeDisabled()
  })
})
