'use client'

import React from 'react'

import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useTranslation } from '@/hooks/use-translation-compat'

interface BillingToggleProps {
  isYearly: boolean
  onToggle: (isYearly: boolean) => void
}

export default function BillingToggle({
  isYearly,
  onToggle,
}: BillingToggleProps) {
  const { t } = useTranslation()

  return (
    <div className="flex justify-center items-center space-x-4 mb-8">
      <Label
        htmlFor="billing-toggle"
        className="text-sm font-medium text-gray-700"
      >
        {t('pricing.monthly')}
      </Label>
      <Switch
        id="billing-toggle"
        checked={isYearly}
        onCheckedChange={onToggle}
      />
      <Label
        htmlFor="billing-toggle"
        className="text-sm font-medium text-gray-700"
      >
        {t('pricing.yearly')}
      </Label>
      {isYearly && (
        <Badge variant="secondary" className="ml-2">
          {t('pricing.save20')}
        </Badge>
      )}
    </div>
  )
}
