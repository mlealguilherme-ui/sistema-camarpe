// Service worker PWA - Sistema Camarpe
const CACHE_NAME = 'camarpe-pwa-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/manifest.json',
        '/icon-192.png',
        '/icon-512.png',
      ]).catch(() => {});
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) {
    event.respondWith(fetch(event.request));
    return;
  }
  // Cache primeiro para manifest e ícones; resto network-first
  if (url.pathname === '/manifest.json' || url.pathname === '/icon-192.png' || url.pathname === '/icon-512.png') {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
    return;
  }
  event.respondWith(fetch(event.request));
});

self.addEventListener('push', (event) => {
  let payload = { title: 'Camarpe', body: '', url: '/' };
  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch (_) {}
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icon-192.png',
      data: { url: payload.url || '/' },
      tag: payload.url || 'camarpe',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0 && clientList[0].url) {
        clientList[0].navigate(url);
        clientList[0].focus();
      } else if (self.clients.openWindow) {
        self.clients.openWindow(new URL(url, self.location.origin).href);
      }
    })
  );
});
