'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

function sourceBetween(name, nextName) {
  const start = app.indexOf('function ' + name + '(');
  assert.notEqual(start, -1, 'expected function ' + name);
  const end = app.indexOf('function ' + nextName + '(', start + 1);
  assert.notEqual(end, -1, 'expected following function ' + nextName);
  return app.slice(start, end);
}

const calculateAutoRaceResult = vm.runInNewContext(
  sourceBetween('calculateAutoRaceResult', 'ensureAutoRacingProfile') + '\ncalculateAutoRaceResult'
);

const baseRace = {
  lifeId: 'hayah-test-life',
  year: 24,
  assetId: 'racecar-01',
  raceCount: 3,
  eventId: 'pro',
  carValue: 7500000,
  condition: 88,
  skill: 64,
  style: 'balanced'
};

test('نتيجة السباق حتمية لنفس الحياة والسيارة والسنة', () => {
  const first = JSON.parse(JSON.stringify(calculateAutoRaceResult(baseRace)));
  const second = JSON.parse(JSON.stringify(calculateAutoRaceResult(baseRace)));
  assert.deepEqual(second, first);
});

test('رفع مهارة السائق وأداء السيارة لا يخفض نتيجة نفس السيناريو', () => {
  const baseline = calculateAutoRaceResult(baseRace);
  const improved = calculateAutoRaceResult({
    ...baseRace,
    skill: 95,
    carValue: 12000000,
    condition: 100
  });
  assert.ok(improved.score >= baseline.score);
  assert.ok(improved.position <= baseline.position);
});

test('أسلوب القيادة يوازن بين الأداء والضرر', () => {
  const careful = calculateAutoRaceResult({ ...baseRace, style: 'careful' });
  const balanced = calculateAutoRaceResult({ ...baseRace, style: 'balanced' });
  const aggressive = calculateAutoRaceResult({ ...baseRace, style: 'aggressive' });
  assert.ok(careful.damage < balanced.damage);
  assert.ok(balanced.damage < aggressive.damage);
  assert.ok(aggressive.score > careful.score);
});

test('المحاكاة تحصر التقييم والمركز والضرر في نطاقات آمنة', () => {
  const result = calculateAutoRaceResult({
    ...baseRace,
    carValue: Number.MAX_SAFE_INTEGER,
    condition: 500,
    skill: 500
  });
  assert.ok(result.score >= 0 && result.score <= 100);
  assert.ok(result.position >= 1 && result.position <= 8);
  assert.ok(result.damage >= 0 && result.damage <= 25);
});

test('نظام البطولات متصل بالأصول ولا يفرض ترحيلًا على الحفظ القديم', () => {
  assert.match(app, /function autoRacingMenu\(\)/);
  assert.match(app, /function autoRacingCarMenu\(index\)/);
  assert.match(app, /function runAutoRace\(index,eventId,style\)/);
  assert.match(app, /profile\.lastRaceYear===year/);
  assert.match(app, /profile\.lastTrainingYear===year/);
  assert.match(app, /function ensureAutoRacingProfile\(\)/);
  assert.match(app, /a\.kind==='racecar'/);
  assert.match(app, /const KEY = 'hekayat_hayah_save_v1';/);
  assert.match(app, /return \{version:1,lifeId:/);
});

test('سيارات السباق تحصل على حالة وصيانة وتكاليف سنوية واضحة', () => {
  assert.match(app, /a\.kind==='car'\|\|a\.kind==='racecar'\|\|a\.kind==='property'\)\?100:undefined/);
  assert.match(app, /a\.kind!=='property'&&a\.kind!=='car'&&a\.kind!=='racecar'/);
  assert.match(app, /else if\(a\.kind==='racecar'\)/);
  assert.match(app, /بطولات حلبة حياة/);
});
