// Uptoza Service Worker - Performance + Push Notifications
// Version for cache busting
const CACHE_VERSION = 'v1.0.3';
const STATIC_CACHE = `uptoza-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `uptoza-dynamic-${CACHE_VERSION}`;
const API_CACHE = `uptoza-api-${CACHE_VERSION}`;

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
];

// Cache strategies
const CACHE_STRATEGIES = {
  // Cache first for static assets (JS, CSS, images)
  cacheFirst: ['assets/', '.js', '.css', '.woff2', '.png', '.jpg', '.webp', '.svg', '.avif'],
  // Network first for API calls with stale-while-revalidate
  staleWhileRevalidate: ['/functions/v1/bff-'],
  // Network only for auth-related calls
  networkOnly: ['/auth/', 'validate-session', 'admin-login'],
};

// Install - cache critical assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key.startsWith('uptoza-') && 
                          key !== STATIC_CACHE && 
                          key !== DYNAMIC_CACHE && 
                          key !== API_CACHE)
          .map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch - smart caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) return;

  // Network only for auth
  if (CACHE_STRATEGIES.networkOnly.some(pattern => url.pathname.includes(pattern))) {
    return;
  }

  // Stale-while-revalidate for BFF API calls
  if (CACHE_STRATEGIES.staleWhileRevalidate.some(pattern => url.pathname.includes(pattern))) {
    event.respondWith(staleWhileRevalidate(request, API_CACHE));
    return;
  }

  // Cache first for static assets
  if (CACHE_STRATEGIES.cacheFirst.some(pattern => url.pathname.includes(pattern) || url.href.includes(pattern))) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Default: network first with cache fallback
  event.respondWith(networkFirst(request, DYNAMIC_CACHE));
});

// Cache first strategy
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Cache first fetch failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Network first strategy
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    return new Response('Offline', { status: 503 });
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  // Fetch in background
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => cached);

  // Return cached immediately, or wait for network
  return cached || fetchPromise;
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);
  
  let data = {
    title: 'Uptoza',
    message: 'You have a new notification',
    link: '/dashboard',
    type: 'general',
    logId: null,
  };

  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch (e) {
    console.error('[SW] Error parsing push data:', e);
  }

  const options = {
    body: data.message,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: [100, 50, 100],
    tag: data.type || 'notification',
    renotify: true,
    requireInteraction: data.type === 'order' || data.type === 'chat',
    data: {
      url: data.link || '/dashboard',
      logId: data.logId,
      type: data.type,
    },
    actions: [
      { action: 'view', title: 'View', icon: '/icons/view.png' },
      { action: 'dismiss', title: 'Dismiss', icon: '/icons/close.png' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Uptoza', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);
  
  event.notification.close();

  const action = event.action;
  const notificationData = event.notification.data || {};

  // Track click if logId exists
  if (notificationData.logId) {
    fetch('/functions/v1/manage-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'track-click',
        logId: notificationData.logId,
      }),
    }).catch((err) => console.error('[SW] Track click error:', err));
  }

  if (action === 'dismiss') {
    return;
  }

  const urlToOpen = notificationData.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.location.origin)) {
          return client.focus().then((focusedClient) => {
            if (focusedClient && 'navigate' in focusedClient) {
              return focusedClient.navigate(urlToOpen);
            }
          });
        }
      }
      return clients.openWindow(urlToOpen);
    })
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event);
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
});

// Message handling for cache control
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
  if (event.data === 'clearCache') {
    caches.keys().then((keys) => {
      keys.forEach((key) => caches.delete(key));
    });
  }
});
