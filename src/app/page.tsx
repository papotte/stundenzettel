import { CheckCircle, Euro, LifeBuoy, Users, Zap } from 'lucide-react'
import Link from 'next/link'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'

const features = [
  {
    name: 'Live Time Tracking',
    description:
      'Start and stop a timer with one click. Your work duration is recorded accurately without any manual calculations.',
    icon: Zap,
  },
  {
    name: 'Manual & Special Entries',
    description:
      'Easily add or edit entries for past work, or log sick leave, PTO, and holidays with dedicated entry types.',
    icon: CheckCircle,
  },
  {
    name: 'Location & Travel',
    description:
      'Automatically fetch your current location or manually input it. Track travel time and driver status for accurate compensation.',
    icon: LifeBuoy,
  },
  {
    name: 'Seamless Export',
    description:
      'Generate professional-looking timesheets in Excel and PDF formats, ready to be sent for payroll or records.',
    icon: Users,
  },
]

const faqs = [
  {
    question: 'Is there a free trial available?',
    answer:
      "Yes, you can sign up and use TimeWise Tracker with all its features for free for 14 days. No credit card is required to start your trial.",
  },
  {
    question: 'Can I track time for multiple projects or clients?',
    answer:
      "Absolutely. The 'Location' field can be used to specify different projects, clients, or tasks. Our upcoming features will include dedicated project and client management for even better organization.",
  },
  {
    question: 'How does the Excel and PDF export work?',
    answer:
      'From the "Preview & Export" page, you can select any month and download a professionally formatted timesheet. The Excel file is ready for calculations, and the PDF is perfect for printing and signing.',
  },
  {
    question: 'Is my data secure?',
    answer:
      'Yes, your data is securely stored using Firebase, a platform by Google. We use industry-standard security practices to ensure your information is safe.',
  },
]

export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Effortless Time Tracking for Your Business
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    TimeWise Tracker helps you and your team manage work hours
                    seamlessly. From live tracking to detailed exports, we have
                    you covered.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg">
                    <Link href="/login">Get Started</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/features">Learn More</Link>
                  </Button>
                </div>
              </div>
              <img
                src="https://placehold.co/600x400.png"
                data-ai-hint="app user interface"
                alt="Hero"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last lg:aspect-square"
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full bg-muted py-12 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
                  Key Features
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Everything You Need to Track Time
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Focus on your work, not on tracking it. Our intuitive tools
                  make time management simple and accurate.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 sm:grid-cols-2 md:gap-12 lg:grid-cols-2">
              {features.map((feature) => (
                <div key={feature.name} className="flex items-start gap-4">
                  <feature.icon className="h-8 w-8 flex-shrink-0 text-primary" />
                  <div className="grid gap-1">
                    <h3 className="text-lg font-bold">{feature.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Simple, Transparent Pricing
              </h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                One plan that includes all features. No hidden fees.
              </p>
            </div>
            <div className="mx-auto w-full max-w-sm">
              <Card className="p-6">
                <div className="mb-4">
                  <h3 className="text-2xl font-bold">Pro Plan</h3>
                  <p className="text-muted-foreground">For teams of all sizes</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold">10€</span>
                  <span className="ml-1 text-muted-foreground">
                    / per user / month
                  </span>
                </div>
                <Button asChild className="w-full">
                  <Link href="/login">Get Started</Link>
                </Button>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section
          id="faq"
          className="w-full border-t bg-muted py-12 md:py-24"
        >
          <div className="container px-4 md:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                Frequently Asked Questions
              </h2>
            </div>
            <div className="mx-auto mt-8 max-w-3xl">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, i) => (
                  <AccordionItem key={i} value={`item-${i}`}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent>{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>
      </main>

      <footer className="flex w-full shrink-0 flex-col items-center justify-between gap-2 border-t px-4 py-6 sm:flex-row md:px-6">
        <p className="text-xs text-muted-foreground">
          &copy; 2024 TimeWise Tracker. All rights reserved.
        </p>
        <nav className="flex gap-4 sm:gap-6">
          <Link
            href="#"
            className="text-xs hover:underline hover:underline-offset-4"
          >
            Terms of Service
          </Link>
          <Link
            href="#"
            className="text-xs hover:underline hover:underline-offset-4"
          >
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  )
}
