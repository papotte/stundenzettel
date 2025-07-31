import React from 'react'

import { fireEvent, render, screen } from '@jest-setup'

import TimeEntriesList from '@/components/time-entries-list'
import { TimeEntry } from '@/lib/types'

const baseContext = {
  selectedDate: new Date('2024-07-29') as Date | undefined,
  isLoading: false,
  filteredEntries: [] as Partial<TimeEntry>[],
  handleEditEntry: jest.fn(),
  handleDeleteEntry: jest.fn(),
  dailyTotal: 0,
  openNewEntryForm: jest.fn(),
  formattedSelectedDate: '2024-07-29',
  handlePreviousDay: jest.fn(),
  handleNextDay: jest.fn(),
}

let mockContext: typeof baseContext

jest.mock('@/context/time-tracker-context', () => ({
  useTimeTrackerContext: () => mockContext,
}))

describe('TimeEntriesList', () => {
  beforeEach(() => {
    const handleEditEntry = jest.fn()
    const handleDeleteEntry = jest.fn()
    mockContext = {
      ...baseContext,
      handleEditEntry,
      handleDeleteEntry,
    }
  })

  it('renders loading state', () => {
    mockContext.selectedDate = undefined
    mockContext.isLoading = true
    render(<TimeEntriesList />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders empty state', () => {
    render(<TimeEntriesList />)
    expect(screen.getByText('tracker.noEntries')).toBeInTheDocument()
  })

  it('renders entries and calls edit/delete', () => {
    mockContext.filteredEntries = [
      {
        id: '1',
        location: 'Office',
        startTime: new Date(),
        endTime: new Date(),
      },
    ]
    render(<TimeEntriesList />)
    expect(screen.getByText('Office')).toBeInTheDocument()
    fireEvent.click(screen.getByText('time_entry_card.editLabel'))
    expect(mockContext.handleEditEntry).toHaveBeenCalled()
    fireEvent.click(screen.getByText('time_entry_card.deleteLabel'))
    fireEvent.click(screen.getByText('time_entry_card.deleteAlertConfirm'))
    expect(mockContext.handleDeleteEntry).toHaveBeenCalled()
  })

  it('calls navigation callbacks', () => {
    render(<TimeEntriesList />)
  })
})
