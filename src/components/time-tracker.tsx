'use client'

import React from 'react'

import { TooltipProvider } from '@/components/ui/tooltip'
import { useTranslation } from '@/hooks/use-translation-compat'
import { TimeTrackerProvider } from '@/context/time-tracker-context'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'

import DailyActionsCard from './daily-actions-card'
import DateNavigation from './date-navigation'
import SummaryCard from './summary-card'
import TimeEntriesList from './time-entries-list'
import TimeTrackerHeader from './time-tracker-header'
import TimeTrackerLiveCard from './time-tracker-live-card'

export default function TimeTracker() {
  const { user } = useAuth()
  const { t, language } = useTranslation()
  const { toast } = useToast()

  return (
    <TimeTrackerProvider user={user} toast={toast} t={t} locale={language}>
      <TooltipProvider>
        <TimeTrackerContent />
      </TooltipProvider>
    </TimeTrackerProvider>
  )
}

function TimeTrackerContent() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <TimeTrackerHeader
        showClearData={
          process.env.NEXT_PUBLIC_ENVIRONMENT === 'development' ||
          process.env.NEXT_PUBLIC_ENVIRONMENT === 'test'
        }
      />
      <main className="p-2 sm:p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
        <div className="mx-auto flex flex-col w-full max-w-full sm:max-w-6xl gap-8">
          <TimeTrackerLiveCard />
          <DailyActionsCard />
          <DateNavigation />
          <TimeEntriesList />
          <SummaryCard />
        </div>
      </main>
    </div>
  )
}
