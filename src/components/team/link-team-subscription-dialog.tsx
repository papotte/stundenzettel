'use client'

import { type ReactNode, useEffect, useMemo, useState } from 'react'

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
import { useAuth } from '@/hooks/use-auth'
import { usePricingPlans } from '@/hooks/use-pricing-plans'
import { useUserSubscription } from '@/hooks/use-subscription'
import { useLinkTeamSubscription } from '@/hooks/use-team'
import { useToast } from '@/hooks/use-toast'
import type { Subscription } from '@/lib/types'

type EligibleStatus = 'active' | 'trialing' | 'past_due'

// Type that narrows Subscription to only allow eligible statuses
type SubscriptionWithEligibleStatus = Omit<Subscription, 'status'> & {
  status: EligibleStatus
}

// Type guard to check if a subscription has an eligible status
function hasEligibleStatus(
  subscription: Subscription,
): subscription is SubscriptionWithEligibleStatus {
  return (
    subscription.status === 'active' ||
    subscription.status === 'trialing' ||
    subscription.status === 'past_due'
  )
}

interface LinkTeamSubscriptionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teamId: string
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
}: LinkTeamSubscriptionDialogProps) {
  const t = useTranslations()
  const { toast } = useToast()
  const { user } = useAuth()

  const {
    data: subscriptionResult,
    isLoading,
    isError,
  } = useUserSubscription(open ? user : null)

  useEffect(() => {
    if (isError) {
      toast({
        title: t('common.error'),
        description: t('teams.failedToLoadLinkableSubscriptions'),
        variant: 'destructive',
      })
    }
  }, [isError, toast, t])
  const { data: pricingPlans = [] } = usePricingPlans({ enabled: open })
  const linkMutation = useLinkTeamSubscription(user?.uid, teamId)

  const subscriptions = useMemo(() => {
    const subscription = subscriptionResult?.subscription
    if (!subscription) return []

    const teamPriceIds = new Set(
      pricingPlans
        .filter((plan) => plan.maxUsers)
        .map((plan) => plan.stripePriceId),
    )

    // Only include if status is eligible AND it's a team plan (priceId matches a team plan)
    const linkable: SubscriptionWithEligibleStatus[] = []
    if (
      hasEligibleStatus(subscription) &&
      teamPriceIds.has(subscription.priceId)
    ) {
      linkable.push(subscription)
    }
    return linkable
  }, [subscriptionResult?.subscription, pricingPlans])

  const [selectedId, setSelectedId] = useState<string>('')

  // Default the selection to the first linkable subscription.
  const effectiveSelectedId =
    selectedId || subscriptions[0]?.stripeSubscriptionId || ''
  const selected = useMemo(
    () =>
      subscriptions.find((s) => s.stripeSubscriptionId === effectiveSelectedId),
    [subscriptions, effectiveSelectedId],
  )

  const handleLink = () => {
    const subscription = subscriptions.find(
      (s) => s.stripeSubscriptionId === effectiveSelectedId,
    )
    if (!subscription || !user) return

    if (!hasEligibleStatus(subscription)) {
      toast({
        title: t('common.error'),
        description: t('teams.failedToLinkSubscription'),
        variant: 'destructive',
      })
      return
    }

    linkMutation.mutate(subscription, {
      onSuccess: () => {
        toast({
          title: t('teams.subscriptionLinked'),
          description: t('teams.subscriptionLinkedDescription'),
          variant: 'default',
        })
        onOpenChange(false)
      },
      onError: (error) => {
        console.error(error)
        toast({
          title: t('common.error'),
          description: t('teams.failedToLinkSubscription'),
          variant: 'destructive',
        })
      },
    })
  }

  let linkDialogBody: ReactNode
  if (isLoading) {
    linkDialogBody = (
      <div className="space-y-3">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    )
  } else if (subscriptions.length === 0) {
    linkDialogBody = (
      <div className="rounded-md border p-4 text-sm text-muted-foreground">
        {t('teams.noLinkableSubscriptions')}
      </div>
    )
  } else {
    linkDialogBody = (
      <div className="space-y-4">
        {selected?.status === 'past_due' && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
            <AlertCircle className="mt-0.5 size-4 text-destructive" />
            <div className="text-destructive">
              {t('teams.subscriptionPastDueWarning')}
            </div>
          </div>
        )}

        <RadioGroup value={effectiveSelectedId} onValueChange={setSelectedId}>
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
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="size-5" />
            {t('teams.linkExistingSubscription')}
          </DialogTitle>
          <DialogDescription>
            {t('teams.linkExistingSubscriptionDescription')}
          </DialogDescription>
        </DialogHeader>
        {linkDialogBody}

        <DialogFooter className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={linkMutation.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleLink}
            disabled={
              linkMutation.isPending || isLoading || subscriptions.length === 0
            }
          >
            {linkMutation.isPending
              ? t('teams.linking')
              : t('teams.linkSubscription')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
