'use client'

import React from 'react'

import { Check } from 'lucide-react'
import { useMessages, useTranslations } from 'next-intl'
import Image from 'next/image'

export default function FeaturesPage() {
  const t = useTranslations('landing')

  const messages = useMessages()
  const features = Object.keys(messages.landing.features.list)
  return (
    <div>
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-base font-semibold leading-7 text-primary">
            {t('features.headerTag')}
          </p>
          <h2 className="mt-2 text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            {t('features.headerTitle')}
          </h2>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            {t('features.headerDescription')}
          </p>
        </div>
      </div>

      <div
        className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl"
        data-testid="features-container"
      >
        <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
          {Array.isArray(features) &&
            features.map((key) => (
              <div key={key} className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-foreground">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                    <Check className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  {t(`features.list.${key}.title`)}
                </dt>
                <dd className="mt-2 text-base leading-7 text-muted-foreground">
                  {t(`features.list.${key}.desc`)}
                </dd>
              </div>
            ))}
        </dl>
      </div>

      <div className="flex my-32 text-center">
        <Image
          src="/images/tracker.png"
          alt="Tracker"
          width={600}
          height={400}
          className="mx-auto rounded-lg shadow-lg"
        />
      </div>
    </div>
  )
}
