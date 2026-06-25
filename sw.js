const CACHE_NAME = 'mi-cache-v1';

const ARCHIVOS = [
    './',
    './index.html',
    './css/style.css',
    './js/app.js',
    './js/storage.js',
    './js/api.js',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(ARCHIVOS);
        })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached;
            return fetch(event.request).catch(() => {
                if (event.request.destination === 'document') {
                    return caches.match('./offline.html');
                }
            });
        })
    );
});