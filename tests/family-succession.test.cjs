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
  'calculateEstateSnapshot',
  'inheritanceBeneficiaryShares',
  'calculateInheritance',
  'childInheritancePoolShare',
  'calculateChildInheritanceShare',
  'formatInheritancePercent',
  'buildInheritancePreview',
  'buildInheritanceAccounts',
  'createInheritanceHistoryRecord',
  'getInheritanceHistoryRecords',
  'buildInheritanceHistory',
  'familyTreeNode',
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
  'function esc(value) { return String(value ?? ""); }',
  'function fmt(value) { return String(value ?? 0); }',
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
  assert.equal(inheritance.totalEstateValue, context.calculateInheritance(parent, 1).totalEstateValue);
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

  const overdraftParent = makeParent();
  overdraftParent.business.cashBalance = -12000;
  const overdraftInheritance = context.calculateInheritance(overdraftParent, 0.8);
  const overdraftBusinesses = [overdraftInheritance.business, ...overdraftInheritance.companies].filter(Boolean);
  const overdraftCash = overdraftBusinesses.reduce((sum, business) =>
    sum + (business.treasuryMode === 'separate' ? Math.max(0, Number(business.cashBalance) || 0) : 0), 0);
  const overdraftLiabilities = overdraftBusinesses.reduce((sum, business) =>
    sum + Math.max(0, Number(business.taxLiability) || 0)
      + Math.max(0, Math.round(Number(business.credit && business.credit.principal) || 0)
        + Math.round(Number(business.credit && business.credit.accruedInterest) || 0))
      + (business.treasuryMode === 'separate' ? Math.max(0, -Number(business.cashBalance) || 0) : 0), 0);
  const overdraftGross = overdraftInheritance.bank
    + overdraftInheritance.assets.reduce((sum, item) => sum + Math.max(0, Number(item.value) || 0), 0)
    + overdraftInheritance.investments.reduce((sum, item) => sum + Math.max(0, Number(item.value) || 0), 0)
    + overdraftCash;
  assert.ok(overdraftInheritance.business.cashBalance < 0, 'a separate-treasury overdraft must remain attached to the inherited company');
  assert.equal(overdraftInheritance.value, Math.max(0, overdraftGross - overdraftLiabilities),
    'the net estate must subtract inherited tax, credit, and overdraft exactly once');
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

test('حصة الأبناء تُقسَّم بالتساوي عبر الوصايا القديمة والجديدة', () => {
  const context = makeContext();
  const policies = [
    ['الأسرة بالتساوي', 0.8],
    ['الأبناء أولًا', 0.9],
    ['الشريك أولًا', 0.45],
    ['التبرع بجزء', 0.65],
    [undefined, 0.8]
  ];

  for (const [policy, poolShare] of policies) {
    for (const count of [1, 2, 5]) {
      const previous = {
        willDistribution: policy,
        partner: { id: 'partner-' + String(policy || 'default') },
        children: Array.from({ length: count }, (_, index) => ({ id: 'child-' + index, name: 'ابن ' + index }))
      };
      context.state = previous;
      const shares = previous.children.map((_, index) =>
        vm.runInContext('calculateChildInheritanceShare(state, ' + index + ')', context));
      const expected = poolShare / count;
      for (const share of shares) assert.ok(Math.abs(share - expected) < 1e-12);
      assert.ok(Math.abs(shares.reduce((sum, share) => sum + share, 0) - poolShare) < 1e-12);
    }
  }

  context.state = { children: [] };
  assert.equal(vm.runInContext('calculateChildInheritanceShare(state, 0)', context), 0);
  context.state = { children: [{ id: 'only-child' }] };
  assert.equal(vm.runInContext('calculateChildInheritanceShare(state, -1)', context), 0);
  assert.equal(vm.runInContext('calculateChildInheritanceShare(state, 1)', context), 0);
});

