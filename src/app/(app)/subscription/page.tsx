'use client'

import { useEffect } from 'react'

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
import { paymentService } from '@/services/payment-service'
import { subscriptionService } from '@/services/subscription-service'

export default function SubscriptionPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const t = useTranslations()
  const format = useFormatter().dateTime
  const {
    subscription,
    ownerId,
    loading: subLoading,
    error,
  } = useSubscriptionContext()
  const pageLoading = subLoading
  const isSubscriptionOwner = user?.uid === ownerId

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

  const handleManageBilling = async () => {
    if (!user) return

    try {
      const { url } = await paymentService.createCustomerPortalSession(
        user.email,
        `${window.location.origin}/subscription`,
      )
      await paymentService.redirectToCustomerPortal(url)
    } catch (error) {
      console.error('Error creating customer portal session:', error)
      toast({
        title: t('subscription.errorPortalTitle'),
        description: t('subscription.errorPortalDescription'),
        variant: 'destructive',
      })
    }
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
    <div className="min-h-screen bg-muted p-4 pb-20 sm:p-8 md:pb-8">
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="size-5" />
              {t('settings.manageSubscription')}
            </CardTitle>
            <CardDescription>
              {t('settings.manageSubscriptionDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isSubscribed ? (
              <div className="py-8 text-center">
                <Crown className="mx-auto mb-4 size-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-medium">
                  {t('subscription.noSubscription')}
                </h3>
                <p className="mb-4 text-muted-foreground">
                  {t('subscription.noSubscriptionDescription')}
                </p>
                <Button onClick={handleUpgrade}>
                  <ExternalLink className="mr-2 size-4" />
                  {t('subscription.upgrade')}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <h4 className="mb-2 text-xs font-medium">
                      {t('subscription.currentPlan')}
                    </h4>
                    <h3 className="font-headline text-xl leading-none font-semibold tracking-tight">
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
                  <div className="rounded-lg border bg-blue-50 p-4 dark:bg-blue-950/20">
                    <div className="flex items-start gap-3">
                      <Clock className="mt-0.5 size-5 text-blue-600" />
                      <div className="flex-1">
                        <h3 className="font-medium text-blue-900 dark:text-blue-100">
                          {t('subscription.trialStatus')}
                        </h3>
                        <p className="mb-2 text-sm text-blue-700 dark:text-blue-300">
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
                  <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:bg-orange-950/20">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="mt-0.5 size-5 text-orange-600" />
                      <div className="flex-1">
                        <h3 className="font-medium text-orange-900 dark:text-orange-100">
                          {t('subscription.trialExpiringSoon')}
                        </h3>
                        <p className="mb-3 text-sm text-orange-700 dark:text-orange-300">
                          {t('subscription.trialExpiringDescription')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cancellation Information */}
                {subscription?.cancelAt && (
                  <div className="flex items-center justify-between rounded-lg border p-4">
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
                  <div className="space-y-3 border-t pt-4">
                    <Button onClick={handleManageBilling} className="w-full">
                      <ExternalLink className="mr-2 size-4" />
                      {isInTrial
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
