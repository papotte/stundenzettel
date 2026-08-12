'use client'

import SubscriptionGuard from '@/components/subscription-guard'

export default function ProtectedPage() {
  return (
    <SubscriptionGuard>
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-4 text-3xl font-bold">Protected Content</h1>
        <p className="text-gray-600">
          This content is only visible to users with an active subscription.
        </p>
        <div className="mt-8 rounded-lg border border-green-200 bg-green-50 p-6">
          <h2 className="mb-2 text-xl font-semibold text-green-800">
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
