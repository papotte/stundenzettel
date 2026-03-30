import { NextRequest, NextResponse } from 'next/server'

import { createCustomerPortalSession } from '@/services/stripe'

export async function POST(request: NextRequest) {
  try {
    let userId: string | undefined
    let returnUrl: string | undefined
    try {
      const body = await request.json()
      userId = body?.userId
      returnUrl = body?.returnUrl
    } catch {
      return NextResponse.json(
        { error: 'Invalid or missing JSON body' },
        { status: 400 },
      )
    }
    const origin = request.nextUrl.origin
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 },
      )
    }
    const result = await createCustomerPortalSession({
      userId,
      returnUrl,
      origin,
    })
    return NextResponse.json(result)
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    let message: string
    let status: number
    if (errorMessage === 'Missing required parameters') {
      message = errorMessage
      status = 400
    } else if (errorMessage === 'Customer not found') {
      message = errorMessage
      status = 404
    } else {
      message = 'Failed to create customer portal session'
      status = 500
    }
    console.error('Error creating customer portal session:', error)
    return NextResponse.json({ error: message }, { status })
  }
}
