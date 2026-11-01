'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const workerSource = fs.readFileSync('sw.js', 'utf8');
const scope = 'https://example.test/Bitlife-/';

function makeHarness(fetchImpl = async () => { throw new Error('offline'); }) {
  const listeners = new Map();
  const cacheStore = new Map([
    ['hayah-shell-v60', new Map()],
    ['hayah-shell-v61', new Map()],
    ['hayah-shell-v62', new Map()],
    ['hayah-shell-v63', new Map()],
    ['hayah-shell-v64', new Map()],
    ['hayah-shell-v65', new Map()],
    ['hayah-shell-v66', new Map()],
    ['hayah-shell-v67', new Map()],
    ['hayah-shell-v68', new Map()],
    ['hayah-shell-v69', new Map()],
    ['hayah-shell-v70', new Map()],
    ['hayah-shell-v71', new Map()],
    ['hayah-shell-v72', new Map()],
    ['hayah-shell-v75', new Map()],
    ['hayah-shell-v77', new Map()],
    ['hayah-shell-v78', new Map()],
    ['hayah-shell-v79', new Map()],
    ['hayah-shell-v80', new Map()],
    ['hayah-shell-v81', new Map()],
    ['hayah-shell-v82', new Map()],
    ['hayah-shell-v83', new Map()],
    ['hayah-shell-v84', new Map()],
    ['hayah-shell-v85', new Map()],
    ['hayah-shell-v86', new Map()],
    ['hayah-shell-v87', new Map()],
    ['hayah-shell-v88', new Map()],
    ['hayah-shell-v89', new Map()],
    ['hayah-shell-v90', new Map()],
    ['hayah-shell-v91', new Map()],
    ['hayah-shell-v92', new Map()],
    ['hayah-shell-v93', new Map()],
    ['hayah-shell-v94', new Map()],
    ['hayah-shell-v95', new Map()],
    ['unrelated-cache', new Map()]
  ]);
  const cacheCalls = { added: [], deleted: [], skipped: 0, claimed: 0 };

  const keyOf = key => typeof key === 'string' ? key : key.url;
  const makeCache = name => ({
    async addAll(urls) {
      cacheCalls.added = [...urls];
      for (const url of urls) cacheStore.get(name).set(url, new Response('cached:' + url));
    },
    async put(key, response) {
      cacheStore.get(name).set(keyOf(key), response.clone());
    },
    async match(key) {
      const response = cacheStore.get(name).get(keyOf(key));
      return response ? response.clone() : undefined;
    }
  });

  const caches = {
    async open(name) {
      if (!cacheStore.has(name)) cacheStore.set(name, new Map());
      return makeCache(name);
    },
    async keys() {
      return [...cacheStore.keys()];
    },
    async delete(name) {
      cacheCalls.deleted.push(name);
      return cacheStore.delete(name);
    },
    async match(key) {
      const lookup = keyOf(key);
      for (const entries of cacheStore.values()) {
        const response = entries.get(lookup);
        if (response) return response.clone();
      }
      return undefined;
    }
  };

  const self = {
    registration: { scope },
    location: { origin: new URL(scope).origin },
    clients: { async claim() { cacheCalls.claimed += 1; } },
    async skipWaiting() { cacheCalls.skipped += 1; },
    addEventListener(type, callback) { listeners.set(type, callback); }
  };

  vm.runInNewContext(workerSource, {
    self,
    caches,
    fetch: fetchImpl,
    URL,
    Response
  }, { filename: 'sw.js' });

  const dispatchLifecycle = async type => {
    let pending;
    listeners.get(type)({ waitUntil(promise) { pending = promise; } });
    assert.ok(pending, type + ' should register waitUntil');
    await pending;
  };

  return { listeners, cacheStore, cacheCalls, dispatchLifecycle };
}

