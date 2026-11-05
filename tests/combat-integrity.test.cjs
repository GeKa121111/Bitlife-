'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

function functionSource(name) {
  const start = app.indexOf('function ' + name + '(');
  assert.notEqual(start, -1, 'expected function ' + name);
  const end = app.indexOf('\nfunction ', start + 1);
  assert.notEqual(end, -1, 'expected a following function after ' + name);
  return app.slice(start, end);
}

const calls = { closed: 0, notices: [], logs: [], saves: 0, renders: 0, menus: [], modals: [] };
const context = vm.createContext({
  state: {
    yearCount: 3,
    age: 28,
    bank: 5000,
    stats: { smart: 50, health: 90 },
    specialCareer: { id: 'fighter', level: 1, record: {} },
    prison: null
  },
  career: null,
  validState: () => true,
  ensureCombatCareer() { return context.career; },
  closeModal() { calls.closed += 1; },
  info(...args) { calls.notices.push(args); },
  log(...args) { calls.logs.push(args); },
  save() { calls.saves += 1; },
  render() { calls.renders += 1; },
  combatIntegrityMenu() { calls.menus.push('integrity'); },
  combatCareerMenu() { calls.menus.push('career'); },
  combatBoutRoundMenu() { calls.menus.push('bout'); },
  specialCareers() { calls.menus.push('special'); },
  cash(value) { return String(value); },
  choice(...args) { return { icon: args[0], title: args[1], desc: args[2], callback: args[3], cost: args[4] }; },
  modal(...args) { calls.modals.push(args); },
  pick(items) { return items[0]; },
  combatOpponentTypes: [{ style: 'قوة', weakTo: 'سرعة', emoji: '🥊' }],
  combatOpponentNames: ['خصم الاختبار'],
  clamp(value, min = 0, max = 100) { return Math.max(min, Math.min(max, Math.round(value))); }
});
context.Math = Object.create(Math);
context.Math.random = () => 0.99;

function makeCareer(overrides = {}) {
  return Object.assign({
    retired: false,
    pendingBout: null,
    injuryYears: 0,
    injury: 0,
    energy: 100,
    rank: 2,
    leaguePoints: 80,
    streetWins: 2,
    streetCred: 30,
    community: [],
    sponsorship: { id: 'sponsor-a' },
    fanbase: 10000,
    integrity: 100,
    dopingRisk: 0,
    dopingSuspensionYears: 0,
    dopingViolations: 0,
    dopingBoostAvailable: false,
    dopingUsedYear: -1,
    lastDopingTestYear: -1,
    lastIntegrityRecoveryYear: -1,
    gamePlan: 'balanced'
  }, overrides);
}

const names = [
  'normalizeCombatIntegrity',
  'combatDrugTestProbability',
  'combatDrugTestPositive',
  'applyCombatDrugTestSanction',
  'advanceCombatSuspensionYear',
  'combatIntegrityBoutBonus',
  'combatBoutAccessGuard',
  'normalizePendingCombatBout',
  'combatIntegrityMenu',
  'useCombatForbiddenBooster',
  'recoverCombatIntegrity',
  'combatCareerMenu',
  'resolveCombatRound',
  'startCombatBout'
];
vm.runInContext(
  names.map(functionSource).join(String.fromCharCode(10)) +
  '\nglobalThis.api = {' +
  ' normalize: normalizeCombatIntegrity,' +
  ' probability: combatDrugTestProbability,' +
  ' positive: combatDrugTestPositive,' +
  ' sanction: applyCombatDrugTestSanction,' +
  ' advanceSuspension: advanceCombatSuspensionYear,' +
  ' boutBonus: combatIntegrityBoutBonus,' +
  ' accessGuard: combatBoutAccessGuard,' +
  ' normalizeBout: normalizePendingCombatBout,' +
  ' menu: combatIntegrityMenu,' +
  ' useBooster: useCombatForbiddenBooster,' +
  ' recover: recoverCombatIntegrity,' +
  ' careerMenu: combatCareerMenu,' +
  ' resolveRound: resolveCombatRound,' +
  ' startBout: startCombatBout' +
  '};',
  context,
  { filename: 'combat-integrity.test.cjs' }
);

