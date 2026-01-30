// Uptoza Service Worker - Enterprise Performance + Push Notifications
// Version for cache busting - Enterprise scaling for 10M+ traffic
const CACHE_VERSION = 'v1.0.4';
const STATIC_CACHE = `uptoza-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `uptoza-dynamic-${CACHE_VERSION}`;
const API_CACHE = `uptoza-api-${CACHE_VERSION}`;

// Cache size limits for high traffic
const MAX_STATIC_ENTRIES = 100;
const MAX_DYNAMIC_ENTRIES = 50;
const MAX_API_ENTRIES = 30;

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
  networkOnly: ['/auth/', 'validate-session', 'admin-login', 'send-otp', 'verify-otp'],
};

// Install - cache critical assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker v1.0.4');
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

// Prune cache to maintain size limits
async function pruneCache(cacheName, maxItems) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    if (keys.length > maxItems) {
      console.log(`[SW] Pruning ${cacheName}: ${keys.length} -> ${maxItems}`);
      const toDelete = keys.slice(0, keys.length - maxItems);
      await Promise.all(toDelete.map(key => cache.delete(key)));
    }
  } catch (error) {
    console.warn('[SW] Prune cache error:', error);
  }
}

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

// Cache first strategy with size limit
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
      // Prune in background
      pruneCache(cacheName, MAX_STATIC_ENTRIES);
    }
    return response;
  } catch (error) {
    console.log('[SW] Cache first fetch failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Network first strategy with size limit
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
      // Prune in background
      pruneCache(cacheName, MAX_DYNAMIC_ENTRIES);
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

// Stale-while-revalidate strategy with size limit
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  // Fetch in background with timeout
  const fetchPromise = fetchWithTimeout(request, 10000).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
      // Prune in background
      pruneCache(cacheName, MAX_API_ENTRIES);
    }
    return response;
  }).catch(() => cached);

  // Return cached immediately, or wait for network
  return cached || fetchPromise;
}

// Fetch with timeout for reliability
async function fetchWithTimeout(request, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Background sync for offline purchases
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-purchases') {
    event.waitUntil(syncPendingPurchases());
  }
  
  if (event.tag === 'sync-analytics') {
    event.waitUntil(syncPendingAnalytics());
  }
});

// Sync pending purchases from IndexedDB
async function syncPendingPurchases() {
  try {
    // Get pending purchases from IndexedDB
    const pending = await getPendingItems('purchases');
    
    for (const purchase of pending) {
      try {
        await fetch('/functions/v1/process-purchase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(purchase),
        });
        await removePendingItem('purchases', purchase.id);
      } catch (error) {
        console.error('[SW] Sync purchase failed:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Sync purchases error:', error);
  }
}

// Sync pending analytics
async function syncPendingAnalytics() {
  try {
    const pending = await getPendingItems('analytics');
    
    if (pending.length > 0) {
      await fetch('/functions/v1/batch-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: pending }),
      });
      
      for (const item of pending) {
        await removePendingItem('analytics', item.id);
      }
    }
  } catch (error) {
    console.error('[SW] Sync analytics error:', error);
  }
}

// IndexedDB helpers for offline sync
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('uptoza-offline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('purchases')) {
        db.createObjectStore('purchases', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('analytics')) {
        db.createObjectStore('analytics', { keyPath: 'id' });
      }
    };
  });
}

async function getPendingItems(storeName) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}

async function removePendingItem(storeName, id) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    // Ignore errors
  }
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
  if (event.data === 'pruneAllCaches') {
    Promise.all([
      pruneCache(STATIC_CACHE, MAX_STATIC_ENTRIES),
      pruneCache(DYNAMIC_CACHE, MAX_DYNAMIC_ENTRIES),
      pruneCache(API_CACHE, MAX_API_ENTRIES),
    ]);
  }
});