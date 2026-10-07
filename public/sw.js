self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('flowstate-store').then((cache) => cache.addAll([
      '/',
      '/index.html',
      '/favicon.svg',
      '/defaultpreset.jpg',
      '/defaultpreset.png'
    ])),
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request)),
  );
});
