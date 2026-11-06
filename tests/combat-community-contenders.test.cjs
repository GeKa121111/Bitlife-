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
  functionSource('combatCommunityContenderScore'),
  functionSource('combatCommunityContenderBoard'),
  'globalThis.api = { score: combatCommunityContenderScore, board: combatCommunityContenderBoard };'
].join(String.fromCharCode(10)), context, { filename: 'combat-community-contenders.test.cjs' });
const api = context.api;

test('مؤشر المواجهة محدود بين صفر ومئة ويستخدم قيمًا آمنة للحفظ الناقص', () => {
  assert.equal(api.score({ rating: 95, momentum: 5, respect: 100, tension: 0 }), 100);
  assert.equal(api.score({ rating: 20, momentum: -5, respect: 0, tension: 100 }), 9);
  assert.equal(api.score({}), 22);
  assert.equal(api.score(null), 0);
});

test('لوحة المنافسين تستبعد المعتزل والمتوفى وتعرض النشطين من الأقوى إلى الأضعف', () => {
  const board = api.board([
    { id: 'steady', name: 'منافس ثابت', rating: 80, momentum: 0, respect: 50, tension: 50 },
    { id: 'rising', name: 'منافس صاعد', rating: 70, momentum: 5, respect: 90, tension: 10 },
    { id: 'retired', name: 'معتزل', rating: 95, momentum: 5, retired: true },
    { id: 'deceased', name: 'متوفى', rating: 95, momentum: 5, deceased: true },
    null,
    { id: 'archived', name: 'معتزل قديم', rating: 90, retired: true, deceased: false }
  ]);
  const simplified = JSON.parse(JSON.stringify(board.map(item => ({
    position: item.position,
    id: item.fighter.id,
    score: item.score
  }))));
  assert.deepEqual(simplified, [
    { position: 1, id: 'rising', score: 81 },
    { position: 2, id: 'steady', score: 80 }
  ]);
});

test('تعادل المؤشر يُحسم بترتيب ثابت حسب التقييم ثم المعرّف', () => {
  const board = api.board([
    { id: 'zeta', rating: 60, momentum: 0, respect: 50, tension: 50 },
    { id: 'alpha', rating: 60, momentum: 0, respect: 50, tension: 50 },
    { id: 'higher-base', rating: 61, momentum: 0, respect: 50, tension: 50 }
  ]);
  assert.deepEqual(
    JSON.parse(JSON.stringify(board.map(item => item.fighter.id))),
    ['higher-base', 'alpha', 'zeta']
  );
  assert.deepEqual(JSON.parse(JSON.stringify(api.board(null))), []);
});

test('مجتمع المقاتلين يفتح لوحة المؤشر وملف المنافس يتيح تحديًا دوريًا بالاسم', () => {
  const communityMenu = functionSource('combatCommunityMenu');
  const contenderMenu = functionSource('combatCommunityContenderMenu');
  const fighterMenu = functionSource('combatCommunityFighterMenu');
  const startBout = functionSource('startCombatBout');

  assert.match(communityMenu, /combatCommunityContenderMenu/);
  assert.match(contenderMenu, /combatCommunityContenderBoard\(c\.community\)/);
  assert.match(contenderMenu, /ليس نقاط دوري رسمية/);
  assert.match(fighterMenu, /مواجهة دوري أمام المنافس/);
  assert.match(fighterMenu, /startCombatBout\('league',fighter\.id\)/);
  assert.match(startBout, /mode==='league'&&\(c\.streetWins<2\|\|c\.streetCred<20\)/);
  assert.match(startBout, /mode==='league'&&state\.bank<1500/);
  assert.match(startBout, /communityFighter\.retired===true/);
  assert.match(startBout, /communityFighter\.deceased===true/);
});

test('لوحة المؤشر مشتقة من سجل المنافسين ولا تضيف حقول حفظ جديدة', () => {
  const createCareer = functionSource('createCombatCareer');
  const ensureCareer = functionSource('ensureCombatCareer');
  assert.doesNotMatch(createCareer, /contender(Board|Score|Ranking|Points)/);
  assert.doesNotMatch(ensureCareer, /contender(Board|Score|Ranking|Points)/);
  assert.match(app, /const KEY = 'hekayat_hayah_save_v1';/);
  assert.match(app, /const BACKUP_FORMAT = 'hayah-backup';/);
});
