# TimeWise Tracker - GitHub Copilot Instructions

**ALWAYS follow these instructions first and only fallback to additional search and context gathering if the information in the instructions is incomplete or found to be in error.**

TimeWise Tracker is a Next.js 15 time tracking application with Firebase backend (Firestore, Functions, App Hosting) and Stripe payment integration. It includes both individual and team time tracking features with subscription management.

## Working Effectively

### Prerequisites and Setup

**CRITICAL**: This project requires Node.js 22. Do not attempt to build with older versions.

1. **Install Node.js 22**:

   ```bash
   # On Ubuntu/Debian systems:
   curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
   sudo apt-get install nodejs -y

   # Update symlink if needed:
   sudo ln -sf /usr/bin/nodejs /usr/local/bin/node

   # Verify installation
   node --version  # Should show v22.x.x
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

   **TIMING**: Takes 15-20 minutes. NEVER CANCEL. Set timeout to 30+ minutes.
   **NOTE**: Expect deprecation warnings - these are normal and do not affect functionality.

3. **Install Playwright browsers** (for E2E testing):
   ```bash
   npx playwright install --with-deps
   ```
   **TIMING**: Takes 3-5 minutes. NEVER CANCEL. Set timeout to 10+ minutes.
   **NOTE**: May require sudo privileges for system dependencies.

### Development Commands

#### Start Development Server

```bash
# Production mode (port 9002)
npm run dev

# Test mode (port 9003) - use this for E2E testing
npm run dev:test
```

**TIMING**: Takes 30-60 seconds to start. NEVER CANCEL. Set timeout to 2+ minutes.
**NOTE**: Development server uses turbopack for faster builds.

#### Build Commands

```bash
# Build Next.js application
npm run build
```

**TIMING**: Takes 3-5 minutes. NEVER CANCEL. Set timeout to 10+ minutes.
**NOTE**: Requires environment variables for Stripe integration to build successfully.

```bash
# Build Firebase Functions
npm run functions:build
```

**TIMING**: Takes 1-2 minutes. NEVER CANCEL. Set timeout to 5+ minutes.

```bash
# Type checking (runs during build but can be run separately)
npm run typecheck
```

**TIMING**: Takes 30-60 seconds. NEVER CANCEL. Set timeout to 2+ minutes.

#### Testing Commands

```bash
# Run unit tests (Jest)
npm test
```

**TIMING**: Takes 2-3 minutes. NEVER CANCEL. Set timeout to 10+ minutes.

```bash
# Run unit tests with coverage for CI
npm run test:ci
```

**TIMING**: Takes 3-4 minutes. NEVER CANCEL. Set timeout to 10+ minutes.

```bash
# Run E2E tests (Playwright) - requires dev server running
npm run test:e2e
```

**TIMING**: Takes 5-10 minutes. NEVER CANCEL. Set timeout to 15+ minutes.
**PREREQUISITE**: Development server must be running on port 9003 (`npm run dev:test`).

```bash
# Debug E2E tests
npm run test:e2e:debug
```

#### Code Quality

```bash
# Check formatting
npm run format:check

# Auto-format code (run before committing)
npm run format

# Run linter
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Run Functions linting
npm run functions:lint
```

**NOTE**: CI will fail if code is not properly formatted or if the linter is not passing. Always run `npm run format` and `npm run lint` before committing.

### Firebase Commands

#### Prerequisites

Install Firebase CLI if not already installed:

```bash
npm install -g firebase-tools
```

#### Deploy Commands

```bash
# Deploy only Firestore rules (for development/testing)
firebase deploy --only firestore:rules

# Deploy only functions (for development/testing)
npm run functions:deploy
firebase deploy --only functions --debug
```

**NOTE**: App hosting deployment happens automatically in the CI/CD pipeline upon release. Do not manually deploy app hosting changes.
**TIMING**: Full deploy takes 5-10 minutes. NEVER CANCEL. Set timeout to 15+ minutes.

#### Local Development with Emulators

```bash
# Start Firebase emulators (all services)
firebase emulators:start

# Build and serve functions locally
npm run functions:serve

# View functions logs
npm run functions:logs
```

**NOTE**: Emulators run on specific ports (see Port Configuration section).

#### Firebase Functions Development

```bash
# Watch mode for function development
npm run functions:build:watch

# Test functions shell
npm run functions:shell
```

## Validation Scenarios

**ALWAYS test these scenarios after making changes to ensure the application works correctly:**

### 1. Basic Application Startup

1. Install dependencies: `npm install` (wait 15-20 minutes)
2. Start development server: `npm run dev:test`
3. Navigate to `http://localhost:9003`
4. Verify the application loads without errors
5. Check browser console for any JavaScript errors

### 2. Time Entry Workflow

1. Ensure development server is running on port 9003
2. Navigate to the main time tracking page
3. Create a new time entry:
   - Click "Hinzufügen" (Add) button
   - Fill in "Einsatzort" (Location): "Test Location" (minimum 2 characters)
   - Set "Startzeit" (Start time): "09:00"
   - Set "Endzeit" (End time): "17:00"
   - Click "Eintrag speichern" (Save Entry)
4. Verify the entry appears in the list with correct duration (8 hours)
5. Test editing an existing entry
6. Test deleting an entry
7. Test validation errors (e.g., location too short, end time before start time)

### 3. Time Entry Validation Rules

1. Test maximum duration limit (10 hours):
   - Try creating entry from 08:00 to 19:00 (11 hours) - should be rejected
   - Try creating entry from 08:00 to 18:00 (10 hours) - should be accepted
