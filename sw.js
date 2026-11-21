/* ELWIS – service worker: aplikacja działa offline. Zmiana wersji = odświeżenie plików na tabletach. */
const CACHE = 'elwis-1.58.2';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'css/app.css', 'js/db.js', 'js/api.js', 'js/state.js', 'js/plan.js', 'js/prot.js', 'js/app.js', 'js/pc.js', 'js/czas.js', 'icons/icon-192.png', 'icons/icon-512.png',
  ...['inter-latin', 'inter-latin-ext'].flatMap(f => [400, 500, 600, 700].map(w => `fonts/${f}-${w}-normal.woff2`)),
  ...['jetbrains-mono-latin', 'jetbrains-mono-latin-ext'].flatMap(f => [500, 600].map(w => `fonts/${f}-${w}-normal.woff2`)),
  'fonts/orbitron-latin-800-normal.woff2'];

self.addEventListener('install', e => {
    // od 1.54.1: pobranie z pominięciem pamięci HTTP przeglądarki – inaczej nowa wersja mogła dostać stary app.css / app.js (mieszanka wersji)
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return; // serwer ELWIS (Google) – zawsze sieć
  // Najpierw sieć (świeża wersja), przy braku sieci – pamięć tabletu
  e.respondWith(
    fetch(e.request.mode === 'navigate' ? e.request : new Request(e.request, { cache: 'no-cache' })).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html')))
  );
});
