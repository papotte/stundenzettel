'use client'

import React, { ReactNode, createContext } from 'react'

import { useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/hooks/use-auth'
import { queryKeys } from '@/lib/query-keys'
import type { Subscription } from '@/lib/types'
import { subscriptionService } from '@/services/subscription-service'

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

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const {
    data,
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey: queryKeys.subscription(user?.email ?? ''),
    queryFn: () => subscriptionService.getUserSubscription(user!.email),
    enabled: Boolean(user?.uid),
  })

  const subscription = queryError !== null ? null : (data?.subscription ?? null)
  const ownerId = data?.ownerId ?? null
  // When no user, treat as false so guards behave correctly; when user but no/error data, false
  const hasValidSubscription =
    subscription !== null
      ? subscription.status === 'active' || subscription.status === 'trialing'
      : false
  const error = queryError

  const invalidateSubscription = () => {
    if (user?.email) {
      subscriptionService.clearCache()
      void queryClient.invalidateQueries({
        queryKey: queryKeys.subscription(user.email),
      })
    }
  }

  const contextValue: SubscriptionContextType = {
    hasValidSubscription,
    loading,
    error,
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
