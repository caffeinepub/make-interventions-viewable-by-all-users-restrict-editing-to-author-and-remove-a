const CACHE_NAME = 'client-dossiers-v2';
const urlsToCache = [
  '/assets/generated/pwa-icon.dim_512x512.png',
  '/assets/generated/pwa-icon-maskable.dim_512x512.png',
  '/assets/generated/pwa-splash.dim_1242x2688.png',
];

console.log('Service Worker: Script loaded');

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching assets');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Service Worker: Cache installation failed', error);
      })
  );
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Don't cache navigation requests to prevent stale index.html
  if (request.mode === 'navigate') {
    console.log('Service Worker: Navigation request, fetching from network:', request.url);
    event.respondWith(
      fetch(request).catch((error) => {
        console.error('Service Worker: Navigation fetch failed', error);
        return new Response('Network error', { status: 503 });
      })
    );
    return;
  }

  // For other requests, try cache first, then network
  event.respondWith(
    caches.match(request)
      .then((response) => {
        if (response) {
          console.log('Service Worker: Cache hit for', request.url);
          return response;
        }
        console.log('Service Worker: Cache miss, fetching from network:', request.url);
        return fetch(request).catch((error) => {
          console.error('Service Worker: Fetch failed for', request.url, error);
          throw error;
        });
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});
