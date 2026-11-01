'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');

function extractFunction(name) {
  const start = app.indexOf('function ' + name + '(');
  assert.notEqual(start, -1, 'expected app function ' + name);
  const end = app.indexOf('\nfunction ', start + 1);
  assert.notEqual(end, -1, 'expected next function after ' + name);
  return app.slice(start, end);
}

const ageSource = extractFunction('advanceAge');
const propertyOwnershipSource = [
  extractFunction('familyPropertyOwnershipRecords'),
  extractFunction('safeFamilyOwnershipShare'),
  extractFunction('syncFamilyPropertyMarketValue')
].join('\n');
const combatStart = app.indexOf('function normalizeCombatInjuryYears(');
const combatEnd = app.indexOf('const combatMoveMasteryThresholds=', combatStart);
assert.ok(combatStart >= 0 && combatEnd > combatStart, 'combat recovery helpers must exist');
const combatRecoverySource = app.slice(combatStart, combatEnd);

const harnessSource = String.raw`
'use strict';
var state;
var activeProfile = 'worker';
let rngState = 1;

function seededRandom() {
  rngState = (Math.imul(rngState, 1664525) + 1013904223) >>> 0;
  return rngState / 4294967296;
}
Math.random = seededRandom;
function setSeed(seed) { rngState = (Number(seed) >>> 0) || 1; }
function chance(probability) { return seededRandom() < Number(probability); }
function clamp(value, min = 0, max = 100) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.max(min, Math.min(max, Math.round(number)));
}
function validState() { return !!state; }
function perkEnabled() { return false; }
function perkOwned() { return false; }
function advanceChildren() {}
function log() {}
function achievement() {}
function ensureCombatCareer() { return state.combatCareer; }
function archiveCurrentJob() {}
function ensureJobProgress(job) { return job; }
function careerIncomeMultiplier() { return 1; }
function jobPromotionChance() { return 0; }
function grantJobPromotion() {}
function flash() {}
function cash(value) { return String(Math.round(Number(value) || 0)); }
function fmt(value) { return String(value); }
function applyCoParentingAnnualEffects() {}
function advanceZooSystem() {}
function advanceCultSystem() {}
function advanceCasinoSystem() {}
function advanceDealerSystem() {}
function advanceInvestmentAdvisor() {}
function simulateBusinessEntityYear() {}
function ensureEsportsCareer() {
  if (!state.esportsCareer) state.esportsCareer = {};
  return state.esportsCareer;
}
function specialCareerIncomeMultiplier() { return 1; }
function stat(key, delta) { state.stats[key] = clamp(state.stats[key] + delta); }
function render() {}
function save() {}
function death(cause) {
  state.status = 'متوفى';
  state.cause = cause;
  state.deathCount += 1;
}
function randomEvent() {}
const majors = [{ title: 'إدارة الأعمال', edu: 4 }];

function makeState() {
  return {
    age: 0,
    yearCount: 0,
    status: 'حي',
    cause: null,
    deathCount: 0,
    bank: 50000,
    debt: 0,
    wealthPeak: 50000,
    stats: { health: 88, happiness: 72, smart: 65, looks: 68 },
    education: {
      level: 0, school: 'لم تبدأ الدراسة', major: null,
      yearsLeft: 0, tuition: 0, prepaidYear: false
    },
    family: [
      { id: 'father', name: 'الأب التجريبي', relation: 'الأب', age: 42, relationshipLevel: 76, deceased: false },
      { id: 'mother', name: 'الأم التجريبية', relation: 'الأم', age: 40, relationshipLevel: 82, deceased: false }
    ],
    partner: null,
    married: false,
    children: [],
    coParentingPlans: [],
    prison: null,
    assets: [],
    investments: [],
    pets: [],
    hobbies: [],
    job: null,
    retired: false,
    performance: 70,
    specialCareer: null,
    combatCareer: null,
    business: null,
    companies: [],
    zoo: null,
    cult: null,
    casino: null,
    dealer: null,
    museum: null,
    investmentAdvisor: null,
    esportsCareer: null,
    fame: 0,
    followers: 0,
    socialMediaAccount: false,
    socialMediaPosts: 0
  };
}

function age18Choice() {
  if (activeProfile === 'worker') {
    state.job = { title: 'موظف إداري', salary: 42000 };
    state.performance = 76;
  } else if (activeProfile === 'student') {
    state.education = {
      level: 3, school: 'الجامعة', major: 'إدارة الأعمال',
      yearsLeft: 4, tuition: 4500, prepaidYear: false
    };
    state.job = { title: 'عمل جزئي', salary: 18000 };
    state.performance = 68;
  } else if (activeProfile === 'fighter') {
    state.specialCareer = { id: 'fighter', title: 'مقاتل', income: 11000 };
    state.combatCareer = { injury: 80, injuryYears: 2, energy: 65, coach: null };
    state.fame = 8;
  } else if (activeProfile === 'investor') {
    state.job = { title: 'مدير مشروع', salary: 39000 };
    state.performance = 73;
    state.bank = 150000;
    state.debt = 30000;
    state.assets = [
      { id: 'home', kind: 'property', value: 220000, upkeep: 9000, condition: 100, rented: true, tenant: null },
      { id: 'car', kind: 'car', value: 90000, upkeep: 6000, condition: 100 },
      { id: 'venture', kind: 'business', value: 300000, upkeep: 5000 }
    ];
    state.investments = [
      { kind: 'أسهم', value: 15000 },
      { kind: 'سندات', value: 10000 },
      { kind: 'عملات رقمية', value: 5000 }
    ];
    state.partner = {
      name: 'شريك تجريبي', age: 18, relationshipLevel: 82,
      loyalty: 82, reliability: 78, generosity: 68,
      petulance: 18, jealousy: 20, personality: 'حنون'
    };
    state.married = true;
    state.pets = [{ name: 'رفيق', species: 'كلب', age: 1, health: 84, happiness: 76 }];
    state.hobbies = [{ id: 'reading' }, { id: 'writing' }];
    state.socialMediaAccount = true;
    state.socialMediaPosts = 1;
    state.followers = 1200;
    state.fame = 24;
  }
}

function assertAnnualInvariants() {
  for (const key of ['health', 'happiness', 'smart', 'looks']) {
    const value = state.stats[key];
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      throw new Error('invalid stat ' + key + '=' + value + ' at age ' + state.age);
    }
  }
  if (!Number.isFinite(state.bank)) throw new Error('non-finite bank at age ' + state.age);
  if (!Number.isFinite(state.debt) || state.debt < 0) throw new Error('invalid debt at age ' + state.age);
  if (!Number.isFinite(state.wealthPeak)) throw new Error('non-finite wealth peak at age ' + state.age);
  if (!Number.isFinite(state.followers) || state.followers < 0) throw new Error('invalid followers at age ' + state.age);
  if (!Number.isInteger(state.age) || state.age < 0 || state.age > 106) throw new Error('invalid age ' + state.age);
  if (state.yearCount !== state.age) throw new Error('age/year counter drift at age ' + state.age);

  for (const asset of state.assets) {
    if (!Number.isFinite(asset.value) || asset.value < 0) throw new Error('invalid asset value at age ' + state.age);
    if (asset.condition !== undefined && (!Number.isFinite(asset.condition) || asset.condition < 0 || asset.condition > 100)) {
      throw new Error('invalid asset condition at age ' + state.age);
    }
  }
  for (const investment of state.investments) {
    if (!Number.isFinite(investment.value) || investment.value < 0) throw new Error('invalid investment value at age ' + state.age);
  }
  for (const pet of state.pets) {
    if (!Number.isFinite(pet.age) || !Number.isFinite(pet.health) || !Number.isFinite(pet.happiness)) {
      throw new Error('invalid pet state at age ' + state.age);
    }
    if (pet.health < 0 || pet.health > 100 || pet.happiness < 0 || pet.happiness > 100) {
      throw new Error('pet stats outside bounds at age ' + state.age);
    }
  }
  if (state.partner) {
    if (!Number.isFinite(state.partner.age) || !Number.isFinite(state.partner.relationshipLevel)
      || state.partner.relationshipLevel < 0 || state.partner.relationshipLevel > 100) {
      throw new Error('invalid partner state at age ' + state.age);
    }
  }
  if (state.combatCareer) {
    if (!Number.isFinite(state.combatCareer.injury) || state.combatCareer.injury < 0 || state.combatCareer.injury > 100) {
      throw new Error('invalid fighter injury at age ' + state.age);
    }
    if (!Number.isInteger(state.combatCareer.injuryYears)
      || state.combatCareer.injuryYears < 0 || state.combatCareer.injuryYears > 2) {
      throw new Error('invalid fighter recovery duration at age ' + state.age);
    }
  }
}

function runCohort(count) {
  const profileIds = ['worker', 'student', 'fighter', 'investor'];
  const profileStats = Object.fromEntries(profileIds.map(id => [id, { count: 0, totalAge: 0, minAge: Infinity, maxAge: 0 }]));
  const deathCauses = {};
  let minAge = Infinity;
  let maxAge = 0;
  let totalAge = 0;
  let fingerprint = 2166136261;

  for (let index = 0; index < count; index++) {
    setSeed((0x6d2b79f5 ^ (index + 1)) >>> 0);
    activeProfile = profileIds[index % profileIds.length];
    state = makeState();
    let steps = 0;

    while (state.status === 'حي' && steps < 107) {
      const previousAge = state.age;
      advanceAge();
      steps += 1;
      if (state.age !== previousAge + 1) throw new Error('annual progression skipped or repeated an age');
      assertAnnualInvariants();
    }

    if (state.status !== 'متوفى') throw new Error('life did not reach a terminal state within 107 annual steps');
    if (state.deathCount !== 1) throw new Error('life must enter the death transition exactly once');
    if (state.age > 106 || state.yearCount !== state.age) throw new Error('terminal age counters are inconsistent');
    if (typeof state.cause !== 'string' || !state.cause) throw new Error('terminal life is missing a cause');

    totalAge += state.age;
    minAge = Math.min(minAge, state.age);
    maxAge = Math.max(maxAge, state.age);
    deathCauses[state.cause] = (deathCauses[state.cause] || 0) + 1;

    const profile = profileStats[activeProfile];
    profile.count += 1;
    profile.totalAge += state.age;
    profile.minAge = Math.min(profile.minAge, state.age);
    profile.maxAge = Math.max(profile.maxAge, state.age);

    fingerprint = Math.imul(fingerprint ^ state.age, 16777619) >>> 0;
    fingerprint = Math.imul(fingerprint ^ (Math.round(state.bank / 1000) | 0), 16777619) >>> 0;
    fingerprint = Math.imul(fingerprint ^ (Math.round(state.debt / 1000) | 0), 16777619) >>> 0;
  }

  for (const profile of Object.values(profileStats)) {
    profile.averageAge = Number((profile.totalAge / profile.count).toFixed(2));
    delete profile.totalAge;
  }
  return {
    count,
    minAge,
    maxAge,
    averageAge: Number((totalAge / count).toFixed(2)),
    deathCauses,
    profiles: profileStats,
    fingerprint
  };
}
`;

