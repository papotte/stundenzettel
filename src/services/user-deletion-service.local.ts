/**
 * Local/mock implementation of user deletion service for testing.
 * Simulates the deletion process without actually affecting any real data.
 */

const MOCK_USER_STORAGE_KEY = 'mockUser'
const TIME_ENTRIES_KEY_PREFIX = 'timeEntries_'
const USER_SETTINGS_KEY_PREFIX = 'userSettings_'

/**
 * Deletes user data from local storage (mock implementation).
 * In test mode, this validates the password format and clears local storage.
 */
export const deleteUserAccount = async (
  userId: string,
  password: string,
): Promise<void> => {
  if (!userId) throw new Error('User not authenticated')
  if (!password) throw new Error('Password is required for account deletion')

  // Simple password validation for testing
  if (password.length < 6) {
    throw new Error('Invalid password')
  }

  await deleteUserData(userId)
}

/**
 * Deletes user account using Google re-authentication (mock implementation).
 */
export const deleteUserAccountWithGoogle = async (
  userId: string,
): Promise<void> => {
  if (!userId) throw new Error('User not authenticated')

  // In mock mode, simulate successful Google re-authentication
  console.info(`Mock Google re-authentication successful for user ${userId}`)

  await deleteUserData(userId)
}

/**
 * Deletes user account using email confirmation (mock implementation).
 */
export const deleteUserAccountWithEmail = async (
  userId: string,
  email: string,
): Promise<void> => {
  if (!userId) throw new Error('User not authenticated')
  if (!email) throw new Error('Email is required for account deletion')

  // In mock mode, validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format')
  }

  await deleteUserData(userId)
}

/**
 * Common function to delete user data from localStorage
 */
const deleteUserData = async (userId: string): Promise<void> => {
  try {
    // Delete user settings from localStorage
    const settingsKey = `${USER_SETTINGS_KEY_PREFIX}${userId}`
    localStorage.removeItem(settingsKey)

    // Delete time entries from localStorage
    const timeEntriesKey = `${TIME_ENTRIES_KEY_PREFIX}${userId}`
    localStorage.removeItem(timeEntriesKey)

    // Remove mock user from localStorage
    localStorage.removeItem(MOCK_USER_STORAGE_KEY)

    // Clear any other user-related data that might exist
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.includes(userId)) {
        keysToRemove.push(key)
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key))

    console.info(`Mock user account deleted for user ${userId}`)
  } catch (error) {
    console.error('Error during mock account deletion:', error)
    throw error
  }
}
