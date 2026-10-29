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

    await page.locator('#ageUpBtn').click();
    await page.waitForFunction(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      return saved && saved.age === 31 && Array.isArray(saved.timeMachineSnapshots) && saved.timeMachineSnapshots.length === 1;
    });

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      return saved && saved.age === 31;
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
    assert.deepEqual(pageErrors, [], 'the browser run should complete without uncaught JavaScript errors');

    console.log('PASS: mobile layout, legacy v1 load, age-up persistence, time rewind, JSON export/import, and no uncaught page errors.');
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
