const CACHE = 'goalora-v7';
const ASSETS = ['./','./index.html','./styles.css','./app.js','./enhancements.js','./navigation.js','./recovery.js','./auth.js','./install.js','./manifest.webmanifest','./icon.svg'];
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const fresh = event.request.mode === 'navigate' || ['script','style'].includes(event.request.destination);
  event.respondWith(fresh
    ? fetch(event.request).then(r => { const c=r.clone(); caches.open(CACHE).then(x=>x.put(event.request,c)); return r; }).catch(() => caches.match(event.request).then(r=>r||caches.match('./index.html')))
    : caches.match(event.request).then(r => r || fetch(event.request).then(x => { const c=x.clone(); caches.open(CACHE).then(y=>y.put(event.request,c)); return x; }).catch(() => caches.match('./index.html')))
  );
});
