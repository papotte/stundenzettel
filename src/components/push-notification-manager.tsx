'use client'

import { useEffect, useState } from 'react'

import { useTranslations } from 'next-intl'

import {
  subscribeUser,
  unsubscribeUser,
} from '@/app/actions/push-notifications'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

/**
 * Push notification manager: subscribe and unsubscribe.
 * Notifications are sent from the server (e.g. Cloud Functions) when needed.
 */
export function PushNotificationManager() {
  const t = useTranslations('settings')
  const tToasts = useTranslations('toasts')
  const { toast } = useToast()
  const [isSupported, setIsSupported] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null,
  )
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
      registerServiceWorker().catch((err) => {
        console.error('Service worker registration failed:', err)
        setIsSupported(false)
      })
    }
  }, [])

  async function registerServiceWorker() {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    })
    const sub = await registration.pushManager.getSubscription()
    setSubscription(sub)
  }

  async function subscribeToPush() {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapidKey) {
      console.error('NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set')
      return
    }
    setIsLoading(true)
    try {
      const registration = await navigator.serviceWorker.ready
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      })
      const serializedSub = JSON.parse(
        JSON.stringify(sub),
      ) as PushSubscriptionJSON
      await subscribeUser(serializedSub)
      setSubscription(sub)
    } catch (err) {
      console.error('Push subscribe failed:', err)
      toast({
        title: tToasts('pushSubscribeFailedTitle'),
        description: tToasts('pushSubscribeFailedDescription'),
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function unsubscribeFromPush() {
    setIsLoading(true)
    try {
      await subscription?.unsubscribe()
      await unsubscribeUser()
      setSubscription(null)
    } catch (err) {
      console.error('Push unsubscribe failed:', err)
      toast({
        title: tToasts('pushUnsubscribeFailedTitle'),
        description: tToasts('pushUnsubscribeFailedDescription'),
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('pushNotifications')}</CardTitle>
          <CardDescription>{t('pushNotSupported')}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t('pushNotifications')}</CardTitle>
        <CardDescription>{t('pushNotificationsDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {subscription ? (
            <>
              <p className="text-sm text-muted-foreground">
                {t('pushSubscribed')}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={unsubscribeFromPush}
                disabled={isLoading}
              >
                {t('pushUnsubscribe')}
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {t('pushNotSubscribed')}
              </p>
              <Button
                type="button"
                size="sm"
                onClick={subscribeToPush}
                disabled={isLoading}
              >
                {t('pushSubscribe')}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
