const CACHE_NAME = 'ecosyntech-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/products.html',
  '/policies.html',
  '/css/mobile-system.css',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

const API_CACHE_NAME = 'ecosyntech-api-v1';
const API_CACHE_DURATION = 5 * 60 * 1000;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== API_CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(cacheFirstAPI(request));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(cacheFirst(request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    return caches.match('/dashboard.html');
  }
}

async function cacheFirstAPI(request) {
  const cached = await caches.match(request);
  
  if (cached) {
    const cacheTime = cached.headers.get('sw-cache-time');
    if (cacheTime && Date.now() - parseInt(cacheTime) < API_CACHE_DURATION) {
      return cached;
    }
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(API_CACHE_NAME);
      const responseClone = response.clone();
      const headers = new Headers(responseClone.headers);
      headers.set('sw-cache-time', Date.now().toString());
      const body = await responseClone.blob();
      const cachedResponse = new Response(body, {
        status: responseClone.status,
        statusText: responseClone.statusText,
        headers: headers
      });
      cache.put(request, cachedResponse);
    }
    return response;
  } catch (error) {
    if (cached) {
      return cached;
    }
    return new Response(JSON.stringify({ error: 'offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-sensor-data') {
    event.waitUntil(syncSensorData());
  }
});

async function syncSensorData() {
  console.log('[SW] Syncing sensor data...');
}
