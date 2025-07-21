import React from 'react'

import { render, screen } from '@testing-library/react'

import { createMockAuthContext } from '@/test-utils/auth-mocks'

import SmartLink from '../smart-link'

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({
    href,
    children,
    className,
    ...props
  }: {
    href: string
    children: React.ReactNode
    className?: string
    [_: string]: unknown
  }) {
    return (
      <a href={href} className={className} {...props}>
        {children}
      </a>
    )
  }
})

// Use centralized auth mock
const mockAuthContext = createMockAuthContext()
jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => mockAuthContext,
}))

describe('SmartLink', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('when user is not logged in', () => {
    beforeEach(() => {
      mockAuthContext.user = null
    })

    it('renders a link to the specified href', () => {
      render(
        <SmartLink href="/login">
          <button>Get Started</button>
        </SmartLink>,
      )

      const link = screen.getByRole('link')
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/login')
    })

    it('renders children correctly', () => {
      render(
        <SmartLink href="/login">
          <button>Get Started</button>
        </SmartLink>,
      )

      const button = screen.getByRole('button', { name: /get started/i })
      expect(button).toBeInTheDocument()
    })

    it('applies custom className', () => {
      render(
        <SmartLink href="/login" className="custom-class">
          <button>Get Started</button>
        </SmartLink>,
      )

      const link = screen.getByRole('link')
      expect(link).toHaveClass('custom-class')
    })
  })

  describe('when user is logged in', () => {
    beforeEach(() => {
      mockAuthContext.user = {
        uid: 'test-user-id',
        email: 'test@example.com',
        displayName: 'Test User',
      }
    })

    it('redirects to tracker when href is /login', () => {
      render(
        <SmartLink href="/login">
          <button>Get Started</button>
        </SmartLink>,
      )

      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', '/tracker')
    })

    it('does not redirect for other hrefs', () => {
      render(
        <SmartLink href="/features">
          <button>Features</button>
        </SmartLink>,
      )

      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', '/features')
    })

    it('does not redirect for case mismatch', () => {
      render(
        <SmartLink href="/LOGIN">
          <button>Get Started</button>
        </SmartLink>,
      )

      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', '/LOGIN')
    })
  })

  describe('edge cases', () => {
    it('handles empty href', () => {
      render(
        <SmartLink href="">
          <button>Empty Link</button>
        </SmartLink>,
      )

      const link = screen.getByRole('button').closest('a')
      expect(link).toHaveAttribute('href', '')
    })

    it('handles multiple children', () => {
      render(
        <SmartLink href="/login">
          <span>Text</span>
          <button>Button</button>
          <div>Div</div>
        </SmartLink>,
      )

      expect(screen.getByText('Text')).toBeInTheDocument()
      expect(screen.getByRole('button')).toBeInTheDocument()
      expect(screen.getByText('Div')).toBeInTheDocument()
    })

    it('preserves all Link props', () => {
      render(
        <SmartLink
          href="/login"
          className="test-class"
          data-testid="smart-link"
          target="_blank"
        >
          <button>Get Started</button>
        </SmartLink>,
      )

      const link = screen.getByTestId('smart-link')
      expect(link).toHaveClass('test-class')
      expect(link).toHaveAttribute('target', '_blank')
    })
  })
})
