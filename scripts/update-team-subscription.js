#!/usr/bin/env node

/**
 * Manual Team Subscription Update Script
 *
 * This script allows you to manually update a team subscription in Firestore
 * when the webhook failed to process due to missing metadata.
 *
 * Usage:
 * 1. Set your STRIPE_SECRET_KEY and NEXT_PUBLIC_FIREBASE_PROJECT_ID in .env.production.local
 * 2. Run: node scripts/update-team-subscription.js <subscription_id> <team_id>
 *
 * Example:
 * node scripts/update-team-subscription.js sub_1234567890 team_abc123
 */

const Stripe = require('stripe')
const { initializeApp } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')

// Load environment variables
require('dotenv').config({ path: '.env.production.local' })

// Determine database ID based on environment
const getDatabaseId = () => {
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

// Initialize Firebase Admin
initializeApp({
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  databaseId: getDatabaseId(),
})

const databaseId = getDatabaseId()
const db = getFirestore(databaseId)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-06-30.basil',
})

async function updateTeamSubscription(subscriptionId, teamId) {
  try {
    console.log(`🔄 Fetching subscription ${subscriptionId} from Stripe...`)

    // Fetch the subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)

    console.log(`✅ Found subscription: ${subscription.id}`)
    console.log(`   Status: ${subscription.status}`)
    console.log(`   Customer: ${subscription.customer}`)
    console.log(
      `   Current period start: ${new Date(subscription.start_date * 1000).toISOString()}`,
    )

    // Apply the same logic as handleTeamSubscriptionChange
    const currentPeriodStartTs = subscription.start_date || subscription.created
    const currentPeriodStart = new Date(currentPeriodStartTs * 1000)

    const subscriptionData = {
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customer,
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

    console.log(`\n🔄 Updating team ${teamId} subscription in Firestore...`)
    console.log('Subscription data:', JSON.stringify(subscriptionData, null, 2))

    // Update the team subscription in Firestore
    await db
      .collection('teams')
      .doc(teamId)
      .collection('subscription')
      .doc('current')
      .set(subscriptionData)

    console.log(`✅ Successfully updated team ${teamId} subscription!`)

    // Verify the update
    console.log(`\n🔍 Verifying the update...`)
    const updatedDoc = await db
      .collection('teams')
      .doc(teamId)
      .collection('subscription')
      .doc('current')
      .get()

    if (updatedDoc.exists) {
      console.log('✅ Verification successful! Updated subscription data:')
      console.log(JSON.stringify(updatedDoc.data(), null, 2))
    } else {
      console.log('❌ Verification failed: Document not found')
    }
  } catch (error) {
    console.error('❌ Error updating team subscription:', error.message)

    if (error.type === 'StripeInvalidRequestError') {
      console.log(
        '💡 Make sure the subscription ID is correct and exists in Stripe',
      )
    } else if (error.code === 'not-found') {
      console.log('💡 Make sure the team ID exists in Firestore')
    }

    throw error
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2)

  if (args.length !== 2) {
    console.log(
      '❌ Usage: node scripts/update-team-subscription.js <subscription_id> <team_id>',
    )
    console.log('')
    console.log('Example:')
    console.log(
      '  node scripts/update-team-subscription.js sub_1234567890 team_abc123',
    )
    console.log('')
    console.log('Arguments:')
    console.log(
      '  subscription_id: The Stripe subscription ID (starts with "sub_")',
    )
    console.log('  team_id: The team ID in your Firestore database')
    process.exit(1)
  }

  const [subscriptionId, teamId] = args

  // Validate inputs
  if (!subscriptionId.startsWith('sub_')) {
    console.log(
      '❌ Invalid subscription ID. Stripe subscription IDs start with "sub_"',
    )
    process.exit(1)
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    console.log('❌ STRIPE_SECRET_KEY not found in .env.production.local')
    console.log('Please add your Stripe secret key to .env.production.local')
    process.exit(1)
  }

  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    console.log(
      '❌ NEXT_PUBLIC_FIREBASE_PROJECT_ID not found in .env.production.local',
    )
    console.log('Please add your Firebase project ID to .env.production.local')
    process.exit(1)
  }

  console.log('🚀 Manual Team Subscription Update')
  console.log('=====================================')
  console.log(`Subscription ID: ${subscriptionId}`)
  console.log(`Team ID: ${teamId}`)
  console.log(`Database: ${databaseId || 'default'}`)
  console.log('')

  try {
    await updateTeamSubscription(subscriptionId, teamId)
    console.log('\n🎉 Team subscription update completed successfully!')
  } catch (error) {
    console.log('\n💥 Update failed!')
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  main()
}

module.exports = { updateTeamSubscription }
