// Uptoza Service Worker - Performance + Push Notifications
// PERMANENT FIX: JS/CSS use network-first to prevent stale cache crashes on mobile
const CACHE_VERSION = 'v2.0.0';
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
  // Network-first for JS/CSS (CRITICAL: prevents stale code crashes after deploys)
  networkFirstCode: ['.js', '.css'],
  // Cache first for static non-code assets (images, fonts)
  cacheFirst: ['.woff2', '.png', '.jpg', '.webp', '.svg', '.avif', '.ico', '.mp4'],
  // Stale-while-revalidate ONLY for PUBLIC BFF endpoints (anonymous)
  staleWhileRevalidate: ['/functions/v1/bff-marketplace-home', '/functions/v1/bff-store-public', '/functions/v1/bff-flash-sales'],
  // Network only for auth-related calls AND authenticated BFF endpoints
  networkOnly: ['/auth/', 'validate-session', 'admin-login', '/functions/v1/bff-buyer', '/functions/v1/bff-seller'],
};

// Install - cache critical assets, skip waiting immediately
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker', CACHE_VERSION);
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate - clean ALL old caches aggressively
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker', CACHE_VERSION);
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key.startsWith('uptoza-') && 
                          key !== STATIC_CACHE && 
                          key !== DYNAMIC_CACHE && 
                          key !== API_CACHE)
          .map((key) => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch - smart caching strategies
// CRITICAL: Never cache authenticated requests to prevent cross-user data leaks
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) return;

  // CRITICAL: If request has Authorization header, bypass cache entirely
  if (request.headers.has('Authorization')) {
    return;
  }

  // Network only for auth and authenticated BFF endpoints
  if (CACHE_STRATEGIES.networkOnly.some(pattern => url.pathname.includes(pattern) || url.href.includes(pattern))) {
    return;
  }

  // CRITICAL FIX: Network-first for JS and CSS files
  // This prevents stale code from being served after deployments
  if (CACHE_STRATEGIES.networkFirstCode.some(ext => url.pathname.endsWith(ext))) {
    event.respondWith(networkFirst(request, STATIC_CACHE));
    return;
  }

  // Stale-while-revalidate ONLY for PUBLIC BFF API calls
  if (CACHE_STRATEGIES.staleWhileRevalidate.some(pattern => url.pathname.includes(pattern) || url.href.includes(pattern))) {
    event.respondWith(staleWhileRevalidate(request, API_CACHE));
    return;
  }

  // Cache first for static non-code assets (images, fonts, etc.)
  if (CACHE_STRATEGIES.cacheFirst.some(ext => url.pathname.endsWith(ext) || url.pathname.includes('assets/'))) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Default: network first with cache fallback
  event.respondWith(networkFirst(request, DYNAMIC_CACHE));
});

// Cache first strategy (for images/fonts only)
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}

// Network first strategy (for JS/CSS and default)
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
    if (cached) return cached;
    return new Response('Offline', { status: 503 });
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => cached);

  return cached || fetchPromise;
}

// Push notification handling
self.addEventListener('push', (event) => {
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
  event.notification.close();

  const action = event.action;
  const notificationData = event.notification.data || {};

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

  if (action === 'dismiss') return;

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

self.addEventListener('notificationclose', () => {});

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
