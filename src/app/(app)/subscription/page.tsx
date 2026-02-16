'use client'

import { useEffect } from 'react'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  AlertTriangle,
  Clock,
  CreditCard,
  Crown,
  ExternalLink,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useSubscriptionContext } from '@/context/subscription-context'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { useFormatter } from '@/lib/date-formatter'
import { queryKeys } from '@/lib/query-keys'
import { getUserId } from '@/lib/utils'
import { paymentService } from '@/services/payment-service'
import { subscriptionService } from '@/services/subscription-service'

export default function SubscriptionPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const t = useTranslations()
  const format = useFormatter().dateTime
  const queryClient = useQueryClient()
  const {
    subscription,
    ownerId,
    loading: subLoading,
    error,
  } = useSubscriptionContext()
  const pageLoading = subLoading
  const isSubscriptionOwner = user?.uid === ownerId

  const portalMutation = useMutation({
    mutationFn: () => {
      const userId = getUserId(user)
      if (!userId) throw new Error('User ID is missing')
      return paymentService.createCustomerPortalSession(
        userId,
        `${window.location.origin}/subscription`,
      )
    },
    onSuccess: (data) => {
      if (user?.uid) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.subscription(user.uid),
        })
      }
      paymentService.redirectToCustomerPortal(data.url)
    },
    onError: (error) => {
      console.error('Error creating customer portal session:', error)
      toast({
        title: t('subscription.errorPortalTitle'),
        description: t('subscription.errorPortalDescription'),
        variant: 'destructive',
      })
    },
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?returnUrl=/subscription')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (error) {
      toast({
        title: t('settings.errorLoadingTitle'),
        description: t('settings.errorLoadingDescription'),
        variant: 'destructive',
      })
    }
  }, [error, t, toast])

  const handleManageBilling = () => {
    if (!user) return
    portalMutation.mutate()
  }

  const handleUpgrade = () => {
    window.location.href = '/pricing'
  }

  // Trial-specific helpers
  const isInTrial = subscriptionService.isInTrial(subscription)
  const trialEndDate = subscriptionService.getTrialEndDate(subscription)
  const daysRemaining =
    subscriptionService.getDaysRemainingInTrial(subscription)
  const isTrialExpiringSoon = subscriptionService.isTrialExpiringSoon(
    subscription,
    3,
  )

  if (authLoading || pageLoading) {
    return (
      <div className="min-h-screen bg-muted p-4 sm:p-8">
        <div className="mx-auto max-w-2xl">
          <Skeleton className="mb-8 h-10 w-32" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const isSubscribed =
    subscription?.status === 'active' || subscription?.status === 'trialing'

  return (
    <div className="min-h-screen bg-muted p-4 sm:p-8 pb-20 md:pb-8">
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {t('settings.manageSubscription')}
            </CardTitle>
            <CardDescription>
              {t('settings.manageSubscriptionDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isSubscribed ? (
              <div className="text-center py-8">
                <Crown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {t('subscription.noSubscription')}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {t('subscription.noSubscriptionDescription')}
                </p>
                <Button onClick={handleUpgrade}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {t('subscription.upgrade')}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="text-xs font-medium mb-2">
                      {t('subscription.currentPlan')}
                    </h4>
                    <h3 className="font-headline text-xl font-semibold leading-none tracking-tight">
                      {subscription?.planName ?? t('subscription.unknownPlan')}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {subscription?.planDescription ??
                        t('subscription.unknownPlanDescription')}
                    </p>
                    <Badge
                      variant={isInTrial ? 'secondary' : 'default'}
                      className="mt-1"
                    >
                      {subscription?.status === 'active'
                        ? t('subscription.active')
                        : t('subscription.trialing')}
                    </Badge>
                  </div>
                </div>

                {/* Trial Information */}
                {isInTrial && trialEndDate && (
                  <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-medium text-blue-900 dark:text-blue-100">
                          {t('subscription.trialStatus')}
                        </h3>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                          {daysRemaining !== null && daysRemaining > 0
                            ? t('subscription.trialDaysRemaining', {
                                days: daysRemaining,
                              })
                            : t('subscription.trialEndsToday')}
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          {t('subscription.trialEndsOn')}:{' '}
                          {format(trialEndDate, 'long')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Trial Expiration Warning */}
                {isInTrial && isTrialExpiringSoon && (
                  <div className="p-4 border border-orange-200 rounded-lg bg-orange-50 dark:bg-orange-950/20">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-medium text-orange-900 dark:text-orange-100">
                          {t('subscription.trialExpiringSoon')}
                        </h3>
                        <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">
                          {t('subscription.trialExpiringDescription')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cancellation Information */}
                {subscription?.cancelAt && (
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">
                        {t('subscription.cancellationDate')}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {format(subscription.cancelAt, 'long')}
                      </p>
                    </div>
                  </div>
                )}

                {isSubscriptionOwner && (
                  <div className="pt-4 border-t space-y-3">
                    <Button
                      onClick={handleManageBilling}
                      className="w-full"
                      disabled={portalMutation.isPending}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {portalMutation.isPending
                        ? t('common.loading')
                        : isInTrial
                          ? t('subscription.addPaymentMethod')
                          : t('subscription.manageBilling')}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
