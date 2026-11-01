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
    } else if (stopAtSemicolon && char === ';' && depth === 0) return index + 1;
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
  'BUSINESS_PRODUCT_CATALOG',
  'BUSINESS_INDUSTRY_PROFILES',
  'BUSINESS_RIVAL_SECTORS',
  'clamp'
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
  'businessProductMarketSnapshot',
  'simulateBusinessProducts'
].map(extractFunction);

const harnessSource = [
  "'use strict';",
  "var state;",
  "let randomState = 1;",
  "function seededRandom() {",
  "  randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;",
  "  return randomState / 4294967296;",
  "}",
  "function setSeed(seed) {",
  "  randomState = (Number(seed) >>> 0) || 1;",
  "  Math.random = seededRandom;",
  "}",
  "function setFixedRandom(value) { Math.random = () => value; }",
  "function setState(age, lifeId) { state = { age, lifeId, name: 'حياة', place: { unit: 'ج.م' } }; }",
  "function getProductCatalog(id) { return BUSINESS_PRODUCT_CATALOG.find(item => item.id === id); }",
  "Math.random = seededRandom;"
].join('\n');

function makeContext() {
  const context = vm.createContext({});
  vm.runInContext(
    [harnessSource, ...declarations, ...runtimeFunctions].join('\n\n'),
    context,
    { timeout: 15000, filename: 'hayah-business-market-harness.js' }
  );
  return context;
}

function makeBusiness(overrides = {}) {
  return {
    id: 'market-test',
    lifeId: 'market-test-life',
    title: 'مشروع سوق تجريبي',
    sector: 'تقنية',
    value: 180000,
    products: [],
    facilities: [],
    market: null,
    ...overrides
  };
}

function makeRivals(count, profile) {
  return Array.from({ length: count }, (_, index) => ({
    id: 'controlled-rival-' + index,
    name: 'منافس ' + index,
    product: 'خدمة تجريبية',
    priceIndex: profile.price,
    qualityIndex: profile.quality,
    capacityIndex: profile.capacity,
    marketingIndex: profile.marketing,
    marketShare: 0,
    cashBalance: 250000,
    lastYearRevenue: 0,
    lastYearProfit: 0,
    lastDecision: 'يحافظ على موقعه',
    decisionYear: 30,
    losingYears: 0,
    active: true
  }));
}

function makeMarket(age, profile) {
  return {
    year: age,
    industry: 'تقنية',
    demandIndex: profile.demand,
    baseCompetitionIndex: profile.baseCompetition,
    competitionIndex: profile.baseCompetition,
    competitorCount: profile.count,
    rivalPriceIndex: profile.price,
    rivalQualityIndex: profile.quality,
    rivalMarketingIndex: profile.marketing,
    rivalCapacityIndex: profile.capacity,
    marketShare: profile.share,
    lastYearShareChange: 0,
    lastYearProfit: 0,
    lastYearUnits: 0,
    lastYearRevenue: 0,
    rivals: makeRivals(profile.count, profile)
  };
}

function runProductScenario(context, options = {}) {
  const age = options.age ?? 30;
  context.setState(age, options.lifeId || 'market-test-life');
  context.setFixedRandom(options.random ?? 0.5);
  const business = makeBusiness({
    id: options.id || 'market-test',
    sector: options.sector || 'تقنية',
    value: options.value ?? 180000,
    market: makeMarket(age, options.market || {
      demand: 115, baseCompetition: 20, count: 4,
      price: 75, quality: 35, marketing: 35, capacity: 40, share: 45
    }),
    products: [{
      catalogId: 'digital-service',
      active: true,
      demand: 90,
      competition: 15,
      unitPrice: 850,
      unitCost: 280,
      quality: 95,
      history: [],
      ...(options.product || {})
    }],
    facilities: options.facilities || [],
    pendingProductCosts: 0
  });
  const result = context.simulateBusinessProducts(
    business, business.value, null, options.staffRevenueBonus ?? 0
  );
  return { business, result, market: business.market, product: business.products[0] };
}

function assertShareBalance(market, message) {
  const activeRivalShare = market.rivals
    .filter(rival => rival.active !== false)
    .reduce((sum, rival) => sum + rival.marketShare, 0);
  assert.ok(
    Math.abs(activeRivalShare + market.marketShare - 100) <= 1.5,
    message || 'player and active rival market shares should total approximately 100%'
  );
}

