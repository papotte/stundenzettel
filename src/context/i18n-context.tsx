'use client'

import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import LoadingIcon from '@/components/ui/loading-icon'
import { useAuth } from '@/hooks/use-auth'
import { dictionaries } from '@/lib/i18n/dictionaries'
import { getUserSettings } from '@/services/user-settings-service'

type Language = keyof typeof dictionaries

interface I18nContextType {
  language: Language
  t: <T = string>(
    key: string,
    replacements?: Record<string, string | number>,
  ) => T
  setLanguageState: (lang: Language) => void
  loading: boolean
}

const I18nContext = createContext<I18nContextType | null>(null)

function getNestedValue<T = unknown>(
  obj: Record<string, unknown>,
  key: string,
): T {
  return key
    .split('.')
    .reduce<unknown>(
      (acc, part) =>
        acc && typeof acc === 'object'
          ? (acc as Record<string, unknown>)[part]
          : undefined,
      obj,
    ) as T
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
    function <T = string>(
      key: string,
      replacements?: Record<string, string | number>,
    ): T {
      const dict = dictionaries[language] || dictionaries.en
      let value = getNestedValue<T>(dict, key)

      if (typeof value === 'undefined') {
        console.warn(
          `Translation key '${key}' not found for language '${language}'.`,
        )
        return key as T
      }

      if (typeof value === 'string') {
        const stringValue = value as string
        if (replacements) {
          let replaced = stringValue
          Object.keys(replacements).forEach((placeholder) => {
            replaced = replaced.replace(
              new RegExp(`\\{${placeholder}\\}`, 'g'),
              String(replacements[placeholder]),
            )
          })
          value = replaced as T
        }
        return value as T
      }

      // If value is an array or object, just return it
      return value as T
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
          <LoadingIcon size="xl" />
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
