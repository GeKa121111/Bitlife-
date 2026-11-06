'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const catalogStart = app.indexOf('const combatMoveCatalog=');
const communityStart = app.indexOf('const combatCommunityProfiles=');
const communityEnd = app.indexOf('\nfunction combatRoundEnergy(', communityStart);
assert.ok(catalogStart >= 0 && communityStart > catalogStart && communityEnd > communityStart);

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

const intentStart = app.indexOf('function combatOpponentIntent(');
const intentEnd = app.indexOf('\nconst combatReactionCatalog', intentStart);
assert.ok(intentStart >= 0 && intentEnd > intentStart, 'opponent intent must remain a standalone function');

vm.runInContext([
  app.slice(catalogStart, communityStart),
  app.slice(communityStart, communityEnd),
  functionSource('combatOpponentArchetype'),
  functionSource('combatMoveMemoryCounterInsight'),
  functionSource('combatOpponentMemoryInsight'),
  functionSource('combatOpponentStyleForRound'),
  app.slice(intentStart, intentEnd),
  'globalThis.api = { counter: combatMoveMemoryCounterInsight, intent: combatOpponentIntent, archetype: combatOpponentArchetype };'
].join(String.fromCharCode(10)), context, { filename: 'combat-rival-counter-preparation.test.cjs' });

const api = context.api;
const repeatedMove = 'quick-jab';

function identityForArchetype(target) {
  for (let index = 0; index < 1000; index++) {
    const id = 'counter-test-' + index;
    if (api.archetype({ rating: 95 }, id).id === target) return id;
  }
  throw new Error('could not find deterministic archetype ' + target);
}

test('المنافس المتمرس يجهز أسلوبًا مضادًا للحركة الأكثر تكرارًا', () => {
  const identity = identityForArchetype('balanced');
  const insight = api.counter({ rating: 90 }, Array(3).fill(repeatedMove), identity);
  assert.equal(insight.actionId, repeatedMove);
  assert.equal(insight.moveTitle, 'لكمة خاطفة');
  assert.equal(insight.moveStyle, 'سرعة');
  assert.equal(insight.counterStyle, 'تقنية');
  assert.equal(insight.dominant, true);
});

test('المنافس العنيد يحتاج ملاحظة إضافية قبل تجهيز المضاد', () => {
  const identity = identityForArchetype('stubborn');
  const early = api.counter({ rating: 95 }, Array(3).fill(repeatedMove), identity);
  const ready = api.counter({ rating: 95 }, Array(4).fill(repeatedMove), identity);
  assert.equal(early.counterStyle, '');
  assert.equal(ready.counterStyle, 'تقنية');
});

test('لا يوجد مضاد عند انخفاض الوعي أو تعادل الحركات أو غياب حركة معروفة', () => {
  const identity = identityForArchetype('balanced');
  assert.equal(api.counter({ rating: 40 }, Array(5).fill(repeatedMove), identity).counterStyle, '');
  assert.equal(api.counter({ rating: 90 }, ['quick-jab', 'quick-jab', 'low-kick', 'low-kick'], identity).counterStyle, '');
  assert.equal(api.counter({ rating: 90 }, ['unknown-move', 'unknown-move', 'unknown-move'], identity).counterStyle, '');
});

test('إشارة الجولة الأولى تعرض الحركة التي قرأها المنافس وتغيّر نيته فعلًا', () => {
  const identity = identityForArchetype('balanced');
  const opponent = { name: 'منافس تجريبي', style: 'قوة', weakTo: 'سرعة', rating: 90 };
  const prepared = api.intent(opponent, 1, '', [], identity, [], Array(3).fill(repeatedMove));
  assert.equal(prepared.style, 'تقنية');
  assert.equal(prepared.moveMemoryRead, true);
  assert.equal(prepared.rememberedMoveTitle, 'لكمة خاطفة');
  assert.match(prepared.read, /لكمة خاطفة/);

  const unprepared = api.intent(opponent, 1, '', [], identity, [], []);
  assert.equal(unprepared.style, 'قوة');
  assert.equal(unprepared.moveMemoryRead, false);
});

test('ذاكرة الحركة لا تتجاوز خطة التكيف داخل الجولات اللاحقة', () => {
  const identity = identityForArchetype('balanced');
  const opponent = { name: 'منافس تجريبي', style: 'قوة', weakTo: 'سرعة', rating: 90 };
  const nextRound = api.intent(opponent, 2, 'دفاع', [], identity, [], Array(3).fill(repeatedMove));
  assert.equal(nextRound.style, 'سرعة');
  assert.equal(nextRound.moveMemoryRead, false);
});

test('قائمتا اختيار الحركة وحسم الجولة تمرران ذاكرة المنافس للمحرك', () => {
  const call = /combatOpponentIntent\(opponent,round,session\.lastStyle,session\.roundHistory,session\.communityFighterId,rememberedRival\?rememberedRival\.styleMemory:\[\],rememberedRival\?rememberedRival\.moveMemory:\[\]\)/g;
  assert.equal([...app.matchAll(call)].length, 2);
});
