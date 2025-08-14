// ===============================
// Service Worker para RecargApp
// Versión V1.5.3
// ===============================
const CACHE_NAME = 'recargapp-v1.5.3';
const FILES_TO_CACHE = [
  '/RecargApp/',
  '/RecargApp/index.html',
  '/RecargApp/manifest.webmanifest',
  '/RecargApp/icons/icon-192x192.png',
  '/RecargApp/icons/icon-512x512.png'
];

// Instalar y precachear
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE)));
});

// Activar y limpiar cachés viejas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Responder desde caché primero
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(r => r || fetch(event.request))
  );
});

// Forzar actualización bajo demanda
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
