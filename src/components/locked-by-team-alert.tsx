'use client'

import { AlertTriangle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

import { Alert, AlertDescription } from '@/components/ui/alert'

interface LockedByTeamAlertProps {
  showChangeText: boolean
  message?: string
}

export function LockedByTeamAlert({
  showChangeText,
  message,
}: LockedByTeamAlertProps) {
  const t = useTranslations()
  return (
    <Alert variant="warning" className="mb-4">
      <AlertTriangle className="h-4 w-4" aria-hidden />
      <AlertDescription>
        <span>{message ?? t('settings.managedByTeam')}</span>
        {!showChangeText ? (
          <span> {t('settings.teamManagementForbidden')}</span>
        ) : null}
        {showChangeText ? (
          <span className="mt-2 block">
            <span className="font-medium">
              {t('settings.teamManagementAllowed')}
            </span>{' '}
            <Link
              href="/team?tab=team-settings"
              className="font-medium underline underline-offset-2"
            >
              {t('settings.openTeamOptions')}
            </Link>
          </span>
        ) : null}
      </AlertDescription>
    </Alert>
  )
}
