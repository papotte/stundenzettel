import type { Config } from 'jest'
import nextJest from 'next/jest'

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const config: Config = {
  coverageProvider: 'v8',
  // Add more setup options before each test is run
  setupFilesAfterEnv: ['<rootDir>/jest.setup.tsx'],
  moduleNameMapper: {
    // Handle module aliases (this will be automatically configured for you soon)
    '^@/(.*)$': '<rootDir>/src/$1',
    '@jest-setup': '<rootDir>/jest.setup.tsx',
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/e2e/', // Ignore Playwright E2E tests
  ],
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
  coverageReporters: ['json', 'lcov', 'text', 'clover', 'json-summary'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/app/layout.tsx',
    '!src/components/ui/**',
    '!src/lib/i18n/dictionaries.ts',
    '!src/ai/dev.ts',
    '!src/ai/genkit.ts',
    '!src/test-utils/**',
    '!jest.config.ts',
    '!jest.setup.ts',
    '!src/i18n.ts',
  ],
  transformIgnorePatterns: [
    '/node_modules/(?!(lucide-react|next-intl|use-intl|exceljs|uuid)/)',
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
//export default createJestConfig(config)
const jestConfig = async () => ({
  ...(await createJestConfig({
    testEnvironment: 'jsdom',
  })()),
  ...config,
})
export default jestConfig
