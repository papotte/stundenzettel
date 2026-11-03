'use client'

import { useQuery } from '@tanstack/react-query'

import { queryKeys } from '@/lib/query-keys'
import { getPricingPlans } from '@/services/payment-service'

export function usePricingPlans(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.pricingPlans(),
    queryFn: () => getPricingPlans(),
    enabled: options?.enabled ?? true,
  })
}
