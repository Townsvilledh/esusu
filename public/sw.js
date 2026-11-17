/* Esusu service worker — hand-written, cache-first.
 *
 * Strategy:
 *  - On install, pre-cache the app shell (the page itself + the manifest).
 *  - On fetch (GET, same origin): answer from the cache first; on a miss, go
 *    to the network and store a copy, so every asset the app has ever loaded
 *    is available offline afterwards.
 *  - Navigations that miss the cache fall back to the cached page, so opening
 *    the app offline always lands on the app shell.
 * No data ever leaves the device: this worker only caches static files.
 */
const CACHE = "esusu-shell-v1";
const SHELL = ["./", "./index.html", "./manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(request)
        .then((response) => {
          if (response.ok && new URL(request.url).origin === self.location.origin) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => {
          if (request.mode === "navigate") {
            return caches.match("./index.html");
          }
          throw new Error("offline and not cached");
        });
    })
  );
});
