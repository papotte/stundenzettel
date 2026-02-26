import { defaultLocale, locales } from '@/i18n'

export interface EmailTranslations {
  teamInvitation: {
    subject: string
    heading: string
    body: string
    acceptButton: string
    expiry: string
    ignore: string
  }
  passwordChanged: {
    subject: string
    heading: string
    greeting: string
    greetingFallback: string
    body: string
    warning: string
  }
}

export async function getEmailTranslations(
  locale?: string | null,
): Promise<EmailTranslations> {
  const validLocale =
    locale && locales.includes(locale) ? locale : defaultLocale
  const { default: translations } = await import(
    `../messages/${validLocale}/emails.json`
  )
  return translations as EmailTranslations
}
