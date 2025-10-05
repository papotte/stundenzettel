import { Resend } from 'resend'

export const RESEND_AUDIENCE_ID = 'b99a5561-f0df-4730-9988-1704e4fcfda1'

export interface ResendContact {
  email: string
  audienceId: string
  firstName?: string
  lastName?: string
  unsubscribed?: boolean
}

export interface ResendEmailOptions {
  from: string
  to: string[]
  subject: string
  html?: string
  react?: React.ReactElement
}

export interface ResendServiceConfig {
  apiKey: string
  defaultFrom?: string
  defaultAudienceId?: string
}

export class ResendService {
  private resend: Resend
  private defaultFrom: string
  private defaultAudienceId?: string

  constructor(config: ResendServiceConfig) {
    this.resend = new Resend(config.apiKey)
    this.defaultFrom =
      config.defaultFrom || 'TimeWise Tracker <noreply@papotte.dev>'
    this.defaultAudienceId = config.defaultAudienceId
  }

  /**
   * Create a new contact in Resend
   */
  async createContact(contact: ResendContact) {
    const { data, error } = await this.resend.contacts.create({
      email: contact.email,
      audienceId: contact.audienceId,
      firstName: contact.firstName,
      lastName: contact.lastName,
      unsubscribed: contact.unsubscribed,
    })

    if (error) {
      throw new Error(`Failed to create contact: ${error.message}`)
    }

    return data
  }

  /**
   * Update an existing contact in Resend by email
   */
  async updateContact(
    email: string,
    updates: {
      firstName?: string
      lastName?: string
      unsubscribed?: boolean
    },
  ) {
    const { data, error } = await this.resend.contacts.update({
      email,
      audienceId: this.defaultAudienceId || RESEND_AUDIENCE_ID,
      firstName: updates.firstName,
      lastName: updates.lastName,
      unsubscribed: updates.unsubscribed,
    })

    if (error) {
      throw new Error(`Failed to update contact: ${error.message}`)
    }

    return data
  }

  /**
   * Remove a contact from Resend
   * Note: This method may need to be implemented based on Resend API capabilities
   */
  async removeContact(email: string) {
    const { data, error } = await this.resend.contacts.remove({
      email,
      audienceId: this.defaultAudienceId || RESEND_AUDIENCE_ID,
    })

    if (error) {
      throw new Error(`Failed to remove contact: ${error.message}`)
    }

    return data
  }

  /**
   * Send an email using Resend
   */
  async sendEmail(options: ResendEmailOptions) {
    const { data, error } = await this.resend.emails.send({
      from: options.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      react: options.react,
    })

    if (error) {
      throw new Error(`Failed to send email: ${error.message}`)
    }

    return data
  }
}

/**
 * Create a Resend service instance with environment configuration
 */
export function createResendService(): ResendService {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured')
  }

  return new ResendService({
    apiKey,
    defaultFrom: 'TimeWise Tracker <noreply@papotte.dev>',
    defaultAudienceId: RESEND_AUDIENCE_ID,
  })
}

/**
 * Handle Resend service errors and return appropriate HTTP responses
 */
export function handleResendError(error: unknown) {
  console.error('Resend service error:', error)

  if (error instanceof Error) {
    return {
      message: error.message,
      status: 400,
    }
  }

  return {
    message: 'Unexpected error',
    status: 500,
  }
}
