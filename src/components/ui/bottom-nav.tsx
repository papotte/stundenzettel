'use client'

import { FileSpreadsheet, Home } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  {
    href: '/tracker',
    icon: Home,
    labelKey: 'bottomNav.home',
    labelDefault: 'Home',
  },
  {
    href: '/export',
    icon: FileSpreadsheet,
    labelKey: 'bottomNav.export',
    labelDefault: 'Export',
  },
]

export default function BottomNav() {
  const pathname = usePathname()
  const t = useTranslations()

  return (
    <nav
      className="fixed bottom-0 left-0 z-50 w-full border-t border-gray-200 bg-white shadow md:hidden"
      role="navigation"
      aria-label="Bottom navigation"
    >
      <ul className="flex h-16 items-center justify-around">
        {navItems.map(({ href, icon: Icon, labelKey, labelDefault }) => {
          const isActive = pathname === href
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className="flex h-full w-full flex-col items-center justify-center"
                {...(isActive ? { 'aria-current': 'page' } : {})}
              >
                <Icon
                  className={`mb-1 h-6 w-6 ${isActive ? 'text-primary' : 'text-gray-400'}`}
                />
                <span
                  className={`block text-xs ${isActive ? 'font-semibold text-primary' : 'text-gray-500'}`}
                >
                  {t(labelKey, { defaultValue: labelDefault })}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
