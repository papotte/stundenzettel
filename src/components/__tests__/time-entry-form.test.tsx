import React from 'react'

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { reverseGeocode } from '@/ai/flows/reverse-geocode-flow'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import type { TimeEntry, UserSettings } from '@/lib/types'

import TimeEntryForm from '../time-entry-form'

// Mock toast hook
const mockToast = jest.fn()
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}))

// Mock reverse geocode flow
jest.mock('@/ai/flows/reverse-geocode-flow')
const mockedReverseGeocode = reverseGeocode as jest.Mock

// Mock useTimeTrackerContext
jest.mock('@/context/time-tracker-context', () => ({
  useTimeTrackerContext: () => ({
    entries: [], // <-- add this line
    // Add all required context values for TimeEntryForm here
  }),
}))

// Mock useIsMobile at the top, with a toggle variable
let isMobile = false
jest.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => isMobile,
}))

// --- TEST SETUP ---

const mockUserSettings: UserSettings = {
  defaultWorkHours: 8,
  defaultStartTime: '09:00',
  defaultEndTime: '17:00',
  language: 'en',
}

const mockOnSave = jest.fn()
const mockOnClose = jest.fn()

// A wrapper component to provide the necessary Sheet context for the form
// Use `defaultOpen` to make the Sheet uncontrolled, which is simpler for testing.
const TestWrapper = (props: React.ComponentProps<typeof TimeEntryForm>) => (
  <Sheet defaultOpen>
    <SheetContent>
      <TimeEntryForm {...props} />
    </SheetContent>
  </Sheet>
)

beforeEach(() => {
  mockToast.mockClear()
  mockedReverseGeocode.mockClear()
  mockOnSave.mockClear()
  mockOnClose.mockClear()
  isMobile = false
})

// --- TESTS ---

