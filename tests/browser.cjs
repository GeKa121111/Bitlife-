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
  assets: [],
  investments: [],
  business: null,
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

    await page.locator('#menuBtn').click();
    await page.locator('.choice').filter({ hasText: 'الرجوع بالزمن' }).click();
    await page.locator('.choice').filter({ hasText: 'العودة إلى عمر' }).first().click();
    await page.waitForFunction(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      return saved && saved.age === 30 && Array.isArray(saved.timeMachineSnapshots) && saved.timeMachineSnapshots.length === 0;
    });
    // The rewind action intentionally opens a confirmation dialog; close it before opening the main menu again.
    await page.locator('.choice').filter({ hasText: 'تمام' }).last().click();

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
    assert.deepEqual(pageErrors, [], 'the browser run should complete without uncaught JavaScript errors');

    console.log('PASS: mobile layout, legacy v1 load, persistence, rewind, valid/invalid JSON import, multi-asset inheritance, and insolvent-estate handling.');
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
