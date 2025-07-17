import React from 'react'

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { TooltipProvider } from '@/components/ui/tooltip'
import { exportToExcel } from '@/lib/excel-export'
import { getTimeEntries } from '@/services/time-entry-service'
import { getUserSettings } from '@/services/user-settings-service'
import { createMockAuthContext } from '@/test-utils/auth-mocks'

import ExportPreview from '../export-preview'

// Mock the time entry service
jest.mock('@/services/time-entry-service', () => ({
  getTimeEntries: jest.fn(),
  deleteTimeEntry: jest.fn(),
}))

// Mock the user settings service
jest.mock('@/services/user-settings-service', () => ({
  getUserSettings: jest.fn(),
}))

// Mock the excel export
jest.mock('@/lib/excel-export', () => ({
  exportToExcel: jest.fn(),
}))

const mockGetTimeEntries = getTimeEntries as jest.MockedFunction<
  typeof getTimeEntries
>
const mockGetUserSettings = getUserSettings as jest.MockedFunction<
  typeof getUserSettings
>
const mockExportToExcel = exportToExcel as jest.MockedFunction<
  typeof exportToExcel
>

// Mock the toast hook
const mockToast = jest.fn()
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}))

// Mock window.print
const mockPrint = jest.fn()
Object.defineProperty(window, 'print', {
  value: mockPrint,
  writable: true,
})

// Use centralized auth mock
const mockAuthContext = createMockAuthContext()

jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => mockAuthContext,
}))

const renderWithTooltipProvider = (component: React.ReactElement) => {
  return render(<TooltipProvider>{component}</TooltipProvider>)
}

