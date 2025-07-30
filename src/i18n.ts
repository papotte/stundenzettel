import { getRequestConfig } from 'next-intl/server'

export const locales = ['en', 'de'] as const
export type Locale = (typeof locales)[number]

export default getRequestConfig(async ({ locale }) => {
  const resolvedLocale = locale || 'en'
  return {
    locale: resolvedLocale,
    messages: {
      common: (await import(`./messages/${resolvedLocale}/common.json`))
        .default,
      nav: (await import(`./messages/${resolvedLocale}/nav.json`)).default,
      landing: (await import(`./messages/${resolvedLocale}/landing.json`))
        .default,
      login: (await import(`./messages/${resolvedLocale}/login.json`)).default,
      tracker: (await import(`./messages/${resolvedLocale}/tracker.json`))
        .default,
      settings: (await import(`./messages/${resolvedLocale}/settings.json`))
        .default,
      'special-locations': (
        await import(`./messages/${resolvedLocale}/special-locations.json`)
      ).default,
      'time-entry-card': (
        await import(`./messages/${resolvedLocale}/time-entry-card.json`)
      ).default,
      toasts: (await import(`./messages/${resolvedLocale}/toasts.json`))
        .default,
      // We'll add more as we migrate them
    },
  }
})
