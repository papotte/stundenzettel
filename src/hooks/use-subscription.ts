'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/lib/query-keys'
import { getUserId } from '@/lib/utils'
import { paymentService } from '@/services/payment-service'
import { subscriptionService } from '@/services/subscription-service'

type SubscriptionUser = { uid: string; email?: string | null } | null

function resolveCheckoutUserId(user: SubscriptionUser): string | undefined {
  return getUserId(
    user ? { uid: user.uid, email: user.email ?? undefined } : null,
  )
}

/**
 * React Query wrapper around subscriptionService.getUserSubscription.
 * Existing consumers should keep using useSubscriptionContext, which is a
 * thin wrapper over this hook.
 */
export function useUserSubscription(user: { uid: string } | null) {
  const uid = user?.uid ?? ''
  return useQuery({
    queryKey: queryKeys.subscription(uid),
    queryFn: () => subscriptionService.getUserSubscription(uid),
    enabled: Boolean(uid),
  })
}

export function useInvalidateSubscription(user: { uid: string } | null) {
  const queryClient = useQueryClient()
  const uid = user?.uid ?? ''
  return () => {
    if (!uid) return
    subscriptionService.clearCache()
    void queryClient.invalidateQueries({
      queryKey: queryKeys.subscription(uid),
    })
  }
}

/**
 * Opens the Stripe customer portal for the current user. The portal API
 * treats `userId` as the Stripe customer email, so this passes user.email
 * (do NOT pass getUserId(user), which returns uid first).
 * Invalidates subscription caches before redirecting.
 */
export function useCustomerPortal(user: SubscriptionUser) {
  const queryClient = useQueryClient()
  const uid = user?.uid ?? ''

  return useMutation({
    mutationFn: (returnUrl?: string) => {
      const email = user?.email
      if (!email) throw new Error('User email is missing')
      return paymentService.createCustomerPortalSession(email, returnUrl)
    },
    onSuccess: async (data) => {
      if (uid) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.subscription(uid),
        })
        await queryClient.invalidateQueries({
          queryKey: queryKeys.teamPageData(uid),
        })
      }
      await paymentService.redirectToCustomerPortal(data.url)
    },
  })
}

export interface CheckoutSessionInput {
  priceId: string
  successUrl?: string
  cancelUrl?: string
  trialEnabled?: boolean
  requirePaymentMethod?: boolean
}

/** Creates an individual checkout session, then redirects to Stripe. */
export function useCheckout(user: SubscriptionUser) {
  const queryClient = useQueryClient()
  const uid = user?.uid ?? ''

  return useMutation({
    mutationFn: (input: CheckoutSessionInput) => {
      const userId = resolveCheckoutUserId(user)
      if (!userId) throw new Error('User ID is missing')
      return paymentService.createCheckoutSession(
        userId,
        user?.email ?? '',
        input.priceId,
        input.successUrl,
        input.cancelUrl,
        input.trialEnabled,
        input.requirePaymentMethod,
      )
    },
    onSuccess: async (data) => {
      if (uid) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.subscription(uid),
        })
      }
      await paymentService.redirectToCheckout(data.url)
    },
  })
}

export interface TeamCheckoutSessionInput extends CheckoutSessionInput {
  teamId: string
  quantity: number
}

/**
 * Creates a team checkout session (POST /api/create-team-checkout-session,
 * which accepts userEmail for the Stripe customer), invalidates subscription
 * caches, then redirects to Stripe.
 */
export function useTeamCheckout(user: SubscriptionUser) {
  const queryClient = useQueryClient()
  const uid = user?.uid ?? ''

  return useMutation({
    mutationFn: async (input: TeamCheckoutSessionInput) => {
      const userId = resolveCheckoutUserId(user)
      if (!userId) throw new Error('User ID is missing')
      const response = await fetch('/api/create-team-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userEmail: user?.email ?? '',
          teamId: input.teamId,
          priceId: input.priceId,
          quantity: input.quantity,
          successUrl: input.successUrl,
          cancelUrl: input.cancelUrl,
          trialEnabled: input.trialEnabled,
          requirePaymentMethod: input.requirePaymentMethod,
        }),
      })
      if (!response.ok) {
        throw new Error('Failed to create team checkout session')
      }
      return (await response.json()) as { sessionId: string; url: string }
    },
    onSuccess: async (data, variables) => {
      if (uid) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.subscription(uid),
        })
        await queryClient.invalidateQueries({
          queryKey: queryKeys.teamPageData(uid),
        })
      }
      await queryClient.invalidateQueries({
        queryKey: queryKeys.teamSubscription(variables.teamId),
      })
      await paymentService.redirectToCheckout(data.url)
    },
  })
}
