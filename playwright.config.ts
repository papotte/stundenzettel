import type { PlaywrightTestConfig } from '@playwright/test'
import { devices } from '@playwright/test'

import * as dotenv from 'dotenv'
import * as fs from 'fs'

// Load test environment variables (only if .env.test exists)
if (fs.existsSync('.env.test')) {
  dotenv.config({ path: '.env.test', quiet: true })
}
/**
 * See https://playwright.dev/docs/test-configuration.
 */
const config: PlaywrightTestConfig = {
  testDir: './e2e',
  /* Global setup that runs before all tests */
  globalSetup: require.resolve('./e2e/global-test-setup.ts'),
  /* Maximum time one test can run for. */
  timeout: 30 * 1000,
  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met.
     * For example in `await expect(locator).toHaveText();`
     */
    timeout: 5000,
  },
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Stop after first failure in CI, run all tests locally */
  maxFailures: process.env.CI ? 1 : 0,
  /* Optimize workers for better performance - use more workers in CI */
  workers: process.env.CI ? 4 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['list', { printSteps: true }], // Shows test progress in console with steps
    ['html'], // Generates HTML report
    // Add line reporter for better test identification
    ['line'],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout: 10000,
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:9003',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Optimize for faster test execution */
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },

    // Only run Firefox and WebKit when explicitly requested
    ...(process.env.RUN_ALL_BROWSERS
      ? [
          {
            name: 'firefox',
            use: {
              ...devices['Desktop Firefox'],
            },
          },
          {
            name: 'webkit',
            use: {
              ...devices['Desktop Safari'],
            },
          },
        ]
      : []),
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev:test',
    url: 'http://localhost:9003',
    reuseExistingServer: process.env.CI !== 'true',
    timeout: 120 * 1000,
  },
}

export default config
