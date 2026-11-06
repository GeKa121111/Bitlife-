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

const context = vm.createContext({});
vm.runInContext([
  functionSource('normalizeCombatTitleDefenseHistory'),
  functionSource('recordCombatTitleDefense'),
  'globalThis.api = { normalize: normalizeCombatTitleDefenseHistory, record: recordCombatTitleDefense };'
].join(String.fromCharCode(10)), context, { filename: 'combat-title-defense.test.cjs' });
const api = context.api;

test('الحفظ القديم لبطل العالم بلا سجل دفاعات يحصل على مصفوفة آمنة ويمكنه الدفاع عن اللقب', () => {
  const legacy = { champion: true };
  legacy.titleDefenseHistory = api.normalize(legacy.titleDefenseHistory);
  assert.deepEqual(JSON.parse(JSON.stringify(legacy.titleDefenseHistory)), []);

  const record = api.record(legacy, { name: 'منافس قديم' }, 42, 24, true);
  assert.equal(record.result, 'defended');
  assert.equal(legacy.champion, true);
  assert.equal(legacy.titleDefenseHistory.length, 1);
});

test('الفوز في نزال الدوري يسجل دفاعًا ناجحًا ويحافظ على اللقب', () => {
  const career = { champion: true, leagueWins: 8, leaguePoints: 210, titleDefenseHistory: [] };
  const record = api.record(career, { name: 'سيف كمال' }, 31, 13, true);

  assert.equal(record.result, 'defended');
  assert.equal(record.opponent, 'سيف كمال');
  assert.equal(record.leagueWins, 8);
  assert.equal(record.leaguePoints, 210);
  assert.equal(career.champion, true);
});

test('الخسارة في نزال الدوري تسجل فقدان اللقب دون حذف تاريخ الدفاعات السابقة', () => {
  const career = {
    champion: true,
    leagueWins: 11,
    leaguePoints: 225,
    titleDefenseHistory: [{ age: 30, year: 12, opponent: 'آدم منصور', result: 'defended' }]
  };
  const record = api.record(career, { name: 'مالك شريف' }, 32, 14, false);

  assert.equal(record.result, 'lost');
  assert.equal(career.champion, false);
  assert.equal(career.titleDefenseHistory.length, 2);
  assert.equal(career.titleDefenseHistory[0].result, 'defended');
  assert.equal(career.titleDefenseHistory[1].result, 'lost');
});

test('تطبيع سجل الدفاعات يرفض السجلات التالفة ويقيد الأعمار والسنوات والقيم', () => {
  const normalized = api.normalize([
    null,
    { age: 20, year: 1, opponent: 'غير صالح', result: 'unknown' },
    { age: 999, year: -8, opponent: 'منافس حدود', result: 'defended', leagueWins: -5, leaguePoints: 999999999 }
  ]);

  assert.equal(normalized.length, 1);
  assert.equal(normalized[0].age, 150);
  assert.equal(normalized[0].year, 0);
  assert.equal(normalized[0].leagueWins, 0);
  assert.equal(normalized[0].leaguePoints, 100000000);
});

test('سجل الدفاعات يحتفظ بآخر 50 نتيجة فقط', () => {
  const records = Array.from({ length: 52 }, (_, index) => ({
    age: 18 + index,
    year: index,
    opponent: 'منافس ' + index,
    result: index % 2 ? 'defended' : 'lost'
  }));
  const normalized = api.normalize(records);

  assert.equal(normalized.length, 50);
  assert.equal(normalized[0].opponent, 'منافس 2');
  assert.equal(normalized.at(-1).opponent, 'منافس 51');
});

test('لا يمكن تسجيل دفاع لقب لشخصية لا تحمل اللقب', () => {
  const career = { champion: false, titleDefenseHistory: [] };
  assert.equal(api.record(career, { name: 'منافس' }, 30, 10, true), null);
  assert.equal(career.titleDefenseHistory.length, 0);
});

test('محرك النزال يلتقط حالة البطل قبل النتيجة ولا يسجل الدفاع إلا لمسار الدوري', () => {
  const source = functionSource('resolveCombatBout');
  const capture = source.indexOf("const defendingTitle=mode==='league'&&c.champion===true;");
  const outcome = source.indexOf('if(won){');
  const rank = source.indexOf('c.rank=c.leaguePoints>=150?4:c.leaguePoints>=100?3:c.leaguePoints>=60?2:c.leaguePoints>=25?1:0;\n let titleDefenseResult=null;');
  const record = source.indexOf('recordCombatTitleDefense(c,opponent,state.age,state.yearCount,won)');
  assert.ok(capture >= 0 && capture < outcome);
  assert.ok(rank > outcome && record > rank);
  assert.match(source, /won,titleDefenseResult,probability,earnings/);
});

test('الحفظ القديم يهيئ سجل الدفاع دون تغيير إصدار الحفظ، وتظهر النتائج في سجل الألقاب', () => {
  const createSource = functionSource('createCombatCareer');
  const ensureSource = functionSource('ensureCombatCareer');
  const menuSource = functionSource('combatChampionshipHistory');

  assert.match(createSource, /titleDefenseHistory:\[\]/);
  assert.match(ensureSource, /titleDefenseHistory:\[\]/);
  assert.match(ensureSource, /c\.titleDefenseHistory=normalizeCombatTitleDefenseHistory\(c\.titleDefenseHistory\)/);
  assert.match(menuSource, /الدفاعات الناجحة/);
  assert.match(menuSource, /خسائر اللقب/);
  assert.match(app, /const KEY = 'hekayat_hayah_save_v1';/);
  assert.match(app, /return \{version:1,lifeId:/);
});
