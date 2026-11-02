import { createElement } from 'react'

import { NextResponse } from 'next/server'

import { TeamInvitationEmail } from '@/components/emails/team-invitation-email'
import { getEmailTranslator } from '@/lib/email-translations'
import { getUserLocale } from '@/services/locale'
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

    const locale = await getUserLocale()

    const t = await getEmailTranslator(locale)
    const roles = t.raw('teamInvitation.roles') as Record<string, string>

    const emailSubject = subject || t('teamInvitation.subject', { teamName })

    const emailBody = t.rich('teamInvitation.body', {
      strong: (chunks) => createElement('strong', null, chunks),
      inviterName,
      teamName,
      role: roles[role] ?? role,
    })

    const resendService = createResendService()
    const data = await resendService.sendEmail({
      from,
      to: [to],
      subject: emailSubject,
      react: TeamInvitationEmail({
        invitationLink,
        heading: t('teamInvitation.heading'),
        body: emailBody,
        acceptButtonText: t('teamInvitation.acceptButton'),
        expiryText: t('teamInvitation.expiry'),
        ignoreText: t('teamInvitation.ignore'),
      }),
    })

    return NextResponse.json(data)
  } catch (error) {
    const { message, status } = handleResendError(error)
    return NextResponse.json({ message }, { status })
  }
}
