// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Set the environment to 'test' for all Jest tests.
// This ensures that the application uses mock services instead of live ones.
process.env.NEXT_PUBLIC_ENVIRONMENT = 'test'

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

const actualI18nContext = jest.requireActual('@/context/i18n-context')
jest.mock('@/context/i18n-context', () => ({
  ...actualI18nContext,
  useTranslation: () => ({
    t: (key: string) => key,
    language: 'en',
    setLanguageState: jest.fn(),
    loading: false,
  }),
}))

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
