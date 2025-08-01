import React from 'react'

import { render, screen } from '@jest-setup'
import userEvent from '@testing-library/user-event'

import BillingToggle from '../billing-toggle'

describe('BillingToggle', () => {
  const mockOnToggle = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders with monthly selected by default', () => {
      render(<BillingToggle isYearly={false} onToggle={mockOnToggle} />)

      expect(screen.getByText('landing.pricing.monthly')).toBeInTheDocument()
      expect(screen.getByText('landing.pricing.yearly')).toBeInTheDocument()
      expect(
        screen.queryByText('landing.pricing.save20'),
      ).not.toBeInTheDocument()
    })

    it('renders with yearly selected', () => {
      render(<BillingToggle isYearly={true} onToggle={mockOnToggle} />)

      expect(screen.getByText('landing.pricing.monthly')).toBeInTheDocument()
      expect(screen.getByText('landing.pricing.yearly')).toBeInTheDocument()
      expect(screen.getByText('landing.pricing.save20')).toBeInTheDocument()
    })

    it('has proper ARIA attributes', () => {
      render(<BillingToggle isYearly={false} onToggle={mockOnToggle} />)

      const toggle = screen.getByRole('switch')
      expect(toggle).toHaveAttribute('id', 'billing-toggle')
      expect(toggle).toHaveAttribute('aria-checked', 'false')

      const labels = screen.getAllByText(/pricing\.monthly|pricing\.yearly/)
      labels.forEach((label) => {
        expect(label).toHaveAttribute('for', 'billing-toggle')
      })
    })

    it('has proper ARIA attributes when yearly is selected', () => {
      render(<BillingToggle isYearly={true} onToggle={mockOnToggle} />)

      const toggle = screen.getByRole('switch')
      expect(toggle).toHaveAttribute('id', 'billing-toggle')
      expect(toggle).toHaveAttribute('aria-checked', 'true')
    })
  })

  describe('Interaction', () => {
    it('calls onToggle when switch is clicked', async () => {
      const user = userEvent.setup()
      render(<BillingToggle isYearly={false} onToggle={mockOnToggle} />)

      const toggle = screen.getByRole('switch')
      await user.click(toggle)

      expect(mockOnToggle).toHaveBeenCalledWith(true)
    })

    it('calls onToggle with false when yearly is selected and clicked', async () => {
      const user = userEvent.setup()
      render(<BillingToggle isYearly={true} onToggle={mockOnToggle} />)

      const toggle = screen.getByRole('switch')
      await user.click(toggle)

      expect(mockOnToggle).toHaveBeenCalledWith(false)
    })

    it('calls onToggle when labels are clicked', async () => {
      const user = userEvent.setup()
      render(<BillingToggle isYearly={false} onToggle={mockOnToggle} />)

      const yearlyLabel = screen.getByText('landing.pricing.yearly')
      await user.click(yearlyLabel)

      expect(mockOnToggle).toHaveBeenCalledWith(true)
    })
  })

  describe('Styling', () => {
    it('applies correct classes for monthly selection', () => {
      render(<BillingToggle isYearly={false} onToggle={mockOnToggle} />)

      const container = screen
        .getByText('landing.pricing.monthly')
        .closest('div')
      expect(container).toHaveClass(
        'flex',
        'justify-center',
        'items-center',
        'space-x-4',
        'mb-8',
      )
    })

    it('applies correct classes for yearly selection', () => {
      render(<BillingToggle isYearly={true} onToggle={mockOnToggle} />)

      const container = screen
        .getByText('landing.pricing.yearly')
        .closest('div')
      expect(container).toHaveClass(
        'flex',
        'justify-center',
        'items-center',
        'space-x-4',
        'mb-8',
      )
    })

    it('shows save badge with correct styling when yearly is selected', () => {
      render(<BillingToggle isYearly={true} onToggle={mockOnToggle} />)

      const saveBadge = screen.getByText('landing.pricing.save20')
      expect(saveBadge).toHaveClass('ml-2')
      expect(saveBadge.closest('div')).toHaveClass('badge', 'bg-secondary')
    })
  })

  describe('Accessibility', () => {
    it('has proper keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<BillingToggle isYearly={false} onToggle={mockOnToggle} />)

      const toggle = screen.getByRole('switch')

      // Focus the toggle
      toggle.focus()
      expect(toggle).toHaveFocus()

      // Press space to toggle
      await user.keyboard(' ')
      expect(mockOnToggle).toHaveBeenCalledWith(true)
    })

    it('has proper screen reader support', () => {
      render(<BillingToggle isYearly={false} onToggle={mockOnToggle} />)

      const toggle = screen.getByRole('switch')
      expect(toggle).toHaveAttribute('aria-checked', 'false')

      const labels = screen.getAllByText(/pricing\.monthly|pricing\.yearly/)
      labels.forEach((label) => {
        expect(label).toHaveAttribute('for', 'billing-toggle')
      })
    })
  })

  describe('Edge Cases', () => {
    it('handles undefined onToggle gracefully', () => {
      // This should not throw an error
      expect(() => {
        render(
          <BillingToggle
            isYearly={false}
            onToggle={undefined as unknown as (value: boolean) => void}
          />,
        )
      }).not.toThrow()
    })
  })
})
