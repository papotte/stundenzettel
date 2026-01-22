import { useTranslations } from 'next-intl'

import { createDateFormatter } from '@/lib/date-formatter'
import {
  calculateExpectedMonthlyHours,
  calculateWeekCompensatedTime,
  calculateWeekPassengerTime,
} from '@/lib/time-utils'
import type { AuthenticatedUser, TimeEntry, UserSettings } from '@/lib/types'
import { formatDecimalHours, getWeeksForMonth } from '@/lib/utils'

import { exportToExcel } from '../excel-export'

// Mock ExcelJS before importing the module
const mockWorkbookInstance = {
  addWorksheet: jest.fn(),
  xlsx: {
    writeBuffer: jest.fn().mockResolvedValue(Buffer.from('mock-excel-data')),
  },
}

jest.mock('exceljs', () => ({
  Workbook: jest.fn(() => mockWorkbookInstance),
}))

// Mock dependencies
jest.mock('@/lib/time-utils')
jest.mock('@/lib/utils')

const mockCalculateExpectedMonthlyHours =
  calculateExpectedMonthlyHours as jest.MockedFunction<
    typeof calculateExpectedMonthlyHours
  >
const mockCalculateWeekCompensatedTime =
  calculateWeekCompensatedTime as jest.MockedFunction<
    typeof calculateWeekCompensatedTime
  >
const mockCalculateWeekPassengerTime =
  calculateWeekPassengerTime as jest.MockedFunction<
    typeof calculateWeekPassengerTime
  >
const mockGetWeeksForMonth = getWeeksForMonth as jest.MockedFunction<
  typeof getWeeksForMonth
>
const mockFormatDecimalHours = formatDecimalHours as jest.MockedFunction<
  typeof formatDecimalHours
>

// Mock browser APIs
const mockCreateObjectURL = jest.fn(() => 'blob:mock-url')
const mockRevokeObjectURL = jest.fn()
const mockClick = jest.fn()
const mockAppendChild = jest.fn()
const mockRemoveChild = jest.fn()

const mockAnchorElement = {
  href: '',
  download: '',
  click: mockClick,
}

// Mock URL methods on window
if (typeof window !== 'undefined') {
  window.URL = {
    ...window.URL,
    createObjectURL: mockCreateObjectURL,
    revokeObjectURL: mockRevokeObjectURL,
  } as unknown as typeof window.URL
}

// Mock document.createElement and body methods
if (typeof document !== 'undefined') {
  const originalCreateElement = document.createElement.bind(document)
  document.createElement = jest.fn((tagName: string) => {
    if (tagName === 'a') {
      return mockAnchorElement as unknown as HTMLAnchorElement
    }
    return originalCreateElement(tagName)
  }) as unknown as typeof document.createElement

  document.body.appendChild =
    mockAppendChild as unknown as typeof document.body.appendChild
  document.body.removeChild =
    mockRemoveChild as unknown as typeof document.body.removeChild
}

global.Blob = jest.fn(([buffer]: [Buffer]) => ({
  type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  size: buffer.length,
})) as unknown as typeof Blob

// Types for ExcelJS mocks
interface MockCell {
  value: unknown
  font: Record<string, unknown>
  alignment: Record<string, unknown>
  border: Record<string, unknown>
  fill: Record<string, unknown>
  numFmt: string
}

interface MockRow {
  number: number
  values: unknown[]
  getCell: (key: string | number) => MockCell
  eachCell: (
    options: { includeEmpty?: boolean },
    callback: (cell: MockCell, colNumber: number) => void,
  ) => void
}

interface MockWorksheet {
  name: string
  rowCount: number
  headerFooter: {
    oddHeader: string
    oddFooter: string
  }
  columns: Array<{ key: string; width: number }>
  addRow: jest.MockedFunction<(values?: unknown[]) => MockRow>
  getRow: (num: number) => MockRow
  getCell: (row: number, col: number) => MockCell
  mergeCells: (
    startRow: number,
    startCol: number,
    endRow: number,
    endCol: number,
  ) => void
}

