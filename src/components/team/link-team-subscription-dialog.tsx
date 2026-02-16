'use client'

import { useMemo, useState } from 'react'

import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { AlertCircle, CreditCard } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Skeleton } from '@/components/ui/skeleton'
import { useSubscriptionContext } from '@/context/subscription-context'
import { useAuth } from '@/hooks/use-auth'
import { usePricingPlans } from '@/hooks/use-pricing-plans'
import { useToast } from '@/hooks/use-toast'
import { db } from '@/lib/firebase'
import type { Subscription } from '@/lib/types'
import { subscriptionService } from '@/services/subscription-service'

type EligibleStatus = 'active' | 'trialing' | 'past_due'

type SubscriptionWithEligibleStatus = Omit<Subscription, 'status'> & {
  status: EligibleStatus
}

function hasEligibleStatus(
  subscription: Subscription,
): subscription is SubscriptionWithEligibleStatus {
  return (
    subscription.status === 'active' ||
    subscription.status === 'trialing' ||
    subscription.status === 'past_due'
  )
}

function toISOString(value: Date | string | null | undefined): string | null {
  if (!value) return null
  if (typeof value === 'string') return value
  if (value instanceof Date) return value.toISOString()
  if (
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString()
  }
  return null
}

interface LinkTeamSubscriptionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teamId: string
  onLinked?: () => void
}

function getStatusBadgeVariant(
  status: EligibleStatus,
): 'default' | 'secondary' | 'destructive' {
  if (status === 'past_due') return 'destructive'
  if (status === 'trialing') return 'secondary'
  return 'default'
}

export function LinkTeamSubscriptionDialog({
  open,
  onOpenChange,
  teamId,
  onLinked,
}: LinkTeamSubscriptionDialogProps) {
  const t = useTranslations()
  const { toast } = useToast()
  const { user } = useAuth()
  const { subscription, loading: subscriptionLoading } =
    useSubscriptionContext()
  const { data: pricingPlans = [], isLoading: plansLoading } = usePricingPlans({
    enabled: open,
  })

  const [isLinking, setIsLinking] = useState(false)
  const [selectedId, setSelectedId] = useState<string>('')

  const subscriptions = useMemo((): SubscriptionWithEligibleStatus[] => {
    if (!subscription || !hasEligibleStatus(subscription)) return []
    const teamPlans = pricingPlans.filter((plan) => plan.maxUsers)
    const teamPriceIds = new Set(teamPlans.map((plan) => plan.stripePriceId))
    if (!teamPriceIds.has(subscription.priceId)) return []
    return [subscription]
  }, [subscription, pricingPlans])

  const isLoading = open && (subscriptionLoading || plansLoading)

  // When subscriptions change, keep selectedId in sync
  const effectiveSelectedId =
    selectedId &&
    subscriptions.some((s) => s.stripeSubscriptionId === selectedId)
      ? selectedId
      : (subscriptions[0]?.stripeSubscriptionId ?? '')

  const selected = useMemo(
    () =>
      subscriptions.find((s) => s.stripeSubscriptionId === effectiveSelectedId),
    [subscriptions, effectiveSelectedId],
  )

  const handleLink = async () => {
    if (!effectiveSelectedId || !user) return

    setIsLinking(true)
    try {
      const result = await subscriptionService.getUserSubscription(user.uid)
      const subscription = result.subscription
      if (
        !subscription ||
        subscription.stripeSubscriptionId !== effectiveSelectedId
      ) {
        throw new Error('Subscription not found')
      }

      if (!hasEligibleStatus(subscription)) {
        throw new Error('Subscription status is not eligible')
      }

      const teamSubRef = doc(db, 'teams', teamId, 'subscription', 'current')
      await setDoc(
        teamSubRef,
        {
          stripeSubscriptionId: subscription.stripeSubscriptionId,
          stripeCustomerId: subscription.stripeCustomerId,
          status: subscription.status,
          currentPeriodStart: toISOString(subscription.currentPeriodStart),
          cancelAt: toISOString(subscription.cancelAt),
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd ?? false,
          priceId: subscription.priceId,
          quantity: subscription.quantity ?? 0,
          updatedAt: serverTimestamp(),
          planName: subscription.planName ?? undefined,
          planDescription: subscription.planDescription ?? undefined,
        },
        { merge: true },
      )

      toast({
        title: t('teams.subscriptionLinked'),
        description: t('teams.subscriptionLinkedDescription'),
        variant: 'default',
      })

      onOpenChange(false)
      onLinked?.()
    } catch (error) {
      console.error(error)
      toast({
        title: t('common.error'),
        description: t('teams.failedToLinkSubscription'),
        variant: 'destructive',
      })
    } finally {
      setIsLinking(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {t('teams.linkExistingSubscription')}
          </DialogTitle>
          <DialogDescription>
            {t('teams.linkExistingSubscriptionDescription')}
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="rounded-md border p-4 text-sm text-muted-foreground">
            {t('teams.noLinkableSubscriptions')}
          </div>
        ) : (
          <div className="space-y-4">
            {selected?.status === 'past_due' && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
                <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
                <div className="text-destructive">
                  {t('teams.subscriptionPastDueWarning')}
                </div>
              </div>
            )}

            <RadioGroup
              value={effectiveSelectedId}
              onValueChange={setSelectedId}
            >
              <div className="space-y-3">
                {subscriptions.map((s) => (
                  <label
                    key={s.stripeSubscriptionId}
                    className="flex cursor-pointer items-start justify-between rounded-lg border p-4 transition-colors hover:border-primary/50"
                    htmlFor={s.stripeSubscriptionId}
                  >
                    <div className="flex items-start gap-3">
                      <RadioGroupItem
                        id={s.stripeSubscriptionId}
                        value={s.stripeSubscriptionId}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium">
                          {s.planName || t('teams.teamPlan')}
                        </div>
                        {s.planDescription && (
                          <div className="text-sm text-muted-foreground">
                            {s.planDescription}
                          </div>
                        )}
                        <div className="mt-1 text-sm text-muted-foreground">
                          {t('teams.seatUsage')}: {s.quantity ?? 1}
                        </div>
                      </div>
                    </div>

                    <Badge variant={getStatusBadgeVariant(s.status)}>
                      {s.status}
                    </Badge>
                  </label>
                ))}
              </div>
            </RadioGroup>
          </div>
        )}

        <DialogFooter className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLinking}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleLink}
            disabled={isLinking || isLoading || subscriptions.length === 0}
          >
            {isLinking ? t('teams.linking') : t('teams.linkSubscription')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
