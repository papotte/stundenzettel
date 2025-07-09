import React from 'react'
import { render, screen } from '@testing-library/react'
import { I18nProvider, useTranslation } from '../i18n-context'

jest.mock('@/hooks/use-auth', () => ({ useAuth: () => ({ user: { uid: '1' }, loading: false }) }))
jest.mock('@/services/user-settings-service', () => ({ getUserSettings: jest.fn(() => ({ language: 'en' })) }))
jest.mock('@/lib/i18n/dictionaries', () => ({ dictionaries: { en: { hello: 'Hello' }, de: { hello: 'Hallo' } } }))

function TestComponent() {
  const { t, language } = useTranslation()
  return <div>{t('hello')} ({language})</div>
}

describe('I18nProvider', () => {
  it('provides translation context', async () => {
    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    )
    expect(await screen.findByText('Hello (en)')).toBeInTheDocument()
  })
}) 