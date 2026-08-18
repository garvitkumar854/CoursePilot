# Production pre-flight QA

## Terminal gate

```bash
npm ci
npm run lint
npm run typecheck
npm run test
npx playwright install chromium webkit
npm run test:e2e
npm run build
npm audit --omit=dev
```

Run PWA checks against a production build. The service worker is intentionally disabled in development.

```bash
npm run build
npm start
```

## Strict manual matrix

Repeat each critical flow at 100% browser zoom with CPU throttling disabled, then once with 4× CPU slowdown and Fast 3G.

| Surface | iPhone 14 Safari | Pixel 7 Chrome | 360×640 Chrome | 768×1024 Safari | 1440×900 Chrome | Pass criteria |
|---|---:|---:|---:|---:|---:|---|
| Initial light load | ✓ | ✓ | ✓ | ✓ | ✓ | Correct logo before first paint; no font or content jump |
| Initial dark load | ✓ | ✓ | ✓ | ✓ | ✓ | Dark logo and colors appear atomically; no light flash |
| Theme toggle ×20 | ✓ | ✓ | ✓ | ✓ | ✓ | No trailing transitions; p95 handler/style cost under 8 ms |
| Admin dialog | ✓ | ✓ | ✓ | ✓ | ✓ | Horizontally and vertically centered; no clipping or horizontal overflow |
| Keyboard open | ✓ | ✓ | ✓ | — | — | Focused field remains visible; dialog scrolls internally only when physically necessary |
| Remember Me | ✓ | ✓ | — | — | ✓ | Cookie is HttpOnly, Secure in production, SameSite=Lax, Max-Age=2592000 |
| Subject delete cancel | ✓ | ✓ | ✓ | ✓ | ✓ | Dialog unmounts, focus is released, subject remains, page geometry does not move |
| Subject delete confirm | ✓ | ✓ | — | — | ✓ | One DELETE request; success updates UI and MongoDB once; failure preserves card and shows error |
| Calendar month navigation | ✓ | ✓ | ✓ | ✓ | ✓ | Always 6 rows/42 cells; 44 px-class touch targets; selected date persists |
| Assignment create | ✓ | ✓ | — | — | ✓ | Number is read-only and equals MongoDB maximum + 1; new record and displayed count agree |
| Upload drag/drop | — | ✓ | — | — | ✓ | Drag styling activates, dropped file parses once, keyboard file picker still works |
| Offline repeat visit | ✓ | ✓ | — | ✓ | ✓ | Previously visited shell/chunks/images load; offline shell handles unknown routes |
| Offline mutation | ✓ | ✓ | — | — | ✓ | Mutation fails visibly and is never replayed from a response cache |
| Reduced motion | ✓ | ✓ | — | ✓ | ✓ | Animations collapse under `prefers-reduced-motion`; functionality remains intact |

For CLS, record a Performance trace for initial load, theme toggling, dialog opening, calendar changes, and assignment creation. The Layout Shifts track must show no unexpected shifts and the Lighthouse CLS score must remain `0.000` for the tested flow.

## Chrome PWA and Workbox audit

1. Deploy a Vercel Preview or run the production build locally. Open a fresh Incognito window.
2. DevTools → **Application → Service Workers**: enable *Update on reload* for the first audit only, reload, and verify `/sw.js` is **activated and running** with scope `/`.
3. Disable *Update on reload*. Application → **Storage → Clear site data**, reload once online, and wait for the worker to activate.
4. Application → **Cache Storage**: verify Workbox precache plus `next-static-chunks`, `static-assets`, font, image, and document caches appear after exercising the app.
5. Network → filter `/_next/static/`. Reload twice. Repeat requests must show `(ServiceWorker)`, memory cache, or disk cache and transfer close to zero bytes.
6. Visit `/`, one subject page, open the calendar, and load both theme logos. Switch DevTools Network to **Offline**, then revisit those pages. Cached pages must render; an unknown uncached navigation must show `/offline.html`.
7. Return online. In Network, enable **Preserve log**, delete a disposable QA subject, and inspect the request:
   - method is `DELETE`;
   - URL begins `/api/subjects/`;
   - response came from the network, not `(ServiceWorker)` or a disk response cache;
   - response has no cacheable public `Cache-Control` directive.
8. Verify no API request has entered Cache Storage:

```js
(async () => {
  const hits = [];
  for (const cacheName of await caches.keys()) {
    const cache = await caches.open(cacheName);
    for (const request of await cache.keys()) {
      if (new URL(request.url).pathname.startsWith("/api/")) {
        hits.push({ cacheName, method: request.method, url: request.url });
      }
    }
  }
  console.table(hits);
  if (hits.length) throw new Error("FAIL: API request found in Workbox cache");
  console.info("PASS: no API requests are cached");
})();
```

9. Go offline and attempt another disposable mutation. It must fail without removing the card. Restore connectivity, reload, and verify MongoDB state remained unchanged.
10. Application → Service Workers → **Offline**, hard-reload a previously visited route, and run Lighthouse PWA/Performance. Then repeat with the worker unregistered to ensure the offline result genuinely depends on Workbox.

## Safari PWA audit

1. Safari Develop menu → **Service Workers** and **Web Inspector → Storage**.
2. Confirm `/sw.js` controls the production origin and inspect Cache Storage entries.
3. Disable the network, reopen a visited route, then open an unvisited route and verify the local offline shell.
4. Re-enable the network and confirm admin mutations appear as real Fetch/XHR requests and never as cached responses.
5. Install to the Home Screen on iOS and repeat theme, calendar, login keyboard, and offline checks in standalone display mode.

## Theme-toggle execution benchmark

Paste this into DevTools Console on a production page. It measures the real click handler plus forced style resolution over 40 frame-separated toggles and restores the original theme.

```js
(async () => {
  const button = document.querySelector('button[aria-label="Toggle light and dark theme"]');
  if (!button) throw new Error("Theme toggle button not found");

  const root = document.documentElement;
  const original = root.dataset.theme;
  const samples = [];

  for (let index = 0; index < 40; index += 1) {
    await new Promise(requestAnimationFrame);
    const start = performance.now();
    button.click();
    getComputedStyle(document.body).backgroundColor;
    samples.push(performance.now() - start);
  }

  if (root.dataset.theme !== original) button.click();
  const sorted = [...samples].sort((a, b) => a - b);
  const p95 = sorted[Math.ceil(sorted.length * 0.95) - 1];
  const result = {
    minMs: Math.min(...samples).toFixed(3),
    medianMs: sorted[Math.floor(sorted.length / 2)].toFixed(3),
    p95Ms: p95.toFixed(3),
    maxMs: Math.max(...samples).toFixed(3),
    pass: p95 < 8,
  };

  console.table(result);
  if (!result.pass) throw new Error(`Theme toggle p95 ${result.p95Ms} ms exceeds 8 ms`);
})();
```

Run the benchmark once normally and once under 4× CPU slowdown. The strict release gate is p95 under 8 ms without throttling; the throttled run is diagnostic.