test('الوصية تعيد توزيع الحصص على المستفيدين الموجودين فقط دون ترك نسبة معلّقة', () => {
  const context = makeContext();
  const cases = [
    { policy: 'الأسرة بالتساوي', children: 2, partner: false, expected: { children: 0.8, partner: 0, charity: 0, other: 0.2 } },
    { policy: 'الأبناء أولًا', children: 2, partner: false, expected: { children: 0.9, partner: 0, charity: 0, other: 0.1 } },
    { policy: 'الشريك أولًا', children: 2, partner: false, expected: { children: 1, partner: 0, charity: 0, other: 0 } },
    { policy: 'الأسرة بالتساوي', children: 0, partner: true, expected: { children: 0, partner: 1, charity: 0, other: 0 } },
    { policy: 'الشريك أولًا', children: 0, partner: true, expected: { children: 0, partner: 1, charity: 0, other: 0 } },
    { policy: 'التبرع بجزء', children: 0, partner: true, expected: { children: 0, partner: 0.65, charity: 0.35, other: 0 } },
    { policy: 'التبرع بجزء', children: 0, partner: false, expected: { children: 0, partner: 0, charity: 0.35, other: 0.65 } },
    { policy: 'الأسرة بالتساوي', children: 0, partner: false, expected: { children: 0, partner: 0, charity: 0, other: 1 } },
    { policy: 'الأسرة بالتساوي', children: 2, partner: true, expected: { children: 0.8, partner: 0.2, charity: 0, other: 0 } },
    { policy: 'الشريك أولًا', children: 2, partner: true, expected: { children: 0.45, partner: 0.55, charity: 0, other: 0 } }
  ];
  for (const scenario of cases) {
    const previous = {
      willDistribution: scenario.policy,
      bank: 10001,
      debt: 0,
      assets: [{ id: 'estate-home', kind: 'property', title: 'منزل', value: 9999 }],
      investments: [],
      children: Array.from({ length: scenario.children }, (_, index) => ({ id: 'child-' + index, name: 'ابن ' + index })),
      partner: scenario.partner ? { id: 'partner', name: 'الشريك' } : null
    };
    const shares = context.inheritanceBeneficiaryShares(previous);
    assert.equal(shares.childPoolShare, scenario.expected.children, scenario.policy + ' child pool');
    assert.equal(shares.partnerShare, scenario.expected.partner, scenario.policy + ' partner pool');
    assert.equal(shares.charitableShare, scenario.expected.charity, scenario.policy + ' charity pool');
    assert.equal(shares.otherBeneficiaryShare, scenario.expected.other, scenario.policy + ' other pool');
    const preview = context.buildInheritancePreview(previous);
    assert.equal(preview.childPoolValue + preview.partnerValue + preview.charitableValue + preview.otherBeneficiaryValue, preview.totalEstateValue);
    assert.equal(preview.outsideChildrenPoolValue, preview.partnerValue + preview.charitableValue + preview.otherBeneficiaryValue);
    assert.ok(preview.beneficiarySummary.length > 0);
  }
});

test('وصية الشريك أولًا لا تترك حصة الشريك معلّقة إذا لم يوجد شريك حي', () => {
  const context = makeContext();
  const parent = makeParent();
  parent.children.push({ id: 'heir-2', name: 'عمر منصور', age: 21, health: 80 });
  parent.partner = null;
  parent.willDistribution = 'الشريك أولًا';
  context.state = parent;
  vm.runInContext('startAsChild(0);', context);
  const heir = context.state;
  assert.equal(heir.legacy.distribution.childrenPoolShare, 1);
  assert.equal(heir.legacy.distribution.perChildShare, 0.5);
  assert.equal(heir.legacy.distribution.partnerShare, 0);
  assert.equal(heir.legacy.distribution.outsideChildrenPoolShare, 0);
  const sibling = heir.family.find(member => member.id === 'heir-2');
  assert.equal(sibling.inheritanceShare, 0.5);
  assert.equal(sibling.inheritanceStatus, 'مخصص من التركة');
});

