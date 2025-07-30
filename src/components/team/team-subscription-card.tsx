'use client'

import { useState } from 'react'

import {
  AlertCircle,
  Check,
  CreditCard,
  Plus,
  RefreshCw,
  Users,
} from 'lucide-react'
import { useTranslations } from 'next-intl'

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
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import type { Subscription, Team, TeamMember } from '@/lib/types'
import { formatAppDate } from '@/lib/utils'
import { paymentService } from '@/services/payment-service'
import { getTeamSubscription } from '@/services/team-service'

import { SeatAssignmentDialog } from './seat-assignment-dialog'
import { TeamSubscriptionDialog } from './team-subscription-dialog'

interface TeamSubscriptionCardProps {
  team: Team
  members: TeamMember[]
  subscription: Subscription | null
  onSubscriptionUpdate: (subscription: Subscription | null) => void
  onMembersChange?: (members: TeamMember[]) => void
}

export function TeamSubscriptionCard({
  team,
  members,
  subscription,
  onSubscriptionUpdate,
  onMembersChange,
}: TeamSubscriptionCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showSeatAssignmentDialog, setShowSeatAssignmentDialog] =
    useState(false)
  const { toast } = useToast()
  const { t, language } = useTranslation()
  const { user } = useAuth()

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

  const handleRefreshSubscription = async () => {
    setIsRefreshing(true)
    try {
      const updatedSubscription = await getTeamSubscription(team.id)
      onSubscriptionUpdate(updatedSubscription)
      toast({
        title: t('teams.subscription'),
        description: t('teams.subscriptionRefreshed'),
        variant: 'default',
      })
    } catch (error) {
      console.error('Error refreshing subscription:', error)
      toast({
        title: t('teams.error'),
        description: t('teams.failedToRefreshSubscription'),
        variant: 'destructive',
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleManageSubscription = async () => {
    setIsLoading(true)
    try {
      // Redirect to customer portal or pricing page
      if (user && subscription) {
        const { url } = await paymentService.createCustomerPortalSession(
          user.email,
          `${window.location.origin}/subscription`,
        )
        await paymentService.redirectToCustomerPortal(url)
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

  const handleUpgradeSubscription = () => {
    setShowSubscriptionDialog(true)
  }

  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false)

  if (!subscription) {
    return (
      <>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  {t('teams.teamSubscription')}
                </CardTitle>
                <CardDescription>
                  {t('teams.teamSubscriptionDescription')}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshSubscription}
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
                />
              </Button>
            </div>
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
              <Button onClick={handleUpgradeSubscription}>
                <Plus className="mr-2 h-4 w-4" />
                {t('teams.subscribeNow')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Team Subscription Dialog */}
        <TeamSubscriptionDialog
          open={showSubscriptionDialog}
          onOpenChange={setShowSubscriptionDialog}
          team={team}
          currentMembersCount={members.length}
          onSubscriptionCreated={() => {
            setShowSubscriptionDialog(false)
            onSubscriptionUpdate(null) // This will trigger a refresh
          }}
        />
      </>
    )
  }

  const seatsUsed = members.length
  const totalSeats = subscription.quantity || 1
  const seatUsagePercentage = (seatsUsed / totalSeats) * 100

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {t('teams.teamSubscription')}
              </CardTitle>
              <CardDescription>
                {t('teams.teamSubscriptionManageDescription')}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshSubscription}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
              />
            </Button>
          </div>
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
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {t('teams.seatsUsed', { used: seatsUsed, total: totalSeats })}
                </span>
                {onMembersChange && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSeatAssignmentDialog(true)}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    {t('teams.seatAssignment')}
                  </Button>
                )}
              </div>
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
              <Button onClick={handleUpgradeSubscription} className="flex-1">
                <Plus className="mr-2 h-4 w-4" />
                {t('teams.addSeats')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Team Subscription Dialog */}
      <TeamSubscriptionDialog
        open={showSubscriptionDialog}
        onOpenChange={setShowSubscriptionDialog}
        team={team}
        currentMembersCount={members.length}
        onSubscriptionCreated={() => {
          setShowSubscriptionDialog(false)
          onSubscriptionUpdate(null) // This will trigger a refresh
        }}
      />

      {/* Seat Assignment Dialog */}
      {onMembersChange && user && (
        <SeatAssignmentDialog
          open={showSeatAssignmentDialog}
          onOpenChange={setShowSeatAssignmentDialog}
          teamId={team.id}
          members={members}
          subscription={subscription}
          currentUserId={user.uid}
          onMembersChange={onMembersChange}
        />
      )}
    </>
  )
}
