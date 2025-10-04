import React from 'react'

import { render, screen, waitFor } from '@jest-setup'
import userEvent from '@testing-library/user-event'

import { createMockAuthContext } from '@/test-utils/auth-mocks'

import LoginPage from '../page'

// --- MOCKS ---
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => new URLSearchParams(),
}))

// This mock is crucial. It prevents the real firebase.ts from running and
// trying to initialize the Firebase SDK during tests. We provide a dummy `auth`
// object that is sufficient for the component's internal checks.
jest.mock('@/lib/firebase', () => ({
  auth: {
    onAuthStateChanged: jest.fn(),
  },
}))

const mockSignInWithEmailAndPassword = jest.fn()
const mockCreateUserWithEmailAndPassword = jest.fn()
const mockSignInWithPopup = jest.fn()

// This mock intercepts the actual Firebase SDK calls made by the component.
// By not using `jest.requireActual`, we ensure the test is fully isolated.
jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: (...args: []) =>
    mockSignInWithEmailAndPassword(...args),
  createUserWithEmailAndPassword: (...args: []) =>
    mockCreateUserWithEmailAndPassword(...args),
  signInWithPopup: (...args: []) => mockSignInWithPopup(...args),
  GoogleAuthProvider: jest.fn(),
  setPersistence: jest.fn().mockResolvedValue(undefined),
  browserLocalPersistence: 'local',
}))

// Use centralized auth mock
const mockAuthContext = createMockAuthContext({})
jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => mockAuthContext,
}))

const mockToast = jest.fn()
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}))

// --- TESTS ---
describe('LoginPage', () => {
  describe('Production Environment', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      jest.resetModules()
      // Reset the environment variable for each test if needed
      process.env.NEXT_PUBLIC_ENVIRONMENT = 'production'
    })

    it('renders sign-in and sign-up tabs', () => {
      render(<LoginPage />)
      expect(
        screen.getByRole('tab', { name: 'login.signInTab' }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('tab', { name: 'login.signUpTab' }),
      ).toBeInTheDocument()
    })

    it('allows signing in with email and password', async () => {
      const user = userEvent.setup()
      mockSignInWithEmailAndPassword.mockResolvedValue({})
      render(<LoginPage />)

      await user.type(
        screen.getByLabelText('login.emailLabel'),
        'test@example.com',
      )
      await user.type(
        screen.getByLabelText('login.passwordLabel'),
        'password123',
      )
      await user.click(
        screen.getByRole('button', { name: 'login.signInButton' }),
      )

      await waitFor(() => {
        expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
          expect.any(Object),
          'test@example.com',
          'password123',
        )
        expect(mockPush).toHaveBeenCalledWith('/tracker')
      })
    })

    it('allows signing up with email and password', async () => {
      const user = userEvent.setup()
      mockCreateUserWithEmailAndPassword.mockResolvedValue({
        user: { email: 'new@example.com' },
      })

      // Mock the fetch call for adding contact to Resend
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      })

      render(<LoginPage />)

      // Go to sign up tab
      await user.click(screen.getByRole('tab', { name: 'login.signUpTab' }))

      // With separate state, getByLabelText will now work correctly for the active tab.
      await user.type(
        screen.getByLabelText('login.emailLabel'),
        'new@example.com',
      )
      await user.type(
        screen.getByLabelText('login.passwordLabel'),
        'newpassword',
      )
      await user.click(
        screen.getByRole('button', { name: 'login.signUpButton' }),
      )

      await waitFor(() => {
        expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
          expect.any(Object),
          'new@example.com',
          'newpassword',
        )
        expect(global.fetch).toHaveBeenCalledWith('/api/contacts/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'new@example.com' }),
        })
        expect(mockPush).toHaveBeenCalledWith('/tracker')
      })
    })

    it('handles Google sign-in', async () => {
      const user = userEvent.setup()
      mockSignInWithPopup.mockResolvedValue({
        user: {
          email: 'test@example.com',
          metadata: {
            creationTime: '2024-01-01T00:00:00.000Z',
            lastSignInTime: '2024-01-01T00:00:00.000Z', // Same time means new user
          },
        },
      })

      // Mock the fetch call for adding contact to Resend (for new users)
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      })

      render(<LoginPage />)

      await user.click(
        screen.getByRole('button', { name: 'login.signInWithGoogle' }),
      )

      await waitFor(() => {
        expect(mockSignInWithPopup).toHaveBeenCalled()
        expect(global.fetch).toHaveBeenCalledWith('/api/contacts/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@example.com' }),
        })
        expect(mockPush).toHaveBeenCalledWith('/tracker')
      })
    })

    it('shows a toast message on authentication failure', async () => {
      const user = userEvent.setup()
      const errorMessage = 'Invalid credentials'
      mockSignInWithEmailAndPassword.mockRejectedValue(new Error(errorMessage))
      render(<LoginPage />)

      await user.type(
        screen.getByLabelText('login.emailLabel'),
        'test@example.com',
      )
      await user.type(
        screen.getByLabelText('login.passwordLabel'),
        'wrongpassword',
      )
      await user.click(
        screen.getByRole('button', { name: 'login.signInButton' }),
      )

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'login.authFailedTitle',
          description: expect.stringContaining(errorMessage),
          variant: 'destructive',
        })
      })
      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  describe('Development/Test Environment', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      jest.resetModules()
      // Reset the environment variable for each test if needed
      process.env.NEXT_PUBLIC_ENVIRONMENT = 'development'
    })

    it('renders mock user selection screen', () => {
      render(<LoginPage />)
      expect(screen.getByText('login.selectMockUser')).toBeInTheDocument()
      expect(screen.getByTestId('login-as-User Example')).toBeInTheDocument()
      expect(screen.getByTestId('login-as-Admin Example')).toBeInTheDocument()
    })

    it('logs in a mock user and redirects', async () => {
      const user = userEvent.setup()
      mockSignInWithEmailAndPassword.mockResolvedValue({})

      render(<LoginPage />)

      await user.click(screen.getByTestId('login-as-Admin Example'))

      await waitFor(() => {
        expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
          expect.any(Object),
          'admin@example.com',
          'password123',
        )
        expect(mockPush).toHaveBeenCalledWith('/tracker')
      })
    })
  })
})
