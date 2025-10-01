import { NextResponse } from 'next/server'
import { Resend } from 'resend'

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

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { message: 'RESEND_API_KEY is not configured' },
        { status: 500 },
      )
    }

    const resend = new Resend(apiKey)

    // Add contact with tag "app: time tracker"
    const { data, error } = await resend.contacts.create({
      email,
      audienceId: process.env.RESEND_AUDIENCE_ID || '',
      tags: [
        {
          name: 'app',
          value: 'time tracker',
        },
      ],
    })

    if (error) {
      console.error('Failed to add contact to Resend:', error)
      return NextResponse.json(error, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Unexpected error adding contact:', error)
    return NextResponse.json({ message: 'Unexpected error' }, { status: 500 })
  }
}
