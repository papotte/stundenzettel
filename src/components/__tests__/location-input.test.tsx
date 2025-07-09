import React from 'react'

import { fireEvent, render, screen } from '@testing-library/react'

import { LocationInput } from '../location-input'
import { TooltipProvider } from '../ui/tooltip'

// Helper to wrap with TooltipProvider
const renderWithProvider = (ui: React.ReactElement) =>
  render(<TooltipProvider>{ui}</TooltipProvider>)

describe('LocationInput', () => {
  const baseProps = {
    value: '',
    onChange: jest.fn(),
    disabled: false,
    suggestions: ['Office', 'Home', 'Client Site'],
    isSpecialEntry: false,
    label: 'Location',
    placeholder: 'Enter location',
    onGetCurrentLocation: jest.fn(),
    isFetchingLocation: false,
    error: undefined,
    onBlur: jest.fn(),
    onFocus: jest.fn(),
  }

  it('renders with label, placeholder, and value', () => {
    renderWithProvider(<LocationInput {...baseProps} value="Test" />)
    expect(screen.getByLabelText('Location')).toHaveValue('Test')
    expect(screen.getByPlaceholderText('Enter location')).toBeInTheDocument()
  })

  it('shows suggestions when focused and input is typed', async () => {
    renderWithProvider(<LocationInput {...baseProps} value="O" />)
    const input = screen.getByLabelText('Location')
    input.focus()
    // Use role-based query for options
    const options = await screen.findAllByRole('option')
    expect(options.map((opt) => opt.textContent)).toEqual(
      expect.arrayContaining(['Office', 'Home', 'Client Site']),
    )
  })

  it('calls onChange when a suggestion is clicked', async () => {
    const onChange = jest.fn()
    renderWithProvider(
      <LocationInput {...baseProps} value="O" onChange={onChange} />,
    )
    const input = screen.getByLabelText('Location')
    input.focus()
    const suggestion = await screen.findByRole('option', { name: 'Office' })
    fireEvent.mouseDown(suggestion)
    expect(onChange).toHaveBeenCalledWith('Office')
  })

  it('supports keyboard navigation and selection', async () => {
    const onChange = jest.fn()
    renderWithProvider(
      <LocationInput {...baseProps} value="" onChange={onChange} />,
    )
    const input = screen.getByLabelText('Location')
    input.focus()
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).toHaveBeenCalledWith('Office')
  })

  it('hides suggestions on escape', async () => {
    renderWithProvider(<LocationInput {...baseProps} value="O" />)
    const input = screen.getByLabelText('Location')
    input.focus()
    await screen.findByRole('option', { name: 'Office' })
    fireEvent.keyDown(input, { key: 'Escape' })
    // Should be removed from the DOM
    expect(screen.queryByRole('option', { name: 'Office' })).toBeNull()
  })

  it('shows get current location button and calls handler', () => {
    const onGetCurrentLocation = jest.fn()
    const props = { ...baseProps, onGetCurrentLocation }
    renderWithProvider(<LocationInput {...props} />)
    const button = screen.getByRole('button', { name: /get current location/i })
    fireEvent.click(button)
    expect(onGetCurrentLocation).toHaveBeenCalled()
  })

  it('does not show suggestions or button if isSpecialEntry', () => {
    renderWithProvider(<LocationInput {...baseProps} isSpecialEntry={true} />)
    expect(screen.queryByText('Office')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /get current location/i }),
    ).not.toBeInTheDocument()
  })

  it('shows error message if error prop is set', () => {
    renderWithProvider(
      <LocationInput {...baseProps} error="Location is required" />,
    )
    expect(screen.getByText('Location is required')).toBeInTheDocument()
  })

  it('is disabled when disabled prop is true', () => {
    renderWithProvider(<LocationInput {...baseProps} disabled={true} />)
    expect(screen.getByLabelText('Location')).toBeDisabled()
  })
})
