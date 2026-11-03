const CACHE_NAME = "funpictures-v1";

const FICHIERS = [
    "./",
    "./index.html",
    "./manifest.json",
    "./js/main.js",
    "./images/icon-192.png",
    "./images/icon-512.png"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(FICHIERS))
    );

    self.skipWaiting();
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(noms =>
            Promise.all(
                noms
                    .filter(nom => nom !== CACHE_NAME)
                    .map(nom => caches.delete(nom))
            )
        )
    );

    self.clients.claim();
});

self.addEventListener("fetch", event => {
    if (event.request.method !== "GET") return;

    const url = new URL(event.request.url);

    if (url.origin !== self.location.origin) return;

    event.respondWith(
        caches.match(event.request).then(reponse => {
            return reponse || fetch(event.request);
        })
    );
});
