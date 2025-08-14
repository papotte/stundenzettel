'use client'

import React, { useEffect, useState } from 'react'

import {
  GoogleAuthProvider,
  UserCredential,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth'
import { useTranslations } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'

import TimeWiseIcon from '@/components/time-wise-icon'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from '@/components/ui/card'
import ColorfulBackground from '@/components/ui/colorful-background'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { auth } from '@/lib/firebase'
import type { AuthenticatedUser } from '@/lib/types'

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M47.532 24.552c0-1.566-.14-3.084-.404-4.548H24.42v8.61h13.01c-.563 2.76-2.185 5.11-4.637 6.672v5.602h7.206c4.212-3.882 6.648-9.678 6.648-16.336Z"
      fill="#4285F4"
    />
    <path
      d="M24.42 48.001c6.48 0 11.93-2.148 15.908-5.832l-7.206-5.602c-2.148 1.44-4.884 2.292-7.98 2.292-6.144 0-11.334-4.14-13.194-9.732H3.95v5.76C7.902 42.613 15.588 48 24.42 48Z"
      fill="#34A853"
    />
    <path
      d="M11.226 28.77c-.6-1.782-.936-3.69-.936-5.688 0-1.998.336-3.906.936-5.688v-5.76H3.95C2.185 15.827 1 19.863 1 24.082c0 4.22 1.185 8.256 3.95 11.45L11.226 28.77Z"
      fill="#FBBC05"
    />
    <path
      d="M24.42 9.42c3.516 0 6.66.192 8.712 2.196l6.408-6.384C36.348 1.44 30.9 0 24.42 0 15.588 0 7.902 5.388 3.95 11.844l7.276 5.76c1.86-5.592 7.05-9.732 13.194-9.732Z"
      fill="#EA4335"
    />
  </svg>
)

