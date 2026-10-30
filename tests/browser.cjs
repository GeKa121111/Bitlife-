'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const routes = new Map([
  ['/', 'index.html'],
  ['/index.html', 'index.html'],
  ['/style.css', 'style.css'],
  ['/app.js', 'app.js'],
  ['/sw.js', 'sw.js'],
  ['/manifest.webmanifest', 'manifest.webmanifest'],
  ['/icon.svg', 'icon.svg']
]);
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8'
};

const seedSave = {
  version: 1,
  lifeId: 424242,
  cemeterySaved: false,
  name: 'شخصية اختبار المتصفح',
  gender: 'male',
  age: 30,
  place: { country: 'مصر', city: 'القاهرة', flag: '🇪🇬', start: 18000, unit: 'ج.م' },
  bank: 42000,
  stats: { happiness: 72, health: 91, smart: 66, looks: 61 },
  education: { level: 0, school: 'لم تبدأ الدراسة', major: null, yearsLeft: 0, tuition: 0, clubs: [] },
  job: null,
  jobHistory: [],
  specialCareer: null,
  specialCareerHistory: [],
  combatCareer: null,
  filmStudio: null,
  esportsCareer: null,
  talents: { gaming: 55 },
  performance: 50,
  assets: [{ id: 'browser-business', title: 'مشروع اختبار', emoji: '🏪', kind: 'business', value: 150000, upkeep: 0 }],
  investments: [],
  business: { assetId: 'browser-business', title: 'مشروع اختبار', value: 150000, level: 1 },
  companies: [],
  family: [
    { id: 'browser-father', name: 'الأب التجريبي', relation: 'الأب', emoji: '👨', age: 62, relationshipLevel: 72 },
    { id: 'browser-mother', name: 'الأم التجريبية', relation: 'الأم', emoji: '👩', age: 58, relationshipLevel: 80 }
  ],
  friends: [],
  partner: null,
  married: false,
  children: [],
  coParentingPlans: [],
  pets: [],
  hobbies: [],
  fame: 0,
  followers: 0,
  socialMediaAccount: false,
  socialMediaPosts: 0,
  reputation: 50,
  crimeRecord: 0,
  prison: null,
  debt: 0,
  willDistribution: 'الأسرة بالتساوي',
  heirlooms: [],
  dailyRewardDate: null,
  dailyChallenges: null,
  timeMachineSnapshots: [],
  legacy: { name: null, inheritance: 0, heirloom: null },
  driversLicense: false,
  travelHistory: [],
  log: [{ icon: '🧪', title: 'بداية اختبار المتصفح', text: 'حفظ تجريبي لاختبار التقدم والاستعادة.', type: 'special', age: 30 }],
  accomplishments: ['بدأت رحلة الحياة'],
  status: 'حي',
  cause: null,
  retired: false,
  yearCount: 30,
  wealthPeak: 42000
};

function createServer() {
  return http.createServer((request, response) => {
    const pathname = new URL(request.url || '/', 'http://127.0.0.1').pathname;
    const relativePath = routes.get(pathname);
    if (!relativePath) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }

    const filePath = path.join(root, relativePath);
    try {
      const body = fs.readFileSync(filePath);
      response.writeHead(200, {
        'Content-Type': mimeTypes[path.extname(relativePath)] || 'application/octet-stream',
        'Cache-Control': 'no-store'
      });
      response.end(body);
    } catch (error) {
      response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Unable to read test asset');
    }
  });
}

