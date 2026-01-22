'use client'

import * as React from 'react'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker } from 'react-day-picker'

import { cn } from '@/lib/utils'

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      ISOWeek
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        ...classNames,
      }}
      components={{
        Chevron: ({
          className,
          ...props
        }: {
          className?: string
          [_: string]: unknown
        }) =>
          props.orientation === 'left' ? (
            <ChevronLeft className={cn('h-4 w-4', className)} {...props} />
          ) : (
            <ChevronRight className={cn('h-4 w-4', className)} {...props} />
          ),
      }}
      {...props}
    />
  )
}
Calendar.displayName = 'Calendar'

export { Calendar }
