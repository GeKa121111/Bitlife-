'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

function sourceOf(name, nextName) {
  const start = app.indexOf('function ' + name + '(');
  assert.notEqual(start, -1, 'expected function ' + name);
  const end = app.indexOf('function ' + nextName + '(', start + 1);
  assert.notEqual(end, -1, 'expected following function ' + nextName);
  return app.slice(start, end);
}

const helperStart = app.indexOf('function normalizeCombatDistance(');
const helperEnd = app.indexOf('function combatStyleVarietyModifier(', helperStart);
assert.ok(helperStart >= 0 && helperEnd > helperStart, 'combat distance helpers should be defined together');
const helperSource = app.slice(helperStart, helperEnd);
const pendingSource = sourceOf('normalizePendingCombatBout', 'combatDifficultyLabel');

test('مدى الحركة والمسافة يضيفان أفضلية محدودة ومتوازنة', () => {
  const context = {};
  vm.runInNewContext(helperSource + '\n' +
    'globalThis.api={normalize:normalizeCombatDistance,label:combatDistanceLabel,range:combatMoveRange,effects:combatDistanceEffects};',
    context);
  const longRange = context.api.effects('mid', { id: 'quick-jab' }, 'سرعة', 'dodge');
  assert.deepEqual(JSON.parse(JSON.stringify(longRange)), { before:'mid', range:'long', playerBonus:1, opponentBonus:0, after:'long' });
  const closeRange = context.api.effects('mid', { id: 'body-force' }, 'قوة', 'counter');
  assert.deepEqual(JSON.parse(JSON.stringify(closeRange)), { before:'mid', range:'close', playerBonus:1, opponentBonus:0, after:'close' });
  const mismatch = context.api.effects('close', { id: 'quick-jab' }, 'قوة', 'guard');
  assert.deepEqual(JSON.parse(JSON.stringify(mismatch)), { before:'close', range:'long', playerBonus:-3, opponentBonus:2, after:'mid' });
  assert.equal(context.api.label('long'), 'بعيد');
  assert.equal(context.api.normalize('unknown'), 'mid');
  assert.equal(context.api.effects('long', { id:'unlisted-move' }, 'غير معروف', 'dodge').after, 'long');
});

test('الحفظ القديم للنزال يستعيد مسافة آمنة ويحفظ المسافات الجديدة بعد التنقية', () => {
  const context = {};
  vm.runInNewContext(helperSource + '\n' + pendingSource + '\n' + 'globalThis.normalizeBout=normalizePendingCombatBout;', context);
  const legacy = context.normalizeBout({ mode:'street', opponent:{name:'منافس قديم',style:'قوة'}, roundHistory:[{style:'سرعة',actionId:'quick-jab'}] });
  assert.equal(legacy.distance,'mid');
  assert.equal(legacy.roundHistory[0].distanceBefore,'mid');
  assert.equal(legacy.roundHistory[0].moveRange,'mid');
  assert.equal(legacy.roundHistory[0].distanceAfter,'mid');
  const current = context.normalizeBout({
    mode:'street', distance:'long', opponent:{name:'منافس جديد',style:'سرعة'},
    roundHistory:[{style:'سرعة',actionId:'quick-jab',distanceBefore:'close',moveRange:'long',distanceAfter:'long',distancePlayerBonus:99,distanceOpponentBonus:-99}]
  });
  assert.equal(current.distance,'long');
  assert.equal(current.roundHistory[0].distanceBefore,'close');
  assert.equal(current.roundHistory[0].moveRange,'long');
  assert.equal(current.roundHistory[0].distanceAfter,'long');
  assert.equal(current.roundHistory[0].distancePlayerBonus,4);
  assert.equal(current.roundHistory[0].distanceOpponentBonus,-2);
  assert.equal(context.normalizeBout({mode:'street',distance:'invalid',opponent:{name:'خصم',style:'دفاع'}}).distance,'mid');
});

test('اختيار الحركة يعرض المسافة ويحدّثها ويحتفظ بها في سجل النزال', () => {
  assert.match(sourceOf('startCombatBout','combatBoutRoundMenu'), /distance:'mid'/);
  const round = sourceOf('resolveCombatRound','resolveCombatBout');
  assert.match(round, /combatDistanceEffects\(session\.distance,move,opponentStyle,reaction\.id\)/);
  assert.match(round, /distanceResult\.playerBonus/);
  assert.match(round, /distanceResult\.opponentBonus/);
  assert.match(round, /session\.distance=distanceResult\.after/);
  assert.match(sourceOf('combatBoutRoundMenu','chooseCombatReaction'), /المسافة الحالية/);
  assert.match(sourceOf('resolveCombatBout','recoverCombatInjury'), /distanceBefore:item\.distanceBefore/);
  assert.match(sourceOf('combatBoutHistory','combatChampionshipHistory'), /المسافة بين الجولات/);
});
