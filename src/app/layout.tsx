import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale } from 'next-intl/server'
import { Lora, PT_Sans } from 'next/font/google'

import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/context/auth-context'
// Import dev utilities for development mode
import '@/lib/dev-utils'

import './globals.css'

const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-lora',
})
const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans',
})

// const WEBSITE_UUID = process.env.NEXT_PUBLIC_TERMLY_WEBSITE_UUID

export const metadata: Metadata = {
  title: 'TimeWise Tracker',
  description: 'Track your work hours effortlessly',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.png" sizes="any" />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body
        className={`font-body antialiased ${lora.variable} ${ptSans.variable}`}
      >
        <AuthProvider>
          <NextIntlClientProvider timeZone={'Europe/Berlin'}>
            {children}
            <Toaster />
          </NextIntlClientProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
