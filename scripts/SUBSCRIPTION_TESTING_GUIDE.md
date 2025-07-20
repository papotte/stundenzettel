# Complete Subscription Flow Testing Guide

This guide will help you test the full subscription purchase flow using Firebase Functions for webhooks.

## Prerequisites

1. **Firebase Project Setup**
   - Firebase project configured
   - Firestore database created
   - Firebase Functions deployed or running locally

2. **Stripe Account Setup**
   - Stripe test account with API keys
   - Products and prices created in Stripe Dashboard
   - Webhook endpoint configured

3. **Environment Variables**
   ```bash
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

## Step 1: Start the Development Environment

### 1.1 Start Firebase Emulators

```bash
firebase emulators:start
```

This will start:

- Functions emulator on port 9001
- Firestore emulator on port 8080
- Emulator UI on port 4000

### 1.2 Start the Next.js Development Server

```bash
npm run dev
```

This will start the app on port 9002.

## Step 2: Debugging Scripts (Manual Testing)

⚠️ **Important**: The scripts in the `scripts/` directory are **debugging tools** for manual testing and development, not proper automated tests. They are designed to help you verify your Stripe integration during development.

### 2.1 Verify Stripe Setup

```bash
node scripts/verify-stripe-setup.js
```

This debugging script:

- Checks environment variables
- Tests Stripe API connection
- Lists available products and prices
- Creates and cleans up a test customer

### 2.2 Test Webhook Flow (Debugging)

```bash
node scripts/test-webhook-flow.js
```

This debugging script:

- Creates test customers and subscriptions
- Sends properly signed webhook events
- Tests all webhook event types
- Validates Firestore data updates

**Note**: Requires Firebase emulators to be running.

### 2.3 Test Full Subscription Flow (Debugging)

```bash
node scripts/test-full-subscription-flow.js
```

This comprehensive debugging script:

- Creates test products in Stripe
- Tests all API endpoints
- Simulates webhook events
- Validates the complete flow

## Step 3: Proper Testing Approaches

### 3.1 Unit Tests

For proper automated testing, use the existing Jest test suite:

```bash
npm test
```

Key test files:

- `src/services/__tests__/stripe-service.test.ts` - Stripe service tests
- `src/services/__tests__/payment-service.test.ts` - Payment service tests
- `src/app/api/__tests__/` - API route tests
- `src/components/__tests__/` - Component tests

### 3.2 Integration Tests

For integration testing, consider:

1. **API Route Testing**: Test your Next.js API routes with mocked Stripe responses
2. **Component Testing**: Test pricing components with mocked data
3. **Service Testing**: Test your services with mocked external dependencies

### 3.3 End-to-End Tests

For E2E testing, use Playwright:

```bash
npm run test:e2e
```

Key E2E test files:

- `e2e/subscription.spec.ts` - Subscription flow tests
- `e2e/checkout.spec.ts` - Checkout process tests

### 3.4 Manual Testing Flow

For manual testing during development:

#### 3.4.1 Pricing Page Test

1. Open `http://localhost:9002/pricing`
2. Verify pricing plans are displayed
3. Check that prices are fetched from Stripe
4. Verify "Choose Plan" buttons are present

#### 3.4.2 Authentication Flow

1. Click "Choose Plan" on any plan
2. Verify redirect to login page if not authenticated
3. Login with test user
4. Verify redirect back to pricing page

#### 3.4.3 Checkout Flow

1. Click "Choose Plan" while authenticated
2. Verify redirect to Stripe Checkout
3. Use test card: `4242 4242 4242 4242`
4. Complete payment
5. Verify redirect to success page

#### 3.4.4 Subscription Management

1. Navigate to `/subscription`
2. Verify subscription details are displayed
3. Test "Manage Billing" button
4. Verify customer portal access

#### 3.4.5 Subscription Guard Test

1. Navigate to protected pages
2. Verify subscription guard works
3. Test access with/without subscription

## Step 4: Webhook Testing

### 4.1 Real Webhook Testing

To test with real Stripe webhooks:

1. **Set up Stripe CLI**

   ```bash
   stripe listen --forward-to localhost:9001/stripeWebhook
   ```

2. **Create a test subscription**
   - Use the Stripe Dashboard
   - Or use the debugging scripts above

