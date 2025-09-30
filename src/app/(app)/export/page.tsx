'use client'

import { useEffect } from 'react'

import { ArrowLeft } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import ExportPreview from '@/components/export-preview'
import SubscriptionGuard from '@/components/subscription-guard'
import { Button } from '@/components/ui/button'
import { TooltipProvider } from '@/components/ui/tooltip'
import { TimeTrackerProvider } from '@/context/time-tracker-context'
import { useAuth } from '@/hooks/use-auth'

export default function ExportPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const t = useTranslations()

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
              <Button
                asChild
                variant="outline"
                className="mb-4 hidden md:inline-flex print:hidden"
              >
                <Link href="/tracker">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t('settings.backToTracker')}
                </Link>
              </Button>
              <ExportPreview />
            </div>
          </div>
        </TimeTrackerProvider>
      </TooltipProvider>
    </SubscriptionGuard>
  )
}
