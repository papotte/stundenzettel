/**
 * Import function triggers from their respective submodules:
 *
 * import {onRequest} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
import * as dotenv from 'dotenv'
import type { Request, Response } from 'express'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { error, info, warn } from 'firebase-functions/logger'
import {
  FirestoreEvent,
  onDocumentCreated,
  onDocumentUpdated,
} from 'firebase-functions/v2/firestore'
import { onRequest } from 'firebase-functions/v2/https'
import Stripe from 'stripe'

dotenv.config({ path: '.env.local' })

// Initialize Firebase Admin
initializeApp()
// Determine database ID based on environment
const getDatabaseId = (): string => {
  // For e2e tests, always use test-database
  if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'test') {
    return 'test-database'
  }

  const customDatabaseId = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID

  // If a custom database ID is explicitly set, use it
  if (customDatabaseId) {
    return customDatabaseId
  }

  return '' // Empty string means default database
}

const databaseId = getDatabaseId()

const db = getFirestore(databaseId)

interface Payment {
  invoiceId: string
  amount: number
  status: string
  paidAt?: Date
  failedAt?: Date
}

// Stripe webhook handler
export const stripeWebhook = onRequest(
  {
    region: 'europe-west1',
    cors: false,
    maxInstances: 10,
    ...(process.env.NODE_ENV === 'production' && {
      secrets: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'],
    }),
  },
  async (req: Request, res: Response) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-06-30.basil',
    })
    const sig = req.headers['stripe-signature']
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

    if (!sig) {
      res.status(400).send('Missing stripe-signature header')
      return
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(
        (req as any).rawBody,
        sig,
        endpointSecret,
      )
    } catch (err) {
      error('Webhook signature verification failed:', err)
      res.status(400).send('Webhook signature verification failed')
      return
    }

    try {
      // Log webhook event details
      info('Webhook received', {
        eventType: event.type,
        eventId: event.id,
        eventCreated: new Date(event.created * 1000).toISOString(),
        livemode: event.livemode,
        apiVersion: event.api_version,
      })

      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          info('Processing subscription event', { eventType: event.type })
          await handleSubscriptionChange(
            event.data.object as Stripe.Subscription,
            stripe,
          )
          break
        case 'invoice.payment_succeeded':
          info('Processing payment succeeded event')
          await handlePaymentSucceeded(
            event.data.object as Stripe.Invoice,
            stripe,
          )
          break
        case 'invoice.payment_failed':
          info('Processing payment failed event')
          await handlePaymentFailed(event.data.object as Stripe.Invoice, stripe)
          break
        default:
          warn('Unhandled event type', { eventType: event.type })
      }

      info('Webhook processed successfully', { eventId: event.id })
      res.json({ received: true })
    } catch (err) {
      error('Error processing webhook', {
        eventId: event.id,
        eventType: event.type,
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
        eventData: event.data,
      })
      res.status(500).send('Webhook processing failed')
    }
  },
)

// Handle subscription changes
async function handleSubscriptionChange(
  subscription: Stripe.Subscription,
  stripe: Stripe,
) {
  const customerId = subscription.customer as string
  const customer = await stripe.customers.retrieve(customerId)

  if ('deleted' in customer) {
    error('Customer was deleted')
    return
  }

  // Add comprehensive logging for debugging
  info('Processing subscription', {
    subscriptionId: subscription.id,
    customerId,
    customerEmail: customer.email,
    customerMetadata: customer.metadata,
  })

  const firebaseUid = customer.metadata.firebase_uid
  const teamId = customer.metadata.team_id

  // Defensive checks for missing metadata
  if (!firebaseUid) {
    error('Missing firebase_uid in customer metadata', {
      subscriptionId: subscription.id,
      customerId,
      customerEmail: customer.email,
      availableMetadataKeys: Object.keys(customer.metadata),
      customerObject: {
        id: customer.id,
        email: customer.email,
        metadata: customer.metadata,
        created: customer.created,
      },
    })

    // Don't process the webhook if we can't identify the user
    return
  }

  if (teamId && firebaseUid) {
    // Handle team subscription
    info('Processing team subscription', { teamId, firebaseUid })
    await handleTeamSubscriptionChange(subscription, teamId)
  } else if (firebaseUid) {
    // Handle individual subscription
    info('Processing individual subscription', { firebaseUid })
    await handleIndividualSubscriptionChange(subscription, firebaseUid)
  } else {
    error('Incomplete metadata for subscription', {
      subscriptionId: subscription.id,
      firebaseUid,
      teamId,
    })
  }
}

// Handle individual subscription changes
async function handleIndividualSubscriptionChange(
  subscription: Stripe.Subscription,
  userId: string,
) {
  const currentPeriodStartTs = subscription.start_date || subscription.created
  const currentPeriodStart = new Date(currentPeriodStartTs * 1000)

  const subscriptionData = {
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: subscription.customer as string,
    status: subscription.status,
    currentPeriodStart: currentPeriodStart,
    cancelAt: subscription.cancel_at
      ? new Date(subscription.cancel_at * 1000)
      : null,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    priceId: subscription.items.data[0]?.price.id,
    updatedAt: new Date(),
  }

  await db
    .collection('users')
    .doc(userId)
    .collection('subscription')
    .doc('current')
    .set(subscriptionData)
}

// Handle team subscription changes
async function handleTeamSubscriptionChange(
  subscription: Stripe.Subscription,
  teamId: string,
) {
  const currentPeriodStartTs = subscription.start_date || subscription.created
  const currentPeriodStart = new Date(currentPeriodStartTs * 1000)

  const subscriptionData = {
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: subscription.customer as string,
    status: subscription.status,
    currentPeriodStart: currentPeriodStart,
    cancelAt: subscription.cancel_at
      ? new Date(subscription.cancel_at * 1000)
      : null,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    priceId: subscription.items.data[0]?.price.id,
    quantity: subscription.items.data[0]?.quantity || 0,
    updatedAt: new Date(),
  }

  await db
    .collection('teams')
    .doc(teamId)
    .collection('subscription')
    .doc('current')
    .set(subscriptionData)
}

// Handle successful payments
async function handlePaymentSucceeded(invoice: Stripe.Invoice, stripe: Stripe) {
  info('Processing payment succeeded', {
    invoiceId: invoice.id,
    amountPaid: invoice.amount_paid,
    currency: invoice.currency,
  })

  const customerId = invoice.customer as string
  const customer = await stripe.customers.retrieve(customerId)

  if ('deleted' in customer) {
    error('Customer was deleted', { customerId })
    return
  }

  info('Customer details', {
    customerId,
    customerEmail: customer.email,
    customerMetadata: customer.metadata,
  })

  const firebaseUid = customer.metadata.firebase_uid
  const teamId = customer.metadata.team_id

  if (!firebaseUid) {
    error('Missing firebase_uid in customer metadata for invoice', {
      invoiceId: invoice.id,
    })
    return
  }

  // Update payment status
  const paymentData = {
    invoiceId: invoice.id,
    amount: invoice.amount_paid,
    status: 'succeeded',
    paidAt: new Date(),
  }

  info('Saving payment data', { paymentData })
  await savePaymentToDb(invoice, teamId, firebaseUid, paymentData)
  info('Payment data saved successfully')
}

async function savePaymentToDb(
  invoice: Stripe.Invoice,
  teamId: string,
  firebaseUid: string,
  paymentData: Partial<Payment>,
) {
  if (invoice.id) {
    if (teamId && firebaseUid) {
      await db
        .collection('teams')
        .doc(teamId)
        .collection('payments')
        .doc(invoice.id)
        .set(paymentData)
    } else if (firebaseUid) {
      await db
        .collection('users')
        .doc(firebaseUid)
        .collection('payments')
        .doc(invoice.id)
        .set(paymentData)
    }
  }
}

// Handle failed payments
async function handlePaymentFailed(invoice: Stripe.Invoice, stripe: Stripe) {
  info('Processing payment failed', {
    invoiceId: invoice.id,
    amountDue: invoice.amount_due,
    currency: invoice.currency,
  })

  const customerId = invoice.customer as string
  const customer = await stripe.customers.retrieve(customerId)

  if ('deleted' in customer) {
    error('Customer was deleted', { customerId })
    return
  }

  info('Customer details', {
    customerId,
    customerEmail: customer.email,
    customerMetadata: customer.metadata,
  })

  const firebaseUid = customer.metadata.firebase_uid
  const teamId = customer.metadata.team_id

  if (!firebaseUid) {
    error('Missing firebase_uid in customer metadata for invoice', {
      invoiceId: invoice.id,
    })
    return
  }

  // Update payment status
  const paymentData = {
    invoiceId: invoice.id,
    amount: invoice.amount_due,
    status: 'failed',
    failedAt: new Date(),
  }

  info('Saving failed payment data', { paymentData })
  await savePaymentToDb(invoice, teamId, firebaseUid, paymentData)
  info('Failed payment data saved successfully')
}

// Firestore triggers for team management
export const onTeamCreated = onDocumentCreated(
  {
    document: 'teams/{teamId}',
    region: 'europe-west1',
  },
  async (event: FirestoreEvent<any>) => {
    const teamData = event.data?.data()
    if (!teamData) return

    // Set up team subscription collection
    await db
      .collection('teams')
      .doc(event.params.teamId)
      .collection('subscription')
      .doc('current')
      .set({
        status: 'inactive',
        createdAt: new Date(),
      })
  },
)

export const onTeamMemberAdded = onDocumentUpdated(
  {
    document: 'teams/{teamId}/members/{memberId}',
    region: 'europe-west1',
  },
  async (event: FirestoreEvent<any>) => {
    const beforeData = event.data?.before.data()
    const afterData = event.data?.after.data()

    // If member was just added (before was null, after has data)
    if (!beforeData && afterData) {
      const teamId = event.params.teamId
      const memberId = event.params.memberId

      // Add user to team's users collection for easier querying
      await db
        .collection('teams')
        .doc(teamId)
        .collection('users')
        .doc(memberId)
        .set({
          email: afterData.email,
          role: afterData.role,
          joinedAt: new Date(),
        })
    }
  },
)
