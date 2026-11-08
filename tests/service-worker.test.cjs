'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const workerSource = fs.readFileSync('sw.js', 'utf8');
const scope = 'https://example.test/Bitlife-/';

function makeHarness(fetchImpl = async () => { throw new Error('offline'); }, cachePutImpl = null, cacheOpenImpl = null, cacheMatchImpl = null, cacheAddAllImpl = null) {
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
    ['hayah-shell-v96', new Map()],
    ['hayah-shell-v97', new Map()],
    ['hayah-shell-v98', new Map()],
    ['hayah-shell-v99', new Map()],
    ['hayah-shell-v100', new Map()],
    ['hayah-shell-v101', new Map()],
    ['hayah-shell-v102', new Map()],
    ['hayah-shell-v103', new Map()],
    ['hayah-shell-v104', new Map()],
    ['hayah-shell-v105', new Map()],
    ['hayah-shell-v106', new Map()],
    ['hayah-shell-v107', new Map()],
    ['hayah-shell-v108', new Map()],
    ['hayah-shell-v109', new Map()],
    ['hayah-shell-v110', new Map()],
    ['hayah-shell-v111', new Map()],
    ['hayah-shell-v112', new Map()],
    ['hayah-shell-v113', new Map()],
    ['hayah-shell-v114', new Map()],
    ['hayah-shell-v115', new Map()],
    ['hayah-shell-v116', new Map()],
    ['hayah-shell-v117', new Map()],
    ['hayah-shell-v118', new Map()],
    ['hayah-shell-v119', new Map()],
    ['hayah-shell-v120', new Map()],
    ['hayah-shell-v121', new Map()],
    ['hayah-shell-v122', new Map()],
    ['hayah-shell-v123', new Map()],
    ['hayah-shell-v124', new Map()],
    ['hayah-shell-v125', new Map()],
    ['hayah-shell-v130', new Map()],
    ['hayah-shell-v131', new Map()],
    ['hayah-shell-v132', new Map()],
    ['hayah-shell-v133', new Map()],
    ['hayah-shell-v134', new Map()],
    ['hayah-shell-v135', new Map()],
    ['hayah-shell-v136', new Map()],
    ['hayah-shell-v137', new Map()],
    ['hayah-shell-v138', new Map()],
    ['hayah-shell-v139', new Map()],
    ['hayah-shell-v140', new Map()],
    ['hayah-shell-v141', new Map()],
    ['hayah-shell-v142', new Map()],
    ['hayah-shell-v143', new Map()],
    ['hayah-shell-v144', new Map()],
    ['hayah-shell-v145', new Map()],
    ['hayah-shell-v147', new Map()],
    ['hayah-shell-v148', new Map()],
    ['hayah-shell-v150', new Map()],
    ['hayah-shell-v151', new Map()],
    ['hayah-shell-v152', new Map()],
    ['hayah-shell-v153', new Map()],
    ['hayah-shell-v158', new Map()],
    ['hayah-shell-v159', new Map()],
    ['hayah-shell-v160', new Map()],
    ['hayah-shell-v161', new Map()],
    ['hayah-shell-v162', new Map()],
    ['hayah-shell-v163', new Map()],
    ['hayah-shell-v164', new Map()],
    ['hayah-shell-v166', new Map()],
    ['hayah-shell-v167', new Map()],
    ['hayah-shell-v168', new Map()],
    ['hayah-shell-v170', new Map()],
    ['hayah-shell-v173', new Map()],
    ['hayah-shell-v174', new Map()],
    ['hayah-shell-v175', new Map()],
    ['hayah-shell-v176', new Map()],
    ['hayah-shell-v177', new Map()],
    ['hayah-shell-v178', new Map()],
    ['hayah-shell-v179', new Map()],
    ['hayah-shell-v187', new Map()],
    ['hayah-shell-v194', new Map()],
    ['hayah-shell-v201', new Map()],
    ['hayah-shell-v202', new Map()],
    ['hayah-shell-v214', new Map()],
    ['hayah-shell-v224', new Map()],
    ['hayah-shell-v225', new Map()],
    ['hayah-shell-v227', new Map()],
    ['unrelated-cache', new Map()]
  ]);
  const cacheCalls = { added: [], addAllAttempts: [], deleted: [], skipped: 0, claimed: 0 };

  const keyOf = key => typeof key === 'string' ? key : key.url;
  const makeCache = name => ({
    async addAll(urls) {
      cacheCalls.added = [...urls];
      cacheCalls.addAllAttempts.push([...urls]);
      if (cacheAddAllImpl) await cacheAddAllImpl(name, urls);
      for (const url of urls) cacheStore.get(name).set(url, new Response('cached:' + url));
    },
    async put(key, response) {
      if (cachePutImpl) await cachePutImpl(name, key, response);
      cacheStore.get(name).set(keyOf(key), response.clone());
    },
    async match(key) {
      if (cacheMatchImpl) await cacheMatchImpl(name, key);
      const response = cacheStore.get(name).get(keyOf(key));
      return response ? response.clone() : undefined;
    }
  });

  const caches = {
    async open(name) {
      if (cacheOpenImpl) await cacheOpenImpl(name);
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
  assert.match(workerSource, /const CACHE_NAME = 'hayah-shell-v227'/);
  const harness = makeHarness();
  await harness.dispatchLifecycle('install');

  assert.equal(harness.cacheCalls.skipped, 1);
  assert.deepEqual(harness.cacheCalls.added, [
    scope + 'index.html',
    scope + 'style.css',
    scope + 'accessibility.css',
    scope + 'diary-search.css',
    scope + 'business-insights.css',
    scope + 'life-review.css',
    scope + 'pwa-update.css',
    scope + 'app.js',
    scope + 'life-review.js',
    scope + 'combat-season.js',
    scope + 'pwa-update.js',
    scope + 'diary-search.js',
    scope + 'business-insights.js',
    scope + 'manifest.webmanifest',
    scope + 'icon.svg',
    scope + 'backup-check.html',
    scope + 'backup-check.js'
  ]);

  await harness.dispatchLifecycle('activate');
  assert.deepEqual(harness.cacheCalls.deleted, ['hayah-shell-v60', 'hayah-shell-v61', 'hayah-shell-v62', 'hayah-shell-v63', 'hayah-shell-v64', 'hayah-shell-v65', 'hayah-shell-v66', 'hayah-shell-v67', 'hayah-shell-v68', 'hayah-shell-v69', 'hayah-shell-v70', 'hayah-shell-v71', 'hayah-shell-v72', 'hayah-shell-v75', 'hayah-shell-v77', 'hayah-shell-v78', 'hayah-shell-v79', 'hayah-shell-v80', 'hayah-shell-v81', 'hayah-shell-v82', 'hayah-shell-v83', 'hayah-shell-v84', 'hayah-shell-v85', 'hayah-shell-v86', 'hayah-shell-v87', 'hayah-shell-v88', 'hayah-shell-v89', 'hayah-shell-v90', 'hayah-shell-v91', 'hayah-shell-v92', 'hayah-shell-v93', 'hayah-shell-v94', 'hayah-shell-v95', 'hayah-shell-v96', 'hayah-shell-v97', 'hayah-shell-v98', 'hayah-shell-v99', 'hayah-shell-v100', 'hayah-shell-v101', 'hayah-shell-v102', 'hayah-shell-v103', 'hayah-shell-v104', 'hayah-shell-v105', 'hayah-shell-v106', 'hayah-shell-v107', 'hayah-shell-v108', 'hayah-shell-v109', 'hayah-shell-v110', 'hayah-shell-v111', 'hayah-shell-v112', 'hayah-shell-v113', 'hayah-shell-v114', 'hayah-shell-v115', 'hayah-shell-v116', 'hayah-shell-v117', 'hayah-shell-v118', 'hayah-shell-v119', 'hayah-shell-v120', 'hayah-shell-v121', 'hayah-shell-v122', 'hayah-shell-v123', 'hayah-shell-v124', 'hayah-shell-v125', 'hayah-shell-v130', 'hayah-shell-v131', 'hayah-shell-v132', 'hayah-shell-v133', 'hayah-shell-v134', 'hayah-shell-v135', 'hayah-shell-v136', 'hayah-shell-v137', 'hayah-shell-v138', 'hayah-shell-v139', 'hayah-shell-v140', 'hayah-shell-v141', 'hayah-shell-v142', 'hayah-shell-v143', 'hayah-shell-v144', 'hayah-shell-v145', 'hayah-shell-v147', 'hayah-shell-v148', 'hayah-shell-v150', 'hayah-shell-v151', 'hayah-shell-v152', 'hayah-shell-v153', 'hayah-shell-v158', 'hayah-shell-v159', 'hayah-shell-v160', 'hayah-shell-v161', 'hayah-shell-v162', 'hayah-shell-v163', 'hayah-shell-v164', 'hayah-shell-v166', 'hayah-shell-v167', 'hayah-shell-v168', 'hayah-shell-v170', 'hayah-shell-v173', 'hayah-shell-v174', 'hayah-shell-v175', 'hayah-shell-v176', 'hayah-shell-v177', 'hayah-shell-v178', 'hayah-shell-v179', 'hayah-shell-v187', 'hayah-shell-v194', 'hayah-shell-v201', 'hayah-shell-v202', 'hayah-shell-v214', 'hayah-shell-v224', 'hayah-shell-v225', 'hayah-shell-v226']);
  assert.equal(harness.cacheCalls.claimed, 1);
  assert.equal(harness.cacheStore.has('hayah-shell-v113'), false);
  assert.equal(harness.cacheStore.has('hayah-shell-v114'), false);
  assert.equal(harness.cacheStore.has('hayah-shell-v115'), false);
  assert.equal(harness.cacheStore.has('hayah-shell-v116'), false);
  assert.equal(harness.cacheStore.has('hayah-shell-v117'), false);
  assert.equal(harness.cacheStore.has('hayah-shell-v118'), false);
  assert.equal(harness.cacheStore.has('hayah-shell-v119'), false);
  assert.equal(harness.cacheStore.has('hayah-shell-v120'), false, 'the previous shell cache should be removed');
  assert.equal(harness.cacheStore.has('hayah-shell-v121'), false, 'the previous shell cache should be removed');
  assert.equal(harness.cacheStore.has('hayah-shell-v123'), false, 'the previous shell cache should be removed');
  assert.equal(harness.cacheStore.has('hayah-shell-v124'), false, 'the save-hardening shell cache should be removed');
  assert.equal(harness.cacheStore.has('hayah-shell-v125'), false, 'the previous career-consequence shell cache should be removed');
  assert.equal(harness.cacheStore.has('hayah-shell-v130'), false, 'the previous shell cache should be removed');
  assert.equal(harness.cacheStore.has('hayah-shell-v131'), false, 'the previous v131 shell cache should be removed');
  assert.equal(harness.cacheStore.has('hayah-shell-v132'), false, 'the previous v132 shell cache should be removed after the focused combat-training update');
  assert.equal(harness.cacheStore.has('hayah-shell-v133'), false, 'the previous v133 shell cache should be removed');
  assert.equal(harness.cacheStore.has('hayah-shell-v134'), false, 'the previous v134 cache should be removed');
  assert.equal(harness.cacheStore.has('hayah-shell-v135'), false, 'the previous v135 roster cache should be removed');
  assert.equal(harness.cacheStore.has('hayah-shell-v137'), false, 'the previous shell cache should be removed');
  assert.equal(harness.cacheStore.has('hayah-shell-v138'), false, 'the previous update-notice shell should be removed');
  assert.equal(harness.cacheStore.has('hayah-shell-v139'), false, 'the previous combat-community shell should be removed');
  assert.equal(harness.cacheStore.has('hayah-shell-v140'), false, 'the previous shell cache should be removed');
  assert.equal(harness.cacheStore.has('hayah-shell-v141'), false, 'the previous shell cache should be removed');
  assert.equal(harness.cacheStore.has('hayah-shell-v142'), false, 'the previous shell cache should be removed');
  assert.equal(harness.cacheStore.has('hayah-shell-v143'), false, 'the previous shell cache should be removed');
  assert.equal(harness.cacheStore.has('hayah-shell-v144'), false, 'the previous shell cache should be removed');
  assert.equal(harness.cacheStore.has('hayah-shell-v145'), false, 'the previous shell cache should be removed');
  assert.equal(harness.cacheStore.has('hayah-shell-v150'), false, 'the previous v150 shell cache should be removed');
  assert.equal(harness.cacheStore.has('hayah-shell-v151'), false, 'the previous v151 shell cache should be removed');
  assert.equal(harness.cacheStore.has('hayah-shell-v152'), false, 'the previous v152 shell cache should be removed');
  assert.equal(harness.cacheStore.has('hayah-shell-v153'), false, 'the previous v153 shell cache should be removed');
  assert.equal(harness.cacheStore.has('hayah-shell-v159'), false, 'the previous v159 shell cache should be removed');
  assert.ok(harness.cacheStore.has('hayah-shell-v227'), 'the current shell cache should be retained');
  assert.equal(harness.cacheStore.has('hayah-shell-v224'), false, 'the previous v224 shell cache should be removed after v225 installs');
  assert.equal(harness.cacheStore.has('hayah-shell-v225'), false, 'the previous v225 shell cache should be removed after v226 installs');
  assert.equal(harness.cacheStore.has('hayah-shell-v226'), false, 'the previous v226 shell cache should be removed after v227 installs');
  assert.equal(harness.cacheStore.has('hayah-shell-v216'), false, 'the v216 shell cache should be retired after v217 installs');
  assert.equal(harness.cacheStore.has('hayah-shell-v201'), false, 'the previous v201 shell cache should be removed');
  assert.equal(harness.cacheStore.has('hayah-shell-v202'), false, 'the previous v202 shell cache should be removed');
  assert.equal(harness.cacheStore.has('hayah-shell-v187'), false, 'the previous shell cache should be removed after the v187 shell is ready');
  assert.equal(harness.cacheStore.has('hayah-shell-v178'), false, 'the previous v178 shell cache should be removed after the new shell is ready');
  assert.equal(harness.cacheStore.has('hayah-shell-v176'), false, 'the previous v176 shell cache should be removed after the new shell is ready');
  assert.equal(harness.cacheStore.has('hayah-shell-v177'), false, 'the previous v177 shell cache should be removed after the new shell is ready');
  assert.equal(harness.cacheStore.has('hayah-shell-v173'), false, 'the older v173 shell should be removed after the v179 shell is ready');
  assert.equal(harness.cacheStore.has('hayah-shell-v174'), false, 'the previous v174 shell should be removed after the v179 shell is ready');
  assert.equal(harness.cacheStore.has('hayah-shell-v175'), false, 'the previous v175 shell should be removed after the v179 shell is ready');
  assert.equal(harness.cacheStore.has('hayah-shell-v170'), false, 'the previous v170 shell should be removed after the new shell is ready');
  assert.equal(harness.cacheStore.has('hayah-shell-v162'), false, 'the previous v162 shell should be removed');
  assert.equal(harness.cacheStore.has('hayah-shell-v163'), false, 'the previous v163 shell should be removed');
  assert.equal(harness.cacheStore.has('hayah-shell-v164'), false, 'the previous v164 shell should be removed');
  assert.equal(harness.cacheStore.has('hayah-shell-v110'), false);
  assert.equal(harness.cacheStore.has('hayah-shell-v111'), false);
  assert.equal(harness.cacheStore.has('hayah-shell-v112'), false);
  assert.equal(harness.cacheStore.has('hayah-shell-v109'), false);
  assert.equal(harness.cacheStore.has('hayah-shell-v108'), false);
  assert.equal(harness.cacheStore.has('hayah-shell-v107'), false);
  assert.equal(harness.cacheStore.has('hayah-shell-v105'), false);
  assert.equal(harness.cacheStore.has('hayah-shell-v106'), false);
  assert.equal(harness.cacheStore.has('hayah-shell-v104'), false);
  assert.equal(harness.cacheStore.has('hayah-shell-v103'), false);
  assert.equal(harness.cacheStore.has('hayah-shell-v101'), false);
  assert.equal(harness.cacheStore.has('hayah-shell-v102'), false);
  assert.equal(harness.cacheStore.has('hayah-shell-v100'), false);
  assert.equal(harness.cacheStore.has('hayah-shell-v89'), false);
  assert.equal(harness.cacheStore.has('hayah-shell-v90'), false);
  assert.equal(harness.cacheStore.has('hayah-shell-v91'), false);
  assert.equal(harness.cacheStore.has('hayah-shell-v92'), false);
  assert.equal(harness.cacheStore.has('hayah-shell-v93'), false);
  assert.equal(harness.cacheStore.has('hayah-shell-v94'), false);
  assert.equal(harness.cacheStore.has('hayah-shell-v95'), false);
  assert.equal(harness.cacheStore.has('hayah-shell-v96'), false);
  assert.equal(harness.cacheStore.has('hayah-shell-v97'), false);
  assert.equal(harness.cacheStore.has('hayah-shell-v98'), false);
  assert.ok(harness.cacheStore.has('unrelated-cache'));
});

