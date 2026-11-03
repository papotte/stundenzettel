'use client'

import React, { useEffect, useState } from 'react'

import { useTranslations } from 'next-intl'

import BillingToggle from '@/components/pricing/billing-toggle'
import PricingCard from '@/components/pricing/pricing-card'
import PricingFAQ from '@/components/pricing/pricing-faq'
import LoadingIcon from '@/components/ui/loading-icon'
import { useAuth } from '@/hooks/use-auth'
import { usePricingPlans } from '@/hooks/use-pricing-plans'
import { useCheckout } from '@/hooks/use-subscription'
import { useToast } from '@/hooks/use-toast'
import { navigateTo } from '@/lib/navigation'
import type { PricingPlan } from '@/lib/types'
import { getUserId } from '@/lib/utils'

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

  const [isYearly, setIsYearly] = useState(false)
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null)

  const { data: pricingPlans = [], isLoading: isLoadingPlans } =
    usePricingPlans()
  const checkoutMutation = useCheckout(user)

  // Check for plan selection from URL params (post-login flow)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const planId = urlParams.get('plan')
    if (planId) {
      // Auto-scroll to the selected plan
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
      // Redirect to login with return URL to pricing page
      const returnUrl = encodeURIComponent(
        `${window.location.origin}/pricing?plan=${plan.id}`,
      )
      navigateTo(`/login?returnUrl=${returnUrl}`)
      return
    }

    if (!getUserId(user)) {
      toast({
        title: t('pricing.errorTitle'),
        description: t('pricing.errorDescription'),
        variant: 'destructive',
      })
      return
    }

    setLoadingPlanId(plan.id)
    checkoutMutation.mutate(
      {
        priceId: plan.stripePriceId,
        successUrl: `${window.location.origin}/subscription?success=true`,
        cancelUrl: `${window.location.origin}/pricing?canceled=true`,
        trialEnabled: true,
      },
      {
        onError: (error) => {
          console.error('Error creating checkout session:', error)
          toast({
            title: t('pricing.errorTitle'),
            description: t('pricing.errorDescription'),
            variant: 'destructive',
          })
        },
        onSettled: () => setLoadingPlanId(null),
      },
    )
  }
  const handleTeamSubscribe = async (plan: PricingPlan) => {
    if (!user) {
      // Redirect to login with return URL to pricing page
      const returnUrl = encodeURIComponent(
        `${window.location.origin}/pricing?plan=${plan.id}`,
      )
      navigateTo(`/login?returnUrl=${returnUrl}`)
      return
    }

    // Redirect to team page for team plans
    navigateTo('/team?tab=subscription')
  }

  const containerClasses =
    variant === 'landing' ? 'w-full py-12 md:py-24 lg:py-32' : 'py-24 sm:py-32'

  const loading = checkoutMutation.isPending ? loadingPlanId : null

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        {showHeader && (
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2
              className={`mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl ${
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

        {/* Billing Toggle */}
        <BillingToggle isYearly={isYearly} onToggle={setIsYearly} />

        {/* Pricing Cards */}
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
              className={`grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-${Math.min(filteredPlans.length, 4)}`}
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
        {/* FAQ Section */}
        {showFAQ && <PricingFAQ />}
      </div>
    </div>
  )
}
