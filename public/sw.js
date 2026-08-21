// Nekomon PWA Service Worker
const CACHE_NAME = "nekomon-pwa-v1.0.0";

const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/manifest.webmanifest",
  "/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-512-maskable.png",
  "/screenshots/screenshot-desktop.png",
  "/screenshots/screenshot-mobile.png"
];

// Install Event - Precache Core Assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[Service Worker] Pre-caching offline pages and assets");
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.warn("[Service Worker] Pre-cache warning:", err);
      })
  );
});

// Activate Event - Clean Up Old Caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              console.log("[Service Worker] Clearing old cache:", name);
              return caches.delete(name);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch Event - Dynamic Stale-While-Revalidate Strategy for Assets, Network-first for APIs
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Skip non-GET requests and cross-origin external API requests
  if (request.method !== "GET") return;

  // 2. Bypass API calls and payment gateways from cache
  if (
    url.pathname.startsWith("/api/") ||
    url.hostname.includes("midtrans.com") ||
    url.hostname.includes("googlesyndication.com") ||
    url.hostname.includes("effectivecpmnetwork.com") ||
    url.hostname.includes("firestore.googleapis.com")
  ) {
    return;
  }

  // 3. For navigation requests (HTML Document), use Network First with Cache Fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => {
          return caches.match("/") || caches.match("/index.html");
        })
    );
    return;
  }

  // 4. For Static Assets (JS, CSS, Images, SVGs, Fonts), use Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch((err) => {
          // If offline and request fails, ignore network errors if cache was returned
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});

// Push Notification Listener (Ready for Future PWA Engagement)
self.addEventListener("push", (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    const options = {
      body: data.body || "Pemberitahuan baru dari Nekomon!",
      icon: "/icon.svg",
      badge: "/icon.svg",
      vibrate: [100, 50, 100],
      data: {
        url: data.url || "/"
      }
    };
    event.waitUntil(
      self.registration.showNotification(data.title || "Nekomon Online", options)
    );
  } catch (e) {
    console.error("[Service Worker] Push notification parse error:", e);
  }
});

// Notification Click Listener
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
