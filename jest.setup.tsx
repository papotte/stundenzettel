// Learn more: https://github.com/testing-library/jest-dom
import React from 'react'

import '@testing-library/jest-dom'
// Redefine `render` to always include NextIntlClientProvider
import { RenderOptions, render as rtlRender } from '@testing-library/react'

import { NextIntlClientProvider } from 'next-intl'

import { formattingProps } from '@/lib/i18n/formats'

// Import Firebase mocks
import './src/test-utils/firebase-mocks'

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

// Global mock for useAuth that can be overridden in individual tests
const defaultMockAuth = {
  user: null,
  loading: false,
  signOut: jest.fn(),
}

jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => defaultMockAuth,
}))

// Avoid loading next/cache (use cache, etc.) in Node—uses TextEncoder.
jest.mock('next/cache', () => ({
  cacheLife: jest.fn(),
  cacheTag: jest.fn(),
  revalidateTag: jest.fn(),
}))

// Default to no subscription so components work without per-file mocks.
jest.mock('@/hooks/use-subscription-status', () => ({
  useSubscriptionStatus: () => ({
    hasValidSubscription: false,
    loading: false,
    error: null,
    subscription: null,
  }),
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

// Example messages object (replace with your actual messages)
const messages = {
  landing: {
    features: {
      keyFeatures: 'Key Features',
      headerTitle: 'Everything you need',
      headerDescription:
        'TimeWise Tracker is packed with features designed to make your time tracking as effortless and accurate as possible.',
      list: {
        feature1: { title: 'Feature 1', desc: 'Desc 1' },
        feature2: { title: 'Feature 2', desc: 'Desc 2' },
      },
    },
    faqs: [],
  },
}

export const AllTheProviders =
  (locale: string = 'en') =>
  ({ children }: React.PropsWithChildren) => {
    return (
      <NextIntlClientProvider
        locale={locale}
        messages={messages}
        formats={formattingProps}
        onError={(_) => {}}
        getMessageFallback={({ namespace, key }) =>
          `${namespace != null ? namespace + '.' : ''}${key}`
        }
      >
        {children}
      </NextIntlClientProvider>
    )
  }
const customRender = (ui: React.ReactNode, options?: RenderOptions) =>
  rtlRender(ui, { wrapper: AllTheProviders(), ...options })

export const renderWithGermanLocale = (
  ui: React.ReactNode,
  options?: RenderOptions,
) => rtlRender(ui, { wrapper: AllTheProviders('de'), ...options })

// Re-export everything from @testing-library/react
export * from '@testing-library/react'

// Override render method
export { customRender as render }
