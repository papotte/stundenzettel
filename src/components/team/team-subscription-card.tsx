'use client'

import { useState } from 'react'

import { AlertCircle, Check, CreditCard, Plus, Users } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useTranslation } from '@/context/i18n-context'
import { useToast } from '@/hooks/use-toast'
import type { Subscription, Team, TeamMember } from '@/lib/types'
import { formatAppDate } from '@/lib/utils'

interface TeamSubscriptionCardProps {
  team: Team
  members: TeamMember[]
  subscription: Subscription | null
  onSubscriptionUpdate: (subscription: Subscription | null) => void
}

export function TeamSubscriptionCard({
  team,
  members,
  subscription,
  onSubscriptionUpdate,
}: TeamSubscriptionCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { t, language } = useTranslation()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'trialing':
        return 'bg-blue-100 text-blue-800'
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800'
      case 'canceled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'trialing':
        return <Check className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const handleManageSubscription = async () => {
    setIsLoading(true)
    try {
      // Redirect to customer portal or pricing page
      if (subscription?.stripeCustomerId) {
        // Create customer portal session
        const response = await fetch('/api/create-customer-portal-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerId: subscription.stripeCustomerId,
            returnUrl: window.location.href,
          }),
        })

        if (response.ok) {
          const { url } = await response.json()
          window.location.href = url
        } else {
          throw new Error('Failed to create portal session')
        }
      } else {
        // Redirect to pricing page for new subscription
        window.location.href = '/pricing'
      }
    } catch {
      toast({
        title: t('teams.error'),
        description: t('teams.failedToOpenSubscriptionManagement'),
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpgradeSubscription = async () => {
    setIsLoading(true)
    try {
      // Create team checkout session
      const response = await fetch('/api/create-team-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: team.ownerId,
          teamId: team.id,
          priceId: 'price_team_monthly', // Default team price ID
          quantity: Math.max(members.length, 1),
          successUrl: `${window.location.origin}/team?success=true`,
          cancelUrl: `${window.location.origin}/team?canceled=true`,
        }),
      })

      if (response.ok) {
        const { url } = await response.json()
        window.location.href = url
      } else {
        throw new Error('Failed to create checkout session')
      }
    } catch {
      toast({
        title: t('teams.error'),
        description: t('teams.failedToUpgradeSubscription'),
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {t('teams.teamSubscription')}
          </CardTitle>
          <CardDescription>
            {t('teams.teamSubscriptionDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-6">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {t('teams.noActiveSubscription')}
            </h3>
            <p className="text-muted-foreground mb-6">
              {t('teams.noActiveSubscriptionDescription')}
            </p>
            <Button onClick={handleUpgradeSubscription} disabled={isLoading}>
              <Plus className="mr-2 h-4 w-4" />
              {isLoading ? t('teams.loading') : t('teams.subscribeNow')}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const seatsUsed = members.length
  const totalSeats = subscription.quantity || 1
  const seatUsagePercentage = (seatsUsed / totalSeats) * 100

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          {t('teams.teamSubscription')}
        </CardTitle>
        <CardDescription>
          {t('teams.teamSubscriptionManageDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Subscription Status */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{t('teams.subscriptionStatus')}</p>
            <p className="text-sm text-muted-foreground">
              {subscription.planName || t('teams.teamPlan')}
            </p>
          </div>
          <Badge className={getStatusColor(subscription.status)}>
            {getStatusIcon(subscription.status)}
            <span className="ml-1 capitalize">{subscription.status}</span>
          </Badge>
        </div>

        {/* Seat Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t('teams.seatUsage')}
            </p>
            <span className="text-sm text-muted-foreground">
              {t('teams.seatsUsed', { used: seatsUsed, total: totalSeats })}
            </span>
          </div>
          <Progress value={seatUsagePercentage} className="h-2" />
          {seatUsagePercentage > 90 && (
            <p className="text-sm text-amber-600">
              {t('teams.seatLimitWarning')}
            </p>
          )}
        </div>

        {/* Current Period */}
        <div>
          <p className="font-medium">{t('teams.currentPeriod')}</p>
          <p className="text-sm text-muted-foreground">
            {t('teams.startedOn', {
              date: formatAppDate(
                new Date(subscription.currentPeriodStart),
                language,
                false,
              ),
            })}
            {subscription.cancelAt && (
              <span className="text-red-600">
                {' '}
                •{' '}
                {t('teams.cancelsOn', {
                  date: formatAppDate(
                    new Date(subscription.cancelAt),
                    language,
                    false,
                  ),
                })}
              </span>
            )}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleManageSubscription}
            disabled={isLoading}
            className="flex-1"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            {isLoading ? t('teams.loading') : t('teams.manageBilling')}
          </Button>
          {seatsUsed >= totalSeats && (
            <Button
              onClick={handleUpgradeSubscription}
              disabled={isLoading}
              className="flex-1"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('teams.addSeats')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
