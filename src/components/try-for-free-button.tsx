'use client'

import { Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { useCheckout } from '@/hooks/use-subscription'
import { useToast } from '@/hooks/use-toast'
import { navigateTo } from '@/lib/navigation'
import type { PricingPlan } from '@/lib/types'
import { getUserId } from '@/lib/utils'

interface TryForFreeButtonProps {
  plan: PricingPlan
  variant?:
    | 'default'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link'
    | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  showIcon?: boolean
}

export default function TryForFreeButton({
  plan,
  variant = 'default',
  size = 'default',
  className = '',
  showIcon = true,
}: TryForFreeButtonProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const t = useTranslations('landing')
  const checkoutMutation = useCheckout(user)

  const handleTryForFree = () => {
    // Double-check that the plan has trials enabled
    if (!plan.trialEnabled) {
      toast({
        title: t('pricing.errorTitle'),
        description: 'This plan does not offer free trials.',
        variant: 'destructive',
      })
      return
    }

    if (!user) {
      // Redirect to login with return URL to pricing page
      const returnUrl = encodeURIComponent(
        `${window.location.origin}/pricing?plan=${plan.id}&trial=true`,
      )
      navigateTo(`/login?returnUrl=${returnUrl}`)
      return
    }

    // Use email for mock users, uid for real users
    if (!getUserId(user)) {
      toast({
        title: t('pricing.errorTitle'),
        description: t('pricing.errorDescription'),
        variant: 'destructive',
      })
      return
    }

    checkoutMutation.mutate(
      {
        priceId: plan.stripePriceId,
        successUrl: `${window.location.origin}/subscription?success=true&trial=true`,
        cancelUrl: `${window.location.origin}/pricing?canceled=true`,
        trialEnabled: true,
        requirePaymentMethod: false,
      },
      {
        onError: (error) => {
          console.error('Error creating free trial session:', error)
          toast({
            title: t('pricing.errorTitle'),
            description: t('pricing.errorDescription'),
            variant: 'destructive',
          })
        },
      },
    )
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={`${className} ${showIcon ? 'gap-2' : ''}`}
      onClick={handleTryForFree}
      disabled={checkoutMutation.isPending}
    >
      {showIcon && <Sparkles className="size-4" />}
      {checkoutMutation.isPending
        ? t('pricing.processing')
        : t('pricing.tryForFree')}
    </Button>
  )
}
