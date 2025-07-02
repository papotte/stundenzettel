import React from 'react'

import { fireEvent, render, screen } from '@testing-library/react'

import { dictionaries } from '@/lib/i18n/dictionaries'
import type { TimeEntry } from '@/lib/types'

import TimeEntryCard from '../time-entry-card'

// Helper to resolve nested keys from the dictionary
const getNestedValue = (obj: Record<string, unknown>, key: string): string => {
  return (key
    .split('.')
    .reduce<unknown>(
      (acc, part) =>
        acc && typeof acc === 'object'
          ? (acc as Record<string, unknown>)[part]
          : undefined,
      obj,
    ) ?? key) as string
}

// Mock the translation hook to use the actual english dictionary
jest.mock('@/context/i18n-context', () => ({
  useTranslation: () => ({
    t: (key: string, replacements?: Record<string, string | number>) => {
      let value = getNestedValue(dictionaries.en, key)

      if (replacements) {
        Object.keys(replacements).forEach((placeholder) => {
          value = value.replace(
            `{${placeholder}}`,
            String(replacements[placeholder]),
          )
        })
      }
      return value
    },
  }),
}))

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
    expect(screen.getByText('30m pause')).toBeInTheDocument()
    expect(screen.getByText('0.5h travel')).toBeInTheDocument()
    expect(screen.getByText('Driver')).toBeInTheDocument()
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

    expect(screen.getByText('Sick Leave')).toBeInTheDocument()
    // 8 hours duration
    expect(screen.getByText('08:00:00')).toBeInTheDocument()
    // It should not render pause, travel, or driver details
    expect(screen.queryByText(/pause/)).not.toBeInTheDocument()
    expect(screen.queryByText(/travel/)).not.toBeInTheDocument()
    expect(screen.queryByText('Driver')).not.toBeInTheDocument()
  })

  it('calls onEdit when the edit button is clicked', () => {
    render(
      <TimeEntryCard entry={baseEntry} onEdit={onEdit} onDelete={onDelete} />,
    )

    const editButton = screen.getByRole('button', { name: 'Edit' })
    fireEvent.click(editButton)

    expect(onEdit).toHaveBeenCalledTimes(1)
    expect(onEdit).toHaveBeenCalledWith(baseEntry)
  })

  it('opens delete dialog and calls onDelete when confirmed', () => {
    render(
      <TimeEntryCard entry={baseEntry} onEdit={onEdit} onDelete={onDelete} />,
    )

    // Click the delete trigger button
    const deleteButton = screen.getByRole('button', { name: 'Delete' })
    fireEvent.click(deleteButton)

    // Dialog should now be visible
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getByText('Are you sure?')).toBeInTheDocument()
    expect(screen.getByText(/This action cannot be undone/)).toHaveTextContent(
      baseEntry.location,
    )

    // Click the confirm button
    const confirmButton = screen.getByRole('button', { name: 'Delete' })
    fireEvent.click(confirmButton)

    expect(onDelete).toHaveBeenCalledTimes(1)
    expect(onDelete).toHaveBeenCalledWith(baseEntry.id)
  })
})
