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
  'buildBeneficiaryWallets',
  'familyPropertyOwnershipRecords',
  'buildFamilyPropertyOwnership',
  'safeFamilyOwnershipShare',
  'recordFamilyPropertySale',
  'syncFamilyPropertyMarketValue',
  'beneficiaryWalletLedgerTotals',
  'recordBeneficiaryWalletSupport',
  'recordBeneficiaryWalletRentalIncome',
  'recordBeneficiaryWalletPropertyExpense',
  'classifyFamilyPropertyRentResult',
  'distributeFamilyPropertyRent',
  'distributeFamilyPropertyExpense',
  'maintainAsset',
  'supportBeneficiaryWallet',
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
  'var saveCalls = 0;',
  'var saveResult = true;',
  'var renderCalls = { header: 0, stats: 0, feed: 0 };',
  'var infoMessages = [];',
  'var closeModalCalls = 0;',
  'function save() { saveCalls += 1; return saveResult; }',
  'function renderHeader() { renderCalls.header += 1; }',
  'function renderStats() { renderCalls.stats += 1; }',
  'function renderFeed() { renderCalls.feed += 1; }',
  'function render() {}',
  'function closeModal() { closeModalCalls += 1; }',
  'function info(...args) { infoMessages.push(args); }',
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

  const roundedUpParent = makeParent();
  roundedUpParent.bank = 0;
  roundedUpParent.debt = 0;
  roundedUpParent.assets = Array.from({ length: 3 }, (_, index) => ({
    id: 'round-up-asset-' + index,
    title: 'أصل تقريب ' + index,
    kind: 'property',
    value: 1,
    upkeep: 0
  }));
  roundedUpParent.investments = [];
  roundedUpParent.business = null;
  roundedUpParent.companies = [];
  roundedUpParent.partner = null;
  const roundedUp = context.calculateInheritance(roundedUpParent, 0.25);
  assert.equal(roundedUp.value, 1);
  assert.equal(roundedUp.bank, 1, 'a positive rounding residual should be kept as balancing cash');
  assert.equal(roundedUp.roundingAdjustment, 0);
  const invalidTarget = context.calculateInheritance(roundedUpParent, 0.25, NaN);
  assert.equal(invalidTarget.value, 1, 'an invalid optional target should fall back to the calculated share');
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

