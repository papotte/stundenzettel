import { useEffect, useRef, useState } from 'react'

import type { Subscription } from '@/lib/types'
import { subscriptionService } from '@/services/subscription-service'

interface UseSubscriptionStatusResult {
  hasValidSubscription: boolean | null
  loading: boolean
  error: Error | null
  subscription: Subscription | null
}

export function useSubscriptionStatus(
  user?: { uid: string } | null,
): UseSubscriptionStatusResult {
  const [hasValidSubscription, setHasValidSubscription] = useState<
    boolean | null
  >(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const lastUserId = useRef<string | null>(null)

  useEffect(() => {
    if (!user || !user.uid) {
      setHasValidSubscription(false)
      setSubscription(null)
      setLoading(false)
      setError(null)
      lastUserId.current = null
      return
    }
    // If user hasn't changed, do nothing
    if (lastUserId.current === user.uid && hasValidSubscription !== null) {
      return
    }
    lastUserId.current = user.uid
    setLoading(true)
    setError(null)

    let mounted = true
    subscriptionService
      .getUserSubscription(user.uid)
      .then((sub: Subscription | null) => {
        if (!mounted) return
        const valid =
          !!sub && (sub.status === 'active' || sub.status === 'trialing')
        setSubscription(sub)
        setHasValidSubscription(valid)
      })
      .catch((err: Error) => {
        if (!mounted) return
        setError(err)
        setHasValidSubscription(false)
        setSubscription(null)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [user, hasValidSubscription])

  return { hasValidSubscription, loading, error, subscription }
}

export function __clearSubscriptionCacheForTests() {
  subscriptionService.clearCache()
}
