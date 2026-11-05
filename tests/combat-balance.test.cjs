'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const planStart = app.indexOf('const combatGamePlanCatalog=');
const planEnd = app.indexOf('const combatCoachCatalog=', planStart);
assert.ok(planStart >= 0 && planEnd > planStart, 'combat strategy catalog and effect helpers must be available');

const context = {};
vm.runInNewContext(
  app.slice(planStart, planEnd) +
    '\nglobalThis.api={effect:combatGamePlanEffect,normalize:normalizeCombatGamePlan};',
  context
);

const api = context.api;
const plans = ['balanced', 'pressure', 'counter', 'conserve'];
const styles = ['قوة', 'سرعة', 'تقنية', 'دفاع'];
const energyAdvantage = effect => effect.energyRecoveryBonus - effect.energyCostBonus;

function buildMatchupGrid() {
  const cases = [];
  for (const moveStyle of styles) {
    for (const opponentStyle of styles) {
      for (const weakTo of styles) {
        for (const strongAgainst of [...styles, null]) {
          cases.push({
            move: { style: moveStyle, strongAgainst },
            opponentStyle,
            weakTo
          });
        }
      }
    }
  }
  return cases;
}

test('مصفوفة خطط الركن تحصر النقاط والطاقة في حدود معلومة', () => {
  const cases = buildMatchupGrid();
  assert.equal(cases.length, 320, 'all move, opponent, weakness and counter combinations are covered');

  for (const plan of plans) {
    for (const matchup of cases) {
      const effect = api.effect(plan, matchup.move, matchup.opponentStyle, matchup.weakTo);
      assert.ok(Number.isFinite(effect.scoreBonus), plan + ' must return a finite score adjustment');
      assert.ok(Number.isFinite(effect.energyCostBonus), plan + ' must return a finite energy cost');
      assert.ok(Number.isFinite(effect.energyRecoveryBonus), plan + ' must return finite energy recovery');
      assert.ok(effect.scoreBonus >= -2 && effect.scoreBonus <= 5, plan + ' score adjustment must stay bounded');
      assert.ok(effect.energyCostBonus >= 0 && effect.energyCostBonus <= 2, plan + ' energy cost must stay bounded');
      assert.ok(effect.energyRecoveryBonus >= 0 && effect.energyRecoveryBonus <= 5, plan + ' recovery must stay bounded');
      assert.ok(!(effect.energyCostBonus > 0 && effect.energyRecoveryBonus > 0),
        plan + ' cannot charge extra energy and grant recovery in the same action');
    }
  }
});

test('لا توجد خطة ركن تهيمن على كل الخطط الأخرى في جميع المواجهات', () => {
  const cases = buildMatchupGrid();
  const effects = new Map();

  for (const plan of plans) {
    effects.set(plan, cases.map(matchup =>
      api.effect(plan, matchup.move, matchup.opponentStyle, matchup.weakTo)
    ));
  }

  for (const left of plans) {
    for (const right of plans) {
      if (left === right) continue;
      const leftEffects = effects.get(left);
      const rightEffects = effects.get(right);
      const leftDominatesEverywhere = leftEffects.every((effect, index) =>
        effect.scoreBonus >= rightEffects[index].scoreBonus &&
        energyAdvantage(effect) >= energyAdvantage(rightEffects[index])
      );
      assert.equal(leftDominatesEverywhere, false,
        left + ' must not dominate ' + right + ' across every matchup');
    }
  }

  const balanced = effects.get('balanced');
  assert.ok(balanced.every(effect =>
    effect.scoreBonus === 0 && effect.energyCostBonus === 0 && effect.energyRecoveryBonus === 0
  ), 'the balanced plan remains a neutral baseline');
});

test('عينة حتمية من 4096 مواجهة تحافظ على مفاضلة الضغط وإدارة الطاقة والمضاد', () => {
  let seed = 0x5eed1234;
  const pick = length => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return Math.floor((seed / 0x100000000) * length);
  };
  const sampledMoveStyles = new Set();
  let matchedCounterReads = 0;
  let missedCounterReads = 0;
  const totals = Object.fromEntries(plans.map(plan => [plan, {
    score: 0,
    energy: 0,
    minScore: Infinity,
    maxScore: -Infinity,
    samples: 0
  }]));

  for (let index = 0; index < 4096; index++) {
    const matchup = {
      move: { style: styles[pick(styles.length)], strongAgainst: styles[pick(styles.length)] },
      opponentStyle: styles[pick(styles.length)],
      weakTo: styles[pick(styles.length)]
    };
    sampledMoveStyles.add(matchup.move.style);
    if (matchup.move.strongAgainst === matchup.opponentStyle || matchup.move.style === matchup.weakTo) {
      matchedCounterReads++;
    } else {
      missedCounterReads++;
    }

    for (const plan of plans) {
      const effect = api.effect(plan, matchup.move, matchup.opponentStyle, matchup.weakTo);
      const total = totals[plan];
      total.score += effect.scoreBonus;
      total.energy += energyAdvantage(effect);
      total.minScore = Math.min(total.minScore, effect.scoreBonus);
      total.maxScore = Math.max(total.maxScore, effect.scoreBonus);
      total.samples++;
    }
  }

  for (const plan of plans) {
    assert.equal(totals[plan].samples, 4096);
    assert.ok(Number.isFinite(totals[plan].score));
    assert.ok(Number.isFinite(totals[plan].energy));
  }

  assert.equal(sampledMoveStyles.size, styles.length,
    'the sample must exercise every move style; use high PRNG bits rather than correlated low bits');
  assert.ok(matchedCounterReads > 0 && missedCounterReads > 0,
    'the sample must contain both successful and unsuccessful counter reads');
  assert.equal(totals.balanced.score, 0);
  assert.equal(totals.balanced.energy, 0);
  assert.ok(totals.pressure.score > totals.conserve.score,
    'pressure should trade energy efficiency for a higher average score');
  assert.ok(totals.conserve.energy > totals.pressure.energy,
    'energy management should recover more energy than pressure');
  assert.ok(totals.counter.minScore < 0 && totals.counter.maxScore > 0,
    'counter play must reward good reads and penalize poor reads');

  const report = Object.fromEntries(plans.map(plan => [plan, {
    averageScoreAdjustment: Number((totals[plan].score / totals[plan].samples).toFixed(3)),
    averageEnergyAdvantage: Number((totals[plan].energy / totals[plan].samples).toFixed(3))
  }]));
  console.log('Combat strategy balance matrix (deterministic):', JSON.stringify(report));
});

test('القيم غير المعروفة في الحفظ القديم تعود إلى الخطة المتزنة', () => {
  assert.equal(api.normalize('unknown-plan'), 'balanced');
  assert.equal(api.normalize(null), 'balanced');
  assert.equal(api.normalize('pressure'), 'pressure');
});
