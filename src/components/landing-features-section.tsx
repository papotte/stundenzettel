'use client'

import { useMessages } from 'next-intl'

type FeatureItem = { title: string; desc: string }
type FeaturesList = Record<string, FeatureItem>

export default function LandingFeaturesSection() {
  const messages = useMessages() as {
    landing?: {
      features?: {
        keyFeatures?: string
        headerTitle?: string
        headerDescription?: string
        list?: FeaturesList
      }
    }
  }
  const features = messages.landing?.features ?? {}
  const {
    keyFeatures = '',
    headerTitle = '',
    headerDescription = '',
    list = {},
  } = features
  const featureKeys = Object.keys(list)

  return (
    <section id="features" className="w-full bg-muted py-12 md:py-24">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
              {keyFeatures}
            </div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
              {headerTitle}
            </h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              {headerDescription}
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 sm:grid-cols-2 md:gap-12 lg:grid-cols-2">
          {featureKeys.map((key) => {
            const item = list[key]
            if (!item?.title || !item?.desc) return null
            return (
              <div key={key} className="flex items-start gap-4">
                <div className="h-8 w-8 flex-shrink-0 text-primary" />
                <div className="grid gap-1">
                  <h3 className="text-lg font-bold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
