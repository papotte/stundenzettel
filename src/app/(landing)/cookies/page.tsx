'use client'

import { useEffect, useState } from 'react'

import dynamic from 'next/dynamic'

import { useTranslation } from '@/hooks/use-translation-compat'

const CookiePolicyEn = dynamic(
  () => import('@/../content/legal/cookie-policy.en.mdx'),
)
const CookiePolicyDe = dynamic(
  () => import('@/../content/legal/cookie-policy.de.mdx'),
)

export default function CookiePolicyPage() {
  const { language } = useTranslation()
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const Content = language === 'de' ? CookiePolicyDe : CookiePolicyEn
  const testId =
    language === 'de' ? 'cookie-policy-de-article' : 'cookie-policy-en-article'

  return (
    <div className="min-h-dvh flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <article
          className="prose prose-neutral dark:prose-invert max-w-2xl w-full bg-white/80 rounded-xl shadow-lg p-6 md:p-10"
          data-testid={testId}
        >
          <Content />
        </article>
      </main>
    </div>
  )
}
