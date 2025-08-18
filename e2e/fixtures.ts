import { type Page, test as base } from '@playwright/test'

import { cleanupTestDatabase } from '@/lib/firebase'

type TestFixtures = {
  autoCleanup: void
  loginOrRegisterTestUser: (page: Page) => Promise<void>
}

type WorkerFixtures = {
  workerEmail: string
  workerPassword: string
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

  loginOrRegisterTestUser: async ({ workerEmail, workerPassword }, use) => {
    await use(async (page: Page) => {
      // Try to sign in first; if the user does not exist, fall back to sign up
      await page.goto('/login')
      await page.getByRole('tab', { name: 'Sign In' }).click()
      await page.getByRole('textbox', { name: 'Email' }).fill(workerEmail)
      await page.getByRole('textbox', { name: 'Password' }).fill(workerPassword)
      await page.getByTestId('login-signin-button').click()
      try {
        await page.waitForURL('/tracker', { timeout: 2500 })
        return
      } catch {
        // If sign in did not navigate, attempt to sign up instead
        await page.goto('/login')
        await page.getByRole('tab', { name: 'Sign Up' }).click()
        await page.getByRole('textbox', { name: 'Email' }).fill(workerEmail)
        await page
          .getByRole('textbox', { name: 'Password' })
          .fill(workerPassword)
        await page.getByRole('button', { name: 'Sign Up' }).click()
        await page.waitForURL('/tracker')
      }
    })
  },

  autoCleanup: [
    async ({}, use) => {
      if (process.env.CI) {
        await cleanupTestDatabase()
      }
      await use()
    },
    { auto: true },
  ],
})

export { expect } from '@playwright/test'
