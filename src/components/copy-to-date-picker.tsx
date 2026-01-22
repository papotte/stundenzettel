'use client'

import React from 'react'

import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

export interface CopyToDatePickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetDate: Date | undefined
  onTargetDateChange: (date: Date | undefined) => void
  onConfirm: () => void
  confirmLabel: string
  title?: string
  disabled?: boolean
  children: React.ReactNode
}

export function CopyToDatePicker({
  open,
  onOpenChange,
  targetDate,
  onTargetDateChange,
  onConfirm,
  confirmLabel,
  title,
  disabled = false,
  children,
}: CopyToDatePickerProps) {
  const t = useTranslations()

  const handleCancel = () => {
    onOpenChange(false)
  }

  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild disabled={disabled}>
        {children}
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align="start"
        data-testid="copy-to-date-picker-popover"
      >
        <div className="flex flex-col">
          {title ? (
            <div className="border-b px-4 py-3 text-md font-medium">
              {title}
            </div>
          ) : null}
          <Calendar
            mode="single"
            selected={targetDate}
            onSelect={(date) => onTargetDateChange(date ?? undefined)}
          />
          <div className="flex gap-2 border-t p-4 justify-end">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              {t('common.cancel')}
            </Button>
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={!targetDate}
              type="button"
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
