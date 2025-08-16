// sw.js — Service Worker de RecargApp (no auto-salta a la nueva versión)
// Sube este archivo a: /RecargApp/sw.js

// 1) Cambiá este número en cada release para invalidar el cache
const CACHE_VERSION = 'recargapp-v1.5.5';

// 2) Prefijo de rutas en GitHub Pages (tu repo)
const SCOPE_PREFIX = '/RecargApp';

// 3) Assets núcleo que necesitamos offline
const CORE_ASSETS = [
  `${SCOPE_PREFIX}/`,
  `${SCOPE_PREFIX}/index.html`,
  `${SCOPE_PREFIX}/manifest.json`,
  `${SCOPE_PREFIX}/icons/icon-192x192.png`,
  `${SCOPE_PREFIX}/icons/icon-512x512.png`,
];

// -------- Install: precarga núcleo (sin skipWaiting automático)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .catch(() => {})
  );
});

// -------- Activate: limpia caches viejos y toma control de clientes
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.map((k) => (k !== CACHE_VERSION ? caches.delete(k) : Promise.resolve()))
    );
    await self.clients.claim();
  })());
});

// -------- Mensajes desde la página (para aplicar update bajo demanda)
self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') {
    // Solo activamos inmediatamente si la página lo pide explícitamente
    self.skipWaiting();
  }
});

// -------- Estrategias de fetch
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Solo manejamos requests dentro del scope del sitio
  if (!url.pathname.startsWith(SCOPE_PREFIX + '/')) return;

  // Navegación (HTML): network-first con fallback a index.html cacheado
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          // Cacheamos la última versión del HTML
          const cache = await caches.open(CACHE_VERSION);
          cache.put(req, fresh.clone());
          return fresh;
        } catch {
          // Fallback a cache
          const cacheHit =
            (await caches.match(req)) ||
            (await caches.match(`${SCOPE_PREFIX}/index.html`));
          return cacheHit || new Response('Offline', { status: 503, statusText: 'Offline' });
        }
      })()
    );
    return;
  }

  // Core assets: cache-first
  const isCore = CORE_ASSETS.includes(url.pathname) || CORE_ASSETS.includes(url.pathname + '/');
  if (isCore) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req))
    );
    return;
  }

  // Resto de archivos: network-first con cache de respaldo
  event.respondWith(
    (async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE_VERSION);
        cache.put(req, fresh.clone());
        return fresh;
      } catch {
        const cached = await caches.match(req);
        if (cached) return cached;
        // Si es un PNG/JPG que no está en cache, devolvemos 404 limpio
        return new Response('', { status: 404 });
      }
    })()
  );
});
