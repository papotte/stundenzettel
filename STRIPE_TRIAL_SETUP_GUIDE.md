# Stripe Trial Period Setup Guide

## Option 1: Manual Setup via Stripe Dashboard

### Step 1: Access Your Stripe Dashboard

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Log in to your account
3. Make sure you're in the correct mode (Test/Live)

### Step 2: Navigate to Products

1. In the left sidebar, click on **"Products"**
2. You'll see a list of your active products

### Step 3: Edit Each Product

For each product you want to add trial periods to:

1. **Click on the product name** to open it
2. **Find the pricing section** - you'll see your current prices
3. **For each price**:
   - Click on the price to edit it
   - Look for the **"Trial period"** section
   - Enter the number of days (e.g., 14)
   - Click **"Save"**

### Step 4: Update Product Metadata (Optional)

1. In the product settings, scroll down to **"Additional options"**
2. Add metadata:
   - Key: `trial_enabled`, Value: `true`
   - Key: `trial_days`, Value: `14`

### Step 5: Verify Changes

1. Go back to the product list
2. Click on each product to verify trial periods are set
3. Test creating a subscription to ensure trials work

## Option 2: Automated Setup via Script

### Prerequisites

1. Make sure you have the Stripe Node.js library installed:

   ```bash
   npm install stripe
   ```

2. Ensure your `.env.local` file has your Stripe secret key:
   ```bash
   STRIPE_SECRET_KEY=sk_test_your_secret_key_here
   ```

### Run the Script

1. **Check current trial status**:

   ```bash
   node scripts/add-trial-periods.js status
   ```

2. **Add trial periods (creates new prices, keeps old ones)**:

   ```bash
   node scripts/add-trial-periods.js add
   ```

3. **Migrate existing prices (replaces old prices with trial-enabled ones)**:
   ```bash
   node scripts/add-trial-periods.js update
   ```

## Important Notes

### Trial Period Limitations

- **Cannot be modified**: Once a price has a trial period, it cannot be changed
- **New prices required**: To change trial duration, you must create new prices
- **Archiving old prices**: Consider archiving old non-trial prices to avoid confusion

### Trial Period Best Practices

- **14 days is standard**: Most SaaS companies use 14-day trials
- **Clear communication**: Make sure users know about the trial period
- **Graceful expiration**: Handle trial expiration with clear messaging
- **Easy conversion**: Make it easy for users to convert to paid plans

### Testing Trials

1. **Use test cards**: Always test with Stripe test cards
2. **Monitor webhooks**: Ensure trial events are handled properly
3. **Check billing**: Verify that billing starts after trial ends
4. **Test cancellation**: Ensure users can cancel during trial

## Environment Variables to Add

After setting up trials, add these to your `.env.local`:

```bash
# Trial Configuration
STRIPE_TRIAL_PERIOD_DAYS=14
STRIPE_TRIAL_ENABLED=true
```

## Next Steps

After setting up trial periods in Stripe:

1. **Update your checkout session creation** to use trial-enabled prices
2. **Modify your subscription service** to handle trial status
3. **Update your UI** to show trial information
4. **Test the complete trial flow**
5. **Monitor trial metrics** in Stripe Dashboard

## Troubleshooting

### Common Issues

1. **"Trial period cannot be modified"**
   - Solution: Create new prices with trial periods

2. **"Price not found"**
   - Solution: Make sure you're using the correct price IDs

3. **"Trial not working"**
   - Solution: Check that prices have `trial_period_days` set
   - Verify webhook handling for trial events

4. **"Billing starts immediately"**
   - Solution: Ensure `trial_period_days` is set correctly
   - Check that the price is being used in checkout

### Support Resources

- [Stripe Trial Periods Documentation](https://stripe.com/docs/billing/subscriptions/trials)
- [Stripe Webhook Events](https://stripe.com/docs/api/events)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
