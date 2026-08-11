'use client'

import * as React from 'react'

import { Input } from '@/components/ui/input'

function formatDurationInput(value: string) {
  const digits = value.replace(/\D/g, '')
  if (digits.length <= 2) return digits
  return digits.slice(0, 2) + ':' + digits.slice(2, 4)
}

type DurationPickerProps = {
  value?: string
  onChange?: (value: string) => void
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>

const DurationPicker = React.forwardRef<HTMLInputElement, DurationPickerProps>(
  ({ value, onChange, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="tel"
        inputMode="numeric"
        pattern="[0-9:]*"
        maxLength={5}
        {...props}
        value={value ?? ''}
        onChange={(e) => onChange?.(formatDurationInput(e.target.value))}
      />
    )
  },
)
DurationPicker.displayName = 'DurationPicker'

export { DurationPicker }
