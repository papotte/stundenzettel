import { render, screen } from '@testing-library/react';
import React from 'react';
import ExportPage from '../page';

// Mocks
const mockReplace = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}))

jest.mock('@/components/export-preview', () => () => <div data-testid="export-preview" />)

jest.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: any) => <div>{children}</div>,
}))
jest.mock('@/context/time-tracker-context', () => ({
  TimeTrackerProvider: ({ children }: any) => <div data-testid="time-tracker-provider">{children}</div>,
}))
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
}))
jest.mock('@/hooks/use-auth', () => ({
  useAuth: jest.fn(),
}))

describe('ExportPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('redirects to login if not authenticated', () => {
    require('@/hooks/use-auth').useAuth.mockReturnValue({ user: null, loading: false })
    render(<ExportPage />)
    expect(mockReplace).toHaveBeenCalledWith('/login')
  })

  it('renders nothing if loading', () => {
    require('@/hooks/use-auth').useAuth.mockReturnValue({ user: null, loading: true })
    const { container } = render(<ExportPage />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders ExportPreview and back button if authenticated', () => {
    require('@/hooks/use-auth').useAuth.mockReturnValue({ user: { uid: '123' }, loading: false })
    render(<ExportPage />)
    expect(screen.getByTestId('export-preview')).toBeInTheDocument()
    expect(screen.getByTestId('time-tracker-provider')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'export_page.backButton' })).toBeInTheDocument()
  })
}) 
