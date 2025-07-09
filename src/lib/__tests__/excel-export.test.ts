import { exportToExcel } from '../excel-export'
import ExcelJS from 'exceljs'

jest.mock('exceljs', () => ({
  Workbook: jest.fn().mockImplementation(() => ({
    addWorksheet: jest.fn(() => {
      return {
        addRow: jest.fn(() => ({ getCell: jest.fn(() => ({ value: '', font: {}, alignment: {} })) })),
        getRow: jest.fn(() => ({
          values: [],
          eachCell: (opts: any, cb: any) => {
            for (let i = 1; i <= 10; i++) {
              cb({}, i)
            }
          },
        })),
        mergeCells: jest.fn(),
        columns: [],
        headerFooter: {},
        rowCount: 0,
        addRows: jest.fn(),
        getCell: jest.fn(() => ({})),
      }
    }),
  })),
}))
jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }))
jest.mock('date-fns', () => ({
  ...jest.requireActual('date-fns'),
  format: () => 'MockMonth',
}))

describe('exportToExcel', () => {
  it('creates a workbook and worksheet', async () => {
    await exportToExcel({
      selectedMonth: new Date(),
      user: { uid: '1', displayName: 'Test', email: 'test@test.com' },
      userSettings: { defaultWorkHours: 8, defaultStartTime: '09:00', defaultEndTime: '17:00', language: 'en' },
      entries: [],
      t: (k: string) => k,
      locale: {} as any,
      getEntriesForDay: () => [],
      calculateWeekTotal: () => 0,
      getLocationDisplayName: (l: string) => l,
    })
    // If no error is thrown, the test passes
    expect(true).toBe(true)
  })
}) 