test('service worker installs a fresh shell cache and removes only obsolete Hayah caches', async () => {
  assert.match(workerSource, /const CACHE_NAME = 'hayah-shell-v95'/);
  const harness = makeHarness();
  await harness.dispatchLifecycle('install');

  assert.equal(harness.cacheCalls.skipped, 1);
  assert.deepEqual(harness.cacheCalls.added, [
    scope + 'index.html',
    scope + 'style.css',
    scope + 'app.js',
    scope + 'manifest.webmanifest',
    scope + 'icon.svg'
  ]);

  await harness.dispatchLifecycle('activate');
  assert.deepEqual(harness.cacheCalls.deleted, ['hayah-shell-v60', 'hayah-shell-v61', 'hayah-shell-v62', 'hayah-shell-v63', 'hayah-shell-v64', 'hayah-shell-v65', 'hayah-shell-v66', 'hayah-shell-v67', 'hayah-shell-v68', 'hayah-shell-v69', 'hayah-shell-v70', 'hayah-shell-v71', 'hayah-shell-v72', 'hayah-shell-v75', 'hayah-shell-v77', 'hayah-shell-v78', 'hayah-shell-v79', 'hayah-shell-v80', 'hayah-shell-v81', 'hayah-shell-v82', 'hayah-shell-v83', 'hayah-shell-v84', 'hayah-shell-v85', 'hayah-shell-v86', 'hayah-shell-v87', 'hayah-shell-v88', 'hayah-shell-v89', 'hayah-shell-v90', 'hayah-shell-v91', 'hayah-shell-v92', 'hayah-shell-v93', 'hayah-shell-v94']);
  assert.equal(harness.cacheCalls.claimed, 1);
  assert.ok(harness.cacheStore.has('hayah-shell-v95'));
  assert.equal(harness.cacheStore.has('hayah-shell-v89'), false);
  assert.equal(harness.cacheStore.has('hayah-shell-v90'), false);
  assert.equal(harness.cacheStore.has('hayah-shell-v91'), false);
  assert.equal(harness.cacheStore.has('hayah-shell-v92'), false);
  assert.equal(harness.cacheStore.has('hayah-shell-v93'), false);
  assert.equal(harness.cacheStore.has('hayah-shell-v94'), false);
  assert.ok(harness.cacheStore.has('unrelated-cache'));
});

test('offline navigation falls back to the cached Arabic app shell', async () => {
  const harness = makeHarness();
  await harness.dispatchLifecycle('install');

  let responsePromise;
  harness.listeners.get('fetch')({
    request: { method: 'GET', url: scope + 'a-life-route', mode: 'navigate' },
    respondWith(promise) { responsePromise = promise; }
  });

  assert.ok(responsePromise);
  const response = await responsePromise;
  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'cached:' + scope + 'index.html');
});

test('offline cached assets remain available; uncached assets return a clear 503 response', async () => {
  const harness = makeHarness();
  await harness.dispatchLifecycle('install');

  let cachedPromise;
  harness.listeners.get('fetch')({
    request: { method: 'GET', url: scope + 'style.css', mode: 'same-origin' },
    respondWith(promise) { cachedPromise = promise; }
  });
  const cached = await cachedPromise;
  assert.equal(cached.status, 200);
  assert.equal(await cached.text(), 'cached:' + scope + 'style.css');

  let missingPromise;
  harness.listeners.get('fetch')({
    request: { method: 'GET', url: scope + 'missing.json', mode: 'same-origin' },
    respondWith(promise) { missingPromise = promise; }
  });
  const missing = await missingPromise;
  assert.equal(missing.status, 503);
  assert.match(await missing.text(), /غير متصل بالإنترنت/);
});

test('non-GET requests and requests outside the app scope are left untouched', () => {
  const harness = makeHarness();
  for (const request of [
    { method: 'POST', url: scope + 'save', mode: 'same-origin' },
    { method: 'GET', url: 'https://other.test/resource', mode: 'cors' },
    { method: 'GET', url: 'https://example.test/another-app/file', mode: 'same-origin' }
  ]) {
    let intercepted = false;
    harness.listeners.get('fetch')({
      request,
      respondWith() { intercepted = true; }
    });
    assert.equal(intercepted, false);
  }
});
