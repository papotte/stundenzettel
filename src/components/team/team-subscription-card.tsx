'use client'

import { useState } from 'react'

import {
  AlertCircle,
  AlertTriangle,
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
import { useFormatter } from '@/lib/date-formatter'
import type { Subscription, Team, TeamMember } from '@/lib/types'
import { paymentService } from '@/services/payment-service'
import { getTeamSubscription } from '@/services/team-service'

import { LinkTeamSubscriptionDialog } from './link-team-subscription-dialog'
import { SeatAssignmentDialog } from './seat-assignment-dialog'
import { TeamSubscriptionDialog } from './team-subscription-dialog'

interface TeamSubscriptionCardProps {
  team: Team
  members: TeamMember[]
  subscription: Subscription | null
  onSubscriptionUpdate: (subscription: Subscription | null) => void
  onMembersChange?: (members: TeamMember[]) => void
  currentUserRole?: 'owner' | 'admin' | 'member'
}

export function TeamSubscriptionCard({
  team,
  members,
  subscription,
  onSubscriptionUpdate,
  onMembersChange,
  currentUserRole,
}: TeamSubscriptionCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showSeatAssignmentDialog, setShowSeatAssignmentDialog] =
    useState(false)
  const { toast } = useToast()
  const t = useTranslations()
  const format = useFormatter()
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
        return <Check className="size-4" />
      default:
        return <AlertCircle className="size-4" />
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
        title: t('common.error'),
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
        title: t('common.error'),
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
  const [showLinkDialog, setShowLinkDialog] = useState(false)

  if (!subscription) {
    return (
      <>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="size-5" />
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
                  className={`size-4 ${isRefreshing ? 'animate-spin' : ''}`}
                />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="py-6 text-center">
              <CreditCard className="mx-auto mb-4 size-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-medium">
                {t('teams.noActiveSubscription')}
              </h3>
              <p className="mb-6 text-muted-foreground">
                {t('teams.noActiveSubscriptionDescription')}
              </p>
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                {(currentUserRole === 'owner' ||
                  currentUserRole === 'admin') && (
                  <Button
                    variant="outline"
                    onClick={() => setShowLinkDialog(true)}
                  >
                    {t('teams.linkExistingSubscription')}
                  </Button>
                )}
                {(currentUserRole === 'owner' ||
                  currentUserRole === 'admin') && (
                  <Button onClick={handleUpgradeSubscription}>
                    <Plus className="mr-2 size-4" />
                    {t('teams.subscribeNow')}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Link Existing Subscription Dialog */}
        <LinkTeamSubscriptionDialog
          open={showLinkDialog}
          onOpenChange={setShowLinkDialog}
          teamId={team.id}
          onLinked={async () => {
            // Refresh subscription immediately since we write directly to Firestore
            const updated = await getTeamSubscription(team.id)
            onSubscriptionUpdate(updated)
          }}
        />

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

  const seatsUsed = members.filter((m) => m.seatAssignment?.isActive).length
  const totalSeats = subscription.quantity || 1
  const seatUsagePercentage = (seatsUsed / totalSeats) * 100
  const usersWithoutSeats = members.filter(
    (m) => !m.seatAssignment?.isActive,
  ).length

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="size-5" />
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
                className={`size-4 ${isRefreshing ? 'animate-spin' : ''}`}
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
              <p className="flex items-center gap-2 font-medium">
                <Users className="size-4" />
                {t('teams.seatUsage')}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {t('teams.seatsUsed', { used: seatsUsed, total: totalSeats })}
                </span>
                {(currentUserRole === 'owner' || currentUserRole === 'admin') &&
                  onMembersChange && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSeatAssignmentDialog(true)}
                    >
                      <Users className="mr-2 size-4" />
                      {t('teams.seatAssignment')}
                    </Button>
                  )}
              </div>
            </div>
            <Progress value={seatUsagePercentage} className="h-2" />
            {usersWithoutSeats > 0 && (
              <p className="flex items-center gap-2 text-sm text-amber-600">
                <AlertTriangle className="size-4" />
                {t('teams.usersWithoutSeats', { count: usersWithoutSeats })}
              </p>
            )}
          </div>

          {/* Current Period */}
          <div>
            <p className="font-medium">{t('teams.currentPeriod')}</p>
            <p className="text-sm text-muted-foreground">
              {t('teams.startedOn', {
                date: format.dateTime(
                  subscription.currentPeriodStart,
                  'longNoWeekday',
                ),
              })}
              {subscription.cancelAt && (
                <span className="text-red-600">
                  {' '}
                  •{' '}
                  {t('teams.cancelsOn', {
                    date: format.dateTime(
                      subscription.cancelAt,
                      'longNoWeekday',
                    ),
                  })}
                </span>
              )}
            </p>
          </div>

          {/* Actions */}
          {(currentUserRole === 'owner' || currentUserRole === 'admin') && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleManageSubscription}
                  disabled={isLoading}
                  className="flex-1"
                >
                  <CreditCard className="mr-2 size-4" />
                  {isLoading
                    ? t('common.loading')
                    : t('subscription.manageBilling')}
                </Button>
              </div>
              {usersWithoutSeats > 0 && (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm">
                  <p className="mb-1 font-medium text-amber-900">
                    {t('teams.updateSeatsTitle')}
                  </p>
                  <p className="text-amber-800">
                    {t('teams.updateSeatsInstructions')}
                  </p>
                </div>
              )}
            </div>
          )}
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
