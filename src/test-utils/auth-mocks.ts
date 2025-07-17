import { AuthenticatedUser } from '@/lib/types'

export interface MockAuthContext {
  user: AuthenticatedUser | null
  loading: boolean
  signOut: jest.Mock
  updatePassword?: jest.Mock
  deleteAccount?: jest.Mock
  loginAsMockUser?: jest.Mock
}

/**
 * Creates a mock auth context for testing
 */
export const createMockAuthContext = (overrides: Partial<MockAuthContext> = {}): MockAuthContext => {
  return {
    user: null,
    loading: false,
    signOut: jest.fn(),
    ...overrides,
  }
}

/**
 * Creates a mock authenticated user
 */
export const createMockUser = (overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser => {
  return {
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
    ...overrides,
  }
}

/**
 * Sets up the useAuth mock with the provided auth context
 */
export const setupAuthMock = (mockAuthContext: MockAuthContext) => {
  jest.doMock('@/hooks/use-auth', () => ({
    useAuth: () => mockAuthContext,
  }))
}

/**
 * Common auth scenarios for testing
 */
export const authScenarios = {
  authenticated: (userOverrides?: Partial<AuthenticatedUser>) => 
    createMockAuthContext({
      user: createMockUser(userOverrides),
      loading: false,
    }),
  
  unauthenticated: () => 
    createMockAuthContext({
      user: null,
      loading: false,
    }),
  
  loading: () => 
    createMockAuthContext({
      user: null,
      loading: true,
    }),
  
  withPasswordUpdate: (userOverrides?: Partial<AuthenticatedUser>) => 
    createMockAuthContext({
      user: createMockUser(userOverrides),
      loading: false,
      updatePassword: jest.fn(),
    }),
  
  withAccountDeletion: (userOverrides?: Partial<AuthenticatedUser>) => 
    createMockAuthContext({
      user: createMockUser(userOverrides),
      loading: false,
      deleteAccount: jest.fn(),
    }),
} 