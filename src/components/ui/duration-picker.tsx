'use client'

import * as React from 'react'

import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type DurationPickerProps = {
  value?: string
  onChange?: (value: string) => void
  title?: string
  maxHours?: number
  minuteStep?: number
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>

function formatTimeValue(hours: number, minutes: number) {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function parseTimeValue(value?: string) {
  if (!value || !value.includes(':')) return { hours: 0, minutes: 0 }
  const [h, m] = value.split(':').map(Number)
  return {
    hours: Number.isNaN(h) ? 0 : h,
    minutes: Number.isNaN(m) ? 0 : m,
  }
}

type WheelProps = {
  items: string[]
  selected: string
  onSelect: (value: string) => void
  testId?: string
}

function Wheel({ items, selected, onSelect, testId }: WheelProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const el = containerRef.current?.querySelector(
      `[data-value="${selected}"]`,
    ) as HTMLElement | null
    if (el && containerRef.current) {
      const container = containerRef.current
      container.scrollTop =
        el.offsetTop - (container.clientHeight - el.clientHeight) / 2
    }
  }, [selected])

  return (
    <div
      ref={containerRef}
      data-testid={testId}
      style={{ scrollbarWidth: 'thin' }}
      className="h-48 w-16 snap-y snap-mandatory overflow-y-auto rounded-md border [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-track]:bg-transparent"
    >
      {items.map((item) => (
        <button
          key={item}
          type="button"
          data-value={item}
          onClick={() => onSelect(item)}
          className={cn(
            'flex h-10 w-full snap-start items-center justify-center text-sm',
            selected === item
              ? 'bg-primary font-medium text-primary-foreground'
              : 'hover:bg-muted',
          )}
        >
          {item}
        </button>
      ))}
    </div>
  )
}

const DurationPicker = React.forwardRef<HTMLInputElement, DurationPickerProps>(
  (
    {
      value,
      onChange,
      title = 'Duration',
      maxHours = 23,
      minuteStep = 1,
      className,
      ...props
    },
    ref,
  ) => {
    const t = useTranslations('common')
    const [open, setOpen] = React.useState(false)
    const { hours, minutes } = React.useMemo(
      () => parseTimeValue(value),
      [value],
    )
    const [draft, setDraft] = React.useState(formatTimeValue(hours, minutes))

    React.useEffect(() => {
      if (open) {
        setDraft(formatTimeValue(hours, minutes))
      }
    }, [open, hours, minutes])

    const draftHours = parseTimeValue(draft).hours
    const draftMinutes = parseTimeValue(draft).minutes

    const hourOptions = React.useMemo(
      () =>
        Array.from({ length: Math.min(maxHours, 24) + 1 }, (_, i) =>
          String(i).padStart(2, '0'),
        ),
      [maxHours],
    )
    const minuteOptions = React.useMemo(
      () =>
        Array.from({ length: 60 / minuteStep }, (_, i) =>
          String(i * minuteStep).padStart(2, '0'),
        ),
      [minuteStep],
    )

    const handleHourSelect = React.useCallback(
      (h: string) => {
        setDraft(formatTimeValue(Number(h), draftMinutes))
      },
      [draftMinutes],
    )

    const handleMinuteSelect = React.useCallback(
      (m: string) => {
        setDraft(formatTimeValue(draftHours, Number(m)))
      },
      [draftHours],
    )

    const handleSet = React.useCallback(() => {
      onChange?.(draft)
      setOpen(false)
    }, [draft, onChange])

    const handleClear = React.useCallback(() => {
      setDraft('00:00')
    }, [])

    const handleCancel = React.useCallback(() => {
      setOpen(false)
    }, [])

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <Input
          ref={ref}
          type="text"
          inputMode="none"
          readOnly
          value={value ?? ''}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          className={cn('cursor-pointer', className)}
          {...props}
        />
        <DialogContent className="w-80 gap-0 p-0 sm:max-w-sm">
          <DialogHeader className="border-b bg-muted py-3 text-center sm:text-center">
            <DialogTitle className="text-4xl font-semibold">
              {draft}
            </DialogTitle>
            {title && (
              <DialogDescription className="sr-only">{title}</DialogDescription>
            )}
          </DialogHeader>
          <div className="flex items-center justify-center gap-2 p-6">
            <Wheel
              items={hourOptions}
              selected={String(draftHours).padStart(2, '0')}
              onSelect={handleHourSelect}
              testId="hour-wheel"
            />
            <span className="text-2xl font-bold text-muted-foreground">:</span>
            <Wheel
              items={minuteOptions}
              selected={String(draftMinutes).padStart(2, '0')}
              onSelect={handleMinuteSelect}
              testId="minute-wheel"
            />
          </div>
          <DialogFooter className="flex-row justify-end gap-2 border-t px-6 py-3">
            <Button type="button" variant="ghost" onClick={handleClear}>
              {t('clear')}
            </Button>
            <Button type="button" variant="ghost" onClick={handleCancel}>
              {t('cancel')}
            </Button>
            <Button
              type="button"
              data-testid="duration-picker-set"
              onClick={handleSet}
            >
              {t('set')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  },
)
DurationPicker.displayName = 'DurationPicker'

export { DurationPicker }
