// LiveFoot Service Worker - Goal Push Notifications
// This file is injected into the VitePWA-generated service worker

self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || "⚽ GOAL!";
    const options = {
      body: data.body || "",
      icon: "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
      tag: data.tag || `goal-${Date.now()}`,
      data: { url: data.url || "/live" },
      vibrate: [200, 100, 200],
      requireInteraction: false,
      actions: [
        { action: "view", title: "Voir le match" },
        { action: "dismiss", title: "Fermer" },
      ],
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
    console.error("Push event error:", e);
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/live";

  if (event.action === "dismiss") return;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      // Focus existing window if available
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Open new window
      return self.clients.openWindow(url);
    })
  );
});
