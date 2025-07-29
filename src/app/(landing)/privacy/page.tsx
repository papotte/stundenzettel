'use client'

import { useEffect, useState } from 'react'

import dynamic from 'next/dynamic'

import { useTranslation } from '@/hooks/use-translation-compat'

const PrivacyEn = dynamic(() => import('@/../content/legal/privacy.en.mdx'))
const PrivacyDe = dynamic(() => import('@/../content/legal/privacy.de.mdx'))

export default function PrivacyPage() {
  const { language } = useTranslation()
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const Content = language === 'de' ? PrivacyDe : PrivacyEn
  const testId = language === 'de' ? 'privacy-de-article' : 'privacy-en-article'

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
