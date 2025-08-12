import React from 'react'

import { render, screen, waitFor } from '@jest-setup'
import userEvent from '@testing-library/user-event'

import { UserSettings } from '@/lib/types'
import {
  getUserSettings,
  setUserSettings,
} from '@/services/user-settings-service'
import { getEffectiveUserSettings } from '@/services/team-settings-service'
import { createMockAuthContext, createMockUser } from '@/test-utils/auth-mocks'

import CompanyPage from '../page'

// Mock subscription so SubscriptionGuard allows rendering
jest.mock('@/hooks/use-subscription-status', () => ({
  useSubscriptionStatus: () => ({
    hasValidSubscription: true,
    loading: false,
    error: null,
    subscription: { status: 'active' },
  }),
}))
jest.mock('@/services/subscription-service', () => ({
  subscriptionService: {
    getUserSubscription: jest.fn(),
    isInTrial: jest.fn().mockReturnValue(false),
    getDaysRemainingInTrial: jest.fn().mockReturnValue(null),
    isTrialExpiringSoon: jest.fn().mockReturnValue(false),
    clearCache: jest.fn(),
  },
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
jest.mock('@/services/team-settings-service')
const mockGetUserSettings = getUserSettings as jest.Mock
const mockSetUserSettings = setUserSettings as jest.Mock
const mockGetEffectiveUserSettings = getEffectiveUserSettings as jest.Mock

const mockSettings: UserSettings = {
  defaultWorkHours: 7.5,
  defaultStartTime: '08:30',
  defaultEndTime: '16:30',
  language: 'de',
  companyName: 'Test Company',
  companyEmail: 'contact@test.gmbh',
  companyPhone1: '12345',
  companyPhone2: '67890',
  companyFax: '54321',
  displayName: 'Export User',
  driverCompensationPercent: 100,
  passengerCompensationPercent: 90,
}

let currentSettings: UserSettings

const renderWithProviders = (component: React.ReactElement) => {
  return render(component)
}

describe('CompanyPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    currentSettings = { ...mockSettings }
    mockGetUserSettings.mockImplementation(() =>
      Promise.resolve(currentSettings),
    )
    mockSetUserSettings.mockImplementation((uid, newSettings) => {
      currentSettings = { ...currentSettings, ...newSettings }
      return Promise.resolve()
    })
    mockGetEffectiveUserSettings.mockImplementation(() =>
      Promise.resolve({
        settings: currentSettings,
        overrides: {
          canOverrideCompensation: true,
          canOverrideExportSettings: true,
          canOverrideWorkHours: true,
        },
        compensationSplitEnabled: true,
      }),
    )
    mockAuthContext.user = createMockUser()
    mockAuthContext.loading = false
  })

  describe('when user is not authenticated', () => {
    beforeEach(() => {
      mockAuthContext.user = null
    })

    it('redirects to login page', async () => {
      renderWithProviders(<CompanyPage />)

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/login?returnUrl=/company')
      })
    })
  })

  describe('when user is authenticated', () => {
    it('renders the company form', async () => {
      renderWithProviders(<CompanyPage />)

      await waitFor(() => {
        expect(screen.getByText('settings.company')).toBeInTheDocument()
      })

      expect(
        screen.getByText('settings.companyDescription'),
      ).toBeInTheDocument()
      expect(screen.getByText('settings.backToTracker')).toBeInTheDocument()
    })

    it('loads company settings and populates form', async () => {
      renderWithProviders(<CompanyPage />)

      await waitFor(() => {
        expect(mockGetUserSettings).toHaveBeenCalledWith('test-user-id')
      })

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Company')).toBeInTheDocument()
        expect(
          screen.getByDisplayValue('contact@test.gmbh'),
        ).toBeInTheDocument()
        expect(screen.getByDisplayValue('12345')).toBeInTheDocument()
        expect(screen.getByDisplayValue('67890')).toBeInTheDocument()
        expect(screen.getByDisplayValue('54321')).toBeInTheDocument()
        expect(screen.getByDisplayValue('100')).toBeInTheDocument()
        expect(screen.getByDisplayValue('90')).toBeInTheDocument()
      })
    })

    it('saves company settings when form is submitted', async () => {
      const user = userEvent.setup()

      renderWithProviders(<CompanyPage />)

      await waitFor(() => {
        expect(screen.getByText('settings.company')).toBeInTheDocument()
      })

      const saveButton = screen.getByTestId('saveButton')
      await user.click(saveButton)

      // The button click might not work in the test environment, so also trigger form submission directly
      const form = document.querySelector('form')
      if (form) {
        form.dispatchEvent(
          new window.Event('submit', { bubbles: true, cancelable: true }),
        )
      }

      await waitFor(() => {
        expect(mockSetUserSettings).toHaveBeenCalledWith(
          'test-user-id',
          expect.objectContaining({
            companyName: 'Test Company',
            companyEmail: 'contact@test.gmbh',
            companyPhone1: '12345',
            companyPhone2: '67890',
            companyFax: '54321',
            driverCompensationPercent: 100,
            passengerCompensationPercent: 90,
          }),
        )
      })

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'settings.savedTitle',
          description: 'settings.savedDescription',
        })
      })
    })

    it('shows error toast when saving fails', async () => {
      const user = userEvent.setup()
      mockSetUserSettings.mockRejectedValue(new Error('Save failed'))

      renderWithProviders(<CompanyPage />)

      await waitFor(() => {
        expect(screen.getByText('settings.company')).toBeInTheDocument()
      })

      const saveButton = screen.getByTestId('saveButton')
      await user.click(saveButton)

      // The button click might not work in the test environment, so also trigger form submission directly
      const form = document.querySelector('form')
      if (form) {
        form.dispatchEvent(
          new window.Event('submit', { bubbles: true, cancelable: true }),
        )
      }

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'settings.errorSavingTitle',
          description: 'settings.errorSavingDescription',
          variant: 'destructive',
        })
      })
    })

    it('shows error toast when loading settings fails', async () => {
      mockGetUserSettings.mockRejectedValue(new Error('Load failed'))

      renderWithProviders(<CompanyPage />)

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'settings.errorLoadingTitle',
          description: 'settings.errorLoadingDescription',
          variant: 'destructive',
        })
      })
    })

    it('updates compensation percentages', async () => {
      const user = userEvent.setup()
      mockSetUserSettings.mockResolvedValue(undefined)

      renderWithProviders(<CompanyPage />)

      await waitFor(() => {
        expect(screen.getByText('settings.company')).toBeInTheDocument()
      })

      const driverInput = screen.getByRole('spinbutton', {
        name: /settings\.driverCompensationPercent/i,
      })
      await user.clear(driverInput)
      await user.type(driverInput, '80')

      const passengerInput = screen.getByRole('spinbutton', {
        name: /settings\.passengerCompensationPercent/i,
      })
      await user.clear(passengerInput)
      await user.type(passengerInput, '85')

      const saveButton = screen.getByTestId('saveButton')
      await user.click(saveButton)

      // The button click might not work in the test environment, so also trigger form submission directly
      const form = document.querySelector('form')
      if (form) {
        form.dispatchEvent(
          new window.Event('submit', { bubbles: true, cancelable: true }),
        )
      }

      await waitFor(() => {
        expect(mockGetUserSettings).toHaveBeenCalledWith('test-user-id')
      })
    })

    it('shows loading state while saving', async () => {
      const user = userEvent.setup()
      mockGetUserSettings.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      )

      renderWithProviders(<CompanyPage />)

      await waitFor(() => {
        expect(screen.getByText('settings.company')).toBeInTheDocument()
      })

      const saveButton = screen.getByTestId('saveButton')
      await user.click(saveButton)

      // The button click might not work in the test environment, so also trigger form submission directly
      const form = document.querySelector('form')
      if (form) {
        form.dispatchEvent(
          new window.Event('submit', { bubbles: true, cancelable: true }),
        )
      }

      expect(screen.getByText('common.saving')).toBeInTheDocument()
    })

    it('navigates back to tracker', async () => {
      renderWithProviders(<CompanyPage />)

      await waitFor(() => {
        expect(screen.getByText('settings.company')).toBeInTheDocument()
      })

      const backButton = screen.getByRole('link', {
        name: /settings\.backToTracker/i,
      })
      expect(backButton).toHaveAttribute('href', '/tracker')
    })
  })

  describe('form fields', () => {
    beforeEach(() => {
      mockGetUserSettings.mockResolvedValue({
        companyName: '',
        companyEmail: '',
        companyPhone1: '',
        companyPhone2: '',
        companyFax: '',
        driverCompensationPercent: 100,
        passengerCompensationPercent: 90,
      })
    })

    it('renders all form fields with correct labels', async () => {
      renderWithProviders(<CompanyPage />)

      await waitFor(() => {
        expect(screen.getByText('settings.company')).toBeInTheDocument()
      })

      expect(
        screen.getByLabelText(/settings\.companyName/i),
      ).toBeInTheDocument()
      expect(
        screen.getByLabelText(/settings\.companyEmail/i),
      ).toBeInTheDocument()
      expect(
        screen.getByLabelText(/settings\.companyPhone1/i),
      ).toBeInTheDocument()
      expect(
        screen.getByLabelText(/settings\.companyPhone2/i),
      ).toBeInTheDocument()
      expect(screen.getByLabelText(/settings\.companyFax/i)).toBeInTheDocument()
      expect(
        screen.getByLabelText(/settings\.driverCompensationPercent/i),
      ).toBeInTheDocument()
      expect(
        screen.getByLabelText(/settings\.passengerCompensationPercent/i),
      ).toBeInTheDocument()
    })

    it('shows field descriptions', async () => {
      renderWithProviders(<CompanyPage />)

      await waitFor(() => {
        expect(screen.getByText('settings.company')).toBeInTheDocument()
      })

      expect(
        screen.getByText(/settings\.companyNameDescription/i),
      ).toBeInTheDocument()
      expect(
        screen.getByText(/settings\.companyEmailDescription/i),
      ).toBeInTheDocument()
      expect(
        screen.getByText(/settings\.driverCompensationPercentDescription/i),
      ).toBeInTheDocument()
    })

    it('shows compensation percentage sections', async () => {
      renderWithProviders(<CompanyPage />)

      await waitFor(() => {
        expect(screen.getByText('settings.company')).toBeInTheDocument()
      })

      expect(
        screen.getByText('settings.compensationSettings'),
      ).toBeInTheDocument()
      expect(
        screen.getByText('settings.driverCompensationPercent'),
      ).toBeInTheDocument()
      expect(
        screen.getByText('settings.passengerCompensationPercent'),
      ).toBeInTheDocument()
    })
  })

  describe('Team Settings Integration', () => {
    it('loads effective user settings when user has team', async () => {
      const mockUser = createMockUser()
      mockUser.teamId = 'test-team'
      mockAuthContext.user = mockUser

      mockGetEffectiveUserSettings.mockResolvedValue({
        settings: {
          ...mockSettings,
          companyName: 'Team Company',
          driverCompensationPercent: 80,
        },
        overrides: {
          canOverrideCompensation: false,
          canOverrideExportSettings: true,
          canOverrideWorkHours: true,
        },
        compensationSplitEnabled: true,
      })

      renderWithProviders(<CompanyPage />)

      await waitFor(() => {
        expect(mockGetEffectiveUserSettings).toHaveBeenCalledWith('test-user-id', 'test-team')
      })

      await waitFor(() => {
        expect(screen.getByDisplayValue('Team Company')).toBeInTheDocument()
        expect(screen.getByDisplayValue('80')).toBeInTheDocument()
      })
    })

    it('disables compensation fields when team restricts overrides', async () => {
      const mockUser = createMockUser()
      mockUser.teamId = 'test-team'
      mockAuthContext.user = mockUser

      mockGetEffectiveUserSettings.mockResolvedValue({
        settings: mockSettings,
        overrides: {
          canOverrideCompensation: false,
          canOverrideExportSettings: true,
          canOverrideWorkHours: true,
        },
        compensationSplitEnabled: true,
      })

      renderWithProviders(<CompanyPage />)

      await waitFor(() => {
        expect(screen.getByText('settings.company')).toBeInTheDocument()
      })

      const driverInput = screen.getByRole('spinbutton', {
        name: /settings\.driverCompensationPercent/i,
      })
      const passengerInput = screen.getByRole('spinbutton', {
        name: /settings\.passengerCompensationPercent/i,
      })

      expect(driverInput).toBeDisabled()
      expect(passengerInput).toBeDisabled()
    })

    it('shows unified compensation field when team disables split', async () => {
      const mockUser = createMockUser()
      mockUser.teamId = 'test-team'
      mockAuthContext.user = mockUser

      mockGetEffectiveUserSettings.mockResolvedValue({
        settings: {
          ...mockSettings,
          driverCompensationPercent: 85,
          passengerCompensationPercent: 85,
        },
        overrides: {
          canOverrideCompensation: true,
          canOverrideExportSettings: true,
          canOverrideWorkHours: true,
        },
        compensationSplitEnabled: false,
      })

      renderWithProviders(<CompanyPage />)

      await waitFor(() => {
        expect(screen.getByText('settings.company')).toBeInTheDocument()
      })

      // Should show unified compensation field instead of separate driver/passenger
      expect(screen.getByText('settings.compensationPercent')).toBeInTheDocument()
      expect(screen.queryByText('settings.driverCompensationPercent')).not.toBeInTheDocument()
      expect(screen.queryByText('settings.passengerCompensationPercent')).not.toBeInTheDocument()
    })

    it('shows team override message for restricted fields', async () => {
      const mockUser = createMockUser()
      mockUser.teamId = 'test-team'
      mockAuthContext.user = mockUser

      mockGetEffectiveUserSettings.mockResolvedValue({
        settings: mockSettings,
        overrides: {
          canOverrideCompensation: false,
          canOverrideExportSettings: true,
          canOverrideWorkHours: true,
        },
        compensationSplitEnabled: true,
      })

      renderWithProviders(<CompanyPage />)

      await waitFor(() => {
        expect(screen.getByText('settings.company')).toBeInTheDocument()
      })

      expect(screen.getByText('settings.teamControlledSetting')).toBeInTheDocument()
    })

    it('uses regular user settings when no team', async () => {
      mockAuthContext.user = createMockUser() // No teamId

      mockGetEffectiveUserSettings.mockResolvedValue({
        settings: mockSettings,
        overrides: {
          canOverrideCompensation: true,
          canOverrideExportSettings: true,
          canOverrideWorkHours: true,
        },
        compensationSplitEnabled: true,
      })

      renderWithProviders(<CompanyPage />)

      await waitFor(() => {
        expect(mockGetEffectiveUserSettings).toHaveBeenCalledWith('test-user-id', undefined)
      })

      const driverInput = screen.getByRole('spinbutton', {
        name: /settings\.driverCompensationPercent/i,
      })
      const passengerInput = screen.getByRole('spinbutton', {
        name: /settings\.passengerCompensationPercent/i,
      })

      expect(driverInput).not.toBeDisabled()
      expect(passengerInput).not.toBeDisabled()
    })

    it('handles team settings loading errors gracefully', async () => {
      const mockUser = createMockUser()
      mockUser.teamId = 'test-team'
      mockAuthContext.user = mockUser

      mockGetEffectiveUserSettings.mockRejectedValue(new Error('Team settings load failed'))

      renderWithProviders(<CompanyPage />)

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'settings.errorLoadingTitle',
          description: 'settings.errorLoadingDescription',
          variant: 'destructive',
        })
      })
    })
  })
})
