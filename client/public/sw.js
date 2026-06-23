const CACHE_NAME = 'zenius-ai-cache-v2';

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/site.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests or external extension protocols
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Bypass paths: dynamic API endpoints, websockets, uploads, admin tools, WebRTC rooms, quizzes, and user profile state pages
  const pathname = url.pathname;
  const bypassPrefixes = [
    '/api',
    '/socket.io',
    '/admin',
    '/upload',
    '/student',
    '/instructor',
    '/dashboard',
    '/profile',
    '/settings',
    '/live',
    '/live-room',
    '/classroom',
    '/meeting',
    '/live-lectures',
    '/quizzes'
  ];

  const shouldBypass = bypassPrefixes.some(prefix => pathname.startsWith(prefix));

  if (shouldBypass) {
    return; // SW ignores request, browser fetches direct from network
  }

  // Intercept navigation requests (HTML page loads) to support offline SPA load
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => {
          // Serve SPA root shell offline
          return caches.match('/index.html') || caches.match('/');
        })
    );
    return;
  }

  // Cache-first / Stale-while-revalidate for local static assets (JS, CSS, images, fonts)
  const isLocalAsset = url.origin === self.location.origin && (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    request.destination === 'font' ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.woff2')
  );

  if (isLocalAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Fetch updated version in background to update cache
          fetch(request).then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, networkResponse);
              });
            }
          }).catch(() => {/* ignore background update errors */});
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          return networkResponse;
        });
      })
    );
  }
});
