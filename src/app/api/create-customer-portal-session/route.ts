import { NextRequest, NextResponse } from 'next/server'

import { createCustomerPortalSession } from '@/services/stripe'

export async function POST(request: NextRequest) {
  try {
    const { userId, returnUrl } = await request.json()
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
  } catch (error: any) {
    const message =
      error?.message === 'Missing required parameters'
        ? error.message
        : error?.message === 'Customer not found'
          ? error.message
          : 'Failed to create customer portal session'
    const status =
      error?.message === 'Missing required parameters'
        ? 400
        : error?.message === 'Customer not found'
          ? 404
          : 500
    console.error('Error creating customer portal session:', error)
    return NextResponse.json({ error: message }, { status })
  }
}
