'use client'

import React, {
  ReactNode,
  createContext,
  useEffect,
  useRef,
  useState,
  useTransition,
} from 'react'

import { useQueryClient } from '@tanstack/react-query'

import { signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth'

import LoadingIcon from '@/components/ui/loading-icon'
import { defaultLocale } from '@/i18n'
import { auth as firebaseAuth } from '@/lib/firebase'
import type { AuthenticatedUser } from '@/lib/types'
import { setUserLocale } from '@/services/locale'

interface AuthContextType {
  user: AuthenticatedUser | null
  loading: boolean
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
})

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthenticatedUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [, startTransition] = useTransition()
  const queryClient = useQueryClient()
  const lastUidRef = useRef<string | null>(null)

  const signOut = async () => {
    startTransition(() => {
      setUserLocale(defaultLocale)
    })

    if (firebaseAuth && typeof firebaseAuth.onAuthStateChanged === 'function') {
      await firebaseSignOut(firebaseAuth)
    }
  }

  useEffect(() => {
    // Guard against using a non-initialized auth object
    if (
      !firebaseAuth ||
      typeof firebaseAuth.onAuthStateChanged !== 'function'
    ) {
      console.warn(
        'Firebase Auth is not initialized. Skipping auth state listener.',
      )
      queueMicrotask(() => setLoading(false))
      return
    }

    const unsubscribe = onAuthStateChanged(
      firebaseAuth,
      async (firebaseUser) => {
        // Drop all user-scoped server state on any session transition
        // (login, logout, account switch) so cached data can never
        // leak across sessions.
        const uid = firebaseUser?.uid ?? null
        if (lastUidRef.current !== uid) {
          lastUidRef.current = uid
          queryClient.clear()
        }

        if (firebaseUser) {
          const user = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName,
            email: firebaseUser.email || '',
          }
          setUser(user)
        } else {
          setUser(null)
        }
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [queryClient])

  const contextValue = {
    user,
    loading,
    signOut,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {loading ? (
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="flex flex-col items-center space-y-4">
            <LoadingIcon size="xl" />
            <p className="text-muted-foreground">Loading TimeWise Tracker...</p>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  )
}
