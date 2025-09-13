import { cleanupTestDatabaseWithAdmin } from './auth-utils'

// Global setup function that runs once before all tests
async function globalSetup() {
  try {
    // Ensure a stable run identifier available to all workers
    if (!process.env.E2E_RUN_ID) {
      process.env.E2E_RUN_ID = `${Date.now()}`
    }

    // Only clean up the test database in local development
    // In CI, the emulator starts fresh every time
    if (!process.env.CI) {
      console.log('🏠 Local environment: Cleaning up test database...')
      await cleanupTestDatabaseWithAdmin()
    } else {
      console.log(
        '🤖 CI environment: Skipping database cleanup (emulator starts fresh)',
      )
    }
  } catch (error) {
    throw error
  }
}

export default globalSetup
