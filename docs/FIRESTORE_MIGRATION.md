# Firestore Database Migration

This document explains the migration from local session storage to Firestore databases for all environments, with a focus on using Firebase emulators for test/development.

## Overview

The application has been migrated from using local session storage to using Firebase emulators for test/development environments and real Firestore databases for production. This provides several benefits:

- **Real Integration Testing**: Tests use actual Firestore operations through emulators
- **Development with Emulators**: Local development uses Firebase emulators for realistic data persistence
- **Production Ready**: Production uses real Firebase services
- **Environment Isolation**: Clear separation between test, dev, and prod data
- **Simplified Codebase**: Single service implementation per feature

## Firebase Emulator Architecture

### Environment-Specific Database Selection

The application automatically selects the appropriate Firestore configuration based on the `NEXT_PUBLIC_ENVIRONMENT` setting:

| Environment   | Database Configuration | Purpose                     |
| ------------- | ---------------------- | --------------------------- |
| `test`        | Firebase Emulators     | Automated testing and CI/CD |
| `development` | Firebase Emulators     | Local development           |
| `production`  | Real Firebase          | Production data             |

### Emulator Usage

For test and development environments, the application automatically connects to local Firebase emulators:

- **Firestore Emulator**: Port 8080
- **Auth Emulator**: Port 9099
- **Functions Emulator**: Port 9001
- **Emulator UI**: Port 4000

## Emulator Setup and Configuration

### 1. Prerequisites

Ensure you have the Firebase CLI installed:

```bash
npm install -g firebase-tools
firebase login
```

### 2. Project Configuration

The `firebase.json` file configures the emulators:

```json
{
  "firestore": {
    "database": "timewise",
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "emulators": {
    "auth": { "port": 9099 },
    "firestore": { "port": 8080 },
    "functions": { "port": 9001 },
    "ui": { "enabled": true, "port": 4000 }
  }
}
```

### 3. Available Emulator Commands

The project includes several npm scripts for emulator management:

```bash
# Start all emulators with data persistence
npm run emulators:start

# Start fresh emulators (no imported data)
npm run emulators:fresh

# Export current emulator state
npm run emulators:export

# Seed emulator with test data
npm run seed:emulator
```

## Emulator Usage in Development

### Starting Development with Emulators

1. **Start the emulators** in one terminal:

   ```bash
   npm run emulators:start
   ```

2. **Start the development server** in another terminal:

   ```bash
   # For regular development
   npm run dev

   # For test mode development
   npm run dev:test
   ```

### Emulator UI

Access the Firebase Emulator UI at `http://localhost:4000` to:

- Monitor Firestore operations in real-time
- View authentication state
- Inspect function executions
- Manage emulator data

### Data Persistence

Emulator data is automatically saved to the `./emulator-data/` directory:

- **Import/Export**: Data persists between emulator sessions
- **Seed Data**: Use `npm run seed:emulator` to populate with initial data
- **Fresh Start**: Use `npm run emulators:fresh` to start with clean data

## Emulator Usage in Testing

### Test Environment Configuration

Tests automatically use Firebase emulators when `NEXT_PUBLIC_ENVIRONMENT=test`:

```typescript
// jest.setup.tsx automatically sets this
process.env.NEXT_PUBLIC_ENVIRONMENT = 'test'
```

### Running Tests with Emulators

1. **Start emulators** before running tests:

   ```bash
   npm run emulators:start
   ```

2. **Run tests** in another terminal:

   ```bash
   npm test
   ```

3. **For CI/CD**: Emulators are started automatically in GitHub Actions

### Test Data Management

- **Isolated Testing**: Each test can use fresh emulator data
- **Real Operations**: Tests perform actual Firestore operations
- **No Mocking**: All database operations go through real Firestore APIs

## Service Architecture with Emulators

### Current Implementation

All services use a unified approach that works seamlessly with emulators:

