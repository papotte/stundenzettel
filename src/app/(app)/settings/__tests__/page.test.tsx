import React from 'react'

import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import SettingsPage from '@/app/(app)/settings/page'
import type { AuthenticatedUser, UserSettings } from '@/lib/types'
import {
  getUserSettings,
  setUserSettings,
} from '@/services/user-settings-service'

// --- MOCKS ---
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockPush,
  }),
}))

const mockSetLanguageState = jest.fn()
jest.mock('@/context/i18n-context', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    language: 'en',
    loading: false,
    setLanguageState: mockSetLanguageState,
  }),
}))

const mockToast = jest.fn()
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}))

const mockUser: AuthenticatedUser = {
  uid: 'test-user-1',
  displayName: 'Test User',
  email: 'test@user.com',
}

jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false,
  }),
}))

jest.mock('@/services/user-settings-service')
const mockedGetUserSettings = getUserSettings as jest.Mock
const mockedSetUserSettings = setUserSettings as jest.Mock

const mockSettings: UserSettings = {
  defaultWorkHours: 7.5,
  defaultStartTime: '08:30',
  defaultEndTime: '16:30',
  language: 'de',
  companyName: 'Test GmbH',
  companyEmail: 'contact@test.gmbh',
  companyPhone1: '12345',
  companyPhone2: '67890',
  companyFax: '54321',
  displayName: 'Export User',
  driverCompensationPercent: 100,
  passengerCompensationPercent: 90,
}

let currentSettings: UserSettings

beforeEach(() => {
  jest.clearAllMocks()
  currentSettings = { ...mockSettings }
  mockedGetUserSettings.mockImplementation(() =>
    Promise.resolve(currentSettings),
  )
  mockedSetUserSettings.mockImplementation((uid, newSettings) => {
    currentSettings = { ...currentSettings, ...newSettings }
    return Promise.resolve()
  })
})

describe('SettingsPage', () => {
  it('fetches and displays user settings on load', async () => {
    render(<SettingsPage />)
    expect(await screen.findByDisplayValue('7.5')).toBeInTheDocument()
    expect(screen.getByDisplayValue('08:30')).toBeInTheDocument()
    expect(screen.getByDisplayValue('16:30')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Export User')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toHaveTextContent(
      'settings.languageGerman',
    )
    expect(screen.getByDisplayValue('Test GmbH')).toBeInTheDocument()
    expect(screen.getByDisplayValue('contact@test.gmbh')).toBeInTheDocument()
    expect(screen.getByDisplayValue('12345')).toBeInTheDocument()
    expect(screen.getByDisplayValue('67890')).toBeInTheDocument()
    expect(screen.getByDisplayValue('54321')).toBeInTheDocument()
    expect(screen.getByDisplayValue('100')).toBeInTheDocument()
    expect(screen.getByDisplayValue('90')).toBeInTheDocument()
  })

  it('allows user to change displayName and save', async () => {
    const user = userEvent.setup()
    render(<SettingsPage />)
    await waitFor(() =>
      expect(screen.getByDisplayValue('Export User')).toBeInTheDocument(),
    )
    const displayNameInput = screen.getByLabelText('settings.displayNameLabel')
    await user.clear(displayNameInput)
    await user.type(displayNameInput, 'New Export Name')
    await user.tab()
    await waitFor(() => {
      expect(displayNameInput).toHaveValue('New Export Name')
    })
    await userEvent.click(
      screen.getByRole('button', { name: 'settings.saveButton' }),
    )
    // Wait for toast to appear
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'settings.savedTitle',
        description: 'settings.savedDescription',
      })
    })

    await waitFor(() => {
      expect(mockedSetUserSettings).toHaveBeenCalledTimes(1)
      expect(mockedSetUserSettings).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ displayName: 'New Export Name' }),
      )
    })
  })

  it('allows user to clear displayName (blank fallback)', async () => {
    render(<SettingsPage />)
    await waitFor(() =>
      expect(screen.getByDisplayValue('Export User')).toBeInTheDocument(),
    )
    const displayNameInput = screen.getByLabelText('settings.displayNameLabel')
    await userEvent.clear(displayNameInput)
    await userEvent.tab()
    await userEvent.click(
      screen.getByRole('button', { name: 'settings.saveButton' }),
    )
    expect(mockedSetUserSettings).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ displayName: '' }),
    )
  })

  it('allows user to change settings and save', async () => {
    render(<SettingsPage />)
    await waitFor(() =>
      expect(screen.getByDisplayValue('7.5')).toBeInTheDocument(),
    )

    const workHoursInput = screen.getByLabelText(
      'settings.defaultWorkHoursLabel',
    )
    await userEvent.clear(workHoursInput)
    await userEvent.type(workHoursInput, '8')
    await userEvent.tab()

    const companyNameInput = screen.getByLabelText('settings.companyNameLabel')
    await userEvent.clear(companyNameInput)
    await userEvent.type(companyNameInput, 'New Awesome Inc.')
    await userEvent.tab()

    // Change language
    await userEvent.click(screen.getByRole('combobox'))
    const listbox = await screen.findByRole('listbox')
    await userEvent.click(within(listbox).getByText('settings.languageEnglish'))
    await userEvent.tab()

    // Change compensation percentages
    const driverPercentInput = screen.getByLabelText(
      'settings.driverCompensationPercentLabel',
    )
    await userEvent.clear(driverPercentInput)
    await userEvent.type(driverPercentInput, '80')
    await userEvent.tab()
    const passengerPercentInput = screen.getByLabelText(
      'settings.passengerCompensationPercentLabel',
    )
    await userEvent.clear(passengerPercentInput)
    await userEvent.type(passengerPercentInput, '70')
    await userEvent.tab()

    await userEvent.click(
      screen.getByRole('button', { name: 'settings.saveButton' }),
    )

    expect(mockedSetUserSettings).toHaveBeenCalledTimes(1)
    expect(mockedSetUserSettings).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        defaultWorkHours: 8,
        companyName: 'New Awesome Inc.',
        driverCompensationPercent: 80,
        passengerCompensationPercent: 70,
      }),
    )
    expect(mockSetLanguageState).toHaveBeenCalledTimes(1)
    expect(mockToast).toHaveBeenCalledWith({
      title: 'settings.savedTitle',
      description: 'settings.savedDescription',
    })
  })

  it('shows an error toast if saving fails', async () => {
    mockedSetUserSettings.mockRejectedValue(new Error('Database error'))
    render(<SettingsPage />)
    await waitFor(() =>
      expect(screen.getByDisplayValue('7.5')).toBeInTheDocument(),
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'settings.saveButton' }),
    )
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'settings.errorSavingTitle',
        description: 'settings.errorSavingDescription',
        variant: 'destructive',
      })
    })
  })

  it('shows an error toast if settings fetch fails', async () => {
    mockedGetUserSettings.mockRejectedValue(new Error('fetch error'))
    render(<SettingsPage />)
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'settings.errorLoadingTitle',
          description: 'settings.errorLoadingDescription',
          variant: 'destructive',
        }),
      )
    })
  })
})
