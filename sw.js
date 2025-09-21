const CACHE = 'cr-cache-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE ? caches.delete(k) : null)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  // HTML은 네트워크 우선 → 오프라인 시 캐시
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request).then((r) => {
        const copy = r.clone();
        caches.open(CACHE).then((c) => c.put(request, copy));
        return r;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }
  // 그 외는 캐시 우선 → 없으면 네트워크
  e.respondWith(
    caches.match(request).then((r) => r || fetch(request).then((resp) => {
      const copy = resp.clone();
      caches.open(CACHE).then((c) => c.put(request, copy));
      return resp;
    }))
  );
});
