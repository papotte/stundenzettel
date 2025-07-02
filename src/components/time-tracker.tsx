'use client'

import React from 'react'

import { format, isSameDay } from 'date-fns'
import {
  BarChart,
  BedDouble,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Cog,
  FileSpreadsheet,
  Hourglass,
  Landmark,
  Loader2,
  LogOut,
  MapPin,
  Pause,
  Plane,
  Play,
  Plus,
  Trash2,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

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
import { Calendar } from '@/components/ui/calendar'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useTranslation } from '@/context/i18n-context'
import { useAuth } from '@/hooks/use-auth'
import { useTimeTracker } from '@/hooks/use-time-tracker'
import { useToast } from '@/hooks/use-toast'
import { formatDuration, formatHoursAndMinutes } from '@/lib/utils'

import TimeEntryCard from './time-entry-card'
import TimeEntryForm from './time-entry-form'
import { Skeleton } from './ui/skeleton'

const TimeWiseIcon = ({
  className,
  style,
}: {
  className?: string
  style?: React.CSSProperties
}) => (
  <Image
    src="/favicon.png"
    alt="TimeWise Tracker Logo"
    className={className}
    style={style}
    width={24}
    height={24}
    draggable={false}
    decoding="async"
  />
)

export default function TimeTracker() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const { toast } = useToast()

  const {
    isLoading,
    runningTimer,
    elapsedTime,
    location,
    setLocation,
    selectedDate,
    setSelectedDate,
    isFormOpen,
    setIsFormOpen,
    editingEntry,
    isFetchingLocation,
    userSettings,
    handleStartTimer,
    handleStopTimer,
    handleSaveEntry,
    handleEditEntry,
    handleDeleteEntry,
    handleClearData,
    handleAddSpecialEntry,
    handleGetCurrentLocation,
    handleSignOut,
    handlePreviousDay,
    handleNextDay,
    filteredEntries,
    dailyTotal,
    weeklyTotal,
    monthlyTotal,
    openNewEntryForm,
  } = useTimeTracker(user, toast, t)

  return (
    <TooltipProvider>
      <div className="flex min-h-screen w-full flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
          <div className="flex items-center gap-2">
            <TimeWiseIcon className="h-6 w-6 text-primary" />
            <h1 className="font-headline text-xl font-bold tracking-tight">
              {t('login.title')}
            </h1>
          </div>
          <div
            className="ml-auto flex items-center gap-2"
            role="navigation"
            aria-label="Top navigation"
          >
            <Button asChild variant="outline" className="hidden md:flex">
              <Link href="/export">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                {t('tracker.headerExportLink')}
              </Link>
            </Button>
            {(process.env.NEXT_PUBLIC_ENVIRONMENT === 'development' ||
              process.env.NEXT_PUBLIC_ENVIRONMENT === 'test') && (
              <AlertDialog>
                <Tooltip>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon">
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">
                        {t('tracker.headerClearDataTooltip')}
                      </span>
                    </Button>
                  </AlertDialogTrigger>
                  <TooltipContent>
                    <p>{t('tracker.headerClearDataTooltip')}</p>
                  </TooltipContent>
                </Tooltip>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t('tracker.clearDataAlertTitle')}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('tracker.clearDataAlertDescription')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>
                      {t('tracker.clearDataAlertCancel')}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleClearData}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      {t('tracker.clearDataAlertConfirm')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  asChild
                  variant="ghost"
                  size="icon"
                  className="hidden md:flex"
                >
                  <Link href="/settings">
                    <Cog className="h-4 w-4" />
                    <span className="sr-only">
                      {t('tracker.headerSettingsTooltip')}
                    </span>
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('tracker.headerSettingsTooltip')}</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
                  <span className="sr-only">
                    {t('tracker.headerSignOutTooltip')}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('tracker.headerSignOutTooltip')}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="mx-auto grid max-w-6xl gap-8">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>{t('tracker.liveTrackingTitle')}</CardTitle>
                <CardDescription>
                  {t('tracker.liveTrackingDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {runningTimer ? (
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between rounded-lg bg-muted p-4">
                      <div>
                        <p className="font-medium">
                          {t('tracker.runningTimerLocation', {
                            location: runningTimer.location,
                          })}
                        </p>
                      </div>
                      <p className="font-mono text-2xl font-bold tabular-nums tracking-wider text-primary">
                        {formatDuration(elapsedTime)}
                      </p>
                    </div>
                    <div className="flex">
                      <Button
                        onClick={handleStopTimer}
                        className="w-full bg-destructive transition-all duration-300 hover:bg-destructive/90"
                      >
                        <Pause className="mr-2 h-4 w-4" />
                        {t('tracker.stopButton')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    <div className="flex w-full items-center gap-2">
                      <Input
                        placeholder={t('tracker.locationPlaceholder')}
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="flex-1"
                      />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={handleGetCurrentLocation}
                            aria-label={t('tracker.getLocationTooltip')}
                            disabled={isFetchingLocation}
                          >
                            {isFetchingLocation ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MapPin className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t('tracker.getLocationTooltip')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Button
                      onClick={handleStartTimer}
                      size="lg"
                      className="w-full transition-all duration-300"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      {t('tracker.startButton')}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-lg" data-testid="daily-actions-card">
              <CardHeader>
                <CardTitle>{t('tracker.dailyActionsTitle')}</CardTitle>
                <CardDescription>
                  {selectedDate
                    ? t('tracker.dailyActionsDescription', {
                        date: format(selectedDate, 'PPP'),
                      })
                    : 'Loading...'}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <Button
                  onClick={() => handleAddSpecialEntry('SICK_LEAVE')}
                  variant="outline"
                >
                  <BedDouble className="mr-2 h-4 w-4" />{' '}
                  {t('special_locations.SICK_LEAVE')}
                </Button>
                <Button
                  onClick={() => handleAddSpecialEntry('PTO')}
                  variant="outline"
                >
                  <Plane className="mr-2 h-4 w-4" />{' '}
                  {t('special_locations.PTO')}
                </Button>
                <Button
                  onClick={() => handleAddSpecialEntry('BANK_HOLIDAY')}
                  variant="outline"
                >
                  <Landmark className="mr-2 h-4 w-4" />{' '}
                  {t('special_locations.BANK_HOLIDAY')}
                </Button>
                <Button
                  onClick={() => handleAddSpecialEntry('TIME_OFF_IN_LIEU')}
                  variant="outline"
                >
                  <Hourglass className="mr-2 h-4 w-4" />{' '}
                  {t('special_locations.TIME_OFF_IN_LIEU')}
                </Button>
              </CardContent>
            </Card>

            <div data-testid="time-entries-card">
              <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <h2 className="font-headline text-2xl font-bold">
                  {t('tracker.timeEntriesTitle')}
                </h2>
                <div className="flex w-full items-center gap-2 sm:w-auto">
                  <div className="flex flex-1 items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handlePreviousDay}
                      aria-label="Previous day"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                          data-selected-date={
                            selectedDate
                              ? selectedDate.toISOString().slice(0, 10)
                              : undefined
                          }
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate
                            ? format(selectedDate, 'PPP')
                            : 'Loading...'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => date && setSelectedDate(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleNextDay}
                      aria-label="Next day"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <SheetTrigger asChild>
                      <Button onClick={openNewEntryForm}>
                        <Plus className="mr-2 h-4 w-4" />{' '}
                        {t('tracker.addEntryButton')}
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="flex w-full max-w-none flex-col sm:max-w-md">
                      {selectedDate && (
                        <TimeEntryForm
                          entry={editingEntry}
                          onSave={handleSaveEntry}
                          selectedDate={selectedDate}
                          onClose={() => setIsFormOpen(false)}
                          userSettings={userSettings}
                        />
                      )}
                    </SheetContent>
                  </Sheet>
                </div>
              </div>

              <Card className="shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      {selectedDate && isSameDay(selectedDate, new Date())
                        ? t('tracker.todaysEntries')
                        : selectedDate
                          ? t('tracker.entriesForDate', {
                              date: format(selectedDate, 'PPP'),
                            })
                          : 'Loading...'}
                    </CardTitle>
                    <div className="text-lg font-bold text-primary">
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
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <p className="text-muted-foreground">
                        {t('tracker.noEntries')}
                      </p>
                      <Button
                        variant="link"
                        onClick={openNewEntryForm}
                        className="mt-2"
                      >
                        {t('tracker.addFirstEntryLink')}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-lg" data-testid="summary-card">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart className="h-5 w-5 text-primary" />
                  <CardTitle>{t('tracker.summaryTitle')}</CardTitle>
                </div>
                <CardDescription>
                  {t('tracker.summaryDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 text-center sm:grid-cols-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t('tracker.summaryDay')}
                    </p>
                    <p className="text-2xl font-bold">
                      {formatHoursAndMinutes(dailyTotal)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t('tracker.summaryWeek')}
                    </p>
                    <p className="text-2xl font-bold">
                      {formatHoursAndMinutes(weeklyTotal)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t('tracker.summaryMonth')}
                    </p>
                    <p className="text-2xl font-bold">
                      {formatHoursAndMinutes(monthlyTotal)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </TooltipProvider>
  )
}
