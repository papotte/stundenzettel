import createMiddleware from 'next-intl/middleware'

import { locales } from '@/i18n'

export default createMiddleware({
  // A list of all locales that are supported
  locales,

  // Used when no locale matches
  defaultLocale: 'en',

  // Don't use a locale prefix for the default locale
  localePrefix: 'never',

  // Use the locale detection from our custom service
  localeDetection: false,
})

export const config = {
  // Match only internationalized pathnames
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
