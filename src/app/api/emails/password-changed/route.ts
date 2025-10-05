import { NextResponse } from 'next/server'

import {
  createResendService,
  handleResendError,
} from '@/services/resend-service'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      to,
      displayName,
      from = 'TimeWise Tracker <noreply@papotte.dev>',
    } = body as {
      to: string
      displayName?: string | null
      from?: string
    }

    if (!to) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 },
      )
    }

    const resendService = createResendService()
    const subject = 'Your password was changed'
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Password Changed</h2>
        <p>Hello ${displayName || 'there'},</p>
        <p>This is a confirmation that your password has been changed.</p>
        <p>If you did not make this change, please contact support immediately.</p>
      </div>
    `

    const data = await resendService.sendEmail({
      from,
      to: [to],
      subject,
      html,
    })

    return NextResponse.json(data)
  } catch (error) {
    const { message, status } = handleResendError(error)
    return NextResponse.json({ message }, { status })
  }
}
