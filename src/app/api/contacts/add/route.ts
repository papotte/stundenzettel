import { NextResponse } from 'next/server'

import {
  RESEND_AUDIENCE_ID,
  createResendService,
  handleResendError,
} from '@/services/resend-service'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body as {
      email: string
    }

    if (!email) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 },
      )
    }

    const resendService = createResendService()
    const data = await resendService.createContact({
      email,
      audienceId: RESEND_AUDIENCE_ID,
    })

    return NextResponse.json(data)
  } catch (error) {
    const { message, status } = handleResendError(error)
    return NextResponse.json({ message }, { status })
  }
}