test('الحفظ القديم يحصل على قيم نزاهة افتراضية ولا يتغير إصدار الحفظ', () => {
  context.state.yearCount = 3;
  const legacy = {};
  context.api.normalize(legacy);
  assert.equal(legacy.integrity, 100);
  assert.equal(legacy.dopingRisk, 0);
  assert.equal(legacy.dopingSuspensionYears, 0);
  assert.equal(legacy.dopingViolations, 0);
  assert.equal(legacy.dopingBoostAvailable, false);
  assert.equal(legacy.dopingUsedYear, -1);
  assert.equal(legacy.lastDopingTestYear, -1);
  assert.equal(legacy.lastIntegrityRecoveryYear, -1);
  assert.match(app, /const KEY = 'hekayat_hayah_save_v1';/);
  assert.match(app, /return \{version:1,lifeId:/);
});

test('تطبيع النزاهة يحد القيم غير الصالحة ويحافظ على السنوات ضمن عمر الحفظ الحالي', () => {
  context.state.yearCount = 4;
  const career = {
    integrity: 140,
    dopingRisk: -15,
    dopingSuspensionYears: 20,
    dopingViolations: 5000,
    dopingBoostAvailable: 1,
    dopingUsedYear: 99,
    lastDopingTestYear: -99,
    lastIntegrityRecoveryYear: 2.9
  };
  context.api.normalize(career);
  assert.equal(career.integrity, 100);
  assert.equal(career.dopingRisk, 0);
  assert.equal(career.dopingSuspensionYears, 5);
  assert.equal(career.dopingViolations, 999);
  assert.equal(career.dopingBoostAvailable, false);
  assert.equal(career.dopingUsedYear, 4);
  assert.equal(career.lastDopingTestYear, -1);
  assert.equal(career.lastIntegrityRecoveryYear, 2);
});

test('خطر الفحص يزيد مع المخاطرة وينخفض مع ارتفاع الذكاء', () => {
  context.state.stats.smart = 50;
  const lowRisk = context.api.probability({ dopingRisk: 20 });
  const highRisk = context.api.probability({ dopingRisk: 80 });
  assert.ok(highRisk > lowRisk);
  context.state.stats.smart = 100;
  const higherSmart = context.api.probability({ dopingRisk: 80 });
  context.state.stats.smart = 0;
  const lowerSmart = context.api.probability({ dopingRisk: 80 });
  assert.ok(higherSmart < lowerSmart);
  assert.ok(higherSmart >= 0.05 && higherSmart <= 0.75);
});

test('نتيجة فحص ما قبل النزال حتمية عند تمرير قيمة عينة معلومة', () => {
  context.state.stats.smart = 0;
  const career = { dopingRisk: 100 };
  assert.equal(context.api.positive(career, 0), true);
  assert.equal(context.api.positive(career, 0.99), false);
  assert.equal(context.api.positive(career, -0.1), false);
});

test('المخالفة تفرض إيقافًا وتخصم نقاطًا وتنهي الرعاية دون حذف سجل الألقاب', () => {
  const career = makeCareer({
    integrity: 70,
    dopingRisk: 60,
    dopingBoostAvailable: true,
    dopingViolations: 0,
    dopingSuspensionYears: 0,
    leaguePoints: 80,
    rank: 2,
    champion: true,
    championshipHistory: [{ title: 'لقب محفوظ' }]
  });
  const result = context.api.sanction(career);
  assert.equal(career.dopingViolations, 1);
  assert.equal(career.dopingSuspensionYears, 2);
  assert.equal(career.integrity, 40);
  assert.equal(career.dopingRisk, 0);
  assert.equal(career.dopingBoostAvailable, false);
  assert.equal(career.leaguePoints, 60);
  assert.equal(career.rank, 2);
  assert.equal(career.sponsorship, null);
  assert.equal(career.fanbase, 8500);
  assert.equal(career.champion, true);
  assert.equal(career.championshipHistory.length, 1);
  assert.equal(result.pointsLost, 20);
});

test('الإيقاف ينقص سنة واحدة مع كل تقدم بالعمر ولا يتغير بعد الاعتزال', () => {
  const career = { retired: false, dopingSuspensionYears: 2 };
  assert.equal(context.api.advanceSuspension(career), 1);
  assert.equal(context.api.advanceSuspension(career), 0);
  const retired = { retired: true, dopingSuspensionYears: 2 };
  assert.equal(context.api.advanceSuspension(retired), 0);
  assert.equal(retired.dopingSuspensionYears, 2);
});

test('مكافأة المنشط لا تُطبق إلا على نزال اجتاز فحصه', () => {
  assert.equal(context.api.boutBonus({ integrityBoost: true }), 5);
  assert.equal(context.api.boutBonus({ integrityBoost: false }), 0);
  assert.equal(context.api.boutBonus({}), 0);
});

test('النزال المعلّق يحفظ مكافأة النزاهة ويطبّع الحيوات القديمة إلى false', () => {
  const base = {
    mode: 'street',
    opponent: { name: 'خصم', style: 'قوة', weakTo: 'سرعة', rating: 40 },
    round: 1,
    startedAge: 28,
    roundHistory: []
  };
  assert.equal(context.api.normalizeBout(base).integrityBoost, false);
  assert.equal(context.api.normalizeBout({ ...base, integrityBoost: true }).integrityBoost, true);
});

test('قائمة النزاهة تعرض الحالة والخيارات العربية الأصلية', () => {
  context.career = makeCareer({ integrity: 88, dopingRisk: 35 });
  calls.modals.length = 0;
  context.api.menu();
  const modal = calls.modals.at(-1);
  assert.equal(modal[1], 'النزاهة الرياضية');
  assert.match(modal[2], /النزاهة 88%/);
  assert.ok(modal[3].some(item => item.title === 'استخدام منشط غير مصرح به'));
  assert.ok(modal[3].some(item => item.title === 'جلسة استعادة الانضباط'));
});

test('استخدام المنشط يخصم التكلفة ويرفع الخطر ويُسمح به مرة واحدة في السنة', () => {
  context.career = makeCareer();
  context.state.bank = 5000;
  context.state.yearCount = 3;
  context.state.prison = null;
  context.api.useBooster();
  assert.equal(context.state.bank, 2500);
  assert.equal(context.career.dopingBoostAvailable, true);
  assert.equal(context.career.dopingRisk, 35);
  assert.equal(context.career.integrity, 88);
  assert.equal(context.career.dopingUsedYear, 3);
  context.api.useBooster();
  assert.equal(context.state.bank, 2500);
});

test('جلسة الانضباط تخفض الخطر وتلغي المكافأة وتُستخدم مرة واحدة سنويًا', () => {
  context.career = makeCareer({
    integrity: 50,
    dopingRisk: 50,
    dopingBoostAvailable: true,
    lastIntegrityRecoveryYear: -1
  });
  context.state.bank = 2000;
  context.state.yearCount = 3;
  context.api.recover();
  assert.equal(context.state.bank, 1000);
  assert.equal(context.career.integrity, 56);
  assert.equal(context.career.dopingRisk, 32);
  assert.equal(context.career.dopingBoostAvailable, false);
  assert.equal(context.career.lastIntegrityRecoveryYear, 3);
  context.api.recover();
  assert.equal(context.state.bank, 1000);
});

test('السجن يمنع شراء المنشط أو جلسة الانضباط دون خصم الرصيد', () => {
  context.career = makeCareer();
  context.state.bank = 5000;
  context.state.prison = { years: 1 };
  context.api.useBooster();
  context.api.recover();
  assert.equal(context.state.bank, 5000);
  assert.equal(context.career.dopingBoostAvailable, false);
  context.state.prison = null;
});

test('الإيقاف يمنع بدء النزال قبل استئناف أي مواجهة محفوظة', () => {
  context.career = makeCareer({ dopingSuspensionYears: 2, pendingBout: null });
  context.state.prison = null;
  context.state.bank = 5000;
  const before = calls.logs.length;
  context.api.startBout('street');
  assert.equal(context.career.pendingBout, null);
  assert.ok(calls.notices.some(entry => entry[1] === 'إيقاف رياضي'));
  assert.equal(calls.logs.length, before);
});

test('السجن والإيقاف يمنعان استئناف نزال محفوظ قبل فتح الجولة', () => {
  const pending = { mode: 'street', round: 2 };
  context.career = makeCareer({ pendingBout: pending, dopingSuspensionYears: 0 });
  context.state.prison = { years: 1 };
  const beforeBoutMenus = calls.menus.filter(item => item === 'bout').length;
  context.api.startBout('street');
  assert.equal(calls.menus.filter(item => item === 'bout').length, beforeBoutMenus);
  assert.ok(calls.notices.some(entry => entry[1] === 'المنافسات غير متاحة'));

  context.career = makeCareer({ pendingBout: pending, dopingSuspensionYears: 1 });
  context.state.prison = null;
  const beforeSuspensionMenus = calls.menus.filter(item => item === 'bout').length;
  context.api.startBout('street');
  assert.equal(calls.menus.filter(item => item === 'bout').length, beforeSuspensionMenus);
  assert.ok(calls.notices.some(entry => entry[1] === 'إيقاف رياضي'));
});

test('قائمة المسيرة وحل الجولة المباشر يحترمان حارس السجن والإيقاف', () => {
  const pending = { mode: 'street', round: 2 };
  context.career = makeCareer({ pendingBout: pending, dopingSuspensionYears: 0 });
  context.state.prison = { years: 1 };
  const before = calls.menus.filter(item => item === 'bout').length;
  context.api.careerMenu();
  context.api.resolveRound('quick-jab');
  assert.equal(calls.menus.filter(item => item === 'bout').length, before);
  assert.ok(calls.notices.some(entry => entry[1] === 'المنافسات غير متاحة'));

  context.career = makeCareer({ pendingBout: pending, dopingSuspensionYears: 1 });
  context.state.prison = null;
  const beforeSuspension = calls.menus.filter(item => item === 'bout').length;
  context.api.careerMenu();
  context.api.resolveRound('quick-jab');
  assert.equal(calls.menus.filter(item => item === 'bout').length, beforeSuspension);
  assert.ok(calls.notices.some(entry => entry[1] === 'إيقاف رياضي'));
  assert.equal(context.api.accessGuard(), true);
});

test('الفحص الإيجابي يوقف النزال قبل خصم رسوم الدوري أو إنشاء مواجهة', () => {
  context.career = makeCareer({
    dopingBoostAvailable: true,
    dopingRisk: 100,
    dopingSuspensionYears: 0,
    leaguePoints: 80
  });
  context.state.stats.smart = 0;
  context.state.bank = 5000;
  context.state.prison = null;
  context.Math.random = () => 0;
  context.api.startBout('league');
  assert.equal(context.state.bank, 5000);
  assert.equal(context.career.pendingBout, null);
  assert.equal(context.career.dopingSuspensionYears, 2);
  assert.equal(context.career.dopingViolations, 1);
  assert.equal(context.career.dopingBoostAvailable, false);
});

test('الفحص السلبي يستهلك المكافأة ويحفظها داخل النزال لاستكماله بعد التحميل', () => {
  context.career = makeCareer({
    dopingBoostAvailable: true,
    dopingRisk: 20,
    dopingSuspensionYears: 0
  });
  context.state.stats.smart = 100;
  context.state.bank = 5000;
  context.state.prison = null;
  context.Math.random = () => 0.99;
  context.api.startBout('street');
  assert.ok(context.career.pendingBout);
  assert.equal(context.career.pendingBout.integrityBoost, true);
  assert.equal(context.career.dopingBoostAvailable, false);
  assert.equal(context.career.dopingRisk, 15);
});

test('شاشة الجولة نفسها تمر عبر حارس السجن والإيقاف قبل قراءة النزال', () => {
  assert.match(app, /function combatBoutRoundMenu\\(\\)\\{\\s*if\\(combatBoutAccessGuard\\(\\)\\)return;/);
});

test('محرك الجولة يسجل المكافأة في نقاط الجولة وسجل المواجهة', () => {
  assert.match(app, /const integrityBoostBonus=combatIntegrityBoutBonus\(session\)/);
  assert.match(app, /planEffect\.scoreBonus\+integrityBoostBonus/);
  assert.match(app, /masteryUses:nextMasteryUses,integrityBoostBonus/);
  assert.match(app, /integrityBoost:session&&session\.integrityBoost===true/);
});
