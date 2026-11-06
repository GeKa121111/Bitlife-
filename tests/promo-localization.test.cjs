'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const jobStart = app.indexOf('const JOB_PACK_PROMOS = {');
const activityStart = app.indexOf('const ACTIVITY_PACK_PROMOS = {', jobStart);
const catalogEnd = app.indexOf('const fmt = ', activityStart);
assert.ok(jobStart >= 0 && activityStart > jobStart && catalogEnd > activityStart,
  'career and activity pack catalogs must remain available');

const context = {};
vm.runInNewContext(app.slice(jobStart, catalogEnd)
  + '\nglobalThis.catalogs = { job: JOB_PACK_PROMOS, activity: ACTIVITY_PACK_PROMOS };',
context, { filename: 'promo-localization.test.cjs' });
const catalogs = JSON.parse(JSON.stringify(context.catalogs));

const expectedJobIds = [
  'actorPack', 'fighterPack', 'proAthletePack', 'politicianPack', 'astronautPack',
  'businessPack', 'dealerPack', 'mafiaPack', 'movieDirectorPack', 'goldenDiploma',
  'modelPack', 'musicianPack', 'musicProducerPack'
];
const expectedActivityIds = ['vampireMode', 'outdoorsPack', 'gatedCommunityPack'];
const expectedCosts = {
  actorPack: 25000, fighterPack: 45000, proAthletePack: 35000, politicianPack: 30000,
  astronautPack: 50000, businessPack: 60000, dealerPack: 70000, mafiaPack: 70000,
  movieDirectorPack: 65000, goldenDiploma: 38000, modelPack: 28000,
  musicianPack: 30000, musicProducerPack: 35000,
  vampireMode: 55000, outdoorsPack: 45000, gatedCommunityPack: 90000
};

function offerSection(startMarker, endMarker) {
  const start = app.indexOf(startMarker);
  const end = app.indexOf(endMarker, start + startMarker.length);
  assert.ok(start >= 0 && end > start, 'expected offer renderer ' + startMarker);
  return app.slice(start, end);
}

test('كل بطاقات باقات المهن والأنشطة تعرض عناوين وأوصافًا ومزايا عربية', () => {
  for (const [group, packs] of Object.entries(catalogs)) {
    for (const [id, pack] of Object.entries(packs)) {
      for (const field of ['title', 'description']) {
        assert.match(pack[field], /[\u0600-\u06FF]/, id + ' ' + field + ' must contain Arabic text');
        assert.doesNotMatch(pack[field], /[A-Za-z]/, id + ' ' + field + ' must not expose English copy');
      }
      assert.ok(Array.isArray(pack.features) && pack.features.length > 0, id + ' needs feature bullets');
      for (const feature of pack.features) {
        assert.match(feature, /[\u0600-\u06FF]/, id + ' feature must contain Arabic text');
        assert.doesNotMatch(feature, /[A-Za-z]/, id + ' feature must not expose English copy');
      }
    }
  }
  assert.deepEqual(Object.keys(catalogs.job).sort(), expectedJobIds.sort());
  assert.deepEqual(Object.keys(catalogs.activity).sort(), expectedActivityIds.sort());
});

test('تعريب البطاقات لا يغير معرّفات الملكية أو أسعار العملات داخل اللعبة', () => {
  for (const [id, cost] of Object.entries(expectedCosts)) {
    const pack = catalogs.job[id] || catalogs.activity[id];
    assert.ok(pack, 'existing pack id must remain stable: ' + id);
    assert.equal(pack.cost, cost, id + ' must keep its existing in-game price');
  }
  assert.match(app, /const PERKS_KEY = 'hayah_permanent_perks_v1';/);
  assert.match(app, /const KEY = 'hekayat_hayah_save_v1';/);
  assert.match(app, /const BACKUP_FORMAT = 'hayah-backup';/);
  assert.match(app, /const BACKUP_VERSION = 1;/);
});

test('واجهتا عرض الباقات تستخدمان نصوصًا عربية وتحافظان على مسار الفتح والشراء', () => {
  const jobOffer = offerSection('function showJobPackOffer(', 'function showMovieDirectorOffer(');
  const activityOffer = offerSection('function showActivityPackOffer(', 'function refreshVampireRank(');
  const visibleEnglish = [
    'aria-label="Close"', '>NEW</span>', '>NEW!</span>', '<h2>Boss Mode</h2>',
    'Get it now!', 'restore earlier purchase', 'No previous purchase found',
    'in-game currency', 'VAMPIRE MODE', 'OUTDOORS LIFESTYLE', 'GATED COMMUNITY'
  ];
  for (const phrase of visibleEnglish) {
    assert.ok(!jobOffer.includes(phrase) && !activityOffer.includes(phrase),
      'offer screens must not display the old English label: ' + phrase);
  }
  assert.match(jobOffer, /aria-label="إغلاق"/);
  assert.match(jobOffer, /احصل عليها الآن/);
  assert.match(activityOffer, /aria-label="إغلاق"/);
  assert.match(activityOffer, /بعملة اللعبة/);
  assert.match(jobOffer, /buyPremiumPerkWithAction\(selected/);
  assert.match(activityOffer, /buyPremiumPerkWithAction\(id/);
});
