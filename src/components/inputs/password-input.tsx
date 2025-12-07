'use client'

import React from 'react'

import { Eye, EyeOff } from 'lucide-react'
import { ControllerRenderProps, FieldValues, Path } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface PasswordInputProps<T extends FieldValues> {
  field: ControllerRenderProps<T, Path<T>>
  placeholder?: string
  disabled?: boolean
  showPassword: boolean
  onToggleVisibility: () => void
  'data-testid'?: string
  toggleTestId?: string
}

export function PasswordInput<T extends FieldValues>({
  field,
  placeholder,
  disabled = false,
  showPassword,
  onToggleVisibility,
  'data-testid': dataTestId,
  toggleTestId,
}: PasswordInputProps<T>) {
  return (
    <div className="relative">
      <Input
        {...field}
        type={showPassword ? 'text' : 'password'}
        placeholder={placeholder}
        disabled={disabled}
        data-testid={dataTestId}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
        onClick={onToggleVisibility}
        disabled={disabled}
        data-testid={toggleTestId}
      >
        {showPassword ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
}

// Standalone password input that doesn't require react-hook-form
interface StandalonePasswordInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  showPassword: boolean
  onToggleVisibility: () => void
  'data-testid'?: string
  toggleTestId?: string
}

export function StandalonePasswordInput({
  showPassword,
  onToggleVisibility,
  'data-testid': dataTestId,
  toggleTestId,
  disabled = false,
  ...props
}: StandalonePasswordInputProps) {
  return (
    <div className="relative">
      <Input
        {...props}
        type={showPassword ? 'text' : 'password'}
        disabled={disabled}
        data-testid={dataTestId}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
        onClick={onToggleVisibility}
        disabled={disabled}
        data-testid={toggleTestId}
      >
        {showPassword ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
}
