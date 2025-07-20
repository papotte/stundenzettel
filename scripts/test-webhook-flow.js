#!/usr/bin/env node

const crypto = require('crypto')
const fetch = require('node-fetch')
const Stripe = require('stripe')

// Configuration
const FUNCTIONS_URL = 'http://localhost:9001'
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_...'
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_...'

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-06-30.basil',
})

console.log('🔗 Webhook Flow Test Suite\n')

function generateWebhookSignature(payload, secret) {
  const timestamp = Math.floor(Date.now() / 1000)
  const signedPayload = `${timestamp}.${payload}`
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('hex')

  return {
    timestamp,
    signature: `t=${timestamp},v1=${signature}`,
  }
}

async function sendWebhookEvent(event, webhookSecret) {
  const payload = JSON.stringify(event)
  const { signature } = generateWebhookSignature(payload, webhookSecret)

  try {
    const response = await fetch(`${FUNCTIONS_URL}/stripeWebhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': signature,
      },
      body: payload,
    })

    const responseText = await response.text()
    console.log(`   Status: ${response.status}`)
    console.log(`   Response: ${responseText}`)

    return {
      success: response.status === 200,
      status: response.status,
      response: responseText,
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function createTestCustomer() {
  console.log('👤 Creating test customer...')

  const customer = await stripe.customers.create({
    email: 'webhook-test@example.com',
    name: 'Webhook Test User',
    metadata: {
      firebase_uid: 'webhook-test-user-123',
    },
  })

  console.log(`   ✅ Customer created: ${customer.id}`)
  return customer
}

async function createTestProduct() {
  console.log('📦 Creating test product...')

  const product = await stripe.products.create({
    name: 'Webhook Test Product',
    description: 'Product for webhook testing',
  })

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: 999,
    currency: 'usd',
    recurring: {
      interval: 'month',
    },
  })

  console.log(`   ✅ Product: ${product.id}, Price: ${price.id}`)
  return { product, price }
}

async function testSubscriptionCreatedWebhook() {
  console.log('\n1. Testing customer.subscription.created webhook...')

  const customer = await createTestCustomer()
  const { price } = await createTestProduct()

  // Create a subscription
  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: price.id }],
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent'],
  })

  console.log(`   ✅ Subscription created: ${subscription.id}`)

  // Create webhook event
  const event = {
    id: `evt_${Date.now()}`,
    object: 'event',
    api_version: '2025-06-30.basil',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: subscription,
    },
    livemode: false,
    pending_webhooks: 1,
    request: {
      id: `req_${Date.now()}`,
      idempotency_key: null,
    },
    type: 'customer.subscription.created',
  }

  console.log(`   📤 Sending webhook event...`)
  const result = await sendWebhookEvent(event, WEBHOOK_SECRET)

  if (result.success) {
    console.log(`   ✅ Webhook processed successfully`)
  } else {
    console.log(`   ❌ Webhook failed: ${result.response}`)
  }

  return { customer, subscription, result }
}

async function testSubscriptionUpdatedWebhook() {
  console.log('\n2. Testing customer.subscription.updated webhook...')

  // Get existing subscription or create one
  const subscriptions = await stripe.subscriptions.list({ limit: 1 })
  let subscription

  if (subscriptions.data.length > 0) {
    subscription = subscriptions.data[0]
  } else {
    const customer = await createTestCustomer()
    const { price } = await createTestProduct()
    subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: price.id }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
    })
  }

  // Update the subscription (cancel at period end)
  const updatedSubscription = await stripe.subscriptions.update(
    subscription.id,
    {
      cancel_at_period_end: true,
    },
  )

  console.log(`   ✅ Subscription updated: ${updatedSubscription.id}`)

  // Create webhook event
  const event = {
    id: `evt_${Date.now()}`,
    object: 'event',
    api_version: '2025-06-30.basil',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: updatedSubscription,
    },
    livemode: false,
    pending_webhooks: 1,
    request: {
      id: `req_${Date.now()}`,
      idempotency_key: null,
    },
    type: 'customer.subscription.updated',
  }

  console.log(`   📤 Sending webhook event...`)
  const result = await sendWebhookEvent(event, WEBHOOK_SECRET)

  if (result.success) {
    console.log(`   ✅ Webhook processed successfully`)
  } else {
    console.log(`   ❌ Webhook failed: ${result.response}`)
  }

  return { subscription: updatedSubscription, result }
}

async function testPaymentSucceededWebhook() {
  console.log('\n3. Testing invoice.payment_succeeded webhook...')

  // Get existing subscription or create one
  const subscriptions = await stripe.subscriptions.list({ limit: 1 })
  let subscription

  if (subscriptions.data.length > 0) {
    subscription = subscriptions.data[0]
  } else {
    const customer = await createTestCustomer()
    const { price } = await createTestProduct()
    subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: price.id }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
    })
  }

  // Get the latest invoice
  const invoice = await stripe.invoices.retrieve(subscription.latest_invoice)

  console.log(`   ✅ Invoice retrieved: ${invoice.id}`)

  // Create webhook event
  const event = {
    id: `evt_${Date.now()}`,
    object: 'event',
    api_version: '2025-06-30.basil',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: invoice,
    },
    livemode: false,
    pending_webhooks: 1,
    request: {
      id: `req_${Date.now()}`,
      idempotency_key: null,
    },
    type: 'invoice.payment_succeeded',
  }

  console.log(`   📤 Sending webhook event...`)
  const result = await sendWebhookEvent(event, WEBHOOK_SECRET)

  if (result.success) {
    console.log(`   ✅ Webhook processed successfully`)
  } else {
    console.log(`   ❌ Webhook failed: ${result.response}`)
  }

  return { invoice, result }
}

async function testPaymentFailedWebhook() {
  console.log('\n4. Testing invoice.payment_failed webhook...')

  // Create a customer and subscription that will fail
  const customer = await createTestCustomer()
  const { price } = await createTestProduct()

  // Create a subscription with a payment method that will fail
  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: price.id }],
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent'],
  })

  console.log(`   ✅ Subscription created: ${subscription.id}`)

  // Get the invoice
  const invoice = await stripe.invoices.retrieve(subscription.latest_invoice)

  // Create webhook event for failed payment
  const event = {
    id: `evt_${Date.now()}`,
    object: 'event',
    api_version: '2025-06-30.basil',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        ...invoice,
        status: 'open',
        paid: false,
      },
    },
    livemode: false,
    pending_webhooks: 1,
    request: {
      id: `req_${Date.now()}`,
      idempotency_key: null,
    },
    type: 'invoice.payment_failed',
  }

  console.log(`   📤 Sending webhook event...`)
  const result = await sendWebhookEvent(event, WEBHOOK_SECRET)

  if (result.success) {
    console.log(`   ✅ Webhook processed successfully`)
  } else {
    console.log(`   ❌ Webhook failed: ${result.response}`)
  }

  return { invoice, result }
}

async function testTeamSubscriptionWebhook() {
  console.log('\n5. Testing team subscription webhook...')

  const customer = await stripe.customers.create({
    email: 'team-test@example.com',
    name: 'Team Test User',
    metadata: {
      firebase_uid: 'team-test-user-123',
      team_id: 'team-123',
    },
  })

  const { price } = await createTestProduct()

  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: price.id, quantity: 5 }], // Team with 5 members
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
  })

  console.log(`   ✅ Team subscription created: ${subscription.id}`)

  // Create webhook event
  const event = {
    id: `evt_${Date.now()}`,
    object: 'event',
    api_version: '2025-06-30.basil',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: subscription,
    },
    livemode: false,
    pending_webhooks: 1,
    request: {
      id: `req_${Date.now()}`,
      idempotency_key: null,
    },
    type: 'customer.subscription.created',
  }

  console.log(`   📤 Sending webhook event...`)
  const result = await sendWebhookEvent(event, WEBHOOK_SECRET)

  if (result.success) {
    console.log(`   ✅ Team webhook processed successfully`)
  } else {
    console.log(`   ❌ Team webhook failed: ${result.response}`)
  }

  return { customer, subscription, result }
}

async function runWebhookTests() {
  console.log('🚀 Starting Webhook Flow Tests\n')

  // Check if Firebase Functions are running
  try {
    const response = await fetch(`${FUNCTIONS_URL}/`)
    if (response.status !== 200) {
      console.log('❌ Firebase Functions are not running!')
      console.log(
        '   Please start the emulators with: firebase emulators:start',
      )
      return
    }
    console.log('✅ Firebase Functions are running')
  } catch (error) {
    console.log('❌ Cannot connect to Firebase Functions')
    console.log('   Please start the emulators with: firebase emulators:start')
    return
  }

  // Run all webhook tests
  await testSubscriptionCreatedWebhook()
  await testSubscriptionUpdatedWebhook()
  await testPaymentSucceededWebhook()
  await testPaymentFailedWebhook()
  await testTeamSubscriptionWebhook()

  console.log('\n📋 Webhook Testing Summary:')
  console.log('✅ All webhook events have been sent to Firebase Functions')
  console.log('📊 Check Firebase Emulator UI: http://localhost:4000')
  console.log('📝 Check Functions logs in the emulator terminal')
  console.log('🔍 Verify data was written to Firestore collections:')
  console.log('   - users/{userId}/subscription/current')
  console.log('   - teams/{teamId}/subscription/current')
  console.log('   - users/{userId}/payments/{invoiceId}')
  console.log('   - teams/{teamId}/payments/{invoiceId}')
}

// Run the webhook tests
runWebhookTests().catch(console.error)
