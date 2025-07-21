import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth'

import { auth } from '@/lib/firebase'

/**
 * Updates a user's password after verifying their current password.
 * This operation requires re-authentication for security.
 */
export const updateUserPassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> => {
  if (!userId) throw new Error('User not authenticated')
  if (!currentPassword) throw new Error('Current password is required')
  if (!newPassword) throw new Error('New password is required')

  const user = auth.currentUser
  if (!user || user.uid !== userId) {
    throw new Error('User not authenticated or mismatched user ID')
  }

  if (!user.email) {
    throw new Error('User does not have email authentication')
  }

  // Re-authenticate user before password update for security
  const credential = EmailAuthProvider.credential(user.email, currentPassword)
  await reauthenticateWithCredential(user, credential)

  // Update the password
  await updatePassword(user, newPassword)
}

/**
 * Checks if the current user signed up with email/password authentication.
 * Used to determine if password change functionality should be available.
 */
export const hasPasswordAuthentication = async (
  userId: string,
): Promise<boolean> => {
  if (!userId) return false

  const user = auth.currentUser
  if (!user || user.uid !== userId) {
    return false
  }

  // Check if user has password provider
  const hasPasswordProvider = user.providerData.some(
    (provider) => provider.providerId === 'password',
  )

  return hasPasswordProvider
}