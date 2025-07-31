import React from 'react'

import { fireEvent, render, screen, waitFor, within } from '@jest-setup'
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

const entries = [
  {
    id: '1',
    userId: 'u1',
    location: 'Office',
    startTime: new Date('2024-06-01T09:15:00'),
    endTime: new Date('2024-06-01T17:15:00'),
    pauseDuration: 30,
    driverTimeHours: 0.5,
    passengerTimeHours: 0.25,
  },
  {
    id: '2',
    userId: 'u1',
    location: 'Home',
    startTime: new Date('2024-06-02T08:00:00'),
    endTime: new Date('2024-06-02T16:00:00'),
    pauseDuration: 30,
    driverTimeHours: 0.25,
    passengerTimeHours: 0.5,
  },
]

// Mock useTimeTrackerContext
jest.mock('@/context/time-tracker-context', () => ({
  useTimeTrackerContext: () => ({
    entries: entries,
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
      startTime: new Date('2024-01-10T10:00:00Z'),
      endTime: new Date('2024-01-10T18:30:00Z'),
      pauseDuration: 45,
      driverTimeHours: 0.5,
      passengerTimeHours: 0.25,
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
      screen.getByLabelText('time_entry_form.driverTimeLabel'),
    ).toHaveValue(0.5)
    expect(
      screen.getByLabelText('time_entry_form.passengerTimeLabel'),
    ).toHaveValue(0.25)
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

// Add smart suggestion tests
describe('Smart suggestions', () => {
  it('shows start time suggestions for matching location and hides when selected', async () => {
    render(
      <TestWrapper
        entry={null}
        selectedDate={new Date('2024-06-03')}
        onSave={jest.fn()}
        onClose={jest.fn()}
        userSettings={{
          defaultWorkHours: 8,
          defaultStartTime: '09:00',
          defaultEndTime: '17:00',
          language: 'en',
        }}
      />,
    )

    // Type a location that matches a previous entry
    const locationInput = screen.getByLabelText('time_entry_form.locationLabel')
    await userEvent.clear(locationInput)
    await userEvent.type(locationInput, 'Office')

    // Focus start time input to show suggestions
    const startTimeInput = screen.getByLabelText(
      'time_entry_form.startTimeLabel',
    )
    fireEvent.focus(startTimeInput)

    // Suggestion should appear
    expect(await screen.findByText('09:15')).toBeInTheDocument()

    // Click the suggestion
    const suggestion = await screen.findByText('09:15')
    expect(suggestion).toBeInTheDocument()
    await userEvent.click(suggestion)

    // The input should now have the value
    expect(startTimeInput).toHaveValue('09:15')

    // The suggestion should now be hidden
    expect(screen.queryByText('09:15')).not.toBeInTheDocument()
  })

  it('shows tooltip for smart suggestion', async () => {
    render(
      <TestWrapper
        entry={null}
        selectedDate={new Date('2024-06-03')}
        onSave={jest.fn()}
        onClose={jest.fn()}
        userSettings={{
          defaultWorkHours: 8,
          defaultStartTime: '08:00',
          defaultEndTime: '17:00',
          language: 'en',
        }}
      />,
    )

    // Type a location that matches a previous entry
    const locationInput = screen.getByLabelText('time_entry_form.locationLabel')
    await userEvent.clear(locationInput)
    await userEvent.type(locationInput, 'Office')

    // Hover over the suggestion chip
    const suggestionChip = await screen.findByText('09:15')
    await userEvent.hover(suggestionChip)

    // Tooltip should appear in the div start-time-suggestions
    const suggestionBox = await screen.findByTestId('start-time-suggestions')
    const tooltip = await within(suggestionBox).findAllByText(
      'time_entry_form.smartSuggestionTooltip',
    )
    expect(tooltip[0]).toBeVisible()
  })
})

describe('Duration-only entries', () => {
  it('allows creating a duration-only entry and calls onSave with correct data', async () => {
    const user = userEvent.setup()
    render(
      <TestWrapper
        entry={null}
        selectedDate={new Date('2024-07-01T00:00:00')}
        onSave={mockOnSave}
        onClose={mockOnClose}
        userSettings={mockUserSettings}
      />,
    )

    // Fill location
    const locationInput = screen.getByLabelText('time_entry_form.locationLabel')
    await user.clear(locationInput)
    await user.type(locationInput, 'Duration Project')
    fireEvent.blur(locationInput)

    // Switch to duration mode
    const modeSwitch = screen.getByTestId('mode-switch')
    await user.click(modeSwitch)

    // Fill duration (e.g., 90 minutes)
    const durationInput = screen.getByLabelText(
      'time_entry_form.durationFormLabel',
    )
    await user.clear(durationInput)
    await user.type(durationInput, '90')

    // Save
    await user.click(
      screen.getByRole('button', { name: 'time_entry_form.saveButton' }),
    )

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalled()
    })
    const call = mockOnSave.mock.calls[0][0]
    expect(call).toEqual(
      expect.objectContaining({
        location: 'Duration Project',
        durationMinutes: 90,
        pauseDuration: 0,
        driverTimeHours: 0,
        passengerTimeHours: 0,
      }),
    )
    // Should not have startTime/endTime fields (or they should be undefined)
    expect(call.startTime).toBeDefined()
    expect(call.endTime).toBeUndefined()
  })

  it('shows validation error if duration is missing or invalid', async () => {
    const user = userEvent.setup()
    render(
      <TestWrapper
        entry={null}
        selectedDate={new Date('2024-07-01T00:00:00')}
        onSave={mockOnSave}
        onClose={mockOnClose}
        userSettings={mockUserSettings}
      />,
    )
    // Switch to duration mode
    const modeSwitch = screen.getByTestId('mode-switch')
    await user.click(modeSwitch)
    // Clear duration input
    const durationInput = screen.getByLabelText(
      'time_entry_form.durationFormLabel',
    )
    await user.clear(durationInput)
    // Try to save
    await user.click(
      screen.getByRole('button', { name: 'time_entry_form.saveButton' }),
    )
    expect(await screen.findByText(/15 minutes/)).toBeInTheDocument() // Should mention minimum 15 minutes
    expect(mockOnSave).not.toHaveBeenCalled()
    // Enter invalid duration (e.g., 17)
    await user.type(durationInput, '17')
    await user.click(
      screen.getByRole('button', { name: 'time_entry_form.saveButton' }),
    )
    expect(await screen.findByText(/multiple of 15/)).toBeInTheDocument()
    expect(mockOnSave).not.toHaveBeenCalled()
  })

  it('renders and allows editing an existing duration-only entry', async () => {
    const user = userEvent.setup()
    const durationEntry: TimeEntry = {
      id: 'd1',
      userId: 'user-1',
      location: 'Duration Edit',
      durationMinutes: 150,
      startTime: new Date('2024-07-01T10:00:00'),
      pauseDuration: 0,
      // No drivingTimeHours or passengerTimeHours
    }
    render(
      <TestWrapper
        entry={durationEntry}
        selectedDate={new Date('2024-07-01T00:00:00')}
        onSave={mockOnSave}
        onClose={mockOnClose}
        userSettings={mockUserSettings}
      />,
    )
    // Should show duration mode and correct value
    const modeSwitch = screen.getByTestId('mode-switch')
    expect(modeSwitch).toBeChecked()
    const durationInput = screen.getByLabelText(
      'time_entry_form.durationFormLabel',
    )
    expect(durationInput).toHaveValue(150)
    // Edit duration
    await user.clear(durationInput)
    await user.type(durationInput, '150')
    await user.click(
      screen.getByRole('button', { name: 'time_entry_form.saveButton' }),
    )
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalled()
    })
    const call = mockOnSave.mock.calls[0][0]
    expect(call).toEqual(
      expect.objectContaining({
        location: 'Duration Edit',
        durationMinutes: 150,
        pauseDuration: 0,
        driverTimeHours: 0,
        passengerTimeHours: 0,
      }),
    )
  })

  it('shows error if duration is less than 15', async () => {
    const user = userEvent.setup()
    render(
      <TestWrapper
        entry={null}
        selectedDate={new Date('2024-07-01T00:00:00')}
        onSave={mockOnSave}
        onClose={mockOnClose}
        userSettings={mockUserSettings}
      />,
    )
    // Switch to duration mode
    const modeSwitch = screen.getByTestId('mode-switch')
    await user.click(modeSwitch)
    const durationInput = screen.getByLabelText(
      'time_entry_form.durationFormLabel',
    )
    await user.clear(durationInput)
    await user.type(durationInput, '3')
    await user.click(
      screen.getByRole('button', { name: 'time_entry_form.saveButton' }),
    )
    const error = await screen.findByText(/Minimum 15 minutes/i)
    expect(error).toBeVisible()
    expect(mockOnSave).not.toHaveBeenCalled()
  })

  it('shows error if duration is more than 1440', async () => {
    const user = userEvent.setup()
    render(
      <TestWrapper
        entry={null}
        selectedDate={new Date('2024-07-01T00:00:00')}
        onSave={mockOnSave}
        onClose={mockOnClose}
        userSettings={mockUserSettings}
      />,
    )
    // Switch to duration mode
    const modeSwitch = screen.getByTestId('mode-switch')
    await user.click(modeSwitch)
    const durationInput = screen.getByLabelText(
      'time_entry_form.durationFormLabel',
    )
    await user.clear(durationInput)
    await user.type(durationInput, '1500')
    await user.click(
      screen.getByRole('button', { name: 'time_entry_form.saveButton' }),
    )
    const error = await screen.findByText(/Maximum 24 hours/i)
    expect(error).toBeVisible()
    expect(mockOnSave).not.toHaveBeenCalled()
  })

  it('shows error if duration is not a multiple of 15', async () => {
    const user = userEvent.setup()
    render(
      <TestWrapper
        entry={null}
        selectedDate={new Date('2024-07-01T00:00:00')}
        onSave={mockOnSave}
        onClose={mockOnClose}
        userSettings={mockUserSettings}
      />,
    )
    // Switch to duration mode
    const modeSwitch = screen.getByTestId('mode-switch')
    await user.click(modeSwitch)
    const durationInput = screen.getByLabelText(
      'time_entry_form.durationFormLabel',
    )
    await user.clear(durationInput)
    await user.type(durationInput, '17')
    await user.click(
      screen.getByRole('button', { name: 'time_entry_form.saveButton' }),
    )
    const error = await screen.findByText(/multiple of 15/i)
    expect(error).toBeVisible()
    expect(mockOnSave).not.toHaveBeenCalled()
  })
})

describe('Special entry location field', () => {
  it('disables the location input and shows translated label for special entries', () => {
    const specialEntry = {
      id: '1',
      location: 'TIME_OFF_IN_LIEU',
      startTime: new Date('2024-07-01T12:00:00'),
      durationMinutes: 480,
      pauseDuration: 0,
      // No drivingTimeHours or passengerTimeHours
      userId: 'test-user',
    }
    render(
      <TestWrapper
        entry={specialEntry}
        selectedDate={new Date('2024-07-01T00:00:00')}
        onSave={mockOnSave}
        onClose={mockOnClose}
        userSettings={mockUserSettings}
      />,
    )
    const locationInput = screen.getByLabelText('time_entry_form.locationLabel')
    expect(locationInput).toBeDisabled()
    expect(locationInput).toHaveValue('special_locations.TIME_OFF_IN_LIEU')
  })
})
