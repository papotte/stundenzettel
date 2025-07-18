'use client'

import { useEffect, useState } from 'react'

import { ArrowLeft, CreditCard, Crown, ExternalLink } from 'lucide-react'
import Link from 'next/link'
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
import { useTranslation } from '@/context/i18n-context'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import type { Subscription } from '@/lib/types'
import { formatAppDate } from '@/lib/utils'
import { paymentService } from '@/services/payment-service'
import { subscriptionService } from '@/services/subscription-service'

export default function SubscriptionPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useTranslation()
  const [pageLoading, setPageLoading] = useState(true)
  const [userSubscription, setUserSubscription] = useState<Subscription | null>(
    null,
  )

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?returnUrl=/subscription')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      const fetchSubscription = async () => {
        try {
          const subscription = await subscriptionService.getUserSubscription(
            user.uid,
          )
          setUserSubscription(subscription)
        } catch (error) {
          console.error('Failed to fetch user subscription', error)
          toast({
            title: t('settings.errorLoadingTitle'),
            description: t('settings.errorLoadingDescription'),
            variant: 'destructive',
          })
        } finally {
          setPageLoading(false)
        }
      }
      fetchSubscription()
    }
  }, [user, t, toast])

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
        title: t('settings.errorPortalTitle'),
        description: t('settings.errorPortalDescription'),
        variant: 'destructive',
      })
    }
  }

  const handleUpgrade = () => {
    window.location.href = '/pricing'
  }

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
    userSubscription?.status === 'active' ||
    userSubscription?.status === 'trialing'

  return (
    <div className="min-h-screen bg-muted p-4 sm:p-8 pb-20 md:pb-8">
      <div className="mx-auto max-w-2xl">
        <Button asChild variant="outline" className="mb-8">
          <Link href="/tracker">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('settings.backToTracker')}
          </Link>
        </Button>

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
                  {t('settings.noSubscription')}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {t('settings.noSubscriptionDescription')}
                </p>
                <Button onClick={handleUpgrade}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {t('settings.upgrade')}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="text-xs font-medium mb-2">
                      {t('settings.currentPlan')}
                    </h4>
                    <h3 className="font-headline text-xl font-semibold leading-none tracking-tight">
                      {userSubscription?.planName ?? t('settings.unknownPlan')}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {userSubscription?.planDescription ??
                        t('settings.unknownPlanDescription')}
                    </p>
                    <Badge variant="default" className="mt-1">
                      {userSubscription?.status === 'active'
                        ? t('settings.active')
                        : t('settings.trialing')}
                    </Badge>
                  </div>
                </div>

                {userSubscription?.cancelAt && (
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">
                        {t('settings.cancellationDate')}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {formatAppDate(userSubscription.cancelAt)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t space-y-3">
                  <Button onClick={handleManageBilling} className="w-full">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {t('settings.manageBilling')}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
