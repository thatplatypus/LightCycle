const CACHE_NAME = 'lightcycle-cache-v1';

const getBasePath = () => {
  // Extract base path from the service worker's own URL
  // The service worker is at <base>/service-worker.js
  const swPath = self.location.pathname;
  if (swPath === '/service-worker.js') {
    return '';
  }
  const basePathMatch = swPath.match(/^(.+)\/service-worker\.js$/);
  return basePathMatch ? basePathMatch[1] : '';
};

const BASE_PATH = getBasePath();

const ASSETS_TO_CACHE = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/manifest.json`,
  `${BASE_PATH}/favicon.png`,
  `${BASE_PATH}/lightcycle_192.png`,
  `${BASE_PATH}/lightcycle_256.png`,
  `${BASE_PATH}/lightcycle_512.png`,
  `${BASE_PATH}/lightcycle_1024.png`,
  `${BASE_PATH}/audio/background.mp3`,
  `${BASE_PATH}/audio/gameplay.mp3`,
  `${BASE_PATH}/audio/gameplay-local-multiplayer.mp3`,
  `${BASE_PATH}/audio/lightcycle.mp3`,
  `${BASE_PATH}/audio/lightcycle-2.mp3`,
  `${BASE_PATH}/audio/derezz-1.mp3`,
  `${BASE_PATH}/audio/derezz-2.mp3`,
  `${BASE_PATH}/audio/derezz-3.mp3`,
  `${BASE_PATH}/audio/derezz-4.mp3`,
  `${BASE_PATH}/audio/derezz-5.mp3`,
  `${BASE_PATH}/audio/derezz-6.mp3`
];

// Install event - cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
      .catch(err => {
        console.error('Service worker install failed:', err);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.filter(name => name !== CACHE_NAME)
            .map(name => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache if available, otherwise fetch from network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(event.request)
          .then(response => {
            // Don't cache non-successful responses or non-basic responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response as it can only be consumed once
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
              
            return response;
          })
          .catch(() => {
            // If fetch fails and we have no cache, return a basic offline page
            // For a game, we might want to show an error or just let it fail
            return new Response('Network error', { status: 408 });
          });
      })
  );
});

