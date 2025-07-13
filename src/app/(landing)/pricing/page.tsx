import { Check } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const includedFeatures = [
  'Live Time Tracking',
  'Manual Time Entries',
  'Special Entries (Sick, PTO, etc.)',
  'Location & Travel Tracking',
  'Excel & PDF Exports',
  'Multi-language Support (EN/DE)',
  'Unlimited Entries',
  'Secure Cloud Storage',
]

export default function PricingPage() {
  return (
    <div className="bg-background py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            One plan that includes everything you need. No tiers, no add-ons,
            no surprises.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl rounded-3xl ring-1 ring-border sm:mt-20 lg:mx-0 lg:flex lg:max-w-none">
          <div className="p-8 sm:p-10 lg:flex-auto">
            <h3 className="text-2xl font-bold tracking-tight text-foreground">
              Pro Plan
            </h3>
            <p className="mt-6 text-base leading-7 text-muted-foreground">
              Everything you need to accurately track time for you and your
              team, generate reports, and stay organized.
            </p>
            <div className="mt-10 flex items-center gap-x-4">
              <h4 className="flex-none text-sm font-semibold leading-6 text-primary">
                What’s included
              </h4>
              <div className="h-px flex-auto bg-muted" />
            </div>
            <ul
              role="list"
              className="mt-8 grid grid-cols-1 gap-4 text-sm leading-6 text-muted-foreground sm:grid-cols-2 sm:gap-6"
            >
              {includedFeatures.map((feature) => (
                <li key={feature} className="flex gap-x-3">
                  <Check
                    className="h-6 w-5 flex-none text-primary"
                    aria-hidden="true"
                  />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
          <div className="-mt-2 p-2 lg:mt-0 lg:w-full lg:max-w-md lg:flex-shrink-0">
            <div className="rounded-2xl bg-muted py-10 text-center ring-1 ring-inset ring-gray-900/5 lg:flex lg:flex-col lg:justify-center lg:py-16">
              <div className="mx-auto max-w-xs px-8">
                <p className="text-base font-semibold text-muted-foreground">
                  Pay per user, per month
                </p>
                <p className="mt-6 flex items-baseline justify-center gap-x-2">
                  <span className="text-5xl font-bold tracking-tight text-foreground">
                    10€
                  </span>
                  <span className="text-sm font-semibold leading-6 tracking-wide text-muted-foreground">
                    EUR
                  </span>
                </p>
                <Button asChild className="mt-10 block w-full">
                  <Link href="/login">Get access</Link>
                </Button>
                <p className="mt-6 text-xs leading-5 text-muted-foreground">
                  Invoices and receipts available for easy company reimbursement.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
