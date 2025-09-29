import { NextResponse } from 'next/server'
import { Resend } from 'resend'

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

    const apiKey =
      process.env.RESEND_API_KEY || process.env.NEXT_PUBLIC_RESEND_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { message: 'RESEND_API_KEY is not configured' },
        { status: 500 },
      )
    }

    const resend = new Resend(apiKey)
    const subject = 'Your password was changed'
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Password Changed</h2>
        <p>Hello ${displayName || 'there'},</p>
        <p>This is a confirmation that your password has been changed.</p>
        <p>If you did not make this change, please contact support immediately.</p>
      </div>
    `

    const { data, error } = await resend.emails.send({
      from,
      to: [to],
      subject,
      html,
    })

    if (error) {
      return NextResponse.json(error, { status: 400 })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ message: 'Unexpected error' }, { status: 500 })
  }
}
