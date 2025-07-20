#!/usr/bin/env node

const fetch = require('node-fetch')
const Stripe = require('stripe')

// Configuration
const BASE_URL = 'http://localhost:9002'
const FUNCTIONS_URL = 'http://localhost:9001'
const TEST_USER_ID = 'test-user-123'
const TEST_EMAIL = 'test@example.com'

// Initialize Stripe (you'll need to set your test keys)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_...', {
  apiVersion: '2025-06-30.basil',
})

console.log('🧪 Full Subscription Flow Test Suite\n')

async function testEndpoint(
  endpoint,
  method = 'GET',
  body = null,
  baseUrl = BASE_URL,
) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    }

    if (body) {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(`${baseUrl}${endpoint}`, options)
    let data

    try {
      data = await response.json()
    } catch (e) {
      data = await response.text()
    }

    console.log(`✅ ${method} ${endpoint} - Status: ${response.status}`)
    if (typeof data === 'object') {
      console.log(`   Response:`, JSON.stringify(data, null, 2))
    } else {
      console.log(`   Response:`, data)
    }
    return { success: true, data, status: response.status }
  } catch (error) {
    console.log(`❌ ${method} ${endpoint} - Error: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function createTestProducts() {
  console.log('📦 Creating test products in Stripe...')

  try {
    // Create a test product
    const product = await stripe.products.create({
      name: 'Test Subscription',
      description: 'Test subscription for development',
    })

    // Create a price for the product
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: 999, // $9.99
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
    })

    console.log(`✅ Created product: ${product.id}`)
    console.log(`✅ Created price: ${price.id}`)

    return { productId: product.id, priceId: price.id }
  } catch (error) {
    console.log(`❌ Failed to create test products: ${error.message}`)
    return null
  }
}

async function testPricingPage() {
  console.log('\n1. Testing Pricing Page...')

  const result = await testEndpoint('/api/stripe/products')

  if (result.success && result.data.products) {
    console.log(`   Found ${result.data.products.length} products`)
    result.data.products.forEach((product) => {
      console.log(`   - ${product.name}: ${product.description}`)
    })
  }

  return result.success
}

async function testCheckoutSessionCreation() {
  console.log('\n2. Testing Checkout Session Creation...')

  // First, create test products if needed
  const products = await createTestProducts()
  if (!products) {
    console.log('   Skipping checkout test - no products available')
    return false
  }

  const result = await testEndpoint('/api/create-checkout-session', 'POST', {
    userId: TEST_USER_ID,
    priceId: products.priceId,
    successUrl: `${BASE_URL}/subscription?success=true`,
    cancelUrl: `${BASE_URL}/pricing?canceled=true`,
  })

  if (result.success && result.data.sessionId) {
    console.log(`   ✅ Checkout session created: ${result.data.sessionId}`)
    console.log(`   🔗 Checkout URL: ${result.data.url}`)
    return result.data
  }

  return false
}

async function testCustomerPortalCreation() {
  console.log('\n3. Testing Customer Portal Creation...')

  const result = await testEndpoint(
    '/api/create-customer-portal-session',
    'POST',
    {
      userId: TEST_USER_ID,
      returnUrl: `${BASE_URL}/subscription`,
    },
  )

  if (result.success && result.data.url) {
    console.log(`   ✅ Customer portal session created`)
    console.log(`   🔗 Portal URL: ${result.data.url}`)
    return result.data
  }

  return false
}

async function simulateWebhookEvent(eventType, eventData) {
  console.log(`\n4. Simulating ${eventType} webhook event...`)

  try {
    // Create a test webhook event
    const event = {
      id: `evt_${Date.now()}`,
      object: 'event',
      api_version: '2025-06-30.basil',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: eventData,
      },
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: `req_${Date.now()}`,
        idempotency_key: null,
      },
      type: eventType,
    }

    // Note: In a real scenario, you would need to sign this with your webhook secret
    // For testing purposes, we'll just log what would be sent
    console.log(`   📤 Would send webhook event: ${eventType}`)
    console.log(`   📋 Event data:`, JSON.stringify(event, null, 2))

    return event
  } catch (error) {
    console.log(`   ❌ Failed to simulate webhook: ${error.message}`)
    return null
  }
}

async function testSubscriptionFlow() {
  console.log('\n5. Testing Complete Subscription Flow...')

  // Step 1: Create a customer
  console.log('   Step 1: Creating customer...')
  const customer = await stripe.customers.create({
    email: TEST_EMAIL,
    name: 'Test User',
    metadata: {
      firebase_uid: TEST_USER_ID,
    },
  })
  console.log(`   ✅ Customer created: ${customer.id}`)

  // Step 2: Create a subscription
  console.log('   Step 2: Creating subscription...')
  const products = await createTestProducts()
  if (!products) {
    console.log('   ❌ Cannot create subscription - no products available')
    return false
  }

  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: products.priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent'],
  })
  console.log(`   ✅ Subscription created: ${subscription.id}`)

  // Step 3: Simulate webhook events
  console.log('   Step 3: Simulating webhook events...')

  // Simulate subscription.created
  await simulateWebhookEvent('customer.subscription.created', subscription)

  // Simulate invoice.payment_succeeded
  const invoice = await stripe.invoices.retrieve(subscription.latest_invoice)
  await simulateWebhookEvent('invoice.payment_succeeded', invoice)

  return { customer, subscription, products }
}

async function testFirebaseFunctions() {
  console.log('\n6. Testing Firebase Functions...')

  // Test if functions are running
  const result = await testEndpoint('/', 'GET', null, FUNCTIONS_URL)

  if (result.success) {
    console.log('   ✅ Firebase Functions are running')
  } else {
    console.log('   ❌ Firebase Functions are not accessible')
    console.log('   💡 Make sure to run: firebase emulators:start')
  }

  return result.success
}

async function runFullTest() {
  console.log('🚀 Starting Full Subscription Flow Test\n')

  // Check if services are running
  console.log('🔍 Checking service availability...')

  const functionsRunning = await testFirebaseFunctions()
  const pricingWorking = await testPricingPage()

  if (!functionsRunning) {
    console.log('\n❌ Firebase Functions are not running!')
    console.log('   Please start the emulators with: firebase emulators:start')
    return
  }

  if (!pricingWorking) {
    console.log('\n⚠️  Pricing page is not working properly')
    console.log('   This might be due to missing Stripe configuration')
  }

  // Run the main tests
  await testCheckoutSessionCreation()
  await testCustomerPortalCreation()
  await testSubscriptionFlow()

  console.log('\n📋 Manual Testing Checklist:')
  console.log('1. Open http://localhost:9002/pricing')
  console.log('2. Verify products are displayed')
  console.log('3. Click "Choose Plan" and complete checkout')
  console.log('4. Verify redirect to success page')
  console.log('5. Check subscription status in Firebase')
  console.log('6. Test customer portal access')
  console.log('7. Verify webhook events in Firebase Functions logs')

  console.log('\n🔧 Test Cards:')
  console.log('   Success: 4242 4242 4242 4242')
  console.log('   3D Secure: 4000 0000 0000 3220')
  console.log('   Decline: 4000 0000 0000 0002')

  console.log('\n📊 Monitoring:')
  console.log('   Firebase Emulator UI: http://localhost:4000')
  console.log('   Functions Logs: Check terminal running firebase emulators')
  console.log('   Stripe Dashboard: https://dashboard.stripe.com/test/events')
}

// Run the tests
runFullTest().catch(console.error)
