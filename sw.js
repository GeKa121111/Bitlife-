'use strict';

const CACHE_NAME = 'hayah-shell-v95';
const APP_SHELL = [
  './index.html',
  './style.css',
  './app.js',
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

  event.respondWith(
    fetch(request).then(response => {
      if (!response || !response.ok) return response;
      const cacheKey = request.mode === 'navigate' ? APP_SHELL[0] : request;
      return caches.open(CACHE_NAME)
        .then(cache => cache.put(cacheKey, response.clone()).then(() => response));
    }).catch(async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      if (request.mode === 'navigate') return caches.match(APP_SHELL[0]);
      return new Response('أنت غير متصل بالإنترنت.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    })
  );
});
