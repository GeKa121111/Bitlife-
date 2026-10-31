'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('index.html');
const app = read('app.js');
const css = read('style.css');
const readme = read('README.md');

function functionSource(name, nextName) {
  const start = app.indexOf('function ' + name + '(');
  assert.notEqual(start, -1, 'expected function ' + name);
  const end = nextName ? app.indexOf('function ' + nextName + '(', start + 1) : app.length;
  assert.notEqual(end, -1, 'expected following function ' + nextName);
  return app.slice(start, end);
}

test('واجهة حياة عربية RTL وتحافظ على اسمها المستقل', () => {
  assert.match(html, /<html lang="ar" dir="rtl">/);
  assert.match(html, /class="brandlogo" aria-label="حياة"/);
  assert.match(html, /class="brand-symbol"/);
  assert.match(html, /id="identityFlag"/);
  assert.match(html, /id="characterInfoBtn"/);
  assert.match(html, /id="stageNavLabel"/);
  assert.doesNotMatch(html, /BITLIFE|BitLife|Candywriter/);
});

test('ملفات الواجهة الأساسية موجودة ومربوطة محليًا', () => {
  assert.match(html, /href="style\.css"/);
  assert.match(html, /src="app\.js"/);
  assert.ok(fs.existsSync(path.join(root, 'style.css')));
  assert.ok(fs.existsSync(path.join(root, 'app.js')));
  assert.match(html, /<meta name="viewport"[^>]*viewport-fit=cover/);
});

