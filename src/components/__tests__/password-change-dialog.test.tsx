import React from 'react'

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { updateUserPassword } from '@/services/password-update-service'
import { authScenarios } from '@/test-utils/auth-mocks'

import PasswordChangeDialog from '../password-change-dialog'

// Mock the password update service
jest.mock('@/services/password-update-service', () => ({
  updateUserPassword: jest.fn(),
}))

const mockUpdateUserPassword = updateUserPassword as jest.MockedFunction<
  typeof updateUserPassword
>

// Mock the auth hook
const mockAuthContext = authScenarios.authenticated()
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

// Mock translation
jest.mock('@/context/i18n-context', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe('PasswordChangeDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuthContext.user = {
      uid: 'test-user-id',
      email: 'test@example.com',
      displayName: 'Test User',
    }
  })

  const renderDialog = () => {
    return render(
      <PasswordChangeDialog>
        <button>Change Password</button>
      </PasswordChangeDialog>,
    )
  }

  it('renders trigger button', () => {
    renderDialog()
    expect(screen.getByText('Change Password')).toBeInTheDocument()
  })

  it('opens dialog when trigger is clicked', async () => {
    const user = userEvent.setup()
    renderDialog()

    const trigger = screen.getByText('Change Password')
    await user.click(trigger)

    await waitFor(() => {
      expect(
        screen.getByText('settings.changePasswordTitle'),
      ).toBeInTheDocument()
    })
    expect(
      screen.getByText('settings.changePasswordDescription'),
    ).toBeInTheDocument()
    expect(screen.getByTestId('current-password-input')).toBeInTheDocument()
    expect(screen.getByTestId('new-password-input')).toBeInTheDocument()
    expect(screen.getByTestId('confirm-password-input')).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    renderDialog()

    const trigger = screen.getByText('Change Password')
    await user.click(trigger)

    await waitFor(() => {
      expect(screen.getByTestId('change-password-button')).toBeInTheDocument()
    })

    const submitButton = screen.getByTestId('change-password-button')
    await user.click(submitButton)

    await waitFor(() => {
      expect(
        screen.getByText('Current password is required'),
      ).toBeInTheDocument()
    })
  })

  it('validates password length', async () => {
    const user = userEvent.setup()
    renderDialog()

    const trigger = screen.getByText('Change Password')
    await user.click(trigger)

    await waitFor(() => {
      expect(screen.getByTestId('current-password-input')).toBeInTheDocument()
    })

    // Fill in current password and short new password
    await user.type(screen.getByTestId('current-password-input'), 'currentpass')
    await user.type(screen.getByTestId('new-password-input'), 'short')
    await user.type(screen.getByTestId('confirm-password-input'), 'short')

    const submitButton = screen.getByTestId('change-password-button')
    await user.click(submitButton)

    await waitFor(() => {
      expect(
        screen.getByText('Password must be at least 8 characters long'),
      ).toBeInTheDocument()
    })
  })

  it('validates password confirmation', async () => {
    const user = userEvent.setup()
    renderDialog()

    const trigger = screen.getByText('Change Password')
    await user.click(trigger)

    await waitFor(() => {
      expect(screen.getByTestId('current-password-input')).toBeInTheDocument()
    })

    // Fill in passwords that don't match
    await user.type(screen.getByTestId('current-password-input'), 'currentpass')
    await user.type(screen.getByTestId('new-password-input'), 'newpassword123')
    await user.type(
      screen.getByTestId('confirm-password-input'),
      'different123',
    )

    const submitButton = screen.getByTestId('change-password-button')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('New passwords do not match')).toBeInTheDocument()
    })
  })

  it('toggles password visibility', async () => {
    const user = userEvent.setup()
    renderDialog()

    const trigger = screen.getByText('Change Password')
    await user.click(trigger)

    await waitFor(() => {
      expect(screen.getByTestId('current-password-input')).toBeInTheDocument()
    })

    const currentPasswordInput = screen.getByTestId('current-password-input')
    const toggleButton = screen.getByTestId('toggle-current-password')

    expect(currentPasswordInput).toHaveAttribute('type', 'password')

    await user.click(toggleButton)
    expect(currentPasswordInput).toHaveAttribute('type', 'text')

    await user.click(toggleButton)
    expect(currentPasswordInput).toHaveAttribute('type', 'password')
  })

  it('updates password successfully', async () => {
    const user = userEvent.setup()
    mockUpdateUserPassword.mockResolvedValue()
    renderDialog()

    const trigger = screen.getByText('Change Password')
    await user.click(trigger)

    await waitFor(() => {
      expect(screen.getByTestId('current-password-input')).toBeInTheDocument()
    })

    // Fill in valid password data
    await user.type(screen.getByTestId('current-password-input'), 'currentpass')
    await user.type(screen.getByTestId('new-password-input'), 'newpassword123')
    await user.type(
      screen.getByTestId('confirm-password-input'),
      'newpassword123',
    )

    const submitButton = screen.getByTestId('change-password-button')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockUpdateUserPassword).toHaveBeenCalledWith(
        'test-user-id',
        'currentpass',
        'newpassword123',
      )
    })

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'settings.passwordUpdated',
        description: 'settings.passwordUpdatedDescription',
      })
    })
  })

  it('handles password update errors', async () => {
    const user = userEvent.setup()
    mockUpdateUserPassword.mockRejectedValue(new Error('Invalid password'))
    renderDialog()

    const trigger = screen.getByText('Change Password')
    await user.click(trigger)

    await waitFor(() => {
      expect(screen.getByTestId('current-password-input')).toBeInTheDocument()
    })

    // Fill in valid password data
    await user.type(screen.getByTestId('current-password-input'), 'wrongpass')
    await user.type(screen.getByTestId('new-password-input'), 'newpassword123')
    await user.type(
      screen.getByTestId('confirm-password-input'),
      'newpassword123',
    )

    const submitButton = screen.getByTestId('change-password-button')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'settings.error',
        description: 'settings.passwordUpdateInvalidCurrent',
        variant: 'destructive',
      })
    })
  })

  it('shows loading state during update', async () => {
    const user = userEvent.setup()
    mockUpdateUserPassword.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100)),
    )
    renderDialog()

    const trigger = screen.getByText('Change Password')
    await user.click(trigger)

    await waitFor(() => {
      expect(screen.getByTestId('current-password-input')).toBeInTheDocument()
    })

    // Fill in valid password data
    await user.type(screen.getByTestId('current-password-input'), 'currentpass')
    await user.type(screen.getByTestId('new-password-input'), 'newpassword123')
    await user.type(
      screen.getByTestId('confirm-password-input'),
      'newpassword123',
    )

    const submitButton = screen.getByTestId('change-password-button')
    await user.click(submitButton)

    // Check loading state
    expect(screen.getByText('settings.updating')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
  })

  it('closes dialog on cancel', async () => {
    const user = userEvent.setup()
    renderDialog()

    const trigger = screen.getByText('Change Password')
    await user.click(trigger)

    await waitFor(() => {
      expect(
        screen.getByText('settings.changePasswordTitle'),
      ).toBeInTheDocument()
    })

    const cancelButton = screen.getByTestId('cancel-button')
    await user.click(cancelButton)

    await waitFor(() => {
      expect(
        screen.queryByText('settings.changePasswordTitle'),
      ).not.toBeInTheDocument()
    })
  })

  it('resets form when dialog closes', async () => {
    const user = userEvent.setup()
    renderDialog()

    const trigger = screen.getByText('Change Password')
    await user.click(trigger)

    await waitFor(() => {
      expect(screen.getByTestId('current-password-input')).toBeInTheDocument()
    })

    // Fill in some data
    await user.type(screen.getByTestId('current-password-input'), 'test')

    // Close and reopen dialog
    const cancelButton = screen.getByTestId('cancel-button')
    await user.click(cancelButton)

    await user.click(trigger)

    await waitFor(() => {
      expect(screen.getByTestId('current-password-input')).toHaveValue('')
    })
  })

  it('handles unauthenticated user', async () => {
    const user = userEvent.setup()
    mockAuthContext.user = null
    renderDialog()

    const trigger = screen.getByText('Change Password')
    await user.click(trigger)

    await waitFor(() => {
      expect(screen.getByTestId('current-password-input')).toBeInTheDocument()
    })

    // Fill in valid password data
    await user.type(screen.getByTestId('current-password-input'), 'currentpass')
    await user.type(screen.getByTestId('new-password-input'), 'newpassword123')
    await user.type(
      screen.getByTestId('confirm-password-input'),
      'newpassword123',
    )

    const submitButton = screen.getByTestId('change-password-button')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'settings.error',
        description: 'settings.userNotAuthenticated',
        variant: 'destructive',
      })
    })
  })
})
