// Development utilities for testing and debugging
// These functions are available in the browser console during development
import {
  clearAllSessionStorage,
  exportSessionStorageData,
  getSessionStorageData,
  importSessionStorageData,
} from './session-storage-utils'

// Only expose these utilities in development mode
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  // Expose utilities to the global window object for console access
  ;(
    window as typeof window & { TimeWiseDev: Record<string, unknown> }
  ).TimeWiseDev = {
    /**
     * Clear all session storage data
     * Usage: TimeWiseDev.clearStorage()
     */
    clearStorage: () => {
      clearAllSessionStorage()
      console.log(
        '✅ Session storage cleared. Refresh the page to see the changes.',
      )
    },

    /**
     * View all session storage data
     * Usage: TimeWiseDev.viewStorage()
     */
    viewStorage: () => {
      const data = getSessionStorageData()
      console.table(data)
      return data
    },

    /**
     * Export session storage data as JSON
     * Usage: TimeWiseDev.exportStorage()
     */
    exportStorage: () => {
      const json = exportSessionStorageData()
      console.log('📋 Session storage data (copy this):')
      console.log(json)
      return json
    },

    /**
     * Import session storage data from JSON
     * Usage: TimeWiseDev.importStorage(jsonString)
     */
    importStorage: (jsonData: string) => {
      importSessionStorageData(jsonData)
      console.log(
        '✅ Session storage data imported. Refresh the page to see the changes.',
      )
    },

    /**
     * Reset the application to initial state
     * Usage: TimeWiseDev.resetApp()
     */
    resetApp: () => {
      clearAllSessionStorage()
      console.log('✅ Application reset. Refresh the page to see the changes.')
    },

    /**
     * Show help for all available commands
     * Usage: TimeWiseDev.help()
     */
    help: () => {
      console.log(`
🛠️ TimeWise Development Utilities

Available commands:
• TimeWiseDev.clearStorage() - Clear all session storage data
• TimeWiseDev.viewStorage() - View all session storage data
• TimeWiseDev.exportStorage() - Export session storage data as JSON
• TimeWiseDev.importStorage(jsonString) - Import session storage data from JSON
• TimeWiseDev.resetApp() - Reset the application to initial state
• TimeWiseDev.help() - Show this help message

Example usage:
  TimeWiseDev.clearStorage()  // Clear data and refresh page
  TimeWiseDev.viewStorage()   // See what data is stored
  TimeWiseDev.exportStorage() // Copy data for backup
      `)
    },
  }

  // Log the availability of dev utilities
  console.log(`
🛠️ TimeWise Development Utilities loaded!
Type 'TimeWiseDev.help()' to see available commands.
  `)
}
