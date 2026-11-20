/* Deadlinely service worker – network first, falls back to cache when offline. */
const CACHE = "deadlinely-v1";
const ASSETS = [
  "index.html", "manifest.json", "assets/icons/icon.svg",
  "css/style.css", "css/auth.css", "css/dashboard.css", "css/responsive.css",
  "js/supabase.js", "js/auth.js", "js/priority.js", "js/assignments.js", "js/exams.js",
  "js/calendar.js", "js/progress.js", "js/notifications.js", "js/app.js",
  "pages/login.html", "pages/register.html", "pages/dashboard.html", "pages/assignments.html",
  "pages/priority.html", "pages/calendar.html", "pages/exams.html", "pages/progress.html", "pages/profile.html",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match("index.html")))
  );
});
