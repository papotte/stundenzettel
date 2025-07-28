import React from 'react'

import { isSameDay } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useTranslation } from '@/hooks/use-translation-compat'
import { useTimeTrackerContext } from '@/context/time-tracker-context'
import { formatHoursAndMinutes } from '@/lib/utils'

import TimeEntryCard from './time-entry-card'

const TimeEntriesList: React.FC = () => {
  const {
    selectedDate,
    isLoading,
    filteredEntries,
    handleEditEntry,
    handleDeleteEntry,
    dailyTotal,
    openNewEntryForm,
    formattedSelectedDate,
    userSettings,
  } = useTimeTrackerContext()
  const { t } = useTranslation()

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex shrink">
            {selectedDate && isSameDay(selectedDate, new Date())
              ? t('tracker.todaysEntries', {
                  date: formattedSelectedDate,
                })
              : selectedDate
                ? t('tracker.entriesForDate', {
                    date: formattedSelectedDate,
                  })
                : 'Loading...'}
          </CardTitle>
          <div className="text-nowrap text-lg font-bold text-primary">
            {formatHoursAndMinutes(dailyTotal)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : filteredEntries.length > 0 ? (
          <div className="space-y-4">
            {filteredEntries.map((entry) => (
              <TimeEntryCard
                key={entry.id}
                entry={entry}
                onEdit={handleEditEntry}
                onDelete={handleDeleteEntry}
                driverCompensationPercent={
                  userSettings?.driverCompensationPercent ?? 100
                }
                passengerCompensationPercent={
                  userSettings?.passengerCompensationPercent ?? 100
                }
              />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">{t('tracker.noEntries')}</p>
            <Button variant="link" onClick={openNewEntryForm} className="mt-2">
              {t('tracker.addFirstEntryLink')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default TimeEntriesList
