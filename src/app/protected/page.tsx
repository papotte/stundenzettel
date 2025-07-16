'use client'

import SubscriptionGuard from '@/components/subscription-guard'

export default function ProtectedPage() {
  return (
    <SubscriptionGuard>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">Protected Content</h1>
        <p className="text-gray-600">
          This content is only visible to users with an active subscription.
        </p>
        <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
          <h2 className="text-xl font-semibold text-green-800 mb-2">
            Welcome to the Premium Features!
          </h2>
          <p className="text-green-700">
            You have access to all premium features including unlimited time
            tracking, advanced exports, and priority support.
          </p>
        </div>
      </div>
    </SubscriptionGuard>
  )
}
