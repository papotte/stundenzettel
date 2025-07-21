'use client'

import { useState } from 'react'

import { Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useTranslation } from '@/context/i18n-context'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import type { PricingPlan } from '@/lib/types'
import { getUserId } from '@/lib/utils'
import { paymentService } from '@/services/payment-service'

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
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)

  const handleTryForFree = async () => {
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
      window.location.href = `/login?returnUrl=${returnUrl}`
      return
    }

    setLoading(true)
    try {
      // Use email for mock users, uid for real users
      const userId: string | undefined = getUserId(user)
      if (!userId) {
        throw new Error('User ID is missing (neither uid nor email found)')
      }

      const { url } = await paymentService.createCheckoutSession(
        userId,
        user.email,
        plan.stripePriceId,
        `${window.location.origin}/subscription?success=true&trial=true`,
        `${window.location.origin}/pricing?canceled=true`,
        true, // Enable trials
        false, // Don't require payment method
      )

      await paymentService.redirectToCheckout(url)
    } catch (error) {
      console.error('Error creating free trial session:', error)
      toast({
        title: t('pricing.errorTitle'),
        description: t('pricing.errorDescription'),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={`${className} ${showIcon ? 'gap-2' : ''}`}
      onClick={handleTryForFree}
      disabled={loading}
    >
      {showIcon && <Sparkles className="h-4 w-4" />}
      {loading ? t('pricing.processing') : t('pricing.tryForFree')}
    </Button>
  )
}
