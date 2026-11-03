'use client'

import { useEffect, useState } from 'react'

import { Shield } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

import PasswordChangeDialog from '@/components/password-change-dialog'
import { DeleteAccountCard } from '@/components/security/delete-account-card'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useAuth } from '@/hooks/use-auth'
import { hasPasswordAuthentication } from '@/services/password-update-service'

export default function SecurityPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const t = useTranslations()

  const [hasPasswordAuth, setHasPasswordAuth] = useState<boolean | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?returnUrl=/security')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return
    let cancelled = false
    hasPasswordAuthentication(user.uid)
      .then((hasAuth) => {
        if (!cancelled) setHasPasswordAuth(hasAuth)
      })
      .catch((error) => {
        console.error('Error checking password authentication:', error)
        if (!cancelled) setHasPasswordAuth(false)
      })
    return () => {
      cancelled = true
    }
  }, [user])

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-muted p-4 sm:p-8">
        <div className="mx-auto max-w-2xl">
          <Skeleton className="mb-8 h-10 w-32" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted p-4 pb-20 sm:p-8 md:pb-8">
      <div className="mx-auto max-w-2xl">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="size-5" />
                {t('settings.security')}
              </CardTitle>
              <CardDescription>
                {t('settings.securityDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <h3 className="font-medium">{t('settings.accountEmail')}</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                {hasPasswordAuth === true ? (
                  <Button
                    variant="outline"
                    size="sm"
                    data-testid="change-email-trigger"
                  >
                    {t('common.change')}
                  </Button>
                ) : (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            data-testid="change-email-trigger"
                          >
                            {t('common.change')}
                          </Button>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t('settings.emailChangeDisabledTooltip')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>

              {/* Password change section - only show for email users */}
              {hasPasswordAuth === true && (
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <h3 className="font-medium">{t('settings.password')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.passwordDescription')}
                    </p>
                  </div>
                  <PasswordChangeDialog>
                    <Button
                      variant="outline"
                      size="sm"
                      data-testid="change-password-trigger"
                    >
                      {t('common.change')}
                    </Button>
                  </PasswordChangeDialog>
                </div>
              )}
            </CardContent>
          </Card>

          <DeleteAccountCard user={user} />
        </div>
      </div>
    </div>
  )
}
