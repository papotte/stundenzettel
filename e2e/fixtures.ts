import { type Page, test as base } from '@playwright/test'

import {
  TestUser,
  cleanupUserData,
  createTestUser,
  deleteTestUser,
} from './auth-utils'

const RESEND_STUB = { id: 'e2e-stub' }

type TestFixtures = {
  autoCleanup: void
  loginOrRegisterTestUser: (page: Page) => Promise<void>
  loginUser: (page: Page, redirectToTracker?: boolean) => Promise<void>
}

type WorkerFixtures = {
  workerEmail: string
  workerPassword: string
  workerUser: TestUser
  workerCleanup: void
}

export const test = base.extend<TestFixtures, WorkerFixtures>({
  // Stub Resend-backed API routes so e2e never hits the real Resend SDK
  page: async ({ page }, use) => {
    await page.route('**/api/emails/**', (route) =>
      route.request().method() === 'POST'
        ? route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(RESEND_STUB),
          })
        : route.continue(),
    )
    await page.route('**/api/contacts/**', (route) =>
      ['POST', 'PUT'].includes(route.request().method())
        ? route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(RESEND_STUB),
          })
        : route.continue(),
    )
    await use(page)
  },

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
    async ({ workerEmail, workerPassword }, use) => {
      // Create user once per worker using Admin SDK
      const user = await createTestUser(workerEmail, workerPassword)

      await use(user)

      // Cleanup is handled by workerCleanup fixture
    },
    { scope: 'worker' },
  ],

  // Login existing user
  loginUser: async ({ workerUser, workerPassword }, use) => {
    await use(async (page: Page, redirectToTracker: boolean = true) => {
      // Only navigate to login if we're not already on the login page
      const currentUrl = page.url()
      if (!currentUrl.includes('/login')) {
        await page.goto('/login')
      }

      await page.getByRole('tab', { name: 'Sign In' }).click()
      await page.getByRole('textbox', { name: 'Email' }).fill(workerUser.email)
      await page.getByRole('textbox', { name: 'Password' }).fill(workerPassword)
      await page.getByTestId('login-signin-button').click()

      // Only redirect to tracker if explicitly requested (default behavior)
      if (redirectToTracker) {
        await page.goto('/tracker')
        await page.waitForURL('/tracker')
      }
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

  // Clean up user-specific data after each test (both CI and local)
  autoCleanup: [
    async ({ workerUser }, use) => {
      await use()
      // Clean up only this user's data instead of the entire database
      // This allows tests to run in parallel without interfering with each other
      // Running user-specific cleanup
      await cleanupUserData(workerUser.uid)
    },
    { auto: true },
  ],

  // Clean up test users after all tests in this worker complete
  workerCleanup: [
    async ({ workerUser }, use) => {
      await use()
      // Deleting test user
      await deleteTestUser(workerUser)
    },
    { scope: 'worker', auto: true },
  ],
})

export { expect } from '@playwright/test'
