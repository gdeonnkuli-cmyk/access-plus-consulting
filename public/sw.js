/* Service worker Éco-Campus RDC
   - pages : réseau d'abord (les mises à jour du site sont immédiates), copie locale si hors ligne ;
   - fichiers statiques de l'application (/static, /icons) : copie locale, rafraîchie en arrière-plan ;
   - Firebase, Google et tout autre domaine : jamais mis en cache (données toujours à jour) ;
   - notifications push (Firebase Cloud Messaging, envoyées par /api/push) : affichage et ouverture. */
const VERSION = "ecocampus-v6";
const SHELL = ["/", "/index.html", "/manifest.json", "/icons/ec-192-v2.png", "/icons/ec-512-v2.png", "/favicon.png"];

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


// ── Notifications push ─────────────────────────────────────────────────────────
// Message FCM « data » : { titre, texte, lien, id }. Rien n'est affiché si l'application est déjà à
// l'écran : la cloche se met à jour en temps réel.
self.addEventListener("push", event => {
  let p = {};
  try { p = event.data ? event.data.json() : {}; } catch (e) { p = { data: { titre: "Éco-Campus RDC", texte: event.data && event.data.text() } }; }
  const d = p.data || {}, n = p.notification || {};
  const titre = d.titre || n.title || "Éco-Campus RDC";
  const options = { body: d.texte || n.body || "", icon: "/icons/ec-192-v2.png", badge: "/icons/ec-192-v2.png", tag: d.id || undefined, data: { lien: d.lien || (p.fcmOptions && p.fcmOptions.link) || "/" } };
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
      if (list.some(c => c.visibilityState === "visible")) return;
      return self.registration.showNotification(titre, options);
    })
  );
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const lien = (event.notification.data && event.notification.data.lien) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
      const ouverte = list.find(c => new URL(c.url).origin === self.location.origin);
      if (ouverte) return ouverte.navigate(lien).then(c => (c || ouverte).focus()).catch(() => ouverte.focus());
      return self.clients.openWindow(lien);
    })
  );
});
