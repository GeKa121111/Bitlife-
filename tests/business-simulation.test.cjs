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
  assert.notEqual(end, -1, 'expected following function after ' + name);
  return app.slice(start, end);
}

const runtimeFunctions = [
  'businessTaxLiability',
  'businessUsesSeparateTreasury',
  'businessTreasuryBalance',
  'adjustBusinessTreasury',
  'businessCreditBalance',
  'recordBusinessFinancialReport',
  'simulateBusinessEntityYear'
].map(extractFunction).join('\n\n');

const harnessSource = String.raw`
'use strict';

var state;
var logs = [];
var randomState = 1;

const BUSINESS_SUPPLIER_CATALOG = [
  { id: 'balanced', title: 'مورد متوازن', quality: 76, costMultiplier: .96 }
];
const BUSINESS_STAFF_ROLES = [
  { id: 'sales', revenueBonus: .055, costReduction: 0 },
  { id: 'operations', revenueBonus: .01, costReduction: .07 },
  { id: 'marketing', revenueBonus: .045, costReduction: 0 },
  { id: 'finance', revenueBonus: 0, costReduction: .05 }
];
const BUSINESS_PRODUCT_CATALOG = [
  { id: 'digital-service' },
  { id: 'home-meals' },
  { id: 'care-products' },
  { id: 'daily-essentials' }
];

function seededRandom() {
  randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
  return randomState / 4294967296;
}
function setSeed(seed) {
  randomState = (Number(seed) >>> 0) || 1;
  Math.random = seededRandom;
  chance = probability => seededRandom() < Number(probability);
}
function setFixedRandom(value) {
  Math.random = () => value;
  chance = () => false;
}
Math.random = seededRandom;

function clamp(value, min = 0, max = 100) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.max(min, Math.min(max, Math.round(number)));
}
function chance(probability) { return seededRandom() < Number(probability); }
function businessIndustryProfile() {
  return {
    revenueMultiplier: 1,
    operatingCostMultiplier: 1,
    unitCostMultiplier: 1,
    corporateTaxRate: .15
  };
}
function businessMarketSnapshot() {
  return {
    industry: 'تقنية',
    demandIndex: 80,
    competitionIndex: 40,
    competitorCount: 3,
    rivalPriceIndex: 100,
    marketShare: 10,
    lastYearShareChange: 0,
    rivals: []
  };
}
function simulateBusinessProducts(business) {
  const upfrontCosts = Math.max(0, Math.round(Number(business.pendingProductCosts) || 0));
  business.pendingProductCosts = 0;
  return {
    revenue: 0,
    costs: 0,
    upfrontCosts,
    units: 0,
    count: 0,
    capacityMultiplier: 1,
    productProfit: 0
  };
}
function log(icon, title, description, type) {
  logs.push({ icon, title, description, type });
}
function cash(value) { return String(Math.round(Number(value) || 0)); }
function fmt(value) { return String(value); }
`;

function makeContext() {
  const context = vm.createContext({});
  vm.runInContext(harnessSource + '\n' + runtimeFunctions, context, {
    timeout: 15000,
    filename: 'hayah-business-settlement-harness.js'
  });
  return context;
}

function makeBusiness(overrides = {}) {
  return {
    id: 'business-test',
    title: 'مشروع تجريبي',
    sector: 'تقنية',
    value: 100000,
    level: 1,
    treasuryMode: 'separate',
    cashBalance: 20000,
    taxLiability: 0,
    pendingTaxPayments: 0,
    pendingFacilityCosts: 0,
    pendingProductCosts: 0,
    pendingOwnerContributions: 0,
    pendingOwnerWithdrawals: 0,
    products: [],
    staff: [],
    facilities: [],
    supplier: null,
    credit: null,
    financialHistory: [],
    ...overrides
  };
}

function runYear(context, business, options = {}) {
  context.state = {
    age: options.age ?? 35,
    lifeId: options.lifeId || 'business-test-life',
    bank: options.bank ?? 100000,
    assets: options.assets || []
  };
  context.logs = [];
  context.simulateBusinessEntityYear(business, options.kind || 'business');
  return {
    state: context.state,
    report: business.financialHistory[business.financialHistory.length - 1],
    logs: context.logs
  };
}

