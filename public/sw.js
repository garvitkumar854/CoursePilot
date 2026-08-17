const CACHE_VERSION = "coursepilot-v1";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const PAGE_CACHE = `${CACHE_VERSION}-pages`;
const OFFLINE_URL = "/offline.html";
const PRECACHE = [
    OFFLINE_URL,
    "/branding/light_logo.svg",
    "/branding/dark_logo.svg",
    "/branding/icon-192.png",
    "/branding/icon-512.png",
];

self.addEventListener("install", (event) => {
    event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE)));
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) => Promise.all(keys.filter((key) => !key.startsWith(CACHE_VERSION)).map((key) => caches.delete(key))))
            .then(() => self.clients.claim()),
    );
});

self.addEventListener("fetch", (event) => {
    const request = event.request;

    if (request.method !== "GET") return;

    const url = new URL(request.url);

    if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response.ok) {
                        const copy = response.clone();
                        caches.open(PAGE_CACHE).then((cache) => cache.put(request, copy));
                    }
                    return response;
                })
                .catch(async () => (await caches.match(request)) || caches.match(OFFLINE_URL)),
        );
        return;
    }

    if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/branding/")) {
        event.respondWith(
            caches.match(request).then((cached) => {
                const network = fetch(request)
                    .then((response) => {
                        if (response.ok) {
                            const copy = response.clone();
                            caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
                        }
                        return response;
                    })
                    .catch(() => cached);

                return cached || network;
            }),
        );
    }
});
