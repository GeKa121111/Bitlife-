'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const forecast = require('../film-rights-forecast.js');

function makeContract(overrides = {}) {
  return {
    id: 'dist-1',
    filmId: 'film-1',
    filmTitle: 'حكاية على ضفاف النيل',
    genre: 'دراما اجتماعية',
    partnerId: 'streaming',
    partnerTitle: 'منصة السرد',
    startYear: 10,
    lastPaidYear: 10,
    termYears: 3,
    yearsRemaining: 3,
    annualRoyalty: 1000,
    advancePaid: 3000,
    totalPaid: 3000,
    status: 'active',
    ...overrides
  };
}

function makeSave(contracts, yearCount = 10) {
  return {
    version: 1,
    yearCount,
    place: { unit: 'ج.م' },
    filmStudio: { distributionContracts: contracts }
  };
}

test('يتوقع العوائد السنوية للعقود السارية فقط خلال السنوات الخمس المقبلة', () => {
  const state = makeSave([
    makeContract({ id: 'dist-a', filmId: 'film-a', annualRoyalty: 1000, yearsRemaining: 3 }),
    makeContract({ id: 'dist-b', filmId: 'film-b', annualRoyalty: 500, yearsRemaining: 1 }),
    makeContract({ id: 'dist-c', filmId: 'film-c', status: 'expired', annualRoyalty: 9000 })
  ]);
  const result = forecast.buildForecast(state);
  assert.equal(result.available, true);
  assert.equal(result.activeContracts, 2);
  assert.equal(result.excludedContracts, 0);
  assert.deepEqual(result.years.map(row => row.amount), [1500n, 1000n, 1000n, 0n, 0n]);
  assert.deepEqual(result.years.map(row => row.contractCount), [2, 1, 1, 0, 0]);
  assert.equal(result.totalForecast, 3500n);
});

test('العقود التالفة أو المؤرخة في المستقبل لا تدخل في التوقع', () => {
  const state = makeSave([
    makeContract({ id: 'bad-negative', filmId: 'film-negative', annualRoyalty: -1 }),
    makeContract({ id: 'bad-future', filmId: 'film-future', lastPaidYear: 11 }),
    makeContract({ id: 'bad-term', filmId: 'film-term', yearsRemaining: 4, termYears: 3 }),
    makeContract({ id: 'bad-name', filmId: 'film-name', partnerTitle: '' })
  ]);
  const result = forecast.buildForecast(state);
  assert.equal(result.available, true);
  assert.equal(result.activeContracts, 0);
  assert.equal(result.excludedContracts, 4);
  assert.equal(result.complete, false);
  assert.equal(result.totalForecast, 0n);
});

test('التوقع يمنع تكرار العقد أو الفيلم حتى لا يضاعف الإيراد', () => {
  const first = makeContract({ id: 'same-id', filmId: 'film-a', annualRoyalty: 700 });
  const duplicateId = makeContract({ id: 'same-id', filmId: 'film-b', annualRoyalty: 900 });
  const duplicateFilm = makeContract({ id: 'different-id', filmId: 'film-a', annualRoyalty: 1200 });
  const result = forecast.buildForecast(makeSave([first, duplicateId, duplicateFilm]));
  assert.equal(result.activeContracts, 1);
  assert.equal(result.excludedContracts, 2);
  assert.equal(result.years[0].amount, 700n);
});

test('يجمع القيم الكبيرة بدقة BigInt حتى عندما يتجاوز الإجمالي Number.MAX_SAFE_INTEGER', () => {
  const large = Number.MAX_SAFE_INTEGER;
  const result = forecast.buildForecast(makeSave([
    makeContract({ id: 'large-a', filmId: 'film-large-a', annualRoyalty: large, yearsRemaining: 1, termYears: 1 }),
    makeContract({ id: 'large-b', filmId: 'film-large-b', annualRoyalty: large, yearsRemaining: 1, termYears: 1 })
  ]), 1);
  assert.equal(result.totalForecast, BigInt(large) * 2n);
  assert.notEqual(forecast.formatMoney(result.totalForecast, 'ج.م'), 'غير متاح');
});

test('الحفظ القديم بلا استوديو أفلام يعرض توقعًا صفريًا دون ترحيل أو كتابة', () => {
  const legacy = { version: 1, yearCount: 22, name: 'شخصية قديمة' };
  const before = JSON.stringify(legacy);
  const result = forecast.buildForecast(legacy);
  assert.equal(result.available, true);
  assert.equal(result.activeContracts, 0);
  assert.equal(result.totalForecast, 0n);
  assert.equal(JSON.stringify(legacy), before);
});

test('يرفض إصدار الحفظ غير المدعوم والسنة غير الصالحة والسجل الأكبر من الحد', () => {
  assert.equal(forecast.buildForecast({ version: 2, yearCount: 10 }).available, false);
  assert.equal(forecast.buildForecast({ version: 1, yearCount: -1 }).available, false);
  assert.equal(forecast.buildForecast(makeSave(Array.from({ length: 201 }, (_, index) =>
    makeContract({ id: 'dist-' + index, filmId: 'film-' + index })
  ))).available, false);
});

test('قراءة الحفظ محلية فقط ولا تكتب أو تعدل أي مفتاح', () => {
  const saved = makeSave([makeContract()]);
  const calls = { reads: [], writes: 0 };
  const host = {
    localStorage: {
      getItem(key) {
        calls.reads.push(key);
        return JSON.stringify(saved);
      },
      setItem() { calls.writes++; },
      removeItem() { calls.writes++; }
    }
  };
  const loaded = forecast.readSavedState(host);
  assert.deepEqual(calls.reads, [forecast.SAVE_KEY]);
  assert.equal(calls.writes, 0);
  assert.deepEqual(loaded, saved);
  const broken = forecast.readSavedState({ localStorage: { getItem: () => '{broken' } });
  assert.equal(broken, null);
});

test('مدى التوقع محدود بخمس سنوات ويقبل تقليل الأفق', () => {
  const state = makeSave([makeContract({ yearsRemaining: 8, termYears: 8 })]);
  const standard = forecast.buildForecast(state);
  const shorter = forecast.buildForecast(state, 2);
  assert.equal(standard.years.length, 5);
  assert.equal(shorter.years.length, 2);
  assert.equal(shorter.totalForecast, 2000n);
});