test('تفاصيل المستفيدين تكشف قيمة تسوية تاريخية قديمة غير متطابقة وتحافظ على التحذير بعد إعادة القراءة', () => {
  const context = makeContext();
  const staleZero = context.createInheritanceHistoryRecord({
    sourceLifeId: 'stale-zero-reconciliation',
    reconciliationDelta: 0,
    totalEstateValue: 100,
    totalAllocated: 100,
    totalReservedBalance: 0,
    totalSettledAmount: 102,
    accounts: [{
      id: 'stale-zero-account',
      beneficiaryId: 'heir-a',
      allocatedAmount: 100,
      balance: 0,
      settledAmount: 102,
      status: 'transferred'
    }]
  }, 'تركة ذات ملخص قديم', 70);

  assert.equal(staleZero.reconciliationDelta, 2, 'normalized account details must be the source of truth');
  assert.equal(staleZero.reconciliationMetadataMismatch, true);
  assert.equal(staleZero.reportedReconciliationDelta, 0);

  const reloaded = context.getInheritanceHistoryRecords({ inheritanceHistory: [staleZero] })[0];
  assert.equal(reloaded.reconciliationDelta, 2);
  assert.equal(reloaded.reconciliationMetadataMismatch, true);
  assert.equal(reloaded.reportedReconciliationDelta, 0);

  const stalePositive = context.createInheritanceHistoryRecord({
    sourceLifeId: 'stale-positive-reconciliation',
    reconciliationDelta: 7,
    totalEstateValue: 100,
    totalAllocated: 100,
    totalReservedBalance: 0,
    totalSettledAmount: 100,
    accounts: [{
      id: 'stale-positive-account',
      beneficiaryId: 'heir-b',
      allocatedAmount: 100,
      balance: 0,
      settledAmount: 100,
      status: 'transferred'
    }]
  }, 'تركة ذات ملخص زائد', 72);

  assert.equal(stalePositive.reconciliationDelta, 0);
  assert.equal(stalePositive.reconciliationMetadataMismatch, true);
  assert.equal(stalePositive.reportedReconciliationDelta, 7);
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


test('سجل التركة يكشف نقص الرصيد المحجوز داخل حساب مستفيد ويحتفظ بالتنبيه بعد إعادة القراءة', () => {
  const context = makeContext();
  const record = context.createInheritanceHistoryRecord({
    sourceLifeId: 'reserved-account-gap',
    currency: 'جنيه',
    totalEstateValue: 100,
    totalAllocated: 100,
    totalReservedBalance: 90,
    totalSettledAmount: 0,
    accounts: [{
      id: 'reserved-gap-account',
      beneficiaryId: 'sibling-gap',
      name: 'الأخت مريم',
      kind: 'child',
      share: 1,
      allocatedAmount: 100,
      balance: 90,
      settledAmount: 0,
      status: 'reserved'
    }]
  }, 'تركة غير متوازنة', 70);

  assert.equal(record.accountLedgerMismatch, true);
  assert.equal(record.accountLedgerIssueCount, 1);
  assert.equal(record.accountLedgerIncompleteCount, 0);
  assert.equal(record.accountLedgerIssues[0].name, 'الأخت مريم');
  assert.equal(record.accountLedgerIssues[0].delta, -10);

  const reloaded = context.getInheritanceHistoryRecords({ inheritanceHistory: [record] })[0];
  assert.equal(reloaded.accountLedgerMismatch, true);
  assert.equal(reloaded.accountLedgerIssueCount, 1);
  assert.equal(reloaded.accountLedgerIssues[0].delta, -10);
});

test('سجل التركة يميز بيانات الحساب القديمة الناقصة عن وجود خلل مالي مؤكد', () => {
  const context = makeContext();
  const record = context.createInheritanceHistoryRecord({
    sourceLifeId: 'legacy-incomplete-account',
    totalEstateValue: 100,
    totalAllocated: 100,
    totalReservedBalance: 100,
    totalSettledAmount: 0,
    accounts: [{
      id: 'legacy-incomplete',
      beneficiaryId: 'legacy-heir',
      name: 'وارث قديم',
      allocatedAmount: 100,
      status: 'reserved'
    }]
  }, 'تركة قديمة', 68);

  assert.equal(record.accountLedgerMismatch, false);
  assert.equal(record.accountLedgerIssueCount, 0);
  assert.equal(record.accountLedgerIncompleteCount, 1);
  assert.equal(record.accounts[0].ledgerAuditComplete, false);
});

test('سجل التركة يكتشف تعارض ملخص الأرصدة مع مجموع حسابات المستفيدين', () => {
  const context = makeContext();
  const record = context.createInheritanceHistoryRecord({
    sourceLifeId: 'estate-summary-gap',
    totalEstateValue: 100,
    totalAllocated: 100,
    totalReservedBalance: 90,
    totalSettledAmount: 0,
    accounts: [{
      id: 'balanced-reserved',
      beneficiaryId: 'heir-summary',
      name: 'الابن',
      allocatedAmount: 100,
      balance: 100,
      settledAmount: 0,
      status: 'reserved'
    }]
  }, 'تركة بملخص متعارض', 70);

  assert.equal(record.accountLedgerMismatch, true);
  assert.equal(record.accountLedgerIssueCount, 1);
  assert.equal(record.accountLedgerSummaryIssues[0].field, 'totalReservedBalance');
  assert.equal(record.accountLedgerSummaryIssues[0].delta, 10);
});


test('سجل التركة يرفض المبالغ السالبة بدل تحويلها بصمت إلى صفر', () => {
  const context = makeContext();
  const record = context.createInheritanceHistoryRecord({
    sourceLifeId: 'negative-ledger-amount',
    totalEstateValue: 0,
    totalAllocated: 0,
    totalReservedBalance: 0,
    totalSettledAmount: 0,
    accounts: [{
      id: 'negative-account',
      beneficiaryId: 'negative-heir',
      name: 'مستفيد بقيمة غير صالحة',
      allocatedAmount: -10,
      balance: 0,
      settledAmount: 0,
      status: 'reserved'
    }]
  }, 'تركة ببيانات غير صالحة', 70);

  assert.equal(record.accountLedgerMismatch, true);
  assert.equal(record.accountLedgerIssueCount, 1);
  assert.equal(record.accountLedgerIssues[0].reason, 'negative_amount');
  assert.equal(record.accountLedgerIssues[0].delta, null);
});


test('دفتر الميراث يرفض نسبة مستفيد خارج النطاق ويحافظ على القيمة الأصلية عند إعادة القراءة', () => {
  const context = makeContext();
  const record = context.createInheritanceHistoryRecord({
    sourceLifeId: 'invalid-beneficiary-share',
    currency: 'جنيه',
    totalEstateValue: 100,
    totalAllocated: 100,
    totalReservedBalance: 100,
    totalSettledAmount: 0,
    accounts: [{
      id: 'invalid-share-account',
      beneficiaryId: 'invalid-share-heir',
      name: 'وارث بنسبة غير صالحة',
      kind: 'child',
      share: 1.2,
      allocatedAmount: 100,
      balance: 100,
      settledAmount: 0,
      status: 'reserved',
      currency: 'جنيه'
    }]
  }, 'تركة نسبة غير صالحة', 70);

  assert.equal(record.accountLedgerMismatch, true);
  assert.equal(record.accountLedgerShareMismatch, true);
  assert.equal(record.accountLedgerIssues[0].reason, 'invalid_share');
  assert.equal(record.accounts[0].share, 1, 'the runtime share remains safely clamped');
  assert.equal(record.accounts[0].reportedShare, 1.2, 'the invalid source value remains auditable');

  const reloaded = context.getInheritanceHistoryRecords({ inheritanceHistory: [record] })[0];
  assert.equal(reloaded.accountLedgerMismatch, true);
  assert.equal(reloaded.accountLedgerIssues[0].reason, 'invalid_share');
  assert.equal(reloaded.accounts[0].reportedShare, 1.2);
});

test('دفتر الميراث يتحقق من أن مجموع نسب المستفيدين يساوي كامل التركة', () => {
  const context = makeContext();
  const record = context.createInheritanceHistoryRecord({
    sourceLifeId: 'share-total-gap',
    currency: 'جنيه',
    totalEstateValue: 100,
    totalAllocated: 100,
    totalReservedBalance: 100,
    totalSettledAmount: 0,
    accounts: [
      { id: 'share-a', beneficiaryId: 'heir-a', name: 'الابن الأول', share: 0.4, allocatedAmount: 50, balance: 50, settledAmount: 0, status: 'reserved', currency: 'جنيه' },
      { id: 'share-b', beneficiaryId: 'heir-b', name: 'الابن الثاني', share: 0.4, allocatedAmount: 50, balance: 50, settledAmount: 0, status: 'reserved', currency: 'جنيه' }
    ]
  }, 'تركة نسب ناقصة', 72);

  assert.equal(record.accountLedgerMismatch, true);
  assert.equal(record.accountLedgerShareTotal, 0.8);
  assert.equal(record.accountLedgerShareMismatch, true);
  assert.ok(record.accountLedgerIssues.some(issue => issue.reason === 'share_total_mismatch'));
});

test('دفتر الميراث يكشف تكرار المستفيد ومعرّف الحساب واختلاف العملة ومصدر التركة', () => {
  const context = makeContext();
  const record = context.createInheritanceHistoryRecord({
    sourceLifeId: 'identity-currency-gap',
    currency: 'جنيه',
    totalEstateValue: 100,
    totalAllocated: 100,
    totalReservedBalance: 100,
    totalSettledAmount: 0,
    accounts: [
      { id: 'duplicate-account', beneficiaryId: 'same-heir', name: 'مستفيد أول', share: 0.5, allocatedAmount: 50, balance: 50, settledAmount: 0, status: 'reserved', currency: 'جنيه', sourceLifeId: 'identity-currency-gap' },
      { id: 'duplicate-account', beneficiaryId: 'same-heir', name: 'مستفيد مكرر', share: 0.5, allocatedAmount: 50, balance: 50, settledAmount: 0, status: 'reserved', currency: 'دولار', sourceLifeId: 'another-estate' }
    ]
  }, 'تركة بهوية متعارضة', 71);

  const reasons = record.accountLedgerIssues.map(issue => issue.reason);
  assert.ok(reasons.includes('duplicate_account_id'));
  assert.ok(reasons.includes('duplicate_beneficiary_id'));
  assert.ok(reasons.includes('currency_mismatch'));
  assert.ok(reasons.includes('source_life_mismatch'));
  assert.equal(record.accountLedgerMismatch, true);
});

test('الحساب القديم الذي يفتقد نسبة المستفيد يظل قابلًا للعرض دون إعلان سلامة غير مستحقة', () => {
  const context = makeContext();
  const record = context.createInheritanceHistoryRecord({
    sourceLifeId: 'legacy-share-missing',
    currency: 'جنيه',
    totalEstateValue: 100,
    totalAllocated: 100,
    totalReservedBalance: 100,
    totalSettledAmount: 0,
    accounts: [{
      id: 'legacy-share-account',
      beneficiaryId: 'legacy-share-heir',
      name: 'وارث قديم',
      allocatedAmount: 100,
      balance: 100,
      settledAmount: 0,
      status: 'reserved'
    }]
  }, 'تركة قديمة ناقصة النسبة', 70);

  assert.equal(record.accountLedgerMismatch, false);
  assert.equal(record.accountLedgerIncompleteCount, 1);
  assert.equal(record.accountLedgerShareTotal, null);
  assert.equal(record.accountLedgerShareIncompleteCount, 1);
});


test('دفتر الميراث يرفض النسب النصية غير الرقمية والقيم المنطقية وغير المنتهية ويحفظ أصل المخالفة', () => {
  const context = makeContext();
  const cases = [
    { name: 'نسبة نصية غير رقمية', share: 'نسبة غير معروفة', reported: 'نسبة غير معروفة' },
    { name: 'نسبة منطقية', share: true, reported: true },
    { name: 'قيمة غير رقمية', share: NaN, reported: 'NaN' },
    { name: 'نسبة غير منتهية', share: Infinity, reported: 'Infinity' }
  ];

  for (const scenario of cases) {
    const record = context.createInheritanceHistoryRecord({
      sourceLifeId: 'malformed-share-' + scenario.name,
      currency: 'جنيه',
      totalEstateValue: 100,
      totalAllocated: 100,
      totalReservedBalance: 100,
      totalSettledAmount: 0,
      accounts: [{
        id: 'malformed-share-account',
        beneficiaryId: 'malformed-share-heir',
        name: scenario.name,
        share: scenario.share,
        allocatedAmount: 100,
        balance: 100,
        settledAmount: 0,
        status: 'reserved',
        currency: 'جنيه'
      }]
    }, 'تركة بنسبة غير رقمية', 70);

    assert.equal(record.accountLedgerMismatch, true, scenario.name);
    assert.equal(record.accountLedgerShareMismatch, true, scenario.name);
    assert.ok(record.accountLedgerIssues.some(issue => issue.reason === 'invalid_share'), scenario.name);
    assert.equal(record.accounts[0].share, 0, 'invalid values must not enter runtime allocation math');
    assert.equal(record.accounts[0].reportedShare, scenario.reported, 'the original invalid value must remain auditable');

    const reloaded = context.getInheritanceHistoryRecords({ inheritanceHistory: [record] })[0];
    assert.equal(reloaded.accountLedgerMismatch, true, 'the warning must survive reload');
    assert.equal(reloaded.accounts[0].reportedShare, scenario.reported);
  }
});

test('النسبة الرقمية المحفوظة كنص تظل مقروءة للتوافق ولا تُعامل كقيمة تالفة', () => {
  const context = makeContext();
  const record = context.createInheritanceHistoryRecord({
    sourceLifeId: 'numeric-string-share',
    currency: 'جنيه',
    totalEstateValue: 100,
    totalAllocated: 100,
    totalReservedBalance: 100,
    totalSettledAmount: 0,
    accounts: [{
      id: 'numeric-string-account',
      beneficiaryId: 'numeric-string-heir',
      name: 'وارث بنسبة رقمية نصية',
      share: '1',
      allocatedAmount: 100,
      balance: 100,
      settledAmount: 0,
      status: 'reserved',
      currency: 'جنيه'
    }]
  }, 'تركة بنسبة رقمية نصية', 70);

  assert.equal(record.accountLedgerMismatch, false);
  assert.equal(record.accounts[0].share, 1);
  assert.equal(record.accounts[0].ledgerShareAuditComplete, true);
});


test('محافظ الورثة تنشأ للحصص المحفوظة للأبناء والشريك فقط دون تكرار حصة الوارث الحالي', () => {
  const context = makeContext();
  const registry = {
    sourceLifeId: 'wallet-estate-one',
    currency: 'جنيه',
    totalEstateValue: 100000,
    totalAllocated: 100000,
    totalReservedBalance: 60000,
    totalSettledAmount: 40000,
    reconciliationDelta: 0,
    accounts: [
      { id: 'wallet-sibling-account', beneficiaryId: 'sibling-wallet-1', name: 'الأخت سلمى', kind: 'child', share: 0.4, allocatedAmount: 40000, balance: 40000, settledAmount: 0, status: 'reserved', currency: 'جنيه' },
      { id: 'wallet-selected-account', beneficiaryId: 'selected-wallet-heir', name: 'الوارث الحالي', kind: 'child', share: 0.4, allocatedAmount: 40000, balance: 0, settledAmount: 40000, status: 'transferred', currency: 'جنيه' },
      { id: 'wallet-partner-account', beneficiaryId: 'partner-wallet-1', name: 'الشريك', kind: 'partner', share: 0.2, allocatedAmount: 20000, balance: 20000, settledAmount: 0, status: 'reserved', currency: 'جنيه' }
    ]
  };

  const wallets = context.buildBeneficiaryWallets({}, registry, 'صاحب التركة', 72);
  assert.equal(wallets.length, 2);
  assert.deepEqual(Array.from(wallets, wallet => wallet.kind).sort(), ['child', 'partner']);
  assert.ok(wallets.every(wallet => wallet.ledgerAuditComplete && !wallet.ledgerMismatch));
  assert.equal(wallets.find(wallet => wallet.beneficiaryId === 'sibling-wallet-1').balance, 40000);
  assert.equal(wallets.find(wallet => wallet.beneficiaryId === 'partner-wallet-1').balance, 20000);
  assert.equal(wallets.some(wallet => wallet.beneficiaryId === 'selected-wallet-heir'), false);
  assert.equal(wallets[0].transactions[0].type, 'inheritance');

  const reloaded = context.buildBeneficiaryWallets({ beneficiaryWallets: wallets }, registry, 'صاحب التركة', 72);
  assert.equal(reloaded.length, 2, 'rebuilding the same estate must not duplicate wallets');
  assert.deepEqual(Array.from(reloaded, wallet => wallet.id), Array.from(wallets, wallet => wallet.id));
});

test('محفظة الوارث تحتفظ برصيدها وحركات المساندة عند إضافة تركة من جيل لاحق', () => {
  const context = makeContext();
  const firstRegistry = {
    sourceLifeId: 'wallet-generation-one',
    currency: 'جنيه',
    totalEstateValue: 5000,
    totalAllocated: 5000,
    totalReservedBalance: 5000,
    totalSettledAmount: 0,
    reconciliationDelta: 0,
    accounts: [{ id: 'wallet-first-account', beneficiaryId: 'sibling-stable-id', name: 'الأخ كريم', kind: 'child', share: 1, allocatedAmount: 5000, balance: 5000, settledAmount: 0, status: 'reserved', currency: 'جنيه' }]
  };
  const first = context.buildBeneficiaryWallets({}, firstRegistry, 'الجيل الأول', 70);
  const wallet = first[0];
  const support = context.recordBeneficiaryWalletSupport(wallet, 1500, {
    transactionId: 'support-generation-one',
    lifeId: 'active-heir-life',
    name: 'ليلى',
    age: 31,
    year: 31
  });
  assert.equal(support.ok, true);
  assert.equal(wallet.balance, 6500);
  assert.equal(wallet.supportTotal, 1500);

  const secondRegistry = {
    sourceLifeId: 'wallet-generation-two',
    currency: 'جنيه',
    totalEstateValue: 8000,
    totalAllocated: 8000,
    totalReservedBalance: 8000,
    totalSettledAmount: 0,
    reconciliationDelta: 0,
    accounts: [{ id: 'wallet-second-account', beneficiaryId: 'second-sibling-id', name: 'الأخت نور', kind: 'child', share: 1, allocatedAmount: 8000, balance: 8000, settledAmount: 0, status: 'reserved', currency: 'جنيه' }]
  };
  const next = context.buildBeneficiaryWallets({ beneficiaryWallets: first }, secondRegistry, 'الجيل الثاني', 68);
  const preserved = next.find(item => item.id === wallet.id);
  assert.equal(next.length, 2);
  assert.equal(preserved.balance, 6500);
  assert.equal(preserved.supportTotal, 1500);
  assert.equal(preserved.transactions.length, 2);
  assert.ok(next.some(item => item.beneficiaryId === 'second-sibling-id'));
});

test('تحويل المساعدة إلى محفظة الوريث يرفض المبالغ غير الصالحة والتكرار والدفتر غير المتوازن', () => {
  const context = makeContext();
  const wallet = {
    id: 'wallet-support-test',
    beneficiaryId: 'support-heir',
    kind: 'child',
    currency: 'جنيه',
    openingBalance: 5000,
    supportTotal: 0,
    balance: 5000,
    transactions: [{ id: 'wallet-support-test-inheritance', type: 'inheritance', amount: 5000, currency: 'جنيه' }],
    ledgerAuditComplete: true,
    ledgerMismatch: false
  };

  assert.equal(context.recordBeneficiaryWalletSupport(wallet, 0, { transactionId: 'zero' }).reason, 'invalid_amount');
  assert.equal(context.recordBeneficiaryWalletSupport(wallet, -100, { transactionId: 'negative' }).reason, 'invalid_amount');
  assert.equal(context.recordBeneficiaryWalletSupport(wallet, 1000, { transactionId: 'gift-1', lifeId: 'life-a', name: 'الوارث', age: 30, year: 30 }).ok, true);
  assert.equal(wallet.balance, 6000);
  assert.equal(wallet.supportTotal, 1000);
  assert.equal(context.recordBeneficiaryWalletSupport(wallet, 1000, { transactionId: 'gift-1' }).reason, 'duplicate_transaction');

  const corrupted = { ...wallet, balance: 5900 };
  const rejected = context.recordBeneficiaryWalletSupport(corrupted, 500, { transactionId: 'gift-2' });
  assert.equal(rejected.reason, 'ledger_mismatch');
  assert.equal(corrupted.balance, 5900, 'a failed transfer must not silently repair a corrupted wallet');
});

test('تحويل مساعدة الوريث يحفظ الخصم والإضافة وسجل الحياة بعملية حفظ واحدة', () => {
  const context = makeContext();
  const wallet = {
    id: 'wallet-atomic-success', beneficiaryId: 'sibling-atomic', name: 'الأخت سلمى', kind: 'child', currency: 'جنيه',
    sourceLifeId: 'estate-atomic', sourceName: 'الجيل السابق', openingBalance: 5000, supportTotal: 0, balance: 5000,
    transactions: [{ id: 'wallet-atomic-inheritance', type: 'inheritance', amount: 5000, currency: 'جنيه' }],
    ledgerAuditComplete: true, ledgerMismatch: false
  };
  context.state = {
    lifeId: 'active-atomic-life', name: 'ليلى', age: 31, yearCount: 31, bank: 10000,
    place: { unit: 'جنيه' }, log: [{ age: 30, icon: '🌱', title: 'حدث سابق', text: 'بداية مستقرة', tone: 'good' }],
    legacy: { beneficiaryWallets: [wallet] }
  };
  context.getBeneficiaryWallets = () => [wallet];

  context.supportBeneficiaryWallet(wallet.id, 1000);

  assert.equal(context.saveCalls, 1, 'the transfer should commit through one primary save');
  assert.equal(context.state.bank, 9000, 'the active heir should be debited once');
  assert.equal(wallet.balance, 6000, 'the beneficiary wallet should be credited once');
  assert.equal(wallet.supportTotal, 1000);
  assert.equal(context.state.log.length, 2, 'the transfer event should be committed with the balances');
  assert.equal(context.state.log[1].title, 'مساعدة عائلية');
  assert.deepEqual(JSON.parse(JSON.stringify(context.renderCalls)), { header: 1, stats: 1, feed: 1 });
  assert.equal(context.closeModalCalls, 1);
  assert.equal(context.infoMessages.at(-1)[1], 'تم تسجيل المساعدة');
});

test('فشل حفظ تحويل المساعدة يعيد الرصيد والمحفظة وسجل الحياة دون كتابة جزئية ثانية', () => {
  const context = makeContext();
  const wallet = {
    id: 'wallet-atomic-failure', beneficiaryId: 'sibling-atomic-failure', name: 'الأخ كريم', kind: 'child', currency: 'جنيه',
    sourceLifeId: 'estate-atomic-failure', sourceName: 'الجيل السابق', openingBalance: 7000, supportTotal: 500, balance: 7500,
    transactions: [
      { id: 'wallet-atomic-failure-inheritance', type: 'inheritance', amount: 7000, currency: 'جنيه' },
      { id: 'wallet-atomic-failure-support', type: 'support', amount: 500, currency: 'جنيه' }
    ],
    ledgerAuditComplete: true, ledgerMismatch: false
  };
  const walletBefore = JSON.stringify(wallet);
  const logBefore = [{ age: 30, icon: '📚', title: 'حدث سابق', text: 'سجل محفوظ', tone: '' }];
  context.state = {
    lifeId: 'active-atomic-failure-life', name: 'ليلى', age: 32, yearCount: 32, bank: 12000,
    place: { unit: 'جنيه' }, log: logBefore.slice(), legacy: { beneficiaryWallets: [wallet] }
  };
  context.getBeneficiaryWallets = () => [wallet];
  context.saveResult = false;

  context.supportBeneficiaryWallet(wallet.id, 1000);

  assert.equal(context.saveCalls, 1, 'a failed transfer should not perform a second hidden save through log()');
  assert.equal(context.state.bank, 12000, 'the active heir debit must be rolled back');
  assert.equal(JSON.stringify(wallet), walletBefore, 'the beneficiary wallet credit and transaction must be rolled back');
  assert.deepEqual(JSON.parse(JSON.stringify(context.state.log)), logBefore, 'the life diary event must be rolled back');
  assert.equal(context.closeModalCalls, 0, 'the transfer screen should remain available after a failed save');
  assert.equal(context.infoMessages.at(-1)[1], 'تعذر حفظ التحويل');
  assert.deepEqual(JSON.parse(JSON.stringify(context.renderCalls)), { header: 1, stats: 1, feed: 1 },
    'the visible balances and diary should be restored after rollback');
});


test('ملكية العقار العائلي تتوزع على المستفيدين دون تكرار قيمة الأصل', () => {
  const context = makeContext();
  const previous = {
    lifeId: 'property-parent-life',
    name: 'الوالد',
    age: 72,
    bank: 0,
    assets: [{ id: 'family-home-1', title: 'بيت العائلة', kind: 'property', value: 1000000, upkeep: 20000, condition: 100 }],
    investments: [],
    business: null,
    companies: [],
    debt: 0,
    place: { unit: 'جنيه' },
    legacy: { activeBeneficiaryId: 'parent-owner' }
  };
  const registry = {
    sourceLifeId: 'property-estate-one',
    currency: 'جنيه',
    accounts: [
      { beneficiaryId: 'active-heir', name: 'الابن الحالي', kind: 'child', share: 0.5, status: 'transferred' },
      { beneficiaryId: 'sibling-heir', name: 'الأخت مريم', kind: 'child', share: 0.5, status: 'reserved' }
    ]
  };

  const inherited = context.calculateInheritance(previous, 0.5, 500000);
  assert.equal(inherited.assets[0].familyAssetId, 'family-property-property-parent-life-family-home-1');
  assert.equal(inherited.assets[0].ownershipShare, 0.5);
  assert.equal(inherited.assets[0].familyAssetOriginalValue, 1000000);

  const records = context.buildFamilyPropertyOwnership(previous, registry);
  assert.equal(records.length, 1);
  const record = records[0];
  assert.equal(record.auditStatus, 'balanced');
  assert.equal(record.marketValue, 1000000);
  assert.equal(record.owners.length, 2);
  assert.equal(record.owners.find(owner => owner.beneficiaryId === 'active-heir').share, 0.5);
  assert.equal(record.owners.find(owner => owner.beneficiaryId === 'sibling-heir').share, 0.5);
  assert.ok(Math.abs(record.totalOwnershipShare - 1) < 1e-9);
});

test('التزامات التركة تظهر كحصة غير موزعة ولا تختفي من سجل الملكية', () => {
  const context = makeContext();
  const previous = {
    lifeId: 'property-debt-life', name: 'صاحب العقار', age: 68, bank: 0,
    assets: [{ id: 'debt-home', title: 'منزل عليه التزامات', kind: 'property', value: 1000000, upkeep: 12000 }],
    investments: [], business: null, companies: [], debt: 200000,
    place: { unit: 'جنيه' }, legacy: { activeBeneficiaryId: 'debt-owner' }
  };
  const registry = {
    sourceLifeId: 'property-debt-estate', currency: 'جنيه',
    accounts: [
      { beneficiaryId: 'debt-heir-a', name: 'الابن الأول', kind: 'child', share: 0.5, status: 'transferred' },
      { beneficiaryId: 'debt-heir-b', name: 'الابن الثاني', kind: 'child', share: 0.5, status: 'reserved' }
    ]
  };
  const record = context.buildFamilyPropertyOwnership(previous, registry)[0];
  assert.equal(record.auditStatus, 'balanced');
  assert.equal(record.owners.find(owner => owner.beneficiaryId === 'debt-heir-a').share, 0.4);
  assert.equal(record.owners.find(owner => owner.beneficiaryId === 'debt-heir-b').share, 0.4);
  assert.equal(record.encumberedShare, 0.2);
  assert.equal(record.totalOwnershipShare, 1);
});

test('ملكية الإخوة القديمة تظل محفوظة عند توريث حصة الجيل الحالي مرة أخرى', () => {
  const context = makeContext();
  const previous = {
    lifeId: 'property-generation-two', name: 'الوارث الحالي', age: 45, bank: 0,
    assets: [{
      id: 'inherited-home-share', familyAssetId: 'family-home-stable', familyAssetOriginalValue: 1000000,
      ownerBeneficiaryId: 'active-owner', ownershipShare: 0.5, title: 'بيت العائلة',
      kind: 'property', value: 500000, upkeep: 10000
    }],
    investments: [], business: null, companies: [], debt: 0, place: { unit: 'جنيه' },
    legacy: {
      activeBeneficiaryId: 'active-owner',
      familyPropertyOwnership: [{
        id: 'family-home-stable', familyAssetId: 'family-home-stable', title: 'بيت العائلة',
        currency: 'جنيه', marketValue: 1000000, upkeep: 20000, encumberedShare: 0,
        auditStatus: 'balanced', owners: [
          { beneficiaryId: 'active-owner', name: 'الوارث الحالي', kind: 'child', share: 0.5, status: 'active' },
          { beneficiaryId: 'older-sibling', name: 'الأخ كريم', kind: 'child', share: 0.5, status: 'reserved' }
        ], transactions: []
      }]
    }
  };
  const registry = {
    sourceLifeId: 'property-estate-generation-three', currency: 'جنيه',
    accounts: [
      { beneficiaryId: 'grandchild-a', name: 'الحفيد الأول', kind: 'child', share: 0.5, status: 'transferred' },
      { beneficiaryId: 'grandchild-b', name: 'الحفيدة الثانية', kind: 'child', share: 0.5, status: 'reserved' }
    ]
  };
  const record = context.buildFamilyPropertyOwnership(previous, registry)[0];
  assert.equal(record.auditStatus, 'balanced');
  assert.equal(record.owners.find(owner => owner.beneficiaryId === 'older-sibling').share, 0.5);
  assert.equal(record.owners.find(owner => owner.beneficiaryId === 'grandchild-a').share, 0.25);
  assert.equal(record.owners.find(owner => owner.beneficiaryId === 'grandchild-b').share, 0.25);
  assert.equal(record.totalOwnershipShare, 1);
});

test('بيع حصة العقار ينقلها إلى مالك خارجي ويحافظ على حصص بقية الأسرة', () => {
  const context = makeContext();
  const record = {
    id: 'family-home-sale', title: 'بيت عائلي', marketValue: 1000000, currency: 'جنيه',
    encumberedShare: 0, auditStatus: 'balanced', owners: [
      { beneficiaryId: 'active-seller', name: 'المالك الحالي', share: 0.4, status: 'active' },
      { beneficiaryId: 'sibling-owner', name: 'الأخت مريم', share: 0.6, status: 'reserved' }
    ], transactions: []
  };
  context.state = {
    lifeId: 'active-seller', name: 'المالك الحالي', age: 42,
    legacy: { activeBeneficiaryId: 'active-seller', familyPropertyOwnership: [record] }
  };
  const asset = { id: 'shared-home-share', familyAssetId: 'family-home-sale', ownerBeneficiaryId: 'active-seller',
    kind: 'property', ownershipShare: 0.4, value: 400000 };
  const result = context.recordFamilyPropertySale(asset, 300000);
  assert.equal(result.ok, true);
  assert.equal(record.owners.find(owner => owner.beneficiaryId === 'sibling-owner').share, 0.6);
  assert.equal(record.owners.find(owner => owner.kind === 'external').share, 0.4);
  assert.equal(record.transactions[0].type, 'sale');
  assert.equal(record.totalOwnershipShare, 1);
});

test('بيع الحصة يسدد متأخرات المالك من حصيلة البيع قبل إضافة الصافي', () => {
  const context = makeContext();
  const record = {
    id: 'family-home-sale-arrears', title: 'بيت العائلة', marketValue: 1000000, currency: 'جنيه',
    encumberedShare: 0, auditStatus: 'balanced',
    propertyExpenseOwedTotal: 50000,
    propertyExpensePaidTotal: 15000,
    propertyExpenseActivePaidTotal: 8000,
    owners: [
      { beneficiaryId: 'active-seller', name: 'المالك الحالي', share: 0.4, status: 'active', propertyExpenseOwed: 40000 },
      { beneficiaryId: 'sibling-owner', name: 'الأخت مريم', share: 0.6, status: 'reserved', propertyExpenseOwed: 10000 }
    ],
    transactions: []
  };
  context.state = {
    lifeId: 'active-seller', name: 'المالك الحالي', age: 42, bank: 50000,
    place: { unit: 'جنيه' },
    legacy: { activeBeneficiaryId: 'active-seller', familyPropertyOwnership: [record] }
  };
  const asset = { id: 'shared-home-share', familyAssetId: record.id, ownerBeneficiaryId: 'active-seller',
    kind: 'property', ownershipShare: 0.4, value: 400000 };
  const result = context.recordFamilyPropertySale(asset, 300000);
  assert.equal(result.ok, true);
  assert.equal(result.netProceeds, 260000);
  assert.equal(result.settledArrears, 40000);
  assert.equal(record.propertyExpenseOwedTotal, 10000);
  assert.equal(record.propertyExpensePaidTotal, 55000);
  assert.equal(record.propertyExpenseActivePaidTotal, 48000);
  assert.equal(record.owners.some(owner => owner.beneficiaryId === 'active-seller'), false);
  assert.equal(record.owners.find(owner => owner.beneficiaryId === 'sibling-owner').propertyExpenseOwed, 10000);
  assert.equal(record.owners.find(owner => owner.kind === 'external').share, 0.4);
  assert.equal(record.totalOwnershipShare, 1);
  const settlement = record.transactions.find(item => item.type === 'property_expense_settlement');
  const sale = record.transactions.find(item => item.type === 'sale');
  assert.equal(settlement.amount, 40000);
  assert.equal(settlement.source, 'sale_proceeds');
  assert.equal(sale.amount, 300000);
  assert.equal(sale.netProceeds, 260000);
  assert.equal(sale.settledArrears, 40000);
  assert.equal(context.state.bank, 50000);
});

test('بيع الحصة يتوقف دون أي تغيير إذا كانت الحصيلة أقل من المتأخرات', () => {
  const context = makeContext();
  const record = {
    id: 'family-home-sale-shortfall', title: 'بيت العائلة', marketValue: 1000000, currency: 'جنيه',
    encumberedShare: 0, auditStatus: 'balanced',
    propertyExpenseOwedTotal: 450000,
    owners: [
      { beneficiaryId: 'active-seller', name: 'المالك الحالي', share: 0.4, status: 'active', propertyExpenseOwed: 350000 },
      { beneficiaryId: 'sibling-owner', name: 'الأخت مريم', share: 0.6, status: 'reserved', propertyExpenseOwed: 100000 }
    ],
    transactions: []
  };
  context.state = {
    lifeId: 'active-seller', name: 'المالك الحالي', age: 42, bank: 50000,
    legacy: { activeBeneficiaryId: 'active-seller', familyPropertyOwnership: [record] }
  };
  const asset = { familyAssetId: record.id, ownerBeneficiaryId: 'active-seller',
    kind: 'property', ownershipShare: 0.4, value: 400000 };
  const before = JSON.stringify(record);
  const result = context.recordFamilyPropertySale(asset, 300000);
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'sale_proceeds_below_arrears');
  assert.equal(result.required, 350000);
  assert.equal(result.available, 300000);
  assert.equal(JSON.stringify(record), before);
  assert.equal(context.state.bank, 50000);
});

test('دفتر متأخرات غير متطابق يمنع بيع الحصة دون إسقاط دين أي مالك', () => {
  const context = makeContext();
  const record = {
    id: 'family-home-sale-ledger-mismatch', title: 'بيت العائلة', marketValue: 1000000, currency: 'جنيه',
    encumberedShare: 0, auditStatus: 'balanced', propertyExpenseOwedTotal: 20000,
    owners: [
      { beneficiaryId: 'active-seller', name: 'المالك الحالي', share: 0.4, status: 'active', propertyExpenseOwed: 40000 },
      { beneficiaryId: 'sibling-owner', name: 'الأخت مريم', share: 0.6, status: 'reserved', propertyExpenseOwed: 10000 }
    ],
    transactions: []
  };
  context.state = {
    lifeId: 'active-seller', name: 'المالك الحالي', age: 42,
    legacy: { activeBeneficiaryId: 'active-seller', familyPropertyOwnership: [record] }
  };
  const asset = { familyAssetId: record.id, ownerBeneficiaryId: 'active-seller',
    kind: 'property', ownershipShare: 0.4, value: 400000 };
  const before = JSON.stringify(record);
  const result = context.recordFamilyPropertySale(asset, 300000);
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'property_expense_ledger_mismatch');
  assert.equal(JSON.stringify(record), before);
});

