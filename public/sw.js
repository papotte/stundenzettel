/**
 * Minimal service worker for PWA installability, offline support, and push notifications.
 * No external libraries; uses Cache API and fetch only.
 */
const CACHE_NAME = 'timewise-v1'

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('push', (event) => {
  let data = {
    title: 'TimeWise Tracker',
    body: '',
    icon: '/apple-touch-icon.png',
    url: '/',
  }
  if (event.data) {
    try {
      const parsed = event.data.json()
      data = { ...data, ...parsed }
    } catch {
      const text = event.data.text()
      if (text) data.body = text
    }
  }
  const options = {
    body: data.body || 'New notification',
    icon: data.icon,
    badge: '/favicon-32x32.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' },
  }
  event.waitUntil(
    self.registration.showNotification(data.title, options).catch((err) => {
      console.error('Service worker showNotification failed:', err)
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        if (clientList.length > 0) {
          const client =
            clientList.find((c) => c.visibilityState === 'visible') ||
            clientList[0]
          client.navigate(url)
          client.focus()
        } else if (self.clients.openWindow) {
          self.clients.openWindow(self.location.origin + url)
        }
      }),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name)),
        ),
      ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle same-origin GET
  if (url.origin !== self.location.origin || request.method !== 'GET') {
    return
  }

  // API and auth: network only
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/api/auth')
  ) {
    return
  }

  // Navigation and document: network first, fallback to cache
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone()
          if (response.status === 200 && response.type === 'basic') {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match('/')),
        ),
    )
    return
  }

  // Static assets: stale-while-revalidate (serve cache, update in background)
  if (
    /\.(js|css|woff2?|png|ico|svg|webp|jpg|jpeg|gif)$/i.test(url.pathname) ||
    url.pathname.startsWith('/_next/static/')
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(request).then((cached) => {
          const fetched = fetch(request).then((response) => {
            if (response.status === 200 && response.type === 'basic') {
              cache.put(request, response.clone())
            }
            return response
          })
          return cached || fetched
        }),
      ),
    )
  }
})
