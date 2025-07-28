'use client'

import { useCallback } from 'react'

import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { getUserSettings, setUserSettings } from '@/services/user-settings-service'

import { useTranslation } from './use-translation-compat'

export function useLanguageManager() {
  const { user } = useAuth()
  const { language } = useTranslation()
  const { toast } = useToast()

  const changeLanguage = useCallback(
    async (newLanguage: 'en' | 'de') => {
      if (!user) {
        console.warn('Cannot change language: user not authenticated')
        return
      }

      if (newLanguage === language) {
        return // No change needed
      }

      try {
        // Get current settings
        const currentSettings = await getUserSettings(user.uid)
        
        // Update language preference
        const updatedSettings = {
          ...currentSettings,
          language: newLanguage,
        }

        // Save to backend
        await setUserSettings(user.uid, updatedSettings)

        // Refresh the page to apply new language
        // In next-intl without routing, we need to reload to pick up new language
        window.location.reload()

      } catch (error) {
        console.error('Failed to change language:', error)
        toast({
          title: 'Error',
          description: 'Failed to change language. Please try again.',
          variant: 'destructive',
        })
      }
    },
    [user, language, toast]
  )

  return {
    currentLanguage: language,
    changeLanguage,
  }
}