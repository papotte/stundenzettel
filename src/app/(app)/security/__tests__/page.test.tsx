import React from 'react'

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { AuthProvider } from '@/context/auth-context'
import { deleteUserAccount } from '@/services/user-deletion-service'
import { authScenarios } from '@/test-utils/auth-mocks'

import SecurityPage from '../page'

// Mock the delete user account service
jest.mock('@/services/user-deletion-service', () => ({
  deleteUserAccount: jest.fn(),
}))

const mockDeleteUserAccount = deleteUserAccount as jest.MockedFunction<
  typeof deleteUserAccount
>

// Use centralized auth mock with password update and account deletion functions
const mockAuthContext = authScenarios.withPasswordUpdate()
mockAuthContext.deleteAccount = jest.fn()

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

const renderWithProviders = (component: React.ReactElement) => {
  return render(<AuthProvider>{component}</AuthProvider>)
}

describe('SecurityPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuthContext.user = {
      uid: 'test-user-id',
      email: 'test@example.com',
      displayName: 'Test User',
    }
    mockAuthContext.loading = false
    mockDeleteUserAccount.mockClear()
  })

  describe('when user is not authenticated', () => {
    beforeEach(() => {
      mockAuthContext.user = null
    })

    it('redirects to login page', async () => {
      renderWithProviders(<SecurityPage />)
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/login?returnUrl=/security')
      })
    })
  })

  describe('when user is authenticated', () => {
    it('renders the security page', async () => {
      renderWithProviders(<SecurityPage />)
      await waitFor(() => {
        expect(screen.getByText('settings.security')).toBeInTheDocument()
      })
      expect(
        screen.getByText('settings.securityDescription'),
      ).toBeInTheDocument()
      expect(screen.getByText('settings.backToTracker')).toBeInTheDocument()
    })

    it('shows change password section', async () => {
      renderWithProviders(<SecurityPage />)
      await waitFor(() => {
        expect(screen.getByText('settings.security')).toBeInTheDocument()
      })
      expect(screen.getByText('settings.password')).toBeInTheDocument()
      expect(
        screen.getByText('settings.passwordDescription'),
      ).toBeInTheDocument()
    })

    it('shows delete account section', async () => {
      renderWithProviders(<SecurityPage />)
      await waitFor(() => {
        expect(screen.getByText('settings.security')).toBeInTheDocument()
      })
      // There are two elements with the same text, so use getAllByText
      expect(
        screen.getAllByText('settings.deleteAccount').length,
      ).toBeGreaterThan(1)
      expect(
        screen.getByText('settings.deleteAccountDescription'),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /settings\.deleteAccount/i }),
      ).toBeInTheDocument()
    })

    xit('changes password successfully', async () => {
      const user = userEvent.setup()
      mockAuthContext.updatePassword!.mockResolvedValue(undefined)
      renderWithProviders(<SecurityPage />)
      await waitFor(() => {
        expect(screen.getByText('settings.security')).toBeInTheDocument()
      })
      await user.type(screen.getByLabelText(/current password/i), 'oldpassword')
      await user.type(screen.getByLabelText(/new password/i), 'newpassword123')
      await user.type(
        screen.getByLabelText(/confirm new password/i),
        'newpassword123',
      )
      await user.click(
        screen.getByRole('button', { name: /settings\.change/i }),
      )
      await waitFor(() => {
        expect(mockAuthContext.updatePassword).toHaveBeenCalledWith(
          'oldpassword',
          'newpassword123',
        )
      })
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'settings.passwordUpdated',
          description: 'settings.passwordUpdatedDescription',
        })
      })
      // Form should be cleared
      expect(screen.getByLabelText(/current password/i)).toHaveValue('')
      expect(screen.getByLabelText(/new password/i)).toHaveValue('')
      expect(screen.getByLabelText(/confirm new password/i)).toHaveValue('')
    })

    xit('shows error when passwords do not match', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SecurityPage />)
      await waitFor(() => {
        expect(screen.getByText('settings.security')).toBeInTheDocument()
      })
      await user.type(screen.getByLabelText(/current password/i), 'oldpassword')
      await user.type(screen.getByLabelText(/new password/i), 'newpassword123')
      await user.type(
        screen.getByLabelText(/confirm new password/i),
        'differentpassword',
      )
      await user.click(
        screen.getByRole('button', { name: /settings\.change/i }),
      )
      await waitFor(() => {
        expect(
          screen.getByText(/settings\.passwordsDoNotMatch/i),
        ).toBeInTheDocument()
      })
    })

    xit('shows error when password change fails', async () => {
      const user = userEvent.setup()
      mockAuthContext.updatePassword!.mockRejectedValue(
        new Error('Invalid password'),
      )
      renderWithProviders(<SecurityPage />)
      await waitFor(() => {
        expect(screen.getByText('settings.security')).toBeInTheDocument()
      })
      await user.type(screen.getByLabelText(/current password/i), 'oldpassword')
      await user.type(screen.getByLabelText(/new password/i), 'newpassword123')
      await user.type(
        screen.getByLabelText(/confirm new password/i),
        'newpassword123',
      )
      await user.click(
        screen.getByRole('button', { name: /settings\.change/i }),
      )
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'settings.error',
          description: 'settings.passwordUpdateError',
          variant: 'destructive',
        })
      })
    })

    xit('validates password requirements', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SecurityPage />)
      await waitFor(() => {
        expect(screen.getByText('settings.security')).toBeInTheDocument()
      })
      await user.type(screen.getByLabelText(/current password/i), 'oldpassword')
      await user.type(screen.getByLabelText(/new password/i), 'short') // Too short
      await user.type(screen.getByLabelText(/confirm new password/i), 'short')
      await user.click(
        screen.getByRole('button', { name: /settings\.change/i }),
      )
      await waitFor(() => {
        expect(
          screen.getByText(/settings\.passwordTooShort/i),
        ).toBeInTheDocument()
      })
    })

    xit('shows loading state while changing password', async () => {
      const user = userEvent.setup()
      mockAuthContext.updatePassword!.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      )
      renderWithProviders(<SecurityPage />)
      await waitFor(() => {
        expect(screen.getByText('settings.security')).toBeInTheDocument()
      })
      await user.type(screen.getByLabelText(/current password/i), 'oldpassword')
      await user.type(screen.getByLabelText(/new password/i), 'newpassword123')
      await user.type(
        screen.getByLabelText(/confirm new password/i),
        'newpassword123',
      )
      await user.click(
        screen.getByRole('button', { name: /settings\.change/i }),
      )
      expect(screen.getByText('settings.updating')).toBeInTheDocument()
    })

    it('opens delete account confirmation dialog', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SecurityPage />)
      await waitFor(() => {
        expect(screen.getByText('settings.security')).toBeInTheDocument()
      })
      await user.click(
        screen.getByRole('button', { name: /settings\.deleteAccount/i }),
      )
      await waitFor(() => {
        expect(
          screen.getByText(/settings\.deleteAccountConfirmTitle/i),
        ).toBeInTheDocument()
        expect(
          screen.getByText(/settings\.deleteAccountConfirmDescription/i),
        ).toBeInTheDocument()
        expect(
          screen.getByText(/settings\.deleteAccountPasswordLabel/i),
        ).toBeInTheDocument()
      })
    })

    it('requires password to enable delete confirmation button', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SecurityPage />)
      await waitFor(() => {
        expect(screen.getByText('settings.security')).toBeInTheDocument()
      })
      await user.click(
        screen.getByRole('button', { name: /settings\.deleteAccount/i }),
      )

      await waitFor(() => {
        const confirmButton = screen.getByRole('button', {
          name: /settings\.deleteAccountConfirmButton/i,
        })
        expect(confirmButton).toBeDisabled()
      })

      // Enter password
      const passwordInput = screen.getByPlaceholderText(
        /settings\.deleteAccountPasswordPlaceholder/i,
      )
      await user.type(passwordInput, 'testpassword')

      await waitFor(() => {
        const confirmButton = screen.getByRole('button', {
          name: /settings\.deleteAccountConfirmButton/i,
        })
        expect(confirmButton).not.toBeDisabled()
      })
    })

    it('deletes account when confirmed with password', async () => {
      const user = userEvent.setup()
      mockDeleteUserAccount.mockResolvedValue(undefined)
      renderWithProviders(<SecurityPage />)
      await waitFor(() => {
        expect(screen.getByText('settings.security')).toBeInTheDocument()
      })
      await user.click(
        screen.getByRole('button', { name: /settings\.deleteAccount/i }),
      )

      await waitFor(() => {
        expect(
          screen.getByText(/settings\.deleteAccountConfirmTitle/i),
        ).toBeInTheDocument()
      })

      // Enter password
      const passwordInput = screen.getByPlaceholderText(
        /settings\.deleteAccountPasswordPlaceholder/i,
      )
      await user.type(passwordInput, 'testpassword')

      // Confirm delete
      const confirmButton = screen.getByRole('button', {
        name: /settings\.deleteAccountConfirmButton/i,
      })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(mockDeleteUserAccount).toHaveBeenCalledWith(
          'test-user-id',
          'testpassword',
        )
      })
    })

    it('shows success toast and redirects after successful deletion', async () => {
      const user = userEvent.setup()
      mockDeleteUserAccount.mockResolvedValue(undefined)
      renderWithProviders(<SecurityPage />)
      await waitFor(() => {
        expect(screen.getByText('settings.security')).toBeInTheDocument()
      })
      await user.click(
        screen.getByRole('button', { name: /settings\.deleteAccount/i }),
      )

      const passwordInput = screen.getByPlaceholderText(
        /settings\.deleteAccountPasswordPlaceholder/i,
      )
      await user.type(passwordInput, 'testpassword')

      const confirmButton = screen.getByRole('button', {
        name: /settings\.deleteAccountConfirmButton/i,
      })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'settings.deleteAccountSuccess',
          description: 'settings.deleteAccountConfirmDescription',
        })
        expect(mockReplace).toHaveBeenCalledWith('/login')
      })
    })

    it('shows error when account deletion fails', async () => {
      const user = userEvent.setup()
      mockDeleteUserAccount.mockRejectedValue(new Error('Deletion failed'))
      renderWithProviders(<SecurityPage />)
      await waitFor(() => {
        expect(screen.getByText('settings.security')).toBeInTheDocument()
      })
      await user.click(
        screen.getByRole('button', { name: /settings\.deleteAccount/i }),
      )

      const passwordInput = screen.getByPlaceholderText(
        /settings\.deleteAccountPasswordPlaceholder/i,
      )
      await user.type(passwordInput, 'testpassword')

      const confirmButton = screen.getByRole('button', {
        name: /settings\.deleteAccountConfirmButton/i,
      })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'settings.deleteAccountError',
          description: 'settings.deleteAccountError',
          variant: 'destructive',
        })
      })
    })

    it('shows invalid password error for credential errors', async () => {
      const user = userEvent.setup()
      mockDeleteUserAccount.mockRejectedValue(
        new Error('Invalid password credential'),
      )
      renderWithProviders(<SecurityPage />)
      await waitFor(() => {
        expect(screen.getByText('settings.security')).toBeInTheDocument()
      })
      await user.click(
        screen.getByRole('button', { name: /settings\.deleteAccount/i }),
      )

      const passwordInput = screen.getByPlaceholderText(
        /settings\.deleteAccountPasswordPlaceholder/i,
      )
      await user.type(passwordInput, 'wrongpassword')

      const confirmButton = screen.getByRole('button', {
        name: /settings\.deleteAccountConfirmButton/i,
      })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'settings.deleteAccountError',
          description: 'settings.deleteAccountInvalidPassword',
          variant: 'destructive',
        })
      })
    })

    it('cancels delete account confirmation', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SecurityPage />)
      await waitFor(() => {
        expect(screen.getByText('settings.security')).toBeInTheDocument()
      })
      await user.click(
        screen.getByRole('button', { name: /settings\.deleteAccount/i }),
      )
      await waitFor(() => {
        expect(
          screen.getByText(/settings\.deleteAccountConfirmTitle/i),
        ).toBeInTheDocument()
      })
      const cancelButton = screen.getByRole('button', {
        name: /settings\.cancel/i,
      })
      await user.click(cancelButton)
      await waitFor(() => {
        expect(
          screen.queryByText(/settings\.deleteAccountConfirmTitle/i),
        ).not.toBeInTheDocument()
      })
    })

    xit('shows error when account deletion fails', async () => {
      const user = userEvent.setup()
      mockAuthContext.deleteAccount!.mockRejectedValue(
        new Error('Deletion failed'),
      )
      renderWithProviders(<SecurityPage />)
      await waitFor(() => {
        expect(screen.getByText('settings.security')).toBeInTheDocument()
      })
      await user.click(
        screen.getByRole('button', { name: /settings\.deleteAccount/i }),
      )
      await waitFor(() => {
        expect(
          screen.getByText(/settings\.deleteAccountConfirmTitle/i),
        ).toBeInTheDocument()
      })
      const confirmDeleteButton = screen.getAllByRole('button', {
        name: /settings\.deleteAccount/i,
      })[1]
      await user.click(confirmDeleteButton)
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'settings.error',
          description: 'settings.deleteAccountError',
          variant: 'destructive',
        })
      })
    })

    it('navigates back to tracker', async () => {
      renderWithProviders(<SecurityPage />)
      await waitFor(() => {
        expect(screen.getByText('settings.security')).toBeInTheDocument()
      })
      const backButton = screen.getByRole('link', {
        name: /settings\.backToTracker/i,
      })
      expect(backButton).toHaveAttribute('href', '/tracker')
    })
  })
})
