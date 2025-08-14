// Global error handler for Firebase operations
let globalLogoutHandler: (() => void) | null = null

// Set the global logout handler (called from auth context)
export const setGlobalLogoutHandler = (handler: () => void) => {
  globalLogoutHandler = handler
}

// Check if the global logout handler is ready
export const isGlobalLogoutHandlerReady = (): boolean => {
  return globalLogoutHandler !== null
}

// Handle Firebase errors globally
export const handleFirebaseError = (error: any): boolean => {
  if (!globalLogoutHandler) return false
  
  // Check for explicit token expiration
  if (error?.code === 400 && error?.message === 'TOKEN_EXPIRED') {
    console.log('Handling TOKEN_EXPIRED error')
    globalLogoutHandler()
    return true // Error was handled
  }
  
  // Check for Firestore security rule errors that indicate invalid auth
  if (error?.code === 'permission-denied' || 
      error?.message?.includes('Null value error') ||
      error?.message?.includes('Missing or insufficient permissions')) {
    console.log('Handling permission denied error:', error?.code, error?.message)
    globalLogoutHandler()
    return true // Error was handled
  }
  
  return false // Error was not handled
}

// Wrapper for async Firebase operations that automatically handles token expiration
export const withFirebaseErrorHandling = async <T>(
  operation: () => Promise<T>,
  onError?: (error: any) => void
): Promise<T> => {
  try {
    return await operation()
  } catch (error) {
    // Check if global logout handler is ready
    if (!isGlobalLogoutHandlerReady()) {
      if (onError) {
        onError(error)
      }
      throw error
    }
    
    // Check if this is a token expiration error
    if (handleFirebaseError(error)) {
      // Error was handled (user logged out), re-throw to stop execution
      throw error
    }
    
    // Handle other errors
    if (onError) {
      onError(error)
    }
    throw error
  }
}
