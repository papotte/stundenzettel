import { render, screen } from '@jest-setup'

import { authScenarios, setupAuthMock } from '@/test-utils/auth-mocks'

import ProtectedPage from '../page'

// Mock SubscriptionGuard component
jest.mock('@/components/subscription-guard', () => {
  return function MockSubscriptionGuard({
    children,
  }: {
    children: React.ReactNode
  }) {
    return <div data-testid="subscription-guard">{children}</div>
  }
})

describe('ProtectedPage', () => {
  beforeEach(() => {
    setupAuthMock(authScenarios.authenticated())
  })

  it('renders subscription guard wrapper', () => {
    render(<ProtectedPage />)

    expect(screen.getByTestId('subscription-guard')).toBeInTheDocument()
  })

  it('renders protected content', () => {
    render(<ProtectedPage />)

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
    expect(
      screen.getByText(/this content is only visible to users/i),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Welcome to the Premium Features!'),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/you have access to all premium features/i),
    ).toBeInTheDocument()
  })

  it('renders with correct styling classes', () => {
    render(<ProtectedPage />)

    const container = screen.getByText('Protected Content').closest('div')
    expect(container).toHaveClass('container', 'mx-auto', 'px-4', 'py-8')

    const premiumSection = screen
      .getByText('Welcome to the Premium Features!')
      .closest('div')
    expect(premiumSection).toHaveClass(
      'bg-green-50',
      'border',
      'border-green-200',
      'rounded-lg',
    )
  })
})
