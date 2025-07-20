#!/usr/bin/env node

/**
 * Script to add trial periods to existing Stripe products
 * Run with: node scripts/add-trial-periods.js
 */

const Stripe = require('stripe')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-06-30.basil',
})

const TRIAL_PERIOD_DAYS = 14 // Configure this as needed

async function addTrialPeriodsToProducts() {
  console.log('🔄 Adding trial periods to Stripe products...\n')

  try {
    // Get all active products
    const products = await stripe.products.list({
      active: true,
    })

    console.log(`📦 Found ${products.data.length} active products`)

    for (const product of products.data) {
      console.log(`\n🔧 Processing product: ${product.name} (${product.id})`)

      // Get all prices for this product
      const prices = await stripe.prices.list({
        product: product.id,
        active: true,
      })

      console.log(`   Found ${prices.data.length} prices`)

      for (const price of prices.data) {
        // Skip if price already has trial period
        if (price.recurring?.trial_period_days) {
          console.log(
            `   ⏭️  Price ${price.id} already has trial period: ${price.recurring.trial_period_days} days`,
          )
          continue
        }

        // Create a new price with trial period
        try {
          const newPrice = await stripe.prices.create({
            product: product.id,
            unit_amount: price.unit_amount,
            currency: price.currency,
            recurring: {
              interval: price.recurring?.interval || 'month',
              trial_period_days: TRIAL_PERIOD_DAYS,
            },
            metadata: {
              ...price.metadata,
              trial_enabled: 'true',
              trial_days: TRIAL_PERIOD_DAYS.toString(),
            },
          })

          console.log(`   ✅ Created new price with trial: ${newPrice.id}`)
          console.log(
            `      Amount: ${newPrice.unit_amount ? newPrice.unit_amount / 100 : 'N/A'} ${newPrice.currency.toUpperCase()}`,
          )
          console.log(
            `      Trial: ${newPrice.recurring?.trial_period_days} days`,
          )

          // Archive the old price (optional - comment out if you want to keep both)
          // await stripe.prices.update(price.id, { active: false })
          // console.log(`   🗑️  Archived old price: ${price.id}`)
        } catch (error) {
          console.error(
            `   ❌ Error creating trial price for ${price.id}:`,
            error.message,
          )
        }
      }

      // Update product metadata to indicate trial availability
      try {
        await stripe.products.update(product.id, {
          metadata: {
            ...product.metadata,
            trial_enabled: 'true',
            trial_days: TRIAL_PERIOD_DAYS.toString(),
          },
        })
        console.log(`   ✅ Updated product metadata for trials`)
      } catch (error) {
        console.error(`   ❌ Error updating product metadata:`, error.message)
      }
    }

    console.log('\n🎉 Trial period setup complete!')
    console.log('\n📋 Next steps:')
    console.log('1. Update your environment variables:')
    console.log(`   STRIPE_TRIAL_PERIOD_DAYS=${TRIAL_PERIOD_DAYS}`)
    console.log('   STRIPE_TRIAL_ENABLED=true')
    console.log(
      '2. Update your checkout session creation to use trial-enabled prices',
    )
    console.log('3. Test the trial flow with a test subscription')
    console.log('4. Update your pricing page to show trial information')
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

// Alternative: Update existing prices instead of creating new ones
async function updateExistingPricesWithTrials() {
  console.log('🔄 Updating existing Stripe prices with trial periods...\n')

  try {
    const products = await stripe.products.list({
      active: true,
    })

    for (const product of products.data) {
      console.log(`\n🔧 Processing product: ${product.name} (${product.id})`)

      const prices = await stripe.prices.list({
        product: product.id,
        active: true,
      })

      for (const price of prices.data) {
        if (price.recurring?.trial_period_days) {
          console.log(`   ⏭️  Price ${price.id} already has trial period`)
          continue
        }

        try {
          // Note: Stripe doesn't allow updating trial_period_days on existing prices
          // So we need to create new prices and archive old ones
          const newPrice = await stripe.prices.create({
            product: product.id,
            unit_amount: price.unit_amount,
            currency: price.currency,
            recurring: {
              interval: price.recurring?.interval || 'month',
              trial_period_days: TRIAL_PERIOD_DAYS,
            },
            metadata: {
              ...price.metadata,
              trial_enabled: 'true',
              trial_days: TRIAL_PERIOD_DAYS.toString(),
              migrated_from: price.id,
            },
          })

          // Archive the old price
          await stripe.prices.update(price.id, { active: false })

          console.log(
            `   ✅ Migrated price ${price.id} → ${newPrice.id} with trial`,
          )
        } catch (error) {
          console.error(
            `   ❌ Error migrating price ${price.id}:`,
            error.message,
          )
        }
      }
    }

    console.log('\n🎉 Price migration complete!')
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

// Helper function to list current trial status
async function listTrialStatus() {
  console.log('📊 Current trial status of products:\n')

  try {
    const products = await stripe.products.list({
      active: true,
    })

    for (const product of products.data) {
      console.log(`📦 ${product.name} (${product.id})`)

      const prices = await stripe.prices.list({
        product: product.id,
        active: true,
      })

      for (const price of prices.data) {
        const trialDays = price.recurring?.trial_period_days || 'None'
        const amount = price.unit_amount ? price.unit_amount / 100 : 'N/A'
        const interval = price.recurring?.interval || 'N/A'

        console.log(
          `   💰 ${price.id}: ${amount} ${price.currency.toUpperCase()}/${interval} (Trial: ${trialDays} days)`,
        )
      }
      console.log('')
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

// Main execution
async function main() {
  const command = process.argv[2]

  switch (command) {
    case 'add':
      await addTrialPeriodsToProducts()
      break
    case 'update':
      await updateExistingPricesWithTrials()
      break
    case 'status':
      await listTrialStatus()
      break
    default:
      console.log('Usage: node scripts/add-trial-periods.js [command]')
      console.log('Commands:')
      console.log(
        '  add     - Create new prices with trial periods (keep old ones)',
      )
      console.log(
        '  update  - Migrate existing prices to include trial periods',
      )
      console.log('  status  - Show current trial status of all products')
      console.log('\nExample: node scripts/add-trial-periods.js add')
  }
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = {
  addTrialPeriodsToProducts,
  updateExistingPricesWithTrials,
  listTrialStatus,
}
