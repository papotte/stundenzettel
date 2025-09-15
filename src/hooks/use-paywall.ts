import { useMemo } from 'react'

import { useAuth } from '@/hooks/use-auth'
import { useSubscriptionStatus } from '@/hooks/use-subscription-status'

export interface PaywallFeatures {
  // Company features
  companySettings: boolean
  
  // Export features
  exportFunctionality: boolean
  
  // Time entry features
  manualTimeEntry: boolean
  editTimeEntry: boolean
  deleteTimeEntry: boolean
  specialEntries: boolean
  
  // Additional premium features
  advancedReporting: boolean
  bulkActions: boolean
  apiAccess: boolean
}

export interface UsePaywallResult {
  isLoading: boolean
  hasValidSubscription: boolean
  features: PaywallFeatures
  canAccess: (feature: keyof PaywallFeatures) => boolean
  requiresUpgrade: (feature: keyof PaywallFeatures) => boolean
}

/**
 * Hook to manage paywall functionality and feature access
 * Free users can only use live tracking, everything else requires subscription
 */
export function usePaywall(): UsePaywallResult {
  const { user } = useAuth()
  const { hasValidSubscription, loading, subscription } = useSubscriptionStatus(user)

  const features = useMemo<PaywallFeatures>(() => {
    const isSubscribed = hasValidSubscription === true
    
    return {
      // Company features - Premium only
      companySettings: isSubscribed,
      
      // Export features - Premium only
      exportFunctionality: isSubscribed,
      
      // Time entry features - Premium only (except live tracking)
      manualTimeEntry: isSubscribed,
      editTimeEntry: isSubscribed,
      deleteTimeEntry: isSubscribed,
      specialEntries: isSubscribed,
      
      // Additional premium features
      advancedReporting: isSubscribed,
      bulkActions: isSubscribed,
      apiAccess: isSubscribed,
    }
  }, [hasValidSubscription])

  const canAccess = (feature: keyof PaywallFeatures): boolean => {
    return features[feature]
  }

  const requiresUpgrade = (feature: keyof PaywallFeatures): boolean => {
    return !features[feature]
  }

  return {
    isLoading: loading,
    hasValidSubscription: hasValidSubscription === true,
    features,
    canAccess,
    requiresUpgrade,
  }
}