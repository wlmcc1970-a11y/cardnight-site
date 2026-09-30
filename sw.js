/* Card Night: Score Keeper service worker. DigiRune Studios.
   App pages (the app and its privacy page): network first, cached copy when offline.
   The 8 printable score sheet PDFs and the icons are precached so they work offline after install.
   Marketing pages on the same site (about.html, printables/*.html, images) are left to the network and never cached here.
   Makes no requests of its own beyond this app's own files. */
'use strict';
const CACHE = 'card-night-v1.0.4-55dcb55800';
const SHELL = ["./","index.html","manifest.json","privacy.html","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-192.png","icons/icon-maskable-512.png","icons/apple-touch-icon-180.png","printables/pdf/hand-and-foot.pdf","printables/pdf/canasta.pdf","printables/pdf/spades.pdf","printables/pdf/gin-rummy.pdf","printables/pdf/500-rum.pdf","printables/pdf/mexican-train.pdf","printables/pdf/cribbage.pdf","printables/pdf/euchre.pdf"];
const APP_PAGES = ['', 'index.html', 'privacy.html'];

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

const scopePath = () => new URL(self.registration.scope).pathname;
const appRelative = (url) => url.pathname.startsWith(scopePath()) ? url.pathname.slice(scopePath().length) : null;

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // never touch other sites
  const rel = appRelative(url);
  if (rel === null) return;
  if (req.mode === 'navigate') {
    if (!APP_PAGES.includes(rel)) return; // marketing pages: plain network, not cached by the app
    const isApp = rel === '' || rel === 'index.html';
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
          .then((hit) => hit || c.match('index.html'))))
    );
    return;
  }
  // Files the app precached (icons, manifest, score sheet PDFs): cache first. Anything else: network only.
  if (!SHELL.includes(rel)) return;
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).then((res) => {
      if (res && res.ok && res.type === 'basic') { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => new Response('', { status: 504, statusText: 'Offline' })))
  );
});