describe('TimeEntryForm', () => {
  it('renders correctly for a new entry', () => {
    render(
      <TestWrapper
        entry={null}
        selectedDate={new Date('2024-01-10T00:00:00')}
        onSave={mockOnSave}
        onClose={mockOnClose}
        userSettings={mockUserSettings}
      />,
    )

    expect(screen.getByLabelText('time_entry_form.locationLabel')).toHaveValue(
      '',
    )
    expect(screen.getByLabelText('time_entry_form.startTimeLabel')).toHaveValue(
      '09:00',
    )
    expect(screen.getByLabelText('time_entry_form.endTimeLabel')).toHaveValue(
      '17:00',
    )
    expect(screen.getByText('time_entry_form.addTitle')).toBeInTheDocument()
  })

  it('renders correctly when editing an existing entry', () => {
    const existingEntry: TimeEntry = {
      id: '1',
      userId: 'user-1',
      location: 'Test Office',
      startTime: new Date('2024-01-10T10:00:00'),
      endTime: new Date('2024-01-10T18:30:00'),
      pauseDuration: 45,
      travelTime: 0.5,
      isDriver: true,
    }

    render(
      <TestWrapper
        entry={existingEntry}
        selectedDate={new Date('2024-01-10T00:00:00')}
        onSave={mockOnSave}
        onClose={mockOnClose}
        userSettings={mockUserSettings}
      />,
    )

    expect(screen.getByLabelText('time_entry_form.locationLabel')).toHaveValue(
      'Test Office',
    )
    expect(screen.getByLabelText('time_entry_form.startTimeLabel')).toHaveValue(
      '10:00',
    )
    expect(screen.getByLabelText('time_entry_form.endTimeLabel')).toHaveValue(
      '18:30',
    )
    expect(screen.getByLabelText('time_entry_form.pauseLabel')).toHaveValue(
      '00:45',
    )
    expect(
      screen.getByLabelText('time_entry_form.travelTimeLabel'),
    ).toHaveValue(0.5)
    expect(screen.getByLabelText('time_entry_form.driverLabel')).toBeChecked()
    expect(screen.getByText('time_entry_form.editTitle')).toBeInTheDocument()
  })

  it('allows user input and calls onSave with correct data for a new entry', async () => {
    const user = userEvent.setup()
    render(
      <TestWrapper
        entry={null}
        selectedDate={new Date('2024-01-10T00:00:00')}
        onSave={mockOnSave}
        onClose={mockOnClose}
        userSettings={mockUserSettings}
      />,
    )

    const locationInput = screen.getByLabelText('time_entry_form.locationLabel')
    expect(locationInput).toBeInTheDocument()
    await user.type(locationInput, 'New Location')
    fireEvent.blur(locationInput)
    await user.clear(screen.getByLabelText('time_entry_form.startTimeLabel'))
    await user.type(
      screen.getByLabelText('time_entry_form.startTimeLabel'),
      '08:00',
    )
    await user.clear(screen.getByLabelText('time_entry_form.endTimeLabel'))
    await user.type(
      screen.getByLabelText('time_entry_form.endTimeLabel'),
      '16:00',
    )
    await user.clear(screen.getByLabelText('time_entry_form.pauseLabel'))
    await user.type(
      screen.getByLabelText('time_entry_form.pauseLabel'),
      '00:30',
    )

    await user.click(
      screen.getByRole('button', { name: 'time_entry_form.saveButton' }),
    )

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalled()
    })

    const expectedStartTime = new Date('2024-01-10T08:00:00')
    const expectedEndTime = new Date('2024-01-10T16:00:00')

    // Check only the relevant fields in the first argument
    const call = mockOnSave.mock.calls[0]
    expect(call[0]).toEqual(
      expect.objectContaining({
        location: 'New Location',
        startTime: expectedStartTime,
        endTime: expectedEndTime,
        pauseDuration: 30,
      }),
    )
    expect(call.length).toBe(1)
  })

  it('displays a validation error if end time is before start time', async () => {
    const user = userEvent.setup()
    render(
      <TestWrapper
        entry={null}
        selectedDate={new Date()}
        onSave={mockOnSave}
        onClose={mockOnClose}
        userSettings={mockUserSettings}
      />,
    )

    await user.clear(screen.getByLabelText('time_entry_form.startTimeLabel'))
    await user.type(
      screen.getByLabelText('time_entry_form.startTimeLabel'),
      '16:00',
    )
    await user.clear(screen.getByLabelText('time_entry_form.endTimeLabel'))
    await user.type(
      screen.getByLabelText('time_entry_form.endTimeLabel'),
      '08:00',
    )

    // Trigger validation by clicking save
    await user.click(
      screen.getByRole('button', { name: 'time_entry_form.saveButton' }),
    )

    expect(
      await screen.findByText('End time must be after start time'),
    ).toBeInTheDocument()
    expect(mockOnSave).not.toHaveBeenCalled()
  })

  it('fetches and sets location when "Get current location" is clicked', async () => {
    mockedReverseGeocode.mockResolvedValue({ address: '123 Main St' })
    // Mock geolocation API
    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition: jest.fn().mockImplementationOnce((success) =>
          Promise.resolve(
            success({
              coords: {
                latitude: 51.1,
                longitude: 45.3,
              },
            }),
          ),
        ),
      },
      configurable: true,
    })

    const user = userEvent.setup()
    render(
      <TestWrapper
        entry={null}
        selectedDate={new Date()}
        onSave={mockOnSave}
        onClose={mockOnClose}
        userSettings={mockUserSettings}
      />,
    )

    const locationButton = screen.getByRole('button', {
      name: 'Get current location',
    })
    await user.click(locationButton)

    await waitFor(() => {
      expect(mockedReverseGeocode).toHaveBeenCalledWith({
        latitude: 51.1,
        longitude: 45.3,
      })
    })

    expect(await screen.findByDisplayValue('123 Main St')).toBeInTheDocument()
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'time_entry_form.locationFetchedToastTitle',
      }),
    )
  })

  it('shows pause suggestion when work duration exceeds 6 hours', async () => {
    const user = userEvent.setup()
    render(
      <TestWrapper
        entry={null}
        selectedDate={new Date()}
        onSave={mockOnSave}
        onClose={mockOnClose}
        userSettings={mockUserSettings}
      />,
    )

    await user.clear(screen.getByLabelText('time_entry_form.startTimeLabel'))
    await user.type(
      screen.getByLabelText('time_entry_form.startTimeLabel'),
      '09:00',
    )
    await user.clear(screen.getByLabelText('time_entry_form.endTimeLabel'))
    await user.type(
      screen.getByLabelText('time_entry_form.endTimeLabel'),
      '16:00',
    ) // 7 hours work

    const suggestionButton = await screen.findByRole('button', {
      name: /time_entry_form.pauseSuggestion/i,
    })
    expect(suggestionButton).toBeInTheDocument()

    await user.click(suggestionButton)
    expect(screen.getByLabelText('time_entry_form.pauseLabel')).toHaveValue(
      '00:30',
    )
  })

  it('should not call onClose when clicking outside the Sheet (pointerDownOutside)', () => {
    render(
      <TestWrapper
        entry={null}
        selectedDate={new Date()}
        onSave={mockOnSave}
        onClose={mockOnClose}
        userSettings={mockUserSettings}
      />,
    )
    // Find the SheetContent (role="dialog")
    const dialog = screen.getByRole('dialog')
    // Simulate pointerDownOutside event
    const event = new Event('pointerdown', { bubbles: true })
    Object.defineProperty(event, 'target', { value: document.body })
    dialog.dispatchEvent(event)
    // onClose should not be called
    expect(mockOnClose).not.toHaveBeenCalled()
    // The form should still be visible
    expect(dialog).toBeVisible()
  })
})