test('تسوية خزينة الشركة تفصل سداد الضريبة السابق عن الضريبة الجديدة دون ازدواج', () => {
  const context = makeContext();
  context.setFixedRandom(.5);
  const business = makeBusiness({
    cashBalance: 20000,
    taxLiability: 1500,
    pendingTaxPayments: 500
  });

  const { report } = runYear(context, business, { bank: 900000 });

  assert.equal(report.openingCashBalance, 20500,
    'opening cash should reconstruct the balance before the already-recorded tax payment');
  assert.equal(report.closingCashBalance, business.cashBalance);
  assert.equal(report.openingTaxLiability, 2000);
  assert.equal(report.corporateTax, 323);
  assert.equal(report.corporateTaxPaid + report.corporateTaxAccrued,
    report.openingTaxLiability + report.corporateTax);
  assert.equal(report.corporateTaxAccrued, 0);
  assert.equal(business.taxLiability, 0);
  assert.equal(business.pendingTaxPayments, 0);
  assert.equal(business.cashBalance, 20327);
  assert.equal(report.profit, report.revenue - report.costs);
});

test('نقص السيولة يرحّل الضريبة وفائدة التمويل غير المدفوعة بدل اختفائها', () => {
  const context = makeContext();
  context.setFixedRandom(.5);
  const business = makeBusiness({
    cashBalance: 100,
    taxLiability: 500,
    staff: [{ role: 'sales', salary: 50000, skill: 80, morale: 65, years: 0 }],
    credit: {
      principal: 10000,
      accruedInterest: 0,
      annualRate: .1,
      lastInterestAge: 34
    }
  });

  const { report } = runYear(context, business, { age: 35 });

  assert.equal(report.businessLoanInterest, 1000);
  assert.equal(report.businessLoanInterestPaid, 0);
  assert.equal(report.businessLoanInterestAccrued, 1000);
  assert.equal(report.businessLoanInterestPaid + report.businessLoanInterestAccrued,
    report.businessLoanInterest);
  assert.equal(report.corporateTaxPaid, 0);
  assert.equal(report.corporateTaxAccrued, 500);
  assert.equal(business.taxLiability, 500);
  assert.equal(context.businessCreditBalance(business), 11000);
  assert.equal(Object.hasOwn(business.credit, '_lastInterestPaid'), false);
  assert.equal(Object.hasOwn(business.credit, '_lastInterestAccrued'), false);
  assert.equal(business.pendingTaxPayments, 0);
});

test('الخزينة المشتركة تنعكس على رصيد الشخصية وتُسجّل كتسوية مشتركة', () => {
  const context = makeContext();
  context.setFixedRandom(.5);
  const business = makeBusiness({
    treasuryMode: 'shared',
    cashBalance: 123456
  });

  const { state, report } = runYear(context, business, { bank: 100000 });

  assert.equal(report.treasuryMode, 'shared');
  assert.equal(report.openingCashBalance, 0);
  assert.equal(report.closingCashBalance, 0);
  assert.equal(state.bank, 100000 + report.profit);
  assert.equal(business.cashBalance, 123456,
    'legacy shared-treasury saves should not start using a separate cash balance');
});

test('عقد المورد والموظفون يتقدّمون سنة واحدة مع التقرير المالي', () => {
  const context = makeContext();
  context.setFixedRandom(.5);
  const business = makeBusiness({
    supplier: { id: 'balanced', quality: 76, costMultiplier: .96, yearsLeft: 1 },
    staff: [{ role: 'sales', salary: 1000, skill: 80, morale: 68, years: 4 }]
  });

  const { report } = runYear(context, business);

  assert.equal(report.staffCount, 1);
  assert.equal(report.payroll, 1000);
  assert.equal(business.staff[0].years, 5);
  assert.equal(business.staff[0].morale, 70);
  assert.equal(business.staff[0].skill, 80,
    'the fixed no-chance test mode must not grant an unseeded skill increase');
  assert.equal(business.supplier, null,
    'a supplier contract with one year remaining should expire after this report');
});

test('شركة المحفظة تحدّث قيمة أصل النشاط المطابق فقط', () => {
  const context = makeContext();
  context.setFixedRandom(.5);
  const business = makeBusiness({ id: 'portfolio-7', value: 100000 });
  const matching = { id: 'portfolio-7', kind: 'business', companyPortfolio: true, value: 100000 };
  const unrelated = { id: 'other', kind: 'business', companyPortfolio: true, value: 70000 };

  const { report } = runYear(context, business, {
    kind: 'portfolio',
    assets: [matching, unrelated]
  });

  assert.equal(report.year, 35);
  assert.equal(matching.value, business.value);
  assert.equal(unrelated.value, 70000);
  assert.equal(business.value, 104000);
});

