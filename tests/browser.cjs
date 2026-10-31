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
  heirlooms: [
    { name: 'ميدالية العائلة', value: 2400, age: 18 },
    { id: 'book-heirloom-1', name: 'كتاب نادر', emoji: '📚', value: 4200, age: 22, kind: 'family' }
  ],
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
    assert.equal(await page.locator('#adSlot, #closeAdSlot, .ad-slot').count(), 0,
      'the trial advertising placeholder should not render in the mobile UI');

    const shownName = (await page.locator('#characterName').innerText()).trim();
    assert.ok(shownName.includes(seedSave.name), 'the legacy v1 save should render the seeded player');

    const accessibleStats = await page.locator('#statsPanel [role="progressbar"]').evaluateAll(elements => elements.map(element => ({
      label: element.getAttribute('aria-label'),
      min: element.getAttribute('aria-valuemin'),
      max: element.getAttribute('aria-valuemax'),
      value: Number(element.getAttribute('aria-valuenow')),
      text: element.getAttribute('aria-valuetext')
    })));
    const expectedStatValues = await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      return [saved.stats.happiness, saved.stats.health, saved.stats.smart, saved.stats.looks]
        .map(value => Math.max(0, Math.min(100, Math.round(Number(value) || 0))));
    });
    assert.deepEqual(accessibleStats.map(item => item.label), ['السعادة', 'الصحة', 'الذكاء', 'المظهر'],
      'each core stat should have a localized accessible name');
    assert.deepEqual(accessibleStats.map(item => item.value), expectedStatValues,
      'screen-reader values should match the saved life stats');
    assert.ok(accessibleStats.every(item => item.min === '0' && item.max === '100' && item.text === item.value + ' من 100'),
      'each stat should expose its full numeric range and spoken value');

    const legacyCollection = await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      return { count: saved.heirlooms.length, bank: saved.bank };
    });
    assert.equal(legacyCollection.count, 2, 'legacy heirloom entries should remain in the save');
    await page.locator('#profileBtn').click();
    await page.locator('.choice').filter({ hasText: 'مقتنياتي الموروثة' }).click();
    await page.locator('.choice').filter({ hasText: 'كتاب نادر' }).click();
    await page.locator('.choice').filter({ hasText: 'بيع المقتنى' }).click();
    const soldHeirloom = await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      return { bank: saved.bank, items: saved.heirlooms };
    });
    assert.equal(soldHeirloom.bank, legacyCollection.bank + 3570,
      'selling an heirloom should credit 85% of its estimated value');
    assert.equal(soldHeirloom.items.length, 1, 'selling one heirloom must not remove the other family items');
    assert.equal(soldHeirloom.items[0].name, 'ميدالية العائلة');
    assert.ok(soldHeirloom.items[0].id.startsWith('legacy-heirloom-'),
      'legacy heirlooms should receive stable IDs during save normalization');
    await page.locator('#closeModal').click();

    assert.equal(await page.locator('.story-heading').isVisible(), true,
      'the life diary should have a visible section heading');
    assert.equal(await page.locator('#lifeMeta').isVisible(), true,
      'the current life year should be visible in the diary heading');
    assert.equal(await page.locator('.logtitle').first().isVisible(), true,
      'life events should display their titles, not only body text');
    const initialLayout = await page.evaluate(() => ({
      appWidth: document.querySelector('#app').clientWidth,
      feedWidth: document.querySelector('#lifeFeed').clientWidth,
      feedScrollWidth: document.querySelector('#lifeFeed').scrollWidth
    }));
    assert.ok(initialLayout.appWidth > 0 && initialLayout.feedWidth > 0,
      'the refreshed mobile layout should render its main regions');
    assert.equal(initialLayout.feedScrollWidth, initialLayout.feedWidth,
      'the life feed should not introduce horizontal scrolling');

    const measureDock = () => page.evaluate(() => {
      const rect = element => {
        const box = document.querySelector(element).getBoundingClientRect();
        return { left: box.left, right: box.right, top: box.top, bottom: box.bottom, width: box.width };
      };
      const app = rect('#app'), dock = rect('.bottom-dock'), stats = rect('#statsPanel');
      const nav = rect('.nav'), feed = rect('#lifeFeed');
      return { app, dock, stats, nav, feed,
        transform: getComputedStyle(document.querySelector('.bottom-dock')).transform };
    });
    const assertDockAligned = (layout, label) => {
      assert.equal(layout.transform, 'none', label + ': the dock must not retain a legacy horizontal transform');
      assert.ok(Math.abs(layout.dock.left - layout.app.left) <= 1.5,
        label + ': the dock should start at the app left edge');
      assert.ok(Math.abs(layout.dock.right - layout.app.right) <= 1.5,
        label + ': the dock should use the full app width');
      assert.ok(Math.abs(layout.stats.width - layout.dock.width) <= 1.5,
        label + ': the stat panel should use the full dock width');
      assert.ok(Math.abs(layout.nav.width - layout.dock.width) <= 1.5,
        label + ': the navigation should use the full dock width');
      assert.ok(layout.feed.bottom <= layout.dock.top + 1.5,
        label + ': the story feed must stop above the dock rather than sliding underneath it');
    };
    assertDockAligned(await measureDock(), '390px mobile viewport');

    await page.setViewportSize({ width: 710, height: 1100 });
    await page.waitForTimeout(40);
    assertDockAligned(await measureDock(), '710px portrait/tablet viewport');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(40);


    await page.locator('[data-panel="activities"]').click();
    await page.getByText('اختيارات سريعة').waitFor();
    await page.getByText('إدارة الشخصية').waitFor();
    assert.equal(await page.locator('#modalRoot .modal.drawer').count(), 1,
      'the Arabic activities screen should use the organized drawer layout');
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('#modalRoot [role="dialog"]'));

    await page.locator('[data-panel="relations"]').click();
    await page.getByText('الوالدان').waitFor();
    await page.getByText('توسيع شبكة العلاقات').waitFor();
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('#modalRoot [role="dialog"]'));

    // Sensory feedback is opt-in, stored separately from the life save, and exposed in settings.
    const initialSensorySettings = await page.evaluate(() => JSON.parse(localStorage.getItem('hayah_ui_settings_v1') || '{}'));
    assert.equal(initialSensorySettings.sound, false, 'sound should be off by default');
    assert.equal(initialSensorySettings.haptics, false, 'haptics should be off by default');
    await page.locator('#menuBtn').click();
    assert.equal(await page.locator('#modalRoot .modal.drawer').count(), 1,
      'the main menu should use the same organized scrollable drawer as other sections');
    const mainMenuSections = await page.locator('#modalRoot .list-section').allTextContents();
    assert.deepEqual(mainMenuSections, ['الحياة والشخصية', 'الإنجازات والمكافآت', 'المزايا والأنشطة', 'الإعدادات وبيانات الحفظ'],
      'main menu actions should be grouped into clear sections');

    // Weekly story festival: collect all badges and verify the completion bonus cannot be claimed twice.
    const seasonalSeed = await page.evaluate(() => {
      const key='hekayat_hayah_save_v1',saved=JSON.parse(localStorage.getItem(key)||'null');
      const original=JSON.stringify(saved);
      const now=new Date(),day=new Date(now.getFullYear(),now.getMonth(),now.getDate());
      const start=new Date(day);start.setDate(start.getDate()-((start.getDay()+6)%7));
      const end=new Date(start);end.setDate(end.getDate()+6);
      const thursday=new Date(start);thursday.setDate(thursday.getDate()+3);
      const isoYear=thursday.getFullYear(),jan4=new Date(isoYear,0,4);
      const firstMonday=new Date(jan4);firstMonday.setDate(firstMonday.getDate()-((firstMonday.getDay()+6)%7));
      const startUtc=Date.UTC(start.getFullYear(),start.getMonth(),start.getDate()),firstMondayUtc=Date.UTC(firstMonday.getFullYear(),firstMonday.getMonth(),firstMonday.getDate());
      const weekNumber=Math.floor((startUtc-firstMondayUtc)/604800000)+1;
      const dateKey=value=>value.getFullYear()+'-'+String(value.getMonth()+1).padStart(2,'0')+'-'+String(value.getDate()).padStart(2,'0');
      const week={id:isoYear+'-W'+String(weekNumber).padStart(2,'0'),startDate:dateKey(start),endDate:dateKey(end)};
      saved.seasonalEvent={weekId:week.id,startDate:week.startDate,endDate:week.endDate,
        baseline:{age:29,friends:0,hobbies:0,posts:0,smart:0,health:0,happiness:0,
          careerProgress:0,assets:1,investments:0,pets:0,trips:0,children:0,bestRelationship:70},
        claimed:[],bonusClaimed:false};
      saved.jobHistory=[{title:'خطوة مهنية جديدة'}];
      saved.assets.push({id:'festival-property',title:'أصل تجريبي',emoji:'🏠',kind:'property',value:75000,upkeep:0});
      saved.investments=[{id:'festival-investment',type:'fund',name:'استثمار تجريبي',value:5000,units:1}];
      saved.pets=[{id:'festival-pet',name:'رفيق المهرجان',type:'cat',emoji:'🐾',age:1,health:100}];
      saved.travelHistory=[{country:'الأردن',city:'عمّان',age:saved.age}];
      saved.children=[{id:'festival-child',name:'طفل المهرجان',age:1,gender:'male',relationshipLevel:75}];
      saved.family[0].relationshipLevel=80;
      saved.friends=[{id:'festival-friend',name:'صديق المهرجان',relation:'صديق',relationshipLevel:70}];
      saved.hobbies=[{id:'festival-hobby',title:'الرسم'}];
      saved.socialMediaPosts=1;saved.stats.happiness=82;saved.stats.health=91;
      localStorage.setItem(key,JSON.stringify(saved));return {week,original};
    });

    assert.ok(seasonalSeed.week.id);
    await page.reload({waitUntil:'domcontentloaded'});
    await page.locator('#menuBtn').click();
    await page.locator('.choice').filter({hasText:'مهرجان صُنّاع الحكاية'}).click();
    for(const badgeTitle of ['فصل جديد','صاحب جديد','موهبة بتكبر','صوتك وصل','توازن جميل','خطوة لقدّام','أصل جديد','عقلية استثمار','رفيق جديد','اكتشاف جديد','رابطة أقوى']){
      const badge=page.locator('#modalRoot .choice').filter({hasText:badgeTitle});
      await badge.waitFor();await badge.click();
    }
    const completedFestival=await page.evaluate(()=>{const saved=JSON.parse(localStorage.getItem('hekayat_hayah_save_v1')||'null');return {event:saved.seasonalEvent,bank:saved.bank};});
    assert.equal(completedFestival.event.claimed.length,11);
    assert.equal(completedFestival.event.bonusClaimed,true);
    const bankAfterCompletion=completedFestival.bank;
    await page.locator('#modalRoot .choice').filter({hasText:'فصل جديد'}).click();
    const bankAfterDuplicate=await page.evaluate(()=>JSON.parse(localStorage.getItem('hekayat_hayah_save_v1')||'null').bank);
    assert.equal(bankAfterDuplicate,bankAfterCompletion);
    await page.evaluate(original => localStorage.setItem('hekayat_hayah_save_v1', original), seasonalSeed.original);
    await page.reload({waitUntil:'domcontentloaded'});
    await page.keyboard.press('Escape');
    await page.waitForFunction(()=>!document.querySelector('#modalRoot [role="dialog"]'));
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
    assert.equal(await page.locator('[data-panel="assets"]').getAttribute('aria-pressed'), 'true',
      'the selected navigation section should remain selected after a gameplay render');
    assert.ok(await page.locator('[data-panel="assets"]').evaluate(button => button.classList.contains('active')),
      'the navigation highlight should survive changes to the character and business');
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
    await page.evaluate(() => { window.__hayahFirstLogCard = document.querySelector('#lifeFeed .logcard'); });

    await page.locator('#ageUpBtn').click();
    await page.waitForFunction(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      return saved && saved.age === 31 && Array.isArray(saved.timeMachineSnapshots) && saved.timeMachineSnapshots.length === 1;
    });
    const incrementalFeed = await page.evaluate(() => ({
      firstCardPreserved: window.__hayahFirstLogCard === document.querySelector('#lifeFeed .logcard'),
      cardCount: document.querySelectorAll('#lifeFeed .logcard').length,
      relevant: document.querySelector('#lifeFeed').getAttribute('aria-relevant'),
      atomic: document.querySelector('#lifeFeed').getAttribute('aria-atomic')
    }));
    assert.equal(incrementalFeed.firstCardPreserved, true, 'adding a new year should append events without rebuilding the existing log cards');
    assert.ok(incrementalFeed.cardCount > 45, 'new annual events should appear in the life feed');
    assert.equal(incrementalFeed.relevant, 'additions', 'screen readers should be notified about new log entries rather than all history');
    assert.equal(incrementalFeed.atomic, 'false', 'the life feed should announce new entries independently');

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
    const deathDialog = page.locator('#modalRoot #deathDialog');
    assert.equal(await deathDialog.getAttribute('role'), 'dialog', 'the end-of-life screen should be announced as a dialog');
    assert.equal(await deathDialog.getAttribute('aria-modal'), 'true', 'the end-of-life screen should be modal to assistive technology');
    assert.equal(await deathDialog.getAttribute('aria-labelledby'), 'deathDialogTitle');
    assert.equal(await deathDialog.getAttribute('aria-describedby'), 'deathDialogDescription');
    assert.equal(await page.evaluate(() => document.activeElement && document.activeElement.id), 'deathDialog',
      'focus should move into the end-of-life dialog when it opens');
    await page.keyboard.press('Shift+Tab');
    assert.equal(await page.evaluate(() => document.activeElement && document.activeElement.id), 'reviewBtn',
      'Shift+Tab from the dialog entry point should wrap to the final action');
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement && document.activeElement.id), 'newLifeBtn',
      'Tab from the dialog entry point should wrap to the first action');
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

    // A successful career move archives the promoted role and carries most performance into the new job.
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.evaluate(() => { Math.random = () => 0; });
    await page.locator('[data-panel="career"]').click();
    await page.locator('.choice').filter({ hasText: 'استكشاف فرص عمل' }).click();
    await page.locator('.choice').filter({ hasText: 'موظف مبيعات' }).click();
    const jobSwitch = await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      const history = Array.isArray(saved.jobHistory) ? saved.jobHistory : [];
      return {
        job: saved.job,
        previous: history[history.length - 1] || null,
        performance: saved.performance
      };
    });
    assert.equal(jobSwitch.job.id, 'sales', 'the accepted offer should become the active job');
    assert.equal(jobSwitch.job.level, 1, 'a new employer starts a fresh promotion ladder');
    assert.equal(jobSwitch.previous.id, 'admin', 'the previous job should remain in career history');
    assert.equal(jobSwitch.previous.level, 2, 'the archived job should keep its earned grade');
    assert.equal(jobSwitch.previous.salary, 114000, 'the archived job should keep its final salary');
    assert.equal(jobSwitch.previous.exitReason, 'انتقال مهني', 'the history should explain why the role ended');
    assert.equal(jobSwitch.previous.endAge, 32, 'the archive should record the transition age');
    assert.equal(jobSwitch.previous.promotions[0].toLevel, 2, 'promotion history should survive a job change');
    assert.ok(jobSwitch.performance >= 80 && jobSwitch.performance < 98,
      'a new role should carry most, but not all, of the previous performance rating');

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
      saved.specialCareer = null;
      saved.specialCareerHistory = [];
      saved.combatCareer = null;
      saved.esportsCareer = null;
      saved.filmStudio = null;
      saved.museum = null;
      saved.zoo = null;
      saved.cult = null;
      saved.casino = null;
      saved.dealer = null;
      saved.investmentAdvisor = null;
      saved.socialMediaAccount = false;
      saved.socialMediaPosts = 0;
      saved.followers = 0;
      saved.investments = [];
      saved.children = [];
      saved.coParentingPlans = [];
      saved.pets = [];
      saved.education = { level: 0, school: 'لم تبدأ الدراسة', major: null, yearsLeft: 0, tuition: 0, clubs: [] };
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
    await page.locator('.choice').filter({ hasText: 'خزينة النشاط ورأس المال' }).click();
    await page.locator('.choice').filter({ hasText: 'فصل الخزينة وتحويل 50%' }).click();
    await page.locator('.choice').filter({ hasText: 'سحب 25% من خزينة الشركة' }).click();
    await page.locator('.choice').filter({ hasText: 'إضافة 10% من رصيدك إلى الشركة' }).click();
    const treasuryMigration = await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      const company = saved && saved.companies && saved.companies[0];
      return { bank: saved && saved.bank, treasuryMode: company && company.treasuryMode,
        cashBalance: company && company.cashBalance, contributions: company && company.pendingOwnerContributions,
        withdrawals: company && company.pendingOwnerWithdrawals };
    });
    assert.equal(treasuryMigration.treasuryMode, 'separate', 'legacy companies should be able to opt into an independent treasury');
    assert.equal(treasuryMigration.bank, 281250, 'the owner balance should reconcile after the opening contribution, withdrawal and top-up');
    assert.equal(treasuryMigration.cashBalance, 218750, 'the company treasury should receive the matching capital transfers');
    assert.equal(treasuryMigration.contributions, 281250, 'owner contributions should be tracked for the next annual report');
    assert.equal(treasuryMigration.withdrawals, 62500, 'owner withdrawals should be tracked for the next annual report');
    await page.locator('.choice').filter({ hasText: 'رجوع لإدارة النشاط' }).click();
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
      return { primaryBusiness: saved && saved.business, company, ownerBank: saved && saved.bank };
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
    assert.equal(portfolioBeforeYear.company.treasuryMode, 'separate');
    assert.equal(portfolioBeforeYear.ownerBank, 281250, 'supplier, facility, staffing and product costs must not debit the owner after treasury separation');
    assert.ok(portfolioBeforeYear.company.cashBalance < 218750 && portfolioBeforeYear.company.cashBalance > 0,
      'company operations should reduce only the company cash balance');
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
    assert.ok(Array.isArray(marketBeforeReload.rivals));
    assert.equal(marketBeforeReload.rivals.length, marketBeforeReload.competitorCount);
    assert.equal(new Set(marketBeforeReload.rivals.map(rival => rival.id)).size, marketBeforeReload.rivals.length);
    assert.ok(marketBeforeReload.rivals.every(rival => rival.name && rival.product && rival.lastDecision && rival.decisionYear === 35));
    const rivalIdsBeforeReload = marketBeforeReload.rivals.map(rival => rival.id);
    const marketDialog = await page.locator('#modalRoot').innerText();
    assert.match(marketDialog, /الشركات المنافسة داخل المحاكاة/);
    assert.ok(marketBeforeReload.rivals.some(rival => marketDialog.includes(rival.name)));
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
    assert.deepEqual(portfolioAfterYear.company.market.rivals.map(rival => rival.id), rivalIdsBeforeReload,
      'rival company identities should persist from one fiscal year to the next');
    assert.ok(portfolioAfterYear.company.market.rivals.every(rival => rival.decisionYear === 36),
      'each rival should store its decision for the new fiscal year');
    const previousRivals = new Map(marketBeforeReload.rivals.map(rival => [rival.id, rival]));
    assert.ok(portfolioAfterYear.company.market.rivals.some(rival => {
      const before = previousRivals.get(rival.id);
      return before && (rival.priceIndex !== before.priceIndex || rival.qualityIndex !== before.qualityIndex ||
        rival.capacityIndex !== before.capacityIndex || rival.marketingIndex !== before.marketingIndex);
    }), 'at least one rival should change its commercial strategy next year');
    assert.ok(portfolioAfterYear.company.market.rivalQualityIndex >= 35 && portfolioAfterYear.company.market.rivalQualityIndex <= 100);
    assert.ok(portfolioAfterYear.company.market.rivalMarketingIndex >= 35 && portfolioAfterYear.company.market.rivalMarketingIndex <= 170);
    assert.ok(portfolioAfterYear.report.marketRivalPlans && portfolioAfterYear.report.marketRivalPlans.length > 0,
      'the annual report should include rival company decisions');
    const rivalShareTotal = portfolioAfterYear.company.market.rivals.reduce((sum, rival) => sum + rival.marketShare, 0);
    assert.ok(Math.abs(rivalShareTotal - (100 - portfolioAfterYear.company.market.marketShare)) <= 1.5,
      'player and rival market shares should reconcile to approximately 100 percent');
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

    // Industry profiles must give each portfolio sector a distinct, deterministic market and annual cost/revenue structure.
    const industryCases = [
      { id: 'industry-tech-browser', title: 'شركة تقنية تجريبية', sector: 'تقنية', demand: [62, 100], competition: [30, 75], competitors: [2, 7], revenue: 1.12, operating: 1.06, unit: 0.92 },
      { id: 'industry-logistics-browser', title: 'شركة لوجستية تجريبية', sector: 'لوجستيات', demand: [55, 91], competition: [24, 62], competitors: [2, 6], revenue: 1.04, operating: 1.17, unit: 1.12 },
      { id: 'industry-restaurants-browser', title: 'سلسلة مطاعم تجريبية', sector: 'مطاعم', demand: [68, 106], competition: [55, 90], competitors: [5, 10], revenue: 1.08, operating: 1.20, unit: 1.16 },
      { id: 'industry-retail-browser', title: 'شركة تجزئة تجريبية', sector: 'تجزئة', demand: [58, 96], competition: [60, 91], competitors: [6, 12], revenue: 1.03, operating: 1.13, unit: 1.10 },
      { id: 'industry-food-browser', title: 'شركة أغذية تجريبية', sector: 'أغذية', demand: [65, 100], competition: [48, 82], competitors: [4, 9], revenue: 1.07, operating: 1.16, unit: 1.14 },
      { id: 'industry-care-browser', title: 'شركة عناية تجريبية', sector: 'عناية', demand: [56, 93], competition: [35, 76], competitors: [3, 8], revenue: 1.09, operating: 1.08, unit: 1.03 }
    ];
    await page.evaluate(cases => {
      const key = 'hekayat_hayah_save_v1';
      const saved = JSON.parse(localStorage.getItem(key) || 'null');
      const companies = cases.map((item, index) => ({
        id: item.id, assetId: item.id, title: item.title, sector: item.sector,
        value: 180000 + index * 1000, level: 1, upkeep: 4000, bought: 30, emoji: '🏢',
        products: [{
          id: 'product-' + item.id, catalogId: 'digital-service', title: 'خدمة تجريبية',
          emoji: '💻', unitPrice: 850, unitCost: 280, demand: 75, competition: 50,
          quality: 80, active: true, history: []
        }]
      }));
      saved.companies = (Array.isArray(saved.companies) ? saved.companies : []).concat(companies);
      saved.assets = (Array.isArray(saved.assets) ? saved.assets : []).concat(companies.map(company => ({
        id: company.id, title: company.title, emoji: company.emoji, kind: 'business',
        value: company.value, upkeep: 0, bought: company.bought, companyPortfolio: true
      })));
      localStorage.setItem(key, JSON.stringify(saved));
    }, industryCases);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.evaluate(() => { Math.random = () => 0.99; });
    const industryMarkets = [];
    for (const item of industryCases) {
      await page.locator('[data-panel="assets"]').click();
      await page.locator('.choice').filter({ hasText: item.title }).click();
      await page.locator('.choice').filter({ hasText: 'إدارة التشغيل' }).click();
      await page.locator('.choice').filter({ hasText: 'تحليل السوق والمنافسين' }).click();
      const market = await page.evaluate(id => {
        const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
        const company = saved && saved.companies && saved.companies.find(item => item.id === id);
        return company && company.market;
      }, item.id);
      assert.equal(market.industry, item.sector);
      assert.ok(market.demandIndex >= item.demand[0] && market.demandIndex <= item.demand[1],
        item.sector + ' demand should use its own industry profile');
      assert.ok(market.competitionIndex >= item.competition[0] && market.competitionIndex <= item.competition[1],
        item.sector + ' competition should use its own industry profile');
      assert.ok(market.competitorCount >= item.competitors[0] && market.competitorCount <= item.competitors[1],
        item.sector + ' competitor count should use its own industry profile');
      industryMarkets.push(market);
      await page.locator('#closeModal').click();
    }
    assert.ok(new Set(industryMarkets.map(market => market.demandIndex + ':' + market.competitionIndex)).size >= 5,
      'industry market snapshots should not collapse into one generic profile');
    await page.locator('#ageUpBtn').click();
    await page.waitForFunction(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      return saved && saved.age === 37 && saved.companies &&
        saved.companies.filter(company => String(company.id).startsWith('industry-')).every(company =>
          Array.isArray(company.financialHistory) && company.financialHistory.some(report => report.year === 37));
    });
    const industryReports = await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      return saved.companies.filter(company => String(company.id).startsWith('industry-')).map(company => ({
        id: company.id, report: company.financialHistory[company.financialHistory.length - 1],
        product: company.products && company.products[0]
      }));
    });
    for (const item of industryCases) {
      const result = industryReports.find(company => company.id === item.id);
      assert.ok(result && result.report, item.sector + ' should save a full annual report');
      assert.equal(result.report.industryRevenueMultiplier, item.revenue);
      assert.equal(result.report.industryOperatingCostMultiplier, item.operating);
      assert.equal(result.report.industryUnitCostMultiplier, item.unit);
      assert.ok(result.report.productUnits > 0, item.sector + ' should simulate product sales with its unit-cost profile');
      assert.equal(result.report.profit, result.report.revenue - result.report.costs);
      assert.ok(result.product.history.some(entry => entry.year === 37));
    }

    // Business credit is attached to the selected company, accrues once per fiscal year, and settles before sale proceeds reach the owner.
    await page.evaluate(() => {
      const key = 'hekayat_hayah_save_v1';
      const saved = JSON.parse(localStorage.getItem(key) || 'null');
      const company = saved && saved.companies && saved.companies.find(item => item.id === 'portfolio-company-browser');
      if (!company) throw new Error('the portfolio company should still exist before the credit test');
      saved.bank = 1000000;
      company.credit = null;
      localStorage.setItem(key, JSON.stringify(saved));
      return { bank: saved.bank, cashBalance: company.cashBalance };
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.evaluate(() => { Math.random = () => 0.99; });
    await page.locator('[data-panel="assets"]').click();
    await page.locator('.choice').filter({ hasText: 'شركة محفظة اختبار' }).click();
    await page.locator('.choice').filter({ hasText: 'إدارة التشغيل' }).click();
    await page.locator('.choice').filter({ hasText: 'تمويل النشاط' }).click();
    const creditMenuBeforeBorrow = await page.locator('#modalRoot').innerText();
    assert.match(creditMenuBeforeBorrow, /حد التمويل التقديري/);
    const treasuryBeforeBorrow = await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      const company = saved && saved.companies.find(item => item.id === 'portfolio-company-browser');
      return { bank: saved && saved.bank, cashBalance: company && company.cashBalance };
    });
    await page.locator('.choice').filter({ hasText: 'طلب تمويل' }).last().click();
    const creditAfterBorrow = await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      const company = saved && saved.companies.find(item => item.id === 'portfolio-company-browser');
      return { bank: saved && saved.bank, cashBalance: company && company.cashBalance,
        credit: company && company.credit, value: company && company.value };
    });
    assert.ok(creditAfterBorrow.credit && creditAfterBorrow.credit.principal > 0);
    assert.equal(creditAfterBorrow.credit.principal, Math.round(creditAfterBorrow.value * .35));
    assert.ok(creditAfterBorrow.credit.annualRate >= .075 && creditAfterBorrow.credit.annualRate <= .14);
    assert.equal(creditAfterBorrow.credit.accruedInterest, 0);
    assert.equal(creditAfterBorrow.bank, treasuryBeforeBorrow.bank, 'borrowing must not increase the owner cash balance after separation');
    assert.equal(creditAfterBorrow.cashBalance, treasuryBeforeBorrow.cashBalance + creditAfterBorrow.credit.principal,
      'borrowed capital should be credited to the company treasury');

    const ageBeforeCreditInterest = await page.evaluate(() => JSON.parse(localStorage.getItem('hekayat_hayah_save_v1')).age);
    await page.locator('#closeModal').click();
    await page.locator('#ageUpBtn').click();
    await page.waitForFunction(previousAge => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      const company = saved && saved.companies && saved.companies.find(item => item.id === 'portfolio-company-browser');
      return saved && saved.age === previousAge + 1 && company && company.financialHistory &&
        company.financialHistory.some(report => report.year === previousAge + 1);
    }, ageBeforeCreditInterest);
    const creditAfterInterest = await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      const company = saved && saved.companies.find(item => item.id === 'portfolio-company-browser');
      const report = company.financialHistory[company.financialHistory.length - 1];
      return { credit: company.credit, report, age: saved.age, bank: saved.bank, cashBalance: company.cashBalance };
    });
    const expectedInterest = Math.round(creditAfterBorrow.credit.principal * creditAfterBorrow.credit.annualRate);
    assert.equal(creditAfterInterest.report.businessLoanInterest, expectedInterest);
    assert.equal(creditAfterInterest.report.businessLoanInterestPaid, expectedInterest);
    assert.equal(creditAfterInterest.report.businessLoanInterestAccrued, 0);
    assert.equal(creditAfterInterest.report.businessLoanBalance, creditAfterBorrow.credit.principal);
    assert.equal(creditAfterInterest.credit.lastInterestAge, creditAfterInterest.age);
    assert.equal(creditAfterInterest.report.profit,
      creditAfterInterest.report.revenue - creditAfterInterest.report.costs,
      'annual profit should include accrued business-loan interest exactly once');

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.evaluate(() => { Math.random = () => 0.99; });
    await page.locator('[data-panel="assets"]').click();
    await page.locator('.choice').filter({ hasText: 'شركة محفظة اختبار' }).click();
    await page.locator('.choice').filter({ hasText: 'إدارة التشغيل' }).click();
    await page.locator('.choice').filter({ hasText: 'تمويل النشاط' }).click();
    await page.locator('.choice').filter({ hasText: 'سداد 50%' }).click();
    const partialRepayment = await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      const company = saved && saved.companies.find(item => item.id === 'portfolio-company-browser');
      return { credit: company && company.credit, bank: saved && saved.bank, cashBalance: company && company.cashBalance };
    });
    assert.ok(partialRepayment.credit && partialRepayment.credit.principal < creditAfterBorrow.credit.principal,
      'partial repayment should reduce the company principal');
    assert.equal(partialRepayment.bank, creditAfterInterest.bank, 'partial repayment must not debit the owner balance');
    assert.ok(partialRepayment.cashBalance < creditAfterInterest.cashBalance, 'partial repayment should reduce company cash');
    await page.locator('.choice').filter({ hasText: 'سداد كامل الرصيد' }).click();
    const fullyRepaid = await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      const company = saved && saved.companies.find(item => item.id === 'portfolio-company-browser');
      return company && company.credit;
    });
    assert.equal(fullyRepaid, null, 'full repayment should clear the optional credit record');

    const saleBefore = await page.evaluate(() => {
      const key = 'hekayat_hayah_save_v1';
      const saved = JSON.parse(localStorage.getItem(key) || 'null');
      const company = saved.companies.find(item => item.id === 'portfolio-company-browser');
      company.credit = { principal: 10000, accruedInterest: 0, annualRate: .1, openedAtAge: saved.age, lastInterestAge: saved.age };
      localStorage.setItem(key, JSON.stringify(saved));
      return { bank: saved.bank, grossProceeds: Math.round(company.value * .75), cashBalance: company.cashBalance };
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('[data-panel="assets"]').click();
    await page.locator('.choice').filter({ hasText: 'شركة محفظة اختبار' }).click();
    await page.locator('.choice').filter({ hasText: 'بيع الشركة' }).click();
    const saleAfter = await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      return { bank: saved.bank, company: saved.companies.find(item => item.id === 'portfolio-company-browser'),
        asset: saved.assets.find(item => item.id === 'portfolio-company-browser') };
    });
    assert.equal(saleAfter.company, undefined, 'a sold portfolio company should be removed from the company list');
    assert.equal(saleAfter.asset, undefined, 'the matching business asset should also be removed');
    assert.equal(saleAfter.bank, saleBefore.bank + saleBefore.grossProceeds + saleBefore.cashBalance - 10000,
      'sale proceeds should settle the company loan before paying the owner');

    // When a company cannot cover its interest from available liquidity, the unpaid amount is capitalized once.
    const accrualSetup = await page.evaluate(() => {
      const key = 'hekayat_hayah_save_v1';
      const saved = JSON.parse(localStorage.getItem(key) || 'null');
      const id = 'credit-accrual-test';
      saved.bank = 1000000;
      saved.debt = 0;
      const staff = Array.from({ length: 5 }, (_, index) => ({
        id: id + '-staff-' + index, name: 'موظف اختبار ' + (index + 1), role: 'sales',
        salary: 1000000, skill: 55, morale: 50, years: 0
      }));
      saved.companies.unshift({
        id, assetId: id, title: 'شركة اختبار تعثر', sector: 'مطاعم', value: 1000, level: 1,
        staff, treasuryMode: 'separate', cashBalance: 0, credit: { principal: 20000, accruedInterest: 0, annualRate: .1,
          openedAtAge: saved.age, lastInterestAge: saved.age }
      });
      saved.assets.unshift({ id, title: 'شركة اختبار تعثر', emoji: '🏦', kind: 'business',
        value: 1000, upkeep: 0, bought: saved.age, companyPortfolio: true });
      localStorage.setItem(key, JSON.stringify(saved));
      return { age: saved.age, bank: saved.bank };
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.evaluate(() => { Math.random = () => 0.99; });
    await page.locator('#ageUpBtn').click();
    await page.waitForFunction(previousAge => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      const company = saved && saved.companies.find(item => item.id === 'credit-accrual-test');
      return saved && saved.age === previousAge + 1 && company && company.financialHistory &&
        company.financialHistory.some(report => report.year === previousAge + 1);
    }, accrualSetup.age);
    const unpaidInterest = await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      const company = saved.companies.find(item => item.id === 'credit-accrual-test');
      return { credit: company.credit, report: company.financialHistory[company.financialHistory.length - 1],
        bank: saved.bank, cashBalance: company.cashBalance };
    });
    assert.equal(unpaidInterest.report.businessLoanInterest, 2000);
    assert.equal(unpaidInterest.report.businessLoanInterestPaid, 0);
    assert.equal(unpaidInterest.report.businessLoanInterestAccrued, 2000);
    assert.equal(unpaidInterest.report.businessLoanBalance, 22000);
    assert.equal(unpaidInterest.credit.accruedInterest, 2000,
      'unpaid annual interest should be capitalized instead of disappearing or being charged twice');
    assert.equal(unpaidInterest.report.businessLoanInterestPaid, 0,
      'the owner balance must not cover interest when the separate company treasury is short');
    assert.equal(unpaidInterest.report.businessLoanInterestAccrued, 2000);
    assert.ok(unpaidInterest.cashBalance < 0, 'the company should carry its own cash shortfall');

    // A company cannot be sold for less than its outstanding business debt.
    const underwaterSetup = await page.evaluate(() => {
      const key = 'hekayat_hayah_save_v1';
      const saved = JSON.parse(localStorage.getItem(key) || 'null');
      const id = 'credit-underwater-test';
      saved.bank = 50000;
      saved.debt = 0;
      const company = { id, assetId: id, title: 'شركة مديونية مرتفعة', sector: 'تجزئة', value: 10000,
        level: 1, treasuryMode: 'separate', cashBalance: -1000, credit: { principal: 9000, accruedInterest: 0, annualRate: .1,
          openedAtAge: saved.age, lastInterestAge: saved.age } };
      saved.companies.push(company);
      saved.assets.push({ id, title: company.title, emoji: '🏦', kind: 'business',
        value: company.value, upkeep: 0, bought: saved.age, companyPortfolio: true });
      localStorage.setItem(key, JSON.stringify(saved));
      return { bank: saved.bank };
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('[data-panel="assets"]').click();
    await page.locator('.choice').filter({ hasText: 'شركة مديونية مرتفعة' }).click();
    await page.locator('.choice').filter({ hasText: 'بيع الشركة' }).click();
    const blockedSale = await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      return { bank: saved.bank,
        company: saved.companies.find(item => item.id === 'credit-underwater-test'),
        asset: saved.assets.find(item => item.id === 'credit-underwater-test') };
    });
    assert.equal(blockedSale.bank, underwaterSetup.bank, 'a blocked sale must not change the shared cash balance');
    assert.ok(blockedSale.company && blockedSale.asset,
      'the company and its asset must remain when sale proceeds cannot settle the debt');

    // Corporate tax is assessed only on positive pre-tax profit, paid from the selected business treasury, and carried when cash is insufficient.
    const taxSetup = await page.evaluate(() => {
      const key = 'hekayat_hayah_save_v1';
      const saved = JSON.parse(localStorage.getItem(key) || 'null');
      const profitableId = 'tax-profitable-test';
      const arrearsId = 'tax-arrears-test';
      const lossId = 'tax-loss-test';
      const companies = [
        { id: profitableId, assetId: profitableId, title: 'شركة اختبار ضريبي', sector: 'تقنية',
          value: 100000000, level: 1, treasuryMode: 'separate', cashBalance: 1000000,
          staff: [], products: [], facilities: [], taxLiability: 0, pendingTaxPayments: 0, financialHistory: [] },
        { id: arrearsId, assetId: arrearsId, title: 'شركة اختبار متأخرات', sector: 'تجزئة',
          value: 100000000, level: 1, treasuryMode: 'separate', cashBalance: -100000000,
          taxLiability: 15000, pendingTaxPayments: 0, staff: [], products: [], facilities: [], financialHistory: [] },
        { id: lossId, assetId: lossId, title: 'شركة اختبار خسارة', sector: 'تقنية',
          value: 1000000, level: 1, treasuryMode: 'separate', cashBalance: 2000000000,
          taxLiability: 0, pendingTaxPayments: 0, products: [], facilities: [], financialHistory: [],
          staff: [{ id: 'tax-loss-staff', name: 'محاسب اختبار', role: 'finance', salary: 1000000000,
            skill: 50, morale: 50, years: 0 }] }
      ];
      saved.companies.unshift(...companies);
      saved.assets.unshift(...companies.map(company => ({ id: company.id, title: company.title, emoji: '🏢',
        kind: 'business', value: company.value, upkeep: 0, bought: saved.age, companyPortfolio: true })));
      localStorage.setItem(key, JSON.stringify(saved));
      return { age: saved.age };
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.evaluate(() => { Math.random = () => 0.99; });
    await page.locator('#ageUpBtn').click();
    await page.waitForFunction(previousAge => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      return saved && saved.age === previousAge + 1 && saved.companies &&
        ['tax-profitable-test', 'tax-arrears-test', 'tax-loss-test'].every(id => {
          const company = saved.companies.find(item => item.id === id);
          return company && Array.isArray(company.financialHistory) &&
            company.financialHistory.some(report => report.year === previousAge + 1);
        });
    }, taxSetup.age);
    const taxReports = await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      return Object.fromEntries(['tax-profitable-test', 'tax-arrears-test', 'tax-loss-test'].map(id => {
        const company = saved.companies.find(item => item.id === id);
        return [id, { company, report: company.financialHistory[company.financialHistory.length - 1] }];
      }));
    });
    const profitableTax = taxReports['tax-profitable-test'];
    assert.equal(profitableTax.report.corporateTaxRate, .12);
    assert.ok(profitableTax.report.taxableProfit > 0, 'a profitable company should have a positive tax base');
    assert.equal(profitableTax.report.corporateTax,
      Math.round(profitableTax.report.taxableProfit * profitableTax.report.corporateTaxRate));
    assert.equal(profitableTax.report.corporateTaxPaid, profitableTax.report.corporateTax,
      'the solvent company should pay its current assessment from its own treasury');
    assert.equal(profitableTax.report.corporateTaxAccrued, 0);
    assert.equal(profitableTax.company.taxLiability, 0);
    assert.equal(profitableTax.report.profit, profitableTax.report.revenue - profitableTax.report.costs);
    assert.equal(profitableTax.report.closingCashBalance,
      profitableTax.report.openingCashBalance + profitableTax.report.revenue - profitableTax.report.costs,
      'cash flow should reconcile after tax, with no owner transfer or launch fee in this fixture');

    const arrearsTax = taxReports['tax-arrears-test'];
    assert.ok(arrearsTax.report.corporateTax > 0);
    assert.equal(arrearsTax.report.corporateTaxPaid, 0,
      'a company with deeply negative cash must not use the owner balance to pay tax');
    assert.equal(arrearsTax.report.corporateTaxAccrued, 15000 + arrearsTax.report.corporateTax);
    assert.equal(arrearsTax.company.taxLiability, arrearsTax.report.corporateTaxAccrued);
    assert.ok(arrearsTax.report.closingCashBalance < 0);

    const lossTax = taxReports['tax-loss-test'];
    assert.ok(lossTax.report.profit < 0, 'the high-payroll fixture should make an operating loss');
    assert.equal(lossTax.report.taxableProfit, 0);
    assert.equal(lossTax.report.corporateTax, 0, 'loss-making companies should not be assessed profit tax');

    const taxPaymentSetup = await page.evaluate(() => {
      const key = 'hekayat_hayah_save_v1';
      const saved = JSON.parse(localStorage.getItem(key) || 'null');
      const company = saved.companies.find(item => item.id === 'tax-profitable-test');
      company.cashBalance = 100000;
      company.taxLiability = 20000;
      company.pendingTaxPayments = 0;
      saved.bank = 777777;
      localStorage.setItem(key, JSON.stringify(saved));
      return { ownerBank: saved.bank };
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('[data-panel="assets"]').click();
    await page.locator('.choice').filter({ hasText: 'شركة اختبار ضريبي' }).click();
    await page.locator('.choice').filter({ hasText: 'إدارة التشغيل' }).click();
    await page.locator('.choice').filter({ hasText: 'خزينة النشاط ورأس المال' }).click();
    await page.locator('.choice').filter({ hasText: 'سداد 50% من المتأخرات الضريبية' }).click();
    const partialTaxPayment = await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      const company = saved.companies.find(item => item.id === 'tax-profitable-test');
      return { bank: saved.bank, cashBalance: company.cashBalance, taxLiability: company.taxLiability,
        pendingTaxPayments: company.pendingTaxPayments };
    });
    assert.equal(partialTaxPayment.bank, taxPaymentSetup.ownerBank,
      'manual tax settlement must not debit the owner balance for a separate treasury');
    assert.equal(partialTaxPayment.cashBalance, 90000);
    assert.equal(partialTaxPayment.taxLiability, 10000);
    assert.equal(partialTaxPayment.pendingTaxPayments, 10000);

    await page.locator('#closeModal').click();
    const taxAgeBeforeSettlement = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('hekayat_hayah_save_v1')).age);
    await page.locator('#ageUpBtn').click();
    await page.waitForFunction(previousAge => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      const company = saved && saved.companies.find(item => item.id === 'tax-profitable-test');
      return saved && saved.age === previousAge + 1 && company && company.financialHistory &&
        company.financialHistory.some(report => report.year === previousAge + 1);
    }, taxAgeBeforeSettlement);
    const settledTax = await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      const company = saved.companies.find(item => item.id === 'tax-profitable-test');
      return { report: company.financialHistory[company.financialHistory.length - 1],
        taxLiability: company.taxLiability, pendingTaxPayments: company.pendingTaxPayments };
    });
    assert.ok(settledTax.report.corporateTaxPaid >= 10000,
      'the next report should include the earlier manual tax payment');
    assert.equal(settledTax.taxLiability, 0);
    assert.equal(settledTax.pendingTaxPayments, 0);

    const combatSetup = await page.evaluate(() => {
      const key = 'hekayat_hayah_save_v1';
      const saved = JSON.parse(localStorage.getItem(key) || 'null');
      saved.age = Math.max(18, Number(saved.age) || 18);
      saved.status = 'حي';
      saved.education = saved.education && typeof saved.education === 'object' ? saved.education : {};
      saved.education.yearsLeft = 0;
      saved.retired = false;
      saved.job = null;
      saved.specialCareer = {
        id: 'fighter', title: 'مقاتل', level: 1,
        record: { attempts: 0, wins: 0, losses: 0, projects: 0, totalEarnings: 0, bestLevel: 1 }
      };
      saved.combatCareer = {
        rank: 0, leaguePoints: 0, streetCred: 0, streetWins: 0, leagueWins: 0,
        wins: 0, losses: 0, knockouts: 0, draws: 0,
        technique: 72, power: 70, speed: 74, defense: 68, stamina: 76, energy: 100,
        injury: 0, injuryYears: 0, restUsedYear: -1, coach: null,
        movesKnown: ['quick-jab', 'high-guard'], selectedMove: 'quick-jab',
        champion: false, bouts: []
      };
      localStorage.setItem(key, JSON.stringify(saved));
      return { age: saved.age };
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('[data-panel="career"]').click();
    await page.locator('.choice').filter({ hasText: 'المهن الخاصة والشهرة' }).click();
    await page.locator('.choice').filter({ hasText: 'إدارة مسيرة القتال' }).click();
    await page.locator('.choice').filter({ hasText: 'نزال شوارع' }).click();
    await page.locator('.choice').filter({ hasText: 'لكمة خاطفة' }).click();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('[data-panel="career"]').click();
    await page.locator('.choice').filter({ hasText: 'المهن الخاصة والشهرة' }).click();
    await page.locator('.choice').filter({ hasText: 'إدارة مسيرة القتال' }).click();
    await page.waitForFunction(() => document.querySelector('#modalRoot')?.textContent.includes('الجولة 2 من 3'));
    await page.locator('#closeModal').click();
    await page.locator('#ageUpBtn').click();
    await page.waitForFunction(() => document.querySelector('#modalRoot [role="dialog"]')?.textContent.includes('النزال لم ينتهِ'));
    const blockedCombatAge = await page.evaluate(() => JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null').age);
    assert.equal(blockedCombatAge, combatSetup.age, 'the player must finish a pending bout before aging up');
    await page.locator('#modalRoot .choice').filter({ hasText: 'تمام' }).click();
    await page.locator('[data-panel="career"]').click();
    await page.locator('.choice').filter({ hasText: 'المهن الخاصة والشهرة' }).click();
    await page.locator('.choice').filter({ hasText: 'إدارة مسيرة القتال' }).click();
    await page.waitForFunction(() => document.querySelector('#modalRoot')?.textContent.includes('الجولة 2 من 3'));
    await page.locator('.choice').filter({ hasText: 'حراسة متحركة' }).click();
    await page.waitForFunction(() => document.querySelector('#modalRoot')?.textContent.includes('الجولة 3 من 3'));
    await page.locator('.choice').filter({ hasText: 'لكمة خاطفة' }).click();
    const completedCombat = await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      const career = saved && saved.combatCareer;
      const bout = career && career.bouts && career.bouts[career.bouts.length - 1];
      return { pending: career && career.pendingBout, bout };
    });
    assert.equal(completedCombat.pending, null, 'completed bouts should clear the pending session');
    assert.ok(completedCombat.bout, 'the completed bout should be recorded');
    assert.equal(completedCombat.bout.rounds.length, 3, 'the fight record should preserve all three rounds');
    assert.equal(completedCombat.bout.moves.length, 3, 'the fight record should preserve the selected action in every round');

    await page.locator('.choice').filter({ hasText: 'إدارة مسيرة القتال' }).click();
    await page.locator('.choice').filter({ hasText: 'مجتمع المقاتلين' }).click();
    await page.locator('.choice').filter({ hasText: 'آدم منصور' }).click();
    const communityBeforeChat = await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      const fighter = saved.combatCareer.community.find(item => item.id === 'adam-mansour');
      return { age: saved.age, respect: fighter.respect, tension: fighter.tension };
    });
    await page.locator('.choice').filter({ hasText: 'حديث ودي' }).click();
    const communityAfterChat = await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      const fighter = saved.combatCareer.community.find(item => item.id === 'adam-mansour');
      return { age: saved.age, respect: fighter.respect, tension: fighter.tension, lastInteractionAge: fighter.lastInteractionAge };
    });
    assert.equal(communityAfterChat.respect, Math.min(100, communityBeforeChat.respect + 12));
    assert.equal(communityAfterChat.tension, Math.max(0, communityBeforeChat.tension - 5));
    assert.equal(communityAfterChat.lastInteractionAge, communityAfterChat.age,
      'a social interaction should be recorded against the current life year');

    // Normalize test health and energy after the prior random fight so this E2E
    // reliably exercises the named-rival challenge rather than injury gating.
    await page.evaluate(() => {
      const key = 'hekayat_hayah_save_v1';
      const saved = JSON.parse(localStorage.getItem(key) || 'null');
      saved.combatCareer.injury = 0;
      saved.combatCareer.injuryYears = 0;
      saved.combatCareer.energy = 100;
      localStorage.setItem(key, JSON.stringify(saved));
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('[data-panel="career"]').click();
    await page.locator('.choice').filter({ hasText: 'المهن الخاصة والشهرة' }).click();
    await page.locator('.choice').filter({ hasText: 'إدارة مسيرة القتال' }).click();
    await page.locator('.choice').filter({ hasText: 'مجتمع المقاتلين' }).click();
    await page.locator('.choice').filter({ hasText: 'آدم منصور' }).click();
    await page.locator('.choice').filter({ hasText: 'تحدي على الحلبة' }).click();
    await page.locator('.choice').filter({ hasText: 'لكمة خاطفة' }).click();
    await page.waitForFunction(() => document.querySelector('#modalRoot')?.textContent.includes('الجولة 2 من 3'));
    await page.locator('.choice').filter({ hasText: 'لكمة خاطفة' }).click();
    await page.waitForFunction(() => document.querySelector('#modalRoot')?.textContent.includes('الجولة 3 من 3'));
    await page.locator('.choice').filter({ hasText: 'لكمة خاطفة' }).click();
    const communityBout = await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null');
      const career = saved.combatCareer;
      const fighter = career.community.find(item => item.id === 'adam-mansour');
      return { pending: career.pendingBout, bout: career.bouts[career.bouts.length - 1],
        respect: fighter.respect, tension: fighter.tension };
    });
    assert.equal(communityBout.pending, null, 'a community challenge should complete and clear its pending bout');
    assert.equal(communityBout.bout.communityFighterId, 'adam-mansour',
      'the fight history should retain the exact community rival');
    assert.ok(communityBout.respect > communityAfterChat.respect,
      'a completed rivalry match should update community respect even after a loss');

    const originalBoostSave = await page.evaluate(() => localStorage.getItem('hekayat_hayah_save_v1'));
    await page.evaluate(() => {
      const key = 'hekayat_hayah_save_v1';
      const saved = JSON.parse(localStorage.getItem(key) || 'null');
      saved.stats.happiness = 20;
      saved.boostUsedAge = null;
      localStorage.setItem(key, JSON.stringify(saved));
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    const happinessBoost = page.locator('[data-stat-boost="happiness"]');
    await happinessBoost.waitFor();
    await happinessBoost.click();
    await page.locator('#modalRoot .choice').filter({ hasText: 'وقت مع شخص قريب' }).click();
    const boostedLife = await page.evaluate(() => JSON.parse(localStorage.getItem('hekayat_hayah_save_v1') || 'null'));
    assert.equal(boostedLife.stats.happiness, 27, 'the free recovery choice should improve the selected stat by seven points');
    assert.equal(boostedLife.boostUsedAge, boostedLife.age, 'only one recovery opportunity should be available in the current life year');
    assert.equal(await page.locator('[data-stat-boost="happiness"]').count(), 0, 'the used recovery button should disappear until the next year');
    assert.equal(await page.locator('#statsPanel [role="progressbar"][aria-label="السعادة"]').getAttribute('aria-valuenow'), '27',
      'the accessible stat value should update immediately after a recovery choice');
    await page.evaluate(original => localStorage.setItem('hekayat_hayah_save_v1', original), originalBoostSave);
    await page.reload({ waitUntil: 'domcontentloaded' });

    assert.deepEqual(pageErrors, [], 'the browser run should complete without uncaught JavaScript errors');

    console.log('PASS: mobile layout, legacy v1 load, persistence, rewind, JSON import, inheritance, insolvent estate, career promotion migration, annual supplier market, persistent competitor market, facilities and production capacity, researched and instinct product launches, product pricing, annual product sales, business reports, independent portfolio-company operations, and business credit accrual, repayment, persistence, sale settlement, unpaid-interest capitalization, underwater-sale protection, industry tax assessment, tax arrears, loss exemption, treasury-only tax payment, and annual tax reconciliation, fighter community relationships, friendly interactions, and named rival bouts.');
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
