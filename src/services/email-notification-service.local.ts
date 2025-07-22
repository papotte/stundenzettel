/**
 * Mock implementation of email notification service for testing and development.
 * This simulates email notifications without actually sending emails.
 */

/**
 * Mock implementation that simulates sending password change notifications.
 */
export const sendPasswordChangeNotification = async (
  userEmail: string,
  userDisplayName?: string | null,
): Promise<void> => {
  if (!userEmail) {
    throw new Error('User email is required for password change notification')
  }

  // Mock successful email sending
  console.log(
    `Mock: Password change notification sent to ${userEmail} for user ${userDisplayName || 'Unknown'}`,
  )

  // Simulate async operation
  await new Promise((resolve) => setTimeout(resolve, 10))
}
