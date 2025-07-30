import { defaultLocale } from '@/i18n'

import { getUserLocale, setUserLocale } from '../locale'

// Mock next/headers
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

// Mock the i18n configuration
jest.mock('@/i18n', () => ({
  defaultLocale: 'en',
  locales: ['en', 'de'],
}))

// Mock next-intl/server
jest.mock('next-intl/server', () => ({
  getRequestConfig: jest.fn(),
}))

describe('Locale Service', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockCookies = require('next/headers').cookies

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getUserLocale', () => {
    it('should return the locale from cookies when available', async () => {
      const mockCookieValue = 'de'
      mockCookies.mockResolvedValue({
        get: jest.fn().mockReturnValue({ value: mockCookieValue }),
      })

      const result = await getUserLocale()
      expect(result).toBe(mockCookieValue)
    })

    it('should return default locale when no cookie is set', async () => {
      mockCookies.mockResolvedValue({
        get: jest.fn().mockReturnValue(undefined),
      })

      const result = await getUserLocale()
      expect(result).toBe(defaultLocale)
    })

    it('should return default locale when cookie value is empty', async () => {
      mockCookies.mockResolvedValue({
        get: jest.fn().mockReturnValue({ value: '' }),
      })

      const result = await getUserLocale()
      expect(result).toBe(defaultLocale)
    })
  })

  describe('setUserLocale', () => {
    it('should set the locale cookie', async () => {
      const mockSetCookie = jest.fn()
      mockCookies.mockResolvedValue({
        set: mockSetCookie,
      })

      const locale = 'de'
      await setUserLocale(locale)

      expect(mockSetCookie).toHaveBeenCalledWith('preferredLanguage', locale)
    })
  })
})
