#!/usr/bin/env node

const fetch = require('node-fetch')

const BASE_URL = 'http://localhost:9002'

async function testEndpoint(endpoint, method = 'GET', body = null) {
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

    const response = await fetch(`${BASE_URL}${endpoint}`, options)
    const data = await response.json()

    console.log(`✅ ${method} ${endpoint} - Status: ${response.status}`)
    console.log(`   Response:`, JSON.stringify(data, null, 2))
    return data
  } catch (error) {
    console.log(`❌ ${method} ${endpoint} - Error: ${error.message}`)
    return null
  }
}

async function runTests() {
  console.log('🧪 Testing Subscription API Endpoints\n')

  // Test 1: Get Stripe products
  console.log('1. Testing Stripe Products API...')
  await testEndpoint('/api/stripe/products')

  // Test 2: Test checkout session creation (will fail without auth)
  console.log('\n2. Testing Checkout Session Creation...')
  await testEndpoint('/api/create-checkout-session', 'POST', {
    userId: 'test-user',
    priceId: 'price_test123',
    successUrl: 'http://localhost:9002/success',
    cancelUrl: 'http://localhost:9002/cancel',
  })

  // Test 3: Test customer portal creation (will fail without auth)
  console.log('\n3. Testing Customer Portal Creation...')
  await testEndpoint('/api/create-customer-portal-session', 'POST', {
    userId: 'test-user',
    returnUrl: 'http://localhost:9002/subscription',
  })

  console.log('\n📝 Manual Testing Steps:')
  console.log('1. Open http://localhost:9002/pricing in your browser')
  console.log('2. Create products in Stripe Dashboard (test mode)')
  console.log('3. Refresh the pricing page to see products')
  console.log('4. Test the complete subscription flow')
}

runTests()
