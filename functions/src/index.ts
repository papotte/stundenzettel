/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
import * as dotenv from 'dotenv'
import type { Request, Response } from 'express'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import {
  FirestoreEvent,
  onDocumentCreated,
  onDocumentUpdated,
} from 'firebase-functions/v2/firestore'
import { onCall, onRequest } from 'firebase-functions/v2/https'
import { Resend } from 'resend'
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

// Callable function for sending team invitation emails
export const sendTeamInvitationEmail = onCall(
  {
    region: 'europe-west1',
    ...(process.env.NODE_ENV === 'production' && {
      secrets: ['RESEND_API_KEY'],
    }),
  },
  async (request) => {
    const { invitationId, teamId, email, role, invitedBy } = request.data

    if (!invitationId || !teamId || !email || !role || !invitedBy) {
      throw new Error('Missing required parameters for email sending')
    }

    try {
      // Get team information
      const teamDoc = await db.collection('teams').doc(teamId).get()

      if (!teamDoc.exists) {
        throw new Error('Team not found for invitation')
      }
      const teamData = teamDoc.data()!

      // Get inviter information
      const inviterDoc = await db
        .collection('teams')
        .doc(teamId)
        .collection('members')
        .doc(invitedBy)
        .get()

      const inviterName = inviterDoc.exists 
        ? inviterDoc.data()?.email || invitedBy 
        : invitedBy

      // Create email content
      const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/team/invitation/${invitationId}`

      console.info('Sending team invitation email', {
        invitationId,
        email,
        teamName: teamData.name,
        inviterName,
        role,
        invitationLink,
      })

      // Initialize Resend client
      const resendApiKey = process.env.RESEND_API_KEY
      if (!resendApiKey) {
        throw new Error('RESEND_API_KEY environment variable is not set')
      }

      const resend = new Resend(resendApiKey)

      // Send email using Resend
      const emailSubject = `Invitation to join team "${teamData.name}"`
      const emailHtml = `
        <h2>Team Invitation</h2>
        <p><strong>${inviterName}</strong> has invited you to join the team <strong>"${teamData.name}"</strong> as a <strong>${role}</strong>.</p>
        
        <p>
          <a href="${invitationLink}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Accept or Decline Invitation
          </a>
        </p>
        
        <p><strong>Important:</strong> This invitation will expire in 7 days.</p>
        
        <hr>
        <p style="color: #666; font-size: 12px;">
          If you did not expect this invitation, you can safely ignore this email.
        </p>
      `

      const emailText = `
${inviterName} has invited you to join the team "${teamData.name}" as a ${role}.

Click the link below to accept or decline this invitation:
${invitationLink}

This invitation will expire in 7 days.

If you did not expect this invitation, you can safely ignore this email.
      `

      const { data, error } = await resend.emails.send({
        from: 'TimeWise Tracker <noreply@papotte.dev>',
        to: [email],
        subject: emailSubject,
        html: emailHtml,
        text: emailText,
      })

      if (error) {
        throw new Error(`Resend API error: ${error.message}`)
      }

      console.info('Email sent successfully via Resend', {
        invitationId,
        email,
        resendId: data?.id,
      })

      // Update invitation status to indicate email was sent successfully
      await db
        .collection('team-invitations')
        .doc(invitationId)
        .update({
          emailSent: true,
          emailSentAt: new Date(),
          emailProvider: 'resend',
          emailId: data?.id,
        })

      return { 
        success: true, 
        emailId: data?.id,
        message: 'Email sent successfully'
      }

    } catch (error) {
      console.error('Failed to send invitation email:', error)
      
      // Update invitation to indicate email failed
      try {
        await db
          .collection('team-invitations')
          .doc(invitationId)
          .update({
            emailSent: false,
            emailError: error instanceof Error ? error.message : 'Unknown error',
            emailAttemptedAt: new Date(),
            emailProvider: 'resend',
          })
      } catch (updateError) {
        console.error('Failed to update invitation status:', updateError)
      }

      throw error // Re-throw to let the client know about the failure
    }
  },
)

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
      console.error('Webhook signature verification failed:', err)
      res.status(400).send('Webhook signature verification failed')
      return
    }

    try {
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          await handleSubscriptionChange(
            event.data.object as Stripe.Subscription,
            stripe,
          )
          break
        case 'invoice.payment_succeeded':
          await handlePaymentSucceeded(
            event.data.object as Stripe.Invoice,
            stripe,
          )
          break
        case 'invoice.payment_failed':
          await handlePaymentFailed(event.data.object as Stripe.Invoice, stripe)
          break
        default:
          console.warn(`Unhandled event type: ${event.type}`)
      }

      res.json({ received: true })
    } catch (error) {
      console.error('Error processing webhook:', error)
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
    console.error('Customer was deleted')
    return
  }

  const firebaseUid = customer.metadata.firebase_uid
  const teamId = customer.metadata.team_id

  if (teamId && firebaseUid) {
    // Handle team subscription
    await handleTeamSubscriptionChange(subscription, teamId)
  } else if (firebaseUid) {
    // Handle individual subscription
    await handleIndividualSubscriptionChange(subscription, firebaseUid)
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
  const customerId = invoice.customer as string
  const customer = await stripe.customers.retrieve(customerId)

  if ('deleted' in customer) {
    console.error('Customer was deleted')
    return
  }

  const firebaseUid = customer.metadata.firebase_uid
  const teamId = customer.metadata.team_id

  // Update payment status
  const paymentData = {
    invoiceId: invoice.id,
    amount: invoice.amount_paid,
    status: 'succeeded',
    paidAt: new Date(),
  }

  await savePaymentToDb(invoice, teamId, firebaseUid, paymentData)
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
  const customerId = invoice.customer as string
  const customer = await stripe.customers.retrieve(customerId)

  if ('deleted' in customer) {
    console.error('Customer was deleted')
    return
  }

  const firebaseUid = customer.metadata.firebase_uid
  const teamId = customer.metadata.team_id

  // Update payment status
  const paymentData = {
    invoiceId: invoice.id,
    amount: invoice.amount_due,
    status: 'failed',
    failedAt: new Date(),
  }
  await savePaymentToDb(invoice, teamId, firebaseUid, paymentData)
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
