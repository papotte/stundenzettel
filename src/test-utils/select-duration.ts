import { screen, within } from '@testing-library/react'
import type { UserEvent } from '@testing-library/user-event'

export async function selectDuration(
  user: UserEvent,
  label: string,
  value: string,
) {
  const [hours, minutes] = value.split(':')
  const input = screen.getByLabelText(label)
  await user.click(input)

  const hourWheel = await screen.findByTestId('hour-wheel')
  const minuteWheel = await screen.findByTestId('minute-wheel')

  await user.click(
    within(hourWheel).getByRole('button', { name: hours as string }),
  )
  await user.click(
    within(minuteWheel).getByRole('button', { name: minutes as string }),
  )
  await user.click(await screen.findByTestId('duration-picker-set'))
}
