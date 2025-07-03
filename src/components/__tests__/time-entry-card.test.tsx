import React from 'react'

import { fireEvent, render, screen } from '@testing-library/react'

import type { TimeEntry } from '@/lib/types'

import TimeEntryCard from '../time-entry-card'

describe('TimeEntryCard', () => {
  const onEdit = jest.fn()
  const onDelete = jest.fn()

  // Use a fixed date to make tests deterministic
  const baseEntry: TimeEntry = {
    id: '1',
    userId: 'user-1',
    location: 'Office',
    startTime: new Date('2024-01-10T09:00:00'),
    endTime: new Date('2024-01-10T17:00:00'),
    pauseDuration: 30,
    travelTime: 0.5,
    isDriver: true,
  }

  beforeEach(() => {
    // Reset mocks before each test
    onEdit.mockClear()
    onDelete.mockClear()
  })

  it('renders a standard time entry correctly', () => {
    render(
      <TimeEntryCard entry={baseEntry} onEdit={onEdit} onDelete={onDelete} />,
    )

    expect(screen.getByText('Office')).toBeInTheDocument()
    // Use regex to be resilient to locale time formatting
    expect(screen.getByText(/9:00.*-.*5:00/i)).toBeInTheDocument()
    expect(screen.getByText('time_entry_card.pauseLabel')).toBeInTheDocument()
    expect(screen.getByText('time_entry_card.travelLabel')).toBeInTheDocument()
    expect(screen.getByText('time_entry_card.driverLabel')).toBeInTheDocument()
    // 8 hours work - 30 min pause + 30 min travel = 8 hours total = 28800 seconds
    expect(screen.getByText('08:00:00')).toBeInTheDocument()
  })

  it('renders a special time entry (Sick Leave) correctly', () => {
    const specialEntry: TimeEntry = {
      ...baseEntry,
      location: 'SICK_LEAVE',
    }
    render(
      <TimeEntryCard
        entry={specialEntry}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    )

    expect(screen.getByText('special_locations.SICK_LEAVE')).toBeInTheDocument()
    // 8 hours duration
    expect(screen.getByText('08:00:00')).toBeInTheDocument()
    // It should not render pause, travel, or driver details
    expect(
      screen.queryByText('time_entry_card.pauseLabel'),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText('time_entry_card.travelLabel'),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText('time_entry_card.driverLabel'),
    ).not.toBeInTheDocument()
  })

  it('calls onEdit when the edit button is clicked', () => {
    render(
      <TimeEntryCard entry={baseEntry} onEdit={onEdit} onDelete={onDelete} />,
    )

    fireEvent.click(screen.getByText('time_entry_card.editLabel'))

    expect(onEdit).toHaveBeenCalledTimes(1)
    expect(onEdit).toHaveBeenCalledWith(baseEntry)
  })

  it('opens delete dialog and calls onDelete when confirmed', () => {
    render(
      <TimeEntryCard entry={baseEntry} onEdit={onEdit} onDelete={onDelete} />,
    )

    // Click the delete trigger button
    fireEvent.click(screen.getByText('time_entry_card.deleteLabel'))

    // Dialog should now be visible
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(
      screen.getByText('time_entry_card.deleteAlertConfirm'),
    ).toBeInTheDocument()

    // Click the confirm button
    fireEvent.click(screen.getByText('time_entry_card.deleteAlertConfirm'))

    expect(onDelete).toHaveBeenCalledTimes(1)
    expect(onDelete).toHaveBeenCalledWith(baseEntry.id)
  })
})
