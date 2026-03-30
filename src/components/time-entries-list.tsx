'use client'

import React, { useMemo, useState } from 'react'

import { isSameDay, subDays } from 'date-fns'
import { Copy } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { CopyToDatePicker } from '@/components/copy-to-date-picker'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { SubscriptionGuardButton } from '@/components/ui/subscription-guard-button'
import { useTimeTrackerContext } from '@/context/time-tracker-context'
import { formatHoursAndMinutes } from '@/lib/utils'

import TimeEntryCard from './time-entry-card'

const TimeEntriesList: React.FC = () => {
  const {
    selectedDate,
    entries,
    isLoading,
    filteredEntries,
    handleEditEntry,
    handleDeleteEntry,
    handleCopyFromYesterday,
    handleCopyEntryTo,
    handleCopyDayTo,
    dailyTotal,
    openNewEntryForm,
    formattedSelectedDate,
    userSettings,
  } = useTimeTrackerContext()
  const t = useTranslations()
  const [copyDayPickerOpen, setCopyDayPickerOpen] = useState(false)
  const [copyDayTargetDate, setCopyDayTargetDate] = useState<Date | undefined>(
    undefined,
  )

  const yesterdayEntries = useMemo(() => {
    if (!selectedDate || !Array.isArray(entries)) return []
    const yesterday = subDays(selectedDate, 1)
    return entries.filter(
      (e) => e.startTime && isSameDay(e.startTime, yesterday),
    )
  }, [entries, selectedDate])

  const isToday = selectedDate && isSameDay(selectedDate, new Date())
  const showCopyFromYesterday =
    isToday &&
    yesterdayEntries.length > 0 &&
    filteredEntries.length === 0 &&
    !isLoading
  const showCopyDayTo =
    filteredEntries.length > 0 && !isLoading && !!selectedDate

  const handleCopyDayConfirm = () => {
    if (!copyDayTargetDate) return
    handleCopyDayTo(copyDayTargetDate)
    setCopyDayTargetDate(undefined)
  }

  let listTitle: string
  if (selectedDate && isSameDay(selectedDate, new Date())) {
    listTitle = t('tracker.todaysEntries', {
      date: formattedSelectedDate,
    })
  } else if (selectedDate) {
    listTitle = t('tracker.entriesForDate', {
      date: formattedSelectedDate,
    })
  } else {
    listTitle = t('common.loading')
  }

  let entriesContent: React.ReactNode
  if (isLoading) {
    entriesContent = (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  } else if (filteredEntries.length > 0) {
    entriesContent = (
      <div className="space-y-4">
        {filteredEntries.map((entry) => (
          <TimeEntryCard
            key={entry.id}
            entry={entry}
            onEdit={handleEditEntry}
            onDelete={handleDeleteEntry}
            onCopyTo={handleCopyEntryTo}
            driverCompensationPercent={
              userSettings?.driverCompensationPercent ?? 100
            }
            passengerCompensationPercent={
              userSettings?.passengerCompensationPercent ?? 100
            }
          />
        ))}
      </div>
    )
  } else {
    entriesContent = (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">{t('tracker.noEntries')}</p>
        <SubscriptionGuardButton
          variant="link"
          onClick={openNewEntryForm}
          className="mt-2"
        >
          {t('tracker.addFirstEntryLink')}
        </SubscriptionGuardButton>
      </div>
    )
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex shrink">{listTitle}</CardTitle>
          <div className="text-nowrap text-lg font-bold text-primary">
            {formatHoursAndMinutes(dailyTotal)}
          </div>
        </div>
        {(showCopyFromYesterday || showCopyDayTo) && (
          <div className="mt-2 flex flex-wrap justify-end gap-2">
            {showCopyFromYesterday && (
              <SubscriptionGuardButton
                variant="outline"
                size="sm"
                onClick={handleCopyFromYesterday}
                data-testid="copy-from-yesterday-button"
              >
                <Copy className="mr-2 h-4 w-4" />
                {t('tracker.copyFromYesterday')}
              </SubscriptionGuardButton>
            )}
            {showCopyDayTo && (
              <CopyToDatePicker
                open={copyDayPickerOpen}
                onOpenChange={setCopyDayPickerOpen}
                targetDate={copyDayTargetDate}
                onTargetDateChange={setCopyDayTargetDate}
                onConfirm={handleCopyDayConfirm}
                confirmLabel={t('tracker.copyDayToConfirm')}
                title={t('tracker.copyDayToTitle')}
              >
                <SubscriptionGuardButton
                  variant="outline"
                  size="sm"
                  data-testid="copy-day-to-button"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  {t('tracker.copyDayTo')}
                </SubscriptionGuardButton>
              </CopyToDatePicker>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>{entriesContent}</CardContent>
    </Card>
  )
}

export default TimeEntriesList
