'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');

function scanDeclarationEnd(source, start, stopAtSemicolon) {
  let depth = 0;
  let quote = '';
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let index = start; index < source.length; index++) {
    const char = source[index];
    const next = source[index + 1];

    if (lineComment) {
      if (char === '\n') lineComment = false;
      continue;
    }
    if (blockComment) {
      if (char === '*' && next === '/') {
        blockComment = false;
        index++;
      }
      continue;
    }
    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (char === quote) quote = '';
      continue;
    }
    if (char === '/' && next === '/') {
      lineComment = true;
      index++;
      continue;
    }
    if (char === '/' && next === '*') {
      blockComment = true;
      index++;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === '{' || char === '[' || char === '(') depth++;
    else if (char === '}' || char === ']' || char === ')') {
      depth--;
      if (!stopAtSemicolon && char === '}' && depth === 0) return index + 1;
    } else if (stopAtSemicolon && char === ';' && depth === 0) {
      return index + 1;
    }
  }
  return -1;
}

function extractFunction(name) {
  const start = app.indexOf('function ' + name + '(');
  assert.notEqual(start, -1, 'expected app function ' + name);
  const bodyStart = app.indexOf('{', start);
  assert.notEqual(bodyStart, -1, 'expected function body for ' + name);
  const end = scanDeclarationEnd(app, bodyStart, false);
  assert.notEqual(end, -1, 'expected function end for ' + name);
  return app.slice(start, end);
}

function extractDeclaration(name) {
  const start = app.indexOf('const ' + name + ' =');
  assert.notEqual(start, -1, 'expected app declaration ' + name);
  const end = scanDeclarationEnd(app, start, true);
  assert.notEqual(end, -1, 'expected declaration end for ' + name);
  return app.slice(start, end);
}

const declarations = [
  'BUSINESS_SUPPLIER_CATALOG',
  'BUSINESS_STAFF_ROLES',
  'BUSINESS_PRODUCT_CATALOG',
  'BUSINESS_INDUSTRY_PROFILES',
  'BUSINESS_RIVAL_SECTORS'
].map(extractDeclaration);

const runtimeFunctions = [
  'businessRivalSectorKey',
  'businessRivalHash',
  'businessRivalIdentity',
  'createBusinessRivals',
  'normalizeBusinessRivals',
  'advanceBusinessRivals',
  'summarizeBusinessRivals',
  'reconcileBusinessRivalShares',
  'businessIndustryProfile',
  'businessMarketSnapshot',
  'simulateBusinessProducts',
  'businessTaxLiability',
  'businessUsesSeparateTreasury',
  'businessTreasuryBalance',
  'adjustBusinessTreasury',
  'businessCreditBalance',
  'recordBusinessFinancialReport',
  'simulateBusinessEntityYear'
].map(extractFunction);

const harnessSource = [
  "'use strict';",
  "var state;",
  "var logs = [];",
  "let randomState = 1;",
  "const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(Number(value) || 0)));",
  "function seededRandom() {",
  "  randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;",
  "  return randomState / 4294967296;",
  "}",
  "function setSeed(seed) { randomState = (Number(seed) >>> 0) || 1; Math.random = seededRandom; }",
  "function chance(probability) { return Math.random() < Number(probability); }",
  "function log(icon, title, description, type) { logs.push({ icon, title, description, type }); }",
  "function cash(value) { return String(Math.round(Number(value) || 0)); }",
  "function fmt(value) { return String(value); }",
  "Math.random = seededRandom;"
].join('\n');

function makeContext() {
  const context = vm.createContext({});
  vm.runInContext(
    [harnessSource, ...declarations, ...runtimeFunctions].join('\n\n'),
    context,
    { timeout: 15000, filename: 'hayah-business-lifecycle-harness.js' }
  );
  return context;
}

function makeLegacyMarket() {
  return {
    year: 25,
    industry: 'تقنية',
    demandIndex: 82,
    baseCompetitionIndex: 40,
    competitionIndex: 40,
    competitorCount: 1,
    rivalPriceIndex: 100,
    marketShare: 15,
    rivals: [{
      id: 'saved-legacy-rival',
      name: 'منافس محفوظ',
      product: 'خدمة قائمة',
      priceIndex: 100,
      qualityIndex: 72,
      capacityIndex: 98,
      marketingIndex: 94,
      marketShare: 85,
      cashBalance: 250000,
      lastYearRevenue: 12000,
      lastYearProfit: 1800,
      lastDecision: 'يحافظ على موقعه',
      decisionYear: 25,
      losingYears: 0,
      active: true
    }]
  };
}