test('ملخص صافي التركة يطابق حساب الإرث ويشمل خزائن الشركات وخصومها', () => {
  const context = makeContext();
  const parent = makeParent();
  const snapshot = context.calculateEstateSnapshot(parent);
  const fullInheritance = context.calculateInheritance(parent, 1);

  assert.equal(snapshot.net, fullInheritance.totalEstateValue);
  assert.ok(snapshot.businessCash > 0, 'separate company treasuries should be included in gross estate value');
  assert.ok(snapshot.businessLiabilities > 0, 'tax and credit obligations should reduce the estate');
  assert.ok(snapshot.personalDebt > 0, 'personal debt should remain distinct from company liabilities');

  const legacy = {
    bank: 20000,
    debt: 1000,
    assets: [{ id: 'legacy-business-asset', title: 'مشروع قديم', kind: 'business', value: 50000 }],
    investments: [],
    business: { assetId: 'legacy-business-asset', title: 'مشروع قديم', value: 50000, cashBalance: 7777, taxLiability: 0 }
  };
  const legacySnapshot = context.calculateEstateSnapshot(legacy);
  assert.equal(legacySnapshot.businessCash, 0, 'legacy shared cash must not be counted as a separate treasury');
  assert.equal(legacySnapshot.net, context.calculateInheritance(legacy, 1).totalEstateValue);
});

test('تسوية فروق التقريب تمنع إنشاء أو فقدان قيمة عند توريث أصول صغيرة متعددة', () => {
  const context = makeContext();
  const parent = makeParent();
  parent.bank = 0;
  parent.debt = 0;
  parent.assets = [
    { id: 'small-property-a', title: 'أصل صغير أ', kind: 'property', value: 1, upkeep: 1 },
    { id: 'small-property-b', title: 'أصل صغير ب', kind: 'property', value: 1, upkeep: 1 },
    { id: 'small-property-c', title: 'أصل صغير ج', kind: 'property', value: 1, upkeep: 1 },
    { id: 'small-business-asset', title: 'شركة صغيرة', kind: 'business', value: 1, upkeep: 1 }
  ];
  parent.investments = [];
  parent.business = {
    id: 'small-business-asset',
    assetId: 'small-business-asset',
    title: 'شركة صغيرة',
    value: 1,
    treasuryMode: 'separate',
    cashBalance: 0,
    taxLiability: 0
  };
  parent.companies = [];
  parent.partner = null;
  parent.willDistribution = 'الشريك أولًا';
  parent.children.push({ id: 'heir-2', name: 'عمر منصور', age: 22 });

  const preview = context.buildInheritancePreview(parent);
  assert.equal(preview.totalEstateValue, 4);
  assert.equal(preview.perChildShare, 0.5);
  assert.equal(preview.siblingAllocations[0].estimatedValue, 2);

  const inherited = context.calculateInheritance(parent, preview.perChildShare, preview.siblingAllocations[0].estimatedValue);
  const transferredAssetsValue = inherited.assets.reduce((sum, asset) => sum + asset.value, 0);
  assert.equal(inherited.value, 2);
  assert.equal(inherited.bank + transferredAssetsValue, 2);
  assert.equal(inherited.roundingAdjustment, 0);
  assert.ok(inherited.assets.every(asset => asset.value >= 0 && asset.upkeep >= 0));
  const inheritedBusinessAsset = inherited.assets.find(asset => String(asset.id) === String(inherited.business.assetId));
  assert.equal(inherited.business.value, inheritedBusinessAsset.value, 'the inherited company value must stay aligned with its backing asset');

  const defaultTarget = context.calculateInheritance(parent, preview.perChildShare);
  assert.equal(defaultTarget.value, Math.round(preview.totalEstateValue * preview.perChildShare));
});

