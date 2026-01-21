import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

import LandingIllustration from '@/components/images/landing-illustration'
import LandingFaqAccordion from '@/components/landing-faq-accordion'
import LandingFeaturesSection from '@/components/landing-features-section'
import LandingLayout from '@/components/landing-layout'
import PricingSection from '@/components/pricing-section'
import SmartLink from '@/components/smart-link'
import { Button } from '@/components/ui/button'

export default async function LandingPage() {
  const t = await getTranslations()

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
      <LandingFeaturesSection />

      {/* Pricing Section */}
      <PricingSection variant="landing" showFAQ={false} />

      {/* FAQ Section */}
      <section id="faq" className="w-full border-t bg-muted py-12 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
              {t('landing.faqTitle')}
            </h2>
          </div>
          <div className="mx-auto mt-8 max-w-3xl">
            <LandingFaqAccordion />
          </div>
        </div>
      </section>
    </LandingLayout>
  )
}
