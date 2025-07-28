import { getRequestConfig } from 'next-intl/server'

export const locales = ['en', 'de'] as const
export type Locale = (typeof locales)[number]

export default getRequestConfig(async ({ locale }) => ({
  messages: {
    common: (await import(`./messages/${locale}/common.json`)).default,
    login: (await import(`./messages/${locale}/login.json`)).default,
    tracker: (await import(`./messages/${locale}/tracker.json`)).default,
    settings: (await import(`./messages/${locale}/settings.json`)).default,
    'special-locations': (await import(`./messages/${locale}/special-locations.json`)).default,
    'time-entry-card': (await import(`./messages/${locale}/time-entry-card.json`)).default,
    toasts: (await import(`./messages/${locale}/toasts.json`)).default,
    // We'll add more as we migrate them
  },
}))