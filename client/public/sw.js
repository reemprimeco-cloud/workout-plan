/**
 * Prime Fit Service Worker — Push Notification Handler
 * Handles push events and notification clicks.
 */

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Prime Fit", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "🏋️ Prime Fit";
  const options = {
    body: data.body || "وقت التمرين!",
    icon: data.icon || "/icons/icon-192.png",
    badge: data.badge || "/icons/icon-192.png",
    tag: data.tag || "workout-reminder",
    renotify: data.renotify ?? true,
    data: { url: data.url || "/" },
    actions: [
      { action: "open", title: "افتح التطبيق / Open App" },
      { action: "dismiss", title: "لاحقاً / Later" },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing window if open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            return client.focus();
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Note: pushsubscriptionchange is handled by the app on next load.
// When the subscription expires, the app will detect the missing subscription
// and prompt the user to re-enable notifications in their profile settings.
self.addEventListener("pushsubscriptionchange", () => {
  console.log("[SW] Push subscription changed — user should re-enable notifications in app settings");
});