test('اختيار الوارث يسوّي قيمة المنقول مع الحصة المعروضة في سجل الاستحقاقات', () => {
  const context = makeContext();
  const parent = makeParent();
  parent.bank = 0;
  parent.debt = 0;
  parent.assets = Array.from({ length: 4 }, (_, index) => ({
    id: 'succession-small-' + index,
    title: 'أصل عائلي صغير ' + index,
    kind: 'property',
    value: 1,
    upkeep: 0
  }));
  parent.investments = [];
  parent.business = null;
  parent.companies = [];
  parent.partner = null;
  parent.willDistribution = 'الشريك أولًا';
  parent.children.push({ id: 'heir-2', name: 'عمر منصور', age: 22 });
  context.state = parent;

  vm.runInContext('startAsChild(0);', context);
  const heir = context.state;
  const distribution = heir.legacy.distribution;
  const selectedAccount = distribution.beneficiaryAccounts.accounts.find(account => account.status === 'transferred');

  assert.equal(heir.legacy.inheritance, distribution.siblingAllocations[0].estimatedValue);
  assert.equal(selectedAccount.allocatedAmount, selectedAccount.settledAmount);
  assert.equal(distribution.beneficiaryAccounts.reconciliationDelta, 0);
  assert.equal(heir.legacy.inheritance, 2);
});

test('تاريخ الميراث يحتفظ بفرق التسوية في السجلات القديمة للمراجعة', () => {
  const context = makeContext();
  const record = context.createInheritanceHistoryRecord({
    sourceLifeId: 'legacy-rounding-estate',
    totalEstateValue: 100,
    totalAllocated: 100,
    totalReservedBalance: 0,
    totalSettledAmount: 102,
    accounts: [{
      id: 'legacy-rounding-account',
      beneficiaryId: 'heir',
      kind: 'child',
      allocatedAmount: 100,
      balance: 0,
      settledAmount: 102,
      status: 'transferred'
    }]
  }, 'تركة قديمة', 70);

  assert.equal(record.reconciliationDelta, 2);
  const records = context.getInheritanceHistoryRecords({ inheritanceHistory: [record] });
  assert.equal(records[0].reconciliationDelta, 2);
});

test('معاينة الإرث تستخدم نفس الحصص والقيم في شاشة الوفاة واستكمال السلالة دون تغيير الحفظ', () => {
  const context = makeContext();
  const policies = [
    ['الأسرة بالتساوي', 0.8],
    ['الأبناء أولًا', 0.9],
    ['الشريك أولًا', 0.45],
    ['التبرع بجزء', 0.65],
    [undefined, 0.8]
  ];

  for (const [policy, poolShare] of policies) {
    for (const count of [1, 2, 5]) {
      const parent = makeParent();
      parent.children = Array.from({ length: count }, (_, index) => ({
        id: 'preview-child-' + index,
        name: 'ابن المعاينة ' + index
      }));
      parent.partner = { id: 'preview-partner', name: 'شريك المعاينة' };
      parent.willDistribution = policy;
      const before = JSON.stringify(parent);
      const preview = context.buildInheritancePreview(parent);
      const expectedPool = Math.round(preview.totalEstateValue * poolShare);
      const expectedBase = Math.floor(expectedPool / count);
      const expectedRemainder = expectedPool - expectedBase * count;

      assert.equal(preview.childPoolShare, poolShare);
      assert.equal(preview.perChildShare, poolShare / count);
      assert.equal(preview.childCount, count);
      assert.equal(preview.childPoolValue, expectedPool);
      assert.equal(preview.siblingAllocations.length, count);
      assert.equal(preview.siblingAllocations.reduce((sum, item) => sum + item.estimatedValue, 0), expectedPool);
      preview.siblingAllocations.forEach((item, index) => {
        assert.equal(item.share, poolShare / count);
        assert.equal(item.estimatedValue, expectedBase + (index < expectedRemainder ? 1 : 0));
        assert.equal(item.selected, false);
      });
      assert.equal(preview.outsideChildrenPoolRecipient,
        policy === 'التبرع بجزء' ? 'تبرع خيري' : 'الشريك');
      assert.equal(JSON.stringify(parent), before, 'preview must not mutate the saved parent or children');
    }
  }

  context.setSeed(0x790123);
  const expectedRandom = vm.runInContext('Math.random()', context);
  context.setSeed(0x790123);
  context.buildInheritancePreview(makeParent());
  const actualRandom = vm.runInContext('Math.random()', context);
  assert.equal(actualRandom, expectedRandom, 'preview must not consume gameplay randomness');
});

