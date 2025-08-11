// Rayda Service Worker
const CACHE_NAME = 'rayda-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  // Note: Vite assets will be added dynamically
];

// Install event - cache basic assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('[SW] Cache install failed:', error);
      })
  );
  // Force the new service worker to activate
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName.startsWith('rayda-')) {
            console.log('[SW] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event - serve from cache when possible
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    // For Mapbox tiles and external resources, use network-first strategy
    if (url.hostname.includes('mapbox') || url.hostname.includes('api.')) {
      event.respondWith(
        fetch(request)
          .then((response) => {
            // Cache successful responses
            if (response && response.status === 200) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache);
              });
            }
            return response;
          })
          .catch(() => {
            // Try to return cached version if network fails
            return caches.match(request);
          })
      );
      return;
    }
    // For other external resources, just try network
    return;
  }

  // For app resources, use cache-first strategy
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached version and update cache in background
        fetch(request).then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
        }).catch(() => {
          // Silently fail if network update fails
        });
        return cachedResponse;
      }

      // Not in cache, fetch from network
      return fetch(request).then((response) => {
        // Cache successful responses
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      }).catch(() => {
        // Offline fallback for HTML pages
        if (request.destination === 'document') {
          return caches.match('/');
        }
        // Return a custom offline page or image if needed
        return new Response('Offline - Content not available', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({
            'Content-Type': 'text/plain'
          })
        });
      });
    })
  );
});

// Background sync for updating train positions when back online
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-train-data') {
    event.waitUntil(
      // This would sync train data when connection is restored
      fetch('/api/trains')
        .then((response) => response.json())
        .then((data) => {
          // Send message to all clients with updated data
          self.clients.matchAll().then((clients) => {
            clients.forEach((client) => {
              client.postMessage({
                type: 'TRAIN_DATA_UPDATED',
                data: data
              });
            });
          });
        })
        .catch((error) => {
          console.error('[SW] Sync failed:', error);
        })
    );
  }
});

// Handle messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});