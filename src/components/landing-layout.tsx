'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'

import LanguageSwitcher from '@/components/language-switcher'
import TimeWiseIcon from '@/components/time-wise-icon'
import ColorfulBackground from '@/components/ui/colorful-background'
import UserMenu from '@/components/user-menu'

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const t = useTranslations()
  const navigation = [
    { name: t('nav.top.features'), href: '/features' },
    { name: t('nav.top.pricing'), href: '/pricing' },
  ]
  return (
    <div className="bg-background min-h-dvh flex flex-col">
      <header className="relative z-50 w-full bg-white/80 backdrop-blur">
        <nav
          className="flex items-center justify-between p-4 lg:px-8"
          aria-label="Global"
          data-testid="top-nav"
        >
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="sr-only">{t('common.appName')}</span>
              <TimeWiseIcon className="h-12 w-auto" />
              <span className="text-lg font-bold text-primary group-hover:underline">
                {t('common.appName')}
              </span>
            </Link>
          </div>

          <div className="hidden md:flex md:gap-x-12">
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
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <UserMenu />
          </div>
        </nav>
      </header>
      <ColorfulBackground className="flex-1 flex flex-col">
        {children}
      </ColorfulBackground>
      <footer data-testid="footer">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 sm:flex-row md:px-6">
          <p className="text-xs text-muted-foreground">
            {t('landing.footer.copyright')}
          </p>
          <nav className="flex gap-4 sm:gap-6">
            <Link
              href="/terms"
              className="text-xs hover:underline hover:underline-offset-4"
            >
              {t('landing.footer.terms')}
            </Link>
            <Link
              href="/privacy"
              className="text-xs hover:underline hover:underline-offset-4"
            >
              {t('landing.footer.privacy')}
            </Link>
            <Link
              href="/imprint"
              className="text-xs hover:underline hover:underline-offset-4"
            >
              {t('landing.footer.imprint')}
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