test('صيانة الحصة الموروثة تحدث القيمة الكاملة للعقار دون تغيير نسب الملاك', () => {
  const context = makeContext();
  const record = {
    id: 'family-home-maintenance', title: 'بيت العائلة', marketValue: 1000000, currency: 'جنيه',
    upkeep: 20000, encumberedShare: 0, auditStatus: 'balanced',
    owners: [{ beneficiaryId: 'maintenance-owner', name: 'المالك', share: 0.5, status: 'active' }],
    transactions: []
  };
  context.state = { lifeId: 'maintenance-owner', name: 'المالك', age: 35,
    legacy: { activeBeneficiaryId: 'maintenance-owner', familyPropertyOwnership: [record] } };
  const asset = { familyAssetId: 'family-home-maintenance', ownerBeneficiaryId: 'maintenance-owner',
    kind: 'property', ownershipShare: 0.5, value: 550000, upkeep: 10000, condition: 100 };
  assert.equal(context.syncFamilyPropertyMarketValue(asset, 'maintenance', 5000), true);
  assert.equal(record.marketValue, 1100000);
  assert.equal(record.upkeep, 20000);
  assert.equal(record.owners[0].share, 0.5);
  assert.equal(record.transactions[0].type, 'maintenance');
});


test('سجل ملكية غير متوازن يوقف بيع الحصة دون تغيير الملاك', () => {
  const context = makeContext();
  const record = {
    id: 'family-home-invalid-sale', title: 'عقار يحتاج مراجعة', marketValue: 1000000,
    encumberedShare: 0, auditStatus: 'needs_review',
    owners: [{ beneficiaryId: 'invalid-owner', name: 'المالك', share: 0.7, status: 'active' }],
    transactions: []
  };
  context.state = { lifeId: 'invalid-owner', name: 'المالك', age: 40,
    legacy: { activeBeneficiaryId: 'invalid-owner', familyPropertyOwnership: [record] } };
  const before = JSON.stringify(record);
  const result = context.recordFamilyPropertySale({
    familyAssetId: record.id, ownerBeneficiaryId: 'invalid-owner', kind: 'property', ownershipShare: 0.7
  }, 500000);
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'ownership_audit_incomplete');
  assert.equal(JSON.stringify(record), before, 'a blocked sale must not mutate the ownership register');
});

