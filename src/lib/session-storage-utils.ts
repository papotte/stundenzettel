// Utility functions for managing session storage in local services

/**
 * Clear all session storage data used by local services
 * This is useful for testing and development to reset the application state
 */
export function clearAllSessionStorage(): void {
  if (typeof window === 'undefined') return

  const keysToRemove = [
    'timewise_local_teams',
    'timewise_local_members',
    'timewise_local_invitations',
    'timewise_local_subscriptions',
    'timewise_local_counters',
    'timewise_local_time_entries',
    'timewise_local_user_settings',
  ]

  keysToRemove.forEach((key) => {
    sessionStorage.removeItem(key)
  })

  console.log('All session storage data cleared')
}

/**
 * Get all session storage data for debugging purposes
 */
export function getSessionStorageData(): Record<string, unknown> {
  if (typeof window === 'undefined') return {}

  const data: Record<string, unknown> = {}
  const keys = [
    'timewise_local_teams',
    'timewise_local_members',
    'timewise_local_invitations',
    'timewise_local_subscriptions',
    'timewise_local_counters',
    'timewise_local_time_entries',
    'timewise_local_user_settings',
  ]

  keys.forEach((key) => {
    const value = sessionStorage.getItem(key)
    if (value) {
      try {
        data[key] = JSON.parse(value)
      } catch {
        data[key] = value
      }
    }
  })

  return data
}

/**
 * Export session storage data as a JSON string for backup/restore
 */
export function exportSessionStorageData(): string {
  const data = getSessionStorageData()
  return JSON.stringify(data, null, 2)
}

/**
 * Import session storage data from a JSON string
 */
export function importSessionStorageData(jsonData: string): void {
  if (typeof window === 'undefined') return

  try {
    const data = JSON.parse(jsonData)
    Object.entries(data).forEach(([key, value]) => {
      sessionStorage.setItem(key, JSON.stringify(value))
    })
    console.log('Session storage data imported successfully')
  } catch (error) {
    console.error('Failed to import session storage data:', error)
  }
}
