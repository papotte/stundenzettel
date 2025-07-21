#!/usr/bin/env node

const Stripe = require('stripe')

// Check if we have the required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'STRIPE_SECRET_KEY',
]

console.log('🔍 Checking Stripe Configuration...\n')

// Check environment variables
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.log(`❌ Missing: ${envVar}`)
  } else {
    console.log(`✅ Found: ${envVar}`)
  }
}

console.log('\n🔍 Testing Stripe Connection...\n')

// Test Stripe connection
async function testStripeConnection() {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-06-30.basil',
    })

    // Test 1: List products
    console.log('📦 Testing product listing...')
    const products = await stripe.products.list({ limit: 5 })
    console.log(`✅ Found ${products.data.length} products`)

    if (products.data.length > 0) {
      console.log('📋 Available products:')
      products.data.forEach((product) => {
        console.log(`   - ${product.name} (${product.id})`)
      })
    }

    // Test 2: List prices
    console.log('\n💰 Testing price listing...')
    const prices = await stripe.prices.list({ limit: 10 })
    console.log(`✅ Found ${prices.data.length} prices`)

    if (prices.data.length > 0) {
      console.log('📋 Available prices:')
      prices.data.forEach((price) => {
        const amount = price.unit_amount ? price.unit_amount / 100 : 'N/A'
        const currency = price.currency?.toUpperCase() || 'N/A'
        const interval = price.recurring?.interval || 'N/A'
        console.log(`   - ${price.id}: ${amount} ${currency}/${interval}`)
      })
    }

    // Test 3: Test customer creation
    console.log('\n👤 Testing customer creation...')
    const testCustomer = await stripe.customers.create({
      email: 'test@example.com',
      name: 'Test Customer',
      metadata: { test: 'true' },
    })
    console.log(`✅ Created test customer: ${testCustomer.id}`)

    // Clean up test customer
    await stripe.customers.del(testCustomer.id)
    console.log('🧹 Cleaned up test customer')

    console.log('\n🎉 All Stripe tests passed!')
    console.log('\n📝 Next steps:')
    console.log('1. Start your dev server: npm run dev')
    console.log('2. Navigate to /pricing to see the pricing page')
    console.log(
      '3. Try creating a subscription with test card: 4242 4242 4242 4242',
    )
    console.log('4. Set up webhooks for subscription management')
  } catch (error) {
    console.error('❌ Stripe test failed:', error.message)
    if (error.type === 'StripeAuthenticationError') {
      console.log('💡 Make sure your STRIPE_SECRET_KEY is correct')
    }
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.local' })

testStripeConnection()