test('سجل ملكية قديم ناقص المالك الحالي يتحول إلى مراجعة بدل إعادة توزيع حصص مجهولة', () => {
  const context = makeContext();
  const previous = {
    lifeId: 'property-legacy-owner', name: 'المالك الحالي', age: 60, bank: 0,
    assets: [{ id: 'legacy-home-share', familyAssetId: 'legacy-family-home', ownerBeneficiaryId: 'active-legacy-owner',
      ownershipShare: 0.5, familyAssetOriginalValue: 1000000, title: 'بيت قديم', kind: 'property', value: 500000, upkeep: 10000 }],
    investments: [], business: null, companies: [], debt: 0, place: { unit: 'جنيه' },
    legacy: {
      activeBeneficiaryId: 'active-legacy-owner',
      familyPropertyOwnership: [{
        id: 'legacy-family-home', familyAssetId: 'legacy-family-home', title: 'بيت قديم',
        marketValue: 1000000, currency: 'جنيه', encumberedShare: 0, auditStatus: 'balanced',
        owners: [{ beneficiaryId: 'unrelated-owner', name: 'مالك آخر', share: 1, status: 'reserved' }],
        transactions: []
      }]
    }
  };
  const registry = {
    sourceLifeId: 'legacy-property-estate', currency: 'جنيه',
    accounts: [{ beneficiaryId: 'next-heir', name: 'الوارث', kind: 'child', share: 1, status: 'transferred' }]
  };
  const record = context.buildFamilyPropertyOwnership(previous, registry)[0];
  assert.equal(record.auditStatus, 'needs_review');
  assert.ok(record.auditIssues.includes('current_owner_missing'));
  assert.equal(record.owners[0].beneficiaryId, 'unrelated-owner');
});


