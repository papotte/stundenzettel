'use client'

import LoadingIcon from '@/components/ui/loading-icon'
import { defaultLocale } from '@/i18n'
import { auth as firebaseAuth } from '@/lib/firebase'
import type { AuthenticatedUser } from '@/lib/types'
import { getUserLocale, setUserLocale } from '@/services/locale'
import { getUserSettings, setUserSettings } from '@/services/user-settings-service'

import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth'
import React, { createContext, ReactNode, useEffect, useState, useTransition } from 'react'

interface AuthContextType {
  user: AuthenticatedUser | null
  loading: boolean
  signOut: () => Promise<void>
  loginAsMockUser?: (user: AuthenticatedUser | null) => void
}

const useMocks =
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'test' ||
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'development'
const MOCK_USER_STORAGE_KEY = 'mockUser'

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {
  },
})

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthenticatedUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [_, startTransition] = useTransition()

  const syncLanguage = async (uid?: string) => {
    let targetLanguage = undefined
    if (uid) {
      try {
        // Get user's saved language preference
        const settings = await getUserSettings(uid)
        if (settings.language) {
          targetLanguage = settings.language
        } else {
          // If user has no saved preference, save current cookie to user settings
          const currentLanguage = await getUserLocale()
          const updatedSettings = {
            ...settings,
            language: currentLanguage as 'en' | 'de',
          }
          console.info('Saving current language to user settings:', updatedSettings.language, 'for user:', uid)
          await setUserSettings(uid, updatedSettings)
        }
      } catch (error) {
        console.error('Failed to sync language on login:', error)
      }
    } else {
      targetLanguage = defaultLocale
    }

    if (targetLanguage != undefined) {
      console.info('Changing language to:', targetLanguage, 'for user:', uid || 'guest')
      startTransition(() => {
        setUserLocale(targetLanguage)
      })
    }
  }

  const loginAsMockUser = async (user: AuthenticatedUser | null) => {
    if (user) {
      localStorage.setItem(MOCK_USER_STORAGE_KEY, JSON.stringify(user))
      // Sync language on mock login
      await syncLanguage(user.uid)
    } else {
      localStorage.removeItem(MOCK_USER_STORAGE_KEY)
    }
    setUser(user)
    setLoading(false)
  }

  const signOut = async () => {
    // Sync language on logout
    syncLanguage()

    if (useMocks) {
      loginAsMockUser(null)
    } else if (
      firebaseAuth &&
      typeof firebaseAuth.onAuthStateChanged === 'function'
    ) {
      await firebaseSignOut(firebaseAuth)
    }
  }

  useEffect(() => {
    if (useMocks) {
      try {
        const storedUser = localStorage.getItem(MOCK_USER_STORAGE_KEY)
        if (storedUser) {
          setUser(JSON.parse(storedUser))
        }
      } catch (error) {
        console.error('Failed to parse mock user from localStorage', error)
        localStorage.removeItem(MOCK_USER_STORAGE_KEY)
      }
      setLoading(false)
      return
    }

    // Guard against using a non-initialized auth object
    if (
      !firebaseAuth ||
      typeof firebaseAuth.onAuthStateChanged !== 'function'
    ) {
      console.warn(
        'Firebase Auth is not initialized. Skipping auth state listener.',
      )
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      if (firebaseUser) {
        const user = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email || '',
        }
        setUser(user)

        // Sync language on login
        await syncLanguage(user.uid)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const contextValue = {
    user,
    loading,
    signOut,
    ...(useMocks && { loginAsMockUser }),
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {loading ? (
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="flex flex-col items-center space-y-4">
            <LoadingIcon size="xl"/>
            <p className="text-muted-foreground">Loading TimeWise Tracker...</p>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  )
}
