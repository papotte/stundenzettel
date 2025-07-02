'use client'

import React from 'react'

import { differenceInMinutes, format } from 'date-fns'
import {
  BedDouble,
  CarFront,
  Clock,
  Coffee,
  Edit,
  Hourglass,
  Landmark,
  Plane,
  Timer,
  Trash2,
} from 'lucide-react'

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
import { Checkbox } from '@/components/ui/checkbox'
import { useTranslation } from '@/context/i18n-context'
import { SPECIAL_LOCATION_KEYS, type SpecialLocationKey } from '@/lib/constants'
import type { TimeEntry } from '@/lib/types'
import { cn, formatDuration } from '@/lib/utils'

interface TimeEntryCardProps {
  entry: TimeEntry
  onEdit: (entry: TimeEntry) => void
  onDelete: (id: string) => void
  isSelected: boolean
  onSelectionChange: (id: string, checked: boolean) => void
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
  isSelected,
  onSelectionChange,
}: TimeEntryCardProps) {
  const { t } = useTranslation()

  const isSpecial = SPECIAL_LOCATION_KEYS.includes(
    entry.location as SpecialLocationKey,
  )
  const SpecialIcon = isSpecial
    ? SpecialIcons[entry.location as SpecialLocationKey]
    : undefined

  const getLocationDisplayName = (location: string) => {
    if (SPECIAL_LOCATION_KEYS.includes(location as SpecialLocationKey)) {
      return t(`special_locations.${location}`)
    }
    return location
  }

  const calculateCompensatedSeconds = () => {
    if (!entry.endTime) {
      // Handle running timer case
      return (new Date().getTime() - entry.startTime.getTime()) / 1000
    }

    const workDurationInMinutes = differenceInMinutes(
      entry.endTime,
      entry.startTime,
    )

    if (isSpecial) {
      // For special entries, the duration is just the time between start and end.
      return workDurationInMinutes * 60
    }

    const pauseInMinutes = entry.pauseDuration || 0
    const travelInMinutes = (entry.travelTime || 0) * 60
    const totalCompensatedMinutes =
      workDurationInMinutes - pauseInMinutes + travelInMinutes

    return totalCompensatedMinutes > 0 ? totalCompensatedMinutes * 60 : 0
  }

  const totalCompensatedSeconds = calculateCompensatedSeconds()

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent click from propagating if it's on a button
    if (
      (e.target as HTMLElement).closest('button') ||
      (e.target as HTMLElement).closest('a')
    ) {
      return
    }
    onSelectionChange(entry.id, !isSelected)
  }

  if (SpecialIcon) {
    return (
      <Card
        className={cn(
          'cursor-pointer transition-shadow hover:shadow-md',
          isSelected && 'ring-2 ring-primary',
        )}
        data-testid={`time-entry-card-${entry.location.toLowerCase()}`}
        data-location={entry.location}
        onClick={handleCardClick}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) =>
                  onSelectionChange(entry.id, !!checked)
                }
                aria-label={`Select entry for ${getLocationDisplayName(entry.location)}`}
                onClick={(e) => e.stopPropagation()}
                className="mr-2"
              />
              <SpecialIcon className="h-5 w-5 text-primary" />
              <p className="font-semibold">
                {getLocationDisplayName(entry.location)}
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
                        location: getLocationDisplayName(entry.location),
                      })}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>
                      {t('time_entry_card.deleteAlertCancel')}
                    </AlertDialogCancel>
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
      className={cn(
        'cursor-pointer transition-shadow hover:shadow-md',
        isSelected && 'ring-2 ring-primary',
      )}
      data-testid={`time-entry-card-${entry.id}`}
      data-location={entry.location}
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) =>
                onSelectionChange(entry.id, !!checked)
              }
              aria-label={`Select entry for ${entry.location}`}
              onClick={(e) => e.stopPropagation()}
              className="mt-1"
            />
            <div className="grid flex-1 gap-1">
              <p className="font-semibold">{entry.location}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Clock className="mr-1.5 h-3.5 w-3.5" />
                  <span>
                    {format(entry.startTime, 'p')} -{' '}
                    {entry.endTime
                      ? format(entry.endTime, 'p')
                      : t('time_entry_card.runningLabel')}
                  </span>
                </div>
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
                {entry.travelTime && entry.travelTime > 0 ? (
                  <div className="flex items-center">
                    <Timer className="mr-1.5 h-3.5 w-3.5" />
                    <span>
                      {t('time_entry_card.travelLabel', {
                        hours: entry.travelTime,
                      })}
                    </span>
                  </div>
                ) : null}
                {entry.isDriver ? (
                  <div className="flex items-center">
                    <CarFront className="mr-1.5 h-3.5 w-3.5" />
                    <span>{t('time_entry_card.driverLabel')}</span>
                  </div>
                ) : null}
              </div>
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
                  <AlertDialogCancel>
                    {t('time_entry_card.deleteAlertCancel')}
                  </AlertDialogCancel>
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
