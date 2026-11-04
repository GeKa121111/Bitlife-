'use strict';

const CACHE_NAME = 'hayah-shell-v142';
const APP_SHELL = [
  './index.html',
  './style.css',
  './accessibility.css',
  './pwa-update.css',
  './app.js',
  './pwa-update.js',
  './manifest.webmanifest',
  './icon.svg'
].map(path => new URL(path, self.registration.scope).href);

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys
        .filter(key => key.startsWith('hayah-shell-') && key !== CACHE_NAME)
        .map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const requestUrl = new URL(request.url);
  const scopeUrl = new URL(self.registration.scope);
  if (requestUrl.origin !== self.location.origin || !requestUrl.pathname.startsWith(scopeUrl.pathname)) return;

  const cacheKey = request.mode === 'navigate' ? APP_SHELL[0] : request;
  const matchCached = () => caches.open(CACHE_NAME).then(cache => cache.match(cacheKey));
  event.respondWith(
    fetch(request).then(async response => {
      // A transient HTTP error should not replace a working cached screen or asset.
      // Keep genuine uncached 404s visible instead of masking missing files.
      if (!response) {
        const cached = await matchCached();
        return cached || new Response('أنت غير متصل بالإنترنت.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      }
      if (response.status === 429 || response.status >= 500) {
        const cached = await matchCached();
        return cached || response;
      }
      if (!response.ok) return response;
      return caches.open(CACHE_NAME)
        .then(cache => cache.put(cacheKey, response.clone()).then(() => response));
    }).catch(async () => {
      const cached = await matchCached();
      if (cached) return cached;
      return new Response('أنت غير متصل بالإنترنت.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    })
  );
});
