// ROXTOR ERP - Service Worker Resiliente v1.7
const CACHE_NAME = 'roxtor-v1.7-resilient';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdn.tailwindcss.com'
];

// Instalación y limpieza de caches antiguos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => cacheName !== CACHE_NAME)
                  .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Solo cachear peticiones GET
  if (event.request.method !== 'GET') return;
  
  // No cachear llamadas a la API
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    caches.match(event.request).then((response) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });
      return response || fetchPromise;
    }).catch(() => {
      return caches.match('/');
    })
  );
});
// SERVICE WORKER ANIQUILADOR - ROXTOR ERP
const CACHE_NAME = 'roxtor-v1.7-cleaner';

self.addEventListener('install', (event) => {
  // Fuerza al Service Worker a tomar el control de inmediato
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // BORRA ABSOLUTAMENTE TODO LO ANTERIOR (v1, v1.6, etc)
          console.log('Aniquilando caché antiguo:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      // Obliga a todas las pestañas abiertas a usar este nuevo SW limpio
      return self.clients.claim();
    })
  );
});

// Este bloque asegura que NADA se cargue del caché viejo, todo va a la red
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