2. Test pause suggestions:
   - Create 6-hour entry (08:00-14:30) - should suggest 30-minute pause
   - Create 9-hour entry (08:00-17:30) - should suggest 45-minute pause
3. Test midnight spanning validation (should show error for end time before start time)

### 4. Authentication Flow

1. Test user registration and login
2. Verify navigation redirects work correctly for protected routes
3. Test logout functionality
4. Verify authentication state persists across page refreshes

### 5. Pricing and Subscription Flow (requires Stripe test setup)

1. Navigate to `http://localhost:9003/pricing`
2. Verify pricing plans display correctly
3. Test "Choose Plan" buttons redirect appropriately
4. With test Stripe configuration:
   - Complete checkout flow with test card: `4242 4242 4242 4242`
   - Verify redirect to success page
   - Check subscription status at `/subscription`
   - Test "Manage Billing" button (customer portal)

### 6. Team Management (for team subscriptions)

1. Navigate to `/team`
2. Test team creation and management features
3. Test team member invitation workflow
4. Verify team subscription limits and features

### 7. End-to-End Test Validation

1. Run complete E2E test suite:

   ```bash
   # Terminal 1: Start test server
   npm run dev:test

   # Terminal 2: Run E2E tests
   npm run test:e2e
   ```

2. Verify all tests pass
3. Check test report in `playwright-report` directory

## Common File Locations

### Key Source Directories

- `src/app/` - Next.js app router pages
- `src/components/` - Reusable React components
- `src/lib/` - Utility functions and configurations
- `src/hooks/` - Custom React hooks
- `src/services/` - API and Firebase service functions
- `functions/` - Firebase Cloud Functions
- `e2e/` - Playwright E2E tests
- `docs/` - Project documentation

### Configuration Files

- `package.json` - Dependencies and scripts
- `next.config.ts` - Next.js configuration
- `firebase.json` - Firebase project configuration
- `firestore.rules` - Firestore security rules
- `playwright.config.ts` - Playwright test configuration
- `jest.config.ts` - Jest test configuration
- `.env.local` - Environment variables (not in repo)

### Important Scripts

- `scripts/` - Stripe integration debugging scripts (manual testing only)
  - Run with: `node scripts/verify-stripe-setup.js`
  - See `scripts/README.md` for details

## Environment Variables

Create `.env.local` file with these variables for full functionality:

```bash
# Environment Mode
NEXT_PUBLIC_ENVIRONMENT=development  # or 'test' for E2E testing

# Firebase Configuration (typically auto-configured in development)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id

# Stripe Configuration (required for payment features)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**NOTE**: Application will work without Stripe configuration but payment features will be disabled.

## CI/CD Pipeline

### GitHub Actions Workflows

- `ci.yml` - Runs on pull requests (lint, test, build)
- `main.yml` - Runs on main branch (full checks + semantic release)
- `deploy.yml` - Deploys to Firebase App Hosting
- `nightly.yml` - Nightly builds

### Commit Message and PR Title Conventions

**CRITICAL**: All commit messages and PR titles MUST start with one of these conventional commit prefixes:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, missing semicolons, etc.)
- `refactor:` - Code refactoring without changing functionality
- `perf:` - Performance improvements
- `test:` - Adding or updating tests
- `build:` - Changes to build system or dependencies
- `ci:` - Changes to CI configuration
- `chore:` - Other changes that don't modify src or test files
- `revert:` - Reverts a previous commit

**Examples:**

```
feat: add time entry validation with pause suggestions
fix: resolve authentication redirect loop on login
docs: update installation instructions for Node.js 22
chore: update dependencies to latest versions
```

**NOTE**: This is required for the semantic-release workflow that automatically generates releases and changelogs based on commit messages.

### Before Committing

**ALWAYS run these commands before committing to avoid CI failures:**

```bash
npm run format
npm run lint
npm run functions:lint
npm run typecheck
npm test
```

## Troubleshooting

### Common Issues

1. **"Firestore... 400 (Bad Request)" errors**:

   ```bash
   firebase deploy --only firestore:rules
   ```

2. **Node.js version mismatch**:
   - Ensure Node.js 22 is installed and active
   - Check with: `node --version`

3. **npm install hanging**:
   - Normal behavior, takes 15-20 minutes
   - Wait for completion, do not cancel

4. **E2E tests failing**:
   - Ensure development server is running on port 9003
   - Run: `npm run dev:test` in separate terminal
   - Install Playwright dependencies: `npx playwright install --with-deps`

5. **Firebase Functions deployment issues**:
   - Build functions first: `npm run functions:build`
   - Check Firebase project is selected: `firebase use --alias staging`

6. **Stripe webhook testing**:
   - Use Firebase emulators: `firebase emulators:start`
   - See `scripts/SUBSCRIPTION_TESTING_GUIDE.md` for detailed flow

### Debug Commands

```bash
# View Firebase Functions logs
npm run functions:logs

# Test Stripe integration
node scripts/verify-stripe-setup.js

# Check development server status
curl http://localhost:9002/api/health  # if health endpoint exists
```

## Port Configuration

- Development server: `9002` (production mode)
- Test server: `9003` (test mode for E2E tests)
- Firebase Functions emulator: `9001`
- Firestore emulator: `8080`
- Firebase Auth emulator: `9099`
- Firebase UI: `4000`

## Additional Resources

- See `README.md` for complete setup instructions
- See `PAYMENT_SETUP.md` for Stripe integration setup
- See `scripts/SUBSCRIPTION_TESTING_GUIDE.md` for subscription testing
- See `scripts/README.md` for debugging utilities
