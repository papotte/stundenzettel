import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

export async function POST(request: NextRequest) {
  try {
    const { userId, teamId, priceId, quantity, successUrl, cancelUrl } =
      await request.json()

    if (!userId || !teamId || !priceId || !quantity) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 },
      )
    }

    // Create or retrieve customer
    let customer: Stripe.Customer
    const existingCustomers = await stripe.customers.list({
      email: userId, // Using userId as email for now
      limit: 1,
    })

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0]
    } else {
      customer = await stripe.customers.create({
        email: userId,
        metadata: {
          userId,
        },
      })
    }

    // Create checkout session for team subscription
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: quantity,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || `${request.nextUrl.origin}/team?success=true`,
      cancel_url:
        cancelUrl || `${request.nextUrl.origin}/pricing?canceled=true`,
      metadata: {
        userId,
        teamId,
      },
    })

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    })
  } catch (error) {
    console.error('Error creating team checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create team checkout session' },
      { status: 500 },
    )
  }
}
