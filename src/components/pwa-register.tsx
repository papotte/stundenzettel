'use client'

import { useEffect } from 'react'

/**
 * Registers the app's service worker when running in the browser.
 * Required for PWA installability and offline support.
 */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    navigator.serviceWorker
      .register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .then((registration) => {
        // Optional: check for updates when the page gains focus
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (!newWorker) return
          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              // New content available; page will use it on next load or when all tabs close
            }
          })
        })
      })
      .catch(() => {
        // Registration failed (e.g. not HTTPS, invalid scope); ignore in dev
      })
  }, [])

  return null
}
