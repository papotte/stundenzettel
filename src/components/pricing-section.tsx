'use client'

import React, { useEffect, useState } from 'react'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useTranslations } from 'next-intl'

import BillingToggle from '@/components/pricing/billing-toggle'
import PricingCard from '@/components/pricing/pricing-card'
import PricingFAQ from '@/components/pricing/pricing-faq'
import LoadingIcon from '@/components/ui/loading-icon'
import { useAuth } from '@/hooks/use-auth'
import { usePricingPlans } from '@/hooks/use-pricing-plans'
import { useToast } from '@/hooks/use-toast'
import { queryKeys } from '@/lib/query-keys'
import type { PricingPlan } from '@/lib/types'
import { getUserId } from '@/lib/utils'
import { paymentService } from '@/services/payment-service'

interface PricingSectionProps {
  variant?: 'landing' | 'standalone'
  showHeader?: boolean
  showFAQ?: boolean
  className?: string
}

export default function PricingSection({
  variant = 'standalone',
  showHeader = true,
  showFAQ = true,
  className = '',
}: PricingSectionProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const t = useTranslations('landing')
  const queryClient = useQueryClient()

  const [isYearly, setIsYearly] = useState(false)
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null)

  const { data: pricingPlans = [], isLoading: isLoadingPlans } =
    usePricingPlans()

  const checkoutMutation = useMutation({
    mutationFn: ({
      userId,
      userEmail,
      priceId,
      successUrl,
      cancelUrl,
      trialEnabled,
      requirePaymentMethod,
    }: {
      userId: string
      userEmail: string
      priceId: string
      successUrl: string
      cancelUrl: string
      trialEnabled: boolean
      requirePaymentMethod?: boolean
    }) =>
      paymentService.createCheckoutSession(
        userId,
        userEmail,
        priceId,
        successUrl,
        cancelUrl,
        trialEnabled,
        requirePaymentMethod,
      ),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.subscription(variables.userId),
      })
      paymentService.redirectToCheckout(_data.url)
    },
    onError: (error) => {
      console.error('Error creating checkout session:', error)
      toast({
        title: t('pricing.errorTitle'),
        description: t('pricing.errorDescription'),
        variant: 'destructive',
      })
      setLoadingPlanId(null)
    },
    onSettled: () => {
      setLoadingPlanId(null)
    },
  })

  // Check for plan selection from URL params (post-login flow)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const planId = urlParams.get('plan')
    if (planId) {
      setTimeout(() => {
        const planElement = document.getElementById(`plan-${planId}`)
        if (planElement) {
          planElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 500)
    }
  }, [])

  const filteredPlans = isYearly
    ? pricingPlans.filter((plan: PricingPlan) => plan.interval === 'year')
    : pricingPlans.filter((plan: PricingPlan) => plan.interval === 'month')

  const handleSubscribe = async (plan: PricingPlan) => {
    if (!user) {
      const returnUrl = encodeURIComponent(
        `${window.location.origin}/pricing?plan=${plan.id}`,
      )
      window.location.href = `/login?returnUrl=${returnUrl}`
      return
    }

    const userId = getUserId(user)
    if (!userId) {
      toast({
        title: t('pricing.errorTitle'),
        description: 'User ID is missing (neither uid nor email found).',
        variant: 'destructive',
      })
      return
    }

    setLoadingPlanId(plan.id)
    checkoutMutation.mutate({
      userId,
      userEmail: user.email,
      priceId: plan.stripePriceId,
      successUrl: `${window.location.origin}/subscription?success=true`,
      cancelUrl: `${window.location.origin}/pricing?canceled=true`,
      trialEnabled: true,
    })
  }

  const handleTeamSubscribe = async (_plan: PricingPlan) => {
    if (!user) {
      const returnUrl = encodeURIComponent(
        `${window.location.origin}/pricing?plan=${_plan.id}`,
      )
      window.location.href = `/login?returnUrl=${returnUrl}`
      return
    }
    window.location.href = '/team?tab=subscription'
  }

  const loading = checkoutMutation.isPending ? loadingPlanId : null

  const containerClasses =
    variant === 'landing' ? 'w-full py-12 md:py-24 lg:py-32' : 'py-24 sm:py-32'

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {showHeader && (
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2
              className={`ext-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4 ${
                variant === 'landing' ? 'md:text-5xl' : ''
              }`}
            >
              {variant === 'landing'
                ? t('pricing.landingTitle')
                : t('pricing.title')}
            </h2>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              {variant === 'landing'
                ? t('pricing.landingDescription')
                : t('pricing.subtitle')}
            </p>
          </div>
        )}

        <BillingToggle isYearly={isYearly} onToggle={setIsYearly} />

        <div className="flex justify-center">
          {isLoadingPlans ? (
            <div className="flex flex-col items-center space-y-4 py-12">
              <LoadingIcon size="xl" />
              <p className="text-muted-foreground">
                {t('pricing.loadingPlans')}
              </p>
            </div>
          ) : (
            <div
              className={`grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-${Math.min(filteredPlans.length, 4)}`}
            >
              {filteredPlans.map((plan: PricingPlan) => (
                <div key={plan.id} id={`plan-${plan.id}`}>
                  <PricingCard
                    plan={plan}
                    loading={loading}
                    onSubscribe={handleSubscribe}
                    onTeamSubscribe={handleTeamSubscribe}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        {showFAQ && <PricingFAQ />}
      </div>
    </div>
  )
}