function makeBusiness(mode) {
  const legacy = mode === 'legacy-shared';
  const business = {
    id: legacy ? 'legacy-company-30y' : 'separate-company-30y',
    lifeId: 'company-lifecycle-life',
    title: 'شركة المدار للتقنية',
    sector: 'تقنية',
    value: 260000,
    level: 2,
    taxLiability: 1200,
    pendingTaxPayments: 0,
    pendingFacilityCosts: 0,
    pendingProductCosts: 0,
    pendingOwnerContributions: 0,
    pendingOwnerWithdrawals: 0,
    products: [
      {
        catalogId: 'digital-service',
        active: true,
        demand: 72,
        competition: 38,
        unitPrice: 850,
        unitCost: 280,
        quality: 86,
        history: []
      },
      {
        catalogId: 'care-products',
        active: true,
        demand: 64,
        competition: 45,
        unitPrice: 560,
        unitCost: 230,
        quality: 78,
        history: []
      }
    ],
    staff: [
      { role: 'sales', salary: 4500, skill: 78, morale: 70, years: 2 },
      { role: 'operations', salary: 5200, skill: 82, morale: 72, years: 4 },
      { role: 'finance', salary: 4300, skill: 84, morale: 75, years: 3 }
    ],
    facilities: [
      { id: 'store', capacityBonus: .3, annualUpkeep: 1800 },
      { id: 'factory', capacityBonus: .7, annualUpkeep: 3200 }
    ],
    supplier: {
      id: 'balanced',
      quality: 76,
      costMultiplier: .96,
      yearsLeft: 3
    },
    credit: {
      principal: 25000,
      accruedInterest: 500,
      annualRate: .1,
      lastInterestAge: 24
    },
    financialHistory: []
  };

  if (legacy) {
    // Model a v1-era business with no treasuryMode and an undersized saved market roster.
    business.cashBalance = 123456;
    business.market = makeLegacyMarket();
  } else {
    business.treasuryMode = 'separate';
    business.cashBalance = 180000;
    business.market = null;
  }
  return business;
}

function assertShareBalance(market, label) {
  const rivalShare = market.rivals
    .filter(rival => rival && rival.active !== false)
    .reduce((sum, rival) => sum + Number(rival.marketShare || 0), 0);
  assert.ok(
    Math.abs(rivalShare + market.marketShare - 100) <= 1.5,
    label + ': player and active rival shares should total approximately 100%'
  );
}

