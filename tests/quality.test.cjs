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
  assert.match(worker, /const CACHE_NAME = 'hayah-shell-v31'/);
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
  assert.match(read('sw.js'), /hayah-shell-v31/);
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
  assert.match(html, /id="adSlot"/);
  assert.match(html, /id="closeAdSlot"/);
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
  assert.match(app, /section\('Parents'\)/);
  assert.match(app, /section\('Premium Activities'\)/);
  assert.match(app, /section\('الأصول المميزة'\)/);
  assert.match(app, /id="majorSelect"/);
  assert.match(app, /function startDrivingTest\(\)/);
  assert.match(app, /function finishDrivingTest\(passed\)/);
  assert.match(app, /auraRing:\{cost:32000,title:'خاتم الهالة'\}/);
  assert.match(css, /--blue:#075a9b/);
  assert.match(css, /\.drawer-body \.choice\.locked-choice/);
  assert.match(css, /\.agebtn[\s\S]{0,200}border-radius:50%/);
  assert.match(css, /\.ad-slot/);
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
  assert.match(read('sw.js'), /hayah-shell-v31/);
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
  assert.match(read('sw.js'), /hayah-shell-v31/);
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
  assert.match(read('sw.js'), /hayah-shell-v31/);
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
  assert.match(read('sw.js'), /hayah-shell-v31/);
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
  assert.match(read('sw.js'), /hayah-shell-v31/);
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
  assert.match(read('sw.js'), /hayah-shell-v31/);
});

test('استثمار المنشأة رأسمالي منفصل عن صافي الربح والصيانة السنوية', () => {
  const annualSimulation = functionSource('simulateBusinessEntityYear', 'advanceAge');
  assert.match(annualSimulation, /const costs=operatingCosts\+staffPayroll\+facilityUpkeep\+productResult\.costs\+productResult\.upfrontCosts/);
  assert.match(annualSimulation, /facilityInvestmentCosts/);
  assert.match(annualSimulation, /state\.bank\+=profit\+productResult\.upfrontCosts/);
});

test('نسب طاقة المنشآت العشرية لا تُقرّب إلى أعداد صحيحة', () => {
  assert.match(app, /Math\.max\(0,Math\.min\(1\.5,Number\.isFinite\(capacityBonus\)\?capacityBonus:catalog\.capacityBonus\)\)/);
  assert.match(app, /facilityCapacityBonus=facilities\.reduce\(\(sum,facility\)=>sum\+Math\.max\(0,Math\.min\(1\.5,Number\(facility\.capacityBonus\)\|\|0\)\),0\)/);
});

test('سوق المنافسة مستقل لكل شركة وثابت خلال السنة ويؤثر في مبيعات المنتجات والتقارير', () => {
  assert.ok(app.includes("function businessMarketSnapshot(business)"));
  assert.ok(app.includes("function businessMarketMenu()"));
  assert.ok(app.includes("marketDemandFactor"));
  assert.ok(app.includes("marketCompetitionFactor"));
  assert.ok(app.includes("marketPriceFactor"));
  assert.ok(app.includes("marketShareFactor"));
  assert.ok(app.includes("marketShareChange"));
  assert.ok(app.includes("marketCompetitorCount"));
  assert.ok(app.includes("choice('📈','تحليل السوق والمنافسين'"));
  assert.ok(app.includes("if(entity.market&&typeof entity.market==='object'&&!Array.isArray(entity.market))"));
  assert.ok(app.includes("return {version:1,lifeId:"));
  assert.ok(read('sw.js').includes("hayah-shell-v31"));
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
  assert.match(read('sw.js'), /hayah-shell-v31/);
});

test('اختبارات Node دون DOM كامل لا تتطلب querySelector من عنصر الجذر', () => {
  assert.match(app, /const dialog=typeof root\.querySelector==='function'\?root\.querySelector\('\[role="dialog"\]'\):null/);
});


test('إعدادات الصوت والاهتزاز اختيارية ومستقلة عن حفظ الحياة', () => {
  assert.ok(app.includes("let uiSettings={theme:'light',textScale:'normal',sound:false,haptics:false}"));
  assert.ok(app.includes("function playUiFeedback(kind='tap')"));
  assert.ok(app.includes("typeof navigator.vibrate==='function'"));
  assert.ok(app.includes("window.AudioContext||window.webkitAudioContext"));
  assert.ok(app.includes("if(typeof raw.sound==='boolean')"));
  assert.ok(app.includes("if(typeof raw.haptics==='boolean')"));
  assert.ok(app.includes("choice(uiSettings.sound?'🔊':'🔇'"));
  assert.ok(app.includes("choice(uiSettings.haptics?'📳':'📴'"));
  assert.ok(app.includes("localStorage.setItem(SETTINGS_KEY,JSON.stringify(uiSettings))"));
  assert.match(read('sw.js'), /hayah-shell-v31/);
});


test('سجل الحياة يضيف الأحداث الجديدة تدريجيًا ويحافظ على عناصر السجل القديمة', () => {
  assert.match(app, /let renderedLogSnapshot=null, renderedFeedElement=null/);
  assert.match(app, /function logEntrySignature\(entry\)/);
  assert.match(app, /function appendLogEntryNode\(feed,entry,lastAge\)/);
  assert.match(app, /if\(renderedFeedElement===feed&&Array\.isArray\(previous\)&&supportsIncrementalDom\)/);
  assert.match(app, /for\(let candidate=359;candidate>0;candidate--\)/);
  assert.match(app, /renderedLogSnapshot=signatures;renderedFeedElement=feed/);
  assert.match(html, /id="lifeFeed"[^>]*aria-relevant="additions" aria-atomic="false"/);
  assert.match(read('sw.js'), /hayah-shell-v31/);
});
