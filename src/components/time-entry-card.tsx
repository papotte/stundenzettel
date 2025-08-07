'use client'

import React from 'react'

import {
  BedDouble,
  CarFront,
  Clock,
  Coffee,
  Edit,
  Hourglass,
  Landmark,
  Plane,
  Trash2,
  UserPlus,
} from 'lucide-react'
import { useTranslations } from 'next-intl'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SPECIAL_LOCATION_KEYS, type SpecialLocationKey } from '@/lib/constants'
import { useFormatter } from '@/lib/date-formatter'
import { calculateTotalCompensatedMinutes } from '@/lib/time-utils'
import type { TimeEntry } from '@/lib/types'
import { formatDuration, getLocationDisplayName } from '@/lib/utils'

interface TimeEntryCardProps {
  entry: TimeEntry
  onEdit: (entry: TimeEntry) => void
  onDelete: (id: string) => void
  driverCompensationPercent?: number // optional, default 100
  passengerCompensationPercent?: number // optional, default 100
}

const SpecialIcons: { [key in SpecialLocationKey]?: React.ElementType } = {
  SICK_LEAVE: BedDouble,
  PTO: Plane,
  BANK_HOLIDAY: Landmark,
  TIME_OFF_IN_LIEU: Hourglass,
}

export default function TimeEntryCard({
  entry,
  onEdit,
  onDelete,
  driverCompensationPercent = 100,
  passengerCompensationPercent = 100,
}: TimeEntryCardProps) {
  const t = useTranslations()
  const format = useFormatter().dateTime

  const isSpecial = SPECIAL_LOCATION_KEYS.includes(
    entry.location as SpecialLocationKey,
  )
  const SpecialIcon = isSpecial
    ? SpecialIcons[entry.location as SpecialLocationKey]
    : undefined

  const totalCompensatedSeconds =
    calculateTotalCompensatedMinutes(
      [entry],
      driverCompensationPercent,
      passengerCompensationPercent,
    ) * 60 // convert minutes to seconds for formatDuration

  const formattedStartTime = format(entry.startTime, 'shortTime')
  const formattedEndTime =
    entry.endTime instanceof Date ? format(entry.endTime, 'shortTime') : ''

  if (SpecialIcon) {
    return (
      <Card
        className="transition-shadow hover:shadow-md"
        data-testid={`time-entry-card-${entry.location.toLowerCase()}`}
        data-location={entry.location}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <SpecialIcon className="h-5 w-5 text-primary" />
              <p className="font-semibold">
                {getLocationDisplayName(entry.location, t)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <p className="font-mono text-lg font-medium tabular-nums text-primary">
                {totalCompensatedSeconds > 0
                  ? formatDuration(totalCompensatedSeconds)
                  : '—'}
              </p>
              <Button variant="ghost" size="icon" onClick={() => onEdit(entry)}>
                <Edit className="h-4 w-4" />
                <span className="sr-only">
                  {t('time_entry_card.editLabel')}
                </span>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">
                      {t('time_entry_card.deleteLabel')}
                    </span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t('time_entry_card.deleteAlertTitle')}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('time_entry_card.deleteAlertDescription', {
                        location: getLocationDisplayName(entry.location, t),
                      })}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(entry.id)}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      {t('time_entry_card.deleteAlertConfirm')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className="transition-shadow hover:shadow-md"
      data-testid={`time-entry-card-${entry.id}`}
      data-location={entry.location}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="grid flex-1 gap-1">
            <p className="font-semibold">{entry.location}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {typeof entry.durationMinutes === 'number' ? (
                <div className="flex items-center">
                  <Clock className="mr-1.5 h-3.5 w-3.5" />
                  <span>
                    {t('time_entry_form.durationLabel')}:{' '}
                    {entry.durationMinutes} min
                  </span>
                </div>
              ) : (
                <div className="flex items-center">
                  <Clock className="mr-1.5 h-3.5 w-3.5" />
                  <span>
                    {formattedStartTime} - {formattedEndTime}
                  </span>
                </div>
              )}
              {entry.pauseDuration && entry.pauseDuration > 0 ? (
                <div className="flex items-center">
                  <Coffee className="mr-1.5 h-3.5 w-3.5" />
                  <span>
                    {t('time_entry_card.pauseLabel', {
                      minutes: entry.pauseDuration,
                    })}
                  </span>
                </div>
              ) : null}
              {entry.driverTimeHours && entry.driverTimeHours > 0 ? (
                <div className="flex items-center">
                  <CarFront className="mr-1.5 h-3.5 w-3.5" />
                  <span>
                    {t('time_entry_card.drivingLabel', {
                      hours: entry.driverTimeHours,
                    })}
                  </span>
                </div>
              ) : null}
              {entry.passengerTimeHours && entry.passengerTimeHours > 0 ? (
                <div className="flex items-center">
                  <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                  <span>
                    {t('time_entry_card.passengerLabel', {
                      hours: entry.passengerTimeHours,
                    })}
                  </span>
                </div>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <p className="font-mono text-lg font-medium tabular-nums text-primary">
              {formatDuration(totalCompensatedSeconds)}
            </p>
            <Button variant="ghost" size="icon" onClick={() => onEdit(entry)}>
              <Edit className="h-4 w-4" />
              <span className="sr-only">{t('time_entry_card.editLabel')}</span>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">
                    {t('time_entry_card.deleteLabel')}
                  </span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {t('time_entry_card.deleteAlertTitle')}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('time_entry_card.deleteAlertDescription', {
                      location: entry.location,
                    })}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(entry.id)}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    {t('time_entry_card.deleteAlertConfirm')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
