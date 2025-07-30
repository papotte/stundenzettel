'use client'

import React from 'react'

import { Check, Star, Users } from 'lucide-react'
import { useFormatter, useTranslations } from 'next-intl'

import TryForFreeButton from '@/components/try-for-free-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { PricingPlan } from '@/lib/types'

interface PricingCardProps {
  plan: PricingPlan
  loading: string | null
  onSubscribe: (plan: PricingPlan) => void
  onTeamSubscribe: (plan: PricingPlan) => void
}

export default function PricingCard({
  plan,
  loading,
  onSubscribe,
  onTeamSubscribe,
}: PricingCardProps) {
  const t = useTranslations('landing')
  const format = useFormatter()

  const renderFeatureIcon = (feature: string) => {
    if (feature.includes('support')) return <Star className="h-4 w-4" />
    if (feature.includes('team') || feature.includes('collaboration'))
      return <Users className="h-4 w-4" />
    return <Check className="h-4 w-4" />
  }

  const isIndividualPlan = !plan.maxUsers

  return (
    <Card
      className={`relative ${
        plan.features.includes('Priority support')
          ? 'border-2 border-primary shadow-lg scale-105'
          : 'border border-gray-200'
      }`}
    >
      {plan.features.includes('Priority support') && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground">
            {t('pricing.mostPopular')}
          </Badge>
        </div>
      )}

      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
        <CardDescription className="text-gray-600">
          {t('pricing.perUserPerMonth')}
        </CardDescription>
        <div className="mt-4">
          {plan.tieredPricing ? (
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Starting at</div>
              <div className="text-3xl font-bold text-gray-900">
                {format.number(
                  Math.min(
                    ...plan.tieredPricing.tiers.map((tier) => tier.price),
                  ),
                  {
                    currency: plan.tieredPricing.tiers[0].currency,
                    style: 'currency',
                  },
                )}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                per user /{' '}
                {plan.interval === 'month'
                  ? t('pricing.month')
                  : t('pricing.year')}
              </div>
            </div>
          ) : (
            <>
              <span className="text-4xl font-bold text-gray-900">
                {format.number(plan.price, {
                  currency: plan.currency,
                  style: 'currency',
                })}
              </span>
              <span className="text-gray-600 ml-1">
                /
                {plan.interval === 'month'
                  ? t('pricing.month')
                  : t('pricing.year')}
              </span>
            </>
          )}
        </div>
        {plan.tieredPricing && plan.tieredPricing.tiers.length > 1 && (
          <p className="text-sm text-gray-500 mt-2">
            {t('pricing.tieredHint')}
          </p>
        )}

        {/* Trial badge - only show if plan has trials */}
        {plan.trialEnabled && (
          <div className="mt-2">
            <Badge variant="secondary" className="text-xs">
              {t('pricing.freeTrial')} • {t('pricing.noCreditCard')}
            </Badge>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <ul className="space-y-3">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                {renderFeatureIcon(feature)}
              </div>
              <span className="text-sm text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className="flex flex-col space-y-2">
        {/* Try for Free button - only show if plan has trials */}
        {plan.trialEnabled && (
          <TryForFreeButton
            plan={plan}
            variant={
              plan.features.includes('Priority support') ? 'default' : 'outline'
            }
            className="w-full"
            showIcon={true}
          />
        )}

        {/* Get Started button - primary action if no trial, secondary if trial available */}
        <Button
          onClick={() =>
            isIndividualPlan ? onSubscribe(plan) : onTeamSubscribe(plan)
          }
          disabled={loading === plan.id}
          className={`w-full ${
            plan.features.includes('Priority support')
              ? 'bg-primary hover:bg-primary/90'
              : 'bg-gray-900 hover:bg-gray-800'
          }`}
        >
          {loading === plan.id ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>{t('pricing.processing')}</span>
            </div>
          ) : isIndividualPlan ? (
            t('pricing.getStarted')
          ) : (
            t('pricing.createTeam')
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
