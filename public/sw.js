const CACHE = "storykeeper-v18";
const PRECACHE = ["/manifest.json"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  // Vite content-hashes every JS/CSS filename (e.g. index-CH0aT_XL.js) — a code
  // change always produces a new filename, so a cached hashed asset can never
  // go stale. Serving these cache-first makes repeat PWA launches near-instant
  // instead of re-downloading the full bundle over the network every time
  // (the previous "never cache JS/CSS" rule avoided stale bundles the costly
  // way, at the price of slow loads on every single launch, especially on
  // mobile networks). The HTML entry point itself is NOT hashed — it always
  // needs network-first so it can point at whichever hash is current.
  if (url.pathname.endsWith(".js") || url.pathname.endsWith(".css")) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        });
      })
    );
    return;
  }
  // The background video (~1MB) and ambient sound files (~1MB each) aren't
  // hash-named, so they can change without their URL changing — but they also
  // almost never change, and re-downloading ~3MB of media on every single PWA
  // launch (network-first means cache is only a fallback, not the first stop)
  // was a big part of why repeat launches felt slow. Stale-while-revalidate:
  // serve instantly from cache when present, and refresh the cache quietly in
  // the background for next time — fast now, eventually fresh.
  if (url.pathname === "/reading-nook.mp4" || url.pathname.startsWith("/sounds/")) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        const network = fetch(e.request).then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        }).catch(() => cached);
        return cached || network;
      })
    );
    return;
  }
  // Network-first for everything else (HTML, images, manifest)
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
