const CACHE_NAME = 'client-dossiers-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/generated/pwa-icon.dim_512x512.png',
  '/assets/generated/pwa-icon-maskable.dim_512x512.png',
  '/assets/generated/pwa-splash.dim_1242x2688.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