1. **Main Service Files** (e.g., `team-service.ts`)
   - Act as facades that delegate to Firestore implementations
   - Handle environment-specific logging
   - Provide consistent API regardless of environment

2. **Firestore Implementations** (e.g., `team-service.firestore.ts`)
   - Contain the actual Firestore database operations
   - Automatically work with emulators in test/development
   - Support real-time listeners and offline capabilities

3. **Automatic Emulator Connection**
   ```typescript
   // firebase.ts automatically connects to emulators
   if (useEmulators) {
     const databaseId = getDatabaseId()
     db = getFirestore(app, databaseId)
     connectFirestoreEmulator(db, 'localhost', 8080)
     connectAuthEmulator(auth, 'http://localhost:9099')
   }
   ```

## Environment Variables

### Required Configuration

```env
# Set environment (test, development, or production)
NEXT_PUBLIC_ENVIRONMENT=development

# Firebase credentials (required for all environments)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Optional Overrides

```env
# Override automatic database selection
NEXT_PUBLIC_FIREBASE_DATABASE_ID=custom_database_name
```

## Development Workflow

### Daily Development

```bash
# Terminal 1: Start emulators
npm run emulators:start

# Terminal 2: Start development server
npm run dev

# Access your app at http://localhost:9002
# Access emulator UI at http://localhost:4000
```

### Testing Features

```bash
# Terminal 1: Keep emulators running
npm run emulators:start

# Terminal 2: Run tests
npm test

# Terminal 3: Run specific test suites
npm run test:watch
```

### Data Management

```bash
# Export current emulator state
npm run emulators:export

# Reset to fresh state
npm run emulators:fresh

# Seed with test data
npm run seed:emulator
```

## Troubleshooting Emulators

### Common Issues

1. **Port Conflicts**

   ```bash
   # Check if ports are in use
   lsof -i :8080  # Firestore
   lsof -i :9099  # Auth
   lsof -i :4000  # UI

   # Kill processes if needed
   kill -9 <PID>
   ```

2. **Emulator Not Starting**

   ```bash
   # Check Firebase CLI version
   firebase --version

   # Update if needed
   npm install -g firebase-tools@latest

   # Verify project configuration
   firebase projects:list
   firebase use <project-id>
   ```

3. **Connection Errors**
   - Verify emulators are running: `npm run emulators:start`
   - Check `NEXT_PUBLIC_ENVIRONMENT` is set to `test` or `development`
   - Ensure no firewall blocking localhost ports

### Emulator Management Commands

```bash
# View emulator status
firebase emulators:start --only firestore,auth --list

# Reset emulator data
rm -rf emulator-data/
npm run emulators:fresh

# View emulator logs
firebase emulators:start --only firestore,auth --debug

# Check emulator health
curl http://localhost:8080/  # Firestore
curl http://localhost:9099/  # Auth
```

## Benefits of Emulator-Based Development

1. **Real Database Operations**: All environments use actual Firestore operations
2. **Consistent Development**: Same database technology across all environments
3. **Better Testing**: Real database integration testing with emulators
4. **Environment Isolation**: Clear separation between test, dev, and prod data
5. **Offline Support**: Firestore provides offline capabilities and real-time updates
6. **Cost Effective**: No Firebase usage costs during development
7. **Fast Iteration**: Local development without network latency

## Migration from Session Storage

### What Changed

- **Before**: Local session storage with mock services
- **After**: Firebase emulators with real Firestore operations
- **Benefits**: Real database behavior, better testing, production parity

### What Remains the Same

- **Service APIs**: All service interfaces remain unchanged
- **Application Logic**: Business logic and UI components unchanged
- **Authentication**: Still mocked at application level for test/dev

For additional support, refer to the [Firebase Firestore documentation](https://firebase.google.com/docs/firestore) and [Firebase Emulator documentation](https://firebase.google.com/docs/emulator-suite).
