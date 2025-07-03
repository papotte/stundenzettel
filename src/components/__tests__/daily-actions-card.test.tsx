import React from 'react'

import { fireEvent, render, screen } from '@testing-library/react'

import DailyActionsCard from '@/components/daily-actions-card'

// Mock translation context
jest.mock('@/context/i18n-context', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const dict: Record<string, string> = {
        'special_locations.SICK_LEAVE': 'Sick Leave',
        'special_locations.PTO': 'PTO',
        'special_locations.BANK_HOLIDAY': 'Bank Holiday',
        'special_locations.TIME_OFF_IN_LIEU': 'Time Off in Lieu',
        'tracker.dailyActionsDescription':
          'Quickly add entries for the selected day: {date}',
        'tracker.dailyActionsTitle': 'Quick Actions',
      }
      return dict[key] || key
    },
    language: 'en',
    setLanguageState: jest.fn(),
    loading: false,
  }),
}))

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
    expect(screen.getByText('Sick Leave')).toBeInTheDocument()
    expect(screen.getByText('PTO')).toBeInTheDocument()
    expect(screen.getByText('Bank Holiday')).toBeInTheDocument()
    expect(screen.getByText('Time Off in Lieu')).toBeInTheDocument()
  })

  it('calls handleAddSpecialEntry with correct key', () => {
    renderWithProviders(<DailyActionsCard />)
    fireEvent.click(screen.getByText('Sick Leave'))
    fireEvent.click(screen.getByText('PTO'))
    fireEvent.click(screen.getByText('Bank Holiday'))
    fireEvent.click(screen.getByText('Time Off in Lieu'))
    expect(handleAddSpecialEntry).toHaveBeenCalledWith('SICK_LEAVE')
    expect(handleAddSpecialEntry).toHaveBeenCalledWith('PTO')
    expect(handleAddSpecialEntry).toHaveBeenCalledWith('BANK_HOLIDAY')
    expect(handleAddSpecialEntry).toHaveBeenCalledWith('TIME_OFF_IN_LIEU')
  })

  it('renders selectedDate', () => {
    renderWithProviders(<DailyActionsCard />)
    expect(
      screen.getByText(/Quickly add entries for the selected day/),
    ).toBeInTheDocument()
  })
})
