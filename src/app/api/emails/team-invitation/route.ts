import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { TeamInvitationEmail } from '@/components/emails/team-invitation-email'
import { getEmailTranslations } from '@/lib/email-translations'
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

    const cookieStore = await cookies()
    const locale = cookieStore.get('preferredLanguage')?.value

    const t = await getEmailTranslations(locale)
    const {
      subject: subjectTemplate,
      heading,
      body: bodyTemplate,
      acceptButton,
      expiry,
      ignore,
    } = t.teamInvitation

    const emailSubject =
      subject || subjectTemplate.replace('{teamName}', teamName)

    const emailBody = bodyTemplate
      .replace('{inviterName}', inviterName)
      .replace('{teamName}', teamName)
      .replace('{role}', role)

    const resendService = createResendService()
    const data = await resendService.sendEmail({
      from,
      to: [to],
      subject: emailSubject,
      react: TeamInvitationEmail({
        invitationLink,
        heading,
        body: emailBody,
        acceptButtonText: acceptButton,
        expiryText: expiry,
        ignoreText: ignore,
      }),
    })

    return NextResponse.json(data)
  } catch (error) {
    const { message, status } = handleResendError(error)
    return NextResponse.json({ message }, { status })
  }
}
