'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

const catalogStart = app.indexOf('const combatMoveCatalog=');
const memoryStart = app.indexOf('const combatMemoryStyles=');
const communityEnd = app.indexOf('\nfunction combatRoundEnergy(', memoryStart);
assert.ok(catalogStart >= 0 && memoryStart > catalogStart && communityEnd > memoryStart,
  'combat catalogs and community memory helpers must remain available');

const context = vm.createContext({
  clamp(value, min = 0, max = 100) {
    const number = Number(value);
    return Math.max(min, Math.min(max, Number.isFinite(number) ? Math.round(number) : 0));
  }
});

function functionSource(name) {
  const start = app.indexOf('function ' + name + '(');
  assert.notEqual(start, -1, 'expected function ' + name);
  const end = app.indexOf('\nfunction ', start + 1);
  assert.notEqual(end, -1, 'expected a following function after ' + name);
  return app.slice(start, end);
}

vm.runInContext([
  app.slice(catalogStart, memoryStart),
  app.slice(memoryStart, communityEnd),
  functionSource('normalizePendingCombatBout'),
  'globalThis.api = { normalizeMoves: normalizeCombatMoveMemory, normalizeCommunity: normalizeCombatCommunity, record: recordCombatRivalMoveMemory, effect: combatMoveLongTermEffect, summary: combatMoveMemorySummary, report: combatRivalScoutingReport, pending: normalizePendingCombatBout, archetype: combatOpponentArchetype };'
].join(String.fromCharCode(10)), context, { filename: 'combat-move-memory.test.cjs' });

const api = context.api;
const moveId = 'quick-jab';

test('ذاكرة الحركة تقتصر على آخر 12 استخدامًا صالحًا', () => {
  const normalized = api.normalizeMoves([
    'invalid-move',
    ...Array.from({ length: 15 }, () => moveId),
    42,
    null
  ]);
  assert.equal(normalized.length, 12);
  assert.ok(normalized.every(id => id === moveId));
});

test('المنافس القديم بلا ذاكرة حركات يحصل على قيمة افتراضية آمنة', () => {
  const old = api.normalizeCommunity([{ id: 'adam-mansour', age: 35 }], 10)
    .find(item => item.id === 'adam-mansour');
  assert.deepEqual(JSON.parse(JSON.stringify(old.moveMemory)), []);
});

test('المنافس يحتفظ بثلاث حركات من النزال المكتمل فقط', () => {
  const fighter = { id: 'adam-mansour', moveMemory: [moveId] };
  const result = api.record(fighter, [
    { actionId: moveId },
    { actionId: 'low-kick' },
    { actionId: 'pivot-counter' }
  ]);
  assert.equal(result.added, 3);
  assert.deepEqual(JSON.parse(JSON.stringify(fighter.moveMemory)), [
    moveId, moveId, 'low-kick', 'pivot-counter'
  ]);

  const partial = api.record(fighter, [{ actionId: moveId }, { actionId: 'low-kick' }]);
  assert.equal(partial.added, 0);
  assert.equal(fighter.moveMemory.length, 4);
});

test('المنافس يقرأ الحركة المتكررة تدريجيًا مع مراعاة مستوى وعيه', () => {
  const opponent = { rating: 90 };
  const two = api.effect(opponent, [moveId, moveId], moveId, 'rival-two');
  const four = api.effect(opponent, [moveId, moveId, moveId, moveId], moveId, 'rival-four');
  const six = api.effect(opponent, Array(6).fill(moveId), moveId, 'rival-six');
  const lowAwareness = api.effect({ rating: 35 }, Array(6).fill(moveId), moveId, 'rival-low');
  assert.equal(two.playerPenalty, 0);
  assert.equal(four.playerPenalty, 1);
  assert.equal(four.opponentBonus, 1);
  assert.equal(six.playerPenalty, 2);
  assert.equal(six.opponentBonus, 2);
  assert.equal(lowAwareness.playerPenalty, 0);
});

test('ملخص الذاكرة يحدد الحركة الأكثر استخدامًا ويعرضها في تقرير المنافس', () => {
  const fighter = {
    id: 'rival-memory-report',
    rating: 90,
    momentum: 0,
    styleMemory: ['قوة', 'سرعة', 'دفاع'],
    moveMemory: [moveId, moveId, moveId, 'low-kick']
  };
  const summary = api.summary(fighter);
  assert.equal(summary.actionId, moveId);
  assert.equal(summary.observations, 3);
  assert.ok(summary.title.length > 0);
  const report = api.report(fighter);
  assert.equal(report.moveMemory.observations, 3);
  assert.match(report.message, new RegExp(summary.title));
});

test('تطبيع المجتمع يحتفظ بذاكرة الحركات ويصفّي المعرفات غير المعروفة', () => {
  const fighter = api.normalizeCommunity([{
    id: 'adam-mansour',
    age: 35,
    moveMemory: [moveId, 'unknown-id', 'low-kick']
  }], 10).find(item => item.id === 'adam-mansour');
  assert.deepEqual(JSON.parse(JSON.stringify(fighter.moveMemory)), [moveId, 'low-kick']);
});

test('استكمال النزال المعلق يحتفظ بتفاصيل الذاكرة والحفظ القديم يبدأ بصفر', () => {
  const pending = api.pending({
    mode: 'street',
    opponent: { name: 'منافس تجريبي', style: 'قوة', rating: 70 },
    roundHistory: [{
      actionId: moveId,
      style: 'سرعة',
      moveMemoryObservations: 4,
      moveMemoryPenalty: 1,
      opponentMemoryBonus: 1
    }]
  });
  assert.equal(pending.roundHistory[0].moveMemoryObservations, 4);
  assert.equal(pending.roundHistory[0].moveMemoryPenalty, 1);
  assert.equal(pending.roundHistory[0].opponentMemoryBonus, 1);

  const legacy = api.pending({
    mode: 'street',
    opponent: { name: 'منافس قديم', style: 'قوة', rating: 40 },
    roundHistory: [{ actionId: moveId, style: 'سرعة' }]
  });
  assert.equal(legacy.roundHistory[0].moveMemoryObservations, 0);
  assert.equal(legacy.roundHistory[0].moveMemoryPenalty, 0);
  assert.equal(legacy.roundHistory[0].opponentMemoryBonus, 0);
});

test('الواجهة وحساب الجولة وسجل النزال موصولة بذاكرة المنافس طويلة المدى', () => {
  assert.match(app, /combatMoveAdaptationEffect\(opponent,session\.roundHistory,rememberedRival&&rememberedRival\.moveMemory,move\.id/);
  assert.match(app, /recordCombatRivalMoveMemory\(communityFighter,session&&session\.roundHistory\)/);
  assert.match(app, /moveMemoryObservations:moveMemoryEffect\.observations/);
  assert.match(app, /moveMemory:normalizeCombatMoveMemory\(item\.moveMemory\)/);
});
