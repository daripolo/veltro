/* eslint-disable no-restricted-globals */
/**
 * Veltro service worker.
 *
 * Caching policy is deliberately conservative because this is a banking app:
 * balances, transactions and auth state must NEVER be served from a cache, and
 * nothing sensitive is written to disk. What we do cache is only immutable,
 * content-hashed build output and the offline fallback page.
 *
 * Strategy summary
 *   navigations        network only -> offline.html when the network fails
 *   /_next/static/*     cache-first, refreshed in the background (hashed = immutable)
 *   /icons, /image/*    cache-first, refreshed in the background
 *   /_next/image/*      skipped: optimised images can embed user avatars
 *   everything else     straight to the network, never stored
 */

/** Bump this to invalidate every cached asset on the next activation. */
const VERSION = "v1";
const STATIC_CACHE = `veltro-static-${VERSION}`;
const RUNTIME_CACHE = `veltro-runtime-${VERSION}`;
const OFFLINE_URL = "/offline.html";

/** Precache on install so the offline page works on the very first visit. */
const PRECACHE = [OFFLINE_URL, "/icons/icon-192.png", "/icons/icon-512.png"];

/** Hosts we never touch — realtime data and third-party APIs stay live. */
const BYPASS_HOSTS = [".convex.cloud", ".convex.site"];

// ---------------------------------------------------------------------------
// install / activate
// ---------------------------------------------------------------------------

// No skipWaiting() here on purpose: a newly deployed worker waits until the
// app is opened fresh rather than swapping assets out from under a user who
// may be halfway through a transfer.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      // addAll is atomic: one 404 and the whole install aborts, so add
      // individually and let a single missing icon never block activation.
      .then((cache) => Promise.allSettled(PRECACHE.map((url) => cache.add(url))))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

/**
 * Lets the page opt into activating a waiting worker, e.g. when the user
 * confirms they are ready for an update. Unused by default — see the note on
 * install() above.
 */
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

// ---------------------------------------------------------------------------
// routing helpers
// ---------------------------------------------------------------------------

function isBypassed(url) {
  return BYPASS_HOSTS.some((host) => url.hostname.endsWith(host));
}

/**
 * Decide whether a request may be persisted. Anything that isn't a plain GET
 * for a known-public asset is excluded outright.
 */
function isCacheable(request, url) {
  if (request.method !== "GET") return false;
  if (isBypassed(url)) return false;

  const { pathname } = url;

  // API routes, auth, and anything else that can carry personal data.
  if (pathname.startsWith("/api/")) return false;
  if (pathname.startsWith("/_next/image")) return false;

  // Hashed build output: immutable, safe to keep forever.
  if (pathname.startsWith("/_next/static/")) return true;

  // Branding and static assets served straight from /public.
  if (pathname.startsWith("/icons/") || pathname.startsWith("/image/")) return true;

  if (pathname === OFFLINE_URL) return true;

  return false;
}

// ---------------------------------------------------------------------------
// fetch
// ---------------------------------------------------------------------------

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Convex realtime is a WebSocket and never reaches fetch, but skip any
  // cross-origin request outright so the SW stays out of third-party traffic.
  if (new URL(request.url).origin !== self.location.origin) return;

  // Page navigations: always try the network first. Serving a cached HTML
  // document could show a stale balance, so on failure we show offline.html
  // instead of a stale page.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(STATIC_CACHE);
        return (
          (await cache.match(OFFLINE_URL)) ??
          (await caches.match(OFFLINE_URL)) ??
          new Response("You are offline.", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          })
        );
      })
    );
    return;
  }

  if (!isCacheable(request, new URL(request.url))) return;

  // Cache-first with a background refresh: hashed assets are already
  // content-addressed, so the cached copy stays correct until VERSION bumps.
  event.respondWith(
    (async () => {
      const cache = await caches.open(RUNTIME_CACHE);
      const cached = await cache.match(request);

      if (cached) {
        // Refresh in the background so the next load is current. Failures are
        // ignored — the cached copy is still good.
        event.waitUntil(
          fetch(request)
            .then((response) => {
              if (response && response.ok && response.type === "basic") {
                return cache.put(request, response.clone());
              }
            })
            .catch(() => {})
        );
        return cached;
      }

      // Nothing cached: go to the network and store it if it is usable.
      const response = await fetch(request);
      if (response.ok && response.type === "basic") {
        await cache.put(request, response.clone());
      }
      return response;
    })()
  );
});