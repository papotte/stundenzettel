'use client'

import { BarChart2, FileSpreadsheet } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import TimeWiseIcon from '@/components/time-wise-icon'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu'
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
      <div className="ml-auto flex items-center gap-2">
        <NavigationMenu
          className="hidden md:block"
          aria-label={t('nav.topLabel')}
        >
          <NavigationMenuList className="gap-1">
            <NavigationMenuItem>
              <SubscriptionGuardButton
                variant="ghost"
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-transparent hover:text-primary',
                  pathname === '/export' && 'font-semibold text-primary',
                )}
              >
                <Link
                  href="/export"
                  className="flex items-center gap-2 [&_svg]:size-4"
                >
                  <FileSpreadsheet />
                  {t('tracker.headerExportLink')}
                </Link>
              </SubscriptionGuardButton>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link
                  href="/stats"
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-transparent hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&_svg]:size-4',
                    pathname === '/stats' && 'font-semibold text-primary',
                  )}
                  aria-current={pathname === '/stats' ? 'page' : undefined}
                >
                  <BarChart2 />
                  {t('nav.bottom.stats')}
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
        <UserMenu />
      </div>
    </header>
  )
}
