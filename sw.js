const CACHE_NAME = 'divisor-gastos-v1';

const listaDeArchivos = [
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

self.addEventListener('install', e => {
    const cache = caches.open(CACHE_NAME).then(cache => {
        return cache.addAll(listaDeArchivos)
    })
    e.waitUntil(cache)
})


self.addEventListener('activate', e => {
    const limpiar = caches.keys().then(keys => {
        return Promise.all(
            keys.map(key => {
                if (key !== CACHE_NAME) {
                    return cache.delete(key)
                }
            })
        )
    })
})


self.addEventListener('fetch', e => {
    const respuesta = caches.match(e.request).then(resCache => {
        if (resCache) {
            return resCache
        } else {
            return fetch(e.request)
        }
    })
    e.respondWith(respuesta)
})