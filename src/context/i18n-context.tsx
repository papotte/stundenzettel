'use client'

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react'
import { useAuth } from '@/hooks/use-auth'
import { getUserSettings } from '@/services/user-settings-service'
import { dictionaries } from '@/lib/i18n/dictionaries'
import type { UserSettings } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'

type Language = keyof typeof dictionaries

interface I18nContextType {
  language: Language
  t: (key: string, replacements?: Record<string, string | number>) => string
  setLanguageState: (lang: Language) => void
  loading: boolean
}

const TimeWiseIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M7 9L9 15L12 11L15 15L17 9"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
  </svg>
)

const I18nContext = createContext<I18nContextType | null>(null)

const getNestedValue = (obj: any, key: string) => {
  return key.split('.').reduce((acc, part) => acc && acc[part], obj)
}

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth()
  const [language, setLanguage] = useState<Language>('en')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return

    const fetchLanguage = async () => {
      if (user) {
        const settings = await getUserSettings(user.uid)
        setLanguage(settings.language || 'en')
      } else {
        // Default to browser language or 'en' if no user
        const browserLang = navigator.language.split('-')[0]
        setLanguage(browserLang === 'de' ? 'de' : 'en')
      }
      setLoading(false)
    }

    fetchLanguage()
  }, [user, authLoading])

  const t = useCallback(
    (key: string, replacements?: Record<string, string | number>): string => {
      const dict = dictionaries[language] || dictionaries.en
      let value = getNestedValue(dict, key)

      if (typeof value !== 'string') {
        console.warn(
          `Translation key '${key}' not found for language '${language}'.`,
        )
        return key
      }

      if (replacements) {
        Object.keys(replacements).forEach((placeholder) => {
          value = value.replace(
            `{${placeholder}}`,
            String(replacements[placeholder]),
          )
        })
      }

      return value
    },
    [language],
  )

  const setLanguageState = (lang: Language) => {
    setLanguage(lang)
  }

  const contextValue = {
    language,
    t,
    setLanguageState,
    loading: authLoading || loading,
  }

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <TimeWiseIcon className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>
  )
}

export const useTranslation = () => {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider')
  }
  return context
}
