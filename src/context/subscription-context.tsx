'use client'

import React, { ReactNode, createContext } from 'react'

import { useAuth } from '@/hooks/use-auth'
import {
  useInvalidateSubscription,
  useUserSubscription,
} from '@/hooks/use-subscription'
import type { Subscription } from '@/lib/types'

interface SubscriptionContextType {
  hasValidSubscription: boolean | null
  loading: boolean
  error: Error | null
  subscription: Subscription | null
  ownerId: string | null
  invalidateSubscription: () => void
}

export const SubscriptionContext = createContext<
  SubscriptionContextType | undefined
>(undefined)

/**
 * Thin wrapper over useUserSubscription so existing consumers keep the same
 * context API while server state lives in React Query.
 */
export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth()
  const { data, isLoading, error } = useUserSubscription(user)
  const invalidateSubscription = useInvalidateSubscription(user)

  const subscription = error ? null : (data?.subscription ?? null)
  const ownerId = data?.ownerId ?? null
  const hasValidSubscription =
    subscription !== null
      ? subscription.status === 'active' || subscription.status === 'trialing'
      : false

  const contextValue: SubscriptionContextType = {
    hasValidSubscription,
    loading: isLoading,
    error: error ?? null,
    subscription,
    ownerId,
    invalidateSubscription,
  }

  return (
    <SubscriptionContext.Provider value={contextValue}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export const useSubscriptionContext = () => {
  const context = React.useContext(SubscriptionContext)
  if (context === undefined) {
    throw new Error(
      'useSubscriptionContext must be used within a SubscriptionProvider',
    )
  }
  return context
}
