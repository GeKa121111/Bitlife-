'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const catalogStart = app.indexOf('const combatMoveCatalog=[');
const catalogEnd = app.indexOf('const combatTacticCatalog=', catalogStart);
assert.ok(catalogStart >= 0 && catalogEnd > catalogStart, 'the original move catalog must remain available');

const rangeStart = app.indexOf('function normalizeCombatDistance(');
const rangeEnd = app.indexOf('function combatStyleVarietyModifier(', rangeStart);
assert.ok(rangeStart >= 0 && rangeEnd > rangeStart, 'combat range helpers must remain available');

const masteryStart = app.indexOf('function normalizeCombatMoveMastery(');
const masteryEnd = app.indexOf('function combatMoveMasteryLevel(', masteryStart);
assert.ok(masteryStart >= 0 && masteryEnd > masteryStart, 'move mastery normalization must remain available');

const context = {};
vm.runInNewContext([
  app.slice(catalogStart, catalogEnd),
  app.slice(rangeStart, rangeEnd),
  app.slice(masteryStart, masteryEnd),
  'globalThis.api = { catalog: combatMoveCatalog, range: combatMoveRange, normalizeMastery: normalizeCombatMoveMastery };'
].join(String.fromCharCode(10)), context, { filename: 'combat-move-catalog.test.cjs' });

const api = context.api;
const styles = ['قوة', 'سرعة', 'دفاع', 'تقنية'];
const newMoveIds = [
  'step-in-feint',
  'shoulder-frame',
  'wrist-turn',
  'body-angle-shift',
  'distance-check',
  'forearm-wall',
  'level-switch',
  'counter-spiral',
  'rhythm-cut',
  'champion-lock'
];

test('كتالوج القتال يحتوي على 50 حركة أصلية بمعرّفات وعناوين فريدة', () => {
  assert.equal(api.catalog.length, 50);
  assert.equal(new Set(api.catalog.map(move => move.id)).size, 50, 'move ids must be unique');
  assert.equal(new Set(api.catalog.map(move => move.title)).size, 50, 'move titles must be unique');

  for (const move of api.catalog) {
    assert.ok(typeof move.id === 'string' && move.id.length > 0);
    assert.ok(typeof move.title === 'string' && move.title.length > 0);
    assert.ok(styles.includes(move.style), move.id + ' must use a supported style');
    assert.ok(styles.includes(move.strongAgainst), move.id + ' must counter a supported style');
    assert.ok(Number.isInteger(move.rank) && move.rank >= 0 && move.rank <= 4, move.id + ' rank must be valid');
    assert.ok(Number.isFinite(move.power) && move.power >= 25 && move.power <= 75, move.id + ' power must stay bounded');
    assert.ok(Number.isFinite(move.cost) && move.cost >= 0, move.id + ' learning cost must be non-negative');
    assert.ok(['close', 'mid', 'long'].includes(api.range(move)), move.id + ' must resolve to a valid range');
  }
});

test('الحركات العشر الجديدة موزعة على الرتب والمدى والطاقة دون تجاوز الحدود', () => {
  const added = api.catalog.filter(move => newMoveIds.includes(move.id));
  assert.equal(added.length, 10);
  assert.deepEqual(Array.from(added, move => move.id).sort(), [...newMoveIds].sort());

  const rangeCounts = { close: 0, mid: 0, long: 0 };
  for (const move of added) {
    assert.ok(['close', 'mid', 'long'].includes(move.range), move.id + ' must declare its range explicitly');
    assert.ok(Number.isFinite(move.energyCost) && move.energyCost >= 0 && move.energyCost <= 30,
      move.id + ' energy cost must fit the round engine limits');
    rangeCounts[move.range] += 1;
  }
  assert.deepEqual(rangeCounts, { close: 4, mid: 3, long: 3 });
});

test('توزيع المدى الكامل لا يهمل أي مسافة قتالية', () => {
  const counts = { close: 0, mid: 0, long: 0 };
  for (const move of api.catalog) counts[api.range(move)] += 1;
  assert.deepEqual(counts, { close: 19, mid: 19, long: 12 });
});

test('تطبيع إتقان الحركات يحافظ على الحركة الجديدة والقديمة في حفظ v1', () => {
  const normalized = api.normalizeMastery({
    'quick-jab': 5,
    'step-in-feint': 3,
    'champion-lock': 7,
    'unknown-move': 99
  }, ['quick-jab', 'step-in-feint', 'champion-lock', 'unknown-move']);
  assert.deepEqual(JSON.parse(JSON.stringify(normalized)), {
    'quick-jab': 5,
    'step-in-feint': 3,
    'champion-lock': 7
  });
});

test('أكاديمية الحركات والشراء يستخدمان الكتالوج مباشرة دون قائمة منفصلة للحركات الجديدة', () => {
  assert.match(app, /const opts=combatMoveCatalog\.map\(m=>/);
  assert.match(app, /const m=combatMoveCatalog\.find\(x=>x\.id===id\)/);
  assert.match(app, /c\.movesKnown\.push\(m\.id\)/);
  assert.match(app, /c\.moveMastery=normalizeCombatMoveMastery\(c\.moveMastery,c\.movesKnown\)/);
});
