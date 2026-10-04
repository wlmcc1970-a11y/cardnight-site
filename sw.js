/* Card Night website: retire the old app service worker. DigiRune Studios, 2026-10-02.
   This address used to serve the app too. This replacement clears the old offline copy, unregisters itself and
   reloads open tabs so every visitor sees the current website. The app now lives only inside the store apps. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try { const keys = await caches.keys(); await Promise.all(keys.map((k) => caches.delete(k))); } catch (e) {}
    try { await self.registration.unregister(); } catch (e) {}
    try { const tabs = await self.clients.matchAll({ type: 'window' }); tabs.forEach((c) => { try { c.navigate(c.url); } catch (e) {} }); } catch (e) {}
  })());
});