function runLifecycle(mode, seed) {
  const context = makeContext();
  context.setSeed(seed);
  const business = makeBusiness(mode);
  context.state = {
    age: 25,
    lifeId: 'company-lifecycle-life',
    bank: 320000,
    assets: []
  };

  for (let year = 25; year < 55; year++) {
    context.state.age = year;
    context.logs = [];
    const previousStaffYears = business.staff.map(employee => employee.years);

    context.simulateBusinessEntityYear(business, 'business');

    const report = business.financialHistory[business.financialHistory.length - 1];
    const label = mode + ' year ' + year;
    assert.ok(report, label + ': annual report should be recorded');
    assert.equal(report.year, year, label + ': report year should match simulation year');
    assert.equal(report.profit, report.revenue - report.costs, label + ': profit identity');
    assert.equal(
      report.corporateTaxPaid + report.corporateTaxAccrued,
      report.openingTaxLiability + report.corporateTax,
      label + ': tax settlement identity'
    );
    assert.equal(
      report.businessLoanInterestPaid + report.businessLoanInterestAccrued,
      report.businessLoanInterest,
      label + ': loan interest settlement identity'
    );
    assert.equal(report.taxLiability, business.taxLiability, label + ': saved tax liability');
    assert.equal(
      report.businessLoanBalance,
      context.businessCreditBalance(business),
      label + ': reported credit balance'
    );

    assert.ok(Number.isFinite(business.value) && business.value >= 1000, label + ': company value');
    assert.ok(Number.isFinite(context.state.bank), label + ': owner bank balance');
    assert.ok(Number.isFinite(business.taxLiability) && business.taxLiability >= 0, label + ': tax liability');
    assert.ok(Number.isFinite(context.businessCreditBalance(business)), label + ': credit balance');
    assert.equal(business.pendingTaxPayments, 0, label + ': pending tax payments should be cleared');
    assert.equal(business.pendingFacilityCosts, 0, label + ': pending facility costs should be cleared');
    assert.equal(business.pendingProductCosts, 0, label + ': pending product costs should be cleared');
    assert.equal(business.pendingOwnerContributions, 0, label + ': pending owner contributions should be cleared');
    assert.equal(business.pendingOwnerWithdrawals, 0, label + ': pending owner withdrawals should be cleared');

    assert.equal(business.market.year, year, label + ': market should advance with the company');
    assert.ok(business.market.competitorCount >= 2 && business.market.competitorCount <= 12,
      label + ': competitor roster should remain within supported limits');
    assert.equal(business.market.rivals.length, business.market.competitorCount,
      label + ': roster length should match competitor count');
    assert.equal(
      new Set(business.market.rivals.map(rival => rival.id)).size,
      business.market.rivals.length,
      label + ': competitor IDs should remain unique'
    );
    assert.ok(report.marketShare >= 3 && report.marketShare <= 45, label + ': reported market share');
    assertShareBalance(business.market, label);

    assert.ok(report.productCount >= 1, label + ': active products should be included in the report');
    assert.ok(report.productUnits >= 0, label + ': product units should be non-negative');
    for (const [key, value] of Object.entries(report)) {
      if (typeof value === 'number') {
        assert.ok(Number.isFinite(value), label + ': non-finite report field ' + key);
      }
    }
    for (let index = 0; index < business.staff.length; index++) {
      const employee = business.staff[index];
      assert.equal(employee.years, Math.min(80, previousStaffYears[index] + 1),
        label + ': employee tenure should advance once');
      assert.ok(Number.isFinite(employee.morale) && employee.morale >= 0 && employee.morale <= 100,
        label + ': employee morale should remain bounded');
      assert.ok(Number.isFinite(employee.skill) && employee.skill >= 0 && employee.skill <= 100,
        label + ': employee skill should remain bounded');
    }
    for (const product of business.products) {
      assert.ok(product.history.length <= 10, label + ': product history should remain bounded');
      assert.equal(product.history[product.history.length - 1].year, year,
        label + ': product history should record the current year');
    }
  }

  assert.equal(business.financialHistory.length, 10, mode + ': retain only ten annual reports');
  assert.equal(business.financialHistory[0].year, 45, mode + ': oldest retained report');
  assert.equal(business.financialHistory[9].year, 54, mode + ': newest retained report');
  for (const product of business.products) {
    assert.equal(product.history.length, 10, mode + ': retain ten product-history entries');
    assert.equal(product.history[0].year, 45, mode + ': oldest retained product year');
    assert.equal(product.history[9].year, 54, mode + ': newest retained product year');
  }
  assert.equal(business.supplier, null, mode + ': a three-year supplier contract should expire');
  if (mode === 'legacy-shared') {
    assert.equal(business.cashBalance, 123456,
      'legacy shared-treasury saves must not start using the legacy cashBalance field');
    assert.equal(business.financialHistory[9].treasuryMode, 'shared');
  } else {
    assert.equal(business.financialHistory[9].treasuryMode, 'separate');
    assert.equal(business.financialHistory[9].closingCashBalance, business.cashBalance);
  }

  return JSON.stringify({
    age: context.state.age,
    bank: context.state.bank,
    value: business.value,
    cashBalance: business.cashBalance,
    taxLiability: business.taxLiability,
    credit: business.credit,
    market: business.market,
    products: business.products,
    staff: business.staff,
    financialHistory: business.financialHistory
  });
}

test('دورة شركة متكاملة لمدة 30 سنة تحافظ على المحاسبة والسوق والمنتجات', () => {
  runLifecycle('separate', 0x30c0ffee);
  runLifecycle('legacy-shared', 0x30c0ffee);
});

test('إعادة تشغيل دورة الشركة بالبذرة نفسها تنتج سجلًا مطابقًا', () => {
  const first = runLifecycle('separate', 0x76a11);
  const second = runLifecycle('separate', 0x76a11);
  assert.equal(second, first,
    'same seed and starting save should reproduce the same 30-year company history');
});
