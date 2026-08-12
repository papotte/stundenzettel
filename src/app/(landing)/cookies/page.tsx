'use client'

import { useLocale } from 'next-intl'
import dynamic from 'next/dynamic'

import { useIsClient } from '@/hooks/use-is-client'

const CookiePolicyEn = dynamic(
  () => import('@/../content/legal/cookie-policy.en.mdx'),
)
const CookiePolicyDe = dynamic(
  () => import('@/../content/legal/cookie-policy.de.mdx'),
)

export default function CookiePolicyPage() {
  const language = useLocale()
  const isClient = useIsClient()

  if (!isClient) return null

  const Content = language === 'de' ? CookiePolicyDe : CookiePolicyEn
  const testId =
    language === 'de' ? 'cookie-policy-de-article' : 'cookie-policy-en-article'

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
