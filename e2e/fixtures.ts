import { type Page, type WorkerInfo, test as base } from '@playwright/test'

import { cleanupTestDatabase } from '@/lib/firebase'

import { TestUser, createTestUser, deleteTestUser } from './auth-utils'

type TestFixtures = {
  autoCleanup: void
  loginOrRegisterTestUser: (page: Page) => Promise<void>
  loginUser: (page: Page) => Promise<void>
}

type WorkerFixtures = {
  workerEmail: string
  workerPassword: string
  workerUser: TestUser
  workerCleanup: void
}

export const test = base.extend<TestFixtures, WorkerFixtures>({
  // Provide a stable per-worker email so tests in the same worker do not affect other workers
  workerEmail: [
    async ({}, use, workerInfo) => {
      const runId = process.env.E2E_RUN_ID || 'local'
      const email = `e2e-${runId}-w${workerInfo.workerIndex}@example.com`
      await use(email)
    },
    { scope: 'worker' },
  ],

  workerPassword: [
    async ({}, use) => {
      await use('Current_password123!')
    },
    { scope: 'worker' },
  ],

  // Create the user once per worker (much more efficient)
  workerUser: [
    async ({ workerEmail, workerPassword }, use, workerInfo: WorkerInfo) => {
      console.log(
        `Creating test user for worker ${workerInfo.workerIndex}: ${workerEmail}`,
      )

      // Create user once per worker using Admin SDK
      const user = await createTestUser(workerEmail, workerPassword)

      await use(user)

      // Cleanup is handled by workerCleanup fixture
    },
    { scope: 'worker' },
  ],

  // Login existing user
  loginUser: async ({ workerUser, workerPassword }, use) => {
    await use(async (page: Page) => {
      // Sign in programmatically (much faster than UI)
      await page.goto('/login')
      await page.getByRole('tab', { name: 'Sign In' }).click()
      await page.getByRole('textbox', { name: 'Email' }).fill(workerUser.email)
      await page.getByRole('textbox', { name: 'Password' }).fill(workerPassword)
      await page.getByTestId('login-signin-button').click()
      // Navigate to tracker to complete the flow
      await page.goto('/tracker')
      await page.waitForURL('/tracker')
    })
  },

  // Legacy alias, kept for compatibility
  loginOrRegisterTestUser: async ({ workerUser, workerPassword }, use) => {
    await use(async (page: Page) => {
      await page.goto('/login')
      await page.getByRole('tab', { name: 'Sign In' }).click()
      await page.getByRole('textbox', { name: 'Email' }).fill(workerUser.email)
      await page.getByRole('textbox', { name: 'Password' }).fill(workerPassword)
      await page.getByTestId('login-signin-button').click()
      try {
        await page.waitForURL('/tracker', { timeout: 2500 })
        return
      } catch {
        await page.goto('/login')
        await page.getByRole('tab', { name: 'Sign Up' }).click()
        await page
          .getByRole('textbox', { name: 'Email' })
          .fill(workerUser.email)
        await page
          .getByRole('textbox', { name: 'Password' })
          .fill(workerPassword)
        await page.getByRole('button', { name: 'Sign Up' }).click()
        await page.waitForURL('/tracker')
      }
    })
  },

  // Clean up database in CI after each test
  autoCleanup: [
    async ({}, use) => {
      if (process.env.CI) {
        await cleanupTestDatabase()
      }
      await use()
    },
    { auto: true },
  ],

  // Clean up test users after all tests in this worker complete
  workerCleanup: [
    async ({ workerUser }, use, workerInfo: WorkerInfo) => {
      await use()

      console.log(
        `Cleaning up test user for worker ${workerInfo.workerIndex}: ${workerUser.email}`,
      )
      await deleteTestUser(workerUser)
    },
    { scope: 'worker', auto: true },
  ],
})

export { expect } from '@playwright/test'
