'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

function findFunction(name) {
  const start = app.indexOf('function ' + name + '(');
  assert.notEqual(start, -1, 'missing runtime function: ' + name);
  const bodyStart = app.indexOf('{', start);
  assert.notEqual(bodyStart, -1, 'missing function body: ' + name);
  let depth = 0;
  let quote = '';
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  for (let index = bodyStart; index < app.length; index++) {
    const char = app[index];
    const next = app[index + 1];
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
    if (char === "'" || char === '"') {
      quote = char;
      continue;
    }
    if (char === '{') depth++;
    else if (char === '}' && --depth === 0) return app.slice(start, index + 1);
  }
  throw new Error('unterminated function: ' + name);
}

const runtime = [
  'childDevelopmentStage',
  'ensureChildGrowthProfile',
  'childCareerFromInterest',
  'advanceChildren',
  'businessUsesSeparateTreasury',
  'businessCreditBalance',
  'calculateInheritance',
  'startAsChild'
].map(findFunction);

const harness = [
  "'use strict';",
  'var state;',
  'var dead = false;',
  'var logs = [];',
  'let randomState = 1;',
  'const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(Number(value) || 0)));',
  'function seededRandom() { randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0; return randomState / 4294967296; }',
  'function setSeed(seed) { randomState = (Number(seed) >>> 0) || 1; Math.random = seededRandom; }',
  'function chance(probability) { return Math.random() < Number(probability); }',
  'function pick(items) { return items[Math.floor(Math.random() * items.length)]; }',
  'function cash(value) { return String(Math.round(Number(value) || 0)); }',
  'function perkOwned() { return false; }',
  'function archiveLife() { return true; }',
  'function newLife() { return { version: 1, lifeId: "new-heir", stats: { health: 80, happiness: 70, smart: 50, looks: 50 }, family: [], children: [], assets: [], investments: [], business: null, companies: [], heirlooms: [], accomplishments: [], legacy: {} }; }',
  'function log(icon, title, description, type) { logs.push({ icon, title, description, type }); }',
  'function render() {}',
  'function closeModal() {}',
  'function info() {}',
  'Math.random = seededRandom;'
].join('\n');

function makeContext() {
  const context = vm.createContext({});
  vm.runInContext([harness, ...runtime].join('\n\n'), context, {
    timeout: 10000,
    filename: 'hayah-family-succession-harness.js'
  });
  return context;
}

function makeParent() {
  return {
    version: 1,
    lifeId: 'parent-life',
    name: 'سليم منصور',
    gender: 'male',
    age: 65,
    place: { country: 'مصر', city: 'الإسكندرية', unit: 'جنيه' },
    bank: 100000,
    debt: 20000,
    willDistribution: 'الأسرة بالتساوي',
    family: [{ id: 'relative-1', name: 'قريب', relation: 'الأخ', age: 70, relationshipLevel: 80 }],
    children: [{
      id: 'heir-1',
      name: 'ليلى منصور',
      gender: 'female',
      age: 24,
      smart: 88,
      health: 91,
      happiness: 84,
      looks: 76,
      schoolPerformance: 92,
      careerPotential: 90,
      independence: 88,
      relationshipLevel: 95,
      interest: 'العلوم والتقنية'
    }],
    partner: null,
    job: null,
    heirlooms: [{ id: 'heirloom-1', name: 'ساعة العائلة' }],
    accomplishments: ['بنى شركة عائلية'],
    assets: [
      { id: 'primary-asset', title: 'شركة المدار', kind: 'business', value: 100000, upkeep: 5000 },
      { id: 'portfolio-asset', title: 'شركة النيل', kind: 'business', value: 200000, upkeep: 0, companyPortfolio: true },
      { id: 'home-asset', title: 'منزل العائلة', kind: 'property', value: 300000, upkeep: 500 }
    ],
    investments: [{ id: 'fund-1', title: 'صندوق استثماري', value: 10000 }],
    business: {
      assetId: 'primary-asset',
      title: 'شركة المدار',
      value: 100000,
      treasuryMode: 'separate',
      cashBalance: 50000,
      taxLiability: 5000,
      credit: { principal: 10000, accruedInterest: 1000, annualRate: 0.1 },
      staff: [{ id: 'staff-1', name: 'مدير التشغيل', years: 6, salary: 4000 }],
      products: [{ id: 'product-1', title: 'خدمة رقمية', history: [{ year: 64, units: 20 }] }],
      financialHistory: [{ year: 64, revenue: 10000, profit: 2000 }]
    },
    companies: [{
      id: 'portfolio-asset',
      assetId: 'portfolio-asset',
      title: 'شركة النيل',
      value: 200000,
      treasuryMode: 'separate',
      cashBalance: 40000,
      taxLiability: 10000,
      credit: { principal: 20000, accruedInterest: 2000, annualRate: 0.12 },
      staff: [{ id: 'staff-2', name: 'مديرة المبيعات', years: 4, salary: 5000 }],
      products: [{ id: 'product-2', title: 'منتج محلي', history: [] }],
      financialHistory: [{ year: 64, revenue: 20000, profit: 3000 }]
    }]
  };
}