test('optional shell asset failures fall back to the essential playable shell', async () => {
  const fullShell = [
    scope + 'index.html',
    scope + 'style.css',
    scope + 'accessibility.css',
    scope + 'diary-search.css',
    scope + 'business-insights.css',
    scope + 'life-review.css',
    scope + 'pwa-update.css',
    scope + 'app.js',
    scope + 'life-review.js',
    scope + 'combat-season.js',
    scope + 'pwa-update.js',
    scope + 'diary-search.js',
    scope + 'business-insights.js',
    scope + 'manifest.webmanifest',
    scope + 'icon.svg',
    scope + 'backup-check.html',
    scope + 'backup-check.js'
  ];
  const coreShell = [scope + 'index.html', scope + 'style.css', scope + 'app.js'];
  const harness = makeHarness(
    undefined,
    null,
    null,
    null,
    async (name, urls) => {
      if (urls.includes(scope + 'accessibility.css')) {
        throw new Error('optional accessibility asset unavailable');
      }
    }
  );

  await harness.dispatchLifecycle('install');

  assert.deepEqual(harness.cacheCalls.addAllAttempts, [fullShell, coreShell],
    'the worker should retry only the essential app shell after an optional asset fails');
  assert.deepEqual(harness.cacheCalls.added, coreShell);
  assert.equal(harness.cacheCalls.skipped, 1,
    'the worker should activate after the essential game files are cached');
  const cache = harness.cacheStore.get('hayah-shell-v227');
  for (const url of coreShell) assert.ok(cache.has(url), 'essential shell asset should be cached: ' + url);
  assert.equal(cache.has(scope + 'accessibility.css'), false,
    'the failed optional asset should not block the playable shell');
});

