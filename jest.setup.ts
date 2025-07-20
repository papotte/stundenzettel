// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Set the environment to 'test' for all Jest tests.
// This ensures that the application uses mock services instead of live ones.
process.env.NEXT_PUBLIC_ENVIRONMENT = 'test'

// Polyfill fetch for Stripe and other libraries that need it
if (typeof global.fetch === 'undefined') {
  global.fetch = jest.fn()
}

// Mock ResizeObserver for Radix UI components
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock hasPointerCapture for user-event interactions with Radix UI in JSDOM.
// This is necessary to prevent errors when testing components like Select.
Element.prototype.hasPointerCapture = jest.fn()

// Mock scrollIntoView, which is used by Radix UI Select components.
Element.prototype.scrollIntoView = jest.fn()

jest.mock('@/context/i18n-context', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    language: 'en',
    setLanguageState: jest.fn(),
    loading: false,
  }),
}))

// Global mock for useAuth that can be overridden in individual tests
const defaultMockAuth = {
  user: null,
  loading: false,
  signOut: jest.fn(),
}

jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => defaultMockAuth,
}))

// Export for use in tests
export { defaultMockAuth }

// Add this at the very top of your test file or in jest.setup.ts
if (!window.matchMedia) {
  window.matchMedia = function () {
    return {
      matches: false,
      media: '',
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      dispatchEvent: jest.fn(),
    }
  }
}

// Mock Next.js server modules for API route testing
jest.mock('next/server', () => ({
  NextRequest: jest.fn().mockImplementation((input, init) => ({
    ...input,
    ...init,
    json: jest.fn(),
    nextUrl: { origin: 'http://localhost:3000' },
  })),
  NextResponse: {
    json: jest.fn().mockImplementation((data, init) => ({
      ...init,
      json: jest.fn().mockResolvedValue(data),
      status: init?.status || 200,
      ok: (init?.status || 200) < 400,
    })),
  },
}))
