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
  onDocumentWritten,
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

// Database instance will be lazily initialized
let db: FirebaseFirestore.Firestore | null = null

// Get database instance (lazy initialization to ensure secrets are available)
const getDb = (): FirebaseFirestore.Firestore => {
  if (!db) {
    const databaseId = getDatabaseId()
    db = getFirestore(databaseId)

    // Log database configuration on first access
    info('Database initialized', {
      databaseId: databaseId || '(default)',
      environment: process.env.NEXT_PUBLIC_ENVIRONMENT || '(not set)',
      hasCustomDatabaseId: !!process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID,
    })
  }
  return db
}

const DEFAULT_TEAM_DRIVER_COMP_PERCENT = 100
const DEFAULT_TEAM_PASSENGER_COMP_PERCENT = 100
const DEFAULT_EXPORT_INCLUDE_DRIVER = true
const DEFAULT_EXPORT_INCLUDE_PASSENGER = true

/** Aligns with `defaultTeamSettings` in `src/services/team-settings-service.ts`. */
type TeamMemberDefaultsPayload = {
  driverCompensationPercent: number
  passengerCompensationPercent: number
  exportIncludeDriverTime: boolean
  exportIncludePassengerTime: boolean
}

function resolvedMemberDefaultsFromTeamSettings(
  data: FirebaseFirestore.DocumentData | undefined,
): TeamMemberDefaultsPayload {
  if (!data) {
    return {
      driverCompensationPercent: DEFAULT_TEAM_DRIVER_COMP_PERCENT,
      passengerCompensationPercent: DEFAULT_TEAM_PASSENGER_COMP_PERCENT,
      exportIncludeDriverTime: DEFAULT_EXPORT_INCLUDE_DRIVER,
      exportIncludePassengerTime: DEFAULT_EXPORT_INCLUDE_PASSENGER,
    }
  }
  return {
    driverCompensationPercent:
      (data.defaultDriverCompensationPercent as number | undefined) ??
      DEFAULT_TEAM_DRIVER_COMP_PERCENT,
    passengerCompensationPercent:
      (data.defaultPassengerCompensationPercent as number | undefined) ??
      DEFAULT_TEAM_PASSENGER_COMP_PERCENT,
    exportIncludeDriverTime:
      (data.exportIncludeDriverTime as boolean | undefined) ??
      DEFAULT_EXPORT_INCLUDE_DRIVER,
    exportIncludePassengerTime:
      (data.exportIncludePassengerTime as boolean | undefined) ??
      DEFAULT_EXPORT_INCLUDE_PASSENGER,
  }
}

function diffMemberDefaults(
  before: TeamMemberDefaultsPayload,
  after: TeamMemberDefaultsPayload,
): Partial<TeamMemberDefaultsPayload> {
  const out: Partial<TeamMemberDefaultsPayload> = {}
  if (before.driverCompensationPercent !== after.driverCompensationPercent) {
    out.driverCompensationPercent = after.driverCompensationPercent
  }
  if (
    before.passengerCompensationPercent !== after.passengerCompensationPercent
  ) {
    out.passengerCompensationPercent = after.passengerCompensationPercent
  }
  if (before.exportIncludeDriverTime !== after.exportIncludeDriverTime) {
    out.exportIncludeDriverTime = after.exportIncludeDriverTime
  }
  if (before.exportIncludePassengerTime !== after.exportIncludePassengerTime) {
    out.exportIncludePassengerTime = after.exportIncludePassengerTime
  }
  return out
}

async function propagateTeamDefaultsToAllMembers(
  teamId: string,
  updates: Partial<TeamMemberDefaultsPayload>,
): Promise<void> {
  if (Object.keys(updates).length === 0) {
    return
  }

  const membersSnap = await getDb()
    .collection('teams')
    .doc(teamId)
    .collection('members')
    .get()

  if (membersSnap.empty) {
    return
  }

  let batch = getDb().batch()
  let opCount = 0
  for (const memberDoc of membersSnap.docs) {
    const uid = memberDoc.id
    const ref = getDb().doc(`users/${uid}/settings/general`)
    batch.set(ref, updates, { merge: true })
    opCount++
    if (opCount >= 500) {
      await batch.commit()
      batch = getDb().batch()
      opCount = 0
    }
  }
  if (opCount > 0) {
    await batch.commit()
  }

  info('Propagated team default field changes to all members', {
    teamId,
    memberCount: membersSnap.size,
    updatedFields: Object.keys(updates),
    ...updates,
  })
}

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
    secrets: [
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'NEXT_PUBLIC_FIREBASE_DATABASE_ID',
    ],
  },
  async (req: Request, res: Response) => {
    // Debug: Log environment variable availability
    info('Webhook handler started', {
      hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
      hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      hasDatabaseId: !!process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID,
      databaseIdValue:
        process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || '(not set)',
    })

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
  try {
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

    const collectionPath = `users/${userId}/subscription`
    const docId = 'current'

    info('Writing individual subscription to database', {
      databaseId: getDatabaseId(),
      userId,
      collectionPath,
      docId,
      subscriptionId: subscription.id,
      status: subscription.status,
    })

    await getDb()
      .collection('users')
      .doc(userId)
      .collection('subscription')
      .doc('current')
      .set(subscriptionData)

    info('Individual subscription successfully written to database', {
      databaseId: getDatabaseId(),
      userId,
      subscriptionId: subscription.id,
    })
  } catch (err) {
    error('Failed to write individual subscription to database', {
      databaseId: getDatabaseId(),
      userId,
      subscriptionId: subscription.id,
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    })
    throw err
  }
}

