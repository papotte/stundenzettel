import { useQuery } from '@tanstack/react-query'

import { queryKeys } from '@/lib/query-keys'
import { StripeService } from '@/services/stripe-service'

export function usePricingPlans(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.pricingPlans(),
    queryFn: () => StripeService.getPricingPlans(),
    enabled: options?.enabled ?? true,
  })
}
