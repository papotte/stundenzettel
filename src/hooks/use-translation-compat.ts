'use client'

import { useLocale, useTranslations } from 'next-intl'

import type { Locale } from '@/i18n'

// Compatibility hook that matches the existing useTranslation interface
export function useTranslation() {
  const locale = useLocale() as Locale
  const commonT = useTranslations('common')
  const loginT = useTranslations('login')
  const trackerT = useTranslations('tracker')
  const settingsT = useTranslations('settings')

  // Map of namespaces to their translation functions
  const translationMap = {
    common: commonT,
    login: loginT,
    tracker: trackerT,
    settings: settingsT,
  }

  // Compatibility function that mimics the existing t() interface
  const t = (
    key: string,
    replacements?: Record<string, string | number>,
  ): string => {
    // Parse the namespace from the key (e.g., "settings.errorLoadingTitle")
    const parts = key.split('.')
    const namespace = parts[0] as keyof typeof translationMap
    const keyPath = parts.slice(1).join('.')

    // If no namespace is found, try common namespace for backward compatibility
    const translationFunction =
      translationMap[namespace] || translationMap.common

    try {
      // Use next-intl's translation function with replacements
      return translationFunction(keyPath, replacements)
    } catch (error) {
      console.warn(`Translation key '${key}' not found for locale '${locale}'.`)
      return key
    }
  }

  // Mock setLanguageState function for compatibility
  // In next-intl, language changes are handled by navigation/URL changes
  const setLanguageState = (lang: Locale) => {
    // For now, we'll keep this as a no-op to maintain compatibility
    // In a full migration, this would be replaced with router navigation
    console.log(`Language change requested to: ${lang}`)
  }

  return {
    language: locale,
    t,
    setLanguageState,
    loading: false, // next-intl handles loading differently
  }
}