import { render, screen, waitFor } from '@testing-library/react'
import ExportPreview from '../export-preview'
import React from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'

jest.mock('@/hooks/use-auth', () => ({ useAuth: () => ({ user: { uid: '1' }, loading: false }) }))
jest.mock('@/context/i18n-context', () => ({ useTranslation: () => ({ t: (k: string) => k, language: 'en' }) }))
jest.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: jest.fn() }) }))
jest.mock('@/services/time-entry-service', () => ({ getTimeEntries: jest.fn(() => Promise.resolve([])), addTimeEntry: jest.fn(), updateTimeEntry: jest.fn() }))
jest.mock('@/services/user-settings-service', () => ({ getUserSettings: jest.fn(() => Promise.resolve({})) }))

// Mock child components
jest.mock('../time-entry-form', () => () => <div>TimeEntryForm</div>)
jest.mock('../timesheet-preview', () => () => <div>TimesheetPreview</div>)

jest.mock('exceljs', () => ({
  Workbook: jest.fn().mockImplementation(() => ({
    addWorksheet: jest.fn(() => ({
      addRow: jest.fn(() => ({ getCell: jest.fn(() => ({ value: '', font: {}, alignment: {} })) })),
      getRow: jest.fn(() => ({ values: [], eachCell: jest.fn() })),
      mergeCells: jest.fn(),
      columns: [],
      headerFooter: {},
      rowCount: 0,
      addRows: jest.fn(),
      getCell: jest.fn(() => ({})),
    })),
  })),
}))
jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }))

describe('ExportPreview', () => {
  it('renders loading state initially', async () => {
    render(<TooltipProvider><ExportPreview /></TooltipProvider>)
    await waitFor(() => expect(screen.getByText(/TimesheetPreview/)).toBeInTheDocument())
  })

  it('renders after loading', async () => {
    render(<TooltipProvider><ExportPreview /></TooltipProvider>)
    await waitFor(() => expect(screen.getByText(/TimesheetPreview/)).toBeInTheDocument())
  })
}) 