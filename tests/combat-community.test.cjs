'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const communityStart = app.indexOf('const combatCommunityProfiles=');
const communityEnd = app.indexOf('function combatRoundEnergy(', communityStart);
assert.ok(communityStart >= 0 && communityEnd > communityStart,
  'combat community profiles and legacy normalization must remain available');

function functionSource(name) {
  const start = app.indexOf('function ' + name + '(');
  assert.notEqual(start, -1, 'expected function ' + name);
  const end = app.indexOf('\\nfunction ', start + 1);
  assert.notEqual(end, -1, 'expected a following function after ' + name);
  return app.slice(start, end);
}

const communitySource = app.slice(communityStart, communityEnd);
const progressionSource = functionSource('advanceCombatCommunity');
const interactionSource = functionSource('interactCombatFighter');
const notices = [];
const logs = [];
const state = {
  age: 150,
  yearCount: 150,
  bank: 5000,
  fame: 0,
  reputation: 50,
  place: { unit: 'ج.م' }
};
let career = {
  retired: false,
  community: [],
  technique: 25,
  defense: 25,
  energy: 80
};

const context = vm.createContext({
  state,
  clamp(value, min = 0, max = 100) {
    const number = Number(value);
    return Math.max(min, Math.min(max, Number.isFinite(number) ? number : 0));
  },
  closeModal() {},
  info(...args) { notices.push(args); },
  cash(value) { return String(value); },
  log(...args) { logs.push(args); },
  save() {},
  render() {},
  combatCommunityFighterMenu() {},
  combatCommunityMenu() {}
});

vm.runInContext([
  communitySource,
  progressionSource,
  interactionSource,
  'globalThis.api = { normalize: normalizeCombatCommunity, advance: advanceCombatCommunity, interact: interactCombatFighter };'
].join(String.fromCharCode(10)), context, { filename: 'combat-community.test.cjs' });

const api = context.api;
context.ensureCombatCareer = () => {
  career.community = api.normalize(career.community, state.yearCount);
  return career;
};

function setAge(age) {
  state.age = age;
  state.yearCount = age;
}

function makeCommunity(overrides = {}) {
  return api.normalize([{
    id: 'adam-mansour',
    age: 35,
    retirementAge: 60,
    deathAge: 90,
    respect: 50,
    tension: 20,
    ...overrides
  }], state.yearCount);
}

function fighterById() {
  return career.community.find(item => item.id === 'adam-mansour');
}

test('تطبيع المجتمع يحفظ آخر تفاعل ونزال حتى عمر 150 ويقص القيم الخارجة عن الحد', () => {
  setAge(150);
  const preserved = api.normalize([{
    id: 'adam-mansour',
    age: 35,
    retirementAge: 60,
    deathAge: 90,
    lastInteractionAge: 150,
    lastBoutAge: 149
  }], 150).find(item => item.id === 'adam-mansour');

  assert.equal(preserved.lastInteractionAge, 150);
  assert.equal(preserved.lastBoutAge, 149);

  const bounded = api.normalize([{
    id: 'adam-mansour',
    age: 35,
    retirementAge: 60,
    deathAge: 90,
    lastInteractionAge: 999,
    lastBoutAge: 999
  }], 150).find(item => item.id === 'adam-mansour');

  assert.equal(bounded.lastInteractionAge, 150);
  assert.equal(bounded.lastBoutAge, 150);
});

test('قفل التفاعل السنوي يظل فعالًا عند عمر 150 وبعد إعادة تطبيع الحفظ', () => {
  setAge(150);
  notices.length = 0;
  career = {
    retired: false,
    community: makeCommunity({ lastInteractionAge: 149 }),
    technique: 25,
    defense: 25,
    energy: 80
  };

  api.interact('adam-mansour', 'friendly');
  const afterFirstInteraction = fighterById();
  assert.equal(afterFirstInteraction.lastInteractionAge, 150);
  const respectAfterFirstInteraction = afterFirstInteraction.respect;

  // A second call runs ensureCombatCareer again, matching the real UI/save path.
  api.interact('adam-mansour', 'friendly');
  assert.equal(fighterById().respect, respectAfterFirstInteraction,
    'normalizing the save must not unlock a second interaction in the same age');
  assert.ok(notices.some(entry => entry[1] === 'خد الأمور بهدوء'),
    'the player should receive the existing annual cooldown message');
});

test('آخر نزال يظل حديثًا بعد عمر 120 ولا يتقدم المنافس مرتين في السنة نفسها', () => {
  setAge(150);
  career = {
    retired: false,
    community: makeCommunity({
      age: 35,
      lastBoutAge: 149,
      lastProgressYear: 149,
      momentum: 0
    }),
    technique: 25,
    defense: 25,
    energy: 80
  };

  assert.equal(api.advance(career), true);
  assert.equal(fighterById().momentum, 1,
    'a bout at age 149 should still count as recent when the player is 150');
  assert.equal(fighterById().lastProgressYear, 150);
  const ageAfterFirstAdvance = fighterById().age;

  assert.equal(api.advance(career), false,
    'the same community must not advance twice for one game year');
  assert.equal(fighterById().age, ageAfterFirstAdvance);
});

test('المنافس المعتزل أو المتوفى يظل للقراءة فقط ولا يقبل تفاعلًا جديدًا', () => {
  setAge(60);
  notices.length = 0;
  career = {
    retired: false,
    community: makeCommunity({ age: 50, retirementAge: 45, deathAge: 80, retired: true }),
    technique: 25,
    defense: 25,
    energy: 80
  };
  api.interact('adam-mansour', 'friendly');
  assert.ok(notices.some(entry => entry[1] === 'المنافس معتزل'));

  setAge(80);
  notices.length = 0;
  career.community = makeCommunity({ age: 80, retirementAge: 45, deathAge: 80, retired: true, deceased: true });
  api.interact('adam-mansour', 'friendly');
  assert.ok(notices.some(entry => entry[1] === 'المنافس متوفى'));
});
