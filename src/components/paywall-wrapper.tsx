'use client'

import React from 'react'

import { Crown, Lock, Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { usePaywall, type PaywallFeatures } from '@/hooks/use-paywall'

interface PaywallWrapperProps {
  feature: keyof PaywallFeatures
  children: React.ReactNode
  fallback?: React.ReactNode
  showUpgradePrompt?: boolean
  title?: string
  description?: string
  className?: string
}

export function PaywallWrapper({
  feature,
  children,
  fallback,
  showUpgradePrompt = true,
  title,
  description,
  className,
}: PaywallWrapperProps) {
  const { isLoading, canAccess, requiresUpgrade } = usePaywall()
  const t = useTranslations()

  if (isLoading) {
    return (
      <div className={className}>
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (canAccess(feature)) {
    return <div className={className}>{children}</div>
  }

  if (fallback) {
    return <div className={className}>{fallback}</div>
  }

  if (!showUpgradePrompt) {
    return null
  }

  return (
    <div className={className}>
      <UpgradePrompt 
        feature={feature} 
        title={title}
        description={description}
      />
    </div>
  )
}

interface UpgradePromptProps {
  feature: keyof PaywallFeatures
  title?: string
  description?: string
}

function UpgradePrompt({ feature, title, description }: UpgradePromptProps) {
  const t = useTranslations()

  const getFeatureDetails = (feature: keyof PaywallFeatures) => {
    const features = {
      companySettings: {
        title: t('paywall.companySettings.title'),
        description: t('paywall.companySettings.description'),
        icon: Crown,
      },
      exportFunctionality: {
        title: t('paywall.exportFunctionality.title'),
        description: t('paywall.exportFunctionality.description'),
        icon: Crown,
      },
      manualTimeEntry: {
        title: t('paywall.manualTimeEntry.title'),
        description: t('paywall.manualTimeEntry.description'),
        icon: Lock,
      },
      editTimeEntry: {
        title: t('paywall.editTimeEntry.title'),
        description: t('paywall.editTimeEntry.description'),
        icon: Lock,
      },
      deleteTimeEntry: {
        title: t('paywall.deleteTimeEntry.title'),
        description: t('paywall.deleteTimeEntry.description'),
        icon: Lock,
      },
      specialEntries: {
        title: t('paywall.specialEntries.title'),
        description: t('paywall.specialEntries.description'),
        icon: Crown,
      },
      advancedReporting: {
        title: t('paywall.advancedReporting.title'),
        description: t('paywall.advancedReporting.description'),
        icon: Sparkles,
      },
      bulkActions: {
        title: t('paywall.bulkActions.title'),
        description: t('paywall.bulkActions.description'),
        icon: Sparkles,
      },
      apiAccess: {
        title: t('paywall.apiAccess.title'),
        description: t('paywall.apiAccess.description'),
        icon: Sparkles,
      },
    }

    return features[feature] || {
      title: t('paywall.premiumFeature'),
      description: t('paywall.upgradeRequired'),
      icon: Lock,
    }
  }

  const featureDetails = getFeatureDetails(feature)
  const Icon = featureDetails.icon

  return (
    <Card className="border-2 border-dashed border-muted-foreground/20">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-lg">
          {title || featureDetails.title}
        </CardTitle>
        <CardDescription className="text-sm">
          {description || featureDetails.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            {t('paywall.currentPlan')}: <span className="font-semibold">{t('paywall.freePlan')}</span>
          </div>
          <Button asChild className="w-full">
            <Link href="/pricing">
              <Crown className="mr-2 h-4 w-4" />
              {t('paywall.upgradeToPremium')}
            </Link>
          </Button>
          <div className="text-xs text-muted-foreground">
            {t('paywall.trialAvailable')}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default PaywallWrapper