'use client'

import { useSyncExternalStore } from 'react'

/**
 * Returns true only on the client. Use to avoid hydration mismatches when
 * rendering content that depends on client-only APIs or dynamic imports.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
}
