import { NextResponse } from 'next/server'
import { Resend } from 'resend'

import { TeamInvitationEmail } from '@/components/emails/team-invitation-email'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      to,
      teamName,
      inviterName,
      invitationLink,
      role,
      subject,
      from = 'TimeWise Tracker <noreply@papotte.dev>',
    } = body as {
      to: string
      teamName: string
      inviterName: string
      invitationLink: string
      role: string
      subject?: string
      from?: string
    }

    if (!to || !teamName || !inviterName || !invitationLink || !role) {
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
    const { data, error } = await resend.emails.send({
      from,
      to: [to],
      subject: subject || `Invitation to join team "${teamName}"`,
      react: TeamInvitationEmail({
        teamName,
        inviterName,
        invitationLink,
        role,
      }) as React.ReactElement,
    })

    if (error) {
      return NextResponse.json(error, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ message: 'Unexpected error' }, { status: 500 })
  }
}
