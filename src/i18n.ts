import { getRequestConfig } from 'next-intl/server'

import { formattingProps } from './lib/i18n/formats'
import { getUserLocale } from './services/locale'

export const locales: [string, ...string[]] = ['en', 'de', 'es']
export const defaultLocale: Locale = 'en'

export type Locale = (typeof locales)[number]

export default getRequestConfig(async () => {
  const locale = await getUserLocale()

  return {
    locale,
    formats: formattingProps,
    messages: {
      common: (await import(`./messages/${locale}/common.json`)).default,
      nav: (await import(`./messages/${locale}/nav.json`)).default,
      landing: (await import(`./messages/${locale}/landing.json`)).default,
      login: (await import(`./messages/${locale}/login.json`)).default,
      tracker: (await import(`./messages/${locale}/tracker.json`)).default,
      export: (await import(`./messages/${locale}/export.json`)).default,
      settings: (await import(`./messages/${locale}/settings.json`)).default,
      teams: (await import(`./messages/${locale}/teams.json`)).default,
      subscription: (await import(`./messages/${locale}/subscription.json`))
        .default,
      special_locations: (
        await import(`./messages/${locale}/special-locations.json`)
      ).default,
      time_entry_card: (
        await import(`./messages/${locale}/time-entry-card.json`)
      ).default,
      time_entry_form: (
        await import(`./messages/${locale}/time-entry-form.json`)
      ).default,
      toasts: (await import(`./messages/${locale}/toasts.json`)).default,
      // We'll add more as we migrate them
    },
  }
})