test('متأخرات العقار تنتقل للورثة حسب حصصهم وتظل قابلة للتسوية عند البيع', () => {
  const context = makeContext();
  const previous = {
    lifeId: 'property-arrears-parent-life',
    name: 'المالك السابق',
    age: 68,
    bank: 0,
    debt: 0,
    assets: [{
      id: 'parent-home-share',
      familyAssetId: 'family-home-arrears-inheritance',
      familyAssetOriginalValue: 1000000,
      ownerBeneficiaryId: 'active-parent',
      ownershipShare: 0.5,
      title: 'بيت العائلة',
      kind: 'property',
      value: 500000,
      upkeep: 10000,
      condition: 82
    }],
    investments: [],
    business: null,
    companies: [],
    place: { unit: 'جنيه' },
    legacy: {
      activeBeneficiaryId: 'active-parent',
      familyPropertyOwnership: [{
        id: 'family-home-arrears-inheritance',
        familyAssetId: 'family-home-arrears-inheritance',
        title: 'بيت العائلة',
        currency: 'جنيه',
        marketValue: 1000000,
        upkeep: 20000,
        encumberedShare: 0,
        auditStatus: 'balanced',
        propertyExpenseOwedTotal: 18001,
        propertyExpensePaidTotal: 0,
        propertyExpenseActivePaidTotal: 0,
        owners: [
          { beneficiaryId: 'active-parent', name: 'المالك السابق', kind: 'child', share: 0.5, status: 'active', propertyExpenseOwed: 12001 },
          { beneficiaryId: 'older-sibling', name: 'الأخ كريم', kind: 'child', share: 0.5, status: 'reserved', propertyExpenseOwed: 6000 }
        ],
        transactions: []
      }]
    }
  };
  const registry = {
    sourceLifeId: 'property-arrears-next-generation',
    currency: 'جنيه',
    accounts: [
      { beneficiaryId: 'grandchild-a', name: 'الحفيد الأول', kind: 'child', share: 1 / 3, status: 'transferred' },
      { beneficiaryId: 'grandchild-b', name: 'الحفيدة الثانية', kind: 'child', share: 1 / 3, status: 'reserved' },
      { beneficiaryId: 'grandchild-c', name: 'الحفيد الثالث', kind: 'child', share: 1 / 3, status: 'reserved' }
    ]
  };

  const record = context.buildFamilyPropertyOwnership(previous, registry)[0];
  assert.equal(record.auditStatus, 'balanced');
  assert.equal(record.propertyExpenseOwedTotal, 18001);
  assert.equal(record.owners.find(owner => owner.beneficiaryId === 'older-sibling').propertyExpenseOwed, 6000);
  assert.equal(record.owners.find(owner => owner.beneficiaryId === 'grandchild-a').propertyExpenseOwed, 4001);
  assert.equal(record.owners.find(owner => owner.beneficiaryId === 'grandchild-b').propertyExpenseOwed, 4000);
  assert.equal(record.owners.find(owner => owner.beneficiaryId === 'grandchild-c').propertyExpenseOwed, 4000);

  const transfer = record.transactions.find(item => item.type === 'property_expense_inheritance');
  assert.ok(transfer);
  assert.equal(transfer.amount, 12001);
  assert.equal(transfer.allocations.reduce((sum, item) => sum + item.amount, 0), 12001);
  assert.deepEqual(transfer.allocations.map(item => item.amount), [4001, 4000, 4000]);

  context.state = {
    lifeId: 'grandchild-a',
    name: 'الحفيد الأول',
    age: 25,
    bank: 1000,
    place: { unit: 'جنيه' },
    legacy: { activeBeneficiaryId: 'grandchild-a', familyPropertyOwnership: [record] }
  };
  const inheritedShare = {
    id: 'grandchild-a-home-share',
    familyAssetId: record.id,
    ownerBeneficiaryId: 'grandchild-a',
    ownershipShare: 1 / 6,
    kind: 'property',
    value: 166667
  };
  const sale = context.recordFamilyPropertySale(inheritedShare, 10000);
  assert.equal(sale.ok, true);
  assert.equal(sale.settledArrears, 4001);
  assert.equal(sale.netProceeds, 5999);
  assert.equal(record.propertyExpenseOwedTotal, 14000);
  assert.equal(record.owners.find(owner => owner.beneficiaryId === 'older-sibling').propertyExpenseOwed, 6000);
  assert.equal(record.owners.find(owner => owner.beneficiaryId === 'grandchild-b').propertyExpenseOwed, 4000);
  assert.equal(record.owners.find(owner => owner.beneficiaryId === 'grandchild-c').propertyExpenseOwed, 4000);
  assert.equal(record.owners.some(owner => owner.beneficiaryId === 'grandchild-a'), false);
});

