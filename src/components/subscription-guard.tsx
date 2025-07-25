'use client'

import React from 'react'

import TrialBanner from '@/components/trial-banner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import LoadingIcon from '@/components/ui/loading-icon'
import { useTranslation } from '@/context/i18n-context'
import { useAuth } from '@/hooks/use-auth'
import { useSubscriptionStatus } from '@/hooks/use-subscription-status'
import { subscriptionService } from '@/services/subscription-service'

interface SubscriptionGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  showTrialBanner?: boolean // Whether to show trial banner for trial users
}

// Extracted fallback UI for unauthenticated and unsubscribed users
function SubscriptionFallback({
  type,
  t,
}: {
  type: 'login' | 'subscription'
  t: (key: string) => string
}) {
  if (type === 'login') {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>{t('subscription.loginRequiredTitle')}</CardTitle>
            <CardDescription>
              {t('subscription.loginRequiredDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button
              onClick={() => (window.location.href = '/login')}
              className="w-full"
            >
              {t('subscription.loginButton')}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  // type === 'subscription'
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>{t('subscription.requiredTitle')}</CardTitle>
          <CardDescription>
            {t('subscription.requiredDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <Button
            onClick={() => (window.location.href = '/pricing')}
            className="w-full"
          >
            {t('subscription.choosePlanButton')}
          </Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = '/subscription')}
            className="w-full"
          >
            {t('subscription.manageSubscriptionButton')}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SubscriptionGuard({
  children,
  fallback,
  showTrialBanner = true,
}: SubscriptionGuardProps) {
  const { user } = useAuth()
  const { t } = useTranslation()
  const { hasValidSubscription, loading, subscription } =
    useSubscriptionStatus(user)

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <LoadingIcon size="xl" />
          <p className="text-muted-foreground">{t('subscription.checking')}</p>
        </div>
      </div>
    )
  }

  // If user is not authenticated, show login prompt
  if (!user) {
    return <SubscriptionFallback type="login" t={t} />
  }

  // If user has no valid subscription, show subscription prompt
  if (!hasValidSubscription) {
    return fallback || <SubscriptionFallback type="subscription" t={t} />
  }

  // User has valid subscription (active or trialing)
  const isInTrial = subscriptionService.isInTrial(subscription)

  // If user is in trial and showTrialBanner is enabled, show trial banner
  if (isInTrial && showTrialBanner) {
    return (
      <div className="min-h-screen bg-background">
        <TrialBanner subscription={subscription} />
        <div className="relative">{children}</div>
      </div>
    )
  }

  // User has active subscription, render children normally
  return <>{children}</>
}
