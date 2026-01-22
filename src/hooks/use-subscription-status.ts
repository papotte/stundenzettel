import { useEffect, useRef, useState } from 'react'

import { getSubscriptionForUserAction } from '@/app/actions/get-subscription'
import type { Subscription } from '@/lib/types'

const isE2E =
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'test' &&
  typeof process.env.JEST_WORKER_ID === 'undefined'

interface UseSubscriptionStatusResult {
  hasValidSubscription: boolean | null
  loading: boolean
  error: Error | null
  subscription: Subscription | null
}

function toDate(v: Date | string | undefined): Date {
  if (v == null) return new Date(0)
  return v instanceof Date ? v : new Date(v)
}

/** Normalize subscription from server (dates may be ISO strings). */
function normalizeSubscription(raw: Subscription | null): Subscription | null {
  if (!raw) return null
  return {
    ...raw,
    currentPeriodStart: toDate(
      raw.currentPeriodStart as Date | string | undefined,
    ),
    updatedAt: toDate(raw.updatedAt as Date | string | undefined),
    ...(raw.cancelAt != null && {
      cancelAt: toDate(raw.cancelAt as Date | string),
    }),
    ...(raw.trialEnd != null && {
      trialEnd: toDate(raw.trialEnd as Date | string),
    }),
  }
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
    if (lastUserId.current === user.uid && hasValidSubscription !== null) {
      return
    }
    lastUserId.current = user.uid
    setLoading(true)
    setError(null)

    let mounted = true

    const fetchSubscription = (): Promise<{
      hasValidSubscription: boolean
      subscription: Subscription | null
    }> => {
      if (isE2E) {
        return fetch(`/api/subscriptions/${user.uid}`).then(async (res) => {
          const data = res.ok
            ? ((await res.json()) as Subscription | Record<string, never>)
            : {}
          const sub =
            data && typeof data === 'object' && 'status' in data
              ? (data as Subscription)
              : null
          const valid =
            !!sub && (sub.status === 'active' || sub.status === 'trialing')
          return { hasValidSubscription: valid, subscription: sub }
        })
      }
      return getSubscriptionForUserAction(user.uid)
    }

    fetchSubscription()
      .then((result) => {
        if (!mounted) return
        setHasValidSubscription(result.hasValidSubscription)
        setSubscription(normalizeSubscription(result.subscription))
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
