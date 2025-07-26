'use client'

import React, { useEffect, useState } from 'react'

import BillingToggle from '@/components/pricing/billing-toggle'
import PricingCard from '@/components/pricing/pricing-card'
import PricingFAQ from '@/components/pricing/pricing-faq'
import { TeamSubscriptionDialog } from '@/components/team/team-subscription-dialog'
import LoadingIcon from '@/components/ui/loading-icon'
import { useTranslation } from '@/context/i18n-context'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import type { PricingPlan, Team } from '@/lib/types'
import { getUserId } from '@/lib/utils'
import { getPricingPlans, paymentService } from '@/services/payment-service'
import { getUserTeam } from '@/services/team-service'

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
  const { t } = useTranslation()
  const [isYearly, setIsYearly] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([])
  const [isLoadingPlans, setIsLoadingPlans] = useState(true)
  const [teamSubscriptionDialog, setTeamSubscriptionDialog] = useState<{
    open: boolean
    plan: PricingPlan | null
  }>({ open: false, plan: null })
  const [team, setTeam] = useState<Team | null>(null)
  const [, setIsLoadingTeam] = useState(false)

  useEffect(() => {
    const loadPricingPlans = async () => {
      try {
        const plans = await getPricingPlans()
        setPricingPlans(plans)
      } catch (error) {
        console.error('Error loading pricing plans:', error)
      } finally {
        setIsLoadingPlans(false)
      }
    }

    loadPricingPlans()
  }, [])

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
      window.location.href = `/login?returnUrl=${returnUrl}`
      return
    }

    setLoading(plan.id)
    try {
      // Use email for mock users, uid for real users
      const userId: string | undefined = getUserId(user)
      if (!userId) {
        toast({
          title: t('pricing.errorTitle'),
          description: 'User ID is missing (neither uid nor email found).',
          variant: 'destructive',
        })
        setLoading(null)
        return
      }

      const { url } = await paymentService.createCheckoutSession(
        userId,
        user.email,
        plan.stripePriceId,
        `${window.location.origin}/subscription?success=true`,
        `${window.location.origin}/pricing?canceled=true`,
        true, // Enable trials by default
      )

      await paymentService.redirectToCheckout(url)
    } catch (error) {
      console.error('Error creating checkout session:', error)
      toast({
        title: t('pricing.errorTitle'),
        description: t('pricing.errorDescription'),
        variant: 'destructive',
      })
    } finally {
      setLoading(null)
    }
  }

  const loadTeamData = async () => {
    if (!user) return

    setIsLoadingTeam(true)
    try {
      const userTeam = await getUserTeam(user.uid)
      setTeam(userTeam)
    } catch (error) {
      console.error('Error loading team data:', error)
    } finally {
      setIsLoadingTeam(false)
    }
  }

  const handleTeamSubscribe = async (plan: PricingPlan) => {
    if (!user) {
      // Redirect to login with return URL to pricing page
      const returnUrl = encodeURIComponent(
        `${window.location.origin}/pricing?plan=${plan.id}`,
      )
      window.location.href = `/login?returnUrl=${returnUrl}`
      return
    }

    // Load team data if not already loaded
    if (!team) {
      await loadTeamData()
    }

    // Open team subscription dialog
    setTeamSubscriptionDialog({ open: true, plan: null })
  }

  const containerClasses =
    variant === 'landing' ? 'w-full py-12 md:py-24 lg:py-32' : 'py-24 sm:py-32'

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        {showHeader && (
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2
              className={`ext-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4 ${
                variant === 'landing' ? 'md:text-5xl' : ''
              }`}
            >
              {variant === 'landing'
                ? t('landing.pricing.headerTitle')
                : t('pricing.title')}
            </h2>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              {variant === 'landing'
                ? t('landing.pricing.headerDescription')
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
        {/* FAQ Section */}
        {showFAQ && <PricingFAQ />}
      </div>

      {/* Team Subscription Dialog */}
      {teamSubscriptionDialog.open && team && (
        <TeamSubscriptionDialog
          open={teamSubscriptionDialog.open}
          onOpenChange={(open) =>
            setTeamSubscriptionDialog({ open, plan: null })
          }
          team={team}
          currentMembersCount={0} // We'll need to get this from team members
          onSubscriptionCreated={() => {
            setTeamSubscriptionDialog({ open: false, plan: null })
          }}
        />
      )}
    </div>
  )
}
