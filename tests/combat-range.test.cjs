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
  assert.equal(context.api.effects('long', { id:'unlisted-move' }, 'غير معروف', 'dodge').after, 'mid');
});

test('الحفظ القديم للنزال يستعيد مسافة آمنة ويحفظ المسافات الجديدة بعد التنقية', () => {
  const context = {};
  vm.runInNewContext(helperSource + '\n' + pendingSource + '\n' + 'globalThis.normalizeBout=normalizePendingCombatBout;', context);
  const legacy = context.normalizeBout({ mode:'street', opponent:{name:'منافس قديم',style:'قوة'}, roundHistory:[{style:'سرعة',actionId:'quick-jab'}] });
  assert.equal(legacy.distance,'mid');
  assert.equal(legacy.roundHistory[0].distanceBefore,null,'legacy round history must not invent a recorded distance');
  assert.equal(legacy.roundHistory[0].moveRange,null);
  assert.equal(legacy.roundHistory[0].distanceAfter,null);
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
  assert.match(sourceOf('resolveCombatBout','recoverCombatInjury'), /distanceBefore:\['close','mid','long'\]\.includes\(item\.distanceBefore\)\?item\.distanceBefore:null/);
  assert.match(sourceOf('combatBoutHistory','combatChampionshipHistory'), /المسافة بين الجولات/);
});


test('خطط الركن تغيّر النقاط والطاقة وتظل متوافقة مع النزالات المحفوظة', () => {
  const planStart = app.indexOf('const combatGamePlanCatalog=');
  const planEnd = app.indexOf('const combatCoachCatalog=', planStart);
  assert.ok(planStart >= 0 && planEnd > planStart, 'combat game plans should be declared before coach data');
  const planSource = app.slice(planStart, planEnd);
  const context = {};
  vm.runInNewContext(planSource + '\\n' + pendingSource + '\\n' +
    'globalThis.api={normalize:normalizeCombatGamePlan,effect:combatGamePlanEffect,normalizeBout:normalizePendingCombatBout};', context);
  const api = context.api;
  const asPlain = value => JSON.parse(JSON.stringify(value));

  assert.equal(api.normalize('unknown-plan'), 'balanced');
  assert.deepEqual(asPlain(api.effect('balanced', {style:'قوة'}, 'دفاع', 'سرعة')),
    {scoreBonus:0,energyCostBonus:0,energyRecoveryBonus:0});
  assert.deepEqual(asPlain(api.effect('pressure', {style:'قوة'}, 'دفاع', 'سرعة')),
    {scoreBonus:4,energyCostBonus:2,energyRecoveryBonus:0});
  assert.deepEqual(asPlain(api.effect('pressure', {style:'تقنية'}, 'دفاع', 'سرعة')),
    {scoreBonus:1,energyCostBonus:2,energyRecoveryBonus:0});
  assert.deepEqual(asPlain(api.effect('counter', {style:'سرعة',strongAgainst:'قوة'}, 'قوة', 'دفاع')),
    {scoreBonus:5,energyCostBonus:0,energyRecoveryBonus:0});
  assert.deepEqual(asPlain(api.effect('counter', {style:'دفاع'}, 'قوة', 'دفاع')),
    {scoreBonus:5,energyCostBonus:0,energyRecoveryBonus:0});
  assert.deepEqual(asPlain(api.effect('counter', {style:'تقنية'}, 'قوة', 'سرعة')),
    {scoreBonus:-2,energyCostBonus:0,energyRecoveryBonus:0});
  assert.deepEqual(asPlain(api.effect('conserve', {style:'سرعة'}, 'قوة', 'دفاع')),
    {scoreBonus:-2,energyCostBonus:0,energyRecoveryBonus:5});

  const legacy = api.normalizeBout({mode:'street',opponent:{name:'منافس قديم',style:'قوة'},roundHistory:[]});
  assert.equal(legacy.gamePlan, 'balanced', 'old pending bouts should resume with a neutral plan');
  const saved = api.normalizeBout({mode:'street',gamePlan:'counter',opponent:{name:'منافس محفوظ',style:'سرعة'},roundHistory:[]});
  assert.equal(saved.gamePlan, 'counter');
  const invalid = api.normalizeBout({mode:'street',gamePlan:'invalid',opponent:{name:'منافس',style:'دفاع'},roundHistory:[]});
  assert.equal(invalid.gamePlan, 'balanced');
});

test('خطة الركن تُثبت عند بدء النزال وتؤثر في الجولة وتظهر في الواجهة والسجل', () => {
  assert.match(sourceOf('createCombatCareer','ensureCombatCareer'), /gamePlan:'balanced'/);
  assert.match(sourceOf('ensureCombatCareer','combatRankName'), /c\.gamePlan=normalizeCombatGamePlan\(c\.gamePlan\)/);
  assert.match(sourceOf('startCombatBout','combatBoutRoundMenu'), /gamePlan:c\.gamePlan/);
  const menu = sourceOf('combatGamePlanMenu','combatCareerMenu');
  assert.match(menu, /combatGamePlanCatalog\.map/);
  assert.match(menu, /تُثبت الخطة عند بدء المواجهة/);
  const roundMenu = sourceOf('combatBoutRoundMenu','chooseCombatReaction');
  assert.match(roundMenu, /خطة الركن/);
  const round = sourceOf('resolveCombatRound','resolveCombatBout');
  assert.match(round, /combatGamePlanEffect\(planId,move,intent\.style,opponent\.weakTo\)/);
  assert.match(round, /combatRoundEnergy\(c\.energy,effectiveMove,session\.mode,reaction\.energyCost\)/);
  assert.match(round, /planEffect\.scoreBonus/);
  const result = sourceOf('resolveCombatBout','recoverCombatInjury');
  assert.match(result, /gamePlan:session\?normalizeCombatGamePlan\(session\.gamePlan\)/);
  assert.match(sourceOf('combatBoutHistory','combatChampionshipHistory'), /خطة الركن/);
});
