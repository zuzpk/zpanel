// public/sw.js
// ---------------------------------------------------------------
// 1. Force immediate activation (skipWaiting + claim)
// ---------------------------------------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ---------------------------------------------------------------
// 2. Push → show notification + try to play sound in open tab
// ---------------------------------------------------------------
self.addEventListener('push', (event) => {
  const payload = event.data?.json() || {};

  const title = payload.title || 'New Message';
  const body   = payload.body  || 'You have a new notification';
  const url    = payload.url   || '/';
  const tag    = payload.tag   || `push-${Date.now()}`;
  const silent    = payload.silent || false;
  const requireInteraction    = payload.requireInteraction || false;

  const notificationOptions = {
    body,
    icon: payload.icon || '/imgs/zuz-logo.png',
    badge: '/imgs/zuz-logo.png',
    tag,
    data: { url },
    requireInteraction,
    silent,
    sound: '/sounds/notification.mp3', // same-origin MP3
  };

  event.waitUntil(
    (async () => {
      // 1. Show notification (always)
      await self.registration.showNotification(title, notificationOptions);

      // 2. Look for open windows
      const windows = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      if (windows.length > 0) {
        // tell every open tab to play the sound
        windows.forEach((client) => {
          client.postMessage({
            type: 'PUSH_NOTIFICATION',
            soundUrl: '/sounds/notification.mp3',
          });
        });
      }
    })()
  );
});

// ---------------------------------------------------------------
// 3. Notification click → focus or open the URL
// ---------------------------------------------------------------
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // focus existing tab
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        // otherwise open a new one
        return self.clients.openWindow?.(url);
      })
  );
});