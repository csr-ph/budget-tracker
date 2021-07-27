// name files to cache and define cache names
const CACHE_NAME = 'site-cache-v1';
const FILES_TO_CACHE = [
    '/',
    './index.html',
    './public/css/styles.css',
    './manifest.json',
    './index.js',
    './idb.js'
];
const DATA_CACHE_NAME = 'data-cache-v1'

// install the service worker (first step)
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(function(cache) {
            console.log('Opened cache');
            return cache.addAll(FILES_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// activate the servive worker (step two)
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(
                keyList.map(key => {
                    if (key !== CACHE_NAME) {
                        console.log('deleted', key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// the service worker will use static files and listen for requests (step three)
self.addEventListener('fetch', (event) => {
    if (event.request.url.includes('/api/')) {
        console.log('called ' + event.request.url)
        event.respondWith(
            caches.open(DATA_CACHE_NAME).then(cache => {
                return fetch(event.request)
                .then(response => {
                    if (response.status === 200) {
                        cache.put(event.request.url, response.clone());
                    }
                    return response;
                })
                .catch(err => {
                    return cache.match(event.request);
                });
            })
            .catch(err => {
                console.log(err);
            })
        );
        return;
    }
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request).then((response) => {
                if (response) {
                    return response;
                } else if (event.request.headers.get('accept').includes('text/html')) {
                    return caches.match('/');
                }
            });
        })
    );
});