test('بدء حياة أحد الأبناء ينقل حصته فقط ويسجل حصص الإخوة بالتساوي', () => {
  const context = makeContext();
  const parent = makeParent();
  parent.children.push({
    id: 'heir-2',
    name: 'عمر منصور',
    gender: 'male',
    age: 21,
    smart: 75,
    health: 86,
    happiness: 78,
    schoolPerformance: 84,
    careerPotential: 79,
    independence: 82,
    relationshipLevel: 87,
    interest: 'الأعمال'
  });
  parent.willDistribution = 'الأسرة بالتساوي';
  parent.partner = { id: 'partner-1', name: 'سارة منصور', age: 60, relationshipLevel: 90 };
  const totalEstate = context.calculateInheritance(parent, 1).totalEstateValue;
  const expectedSelectedInheritance = context.calculateInheritance(parent, 0.4).value;
  context.state = parent;

  vm.runInContext('startAsChild(0);', context);
  const heir = context.state;
  const distribution = heir.legacy.distribution;

  assert.equal(distribution.policy, 'الأسرة بالتساوي');
  assert.equal(distribution.childrenPoolShare, 0.8);
  assert.equal(distribution.childCount, 2);
  assert.equal(distribution.perChildShare, 0.4);
  assert.equal(distribution.selectedChildIndex, 0);
  assert.equal(distribution.totalEstateValue, totalEstate);
  assert.equal(distribution.childPoolValue, Math.round(totalEstate * 0.8));
  assert.equal(heir.legacy.inheritance, expectedSelectedInheritance);
  assert.equal(distribution.siblingAllocations.length, 2);
  assert.ok(distribution.siblingAllocations.every(item => item.share === 0.4));
  assert.equal(distribution.siblingAllocations.reduce((sum, item) => sum + item.estimatedValue, 0), distribution.childPoolValue);
  assert.equal(distribution.siblingAllocations[0].actualValue, expectedSelectedInheritance);

  const sibling = heir.family.find(member => member.id === 'heir-2');
  assert.ok(sibling);
  assert.equal(sibling.relation, 'أخ/أخت');
  assert.equal(sibling.inheritanceShare, 0.4);
  assert.equal(sibling.inheritanceEstimate, distribution.siblingAllocations[1].estimatedValue);
  assert.equal(sibling.inheritanceStatus, 'مخصص من التركة');
  assert.equal(sibling.inheritanceAccountStatus, 'استحقاق محفوظ');
  const siblingAccount = distribution.beneficiaryAccounts.accounts.find(account => account.beneficiaryId === 'heir-2');
  assert.equal(sibling.inheritanceAccountId, siblingAccount.id);
  assert.equal(siblingAccount.status, 'reserved');
  assert.equal(siblingAccount.balance, siblingAccount.allocatedAmount);
  const selectedAccount = distribution.beneficiaryAccounts.accounts.find(account => account.beneficiaryId === 'heir-1');
  assert.equal(distribution.selectedAccountId, selectedAccount.id);
  assert.equal(selectedAccount.status, 'transferred');
  assert.equal(selectedAccount.balance, 0);
  assert.equal(selectedAccount.settledAmount, expectedSelectedInheritance);
  const partner = heir.family.find(member => member.id === 'partner-1');
  assert.ok(partner);
  assert.equal(partner.inheritanceShare, 0.2);
  assert.equal(partner.inheritanceStatus, 'مخصص للشريك');
  assert.equal(partner.inheritanceAccountStatus, 'استحقاق محفوظ');
  const partnerAccount = distribution.beneficiaryAccounts.accounts.find(account => account.kind === 'partner');
  assert.equal(partner.inheritanceAccountId, partnerAccount.id);
  assert.equal(partnerAccount.balance, partnerAccount.allocatedAmount);
  assert.equal(distribution.beneficiaryAccounts.totalAllocated, totalEstate);
  assert.equal(distribution.outsideChildrenPoolRecipient, 'الشريك');
  assert.equal(parent.children[1].inheritanceShare, undefined, 'the archived parent\'s child record must not be mutated');
});

