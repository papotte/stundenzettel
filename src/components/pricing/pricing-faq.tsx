'use client'

import React from 'react'

import { useTranslations } from 'next-intl'

export default function PricingFAQ() {
  const t = useTranslations('landing')

  return (
    <div className="mt-16 text-center">
      <h3 className="mb-8 text-3xl font-bold text-gray-900">
        {t('pricing.faqTitle')}
      </h3>
      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
        <div className="text-left">
          <h4 className="mb-2 text-lg font-semibold text-gray-900">
            {t('pricing.faq1Question')}
          </h4>
          <p className="text-gray-600">{t('pricing.faq1Answer')}</p>
        </div>
        <div className="text-left">
          <h4 className="mb-2 text-lg font-semibold text-gray-900">
            {t('pricing.faq2Question')}
          </h4>
          <p className="text-gray-600">{t('pricing.faq2Answer')}</p>
        </div>
        <div className="text-left">
          <h4 className="mb-2 text-lg font-semibold text-gray-900">
            {t('pricing.faq3Question')}
          </h4>
          <p className="text-gray-600">{t('pricing.faq3Answer')}</p>
        </div>
        <div className="text-left">
          <h4 className="mb-2 text-lg font-semibold text-gray-900">
            {t('pricing.faq4Question')}
          </h4>
          <p className="text-gray-600">{t('pricing.faq4Answer')}</p>
        </div>
      </div>
    </div>
  )
}