test('تقارير الشركة تحتفظ بآخر عشر سنوات فقط', () => {
  const context = makeContext();
  context.setFixedRandom(.5);
  const business = makeBusiness();

  for (let year = 20; year < 32; year++) {
    runYear(context, business, { age: year });
  }

  assert.equal(business.financialHistory.length, 10);
  assert.equal(business.financialHistory[0].year, 22);
  assert.equal(business.financialHistory[9].year, 31);
});

test('1,000 تسوية سنوية حتمية تحافظ على هوية الربح والضريبة والتمويل', () => {
  const context = makeContext();
  let randomState = 0x5eed1234;
  const random = () => {
    randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
    return randomState / 4294967296;
  };
  const roles = ['sales', 'operations', 'marketing', 'finance'];

  for (let index = 0; index < 1000; index++) {
    context.setSeed(index + 1);
    const age = 20 + (index % 70);
    const separate = index % 2 === 0;
    const pendingTaxPayments = Math.floor(random() * 5000);
    const business = makeBusiness({
      id: 'business-' + index,
      value: 10000 + Math.round(random() * 2000000),
      level: 1 + Math.floor(random() * 5),
      treasuryMode: separate ? 'separate' : 'shared',
      cashBalance: Math.round(random() * 120000 - 20000),
      taxLiability: Math.floor(random() * 20000),
      pendingTaxPayments,
      pendingFacilityCosts: Math.floor(random() * 100000),
      pendingOwnerContributions: Math.floor(random() * 50000),
      pendingOwnerWithdrawals: Math.floor(random() * 50000),
      facilities: Array.from({ length: Math.floor(random() * 3) }, () => ({
        annualUpkeep: Math.floor(random() * 3000),
        capacityBonus: .1
      })),
      staff: Array.from({ length: Math.floor(random() * 4) }, (_, employeeIndex) => ({
        role: roles[Math.floor(random() * roles.length)],
        salary: Math.floor(random() * 20000),
        skill: Math.floor(random() * 101),
        morale: Math.floor(random() * 101),
        years: employeeIndex
      })),
      supplier: random() < .5 ? null : {
        id: 'balanced',
        quality: 40 + Math.floor(random() * 60),
        costMultiplier: .7 + random() * .6,
        yearsLeft: 1 + Math.floor(random() * 3)
      },
      credit: random() < .55 ? null : {
        principal: Math.floor(random() * 150000),
        accruedInterest: Math.floor(random() * 5000),
        annualRate: .05 + random() * .15,
        lastInterestAge: random() < .5 ? age : age - 1
      }
    });

    const bank = Math.round(random() * 120000 - 20000);
    const { report, state } = runYear(context, business, { age, bank });

    assert.ok(report, 'a financial report should be recorded for scenario ' + index);
    assert.equal(report.profit, report.revenue - report.costs,
      'profit identity failed for scenario ' + index);
    assert.equal(report.corporateTaxPaid + report.corporateTaxAccrued,
      report.openingTaxLiability + report.corporateTax,
      'tax settlement identity failed for scenario ' + index);
    assert.equal(report.taxLiability, business.taxLiability,
      'tax liability should match the saved business for scenario ' + index);
    assert.equal(report.businessLoanInterestPaid + report.businessLoanInterestAccrued,
      report.businessLoanInterest,
      'interest settlement identity failed for scenario ' + index);
    assert.equal(report.businessLoanBalance, context.businessCreditBalance(business),
      'reported loan balance should match the persisted loan for scenario ' + index);
    assert.equal(business.pendingTaxPayments, 0);
    assert.equal(business.pendingFacilityCosts, 0);
    assert.equal(business.pendingProductCosts, 0);
    assert.equal(business.pendingOwnerContributions, 0);
    assert.equal(business.pendingOwnerWithdrawals, 0);
    assert.ok(Number.isFinite(business.value) && business.value >= 1000);
    assert.ok(Number.isFinite(separate ? business.cashBalance : state.bank));
    for (const [key, value] of Object.entries(report)) {
      if (typeof value === 'number') {
        assert.ok(Number.isFinite(value), 'non-finite report field ' + key + ' in scenario ' + index);
      }
    }
    for (const employee of business.staff) {
      assert.ok(Number.isInteger(employee.years) && employee.years >= 0 && employee.years <= 80);
      assert.ok(Number.isFinite(employee.morale) && employee.morale >= 0 && employee.morale <= 100);
      assert.ok(Number.isFinite(employee.skill) && employee.skill >= 0 && employee.skill <= 100);
    }
  }
});
