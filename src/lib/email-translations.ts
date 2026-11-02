import { createTranslator } from 'next-intl'

import { defaultLocale, locales } from '@/i18n'

export async function getEmailTranslator(locale?: string | null) {
  const validLocale =
    locale && locales.includes(locale) ? locale : defaultLocale
  const { default: messages } = await import(
    `../messages/${validLocale}/emails.json`
  )
  return createTranslator({ locale: validLocale, messages })
}
