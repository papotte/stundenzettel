/**
 * Mock implementation of password update service for testing and development.
 * This simulates password update operations without making actual Firebase calls.
 */

// Mock user data store for testing
const mockUsers = new Map<string, { email: string; hasPasswordAuth: boolean }>()

/**
 * Updates a user's password after verifying their current password.
 * This is a mock implementation for testing.
 */
export const updateUserPassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> => {
  if (!userId) throw new Error('User not authenticated')
  if (!currentPassword) throw new Error('Current password is required')
  if (!newPassword) throw new Error('New password is required')

  // Simulate authentication check
  const mockUser = mockUsers.get(userId)
  if (!mockUser) {
    throw new Error('User not found')
  }

  if (!mockUser.hasPasswordAuth) {
    throw new Error('User does not have email authentication')
  }

  // Simulate password verification - in mock mode, any password is valid
  // unless it's specifically 'wrongpassword'
  if (currentPassword === 'wrongpassword') {
    throw new Error('Invalid password')
  }

  // Simulate password validation
  if (newPassword.length < 8) {
    throw new Error('Password must be at least 8 characters')
  }

  // Mock successful password update
  console.log(`Mock: Password updated for user ${userId}`)
}

/**
 * Checks if the current user signed up with email/password authentication.
 * This is a mock implementation for testing.
 */
export const hasPasswordAuthentication = async (
  userId: string,
): Promise<boolean> => {
  if (!userId) return false

  // In mock mode, default to password authentication for testing
  const mockUser = mockUsers.get(userId)
  if (mockUser) {
    return mockUser.hasPasswordAuth
  }

  // Default to password auth for test users
  mockUsers.set(userId, { email: 'test@example.com', hasPasswordAuth: true })
  return true
}

/**
 * Test helper to set up mock user data
 */
export const setMockUserAuth = (
  userId: string,
  email: string,
  hasPasswordAuth: boolean,
): void => {
  mockUsers.set(userId, { email, hasPasswordAuth })
}

/**
 * Test helper to clear mock user data
 */
export const clearMockUsers = (): void => {
  mockUsers.clear()
}
