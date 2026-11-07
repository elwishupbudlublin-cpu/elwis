/* ELWIS – service worker: aplikacja działa offline. Zmiana wersji = odświeżenie plików na tabletach. */
const CACHE = 'elwis-1.0.1';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'css/app.css', 'js/db.js', 'js/api.js', 'js/state.js', 'js/plan.js', 'js/app.js', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return; // serwer ELWIS (Google) – zawsze sieć
  // Najpierw sieć (świeża wersja), przy braku sieci – pamięć tabletu
  e.respondWith(
    fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request).then(r => r || caches.match('index.html')))
  );
});
