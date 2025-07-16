#!/usr/bin/env node

/**
 * Update Stripe Products Metadata Script
 *
 * This script updates existing Stripe products with the correct metadata
 * for the dynamic pricing system to work properly.
 *
 * Usage:
 * 1. Set your STRIPE_SECRET_KEY in .env.local
 * 2. Run: node scripts/update-stripe-metadata.js
 */

const Stripe = require('stripe')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-06-30.basil',
})

const productUpdates = [
  {
    productId: 'prod_Sgs5jc8gopMGuS', // Individual product
    metadata: {
      type: 'individual',
      category: 'time_tracking',
      target_audience: 'freelancers',
      features: 'live_tracking,exports,mobile,smart_suggestions',
    },
  },
  {
    productId: 'prod_Sgs51q871eLVyJ', // Team product
    metadata: {
      type: 'team',
      category: 'team_management',
      target_audience: 'small_businesses',
      features: 'collaboration,admin_dashboard,analytics,centralized_billing',
      max_users: '50',
    },
  },
]

async function updateProductMetadata() {
  console.log('🔄 Updating Stripe products metadata...\n')

  for (const update of productUpdates) {
    try {
      console.log(`Updating product: ${update.productId}`)

      // Update the product metadata
      const product = await stripe.products.update(update.productId, {
        metadata: update.metadata,
      })

      console.log(`✅ Product updated: ${product.name}`)
      console.log(`   Metadata:`, product.metadata)
      console.log('')

      // Also update the prices metadata
      const prices = await stripe.prices.list({
        product: update.productId,
        active: true,
      })

      for (const price of prices.data) {
        const priceMetadata = {
          tier: price.recurring?.interval || 'monthly',
          product_type: update.metadata.type,
          ...(price.recurring?.interval === 'year' && { savings: '20' }),
        }

        await stripe.prices.update(price.id, {
          metadata: priceMetadata,
        })

        console.log(
          `  ✅ Price updated: ${price.id} (${price.unit_amount ? price.unit_amount / 100 : 'per-user'}${price.currency.toUpperCase()}/${price.recurring?.interval})`,
        )
      }

      console.log('')
    } catch (error) {
      console.error(
        `❌ Error updating product ${update.productId}:`,
        error.message,
      )
    }
  }

  console.log('🎉 Stripe products metadata update complete!')
  console.log('\n📋 Next steps:')
  console.log('1. Test the pricing page in your app')
  console.log('2. Verify that features are displayed correctly')
  console.log('3. Test the monthly/yearly toggle')
}

// Run the script
if (require.main === module) {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ STRIPE_SECRET_KEY not found in .env.local')
    console.log('Please add your Stripe secret key to .env.local')
    process.exit(1)
  }

  updateProductMetadata().catch(console.error)
}

module.exports = { updateProductMetadata }
