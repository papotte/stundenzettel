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
    <div className="flex min-h-dvh flex-col">
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
        <article
          className="prose w-full max-w-2xl rounded-xl bg-white/80 p-6 shadow-lg prose-neutral md:p-10 dark:prose-invert"
          data-testid={testId}
        >
          <Content />
        </article>
      </main>
    </div>
  )
}
