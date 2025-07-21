'use client'

import { useEffect, useState } from 'react'

import { AlertTriangle, ArrowLeft, Eye, EyeOff, Loader2, Shield, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useTranslation } from '@/context/i18n-context'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { deleteUserAccount } from '@/services/user-deletion-service'

export default function SecurityPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useTranslation()
  const [pageLoading, setPageLoading] = useState(true)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?returnUrl=/security')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      setPageLoading(false)
    }
  }, [user])

  const handleDeleteAccount = async () => {
    if (!user || !password.trim()) {
      toast({
        title: t('settings.deleteAccountError'),
        description: t('settings.deleteAccountPasswordRequired'),
        variant: 'destructive',
      })
      return
    }

    setIsDeleting(true)
    try {
      await deleteUserAccount(user.uid, password)
      toast({
        title: t('settings.deleteAccountSuccess'),
        description: t('settings.deleteAccountConfirmDescription'),
      })
      // Redirect to login after successful deletion
      router.replace('/login')
    } catch (error) {
      console.error('Account deletion failed:', error)
      const errorMessage = error instanceof Error 
        ? error.message.includes('password') || error.message.includes('credential')
          ? t('settings.deleteAccountInvalidPassword')
          : t('settings.deleteAccountError')
        : t('settings.deleteAccountError')
      
      toast({
        title: t('settings.deleteAccountError'),
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const resetDeleteDialog = () => {
    setIsDeleteDialogOpen(false)
    setPassword('')
    setShowPassword(false)
    setIsDeleting(false)
  }

  if (authLoading || pageLoading) {
    return (
      <div className="min-h-screen bg-muted p-4 sm:p-8">
        <div className="mx-auto max-w-2xl">
          <Skeleton className="mb-8 h-10 w-32" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-muted p-4 sm:p-8 pb-20 md:pb-8">
      <div className="mx-auto max-w-2xl">
        <Button asChild variant="outline" className="mb-8">
          <Link href="/tracker">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('settings.backToTracker')}
          </Link>
        </Button>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {t('settings.security')}
              </CardTitle>
              <CardDescription>
                {t('settings.securityDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">{t('settings.accountEmail')}</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <Button variant="outline" size="sm">
                  {t('settings.change')}
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">{t('settings.password')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.passwordDescription')}
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  {t('settings.change')}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                {t('settings.dangerZone')}
              </CardTitle>
              <CardDescription>
                {t('settings.dangerZoneDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
                <div>
                  <h3 className="font-medium text-destructive">
                    {t('settings.deleteAccount')}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.deleteAccountDescription')}
                  </p>
                </div>
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t('settings.deleteAccount')}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {t('settings.deleteAccountConfirmTitle')}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('settings.deleteAccountConfirmDescription')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="password">
                          {t('settings.deleteAccountPasswordLabel')}
                        </Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder={t('settings.deleteAccountPasswordPlaceholder')}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isDeleting}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && password.trim()) {
                                handleDeleteAccount()
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isDeleting}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                    <AlertDialogFooter>
                      <Button
                        variant="outline"
                        onClick={resetDeleteDialog}
                        disabled={isDeleting}
                      >
                        {t('settings.cancel')}
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDeleteAccount}
                        disabled={!password.trim() || isDeleting}
                      >
                        {isDeleting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {t('settings.deleteAccountProcessing')}
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t('settings.deleteAccountConfirmButton')}
                          </>
                        )}
                      </Button>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