test('الابن الوحيد يحتفظ بالنسبة التاريخية نفسها ولا يتغير الحفظ القديم', () => {
  const context = makeContext();
  const parent = makeParent();
  const expected = context.calculateInheritance(parent, 0.8).value;
  context.state = parent;

  vm.runInContext('startAsChild(0);', context);
  assert.equal(context.state.legacy.inheritance, expected);
  assert.equal(context.state.legacy.distribution.perChildShare, 0.8);
  assert.equal(context.state.legacy.distribution.childCount, 1);
  assert.equal(context.state.version, 1);
});
test('شجرة العائلة تعرض حصة الإرث التقديرية للأخوة بعد استكمال السلالة', () => {
  const context = makeContext();
  const sibling = {
    id: 'sibling-legacy',
    name: 'عمر منصور',
    relation: 'أخ/أخت',
    age: 21,
    relationshipLevel: 80,
    inheritanceShare: 0.4,
    inheritanceEstimate: 12345,
    inheritanceStatus: 'مخصص من التركة'
  };
  const markup = vm.runInContext('familyTreeNode(' + JSON.stringify(sibling) + ')', context);
  assert.match(markup, /حصة الإرث 40%/);
  assert.match(markup, /تقدير 12345/);
  const linkedMarkup = vm.runInContext('familyTreeNode(' + JSON.stringify({...sibling,inheritanceAccountStatus:'استحقاق محفوظ'}) + ')', context);
  assert.match(linkedMarkup, /استحقاق محفوظ/);
});
test('عرض نسب الإرث يحافظ على الكسور بدل تقريب حصة 22.5% إلى 23%', () => {
  const context = makeContext();
  assert.equal(context.formatInheritancePercent(0.225), '22.5');
  assert.equal(context.formatInheritancePercent(0.4), '40');
  assert.equal(context.formatInheritancePercent(0.55555), '55.56');
  assert.equal(context.formatInheritancePercent(-0.1), '0');
  assert.equal(context.formatInheritancePercent(2), '100');

  const sibling = {
    name: 'أخ',
    relation: 'أخ/أخت',
    relationshipLevel: 80,
    inheritanceShare: 0.225,
    inheritanceEstimate: 1000,
    inheritanceStatus: 'مخصص من التركة'
  };
  const markup = vm.runInContext('familyTreeNode(' + JSON.stringify(sibling) + ')', context);
  assert.match(markup, /حصة الإرث 22\.5%/);
});

test('وصية الشريك أولًا تخصص 55% للشريك وتقسم 45% بالتساوي بين الأبناء', () => {
  const context = makeContext();
  const parent = makeParent();
  parent.children.push({ id: 'heir-2', name: 'عمر منصور', age: 21, health: 80 });
  parent.partner = { id: 'partner-first', name: 'سارة', age: 58, relationshipLevel: 95 };
  parent.willDistribution = 'الشريك أولًا';
  context.state = parent;

  vm.runInContext('startAsChild(0);', context);
  const heir = context.state;
  assert.equal(heir.legacy.distribution.childrenPoolShare, 0.45);
  assert.equal(heir.legacy.distribution.perChildShare, 0.225);
  const partner = heir.family.find(member => member.id === 'partner-first');
  assert.equal(partner.inheritanceShare, 0.55);
  assert.equal(partner.inheritanceEstimate, heir.legacy.distribution.outsideChildrenPoolValue);
  assert.equal(partner.inheritanceStatus, 'مخصص للشريك');
});

