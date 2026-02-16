'use client'

import React, {
  ReactNode,
  createContext,
  useEffect,
  useRef,
  useState,
} from 'react'

import { useAuth } from '@/hooks/use-auth'
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
  const [hasValidSubscription, setHasValidSubscription] = useState<
    boolean | null
  >(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [ownerId, setOwnerId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const lastUserId = useRef<string | null>(null)
  const fetchPromiseRef = useRef<Promise<{
    subscription: Subscription | null
    ownerId: string
  }> | null>(null)

  const fetchSubscription = async (userEmail: string) => {
    // If there's already a fetch in progress, return that promise
    if (fetchPromiseRef.current) {
      return fetchPromiseRef.current
    }

    setLoading(true)
    setError(null)

    const promise = subscriptionService
      .getUserSubscription(userEmail)
      .then((result) => {
        const valid =
          !!result.subscription &&
          (result.subscription.status === 'active' ||
            result.subscription.status === 'trialing')
        setSubscription(result.subscription)
        setOwnerId(result.ownerId)
        setHasValidSubscription(valid)
        return result
      })
      .catch((err: Error) => {
        setError(err)
        setHasValidSubscription(false)
        setSubscription(null)
        setOwnerId(null)
        throw err
      })
      .finally(() => {
        setLoading(false)
        fetchPromiseRef.current = null
      })

    fetchPromiseRef.current = promise
    return promise
  }

  const invalidateSubscription = () => {
    if (user?.uid) {
      // Clear the service cache for this user
      subscriptionService.clearCache()
      // Reset state to trigger a refetch
      setHasValidSubscription(null)
      setSubscription(null)
      setOwnerId(null)
      lastUserId.current = null
      // Trigger refetch
      fetchSubscription(user.uid).catch(() => {
        // Error already handled in fetchSubscription
      })
    }
  }

  useEffect(() => {
    if (!user || !user.uid) {
      setHasValidSubscription(false)
      setSubscription(null)
      setOwnerId(null)
      setLoading(false)
      setError(null)
      lastUserId.current = null
      fetchPromiseRef.current = null
      return
    }

    // If user hasn't changed and we already have data, do nothing
    // This prevents unnecessary refetches when subscription state updates
    if (lastUserId.current === user.uid && hasValidSubscription !== null) {
      return
    }

    // User changed or no data yet (hasValidSubscription === null) - fetch subscription
    // Note: hasValidSubscription is checked but not in deps to avoid re-running
    // when subscription state changes after a successful fetch
    lastUserId.current = user.uid
    fetchSubscription(user.email).catch(() => {
      // Error already handled in fetchSubscription
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const contextValue = {
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
