/* Service worker Éco-Campus RDC
   - pages : réseau d'abord (les mises à jour du site sont immédiates), copie locale si hors ligne ;
   - fichiers statiques de l'application (/static, /icons) : copie locale, rafraîchie en arrière-plan ;
   - Firebase, Google et tout autre domaine : jamais mis en cache (données toujours à jour). */
const VERSION = "ecocampus-v2";
const SHELL = ["/", "/index.html", "/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png", "/favicon.png"];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put("/index.html", copy)); return res; })
        .catch(() => caches.match("/index.html"))
    );
    return;
  }

  if (url.pathname.startsWith("/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(req).then(hit => {
        const net = fetch(req).then(res => { if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); } return res; }).catch(() => hit);
        return hit || net;
      })
    );
  }
});