test('وصية التبرع تسجل الجزء الخيري خارج حصة الأبناء', () => {
  const context = makeContext();
  const parent = makeParent();
  parent.willDistribution = 'التبرع بجزء';
  parent.partner = { id: 'partner-donation', name: 'سارة', age: 58, relationshipLevel: 95 };
  context.state = parent;

  vm.runInContext('startAsChild(0);', context);
  const distribution = context.state.legacy.distribution;
  assert.equal(distribution.childrenPoolShare, 0.65);
  assert.equal(distribution.perChildShare, 0.65);
  assert.equal(distribution.outsideChildrenPoolShare, 0.35);
  assert.equal(distribution.outsideChildrenPoolRecipient, 'تبرع خيري');
  const partner = context.state.family.find(member => member.id === 'partner-donation');
  assert.ok(partner);
  assert.equal(partner.inheritanceShare, undefined, 'the charitable remainder must not be recorded as a spouse allocation');
});

test('سجل استحقاقات الإرث ينشئ قيدًا منفصلًا لكل ابن وشريك ويطابق إجمالي التركة', () => {
  const context = makeContext();
  const parent = makeParent();
  parent.children.push({ id: 'heir-2', name: 'عمر منصور', age: 21 });
  parent.children.push({ id: 'heir-3', name: 'مريم منصور', age: 19 });
  parent.partner = { id: 'partner-ledger', name: 'سارة منصور', age: 60 };
  const preview = context.buildInheritancePreview(parent);
  const transferred = context.calculateInheritance(parent, preview.perChildShare).value;
  const registry = context.buildInheritanceAccounts(parent, preview, 0, transferred);
  const childAccounts = registry.accounts.filter(account => account.kind === 'child');
  const partnerAccount = registry.accounts.find(account => account.kind === 'partner');

  assert.equal(childAccounts.length, 3);
  assert.equal(childAccounts[0].status, 'transferred');
  assert.equal(childAccounts[0].balance, 0);
  assert.equal(childAccounts[0].settledAmount, transferred);
  assert.equal(childAccounts[1].status, 'reserved');
  assert.equal(childAccounts[1].balance, childAccounts[1].allocatedAmount);
  assert.equal(partnerAccount.status, 'reserved');
  assert.equal(partnerAccount.balance, preview.partnerValue);
  assert.equal(registry.totalAllocated, preview.totalEstateValue);
  assert.equal(registry.totalReservedBalance, registry.accounts.reduce((sum, account) => sum + account.balance, 0));
  assert.equal(registry.totalSettledAmount, transferred);
  assert.equal(new Set(registry.accounts.map(account => account.id)).size, registry.accounts.length);
  assert.equal(parent.children[1].inheritanceAccountId, undefined, 'building the ledger must not mutate the archived family');
});

test('سجل الوصية يميز المبلغ الخيري والمستفيدين الآخرين دون تحويلهما إلى أموال اللاعب', () => {
  const context = makeContext();
  const parent = makeParent();
  parent.willDistribution = 'التبرع بجزء';
  parent.partner = null;
  const preview = context.buildInheritancePreview(parent);
  const registry = context.buildInheritanceAccounts(parent, preview, 0, context.calculateInheritance(parent, preview.perChildShare).value);
  const charity = registry.accounts.find(account => account.kind === 'charity');
  const child = registry.accounts.find(account => account.kind === 'child');

  assert.ok(charity);
  assert.equal(charity.status, 'earmarked');
  assert.equal(charity.balance, preview.charitableValue);
  assert.equal(child.status, 'transferred');
  assert.equal(registry.accounts.some(account => account.kind === 'other'), false);
  assert.equal(registry.totalAllocated, preview.totalEstateValue);

  parent.children = [];
  const noFamilyPreview = context.buildInheritancePreview(parent);
  const noFamilyRegistry = context.buildInheritanceAccounts(parent, noFamilyPreview, -1, 0);
  const other = noFamilyRegistry.accounts.find(account => account.kind === 'other');
  assert.ok(other);
  assert.equal(other.status, 'unassigned');
  assert.equal(other.balance, noFamilyPreview.otherBeneficiaryValue);
  assert.equal(noFamilyRegistry.totalAllocated, noFamilyPreview.totalEstateValue);
});


