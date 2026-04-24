const CACHE_NAME = 'sanskrit-vartika-2026-04-24'; // Bumped to v3 for the major upgrade
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json'
];

// 1. Install Phase
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Forces the browser to activate this new version instantly
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. Activate Phase (Clean up old caches and take control)
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
    }).then(() => self.clients.claim()) // 🚀 UPGRADE: Instantly controls the page on first load
  );
});

// 3. 🚀 UPGRADED ENGINE: Stale-While-Revalidate with API Bypass
self.addEventListener('fetch', (event) => {
  
  // Rule 1: Do NOT cache POST requests (Prevents Firebase/API crashes)
  if (event.request.method !== 'GET') return;

  // Rule 2: Do NOT cache external databases (Google Sheets, Firebase, Analytics)
  // Only cache files that come from your GitHub origin
  const url = new URL(event.request.url);
  if (!url.origin.includes(self.location.origin)) {
     return; // Let the browser handle Firebase and Google Sheets normally!
  }

  // Rule 3: Stale-While-Revalidate Strategy for UI Speed
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      
      // Always fetch the newest version in the background
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
        });
        return networkResponse;
      }).catch(() => {
        // Silently ignore network failures (the user will just see the cache)
      });

      // 🚀 INSTANT LOAD: Return the cache immediately if we have it, otherwise wait for network
      return cachedResponse || fetchPromise;
    })
  );
});