test('متأخرات العقار غير الصالحة توقف انتقال الحصة بدل إسقاط الدين', () => {
  const context = makeContext();
  const record = {
    id: 'invalid-arrears-home',
    familyAssetId: 'invalid-arrears-home',
    title: 'عقار يحتاج مراجعة',
    currency: 'جنيه',
    marketValue: 500000,
    upkeep: 10000,
    encumberedShare: 0,
    auditStatus: 'balanced',
    propertyExpenseOwedTotal: 0,
    owners: [
      { beneficiaryId: 'invalid-arrears-owner', name: 'المالك الحالي', share: 0.5, status: 'active', propertyExpenseOwed: -100 },
      { beneficiaryId: 'invalid-arrears-sibling', name: 'الأخت', share: 0.5, status: 'reserved', propertyExpenseOwed: 0 }
    ],
    transactions: []
  };
  const previous = {
    lifeId: 'invalid-arrears-life',
    name: 'المالك الحالي',
    age: 55,
    bank: 0,
    debt: 0,
    assets: [{
      id: 'invalid-arrears-share',
      familyAssetId: record.id,
      familyAssetOriginalValue: 500000,
      ownerBeneficiaryId: 'invalid-arrears-owner',
      ownershipShare: 0.5,
      title: 'عقار يحتاج مراجعة',
      kind: 'property',
      value: 250000,
      upkeep: 5000
    }],
    investments: [],
    business: null,
    companies: [],
    place: { unit: 'جنيه' },
    legacy: { activeBeneficiaryId: 'invalid-arrears-owner', familyPropertyOwnership: [record] }
  };
  const next = context.buildFamilyPropertyOwnership(previous, {
    sourceLifeId: 'invalid-arrears-next',
    currency: 'جنيه',
    accounts: [
      { beneficiaryId: 'invalid-arrears-heir-a', name: 'وارث أول', kind: 'child', share: 0.5, status: 'transferred' },
      { beneficiaryId: 'invalid-arrears-heir-b', name: 'وارث ثانٍ', kind: 'child', share: 0.5, status: 'reserved' }
    ]
  })[0];
  assert.equal(next.auditStatus, 'needs_review');
  assert.equal(next.owners.find(owner => owner.beneficiaryId === 'invalid-arrears-owner').propertyExpenseOwed, -100);
  assert.equal(next.transactions.some(item => item.type === 'property_expense_inheritance'), false);
});

test('ملكية عقار واحد تظل متوازنة عبر خمسة أجيال مع بقاء حصص الإخوة السابقين', () => {
  const context = makeContext();
  let currentBeneficiaryId = 'founder';
  let currentShare = 1;
  let record = null;

  for (let generation = 1; generation <= 5; generation++) {
    const previous = {
      lifeId: 'property-generation-' + generation,
      name: 'الجيل ' + generation,
      age: 70,
      bank: 0,
      assets: [{
        id: 'property-share-' + generation,
        familyAssetId: 'family-home-five-generations',
        familyAssetOriginalValue: 1000000,
        ownerBeneficiaryId: currentBeneficiaryId,
        ownershipShare: currentShare,
        title: 'بيت العائلة',
        kind: 'property',
        value: Math.round(1000000 * currentShare),
        upkeep: Math.round(20000 * currentShare),
        condition: 100
      }],
      investments: [], business: null, companies: [], debt: 0,
      place: { unit: 'جنيه' },
      legacy: {
        activeBeneficiaryId: currentBeneficiaryId,
        familyPropertyOwnership: record ? [record] : []
      }
    };
    const nextHeirId = 'heir-generation-' + generation;
    const registry = {
      sourceLifeId: 'estate-generation-' + generation,
      currency: 'جنيه',
      accounts: [
        { beneficiaryId: nextHeirId, name: 'الوارث ' + generation, kind: 'child', share: 0.5, status: 'transferred' },
        { beneficiaryId: 'sibling-generation-' + generation, name: 'أخ الجيل ' + generation, kind: 'child', share: 0.5, status: 'reserved' }
      ]
    };

    record = context.buildFamilyPropertyOwnership(previous, registry)[0];
    assert.equal(record.auditStatus, 'balanced', 'generation ' + generation + ' should remain balanced');
    assert.ok(Math.abs(record.totalOwnershipShare - 1) < 0.000001, 'generation ' + generation + ' must preserve 100% ownership');
    const activeOwner = record.owners.find(owner => owner.beneficiaryId === nextHeirId);
    assert.ok(activeOwner, 'the active heir must receive a traceable share in generation ' + generation);
    currentBeneficiaryId = nextHeirId;
    currentShare = activeOwner.share;
  }

  assert.equal(record.owners.length, 6);
  assert.equal(currentShare, 0.03125);
  assert.equal(record.totalOwnershipShare, 1);
});


test('محفظة الوريث تسجل دخل الإيجار وتحافظ على معادلة الرصيد مع المساعدات', () => {
  const context = makeContext();
  const wallet = {
    id: 'rent-wallet-one', beneficiaryId: 'sibling-rent-one', kind: 'child', currency: 'جنيه',
    openingBalance: 10000, supportTotal: 500, rentalIncomeTotal: 0, balance: 10500,
    transactions: [
      { id: 'rent-wallet-one-inheritance', type: 'inheritance', amount: 10000, currency: 'جنيه' },
      { id: 'rent-wallet-one-support', type: 'support', amount: 500, currency: 'جنيه' }
    ],
    ledgerAuditComplete: true, ledgerMismatch: false
  };
  const result = context.recordBeneficiaryWalletRentalIncome(wallet, 2500, {
    transactionId: 'rent-wallet-one-year-31', currency: 'جنيه',
    familyAssetId: 'family-flat-one', propertyTitle: 'شقة العائلة', age: 31, year: 31
  });
  assert.equal(result.ok, true);
  assert.equal(wallet.rentalIncomeTotal, 2500);
  assert.equal(wallet.balance, 13000);
  assert.equal(wallet.transactions.at(-1).type, 'rental_income');
  assert.equal(context.recordBeneficiaryWalletRentalIncome(wallet, 2500, {
    transactionId: 'rent-wallet-one-year-31', currency: 'جنيه'
  }).reason, 'duplicate_transaction');
  assert.equal(context.recordBeneficiaryWalletSupport(wallet, 1000, { transactionId: 'rent-wallet-one-support-two' }).ok, true);
  assert.equal(wallet.balance, 14000);
  assert.equal(wallet.rentalIncomeTotal, 2500);
});

test('دخل إيجار العقار المشترك يتوزع على الملاك والمحافظ والخارج والحصة المعلقة دون مضاعفة حصة اللاعب', () => {
  const context = makeContext();
  const wallet = {
    id: 'sibling-rent-wallet', beneficiaryId: 'sibling-rent-owner', kind: 'child', currency: 'جنيه',
    openingBalance: 10000, supportTotal: 0, rentalIncomeTotal: 0, balance: 10000,
    transactions: [{ id: 'sibling-rent-inheritance', type: 'inheritance', amount: 10000, currency: 'جنيه' }],
    ledgerAuditComplete: true, ledgerMismatch: false
  };
  const record = {
    id: 'family-flat-rent', familyAssetId: 'family-flat-rent', title: 'شقة العائلة',
    currency: 'جنيه', marketValue: 1000000, encumberedShare: 0.1, auditStatus: 'balanced',
    owners: [
      { beneficiaryId: 'active-rent-owner', name: 'المالك الحالي', kind: 'child', status: 'active', share: 0.4 },
      { beneficiaryId: 'sibling-rent-owner', name: 'الأخت مريم', kind: 'child', status: 'reserved', share: 0.3 },
      { beneficiaryId: 'outside-rent-owner', name: 'مالك خارجي', kind: 'external', status: 'external', share: 0.2 }
    ],
    transactions: []
  };
  context.state = {
    lifeId: 'active-rent-life', name: 'المالك الحالي', age: 35, yearCount: 35, bank: -5000,
    place: { unit: 'جنيه' },
    legacy: { activeBeneficiaryId: 'active-rent-owner', beneficiaryWallets: [wallet], familyPropertyOwnership: [record] }
  };
  const asset = { id: 'active-flat-share', familyAssetId: 'family-flat-rent', ownerBeneficiaryId: 'active-rent-owner',
    ownershipShare: 0.4, kind: 'property', value: 400000, rented: true };
  const result = context.distributeFamilyPropertyRent(asset, 18000);
  assert.equal(result.ok, true);
  assert.equal(result.grossRent, 45000);
  assert.equal(result.activeAmount, 18000);
  assert.equal(result.familyWalletAmount, 13500);
  assert.equal(result.externalAmount, 9000);
  assert.equal(result.reservedAmount, 4500);
  assert.equal(context.state.bank, 13000);
  assert.equal(wallet.balance, 23500);
  assert.equal(wallet.rentalIncomeTotal, 13500);
  assert.equal(record.rentReserveTotal, 4500);
  assert.equal(record.externalRentPaidTotal, 9000);
  assert.equal(record.familyWalletRentPaidTotal, 13500);
  assert.equal(record.activeRentPaidTotal, 18000);
  assert.equal(record.transactions[0].type, 'rent_distribution');
  assert.ok(Math.abs(record.totalOwnershipShare - 1) < 1e-9);
  assert.equal(context.distributeFamilyPropertyRent(asset, 18000).reason, 'duplicate_transaction');
  assert.equal(context.state.bank, 13000, 'replaying the same annual distribution must not pay twice');
});

