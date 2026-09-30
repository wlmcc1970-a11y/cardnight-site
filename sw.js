/* Card Night: Score Keeper service worker. DigiRune Studios.
   Navigations: network first, cached copy when offline. Icons and other files: cache first.
   Makes no requests of its own beyond this app's own files. */
'use strict';
const CACHE = 'card-night-v1.0.2-50e1dd752f';
const SHELL = ["./","index.html","manifest.json","privacy.html","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-192.png","icons/icon-maskable-512.png","icons/apple-touch-icon-180.png"];

self.addEventListener('install', (event) => {
  // Fetch past the HTTP cache so a new version never precaches stale bytes. Waits for the page to say it is safe to switch.
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' })))));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('card-night-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // never touch other sites
  if (req.mode === 'navigate') {
    const isApp = url.pathname.endsWith('/') || /\/index\.html$/.test(url.pathname);
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(isApp ? 'index.html' : req, copy));
          }
          return res;
        })
        .catch(() => caches.open(CACHE).then((c) => c.match(isApp ? 'index.html' : req, { ignoreSearch: true })
          // An unknown page while offline: send the player to the app's home screen.
          .then((hit) => hit || Response.redirect(self.registration.scope, 302))))
    );
    return;
  }
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).then((res) => {
      if (res && res.ok && res.type === 'basic') { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => new Response('', { status: 504, statusText: 'Offline' })))
  );
});
