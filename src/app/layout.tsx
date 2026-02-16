import { Suspense } from 'react'

import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale } from 'next-intl/server'
import { Lora, PT_Sans } from 'next/font/google'

import { HtmlLang } from '@/components/html-lang'
import { QueryProvider } from '@/components/providers/query-provider'
import { PwaRegister } from '@/components/pwa-register'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/context/auth-context'
import { SubscriptionProvider } from '@/context/subscription-context'

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

async function LocaleAwareRoot({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale()
  return (
    <>
      <HtmlLang locale={locale} />
      <QueryProvider>
        <AuthProvider>
          <SubscriptionProvider>
            <NextIntlClientProvider locale={locale}>
              <PwaRegister />
              {children}
              <Toaster />
            </NextIntlClientProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </QueryProvider>
    </>
  )
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0f172a" />
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
        <Suspense fallback={null}>
          <LocaleAwareRoot>{children}</LocaleAwareRoot>
        </Suspense>
      </body>
    </html>
  )
}
