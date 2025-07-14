'use client'

import { useEffect } from 'react'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import ExportPreview from '@/components/export-preview'
import { Button } from '@/components/ui/button'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useTranslation } from '@/context/i18n-context'
import { TimeTrackerProvider } from '@/context/time-tracker-context'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'

export default function ExportPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { t, language } = useTranslation()
  const { toast } = useToast()

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
  }, [user, loading, router])

  if (loading || !user) {
    return null
  }

  return (
    <TooltipProvider>
      <TimeTrackerProvider user={user} toast={toast} t={t} locale={language}>
        <div className="min-h-screen bg-muted p-4 sm:p-8 pb-20 md:pb-8 print:bg-white print:p-0">
          <div className="mx-auto max-w-7xl print:mx-0 print:max-w-none">
            <Button
              asChild
              variant="outline"
              className="mb-4 hidden md:inline-flex print:hidden"
            >
              <Link href="/tracker">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('export_page.backButton')}
              </Link>
            </Button>
            <ExportPreview />
          </div>
        </div>
      </TimeTrackerProvider>
    </TooltipProvider>
  )
}
