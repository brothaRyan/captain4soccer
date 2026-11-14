// 앱을 수정해서 다시 올릴 때는 아래 버전 숫자를 올려 주세요. (예: captain-v19)
const V = 'captain-v19';
const CORE = ['./', 'index.html', 'styles.css', 'app.js', 'locales/ko.js', 'locales/en.js', 'locales/es.js', 'locales/pt.js', 'locales/de.js', 'locales/fr.js', 'locales/it.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin === location.origin) {
    // 온라인이면 최신 파일, 오프라인이면 저장된 파일
    e.respondWith(
      fetch(r).then(res => {
        const copy = res.clone();
        caches.open(V).then(c => c.put(r, copy));
        return res;
      }).catch(() => caches.match(r).then(m => m || caches.match('index.html')))
    );
  } else if (/fonts\.(googleapis|gstatic)\.com$/.test(u.host)) {
    e.respondWith(
      caches.open(V).then(c => c.match(r).then(m => m ||
        fetch(r).then(res => { c.put(r, res.clone()); return res; }).catch(() => Response.error())
      ))
    );
  }
});
