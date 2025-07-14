'use client'

import Link from 'next/link'

import TimeWiseIcon from '@/components/time-wise-icon'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/context/i18n-context'

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { t } = useTranslation()
  const navigation = [
    { name: t('landing.nav.features'), href: '/features' },
    { name: t('landing.nav.pricing'), href: '/pricing' },
  ]
  return (
    <div className="bg-background">
      <header className="relative z-50 w-full bg-white/80 backdrop-blur">
        <nav
          className="flex items-center justify-between p-4 lg:px-8"
          aria-label="Global"
        >
          <div className="flex items-center gap-3 lg:flex-1">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="sr-only">{t('appName')}</span>
              <TimeWiseIcon className="h-12 w-auto" />
              <span className="text-lg font-bold text-primary group-hover:underline">
                {t('appName')}
              </span>
            </Link>
          </div>

          <div className="hidden lg:flex lg:gap-x-12">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-semibold leading-6 text-foreground"
              >
                {item.name}
              </Link>
            ))}
          </div>
          <div className="hidden lg:flex lg:flex-1 lg:justify-end">
            <Button asChild>
              <Link href="/login">{t('topNav.login')}</Link>
            </Button>
          </div>
        </nav>
      </header>

      <div className="relative isolate">
        <div
          className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
          aria-hidden="true"
        >
          <div
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#80ff80] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
          />
        </div>
        {children}
        <div
          className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
          aria-hidden="true"
        >
          <div
            className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#80ff80] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
          />
        </div>
      </div>
    </div>
  )
}
