'use client'

import { useEffect, useRef, useTransition } from 'react'

import { useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/hooks/use-auth'
import { useUserSettings } from '@/hooks/use-user-settings'
import { type Locale, defaultLocale, locales } from '@/i18n'
import { userSettingsKeys } from '@/lib/query-keys'
import { getUserLocale, setUserLocale } from '@/services/locale'
import { setUserSettings } from '@/services/user-settings-service'

/**
 * Keeps TanStack Query user-settings cache and next-intl cookie aligned with
 * Firestore (language preference on login; clears per-user cache on logout).
 */
export function UserSettingsQuerySync() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const prevUidRef = useRef<string | undefined>(undefined)
  const [, startTransition] = useTransition()

  const uid = user?.uid ?? ''
  const { data } = useUserSettings()

  useEffect(() => {
    const prev = prevUidRef.current
    if (prev && !user) {
      queryClient.removeQueries({ queryKey: userSettingsKeys.detail(prev) })
    }
    prevUidRef.current = user?.uid
  }, [user, queryClient])

  useEffect(() => {
    if (!uid || !data) return
    let cancelled = false
    const run = async () => {
      try {
        if (data.language) {
          if (!cancelled) {
            startTransition(() => {
              setUserLocale(data.language!)
            })
          }
          return
        }
        const raw = await getUserLocale()
        const coerced = locales.includes(raw as Locale)
          ? (raw as Locale)
          : defaultLocale
        await setUserSettings(uid, { ...data, language: coerced })
        await queryClient.invalidateQueries({
          queryKey: userSettingsKeys.detail(uid),
        })
        if (!cancelled) {
          startTransition(() => {
            setUserLocale(coerced)
          })
        }
      } catch (error) {
        console.error('Failed to sync language on login:', error)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [uid, data, queryClient, startTransition])

  return null
}
