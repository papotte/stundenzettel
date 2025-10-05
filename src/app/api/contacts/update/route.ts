import { NextResponse } from 'next/server'

import {
  createResendService,
  handleResendError,
} from '@/services/resend-service'

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { email, firstName, lastName, unsubscribed } = body as {
      email: string
      firstName?: string
      lastName?: string
      unsubscribed?: boolean
    }

    if (!email) {
      return NextResponse.json(
        { message: 'Missing required field: email' },
        { status: 400 },
      )
    }

    const resendService = createResendService()
    const data = await resendService.updateContact(email, {
      firstName,
      lastName,
      unsubscribed,
    })

    return NextResponse.json(data)
  } catch (error) {
    const { message, status } = handleResendError(error)
    return NextResponse.json({ message }, { status })
  }
}
