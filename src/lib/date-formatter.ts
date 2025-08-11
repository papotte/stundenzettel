import type { Locale } from '@/i18n'
import { format as dateFnsFormat } from 'date-fns'
import { de, enUS, es } from 'date-fns/locale'
import { useLocale } from 'next-intl'

// Map next-intl locales to date-fns locales
const localeMap = {
  en: enUS,
  de: de,
  es: es,
} as const

// Map next-intl format options to date-fns format strings
const formatMap = {
  long: 'PPPP', // Monday, January 1, 2024
  longNoWeekday: 'PPP', // January 1, 2024 (without weekday)
  short: 'P',
  intl: 'yyyy-MM-dd',
  shortTime: 'HH:mm', // 14:30 (24-hour format)
  month: 'MMMM', // January
  monthYear: 'MMMM yyyy', // January 2024
  yearMonth: 'yyyy/M', // 2024/01
  weekday: 'EEE', // Mon
} as const

type FormatKey = keyof typeof formatMap

interface DateTimeOptions {
  weekday?: boolean
}

/**
 * Custom date formatter that uses date-fns for formatting.
 * This replaces next-intl's date formatting to avoid timezone issues.
 */
export function createDateFormatter(locale: Locale) {
  return {
    dateTime: (
      date: Date,
      formatKey: FormatKey,
      options?: DateTimeOptions,
    ): string => {
      return formatDateTime(date, formatKey, locale, options)
    },
  }
}

/**
 * Direct formatter function for use outside of React components.
 */
export function formatDateTime(
  date: Date,
  formatString: FormatKey | string,
  locale: Locale = 'en',
  options?: DateTimeOptions,
): string {
  const dateFnsLocale = localeMap[locale as keyof typeof localeMap]
  if (formatString in formatMap) {
    const formatKey = formatString as FormatKey
    formatString = formatMap[formatKey]
  }

  return dateFnsFormat(date, formatString, {
    locale: dateFnsLocale,
    ...options,
  })
}

/**
 * Drop-in replacement for next-intl's useFormatter hook.
 * Use this instead of useFormatter() to get timezone-safe date formatting.
 */
export function useFormatter() {
  const locale = useLocale() as Locale

  return {
    dateTime: createDateFormatter(locale).dateTime,
  }
}
