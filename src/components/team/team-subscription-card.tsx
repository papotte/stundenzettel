'use client'

import { useState, useEffect } from 'react'

import { CreditCard, Users, Check, AlertCircle, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import type { Team, TeamMember, Subscription } from '@/lib/types'

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
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to open subscription management',
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
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upgrade subscription',
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
            Team Subscription
          </CardTitle>
          <CardDescription>
            Subscribe to unlock team features and seat management
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-6">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Active Subscription</h3>
            <p className="text-muted-foreground mb-6">
              Subscribe to unlock team collaboration features
            </p>
            <Button onClick={handleUpgradeSubscription} disabled={isLoading}>
              <Plus className="mr-2 h-4 w-4" />
              {isLoading ? 'Loading...' : 'Subscribe Now'}
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
          Team Subscription
        </CardTitle>
        <CardDescription>
          Manage your team subscription and seat assignments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Subscription Status */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Subscription Status</p>
            <p className="text-sm text-muted-foreground">
              {subscription.planName || 'Team Plan'}
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
              Seat Usage
            </p>
            <span className="text-sm text-muted-foreground">
              {seatsUsed} of {totalSeats} seats used
            </span>
          </div>
          <Progress value={seatUsagePercentage} className="h-2" />
          {seatUsagePercentage > 90 && (
            <p className="text-sm text-amber-600">
              Warning: You're approaching your seat limit
            </p>
          )}
        </div>

        {/* Current Period */}
        <div>
          <p className="font-medium">Current Period</p>
          <p className="text-sm text-muted-foreground">
            Started {new Date(subscription.currentPeriodStart).toLocaleDateString()}
            {subscription.cancelAt && (
              <span className="text-red-600">
                {' '}• Cancels on {new Date(subscription.cancelAt).toLocaleDateString()}
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
            {isLoading ? 'Loading...' : 'Manage Billing'}
          </Button>
          {seatsUsed >= totalSeats && (
            <Button
              onClick={handleUpgradeSubscription}
              disabled={isLoading}
              className="flex-1"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Seats
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}