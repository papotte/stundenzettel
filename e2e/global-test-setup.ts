import { cleanupTestDatabase } from '@/lib/firebase'

// Global setup function that runs once before all tests
async function globalSetup() {
  try {
    // Ensure a stable run identifier available to all workers
    if (!process.env.E2E_RUN_ID) {
      process.env.E2E_RUN_ID = `${Date.now()}`
    }
    // Clean up the test database before running tests
    await cleanupTestDatabase()
  } catch (error) {
    throw error
  }
}

export default globalSetup
