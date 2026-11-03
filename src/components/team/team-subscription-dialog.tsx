'use client'

import { useMemo, useState } from 'react'

import { Check, CreditCard, Minus, Plus, Users } from 'lucide-react'
import { useFormatter, useTranslations } from 'next-intl'

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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/hooks/use-auth'
import { usePricingPlans } from '@/hooks/use-pricing-plans'
import { useTeamCheckout } from '@/hooks/use-subscription'
import { useToast } from '@/hooks/use-toast'
import type { PricingPlan, Team } from '@/lib/types'

interface TeamSubscriptionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  team: Team
  currentMembersCount: number
}

export function TeamSubscriptionDialog({
  open,
  onOpenChange,
  team,
  currentMembersCount,
}: TeamSubscriptionDialogProps) {
  const t = useTranslations()
  const format = useFormatter()
  const { toast } = useToast()
  const { user } = useAuth()
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [isYearly, setIsYearly] = useState(false)
  const [seats, setSeats] = useState(Math.max(currentMembersCount, 1))
  const [prevMembersCount, setPrevMembersCount] = useState(currentMembersCount)
  if (prevMembersCount !== currentMembersCount) {
    setPrevMembersCount(currentMembersCount)
    setSeats(Math.max(currentMembersCount, 1))
  }

  const { data: allPlans = [], isLoading: isLoadingPlans } = usePricingPlans({
    enabled: open,
  })
  const pricingPlans = useMemo(
    () => allPlans.filter((plan) => plan.maxUsers),
    [allPlans],
  )
  const teamCheckoutMutation = useTeamCheckout(user)

  // Calculate pricing based on plan type and seat count
  const getSeatPrice = (plan: PricingPlan, seatCount: number) => {
    if (plan.tieredPricing) {
      // Find the appropriate tier for the current seat count
      const tier = plan.tieredPricing.find(
        (t) => seatCount >= t.from && (!t.to || seatCount <= t.to),
      )
      return tier?.price || plan.price
    }
    return plan.price
  }

  const getTotalPrice = () => {
    if (!selectedPlan) return 0
    const seatPrice = getSeatPrice(selectedPlan, seats)
    return seatPrice * seats
  }

  const handleSeatsChange = (newSeats: number) => {
    const minSeats = Math.max(currentMembersCount, 1)
    const maxSeats = selectedPlan?.maxUsers || 50
    setSeats(Math.max(minSeats, Math.min(newSeats, maxSeats)))
  }

  const handleSubscribe = () => {
    if (!selectedPlan || !user) return

    teamCheckoutMutation.mutate(
      {
        teamId: team.id,
        priceId: selectedPlan.stripePriceId,
        quantity: seats,
        successUrl: `${window.location.origin}/team?success=true`,
        cancelUrl: `${window.location.origin}/team?cancelled=true`,
        trialEnabled: selectedPlan.trialEnabled,
        requirePaymentMethod: true,
      },
      {
        onSuccess: () => onOpenChange(false),
        onError: (error) => {
          console.error('Error creating team checkout session:', error)
          toast({
            title: t('common.error'),
            description: t('teams.failedToUpgradeSubscription'),
            variant: 'destructive',
          })
        },
      },
    )
  }

  // Keep the selection valid when plans load or the interval flips.
  const availablePlans = pricingPlans.filter(
    (plan) => plan.interval === (isYearly ? 'year' : 'month'),
  )
  const selectedPlan =
    availablePlans.find((plan) => plan.id === selectedPlanId) ??
    availablePlans[0] ??
    null

  if (isLoadingPlans) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="size-5" />
              {t('teams.createTeamSubscription')}
            </DialogTitle>
            <DialogDescription>
              {t('teams.loadingPricingPlans')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-b-2 border-primary"></div>
              <p className="text-muted-foreground">{t('common.loading')}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="size-5" />
            {t('teams.createTeamSubscription')}
          </DialogTitle>
          <DialogDescription>
            {t('teams.selectPlanAndSeatsDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Billing Frequency Toggle */}
          <div className="flex items-center justify-center space-x-4">
            <Label htmlFor="billing-toggle" className="text-sm font-medium">
              {t('landing.pricing.monthly')}
            </Label>
            <Switch
              id="billing-toggle"
              checked={isYearly}
              onCheckedChange={setIsYearly}
            />
            <Label htmlFor="billing-toggle" className="text-sm font-medium">
              {t('landing.pricing.yearly')}
            </Label>
            <Badge variant="secondary" className="ml-2">
              {t('landing.pricing.save20')}
            </Badge>
          </div>

          {/* Plan Selection */}
          {availablePlans.length > 0 ? (
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                {t('teams.selectPlan')}
              </Label>
              <RadioGroup
                value={selectedPlan?.id || ''}
                onValueChange={(value) => {
                  setSelectedPlanId(value)
                }}
                className="space-y-3"
              >
                {availablePlans.map((plan) => {
                  const seatPrice = getSeatPrice(plan, seats)
                  const totalPrice = seatPrice * seats

                  return (
                    <div
                      key={plan.id}
                      className={`relative cursor-pointer rounded-lg border p-4 transition-colors ${
                        selectedPlan?.id === plan.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <RadioGroupItem
                        value={plan.id}
                        id={plan.id}
                        className="sr-only"
                      />
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="mb-2 flex items-center gap-2">
                            <h3 className="font-medium">{plan.name}</h3>
                            {selectedPlan?.id === plan.id && (
                              <Check className="size-4 text-primary" />
                            )}
                          </div>
                          <p className="mb-3 text-sm text-muted-foreground">
                            {plan.features.slice(0, 3).join(' • ')}
                          </p>
                          <div className="text-sm">
                            <span className="text-muted-foreground">
                              {t('teams.pricePerSeat')}:
                            </span>{' '}
                            <span className="font-medium">
                              {format.number(seatPrice, {
                                currency: plan.currency,
                                style: 'currency',
                              })}
                              /
                              {plan.interval === 'month'
                                ? t('landing.pricing.month')
                                : t('landing.pricing.year')}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold">
                            {format.number(totalPrice, {
                              currency: plan.currency,
                              style: 'currency',
                            })}
                            /
                            {plan.interval === 'month'
                              ? t('landing.pricing.month')
                              : t('landing.pricing.year')}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {t('teams.forSeats', { count: seats })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </RadioGroup>
            </div>
          ) : (
            <div className="py-6 text-center">
              <p className="text-muted-foreground">
                {t('teams.noTeamPlansAvailable')}
              </p>
            </div>
          )}

          {/* Seat Selection */}
          {selectedPlan && (
            <div className="space-y-4">
              <Label htmlFor="seats" className="flex items-center gap-2">
                <Users className="size-4" />
                {t('teams.numberOfSeats')}
              </Label>

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleSeatsChange(seats - 1)}
                  disabled={seats <= Math.max(currentMembersCount, 1)}
                  aria-label="Decrease seats"
                >
                  <Minus className="size-4" />
                </Button>

                <Input
                  id="seats"
                  type="number"
                  value={seats}
                  onChange={(e) =>
                    handleSeatsChange(parseInt(e.target.value) || 1)
                  }
                  min={Math.max(currentMembersCount, 1)}
                  max={selectedPlan.maxUsers || 50}
                  className="text-center"
                />

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleSeatsChange(seats + 1)}
                  disabled={seats >= (selectedPlan.maxUsers || 50)}
                  aria-label="Increase seats"
                >
                  <Plus className="size-4" />
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                {currentMembersCount > 0 && (
                  <p>
                    {t('teams.currentMembers', { count: currentMembersCount })}
                  </p>
                )}
                {selectedPlan.maxUsers && (
                  <p>{t('teams.maxSeats', { max: selectedPlan.maxUsers })}</p>
                )}
              </div>
            </div>
          )}

          {/* Final Pricing Summary */}
          {selectedPlan && (
            <div className="border-t pt-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t('teams.seatsSelected', { count: seats })}
                </span>
                <span className="text-sm">
                  {format.number(getSeatPrice(selectedPlan, seats), {
                    style: 'currency',
                    currency: selectedPlan.currency,
                  })}
                  × {seats}
                </span>
              </div>
              <div className="flex items-center justify-between font-medium">
                <span>{t('teams.totalPerPeriod')}</span>
                <span className="text-lg">
                  {format.number(getTotalPrice(), {
                    style: 'currency',
                    currency: selectedPlan.currency,
                  })}
                  /
                  {selectedPlan.interval === 'month'
                    ? t('landing.pricing.month')
                    : t('landing.pricing.year')}
                </span>
              </div>
              {selectedPlan.trialEnabled && (
                <div className="mt-2 text-sm text-green-600">
                  {t('teams.trialIncluded', {
                    days: selectedPlan.trialDays || 14,
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={teamCheckoutMutation.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSubscribe}
            disabled={teamCheckoutMutation.isPending || !selectedPlan}
          >
            <CreditCard className="mr-2 size-4" />
            {teamCheckoutMutation.isPending
              ? t('common.loading')
              : t('teams.subscribeNow')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
