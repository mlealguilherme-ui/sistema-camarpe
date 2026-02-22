// Service worker mínimo para PWA - permite instalação no dispositivo
const CACHE_NAME = 'camarpe-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Sem cache agressivo; a app funciona online
  event.respondWith(fetch(event.request));
});