describe('ExportPreview', () => {
  const mockUserSettings = {
    defaultWorkHours: 8,
    defaultStartTime: '09:00',
    defaultEndTime: '17:00',
    language: 'en' as const,
    displayName: 'Test User',
    companyName: 'Test Company',
    companyEmail: 'test@company.com',
  }

  const mockTimeEntries = [
    {
      id: 'entry-1',
      userId: 'test-user-id',
      startTime: new Date('2024-01-15T09:00:00'),
      endTime: new Date('2024-01-15T17:00:00'),
      location: 'Office',
      pauseDuration: 30,
    },
    {
      id: 'entry-2',
      userId: 'test-user-id',
      startTime: new Date('2024-01-16T09:00:00'),
      endTime: new Date('2024-01-16T17:00:00'),
      location: 'Home',
      pauseDuration: 45,
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockPrint.mockClear()

    // Set up authenticated user
    mockAuthContext.user = {
      uid: 'test-user-id',
      email: 'test@example.com',
      displayName: 'Test User',
    }

    // Set up default service responses
    mockGetTimeEntries.mockResolvedValue(mockTimeEntries)
    mockGetUserSettings.mockResolvedValue(mockUserSettings)
  })

  describe('when loading', () => {
    beforeEach(() => {
      mockGetTimeEntries.mockImplementation(() => new Promise(() => {}))
    })

    it('shows loading skeleton', () => {
      renderWithTooltipProvider(<ExportPreview />)

      // Check for skeleton elements (they don't have data-testid, so check by class)
      const skeletonElements = screen.getAllByTestId('skeleton')
      expect(skeletonElements.length).toBeGreaterThan(0)
    })
  })

  describe('when data is loaded', () => {
    it('renders the export preview with current month', async () => {
      renderWithTooltipProvider(<ExportPreview />)

      await waitFor(() => {
        expect(screen.getByTestId('export-preview-month')).toBeInTheDocument()
      })

      const currentMonth = new Date().toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
      expect(screen.getByTestId('export-preview-month')).toHaveTextContent(
        currentMonth,
      )
    })

    it('shows navigation buttons', async () => {
      renderWithTooltipProvider(<ExportPreview />)

      await waitFor(() => {
        expect(
          screen.getByTestId('export-preview-previous-month-button'),
        ).toBeInTheDocument()
        expect(
          screen.getByTestId('export-preview-next-month-button'),
        ).toBeInTheDocument()
      })
    })

    it('shows export buttons', async () => {
      renderWithTooltipProvider(<ExportPreview />)

      await waitFor(() => {
        expect(
          screen.getByTestId('export-preview-export-button'),
        ).toBeInTheDocument()
        expect(
          screen.getByTestId('export-preview-pdf-button'),
        ).toBeInTheDocument()
      })
    })

    it('enables export buttons when data is available', async () => {
      renderWithTooltipProvider(<ExportPreview />)

      await waitFor(() => {
        const exportButton = screen.getByTestId('export-preview-export-button')
        const pdfButton = screen.getByTestId('export-preview-pdf-button')
        expect(exportButton).not.toBeDisabled()
        expect(pdfButton).not.toBeDisabled()
      })
    })

    it('disables export buttons when no data is available', async () => {
      mockGetTimeEntries.mockResolvedValue([])
      renderWithTooltipProvider(<ExportPreview />)

      await waitFor(() => {
        const exportButton = screen.getByTestId('export-preview-export-button')
        const pdfButton = screen.getByTestId('export-preview-pdf-button')
        expect(exportButton).toBeDisabled()
        expect(pdfButton).toBeDisabled()
      })
    })
  })

  describe('navigation', () => {
    it('navigates to previous month when previous button is clicked', async () => {
      const user = userEvent.setup()
      renderWithTooltipProvider(<ExportPreview />)

      await waitFor(() => {
        expect(
          screen.getByTestId('export-preview-previous-month-button'),
        ).toBeInTheDocument()
      })

      const previousButton = screen.getByTestId(
        'export-preview-previous-month-button',
      )
      await user.click(previousButton)

      // Should show previous month
      const previousMonth = new Date()
      previousMonth.setMonth(previousMonth.getMonth() - 1)
      const expectedMonth = previousMonth.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })

      await waitFor(() => {
        expect(screen.getByTestId('export-preview-month')).toHaveTextContent(
          expectedMonth,
        )
      })
    })

    it('navigates to next month when next button is clicked', async () => {
      const user = userEvent.setup()
      renderWithTooltipProvider(<ExportPreview />)

      await waitFor(() => {
        expect(
          screen.getByTestId('export-preview-next-month-button'),
        ).toBeInTheDocument()
      })

      const nextButton = screen.getByTestId('export-preview-next-month-button')
      await user.click(nextButton)

      // Should show next month
      const nextMonth = new Date()
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      const expectedMonth = nextMonth.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })

      await waitFor(() => {
        expect(screen.getByTestId('export-preview-month')).toHaveTextContent(
          expectedMonth,
        )
      })
    })
  })

  describe('export functionality', () => {
    it('calls exportToExcel when export button is clicked', async () => {
      const user = userEvent.setup()
      renderWithTooltipProvider(<ExportPreview />)

      await waitFor(() => {
        expect(
          screen.getByTestId('export-preview-export-button'),
        ).toBeInTheDocument()
      })

      const exportButton = screen.getByTestId('export-preview-export-button')
      await user.click(exportButton)

      expect(mockExportToExcel).toHaveBeenCalledWith({
        selectedMonth: expect.any(Date),
        user: mockAuthContext.user,
        userSettings: mockUserSettings,
        entries: mockTimeEntries,
        t: expect.any(Function),
        locale: expect.any(Object),
        getEntriesForDay: expect.any(Function),
        getLocationDisplayName: expect.any(Function),
      })
    })

    it('calls window.print when PDF export button is clicked', async () => {
      const user = userEvent.setup()
      renderWithTooltipProvider(<ExportPreview />)

      await waitFor(() => {
        expect(
          screen.getByTestId('export-preview-pdf-button'),
        ).toBeInTheDocument()
      })

      const pdfButton = screen.getByTestId('export-preview-pdf-button')
      await user.click(pdfButton)

      expect(mockPrint).toHaveBeenCalled()
    })
  })

  describe('when user is not authenticated', () => {
    beforeEach(() => {
      mockAuthContext.user = null
    })

    it('does not load data', () => {
      renderWithTooltipProvider(<ExportPreview />)

      expect(mockGetTimeEntries).not.toHaveBeenCalled()
      expect(mockGetUserSettings).not.toHaveBeenCalled()
    })
  })

  describe('tooltips', () => {
    it('shows tooltip when export buttons are disabled due to no data', async () => {
      mockGetTimeEntries.mockResolvedValue([])
      const user = userEvent.setup()
      renderWithTooltipProvider(<ExportPreview />)

      await waitFor(() => {
        expect(
          screen.getByTestId('export-preview-export-button'),
        ).toBeDisabled()
      })

      const exportButton = screen.getByTestId('export-preview-export-button')
      await user.hover(exportButton)

      await waitFor(() => {
        expect(screen.getAllByText('export_preview.noDataHint')).toHaveLength(2)
      })
    })
  })
})
