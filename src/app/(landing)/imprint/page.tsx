'use client'

import { useEffect, useState } from 'react'

import dynamic from 'next/dynamic'

import { useTranslation } from '@/context/i18n-context'

const ImprintEn = dynamic(() => import('@/../content/legal/imprint.en.mdx'))
const ImprintDe = dynamic(() => import('@/../content/legal/imprint.de.mdx'))

export default function ImprintPage() {
  const { language } = useTranslation()
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const Content = language === 'de' ? ImprintDe : ImprintEn
  const testId = language === 'de' ? 'imprint-de-article' : 'imprint-en-article'

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
