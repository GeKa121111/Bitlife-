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
const siblingEconomySource = [
  extractFunction('siblingSafeMoney'),
  extractFunction('siblingSafeSigned'),
  extractFunction('siblingInvestmentHash'),
  extractFunction('siblingInvestmentRiskFor'),
  extractFunction('siblingInvestmentRiskLabel'),
  extractFunction('siblingInvestmentAnnualReturn'),
  extractFunction('siblingEmploymentStateLabel'),
  extractFunction('siblingEmploymentEventLabel'),
  extractFunction('siblingEmploymentDecision'),
  extractFunction('siblingCareerFor'),
  extractFunction('siblingCareerBaseSalary'),
  extractFunction('siblingOwnedPropertyValue'),
  extractFunction('siblingPropertyPrice'),
  extractFunction('siblingPropertyMarketChangeBps'),
  extractFunction('siblingPropertyAnnualUpkeep'),
  extractFunction('siblingPropertyPurchaseDecision'),
  extractFunction('siblingPropertySaleDecision'),
  extractFunction('siblingRentalPropertyPrice'),
  extractFunction('siblingRentalPurchaseDecision'),
  extractFunction('siblingRentalAnnualIncome'),
  extractFunction('siblingRentalArrearsSettlement'),
  extractFunction('ensureSiblingEconomicProfile'),
  extractFunction('advanceSiblingEconomies')
].join('\n');
const propertyOwnershipSource = [
  extractFunction('familyPropertyOwnershipRecords'),
  extractFunction('safeFamilyOwnershipShare'),
  extractFunction('syncFamilyPropertyMarketValue'),
  extractFunction('beneficiaryWalletLedgerTotals'),
  extractFunction('recordBeneficiaryWalletRentalIncome'),
  extractFunction('recordBeneficiaryWalletPropertyExpense'),
  extractFunction('classifyFamilyPropertyRentResult'),
  extractFunction('distributeFamilyPropertyRent'),
  extractFunction('distributeFamilyPropertyExpense'),
  extractFunction('familyPropertyTaxRateBps'),
  extractFunction('formatFamilyPropertyTaxRate'),
  extractFunction('calculateFamilyPropertyAnnualTax'),
  extractFunction('setFamilyPropertyTaxRateBps'),
  extractFunction('familyPropertyInsurancePolicy'),
  extractFunction('setFamilyPropertyInsurancePolicy'),
  extractFunction('calculateFamilyPropertyAnnualInsurancePremium'),
  extractFunction('calculateFamilyPropertyInsuranceClaim'),
  extractFunction('recordFamilyPropertyInsuranceClaim')
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

test('الصيانة والضريبة السنوية للعقار المشترك تتوزعان حسب الملكية دون خصم مزدوج', () => {
  const context = vm.createContext({});
  vm.runInContext(combatRecoverySource + '\n' + propertyOwnershipSource + '\n' + siblingEconomySource + '\n' + ageSource + '\n' + harnessSource, context, {
    timeout: 120000,
    filename: 'hayah-shared-property-upkeep-harness.js'
  });

  const result = vm.runInContext(`(() => {
    state = makeState();
    state.age = 40;
    state.yearCount = 40;
    state.bank = 50000;
    state.place = { unit: 'جنيه' };
    const wallet = {
      id: 'annual-upkeep-wallet',
      beneficiaryId: 'annual-upkeep-sibling',
      kind: 'child',
      currency: 'جنيه',
      openingBalance: 30000,
      supportTotal: 0,
      rentalIncomeTotal: 0,
      propertyExpenseTotal: 0,
      balance: 30000,
      transactions: [{ id: 'annual-upkeep-inheritance', type: 'inheritance', amount: 30000, currency: 'جنيه' }],
      ledgerAuditComplete: true,
      ledgerMismatch: false
    };
    const record = {
      id: 'annual-upkeep-flat',
      familyAssetId: 'annual-upkeep-flat',
      title: 'بيت العائلة',
      currency: 'جنيه',
      marketValue: 1000000,
      upkeep: 20000,
      annualTaxRateBps: 50,
      insurancePolicy: { enabled: true, plan: 'standard', coverageBps: 7500, annualPremiumRateBps: 50, deductible: 3000 },
      encumberedShare: 0,
      auditStatus: 'balanced',
      owners: [
        { beneficiaryId: 'annual-upkeep-active', kind: 'child', status: 'active', share: 0.5 },
        { beneficiaryId: 'annual-upkeep-sibling', kind: 'child', status: 'reserved', share: 0.5 }
      ],
      transactions: []
    };
    const asset = {
      id: 'annual-upkeep-active-share',
      familyAssetId: record.id,
      ownerBeneficiaryId: 'annual-upkeep-active',
      familyAssetOriginalValue: 1000000,
      ownershipShare: 0.5,
      kind: 'property',
      title: 'بيت العائلة',
      value: 500000,
      upkeep: 10000,
      condition: 100
    };
    state.assets = [asset];
    state.legacy = {
      activeBeneficiaryId: 'annual-upkeep-active',
      beneficiaryWallets: [wallet],
      familyPropertyOwnership: [record]
    };
    advanceAge();
    const bankAfterYear = state.bank;
    const walletAfterYear = wallet.balance;
    const taxAssessment = calculateFamilyPropertyAnnualTax(record);
    const insuranceAssessment = calculateFamilyPropertyAnnualInsurancePremium(record);
    const upkeepDuplicate = distributeFamilyPropertyExpense(state.assets[0], 20000, {
      action: 'annual-upkeep',
      reason: 'الصيانة السنوية للعقار'
    });
    const taxDuplicate = distributeFamilyPropertyExpense(state.assets[0], taxAssessment.amount, {
      action: 'annual-property-tax',
      reason: 'الضريبة العقارية السنوية'
    });
    const insuranceDuplicate = distributeFamilyPropertyExpense(state.assets[0], insuranceAssessment.amount, {
      action: 'annual-insurance-premium',
      reason: 'قسط التأمين العقاري السنوي', requireFullPayment: true
    });
    return {
      age: state.age,
      yearCount: state.yearCount,
      bankAfterYear,
      walletAfterYear,
      marketValue: record.marketValue,
      taxRateBps: taxAssessment.rateBps,
      taxAmount: taxAssessment.amount,
      insurancePremiumAmount: insuranceAssessment.amount,
      insurancePremiumPaidYear: record.insurancePremiumPaidYear,
      insurancePremiumPaidLifeId: record.insurancePremiumPaidLifeId,
      propertyExpenseTotal: record.propertyExpenseTotal,
      activePaid: record.propertyExpenseActivePaidTotal,
      walletPaid: record.propertyExpenseWalletPaidTotal,
      expenseTransactions: record.transactions.filter(item => item && item.type === 'property_expense').length,
      upkeepDuplicateReason: upkeepDuplicate.reason,
      taxDuplicateReason: taxDuplicate.reason,
      insuranceDuplicateReason: insuranceDuplicate.reason,
      bankAfterDuplicate: state.bank,
      walletAfterDuplicate: wallet.balance
    };
  })()`, context, { timeout: 120000 });

  assert.equal(result.age, 41);
  assert.equal(result.yearCount, 41);
  assert.equal(result.marketValue, 1025000);
  assert.equal(result.taxRateBps, 50);
  assert.equal(result.taxAmount, 5125);
  assert.equal(result.insurancePremiumAmount, 5125);
  assert.equal(result.insurancePremiumPaidYear, 41);
  assert.equal(result.insurancePremiumPaidLifeId, 'life');
  assert.equal(result.bankAfterYear, 18496, 'the active owner pays only their maintenance, tax, insurance and living shares');
  assert.equal(result.walletAfterYear, 14874, 'the sibling wallet pays only its own maintenance, tax and insurance shares');
  assert.equal(result.propertyExpenseTotal, 30250);
  assert.equal(result.activePaid, 15124);
  assert.equal(result.walletPaid, 15126);
  assert.equal(result.expenseTransactions, 3);
  assert.equal(result.upkeepDuplicateReason, 'duplicate_transaction');
  assert.equal(result.taxDuplicateReason, 'duplicate_transaction');
  assert.equal(result.insuranceDuplicateReason, 'duplicate_transaction');
  assert.equal(result.bankAfterDuplicate, result.bankAfterYear);
  assert.equal(result.walletAfterDuplicate, result.walletAfterYear);
});

test('الضريبة العقارية اختيارية للحفظ القديم وترفض النسب أو سجلات الملكية غير السليمة', () => {
  const context = vm.createContext({});
  vm.runInContext(propertyOwnershipSource, context, { timeout: 10000 });
  const result = vm.runInContext(`(() => {
    const legacy = { auditStatus: 'balanced', marketValue: 1000000 };
    const defaultTax = calculateFamilyPropertyAnnualTax(legacy);
    const configured = setFamilyPropertyTaxRateBps(legacy, 50);
    const assessed = calculateFamilyPropertyAnnualTax(legacy);
    const invalidRate = setFamilyPropertyTaxRateBps(legacy, 201);
    const invalidAuditRecord = { auditStatus: 'needs_review', marketValue: 1000000, annualTaxRateBps: 50 };
    const blockedAssessment = calculateFamilyPropertyAnnualTax(invalidAuditRecord);
    const blockedUpdate = setFamilyPropertyTaxRateBps(invalidAuditRecord, 25);
    return {
      defaultRate: defaultTax.rateBps,
      defaultAmount: defaultTax.amount,
      configuredOk: configured.ok,
      configuredAmount: assessed.amount,
      invalidRateOk: invalidRate.ok,
      retainedRate: legacy.annualTaxRateBps,
      blockedReason: blockedAssessment.reason,
      blockedUpdateReason: blockedUpdate.reason
    };
  })()`, context);
  assert.equal(result.defaultRate, 0);
  assert.equal(result.defaultAmount, 0);
  assert.equal(result.configuredOk, true);
  assert.equal(result.configuredAmount, 5000);
  assert.equal(result.invalidRateOk, false);
  assert.equal(result.retainedRate, 50);
  assert.equal(result.blockedReason, 'ownership_audit_incomplete');
  assert.equal(result.blockedUpdateReason, 'ownership_audit_incomplete');
});



test('الإخوة البالغون يديرون دخلهم ومصروفاتهم ومدخراتهم دون لمس رصيد اللاعب', () => {
  const context = vm.createContext({});
  vm.runInContext(siblingEconomySource + '\n' + harnessSource, context, {
    timeout: 10000,
    filename: 'hayah-sibling-economy-harness.js'
  });
  const result = vm.runInContext(`(() => {
    state = makeState();
    state.age = 30;
    state.yearCount = 24;
    state.place = { unit: 'ج.م' };
    const sibling = {
      id: 'adult-sibling', name: 'أخ تجريبي', relation: 'الأخ/الأخت', age: 30,
      job: 'محاسب', smart: 72, reliability: 80, generosity: 40, money: 50
    };
    const minor = { id: 'minor-sibling', name: 'أخت صغيرة', relation: 'الأخت', age: 17, job: 'طالب' };
    const deceased = { id: 'deceased-sibling', name: 'أخ متوفى', relation: 'الأخ', age: 44, deceased: true };
    const friend = { id: 'friend', name: 'صديق', relation: 'صديق', age: 30 };
    state.family = [sibling, minor, deceased, friend];
    const bankBefore = state.bank;
    const firstCount = advanceSiblingEconomies();
    const first = JSON.parse(JSON.stringify(sibling.economicProfile));
    const duplicateCount = advanceSiblingEconomies();
    const duplicate = JSON.stringify(sibling.economicProfile);
    state.yearCount = 25;
    state.age = 31;
    const secondCount = advanceSiblingEconomies();
    return {
      firstCount, duplicateCount, secondCount, first,
      duplicateUnchanged: duplicate === JSON.stringify(first),
      second: sibling.economicProfile,
      bankBefore, bankAfter: state.bank,
      minorHasProfile: !!minor.economicProfile,
      deceasedHasProfile: !!deceased.economicProfile,
      friendHasProfile: !!friend.economicProfile
    };
  })()`, context, { timeout: 10000 });

  assert.equal(result.firstCount, 1);
  assert.equal(result.duplicateCount, 0);
  assert.equal(result.secondCount, 1);
  assert.ok(result.first.annualIncome > 0);
  assert.ok(result.first.annualExpenses > 0);
  assert.ok(result.first.savings > 0);
  assert.equal(result.first.debt, 0);
  assert.equal(result.first.cumulativeIncome, result.first.annualIncome,
    'legacy siblings receive no retroactive wages when the optional profile is first created');
  assert.equal(result.first.history.length, 1);
  assert.equal(result.first.lastProcessedYear, 24);
  assert.equal(result.duplicateUnchanged, true);
  assert.equal(result.second.history.length, 2);
  assert.ok(result.second.cumulativeIncome > result.first.cumulativeIncome);
  assert.equal(result.second.lastProcessedYear, 25);
  assert.equal(result.bankAfter, result.bankBefore, 'sibling finances must never credit or debit the active player');
  assert.equal(result.minorHasProfile, false);
  assert.equal(result.deceasedHasProfile, false);
  assert.equal(result.friendHasProfile, false);
});

test('ملف الاقتصاد الاختياري يتطبع بأمان عند وجود بيانات قديمة أو تالفة', () => {
  const context = vm.createContext({});
  vm.runInContext(siblingEconomySource + '\n' + harnessSource, context, { timeout: 10000 });
  const result = vm.runInContext(`(() => {
    state = makeState();
    state.yearCount = 50;
    state.place = { unit: 'ج.م' };
    const sibling = {
      id: 'legacy-adult-sibling', relation: 'أخت', age: 45, job: 'طالب', smart: 70,
      economicProfile: { savings: -900, debt: 'غير صالح', rank: 99, investmentBalance: -500, investmentRisk: 'wild', history: [{ year: 49, income: -1 }] }
    };
    state.family = [sibling];
    const profile = ensureSiblingEconomicProfile(sibling);
    return { job: sibling.job, savings: profile.savings, debt: profile.debt, rank: profile.rank,
      investmentBalance: profile.investmentBalance, investmentRisk: profile.investmentRisk,
      history: profile.history, lastProcessedYear: profile.lastProcessedYear };
  })()`, context, { timeout: 10000 });

  assert.equal(result.job, 'محاسب');
  assert.equal(result.savings, 0);
  assert.equal(result.debt, 0);
  assert.equal(result.rank, 6);
  assert.equal(result.investmentBalance, 0);
  assert.equal(result.investmentRisk, 'balanced');
  assert.equal(result.history[0].income, 0);
  assert.equal(result.lastProcessedYear, 49);
});

test('الأشقاء يبنون محافظ مستقلة بعائد سنوي حتمي مع أولوية سداد الديون', () => {
  const context = vm.createContext({});
  vm.runInContext(siblingEconomySource + '\n' + harnessSource, context, { timeout: 10000 });
  const result = vm.runInContext("(() => {\n  state = makeState();\n  state.age = 34;\n  state.yearCount = 70;\n  state.place = { unit: 'ج.م' };\n  const growth = { id: 'sibling-growth', name: 'أخ مستثمر', relation: 'الأخ', age: 34, job: 'مطور', smart: 88, reliability: 85, generosity: 40, personality: 'طموح' };\n  const cautious = { id: 'sibling-cautious', name: 'أخت حذرة', relation: 'الأخت', age: 34, job: 'محاسب', smart: 40, reliability: 40, generosity: 40, personality: 'حذر' };\n  const indebted = { id: 'sibling-indebted', name: 'أخ مدين', relation: 'الأخ', age: 34, job: 'محاسب', smart: 65, reliability: 65, generosity: 50, economicProfile: { version: 1, currency: 'ج.م', yearsWorked: 10, rank: 1, savings: 0, debt: 1000000, annualIncome: 0, annualExpenses: 0, cumulativeIncome: 0, cumulativeExpenses: 0, lastProcessedYear: 69, employmentStatus: 'عليه التزامات', history: [], investmentBalance: 5000, investmentRisk: 'balanced' } };\n  state.family = [growth, cautious, indebted];\n  const bankBefore = state.bank;\n  const firstCount = advanceSiblingEconomies();\n  const first = JSON.parse(JSON.stringify(growth.economicProfile));\n  const duplicateSnapshot = JSON.stringify(growth.economicProfile);\n  const duplicateCount = advanceSiblingEconomies();\n  const duplicateUnchanged = duplicateSnapshot === JSON.stringify(growth.economicProfile);\n  state.yearCount = 71;\n  state.age = 35;\n  const secondCount = advanceSiblingEconomies();\n  const returns = { conservative: siblingInvestmentAnnualReturn(cautious, 71, 'conservative', 100000), balanced: siblingInvestmentAnnualReturn(growth, 71, 'balanced', 100000), growth: siblingInvestmentAnnualReturn(growth, 71, 'growth', 100000), growthRepeat: siblingInvestmentAnnualReturn(growth, 71, 'growth', 100000) };\n  return { firstCount, duplicateCount, secondCount, duplicateUnchanged, first, second: growth.economicProfile, cautious: cautious.economicProfile, indebted: indebted.economicProfile, returns, bankBefore, bankAfter: state.bank };\n})()", context, { timeout: 10000 });
  assert.equal(result.firstCount, 3);
  assert.equal(result.duplicateCount, 0);
  assert.equal(result.secondCount, 3);
  assert.equal(result.duplicateUnchanged, true);
  assert.equal(result.first.investmentReturn, 0, 'a new legacy-compatible portfolio must not receive retroactive returns');
  assert.ok(result.first.investmentContribution > 0);
  assert.ok(result.first.investmentBalance > 0);
  assert.equal(result.first.investmentRisk, 'growth');
  assert.equal(result.cautious.investmentRisk, 'conservative');
  assert.equal(result.indebted.investmentContribution, 0, 'siblings with remaining debt do not start new contributions');
  assert.ok(result.indebted.debt > 0);
  assert.equal(result.second.investmentBalance, Math.max(0, result.first.investmentBalance + result.second.investmentReturn + result.second.investmentContribution));
  assert.equal(result.second.netWorth, result.second.savings + result.second.investmentBalance - result.second.debt);
  assert.equal(result.returns.growth, result.returns.growthRepeat, 'the same sibling and year must receive the same simulated market return');
  assert.ok(result.returns.conservative >= -2500 && result.returns.conservative <= 6000);
  assert.ok(result.returns.balanced >= -7000 && result.returns.balanced <= 10000);
  assert.ok(result.returns.growth >= -13000 && result.returns.growth <= 15000);
  assert.equal(result.bankAfter, result.bankBefore, 'sibling investment portfolios must never change the active player bank');
});
test('سجل السنوات القديمة لا يرث حالة البطالة الحالية بأثر رجعي', () => {
  const context = vm.createContext({});
  vm.runInContext(siblingEconomySource + '\n' + harnessSource, context, { timeout: 10000 });
  const result = vm.runInContext([
    '(() => {',
    ' state = makeState();',
    ' state.yearCount = 55;',
    " state.place = { unit: 'ج.م' };",
    " const sibling = { id: 'legacy-employment-history', relation: 'الأخت', age: 45, job: 'محاسبة', economicProfile: { employmentState: 'seeking', lastProcessedYear: 54, history: [{ year: 54, age: 44, job: 'محاسبة', income: 90000, expenses: 50000, savings: 20000, debt: 0 }] } };",
    ' return ensureSiblingEconomicProfile(sibling);',
    '})()'
  ].join('\n'), context, { timeout: 10000 });
  assert.equal(result.employmentState, 'seeking');
  assert.equal(result.history[0].employmentState, 'working');
  assert.equal(result.history[0].employmentEvent, '');
});

test('فقدان الوظيفة يوقف دخل الشقيق مؤقتًا ويسجل العجز دون المساس ببنك اللاعب', () => {
  const context = vm.createContext({});
  vm.runInContext(siblingEconomySource + '\n' + harnessSource, context, { timeout: 10000 });
  const result = vm.runInContext([
    '(() => {',
    ' state = makeState();',
    ' state.yearCount = 100;',
    " state.place = { unit: 'ج.م' };",
    " const sibling = { id: 'job-loss-test', name: 'أخ فقد عمله', relation: 'الأخ', age: 40, job: 'محاسب', smart: 55, reliability: 20, economicProfile: { version: 1, currency: 'ج.م', yearsWorked: 10, rank: 1, savings: 0, debt: 0, investmentBalance: 0, investmentContribution: 0, investmentReturn: 0, investmentContributionsTotal: 0, investmentReturnsTotal: 0, investmentRisk: 'balanced', annualIncome: 0, annualExpenses: 0, cumulativeIncome: 0, cumulativeExpenses: 0, lastProcessedYear: 99, employmentStatus: 'مستقر', employmentState: 'working', history: [] } };",
    ' state.family = [sibling];',
    ' const bankBefore = state.bank;',
    ' const firstCount = advanceSiblingEconomies();',
    ' const first = JSON.parse(JSON.stringify(sibling.economicProfile));',
    ' const snapshot = JSON.stringify(first);',
    ' const duplicateCount = advanceSiblingEconomies();',
    ' return { firstCount, duplicateCount, first, unchanged: snapshot === JSON.stringify(sibling.economicProfile), bankBefore, bankAfter: state.bank };',
    '})()'
  ].join('\n'), context, { timeout: 10000 });
  assert.equal(result.firstCount, 1);
  assert.equal(result.first.employmentState, 'seeking');
  assert.equal(result.first.lastEmploymentEvent, 'laid_off');
  assert.equal(result.first.annualIncome, 0);
  assert.ok(result.first.annualExpenses > 0);
  assert.ok(result.first.debt > 0, 'living costs during unemployment become debt after savings run out');
  assert.equal(result.first.investmentContribution, 0);
  assert.equal(result.first.history[0].employmentEvent, 'laid_off');
  assert.equal(result.duplicateCount, 0);
  assert.equal(result.unchanged, true);
  assert.equal(result.bankAfter, result.bankBefore);
});

test('الشقيق العاطل قد يعود للعمل بدخل جزئي في سنة التعيين دون احتساب خبرة سنة كاملة', () => {
  const context = vm.createContext({});
  vm.runInContext(siblingEconomySource + '\n' + harnessSource, context, { timeout: 10000 });
  const result = vm.runInContext([
    '(() => {',
    ' state = makeState();',
    ' state.yearCount = 25;',
    " state.place = { unit: 'ج.م' };",
    " const sibling = { id: 'sibling-job-rehire', name: 'أخ عاد للعمل', relation: 'الأخ', age: 35, job: 'مطور', smart: 90, reliability: 90, economicProfile: { version: 1, currency: 'ج.م', yearsWorked: 20, rank: 1, savings: 10000, debt: 0, investmentBalance: 0, investmentContribution: 0, investmentReturn: 0, investmentContributionsTotal: 0, investmentReturnsTotal: 0, investmentRisk: 'balanced', annualIncome: 0, annualExpenses: 0, cumulativeIncome: 0, cumulativeExpenses: 0, lastProcessedYear: 24, employmentStatus: 'مستقر', employmentState: 'seeking', history: [] } };",
    ' state.family = [sibling];',
    ' const bankBefore = state.bank;',
    ' const processed = advanceSiblingEconomies();',
    ' const first = JSON.parse(JSON.stringify(sibling.economicProfile));',
    ' const snapshot = JSON.stringify(first);',
    ' const duplicate = advanceSiblingEconomies();',
    " const fullIncome = Math.round(siblingCareerBaseSalary('مطور') * (1 + Math.min(.75, 20 * .025)) * (.86 + 90 / 400) * (.9 + 90 / 1000));",
    ' return { processed, first, duplicate, unchanged: snapshot === JSON.stringify(sibling.economicProfile), fullIncome, bankBefore, bankAfter: state.bank };',
    '})()'
  ].join('\n'), context, { timeout: 10000 });
  assert.equal(result.processed, 1);
  assert.equal(result.first.employmentState, 'working');
  assert.equal(result.first.lastEmploymentEvent, 'rehired');
  assert.equal(result.first.annualIncome, Math.round(result.fullIncome * .5));
  assert.equal(result.first.yearsWorked, 20);
  assert.equal(result.first.history[0].employmentEvent, 'rehired');
  assert.equal(result.duplicate, 0);
  assert.equal(result.unchanged, true);
  assert.equal(result.bankAfter, result.bankBefore);
});

test('سن التقاعد ينقل الشقيق إلى معاش محاكي ولا يضيف سنوات خبرة جديدة', () => {
  const context = vm.createContext({});
  vm.runInContext(siblingEconomySource + '\n' + harnessSource, context, { timeout: 10000 });
  const result = vm.runInContext([
    '(() => {',
    ' state = makeState();',
    ' state.yearCount = 70;',
    " state.place = { unit: 'ج.م' };",
    " const sibling = { id: 'sibling-retire-test', name: 'أخت متقاعدة', relation: 'الأخت', age: 65, job: 'مدرس', smart: 65, reliability: 75, economicProfile: { version: 1, currency: 'ج.م', yearsWorked: 30, rank: 3, savings: 50000, debt: 0, investmentBalance: 10000, investmentContribution: 0, investmentReturn: 0, investmentContributionsTotal: 0, investmentReturnsTotal: 0, investmentRisk: 'conservative', annualIncome: 0, annualExpenses: 0, cumulativeIncome: 0, cumulativeExpenses: 0, lastProcessedYear: 69, employmentStatus: 'مستقر', employmentState: 'working', history: [] } };",
    ' state.family = [sibling];',
    ' advanceSiblingEconomies();',
    ' return { profile: sibling.economicProfile, stateLabel: siblingEmploymentStateLabel(sibling.economicProfile.employmentState) };',
    '})()'
  ].join('\n'), context, { timeout: 10000 });
  assert.equal(result.profile.employmentState, 'retired');
  assert.equal(result.profile.lastEmploymentEvent, 'retired');
  assert.equal(result.profile.yearsWorked, 30);
  assert.ok(result.profile.annualIncome > 0);
  assert.equal(result.profile.history[0].employmentEvent, 'retired');
  assert.equal(result.stateLabel, 'متقاعد');
});

test('محاكاة 10,000 مسار تقدم سنوي حتمي تتحقق من ثوابت العمر والمال والصحة', { timeout: 120000 }, () => {
  const context = vm.createContext({});
  vm.runInContext(combatRecoverySource + '\n' + propertyOwnershipSource + '\n' + siblingEconomySource + '\n' + ageSource + '\n' + harnessSource, context, {
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

test('الأشقاء يشترون مسكنًا مستقلًا من مدخراتهم ويُحتسب في صافي ثروتهم دون المساس باللاعب', () => {
  const context = vm.createContext({});
  vm.runInNewContext(siblingEconomySource + String.fromCharCode(10) + harnessSource, context, { timeout: 10000 });
  const result = vm.runInContext([
    '(() => {',
    ' state = makeState();',
    " state.place = { unit: 'ج.م' };",
    " const profile = { version: 1, currency: 'ج.م', yearsWorked: 10, rank: 1, savings: 900000, debt: 0, investmentBalance: 0, investmentContribution: 0, investmentReturn: 0, investmentContributionsTotal: 0, investmentReturnsTotal: 0, investmentRisk: 'balanced', annualIncome: 0, annualExpenses: 0, cumulativeIncome: 0, cumulativeExpenses: 0, lastProcessedYear: 0, employmentStatus: 'مستقر', employmentState: 'working', history: [], ownedProperties: [] };",
    " const sibling = { id: 'sibling-home-purchase-test', name: 'أخ يشتري مسكنًا', relation: 'الأخ', age: 35, job: 'مطور', smart: 90, reliability: 95, generosity: 40, economicProfile: profile };",
    ' let year = 1;',
    ' while (year < 300) {',
    '  const employment = siblingEmploymentDecision(sibling, profile, year, sibling.age);',
    '  const decision = siblingPropertyPurchaseDecision(sibling, profile, year, sibling.age, profile.savings, profile.debt, employment.state);',
    "  if (employment.state === 'working' && decision) break;",
    '  year++;',
    ' }',
    ' state.yearCount = year;',
    ' state.age = sibling.age;',
    ' profile.lastProcessedYear = year - 1;',
    ' state.family = [sibling];',
    ' const bankBefore = state.bank;',
    ' const processed = advanceSiblingEconomies();',
    ' const after = JSON.parse(JSON.stringify(profile));',
    ' const duplicate = advanceSiblingEconomies();',
    ' return { year, processed, duplicate, after, bankBefore, bankAfter: state.bank, propertyValue: siblingOwnedPropertyValue(profile) };',
    '})()'
  ].join(String.fromCharCode(10)), context, { timeout: 10000 });
  assert.ok(result.year < 300, 'a financially stable adult sibling should eventually choose a home');
  assert.equal(result.processed, 1);
  assert.equal(result.duplicate, 0);
  assert.equal(result.after.ownedProperties.length, 1);
  assert.equal(result.after.ownedProperties[0].kind, 'residence');
  assert.equal(result.after.ownedProperties[0].purchaseYear, result.year);
  assert.equal(result.after.propertyPurchasesTotal, result.after.ownedProperties[0].purchasePrice);
  assert.ok(result.after.savings >= 50000, 'the purchase must preserve an emergency cash reserve');
  assert.equal(result.after.netWorth, result.after.savings + result.after.investmentBalance + result.propertyValue - result.after.debt);
  assert.equal(result.after.history[0].propertyPurchase, true);
  assert.equal(result.bankAfter, result.bankBefore, 'sibling property purchases must not debit the active player');
});

test('صيانة مسكن الشقيق وتغير قيمته يُحتسبان مرة واحدة في السنة', () => {
  const context = vm.createContext({});
  vm.runInNewContext(siblingEconomySource + String.fromCharCode(10) + harnessSource, context, { timeout: 10000 });
  const result = vm.runInContext([
    '(() => {',
    ' state = makeState();',
    ' state.yearCount = 40;',
    ' state.age = 40;',
    " state.place = { unit: 'ج.م' };",
    " const sibling = { id: 'sibling-home-upkeep-test', name: 'أخت مالكة لمسكن', relation: 'الأخت', age: 40, job: 'محاسب', smart: 70, reliability: 100, generosity: 40, economicProfile: { version: 1, currency: 'ج.م', yearsWorked: 15, rank: 2, savings: 250000, debt: 0, investmentBalance: 0, investmentContribution: 0, investmentReturn: 0, investmentContributionsTotal: 0, investmentReturnsTotal: 0, investmentRisk: 'balanced', annualIncome: 0, annualExpenses: 0, cumulativeIncome: 0, cumulativeExpenses: 0, lastProcessedYear: 39, employmentStatus: 'مستقر', employmentState: 'working', propertyExpensesAnnual: 0, propertyPurchasesTotal: 200000, ownedProperties: [{ id: 'sibling-home-upkeep-test-home', kind: 'residence', label: 'شقة مستقلة', purchaseYear: 25, purchasePrice: 200000, marketValue: 300000, annualUpkeepRateBps: 120, lastMarketYear: 39 }], history: [] } };",
    ' const original = JSON.parse(JSON.stringify(sibling.economicProfile.ownedProperties[0]));',
    ' const changeBps = siblingPropertyMarketChangeBps(sibling, 40, original);',
    ' const expectedValue = Math.max(0, Math.round(original.marketValue * (10000 + changeBps) / 10000));',
    ' const expectedUpkeep = siblingPropertyAnnualUpkeep({ ...original, marketValue: expectedValue });',
    ' state.family = [sibling];',
    ' const bankBefore = state.bank;',
    ' const processed = advanceSiblingEconomies();',
    ' const snapshot = JSON.stringify(sibling.economicProfile);',
    ' const duplicate = advanceSiblingEconomies();',
    ' return { processed, duplicate, profile: sibling.economicProfile, snapshot, afterDuplicate: JSON.stringify(sibling.economicProfile), expectedValue, expectedUpkeep, bankBefore, bankAfter: state.bank };',
    '})()'
  ].join(String.fromCharCode(10)), context, { timeout: 10000 });
  assert.equal(result.processed, 1);
  assert.equal(result.duplicate, 0);
  assert.equal(result.profile.ownedProperties[0].marketValue, result.expectedValue);
  assert.equal(result.profile.propertyExpensesAnnual, result.expectedUpkeep);
  assert.equal(result.profile.history[0].propertyExpenses, result.expectedUpkeep);
  assert.ok(result.profile.annualExpenses >= result.expectedUpkeep);
  assert.equal(result.profile.netWorth, result.profile.savings + result.profile.investmentBalance + result.expectedValue - result.profile.debt);
  assert.equal(result.snapshot, result.afterDuplicate, 'retrying the same year must not revalue or charge upkeep twice');
  assert.equal(result.bankAfter, result.bankBefore);
});

test('بيع مسكن الشقيق لا يحدث إلا بعد استمرار البطالة ويغطي الالتزامات قبل تسجيل دين جديد', () => {
  const context = vm.createContext({});
  vm.runInNewContext(siblingEconomySource + String.fromCharCode(10) + harnessSource, context, { timeout: 10000 });
  const result = vm.runInContext([
    '(() => {',
    ' state = makeState();',
    ' state.yearCount = 40;',
    ' state.age = 40;',
    ' state.bank = 750000;',
    " state.place = { unit: 'ج.م' }; ",
    " let siblingId = 'sibling-distress-sale';",
    ' while (siblingInvestmentHash(siblingId + \'|employment|40|rehire\') % 10000 < 3320) siblingId += \'x\';',
    " const asset = { id: 'sibling-distress-home', kind: 'residence', label: 'مسكن مستقل', purchaseYear: 25, purchasePrice: 180000, marketValue: 200000, annualUpkeepRateBps: 120, lastMarketYear: 39 }; ",
    ' const profile = { version: 1, currency: \'ج.م\', yearsWorked: 0, rank: 1, savings: 0, debt: 10000, investmentBalance: 0, investmentContribution: 0, investmentReturn: 0, investmentContributionsTotal: 0, investmentReturnsTotal: 0, investmentRisk: \'conservative\', ownedProperties: [asset], propertyExpensesAnnual: 0, propertyPurchasesTotal: 180000, propertySalesTotal: 0, propertySaleCostsTotal: 0, annualIncome: 0, annualExpenses: 0, cumulativeIncome: 0, cumulativeExpenses: 0, lastProcessedYear: 39, employmentStatus: \'باحث عن عمل\', employmentState: \'seeking\', history: [{ year: 39, age: 39, job: \'محاسب\', income: 0, expenses: 15000, savings: 0, debt: 10000, investmentBalance: 0, investmentContribution: 0, investmentReturn: 0, investmentRisk: \'conservative\', propertyValue: 200000, propertyExpenses: 2400, propertyCount: 1, propertyPurchase: false, employmentState: \'seeking\', employmentEvent: \'laid_off\', netWorth: 190000 }] };',
    " const sibling = { id: siblingId, name: 'أخ يواجه بطالة طويلة', relation: 'الأخ', age: 40, job: 'محاسب', smart: 10, reliability: 10, generosity: 50, economicProfile: profile }; ",
    " const firstYearProfile = { ...profile, history: [{ year: 39, employmentState: 'working' }] }; ",
    " const firstYearDecision = siblingPropertySaleDecision(sibling, firstYearProfile, 40, 40, 'seeking', 20000); ",
    " const coveredDeficitDecision = siblingPropertySaleDecision(sibling, profile, 40, 40, 'seeking', 0); ",
    " const gapYearDecision = siblingPropertySaleDecision(sibling, { ...profile, history: [{ year: 38, employmentState: 'seeking' }] }, 40, 40, 'seeking', 20000);",
    ' const expectedValue = Math.max(0, Math.round(asset.marketValue * (10000 + siblingPropertyMarketChangeBps(sibling, 40, asset)) / 10000));',
    ' const expectedUpkeep = siblingPropertyAnnualUpkeep({ ...asset, marketValue: expectedValue });',
    ' const expectedExpenses = 9000 + 40 * 110 + expectedUpkeep;',
    ' const expectedCost = Math.round(expectedValue * 0.05);',
    ' const expectedNet = expectedValue - expectedCost;',
    ' const expectedRetained = expectedNet - 10000 - expectedExpenses;',
    ' state.family = [sibling];',
    ' const bankBefore = state.bank;',
    ' const processed = advanceSiblingEconomies();',
    ' const after = JSON.parse(JSON.stringify(profile));',
    ' const snapshot = JSON.stringify(profile);',
    ' const duplicate = advanceSiblingEconomies();',
    ' return { processed, duplicate, after, snapshot, afterDuplicate: JSON.stringify(profile), bankBefore, bankAfter: state.bank, firstYearDecision, coveredDeficitDecision, gapYearDecision, expectedValue, expectedUpkeep, expectedExpenses, expectedCost, expectedNet, expectedRetained };',
    '})()'
  ].join(String.fromCharCode(10)), context, { timeout: 10000 });
  assert.equal(result.firstYearDecision, null, 'one year of unemployment alone must not force a home sale');
  assert.equal(result.coveredDeficitDecision, null, 'a home must not be sold when savings cover the deficit');
  assert.equal(result.gapYearDecision, null, 'non-consecutive unemployment records must not trigger a forced sale');
  assert.equal(result.processed, 1);
  assert.equal(result.duplicate, 0);
  assert.equal(result.after.ownedProperties.length, 0, 'the home should be liquidated after a second consecutive year of unemployment and an uncovered deficit');
  assert.equal(result.after.debt, 0, 'sale proceeds should clear existing debt before any new debt is recorded');
  assert.equal(result.after.employmentStatus, 'باحث عن عمل', 'selling the home must not incorrectly mark an unemployed sibling as financially stable');
  assert.equal(result.after.savings, result.expectedRetained, 'remaining proceeds should cover this year\'s deficit and become savings');
  assert.equal(result.after.propertyExpensesAnnual, result.expectedUpkeep, 'the current year\'s upkeep remains recorded because it accrued before the sale');
  assert.equal(result.after.annualExpenses, result.expectedExpenses);
  assert.equal(result.after.propertySalesTotal, result.expectedValue);
  assert.equal(result.after.propertySaleCostsTotal, result.expectedCost);
  assert.equal(result.after.netWorth, result.expectedRetained);
  const saleYear = result.after.history[result.after.history.length - 1];
  assert.equal(saleYear.propertySale, true);
  assert.equal(saleYear.propertySaleGross, result.expectedValue);
  assert.equal(saleYear.propertySaleCosts, result.expectedCost);
  assert.equal(saleYear.propertySaleNet, result.expectedNet);
  assert.equal(saleYear.propertySaleDebtPaid, 10000);
  assert.equal(saleYear.propertySaleShortfallPaid, result.expectedExpenses);
  assert.equal(saleYear.propertySaleCashRetained, result.expectedRetained);
  assert.equal(result.bankAfter, result.bankBefore, 'the active player\'s bank must remain untouched');
  assert.equal(result.snapshot, result.afterDuplicate, 'retrying the same year must not sell or charge the home twice');
});


test('الأشقاء يشترون عقارًا استثماريًا ويحصّلون إيجارًا مع احتساب الشغور وتأخر السداد مرة واحدة سنويًا', () => {
  const context = vm.createContext({});
  vm.runInNewContext(siblingEconomySource + String.fromCharCode(10) + harnessSource, context, { timeout: 10000 });
  const result = vm.runInContext([
    '(() => {',
    ' state = makeState();',
    ' state.yearCount = 40;',
    ' state.age = 40;',
    ' state.bank = 900000;',
    " state.place = { unit: 'ج.م' };",
    " let siblingId = 'rental-investor';",
    " const residence = { id: 'sibling-primary-home', kind: 'residence', label: 'مسكن مستقل', purchaseYear: 30, purchasePrice: 240000, marketValue: 250000, annualUpkeepRateBps: 120, lastMarketYear: 39 };",
    " const profile = { version: 1, currency: 'ج.م', job: 'محاسب', yearsWorked: 12, rank: 2, savings: 700000, debt: 0, investmentBalance: 0, investmentContribution: 0, investmentReturn: 0, investmentContributionsTotal: 0, investmentReturnsTotal: 0, investmentRisk: 'balanced', ownedProperties: [residence], propertyExpensesAnnual: 0, propertyPurchasesTotal: 240000, propertySalesTotal: 0, propertySaleCostsTotal: 0, annualIncome: 0, annualExpenses: 0, cumulativeIncome: 0, cumulativeExpenses: 0, lastProcessedYear: 39, employmentStatus: 'مستقر', employmentState: 'working', lastEmploymentEvent: '', history: [{ year: 39, age: 39, job: 'محاسب', income: 100000, expenses: 70000, savings: 700000, debt: 0, employmentState: 'working' }] };",
    " const sibling = { id: siblingId, name: 'مستثمر العائلة', relation: 'الأخ', age: 40, job: 'محاسب', smart: 80, reliability: 80, generosity: 50, economicProfile: profile };",
    " const projectedRental = { id: 'sibling-rental-' + siblingInvestmentHash(siblingId).toString(36), kind: 'rental', monthlyRent: Math.round(siblingRentalPropertyPrice(sibling) * .005), lastRentYear: 40 };",
    " while (siblingEmploymentDecision(sibling, profile, 40, 40).state !== 'working' || siblingEmploymentDecision(sibling, profile, 41, 41).state !== 'working' || !siblingRentalPurchaseDecision(sibling, profile, 40, 40, profile.savings, profile.debt, 'working') || siblingRentalAnnualIncome(sibling, 41, projectedRental).totalLoss <= 0) { siblingId += 'x'; sibling.id = siblingId; projectedRental.id = 'sibling-rental-' + siblingInvestmentHash(siblingId).toString(36); }",
    ' state.family = [sibling];',
    ' const bankBefore = state.bank;',
    ' const firstProcessed = advanceSiblingEconomies();',
    " const rental = profile.ownedProperties.find(asset => asset.kind === 'rental');",
    ' const afterPurchase = { savings: profile.savings, count: profile.ownedProperties.length, rental: rental && JSON.parse(JSON.stringify(rental)), rentIncome: profile.annualRentIncome, purchaseTotal: profile.propertyPurchasesTotal };',
    ' state.yearCount = 41;',
    ' sibling.age = 41;',
    ' // The sibling identity and rental asset ID stay stable after acquisition.',
    ' const expectedRent = siblingRentalAnnualIncome(sibling, 41, rental);',
    ' const secondProcessed = advanceSiblingEconomies();',
    ' const secondYear = profile.history[profile.history.length - 1];',
    ' const snapshot = JSON.stringify(profile);',
    ' const duplicate = advanceSiblingEconomies();',
    ' return { firstProcessed, secondProcessed, duplicate, afterPurchase, profile, rental, expectedRent, secondYear, snapshot, afterDuplicate: JSON.stringify(profile), bankBefore, bankAfter: state.bank };',
    '})()'
  ].join(String.fromCharCode(10)), context, { timeout: 10000 });
  assert.equal(result.firstProcessed, 1);
  assert.equal(result.afterPurchase.count, 2);
  assert.ok(result.afterPurchase.rental);
  assert.equal(result.afterPurchase.rental.kind, 'rental');
  assert.ok(result.afterPurchase.rental.monthlyRent > 0);
  assert.equal(result.afterPurchase.rentIncome, 0, 'a rental bought during the year must not earn retroactive rent');
  assert.equal(result.afterPurchase.purchaseTotal, 240000 + result.afterPurchase.rental.purchasePrice, 'the cumulative property purchase total should include the rental asset');
  assert.equal(result.secondProcessed, 1);
  assert.equal(result.expectedRent.collected, result.profile.annualRentIncome);
  assert.equal(result.expectedRent.totalLoss, result.profile.rentalLossTotal);
  assert.ok(result.profile.annualRentIncome > 0);
  assert.ok(result.profile.rentalLossTotal > 0, 'vacancy and collection loss should be visible in the simulation');
  assert.equal(result.secondYear.rentIncome, result.expectedRent.collected);
  assert.equal(result.secondYear.rentLoss, result.expectedRent.totalLoss);
  assert.equal(result.profile.annualIncome, result.secondYear.income);
  assert.equal(result.profile.netWorth, result.profile.savings + result.profile.investmentBalance + result.profile.ownedProperties.reduce((sum, asset) => sum + asset.marketValue, 0) - result.profile.debt);
  assert.equal(result.duplicate, 0);
  assert.equal(result.snapshot, result.afterDuplicate, 'the same year must not collect rent or charge upkeep twice');
  assert.equal(result.bankAfter, result.bankBefore);
});


test('متأخرات الإيجار تُحصّل تدريجيًا وتُسجل دون مضاعفة الدخل أو تغيير بنك اللاعب', () => {
  const context = vm.createContext({});
  vm.runInNewContext(siblingEconomySource + String.fromCharCode(10) + harnessSource, context, { timeout: 10000 });
  const result = vm.runInContext([
    '(() => {',
    ' state = makeState(); state.yearCount = 41; state.age = 41; state.bank = 900000; state.place = { unit: "ج.م" }; setSeed(91);',
    " let siblingId = 'arrears-collector';",
    " const residence = { id: 'arrears-primary-home', kind: 'residence', purchaseYear: 30, purchasePrice: 240000, marketValue: 250000, annualUpkeepRateBps: 120, lastMarketYear: 40 };",
    " const rental = { id: 'arrears-rental', kind: 'rental', purchaseYear: 35, purchasePrice: 200000, marketValue: 250000, annualUpkeepRateBps: 180, lastMarketYear: 40, monthlyRent: 1500, lastRentYear: 40, rentArrears: 10000, rentArrearsAddedTotal: 10000, rentArrearsCollectedTotal: 0 };",
    " const profile = { version: 1, currency: 'ج.م', job: 'محاسب', yearsWorked: 12, rank: 2, savings: 700000, debt: 0, investmentBalance: 0, investmentContribution: 0, investmentReturn: 0, investmentContributionsTotal: 0, investmentReturnsTotal: 0, investmentRisk: 'balanced', ownedProperties: [residence, rental], propertyExpensesAnnual: 0, propertyPurchasesTotal: 440000, propertySalesTotal: 0, propertySaleCostsTotal: 0, annualIncome: 0, annualExpenses: 0, cumulativeIncome: 0, cumulativeExpenses: 0, lastProcessedYear: 40, employmentStatus: 'مستقر', employmentState: 'working', lastEmploymentEvent: '', history: [{ year: 40, age: 40, job: 'محاسب', income: 100000, expenses: 70000, savings: 700000, debt: 0, employmentState: 'working' }] };",
    " const sibling = { id: siblingId, name: 'محصل الإيجار', relation: 'الأخ', age: 41, job: 'محاسب', smart: 85, reliability: 90, generosity: 50, economicProfile: profile };",
    " let guard = 0;",
    " while ((siblingEmploymentDecision(sibling, profile, 41, 41).state !== 'working' || !siblingRentalAnnualIncome(sibling, 41, rental) || !siblingRentalArrearsSettlement(sibling, 41, rental) || siblingRentalArrearsSettlement(sibling, 41, rental).collected <= 0) && guard < 1000) { siblingId += 'x'; sibling.id = siblingId; rental.id = 'arrears-rental-' + siblingInvestmentHash(siblingId).toString(36); guard += 1; }",
    " const expectedRent = siblingRentalAnnualIncome(sibling, 41, rental);",
    " const expectedRecovery = siblingRentalArrearsSettlement(sibling, 41, rental);",
    ' state.family = [sibling]; const bankBefore = state.bank;',
    ' const processed = advanceSiblingEconomies();',
    ' const year = profile.history[profile.history.length - 1];',
    " const rentalAfter = profile.ownedProperties.find(asset => asset.kind === 'rental');",
    " const sameYearSettlement = siblingRentalArrearsSettlement({ id: 'same-year' }, 41, { kind: 'rental', lastRentYear: 41, rentArrears: 5000 });",
    ' const snapshot = JSON.stringify(profile); const duplicate = advanceSiblingEconomies();',
    ' return { guard, processed, expectedRent, expectedRecovery, sameYearSettlement, rental: rentalAfter, profile, year, snapshot, afterDuplicate: JSON.stringify(profile), bankBefore, bankAfter: state.bank, duplicate };',
    '})()'
  ].join(String.fromCharCode(10)), context, { timeout: 10000 });
  assert.ok(result.guard < 1000, 'the deterministic fixture should find a working sibling with collectible arrears');
  assert.equal(result.processed, 1);
  assert.equal(result.profile.annualRentIncome, result.expectedRent.collected + result.expectedRecovery.collected);
  assert.equal(result.rental.rentArrears, result.expectedRecovery.closingArrears + result.expectedRent.collectionLoss);
  assert.equal(result.profile.rentalArrearsCollectedTotal, result.expectedRecovery.collected);
  assert.equal(result.profile.rentalArrearsAddedTotal, result.expectedRent.collectionLoss);
  assert.equal(result.profile.rentalArrearsBalance, result.rental.rentArrears);
  assert.equal(result.year.rentArrearsCollected, result.expectedRecovery.collected);
  assert.equal(result.year.rentArrearsAdded, result.expectedRent.collectionLoss);
  assert.equal(result.year.rentArrearsBalance, result.rental.rentArrears);
  assert.equal(result.profile.netWorth, result.profile.savings + result.profile.investmentBalance + result.profile.ownedProperties.reduce((sum, asset) => sum + asset.marketValue, 0) - result.profile.debt, 'uncollected arrears must not be counted as realized net worth');
  assert.equal(result.sameYearSettlement, null);
  assert.equal(result.duplicate, 0);
  assert.equal(result.snapshot, result.afterDuplicate, 'retrying the same year must not recover arrears or record rent twice');
  assert.equal(result.bankAfter, result.bankBefore, 'the active player bank must remain untouched');
});

test('بيع العقار الاستثماري يشطب المتأخرات غير المحصلة ولا يترك رصيدًا وهميًا', () => {
  const context = vm.createContext({});
  vm.runInNewContext(siblingEconomySource + String.fromCharCode(10) + harnessSource, context, { timeout: 10000 });
  const result = vm.runInContext([
    '(() => {',
    ' state = makeState(); state.yearCount = 42; state.age = 42; state.bank = 50000; state.place = { unit: "ج.م" }; setSeed(17);',
    " let siblingId = 'arrears-writeoff';",
    " const residence = { id: 'writeoff-home', kind: 'residence', purchaseYear: 30, purchasePrice: 180000, marketValue: 180000, annualUpkeepRateBps: 120, lastMarketYear: 41 };",
    " const rental = { id: 'writeoff-rental', kind: 'rental', purchaseYear: 35, purchasePrice: 200000, marketValue: 200000, annualUpkeepRateBps: 180, lastMarketYear: 41, monthlyRent: 500, lastRentYear: 41, rentArrears: 20000, rentArrearsAddedTotal: 20000, rentArrearsCollectedTotal: 0 };",
    " const profile = { version: 1, currency: 'ج.م', job: 'محاسب', yearsWorked: 10, rank: 1, savings: 0, debt: 0, investmentBalance: 0, investmentContribution: 0, investmentReturn: 0, investmentContributionsTotal: 0, investmentReturnsTotal: 0, investmentRisk: 'conservative', ownedProperties: [residence, rental], propertyExpensesAnnual: 0, propertyPurchasesTotal: 380000, propertySalesTotal: 0, propertySaleCostsTotal: 0, annualIncome: 0, annualExpenses: 0, cumulativeIncome: 0, cumulativeExpenses: 0, lastProcessedYear: 41, employmentStatus: 'باحث عن عمل', employmentState: 'seeking', lastEmploymentEvent: '', history: [{ year: 41, age: 41, job: 'محاسب', income: 0, expenses: 20000, savings: 0, debt: 0, employmentState: 'seeking' }] };",
    " const sibling = { id: siblingId, name: 'مالك متعثر', relation: 'الأخ', age: 42, job: 'محاسب', smart: 0, reliability: 0, generosity: 50, economicProfile: profile };",
    " let guard = 0;",
    " while (siblingEmploymentDecision(sibling, profile, 42, 42).state !== 'seeking' && guard < 1000) { siblingId += 'x'; sibling.id = siblingId; rental.id = 'writeoff-rental-' + siblingInvestmentHash(siblingId).toString(36); guard += 1; }",
    ' state.family = [sibling]; const bankBefore = state.bank;',
    ' const processed = advanceSiblingEconomies();',
    ' const year = profile.history[profile.history.length - 1];',
    ' const snapshot = JSON.stringify(profile); const duplicate = advanceSiblingEconomies();',
    ' return { guard, processed, profile, year, snapshot, afterDuplicate: JSON.stringify(profile), bankBefore, bankAfter: state.bank, duplicate };',
    '})()'
  ].join(String.fromCharCode(10)), context, { timeout: 10000 });
  assert.ok(result.guard < 1000, 'the deterministic fixture should remain unemployed for the second consecutive year');
  assert.equal(result.processed, 1);
  assert.equal(result.year.propertySale, true);
  assert.equal(result.year.propertySaleKind, 'rental');
  assert.ok(result.year.rentArrearsWrittenOff > 0);
  assert.equal(result.profile.rentalArrearsWrittenOffTotal, result.year.rentArrearsWrittenOff);
  assert.equal(result.profile.rentalArrearsBalance, 0);
  assert.equal(result.profile.ownedProperties.some(asset => asset.kind === 'rental'), false);
  assert.equal(result.profile.ownedProperties.some(asset => asset.kind === 'residence'), true);
  assert.equal(result.duplicate, 0);
  assert.equal(result.snapshot, result.afterDuplicate);
  assert.equal(result.bankAfter, result.bankBefore);
});

test('الحفظ القديم يطبع متأخرات العقار الاستثماري المفقودة إلى صفر دون دخل رجعي', () => {
  const context = vm.createContext({});
  vm.runInNewContext(siblingEconomySource + String.fromCharCode(10) + harnessSource, context, { timeout: 10000 });
  const result = vm.runInContext([
    '(() => {',
    ' state = makeState(); state.yearCount = 41; state.place = { unit: "ج.م" };',
    " const sibling = { id: 'legacy-rental-owner', relation: 'الأخ', age: 45, job: 'محاسب', economicProfile: { savings: 100000, debt: 0, lastProcessedYear: 40, ownedProperties: [{ id: 'legacy-rental', kind: 'rental', purchaseYear: 35, purchasePrice: 150000, marketValue: 160000, monthlyRent: 700, lastRentYear: 40 }] } };",
    ' const profile = ensureSiblingEconomicProfile(sibling);',
    ' return { asset: profile.ownedProperties[0], balance: profile.rentalArrearsBalance, collected: profile.rentalArrearsCollectedTotal, added: profile.rentalArrearsAddedTotal, writtenOff: profile.rentalArrearsWrittenOffTotal };',
    '})()'
  ].join(String.fromCharCode(10)), context, { timeout: 10000 });
  assert.equal(result.asset.rentArrears, 0);
  assert.equal(result.asset.rentArrearsCollectedTotal, 0);
  assert.equal(result.asset.rentArrearsAddedTotal, 0);
  assert.equal(result.balance, 0);
  assert.equal(result.collected, 0);
  assert.equal(result.added, 0);
  assert.equal(result.writtenOff, 0);
});

test('عند الضائقة المالية يُباع العقار الاستثماري قبل المسكن الأساسي', () => {
  const context = vm.createContext({});
  vm.runInNewContext(siblingEconomySource + String.fromCharCode(10) + harnessSource, context, { timeout: 10000 });
  const result = vm.runInContext([
    '(() => {',
    " const relative = { id: 'rental-first-sale', name: 'أخ', relation: 'الأخ', age: 42 };",
    " const profile = { history: [{ year: 41, employmentState: 'seeking' }], ownedProperties: [",
    "  { id: 'family-home', kind: 'residence', marketValue: 180000 },",
    "  { id: 'investment-flat', kind: 'rental', marketValue: 320000 }",
    ' ] };',
    " return siblingPropertySaleDecision(relative, profile, 42, 42, 'seeking', 20000);",
    '})()'
  ].join(String.fromCharCode(10)), context, { timeout: 10000 });
  assert.equal(result.assetId, 'investment-flat');
  assert.equal(result.kind, 'rental');
});

test('الحفظ القديم لا يكتسب عقارات أو مصروفات سكنية بأثر رجعي', () => {
  const context = vm.createContext({});
  vm.runInNewContext(siblingEconomySource + String.fromCharCode(10) + harnessSource, context, { timeout: 10000 });
  const result = vm.runInContext([
    '(() => {',
    ' state = makeState();',
    ' state.yearCount = 60;',
    " state.place = { unit: 'ج.م' };",
    " const sibling = { id: 'legacy-sibling-no-home', relation: 'الأخ', age: 50, job: 'محاسب', economicProfile: { savings: 80000, debt: 10000, investmentBalance: 5000, lastProcessedYear: 59, history: [{ year: 59, age: 49, job: 'محاسب', income: 90000, expenses: 60000 }] } };",
    ' const profile = ensureSiblingEconomicProfile(sibling);',
    ' return { assets: profile.ownedProperties, propertyExpenses: profile.propertyExpensesAnnual, propertyPurchases: profile.propertyPurchasesTotal, annualRentIncome: profile.annualRentIncome, cumulativeRentIncome: profile.cumulativeRentIncome, rentalIncomeTotal: profile.rentalIncomeTotal, rentalLossTotal: profile.rentalLossTotal, netWorth: profile.netWorth, history: profile.history };',
    '})()'
  ].join(String.fromCharCode(10)), context, { timeout: 10000 });
  assert.deepEqual(Array.from(result.assets), []);
  assert.equal(result.propertyExpenses, 0);
  assert.equal(result.propertyPurchases, 0);
  assert.equal(result.netWorth, 75000);
  assert.equal(result.annualRentIncome, 0);
  assert.equal(result.cumulativeRentIncome, 0);
  assert.equal(result.rentalIncomeTotal, 0);
  assert.equal(result.rentalLossTotal, 0);
  assert.equal(result.history[0].propertyValue, 0);
  assert.equal(result.history[0].propertyExpenses, 0);
  assert.equal(result.history[0].propertyPurchase, false);
});