'use client'

/**
 * ColorfulBackground - A reusable component that provides the app's signature
 * colorful gradient background with organic polygon shapes.
 *
 * Features:
 * - Green-to-purple gradient (from-[#80ff80] to-[#9089fc])
 * - Complex polygon clip paths for organic shapes
 * - Top and bottom gradient layers for depth
 * - Proper z-indexing and blur effects
 *
 * Used across landing pages and login to maintain consistent visual identity.
 */
interface ColorfulBackgroundProps {
  children: React.ReactNode
  className?: string
}

export default function ColorfulBackground({
  children,
  className = '',
}: ColorfulBackgroundProps) {
  return (
    <div className={`relative isolate ${className}`}>
      {/* Top gradient */}
      <div
        className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80 pointer-events-none"
        aria-hidden="true"
      >
        <div
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#80ff80] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
        />
      </div>

      {/* Bottom gradient */}
      <div
        className="absolute inset-x-0 -bottom-16 -z-10 transform-gpu overflow-hidden blur-3xl pointer-events-none"
        aria-hidden="true"
      >
        <div
          className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#80ff80] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
        />
      </div>

      {children}
    </div>
  )
}
