# Payment System Setup Guide

This guide will help you set up the Stripe payment system for your TimeWise Tracker application.

## Prerequisites

1. A Stripe account (sign up at https://stripe.com)
2. Firebase project with Firestore and Functions enabled
3. Environment variables configured

## Step 1: Stripe Setup

### 1.1 Create Stripe Products and Prices

1. Go to your Stripe Dashboard
2. Navigate to Products > Add Product
3. Create the following products:

#### Individual Monthly Plan

- Name: "Individual Monthly"
- Price: $9.99/month
- Billing: Recurring
- Note the Price ID (starts with `price_`)

#### Individual Yearly Plan

- Name: "Individual Yearly"
- Price: $99.99/year
- Billing: Recurring
- Note the Price ID

#### Team Monthly Plan

- Name: "Team Monthly"
- Price: $4.99/month per user
- Billing: Recurring
- Note the Price ID

#### Team Yearly Plan

- Name: "Team Yearly"
- Price: $49.99/year per user
- Billing: Recurring
- Note the Price ID

### 1.2 Configure Webhooks

1. In Stripe Dashboard, go to Developers > Webhooks
2. Add endpoint: `https://your-region-your-project.cloudfunctions.net/stripeWebhook`
3. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Note the webhook secret (starts with `whsec_`)

## Step 2: Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Stripe Price IDs
NEXT_PUBLIC_STRIPE_INDIVIDUAL_MONTHLY_PRICE_ID=price_your_individual_monthly_price_id
NEXT_PUBLIC_STRIPE_INDIVIDUAL_YEARLY_PRICE_ID=price_your_individual_yearly_price_id
NEXT_PUBLIC_STRIPE_TEAM_MONTHLY_PRICE_ID=price_your_team_monthly_price_id
NEXT_PUBLIC_STRIPE_TEAM_YEARLY_PRICE_ID=price_your_team_yearly_price_id
```

## Step 3: Deploy Firebase Functions

1. Install Firebase CLI if not already installed:

   ```bash
   npm install -g firebase-tools
   ```

2. Deploy the functions:
   ```bash
   firebase deploy --only functions
   ```

## Step 4: Update Firestore Rules

The Firestore rules have been updated to include team and subscription permissions. Deploy them:

```bash
firebase deploy --only firestore:rules
```

## Step 5: Test the Integration

### 5.1 Manual Testing

1. Start your development server:

   ```bash
   npm run dev
   ```

2. Navigate to `/pricing` to see the pricing page
3. Try creating a subscription (use Stripe test cards)
4. Check the `/team` page for team management
5. Verify subscription status in `/settings`

### 5.2 Debugging Scripts

For development and debugging, you can use the scripts in the `scripts/` directory:

```bash
# Verify Stripe setup
node scripts/verify-stripe-setup.js

# Test webhook flow (requires Firebase emulators)
node scripts/test-webhook-flow.js

# Test full subscription flow
node scripts/test-full-subscription-flow.js
```

⚠️ **Note**: These are debugging tools for manual testing, not proper automated tests. For automated testing, use the Jest test suite (`npm test`) and Playwright E2E tests (`npm run test:e2e`).

### 5.3 Automated Testing

For proper automated testing:

```bash
# Unit and integration tests
npm test

# End-to-end tests
npm run test:e2e
```

See `scripts/SUBSCRIPTION_TESTING_GUIDE.md` for detailed testing instructions.

## Test Cards

Use these Stripe test cards for testing:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`

## Features Implemented

### Individual Subscriptions

- Monthly and yearly billing
- Automatic subscription management
- Customer portal integration
- Payment history tracking

### Team Management

- Team creation and management
- Member invitations
- Role-based permissions (Owner, Admin, Member)
- Team subscription management

### Payment Processing

- Stripe Checkout integration
- Webhook handling for subscription events
- Automatic customer creation
- Payment failure handling

### User Interface

- Pricing page with plan comparison
- Team management dashboard
- Subscription status in settings
- Billing portal access

## Troubleshooting

### Common Issues

1. **Webhook not receiving events**: Check the webhook URL and ensure it's publicly accessible
2. **Functions deployment fails**: Make sure you have the correct Firebase project selected
3. **Environment variables not loading**: Restart your development server after adding new variables
4. **Permission denied errors**: Check Firestore rules and ensure they're deployed

### Debugging

1. Check Firebase Functions logs:

   ```bash
   firebase functions:log
   ```

2. Check Stripe webhook events in the dashboard
3. Verify environment variables are loaded correctly
4. Check browser console for any JavaScript errors

## Security Considerations

1. Never expose your Stripe secret key in client-side code
2. Always verify webhook signatures
3. Use proper Firestore rules to secure data
4. Implement proper error handling
5. Use HTTPS in production

## Next Steps

1. Add email notifications for subscription events
2. Implement usage-based billing
3. Add analytics and reporting
4. Create admin dashboard for managing subscriptions
5. Add support for multiple currencies
6. Implement subscription upgrades/downgrades

## Support

For issues with:

- **Stripe**: Check Stripe documentation and support
- **Firebase**: Check Firebase documentation and community forums
- **This implementation**: Check the code comments and this setup guide
