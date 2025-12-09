
const CACHE_NAME = 'marco-os-v5.0-stable';
const URLS_TO_CACHE = [
  './',
  './index.html',
  './logo.jpg',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700;900&family=Rajdhani:wght@300;500;700&display=swap'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(URLS_TO_CACHE);
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
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // NAVIGATION REQUESTS (HTML): Network First, Fallback to Cache
  // This is critical for SPAs to avoid 404s on new deployments
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
           // If valid network response, cache it and return
           if (response && response.status === 200) {
               const responseToCache = response.clone();
               caches.open(CACHE_NAME).then((cache) => {
                   cache.put(event.request, responseToCache);
               });
               return response;
           }
           // If 404 or other error from network, try cache
           return caches.match('./index.html') || caches.match('/');
        })
        .catch(() => {
           // If offline, return cached index.html
           return caches.match('./index.html') || caches.match('/');
        })
    );
    return;
  }

  // ASSET REQUESTS: Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
            if(networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });
            }
            return networkResponse;
        }).catch(() => {
            // Network failed, nothing to do
        });

        return cachedResponse || fetchPromise;
      })
  );
});
