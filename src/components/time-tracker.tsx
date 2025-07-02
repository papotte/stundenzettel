'use client'

import React from 'react'

import { format, isSameDay } from 'date-fns'
import {
  BarChart,
  BedDouble,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Hourglass,
  Landmark,
  Plane,
  Plus,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useTranslation } from '@/context/i18n-context'
import {
  TimeTrackerProvider,
  useTimeTrackerContext,
} from '@/context/time-tracker-context'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { formatHoursAndMinutes } from '@/lib/utils'

import TimeEntryCard from './time-entry-card'
import TimeEntryForm from './time-entry-form'
import TimeTrackerHeader from './time-tracker-header'
import TimeTrackerLiveCard from './time-tracker-live-card'
import { Skeleton } from './ui/skeleton'

export default function TimeTracker() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const { toast } = useToast()

  return (
    <TimeTrackerProvider user={user} toast={toast} t={t}>
      <TooltipProvider>
        <TimeTrackerContent />
      </TooltipProvider>
    </TimeTrackerProvider>
  )
}

function TimeTrackerContent() {
  const {
    selectedDate,
    setSelectedDate,
    handleAddSpecialEntry,
    handlePreviousDay,
    handleNextDay,
    isFormOpen,
    setIsFormOpen,
    editingEntry,
    handleSaveEntry,
    userSettings,
    isLoading,
    filteredEntries,
    handleEditEntry,
    handleDeleteEntry,
    openNewEntryForm,
    dailyTotal,
    weeklyTotal,
    monthlyTotal,
  } = useTimeTrackerContext()
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen w-full flex-col">
      <TimeTrackerHeader
        showClearData={
          process.env.NEXT_PUBLIC_ENVIRONMENT === 'development' ||
          process.env.NEXT_PUBLIC_ENVIRONMENT === 'test'
        }
      />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="mx-auto grid max-w-6xl gap-8">
          <TimeTrackerLiveCard />
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
                <Plane className="mr-2 h-4 w-4" /> {t('special_locations.PTO')}
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
  )
}
