import {
  RESEND_AUDIENCE_ID,
  ResendService,
  createResendService,
  handleResendError,
} from '../resend-service'

// Mock the Resend package
const mockContactsCreate = jest.fn()
const mockContactsUpdate = jest.fn()
const mockContactcsRemove = jest.fn()
const mockEmailsSend = jest.fn()

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    contacts: {
      create: mockContactsCreate,
      update: mockContactsUpdate,
      remove: mockContactcsRemove,
    },
    emails: {
      send: mockEmailsSend,
    },
  })),
}))

describe('ResendService', () => {
  const mockApiKey = 'test-api-key'
  const mockConfig = {
    apiKey: mockApiKey,
    defaultFrom: 'Test <test@example.com>',
    defaultAudienceId: RESEND_AUDIENCE_ID,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('RESEND_AUDIENCE_ID', () => {
    it('should export the audience ID constant', () => {
      expect(RESEND_AUDIENCE_ID).toBe('b99a5561-f0df-4730-9988-1704e4fcfda1')
    })
  })

  describe('createResendService', () => {
    it('should create a service instance with environment configuration', () => {
      const originalEnv = process.env.RESEND_API_KEY
      process.env.RESEND_API_KEY = mockApiKey

      try {
        const service = createResendService()
        expect(service).toBeInstanceOf(ResendService)
      } finally {
        process.env.RESEND_API_KEY = originalEnv
      }
    })

    it('should throw error when API key is not configured', () => {
      const originalEnv = process.env.RESEND_API_KEY
      delete process.env.RESEND_API_KEY

      try {
        expect(() => createResendService()).toThrow(
          'RESEND_API_KEY is not configured',
        )
      } finally {
        process.env.RESEND_API_KEY = originalEnv
      }
    })

    it('should use default configuration values', () => {
      const originalEnv = process.env.RESEND_API_KEY
      process.env.RESEND_API_KEY = mockApiKey

      try {
        const service = createResendService()
        expect(service).toBeInstanceOf(ResendService)
      } finally {
        process.env.RESEND_API_KEY = originalEnv
      }
    })
  })

  describe('createContact', () => {
    it('should create a contact successfully', async () => {
      const service = new ResendService(mockConfig)
      const contactData = {
        email: 'test@example.com',
        audienceId: RESEND_AUDIENCE_ID,
        firstName: 'John',
        lastName: 'Doe',
      }

      const mockResponse = { id: 'contact-123', email: 'test@example.com' }
      mockContactsCreate.mockResolvedValue({
        data: mockResponse,
        error: null,
      })

      const result = await service.createContact(contactData)

      expect(result).toEqual(mockResponse)
      expect(mockContactsCreate).toHaveBeenCalledWith({
        email: 'test@example.com',
        audienceId: RESEND_AUDIENCE_ID,
        firstName: 'John',
        lastName: 'Doe',
        unsubscribed: undefined,
      })
    })

    it('should throw error when contact creation fails', async () => {
      const service = new ResendService(mockConfig)
      const contactData = {
        email: 'test@example.com',
        audienceId: RESEND_AUDIENCE_ID,
      }

      mockContactsCreate.mockResolvedValue({
        data: null,
        error: { message: 'Contact creation failed' },
      })

      await expect(service.createContact(contactData)).rejects.toThrow(
        'Failed to create contact: Contact creation failed',
      )
    })

    it('should handle optional fields correctly', async () => {
      const service = new ResendService(mockConfig)
      const contactData = {
        email: 'test@example.com',
        audienceId: RESEND_AUDIENCE_ID,
        unsubscribed: true,
      }

      const mockResponse = { id: 'contact-123' }
      mockContactsCreate.mockResolvedValue({
        data: mockResponse,
        error: null,
      })

      await service.createContact(contactData)

      expect(mockContactsCreate).toHaveBeenCalledWith({
        email: 'test@example.com',
        audienceId: RESEND_AUDIENCE_ID,
        firstName: undefined,
        lastName: undefined,
        unsubscribed: true,
      })
    })
  })

  describe('updateContact', () => {
    it('should update a contact successfully', async () => {
      const service = new ResendService(mockConfig)
      const email = 'test@example.com'
      const updates = {
        firstName: 'Jane',
        lastName: 'Smith',
        unsubscribed: false,
      }

      const mockResponse = { id: 'contact-123', email: 'test@example.com' }
      mockContactsUpdate.mockResolvedValue({
        data: mockResponse,
        error: null,
      })

      const result = await service.updateContact(email, updates)

      expect(result).toEqual(mockResponse)
      expect(mockContactsUpdate).toHaveBeenCalledWith({
        email: 'test@example.com',
        audienceId: RESEND_AUDIENCE_ID,
        firstName: 'Jane',
        lastName: 'Smith',
        unsubscribed: false,
      })
    })

    it('should throw error when contact update fails', async () => {
      const service = new ResendService(mockConfig)
      const email = 'test@example.com'
      const updates = { firstName: 'Jane' }

      mockContactsUpdate.mockResolvedValue({
        data: null,
        error: { message: 'Contact update failed' },
      })

      await expect(service.updateContact(email, updates)).rejects.toThrow(
        'Failed to update contact: Contact update failed',
      )
    })

    it('should handle partial updates', async () => {
      const service = new ResendService(mockConfig)
      const email = 'test@example.com'
      const updates = { firstName: 'Jane' }

      const mockResponse = { id: 'contact-123' }
      mockContactsUpdate.mockResolvedValue({
        data: mockResponse,
        error: null,
      })

      await service.updateContact(email, updates)

      expect(mockContactsUpdate).toHaveBeenCalledWith({
        email: 'test@example.com',
        audienceId: RESEND_AUDIENCE_ID,
        firstName: 'Jane',
        lastName: undefined,
        unsubscribed: undefined,
      })
    })

    it('should use default audience ID when not provided in config', async () => {
      const service = new ResendService({
        apiKey: mockApiKey,
        defaultFrom: 'Test <test@example.com>',
      })
      const email = 'test@example.com'
      const updates = { firstName: 'Jane' }

      const mockResponse = { id: 'contact-123' }
      mockContactsUpdate.mockResolvedValue({
        data: mockResponse,
        error: null,
      })

      await service.updateContact(email, updates)

      expect(mockContactsUpdate).toHaveBeenCalledWith({
        email: 'test@example.com',
        audienceId: RESEND_AUDIENCE_ID,
        firstName: 'Jane',
        lastName: undefined,
        unsubscribed: undefined,
      })
    })
  })

  describe('removeContact', () => {
    it('should use default audience ID', async () => {
      const service = new ResendService(mockConfig)
      const email = 'test@example.com'
      const mockResponse = { id: 'contact-123' }
      mockContactcsRemove.mockResolvedValue({
        data: mockResponse,
        error: null,
      })

      await service.removeContact(email)

      expect(mockContactcsRemove).toHaveBeenCalledWith({
        email: 'test@example.com',
        audienceId: RESEND_AUDIENCE_ID,
      })
    })
  })

  describe('sendEmail', () => {
    it('should send an email successfully with HTML', async () => {
      const service = new ResendService(mockConfig)
      const emailOptions = {
        from: 'test@example.com',
        to: ['recipient@example.com'],
        subject: 'Test Subject',
        html: '<p>Test content</p>',
      }

      const mockResponse = { id: 'email-123' }
      mockEmailsSend.mockResolvedValue({
        data: mockResponse,
        error: null,
      })

      const result = await service.sendEmail(emailOptions)

      expect(result).toEqual(mockResponse)
      expect(mockEmailsSend).toHaveBeenCalledWith({
        from: 'test@example.com',
        to: ['recipient@example.com'],
        subject: 'Test Subject',
        html: '<p>Test content</p>',
        react: undefined,
      })
    })

    it('should send an email successfully with React component', async () => {
      const service = new ResendService(mockConfig)
      const mockReactElement = { type: 'div', props: { children: 'Test' } }
      const emailOptions = {
        from: 'test@example.com',
        to: ['recipient@example.com'],
        subject: 'Test Subject',
        react: mockReactElement as React.ReactElement,
      }

      const mockResponse = { id: 'email-123' }
      mockEmailsSend.mockResolvedValue({
        data: mockResponse,
        error: null,
      })

      const result = await service.sendEmail(emailOptions)

      expect(result).toEqual(mockResponse)
      expect(mockEmailsSend).toHaveBeenCalledWith({
        from: 'test@example.com',
        to: ['recipient@example.com'],
        subject: 'Test Subject',
        html: undefined,
        react: mockReactElement,
      })
    })

    it('should throw error when email sending fails', async () => {
      const service = new ResendService(mockConfig)
      const emailOptions = {
        from: 'test@example.com',
        to: ['recipient@example.com'],
        subject: 'Test Subject',
        html: '<p>Test content</p>',
      }

      mockEmailsSend.mockResolvedValue({
        data: null,
        error: { message: 'Email sending failed' },
      })

      await expect(service.sendEmail(emailOptions)).rejects.toThrow(
        'Failed to send email: Email sending failed',
      )
    })
  })

  describe('constructor', () => {
    it('should set default values correctly', () => {
      const service = new ResendService({
        apiKey: mockApiKey,
      })

      expect(service).toBeInstanceOf(ResendService)
    })

    it('should use provided configuration values', () => {
      const customConfig = {
        apiKey: mockApiKey,
        defaultFrom: 'Custom <custom@example.com>',
        defaultAudienceId: 'custom-audience-id',
      }

      const service = new ResendService(customConfig)
      expect(service).toBeInstanceOf(ResendService)
    })
  })
})

describe('handleResendError', () => {
  it('should handle Error instances', () => {
    const error = new Error('Test error message')
    const result = handleResendError(error)

    expect(result).toEqual({
      message: 'Test error message',
      status: 400,
    })
  })

  it('should handle unknown error types', () => {
    const error = 'String error'
    const result = handleResendError(error)

    expect(result).toEqual({
      message: 'Unexpected error',
      status: 500,
    })
  })

  it('should handle null/undefined errors', () => {
    const result1 = handleResendError(null)
    const result2 = handleResendError(undefined)

    expect(result1).toEqual({
      message: 'Unexpected error',
      status: 500,
    })
    expect(result2).toEqual({
      message: 'Unexpected error',
      status: 500,
    })
  })

  it('should log errors to console', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    const error = new Error('Test error')

    handleResendError(error)

    expect(consoleSpy).toHaveBeenCalledWith('Resend service error:', error)
    consoleSpy.mockRestore()
  })
})
