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
    const message =
      errorMessage === 'Missing required parameters'
        ? errorMessage
        : errorMessage === 'Customer not found'
          ? errorMessage
          : 'Failed to create customer portal session'
    const status =
      errorMessage === 'Missing required parameters'
        ? 400
        : errorMessage === 'Customer not found'
          ? 404
          : 500
    console.error('Error creating customer portal session:', error)
    return NextResponse.json({ error: message }, { status })
  }
}
