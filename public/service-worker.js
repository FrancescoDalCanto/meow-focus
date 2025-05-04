// Evento installazione: cache dei file
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installazione in corso...');

    event.waitUntil(
        caches.open('meow-focus-cache').then((cache) => {
            console.log('[Service Worker] Caching file statici');
            return cache.addAll([
                '/',
                '/index.html',
                '/manifest.json',
                '/icons/icon-192x192.png',
                '/icons/icon-512x512.png'
            ]);
        })
    );
});

// Evento fetch: cerca prima nella cache
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse; // Risposta dalla cache
            }
            return fetch(event.request); // Se non è in cache, fetch normale
        })
    );
});