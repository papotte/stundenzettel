import { NextResponse } from 'next/server'

import { TeamInvitationEmail } from '@/components/emails/team-invitation-email'
import {
  createResendService,
  handleResendError,
} from '@/services/resend-service'

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

    const resendService = createResendService()
    const data = await resendService.sendEmail({
      from,
      to: [to],
      subject: subject || `Invitation to join team "${teamName}"`,
      react: TeamInvitationEmail({
        teamName,
        inviterName,
        invitationLink,
        role,
      }),
    })

    return NextResponse.json(data)
  } catch (error) {
    const { message, status } = handleResendError(error)
    return NextResponse.json({ message }, { status })
  }
}