function findBusinessAsset(heir, id) {
  return heir.assets.find(asset => asset.kind === 'business' && String(asset.id) === String(id));
}

test('تطور الأبناء يصل بالتعليم والاستقلال إلى بداية الحياة المهنية بصورة حتمية', () => {
  const simulate = seed => {
    const context = makeContext();
    context.setSeed(seed);
    context.state = {
      children: [{
        id: 'child-growth',
        name: 'نور',
        age: 0,
        smart: 88,
        health: 92,
        happiness: 86,
        relationshipLevel: 90,
        schoolPerformance: 92,
        careerPotential: 90,
        independence: 0,
        schoolSupport: 10,
        educationStatus: 'قبل الدراسة',
        interest: 'العلوم والتقنية',
        growthHistory: [],
        interactions: []
      }]
    };
    for (let year = 0; year < 27; year++) context.advanceChildren();
    return JSON.parse(JSON.stringify(context.state.children[0]));
  };

  const first = simulate(0x771234);
  const replay = simulate(0x771234);
  assert.deepEqual(replay, first, 'the same seed should reproduce the same child trajectory');
  assert.equal(first.age, 27);
  assert.equal(first.educationStatus, 'خريج جامعي');
  assert.equal(first.schooling, 'خريج جامعي');
  assert.ok(first.universityYears >= 4);
  assert.ok(first.independence >= 80);
  assert.ok(first.growthHistory.length <= 12);
  for (const key of ['smart', 'health', 'happiness', 'schoolPerformance', 'careerPotential', 'independence']) {
    assert.ok(first[key] >= 0 && first[key] <= 100, key + ' should remain bounded');
  }
});

test('سجلات الأبناء القديمة الناقصة تُطبّع دون فقد الاسم أو العمر', () => {
  const context = makeContext();
  context.state = { children: [{ name: 'طفل قديم', age: 17 }] };
  vm.runInContext('ensureChildGrowthProfile(state.children[0]);', context);
  const child = context.state.children[0];
  assert.equal(child.name, 'طفل قديم');
  assert.equal(child.age, 17);
  assert.equal(child.smart, 40);
  assert.equal(child.health, 75);
  assert.equal(child.happiness, 70);
  assert.ok(Array.isArray(child.growthHistory));
  assert.ok(Array.isArray(child.interactions));
  assert.equal(child.independence, 0);
});

test('حساب الإرث يضم خزائن الشركات وخصومها مع الحفاظ على الخزينة المشتركة القديمة', () => {
  const context = makeContext();
  const parent = makeParent();
  const inheritance = context.calculateInheritance(parent, 0.8);
  const expectedFactor = 0.8 * ((800000 - 68000) / (800000 - 48000));

  assert.equal(inheritance.business.cashBalance, Math.round(50000 * expectedFactor));
  assert.equal(inheritance.business.taxLiability, Math.round(5000 * expectedFactor));
  assert.equal(inheritance.business.credit.principal, Math.round(10000 * expectedFactor));
  assert.equal(inheritance.business.credit.accruedInterest, Math.round(1000 * expectedFactor));
  assert.equal(inheritance.companies.length, 1);
  assert.equal(inheritance.companies[0].cashBalance, Math.round(40000 * expectedFactor));
  assert.equal(inheritance.companies[0].taxLiability, Math.round(10000 * expectedFactor));
  const inheritedBusinesses = [inheritance.business, ...inheritance.companies].filter(Boolean);
  const inheritedBusinessCash = inheritedBusinesses.reduce((sum, business) =>
    sum + (business.treasuryMode === 'separate' ? Math.max(0, Number(business.cashBalance) || 0) : 0), 0);
  const inheritedBusinessLiabilities = inheritedBusinesses.reduce((sum, business) =>
    sum + Math.max(0, Number(business.taxLiability) || 0)
      + Math.max(0, Math.round(Number(business.credit && business.credit.principal) || 0)
        + Math.round(Number(business.credit && business.credit.accruedInterest) || 0))
      + (business.treasuryMode === 'separate' ? Math.max(0, -Number(business.cashBalance) || 0) : 0), 0);
  const inheritedGross = inheritance.bank
    + inheritance.assets.reduce((sum, item) => sum + Math.max(0, Number(item.value) || 0), 0)
    + inheritance.investments.reduce((sum, item) => sum + Math.max(0, Number(item.value) || 0), 0)
    + inheritedBusinessCash;
  assert.equal(inheritance.value, Math.max(0, inheritedGross - inheritedBusinessLiabilities),
    'the recorded inheritance must equal transferred assets after transferred business liabilities');
  assert.ok(Math.abs(inheritance.value - 585600) <= 3,
    'the heir should receive 80% of the parent net estate after company liabilities are carried forward');

  const legacy = {
    bank: 20000,
    debt: 0,
    assets: [{ id: 'legacy-business-asset', title: 'مشروع قديم', kind: 'business', value: 50000, upkeep: 1000 }],
    investments: [],
    business: {
      assetId: 'legacy-business-asset',
      title: 'مشروع قديم',
      value: 50000,
      cashBalance: 7777,
      taxLiability: 0
    }
  };
  const legacyInheritance = context.calculateInheritance(legacy, 0.8);
  assert.equal(legacyInheritance.business.cashBalance, 7777,
    'a v1 shared-treasury record must keep its legacy cashBalance field unchanged');
  assert.equal(legacyInheritance.business.value, legacyInheritance.assets[0].value);
  assert.equal(legacyInheritance.value, 56000, 'legacy shared cash is not treated as a separate company treasury');
  assert.equal(legacyInheritance.companies.length, 0);

  const noBusiness = context.calculateInheritance({ bank: 1000, assets: [], investments: [], debt: 0 }, 0.8);
  assert.equal(noBusiness.value, 800);
  assert.equal(noBusiness.business, null);
  assert.deepEqual(Array.from(noBusiness.companies), []);
});