describe('Pause Duration Field', () => {
  beforeEach(() => {
    isMobile = false
  })

  it('shows the correct label and description', () => {
    render(
      <TestWrapper
        entry={null}
        selectedDate={new Date()}
        onSave={mockOnSave}
        onClose={mockOnClose}
        userSettings={mockUserSettings}
      />,
    )
    expect(
      screen.getByLabelText('time_entry_form.pauseLabel'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('time_entry_form.pauseDurationDescription'),
    ).toBeInTheDocument()
  })

  it('shows the correct placeholder', () => {
    render(
      <TestWrapper
        entry={null}
        selectedDate={new Date()}
        onSave={mockOnSave}
        onClose={mockOnClose}
        userSettings={mockUserSettings}
      />,
    )
    expect(screen.getByPlaceholderText(/00:30/)).toBeInTheDocument()
  })

  it('auto-formats input as HH:mm on mobile', async () => {
    isMobile = true
    const user = userEvent.setup()
    render(
      <Sheet defaultOpen>
        <SheetContent>
          <TimeEntryForm
            entry={null}
            selectedDate={new Date()}
            onSave={mockOnSave}
            onClose={mockOnClose}
            userSettings={mockUserSettings}
          />
        </SheetContent>
      </Sheet>,
    )
    const pauseInput = screen.getByLabelText('time_entry_form.pauseLabel')
    await user.clear(pauseInput)
    await user.type(pauseInput, '1234')
    expect(pauseInput).toHaveValue('12:34')
  })

  it('uses type="tel" for pause input on mobile', () => {
    isMobile = true
    render(
      <Sheet defaultOpen>
        <SheetContent>
          <TimeEntryForm
            entry={null}
            selectedDate={new Date()}
            onSave={mockOnSave}
            onClose={mockOnClose}
            userSettings={mockUserSettings}
          />
        </SheetContent>
      </Sheet>,
    )
    const pauseInput = screen.getByLabelText('time_entry_form.pauseLabel')
    expect(pauseInput).toHaveAttribute('type', 'tel')
  })
})
