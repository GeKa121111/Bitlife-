'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

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

test('تحميل الحفظ القديم واستيراده يطبّعان البيانات الناقصة بدل كسر اللعبة', () => {
  assert.match(app, /function normalizeCoreState\(data\)/);
  assert.match(app, /const statDefaults=\{happiness:65,health:80,smart:40,looks:45\}/);
  assert.match(app, /data\.place=\{\.\.\.fallbackPlace,\.\.\.rawPlace\}/);
  assert.match(app, /function load\(\)[\s\S]*?normalizeCoreState\(x\)/);
  assert.match(app, /function importSave\(\)[\s\S]*?normalizeCoreState\(data\)/);
  assert.match(app, /data\.version!==1/);
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
  assert.match(worker, /const CACHE_NAME = 'hayah-shell-v9'/);
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
  assert.match(read('sw.js'), /hayah-shell-v9/);
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
  assert.match(app, /raw\.theme==='dark'\|\|raw\.theme==='light'\|\|raw\.theme==='gold'/);
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