async function run() {
  const server = createServer();
  let browser;
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      screen: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      acceptDownloads: true
    });
    await context.addInitScript(seed => {
      // Keep random events deterministic in CI so this test checks persistence, not event odds.
      Math.random = () => 0.99;
      if (localStorage.getItem('__hayah_browser_test_seeded') !== 'yes') {
        localStorage.setItem('hekayat_hayah_save_v1', JSON.stringify(seed));
        localStorage.setItem('__hayah_browser_test_seeded', 'yes');
      }
      if (!localStorage.getItem('hayah_ui_settings_v1')) {
        localStorage.setItem('hayah_ui_settings_v1', JSON.stringify({theme:'light',textScale:'normal',sound:false,haptics:false}));
      }
      window.__hayahAudioStarted = 0;
      window.__hayahVibrationCalls = [];
      class MockAudioParam { setValueAtTime() {} exponentialRampToValueAtTime() {} }
      class MockAudioNode { connect() {} }
      class MockOscillator extends MockAudioNode {
        constructor() { super(); this.frequency = new MockAudioParam(); this.type = 'sine'; }
        start() { window.__hayahAudioStarted += 1; }
        stop() {}
      }
      class MockGain extends MockAudioNode { constructor() { super(); this.gain = new MockAudioParam(); } }
      class MockAudioContext {
        constructor() { this.currentTime = 0; this.state = 'running'; this.destination = {}; }
        createOscillator() { return new MockOscillator(); }
        createGain() { return new MockGain(); }
      }
      window.AudioContext = MockAudioContext;
      try {
        Object.defineProperty(navigator, 'vibrate', {
          configurable: true,
          value: pattern => { window.__hayahVibrationCalls.push(pattern); return true; }
        });
      } catch (error) {}
    }, seedSave);

    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    const address = server.address();
    const origin = 'http://127.0.0.1:' + address.port;
    await page.goto(origin + '/', { waitUntil: 'domcontentloaded' });
    await page.locator('#characterName').waitFor();

    const shownName = (await page.locator('#characterName').innerText()).trim();
    assert.ok(shownName.includes(seedSave.name), 'the legacy v1 save should render the seeded player');

    // Sensory feedback is opt-in, stored separately from the life save, and exposed in settings.
    const initialSensorySettings = await page.evaluate(() => JSON.parse(localStorage.getItem('hayah_ui_settings_v1') || '{}'));
    assert.equal(initialSensorySettings.sound, false, 'sound should be off by default');
    assert.equal(initialSensorySettings.haptics, false, 'haptics should be off by default');
    await page.locator('#menuBtn').click();
    await page.locator('.choice').filter({ hasText: 'إعدادات العرض' }).click();
    await page.locator('.choice').filter({ hasText: 'الأصوات: متوقفة' }).click();
    await page.locator('.choice').filter({ hasText: 'الاهتزاز: متوقف' }).click();
    const enabledSensorySettings = await page.evaluate(() => JSON.parse(localStorage.getItem('hayah_ui_settings_v1') || '{}'));
    assert.equal(enabledSensorySettings.sound, true, 'sound setting should persist when enabled');
    assert.equal(enabledSensorySettings.haptics, true, 'haptics setting should persist when enabled');
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('#modalRoot [role="dialog"]'));

    // Dialogs must move focus inside, keep keyboard navigation contained, and restore the trigger on Escape.
    await page.locator('[data-panel="career"]').click();
    await page.locator('#modalRoot [role="dialog"]').waitFor();
    const initialDialogFocus = await page.evaluate(() => {
      const dialog = document.querySelector('#modalRoot [role="dialog"]');
      return !!dialog && dialog.contains(document.activeElement);
    });
    assert.equal(initialDialogFocus, true, 'opening a dialog should move keyboard focus inside it');
    await page.keyboard.press('Shift+Tab');
    const wrappedToLast = await page.evaluate(() => {
      const dialog = document.querySelector('#modalRoot [role="dialog"]');
      const focusable = Array.from(dialog.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])')).filter(element => element.getClientRects().length > 0 && element.getAttribute('aria-hidden') !== 'true');
      return focusable.length > 0 && document.activeElement === focusable[focusable.length - 1];
    });
    assert.equal(wrappedToLast, true, 'Shift+Tab from the first control should wrap to the last control');
    await page.keyboard.press('Tab');
    const wrappedToFirst = await page.evaluate(() => {
      const dialog = document.querySelector('#modalRoot [role="dialog"]');
      const focusable = Array.from(dialog.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])')).filter(element => element.getClientRects().length > 0 && element.getAttribute('aria-hidden') !== 'true');
      return focusable.length > 0 && document.activeElement === focusable[0];
    });
    assert.equal(wrappedToFirst, true, 'Tab from the last control should wrap to the first control');
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('#modalRoot [role="dialog"]'));
    assert.equal(await page.evaluate(() => document.activeElement && document.activeElement.getAttribute('data-panel')), 'career',
      'closing a dialog should restore focus to the button that opened it');
    const legacyBusinessDefaults = await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      return { products: saved.business.products, research: saved.business.productResearch, pendingCosts: saved.business.pendingProductCosts, facilities: saved.business.facilities, pendingFacilityCosts: saved.business.pendingFacilityCosts };
    });
    assert.deepEqual(legacyBusinessDefaults.products, [], 'legacy businesses should receive an empty product list');
    assert.deepEqual(legacyBusinessDefaults.research, [], 'legacy businesses should receive an empty research list');
    assert.equal(legacyBusinessDefaults.pendingCosts, 0, 'legacy businesses should receive a zero pending-cost balance');
    assert.deepEqual(legacyBusinessDefaults.facilities, [], 'legacy businesses should receive an empty facility list');
    assert.equal(legacyBusinessDefaults.pendingFacilityCosts, 0, 'legacy businesses should receive zero pending facility costs');

    // The career catalog should keep aspirational jobs visible and explain missing requirements.
    await page.locator('[data-panel="career"]').click();
    const doctorChoice = page.locator('.choice').filter({ hasText: 'طبيب' }).first();
    await doctorChoice.waitFor();
    assert.ok(await doctorChoice.evaluate(element => element.classList.contains('locked-choice')),
      'a job whose education and intelligence requirements are unmet should be visibly locked');
    await doctorChoice.click();
    await page.getByText(/مستوى التعليم المطلوب 5/).waitFor();
    await page.getByText(/الذكاء المطلوب 76%/).waitFor();
    const feedbackCounts = await page.evaluate(() => ({audio:window.__hayahAudioStarted,vibration:window.__hayahVibrationCalls.length}));
    assert.ok(feedbackCounts.audio > 0, 'an enabled sound setting should play an original UI tone after a choice');
    assert.ok(feedbackCounts.vibration > 0, 'an enabled haptics setting should request vibration after a choice');
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('#modalRoot [role="dialog"]'));
    assert.equal(await page.evaluate(() => document.activeElement && document.activeElement.getAttribute('data-panel')), 'career',
      'Escape from a nested information dialog should return focus to the original career entry point');
    await page.locator('[data-panel="assets"]').click();
    await page.locator('.choice').filter({ hasText: 'إدارة مشروعي' }).click();
    await page.locator('.choice').filter({ hasText: 'التعاقد مع مورد' }).click();
    await page.locator('.choice').filter({ hasText: 'مورد اقتصادي' }).click();
    await page.waitForFunction(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      return saved && saved.business && saved.business.supplier && saved.business.supplier.id === 'economy' && saved.business.supplier.yearsLeft === 1;
    });
    const supplierMarketAt30 = await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      return saved && saved.business && saved.business.supplierMarket;
    });
    assert.equal(supplierMarketAt30.year, 30, 'supplier offers should be tied to the current life year');
    assert.equal(supplierMarketAt30.offers.length, 3, 'the annual market should expose all three supplier tiers');
    await page.locator('.choice').filter({ hasText: 'إدارة الموظفين' }).click();
    await page.locator('.choice').filter({ hasText: 'توظيف موظف' }).click();
    await page.locator('.choice').filter({ hasText: 'مندوب مبيعات' }).click();
    await page.waitForFunction(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      return saved && saved.business && Array.isArray(saved.business.staff) &&
        saved.business.staff.length === 1 && saved.business.staff[0].role === 'sales';
    });
    await page.locator('.choice').filter({ hasText: 'مندوب مبيعات 1' }).click();
    await page.locator('.choice').filter({ hasText: 'تدريب الموظف' }).click();
    await page.waitForFunction(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      return saved && saved.business && saved.business.staff[0].skill === 62;
    });
    await page.locator('#closeModal').click();

    // Launch an original product after paid market research; the next fiscal report must account for its sales and costs.
    await page.locator('[data-panel="assets"]').click();
    await page.locator('.choice').filter({ hasText: 'إدارة مشروعي' }).click();
    await page.locator('.choice').filter({ hasText: 'إدارة المنتجات' }).click();
    await page.locator('.choice').filter({ hasText: 'إطلاق منتج جديد' }).click();
    await page.locator('.choice').filter({ hasText: 'خدمة رقمية' }).click();
    await page.locator('.choice').filter({ hasText: 'إجراء بحث السوق' }).click();
    await page.waitForFunction(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      return saved && saved.business && Array.isArray(saved.business.productResearch) &&
        saved.business.productResearch.some(item => item.productId === 'digital-service' && item.year === 30);
    });
    const marketResearch = await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      return saved.business.productResearch.find(item => item.productId === 'digital-service' && item.year === 30);
    });
    assert.ok(marketResearch.demand >= 20 && marketResearch.demand <= 90);
    assert.ok(marketResearch.competition >= 10 && marketResearch.competition <= 90);
    assert.ok(marketResearch.suggestedPrice > 0 && marketResearch.confidence >= 60);
    await page.locator('.choice').filter({ hasText: 'إطلاق بنتائج البحث' }).click();
    await page.waitForFunction(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      return saved && saved.business && Array.isArray(saved.business.products) && saved.business.products.some(item => item.catalogId === 'digital-service' && item.active);
    });
    const launchedProduct = await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      return saved.business.products.find(item => item.catalogId === 'digital-service' && item.active);
    });
    assert.equal(launchedProduct.demand, marketResearch.demand, 'the product should use researched demand');
    assert.equal(launchedProduct.competition, marketResearch.competition, 'the product should use researched competition');
    assert.equal(launchedProduct.unitPrice, marketResearch.suggestedPrice, 'the product should use the researched price');
    assert.ok(launchedProduct.id && launchedProduct.history.length === 0);
    const originalPrice = launchedProduct.unitPrice;
    await page.locator('.choice').filter({ hasText: 'رفع السعر 10%' }).click();
    await page.waitForFunction(price => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      const product = saved && saved.business && saved.business.products.find(item => item.catalogId === 'digital-service');
      return product && product.unitPrice === Math.round(price * 1.1);
    }, originalPrice);
    await page.locator('.choice').filter({ hasText: 'رجوع للمنتجات' }).click();

    // A researched item can still be launched on instinct; the selected route must ignore the research snapshot.
    await page.locator('.choice').filter({ hasText: 'إطلاق منتج جديد' }).click();
    await page.locator('.choice').filter({ hasText: 'وجبات منزلية' }).click();
    await page.locator('.choice').filter({ hasText: 'إجراء بحث السوق' }).click();
    await page.waitForFunction(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      return saved && saved.business && saved.business.productResearch.some(item => item.productId === 'home-meals' && item.year === 30);
    });
    const secondResearch = await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      return saved.business.productResearch.find(item => item.productId === 'home-meals' && item.year === 30);
    });
    await page.locator('.choice').filter({ hasText: 'إطلاق دون بحث' }).click();
    await page.waitForFunction(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      return saved && saved.business && saved.business.products.filter(item => item.active).length === 2;
    });
    const instinctProduct = await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      return saved.business.products.find(item => item.catalogId === 'home-meals' && item.active);
    });
    assert.equal(instinctProduct.demand, 80, 'an unresearched launch should use the explicit instinct estimate');
    assert.equal(instinctProduct.competition, 82, 'an unresearched launch should not copy researched competition');
    assert.equal(instinctProduct.unitPrice, 461, 'an unresearched launch should not copy the researched suggested price');
    assert.notEqual(instinctProduct.unitPrice, secondResearch.suggestedPrice, 'the no-research route should ignore the saved research price');
    await page.locator('.choice').filter({ hasText: 'رجوع للمنتجات' }).click();
    await page.locator('.choice').filter({ hasText: 'رجوع لإدارة المشروع' }).click();
    await page.locator('#closeModal').click();

    // A store is a persistent facility: it raises product capacity and adds a separately reported annual upkeep.
    await page.locator('[data-panel="assets"]').click();
    await page.locator('.choice').filter({ hasText: 'إدارة مشروعي' }).click();
    await page.locator('.choice').filter({ hasText: 'الفروع والمصانع' }).click();
    await page.locator('.choice').filter({ hasText: 'إضافة فرع أو مصنع' }).click();
    await page.locator('.choice').filter({ hasText: 'متجر إضافي' }).click();
    const purchasedFacility = await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      const business = saved && saved.business;
      return { facility: business && business.facilities && business.facilities[0], pending: business && business.pendingFacilityCosts };
    });
    assert.equal(purchasedFacility.facility.type, 'store', 'the facility catalog should create a store record');
    assert.ok(purchasedFacility.facility.capacityBonus > 0, 'a store should increase product capacity');
    assert.ok(purchasedFacility.facility.annualUpkeep > 0, 'a store should have recurring upkeep');
    assert.equal(purchasedFacility.pending, purchasedFacility.facility.investment, 'the one-time construction investment should be queued for the next report');
    await page.locator('#closeModal').click();

    const mobileGeometry = await page.evaluate(() => {
      const viewportWidth = window.innerWidth;
      const app = document.querySelector('#app').getBoundingClientRect();
      const ageButton = document.querySelector('#ageUpBtn').getBoundingClientRect();
      return {
        viewportWidth,
        appWidth: app.width,
        ageButtonWidth: ageButton.width,
        ageButtonVisible: ageButton.width > 0 && ageButton.height > 0 && ageButton.bottom <= window.innerHeight
      };
    });
    assert.ok(mobileGeometry.appWidth <= mobileGeometry.viewportWidth + 1, 'the main app should fit the 390px mobile viewport');
    assert.ok(mobileGeometry.ageButtonWidth > 0 && mobileGeometry.ageButtonVisible, 'the year-advance control should be visible on mobile');

    // Seed a longer history so the mobile feed has a real scroll position to preserve.
    await page.evaluate(() => {
      const key = 'hekayat_hayah_save_v1';
      const saved = JSON.parse(localStorage.getItem(key) || 'null');
      saved.log = Array.from({ length: 45 }, (_, index) => ({
        icon: '📘',
        title: 'ذكرى اختبار ' + (index + 1),
        text: 'حدث سابق لاختبار الاحتفاظ بموضع القراءة في سجل الحياة.',
        tone: '',
        age: Math.max(0, 30 - Math.floor((44 - index) / 5))
      }));
      localStorage.setItem(key, JSON.stringify(saved));
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    const reloadedSensorySettings = await page.evaluate(() => JSON.parse(localStorage.getItem('hayah_ui_settings_v1') || '{}'));
    assert.equal(reloadedSensorySettings.sound, true, 'sound preference should survive a reload');
    assert.equal(reloadedSensorySettings.haptics, true, 'haptics preference should survive a reload');
    await page.waitForFunction(() => document.querySelectorAll('#lifeFeed .logcard').length === 45);
    const readingStart = await page.evaluate(() => {
      const feed = document.querySelector('#lifeFeed');
      feed.scrollTop = 0;
      return { scrollHeight: feed.scrollHeight, clientHeight: feed.clientHeight };
    });
    assert.ok(readingStart.scrollHeight > readingStart.clientHeight, 'the seeded mobile history should be scrollable');

    await page.locator('#ageUpBtn').click();
    await page.waitForFunction(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      return saved && saved.age === 31 && Array.isArray(saved.timeMachineSnapshots) && saved.timeMachineSnapshots.length === 1;
    });
    const businessYear = await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      const history = saved && saved.business && Array.isArray(saved.business.financialHistory) ? saved.business.financialHistory : [];
      return {
        supplier: saved && saved.business && saved.business.supplier,
        staff: saved && saved.business && saved.business.staff,
        supplierMarket: saved && saved.business && saved.business.supplierMarket,
        products: saved && saved.business && saved.business.products,
        pendingProductCosts: saved && saved.business && saved.business.pendingProductCosts,
        facility: saved && saved.business && saved.business.facilities && saved.business.facilities[0],
        pendingFacilityCosts: saved && saved.business && saved.business.pendingFacilityCosts,
        asset: saved && saved.assets && saved.assets.find(item => item.kind === 'business' && !item.companyPortfolio && String(item.id) === String(saved.business.assetId)),
        report: history[history.length - 1]
      };
    });
    assert.ok(businessYear.report, 'a full financial report should be saved after the first business year');
    assert.equal(businessYear.report.year, 31);
    assert.ok(businessYear.report.revenue > 0 && businessYear.report.costs >= 0);
    assert.equal(businessYear.report.profit, businessYear.report.revenue - businessYear.report.costs);
    assert.ok(Number.isFinite(businessYear.report.margin) && Number.isFinite(businessYear.report.growthRate));
    assert.equal(businessYear.report.supplier, 'مورد اقتصادي');
    assert.ok(businessYear.report.supplierQuality >= 40 && businessYear.report.supplierQuality <= 99);
    assert.ok(businessYear.report.supplierCostMultiplier >= 0.7 && businessYear.report.supplierCostMultiplier <= 1.3);
    assert.equal(businessYear.supplier, null, 'new supplier contracts should expire after one fiscal year');
    assert.equal(businessYear.supplierMarket.year, 30, 'the prior market snapshot should remain saved until the next review');
    assert.equal(businessYear.report.staffCount, 1, 'the annual report should record the active team size');
    assert.equal(businessYear.report.payroll, businessYear.staff[0].salary, 'annual payroll should match the hired employee salary');
    assert.equal(businessYear.report.productCount, 2, 'the annual report should count both launched products');
    assert.ok(businessYear.report.productRevenue > 0 && businessYear.report.productUnits > 0, 'the product should generate sales after one fiscal year');
    assert.ok(businessYear.report.productCosts >= 4650, 'both research fees and both launch fees should be included in product costs');
    assert.equal(businessYear.pendingProductCosts, 0, 'upfront product costs should clear after the fiscal report');
    assert.equal(businessYear.pendingFacilityCosts, 0, 'facility construction costs should clear after the fiscal report');
    assert.equal(businessYear.report.facilityCount, 1, 'the annual report should count the active store');
    assert.equal(businessYear.report.facilityInvestment, businessYear.facility.investment, 'construction investment should be reported once');
    assert.equal(businessYear.report.facilityUpkeep, businessYear.facility.annualUpkeep, 'annual facility upkeep should be reported');
    assert.ok(businessYear.report.capacityMultiplier > 1, 'a facility should increase annual product capacity');
    assert.equal(businessYear.asset.value, JSON.parse(await page.evaluate(() => localStorage.getItem('hekayat_hayah_save_v1'))).business.value, 'the primary business asset should remain synchronized after its annual report');
    assert.equal(businessYear.report.productProfit, businessYear.report.productRevenue - businessYear.report.productCosts);
    assert.equal(businessYear.products.filter(item => item.active).length, 2);
    assert.equal(businessYear.products[0].history.length, 1, 'the product should retain its first annual performance record');
    assert.equal(businessYear.products[0].history[0].demand, marketResearch.demand, 'the first report should use the researched demand snapshot');
    assert.equal(businessYear.products[1].history[0].demand, 80, 'the instinct launch should use its own demand estimate');
    assert.ok(businessYear.report.costs >= businessYear.report.payroll, 'employee payroll should be included in annual business costs');
    assert.equal(businessYear.staff[0].years, 1, 'employee experience should advance with the business year');

    await page.waitForTimeout(450);
    const readingAfterYear = await page.evaluate(() => {
      const feed = document.querySelector('#lifeFeed');
      return { scrollTop: feed.scrollTop, maxScroll: feed.scrollHeight - feed.clientHeight };
    });
    assert.ok(readingAfterYear.scrollTop <= 20, 'advancing a year should not yank a reader away from older events');

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      return saved && saved.age === 31;
    });
    await page.waitForFunction(() => {
      const feed = document.querySelector('#lifeFeed');
      return feed && feed.scrollHeight > feed.clientHeight &&
        feed.scrollHeight - feed.scrollTop - feed.clientHeight <= 8;
    });
    assert.ok((await page.locator('#characterName').innerText()).includes(seedSave.name), 'the player identity should persist after reload');
    const persistedProducts = await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      return saved && saved.business && saved.business.products;
    });
    assert.equal(persistedProducts.length, 2, 'launched products should survive a reload');
    assert.deepEqual(persistedProducts.map(item => item.catalogId), ['digital-service','home-meals']);

    // The supplier market refreshes for the new fiscal year and remains stable after reload.
    await page.locator('[data-panel="assets"]').click();
    await page.locator('.choice').filter({ hasText: 'إدارة مشروعي' }).click();
    await page.locator('.choice').filter({ hasText: 'التعاقد مع مورد' }).click();
    await page.waitForFunction(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      return saved && saved.business && saved.business.supplierMarket &&
        saved.business.supplierMarket.year === 31 && saved.business.supplierMarket.offers.length === 3;
    });
    const supplierMarketAt31 = await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      return saved.business.supplierMarket;
    });
    assert.notDeepEqual(supplierMarketAt31.offers, supplierMarketAt30.offers,
      'supplier quality and cost quotes should vary between fiscal years');
    assert.ok(supplierMarketAt31.offers.every(offer =>
      offer.quality >= 40 && offer.quality <= 99 &&
      offer.costMultiplier >= 0.7 && offer.costMultiplier <= 1.3),
      'annual supplier quotes should stay within safe economic bounds');

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      return saved && saved.business && saved.business.supplierMarket && saved.business.supplierMarket.year === 31;
    });
    const persistedSupplierMarket = await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      return saved.business.supplierMarket;
    });
    assert.deepEqual(persistedSupplierMarket, supplierMarketAt31,
      'the generated supplier offers should remain unchanged after reload');

    await page.locator('[data-panel="assets"]').click();
    await page.locator('.choice').filter({ hasText: 'إدارة مشروعي' }).click();
    await page.locator('.choice').filter({ hasText: 'التعاقد مع مورد' }).click();
    await page.locator('.choice').filter({ hasText: 'مورد متوازن' }).click();
    await page.waitForFunction(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      return saved && saved.business && saved.business.supplier &&
        saved.business.supplier.id === 'balanced' && saved.business.supplier.yearsLeft === 1;
    });
    const selectedSupplier = await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      return saved.business.supplier;
    });
    const balancedOffer = supplierMarketAt31.offers.find(offer => offer.id === 'balanced');
    assert.equal(selectedSupplier.quality, balancedOffer.quality);
    assert.equal(selectedSupplier.costMultiplier, balancedOffer.costMultiplier);
    await page.locator('#closeModal').click();

    await page.locator('#menuBtn').click();
    await page.locator('.choice').filter({ hasText: 'الرجوع بالزمن' }).click();
    await page.locator('.choice').filter({ hasText: 'العودة إلى عمر' }).first().click();
    await page.waitForFunction(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      return saved && saved.age === 30 && Array.isArray(saved.timeMachineSnapshots) && saved.timeMachineSnapshots.length === 0;
    });
    // The rewind action intentionally opens a confirmation dialog; close it before opening the main menu again.
    await page.locator('.choice').filter({ hasText: 'تمام' }).last().click();

    // A legacy multi-year supplier contract keeps its remaining term and receives safe quote defaults.
    await page.evaluate(() => {
      const key = 'hekayat_hayah_save_v1';
      const saved = JSON.parse(localStorage.getItem(key) || 'null');
      saved.business.supplier = { id: 'economy', yearsLeft: 2, startedAtAge: 29 };
      localStorage.setItem(key, JSON.stringify(saved));
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      return saved && saved.age === 30 && saved.business && saved.business.supplier;
    });
    await page.locator('[data-panel="assets"]').click();
    await page.locator('.choice').filter({ hasText: 'إدارة مشروعي' }).click();
    await page.locator('.choice').filter({ hasText: 'التعاقد مع مورد' }).click();
    await page.waitForFunction(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      const supplier = saved && saved.business && saved.business.supplier;
      return supplier && supplier.yearsLeft === 2 && supplier.quality === 58 && supplier.costMultiplier === 0.84;
    });
    const legacySupplier = await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      return saved.business.supplier;
    });
    assert.equal(legacySupplier.yearsLeft, 2, 'legacy supplier duration should not be shortened');
    assert.equal(legacySupplier.quality, 58, 'legacy supplier quality should default from the original catalog');
    assert.equal(legacySupplier.costMultiplier, 0.84, 'legacy supplier cost should default from the original catalog');
    await page.locator('#closeModal').click();

    const downloadPromise = page.waitForEvent('download');
    await page.locator('#menuBtn').click();
    await page.locator('.choice').filter({ hasText: 'تصدير الحفظ' }).click();
    const download = await downloadPromise;
    assert.equal(download.suggestedFilename(), 'hekayat-hayah-save.json');
    const downloadPath = await download.path();
    assert.ok(downloadPath, 'the browser should produce a readable JSON export');
    const exported = JSON.parse(fs.readFileSync(downloadPath, 'utf8'));
    assert.equal(exported.version, 1, 'export must preserve the existing save schema');
    assert.equal(exported.age, 30, 'export must contain the current life state');

    // Invalid JSON must be rejected without overwriting the current save.
    const beforeInvalidImport = await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      return { lifeId: saved && saved.lifeId, age: saved && saved.age, name: saved && saved.name, bank: saved && saved.bank };
    });
    const invalidChooserPromise = page.waitForEvent('filechooser');
    await page.locator('#menuBtn').click();
    await page.locator('.choice').filter({ hasText: 'تحميل حفظ' }).click();
    const invalidChooser = await invalidChooserPromise;
    await invalidChooser.setFiles({
      name: 'broken-hayah-save.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{ invalid JSON')
    });
    await page.getByText('ملف حفظ غير صالح', { exact: true }).waitFor();
    const afterInvalidImport = await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      return { lifeId: saved && saved.lifeId, age: saved && saved.age, name: saved && saved.name, bank: saved && saved.bank };
    });
    assert.deepEqual(afterInvalidImport, beforeInvalidImport, 'invalid import should leave the active save untouched');
    await page.locator('.choice').filter({ hasText: 'تمام' }).last().click();

    // Valid JSON with a missing identity/age is still a corrupt save, not a new life.
    const structuralChooserPromise = page.waitForEvent('filechooser');
    await page.locator('#menuBtn').click();
    await page.locator('.choice').filter({ hasText: 'تحميل حفظ' }).click();
    const structuralChooser = await structuralChooserPromise;
    await structuralChooser.setFiles({
      name: 'incomplete-hayah-save.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({ version: 1, stats: {}, log: [], family: [], place: {} }))
    });
    await page.getByText('ملف حفظ غير صالح', { exact: true }).waitFor();
    const afterStructuralImport = await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      return { lifeId: saved && saved.lifeId, age: saved && saved.age, name: saved && saved.name, bank: saved && saved.bank };
    });
    assert.deepEqual(afterStructuralImport, beforeInvalidImport, 'structurally incomplete JSON must not overwrite the active save');
    await page.locator('.choice').filter({ hasText: 'تمام' }).last().click();

    const imported = { ...exported, name: 'حياة مستوردة للاختبار', age: 44, yearCount: 44 };
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('#menuBtn').click();
    await page.locator('.choice').filter({ hasText: 'تحميل حفظ' }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'hayah-browser-test.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(imported))
    });
    await page.waitForFunction(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      return saved && saved.age === 44 && saved.name === 'حياة مستوردة للاختبار';
    });
    assert.ok((await page.locator('#characterName').innerText()).includes('حياة مستوردة للاختبار'), 'the imported life should render without a reload');

    // Exercise the actual end-of-life UI and reconcile the heir's net estate in Chromium.
    await page.locator('.choice').filter({ hasText: 'تمام' }).last().click();
    await page.evaluate(() => {
      const key = 'hekayat_hayah_save_v1';
      const saved = JSON.parse(localStorage.getItem(key));
      saved.name = 'الوالد الاختباري';
      saved.age = 105;
      saved.yearCount = 105;
      saved.status = 'حي';
      saved.cause = null;
      saved.bank = 100000;
      saved.assets = [
        { id: 'estate-property-test', kind: 'property', title: 'عقار اختبار الإرث', value: 500001, upkeep: 1000, condition: 100, rented: false },
        { id: 'estate-car-test', kind: 'car', title: 'سيارة اختبار الإرث', value: 260003, upkeep: 500, condition: 100 },
        { id: 'estate-business-test', kind: 'business', title: 'مشروع اختبار الإرث', value: 150007, upkeep: 2000 }
      ];
      saved.investments = [
        { id: 'estate-investment-a', kind: 'low-risk', title: 'استثمار أول', value: 123457 },
        { id: 'estate-investment-b', kind: 'مخاطرة عالية', title: 'استثمار ثانٍ', value: 98765 },
        { id: 'estate-investment-c', kind: 'low-risk', title: 'استثمار ثالث', value: 23457 }
      ];
      saved.debt = 100000;
      saved.willDistribution = 'الأسرة بالتساوي';
      saved.timeMachineSnapshots = [];
      saved.children = [{
        id: 'estate-heir-test',
        name: 'وارث اختبار',
        gender: 'male',
        age: 25,
        relation: 'الابن',
        relationshipLevel: 80,
        health: 80,
        happiness: 70,
        smart: 60,
        looks: 60,
        schoolPerformance: 70,
        careerPotential: 75,
        independence: 35,
        educationStatus: 'خريج جامعي',
        interest: 'التقنية'
      }];
      saved.log = [{
        icon: '🧪',
        title: 'نهاية اختبار الإرث',
        text: 'اختبار محاكاة الإرث داخل المتصفح.',
        type: 'special',
        age: 105
      }];
      localStorage.setItem(key, JSON.stringify(saved));
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('#ageUpBtn').click();
    await page.locator('[data-heir="0"]').waitFor({ state: 'visible' });
    await page.locator('[data-heir="0"]').click();
    await page.waitForFunction(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      return saved && saved.name === 'وارث اختبار' && saved.legacy &&
        saved.legacy.name === 'الوالد الاختباري' && saved.status === 'حي';
    });
    const inherited = await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      const assets = Array.isArray(saved.assets) ? saved.assets : [];
      const investments = Array.isArray(saved.investments) ? saved.investments : [];
      return {
        name: saved.name,
        sourceName: saved.legacy.name,
        legacyValue: saved.legacy.inheritance,
        componentValue: Number(saved.bank || 0)
          + assets.reduce((sum, item) => sum + Math.max(0, Number(item.value) || 0), 0)
          + investments.reduce((sum, item) => sum + Math.max(0, Number(item.value) || 0), 0),
        bank: saved.bank,
        assetCount: assets.length,
        investmentCount: investments.length,
        debt: saved.debt
      };
    });
    assert.equal(inherited.name, 'وارث اختبار');
    assert.equal(inherited.sourceName, 'الوالد الاختباري');
    assert.equal(inherited.legacyValue, inherited.componentValue, 'recorded inheritance should reconcile with all transferred assets');
    assert.equal(inherited.debt, 0, 'parent debt should not be copied as debt to the new life');
    assert.ok(inherited.bank > 0 && inherited.assetCount === 3 && inherited.investmentCount === 3, 'inheritance should proportionally transfer multiple asset and investment entries');

    // A second estate whose debt exceeds all positive assets should yield no negative inheritance.
    await page.locator('.choice').filter({ hasText: 'تمام' }).last().click();
    await page.evaluate(() => {
      const key = 'hekayat_hayah_save_v1';
      const saved = JSON.parse(localStorage.getItem(key));
      saved.lifeId = 565656;
      saved.name = 'تركة غارقة في الديون';
      saved.age = 105;
      saved.yearCount = 105;
      saved.status = 'حي';
      saved.cause = null;
      saved.bank = 25000;
      saved.assets = [
        { id: 'insolvent-property', kind: 'property', title: 'عقار صغير', value: 50000, upkeep: 0, condition: 100, rented: false },
        { id: 'insolvent-car', kind: 'car', title: 'سيارة قديمة', value: 20000, upkeep: 0, condition: 100 }
      ];
      saved.investments = [{ id: 'insolvent-investment', kind: 'low-risk', title: 'محفظة صغيرة', value: 15000 }];
      saved.debt = 500000;
      saved.willDistribution = 'الأسرة بالتساوي';
      saved.timeMachineSnapshots = [];
      saved.children = [{
        id: 'insolvent-heir-test',
        name: 'وارث بلا تركة',
        gender: 'female',
        age: 24,
        relation: 'الابنة',
        relationshipLevel: 80,
        health: 75,
        happiness: 60,
        smart: 65,
        looks: 55,
        schoolPerformance: 68,
        careerPotential: 62,
        independence: 50,
        educationStatus: 'تبدأ المسار المهني',
        interest: 'الإدارة'
      }];
      saved.log = [{ icon: '🧪', title: 'اختبار تركة معسرة', text: 'الديون أكبر من مجموع الأصول.', type: 'special', age: 105 }];
      localStorage.setItem(key, JSON.stringify(saved));
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('#ageUpBtn').click();
    await page.locator('[data-heir="0"]').waitFor({ state: 'visible' });
    await page.locator('[data-heir="0"]').click();
    await page.waitForFunction(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      return saved && saved.name === 'وارث بلا تركة' && saved.legacy &&
        saved.legacy.name === 'تركة غارقة في الديون' && saved.status === 'حي';
    });
    const insolventInheritance = await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      const assets = Array.isArray(saved.assets) ? saved.assets : [];
      const investments = Array.isArray(saved.investments) ? saved.investments : [];
      return {
        bank: Number(saved.bank || 0),
        assetValue: assets.reduce((sum, item) => sum + Math.max(0, Number(item.value) || 0), 0),
        investmentValue: investments.reduce((sum, item) => sum + Math.max(0, Number(item.value) || 0), 0),
        assetCount: assets.length,
        investmentCount: investments.length,
        recorded: Number(saved.legacy.inheritance || 0),
        debt: Number(saved.debt || 0)
      };
    });
    assert.equal(insolventInheritance.bank, 0, 'insolvent estate should not transfer a negative bank balance');
    assert.equal(insolventInheritance.assetCount, 0, 'no assets should transfer when the net estate is zero');
    assert.equal(insolventInheritance.investmentCount, 0, 'no investments should transfer when the net estate is zero');
    assert.equal(insolventInheritance.recorded, 0, 'insolvent estate should record zero inheritance');
    assert.equal(insolventInheritance.bank + insolventInheritance.assetValue + insolventInheritance.investmentValue, insolventInheritance.recorded, 'insolvent inheritance components should reconcile to zero');
    assert.equal(insolventInheritance.debt, 0, 'the heir must not inherit the parent debt as personal debt');
    // A legacy job record should migrate into the new career ladder and accept a promotion request.
    await page.evaluate(() => {
      const key = 'hekayat_hayah_save_v1';
      const saved = JSON.parse(localStorage.getItem(key) || 'null');
      saved.lifeId = 676767;
      saved.name = 'اختبار المسار المهني';
      saved.age = 32;
      saved.yearCount = 32;
      saved.status = 'حي';
      saved.cause = null;
      saved.retired = false;
      saved.job = { id: 'admin', title: 'موظف إداري', salary: 100000, startAge: 30 };
      saved.performance = 95;
      saved.stats = { ...saved.stats, smart: 85 };
      saved.education = { ...saved.education, level: 3, yearsLeft: 0, clubs: [] };
      saved.timeMachineSnapshots = [];
      saved.log = [{ icon: '🧪', title: 'اختبار الترقية', text: 'حفظ قديم بلا بيانات درجات مهنية.', type: 'special', age: 32 }];
      localStorage.setItem(key, JSON.stringify(saved));
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.evaluate(() => { Math.random = () => 0; });
    await page.locator('[data-panel="career"]').click();
    const careerSummary = await page.locator('#modalRoot').innerText();
    const promotionChoice = page.locator('.choice').filter({ hasText: 'طلب ترقية' }).first();
    await promotionChoice.waitFor();
    await promotionChoice.click();
    const promotionResult = await page.evaluate(() => ({
      job: JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null').job,
      modal: document.querySelector('#modalRoot')?.innerText || '',
      randomProbe: Math.random()
    }));
    assert.equal(promotionResult.randomProbe, 0, 'the deterministic browser run should control the promotion roll');
    assert.equal(promotionResult.job.level, 2,
      'legacy promotion should succeed; career panel: ' + careerSummary + '; response: ' + promotionResult.modal); 
    const promotedJob = promotionResult.job;
    assert.equal(promotedJob.salary, 114000, 'promotion should apply the defined salary increase');
    assert.equal(promotedJob.yearsInRole, 0, 'promotion should restart tenure in the new grade');
    assert.equal(promotedJob.promotions[0].fromLevel, 1);
    assert.equal(promotedJob.promotions[0].toLevel, 2);


    // Portfolio companies now use the same supplier, staffing and product systems without touching the primary business.
    await page.evaluate(() => {
      const key = 'hekayat_hayah_save_v1';
      const saved = JSON.parse(localStorage.getItem(key) || 'null');
      const id = 'portfolio-company-browser';
      saved.lifeId = 787878;
      saved.name = 'اختبار تشغيل شركة مستقلة';
      saved.age = 35;
      saved.yearCount = 35;
      saved.status = 'حي';
      saved.cause = null;
      saved.retired = false;
      saved.job = null;
      saved.bank = 500000;
      saved.debt = 0;
      saved.business = null;
      saved.companies = [{ id, assetId: id, title: 'شركة محفظة اختبار', sector: 'تقنية', value: 160000, level: 1, upkeep: 4000, bought: 30, emoji: '💻' }];
      saved.assets = [{ id, title: 'شركة محفظة اختبار', emoji: '💻', kind: 'business', value: 160000, upkeep: 0, bought: 30, companyPortfolio: true }];
      saved.timeMachineSnapshots = [];
      saved.log = [{ icon: '🧪', title: 'اختبار شركة المحفظة', text: 'اختبار إدارة شركة مستقلة عن المشروع الأساسي.', type: 'special', age: 35 }];
      localStorage.setItem(key, JSON.stringify(saved));
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.evaluate(() => { Math.random = () => 0.99; });
    await page.locator('[data-panel="assets"]').click();
    await page.locator('.choice').filter({ hasText: 'شركة محفظة اختبار' }).click();
    await page.locator('.choice').filter({ hasText: 'إدارة التشغيل' }).click();
    await page.locator('.choice').filter({ hasText: 'التعاقد مع مورد' }).click();
    await page.locator('.choice').filter({ hasText: 'مورد اقتصادي' }).click();
    await page.locator('.choice').filter({ hasText: 'الفروع والمصانع' }).click();
    await page.locator('.choice').filter({ hasText: 'إضافة فرع أو مصنع' }).click();
    await page.locator('.choice').filter({ hasText: 'مصنع صغير' }).click();
    await page.locator('.choice').filter({ hasText: 'رجوع لإدارة المشروع' }).click();
    await page.locator('.choice').filter({ hasText: 'إدارة الموظفين' }).click();
    await page.locator('.choice').filter({ hasText: 'توظيف موظف' }).click();
    await page.locator('.choice').filter({ hasText: 'مندوب مبيعات' }).click();
    await page.locator('.choice').filter({ hasText: 'رجوع لإدارة المشروع' }).click();
    await page.locator('.choice').filter({ hasText: 'إدارة المنتجات' }).click();
    await page.locator('.choice').filter({ hasText: 'إطلاق منتج جديد' }).click();
    await page.locator('.choice').filter({ hasText: 'خدمة رقمية' }).click();
    await page.locator('.choice').filter({ hasText: 'إجراء بحث السوق' }).click();
    await page.locator('.choice').filter({ hasText: 'إطلاق بنتائج البحث' }).click();
    const portfolioBeforeYear = await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      const company = saved && saved.companies && saved.companies[0];
      return { primaryBusiness: saved && saved.business, company };
    });
    assert.equal(portfolioBeforeYear.primaryBusiness, null, 'portfolio operations must not create or mutate the primary business');
    assert.equal(portfolioBeforeYear.company.supplier.id, 'economy');
    assert.equal(portfolioBeforeYear.company.staff.length, 1);
    assert.equal(portfolioBeforeYear.company.products.length, 1);
    assert.equal(portfolioBeforeYear.company.products[0].catalogId, 'digital-service');
    assert.equal(portfolioBeforeYear.company.products[0].id.includes('portfolio-company-browser'), true,
      'product identifiers should be unique to their owning portfolio company');
    assert.equal(portfolioBeforeYear.company.facilities.length, 1, 'the portfolio company should own its factory independently');
    assert.equal(portfolioBeforeYear.company.facilities[0].type, 'factory');
    await page.locator('.choice').filter({ hasText: 'رجوع للمنتجات' }).click();
    await page.locator('.choice').filter({ hasText: 'رجوع لإدارة المشروع' }).click();
    await page.locator('.choice').filter({ hasText: 'تحليل السوق والمنافسين' }).click();
    const marketBeforeReload = await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      return saved && saved.companies && saved.companies[0] && saved.companies[0].market;
    });
    assert.ok(marketBeforeReload, 'opening the market panel should persist a market snapshot');
    assert.equal(marketBeforeReload.year, 35);
    assert.ok(marketBeforeReload.competitorCount >= 2 && marketBeforeReload.competitorCount <= 8);
    assert.ok(marketBeforeReload.marketShare >= 3 && marketBeforeReload.marketShare <= 45);
    const marketDialog = await page.locator('#modalRoot').innerText();
    assert.match(marketDialog, /المنافسين الافتراضيين/);
    await page.locator('#closeModal').click();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.evaluate(() => { Math.random = () => 0.99; });
    await page.locator('[data-panel="assets"]').click();
    await page.locator('.choice').filter({ hasText: 'شركة محفظة اختبار' }).click();
    await page.locator('.choice').filter({ hasText: 'إدارة التشغيل' }).click();
    await page.locator('.choice').filter({ hasText: 'تحليل السوق والمنافسين' }).click();
    const marketAfterReload = await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      return saved && saved.companies && saved.companies[0] && saved.companies[0].market;
    });
    assert.deepEqual(marketAfterReload, marketBeforeReload,
      'the current-year competitor market should remain stable after reload');
    await page.locator('#closeModal').click();
    await page.locator('#ageUpBtn').click();
    await page.waitForFunction(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      return saved && saved.age === 36 && saved.companies && saved.companies[0] &&
        saved.companies[0].financialHistory && saved.companies[0].financialHistory.some(report => report.year === 36);
    });
    const portfolioAfterYear = await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      const company = saved && saved.companies && saved.companies[0];
      return { primaryBusiness: saved && saved.business, company, asset: saved && saved.assets && saved.assets[0],
        report: company && company.financialHistory && company.financialHistory[company.financialHistory.length - 1] };
    });
    assert.equal(portfolioAfterYear.primaryBusiness, null);
    assert.equal(portfolioAfterYear.report.year, 36);
    assert.equal(portfolioAfterYear.report.supplier, 'مورد اقتصادي');
    assert.equal(portfolioAfterYear.report.staffCount, 1);
    assert.equal(portfolioAfterYear.report.payroll, portfolioAfterYear.company.staff[0].salary);
    assert.equal(portfolioAfterYear.report.productCount, 1);
    assert.equal(portfolioAfterYear.report.facilityCount, 1);
    assert.equal(portfolioAfterYear.company.market.year, 36, 'the market snapshot should roll forward with the fiscal year');
    assert.equal(portfolioAfterYear.report.marketIndustry, 'تقنية');
    assert.equal(portfolioAfterYear.report.marketCompetitorCount, portfolioAfterYear.company.market.competitorCount);
    assert.equal(portfolioAfterYear.report.marketShare, portfolioAfterYear.company.market.marketShare);
    assert.ok(Number.isFinite(portfolioAfterYear.report.marketShareChange));
    assert.ok(portfolioAfterYear.report.marketDemandIndex >= 55 && portfolioAfterYear.report.marketDemandIndex <= 105);
    assert.ok(portfolioAfterYear.report.marketCompetitionIndex >= 20 && portfolioAfterYear.report.marketCompetitionIndex <= 85);
    assert.ok(portfolioAfterYear.report.facilityUpkeep > 0);
    assert.ok(portfolioAfterYear.report.capacityMultiplier > 1);
    assert.ok(portfolioAfterYear.report.productRevenue > 0 && portfolioAfterYear.report.productUnits > 0);
    assert.equal(portfolioAfterYear.report.profit, portfolioAfterYear.report.revenue - portfolioAfterYear.report.costs);
    assert.equal(portfolioAfterYear.company.staff[0].years, 1);
    assert.equal(portfolioAfterYear.company.products[0].history.length, 1);
    assert.equal(portfolioAfterYear.company.products[0].history[0].year, 36);
    assert.equal(portfolioAfterYear.company.supplier, null, 'the portfolio supplier contract should expire after its fiscal year');
    assert.equal(portfolioAfterYear.asset.value, portfolioAfterYear.company.value, 'the portfolio asset value should stay in sync with its operating company');

    assert.deepEqual(pageErrors, [], 'the browser run should complete without uncaught JavaScript errors');

    console.log('PASS: mobile layout, legacy v1 load, persistence, rewind, JSON import, inheritance, insolvent estate, career promotion migration, annual supplier market, persistent competitor market, facilities and production capacity, researched and instinct product launches, product pricing, annual product sales, business reports, and independent portfolio-company operations.');
    await context.close();
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
