'use strict';

const CACHE_NAME = 'hayah-shell-v200';
const APP_SHELL = [
  './index.html',
  './style.css',
  './accessibility.css',
  './diary-search.css',
  './business-insights.css',
  './life-review.css',
  './pwa-update.css',
  './app.js',
  './life-review.js',
  './combat-season.js',
  './pwa-update.js',
  './diary-search.js',
  './business-insights.js',
  './manifest.webmanifest',
  './icon.svg',
  './backup-check.html',
  './backup-check.js'
].map(path => new URL(path, self.registration.scope).href);

// Keep the essential game usable if a non-critical shell asset is temporarily unavailable.
const CORE_SHELL = ['./index.html', './style.css', './app.js']
  .map(path => new URL(path, self.registration.scope).href);
const OPTIONAL_SHELL = APP_SHELL.filter(url => !CORE_SHELL.includes(url));

// Prefer the newest known Hayah shell when carrying optional assets forward.
const shellCacheVersion = name => {
  const match = /^hayah-shell-v(\d+)$/.exec(name);
  return match ? Number(match[1]) : -1;
};

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async cache => {
        try {
          await cache.addAll(APP_SHELL);
        } catch {
          // Retry with the minimum files required to render and run the game.
          await cache.addAll(CORE_SHELL);

          // Preserve optional files already available in an older Hayah shell
          // before activate() removes that cache. Never copy unrelated caches.
          let previousShellNames = [];
          try {
            previousShellNames = (await caches.keys())
              .filter(name => name.startsWith('hayah-shell-') && name !== CACHE_NAME)
              .sort((a, b) => shellCacheVersion(b) - shellCacheVersion(a));
          } catch {
            // Carry-forward is best-effort; the essential game shell is already safe.
          }

          await Promise.all(OPTIONAL_SHELL.map(async url => {
            try {
              if (await cache.match(url)) return;
            } catch {
              // Continue to older shells if the new cache cannot be inspected.
            }

            for (const name of previousShellNames) {
              try {
                const previousCache = await caches.open(name);
                const previousResponse = await previousCache.match(url);
                if (!previousResponse) continue;
                await cache.put(url, previousResponse.clone());
                break;
              } catch {
                // Optional assets must never block installation of the game.
              }
            }
          }));
        }
      })
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

  const cachedNavigationPage = request.mode === 'navigate'
    ? APP_SHELL.find(url => new URL(url).pathname === requestUrl.pathname) || APP_SHELL[0]
    : null;
  const cacheKey = request.mode === 'navigate' ? cachedNavigationPage : request;
  const matchCached = async () => {
    try {
      const cache = await caches.open(CACHE_NAME);
      return await cache.match(cacheKey);
    } catch {
      // Cache lookup is best-effort too; storage failures must not reject fetch handling.
      return undefined;
    }
  };
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
      // Cache Storage is best-effort: quota or storage failures must not
      // discard a successful network response.
      return caches.open(CACHE_NAME)
        .then(cache => cache.put(cacheKey, response.clone()))
        .then(() => response)
        .catch(() => response);
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
