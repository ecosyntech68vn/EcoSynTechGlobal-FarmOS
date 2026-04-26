const CACHE_NAME = 'ecosyntech-v2.3.2';
const PRECACHE_URLS = [
  '.',
  'index.html',
  'styles.css',
  'app.js',
  'manifest.json',
  'manifest.webmanifest',
  'products.html',
  'mobile.html',
  'dashboard-sales.html',
  'api/sensors.json',
  'api/devices.json',
  'api/alerts.json',
  'api/stats.json',
  'icons/icon-192.png',
  'icons/icon-512.png'
];

const OFFLINE_PAGE = 'index.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => (key !== CACHE_NAME ? caches.delete(key) : null))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') {
    return;
  }

  // Network first, fallback to cache for API
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Cache first, fallback to network for pages
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        // Return cached, update in background
        fetch(request).then((response) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(request, response));
        });
        return cached;
      }
      return fetch(request).then((response) => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
        return response;
      }).catch(() => caches.match(OFFLINE_PAGE));
    })
  );
});

// Push Notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const title = data.title || 'EcoSynTech';
  const options = {
    body: data.message || 'Thông báo mới',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});

// Background Sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  // Sync when back online
  const cache = await caches.open(CACHE_NAME);
  const requests = await cache.keys();
  
  for (const request of requests) {
    if (request.url.includes('/api/')) {
      try {
        await fetch(request);
      } catch (e) {
        console.log('Sync failed:', e);
      }
    }
  }
}
