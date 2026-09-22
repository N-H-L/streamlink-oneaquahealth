// Minimal offline support: the app shell is cached on install-ish (first visit), map tiles are
// cached as they are seen. A stream check taken with no signal is queued in the app (see outbox.ts).
// The built asset list is injected at build time (scripts/inject-sw-assets.mjs).
const PRECACHE = ["./", "./index.html", "./manifest.webmanifest"]; /*__SL_ASSETS__*/
const SHELL = "streamlink-shell-v1";
const TILES = "streamlink-tiles-v1";

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== SHELL && k !== TILES).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return; // never cache FHIR writes
  const url = new URL(request.url);
  if (/tile\.openstreetmap\.org$/.test(url.hostname)) {
    e.respondWith(caches.open(TILES).then(async (c) => {
      const hit = await c.match(request);
      if (hit) return hit;
      try {
        const res = await fetch(request);
        if (res.ok) c.put(request, res.clone());
        return res;
      } catch {
        return hit ?? Response.error();
      }
    }));
    return;
  }
  if (url.origin !== location.origin) return; // FHIR servers etc: always live
  e.respondWith((async () => {
    const cache = await caches.open(SHELL);
    // ignoreVary matters: cached responses carry Vary headers, and without it every lookup misses.
    const hit = await cache.match(request, { ignoreSearch: true, ignoreVary: true });
    if (hit) return hit;
    try {
      const res = await fetch(request);
      if (res.ok) cache.put(request, res.clone());
      return res;
    } catch (err) {
      // Only a page navigation may fall back to the app shell; never a script or style.
      if (request.mode === "navigate") {
        const shell = await cache.match("./index.html", { ignoreVary: true });
        if (shell) return shell;
      }
      throw err;
    }
  })());
});
