'use client'

import React from 'react'

import { AlertTriangle, Clock } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/context/i18n-context'
import type { Subscription } from '@/lib/types'
import { subscriptionService } from '@/services/subscription-service'

interface TrialBannerProps {
  subscription: Subscription | null
  onManageTrial?: () => void
  className?: string
}

export default function TrialBanner({
  subscription,
  onManageTrial,
  className = '',
}: TrialBannerProps) {
  const { t } = useTranslation()

  // Check if user is in trial
  const isInTrial = subscriptionService.isInTrial(subscription)
  const daysRemaining =
    subscriptionService.getDaysRemainingInTrial(subscription)
  const isTrialExpiringSoon = subscriptionService.isTrialExpiringSoon(
    subscription,
    3,
  )

  // Don't render if not in trial
  if (!isInTrial) {
    return null
  }

  const handleManageTrial = () => {
    if (onManageTrial) {
      onManageTrial()
    } else {
      window.location.href = '/subscription'
    }
  }

  return (
    <div
      className={`border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 ${className}`}
      data-testid="trial-banner"
    >
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Clock
              className="h-5 w-5 text-blue-600"
              data-testid="trial-banner-clock-icon"
            />
            <div>
              <p
                className="text-sm font-medium text-blue-900 dark:text-blue-100"
                data-testid="trial-banner-title"
              >
                {t('subscription.trialBannerTitle')}
              </p>
              <p
                className="text-xs text-blue-700 dark:text-blue-300"
                data-testid="trial-banner-days-remaining"
              >
                {daysRemaining !== null && daysRemaining > 0
                  ? t('subscription.trialBannerDaysRemaining', {
                      days: daysRemaining,
                    })
                  : t('subscription.trialBannerEndsToday')}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge
              variant="secondary"
              className="text-xs"
              data-testid="trial-banner-badge"
            >
              {t('subscription.trial')}
            </Badge>
            {isTrialExpiringSoon && (
              <AlertTriangle
                className="h-4 w-4 text-orange-500"
                data-testid="trial-banner-warning-icon"
              />
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={handleManageTrial}
              className="text-xs"
              data-testid="trial-banner-manage-button"
            >
              {t('subscription.manageTrial')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