test('بدء حياة الابن ينقل الشركات التشغيلية ويربطها بأصولها الجديدة دون مشاركة مراجع الوالد', () => {
  const context = makeContext();
  const parent = makeParent();
  const originalBusinessCash = parent.business.cashBalance;
  const originalCompanyCash = parent.companies[0].cashBalance;
  context.state = parent;

  vm.runInContext('startAsChild(0);', context);
  const heir = context.state;

  assert.equal(heir.name, 'ليلى منصور');
  assert.ok(heir.business, 'the primary business should remain operational');
  assert.equal(heir.companies.length, 1, 'portfolio companies should be inherited');
  const primaryAsset = findBusinessAsset(heir, heir.business.assetId);
  const portfolioAsset = findBusinessAsset(heir, heir.companies[0].id);
  assert.ok(primaryAsset, 'primary business should point to an inherited business asset');
  assert.ok(portfolioAsset, 'portfolio company should point to its inherited business asset');
  assert.equal(heir.business.value, primaryAsset.value);
  assert.equal(heir.companies[0].value, portfolioAsset.value);
  assert.notEqual(heir.business.assetId, 'primary-asset');
  assert.notEqual(heir.companies[0].id, 'portfolio-asset');
  assert.notStrictEqual(heir.business.staff, parent.business.staff);
  assert.notStrictEqual(heir.companies[0].products, parent.companies[0].products);
  assert.equal(parent.business.cashBalance, originalBusinessCash);
  assert.equal(parent.companies[0].cashBalance, originalCompanyCash);
  assert.equal(parent.business.value, 100000);
  assert.equal(parent.companies[0].value, 200000);
});

test('معرّفات الأصول الموروثة تظل فريدة حتى مع ساعة وعشوائية ثابتتين', () => {
  const context = makeContext();
  context.state = makeParent();
  vm.runInContext('Date.now = () => 1700000000000; Math.random = () => 0.99; startAsChild(0);', context);
  const heir = context.state;
  const assetIds = heir.assets.map(asset => String(asset.id));
  assert.equal(new Set(assetIds).size, assetIds.length, 'every inherited asset must receive a unique id');

  const primaryAsset = heir.assets.find(asset => asset.kind === 'business' && asset.title === heir.business.title);
  const portfolioAsset = heir.assets.find(asset => asset.kind === 'business' && asset.companyPortfolio && asset.title === heir.companies[0].title);
  assert.ok(primaryAsset, 'primary company must retain its own backing asset');
  assert.ok(portfolioAsset, 'portfolio company must retain its own backing asset');
  assert.equal(String(heir.business.assetId), String(primaryAsset.id));
  assert.equal(String(heir.companies[0].id), String(portfolioAsset.id));
  assert.equal(heir.business.value, primaryAsset.value);
  assert.equal(heir.companies[0].value, portfolioAsset.value);
  assert.notEqual(String(primaryAsset.id), String(portfolioAsset.id));
});

test('استمرار السلالة لأكثر من جيل يحتفظ بسجلات الشركات دون تكرار الأصول', () => {
  const context = makeContext();
  context.state = makeParent();
  vm.runInContext('startAsChild(0);', context);
  const firstHeir = context.state;
  firstHeir.children = [{
    id: 'grandchild-1',
    name: 'آدم منصور',
    gender: 'male',
    age: 22,
    smart: 76,
    health: 85,
    happiness: 80,
    schoolPerformance: 82,
    careerPotential: 78,
    independence: 80,
    relationshipLevel: 88,
    interest: 'الأعمال'
  }];
  firstHeir.willDistribution = 'الأبناء أولًا';
  vm.runInContext('startAsChild(0);', context);
  const secondHeir = context.state;

  assert.equal(secondHeir.name, 'آدم منصور');
  assert.ok(secondHeir.business);
  assert.equal(secondHeir.companies.length, 1);
  assert.equal(findBusinessAsset(secondHeir, secondHeir.business.assetId).value, secondHeir.business.value);
  assert.equal(findBusinessAsset(secondHeir, secondHeir.companies[0].id).value, secondHeir.companies[0].value);
  assert.equal(new Set(secondHeir.assets.map(asset => String(asset.id))).size, secondHeir.assets.length);
});
