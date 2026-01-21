import { getMessages, getTranslations } from 'next-intl/server'
import Link from 'next/link'

import LandingFaqAccordion from '@/components/landing-faq-accordion'
import LandingIllustration from '@/components/images/landing-illustration'
import LandingLayout from '@/components/landing-layout'
import PricingSection from '@/components/pricing-section'
import SmartLink from '@/components/smart-link'
import { Button } from '@/components/ui/button'
import { getCachedPricingPlans } from '@/services/stripe/stripe-cached'

export default async function LandingPage() {
  const [t, messages, plans] = await Promise.all([
    getTranslations(),
    getMessages(),
    getCachedPricingPlans(),
  ])
  const messagesTyped = messages as {
    landing: {
      features: { list: Record<string, unknown> }
      faqs: { question: string; answer: string }[]
    }
  }
  const featureKeys = Object.keys(messagesTyped.landing.features.list)
  const faqItems = messagesTyped.landing.faqs

  return (
    <LandingLayout>
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex w-full gap-6 lg:gap-12 flex-col md:flex-row">
            <div className="flex flex-shrink flex-col justify-center space-y-4 md:basis-auto">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                  {t('landing.heroTitle')}
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  {t('landing.heroDescription')}
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button asChild size="lg">
                  <SmartLink href="/login">{t('landing.getStarted')}</SmartLink>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/features">{t('landing.learnMore')}</Link>
                </Button>
              </div>
            </div>
            {/* Hero Illustration */}
            <div
              className={
                'flex items-center justify-center lg:order-last p-4 md:basis-2/3'
              }
            >
              <LandingIllustration className="aspect-video text-primary" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="w-full bg-muted py-12 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
                {t('landing.features.keyFeatures')}
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                {t('landing.features.headerTitle')}
              </h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                {t('landing.features.headerDescription')}
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 sm:grid-cols-2 md:gap-12 lg:grid-cols-2">
            {featureKeys.map((key) => (
              <div key={key} className="flex items-start gap-4">
                <div className="h-8 w-8 flex-shrink-0 text-primary" />
                <div className="grid gap-1">
                  <h3 className="text-lg font-bold">
                    {t(`landing.features.list.${key}.title`)}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t(`landing.features.list.${key}.desc`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection
        variant="landing"
        showFAQ={false}
        plans={plans}
      />

      {/* FAQ Section */}
      <section id="faq" className="w-full border-t bg-muted py-12 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
              {t('landing.faqTitle')}
            </h2>
          </div>
          <div className="mx-auto mt-8 max-w-3xl">
            <LandingFaqAccordion items={faqItems} />
          </div>
        </div>
      </section>
    </LandingLayout>
  )
}
