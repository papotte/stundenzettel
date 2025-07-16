'use client'

import Link from 'next/link'

import LandingIllustration from '@/components/images/landing-illustration'
import LandingLayout from '@/components/landing-layout'
import PricingSection from '@/components/pricing-section'
import SmartLink from '@/components/smart-link'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/context/i18n-context'

export default function LandingPage() {
  const { t } = useTranslation()
  const features = t('landing.features.list')
  const faqs = t('landing.faqs')

  return (
    <LandingLayout>
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
            <div className="flex flex-col justify-center space-y-4">
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
            <LandingIllustration className="mx-auto aspect-video overflow-hidden rounded-xl sm:w-full lg:order-last lg:aspect-square p-4 text-primary" />
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
            {Array.isArray(features) &&
              features.map((feature, i) => (
                <div key={feature.title} className="flex items-start gap-4">
                  {/* You can use a static icon array or a switch if you want icons */}
                  <div className="h-8 w-8 flex-shrink-0 text-primary">
                    {/* icon here if needed */}
                  </div>
                  <div className="grid gap-1">
                    <h3 className="text-lg font-bold">
                      {t(`landing.features.list.${i}.title`)}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t(`landing.features.list.${i}.desc`)}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>

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
            <Accordion type="single" collapsible className="w-full">
              {Array.isArray(faqs) &&
                faqs.map((_, i) => (
                  <AccordionItem key={i} value={`item-${i}`}>
                    <AccordionTrigger>
                      {t(`landing.faqs.${i}.question`)}
                    </AccordionTrigger>
                    <AccordionContent>
                      {t(`landing.faqs.${i}.answer`)}
                    </AccordionContent>
                  </AccordionItem>
                ))}
            </Accordion>
          </div>
        </div>
      </section>
    </LandingLayout>
  )
}
