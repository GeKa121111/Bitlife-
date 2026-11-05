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
  const end = app.indexOf('\\nfunction ', start + 1);
  assert.notEqual(end, -1, 'expected a following function after ' + name);
  return app.slice(start, end);
}

const counters = { closed: 0, notices: [], modals: [], logs: 0, achievements: 0, saves: 0, renders: 0, careerMenus: 0 };
const context = vm.createContext({
  state: { bank: 5000, prison: { years: 2 } },
  career: { retired: false, coach: null },
  combatCoachCatalog: [{
    id: 'coach-a',
    level: 1,
    title: 'مدرب أساسي',
    name: 'مدرب الاختبار',
    desc: 'تدريب متوازن.',
    bonus: 2,
    annualCost: 500,
    price: 1000
  }],
  ensureCombatCareer() { return this.career; },
  closeModal() { counters.closed += 1; },
  info(...args) { counters.notices.push(args); },
  cash(value) { return String(value); },
  choice(...args) { return args; },
  modal(...args) { counters.modals.push(args); },
  log() { counters.logs += 1; },
  achievement() { counters.achievements += 1; },
  save() { counters.saves += 1; },
  render() { counters.renders += 1; },
  combatCareerMenu() { counters.careerMenus += 1; }
});

vm.runInContext([
  functionSource('combatCoachPrisonGuard'),
  functionSource('hireCombatCoach'),
  functionSource('assignCombatCoach'),
  'globalThis.api = { hire: hireCombatCoach, assign: assignCombatCoach };'
].join(String.fromCharCode(10)), context, { filename: 'combat-coach-prison.test.cjs' });

test('قائمة التعاقد لا تفتح أثناء السجن', () => {
  context.state.prison = { years: 2 };
  context.api.hire();
  assert.equal(counters.modals.length, 0);
  assert.ok(counters.notices.some(entry => entry[1] === 'التعاقد مع المدرب غير متاح'));
});

test('التحقق المباشر يمنع تجاوز القفل وخصم المال أو إنشاء عقد أثناء السجن', () => {
  context.state.prison = { years: 1 };
  context.state.bank = 5000;
  context.career.coach = null;
  const before = counters.saves;
  context.api.assign('coach-a');
  assert.equal(context.state.bank, 5000);
  assert.equal(context.career.coach, null);
  assert.equal(counters.saves, before);
  assert.ok(counters.notices.some(entry => entry[1] === 'التعاقد مع المدرب غير متاح'));
});

test('التعاقد يظل متاحًا بعد انتهاء العقوبة', () => {
  context.state.prison = null;
  const before = counters.modals.length;
  context.api.hire();
  assert.equal(counters.modals.length, before + 1);
});

test('التعاقد الطبيعي ينشئ العقد ويخصم سعره بعد الخروج من السجن', () => {
  context.state.prison = null;
  context.state.bank = 5000;
  context.career.coach = null;
  context.api.assign('coach-a');
  assert.equal(context.state.bank, 4000);
  assert.equal(context.career.coach.name, 'مدرب الاختبار');
  assert.equal(context.career.coach.yearsLeft, 3);
  assert.ok(counters.saves > 0);
});