test('دخل الإيجار غير المدفوع يتراكم كمتأخرات ثم ينتقل لمحفظة الوارث عند توفرها', () => {
  const context = makeContext();
  const record = {
    id: 'family-flat-arrears', familyAssetId: 'family-flat-arrears', title: 'منزل العائلة',
    currency: 'جنيه', marketValue: 1000000, encumberedShare: 0, auditStatus: 'balanced',
    owners: [
      { beneficiaryId: 'active-arrears-owner', name: 'المالك الحالي', kind: 'child', status: 'active', share: 0.5 },
      { beneficiaryId: 'sibling-arrears-owner', name: 'الأخ كريم', kind: 'child', status: 'reserved', share: 0.5 }
    ],
    transactions: []
  };
  context.state = {
    lifeId: 'arrears-life', name: 'المالك الحالي', age: 40, yearCount: 40, bank: 50000,
    place: { unit: 'جنيه' },
    legacy: { activeBeneficiaryId: 'active-arrears-owner', beneficiaryWallets: [], familyPropertyOwnership: [record] }
  };
  const asset = { id: 'arrears-flat-share', familyAssetId: 'family-flat-arrears', ownerBeneficiaryId: 'active-arrears-owner',
    ownershipShare: 0.5, kind: 'property', value: 500000, rented: true };
  const first = context.distributeFamilyPropertyRent(asset, 10000);
  assert.equal(first.activeAmount, 10000);
  assert.equal(first.tracked, true);
  assert.equal(first.reservedAmount, 10000);
  assert.equal(record.owners.find(owner => owner.beneficiaryId === 'sibling-arrears-owner').rentOwed, 10000);
  assert.equal(record.rentReserveTotal, 10000);

  const wallet = {
    id: 'sibling-arrears-wallet', beneficiaryId: 'sibling-arrears-owner', kind: 'child', currency: 'جنيه',
    openingBalance: 5000, supportTotal: 0, rentalIncomeTotal: 0, balance: 5000,
    transactions: [{ id: 'sibling-arrears-inheritance', type: 'inheritance', amount: 5000, currency: 'جنيه' }],
    ledgerAuditComplete: true, ledgerMismatch: false
  };
  context.state.legacy.beneficiaryWallets.push(wallet);
  context.state.yearCount = 41;
  context.state.age = 41;
  const second = context.distributeFamilyPropertyRent(asset, 10000);
  assert.equal(second.familyWalletAmount, 20000, 'the wallet should receive current rent plus the unpaid prior year');
  assert.equal(wallet.balance, 25000);
  assert.equal(wallet.rentalIncomeTotal, 20000);
  assert.equal(record.owners.find(owner => owner.beneficiaryId === 'sibling-arrears-owner').rentOwed, 0);
  assert.equal(record.rentReserveReleasedTotal, 10000);
  assert.equal(record.rentReserveTotal - record.rentReserveReleasedTotal, 0);
});

test('سجل ملكية غير صالح يوقف توزيع دخل الإيجار دون تغيير الرصيد أو السجل', () => {
  const context = makeContext();
  const record = {
    id: 'family-flat-invalid-rent', familyAssetId: 'family-flat-invalid-rent', currency: 'جنيه',
    auditStatus: 'needs_review', encumberedShare: 0,
    owners: [{ beneficiaryId: 'active-invalid-rent', share: 1, kind: 'child', status: 'active' }],
    transactions: []
  };
  context.state = {
    lifeId: 'invalid-rent-life', age: 40, yearCount: 40, bank: 20000, place: { unit: 'جنيه' },
    legacy: { activeBeneficiaryId: 'active-invalid-rent', familyPropertyOwnership: [record], beneficiaryWallets: [] }
  };
  const before = JSON.stringify(record);
  const result = context.distributeFamilyPropertyRent({
    familyAssetId: record.id, ownerBeneficiaryId: 'active-invalid-rent', ownershipShare: 1, kind: 'property'
  }, 900);
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'ownership_audit_incomplete');
  assert.equal(context.state.bank, 20000);
  assert.equal(JSON.stringify(record), before);
});


test('فشل تدقيق ملكية العقار يمنع تحويل الإيجار إلى البنك، مع إبقاء المسار القديم للعقار غير المسجل', () => {
  const context = makeContext();
  const blocked = context.classifyFamilyPropertyRentResult({ ok: false, reason: 'ownership_audit_incomplete' }, 18000);
  assert.equal(blocked.kind, 'blocked');
  assert.equal(blocked.activeAmount, 0);
  assert.equal(blocked.familyWalletAmount, 0);

  const currencyBlocked = context.classifyFamilyPropertyRentResult({ ok: false, reason: 'currency_mismatch' }, 18000);
  assert.equal(currencyBlocked.kind, 'blocked');
  assert.equal(currencyBlocked.activeAmount, 0);

  const legacy = context.classifyFamilyPropertyRentResult({ ok: true, tracked: false }, 18000);
  assert.equal(legacy.kind, 'legacy');
  assert.equal(legacy.activeAmount, 18000);

  const distributed = context.classifyFamilyPropertyRentResult({ ok: true, tracked: true, activeAmount: 7200, familyWalletAmount: 10800 }, 18000);
  assert.equal(distributed.kind, 'distributed');
  assert.equal(distributed.activeAmount, 7200);
  assert.equal(distributed.familyWalletAmount, 10800);

  const duplicate = context.classifyFamilyPropertyRentResult({ ok: false, reason: 'duplicate_transaction' }, 18000);
  assert.equal(duplicate.kind, 'duplicate');
  assert.equal(duplicate.activeAmount, 0);

  assert.match(app, /classifyFamilyPropertyRentResult\(result,entry\.amount\)/);
  assert.doesNotMatch(app, /else\{state\.bank\+=entry\.amount;rentReceived\+=entry\.amount;rentWarnings\+\+;\}/);
});

test('الحفظ القديم لمحفظة الوريث دون حقل دخل الإيجار يظل صالحًا ويبدأ من صفر', () => {
  const context = makeContext();
  const legacyWallet = {
    id: 'legacy-wallet-without-rent-total', beneficiaryId: 'legacy-rent-heir', kind: 'child', currency: 'جنيه',
    openingBalance: 7000, supportTotal: 1200, balance: 8200,
    transactions: [
      { id: 'legacy-rent-inheritance', type: 'inheritance', amount: 7000, currency: 'جنيه' },
      { id: 'legacy-rent-support', type: 'support', amount: 1200, currency: 'جنيه' }
    ],
    ledgerAuditComplete: true, ledgerMismatch: false
  };
  const wallets = context.buildBeneficiaryWallets({ beneficiaryWallets: [legacyWallet] }, null, 'الجيل السابق', 62);
  assert.equal(wallets.length, 1);
  assert.equal(wallets[0].balance, 8200);
  assert.equal(wallets[0].rentalIncomeTotal, 0);
  assert.equal(wallets[0].ledgerAuditComplete, true);
  assert.equal(wallets[0].ledgerMismatch, false);
});

test('محفظة الوارث تخصم مصروف العقار من الرصيد وتحمي دفتر الحركات من التكرار والعجز', () => {
  const context = makeContext();
  const wallet = {
    id: 'wallet-expense-ledger', beneficiaryId: 'heir-expense-ledger', kind: 'child', currency: 'جنيه',
    openingBalance: 10000, supportTotal: 0, rentalIncomeTotal: 0, propertyExpenseTotal: 0, balance: 10000,
    transactions: [{ id: 'expense-ledger-inheritance', type: 'inheritance', amount: 10000, currency: 'جنيه' }],
    ledgerAuditComplete: true, ledgerMismatch: false
  };
  const paid = context.recordBeneficiaryWalletPropertyExpense(wallet, 2500, {
    transactionId: 'expense-ledger-1', currency: 'جنيه', familyAssetId: 'expense-flat', propertyTitle: 'شقة العائلة'
  });
  assert.equal(paid.ok, true);
  assert.equal(wallet.balance, 7500);
  assert.equal(wallet.propertyExpenseTotal, 2500);
  assert.equal(context.beneficiaryWalletLedgerTotals(wallet).valid, true);
  assert.equal(wallet.transactions.at(-1).type, 'property_expense');
  const beforeDuplicate = JSON.stringify(wallet);
  assert.equal(context.recordBeneficiaryWalletPropertyExpense(wallet, 2500, {
    transactionId: 'expense-ledger-1', currency: 'جنيه'
  }).reason, 'duplicate_transaction');
  assert.equal(JSON.stringify(wallet), beforeDuplicate);
  assert.equal(context.recordBeneficiaryWalletPropertyExpense(wallet, 8000, {
    transactionId: 'expense-ledger-too-large', currency: 'جنيه'
  }).reason, 'insufficient_funds');
  assert.equal(wallet.balance, 7500);
});

