'use client'

import { useEffect } from 'react'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

import ExportPreview from '@/components/export-preview'
import SubscriptionGuard from '@/components/subscription-guard'
import { TooltipProvider } from '@/components/ui/tooltip'
import { TimeTrackerProvider } from '@/context/time-tracker-context'
import { useAuth } from '@/hooks/use-auth'

export default function ExportPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login?returnUrl=/export')
    }
  }, [user, loading, router])

  if (loading || !user) {
    return null
  }

  return (
    <SubscriptionGuard>
      <TooltipProvider>
        <TimeTrackerProvider user={user}>
          <div className="min-h-screen bg-muted p-4 sm:p-8 pb-20 md:pb-8 print:bg-white print:p-0">
            <div className="mx-auto max-w-7xl print:mx-0 print:max-w-none">
              <ExportPreview />
            </div>
          </div>
        </TimeTrackerProvider>
      </TooltipProvider>
    </SubscriptionGuard>
  )
}
