'use client'

import React from 'react'

import { useTranslation } from '@/hooks/use-translation-compat'

export default function PricingFAQ() {
  const { t } = useTranslation()

  return (
    <div className="mt-16 text-center">
      <h3 className="text-3xl font-bold text-gray-900 mb-8">
        {t('pricing.faqTitle')}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <div className="text-left">
          <h4 className="text-lg font-semibold text-gray-900 mb-2">
            {t('pricing.faq1Question')}
          </h4>
          <p className="text-gray-600">{t('pricing.faq1Answer')}</p>
        </div>
        <div className="text-left">
          <h4 className="text-lg font-semibold text-gray-900 mb-2">
            {t('pricing.faq2Question')}
          </h4>
          <p className="text-gray-600">{t('pricing.faq2Answer')}</p>
        </div>
        <div className="text-left">
          <h4 className="text-lg font-semibold text-gray-900 mb-2">
            {t('pricing.faq3Question')}
          </h4>
          <p className="text-gray-600">{t('pricing.faq3Answer')}</p>
        </div>
        <div className="text-left">
          <h4 className="text-lg font-semibold text-gray-900 mb-2">
            {t('pricing.faq4Question')}
          </h4>
          <p className="text-gray-600">{t('pricing.faq4Answer')}</p>
        </div>
      </div>
    </div>
  )
}
