'use client'

import { useEffect, useState } from 'react'

import {
  AlertTriangle,
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  Shield,
  Trash2,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import PasswordChangeDialog from '@/components/password-change-dialog'
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useTranslation } from '@/context/i18n-context'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { auth } from '@/lib/firebase'
import { hasPasswordAuthentication } from '@/services/password-update-service'
import {
  deleteUserAccount,
  deleteUserAccountWithEmail,
  deleteUserAccountWithGoogle,
} from '@/services/user-deletion-service'

export default function SecurityPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useTranslation()
  const [pageLoading, setPageLoading] = useState(true)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [authMethod, setAuthMethod] = useState<
    'password' | 'google' | 'email' | null
  >(null)
  const [hasPasswordAuth, setHasPasswordAuth] = useState<boolean>(false)
  const [checkingPasswordAuth, setCheckingPasswordAuth] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?returnUrl=/security')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      setPageLoading(false)
      detectAuthMethod()
      checkPasswordAuth()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const checkPasswordAuth = async () => {
    if (!user) return

    try {
      setCheckingPasswordAuth(true)
      const hasAuth = await hasPasswordAuthentication(user.uid)
      setHasPasswordAuth(hasAuth)
    } catch (error) {
      console.error('Error checking password authentication:', error)
      setHasPasswordAuth(false)
    } finally {
      setCheckingPasswordAuth(false)
    }
  }

  const detectAuthMethod = () => {
    // In mock mode, default to password authentication for testing
    const useMocks =
      process.env.NEXT_PUBLIC_ENVIRONMENT === 'test' ||
      process.env.NEXT_PUBLIC_ENVIRONMENT === 'development'

    if (useMocks) {
      setAuthMethod('password')
      return
    }

    // For Firebase users, check provider data
    const firebaseUser = auth.currentUser
    if (firebaseUser && firebaseUser.providerData) {
      const hasGoogleProvider = firebaseUser.providerData.some(
        (provider) => provider.providerId === 'google.com',
      )
      const hasPasswordProvider = firebaseUser.providerData.some(
        (provider) => provider.providerId === 'password',
      )

      if (hasPasswordProvider) {
        setAuthMethod('password')
      } else if (hasGoogleProvider) {
        setAuthMethod('google')
      } else {
        // Fallback to email confirmation for other providers
        setAuthMethod('email')
      }
    } else {
      // Fallback to email confirmation
      setAuthMethod('email')
    }
  }

  const handleDeleteAccount = async () => {
    if (!user) {
      toast({
        title: t('settings.deleteAccountError'),
        description: 'User not authenticated',
        variant: 'destructive',
      })
      return
    }

    // Check validation before starting the deletion process
    if (authMethod === 'password' && !password.trim()) {
      toast({
        title: t('settings.deleteAccountError'),
        description: t('settings.deleteAccountPasswordRequired'),
        variant: 'destructive',
      })
      return
    }

    if (authMethod === 'email' && !email.trim()) {
      toast({
        title: t('settings.deleteAccountError'),
        description: t('settings.deleteAccountEmailRequired'),
        variant: 'destructive',
      })
      return
    }

    setIsDeleting(true)
    try {
      if (authMethod === 'password') {
        await deleteUserAccount(user.uid, password)
      } else if (authMethod === 'google') {
        await deleteUserAccountWithGoogle(user.uid)
      } else if (authMethod === 'email') {
        await deleteUserAccountWithEmail(user.uid, email)
      } else {
        throw new Error('Unknown authentication method')
      }

      toast({
        title: t('settings.deleteAccountSuccess'),
        description: t('settings.deleteAccountConfirmDescription'),
      })
      // Redirect to login after successful deletion
      router.replace('/login')
    } catch (error) {
      console.error('Account deletion failed:', error)
      let errorMessage = t('settings.deleteAccountError')

      if (error instanceof Error) {
        if (
          error.message.includes('password') ||
          error.message.includes('credential')
        ) {
          errorMessage = t('settings.deleteAccountInvalidPassword')
        } else if (error.message.includes('email')) {
          errorMessage = t('settings.deleteAccountInvalidEmail')
        } else if (
          error.message.includes('cancelled') ||
          error.message.includes('popup')
        ) {
          errorMessage = t('settings.deleteAccountCancelled')
        }
      }

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
    setEmail('')
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
                {!checkingPasswordAuth && hasPasswordAuth ? (
                  <Button
                    variant="outline"
                    size="sm"
                    data-testid="change-email-trigger"
                  >
                    {t('settings.change')}
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
                            {t('settings.change')}
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
              {!checkingPasswordAuth && hasPasswordAuth && (
                <div className="flex items-center justify-between p-4 border rounded-lg">
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
                      {t('settings.change')}
                    </Button>
                  </PasswordChangeDialog>
                </div>
              )}
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
                <AlertDialog
                  open={isDeleteDialogOpen}
                  onOpenChange={setIsDeleteDialogOpen}
                >
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
                      {authMethod === 'password' && (
                        <div className="space-y-2">
                          <Label htmlFor="password">
                            {t('settings.deleteAccountPasswordLabel')}
                          </Label>
                          <div className="relative">
                            <Input
                              id="password"
                              type={showPassword ? 'text' : 'password'}
                              placeholder={t(
                                'settings.deleteAccountPasswordPlaceholder',
                              )}
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
                      )}

                      {authMethod === 'google' && (
                        <div className="space-y-2">
                          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-800">
                              {t('settings.deleteAccountGoogleMessage')}
                            </p>
                          </div>
                        </div>
                      )}

                      {authMethod === 'email' && (
                        <div className="space-y-2">
                          <Label htmlFor="confirm-email">
                            {t('settings.deleteAccountEmailLabel')}
                          </Label>
                          <Input
                            id="confirm-email"
                            type="email"
                            placeholder={t(
                              'settings.deleteAccountEmailPlaceholder',
                            )}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isDeleting}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && email.trim()) {
                                handleDeleteAccount()
                              }
                            }}
                          />
                          <p className="text-xs text-muted-foreground">
                            {t('settings.deleteAccountEmailHelper')}
                          </p>
                        </div>
                      )}
                    </div>
                    <AlertDialogFooter>
                      <Button
                        variant="outline"
                        onClick={resetDeleteDialog}
                        disabled={isDeleting}
                      >
                        {t('scommon.cancel')}
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDeleteAccount}
                        disabled={
                          (authMethod === 'password' && !password.trim()) ||
                          (authMethod === 'email' && !email.trim()) ||
                          isDeleting
                        }
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
