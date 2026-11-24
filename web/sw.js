/* كادر — offline cache. Bump V on every release so phones pick up the update. */
const V = 'kadr-2026-11-24c';
const CORE = ['./', 'index.html', 'data.js', 'world.js', 'engine.js', 'ui.js', 'tl.js', 'export.js', 'lib/three.min.js', 'lib/mp4-muxer.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'fonts/ibm-plex-sans-arabic-arabic-400-normal.woff2', 'fonts/ibm-plex-sans-arabic-arabic-500-normal.woff2', 'fonts/ibm-plex-sans-arabic-arabic-600-normal.woff2', 'fonts/ibm-plex-sans-arabic-arabic-700-normal.woff2', 'fonts/ibm-plex-sans-arabic-latin-400-normal.woff2', 'fonts/ibm-plex-sans-arabic-latin-600-normal.woff2', 'fonts/noto-kufi-arabic-arabic-700-normal.woff2', 'fonts/noto-kufi-arabic-arabic-800-normal.woff2', 'fonts/noto-kufi-arabic-latin-700-normal.woff2', 'fonts/noto-kufi-arabic-latin-800-normal.woff2'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(fetch(r).then(res => { if (res.ok) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); } return res; })
    .catch(() => caches.match(r, { ignoreSearch: true }).then(m => m || caches.match('index.html'))));
});
