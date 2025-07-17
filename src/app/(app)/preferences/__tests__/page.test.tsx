import React from 'react'

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { AuthProvider } from '@/context/auth-context'
import type { UserSettings } from '@/lib/types'
import {
  getUserSettings,
  setUserSettings,
} from '@/services/user-settings-service'
import { createMockAuthContext } from '@/test-utils/auth-mocks'

import PreferencesPage from '../page'

// --- MOCKS ---
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockPush,
  }),
}))

// Use centralized auth mock
const mockAuthContext = createMockAuthContext()
jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => mockAuthContext,
}))

// Mock the toast hook
const mockToast = jest.fn()
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}))

// Mock Next.js router
const mockReplace = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}))

jest.mock('@/services/user-settings-service')
const mockedGetUserSettings = getUserSettings as jest.Mock
const mockedSetUserSettings = setUserSettings as jest.Mock

const mockSettings: UserSettings = {
  displayName: 'Test User',
  defaultWorkHours: 7.5,
  defaultStartTime: '08:30',
  defaultEndTime: '16:30',
  language: 'de',
}

let currentSettings: UserSettings

const renderWithProviders = (component: React.ReactElement) => {
  return render(<AuthProvider>{component}</AuthProvider>)
}

describe('PreferencesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuthContext.user = {
      uid: 'test-user-id',
      email: 'test@example.com',
      displayName: 'Test User',
    }
    mockAuthContext.loading = false

    currentSettings = { ...mockSettings }
    mockedGetUserSettings.mockImplementation(() =>
      Promise.resolve(currentSettings),
    )
    mockedSetUserSettings.mockImplementation((uid, newSettings) => {
      currentSettings = { ...currentSettings, ...newSettings }
      return Promise.resolve()
    })
  })

  describe('when user is not authenticated', () => {
    beforeEach(() => {
      mockAuthContext.user = null
    })

    it('redirects to login page', async () => {
      renderWithProviders(<PreferencesPage />)

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/login')
      })
    })
  })

  describe('when user is authenticated', () => {
    it('renders the preferences form', async () => {
      renderWithProviders(<PreferencesPage />)

      await waitFor(() => {
        expect(screen.getByText('settings.preferences')).toBeInTheDocument()
      })

      expect(
        screen.getByText('settings.preferencesDescription'),
      ).toBeInTheDocument()
      expect(screen.getByText('settings.backToTracker')).toBeInTheDocument()
      expect(screen.getByTestId('saveButton')).toBeInTheDocument()
    })

    it('loads user settings and populates form', async () => {
      renderWithProviders(<PreferencesPage />)

      await waitFor(() => {
        expect(mockedGetUserSettings).toHaveBeenCalledWith('test-user-id')
      })

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test User')).toBeInTheDocument()
        expect(screen.getByDisplayValue('7.5')).toBeInTheDocument()
        expect(screen.getByDisplayValue('08:30')).toBeInTheDocument()
        expect(screen.getByDisplayValue('16:30')).toBeInTheDocument()
      })
    })

    it('saves settings when form is submitted', async () => {
      const user = userEvent.setup()
      mockedSetUserSettings.mockResolvedValue(undefined)

      renderWithProviders(<PreferencesPage />)

      await waitFor(() => {
        expect(screen.getByText('settings.preferences')).toBeInTheDocument()
      })

      // Wait for form to be populated with mock data
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test User')).toBeInTheDocument()
      })

      // Change a field to make the form dirty
      const displayNameInput = screen.getByLabelText('settings.displayName')
      await user.clear(displayNameInput)
      await user.type(displayNameInput, 'New Export Name')

      // Wait for the change to be registered
      await waitFor(() => {
        expect(displayNameInput).toHaveValue('New Export Name')
      })

      // Submit the form
      const form = document.querySelector('form')
      form.dispatchEvent(
        new window.Event('submit', { bubbles: true, cancelable: true }),
      )

      // Check that the service was called first
      await waitFor(() => {
        expect(mockedSetUserSettings).toHaveBeenCalledWith(
          'test-user-id',
          expect.objectContaining({
            displayName: 'New Export Name',
            defaultWorkHours: 7.5,
            defaultStartTime: '08:30',
            defaultEndTime: '16:30',
            language: 'de',
          }),
        )
      })

      // Then check that the toast was shown
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'settings.savedTitle',
          description: 'settings.savedDescription',
        })
      })
    })

    it('shows error toast when saving fails', async () => {
      const user = userEvent.setup()
      mockedSetUserSettings.mockRejectedValue(new Error('Save failed'))

      renderWithProviders(<PreferencesPage />)

      await waitFor(() => {
        expect(screen.getByText('settings.preferences')).toBeInTheDocument()
      })

      // Wait for form to be populated
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test User')).toBeInTheDocument()
      })

      // Change a field to make the form dirty
      const displayNameInput = screen.getByLabelText('settings.displayName')
      await user.clear(displayNameInput)
      await user.type(displayNameInput, 'Changed Name')

      // Submit the form
      const form = document.querySelector('form')
      form.dispatchEvent(
        new window.Event('submit', { bubbles: true, cancelable: true }),
      )

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'settings.errorSavingTitle',
          description: 'settings.errorSavingDescription',
          variant: 'destructive',
        })
      })
    })

    it('shows error toast when loading settings fails', async () => {
      mockedGetUserSettings.mockRejectedValue(new Error('Load failed'))

      renderWithProviders(<PreferencesPage />)

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'settings.errorLoadingTitle',
          description: 'settings.errorLoadingDescription',
          variant: 'destructive',
        })
      })
    })

    it('updates language when language is changed', async () => {
      const user = userEvent.setup()
      mockedSetUserSettings.mockResolvedValue(undefined)

      renderWithProviders(<PreferencesPage />)

      await waitFor(() => {
        expect(screen.getByText('settings.preferences')).toBeInTheDocument()
      })

      // Wait for form to be populated
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test User')).toBeInTheDocument()
      })

      // Change language
      const languageSelect = screen.getByRole('combobox', {
        name: /settings\.language/i,
      })
      await user.click(languageSelect)

      const germanOption = screen.getByRole('option', { name: /deutsch/i })
      await user.click(germanOption)

      // Submit the form
      const form = document.querySelector('form')
      form.dispatchEvent(
        new window.Event('submit', { bubbles: true, cancelable: true }),
      )

      await waitFor(() => {
        expect(mockedSetUserSettings).toHaveBeenCalledWith(
          'test-user-id',
          expect.objectContaining({
            language: 'de',
          }),
        )
      })
    })

    it('validates form fields', async () => {
      const user = userEvent.setup()

      renderWithProviders(<PreferencesPage />)

      await waitFor(() => {
        expect(screen.getByText('settings.preferences')).toBeInTheDocument()
      })

      // Wait for form to be populated
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test User')).toBeInTheDocument()
      })

      const workHoursInput = screen.getByRole('spinbutton', {
        name: /settings\.defaultWorkHours/i,
      })
      await user.clear(workHoursInput)
      await user.type(workHoursInput, '12') // Invalid: more than 10

      const saveButton = screen.getByTestId('saveButton')
      await user.click(saveButton)

      // Should show validation error
      await waitFor(() => {
        // Check for validation error - the exact message may vary
        const errorElement = screen.getByText(/Cannot be more than 10 hours/i)
        expect(errorElement).toBeInTheDocument()
      })
    })

    it('navigates back to tracker', async () => {
      renderWithProviders(<PreferencesPage />)

      await waitFor(() => {
        expect(screen.getByText('settings.preferences')).toBeInTheDocument()
      })

      const backButton = screen.getByRole('link', {
        name: /settings\.backToTracker/i,
      })
      expect(backButton).toHaveAttribute('href', '/tracker')
    })
  })

  describe('form fields', () => {
    beforeEach(() => {
      mockedGetUserSettings.mockResolvedValue({
        displayName: '',
        defaultWorkHours: 8,
        defaultStartTime: '09:00',
        defaultEndTime: '17:00',
        language: 'en',
      })
    })

    it('renders all form fields with correct labels', async () => {
      renderWithProviders(<PreferencesPage />)

      await waitFor(() => {
        expect(screen.getByText('settings.preferences')).toBeInTheDocument()
      })

      expect(
        screen.getByLabelText(/settings\.displayName/i),
      ).toBeInTheDocument()
      expect(screen.getByLabelText(/settings\.language/i)).toBeInTheDocument()
      expect(
        screen.getByLabelText(/settings\.defaultWorkHours/i),
      ).toBeInTheDocument()
      expect(
        screen.getByLabelText(/settings\.defaultStartTime/i),
      ).toBeInTheDocument()
      expect(
        screen.getByLabelText(/settings\.defaultEndTime/i),
      ).toBeInTheDocument()
    })

    it('shows field descriptions', async () => {
      renderWithProviders(<PreferencesPage />)

      await waitFor(() => {
        expect(screen.getByText('settings.preferences')).toBeInTheDocument()
      })

      expect(
        screen.getByText(/settings\.displayNameDescription/i),
      ).toBeInTheDocument()
      expect(
        screen.getByText(/settings\.languageDescription/i),
      ).toBeInTheDocument()
      expect(
        screen.getByText(/settings\.defaultWorkHoursDescription/i),
      ).toBeInTheDocument()
    })
  })
})
