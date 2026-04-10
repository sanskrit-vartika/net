const CACHE_NAME = 'sanskrit-vartika-v2'; // Bumped to v2 to force an update!
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json'
];

// 1. Install and activate immediately
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Forces the browser to activate this new version instantly
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. Delete the old V1 cache so the new code can load
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

// 3. NETWORK-FIRST STRATEGY (Always gets the freshest updates)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // If internet works, save the fresh file to cache and show it
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      })
      .catch(() => {
        // If the internet is down, load the backup from cache
        return caches.match(event.request);
      })
  );
});