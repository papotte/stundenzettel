'use client'

import { useEffect, useMemo, useState } from 'react'

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
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { db } from '@/lib/firebase'
import { getPricingPlans } from '@/services/payment-service'
import { subscriptionService } from '@/services/subscription-service'

type EligibleStatus = 'active' | 'trialing' | 'past_due'

interface LinkableSubscription {
  stripeSubscriptionId: string
  stripeCustomerId: string
  status: EligibleStatus
  currentPeriodStart: string
  cancelAt?: string
  cancelAtPeriodEnd: boolean
  priceId: string
  quantity?: number
  planName?: string
  planDescription?: string
  updatedAt: string
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

  const [isLoading, setIsLoading] = useState(false)
  const [isLinking, setIsLinking] = useState(false)
  const [subscriptions, setSubscriptions] = useState<LinkableSubscription[]>([])
  const [selectedId, setSelectedId] = useState<string>('')

  const selected = useMemo(
    () => subscriptions.find((s) => s.stripeSubscriptionId === selectedId),
    [subscriptions, selectedId],
  )

  useEffect(() => {
    if (!open || !user?.uid) return

    let cancelled = false
    async function load() {
      setIsLoading(true)
      try {
        if (!user?.uid) {
          throw new Error('Not authenticated')
        }
        // Use SubscriptionService which calls the working /api/subscriptions/:userId endpoint
        const subscription = await subscriptionService.getUserSubscription(
          user.uid,
        )

        // Fetch pricing plans to determine which are team plans
        const pricingPlans = await getPricingPlans()
        const teamPlans = pricingPlans.filter((plan) => plan.maxUsers)
        const teamPriceIds = new Set(
          teamPlans.map((plan) => plan.stripePriceId),
        )

        const linkable: LinkableSubscription[] = []
        if (subscription) {
          const status = subscription.status as EligibleStatus | undefined
          // Only include if status is eligible AND it's a team plan (priceId matches a team plan)
          if (
            (status === 'active' ||
              status === 'trialing' ||
              status === 'past_due') &&
            teamPriceIds.has(subscription.priceId)
          ) {
            linkable.push({
              stripeSubscriptionId: subscription.stripeSubscriptionId,
              stripeCustomerId: subscription.stripeCustomerId,
              status,
              currentPeriodStart: subscription.currentPeriodStart.toISOString(),
              cancelAt: subscription.cancelAt
                ? subscription.cancelAt.toISOString()
                : undefined,
              cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
              priceId: subscription.priceId,
              quantity: subscription.quantity,
              planName: subscription.planName,
              planDescription: subscription.planDescription,
              updatedAt: subscription.updatedAt.toISOString(),
            })
          }
        }

        if (cancelled) return
        setSubscriptions(linkable)
        setSelectedId(linkable[0]?.stripeSubscriptionId || '')
      } catch (error) {
        console.error(error)
        toast({
          title: t('common.error'),
          description:
            error instanceof Error
              ? `${t('teams.failedToLoadLinkableSubscriptions')}: ${error.message}`
              : t('teams.failedToLoadLinkableSubscriptions'),
          variant: 'destructive',
        })
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [open, user, toast, t])

  const handleLink = async () => {
    if (!selectedId || !user) return

    setIsLinking(true)
    try {
      // Get the subscription again to ensure we have the latest data
      const subscription = await subscriptionService.getUserSubscription(
        user.uid,
      )
      if (!subscription || subscription.stripeSubscriptionId !== selectedId) {
        throw new Error('Subscription not found')
      }

      const status = subscription.status as EligibleStatus | undefined
      if (
        status !== 'active' &&
        status !== 'trialing' &&
        status !== 'past_due'
      ) {
        throw new Error('Subscription status is not eligible')
      }

      // Write the subscription data to the team's subscription doc
      const teamSubRef = doc(db, 'teams', teamId, 'subscription', 'current')
      await setDoc(
        teamSubRef,
        {
          stripeSubscriptionId: subscription.stripeSubscriptionId,
          stripeCustomerId: subscription.stripeCustomerId,
          status: subscription.status,
          currentPeriodStart: subscription.currentPeriodStart.toISOString(),
          cancelAt: subscription.cancelAt ?? null,
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

            <RadioGroup value={selectedId} onValueChange={setSelectedId}>
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
