'use client'

import { FileSpreadsheet } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

import TimeWiseIcon from '@/components/time-wise-icon'
import { SubscriptionGuardButton } from '@/components/ui/subscription-guard-button'
import UserMenu from '@/components/user-menu'

export default function AppHeader() {
  const t = useTranslations()

  return (
    <header
      className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-white px-4 md:px-6"
      role="banner"
    >
      <Link
        href="/tracker"
        className="flex items-center gap-2 hover:opacity-90"
        aria-label={t('common.home')}
      >
        <TimeWiseIcon className="h-6 w-6 text-primary" />
        <h1 className="font-headline text-xl font-bold tracking-tight">
          {t('common.appName')}
        </h1>
      </Link>
      <div
        className="ml-auto flex items-center gap-2"
        role="navigation"
        aria-label="Top navigation"
      >
        <SubscriptionGuardButton variant="outline" className="hidden md:flex">
          <Link href="/export" className="flex">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            {t('tracker.headerExportLink')}
          </Link>
        </SubscriptionGuardButton>
        <UserMenu />
      </div>
    </header>
  )
}