// Handle team subscription changes
async function handleTeamSubscriptionChange(
  subscription: Stripe.Subscription,
  teamId: string,
) {
  try {
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

    const collectionPath = `teams/${teamId}/subscription`
    const docId = 'current'

    info('Writing team subscription to database', {
      databaseId: getDatabaseId(),
      teamId,
      collectionPath,
      docId,
      subscriptionData,
    })

    await getDb()
      .collection('teams')
      .doc(teamId)
      .collection('subscription')
      .doc('current')
      .set(subscriptionData)

    info('Team subscription successfully written to database', {
      databaseId: getDatabaseId(),
      teamId,
      subscriptionId: subscription.id,
    })
  } catch (err) {
    error('Failed to write team subscription to database', {
      databaseId: getDatabaseId(),
      teamId,
      subscriptionId: subscription.id,
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    })
    throw err
  }
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
      await getDb()
        .collection('teams')
        .doc(teamId)
        .collection('payments')
        .doc(invoice.id)
        .set(paymentData)
    } else if (firebaseUid) {
      await getDb()
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
/** When team defaults (compensation or export columns) change, push resolved values to every member's user settings (admin cannot write other users' docs from the client). */
export const onTeamSettingsWritten = onDocumentWritten(
  {
    document: 'teams/{teamId}/settings/general',
    region: 'europe-west1',
    secrets: ['NEXT_PUBLIC_FIREBASE_DATABASE_ID'],
  },
  async (event) => {
    const teamId = event.params.teamId as string
    const change = event.data
    if (!change?.after.exists) {
      return
    }

    const beforeExists = change.before.exists
    const afterResolved = resolvedMemberDefaultsFromTeamSettings(
      change.after.data(),
    )

    if (!beforeExists) {
      await propagateTeamDefaultsToAllMembers(teamId, afterResolved)
      return
    }

    const beforeResolved = resolvedMemberDefaultsFromTeamSettings(
      change.before.data(),
    )
    const delta = diffMemberDefaults(beforeResolved, afterResolved)
    await propagateTeamDefaultsToAllMembers(teamId, delta)
  },
)

/** New members get current team defaults (compensation + export columns) written to their settings document. */
export const onTeamMemberCreated = onDocumentCreated(
  {
    document: 'teams/{teamId}/members/{memberId}',
    region: 'europe-west1',
    secrets: ['NEXT_PUBLIC_FIREBASE_DATABASE_ID'],
  },
  async (event) => {
    const teamId = event.params.teamId as string
    const memberId = event.params.memberId as string

    const settingsSnap = await getDb()
      .doc(`teams/${teamId}/settings/general`)
      .get()

    const defaults = resolvedMemberDefaultsFromTeamSettings(settingsSnap.data())

    await getDb()
      .doc(`users/${memberId}/settings/general`)
      .set(defaults, { merge: true })

    info('Seeded team defaults for new team member', {
      teamId,
      memberId,
      ...defaults,
    })
  },
)

export const onTeamCreated = onDocumentCreated(
  {
    document: 'teams/{teamId}',
    region: 'europe-west1',
    secrets: ['NEXT_PUBLIC_FIREBASE_DATABASE_ID'],
  },
  async (event: FirestoreEvent<any>) => {
    const teamData = event.data?.data()
    if (!teamData) return

    // Set up team subscription collection
    await getDb()
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
    secrets: ['NEXT_PUBLIC_FIREBASE_DATABASE_ID'],
  },
  async (event: FirestoreEvent<any>) => {
    const beforeData = event.data?.before.data()
    const afterData = event.data?.after.data()

    // If member was just added (before was null, after has data)
    if (!beforeData && afterData) {
      const teamId = event.params.teamId
      const memberId = event.params.memberId

      // Add user to team's users collection for easier querying
      await getDb()
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
