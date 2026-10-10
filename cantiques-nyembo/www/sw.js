// Cache hors-ligne : l'application et les 450 cantiques restent consultables sans connexion.
// Incrémenter VERSION à chaque mise à jour du recueil ou du code.
const VERSION = "nyembo-v12";
const SHELL = [
  "./", "index.html", "styles.css", "app.js", "store.js", "firebase-config.js",
  "data/cantiques.json", "version.json", "manifest.webmanifest",
  "icons/logo-mark.png", "icons/logo-full.png", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return; // Firebase & audio : réseau direct
  // Réseau d'abord (mises à jour), cache en secours (hors-ligne)
  e.respondWith(
    fetch(e.request).then((r) => {
      if (r.ok) { const copy = r.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); }
      return r;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match("index.html")))
  );
});
