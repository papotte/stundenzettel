import type { Metadata } from 'next'
import { Lora, PT_Sans } from 'next/font/google'

import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/context/auth-context'
import { I18nProvider } from '@/context/i18n-context'
import { DatadogProvider } from '@/components/datadog-provider'

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
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
        <DatadogProvider>
          <AuthProvider>
            <I18nProvider>
              {children}
              <Toaster />
            </I18nProvider>
          </AuthProvider>
        </DatadogProvider>
      </body>
    </html>
  )
}
