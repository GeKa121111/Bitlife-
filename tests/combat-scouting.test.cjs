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

const catalogStart = app.indexOf('const combatMoveCatalog=');
const styleStart = app.indexOf('const combatMemoryStyles=');
const styleEnd = app.indexOf('\nfunction combatRivalDeathAge', styleStart);
assert.ok(catalogStart >= 0 && styleStart > catalogStart && styleEnd > styleStart,
  'combat catalogs and style memory helpers must remain available');

const context = vm.createContext({
  clamp(value, min = 0, max = 100) {
    const number = Number(value);
    return Math.max(min, Math.min(max, Number.isFinite(number) ? Math.round(number) : 0));
  }
});

vm.runInContext([
  app.slice(catalogStart, styleEnd),
  functionSource('combatOpponentArchetype'),
  functionSource('combatOpponentMemoryInsight'),
  functionSource('combatMoveMemorySummary'),
  functionSource('combatRivalScoutingReport'),
  functionSource('combatOpponentStyleForRound'),
  'globalThis.api = { insight: combatOpponentMemoryInsight, report: combatRivalScoutingReport, style: combatOpponentStyleForRound };'
].join(String.fromCharCode(10)), context, { filename: 'combat-scouting.test.cjs' });

const api = context.api;
const variedMemory = ['قوة', 'سرعة', 'دفاع', 'تقنية', 'قوة', 'سرعة', 'دفاع', 'تقنية'];
const dominantMemory = ['سرعة', 'سرعة', 'سرعة', 'قوة', 'دفاع', 'تقنية'];

test('توزيع متعادل بين الأساليب لا ينتج قراءة مضادة زائفة', () => {
  const insight = api.insight({ rating: 95 }, variedMemory, 'rival-balanced-memory');
  assert.equal(insight.dominant, false);
  assert.equal(insight.repeated, 2);
  assert.equal(insight.runnerUp, 2);
  assert.equal(insight.counterStyle, '');
  assert.equal(api.style({ style: 'قوة', rating: 95 }, 1, '', [], 'rival-balanced-memory', variedMemory), 'قوة',
    'the opponent should keep its base style when no dominant player habit exists');
});

test('أسلوب مهيمن بوضوح يسمح للمنافس المؤهل بتجهيز المضاد الصحيح', () => {
  const insight = api.insight({ rating: 95 }, dominantMemory, 'rival-dominant-memory');
  assert.equal(insight.dominant, true);
  assert.equal(insight.observedStyle, 'سرعة');
  assert.equal(insight.repeated, 3);
  assert.equal(insight.runnerUp, 1);
  assert.equal(insight.counterStyle, 'تقنية');
  assert.equal(api.style({ style: 'قوة', rating: 95 }, 1, '', [], 'rival-dominant-memory', dominantMemory), 'تقنية');
});

test('القراءة تحتاج عينة كافية وتقييمًا مناسبًا للمنافس', () => {
  const shortSample = api.insight({ rating: 95 }, ['سرعة', 'سرعة'], 'rival-short-memory');
  assert.equal(shortSample.counterStyle, '');
  const lowAwareness = api.insight({ rating: 35 }, dominantMemory, 'rival-low-awareness');
  assert.equal(lowAwareness.dominant, true);
  assert.equal(lowAwareness.counterStyle, '');
});

test('تقرير الكشف يعرض توزيع الأساليب دون تعديل ذاكرة الحفظ', () => {
  const fighter = {
    id: 'rival-scout-report',
    rating: 95,
    momentum: 0,
    styleMemory: dominantMemory.slice(),
    memoryBouts: 2
  };
  const before = JSON.stringify(fighter);
  const report = api.report(fighter);
  assert.equal(report.total, 6);
  assert.equal(report.observedStyle, 'سرعة');
  assert.equal(report.repeated, 3);
  assert.equal(report.counterStyle, 'تقنية');
  assert.equal(report.dominant, true);
  assert.equal(report.styleCounts.find(item => item.style === 'سرعة').count, 3);
  assert.match(report.message, /تقنية/);
  assert.equal(JSON.stringify(fighter), before, 'the scouting report must be derived and must not mutate saved data');
});

test('التقرير يوضح أن الذاكرة القديمة أو الفارغة غير كافية', () => {
  const report = api.report({ id: 'new-rival', rating: 90, styleMemory: [], memoryBouts: 0 });
  assert.equal(report.total, 0);
  assert.equal(report.counterStyle, '');
  assert.match(report.message, /غير كافية/);
});

test('واجهة ملف المنافس تعرض تقرير الكشف باللغة العربية', () => {
  assert.match(app, /const scouting=combatRivalScoutingReport\(fighter\)/);
  assert.match(app, /choice\('🧠','تقرير كشف الأسلوب'/);
});
