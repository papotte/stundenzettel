import React from 'react'

import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useTimeTrackerContext } from '@/context/time-tracker-context'

import TimeEntryForm from './time-entry-form'

const DateNavigation: React.FC = () => {
  const {
    selectedDate,
    setSelectedDate,
    handlePreviousDay,
    handleNextDay,
    isFormOpen,
    setIsFormOpen,
    editingEntry,
    handleSaveEntry,
    userSettings,
    openNewEntryForm,
    formattedSelectedDate,
  } = useTimeTrackerContext()
  const t = useTranslations()

  return (
    <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <h2 className="font-headline text-2xl font-bold">
        {t('tracker.timeEntriesTitle')}
      </h2>
      <div className="flex flex-wrap w-full items-center gap-2 sm:w-auto">
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
                {formattedSelectedDate}
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
              <Plus className="mr-2 h-4 w-4" /> {t('tracker.addEntryButton')}
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
  )
}

export default DateNavigation
