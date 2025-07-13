import { Check } from 'lucide-react'

const primaryFeatures = [
  {
    name: 'Live & Manual Time Tracking',
    description:
      'Start a timer with a single click or manually enter your hours. Flexibility is key.',
  },
  {
    name: 'Special Entry Types',
    description:
      'Log sick leave, paid time off, and bank holidays with dedicated options that use your default work hours.',
  },
  {
    name: 'Location & Travel Time',
    description:
      "Automatically get your current location or type it in. Add travel time and specify if you were the driver, ensuring you're compensated correctly.",
  },
  {
    name: 'Smart Suggestions',
    description:
      'The app learns your habits and suggests locations and times based on your previous entries to speed up your workflow.',
  },
  {
    name: 'Automatic Pause Calculation',
    description:
      'Based on your work duration, the app suggests the legally required pause time, which you can apply with one click.',
  },
  {
    name: 'Professional Exports',
    description:
      'Generate clean, professional timesheets in both Excel (.xlsx) and PDF formats, ready for printing or emailing.',
  },
]

export default function FeaturesPage() {
  return (
    <div className="bg-background">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-base font-semibold leading-7 text-primary">
            Track Time Smarter
          </p>
          <h2 className="mt-2 text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            Everything you need, nothing you don't.
          </h2>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            TimeWise Tracker is packed with features designed to make your time
            tracking as effortless and accurate as possible.
          </p>
        </div>
      </div>

      <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
        <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
          {primaryFeatures.map((feature) => (
            <div key={feature.name} className="relative pl-16">
              <dt className="text-base font-semibold leading-7 text-foreground">
                <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                  <Check className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                {feature.name}
              </dt>
              <dd className="mt-2 text-base leading-7 text-muted-foreground">
                {feature.description}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="my-32 text-center">
        <img
          className="mx-auto rounded-xl shadow-2xl ring-1 ring-gray-900/10"
          src="https://placehold.co/1200x800.png"
          data-ai-hint="app screenshot"
          alt="App screenshot"
        />
      </div>
    </div>
  )
}
