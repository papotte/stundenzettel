import React from 'react'

import { TooltipProviderProps } from '@radix-ui/react-tooltip'
import { render, screen } from '@testing-library/react'

import ExportPage from '@/app/(app)/export/page'
import { TimeTrackerProviderProps } from '@/context/time-tracker-context'
import { authScenarios } from '@/test-utils/auth-mocks'

// Mocks
const mockReplace = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}))

jest.mock('@/components/export-preview', () => {
  const MockExportPreview = () => <div data-testid="export-preview" />
  MockExportPreview.displayName = 'MockExportPreview'
  return MockExportPreview
})

jest.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: TooltipProviderProps) => (
    <div>{children}</div>
  ),
}))
jest.mock('@/context/time-tracker-context', () => ({
  TimeTrackerProvider: ({ children }: TimeTrackerProviderProps) => (
    <div data-testid="time-tracker-provider">{children}</div>
  ),
}))
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
}))

// Use centralized auth mock
const mockAuthContext = authScenarios.unauthenticated()
jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => mockAuthContext,
}))

describe('ExportPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('redirects to login if not authenticated', () => {
    Object.assign(mockAuthContext, authScenarios.unauthenticated())
    render(<ExportPage />)
    expect(mockReplace).toHaveBeenCalledWith('/login?returnUrl=/export')
  })

  it('renders nothing if loading', () => {
    Object.assign(mockAuthContext, authScenarios.loading())
    const { container } = render(<ExportPage />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders ExportPreview and back button if authenticated', () => {
    Object.assign(mockAuthContext, authScenarios.authenticated({ uid: '123' }))
    render(<ExportPage />)
    expect(screen.getByTestId('export-preview')).toBeInTheDocument()
    expect(screen.getByTestId('time-tracker-provider')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'export_page.backButton' }),
    ).toBeInTheDocument()
  })
})