const mockUsers: AuthenticatedUser[] = [
  {
    uid: '',
    email: 'user@example.com',
    displayName: 'User Example',
  },
  {
    uid: '',
    email: 'admin@example.com',
    displayName: 'Admin Example',
  },
  {
    uid: '',
    email: 'test@example.com',
    displayName: 'Test Example',
  },
]

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('signin')
  const [returnUrl, setReturnUrl] = useState('/tracker')
  const [pendingAuth, setPendingAuth] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const t = useTranslations()

  // Get return URL from query parameters
  useEffect(() => {
    const url = searchParams.get('returnUrl')
    if (url) {
      setReturnUrl(decodeURIComponent(url))
    }
  }, [searchParams])

  // Effect to handle pending authentication after state updates
  useEffect(() => {
    // Only trigger authentication if we're waiting for it and have both values
    if (pendingAuth && email && password) {
      setPendingAuth(false)
      handleSignIn()
    }
  }, [pendingAuth, email, password])

  const useMocks = process.env.NEXT_PUBLIC_ENVIRONMENT === 'development'

  const handleAuthAction = async (
    action: (email: string, password: string) => Promise<UserCredential>,
    isSignup = false,
  ) => {
    setLoading(true)
    if (!auth || typeof auth.onAuthStateChanged !== 'function') {
      toast({
        title: t('toasts.configurationErrorTitle'),
        description: t('toasts.configurationErrorDescription'),
        variant: 'destructive',
      })
      setLoading(false)
      return
    }
    try {
      await setPersistence(auth, browserLocalPersistence)
      const userCredential = await action(email, password)

      // Add contact to Resend on signup
      if (isSignup && userCredential.user.email) {
        try {
          await fetch('/api/contacts/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userCredential.user.email }),
          })
        } catch (contactError) {
          console.error('Failed to add contact to Resend:', contactError)
          // Don't fail signup if contact creation fails
        }
      }

      router.push(returnUrl)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      toast({
        title: t('login.authFailedTitle'),
        description: message,
        variant: 'destructive',
      })
    } finally {
      setPendingAuth(false)
      setLoading(false)
    }
  }

  const handleSignIn = () => {
    handleAuthAction((email, password) => {
      return signInWithEmailAndPassword(auth, email, password)
    })
  }
  const handleSignUp = () =>
    handleAuthAction(
      (email, password) =>
        createUserWithEmailAndPassword(auth, email, password),
      true,
    )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      e.preventDefault()
      if (activeTab === 'signin') {
        handleSignIn()
      } else {
        handleSignUp()
      }
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    if (!auth || typeof auth.onAuthStateChanged !== 'function') {
      toast({
        title: t('toasts.configurationErrorTitle'),
        description: t('toasts.configurationErrorDescription'),
        variant: 'destructive',
      })
      setLoading(false)
      return
    }
    const provider = new GoogleAuthProvider()
    try {
      await setPersistence(auth, browserLocalPersistence)
      const result = await signInWithPopup(auth, provider)

      // Check if this is a new user and add to Resend
      if (
        result.user.metadata.creationTime ===
          result.user.metadata.lastSignInTime &&
        result.user.email
      ) {
        try {
          await fetch('/api/contacts/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: result.user.email }),
          })
        } catch (contactError) {
          console.error('Failed to add contact to Resend:', contactError)
          // Don't fail signup if contact creation fails
        }
      }

      router.push(returnUrl)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      toast({
        title: t('login.authFailedTitle'),
        description: message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleMockLogin = async (user: AuthenticatedUser) => {
    // Use the seeded user credentials to authenticate with Firebase
    const password = 'password123' // All seeded users use the same password
    // Set state and mark that we want to authenticate
    setEmail(user.email.trim())
    setPassword(password)
    setPendingAuth(true)
  }

  const buildLoginForm = () => {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email-signin">{t('login.emailLabel')}</Label>
          <Input
            id="email-signin"
            type="email"
            placeholder={t('login.emailPlaceholder')}
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password-signin">{t('login.passwordLabel')}</Label>
          <Input
            id="password-signin"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <Button
          onClick={handleSignIn}
          data-testid="login-signin-button"
          disabled={loading}
          className="w-full"
        >
          {loading ? t('login.signingInButton') : t('login.signInButton')}
        </Button>
      </div>
    )
  }
  const buildMockLogin = () => {
    return (
      <div>
        <div className={'flex flex-col pb-6'}>
          <CardTitle>{t('login.selectMockUser')}</CardTitle>
          <CardDescription>{t('login.mockUserDescription')}</CardDescription>
        </div>
        <div className="space-y-4">
          {mockUsers.map((user) => (
            <Button
              key={user.email}
              onClick={() => handleMockLogin(user)}
              className="w-full"
              data-testid={`login-as-${user.displayName}`}
            >
              {t('login.loginAs', {
                displayName: user.displayName || user.email!,
              })}
            </Button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <ColorfulBackground className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="mb-4 flex items-center gap-2">
        <TimeWiseIcon className="h-8 w-8 text-primary" />
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          {t('common.appName')} {useMocks ? ' (Test Mode)' : ''}
        </h1>
      </div>
      <Card className="w-full max-w-sm">
        <CardContent className="pt-6">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 bg-transparent p-0">
              <TabsTrigger value="signin">{t('login.signInTab')}</TabsTrigger>
              <TabsTrigger value="signup">{t('login.signUpTab')}</TabsTrigger>
            </TabsList>
            <TabsContent value="signin" className="mt-6">
              {buildLoginForm()}
              <div className="mt-4 pt-4 border-t">
                {useMocks && buildMockLogin()}
              </div>
            </TabsContent>
            <TabsContent value="signup" className="mt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-signup">{t('login.emailLabel')}</Label>
                  <Input
                    id="email-signup"
                    type="email"
                    placeholder={t('login.emailPlaceholder')}
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signup">
                    {t('login.passwordLabel')}
                  </Label>
                  <Input
                    id="password-signup"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                </div>
                <Button
                  onClick={handleSignUp}
                  disabled={loading}
                  className="w-full"
                >
                  {loading
                    ? t('login.creatingAccountButton')
                    : t('login.signUpButton')}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <div className="w-full max-w-sm">
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              {t('login.continueWith')}
            </span>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full bg-white hover:bg-gray-50"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          <GoogleIcon className="mr-2 h-4 w-4" />
          {t('login.signInWithGoogle')}
        </Button>
      </div>
    </ColorfulBackground>
  )
}
