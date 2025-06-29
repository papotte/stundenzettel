
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  UserCredential,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useTranslation } from '@/context/i18n-context';
import type { AuthenticatedUser } from '@/lib/types';

const TimeWiseIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M7 9L9 15L12 11L15 15L17 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="12" r="1" fill="currentColor"/>
    </svg>
);

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M47.532 24.552c0-1.566-.14-3.084-.404-4.548H24.42v8.61h13.01c-.563 2.76-2.185 5.11-4.637 6.672v5.602h7.206c4.212-3.882 6.648-9.678 6.648-16.336Z" fill="#4285F4"/>
        <path d="M24.42 48.001c6.48 0 11.93-2.148 15.908-5.832l-7.206-5.602c-2.148 1.44-4.884 2.292-7.98 2.292-6.144 0-11.334-4.14-13.194-9.732H3.95v5.76C7.902 42.613 15.588 48 24.42 48Z" fill="#34A853"/>
        <path d="M11.226 28.77c-.6-1.782-.936-3.69-.936-5.688 0-1.998.336-3.906.936-5.688v-5.76H3.95C2.185 15.827 1 19.863 1 24.082c0 4.22 1.185 8.256 3.95 11.45L11.226 28.77Z" fill="#FBBC05"/>
        <path d="M24.42 9.42c3.516 0 6.66.192 8.712 2.196l6.408-6.384C36.348 1.44 30.9 0 24.42 0 15.588 0 7.902 5.388 3.95 11.844l7.276 5.76c1.86-5.592 7.05-9.732 13.194-9.732Z" fill="#EA4335"/>
    </svg>
);


const mockUsers: AuthenticatedUser[] = [
  { uid: 'mock-user-1', email: 'user1@example.com', displayName: 'Raquel Crespillo Andujar' },
  { uid: 'mock-user-2', email: 'user2@example.com', displayName: 'Max Mustermann' },
]

const useMocks = process.env.NEXT_PUBLIC_ENVIRONMENT === 'test' || process.env.NEXT_PUBLIC_ENVIRONMENT === 'development';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { loginAsMockUser } = useAuth();
  const { t } = useTranslation();

  const handleAuthAction = async (action: (email: string, password: string) => Promise<UserCredential>) => {
    setLoading(true);
    if (!auth || typeof auth.onAuthStateChanged !== 'function') {
      toast({
        title: t('toasts.configurationErrorTitle'),
        description: t('toasts.configurationErrorDescription'),
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }
    try {
      await setPersistence(auth, browserLocalPersistence);
      await action(email, password);
      router.push('/');
    } catch (error: any) {
      toast({
        title: t('login.authFailedTitle'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = () => handleAuthAction((email, password) => signInWithEmailAndPassword(auth, email, password));
  const handleSignUp = () => handleAuthAction((email, password) => createUserWithEmailAndPassword(auth, email, password));

  const handleGoogleSignIn = async () => {
    setLoading(true);
    if (!auth || typeof auth.onAuthStateChanged !== 'function') {
      toast({
        title: t('toasts.configurationErrorTitle'),
        description: t('toasts.configurationErrorDescription'),
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }
    const provider = new GoogleAuthProvider();
    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInWithPopup(auth, provider);
      router.push('/');
    } catch (error: any) {
      toast({
        title: t('login.authFailedTitle'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMockLogin = (user: AuthenticatedUser) => {
    if (loginAsMockUser) {
        loginAsMockUser(user);
        router.push('/');
    }
  }

  if (useMocks) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-muted p-4">
            <div className="flex items-center gap-2 mb-4">
                <TimeWiseIcon className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold tracking-tight font-headline">{t('login.testMode')}</h1>
            </div>
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle>{t('login.selectMockUser')}</CardTitle>
                    <CardDescription>
                        {t('login.mockUserDescription')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {mockUsers.map(user => (
                        <Button key={user.uid} onClick={() => handleMockLogin(user)} className="w-full">
                            {t('login.loginAs', { displayName: user.displayName || user.email! })}
                        </Button>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted p-4">
       <div className="flex items-center gap-2 mb-4">
            <TimeWiseIcon className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight font-headline">{t('login.title')}</h1>
        </div>
      <Tabs defaultValue="signin" className="w-full max-w-sm">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="signin">{t('login.signInTab')}</TabsTrigger>
          <TabsTrigger value="signup">{t('login.signUpTab')}</TabsTrigger>
        </TabsList>
        <TabsContent value="signin">
          <Card>
            <CardHeader>
              <CardTitle>{t('login.signInTitle')}</CardTitle>
              <CardDescription>
                {t('login.signInDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-signin">{t('login.emailLabel')}</Label>
                <Input
                  id="email-signin"
                  type="email"
                  placeholder={t('login.emailPlaceholder')}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSignIn} disabled={loading} className="w-full">
                {loading ? t('login.signingInButton') : t('login.signInButton')}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="signup">
          <Card>
            <CardHeader>
              <CardTitle>{t('login.signUpTitle')}</CardTitle>
              <CardDescription>
                {t('login.signUpDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-signup">{t('login.emailLabel')}</Label>
                <Input
                  id="email-signup"
                  type="email"
                  placeholder={t('login.emailPlaceholder')}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-signup">{t('login.passwordLabel')}</Label>
                <Input 
                  id="password-signup" 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSignUp} disabled={loading} className="w-full">
                {loading ? t('login.creatingAccountButton') : t('login.signUpButton')}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      <div className="w-full max-w-sm">
        <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-muted px-2 text-muted-foreground">
                {t('login.continueWith')}
                </span>
            </div>
        </div>
        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={loading}>
            <GoogleIcon className="mr-2 h-4 w-4" />
            {t('login.signInWithGoogle')}
        </Button>
      </div>
    </div>
  );
}
