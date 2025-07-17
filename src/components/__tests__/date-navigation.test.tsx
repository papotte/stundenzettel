import React from 'react'

import { fireEvent, render, screen } from '@testing-library/react'

import DateNavigation from '../date-navigation'

// Mock the time tracker context
const mockHandlePreviousDay = jest.fn()
const mockHandleNextDay = jest.fn()
const mockSetSelectedDate = jest.fn()
const mockSetIsFormOpen = jest.fn()
const mockOpenNewEntryForm = jest.fn()
const mockHandleSaveEntry = jest.fn()

jest.mock('@/context/time-tracker-context', () => ({
  useTimeTrackerContext: () => ({
    selectedDate: new Date('2024-01-15'),
    setSelectedDate: mockSetSelectedDate,
    handlePreviousDay: mockHandlePreviousDay,
    handleNextDay: mockHandleNextDay,
    isFormOpen: false,
    setIsFormOpen: mockSetIsFormOpen,
    editingEntry: null,
    handleSaveEntry: mockHandleSaveEntry,
    userSettings: {
      defaultWorkHours: 8,
      defaultStartTime: '09:00',
      defaultEndTime: '17:00',
      language: 'en',
    },
    openNewEntryForm: mockOpenNewEntryForm,
    formattedSelectedDate: 'January 15, 2024',
  }),
}))

// Mock the time entry form component
jest.mock('../time-entry-form', () => {
  return function MockTimeEntryForm() {
    return <div data-testid="time-entry-form">Time Entry Form</div>
  }
})

describe('DateNavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the time entries title', () => {
    render(<DateNavigation />)

    expect(screen.getByText('tracker.timeEntriesTitle')).toBeInTheDocument()
  })

  it('renders the formatted selected date', () => {
    render(<DateNavigation />)

    expect(screen.getByText('January 15, 2024')).toBeInTheDocument()
  })

  it('renders navigation buttons', () => {
    render(<DateNavigation />)

    expect(screen.getByLabelText('Previous day')).toBeInTheDocument()
    expect(screen.getByLabelText('Next day')).toBeInTheDocument()
  })

  it('calls handlePreviousDay when previous button is clicked', () => {
    render(<DateNavigation />)

    const previousButton = screen.getByLabelText('Previous day')
    fireEvent.click(previousButton)

    expect(mockHandlePreviousDay).toHaveBeenCalled()
  })

  it('calls handleNextDay when next button is clicked', () => {
    render(<DateNavigation />)

    const nextButton = screen.getByLabelText('Next day')
    fireEvent.click(nextButton)

    expect(mockHandleNextDay).toHaveBeenCalled()
  })

  it('renders add entry button', () => {
    render(<DateNavigation />)

    expect(screen.getByText('tracker.addEntryButton')).toBeInTheDocument()
  })

  it('calls openNewEntryForm when add entry button is clicked', () => {
    render(<DateNavigation />)

    const addButton = screen.getByText('tracker.addEntryButton')
    fireEvent.click(addButton)

    expect(mockOpenNewEntryForm).toHaveBeenCalled()
  })

  it('has correct data attribute for selected date', () => {
    render(<DateNavigation />)

    const dateButton = screen.getByText('January 15, 2024').closest('button')
    expect(dateButton).toHaveAttribute('data-selected-date', '2024-01-15')
  })

  it('renders calendar icon in date button', () => {
    render(<DateNavigation />)

    const dateButton = screen.getByText('January 15, 2024').closest('button')
    expect(dateButton).toBeInTheDocument()
    // The calendar icon should be present (lucide-react icon)
    expect(dateButton?.querySelector('svg')).toBeInTheDocument()
  })

  it('renders plus icon in add entry button', () => {
    render(<DateNavigation />)

    const addButton = screen.getByText('tracker.addEntryButton')
    expect(addButton).toBeInTheDocument()
    // The plus icon should be present (lucide-react icon)
    expect(addButton.querySelector('svg')).toBeInTheDocument()
  })

  it('applies correct responsive classes', () => {
    render(<DateNavigation />)

    const container = screen
      .getByText('tracker.timeEntriesTitle')
      .closest('div')
    expect(container).toHaveClass('flex-col', 'sm:flex-row')
    expect(container).toHaveClass('items-start', 'sm:items-center')
  })
})
