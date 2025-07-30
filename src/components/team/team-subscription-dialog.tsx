'use client'

import { useCallback, useEffect, useState } from 'react'

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
import { useToast } from '@/hooks/use-toast'
import type { PricingPlan, Team } from '@/lib/types'
import { getUserId } from '@/lib/utils'
import { getPricingPlans } from '@/services/payment-service'

interface TeamSubscriptionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  team: Team
  currentMembersCount: number
  onSubscriptionCreated?: () => void
}

export function TeamSubscriptionDialog({
  open,
  onOpenChange,
  team,
  currentMembersCount,
  onSubscriptionCreated,
}: TeamSubscriptionDialogProps) {
  const t = useTranslations()
  const format = useFormatter()
  const { toast } = useToast()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPlans, setIsLoadingPlans] = useState(false)
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null)
  const [isYearly, setIsYearly] = useState(false)
  const [seats, setSeats] = useState(Math.max(currentMembersCount, 1))

  const loadPricingPlans = useCallback(async () => {
    setIsLoadingPlans(true)
    try {
      const plans = await getPricingPlans()
      const teamPlans = plans.filter((plan) => plan.maxUsers)
      setPricingPlans(teamPlans)
    } catch (error) {
      console.error('Error loading pricing plans:', error)
      toast({
        title: t('teams.error'),
        description: t('teams.failedToLoadPricingPlans'),
        variant: 'destructive',
      })
    } finally {
      setIsLoadingPlans(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load pricing plans when dialog opens
  useEffect(() => {
    if (open) {
      loadPricingPlans()
    }
  }, [open, loadPricingPlans])

  // Update selected plan when billing frequency changes
  useEffect(() => {
    if (pricingPlans.length > 0) {
      const teamPlans = pricingPlans.filter(
        (plan) =>
          plan.maxUsers && plan.interval === (isYearly ? 'year' : 'month'),
      )
      if (teamPlans.length > 0) {
        setSelectedPlan(teamPlans[0])
      }
    }
  }, [pricingPlans, isYearly])

  // Reset seats when current members count changes
  useEffect(() => {
    setSeats(Math.max(currentMembersCount, 1))
  }, [currentMembersCount])

  // Calculate pricing based on plan type and seat count
  const getSeatPrice = (plan: PricingPlan, seatCount: number) => {
    if (plan.tieredPricing) {
      // Find the appropriate tier for the current seat count
      const tier = plan.tieredPricing.tiers.find(
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

  const handleSubscribe = async () => {
    if (!selectedPlan || !user) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/create-team-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: getUserId(user),
          userEmail: user.email || '',
          teamId: team.id,
          priceId: selectedPlan.stripePriceId,
          quantity: seats,
          successUrl: `${window.location.origin}/team?success=true`,
          cancelUrl: `${window.location.origin}/team?canceled=true`,
          trialEnabled: selectedPlan.trialEnabled,
          requirePaymentMethod: true,
        }),
      })

      if (response.ok) {
        const { url } = await response.json()
        onOpenChange(false)
        onSubscriptionCreated?.()
        window.location.href = url
      } else {
        throw new Error('Failed to create checkout session')
      }
    } catch (error) {
      console.error('Error creating team checkout session:', error)
      toast({
        title: t('common.error'),
        description: t('teams.failedToUpgradeSubscription'),
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const availablePlans = pricingPlans.filter(
    (plan) => plan.interval === (isYearly ? 'year' : 'month'),
  )

  if (isLoadingPlans) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {t('teams.createTeamSubscription')}
            </DialogTitle>
            <DialogDescription>
              {t('teams.loadingPricingPlans')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">{t('teams.loading')}</p>
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
            <CreditCard className="h-5 w-5" />
            {t('teams.createTeamSubscription')}
          </DialogTitle>
          <DialogDescription>
            {t('teams.selectPlanAndSeatsDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Billing Frequency Toggle */}
          <div className="flex justify-center items-center space-x-4">
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
                  const plan = availablePlans.find((p) => p.id === value)
                  setSelectedPlan(plan || null)
                }}
                className="space-y-3"
              >
                {availablePlans.map((plan) => {
                  const seatPrice = getSeatPrice(plan, seats)
                  const totalPrice = seatPrice * seats

                  return (
                    <div
                      key={plan.id}
                      className={`relative border rounded-lg p-4 cursor-pointer transition-colors ${
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
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium">{plan.name}</h3>
                            {selectedPlan?.id === plan.id && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
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
            <div className="text-center py-6">
              <p className="text-muted-foreground">
                {t('teams.noTeamPlansAvailable')}
              </p>
            </div>
          )}

          {/* Seat Selection */}
          {selectedPlan && (
            <div className="space-y-4">
              <Label htmlFor="seats" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
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
                  <Minus className="h-4 w-4" />
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
                  <Plus className="h-4 w-4" />
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
              <div className="flex items-center justify-between mb-2">
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
            disabled={isLoading}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSubscribe}
            disabled={isLoading || !selectedPlan}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            {isLoading ? t('teams.loading') : t('teams.subscribeNow')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
