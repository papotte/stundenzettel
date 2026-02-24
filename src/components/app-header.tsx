'use client'

import { BarChart2, FileSpreadsheet } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import TimeWiseIcon from '@/components/time-wise-icon'
import { SubscriptionGuardButton } from '@/components/ui/subscription-guard-button'
import UserMenu from '@/components/user-menu'
import { cn } from '@/lib/utils'

export default function AppHeader() {
  const t = useTranslations()
  const pathname = usePathname()

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
        <nav className="hidden md:flex md:items-center md:gap-2">
          <SubscriptionGuardButton variant="outline">
            <Link
              href="/export"
              className={cn(
                'flex items-center gap-2',
                pathname === '/export' && 'font-semibold text-primary',
              )}
            >
              <FileSpreadsheet className="h-4 w-4" />
              {t('tracker.headerExportLink')}
            </Link>
          </SubscriptionGuardButton>
          <Link
            href="/stats"
            className={cn(
              'flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background hover:bg-accent hover:text-accent-foreground',
              pathname === '/stats' && 'font-semibold text-primary',
            )}
          >
            <BarChart2 className="h-4 w-4" />
            {t('nav.bottom.stats')}
          </Link>
        </nav>
        <UserMenu />
      </div>
    </header>
  )
}
