# Scripts Directory

This directory contains debugging, utility, and migration scripts. These are **development tools** for manual testing, debugging, and data migrations, not proper automated tests.

## Migrations

### `migrate-display-name-to-user-doc.js`

**Purpose**: Copy `displayName` from `users/{userId}/settings/general` to `users/{userId}` for public read access (team lists, etc.).

**Prerequisites**: `google-application-credentials.json` in project root (or `GOOGLE_APPLICATION_CREDENTIALS` env var)

**Usage**:

```bash
node scripts/migrate-display-name-to-user-doc.js
```

**When to run**: After deploying the display-name-on-user-doc change. Run once to backfill existing users who already have a display name in settings.

## ⚠️ Important Note

These scripts are designed to help you verify your Stripe integration during development. They are **not** part of your automated test suite. For proper testing, use:

- **Unit/Integration Tests**: `npm test` (Jest)
- **End-to-End Tests**: `npm run test:e2e` (Playwright)

## Available Scripts

### `verify-stripe-setup.js`

**Purpose**: Verify your Stripe configuration and connection

**What it does**:

- Checks environment variables
- Tests Stripe API connection
- Lists available products and prices
- Creates and cleans up a test customer

**Usage**:

```bash
node scripts/verify-stripe-setup.js
```

### `test-webhook-flow.js`

**Purpose**: Test webhook processing with Firebase Functions

**What it does**:

- Creates test customers and subscriptions
- Sends properly signed webhook events
- Tests all webhook event types
- Validates Firestore data updates

**Requirements**: Firebase emulators must be running
**Usage**:

```bash
firebase emulators:start  # In another terminal
node scripts/test-webhook-flow.js
```

### `test-full-subscription-flow.js`

**Purpose**: Comprehensive testing of the entire subscription flow

**What it does**:

- Creates test products in Stripe
- Tests all API endpoints
- Simulates webhook events
- Validates the complete flow

**Usage**:

```bash
node scripts/test-full-subscription-flow.js
```

### `add-trial-periods.js`

**Purpose**: Add trial periods to existing Stripe products

**What it does**:

- Checks current trial status
- Adds trial periods to products
- Updates product metadata

**Usage**:

```bash
# Check current status
node scripts/add-trial-periods.js status

# Add trial periods (creates new prices)
node scripts/add-trial-periods.js add

# Update existing prices (replaces old ones)
node scripts/add-trial-periods.js update
```

### `update-stripe-metadata.js`

**Purpose**: Update metadata on Stripe products and prices

**What it does**:

- Adds metadata to products
- Updates price metadata
- Helps with product organization

**Usage**:

```bash
node scripts/update-stripe-metadata.js
```

## When to Use These Scripts

### During Development

- Setting up Stripe integration for the first time
- Debugging webhook issues
- Testing new features before writing proper tests
- Verifying configuration changes

### During Deployment

- Verifying production Stripe setup
- Testing webhook endpoints
- Validating environment variables

### During Troubleshooting

- Isolating Stripe API issues
- Debugging webhook processing
- Validating data flow

## When NOT to Use These Scripts

- **CI/CD Pipelines**: Use proper automated tests instead
- **Production Monitoring**: Use monitoring tools and alerts
- **Regular Testing**: Use Jest and Playwright test suites
- **Performance Testing**: Use dedicated load testing tools

## Environment Variables Required

Make sure you have these environment variables set in your `.env.local`:

```bash
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Related Documentation

- [Payment Setup Guide](../PAYMENT_SETUP.md)
- [Subscription Testing Guide](SUBSCRIPTION_TESTING_GUIDE.md)
