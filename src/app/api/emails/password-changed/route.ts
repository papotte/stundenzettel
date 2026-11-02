import { NextResponse } from 'next/server'

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

    const locale = await getUserLocale()

    const t = await getEmailTranslator(locale)

    const greetingText = displayName
      ? t('passwordChanged.greeting', { displayName })
      : t('passwordChanged.greetingFallback')

    const resendService = createResendService()
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>${t('passwordChanged.heading')}</h2>
        <p>${greetingText}</p>
        <p>${t('passwordChanged.body')}</p>
        <p>${t('passwordChanged.warning')}</p>
      </div>
    `

    const data = await resendService.sendEmail({
      from,
      to: [to],
      subject: t('passwordChanged.subject'),
      html,
    })

    return NextResponse.json(data)
  } catch (error) {
    const { message, status } = handleResendError(error)
    return NextResponse.json({ message }, { status })
  }
}
