import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

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

    const cookieStore = await cookies()
    const locale = cookieStore.get('preferredLanguage')?.value

    const t = await getEmailTranslations(locale)
    const {
      subject,
      heading,
      greeting,
      greetingFallback,
      body: bodyText,
      warning,
    } = t.passwordChanged

    const greetingText = displayName
      ? greeting.replace('{displayName}', displayName)
      : greetingFallback

    const resendService = createResendService()
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>${heading}</h2>
        <p>${greetingText}</p>
        <p>${bodyText}</p>
        <p>${warning}</p>
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
