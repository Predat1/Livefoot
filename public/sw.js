// ============================================================
// LiveFoot PWA Service Worker v2.1.0
// Features: Offline Cache, Push Notifications, Auto-Updates
// ============================================================

const SW_VERSION = "2.1.0";
const CACHE_NAME = `livefoot-v${SW_VERSION}`;
const OFFLINE_PAGE = "/";

// Assets to pre-cache on install
const PRECACHE_ASSETS = [
  "/",
  "/manifest.webmanifest",
  "/pwa-192x192.png",
  "/pwa-512x512.png",
  "/favicon.ico",
];

// Patterns that MUST bypass cache (always network-first)
const BYPASS_PATTERNS = [
  /\.supabase\.co\//,
  /\/functions\/v1\//,
  /v3\.football\.api-sports\.io/,
  /openrouter\.ai/,
  /api-sports\.io/,
  /\/api\//,
];

function shouldBypass(url) {
  return BYPASS_PATTERNS.some((p) => p.test(url));
}

// ── Install ───────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  console.log(`[SW] Installing version ${SW_VERSION}`);
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate ─────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  console.log(`[SW] Activating version ${SW_VERSION}`);
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => {
              console.log(`[SW] Deleting old cache: ${key}`);
              return caches.delete(key);
            })
        )
      )
      .then(() => self.clients.claim())
      .then(() => {
        // Notify all clients that a new version is available
        return self.clients.matchAll({ includeUncontrolled: true }).then((clients) => {
          clients.forEach((client) =>
            client.postMessage({ type: "SW_UPDATED", version: SW_VERSION })
          );
        });
      })
  );
});

// ── Fetch Strategy ───────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  // Always bypass API / Supabase calls
  if (shouldBypass(url)) return;

  // For navigation requests, use network with offline fallback
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match(OFFLINE_PAGE).then((r) => r || new Response("Offline"))
      )
    );
    return;
  }

  // For static assets: Cache-First
  if (
    event.request.method === "GET" &&
    (url.includes("/assets/") ||
      url.endsWith(".png") ||
      url.endsWith(".ico") ||
      url.endsWith(".svg") ||
      url.endsWith(".webp") ||
      url.endsWith(".webmanifest"))
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200) return response;
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        });
      })
    );
    return;
  }

  // Default: Network-First for everything else
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// ── Push Notifications ───────────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || "⚽ LiveFoot";
    const options = {
      body: data.body || "",
      icon: "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
      tag: data.tag || `livefoot-${Date.now()}`,
      data: { url: data.url || "/" },
      vibrate: [200, 100, 200],
      requireInteraction: false,
      actions: [
        { action: "view", title: "Voir" },
        { action: "dismiss", title: "Fermer" },
      ],
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
    console.error("[SW] Push event error:", e);
  }
});

// ── Notification Click ────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "dismiss") return;

  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        return self.clients.openWindow(url);
      })
  );
});

// ── Message Handler ───────────────────────────────────────────────
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
