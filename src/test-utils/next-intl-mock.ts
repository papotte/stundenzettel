// Import the shared formatting configuration
import { formattingProps } from '@/lib/i18n/formats'

// Mock for next-intl to avoid ESM issues in tests
// This file provides all the exports that next-intl provides

// Client-side hooks
const createTranslationFunction = (namespace?: string) => {
  const fn = (key: string) => (namespace ? `${namespace}.${key}` : key)
  return jest.fn(fn)
}

export const useTranslations = jest.fn((namespace?: string) => {
  return createTranslationFunction(namespace)
})

export const useMessages = jest.fn(() => ({
  common: {},
  nav: {},
  landing: {
    features: {
      list: {},
    },
    faqs: {},
  },
  login: {},
  tracker: {},
  export: {},
  settings: {},
  teams: {},
  special_locations: {},
  time_entry_card: {},
  time_entry_form: {},
  toasts: {},
}))

export const useLocale = jest.fn(() => 'en')

// Create a real formatter using dynamic import to avoid ESM issues
let realFormatter: any = null

const getRealFormatter = async () => {
  if (!realFormatter) {
    const { createFormatter } = await import('use-intl')
    realFormatter = createFormatter({
      locale: 'en',
      formats: formattingProps,
    })
  }
  return realFormatter
}

// Fallback formatter for synchronous operations
const fallbackFormatter = {
  dateTime: (value: Date, formatOrOptions?: any, overrides?: any) => {
    // Handle case: dateTime(date, 'long', { weekday: undefined })
    if (typeof formatOrOptions === 'string' && typeof overrides === 'object') {
      const formatName = formatOrOptions
      if (formattingProps.dateTime && formatName in formattingProps.dateTime) {
        const formatOptions = formattingProps.dateTime[
          formatName
        ] as Intl.DateTimeFormatOptions

        // Merge format options with overrides, handling undefined values
        const mergedOptions: Intl.DateTimeFormatOptions = { ...formatOptions }
        for (const [key, value] of Object.entries(overrides)) {
          if (value === undefined) {
            // Remove the property if value is undefined
            delete (mergedOptions as any)[key]
          } else {
            ;(mergedOptions as any)[key] = value
          }
        }

        return value.toLocaleDateString('en', {
          ...mergedOptions,
          timeZone: 'UTC',
        })
      }
    }

    // Handle case: dateTime(date, 'shortTime')
    if (
      typeof formatOrOptions === 'string' &&
      formattingProps.dateTime &&
      formatOrOptions in formattingProps.dateTime
    ) {
      const formatOptions = formattingProps.dateTime[
        formatOrOptions
      ] as Intl.DateTimeFormatOptions

      // For shortTime, we want to show only the time in 24-hour format
      if (formatOrOptions === 'shortTime') {
        return value.toLocaleTimeString('en', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: 'UTC',
        })
      }

      // For other formats, use the configured options
      return value.toLocaleDateString('en', {
        ...formatOptions,
        timeZone: 'UTC',
      })
    }

    // Handle case: dateTime(date, { format: 'long', weekday: undefined })
    if (
      typeof formatOrOptions === 'object' &&
      formatOrOptions !== null &&
      !Array.isArray(formatOrOptions)
    ) {
      const formatName = (formatOrOptions as any).format || 'long'
      const overrides = { ...formatOrOptions }
      delete (overrides as any).format

      if (formattingProps.dateTime && formatName in formattingProps.dateTime) {
        const formatOptions = formattingProps.dateTime[
          formatName
        ] as Intl.DateTimeFormatOptions

        // Merge format options with overrides, handling undefined values
        const mergedOptions: Intl.DateTimeFormatOptions = { ...formatOptions }
        for (const [key, value] of Object.entries(overrides)) {
          if (value === undefined) {
            delete (mergedOptions as any)[key]
          } else {
            ;(mergedOptions as any)[key] = value
          }
        }

        return value.toLocaleDateString('en', {
          ...mergedOptions,
          timeZone: 'UTC',
        })
      }
    }

    // Fallback
    return value.toLocaleDateString('en', {
      ...formatOrOptions,
      timeZone: 'UTC',
    })
  },
  number: (value: number, options?: any) => {
    return value.toLocaleString('en', options)
  },
  relativeTime: (value: Date) => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - value.getTime()) / 1000)

    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  },
}

const formatterFunctions = {
  dateTime: jest.fn((value: Date, formatOrOptions?: any, overrides?: any) => {
    return fallbackFormatter.dateTime(value, formatOrOptions, overrides)
  }),
  number: jest.fn((value: number, options?: any) => {
    return fallbackFormatter.number(value, options)
  }),
  relativeTime: jest.fn((value: Date) => {
    return fallbackFormatter.relativeTime(value)
  }),
}

export const useFormatter = jest.fn(() => formatterFunctions)

// Client-side provider
export const NextIntlClientProvider = ({
  children,
}: {
  children: React.ReactNode
}) => children

// Server-side functions
export const getTranslations = jest.fn((namespace: string) => {
  return jest.fn((key: string) => `${namespace}.${key}`)
})

export const getLocale = jest.fn(() => 'en')
export const getMessages = jest.fn(() => ({}))
export const getNow = jest.fn(() => new Date())
export const getTimeZone = jest.fn(() => 'UTC')
export const getRequestConfig = jest.fn(() => ({
  locale: 'en',
  messages: {},
  formats: {},
}))
export const setRequestLocale = jest.fn()

// Default export for getRequestConfig
export default getRequestConfig
