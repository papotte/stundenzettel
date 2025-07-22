'use client'

import React from 'react'

import { Eye, EyeOff } from 'lucide-react'
import { ControllerRenderProps } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface PasswordInputProps {
  field: ControllerRenderProps<any, any>
  placeholder?: string
  disabled?: boolean
  showPassword: boolean
  onToggleVisibility: () => void
  'data-testid'?: string
  toggleTestId?: string
}

export function PasswordInput({
  field,
  placeholder,
  disabled = false,
  showPassword,
  onToggleVisibility,
  'data-testid': dataTestId,
  toggleTestId,
}: PasswordInputProps) {
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