'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import { Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { queryKeys } from '@/lib/query-keys'
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
  const t = useTranslations('landing')
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => {
      const userId = getUserId(user!)
      if (!userId) throw new Error('User ID is missing')
      return paymentService.createCheckoutSession(
        userId,
        user!.email,
        plan.stripePriceId,
        `${window.location.origin}/subscription?success=true&trial=true`,
        `${window.location.origin}/pricing?canceled=true`,
        true,
        false,
      )
    },
    onSuccess: (data) => {
      const userId = user ? getUserId(user) : null
      if (userId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.subscription(userId),
        })
      }
      paymentService.redirectToCheckout(data.url)
    },
    onError: (error) => {
      console.error('Error creating free trial session:', error)
      toast({
        title: t('pricing.errorTitle'),
        description: t('pricing.errorDescription'),
        variant: 'destructive',
      })
    },
  })

  const handleTryForFree = () => {
    if (!plan.trialEnabled) {
      toast({
        title: t('pricing.errorTitle'),
        description: 'This plan does not offer free trials.',
        variant: 'destructive',
      })
      return
    }

    if (!user) {
      const returnUrl = encodeURIComponent(
        `${window.location.origin}/pricing?plan=${plan.id}&trial=true`,
      )
      window.location.href = `/login?returnUrl=${returnUrl}`
      return
    }

    mutation.mutate()
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={`${className} ${showIcon ? 'gap-2' : ''}`}
      onClick={handleTryForFree}
      disabled={mutation.isPending}
    >
      {showIcon && <Sparkles className="h-4 w-4" />}
      {mutation.isPending ? t('pricing.processing') : t('pricing.tryForFree')}
    </Button>
  )
}
