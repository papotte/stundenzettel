import React from 'react'

import { fireEvent, render, screen } from '@testing-library/react'

import BillingToggle from '../billing-toggle'

describe('BillingToggle', () => {
  const mockOnToggle = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders monthly and yearly labels', () => {
    render(<BillingToggle isYearly={false} onToggle={mockOnToggle} />)

    expect(screen.getByText('pricing.monthly')).toBeInTheDocument()
    expect(screen.getByText('pricing.yearly')).toBeInTheDocument()
  })

  it('shows switch in unchecked state when isYearly is false', () => {
    render(<BillingToggle isYearly={false} onToggle={mockOnToggle} />)

    const switchElement = screen.getByRole('switch')
    expect(switchElement).not.toBeChecked()
  })

  it('shows switch in checked state when isYearly is true', () => {
    render(<BillingToggle isYearly={true} onToggle={mockOnToggle} />)

    const switchElement = screen.getByRole('switch')
    expect(switchElement).toBeChecked()
  })

  it('calls onToggle when switch is clicked', () => {
    render(<BillingToggle isYearly={false} onToggle={mockOnToggle} />)

    const switchElement = screen.getByRole('switch')
    fireEvent.click(switchElement)

    expect(mockOnToggle).toHaveBeenCalledWith(true)
  })

  it('shows save badge when isYearly is true', () => {
    render(<BillingToggle isYearly={true} onToggle={mockOnToggle} />)

    expect(screen.getByText('pricing.save20')).toBeInTheDocument()
  })

  it('does not show save badge when isYearly is false', () => {
    render(<BillingToggle isYearly={false} onToggle={mockOnToggle} />)

    expect(screen.queryByText('pricing.save20')).not.toBeInTheDocument()
  })

  it('has correct accessibility attributes', () => {
    render(<BillingToggle isYearly={false} onToggle={mockOnToggle} />)

    const switchElement = screen.getByRole('switch')
    expect(switchElement).toHaveAttribute('id', 'billing-toggle')

    const labels = screen.getAllByText(/pricing\.(monthly|yearly)/)
    labels.forEach((label) => {
      expect(label).toHaveAttribute('for', 'billing-toggle')
    })
  })
})
