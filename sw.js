// sw.js — RecargApp (GitHub Pages)
// Cambiá CACHE_VERSION en cada release para forzar aviso de actualización
const CACHE_VERSION = 'v1.5.7';
const APP_CACHE = `recargapp-${CACHE_VERSION}`;

const CORE_ASSETS = [
  '/RecargApp/',
  '/RecargApp/index.html',
  '/RecargApp/manifest.json',
  '/RecargApp/icons/icon-192x192.png',
  '/RecargApp/icons/icon-512x512.png',
  // agrega aquí más archivos estáticos si corresponde
];

self.addEventListener('install', (e) => {
  self.skipWaiting(); // queda en waiting hasta que la app lo active
  e.waitUntil(
    caches.open(APP_CACHE).then((c) => c.addAll(CORE_ASSETS)).catch(() => {})
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k !== APP_CACHE ? caches.delete(k) : null)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;

  // manifest y notas: siempre intentar red fresca
  if (req.url.endsWith('/manifest.json') || req.url.endsWith('/notes.json')) {
    e.respondWith((async () => {
      try {
        const fresh = await fetch(req, { cache: 'no-store' });
        return fresh;
      } catch {
        const cache = await caches.match(req);
        return cache || Response.error();
      }
    })());
    return;
  }

  // cache-first para lo demás
  e.respondWith((async () => {
    const cache = await caches.match(req);
    if (cache) return cache;
    try {
      const net = await fetch(req);
      const c = await caches.open(APP_CACHE);
      if (req.method === 'GET' && net.status === 200) c.put(req, net.clone());
      return net;
    } catch {
      return cache || Response.error();
    }
  })());
});

self.addEventListener('message', (e) => {
  const { type } = e.data || {};
  if (type === 'SKIP_WAITING') self.skipWaiting();
});
