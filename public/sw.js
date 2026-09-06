// Nekomon Self-Clearing Service Worker
// Automatically clears all stale caches and unregisters to prevent module collisions
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => Promise.all(cacheNames.map((name) => caches.delete(name))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.claim())
  );
});

// Do not intercept or cache any fetch requests
self.addEventListener("fetch", () => {
  // Let network handle directly
});
