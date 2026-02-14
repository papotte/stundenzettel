'use server'

import webpush from 'web-push'

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    'mailto:support@timewise-tracker.example.com',
    vapidPublicKey,
    vapidPrivateKey,
  )
}

// In production, store the subscription in a database (e.g. Firestore keyed by userId).
type SerializedSubscription = PushSubscriptionJSON
let subscription: SerializedSubscription | null = null

export async function subscribeUser(sub: SerializedSubscription) {
  subscription = sub
  return { success: true }
}

export async function unsubscribeUser() {
  subscription = null
  return { success: true }
}

export async function sendNotification(
  message: string,
): Promise<{ success: true } | { success: false; error: string }> {
  if (!subscription) {
    return {
      success: false,
      error: 'No subscription available. Please enable notifications again.',
    }
  }

  try {
    await webpush.sendNotification(
      subscription as Parameters<typeof webpush.sendNotification>[0],
      JSON.stringify({
        title: 'TimeWise Tracker',
        body: message,
        icon: '/apple-touch-icon.png',
      }),
    )
    return { success: true }
  } catch (error) {
    console.error('Error sending push notification:', error)
    return { success: false, error: 'Failed to send notification' }
  }
}
