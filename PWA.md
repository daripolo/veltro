# PWA

Veltro is an installable, offline-capable web app. This doc covers how it
works and what to do when you change it.

## What was added

| File | Purpose |
| --- | --- |
| `src/app/manifest.ts` | Web app manifest (name, icons, colours, shortcuts) |
| `public/sw.js` | Hand-rolled service worker |
| `public/offline.html` | Offline fallback page |
| `src/app/icon.png`, `src/app/apple-icon.png` | Favicon and iOS home screen icon |
| `public/icons/*` | 192/512 icons, plus maskable variants for Android |
| `src/components/pwa/PwaRegister.tsx` | Registers the service worker |
| `src/components/pwa/InstallPrompt.tsx` | "Add to home screen" banner |
| `src/types/pwa.d.ts` | `BeforeInstallPromptEvent` (not in lib.dom yet) |
| `scripts/generate-pwa-icons.mjs` | Regenerates every icon from the placeholder brand mark |
| `next.config.ts` | `Cache-Control` headers for `sw.js` and the manifest |

## Caching policy

The whole point of this app is that it moves money, so the cache is
deliberately boring. **No account data is ever written to disk.**

| Request | Strategy |
| --- | --- |
| Page navigations | Network only. On failure, `offline.html` |
| `/_next/static/*` | Cache first, refreshed in the background (content-hashed, so immutable) |
| `/icons/*`, `/image/*` | Cache first, refreshed in the background |
| `/_next/image/*` | Never cached — optimised images can be user avatars |
| `/api/*`, everything else | Straight to the network, never stored |
| Any non-`GET` request | Straight to the network, never stored |

Navigations are never served from cache on purpose. A cached HTML document
would show a stale balance, which is worse than an honest "you're offline"
page.

## Testing locally

Service workers are **disabled in `next dev`**, because a cached worker will
serve stale bundles while you are editing.

```bash
npm run build
npm start          # then open http://localhost:3000
```

To debug in a dev build instead, set `NEXT_PUBLIC_PWA_ENABLED=true`.

Useful checks in DevTools → Application:

- **Manifest** — should list four icons and `display: standalone`
- **Service Workers** — `/sw.js` registered and `activated`
- **Cache Storage** — `veltro-static-v1` and `veltro-runtime-v1`
- **Offline** — tick "Offline" in the Network panel and reload; you should
  land on the offline page, never on a stale dashboard

Service workers need a secure context. `localhost` counts; anything else needs
HTTPS, so test on your phone over your LAN tunnel rather than plain HTTP.

## Updating the app

Deploys roll out lazily: the new worker downloads but waits, and takes over the
next time the app is opened fresh. Nobody is reloaded mid-transfer. To ship a
service worker change you **must** bump `VERSION` at the top of `public/sw.js`,
otherwise returning users keep the old cache.

## Changing the icons

Icons are generated from an inline SVG of the placeholder asterisk mark on a
signal-orange tile. Once a real Veltro logo exists, update `iconSvg()` in the
script to draw it, then run:

```bash
npm run generate:icons
```

Maskable icons use a smaller mark so the asterisk survives Android's circular
and squircle masks, which can crop up to 10% off each edge.

## Deploying

Any static host works — there is no build plugin to configure. The one thing
that must survive your CDN or proxy config is:

```
Cache-Control: no-cache, no-store, must-revalidate   /sw.js
```

If `/sw.js` is cached at the edge, a new deploy can never reach users who
already have the app installed. `next.config.ts` sets this for you; verify it
still applies after adding CDN rules.

## Adding offline support later

Currently, offline means "we show you a clear message". If you want real
offline balances, do it with an explicit, opt-in store rather than widening the
service worker — query results in IndexedDB would go stale silently, and a
banking app should never show a balance it is not sure about.