test('سجل مواريث العائلة يحتفظ بخمسة أجيال دون تكرار أو تعديل سجلات الأجداد', () => {
  const context = makeContext();
  let parent = makeParent();
  const sourceIds = [];

  for (let generation = 0; generation < 5; generation++) {
    if (generation > 0) {
      parent.lifeId = 'dynasty-life-' + generation;
      parent.name = 'الجيل ' + generation;
      parent.age = 60;
      parent.bank = 100000 + generation * 1000;
      parent.debt = 0;
      parent.assets = [];
      parent.investments = [];
      parent.business = null;
      parent.companies = [];
      parent.partner = null;
      parent.heirlooms = [];
      parent.children = [{
        id: 'dynasty-heir-' + generation,
        name: 'وارث ' + generation,
        gender: 'male',
        age: 25,
        health: 80,
        happiness: 80,
        smart: 75,
        looks: 70,
        relationshipLevel: 90,
        schoolPerformance: 85,
        careerPotential: 85,
        independence: 80
      }];
    }

    sourceIds.push(parent.lifeId);
    const previousHistory = JSON.stringify(parent.legacy && parent.legacy.inheritanceHistory || []);
    context.state = parent;
    vm.runInContext('startAsChild(0);', context);

    const heir = context.state;
    const history = heir.legacy.inheritanceHistory;
    assert.equal(history.length, generation + 1);
    assert.deepEqual(Array.from(history, record => record.sourceLifeId), sourceIds);
    assert.equal(new Set(history.map(record => record.id)).size, history.length);
    assert.equal(history[history.length - 1].sourceName, parent.name);
    assert.ok(history.every(record => Array.isArray(record.accounts)));
    assert.equal(
      JSON.stringify(parent.legacy && parent.legacy.inheritanceHistory || []),
      previousHistory,
      'starting the next generation must not mutate the previous generation history'
    );
    parent = heir;
  }
});

test('حفظ v84 القديم يُعرض ويُرحّل إلى تاريخ الأجيال دون تعديل المصدر', () => {
  const context = makeContext();
  const oldRegistry = {
    version: 1,
    sourceLifeId: 'grandparent-v84',
    currency: 'جنيه',
    totalEstateValue: 50000,
    totalAllocated: 50000,
    totalReservedBalance: 30000,
    totalSettledAmount: 20000,
    accounts: [{
      id: 'old-account',
      beneficiaryId: 'old-sibling',
      name: 'الأخ القديم',
      kind: 'child',
      share: 0.4,
      allocatedAmount: 20000,
      balance: 20000,
      settledAmount: 0,
      status: 'reserved',
      currency: 'جنيه'
    }]
  };
  const legacy = {
    name: 'الجد القديم',
    distribution: { beneficiaryAccounts: oldRegistry }
  };

  const visibleRecords = context.getInheritanceHistoryRecords(legacy);
  assert.equal(visibleRecords.length, 1);
  assert.equal(visibleRecords[0].sourceLifeId, 'grandparent-v84');
  assert.equal(visibleRecords[0].sourceName, 'الجد القديم');
  assert.equal(visibleRecords[0].accounts[0].name, 'الأخ القديم');

  const currentRegistry = {
    version: 1,
    sourceLifeId: 'parent-v85',
    currency: 'جنيه',
    totalEstateValue: 80000,
    totalAllocated: 80000,
    totalReservedBalance: 40000,
    totalSettledAmount: 40000,
    accounts: []
  };
  const history = context.buildInheritanceHistory({
    name: 'الأب الحالي',
    age: 65,
    legacy
  }, currentRegistry);

  assert.deepEqual(Array.from(history, record => record.sourceLifeId), ['grandparent-v84', 'parent-v85']);
  assert.equal(history[1].sourceName, 'الأب الحالي');
  assert.equal(legacy.inheritanceHistory, undefined, 'reading an old save must not mutate it');
});