test('تطبيع سوق قديم بمنافس واحد يضيف منافسًا دون حذف المنافس المحفوظ', () => {
  const context = makeContext();
  context.setState(30, 'legacy-market-life');
  const business = makeBusiness({
    market: {
      year: 30, industry: 'تقنية', demandIndex: 80,
      baseCompetitionIndex: 40, competitionIndex: 40,
      competitorCount: 1, rivalPriceIndex: 100, marketShare: 15,
      rivals: [{
        id: 'legacy-rival-preserved', name: 'منافس قديم', product: 'خدمة قديمة',
        priceIndex: 100, qualityIndex: 70, capacityIndex: 100, marketingIndex: 95,
        marketShare: 85, cashBalance: 250000, decisionYear: 30, active: true
      }]
    }
  });

  const market = context.businessMarketSnapshot(business);
  assert.ok(market.competitorCount >= 2,
    'the market should restore the intended minimum competitor roster');
  assert.ok(market.rivals.some(rival => rival.id === 'legacy-rival-preserved'),
    'normalization must preserve the existing saved rival');
  assertShareBalance(market);
});

test('تكوين السوق حتمي وثابت عند تكرار القراءة في السنة نفسها', () => {
  const context = makeContext();
  context.setState(30, 'deterministic-market-life');
  const business = makeBusiness({ id: 'deterministic-business' });

  const first = context.businessMarketSnapshot(business);
  const firstCopy = JSON.stringify(first);
  const repeated = context.businessMarketSnapshot(business);

  assert.equal(JSON.stringify(repeated), firstCopy);
  assert.ok(first.demandIndex >= 35 && first.demandIndex <= 115);
  assert.ok(first.competitionIndex >= 0 && first.competitionIndex <= 100);
  assert.ok(first.competitorCount >= 2 && first.competitorCount <= 12);
  assert.equal(first.rivals.length, first.competitorCount);
  assertShareBalance(first);
});

test('المنافسون يتقدمون مرة واحدة عند الانتقال لسنة جديدة', () => {
  const context = makeContext();
  context.setState(30, 'annual-market-life');
  const business = makeBusiness({ id: 'annual-market-business' });

  const year30 = context.businessMarketSnapshot(business);
  context.setState(31, 'annual-market-life');
  const year31 = context.businessMarketSnapshot(business);
  const year31Copy = JSON.stringify(year31);
  const repeatedYear31 = context.businessMarketSnapshot(business);

  assert.equal(year30.year, 30);
  assert.equal(year31.year, 31);
  assert.ok(year31.rivals.every(rival => rival.decisionYear === 31));
  assert.equal(JSON.stringify(repeatedYear31), year31Copy,
    'reading the market twice in one year must not advance rival decisions twice');
});

test('الطلب القوي والمنافسة الأقل يرفعان الوحدات المباعة', () => {
  const context = makeContext();
  const favorable = runProductScenario(context, {
    id: 'favorable-market',
    market: {
      demand: 115, baseCompetition: 20, count: 4,
      price: 75, quality: 35, marketing: 35, capacity: 40, share: 45
    },
    product: { demand: 95, competition: 5, unitPrice: 850, quality: 100 }
  });
  const difficult = runProductScenario(context, {
    id: 'difficult-market',
    market: {
      demand: 35, baseCompetition: 75, count: 8,
      price: 145, quality: 100, marketing: 170, capacity: 180, share: 3
    },
    product: { demand: 5, competition: 95, unitPrice: 2000, quality: 20 }
  });

  assert.ok(favorable.result.units > difficult.result.units);
  assert.ok(favorable.result.revenue > difficult.result.revenue);
  assert.ok(favorable.market.marketShare >= 3 && favorable.market.marketShare <= 45);
  assert.ok(difficult.market.marketShare >= 3 && difficult.market.marketShare <= 45);
});

test('السعر الأقل والطاقة الإنتاجية الأعلى ينعكسان على المبيعات', () => {
  const context = makeContext();
  const baseOptions = {
    market: {
      demand: 100, baseCompetition: 35, count: 4,
      price: 100, quality: 65, marketing: 80, capacity: 90, share: 20
    },
    product: { demand: 80, competition: 25, quality: 95, unitCost: 280 }
  };
  const affordable = runProductScenario(context, {
    ...baseOptions, id: 'affordable-price',
    product: { ...baseOptions.product, unitPrice: 850 }
  });
  const expensive = runProductScenario(context, {
    ...baseOptions, id: 'expensive-price',
    product: { ...baseOptions.product, unitPrice: 1400 }
  });
  const expanded = runProductScenario(context, {
    ...baseOptions, id: 'expanded-capacity',
    facilities: [{ id: 'factory', capacityBonus: 0.7 }],
    product: baseOptions.product
  });

  assert.ok(affordable.result.units > expensive.result.units);
  assert.ok(expanded.result.capacityMultiplier > affordable.result.capacityMultiplier);
  assert.ok(expanded.result.capacityUnits > affordable.result.capacityUnits);
  assert.ok(expanded.result.units > affordable.result.units);
});

