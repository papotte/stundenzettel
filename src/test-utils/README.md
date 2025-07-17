# Test Utilities

This directory contains centralized test utilities to reduce duplication across test files.

## Auth Mocks

The `auth-mocks.ts` file provides centralized authentication mocking utilities to replace the duplicated `mockAuth` patterns found across test files.

### Basic Usage

Instead of creating individual mock auth objects in each test file:

```typescript
// ❌ Old way - duplicated across files
const mockUseAuth = {
  user: null as any,
  loading: false,
  signOut: jest.fn(),
}

jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => mockUseAuth,
}))
```

Use the centralized utilities:

```typescript
// ✅ New way - centralized and reusable
import { createMockAuthContext } from '@/test-utils/auth-mocks'

const mockAuthContext = createMockAuthContext()
jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => mockAuthContext,
}))
```

### Available Functions

#### `createMockAuthContext(overrides?)`

Creates a basic mock auth context with default values:

```typescript
const mockAuth = createMockAuthContext({
  user: { uid: 'custom-id', email: 'custom@example.com' },
  loading: true,
})
```

#### `createMockUser(overrides?)`

Creates a mock authenticated user:

```typescript
const user = createMockUser({
  displayName: 'Custom User',
  email: 'custom@example.com',
})
```

#### `authScenarios`

Pre-configured auth scenarios for common testing patterns:

```typescript
import { authScenarios } from '@/test-utils/auth-mocks'

// Authenticated user
const authenticatedAuth = authScenarios.authenticated()

// Unauthenticated user
const unauthenticatedAuth = authScenarios.unauthenticated()

// Loading state
const loadingAuth = authScenarios.loading()

// With password update functionality
const authWithPasswordUpdate = authScenarios.withPasswordUpdate()

// With account deletion functionality
const authWithAccountDeletion = authScenarios.withAccountDeletion()
```

### Migration Examples

#### Simple Component Test

**Before:**

```typescript
const mockUseAuth = {
  user: null,
  loading: false,
  signOut: jest.fn(),
}

jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => mockUseAuth,
}))

// In tests
mockUseAuth.user = { uid: 'test-id', email: 'test@example.com' }
```

**After:**

```typescript
import { createMockAuthContext } from '@/test-utils/auth-mocks'

const mockAuthContext = createMockAuthContext()
jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => mockAuthContext,
}))

// In tests
mockAuthContext.user = { uid: 'test-id', email: 'test@example.com' }
```

#### Component with Auth Scenarios

**Before:**

```typescript
const mockUseAuth = {
  user: null,
  loading: false,
  signOut: jest.fn(),
  updatePassword: jest.fn(),
}

jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => mockUseAuth,
}))

describe('when user is authenticated', () => {
  beforeEach(() => {
    mockUseAuth.user = { uid: 'test-id', email: 'test@example.com' }
  })
})

describe('when user is not authenticated', () => {
  beforeEach(() => {
    mockUseAuth.user = null
  })
})
```

**After:**

```typescript
import { authScenarios } from '@/test-utils/auth-mocks'

const mockAuthContext = authScenarios.withPasswordUpdate()
jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => mockAuthContext,
}))

describe('when user is authenticated', () => {
  beforeEach(() => {
    Object.assign(mockAuthContext, authScenarios.authenticated())
  })
})

describe('when user is not authenticated', () => {
  beforeEach(() => {
    Object.assign(mockAuthContext, authScenarios.unauthenticated())
  })
})
```

### Benefits

1. **Reduced Duplication**: No more copying the same mock structure across files
2. **Consistency**: All tests use the same mock structure and default values
3. **Maintainability**: Changes to auth structure only need to be made in one place
4. **Type Safety**: Better TypeScript support with proper interfaces
5. **Reusability**: Common scenarios are pre-configured and ready to use