test('the service worker does not install when an essential game asset remains unavailable', async () => {
  const harness = makeHarness(
    undefined,
    null,
    null,
    null,
    async (name, urls) => {
      if (urls.includes(scope + 'app.js')) throw new Error('essential app script unavailable');
    }
  );

  await assert.rejects(harness.dispatchLifecycle('install'), /essential app script unavailable/);
  assert.equal(harness.cacheCalls.skipped, 0,
    'the worker must not activate with an incomplete essential game shell');
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

test('temporary HTTP failures use the last cached screen and assets without hiding uncached 404s', async () => {
  const harness = makeHarness(async request => {
    const url = typeof request === 'string' ? request : request.url;
    if (url === scope + 'style.css' || url === scope + 'a-life-route') {
      return new Response('temporary server failure', { status: 503 });
    }
    return new Response('missing resource', { status: 404 });
  });
  await harness.dispatchLifecycle('install');

  let assetPromise;
  harness.listeners.get('fetch')({
    request: { method: 'GET', url: scope + 'style.css', mode: 'same-origin' },
    respondWith(promise) { assetPromise = promise; }
  });
  const asset = await assetPromise;
  assert.equal(asset.status, 200);
  assert.equal(await asset.text(), 'cached:' + scope + 'style.css',
    'a cached asset should survive a temporary HTTP 503');

  let navigationPromise;
  harness.listeners.get('fetch')({
    request: { method: 'GET', url: scope + 'a-life-route', mode: 'navigate' },
    respondWith(promise) { navigationPromise = promise; }
  });
  const navigation = await navigationPromise;
  assert.equal(navigation.status, 200);
  assert.equal(await navigation.text(), 'cached:' + scope + 'index.html',
    'a cached Arabic app shell should survive a temporary navigation 503');

  let missingPromise;
  harness.listeners.get('fetch')({
    request: { method: 'GET', url: scope + 'missing.json', mode: 'same-origin' },
    respondWith(promise) { missingPromise = promise; }
  });
  const missing = await missingPromise;
  assert.equal(missing.status, 404);
  assert.equal(await missing.text(), 'missing resource',
    'a genuine uncached 404 should not be disguised as a cached success');

  const removedHarness = makeHarness(async () => new Response('resource removed', { status: 404 }));
  await removedHarness.dispatchLifecycle('install');
  let removedPromise;
  removedHarness.listeners.get('fetch')({
    request: { method: 'GET', url: scope + 'style.css', mode: 'same-origin' },
    respondWith(promise) { removedPromise = promise; }
  });
  const removed = await removedPromise;
  assert.equal(removed.status, 404,
    'a deliberate 404 must remain visible even when an older cached copy exists');
  assert.equal(await removed.text(), 'resource removed');
});

test('successful network responses survive Cache Storage write failures', async () => {
  const networkBody = 'fresh response despite cache write failure';
  const harness = makeHarness(
    async () => new Response(networkBody, { status: 200 }),
    async () => {
      const error = new Error('storage quota exceeded');
      error.name = 'QuotaExceededError';
      throw error;
    }
  );
  await harness.dispatchLifecycle('install');

  let responsePromise;
  harness.listeners.get('fetch')({
    request: { method: 'GET', url: scope + 'fresh-data.json', mode: 'same-origin' },
    respondWith(promise) { responsePromise = promise; }
  });

  const response = await responsePromise;
  assert.equal(response.status, 200,
    'a cache quota failure must not turn a successful network response into an offline error');
  assert.equal(await response.text(), networkBody,
    'the original network body must be returned when caching is unavailable');
});

test('cache lookup failures do not reject offline or transient-error fetch handling', async () => {
  let cacheUnavailable = false;
  const rejectCacheOpen = async () => {
    if (cacheUnavailable) throw new Error('Cache Storage unavailable');
  };
  const transientHarness = makeHarness(
    async () => new Response('temporary server failure', { status: 503 }),
    null,
    rejectCacheOpen
  );
  await transientHarness.dispatchLifecycle('install');
  cacheUnavailable = true;

  let transientPromise;
  transientHarness.listeners.get('fetch')({
    request: { method: 'GET', url: scope + 'style.css', mode: 'same-origin' },
    respondWith(promise) { transientPromise = promise; }
  });
  const transient = await transientPromise;
  assert.equal(transient.status, 503,
    'a cache lookup failure must not replace the original transient HTTP response');
  assert.equal(await transient.text(), 'temporary server failure');

  let offlineUnavailable = false;
  const offlineHarness = makeHarness(
    async () => { throw new Error('offline'); },
    null,
    async () => {
      if (offlineUnavailable) throw new Error('Cache Storage unavailable');
    }
  );
  await offlineHarness.dispatchLifecycle('install');
  offlineUnavailable = true;

  let offlinePromise;
  offlineHarness.listeners.get('fetch')({
    request: { method: 'GET', url: scope + 'missing.json', mode: 'same-origin' },
    respondWith(promise) { offlinePromise = promise; }
  });
  const offline = await offlinePromise;
  assert.equal(offline.status, 503,
    'an unavailable cache must produce the explicit offline response instead of a rejected promise');
  assert.match(await offline.text(), /غير متصل بالإنترنت/);
});

test('cache.match failures are handled like other Cache Storage read failures', async () => {
  let cacheUnavailable = false;
  const rejectCacheMatch = async () => {
    if (cacheUnavailable) throw new Error('Cache match unavailable');
  };

  const transientHarness = makeHarness(
    async () => new Response('temporary server failure', { status: 503 }),
    null,
    null,
    rejectCacheMatch
  );
  await transientHarness.dispatchLifecycle('install');
  cacheUnavailable = true;

  let transientPromise;
  transientHarness.listeners.get('fetch')({
    request: { method: 'GET', url: scope + 'style.css', mode: 'same-origin' },
    respondWith(promise) { transientPromise = promise; }
  });
  const transient = await transientPromise;
  assert.equal(transient.status, 503,
    'a cache.match failure must preserve the original transient HTTP response');
  assert.equal(await transient.text(), 'temporary server failure');

  let offlineUnavailable = false;
  const offlineHarness = makeHarness(
    async () => { throw new Error('offline'); },
    null,
    null,
    async () => {
      if (offlineUnavailable) throw new Error('Cache match unavailable');
    }
  );
  await offlineHarness.dispatchLifecycle('install');
  offlineUnavailable = true;

  let offlinePromise;
  offlineHarness.listeners.get('fetch')({
    request: { method: 'GET', url: scope + 'missing.json', mode: 'same-origin' },
    respondWith(promise) { offlinePromise = promise; }
  });
  const offline = await offlinePromise;
  assert.equal(offline.status, 503,
    'an offline cache.match failure must return the explicit offline response');
  assert.match(await offline.text(), /غير متصل بالإنترنت/);
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

  harness.cacheStore.get('unrelated-cache').set(
    scope + 'foreign.css',
    new Response('copy from unrelated cache')
  );
  let unrelatedPromise;
  harness.listeners.get('fetch')({
    request: { method: 'GET', url: scope + 'foreign.css', mode: 'same-origin' },
    respondWith(promise) { unrelatedPromise = promise; }
  });
  const unrelated = await unrelatedPromise;
  assert.equal(unrelated.status, 503,
    'the worker must not borrow a same-URL response from an unrelated origin cache');
  assert.match(await unrelated.text(), /غير متصل بالإنترنت/);
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


test('optional shell fallback preserves older cached Hayah assets before cleanup', async () => {
  const harness = makeHarness(
    undefined,
    null,
    null,
    null,
    async (name, urls) => {
      if (urls.includes(scope + 'accessibility.css')) {
        throw new Error('optional accessibility asset unavailable');
      }
    }
  );
  const previousShell = harness.cacheStore.get('hayah-shell-v147');
  previousShell.set(scope + 'accessibility.css', new Response('previous accessibility stylesheet'));
  previousShell.set(scope + 'backup-check.js', new Response('previous backup checker'));
  harness.cacheStore.get('unrelated-cache').set(
    scope + 'pwa-update.js',
    new Response('unrelated cached script')
  );

  await harness.dispatchLifecycle('install');

  const currentShell = harness.cacheStore.get('hayah-shell-v227');
  assert.equal(
    await (await currentShell.get(scope + 'accessibility.css').clone()).text(),
    'previous accessibility stylesheet',
    'a previously cached optional Hayah asset should be carried into the new shell'
  );
  assert.equal(
    await (await currentShell.get(scope + 'backup-check.js').clone()).text(),
    'previous backup checker',
    'the offline save checker should be carried forward from the previous Hayah shell'
  );
  assert.equal(
    currentShell.has(scope + 'pwa-update.js'),
    false,
    'assets from unrelated caches must not be copied into the app shell'
  );

  await harness.dispatchLifecycle('activate');
  assert.equal(harness.cacheStore.has('hayah-shell-v147'), false,
    'the obsolete shell should still be removed after its useful optional asset is copied');
  assert.equal(
    await (await currentShell.get(scope + 'accessibility.css').clone()).text(),
    'previous accessibility stylesheet',
    'the copied optional asset should survive cleanup of the previous shell'
  );
});

test('optional shell fallback prefers the newest available Hayah asset', async () => {
  const harness = makeHarness(
    undefined,
    null,
    null,
    null,
    async (name, urls) => {
      if (urls.includes(scope + 'accessibility.css')) {
        throw new Error('optional accessibility asset unavailable');
      }
    }
  );
  const olderShell = harness.cacheStore.get('hayah-shell-v145');
  const newerShell = harness.cacheStore.get('hayah-shell-v147');
  olderShell.set(scope + 'accessibility.css', new Response('older accessibility stylesheet'));
  newerShell.set(scope + 'accessibility.css', new Response('newer accessibility stylesheet'));

  await harness.dispatchLifecycle('install');

  const currentShell = harness.cacheStore.get('hayah-shell-v227');
  assert.equal(
    await (await currentShell.get(scope + 'accessibility.css').clone()).text(),
    'newer accessibility stylesheet',
    'the newest previous Hayah shell must win when multiple caches contain the same optional asset'
  );
});


test('offline navigation serves a cached standalone page by its own URL', async () => {
  const harness = makeHarness();
  await harness.dispatchLifecycle('install');

  let checkerPromise;
  harness.listeners.get('fetch')({
    request: { method: 'GET', url: scope + 'backup-check.html', mode: 'navigate' },
    respondWith(promise) { checkerPromise = promise; }
  });
  const checkerResponse = await checkerPromise;
  assert.equal(checkerResponse.status, 200);
  assert.equal(await checkerResponse.text(), 'cached:' + scope + 'backup-check.html',
    'the offline backup tool must not be replaced with the main game page');

  let homePromise;
  harness.listeners.get('fetch')({
    request: { method: 'GET', url: scope, mode: 'navigate' },
    respondWith(promise) { homePromise = promise; }
  });
  const homeResponse = await homePromise;
  assert.equal(homeResponse.status, 200);
  assert.equal(await homeResponse.text(), 'cached:' + scope + 'index.html',
    'the app root should continue to use the main game shell');
});