test('تاريخ المنتج يحتفظ بعشر سنوات فقط ويحدّث مؤشرات الطلب والمنافسة ضمن النطاق', () => {
  const context = makeContext();
  const business = makeBusiness({
    id: 'history-business',
    products: [{
      catalogId: 'digital-service', active: true, demand: 65, competition: 40,
      unitPrice: 850, unitCost: 280, quality: 90, history: []
    }]
  });

  for (let age = 20; age < 32; age++) {
    context.setState(age, 'history-life');
    context.setFixedRandom(0.5);
    context.simulateBusinessProducts(business, business.value, null, 0);
  }

  const product = business.products[0];
  assert.equal(product.history.length, 10);
  assert.equal(product.history[0].year, 22);
  assert.equal(product.history[9].year, 31);
  assert.ok(product.demand >= 5 && product.demand <= 95);
  assert.ok(product.competition >= 5 && product.competition <= 95);
  assert.ok(Number.isFinite(product.lastYearProfit));
});

test('توقعات السوق الأولية للمنتج حتمية ومقيدة بحدود الواجهة', () => {
  const context = makeContext();
  context.setState(24, 'product-research-life');
  const catalog = context.getProductCatalog('digital-service');
  const business = makeBusiness({ id: 'research-business' });

  const first = context.businessProductMarketSnapshot(business, catalog);
  const second = context.businessProductMarketSnapshot(business, catalog);

  assert.equal(JSON.stringify(first), JSON.stringify(second));
  assert.equal(first.year, 24);
  assert.ok(first.demand >= 20 && first.demand <= 90);
  assert.ok(first.competition >= 10 && first.competition <= 90);
  assert.ok(first.suggestedPrice >= 50);
  assert.ok(first.confidence >= 60 && first.confidence <= 94);
});

test('1,000 سيناريو سوق ومنتج تحافظ على القيم والحصص والسجلات ضمن الحدود', () => {
  const context = makeContext();
  const sectors = ['تقنية', 'لوجستيات', 'مطاعم', 'تجزئة', 'أغذية', 'عناية', 'خدمات'];
  const catalogIds = ['digital-service', 'home-meals', 'care-products', 'daily-essentials'];

  for (let index = 0; index < 1000; index++) {
    context.setSeed(index + 1);
    const age = 18 + (index % 80);
    context.setState(age, 'market-stress-life-' + index);
    const business = makeBusiness({
      id: 'market-stress-business-' + index,
      sector: sectors[index % sectors.length],
      value: 25000 + (index * 137) % 2000000,
      products: [{
        catalogId: catalogIds[index % catalogIds.length],
        active: true,
        demand: 5 + (index * 17) % 91,
        competition: 5 + (index * 29) % 91,
        unitPrice: 100 + (index * 43) % 2400,
        unitCost: 40 + (index * 31) % 900,
        quality: 20 + (index * 13) % 81,
        history: []
      }],
      facilities: index % 3 === 0 ? [{ id: 'store', capacityBonus: 0.3 }] : []
    });

    const market = context.businessMarketSnapshot(business);
    const result = context.simulateBusinessProducts(business, business.value, null, (index % 4) * 0.04);
    const product = business.products[0];

    assert.ok(market.demandIndex >= 35 && market.demandIndex <= 115);
    assert.ok(market.competitionIndex >= 0 && market.competitionIndex <= 100);
    assert.ok(market.competitorCount >= 2 && market.competitorCount <= 12);
    assert.equal(market.rivals.length, market.competitorCount);
    assertShareBalance(market, 'market share balance failed in scenario ' + index);
    for (const value of [result.revenue, result.costs, result.units, result.capacityUnits]) {
      assert.ok(Number.isFinite(value) && value >= 0,
        'invalid non-negative market/product result in scenario ' + index);
    }
    assert.ok(Number.isFinite(result.productProfit),
      'product profit should remain finite in scenario ' + index);
    assert.ok(Number.isFinite(result.capacityMultiplier) && result.capacityMultiplier >= 1);
    assert.ok(Number.isFinite(business.market.marketShare)
      && business.market.marketShare >= 3 && business.market.marketShare <= 45);
    assert.ok(product.demand >= 5 && product.demand <= 95);
    assert.ok(product.competition >= 5 && product.competition <= 95);
    assert.ok(product.history.length <= 10);
  }
});
