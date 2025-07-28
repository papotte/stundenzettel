'use client'

import { NextIntlClientProvider } from 'next-intl'
import { ReactNode, useEffect, useState } from 'react'

import LoadingIcon from '@/components/ui/loading-icon'
import { useAuth } from '@/hooks/use-auth'
import { getUserSettings } from '@/services/user-settings-service'

type Language = 'en' | 'de'

export const NextIntlProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth()
  const [locale, setLocale] = useState<Language>('en')
  const [messages, setMessages] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return

    const fetchLanguageAndMessages = async () => {
      let selectedLocale: Language = 'en'

      if (user) {
        const settings = await getUserSettings(user.uid)
        selectedLocale = (settings.language as Language) || 'en'
      } else {
        // Default to browser language or 'en' if no user
        const browserLang = navigator.language.split('-')[0]
        selectedLocale = browserLang === 'de' ? 'de' : 'en'
      }

      // Load messages for the selected locale
      try {
        const [common, login, tracker, settings] = await Promise.all([
          import(`@/messages/${selectedLocale}/common.json`),
          import(`@/messages/${selectedLocale}/login.json`),
          import(`@/messages/${selectedLocale}/tracker.json`),
          import(`@/messages/${selectedLocale}/settings.json`),
        ])

        const loadedMessages = {
          common: common.default,
          login: login.default,
          tracker: tracker.default,
          settings: settings.default,
          'special-locations': specialLocations.default,
          'time-entry-card': timeEntryCard.default,
          toasts: toasts.default,
        }

        setLocale(selectedLocale)
        setMessages(loadedMessages)
      } catch (error) {
        console.error('Failed to load translation messages:', error)
        // Fallback to English
        const [common, login, tracker, settings, specialLocations, timeEntryCard, toasts] = await Promise.all([
          import(`@/messages/en/common.json`),
          import(`@/messages/en/login.json`),
          import(`@/messages/en/tracker.json`),
          import(`@/messages/en/settings.json`),
          import(`@/messages/en/special-locations.json`),
          import(`@/messages/en/time-entry-card.json`),
          import(`@/messages/en/toasts.json`),
        ])

        const loadedMessages = {
          common: common.default,
          login: login.default,
          tracker: tracker.default,
          settings: settings.default,
          'special-locations': specialLocations.default,
          'time-entry-card': timeEntryCard.default,
          toasts: toasts.default,
        }

        setLocale('en')
        setMessages(loadedMessages)
      }

      setLoading(false)
    }

    fetchLanguageAndMessages()
  }, [user, authLoading])

  if (authLoading || loading || !messages) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <LoadingIcon size="xl" />
        </div>
      </div>
    )
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}