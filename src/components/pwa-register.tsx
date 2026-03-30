'use client'

import { useEffect } from 'react'

function onNewWorkerStateChange(worker: ServiceWorker) {
  if (
    worker.state === 'installed' &&
    typeof navigator !== 'undefined' &&
    navigator.serviceWorker.controller
  ) {
    // New content available; page will use it on next load or when all tabs close
  }
}

function onRegistrationUpdateFound(registration: ServiceWorkerRegistration) {
  const newWorker = registration.installing
  if (!newWorker) return
  newWorker.addEventListener('statechange', () =>
    onNewWorkerStateChange(newWorker),
  )
}

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
        registration.addEventListener('updatefound', () =>
          onRegistrationUpdateFound(registration),
        )
      })
      .catch(() => {
        // Registration failed (e.g. not HTTPS, invalid scope); ignore in dev
      })
  }, [])

  return null
}
