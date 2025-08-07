import React from 'react'

import { fireEvent, render, screen } from '@jest-setup'

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
    driverTimeHours: 0.5,
    passengerTimeHours: 0.25,
  }

  beforeEach(() => {
    // Reset mocks before each test
    onEdit.mockClear()
    onDelete.mockClear()
  })

  it('renders a standard time entry correctly', () => {
    render(
      <TimeEntryCard
        entry={baseEntry}
        onEdit={onEdit}
        onDelete={onDelete}
        driverCompensationPercent={100}
        passengerCompensationPercent={100}
      />,
    )

    expect(screen.getByText('Office')).toBeInTheDocument()
    // Use regex to be resilient to locale time formatting
    expect(screen.getByText(/9:00.*-.*17:00/i)).toBeInTheDocument()
    expect(screen.getByText(/pause/i)).toBeInTheDocument()
    expect(screen.getByText('time_entry_card.drivingLabel')).toBeInTheDocument()
    expect(
      screen.getByText('time_entry_card.passengerLabel'),
    ).toBeInTheDocument()
    // 8 hours work - 30 min pause + 30 min driver + 15 min passenger = 8h 15m
    expect(screen.getByText('08:15:00')).toBeInTheDocument()
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

  it('renders a duration-only entry correctly', () => {
    const durationEntry: TimeEntry = {
      id: '2',
      userId: 'user-1',
      location: 'Duration Task',
      durationMinutes: 150, // 2h 30m
      startTime: new Date('2024-01-10T12:00:00'),
      pauseDuration: 0,
    }
    render(
      <TimeEntryCard
        entry={durationEntry}
        onEdit={onEdit}
        onDelete={onDelete}
        driverCompensationPercent={100}
        passengerCompensationPercent={100}
      />,
    )

    expect(screen.getByText('Duration Task')).toBeInTheDocument()
    expect(
      screen.getByText(/time_entry_form.durationLabel: 150 min/),
    ).toBeInTheDocument()
    expect(screen.getByText('02:30:00')).toBeInTheDocument()
    // Should not show a time range
    expect(screen.queryByText(/-.*:/)).not.toBeInTheDocument()
  })

  it('allows creating and displaying a duration-only entry', () => {
    // Simulate creating a duration-only entry and rendering it
    const newDurationEntry: TimeEntry = {
      id: '3',
      userId: 'user-2',
      location: 'Duration Only',
      durationMinutes: 90, // 1h 30m
      startTime: new Date('2024-01-10T12:00:00'),
      pauseDuration: 0,
    }
    render(
      <TimeEntryCard
        entry={newDurationEntry}
        onEdit={onEdit}
        onDelete={onDelete}
        driverCompensationPercent={100}
        passengerCompensationPercent={100}
      />,
    )

    expect(screen.getByText('Duration Only')).toBeInTheDocument()
    expect(
      screen.getByText(/time_entry_form.durationLabel: 90 min/),
    ).toBeInTheDocument()
    expect(screen.getByText('01:30:00')).toBeInTheDocument()
    // Should not show a time range
    expect(screen.queryByText(/-.*:/)).not.toBeInTheDocument()
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
