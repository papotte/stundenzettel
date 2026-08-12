'use client'

import { BarChart2, FileSpreadsheet, Home } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { SubscriptionGuardButton } from '@/components/ui/subscription-guard-button'

const navItems = [
  {
    href: '/tracker',
    icon: Home,
    labelKey: 'nav.bottom.home',
    labelDefault: 'Home',
    requiresSubscription: false,
  },
  {
    href: '/export',
    icon: FileSpreadsheet,
    labelKey: 'nav.bottom.export',
    labelDefault: 'Export',
    requiresSubscription: true,
  },
  {
    href: '/stats',
    icon: BarChart2,
    labelKey: 'nav.bottom.stats',
    labelDefault: 'Stats',
    requiresSubscription: false,
  },
]

function NavLink({
  href,
  Icon,
  isActive,
  label,
}: {
  href: string
  Icon: React.ComponentType<{ className?: string }>
  isActive: boolean
  label: string
}) {
  return (
    <Link
      href={href}
      className="flex h-12 w-auto flex-col items-center justify-center"
      {...(isActive ? { 'aria-current': 'page' } : {})}
    >
      <Icon
        className={`mb-1 size-6 ${isActive ? 'text-primary' : 'text-gray-400'}`}
      />
      <span
        className={`block text-xs ${isActive ? 'font-semibold text-primary' : 'text-gray-500'}`}
      >
        {label}
      </span>
    </Link>
  )
}

export default function BottomNav() {
  const pathname = usePathname()
  const t = useTranslations()
  return (
    <nav
      className="fixed bottom-0 left-0 z-50 w-full border-t border-gray-200 bg-white shadow md:hidden print:hidden"
      role="navigation"
      aria-label="Bottom navigation"
    >
      <ul className="flex h-16 items-center justify-around">
        {navItems.map(
          ({
            href,
            icon: Icon,
            labelKey,
            labelDefault,
            requiresSubscription,
          }) => {
            const isActive = pathname === href
            const label = t(labelKey, { defaultValue: labelDefault })
            return (
              <li key={href} className="flex flex-1 justify-center">
                {requiresSubscription ? (
                  <SubscriptionGuardButton
                    className="rounded-none p-0"
                    variant="nav"
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <NavLink
                      href={href}
                      Icon={Icon}
                      isActive={isActive}
                      label={label}
                    />
                  </SubscriptionGuardButton>
                ) : (
                  <NavLink
                    href={href}
                    Icon={Icon}
                    isActive={isActive}
                    label={label}
                  />
                )}
              </li>
            )
          },
        )}
      </ul>
    </nav>
  )
}
