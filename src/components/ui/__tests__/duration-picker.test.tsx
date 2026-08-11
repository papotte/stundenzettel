import React from 'react'

import { render, screen, within } from '@jest-setup'
import userEvent from '@testing-library/user-event'

import { NextIntlClientProvider } from 'next-intl'

import { DurationPicker } from '@/components/ui/duration-picker'

const messages = {
  common: {
    clear: 'Clear',
    cancel: 'Cancel',
    set: 'Set',
  },
}

function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  )
}

describe('DurationPicker', () => {
  it('renders the input and opens the picker on click', async () => {
    const user = userEvent.setup()
    const onChange = jest.fn()
    renderWithIntl(
      <DurationPicker value="00:15" onChange={onChange} title="Duration" />,
    )

    const input = screen.getByDisplayValue('00:15')
    expect(input).toHaveAttribute('type', 'text')
    expect(input).toHaveAttribute('readOnly')

    await user.click(input)
    expect(await screen.findByTestId('hour-wheel')).toBeInTheDocument()
    expect(screen.getByTestId('minute-wheel')).toBeInTheDocument()
    expect(screen.getByTestId('duration-picker-set')).toBeInTheDocument()
  })

  it('selects a new duration and calls onChange when Set is pressed', async () => {
    const user = userEvent.setup()
    const onChange = jest.fn()
    renderWithIntl(
      <DurationPicker value="00:00" onChange={onChange} title="Duration" />,
    )

    await user.click(screen.getByDisplayValue('00:00'))

    const hourWheel = await screen.findByTestId('hour-wheel')
    const minuteWheel = screen.getByTestId('minute-wheel')

    await user.click(within(hourWheel).getByRole('button', { name: '01' }))
    await user.click(within(minuteWheel).getByRole('button', { name: '30' }))
    await user.click(screen.getByTestId('duration-picker-set'))

    expect(onChange).toHaveBeenCalledWith('01:30')
  })

  it('closes the dialog without calling onChange when the close icon is clicked', async () => {
    const user = userEvent.setup()
    const onChange = jest.fn()
    renderWithIntl(
      <DurationPicker value="00:00" onChange={onChange} title="Duration" />,
    )

    await user.click(screen.getByDisplayValue('00:00'))
    await screen.findByTestId('hour-wheel')

    await user.click(screen.getByRole('button', { name: 'Close' }))

    expect(onChange).not.toHaveBeenCalled()
    expect(screen.queryByTestId('hour-wheel')).not.toBeInTheDocument()
  })

  it('closes the dialog without calling onChange when Cancel is pressed', async () => {
    const user = userEvent.setup()
    const onChange = jest.fn()
    renderWithIntl(
      <DurationPicker value="00:00" onChange={onChange} title="Duration" />,
    )

    await user.click(screen.getByDisplayValue('00:00'))

    const hourWheel = await screen.findByTestId('hour-wheel')
    const minuteWheel = screen.getByTestId('minute-wheel')

    await user.click(within(hourWheel).getByRole('button', { name: '02' }))
    await user.click(within(minuteWheel).getByRole('button', { name: '30' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onChange).not.toHaveBeenCalled()
    expect(screen.queryByTestId('hour-wheel')).not.toBeInTheDocument()
  })

  it('resets the draft to 00:00 when Clear is pressed', async () => {
    const user = userEvent.setup()
    const onChange = jest.fn()
    renderWithIntl(
      <DurationPicker value="02:30" onChange={onChange} title="Duration" />,
    )

    await user.click(screen.getByDisplayValue('02:30'))
    await screen.findByTestId('hour-wheel')

    await user.click(screen.getByRole('button', { name: 'Clear' }))

    expect(screen.getByText('00:00')).toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('respects maxHours and minuteStep props', async () => {
    const user = userEvent.setup()
    const onChange = jest.fn()
    renderWithIntl(
      <DurationPicker
        value="00:00"
        onChange={onChange}
        title="Duration"
        maxHours={2}
        minuteStep={15}
      />,
    )

    await user.click(screen.getByDisplayValue('00:00'))

    const hourWheel = await screen.findByTestId('hour-wheel')
    const minuteWheel = screen.getByTestId('minute-wheel')

    expect(
      within(hourWheel).getByRole('button', { name: '02' }),
    ).toBeInTheDocument()
    expect(
      within(hourWheel).queryByRole('button', { name: '03' }),
    ).not.toBeInTheDocument()

    expect(
      within(minuteWheel).getByRole('button', { name: '30' }),
    ).toBeInTheDocument()
    expect(
      within(minuteWheel).queryByRole('button', { name: '01' }),
    ).not.toBeInTheDocument()
  })
})
