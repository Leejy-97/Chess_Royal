// GitHub Pages용 서비스워커 (상대경로 캐싱)
// 캐시 버전은 업데이트 때마다 숫자만 올리면 됩니다.
const CACHE = 'cr-cache-v4';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-pixel-light-192.png',
  './icons/icon-pixel-light-512.png'
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

// 네비게이션은 네트워크 우선 → 실패 시 캐시된 index로
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return resp;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }
  // 그 외는 캐시 우선 → 없으면 네트워크
  e.respondWith(
    caches.match(req).then((r) => r || fetch(req).then((resp) => {
      const copy = resp.clone();
      caches.open(CACHE).then((c) => c.put(req, copy));
      return resp;
    }))
  );
});
