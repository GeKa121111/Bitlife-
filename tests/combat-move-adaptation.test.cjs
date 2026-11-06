'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

function functionSource(name) {
  const start = app.indexOf('function ' + name + '(');
  assert.notEqual(start, -1, 'expected function ' + name);
  const end = app.indexOf('\nfunction ', start + 1);
  assert.notEqual(end, -1, 'expected a following function after ' + name);
  return app.slice(start, end);
}

const context = vm.createContext({});
vm.runInContext([
  functionSource('combatMoveRepetitionEffect'),
  functionSource('normalizePendingCombatBout'),
  'globalThis.api = { repetition: combatMoveRepetitionEffect, normalize: normalizePendingCombatBout };'
].join(String.fromCharCode(10)), context, { filename: 'combat-move-adaptation.test.cjs' });

const api = context.api;

test('الحركة الجديدة لا تتعرض لعقوبة تكرار', () => {
  const result = api.repetition([], 'quick-jab');
  assert.deepEqual(JSON.parse(JSON.stringify(result)), {
    repeats: 0,
    playerPenalty: 0,
    opponentBonus: 0
  });
});

test('تكرار الحركة مرة واحدة يمنح المنافس قراءة محدودة', () => {
  const result = api.repetition([{ actionId: 'quick-jab' }], 'quick-jab');
  assert.deepEqual(JSON.parse(JSON.stringify(result)), {
    repeats: 1,
    playerPenalty: 1,
    opponentBonus: 1
  });
});

test('تكرار الحركة في آخر جولتين يبلغ الحد الأقصى دون تضخم', () => {
  const result = api.repetition([
    { actionId: 'quick-jab' },
    { actionId: 'quick-jab' }
  ], 'quick-jab');
  assert.deepEqual(JSON.parse(JSON.stringify(result)), {
    repeats: 2,
    playerPenalty: 2,
    opponentBonus: 2
  });
});

test('القراءة تقتصر على آخر جولتين وتتجاهل السجل المشوه', () => {
  const result = api.repetition([
    { actionId: 'quick-jab' },
    null,
    { actionId: 'counter-read' },
    { actionId: 'quick-jab' }
  ], 'quick-jab');
  assert.deepEqual(JSON.parse(JSON.stringify(result)), {
    repeats: 1,
    playerPenalty: 1,
    opponentBonus: 1
  });
  assert.equal(api.repetition([{ actionId: 'quick-jab' }], '').repeats, 0);
});

test('استكمال النزال المحفوظ يحتفظ بتفاصيل التكرار والحفظ القديم يبدأ بقيم صفرية', () => {
  const normalized = api.normalize({
    mode: 'street',
    opponent: { name: 'منافس تجريبي', style: 'قوة', weakTo: 'سرعة', rating: 55 },
    roundHistory: [
      { actionId: 'quick-jab', style: 'سرعة', moveRepetitionCount: 1, moveRepetitionPenalty: 1, opponentAdaptationBonus: 1 },
      { actionId: 'quick-jab', style: 'سرعة', moveRepetitionCount: 2, moveRepetitionPenalty: 2, opponentAdaptationBonus: 2 }
    ]
  });
  assert.equal(normalized.roundHistory[0].actionId, 'quick-jab');
  assert.equal(normalized.roundHistory[1].moveRepetitionCount, 2);
  assert.equal(normalized.roundHistory[1].moveRepetitionPenalty, 2);
  assert.equal(normalized.roundHistory[1].opponentAdaptationBonus, 2);

  const legacy = api.normalize({
    mode: 'street',
    opponent: { name: 'منافس قديم', style: 'دفاع', rating: 40 },
    roundHistory: [{ actionId: 'quick-jab', style: 'سرعة' }]
  });
  assert.equal(legacy.roundHistory[0].moveRepetitionCount, 0);
  assert.equal(legacy.roundHistory[0].moveRepetitionPenalty, 0);
  assert.equal(legacy.roundHistory[0].opponentAdaptationBonus, 0);
});

test('حساب الجولة والواجهة وسجل النزال تستخدم قاعدة التكيف الموحّدة نفسها', () => {
  assert.match(app, /combatMoveAdaptationEffect\(opponent,session\.roundHistory,rememberedRival&&rememberedRival\.moveMemory,move\.id/);
  assert.match(app, /combatMoveAdaptationEffect\(opponent,session\.roundHistory,rememberedRival&&rememberedRival\.moveMemory,tactic\.id/);
  assert.match(app, /styleVarietyModifier-playerAdaptationPenalty/);
  assert.match(app, /distanceResult\.opponentBonus\+opponentAdaptationBonus/);
  assert.match(app, /moveRepetitionCount:moveRepetition\.repeats/);
  assert.match(app, /moveMemoryObservations:moveMemoryEffect\.observations/);
  assert.match(app, /moveRepetitionPenalty:item\.moveRepetitionPenalty\|\|0/);
  assert.match(app, /تكرار الأسلوب أو الحركة نفسها يسهّل قراءة خطتك/);
});
