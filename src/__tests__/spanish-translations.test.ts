import { getRequestConfig } from 'next-intl/server'

describe('Spanish translations', () => {
  test('should load Spanish translations without errors', async () => {
    const mockGetUserLocale = jest.fn().mockResolvedValue('es')
    
    // Mock the locale service
    jest.doMock('@/services/locale', () => ({
      getUserLocale: mockGetUserLocale,
    }))

    const i18nConfig = await import('@/i18n')
    const config = i18nConfig.default
    
    // Test that Spanish is in the locales list
    expect(i18nConfig.locales).toContain('es')
    
    // Test that we can get a configuration for Spanish
    const result = await config()
    
    expect(result.locale).toBe('es')
    expect(result.messages).toBeDefined()
    expect(result.messages.common).toBeDefined()
    expect(result.messages.common.appName).toBe('TimeWise Tracker')
    expect(result.messages.common.cancel).toBe('Cancelar')
    expect(result.messages.settings.languageEs).toBe('Español')
  })
  
  test('should have all required translation namespaces for Spanish', async () => {
    const messages = {
      common: (await import('@/messages/es/common.json')).default,
      nav: (await import('@/messages/es/nav.json')).default,
      landing: (await import('@/messages/es/landing.json')).default,
      login: (await import('@/messages/es/login.json')).default,
      tracker: (await import('@/messages/es/tracker.json')).default,
      export: (await import('@/messages/es/export.json')).default,
      settings: (await import('@/messages/es/settings.json')).default,
      teams: (await import('@/messages/es/teams.json')).default,
      subscription: (await import('@/messages/es/subscription.json')).default,
      special_locations: (await import('@/messages/es/special-locations.json')).default,
      time_entry_card: (await import('@/messages/es/time-entry-card.json')).default,
      time_entry_form: (await import('@/messages/es/time-entry-form.json')).default,
      toasts: (await import('@/messages/es/toasts.json')).default,
    }
    
    // Test that all namespaces load successfully
    expect(messages.common).toBeDefined()
    expect(messages.nav).toBeDefined()
    expect(messages.landing).toBeDefined()
    expect(messages.login).toBeDefined()
    expect(messages.tracker).toBeDefined()
    expect(messages.export).toBeDefined()
    expect(messages.settings).toBeDefined()
    expect(messages.teams).toBeDefined()
    expect(messages.subscription).toBeDefined()
    expect(messages.special_locations).toBeDefined()
    expect(messages.time_entry_card).toBeDefined()
    expect(messages.time_entry_form).toBeDefined()
    expect(messages.toasts).toBeDefined()
    
    // Test some key translations
    expect(messages.common.save).toBe('Guardar')
    expect(messages.settings.languageEs).toBe('Español')
    expect(messages.tracker.startButton).toBe('Iniciar Seguimiento')
  })
})