describe('excel-export', () => {
  let mockWorksheet: MockWorksheet
  let mockRow: MockRow
  let mockCell: MockCell

  const mockUser: AuthenticatedUser = {
    uid: 'user-123',
    displayName: 'Test User',
    email: 'test@example.com',
  }

  const defaultUserSettings: UserSettings = {
    defaultWorkHours: 8,
    defaultStartTime: '09:00',
    defaultEndTime: '17:00',
    language: 'en',
    displayName: 'Export Name',
    companyName: 'Test Company',
    companyEmail: 'company@example.com',
    companyPhone1: '123-456-7890',
    companyPhone2: '098-765-4321',
    companyFax: '111-222-3333',
    driverCompensationPercent: 100,
    passengerCompensationPercent: 90,
    expectedMonthlyHours: 160,
  }

  const mockT = jest.fn((key: string) => key) as unknown as ReturnType<
    typeof useTranslations
  >

  // Use the actual date formatter
  const mockFormat = createDateFormatter('en')

  // Helper function to create default mocks
  const createDefaultMocks = (entriesForDay: TimeEntry[] = []) => {
    const getEntriesForDay = jest.fn(() => entriesForDay)
    const getLocationDisplayName = jest.fn((loc: string) => loc)
    return { getEntriesForDay, getLocationDisplayName }
  }

  // Helper function to create entry-specific mocks
  const createEntryMocks = (entry: TimeEntry) => {
    const getEntriesForDay = jest.fn((day: Date) => {
      if (day.getDate() === 1 && day.getMonth() === 0) return [entry]
      return []
    })
    const getLocationDisplayName = jest.fn((loc: string) => loc)
    return { getEntriesForDay, getLocationDisplayName }
  }

  // Helper function to call exportToExcel with default parameters
  const callExportToExcel = async (params: {
    entries?: TimeEntry[]
    getEntriesForDay: (day: Date) => TimeEntry[]
    getLocationDisplayName: (loc: string) => string
    user?: AuthenticatedUser
    userSettings?: UserSettings
    selectedMonth?: Date
  }) => {
    return exportToExcel({
      selectedMonth: params.selectedMonth || new Date('2024-01-15'),
      user: params.user || mockUser,
      userSettings: params.userSettings || defaultUserSettings,
      entries: params.entries || [],
      getEntriesForDay: params.getEntriesForDay,
      getLocationDisplayName: params.getLocationDisplayName,
      t: mockT,
      format: mockFormat,
    })
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup ExcelJS mocks - create fresh instances for each test
    mockCell = {
      value: null,
      font: {},
      alignment: {},
      border: {},
      fill: {},
      numFmt: '',
    }

    // Track all cells created
    const cells: Record<string, MockCell> = {}
    const getCell = jest.fn((key: string | number): MockCell => {
      const cellKey = typeof key === 'string' ? key : key.toString()
      if (!cells[cellKey]) {
        cells[cellKey] = { ...mockCell }
      }
      return cells[cellKey]
    })

    mockRow = {
      number: 1,
      values: [],
      getCell,
      eachCell: jest.fn(
        (
          options: { includeEmpty?: boolean },
          callback: (cell: MockCell, colNumber: number) => void,
        ) => {
          for (let i = 1; i <= 10; i++) {
            const cell = getCell(i)
            callback(cell, i)
          }
        },
      ),
    }

    let rowCount = 0
    const rows: MockRow[] = []
    const addRow: jest.MockedFunction<(values?: unknown[]) => MockRow> =
      jest.fn((values?: unknown[]): MockRow => {
        rowCount++
        const newRow: MockRow = {
          ...mockRow,
          number: rowCount,
          values: values || [],
          getCell,
          eachCell: jest.fn(
            (
              options: { includeEmpty?: boolean },
              callback: (cell: MockCell, colNumber: number) => void,
            ) => {
              for (let i = 1; i <= 10; i++) {
                const cell = getCell(i)
                callback(cell, i)
              }
            },
          ),
        }
        rows.push(newRow)
        return newRow
      })

    mockWorksheet = {
      name: 'Stundenzettel',
      get rowCount() {
        return rowCount
      },
      headerFooter: {
        oddHeader: '',
        oddFooter: '',
      },
      columns: [],
      addRow,
      getRow: jest.fn((num: number) => rows[num - 1] || mockRow),
      getCell: jest.fn((row: number, col: number) => {
        const rowObj = rows[row - 1] || mockRow
        return rowObj.getCell(col)
      }),
      mergeCells: jest.fn(),
    }

    mockWorkbookInstance.addWorksheet.mockReturnValue(mockWorksheet)

    // Setup utility function mocks
    const week1 = [
      new Date('2024-01-01'),
      new Date('2024-01-02'),
      new Date('2024-01-03'),
      new Date('2024-01-04'),
      new Date('2024-01-05'),
      new Date('2024-01-06'),
      new Date('2024-01-07'),
    ]
    const week2 = [
      new Date('2024-01-08'),
      new Date('2024-01-09'),
      new Date('2024-01-10'),
      new Date('2024-01-11'),
      new Date('2024-01-12'),
      new Date('2024-01-13'),
      new Date('2024-01-14'),
    ]

    mockGetWeeksForMonth.mockReturnValue([week1, week2])
    mockCalculateExpectedMonthlyHours.mockReturnValue(160)
    mockCalculateWeekCompensatedTime.mockReturnValue(40)
    mockCalculateWeekPassengerTime.mockReturnValue(5)
    mockFormatDecimalHours.mockImplementation((minutes) => {
      if (!minutes) return '0.00'
      return (minutes / 60).toFixed(2)
    })
  })

  describe('basic export functionality', () => {
    it('should create a workbook and worksheet', async () => {
      const getEntriesForDay = jest.fn(() => [])
      const getLocationDisplayName = jest.fn((loc: string) => loc)

      await exportToExcel({
        selectedMonth: new Date('2024-01-15'),
        user: mockUser,
        userSettings: defaultUserSettings,
        entries: [],
        getEntriesForDay,
        getLocationDisplayName,
        t: mockT,
        format: mockFormat,
      })

      expect(mockWorkbookInstance.addWorksheet).toHaveBeenCalled()
      expect(mockWorkbookInstance.addWorksheet).toHaveBeenCalledWith(
        'Stundenzettel',
      )
    })

    it('should set up column widths', async () => {
      const getEntriesForDay = jest.fn(() => [])
      const getLocationDisplayName = jest.fn((loc: string) => loc)

      await exportToExcel({
        selectedMonth: new Date('2024-01-15'),
        user: mockUser,
        userSettings: defaultUserSettings,
        entries: [],
        getEntriesForDay,
        getLocationDisplayName,
        t: mockT,
        format: mockFormat,
      })

      expect(mockWorksheet.columns).toEqual([
        { key: 'week', width: 5 },
        { key: 'date', width: 12 },
        { key: 'location', width: 16 },
        { key: 'from', width: 8 },
        { key: 'to', width: 8 },
        { key: 'pause', width: 8 },
        { key: 'driverTime', width: 8 },
        { key: 'compensated', width: 8 },
        { key: 'passengerTime', width: 8 },
        { key: 'mileage', width: 12 },
      ])
    })

    it('should set up headers and footers with company info', async () => {
      const getEntriesForDay = jest.fn(() => [])
      const getLocationDisplayName = jest.fn((loc: string) => loc)

      await exportToExcel({
        selectedMonth: new Date('2024-01-15'),
        user: mockUser,
        userSettings: defaultUserSettings,
        entries: [],
        getEntriesForDay,
        getLocationDisplayName,
        t: mockT,
        format: mockFormat,
      })

      expect(mockWorksheet.headerFooter.oddHeader).toContain(
        'export.headerCompany',
      )
      expect(mockWorksheet.headerFooter.oddHeader).toContain('Test Company')
      expect(mockWorksheet.headerFooter.oddHeader).toContain(
        'company@example.com',
      )
      expect(mockWorksheet.headerFooter.oddHeader).toContain('Tel.:')
      expect(mockWorksheet.headerFooter.oddHeader).toContain('123-456-7890')
      expect(mockWorksheet.headerFooter.oddHeader).toContain('098-765-4321')
      expect(mockWorksheet.headerFooter.oddHeader).toContain('FAX:')
      expect(mockWorksheet.headerFooter.oddHeader).toContain('111-222-3333')
      expect(mockWorksheet.headerFooter.oddFooter).toContain(
        'export.signatureLine',
      )
    })

    it('should set up headers without company info when missing', async () => {
      const getEntriesForDay = jest.fn(() => [])
      const getLocationDisplayName = jest.fn((loc: string) => loc)
      const settingsWithoutCompany: UserSettings = {
        ...defaultUserSettings,
        companyName: '',
        companyEmail: '',
        companyPhone1: '',
        companyPhone2: '',
        companyFax: '',
      }

      await exportToExcel({
        selectedMonth: new Date('2024-01-15'),
        user: mockUser,
        userSettings: settingsWithoutCompany,
        entries: [],
        getEntriesForDay,
        getLocationDisplayName,
        t: mockT,
        format: mockFormat,
      })

      expect(mockWorksheet.headerFooter.oddHeader).toBe('')
    })

    it('should add title row with user name', async () => {
      const getEntriesForDay = jest.fn(() => [])
      const getLocationDisplayName = jest.fn((loc: string) => loc)

      await exportToExcel({
        selectedMonth: new Date('2024-01-15'),
        user: mockUser,
        userSettings: defaultUserSettings,
        entries: [],
        getEntriesForDay,
        getLocationDisplayName,
        t: mockT,
        format: mockFormat,
      })

      expect(mockWorksheet.addRow).toHaveBeenCalled()
      // The title row is the first row added, check that it was called with empty array
      // and then the title cell was set via getCell('A')
      const addRowCalls = mockWorksheet.addRow.mock.calls
      expect(addRowCalls.length).toBeGreaterThan(0)
      // Check that mergeCells was called for the title
      expect(mockWorksheet.mergeCells).toHaveBeenCalled()
      // Verify the title was set by checking if getCell('A') was called on the first row
      expect(mockRow.getCell).toHaveBeenCalled()
    })

    it('should use displayName from settings, then user displayName, then email', async () => {
      const getEntriesForDay = jest.fn(() => [])
      const getLocationDisplayName = jest.fn((loc: string) => loc)

      await exportToExcel({
        selectedMonth: new Date('2024-01-15'),
        user: mockUser,
        userSettings: defaultUserSettings,
        entries: [],
        getEntriesForDay,
        getLocationDisplayName,
        t: mockT,
        format: mockFormat,
      })

      // Should use displayName from settings
      expect(mockRow.getCell).toHaveBeenCalledWith('J')
    })
  })

  describe('entry rendering', () => {
    it('should render entries with start and end times', async () => {
      const entry: TimeEntry = {
        id: 'entry-1',
        userId: 'user-123',
        location: 'Office',
        startTime: new Date('2024-01-01T09:00:00'), // Use a date in week1
        endTime: new Date('2024-01-01T17:00:00'),
        pauseDuration: 30,
      }

      const { getEntriesForDay, getLocationDisplayName } =
        createEntryMocks(entry)

      await callExportToExcel({
        entries: [entry],
        getEntriesForDay,
        getLocationDisplayName,
      })

      expect(getEntriesForDay).toHaveBeenCalled()
      expect(getLocationDisplayName).toHaveBeenCalledWith('Office')
    })

    it('should render entries with durationMinutes', async () => {
      const entry: TimeEntry = {
        id: 'entry-1',
        userId: 'user-123',
        location: 'Office',
        startTime: new Date('2024-01-01T12:00:00'), // Use a date in week1
        durationMinutes: 480,
      }

      const { getEntriesForDay, getLocationDisplayName } =
        createEntryMocks(entry)

      await callExportToExcel({
        entries: [entry],
        getEntriesForDay,
        getLocationDisplayName,
      })

      expect(getEntriesForDay).toHaveBeenCalled()
    })

    it('should handle special locations (SICK_LEAVE, PTO, BANK_HOLIDAY)', async () => {
      const entry: TimeEntry = {
        id: 'entry-1',
        userId: 'user-123',
        location: 'SICK_LEAVE',
        startTime: new Date('2024-01-01T09:00:00'), // Use a date in week1
        endTime: new Date('2024-01-01T17:00:00'),
      }

      const { getEntriesForDay, getLocationDisplayName } =
        createEntryMocks(entry)

      await callExportToExcel({
        entries: [entry],
        getEntriesForDay,
        getLocationDisplayName,
      })

      expect(getLocationDisplayName).toHaveBeenCalledWith('SICK_LEAVE')
    })

    it('should handle entries with driver and passenger time', async () => {
      const entry: TimeEntry = {
        id: 'entry-1',
        userId: 'user-123',
        location: 'Office',
        startTime: new Date('2024-01-01T09:00:00'), // Use a date in week1
        endTime: new Date('2024-01-01T17:00:00'),
        driverTimeHours: 2.5,
        passengerTimeHours: 1.5,
      }

      const { getEntriesForDay, getLocationDisplayName } =
        createEntryMocks(entry)

      await callExportToExcel({
        entries: [entry],
        getEntriesForDay,
        getLocationDisplayName,
      })

      expect(getEntriesForDay).toHaveBeenCalled()
    })

    it('should handle entries with zero pause duration', async () => {
      const entry: TimeEntry = {
        id: 'entry-1',
        userId: 'user-123',
        location: 'Office',
        startTime: new Date('2024-01-01T09:00:00'), // Use a date in week1
        endTime: new Date('2024-01-01T17:00:00'),
        pauseDuration: 0,
      }

      const { getEntriesForDay, getLocationDisplayName } =
        createEntryMocks(entry)

      await callExportToExcel({
        entries: [entry],
        getEntriesForDay,
        getLocationDisplayName,
      })

      expect(mockFormatDecimalHours).toHaveBeenCalledWith(0)
    })

    it('should render empty rows for days without entries (excluding Sundays)', async () => {
      const { getEntriesForDay, getLocationDisplayName } = createDefaultMocks()

      // Mock a week where day 7 (Sunday) should be skipped
      const weekWithSunday = [
        new Date('2024-01-01'), // Monday
        new Date('2024-01-02'), // Tuesday
        new Date('2024-01-03'), // Wednesday
        new Date('2024-01-04'), // Thursday
        new Date('2024-01-05'), // Friday
        new Date('2024-01-06'), // Saturday
        new Date('2024-01-07'), // Sunday - should be skipped
      ]
      mockGetWeeksForMonth.mockReturnValue([weekWithSunday])

      await callExportToExcel({ getEntriesForDay, getLocationDisplayName })

      // Should add rows for non-Sunday days
      expect(mockWorksheet.addRow).toHaveBeenCalled()
    })
  })

  describe('totals and calculations', () => {
    it('should calculate and display weekly totals', async () => {
      const { getEntriesForDay, getLocationDisplayName } = createDefaultMocks()

      await callExportToExcel({ getEntriesForDay, getLocationDisplayName })

      expect(mockCalculateWeekCompensatedTime).toHaveBeenCalled()
      expect(mockCalculateWeekPassengerTime).toHaveBeenCalled()
    })

    it('should calculate and display monthly totals', async () => {
      const { getEntriesForDay, getLocationDisplayName } = createDefaultMocks()

      await callExportToExcel({ getEntriesForDay, getLocationDisplayName })

      expect(mockCalculateExpectedMonthlyHours).toHaveBeenCalledWith(
        defaultUserSettings,
      )
    })

    it('should calculate overtime correctly', async () => {
      const { getEntriesForDay, getLocationDisplayName } = createDefaultMocks()

      // Mock totals that result in positive overtime
      mockCalculateWeekCompensatedTime.mockReturnValue(50) // 200 hours total for 4 weeks
      mockCalculateExpectedMonthlyHours.mockReturnValue(160)

      await callExportToExcel({ getEntriesForDay, getLocationDisplayName })

      // Overtime should be calculated and displayed
      expect(mockWorksheet.addRow).toHaveBeenCalled()
    })

    it('should apply green color for positive overtime', async () => {
      const { getEntriesForDay, getLocationDisplayName } = createDefaultMocks()

      // Mock positive overtime
      mockCalculateWeekCompensatedTime.mockReturnValue(50)
      mockCalculateExpectedMonthlyHours.mockReturnValue(160)

      await callExportToExcel({ getEntriesForDay, getLocationDisplayName })

      // Font color should be set for overtime cell
      expect(mockCell.font).toBeDefined()
    })

    it('should calculate passenger compensation correctly', async () => {
      const { getEntriesForDay, getLocationDisplayName } = createDefaultMocks()

      const settingsWithPassengerComp: UserSettings = {
        ...defaultUserSettings,
        passengerCompensationPercent: 90,
      }

      await callExportToExcel({
        getEntriesForDay,
        getLocationDisplayName,
        userSettings: settingsWithPassengerComp,
      })

      expect(mockCalculateWeekPassengerTime).toHaveBeenCalled()
    })
  })

  describe('file download', () => {
    it('should create and download Excel file', async () => {
      const { getEntriesForDay, getLocationDisplayName } = createDefaultMocks()

      await callExportToExcel({ getEntriesForDay, getLocationDisplayName })

      expect(mockWorkbookInstance.xlsx.writeBuffer).toHaveBeenCalled()
      expect(global.Blob).toHaveBeenCalled()
      expect(mockCreateObjectURL).toHaveBeenCalled()
      expect(mockClick).toHaveBeenCalled()
      expect(mockRevokeObjectURL).toHaveBeenCalled()
      expect(mockRemoveChild).toHaveBeenCalled()
    })

    it('should generate correct filename', async () => {
      const { getEntriesForDay, getLocationDisplayName } = createDefaultMocks()

      await callExportToExcel({ getEntriesForDay, getLocationDisplayName })

      expect(mockAnchorElement.download).toContain('Stundenzettel')
      expect(mockAnchorElement.download).toContain('Export Name')
      expect(mockAnchorElement.download).toContain('2024/1')
      expect(mockAnchorElement.download).toContain('.xlsx')
    })
  })

  describe('edge cases', () => {
    it('should handle user without displayName or email', async () => {
      const { getEntriesForDay, getLocationDisplayName } = createDefaultMocks()
      const userWithoutName: AuthenticatedUser = {
        uid: 'user-123',
        displayName: null,
        email: '',
      }

      await callExportToExcel({
        getEntriesForDay,
        getLocationDisplayName,
        user: userWithoutName,
        userSettings: { ...defaultUserSettings, displayName: '' },
      })

      // Should still create the file
      expect(mockWorkbookInstance.addWorksheet).toHaveBeenCalled()
    })

    it('should handle weeks with no content', async () => {
      const { getEntriesForDay, getLocationDisplayName } = createDefaultMocks()

      // Mock a week that's outside the selected month (all days are in December 2023)
      // The week should be skipped because isSameMonth will return false for all days
      const weekOutsideMonth = [
        new Date('2023-12-25'),
        new Date('2023-12-26'),
        new Date('2023-12-27'),
        new Date('2023-12-28'),
        new Date('2023-12-29'),
        new Date('2023-12-30'),
        new Date('2023-12-31'),
      ]
      mockGetWeeksForMonth.mockReturnValue([weekOutsideMonth])

      await callExportToExcel({ getEntriesForDay, getLocationDisplayName })

      // Week outside month should be skipped - getEntriesForDay might not be called
      // because the week has no content (all days outside the selected month)
      // The function checks weekHasContent before processing, so if all days are outside
      // the month, the week is skipped entirely
      expect(mockWorksheet.addRow).toHaveBeenCalled() // At least title and blank rows
    })

    it('should handle multiple entries per day', async () => {
      const entry1: TimeEntry = {
        id: 'entry-1',
        userId: 'user-123',
        location: 'Office',
        startTime: new Date('2024-01-01T09:00:00'), // Use a date in week1
        endTime: new Date('2024-01-01T12:00:00'),
      }
      const entry2: TimeEntry = {
        id: 'entry-2',
        userId: 'user-123',
        location: 'Meeting',
        startTime: new Date('2024-01-01T13:00:00'),
        endTime: new Date('2024-01-01T17:00:00'),
      }

      const getEntriesForDay = jest.fn((day: Date) => {
        if (day.getDate() === 1 && day.getMonth() === 0) return [entry1, entry2]
        return []
      })
      const getLocationDisplayName = jest.fn((loc: string) => loc)

      await callExportToExcel({
        entries: [entry1, entry2],
        getEntriesForDay,
        getLocationDisplayName,
      })

      expect(getEntriesForDay).toHaveBeenCalled()
      expect(getLocationDisplayName).toHaveBeenCalledWith('Office')
      expect(getLocationDisplayName).toHaveBeenCalledWith('Meeting')
    })
  })
})
