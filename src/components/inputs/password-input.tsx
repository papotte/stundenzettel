'use client'

import React from 'react'

import { Eye, EyeOff } from 'lucide-react'
import { ControllerRenderProps, FieldValues, Path } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// Shared password input UI with toggle button
interface PasswordInputUIProps {
  type: 'text' | 'password'
  showPassword: boolean
  onToggleVisibility: () => void
  disabled?: boolean
  'data-testid'?: string
  toggleTestId?: string
  inputProps: React.ComponentPropsWithoutRef<typeof Input>
}

function PasswordInputUI({
  type,
  showPassword,
  onToggleVisibility,
  disabled = false,
  'data-testid': dataTestId,
  toggleTestId,
  inputProps,
}: PasswordInputUIProps) {
  return (
    <div className="relative">
      <Input
        {...inputProps}
        type={type}
        disabled={disabled}
        data-testid={dataTestId}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent hover:text-primary"
        onClick={onToggleVisibility}
        disabled={disabled}
        data-testid={toggleTestId}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? (
          <EyeOff className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Eye className="h-4 w-4" aria-hidden="true" />
        )}
      </Button>
    </div>
  )
}

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
    <PasswordInputUI
      type={showPassword ? 'text' : 'password'}
      showPassword={showPassword}
      onToggleVisibility={onToggleVisibility}
      disabled={disabled}
      data-testid={dataTestId}
      toggleTestId={toggleTestId}
      inputProps={{ ...field, placeholder }}
    />
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
    <PasswordInputUI
      type={showPassword ? 'text' : 'password'}
      showPassword={showPassword}
      onToggleVisibility={onToggleVisibility}
      disabled={disabled}
      data-testid={dataTestId}
      toggleTestId={toggleTestId}
      inputProps={props}
    />
  )
}
