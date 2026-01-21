import PricingSection from '@/components/pricing-section'
import { getCachedPricingPlans } from '@/services/stripe/stripe-cached'

export default async function PricingPage() {
  const plans = await getCachedPricingPlans()
  return <PricingSection variant="standalone" plans={plans} />
}