test('محاكاة 10,000 مسار تقدم سنوي حتمي تتحقق من ثوابت العمر والمال والصحة', { timeout: 120000 }, () => {
  const context = vm.createContext({});
  vm.runInContext(combatRecoverySource + '\n' + propertyOwnershipSource + '\n' + ageSource + '\n' + harnessSource, context, {
    timeout: 120000,
    filename: 'hayah-life-simulation-harness.js'
  });

  const result = vm.runInContext('runCohort(10000)', context, { timeout: 120000 });
  assert.equal(result.count, 10000);
  assert.ok(result.minAge > 0);
  assert.ok(result.maxAge <= 106);
  assert.ok(result.averageAge > 50 && result.averageAge <= 106);
  assert.equal(Object.values(result.deathCauses).reduce((sum, count) => sum + count, 0), 10000);
  for (const profile of Object.values(result.profiles)) {
    assert.equal(profile.count, 2500);
    assert.ok(profile.averageAge > 50 && profile.averageAge <= 106);
    assert.ok(profile.minAge <= profile.maxAge && profile.maxAge <= 106);
  }

  const first = vm.runInContext('runCohort(64)', context, { timeout: 120000 });
  const second = vm.runInContext('runCohort(64)', context, { timeout: 120000 });
  assert.deepEqual(JSON.parse(JSON.stringify(second)), JSON.parse(JSON.stringify(first)),
    'the same seeds and starting profiles must produce the same simulation summary');
});