test('مفتاح الحفظ القديم وإصدار الحفظ لم يتغيرا', () => {
  assert.match(app, /const KEY = 'hekayat_hayah_save_v1';/);
  assert.match(app, /const CEMETERY_KEY = 'hekayat_hayah_cemetery_v1';/);
  assert.match(app, /return \{version:1,lifeId:/);
  assert.match(app, /function isValidSaveData\(data\)[\s\S]*?data\.version!==1/);
  assert.match(app, /function load\(\)[\s\S]*?isValidSaveData\(x\)[\s\S]*?BACKUP_KEY/);
});

test('التحقق يرفض حفظ v1 الذي يفتقد هوية الشخصية أو عمرًا صالحًا', () => {
  assert.match(app, /typeof data\.name==='string'&&data\.name\.trim\(\)\.length>0/);
  assert.match(app, /Number\.isFinite\(Number\(age\)\)&&Number\(age\)>=0&&Number\(age\)<=150/);
  assert.match(app, /if\(!isValidSaveData\(data\)\|\|!Array\.isArray\(data\.family\)/);
});

test('الحفظ يحتفظ بنقطة استعادة محلية من آخر نسخة سليمة دون تغيير صيغة v1', () => {
  assert.match(app, /const BACKUP_KEY = 'hekayat_hayah_save_backup_v1';/);
  assert.match(app, /function isValidSaveData\(data\)/);
  assert.match(app, /localStorage\.setItem\(BACKUP_KEY,previousRaw\)/);
  assert.match(app, /previous\.lifeId!==state\.lifeId\|\|Number\(previous\.age\)!==Number\(state\.age\)/);
  assert.match(app, /saveRecovered=true/);
  assert.match(app, /localStorage\.setItem\(KEY,backupRaw\)/);
  assert.match(app, /const KEY = 'hekayat_hayah_save_v1';/);
  assert.match(app, /return \{version:1,lifeId:/);
});


test('أرشفة الحياة لا تعلن النجاح عند فشل التخزين وتعيد المحاولة حتى مع علم حفظ قديم خاطئ', () => {
  const cemeterySource = functionSource('normalizeCemetery', 'archiveLife')
    + functionSource('archiveLife', 'cemeteryMenu');
  const store = new Map();
  let failNextWrite = true;
  const context = {
    state: {
      lifeId: 'archive-retry-life', name: 'شخصية اختبار الأرشفة', age: 47,
      cause: null, status: 'حي', bank: 1200, assets: [{ value: 800 }],
      investments: [{ value: 200 }], debt: 100, place: { country: 'مصر' },
      accomplishments: ['أسس مشروعًا'], children: [{ name: 'وارث' }], cemeterySaved: false
    },
    CEMETERY_KEY: 'hekayat_hayah_cemetery_v1',
    localStorage: {
      getItem(key) { return store.has(key) ? store.get(key) : null; },
      setItem(key, value) {
        if (key === 'hekayat_hayah_cemetery_v1' && failNextWrite) {
          failNextWrite = false;
          throw new Error('quota-exceeded');
        }
        store.set(key, String(value));
      }
    },
    lifeRibbon: () => 'حياة متوازنة'
  };
  vm.runInNewContext(
    cemeterySource
      + '\nglobalThis.firstResult=archiveLife("بدأ حياة جديدة");'
      + 'globalThis.flagAfterFailure=state.cemeterySaved;'
      + 'globalThis.retryResult=archiveLife("بدأ حياة جديدة");'
      + 'globalThis.flagAfterRetry=state.cemeterySaved;',
    context
  );
  assert.equal(context.firstResult, false);
  assert.equal(context.flagAfterFailure, false);
  assert.equal(context.retryResult, true);
  assert.equal(context.flagAfterRetry, true);
  let saved = JSON.parse(store.get('hekayat_hayah_cemetery_v1'));
  assert.equal(saved.length, 1);
  assert.equal(saved[0].id, 'archive-retry-life');
  assert.equal(saved[0].netWorth, 2100);

  context.state = {
    lifeId: 'legacy-missed-archive', name: 'حياة لم تُسجل قديمًا', age: 61,
    status: 'متوفى', cause: 'نهاية الرحلة', bank: 500, assets: [],
    investments: [], debt: 0, place: { country: 'مصر' }, accomplishments: [],
    children: [], cemeterySaved: true
  };
  vm.runInNewContext('globalThis.legacyRetry=archiveLife();', context);
  assert.equal(context.legacyRetry, true);
  saved = JSON.parse(store.get('hekayat_hayah_cemetery_v1'));
  assert.ok(saved.some(item => item.id === 'legacy-missed-archive'));

  store.set('hekayat_hayah_cemetery_v1', '{broken-json');
  context.state = {
    lifeId: 'do-not-overwrite-corrupt-cemetery', name: 'حياة ثالثة', age: 32,
    status: 'حي', bank: 100, assets: [], investments: [], debt: 0,
    place: { country: 'مصر' }, accomplishments: [], children: [], cemeterySaved: false
  };
  vm.runInNewContext('globalThis.corruptResult=archiveLife();', context);
  assert.equal(context.corruptResult, false);
  assert.equal(store.get('hekayat_hayah_cemetery_v1'), '{broken-json');
});

test('تحميل الحفظ القديم واستيراده يطبّعان البيانات الناقصة بدل كسر اللعبة', () => {
  assert.match(app, /function normalizeCoreState\(data\)/);
  assert.match(app, /const statDefaults=\{happiness:65,health:80,smart:40,looks:45\}/);
  assert.match(app, /data\.place=\{\.\.\.fallbackPlace,\.\.\.rawPlace\}/);
  assert.match(app, /function load\(\)[\s\S]*?normalizeCoreState\(x\)/);
  assert.match(app, /function importSave\(\)[\s\S]*?normalizeCoreState\(data\)/);
  assert.match(app, /data\.version!==1/);
});

test('النسخة الاحتياطية الكاملة تجمع الحياة والمقبرة والإعدادات والمزايا مع دعم ملفات v1 القديمة', () => {
  assert.match(app, /const BACKUP_FORMAT = 'hayah-backup';/);
  assert.match(app, /const BACKUP_VERSION = 1;/);
  assert.match(app, /const data=isBundle\?parsed\.life:parsed/);
  assert.match(app, /const previousLifeRaw=previousStorage\[KEY\]/);
  assert.match(app, /if\(isValidSaveData\(previousLife\)\)localStorage\.setItem\(BACKUP_KEY,previousLifeRaw\)/);
  assert.match(app, /previousLifeRaw=previousStorage\[KEY\][\s\S]*?state=data/);
  assert.match(app, /if\(!save\(\)\)throw new Error\('storage-write-failed'\)/);
  assert.match(app, /storageKeys\.forEach\(key=>\{try\{const value=previousStorage\[key\]/);
  assert.match(app, /function createBackupBundle\(\)/);
  assert.match(app, /life:JSON\.parse\(JSON\.stringify\(state\)\)/);
  assert.match(app, /cemetery,/);
  assert.match(app, /settings:normalizeUiSettings\(uiSettings\)/);
  assert.match(app, /perks:normalizePermanentPerks\(permanentPerks\)/);
  assert.match(app, /const KEY = 'hekayat_hayah_save_v1';/);
  assert.match(app, /return \{version:1,lifeId:/);

  const settingsSource = functionSource('normalizeUiSettings', 'loadUiSettings');
  const settingsContext = { raw: { theme: 'gold', textScale: 'large', sound: true, haptics: false, boosts: false, extra: true } };
  vm.runInNewContext(settingsSource + '\nglobalThis.normalized=normalizeUiSettings(raw);', settingsContext);
  assert.deepEqual(JSON.parse(JSON.stringify(settingsContext.normalized)),
    { theme: 'gold', textScale: 'large', sound: true, haptics: false, boosts: false },
    'settings import should retain supported choices and discard unknown fields');

  const perksSource = functionSource('defaultPermanentPerks', 'loadPermanentPerks');
  const perksContext = {
    PERK_IDS: ['fighterPack', 'goldTheme'],
    PERK_TOGGLE_IDS: ['goldTheme'],
    clamp: (value, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(Number(value) || 0))),
    raw: { owned: { fighterPack: true, unknownPack: true }, enabled: { goldTheme: true, fighterPack: true }, streakSavers: 140 }
  };
  vm.runInNewContext(perksSource + '\nglobalThis.normalized=normalizePermanentPerks(raw);', perksContext);
  assert.deepEqual(JSON.parse(JSON.stringify(perksContext.normalized)),
    { owned: { fighterPack: true, goldTheme: false }, enabled: { goldTheme: true }, streakSavers: 99 },
    'perk import should retain known ownership, clamp counters, and discard unknown ids');

  const cemeterySource = functionSource('normalizeCemetery', 'archiveLife');
  const cemeteryContext = { raw: [
    { id: 'life-a', name: 'حياة أولى', age: 45, netWorth: 1200, accomplishments: ['إنجاز'], children: 2 },
    { id: 'life-a', name: 'حياة ثانية', age: 52, netWorth: -300, accomplishments: 'invalid', children: -4 },
    null,
    { id: 'empty', name: '   ' }
  ] };
  vm.runInNewContext(cemeterySource + '\nglobalThis.normalized=normalizeCemetery(raw);', cemeteryContext);
  assert.equal(cemeteryContext.normalized.length, 2);
  assert.equal(cemeteryContext.normalized[1].id, 'life-a-1');
  assert.equal(cemeteryContext.normalized[1].netWorth, -300);
  assert.deepEqual(Array.from(cemeteryContext.normalized[1].accomplishments), []);

  const bundleSource = [
    cemeterySource,
    settingsSource,
    perksSource,
    functionSource('createBackupBundle', 'exportSave')
  ].join('\n');
  const bundleContext = {
    BACKUP_FORMAT: 'hayah-backup',
    BACKUP_VERSION: 1,
    CEMETERY_KEY: 'hekayat_hayah_cemetery_v1',
    PERK_IDS: ['fighterPack', 'goldTheme'],
    PERK_TOGGLE_IDS: ['goldTheme'],
    clamp: (value, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(Number(value) || 0))),
    state: { version: 1, name: 'اختبار', age: 30, log: [] },
    uiSettings: { theme: 'dark', textScale: 'large', sound: false, haptics: true, boosts: true },
    permanentPerks: { owned: { fighterPack: true }, enabled: {}, streakSavers: 2 },
    localStorage: { getItem: () => JSON.stringify([{ id: 'life-a', name: 'حياة سابقة', age: 50 }]) }
  };
  vm.runInNewContext(bundleSource + '\nglobalThis.bundle=createBackupBundle();', bundleContext);
  assert.equal(bundleContext.bundle.format, 'hayah-backup');
  assert.equal(bundleContext.bundle.backupVersion, 1);
  assert.equal(bundleContext.bundle.life.name, 'اختبار');
  assert.equal(bundleContext.bundle.cemetery.length, 1);
  assert.equal(bundleContext.bundle.settings.textScale, 'large');
  assert.equal(bundleContext.bundle.perks.owned.fighterPack, true);
});

test('كتالوج الوظائف يعرض المسارات المقفولة ويوضح شروط القبول', () => {
  assert.match(app, /function jobRequirements\(job\)/);
  assert.match(app, /function jobAcceptanceChance\(\)/);
  assert.match(app, /function jobRequirementsMenu\(job,requirements\)/);
  assert.match(app, /function showCareer\(\)[\s\S]*?const opts=jobs\.map\(j=>[\s\S]*?jobRequirementsMenu\(j,missing\)/);
  assert.match(app, /فرصة القبول التقديرية/);
  assert.match(app, /data\.performance=clamp\(Number\.isFinite\(Number\(data\.performance\)\)\?Number\(data\.performance\):50\)/);
  assert.match(css, /\.locked-choice/);
});

test('المسار المهني يدعم درجات متعددة ويهيئ الحفظ القديم دون تغيير الإصدار', () => {
  assert.match(app, /function jobRankLabel\(level\)/);
  assert.match(app, /function ensureJobProgress\(job,currentAge\)/);
  assert.match(app, /function jobPromotionRequirements\(job\)/);
  assert.match(app, /function jobPromotionChance\(job,manual\)/);
  assert.match(app, /function grantJobPromotion\(source\)/);
  assert.match(app, /function requestJobPromotion\(\)/);
  assert.match(app, /ensureJobProgress\(data\.job,data\.age\)/);
  assert.match(app, /job\.promotions\.push/);
  assert.match(app, /roleStartAge/);
  assert.match(app, /choice\('🏅','طلب ترقية'/);
  assert.match(app, /state\.job=\{id:job\.id,title:job\.title,baseTitle:job\.title[\s\S]*?promotions:\[\]\}/);
  assert.match(app, /promotionChance>0&&chance\(promotionChance\)\)grantJobPromotion\('annual'\)/);
  assert.match(app, /return \{version:1,lifeId:/);
});


test('الانتقال الوظيفي يحفظ المسار السابق ولا يمس الوظيفة الحالية عند رفض العرض', () => {
  assert.ok(app.includes("function archiveCurrentJob(reason='استقالة')"));
  assert.ok(app.includes("function jobMarketMenu()"));
  assert.ok(app.includes("choice('🔎','استكشاف فرص عمل'"));
  assert.ok(app.includes("archiveCurrentJob('انتقال مهني')"));
  assert.ok(app.includes("archiveCurrentJob('استقالة')"));
  assert.ok(app.includes("archiveCurrentJob('تفرغ للاستثمار')"));
  assert.ok(app.includes("archiveCurrentJob('تقاعد')"));
  assert.ok(app.includes("exitReason:reason"));
  assert.ok(app.includes("وظيفتك الحالية لم تتأثر"));
  assert.ok(app.includes("const KEY = 'hekayat_hayah_save_v1'"));
  assert.ok(app.includes("return {version:1,lifeId:"));
});

test('المقتنيات الموروثة تُطبّع بأمان وتدعم عرض القيمة والبيع دون تغيير حفظ v1', () => {
  assert.ok(app.includes('function normalizeHeirlooms(raw,currentAge=0)'));
  assert.ok(app.includes('data.heirlooms=normalizeHeirlooms(data.heirlooms,data.age)'));
  assert.ok(app.includes('function heirloomCollectionMenu()'));
  assert.ok(app.includes('function heirloomDetailMenu(id)'));
  assert.ok(app.includes('function sellHeirloom(id)'));
  assert.ok(app.includes('85% من القيمة التقديرية'));
  const normalizer = functionSource('normalizeHeirlooms', 'heirloomRarity');
  const context = {
    raw: [
      { name: 'ساعة قديمة', value: '2500', age: '20' },
      { id: 'kept-book', name: 'كتاب عائلي', value: -9, age: 999, emoji: '📚' },
      { id: 'kept-book', name: 'صندوق الصور', value: '1200' },
      null,
      { id: 'duplicate', name: '', value: 100, age: 2 }
    ],
    age: 40
  };
  vm.runInNewContext(normalizer + '\nglobalThis.first=normalizeHeirlooms(raw,age); globalThis.second=normalizeHeirlooms(first,age);', context);
  assert.equal(context.first.length, 3);
  assert.equal(context.first[0].id, 'legacy-heirloom-0');
  assert.equal(context.first[0].value, 2500);
  assert.equal(context.first[0].age, 20);
  assert.equal(context.first[1].id, 'kept-book');
  assert.equal(context.first[1].value, 0);
  assert.equal(context.first[1].age, 120);
  assert.equal(context.first[2].id, 'kept-book-2');
  assert.equal(context.first[2].age, 40, 'legacy items without an age should inherit the current character age');
  assert.equal(context.second[0].id, context.first[0].id, 'legacy identifiers should remain stable after the first migration');
  assert.equal(context.second[2].id, 'kept-book-2');
  assert.ok(app.includes("const KEY = 'hekayat_hayah_save_v1';"));
  assert.ok(app.includes('return {version:1,lifeId:'));
});

test('الرسائل المالية تستخدم عملة بلد الشخصية بدل افتراض الجنيه المصري', () => {
  const relationship = functionSource('relationshipAction', 'addFriend');
  const activity = functionSource('activity', 'importSave');
  assert.doesNotMatch(relationship, /جنيه/);
  assert.doesNotMatch(activity, /جنيه/);
  assert.match(relationship, /cash\(500\)/);
  assert.match(activity, /cash\(1200\)/);
  assert.match(activity, /cash\(300\)/);
  assert.match(activity, /cash\(1800\)/);
});

test('هوية حياة البصرية مستقلة عن لوحة ألوان الألعاب المرجعية', () => {
  assert.match(css, /--hayah-primary:#176b66/);
  assert.match(css, /--hayah-navy:#1d3b53/);
  assert.match(css, /--hayah-accent:#e5b34b/);
  assert.doesNotMatch(css, /BitLife-like|--reference-/);
});

test('تخطيط الهاتف وإمكانية الوصول ما زالا موجودين', () => {
  assert.match(css, /@media\(max-width:380px\)/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css, /button:focus-visible/);
  assert.match(css, /\.brand-symbol\{/);
});

test('القائمة الرئيسية مقسمة بوضوح وحالة التبويب لا تختفي عند تحديث الشخصية', () => {
  const menu = functionSource('mainMenu', 'auraRingMenu');
  assert.match(menu, /section\('الحياة والشخصية'\)/);
  assert.match(menu, /section\('الإنجازات والمكافآت'\)/);
  assert.match(menu, /section\('المزايا والأنشطة'\)/);
  assert.match(menu, /section\('الإعدادات وبيانات الحفظ'\)/);

  const modalSource = functionSource('modal', 'info');
  assert.match(modalSource, /'القائمة الرئيسية'/, 'the long main menu should open in a scrollable drawer');

  const renderSource = functionSource('render', 'closeModal');
  assert.doesNotMatch(renderSource, /classList\.remove\('active'\)/);
  assert.match(app, /b\.setAttribute\('aria-pressed',String\(selected\)\)/);
});


test('قوائم الأنشطة والعلاقات منظمة ومترجمة بالكامل إلى العربية', () => {
  const activities = functionSource('activities', 'healthMenu');
  const relations = functionSource('relations', 'custodyModeLabel');
  assert.match(activities, /section\('اختيارات سريعة'\)/);
  assert.match(activities, /section\('أنشطة الحياة اليومية'\)/);
  assert.match(activities, /section\('إدارة الشخصية'\)/);
  assert.match(activities, /modal\('☰','الأنشطة والحياة اليومية'/);
  assert.doesNotMatch(activities, /Favorites|Premium Activities|Health & Wellness|Export Save|New Life/);
  assert.match(relations, /section\('الوالدان'\)/);
  assert.match(relations, /section\('الأصدقاء'\)/);
  assert.match(relations, /section\('الأبناء'\)/);
  assert.match(relations, /section\('توسيع شبكة العلاقات'\)/);
  assert.doesNotMatch(relations, /section\('(Special|Parents|Family|Friends|Partner|Children|Relationships)'\)/);
});

test('سجل الحياة يحافظ على موضع القراءة ولا يقفز عند مراجعة الأحداث القديمة', () => {
  const feed = functionSource('renderFeed', 'syncBusinessAsset');
  assert.match(feed, /const shouldFollowLatest=feed\.scrollHeight-feed\.scrollTop-feed\.clientHeight<=80/);
  assert.match(feed, /if\(!shouldFollowLatest\)return/);
});

test('تطبيق الويب قابل للتثبيت ويحتفظ بملفات الواجهة للعمل دون اتصال', () => {
  const manifest = JSON.parse(read('manifest.webmanifest'));
  const worker = read('sw.js');
  const icon = read('icon.svg');
  assert.equal(manifest.lang, 'ar');
  assert.equal(manifest.dir, 'rtl');
  assert.equal(manifest.display, 'standalone');
  assert.ok(manifest.icons.some(item => item.src === './icon.svg'));
  assert.match(html, /rel="manifest" href="manifest\.webmanifest"/);
  assert.match(app, /navigator\.serviceWorker\.register\('\.\/sw\.js'\)/);
  assert.match(worker, /const CACHE_NAME = 'hayah-shell-v59'/);
  assert.match(worker, /cache\.addAll\(APP_SHELL\)/);
  assert.match(worker, /caches\.match\(APP_SHELL\[0\]\)/);
  assert.match(icon, /حياة/);
});

test('توثيق الجودة لا يدّعي اختبار متصفح غير موجود', () => {
  assert.match(readme, /صياغة.*app\.js/);
  assert.match(readme, /اختبار يدوي كامل داخل متصفح الهاتف/);
});


test('شجرة العائلة تفتح من العلاقات والوصية', () => {
  const relationMenu=functionSource('relations','familyMenu');
  const will=functionSource('willMenu','setWill');
  assert.match(relationMenu,/familyTreeMenu/);
  assert.match(will,/familyTreeMenu/);
  assert.match(app,/function familyTreeMenu\(\)/);
  assert.match(app,/family-tree-generation/);
  assert.match(app,/function familyTreeNode\(p\)/);
});
test('تطور الأبناء يربط العمر بالتعليم والاستقلال ويحافظ على الحفظ القديم', () => {
  assert.match(app,/function ensureChildGrowthProfile\(c\)/);
  assert.match(app,/function advanceChildren\(\)/);
  assert.match(app,/advanceChildren\(\);/);
  assert.match(app,/c\.schoolPerformance/);
  assert.match(app,/c\.careerPotential/);
  assert.match(app,/c\.independence/);
  assert.match(app,/c\.educationStatus='خريج جامعي'/);
  const childActions=functionSource('childAction','personModal');
  assert.match(childActions,/action==='study'/);
  assert.match(childActions,/action==='career'/);
  assert.match(childActions,/action==='launch'/);
  assert.match(app,/heir\.stats=\{\.\.\.heir\.stats,health:clamp\(child\.health/);
});


test('إعدادات العرض منفصلة عن حفظ الحياة ويمكن الوصول إليها من القائمة', () => {
  assert.match(app, /const SETTINGS_KEY = 'hayah_ui_settings_v1';/);
  assert.match(app, /function loadUiSettings\(\)/);
  assert.match(app, /function applyUiSettings\(\)/);
  assert.match(app, /localStorage\.setItem\(SETTINGS_KEY,JSON\.stringify\(uiSettings\)\)/);
  assert.match(app, /choice\('⚙️','إعدادات العرض'/);
  assert.match(app, /function init\(\)[\s\S]*?loadUiSettings\(\);\s*state=load\(\)/);
  assert.match(app, /const KEY = 'hekayat_hayah_save_v1';/);
  assert.match(css, /body\.theme-dark\{/);
  assert.match(css, /body\.text-large \.logtext/);
});


test('فرص تحسين الإحصاءات اختيارية ومحدودة بسنة العمر وتحافظ على حفظ v1', () => {
  assert.match(app, /let uiSettings=\{[^}]*boosts:true/);
  assert.match(app, /boosts:typeof raw\.boosts==='boolean'\?raw\.boosts:defaults\.boosts/);
  assert.match(app, /function statBoostMenu\(key\)/);
  assert.match(app, /function applyStatBoost\(key,tier\)/);
  assert.match(app, /state\.status!=='حي'/, 'recovery actions must not remain available after the life ends');
  assert.match(app, /data-stat-boost=/);
  assert.match(app, /state\.boostUsedAge=Number\(state\.age\)/);
  assert.match(app, /function normalizeStatBoostUsage\(data\)/);
  const source = functionSource('normalizeStatBoostUsage', 'normalizeCoreState');
  const context = {};
  vm.runInNewContext(source + ';globalThis.normalize=normalizeStatBoostUsage;', context);
  assert.equal(context.normalize({age: 24}), null);
  assert.equal(context.normalize({age: 24, boostUsedAge: 23}), 23);
  assert.equal(context.normalize({age: 24, boostUsedAge: 25}), null);
  assert.equal(context.normalize({age: 24, boostUsedAge: -1}), null);
  assert.match(app, /const KEY = 'hekayat_hayah_save_v1';/);
  assert.match(app, /return \{version:1,lifeId:/);
  assert.match(read('sw.js'), /hayah-shell-v59/);
});

test('واجهة الهاتف تحافظ على تخطيط حياة العربي وهويته البصرية المستقلة', () => {
  const finalUi = css.slice(css.lastIndexOf("/* Hayah's original life screen: compact identity"));
  assert.ok(finalUi.length > 0, 'the latest Hayah layout block should exist');
  assert.match(finalUi, /--hayah-primary:#176b66/);
  assert.match(finalUi, /--hayah-navy:#1d3b53/);
  assert.match(finalUi, /--hayah-accent:#e5b34b/);
  assert.match(finalUi, /\.identity-line\{/);
  assert.match(finalUi, /\.nav\s*\{[^}]*order:0/s);
  assert.match(finalUi, /\.stats\s*\{[^}]*order:1/s);
  assert.match(finalUi, /\.navbtn:first-child \.navico\{background:#3b9a90/);
  assert.match(finalUi, /\.agebtn\s*\{[^}]*border-radius:50%/s);
  assert.match(finalUi, /\.statvalue\s*\{[^}]*position:absolute[^}]*z-index:1/s);
  assert.match(finalUi, /\.nav\{direction:ltr\}/);
  assert.match(finalUi, /\.fill\{left:0;right:auto\}/);
  assert.ok(app.includes("const rows=[['happiness','😄','السعادة'],['health','❤️','الصحة'],['smart','🧠','الذكاء'],['looks','😎','المظهر']];"));
  assert.match(finalUi, /body\.theme-dark \.nav\{[^}]*background:#17384d/);
  assert.match(finalUi, /@media\(max-width:380px\)/);
});


test('الرجوع بالزمن يستعيد سجل الأحداث الصحيح بعد بلوغ حد السجل الدوّار', () => {
  const ageUp = functionSource('ageUp', 'age18Choice');
  const rewind = functionSource('rewindToSnapshot', 'customizeMenu');
  assert.match(ageUp, /const logSnapshot=logLength>=280&&Array\.isArray\(state\.log\)\?JSON\.parse\(JSON\.stringify\(state\.log\)\):null/);
  assert.match(ageUp, /if\(logSnapshot\)checkpoint\.logSnapshot=logSnapshot/);
  assert.match(rewind, /Array\.isArray\(parsedSnapshot\.logSnapshot\)\?parsedSnapshot\.logSnapshot/);
  assert.match(rewind, /Number\(parsedSnapshot\.logLength\)/, 'older snapshots without a log checkpoint remain supported');
});


test('مسيرة الرياضات الإلكترونية أصلية وتحافظ على التوافق مع الحفظ القديم', () => {
  assert.match(app, /function ensureGamingTalent\(\)/);
  assert.match(app, /function createEsportsCareer\(\)/);
  assert.match(app, /function enterEsportsTournament\(\)/);
  assert.match(app, /function negotiateEsportsSponsorship\(\)/);
  assert.match(app, /function upgradeEsportsSetup\(\)/);
  assert.match(app, /موهبة الألعاب الإلكترونية/);
  assert.match(app, /data\.talents\.gaming=clamp\(Number\(data\.talents\.gaming\),0,100\)/);
  assert.match(read('sw.js'), /hayah-shell-v59/);
  assert.match(functionSource('rewindToSnapshot', 'customizeMenu'), /ensureGamingTalent\(\)/, 'rewinding a pre-feature snapshot should restore a valid talent default');
});


test('متجر مزايا حياة يحفظ المزايا بشكل مستقل ويحافظ على حفظ v1', () => {
  assert.match(app, /const KEY = 'hekayat_hayah_save_v1';/);
  assert.match(app, /const PERKS_KEY = 'hayah_permanent_perks_v1';/);
  assert.match(app, /function loadPermanentPerks\(\)/);
  assert.match(app, /function premiumPerksMenu\(\)/);
  assert.match(app, /function buyPremiumPerk\(id\)/);
  assert.match(app, /function togglePremiumPerk\(id\)/);
  assert.match(app, /version:1,lifeId:/);
  assert.match(app, /function challengeVaultMenu\(\)/);
  assert.match(app, /function claimVaultChallenge\(date,id\)/);
  assert.match(app, /historyLimit=perkOwned\('expandedTime'\)\?60:8/);
  assert.match(app, /function actorPackMenu\(\)/);
  assert.match(app, /function actorCommercialGig\(\)/);
  assert.match(app, /freeVehicleCare=perkEnabled\('goldenWrench'\)/);
  assert.match(app, /const cost=perkOwned\('goldenPassport'\)\?0:15000/);
  assert.match(app, /careerIncomeMultiplier\(\)/);
  assert.match(app, /Math.max\(1000000,place.start\)/);
  assert.match(app, /if\(perkOwned\('goldenPiggyBank'\)\)heir\.bank\+=1000000/);
  assert.match(app, /protectedByShield/);
});

test('الطابع الذهبي يتخزن ويعاد تحميله ويغيّر مظهر حياة فقط', () => {
  assert.match(app, /theme:\['dark','light','gold'\]\.includes\(raw\.theme\)\?raw\.theme:defaults\.theme/);
  assert.match(app, /body\.classList\.toggle\('theme-gold',uiSettings\.theme==='gold'\)/);
  assert.match(css, /body\.theme-gold\{/);
  assert.match(css, /--brand:#b8861b/);
});

test('حماة سلسلة التحديات يعملون عند تفويت يوم كامل مع حد ثابت للمزايا', () => {
  assert.match(app, /old\.lastCompletionDate===twoDaysAgo&&\(permanentPerks\.streakSavers\|\|0\)>0/);
  assert.match(app, /permanentPerks\.streakSavers--/);
  assert.match(app, /state\.challengeArchive=state\.challengeArchive\.slice\(0,60\)/);
  assert.match(app, /data\.challengeArchive=data\.challengeArchive\.filter\([\s\S]*?\.slice\(0,60\)/);
});


test('مركز المهن يفتح حزمة التمثيل ودرع العافية يحمي ويُعالج الحالة المحاكية', () => {
  assert.match(app, /id==='actorPack'&&!!\(permanentPerks&&permanentPerks\.owned&&permanentPerks\.owned\.bossMode\)/);
  assert.match(app, /data\.sti=typeof data\.sti==='boolean'\?data\.sti:false/);
  assert.match(app, /const infection=!protectedByShield&&!state\.sti&&chance\(\.14\)/);
  assert.match(app, /if\(infection\)\{state\.sti=true;state\.stats\.health=clamp\(state\.stats\.health-12\);\}/);
  assert.match(app, /const treatedCondition=state\.sti===true;if\(treatedCondition\)state\.sti=false/);
  assert.match(app, /عدوى منقولة جنسيًا في محاكاة اللعبة/);
});


test('حزم الصور تفتح أنظمة المهن والثروة والجريمة والحيوانات فعليًا', () => {
  const required = [
    "id:'fameFortuneBundle'",
    "id:'billionairesBundle'",
    "id:'crimePaysBundle'",
    "id:'partyAnimalBundle'",
    "fameFortuneBundle:['goldenPiggyBank','goldenPassport','hollywoodStar']",
    "billionairesBundle:['businessPack','landlordPack','investorPack']",
    "crimePaysBundle:['mafiaPack','blackMarketPack','assassinsBlade']",
    "partyAnimalBundle:['zooExpansionPack','jailCard','superstarMode','goldTheme']",
    "function companyPortfolioMenu()",
    "function landlordTenantMenu(index)",
    "function investingMenu()",
    "inv.kind==='عملات رقمية'",
    "function zooMenu()",
    "function discoverZooAnimal()",
    "function mafiaMenu()",
    "function mafiaMission()",
    "function blackMarketMenu()",
    "function museumMenu()",
    "function assassinBladeMission()",
    "function useJailFreeCard()"
  ];
  required.forEach(fragment => assert.ok(app.includes(fragment), 'missing feature: ' + fragment));
});

test('المزايا الفردية للوظيفة والتعليم والصداقة والولادة تحافظ على حفظ v1', () => {
  const required = [
    "const KEY = 'hekayat_hayah_save_v1';",
    "function goldenDiplomaMenu()",
    "function grantGoldenDiploma(major)",
    "function goldenPacifierMenu()",
    "function planGoldenBirth(count,gender,talent)",
    "if(perkOwned('friendshipBracelet'))f.relationshipLevel=100",
    "perkEnabled('goldenResume')?1",
    "perkEnabled('goldenPacifier')?18:20",
    "function companyDetailMenu(index)",
    "if(a.companyPortfolio){const companyIndex=",
    "if(!Array.isArray(data.companies))data.companies=[]"
  ];
  required.forEach(fragment => assert.ok(app.includes(fragment), 'missing feature: ' + fragment));
});


test('باقات السوق الجديدة مرتبطة بأنظمة لعب فعلية', () => {
  const required = [
    "id:'cultPack'",
    "id:'casinoPack'",
    "id:'godMode'",
    "id:'bitizenship'",
    "id:'movieDirectorPack'",
    "id:'dealerPack'",
    "id:'businessPack'",
    "id:'landlordPack'",
    "id:'investorPack'",
    "function cultMenu()",
    "function advanceCultSystem()",
    "function casinoMenu()",
    "const casinoGameCatalog=[",
    "function advanceCasinoSystem()",
    "function dealerMenu()",
    "function advanceDealerSystem()",
    "function godModeMenu()",
    "function startRoyalLife()",
    "function godModeTalentsMenu()",
    "function bitizenshipMenu()",
    "function bitizenshipInteractionMenu()",
    "function movieDirectorMenu()",
    "function financialAdvisorMenu()",
    "function investmentTipsMenu()",
    "function marketNewspaperMenu()",
    "function advanceInvestmentAdvisor()",
    "function landlordPortfolioMenu()",
    "function customizePropertyAmenities(index)",
    "function evictTenant(index)",
    "function advanceZooSystem()",
    "function zooHabitatMenu()",
    "function zooOwnedAnimalsMenu(page=0)",
    "function grantLandlordStarterProperty()",
    "funds:75000,habitats:['savannah','forest','aviary']"
  ];
  required.forEach(fragment => assert.ok(app.includes(fragment), 'missing feature: ' + fragment));
});

test('حديقة الحيوان تدعم أكثر من 100 نوع، وحزمة المخرج تفتح 11 نوعًا سينمائيًا', () => {
  const zooStart = app.indexOf('const zooSpeciesCatalog=[');
  const zooEnd = app.indexOf('].map((a,i)=>', zooStart);
  assert.notEqual(zooStart, -1);
  assert.notEqual(zooEnd, -1);
  const species = (app.slice(zooStart, zooEnd).match(/\['[a-z0-9-]+','/g) || []).length;
  assert.ok(species >= 100, 'expected 100+ zoo species, found ' + species);

  const filmStart = app.indexOf('const filmGenreCatalog=[');
  const filmEnd = app.indexOf('\n];', filmStart);
  assert.notEqual(filmStart, -1);
  assert.notEqual(filmEnd, -1);
  const genres = (app.slice(filmStart, filmEnd).match(/\{id:'/g) || []).length;
  assert.equal(genres, 11, 'director expansion should expose 11 film genres');
  assert.match(app, /genres=filmGenreCatalog\.filter\(g=>!g\.packOnly\|\|perkOwned\('movieDirectorPack'\)\)/);
});

test('الأنظمة الجديدة تضيف بيانات افتراضية آمنة للحفظ القديم ولا تمس إصدار v1', () => {
  assert.match(app, /const KEY = 'hekayat_hayah_save_v1';/);
  assert.match(app, /const PERK_IDS = \[[^\n]*'cultPack'[^\n]*'casinoPack'[^\n]*'godMode'[^\n]*'bitizenship'[^\n]*'movieDirectorPack'[^\n]*'dealerPack'/);
  assert.match(app, /if\(!data\.cult\|\|typeof data\.cult!=='object'/);
  assert.match(app, /if\(!data\.casino\|\|typeof data\.casino!=='object'/);
  assert.match(app, /if\(!data\.dealer\|\|typeof data\.dealer!=='object'/);
  assert.match(app, /if\(!data\.investmentAdvisor\|\|typeof data\.investmentAdvisor!=='object'/);
  assert.match(app, /function advanceInvestmentAdvisor\(\)/);
  assert.match(app, /function advanceZooSystem\(\)/);
});


test('واجهة الهاتف الجديدة تطابق تخطيط الصفحات المرجعية وتحافظ على هوية حياة', () => {
  assert.match(html, /id="marketBtn"/);
  assert.doesNotMatch(html, /adSlot|closeAdSlot|ad-slot|مساحة إعلان/);
  assert.doesNotMatch(app, /closeAdSlot|ad-hidden/);
  assert.doesNotMatch(css, /\.ad-slot|ad-hidden/);
  assert.match(app, /function section\(title\)/);
  assert.match(app, /if\(c&&c\.section\)return '<div class="list-section"/);
  assert.match(app, /function auraRingMenu\(\)/);
  assert.match(app, /function shoppingMenu\(\)/);
  assert.match(app, /function schoolHub\(\)/);
  assert.match(app, /function schoolClassMenu\(\)/);
  assert.match(app, /function schoolCliqueMenu\(\)/);
  assert.match(app, /function schoolFacultyMenu\(\)/);
  assert.match(app, /function showJobPackOffer\(id,career\)/);
  assert.match(app, /function showActivityPackOffer\(id\)/);
  assert.match(app, /function vampireModeMenu\(\)/);
  assert.match(app, /function outdoorLifestyleMenu\(\)/);
  assert.match(app, /function gatedCommunityMenu\(\)/);
  assert.match(app, /id:'modelPack'/);
  assert.match(app, /id:'musicianPack'/);
  assert.match(app, /id:'musicProducerPack'/);
  assert.match(css, /\.activities-screen/);
  assert.match(css, /\.activity-vampire-row/);
  assert.match(app, /id:'astronautPack'/);
  assert.match(app, /function openJobPackDestination\(id\)/);
  assert.match(css, /\.school-screen/);
  assert.match(css, /\.job-pack-card/);
  assert.match(app, /function storeDealerMenu\(kind\)/);
  assert.match(app, /function ensureSocialPlatforms\(\)/);
  assert.match(app, /function showMovieDirectorOffer\(\)/);
  assert.match(css, /\.drawer-action-banner/);
  assert.match(css, /\.pack-offer-buy/);
  assert.match(app, /section\('الوالدان'\)/);
  assert.match(app, /section\('مسارات وتوسعات'\)/);
  assert.match(app, /section\('الأصول المميزة'\)/);
  assert.match(app, /id="majorSelect"/);
  assert.match(app, /function startDrivingTest\(\)/);
  assert.match(app, /function finishDrivingTest\(passed\)/);
  assert.match(app, /auraRing:\{cost:32000,title:'خاتم الهالة'\}/);
  assert.match(css, /--blue:#075a9b/);
  assert.match(css, /\.drawer-body \.choice\.locked-choice/);
  assert.match(css, /\.agebtn[\s\S]{0,200}border-radius:50%/);
  assert.doesNotMatch(css, /\.ad-slot|ad-hidden/);
  assert.match(css, /\.list-section/);
  assert.match(css, /grid-template-columns:minmax\(0,1fr\)/);
  assert.doesNotMatch(html, /BITLIFE|BitLife|Candywriter/);
});


test('إدارة المشروع تدعم عقود الموردين وتقاريرًا مالية سنوية محدودة ومتوافقة مع الحفظ القديم', () => {
  assert.match(app, /const BUSINESS_SUPPLIER_CATALOG = \[/);
  assert.match(app, /function businessSupplierMenu\(\)/);
  assert.match(app, /function contractBusinessSupplier\(id\)/);
  assert.match(app, /function recordBusinessFinancialReport\(entity,report\)/);
  assert.match(app, /function businessReportsMenu\(entity,title,back\)/);
  assert.match(app, /entity\.financialHistory=history\.slice\(-10\)/);
  assert.match(app, /business\.supplier\.yearsLeft=Math\.max\(0,/);
  assert.match(app, /choice\('📦','التعاقد مع مورد'/);
  assert.match(app, /choice\('📊','سجل التقارير'/);
  assert.match(app, /const normalizeBusinessEntity=entity=>/);
  assert.match(read('sw.js'), /hayah-shell-v59/);
});


test('إدارة فريق المشروع تحفظ الموظفين وتؤثر في التقرير السنوي', () => {
  assert.match(app, /const BUSINESS_STAFF_ROLES = \[/);
  assert.match(app, /function businessStaffMenu\(\)/);
  assert.match(app, /function businessStaffHiringMenu\(\)/);
  assert.match(app, /function hireBusinessStaff\(roleId\)/);
  assert.match(app, /function trainBusinessStaff\(id\)/);
  assert.match(app, /function fireBusinessStaff\(id\)/);
  assert.match(app, /entity\.staff=entity\.staff\.filter/);
  assert.match(app, /staffPayroll/);
  assert.match(app, /staffCount/);
  assert.match(app, /choice\('👥','إدارة الموظفين'/);
  assert.match(read('sw.js'), /hayah-shell-v59/);
});


test('سوق الموردين يتجدد سنويًا ويحفظ عروض الأسعار مع احترام العقود القديمة', () => {
  assert.match(app, /function businessSupplierMarketOffers\(business\)/);
  assert.match(app, /business\.supplierMarket=\{year,offers\}/);
  assert.match(app, /yearsLeft:1,startedAtAge:state\.age/);
  assert.match(app, /earlyExitFee/);
  assert.match(app, /supplierQuality/);
  assert.match(app, /supplierCostMultiplier/);
  assert.match(app, /entity\.supplier\.yearsLeft\)\|\|3,1,3/);
  assert.match(app, /entity\.supplier\.quality/);
  assert.match(read('sw.js'), /hayah-shell-v59/);
});


test('إدارة المنتجات تدعم بحث السوق والمبيعات السنوية مع حفظ متوافق', () => {
  assert.match(app, /const BUSINESS_PRODUCT_CATALOG = \[/);
  assert.match(app, /function businessProductMarketSnapshot\(business,catalog\)/);
  assert.match(app, /function researchBusinessProduct\(productId\)/);
  assert.match(app, /function launchBusinessProduct\(productId,useResearch\)/);
  assert.match(app, /function simulateBusinessProducts\(business,openingValue,supplier,staffRevenueBonus\)/);
  assert.match(app, /business\.pendingProductCosts/);
  assert.match(app, /productRevenue/);
  assert.match(app, /competition/);
  assert.match(app, /choice\('🧪','إدارة المنتجات'/);
  assert.match(app, /entity\.productResearch=entity\.productResearch\.filter/);
  assert.match(read('sw.js'), /hayah-shell-v59/);
});


test('شركات المحفظة تدير الموردين والموظفين والمنتجات وتغلق سنتها المالية باستقلال', () => {
  assert.match(app, /let managedCompanyId = null/);
  assert.match(app, /function currentManagedBusiness\(\)/);
  assert.match(app, /function openPrimaryBusinessMenu\(\)/);
  assert.match(app, /choice\('🧰','إدارة التشغيل'/);
  assert.match(app, /section\('الشركات المملوكة'\)/);
  assert.match(app, /companyDetailMenu\(i\)/);
  assert.match(app, /function simulateBusinessEntityYear\(business,kind\)/);
  assert.match(app, /simulateBusinessEntityYear\(state\.business,'business'\)/);
  assert.match(app, /simulateBusinessEntityYear\(company,'portfolio'\)/);
  assert.match(app, /business\.assetId\|\|business\.id\|\|business\.title/);
  assert.match(read('sw.js'), /hayah-shell-v59/);
});


test('الفروع والمصانع محفوظة لكل نشاط وتزيد طاقة المنتجات وتظهر تكلفتها في التقرير', () => {
  assert.match(app, /const BUSINESS_FACILITY_CATALOG = \[/);
  assert.match(app, /function businessFacilitiesMenu\(\)/);
  assert.match(app, /function businessFacilityCatalogMenu\(\)/);
  assert.match(app, /function buyBusinessFacility\(type\)/);
  assert.match(app, /if\(!Array\.isArray\(entity\.facilities\)\)entity\.facilities=\[\]/);
  assert.match(app, /entity\.pendingFacilityCosts/);
  assert.match(app, /capacityMultiplier/);
  assert.match(app, /facilityUpkeep/);
  assert.match(app, /facilityInvestment/);
  assert.match(app, /choice\('🏗️','الفروع والمصانع'/);
  assert.match(app, /return \{version:1,lifeId:/);
  assert.match(read('sw.js'), /hayah-shell-v59/);
});

test('استثمار المنشأة رأسمالي منفصل عن صافي الربح والصيانة السنوية', () => {
  const annualSimulation = functionSource('simulateBusinessEntityYear', 'advanceAge');
  assert.match(annualSimulation, /const operatingCostsTotal=operatingCosts\+staffPayroll\+facilityUpkeep\+productResult\.costs/);
  assert.match(annualSimulation, /const costs=operatingCostsTotal\+productResult\.upfrontCosts\+businessLoanInterest/);
  assert.match(annualSimulation, /facilityInvestmentCosts/);
  assert.match(annualSimulation, /const cashDelta=revenue-operatingCostsTotal-businessLoanInterestPaid-corporateTaxPaidFromCash/);
});

test('نسب طاقة المنشآت العشرية لا تُقرّب إلى أعداد صحيحة', () => {
  assert.match(app, /Math\.max\(0,Math\.min\(1\.5,Number\.isFinite\(capacityBonus\)\?capacityBonus:catalog\.capacityBonus\)\)/);
  assert.match(app, /facilityCapacityBonus=facilities\.reduce\(\(sum,facility\)=>sum\+Math\.max\(0,Math\.min\(1\.5,Number\(facility\.capacityBonus\)\|\|0\)\),0\)/);
});

test('سوق المنافسة يحفظ شركات مستقلة وقرارات سنوية تؤثر في المبيعات والتقارير', () => {
  [
    "function businessMarketSnapshot(business)",
    "function businessMarketMenu()",
    "function businessRivalHash(value)",
    "function createBusinessRivals(business,industry,year,count,baselinePrice)",
    "function normalizeBusinessRivals(raw,business,industry,year,count,baselinePrice)",
    "function advanceBusinessRivals(raw,business,industry,year,profile,demandIndex)",
    "function summarizeBusinessRivals(rivals,baselineCompetition,profile)",
    "function reconcileBusinessRivalShares(market)",
    "marketDemandFactor","marketCompetitionFactor","marketPriceFactor",
    "rivalQualityFactor","rivalMarketingFactor","rivalCapacityFactor",
    "marketRivalPlans","decisionYear",
    "rivals:normalizeBusinessRivals(market.rivals",
    "الشركات المنافسة داخل المحاكاة",
    "choice('📈','تحليل السوق والمنافسين'",
    "return {version:1,lifeId:"
  ].forEach(fragment => assert.ok(app.includes(fragment), 'missing independent rival behavior: '+fragment));
  assert.match(read('sw.js'), /hayah-shell-v59/);
});


test('النوافذ الحوارية تدير التركيز بلوحة المفاتيح وتعيده إلى زر الفتح', () => {
  assert.match(app, /let activeDialogKeyHandler=null, modalReturnFocus=null/);
  assert.match(app, /dialog\.setAttribute\('tabindex','-1'\)/);
  assert.match(app, /event\.key==='Escape'&&closable/);
  assert.match(app, /event\.key!=='Tab'/);
  assert.match(app, /document\.addEventListener\('keydown',activeDialogKeyHandler\)/);
  assert.match(app, /returnFocus&&returnFocus\.isConnected/);
  assert.match(app, /const initialFocus=\$\('closeModal'\)\|\|getFocusable\(\)\[0\]\|\|dialog/);
  assert.match(read('style.css'), /\.modal button:focus-visible/);
  assert.match(read('sw.js'), /hayah-shell-v59/);
});

test('اختبارات Node دون DOM كامل لا تتطلب querySelector من عنصر الجذر', () => {
  assert.match(app, /const dialog=typeof root\.querySelector==='function'\?root\.querySelector\('\[role="dialog"\]'\):null/);
});


test('إعدادات الصوت والاهتزاز اختيارية ومستقلة عن حفظ الحياة', () => {
  assert.ok(app.includes("let uiSettings={theme:'light',textScale:'normal',sound:false,haptics:false,boosts:true}"));
  assert.ok(app.includes("function playUiFeedback(kind='tap')"));
  assert.ok(app.includes("typeof navigator.vibrate==='function'"));
  assert.ok(app.includes("window.AudioContext||window.webkitAudioContext"));
  assert.ok(app.includes("sound:typeof raw.sound==='boolean'?raw.sound:defaults.sound"));
  assert.ok(app.includes("haptics:typeof raw.haptics==='boolean'?raw.haptics:defaults.haptics"));
  assert.ok(app.includes("choice(uiSettings.sound?'🔊':'🔇'"));
  assert.ok(app.includes("choice(uiSettings.haptics?'📳':'📴'"));
  assert.ok(app.includes("localStorage.setItem(SETTINGS_KEY,JSON.stringify(uiSettings))"));
  assert.match(read('sw.js'), /hayah-shell-v59/);
});


test('سجل الحياة يضيف الأحداث الجديدة تدريجيًا ويحافظ على عناصر السجل القديمة', () => {
  assert.match(app, /let renderedLogSnapshot=null, renderedFeedElement=null/);
  assert.match(app, /function logEntrySignature\(entry\)/);
  assert.match(app, /function appendLogEntryNode\(feed,entry,lastAge\)/);
  assert.match(app, /if\(renderedFeedElement===feed&&Array\.isArray\(previous\)&&supportsIncrementalDom\)/);
  assert.match(app, /for\(let candidate=359;candidate>0;candidate--\)/);
  assert.match(app, /renderedLogSnapshot=signatures;renderedFeedElement=feed/);
  assert.match(html, /id="lifeFeed"[^>]*aria-relevant="additions" aria-atomic="false"/);
  assert.match(read('sw.js'), /hayah-shell-v59/);
});


test('اقتصاد الشركات يختلف حسب الصناعة ويظهر أثره في التقرير المالي', () => {
  assert.ok(app.includes("const BUSINESS_INDUSTRY_PROFILES = {"));
  assert.ok(app.includes("function businessIndustryProfile(industry)"));
  assert.ok(app.includes("industryProfile.revenueMultiplier"));
  assert.ok(app.includes("industryProfile.operatingCostMultiplier"));
  assert.ok(app.includes("industryProfile.unitCostMultiplier"));
  assert.ok(app.includes("industryRevenueMultiplier"));
  assert.ok(app.includes("industryOperatingCostMultiplier"));
  assert.ok(app.includes("industryUnitCostMultiplier"));
  assert.ok(app.includes("معاملات القطاع: الإيرادات"));
  assert.match(read('sw.js'), /hayah-shell-v59/);
});


test('تمويل النشاط مستقل لكل شركة ويُحتسب مرة واحدة مع حماية الحفظ القديم', () => {
  [
    "function businessCreditBalance(business)",
    "function businessCreditLimit(business)",
    "function businessCreditRate(business)",
    "function businessCreditMenu()",
    "function borrowBusinessCredit(amount)",
    "function repayBusinessCredit(amount)",
    "entity.credit=principal+accruedInterest>0?",
    "businessLoanInterestPaid",
    "businessLoanInterestAccrued",
    "businessLoanBalance",
    "Number(credit.lastInterestAge)!==Number(state.age)",
    "grossProceeds+companyCash-creditBalance",
    "سداد كامل الرصيد",
    "return {version:1,lifeId:"
  ].forEach(fragment => assert.ok(app.includes(fragment), 'missing business credit behavior: ' + fragment));
  const annualSimulation = functionSource('simulateBusinessEntityYear', 'advanceAge');
  assert.ok(annualSimulation.includes("const costs=operatingCostsTotal+productResult.upfrontCosts+businessLoanInterest"));
  assert.ok(annualSimulation.includes("const cashDelta=revenue-operatingCostsTotal-businessLoanInterestPaid-corporateTaxPaidFromCash"));
  assert.ok(read('sw.js').includes("hayah-shell-v59"));
});


test('الخزينة المستقلة تفصل نقدية كل شركة عن رصيد المالك وتحافظ على الحفظ القديم', () => {
  [
    "function businessUsesSeparateTreasury(business)",
    "function businessTreasuryBalance(business)",
    "function adjustBusinessTreasury(business,amount)",
    "function spendBusinessTreasury(business,amount)",
    "function activateBusinessTreasury(amount)",
    "function transferBusinessCapital(direction,amount)",
    "function businessTreasuryMenu()",
    "entity.treasuryMode='shared'",
    "entity.treasuryMode='separate'",
    "pendingOwnerContributions",
    "pendingOwnerWithdrawals",
    "openingCashBalance",
    "closingCashBalance",
    "treasuryMode:'separate',cashBalance:0",
    "grossProceeds+companyCash-creditBalance",
    "خزينة النشاط ورأس المال"
  ].forEach(fragment => assert.ok(app.includes(fragment), 'missing separate treasury behavior: ' + fragment));
  const annualSimulation = functionSource('simulateBusinessEntityYear', 'advanceAge');
  assert.ok(annualSimulation.includes("businessTreasuryBalance(business)+revenue-operatingCostsTotal"));
  assert.ok(annualSimulation.includes("const cashDelta=revenue-operatingCostsTotal-businessLoanInterestPaid-corporateTaxPaidFromCash"));
  assert.ok(annualSimulation.includes("treasuryMode:separateTreasury?'separate':'shared'"));
  assert.match(read('sw.js'), /hayah-shell-v59/);
});


test('ضرائب الشركات تُحسب على الربح الموجب وتُسدد من خزينة النشاط مع ترحيل المتأخرات', () => {
  [
    "corporateTaxRate:.12",
    "corporateTaxRate:.16",
    "function businessTaxLiability(business)",
    "function repayBusinessTax(amount)",
    "business.taxLiability=corporateTaxAccrued",
    "const corporateTax=Math.max(0,Math.round(taxableProfit*corporateTaxRate))",
    "const corporateTaxPaidFromCash=Math.min(totalTaxDue,Math.max(0,Math.floor(cashAfterInterest)))",
    "business.pendingTaxPayments=0",
    "سداد '+Math.round(ratio*100)+'% من المتأخرات الضريبية",
    "corporateTaxPaid,corporateTaxAccrued,taxLiability"
  ].forEach(fragment => assert.ok(app.includes(fragment), 'missing company tax behavior: ' + fragment));
  const annualSimulation = functionSource('simulateBusinessEntityYear', 'advanceAge');
  assert.ok(annualSimulation.includes('const taxableProfit=Math.max(0,Math.round(preTaxProfit))'));
  assert.ok(annualSimulation.includes('const cashDelta=revenue-operatingCostsTotal-businessLoanInterestPaid-corporateTaxPaidFromCash'));
  assert.ok(annualSimulation.includes('const costs=operatingCostsTotal+productResult.upfrontCosts+businessLoanInterest+corporateTax'));
  assert.match(read('sw.js'), /hayah-shell-v59/);
});

test('مسيرة القتال تدير ثلاث جولات وتستعيد النزال المحفوظ مع الحفظ القديم', () => {
  const catalogStart = app.indexOf('const combatMoveCatalog=[');
  const catalogEnd = app.indexOf('];' + String.fromCharCode(10) + 'const combatTacticCatalog=', catalogStart);
  assert.ok(catalogStart >= 0 && catalogEnd > catalogStart, 'the combat move catalogue should remain available');
  const catalogText = app.slice(catalogStart, catalogEnd);
  const ids = catalogText.split("{id:'").slice(1).map(part => part.split("'")[0]);
  assert.equal(ids.length, 30, 'the expanded move catalogue should contain thirty distinct moves');
  assert.equal(new Set(ids).size, ids.length, 'every move should have a unique id');
  for (const id of ['low-kick', 'pivot-counter', 'shell-defense', 'burst-combo', 'last-round-read',
    'angle-pivot', 'low-line-kick', 'shoulder-shell', 'rhythm-barrage', 'champion-plan']) {
    assert.ok(ids.includes(id), 'missing original combat move ' + id);
  }
  assert.ok(catalogText.includes('style:'), 'moves should retain their own fighting style');
  assert.ok(catalogText.includes('strongAgainst:'), 'moves should retain their counter data');
  assert.ok(app.includes('move.strongAgainst===opponent.style'));
  assert.ok(app.includes('const combatTacticCatalog=['));
  assert.ok(app.includes('function combatBoutRoundMenu()'));
  assert.ok(app.includes('function resolveCombatRound(actionId)'));
  assert.ok(app.includes('session.roundHistory.length>=3'));
  assert.ok(app.includes("id:'tactic-breathe'"));
  assert.ok(app.includes("energyRecovery:14,oncePerBout:true"));
  assert.ok(app.includes('c.pendingBout=normalizePendingCombatBout(c.pendingBout)'));
  assert.ok(app.includes('كمّل الجولات الثلاث'));
  assert.ok(app.includes('c.pendingBout=null'));

  const energyHelper = functionSource('combatRoundEnergy', 'combatOpponentStyleForRound');
  const energyContext = { clamp: (value,min=0,max=100) => Math.max(min,Math.min(max,Math.round(Number(value)||0))) };
  vm.runInNewContext(energyHelper + `
    globalThis.normal=combatRoundEnergy(70,{power:34},'street');
    globalThis.league=combatRoundEnergy(70,{power:20,energyCost:0,energyRecovery:14},'league');
    globalThis.recovered=combatRoundEnergy(94,{power:20,energyCost:0,energyRecovery:14},'street');
    globalThis.capped=combatRoundEnergy(98,{power:20,energyCost:0,energyRecovery:14},'street');
  `, energyContext);
  assert.equal(JSON.stringify(energyContext.normal),JSON.stringify({before:70,energyCost:6,energyRecovery:0,after:64}));
  assert.equal(JSON.stringify(energyContext.league),JSON.stringify({before:70,energyCost:2,energyRecovery:14,after:82}));
  assert.equal(JSON.stringify(energyContext.recovered),JSON.stringify({before:94,energyCost:0,energyRecovery:14,after:100}));
  assert.equal(JSON.stringify(energyContext.capped),JSON.stringify({before:98,energyCost:0,energyRecovery:14,after:100}));
  assert.match(app,/session\.roundHistory\.some\(item=>item\.actionId===move\.id\)/,
    'a once-per-bout recovery tactic must be rejected if already used');

  const helper = functionSource('combatDifficultyLabel', 'createCombatCareer');
  const context = { clamp: value => Math.max(0, Math.min(100, Number(value) || 0)) };
  vm.runInNewContext(helper + ';globalThis.levels=[combatDifficultyLabel(10),combatDifficultyLabel(45),combatDifficultyLabel(62),combatDifficultyLabel(90)];', context);
  assert.deepEqual(Array.from(context.levels), ['سهل', 'متوسط', 'صعب', 'نخبة']);

  const pendingHelpers = app.slice(app.indexOf('function combatOpponentStyleForRound('), app.indexOf('function createCombatCareer('));
  const pendingContext = { clamp: (value,min=0,max=100) => Math.max(min,Math.min(max,Math.round(value))) };
  vm.runInNewContext(pendingHelpers + `
    globalThis.styles=[
      combatOpponentStyleForRound({style:'قوة'},1,''),
      combatOpponentStyleForRound({style:'قوة'},2,'سرعة'),
      combatOpponentStyleForRound({style:'قوة'},3,'سرعة')
    ];
    globalThis.pending=normalizePendingCombatBout({
      mode:'league',feePaid:true,
      opponent:{name:'منافس تجريبي',style:'قوة',weakTo:'سرعة',emoji:'💪',rating:52},
      round:3,playerScore:104,opponentScore:99,lastStyle:'دفاع',
      roundHistory:[
        {actionId:'quick-jab',actionTitle:'لكمة خاطفة',style:'سرعة',opponentStyle:'قوة',playerScore:55,opponentScore:49,energyBefore:100,energyCost:6,energyRecovery:0,energyAfter:94},
        {actionId:'tactic-guard',actionTitle:'حراسة متحركة',style:'دفاع',opponentStyle:'تقنية',playerScore:49,opponentScore:50}
      ]
    });
    globalThis.invalidLeague=normalizePendingCombatBout({
      mode:'league',feePaid:false,
      opponent:{name:'منافس',style:'قوة',weakTo:'سرعة',rating:40}
    });
  `, pendingContext);
  assert.deepEqual(Array.from(pendingContext.styles), ['قوة', 'تقنية', 'قوة']);
  assert.equal(pendingContext.pending.round, 3, 'a saved two-round bout should resume at round three');
  assert.equal(pendingContext.pending.roundHistory.length, 2);
  assert.equal(pendingContext.pending.roundHistory[0].energyAfter,94,
    'saved round energy details should survive pending-bout normalization');
  assert.equal(pendingContext.pending.roundHistory[1].energyAfter,null,
    'legacy pending rounds without energy metadata should remain explicitly unknown');
  assert.equal(pendingContext.pending.feePaid, true);
  assert.equal(pendingContext.invalidLeague, null, 'an unpaid league bout must not be restored from imported data');

  assert.ok(app.includes("c.movesKnown=['quick-jab','high-guard']"), 'old fighter saves should retain their known move defaults');
  assert.ok(app.includes("const KEY = 'hekayat_hayah_save_v1';"));
  assert.ok(app.includes('return {version:1,lifeId:'));
});


test('مجتمع المقاتلين يحفظ العلاقات والتحالفات ويؤثر على النزالات دون كسر الحفظ القديم', () => {
  const profilesStart = app.indexOf('const combatCommunityProfiles=[');
  const helpersEnd = app.indexOf('function combatDifficultyLabel', profilesStart);
  assert.ok(profilesStart >= 0 && helpersEnd > profilesStart, 'the community profiles and normalizer should exist');
  const helpers = app.slice(profilesStart, helpersEnd);
  const context = { clamp: (value, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(Number(value) || 0))) };
  vm.runInNewContext(helpers + "globalThis.community = normalizeCombatCommunity([\n { id: 'adam-mansour', respect: 140, tension: -20, allied: true, lastInteractionAge: 29 },\n { id: 'malek-sherif', respect: 'invalid', tension: 150, allied: 'yes', lastInteractionAge: 'bad' },\n { id: 'unknown-id', respect: 99, tension: 99, allied: true }\n]);\nglobalThis.pending = normalizePendingCombatBout({\n mode: 'street', opponent: { name: 'آدم منصور', style: 'قوة', weakTo: 'سرعة', emoji: '💪', rating: 46 },\n round: 1, playerScore: 0, opponentScore: 0, roundHistory: [],\n startedAge: 30, feePaid: false, communityFighterId: 'adam-mansour'\n});", context);
  assert.equal(context.community.length, 5, 'legacy and imported saves should receive the stable original roster');
  assert.equal(new Set(Array.from(context.community, fighter => fighter.id)).size, 5, 'community ids must be unique');
  assert.equal(context.community[0].respect, 100, 'respect must be bounded to 100');
  assert.equal(context.community[0].tension, 0, 'tension must be bounded to zero');
  assert.equal(context.community[0].allied, true, 'valid alliance state should persist');
  assert.equal(context.community[0].lastInteractionAge, 29);
  assert.equal(context.community[1].respect, 48, 'invalid legacy values should use safe defaults');
  assert.equal(context.community[1].allied, false);
  assert.equal(context.community[1].lastInteractionAge, -1);
  assert.equal(context.pending.communityFighterId, 'adam-mansour', 'saved named opponents should survive a reload');
  assert.ok(app.includes("choice('🤝','مجتمع المقاتلين'"));
  assert.ok(app.includes('function combatCommunityMenu()'));
  assert.ok(app.includes('function combatCommunityFighterMenu(fighterId)'));
  assert.ok(app.includes('function interactCombatFighter(fighterId,action)'));
  assert.ok(app.includes("startCombatBout('street',fighter.id)"));
  assert.ok(app.includes('communityFighter.respect=clamp(communityFighter.respect+(won?10:3))'));
  assert.ok(app.includes('communityFighter.tension=clamp(communityFighter.tension+(won?-12:14))'));
  assert.ok(app.includes('communityFighterId:session&&session.communityFighterId?session.communityFighterId:null'));
  assert.ok(app.includes("const KEY = 'hekayat_hayah_save_v1';"));
  assert.ok(app.includes('return {version:1,lifeId:'));
  assert.match(read('sw.js'), /hayah-shell-v59/);
});
test('المهرجان الأسبوعي يدعم 11 شارة ويطبع بيانات المواسم القديمة دون مكافآت مجانية', () => {
  [
    "function seasonalWeekDetails(date)",
    "function ensureSeasonalEvent()",
    "function seasonalEventMenu()",
    "function claimSeasonalEventBadge(id)",
    "function seasonalEventBadges(event)",
    "data.seasonalEvent=normalizeSeasonalEvent(data.seasonalEvent,data)",
    "data.seasonalEventArchive=normalizeSeasonalEventArchive(data.seasonalEventArchive,data)",
    "seasonalEvent:null,seasonalEventArchive:[]",
    "choice('🏅','مهرجان صُنّاع الحكاية'",
    "function seasonalEventArchiveMenu()",
    "const KEY = 'hekayat_hayah_save_v1';",
    "return {version:1,lifeId:"
  ].forEach(fragment => assert.ok(app.includes(fragment), 'missing weekly event behavior: ' + fragment));

  const helpers = app.slice(app.indexOf('function challengeDateKey('), app.indexOf('function ensureDailyChallengeBoard('));
  const context = {
    state: {
      age:21,
      friends:[{relationshipLevel:80}],
      hobbies:[{}],
      socialMediaPosts:1,
      stats:{smart:44,health:78,happiness:74},
      jobHistory:[{}],specialCareerHistory:[],job:null,specialCareer:null,
      assets:[{}],investments:[{}],pets:[{}],travelHistory:[{}],children:[{}],
      family:[{relationshipLevel:80}],partner:null
    },
    clamp: value => Math.max(0, Math.min(100, Number(value) || 0))
  };
  vm.runInNewContext(helpers + `
    globalThis.week = seasonalWeekDetails(new Date('2026-10-30T12:00:00'));
    globalThis.event = normalizeSeasonalEvent({
      weekId:'2026-W44',startDate:'2026-10-26',endDate:'2026-11-01',
      baseline:{age:20,friends:0,hobbies:0,posts:0,smart:40,health:70,happiness:70,
        careerProgress:0,assets:0,investments:0,pets:0,trips:0,children:0,bestRelationship:70},
      claimed:['chapter','chapter','unknown','friend'],bonusClaimed:false
    },state);
    globalThis.badges = seasonalEventBadges(globalThis.event);
    globalThis.legacyEvent = normalizeSeasonalEvent({
      weekId:'2026-W43',
      baseline:{age:20,friends:0,hobbies:0,posts:0,smart:40,health:70,happiness:70},
      claimed:['chapter','friend','hobby','voice','balance'],bonusClaimed:false
    },state);
  `, context);
  assert.equal(context.week.id, '2026-W44');
  assert.equal(context.week.startDate, '2026-10-26');
  assert.equal(context.week.endDate, '2026-11-01');
  const originalTimezone = process.env.TZ;
  try {
    process.env.TZ = 'Africa/Cairo';
    const cairoContext = {
      state: {age:30,friends:[],hobbies:[],socialMediaPosts:0,stats:{smart:60,health:80,happiness:70}},
      clamp: value => Math.max(0, Math.min(100, Number(value) || 0))
    };
    vm.runInNewContext(helpers + "globalThis.cairoWeek=seasonalWeekDetails(new Date(2026,9,30,12));", cairoContext);
    assert.equal(cairoContext.cairoWeek.id, '2026-W44', 'DST changes must not shift the ISO week');
    assert.equal(cairoContext.cairoWeek.startDate, '2026-10-26');
  } finally {
    if (originalTimezone === undefined) delete process.env.TZ;
    else process.env.TZ = originalTimezone;
  }
  vm.runInNewContext(helpers + "globalThis.newYearWeek=seasonalWeekDetails(new Date('2027-01-01T12:00:00'));", context);
  assert.equal(context.newYearWeek.id, '2026-W53', 'ISO weeks spanning New Year must keep the ISO year');
  assert.deepEqual(Array.from(context.event.claimed), ['chapter','friend']);
  assert.deepEqual(Array.from(context.badges.map(badge=>badge.id)), [
    'chapter','friend','hobby','voice','balance','career','asset','invest','pet','travel','family'
  ]);
  assert.ok(context.badges.every(badge=>badge.done));
  assert.equal(context.legacyEvent.claimed.length, 5, 'legacy five-badge records should remain readable');
  assert.equal(context.legacyEvent.baseline.assets, 1, 'missing legacy counters should use the saved life as baseline');
  assert.equal(context.legacyEvent.baseline.investments, 1);
  assert.equal(context.legacyEvent.baseline.pets, 1);
  assert.equal(context.legacyEvent.baseline.trips, 1);

  const childContext = {
    state:{age:12,friends:[],hobbies:[],socialMediaPosts:0,stats:{smart:44,health:75,happiness:72},
      jobHistory:[],specialCareerHistory:[],assets:[],investments:[],pets:[],travelHistory:[],children:[],family:[],partner:null},
    clamp:value=>Math.max(0,Math.min(100,Number(value)||0)),
    childEvent:{weekId:'2026-W44',baseline:{age:12,friends:0,hobbies:0,posts:0,smart:40,health:70,happiness:70,
      careerProgress:0,assets:0,investments:0,pets:0,trips:0,children:0,bestRelationship:0}}
  };
  vm.runInNewContext(helpers+'globalThis.childBadges=seasonalEventBadges(childEvent);',childContext);
  assert.equal(childContext.childBadges.length,11);
  assert.ok(childContext.childBadges.some(badge=>badge.id==='learning'&&badge.done));
  assert.ok(!childContext.childBadges.some(badge=>badge.id==='voice'));

  const archive=Array.from({length:10},(_,index)=>({weekId:'2026-W'+String(index+1).padStart(2,'0'),claimed:['chapter','family','travel'],bonusClaimed:false}));
  const archiveContext={archive,state:context.state,clamp:context.clamp};
  vm.runInNewContext(helpers+'globalThis.normalizedArchive=normalizeSeasonalEventArchive(archive,state);',archiveContext);
  assert.equal(archiveContext.normalizedArchive.length,8);
  assert.ok(archiveContext.normalizedArchive[0].claimed.includes('family'));
  assert.match(read('sw.js'), /hayah-shell-v59/);
});


test('السوشيال ميديا تحفظ صدى الجمهور وتدعم مسار SoundCloud دون كسر حفظ v1', () => {
  assert.match(app, /function normalizeSocialFeed\(raw\)/);
  assert.match(app, /data\.socialFeed=normalizeSocialFeed\(data\.socialFeed\)/);
  assert.match(app, /socialFeed:\[\]/);
  assert.match(app, /function socialAudienceFeedMenu\(platformId\)/);
  assert.match(app, /function socialPostDetailMenu\(postId\)/);
  assert.match(app, /function offerSoundCloudTrackToLabel\(platformId='soundcloud'\)/);
  assert.match(app, /نشر مقطع صوتي/);
  assert.match(app, /التعاون مع فنان/);
  assert.match(app, /choice\('💬','صدى الجمهور'/);
  assert.match(app, /state\.socialFeed=normalizeSocialFeed\(\[\.\.\.\(Array\.isArray\(state\.socialFeed\)\?state\.socialFeed:\[\]\),post\]\)/);
  assert.match(app, /const KEY = 'hekayat_hayah_save_v1';/);
  assert.match(app, /return \{version:1,lifeId:/);

  const normalizer = functionSource('normalizeSocialFeed', 'buildSocialReactions');
  const context = {
    SOCIAL_PLATFORM_CATALOG: [{id:'instagram',title:'Instagram'}]
  };
  vm.runInNewContext(normalizer + "\nglobalThis.normalized=normalizeSocialFeed([{id:'old',platformId:'instagram',title:'منشور قديم',age:22,likes:4,reactions:[{name:'ليلى',text:'جميل',tone:'positive'}]},null,{id:'bad',title:'',reactions:[]}]);", context);
  assert.equal(context.normalized.length, 1);
  assert.equal(context.normalized[0].platformTitle, 'Instagram');
  assert.equal(context.normalized[0].reactions[0].name, 'ليلى');

  const many = Array.from({length:40}, (_,index)=>({id:'p'+index,title:'منشور '+index,platformId:'instagram'}));
  const limitedContext = {SOCIAL_PLATFORM_CATALOG: context.SOCIAL_PLATFORM_CATALOG, input: many};
  vm.runInNewContext(normalizer + "\nglobalThis.limited=normalizeSocialFeed(input);", limitedContext);
  assert.equal(limitedContext.limited.length, 30);
  assert.equal(limitedContext.limited[0].id, 'p10');
  assert.match(read('sw.js'), /hayah-shell-v59/);
});


test('الشريط السفلي والإحصائيات بعرض التطبيق الكامل دون تحريك نصف الشاشة', () => {
  assert.match(css, /#app > \.bottom-dock\{[\s\S]*?transform:none!important/);
  assert.match(css, /#app > \.bottom-dock > \.stats\{[\s\S]*?width:100%!important/);
  assert.match(css, /#app > \.bottom-dock > \.nav\{[\s\S]*?width:100%!important/);
  assert.match(css, /#app > \.feed\{[\s\S]*?min-height:0!important/);
  assert.match(read('sw.js'), /hayah-shell-v59/);
});

test('الواجهة الرئيسية منظمة وتعرض عناوين أحداث الحياة مع الحفاظ على الهوية العربية', () => {
  assert.match(html, /class="story-heading"/);
  assert.match(html, /id="lifeMeta" class="story-year" aria-live="polite"/);
  assert.match(html, /<h1>حكايتك سنة ورا سنة<\/h1>/);
  assert.match(css, /\.story-heading\{/);
  assert.match(css, /\.logtitle\{display:block!important/);
  assert.match(css, /grid-template-columns:repeat\(2,minmax\(0,1fr\)\)!important/);
  assert.match(css, /body\.theme-dark \.story-heading/);
  assert.match(css, /body\.theme-gold \.story-heading/);
});


test('كتالوج القتال يضم 30 حركة أصلية بمعرّفات وخصائص متسقة مع الرتب القديمة', () => {
  const block = app.match(/const combatMoveCatalog=\[([\s\S]*?)\n\];/);
  assert.ok(block, 'combat move catalog should remain data-driven');
  const context = {};
  vm.runInNewContext('globalThis.moves = [' + block[1] + '];', context);
  const moves = Array.from(context.moves);
  const ids = moves.map(move => move.id);
  assert.equal(moves.length, 30, 'the catalog should contain the original 20 plus 10 new moves');
  assert.equal(new Set(ids).size, moves.length, 'every move id must be unique');
  const legacyIds = [
    'quick-jab','high-guard','footwork','counter-read','body-force',
    'clinch-control','iron-guard','flash-step','champion-finish','ring-general',
    'low-kick','pivot-counter','shell-defense','burst-combo','last-round-read',
    'angle-pivot','low-line-kick','shoulder-shell','rhythm-barrage','champion-plan'
  ];
  legacyIds.forEach(id => assert.ok(ids.includes(id), 'legacy move id must remain available: ' + id));
  const newIds = [
    'inside-slip','rear-angle-check','frame-wall','clinch-turn','overhand-arc',
    'tempo-break','body-lock-shift','guard-split','last-minute-shell','champion-angle'
  ];
  newIds.forEach(id => assert.ok(ids.includes(id), 'new move should be registered: ' + id));
  for (const move of moves) {
    assert.ok(['سرعة','قوة','دفاع','تقنية'].includes(move.style), move.id + ' needs a known style');
    assert.ok(['سرعة','قوة','دفاع','تقنية'].includes(move.strongAgainst), move.id + ' needs a valid counter style');
    assert.ok(Number.isFinite(move.power) && move.power >= 25 && move.power <= 75, move.id + ' power should stay balanced');
    assert.ok(Number.isInteger(move.rank) && move.rank >= 0 && move.rank <= 4, move.id + ' rank should be supported');
    assert.ok(Number.isFinite(move.cost) && move.cost >= 0, move.id + ' cost should be valid');
    assert.ok(typeof move.title === 'string' && move.title.length > 0 && typeof move.desc === 'string' && move.desc.length > 0);
  }
  assert.match(app, /const KEY = 'hekayat_hayah_save_v1';/);
  assert.match(app, /return \{version:1,lifeId:/);
});

test('مؤشرات الإحصاءات تعرض قيمة مفهومة لقارئات الشاشة وتتحدث مع الحالة', () => {
  const panel = { innerHTML: '' };
  const context = {
    state: {
      status: 'حي',
      age: 34,
      stats: { happiness: 67, health: 52, smart: 88, looks: 19 },
      boostUsedAge: null
    },
    uiSettings: { boosts: true },
    clamp: (value, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(Number(value) || 0))),
    $: id => id === 'statsPanel' ? panel : null
  };
  const source = functionSource('renderStats', 'logEntrySignature');
  vm.runInNewContext(source + '\nrenderStats();', context);
  assert.equal((panel.innerHTML.match(/role="progressbar"/g) || []).length, 4,
    'the four core life stats should expose progressbar semantics');
  for (const [label, value] of [['السعادة', 67], ['الصحة', 52], ['الذكاء', 88], ['المظهر', 19]]) {
    assert.ok(panel.innerHTML.includes('aria-label="' + label + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + value + '" aria-valuetext="' + value + ' من 100"'),
      label + ' should expose its current value and range to assistive technology');
  }
  context.state.stats.happiness = 27;
  vm.runInNewContext(source + '\nrenderStats();', context);
  assert.ok(panel.innerHTML.includes('aria-valuenow="27" aria-valuetext="27 من 100"'),
    'accessible values should update after a stat change');
});


test('إتقان الحركات يتدرج بالاستخدام ويُطبع بأمان في الحفظ القديم', () => {
  const catalogStart = app.indexOf('const combatMoveCatalog=[');
  const catalogEnd = app.indexOf('];' + String.fromCharCode(10) + 'const combatTacticCatalog=', catalogStart);
  assert.ok(catalogStart >= 0 && catalogEnd > catalogStart, 'combat move catalog should be available to the mastery normalizer');
  const catalogSource = app.slice(catalogStart + 'const combatMoveCatalog=['.length, catalogEnd);
  const helpersStart = app.indexOf('const combatMoveMasteryThresholds=');
  const helpersEnd = app.indexOf('function normalizePendingCombatBout(', helpersStart);
  assert.ok(helpersStart >= 0 && helpersEnd > helpersStart, 'move mastery helpers should remain grouped');
  const helperSource = app.slice(helpersStart, helpersEnd);
  const careerSource = functionSource('ensureCombatCareer', 'combatRankName');
  const context = {
    state: { combatCareer: { movesKnown: ['quick-jab', 'high-guard'],
      moveMastery: { 'quick-jab': 8, 'high-guard': -3, 'removed-move': 99 } } },
    clamp: (value, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(Number(value) || 0))),
    normalizeCombatCommunity: () => [],
    normalizePendingCombatBout: value => value
  };
  vm.runInNewContext('const combatMoveCatalog=[' + catalogSource + '];' + String.fromCharCode(10) + helperSource + String.fromCharCode(10) +
    careerSource + String.fromCharCode(10) + 'globalThis.career=ensureCombatCareer();' +
    'globalThis.levels=[0,2,3,7,8,14,15,24,25,100].map(combatMoveMasteryLevel);' +
    'globalThis.bonuses=[0,3,8,15,25,100].map(combatMoveMasteryBonus);', context);
  assert.deepEqual(Array.from(context.levels), [0,0,1,1,2,2,3,3,4,4]);
  assert.deepEqual(Array.from(context.bonuses), [0,2,4,6,8,8]);
  assert.deepEqual(JSON.parse(JSON.stringify(context.career.moveMastery)), { 'quick-jab': 8 },
    'unknown moves and invalid counters should be discarded while valid mastery survives');
  assert.ok(app.includes('moveMastery:{}'), 'new fighter careers should initialize an empty mastery map');
  assert.ok(app.includes('c.moveMastery=normalizeCombatMoveMastery(c.moveMastery,c.movesKnown)'),
    'legacy fighter saves should receive a normalized optional mastery map');
  assert.ok(app.includes('masteryUses:nextMasteryUses'),
    'round history should retain the mastery level used during each saved round');
  assert.ok(app.includes("achievement('إتقان حركة قتالية:"),
    'mastery milestones should become part of the character story');
  assert.match(read('sw.js'), /hayah-shell-v59/);
});
test('شاشة نهاية الحياة تعلن نفسها كحوار وتحصر التنقل بلوحة المفاتيح', () => {
  const death = functionSource('death', 'startNew');
  assert.match(death, /id="deathDialog" role="dialog" aria-modal="true" aria-labelledby="deathDialogTitle" aria-describedby="deathDialogDescription" tabindex="-1"/);
  assert.match(death, /id="deathDialogTitle" role="heading" aria-level="1"/);
  assert.match(death, /id="deathDialogDescription"/);
  assert.match(death, /activeDialogKeyHandler=event=>\{[\s\S]*?event\.key!=='Tab'/);
  assert.match(death, /document\.activeElement===dialog/);
  assert.match(death, /dialog\.focus/);
});
