import { render, screen } from '@jest-setup'

import LandingFeaturesSection from '../landing-features-section'

const featuresList = {
  timeTracking: {
    title: 'Live Time Tracking',
    desc: 'Start and stop a timer with one click.',
  },
  export: {
    title: 'Seamless Export',
    desc: 'Generate timesheets in Excel and PDF.',
  },
}

type FeaturesMessages = {
  keyFeatures?: string
  headerTitle?: string
  headerDescription?: string
  list?: Record<string, { title: string; desc: string }>
}

let featuresMessages: FeaturesMessages = {}

jest.mock('next-intl', () => ({
  ...jest.requireActual('next-intl'),
  useMessages: () => ({ landing: { features: featuresMessages } }),
}))

describe('LandingFeaturesSection', () => {
  it('renders header and feature items from messages', () => {
    featuresMessages = {
      keyFeatures: 'Key Features',
      headerTitle: 'Everything you need',
      headerDescription: 'Packed with features.',
      list: featuresList,
    }
    render(<LandingFeaturesSection />)

    expect(screen.getByText('Key Features')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'Everything you need',
    )
    expect(screen.getByText('Live Time Tracking')).toBeInTheDocument()
    expect(screen.getByText('Seamless Export')).toBeInTheDocument()
  })

  it('renders with empty list without crashing', () => {
    featuresMessages = {
      keyFeatures: 'Key Features',
      headerTitle: 'Title',
      headerDescription: 'Desc',
      list: {} as Record<string, { title: string; desc: string }>,
    }
    render(<LandingFeaturesSection />)

    expect(screen.getByText('Key Features')).toBeInTheDocument()
    expect(screen.queryAllByRole('heading', { level: 3 })).toHaveLength(0)
  })
})
