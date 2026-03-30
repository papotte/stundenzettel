'use client'

import { useEffect, useState } from 'react'

import { AlertTriangle, Eye, EyeOff, Loader2, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
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
import { useToast } from '@/hooks/use-toast'
import { auth } from '@/lib/firebase'
import type { AuthenticatedUser } from '@/lib/types'
import {
  deleteUserAccount,
  deleteUserAccountWithEmail,
  deleteUserAccountWithGoogle,
} from '@/services/user-deletion-service'

export type DeleteAuthMethod = 'password' | 'google' | 'email' | null

function detectDeleteAuthMethod(): DeleteAuthMethod {
  const useMocks =
    process.env.NEXT_PUBLIC_ENVIRONMENT === 'test' ||
    process.env.NEXT_PUBLIC_ENVIRONMENT === 'development'

  if (useMocks) {
    return 'password'
  }

  const firebaseUser = auth.currentUser
  if (firebaseUser?.providerData) {
    const hasGoogleProvider = firebaseUser.providerData.some(
      (provider) => provider.providerId === 'google.com',
    )
    const hasPasswordProvider = firebaseUser.providerData.some(
      (provider) => provider.providerId === 'password',
    )

    if (hasPasswordProvider) return 'password'
    if (hasGoogleProvider) return 'google'
    return 'email'
  }

  return 'email'
}

function deletionErrorDescription(
  error: unknown,
  translate: (key: string) => string,
): string {
  const fallback = translate('settings.deleteAccountError')
  if (!(error instanceof Error)) {
    return fallback
  }
  const { message } = error
  if (message.includes('password') || message.includes('credential')) {
    return translate('settings.deleteAccountInvalidPassword')
  }
  if (message.includes('email')) {
    return translate('settings.deleteAccountInvalidEmail')
  }
  if (message.includes('cancelled') || message.includes('popup')) {
    return translate('settings.deleteAccountCancelled')
  }
  return fallback
}

async function runUserAccountDeletion(
  method: DeleteAuthMethod,
  uid: string,
  password: string,
  email: string,
): Promise<void> {
  switch (method) {
    case 'password':
      await deleteUserAccount(uid, password)
      break
    case 'google':
      await deleteUserAccountWithGoogle(uid)
      break
    case 'email':
      await deleteUserAccountWithEmail(uid, email)
      break
    default:
      throw new Error('Unknown authentication method')
  }
}

export interface DeleteAccountCardProps {
  user: AuthenticatedUser
}

export function DeleteAccountCard({ user }: DeleteAccountCardProps) {
  const router = useRouter()
  const { toast } = useToast()
  const t = useTranslations()

  const [authMethod, setAuthMethod] = useState<DeleteAuthMethod>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    setAuthMethod(detectDeleteAuthMethod())
  }, [user])

  const handleDeleteAccount = async () => {
    if (authMethod == null) return

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
      await runUserAccountDeletion(authMethod, user.uid, password, email)

      toast({
        title: t('settings.deleteAccountSuccess'),
        description: t('settings.deleteAccountConfirmDescription'),
      })
      router.replace('/login')
    } catch (error) {
      console.error('Account deletion failed:', error)
      toast({
        title: t('settings.deleteAccountError'),
        description: deletionErrorDescription(error, t),
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          {t('settings.dangerZone')}
        </CardTitle>
        <CardDescription>{t('settings.dangerZoneDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border border-destructive/20 p-4">
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
              <Button
                variant="destructive"
                size="sm"
                data-testid="delete-user-button"
              >
                <Trash2 className="mr-2 h-4 w-4" />
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
                            void handleDeleteAccount()
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
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
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
                      placeholder={t('settings.deleteAccountEmailPlaceholder')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isDeleting}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && email.trim()) {
                          void handleDeleteAccount()
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
                  {t('common.cancel')}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => void handleDeleteAccount()}
                  disabled={
                    authMethod === null ||
                    (authMethod === 'password' && !password.trim()) ||
                    (authMethod === 'email' && !email.trim()) ||
                    isDeleting
                  }
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('settings.deleteAccountProcessing')}
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
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
  )
}
