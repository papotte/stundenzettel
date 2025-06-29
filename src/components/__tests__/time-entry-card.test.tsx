import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TimeEntryCard from '../time-entry-card';
import type { TimeEntry } from '@/lib/types';
import { set } from 'date-fns';

// Mock the translation hook
jest.mock('@/context/i18n-context', () => ({
  useTranslation: () => ({
    t: (key: string, replacements?: Record<string, string | number>) => {
      if (replacements) {
        let result = key;
        for (const [p, value] of Object.entries(replacements)) {
          result = result.replace(`{${p}}`, String(value));
        }
        return result;
      }
      return key;
    },
  }),
}));

describe('TimeEntryCard', () => {
  const onEdit = jest.fn();
  const onDelete = jest.fn();

  const baseEntry: TimeEntry = {
    id: '1',
    userId: 'user-1',
    location: 'Office',
    startTime: set(new Date(), { hours: 9, minutes: 0 }),
    endTime: set(new Date(), { hours: 17, minutes: 0 }),
    pauseDuration: 30,
    travelTime: 0.5,
    isDriver: true,
  };

  beforeEach(() => {
    // Reset mocks before each test
    onEdit.mockClear();
    onDelete.mockClear();
  });

  it('renders a standard time entry correctly', () => {
    render(<TimeEntryCard entry={baseEntry} onEdit={onEdit} onDelete={onDelete} />);

    expect(screen.getByText('Office')).toBeInTheDocument();
    // Use regex to be resilient to locale time formatting
    expect(screen.getByText(/9:00.*-.*5:00/i)).toBeInTheDocument();
    expect(screen.getByText('time_entry_card.pauseLabel', {exact: false})).toHaveTextContent('30m pause');
    expect(screen.getByText('time_entry_card.travelLabel', {exact: false})).toHaveTextContent('0.5h travel');
    expect(screen.getByText('time_entry_card.driverLabel')).toBeInTheDocument();
    // 8 hours work - 30 min pause + 30 min travel = 8 hours total = 28800 seconds
    expect(screen.getByText('08:00:00')).toBeInTheDocument();
  });

  it('renders a special time entry (Sick Leave) correctly', () => {
    const specialEntry: TimeEntry = {
      ...baseEntry,
      location: 'SICK_LEAVE',
    };
    render(<TimeEntryCard entry={specialEntry} onEdit={onEdit} onDelete={onDelete} />);

    expect(screen.getByText('special_locations.SICK_LEAVE')).toBeInTheDocument();
    // 8 hours duration
    expect(screen.getByText('08:00:00')).toBeInTheDocument();
    // It should not render pause, travel, or driver details
    expect(screen.queryByText(/pause/)).not.toBeInTheDocument();
    expect(screen.queryByText(/travel/)).not.toBeInTheDocument();
    expect(screen.queryByText(/driver/)).not.toBeInTheDocument();
  });

  it('calls onEdit when the edit button is clicked', () => {
    render(<TimeEntryCard entry={baseEntry} onEdit={onEdit} onDelete={onDelete} />);

    const editButton = screen.getByRole('button', { name: 'time_entry_card.editLabel' });
    fireEvent.click(editButton);

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledWith(baseEntry);
  });

  it('opens delete dialog and calls onDelete when confirmed', () => {
    render(<TimeEntryCard entry={baseEntry} onEdit={onEdit} onDelete={onDelete} />);

    // Click the delete trigger button
    const deleteButton = screen.getByRole('button', { name: 'time_entry_card.deleteLabel' });
    fireEvent.click(deleteButton);

    // Dialog should now be visible
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText('time_entry_card.deleteAlertTitle')).toBeInTheDocument();
    expect(screen.getByText(/time_entry_card.deleteAlertDescription/, {exact: false})).toHaveTextContent(baseEntry.location);

    // Click the confirm button
    const confirmButton = screen.getByRole('button', { name: 'time_entry_card.deleteAlertConfirm' });
    fireEvent.click(confirmButton);

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith(baseEntry.id);
  });
});