test('مصروف صيانة العقار المشترك يتوزع حسب الملكية بين البنك ومحافظ الورثة', () => {
  const context = makeContext();
  const wallet = {
    id: 'sibling-maintenance-wallet', beneficiaryId: 'sibling-maintenance', kind: 'child', currency: 'جنيه',
    openingBalance: 30000, supportTotal: 0, rentalIncomeTotal: 0, propertyExpenseTotal: 0, balance: 30000,
    transactions: [{ id: 'sibling-maintenance-inheritance', type: 'inheritance', amount: 30000, currency: 'جنيه' }],
    ledgerAuditComplete: true, ledgerMismatch: false
  };
  const record = {
    id: 'shared-maintenance-flat', familyAssetId: 'shared-maintenance-flat', title: 'شقة العائلة',
    currency: 'جنيه', marketValue: 1000000, encumberedShare: 0, auditStatus: 'balanced',
    owners: [
      { beneficiaryId: 'active-maintenance', name: 'المالك الحالي', kind: 'child', status: 'active', share: 0.5 },
      { beneficiaryId: 'sibling-maintenance', name: 'الأخت مريم', kind: 'child', status: 'reserved', share: 0.5 }
    ],
    transactions: []
  };
  context.state = {
    lifeId: 'maintenance-life', name: 'المالك الحالي', age: 40, yearCount: 40, bank: 50000,
    place: { unit: 'جنيه' },
    legacy: { activeBeneficiaryId: 'active-maintenance', beneficiaryWallets: [wallet], familyPropertyOwnership: [record] }
  };
  const asset = { id: 'active-maintenance-share', familyAssetId: record.id, ownerBeneficiaryId: 'active-maintenance',
    ownershipShare: 0.5, kind: 'property', value: 500000, condition: 50 };
  const result = context.distributeFamilyPropertyExpense(asset, 20000, { action: 'maintenance', reason: 'صيانة / تجديد' });
  assert.equal(result.ok, true);
  assert.equal(result.grossCost, 20000);
  assert.equal(result.activeAmount, 10000);
  assert.equal(result.familyWalletAmount, 10000);
  assert.equal(result.unpaidAmount, 0);
  assert.equal(context.state.bank, 40000);
  assert.equal(wallet.balance, 20000);
  assert.equal(wallet.propertyExpenseTotal, 10000);
  assert.equal(record.propertyExpenseTotal, 20000);
  assert.equal(record.propertyExpensePaidTotal, 20000);
  assert.equal(record.transactions[0].type, 'property_expense');
  const replay = context.distributeFamilyPropertyExpense(asset, 20000, { action: 'maintenance', reason: 'صيانة / تجديد' });
  assert.equal(replay.reason, 'duplicate_transaction');
  assert.equal(context.state.bank, 40000);
  assert.equal(wallet.balance, 20000);
});

test('حصة مصروف الشقيق غير القادر على الدفع تصبح متأخرات ثم تُحصّل عند توفر رصيد', () => {
  const context = makeContext();
  const wallet = {
    id: 'sibling-arrears-expense-wallet', beneficiaryId: 'sibling-expense-arrears', kind: 'child', currency: 'جنيه',
    openingBalance: 2000, supportTotal: 0, rentalIncomeTotal: 0, propertyExpenseTotal: 0, balance: 2000,
    transactions: [{ id: 'sibling-expense-arrears-inheritance', type: 'inheritance', amount: 2000, currency: 'جنيه' }],
    ledgerAuditComplete: true, ledgerMismatch: false
  };
  const record = {
    id: 'shared-expense-arrears-flat', familyAssetId: 'shared-expense-arrears-flat', title: 'منزل الأسرة',
    currency: 'جنيه', marketValue: 1000000, encumberedShare: 0, auditStatus: 'balanced',
    owners: [
      { beneficiaryId: 'active-expense-arrears', kind: 'child', status: 'active', share: 0.5 },
      { beneficiaryId: 'sibling-expense-arrears', kind: 'child', status: 'reserved', share: 0.5 }
    ],
    transactions: []
  };
  context.state = {
    lifeId: 'expense-arrears-life', name: 'المالك الحالي', age: 50, yearCount: 50, bank: 50000,
    place: { unit: 'جنيه' },
    legacy: { activeBeneficiaryId: 'active-expense-arrears', beneficiaryWallets: [wallet], familyPropertyOwnership: [record] }
  };
  const asset = { familyAssetId: record.id, ownerBeneficiaryId: 'active-expense-arrears', ownershipShare: 0.5, kind: 'property', value: 500000 };
  const first = context.distributeFamilyPropertyExpense(asset, 10000, { action: 'maintenance' });
  assert.equal(first.activeAmount, 5000);
  assert.equal(first.familyWalletAmount, 0);
  assert.equal(first.unpaidAmount, 5000);
  assert.equal(record.owners[1].propertyExpenseOwed, 5000);
  assert.equal(wallet.balance, 2000);
  assert.equal(context.recordBeneficiaryWalletSupport(wallet, 10000, {
    transactionId: 'sibling-expense-arrears-topup', currency: 'جنيه'
  }).ok, true);
  context.state.yearCount = 51;
  context.state.age = 51;
  const second = context.distributeFamilyPropertyExpense(asset, 10000, { action: 'maintenance' });
  assert.equal(second.activeAmount, 5000);
  assert.equal(second.familyWalletAmount, 10000);
  assert.equal(record.owners[1].propertyExpenseOwed, 0);
  assert.equal(wallet.balance, 2000);
  assert.equal(second.arrearsReleased, 5000);
});

test('تدقيق الملكية أو نقص رصيد المالك النشط يوقف المصروف دون أي تعديل جزئي', () => {
  const context = makeContext();
  const wallet = {
    id: 'sibling-safe-wallet', beneficiaryId: 'sibling-safe', kind: 'child', currency: 'جنيه',
    openingBalance: 20000, supportTotal: 0, rentalIncomeTotal: 0, propertyExpenseTotal: 0, balance: 20000,
    transactions: [{ id: 'sibling-safe-inheritance', type: 'inheritance', amount: 20000, currency: 'جنيه' }],
    ledgerAuditComplete: true, ledgerMismatch: false
  };
  const record = {
    id: 'shared-invalid-expense', familyAssetId: 'shared-invalid-expense', currency: 'جنيه',
    marketValue: 1000000, encumberedShare: 0, auditStatus: 'balanced',
    owners: [
      { beneficiaryId: 'active-expense-poor', kind: 'child', status: 'active', share: 0.5 },
      { beneficiaryId: 'sibling-safe', kind: 'child', status: 'reserved', share: 0.5 }
    ],
    transactions: []
  };
  context.state = {
    lifeId: 'poor-maintenance-life', age: 40, yearCount: 40, bank: 1000, place: { unit: 'جنيه' },
    legacy: { activeBeneficiaryId: 'active-expense-poor', beneficiaryWallets: [wallet], familyPropertyOwnership: [record] }
  };
  const asset = { familyAssetId: record.id, ownerBeneficiaryId: 'active-expense-poor', ownershipShare: 0.5, kind: 'property', value: 500000, condition: 50 };
  const beforeRecord = JSON.stringify(record);
  const beforeWallet = JSON.stringify(wallet);
  const result = context.distributeFamilyPropertyExpense(asset, 15000, { action: 'maintenance' });
  assert.equal(result.reason, 'insufficient_active_funds');
  assert.equal(context.state.bank, 1000);
  assert.equal(JSON.stringify(wallet), beforeWallet);
  assert.equal(JSON.stringify(record), beforeRecord);
  record.auditStatus = 'needs_review';
  const invalid = context.distributeFamilyPropertyExpense(asset, 15000, { action: 'maintenance' });
  assert.equal(invalid.reason, 'ownership_audit_incomplete');
  assert.equal(context.state.bank, 1000);
});

test('صيانة عقار مشترك تخصم حصة اللاعب ومحفظة الشريك وتحدّث القيمة الكاملة', () => {
  const context = makeContext();
  const wallet = {
    id: 'maintenance-ui-wallet', beneficiaryId: 'maintenance-ui-sibling', kind: 'child', currency: 'جنيه',
    openingBalance: 20000, supportTotal: 0, rentalIncomeTotal: 0, propertyExpenseTotal: 0, balance: 20000,
    transactions: [{ id: 'maintenance-ui-inheritance', type: 'inheritance', amount: 20000, currency: 'جنيه' }],
    ledgerAuditComplete: true, ledgerMismatch: false
  };
  const record = {
    id: 'maintenance-ui-property', familyAssetId: 'maintenance-ui-property', title: 'بيت العائلة',
    currency: 'جنيه', marketValue: 1000000, upkeep: 20000, encumberedShare: 0, auditStatus: 'balanced',
    owners: [
      { beneficiaryId: 'maintenance-ui-active', kind: 'child', status: 'active', share: 0.5 },
      { beneficiaryId: 'maintenance-ui-sibling', kind: 'child', status: 'reserved', share: 0.5 }
    ],
    transactions: []
  };
  const asset = { id: 'maintenance-ui-share', familyAssetId: record.id, ownerBeneficiaryId: 'maintenance-ui-active',
    ownershipShare: 0.5, title: 'بيت العائلة', kind: 'property', value: 500000, upkeep: 10000, condition: 50 };
  context.state = {
    lifeId: 'maintenance-ui-life', name: 'المالك الحالي', age: 45, yearCount: 45, bank: 50000,
    place: { unit: 'جنيه' }, assets: [asset],
    legacy: { activeBeneficiaryId: 'maintenance-ui-active', beneficiaryWallets: [wallet], familyPropertyOwnership: [record] }
  };
  context.maintainAsset(0);
  assert.equal(context.state.bank, 42500);
  assert.equal(wallet.balance, 12500);
  assert.equal(wallet.propertyExpenseTotal, 7500);
  assert.equal(asset.condition, 100);
  assert.equal(asset.value, 537500);
  assert.equal(record.marketValue, 1075000);
  assert.equal(record.propertyExpenseTotal, 15000);
  assert.ok(context.infoMessages.some(message => String(message[2]||'').includes('دفعت حصتك')));
});

test('الصيانة القديمة لعقار بلا سجل ملكية مشتركة تظل بنفس مسار الخصم السابق', () => {
  const context = makeContext();
  const asset = { id: 'legacy-maintenance-flat', title: 'عقار قديم', kind: 'property', value: 500000, condition: 50 };
  context.state = { bank: 10000, assets: [asset], legacy: {} };
  context.maintainAsset(0);
  assert.equal(context.state.bank, 2500);
  assert.equal(asset.condition, 100);
});

