import React from 'react'

import { fireEvent, render, screen } from '@testing-library/react'

import DailyActionsCard from '@/components/daily-actions-card'

// Mock time tracker context
const handleAddSpecialEntry = jest.fn()
jest.mock('@/context/time-tracker-context', () => ({
  useTimeTrackerContext: () => ({
    selectedDate: new Date('2024-06-01'),
    formattedSelectedDate: '2024-06-01',
    handleAddSpecialEntry,
  }),
}))

function renderWithProviders(ui: React.ReactElement) {
  return render(ui)
}

describe('DailyActionsCard', () => {
  beforeEach(() => {
    handleAddSpecialEntry.mockClear()
  })

  it('renders all special entry buttons', () => {
    renderWithProviders(<DailyActionsCard />)
    expect(screen.getByText('special_locations.SICK_LEAVE')).toBeInTheDocument()
    expect(screen.getByText('special_locations.PTO')).toBeInTheDocument()
    expect(
      screen.getByText('special_locations.BANK_HOLIDAY'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('special_locations.TIME_OFF_IN_LIEU'),
    ).toBeInTheDocument()
  })

  it('calls handleAddSpecialEntry with correct key', () => {
    renderWithProviders(<DailyActionsCard />)
    fireEvent.click(screen.getByText('special_locations.SICK_LEAVE'))
    fireEvent.click(screen.getByText('special_locations.PTO'))
    fireEvent.click(screen.getByText('special_locations.BANK_HOLIDAY'))
    fireEvent.click(screen.getByText('special_locations.TIME_OFF_IN_LIEU'))
    expect(handleAddSpecialEntry).toHaveBeenCalledWith('SICK_LEAVE')
    expect(handleAddSpecialEntry).toHaveBeenCalledWith('PTO')
    expect(handleAddSpecialEntry).toHaveBeenCalledWith('BANK_HOLIDAY')
    expect(handleAddSpecialEntry).toHaveBeenCalledWith('TIME_OFF_IN_LIEU')
  })

  it('renders selectedDate', () => {
    renderWithProviders(<DailyActionsCard />)
    expect(
      screen.getByText('tracker.dailyActionsDescription'),
    ).toBeInTheDocument()
  })
})
