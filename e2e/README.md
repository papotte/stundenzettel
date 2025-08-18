# E2E Testing with Firebase Emulators

This directory contains end-to-end tests that run against Firebase emulators to ensure realistic testing without affecting production data.

## Setup

### Prerequisites

1. **Firebase CLI**: Make sure you have Firebase CLI installed globally

   ```bash
   npm install -g firebase-tools
   ```

2. **Firebase Project**: Ensure you're logged into the correct Firebase project
   ```bash
   firebase login
   firebase use <your-project-id>
   ```

### Environment Variables

The e2e tests automatically use the `test-database` in Firebase emulators. Make sure these environment variables are set:

- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: Your Firebase project ID
- `NEXT_PUBLIC_FIREBASE_API_KEY`: Your Firebase API key
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: Your Firebase auth domain
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: Your Firebase storage bucket
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: Your Firebase messaging sender ID
- `NEXT_PUBLIC_FIREBASE_APP_ID`: Your Firebase app ID

## Running Tests

### Quick Start

The easiest way to run e2e tests is using the npm scripts:

```bash
# Run all e2e tests (starts emulators automatically)
npm run test:e2e

# Run e2e tests in debug mode
npm run test:e2e:debug

# Run e2e tests with fresh emulator data
npm run test:e2e:fresh
```

### Manual Emulator Management

If you prefer to manage emulators manually:

1. **Start emulators in one terminal:**

   ```bash
   npm run emulators:start
   ```

2. **Run tests in another terminal:**
   ```bash
   playwright test
   ```

## Test Database Management

### Automatic Cleanup

The e2e tests automatically:

1. **Clean the test database before all tests** (via `global-setup.ts`)
2. **Use the `test-database`** instead of the default database
3. **Preserve authentication users** and system collections

### Manual Cleanup

If you need to manually clean the test database:

```typescript
import { cleanupAfterTest } from './test-teardown'

// Clean up after a specific test
await cleanupAfterTest()
```

### Test Teardown

To ensure your tests clean up after themselves, import and use the teardown utilities:

```typescript
import { expect, test } from '@playwright/test'

import { cleanupAfterAllTests, cleanupAfterTest } from './test-teardown'

test.describe('My Test Suite', () => {
  // Clean up after each test
  test.afterEach(async () => {
    await cleanupAfterTest()
  })

  // Clean up after all tests in the suite
  test.afterAll(async () => {
    await cleanupAfterAllTests()
  })

  test('my test', async ({ page }) => {
    // Your test code here
  })
})
```

**Note**: The cleanup logic is shared between global setup and test teardown via the `database-cleanup.ts` utility file, ensuring consistency across all cleanup operations.

## Database Isolation

### What Gets Cleaned

- All user-created collections and documents
- Time entries, team data, subscription data
- Any other application data

### What Gets Preserved

- Authentication users and sessions
- System collections (starting with `_`)
- Emulator configuration and metadata

### Database Selection

The tests automatically use the `test-database` when:

- `NODE_ENV=test` is set
- `PLAYWRIGHT_TEST=true` is set
- The environment is set to `test`

## Troubleshooting

### Emulator Port Conflicts

If you get port conflicts, check what's running on these ports:

- **Auth**: 9099
- **Firestore**: 8080
- **Functions**: 9001
- **UI**: 4000

### Database Connection Issues

1. Ensure emulators are running: `npm run test:e2e:emulators`
2. Check that the test database is being used (should see `test-database` in logs)
3. Verify environment variables are set correctly

### Test Failures

1. Check that the test database was cleaned properly
2. Ensure authentication is working in the emulator
3. Look for any Firebase permission errors in the console

## Development Workflow

### During Development

1. Start emulators: `npm run emulators:start`
2. Run tests in watch mode: `playwright test --watch`
3. Emulators will persist data between test runs

### Before Committing

1. Run full test suite: `npm run test:e2e`
2. Ensure all tests pass
3. Check that no test data leaks between tests

## Configuration Files

- **`playwright.config.ts`**: Main Playwright configuration
- **`global-setup.ts`**: Runs before all tests to clean database
- **`test-teardown.ts`**: Utilities for cleaning up after tests
- **`database-cleanup.ts`**: Shared database cleanup logic
