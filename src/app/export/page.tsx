'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import ExportPreview from '@/components/export-preview'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from '@/context/i18n-context'
import { TooltipProvider } from '@/components/ui/tooltip'

export default function ExportPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { t } = useTranslation()

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
      <div className="min-h-screen bg-muted p-4 sm:p-8 print:bg-white print:p-0">
        <div className="mx-auto max-w-7xl print:mx-0 print:max-w-none">
          <Button
            asChild
            variant="outline"
            className="mb-4 hidden md:inline-flex print:hidden"
          >
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('export_page.backButton')}
            </Link>
          </Button>
          <ExportPreview />
        </div>
      </div>
    </TooltipProvider>
  )
}