3. **Monitor webhook events**
   - Check Firebase Functions logs
   - Verify Firestore data updates

### 4.2 Webhook Event Types to Test

#### Individual Subscriptions

- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

#### Team Subscriptions

- Same events as individual, but with team metadata
- Verify team-specific data storage

## Step 5: Data Validation

### 5.1 Check Firestore Collections

#### Individual Subscriptions

```
users/{userId}/subscription/current
{
  stripeSubscriptionId: "sub_...",
  stripeCustomerId: "cus_...",
  status: "active",
  currentPeriodStart: Timestamp,
  currentPeriodEnd: Timestamp,
  cancelAtPeriodEnd: false,
  priceId: "price_...",
  updatedAt: Timestamp
}
```

#### Team Subscriptions

```
teams/{teamId}/subscription/current
{
  stripeSubscriptionId: "sub_...",
  stripeCustomerId: "cus_...",
  status: "active",
  currentPeriodStart: Timestamp,
  currentPeriodEnd: Timestamp,
  cancelAtPeriodEnd: false,
  priceId: "price_...",
  quantity: 5,
  updatedAt: Timestamp
}
```

#### Payment Records

```
users/{userId}/payments/{invoiceId}
{
  invoiceId: "in_...",
  amount: 999,
  status: "succeeded",
  paidAt: Timestamp
}
```

### 5.2 Verify Data in Firebase Emulator UI

1. Open `http://localhost:4000`
2. Navigate to Firestore
3. Check the collections mentioned above
4. Verify data is properly structured

## Step 6: Test Cards

### Success Cards

- `4242 4242 4242 4242` - Standard success
- `4000 0000 0000 3220` - 3D Secure authentication required

### Failure Cards

- `4000 0000 0000 0002` - Generic decline
- `4000 0000 0000 9995` - Insufficient funds

## Troubleshooting

### Common Issues

#### 1. Firebase Functions Not Running

**Symptoms**: 404 errors when calling functions
**Solution**:

```bash
firebase emulators:start
```

#### 2. Webhook Signature Verification Failed

**Symptoms**: 400 errors in webhook logs
**Solution**:

- Verify `STRIPE_WEBHOOK_SECRET` is correct
- Use Stripe CLI for real webhook testing
- Check webhook endpoint URL

#### 3. Products Not Loading

**Symptoms**: Empty pricing page
**Solution**:

- Verify Stripe products are created
- Check `STRIPE_SECRET_KEY` is correct
- Verify API permissions

#### 4. Subscription Not Updating

**Symptoms**: Payment successful but no subscription data
**Solution**:

- Check webhook events in Stripe Dashboard
- Verify Firebase Functions logs
- Check Firestore rules

### Debug Steps

1. **Check Browser Console**
   - Look for JavaScript errors
   - Check network requests

2. **Check Stripe Dashboard**
   - Events tab for webhook delivery
   - Customers tab for customer creation
   - Subscriptions tab for subscription status

3. **Check Firebase Functions Logs**
   - Look for webhook processing logs
   - Check for errors in subscription handling

4. **Check Firestore Data**
   - Use Firebase Emulator UI
   - Verify collections and documents

### Environment Variables Checklist

```bash
# Required for Stripe integration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Required for Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...
```

## Monitoring and Logs

### Firebase Emulator UI

- URL: `http://localhost:4000`
- Functions logs
- Firestore data
- Authentication status

### Stripe Dashboard

- URL: `https://dashboard.stripe.com/test/`
- Events and webhooks
- Customers and subscriptions
- Payment intents

### Terminal Logs

- Firebase Functions logs in emulator terminal
- Next.js development server logs
- Debug script outputs

## Next Steps

After successful testing:

1. **Deploy to Production**

   ```bash
   firebase deploy
   ```

2. **Set up Production Webhooks**
   - Configure webhook endpoint in Stripe Dashboard
   - Update environment variables
   - Test with real payments

3. **Monitor Production**
   - Set up error monitoring
   - Configure alerts for failed webhooks
   - Monitor subscription metrics

## Additional Resources

- [Stripe Webhook Testing](https://stripe.com/docs/webhooks/test)
- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [Stripe Test Cards](https://stripe.com/docs/testing#cards)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)
