'use client'

import { useLocale } from 'next-intl'
import dynamic from 'next/dynamic'

import { useIsClient } from '@/hooks/use-is-client'

const TermsEn = dynamic(() => import('@/../content/legal/terms.en.mdx'))
const TermsDe = dynamic(() => import('@/../content/legal/terms.de.mdx'))

export default function TermsPage() {
  const language = useLocale()
  const isClient = useIsClient()

  if (!isClient) return null

  const Content = language === 'de' ? TermsDe : TermsEn
  const testId = language === 'de' ? 'terms-de-article' : 'terms-en-article'

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
