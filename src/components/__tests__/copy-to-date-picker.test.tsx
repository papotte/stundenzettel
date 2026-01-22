import React, { useState } from 'react'

import { render, screen, waitFor } from '@jest-setup'
import { within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { CopyToDatePicker } from '../copy-to-date-picker'

/** Day cells use aria-label like "Thursday, January 15th, 2026". Nav buttons use "Go to the ...". */
function getCalendarDayButtons(container: HTMLElement) {
  const buttons = within(container).getAllByRole('button')
  return buttons.filter(
    (el) => !el.getAttribute('aria-label')?.startsWith('Go to the'),
  )
}

function ControlledPicker({
  defaultOpen = false,
  onConfirm = jest.fn(),
  onOpenChange = jest.fn(),
  onTargetDateChange = jest.fn(),
  confirmLabel = 'Copy',
  title,
  disabled,
}: {
  defaultOpen?: boolean
  onConfirm?: jest.Mock
  onOpenChange?: jest.Mock
  onTargetDateChange?: jest.Mock
  confirmLabel?: string
  title?: string
  disabled?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const [targetDate, setTargetDate] = useState<Date | undefined>(undefined)

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    onOpenChange(next)
  }

  return (
    <CopyToDatePicker
      open={open}
      onOpenChange={handleOpenChange}
      targetDate={targetDate}
      onTargetDateChange={(d) => {
        setTargetDate(d)
        onTargetDateChange(d)
      }}
      onConfirm={onConfirm}
      confirmLabel={confirmLabel}
      title={title}
      disabled={disabled}
    >
      <button type="button">Open picker</button>
    </CopyToDatePicker>
  )
}

describe('CopyToDatePicker', () => {
  const mockOnConfirm = jest.fn()
  const mockOnOpenChange = jest.fn()
  const mockOnTargetDateChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('props', () => {
    it('renders the trigger children', () => {
      render(
        <CopyToDatePicker
          open={false}
          onOpenChange={jest.fn()}
          targetDate={undefined}
          onTargetDateChange={jest.fn()}
          onConfirm={jest.fn()}
          confirmLabel="Copy"
        >
          <button type="button">Open picker</button>
        </CopyToDatePicker>,
      )
      expect(
        screen.getByRole('button', { name: 'Open picker' }),
      ).toBeInTheDocument()
    })

    it('renders optional title when provided', () => {
      render(
        <CopyToDatePicker
          open={true}
          onOpenChange={jest.fn()}
          targetDate={undefined}
          onTargetDateChange={jest.fn()}
          onConfirm={jest.fn()}
          confirmLabel="Copy"
          title="Copy to date"
        >
          <button type="button">Open picker</button>
        </CopyToDatePicker>,
      )
      expect(screen.getByText('Copy to date')).toBeInTheDocument()
    })

    it('does not render title section when title is omitted', () => {
      render(
        <CopyToDatePicker
          open={true}
          onOpenChange={jest.fn()}
          targetDate={undefined}
          onTargetDateChange={jest.fn()}
          onConfirm={jest.fn()}
          confirmLabel="Copy"
        >
          <button type="button">Open picker</button>
        </CopyToDatePicker>,
      )
      const popover = screen.getByTestId('copy-to-date-picker-popover')
      expect(within(popover).queryByRole('heading')).not.toBeInTheDocument()
    })

    it('uses confirmLabel for the confirm button', () => {
      render(
        <CopyToDatePicker
          open={true}
          onOpenChange={jest.fn()}
          targetDate={new Date('2024-06-15')}
          onTargetDateChange={jest.fn()}
          onConfirm={jest.fn()}
          confirmLabel="Copy"
        >
          <button type="button">Open picker</button>
        </CopyToDatePicker>,
      )
      expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument()
    })

    it('disables the trigger when disabled is true', () => {
      render(
        <CopyToDatePicker
          open={false}
          onOpenChange={jest.fn()}
          targetDate={undefined}
          onTargetDateChange={jest.fn()}
          onConfirm={jest.fn()}
          confirmLabel="Copy"
          disabled={true}
        >
          <button type="button">Open picker</button>
        </CopyToDatePicker>,
      )
      expect(screen.getByRole('button', { name: 'Open picker' })).toBeDisabled()
    })
  })

  describe('opening and closing', () => {
    it('opens popover when trigger is clicked', async () => {
      const user = userEvent.setup()
      render(
        <ControlledPicker
          onOpenChange={mockOnOpenChange}
          confirmLabel="Copy"
        />,
      )

      expect(
        screen.queryByTestId('copy-to-date-picker-popover'),
      ).not.toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Open picker' }))

      await waitFor(() => {
        expect(
          screen.getByTestId('copy-to-date-picker-popover'),
        ).toBeInTheDocument()
      })
      expect(mockOnOpenChange).toHaveBeenCalledWith(true)
    })

    it('closes popover when cancel is clicked', async () => {
      const user = userEvent.setup()
      render(
        <ControlledPicker
          defaultOpen={true}
          onOpenChange={mockOnOpenChange}
          confirmLabel="Copy"
        />,
      )

      await waitFor(() => {
        expect(
          screen.getByTestId('copy-to-date-picker-popover'),
        ).toBeInTheDocument()
      })

      const cancelButton = screen.getByRole('button', { name: 'common.cancel' })
      await user.click(cancelButton)

      await waitFor(() => {
        expect(
          screen.queryByTestId('copy-to-date-picker-popover'),
        ).not.toBeInTheDocument()
      })
      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })

    it('closes popover when confirm is clicked after selecting a date', async () => {
      const user = userEvent.setup()
      render(
        <ControlledPicker
          defaultOpen={true}
          onConfirm={mockOnConfirm}
          onOpenChange={mockOnOpenChange}
          onTargetDateChange={mockOnTargetDateChange}
          confirmLabel="Copy"
        />,
      )

      const popover = screen.getByTestId('copy-to-date-picker-popover')
      const dayButtons = getCalendarDayButtons(popover)
      const someDay = dayButtons[0]
      expect(someDay).toBeDefined()
      await user.click(someDay!)

      const confirmButton = screen.getByRole('button', { name: 'Copy' })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(
          screen.queryByTestId('copy-to-date-picker-popover'),
        ).not.toBeInTheDocument()
      })
      expect(mockOnConfirm).toHaveBeenCalled()
      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })
  })

  describe('selecting dates', () => {
    it('calls onTargetDateChange when a calendar day is selected', async () => {
      const user = userEvent.setup()
      render(
        <ControlledPicker
          defaultOpen={true}
          onTargetDateChange={mockOnTargetDateChange}
          confirmLabel="Copy"
        />,
      )

      const popover = screen.getByTestId('copy-to-date-picker-popover')
      const dayButtons = getCalendarDayButtons(popover)
      const someDay = dayButtons[0]
      expect(someDay).toBeDefined()
      await user.click(someDay!)

      expect(mockOnTargetDateChange).toHaveBeenCalledTimes(1)
      expect(mockOnTargetDateChange).toHaveBeenCalledWith(expect.any(Date))
    })

    it('enables confirm button only when a date is selected', () => {
      render(
        <CopyToDatePicker
          open={true}
          onOpenChange={jest.fn()}
          targetDate={undefined}
          onTargetDateChange={jest.fn()}
          onConfirm={jest.fn()}
          confirmLabel="Copy"
        >
          <button type="button">Open picker</button>
        </CopyToDatePicker>,
      )
      expect(screen.getByRole('button', { name: 'Copy' })).toBeDisabled()
    })

    it('enables confirm button when targetDate is set', () => {
      render(
        <CopyToDatePicker
          open={true}
          onOpenChange={jest.fn()}
          targetDate={new Date('2024-06-15')}
          onTargetDateChange={jest.fn()}
          onConfirm={jest.fn()}
          confirmLabel="Copy"
        >
          <button type="button">Open picker</button>
        </CopyToDatePicker>,
      )
      expect(screen.getByRole('button', { name: 'Copy' })).toBeEnabled()
    })
  })

  describe('confirm and cancel', () => {
    it('calls onConfirm when confirm button is clicked with a date selected', async () => {
      const user = userEvent.setup()
      render(
        <ControlledPicker
          defaultOpen={true}
          onConfirm={mockOnConfirm}
          onTargetDateChange={mockOnTargetDateChange}
          confirmLabel="Copy"
        />,
      )

      const popover = screen.getByTestId('copy-to-date-picker-popover')
      const dayButtons = getCalendarDayButtons(popover)
      await user.click(dayButtons[0]!)

      await user.click(screen.getByRole('button', { name: 'Copy' }))

      expect(mockOnConfirm).toHaveBeenCalledTimes(1)
    })

    it('does not call onConfirm when confirm is disabled (no date selected)', async () => {
      const user = userEvent.setup()
      render(
        <ControlledPicker
          defaultOpen={true}
          onConfirm={mockOnConfirm}
          confirmLabel="Copy"
        />,
      )
      const confirmButton = screen.getByRole('button', { name: 'Copy' })
      expect(confirmButton).toBeDisabled()
      await user.click(confirmButton)
      expect(mockOnConfirm).not.toHaveBeenCalled()
    })
  })

  describe('accessibility', () => {
    it('trigger button is focusable and has accessible name', () => {
      render(
        <CopyToDatePicker
          open={false}
          onOpenChange={jest.fn()}
          targetDate={undefined}
          onTargetDateChange={jest.fn()}
          onConfirm={jest.fn()}
          confirmLabel="Copy"
        >
          <button type="button">Open picker</button>
        </CopyToDatePicker>,
      )
      const trigger = screen.getByRole('button', { name: 'Open picker' })
      expect(trigger).toHaveAttribute('type', 'button')
      trigger.focus()
      expect(document.activeElement).toBe(trigger)
    })

    it('cancel and confirm buttons have accessible names', () => {
      render(
        <CopyToDatePicker
          open={true}
          onOpenChange={jest.fn()}
          targetDate={new Date('2024-06-15')}
          onTargetDateChange={jest.fn()}
          onConfirm={jest.fn()}
          confirmLabel="Copy"
        >
          <button type="button">Open picker</button>
        </CopyToDatePicker>,
      )
      expect(
        screen.getByRole('button', { name: 'common.cancel' }),
      ).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument()
    })

    it('popover content has identifiable testid for assistive workflows', () => {
      render(
        <CopyToDatePicker
          open={true}
          onOpenChange={jest.fn()}
          targetDate={undefined}
          onTargetDateChange={jest.fn()}
          onConfirm={jest.fn()}
          confirmLabel="Copy"
        >
          <button type="button">Open picker</button>
        </CopyToDatePicker>,
      )
      const popover = screen.getByTestId('copy-to-date-picker-popover')
      expect(popover).toBeInTheDocument()
    })

    it('calendar exposes day buttons for keyboard and screen reader users', () => {
      render(
        <CopyToDatePicker
          open={true}
          onOpenChange={jest.fn()}
          targetDate={undefined}
          onTargetDateChange={jest.fn()}
          onConfirm={jest.fn()}
          confirmLabel="Copy"
        >
          <button type="button">Open picker</button>
        </CopyToDatePicker>,
      )
      const popover = screen.getByTestId('copy-to-date-picker-popover')
      const dayButtons = getCalendarDayButtons(popover)
      expect(dayButtons.length).toBeGreaterThan(0)
    })
  })
})
