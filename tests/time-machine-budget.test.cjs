'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

function functionSource(name, nextName) {
  const start = app.indexOf('function ' + name + '(');
  assert.notEqual(start, -1, 'expected function ' + name);
  const end = app.indexOf('function ' + nextName + '(', start + 1);
  assert.notEqual(end, -1, 'expected following function ' + nextName);
  return app.slice(start, end);
}

const helperSource = functionSource('fitTimeMachineSnapshots', 'ageUp');
const saveSource = functionSource('save', 'normalizeHeirlooms');
const ageUpSource = functionSource('ageUp', 'age18Choice');
const menuSource = functionSource('timeMachineMenu', 'restoreRewindStorageValue');
const context = {};
vm.runInNewContext(helperSource + '\nglobalThis.fitTimeMachineSnapshots = fitTimeMachineSnapshots;', context);
const fit = context.fitTimeMachineSnapshots;

test('الحد الأساسي يحتفظ بأحدث 8 نقاط، والذاكرة الموسعة لا تتجاوز 60', () => {
  const history = Array.from({ length: 72 }, (_, index) => 'snapshot-' + index);
  const basic = fit(history, 8, 10000);
  const expanded = fit(history, 60, 10000);

  assert.deepEqual(Array.from(basic.snapshots), history.slice(-8));
  assert.deepEqual(Array.from(expanded.snapshots), history.slice(-60));
  assert.equal(basic.skippedNewest, false);
  assert.equal(expanded.removedCount, 12);
});

test('ميزانية الحجم تقلّص النقاط الأقدم وتحافظ على أحدث سلسلة متصلة', () => {
  const history = ['old-0000', 'old-1111', 'new-2222', 'new-3333'];
  const newest = history.slice(-2);
  const budget = JSON.stringify(newest).length;
  const result = fit(history, 60, budget);

  assert.deepEqual(Array.from(result.snapshots), newest);
  assert.equal(result.usedChars, budget);
  assert.equal(JSON.stringify(result.snapshots).length, budget);
  assert.equal(result.skippedNewest, false);
  assert.equal(result.removedCount, 2);
});


test('ميزانية التخزين تحسب JSON المتداخل بما فيه علامات الاقتباس والشرطة العكسية', () => {
  const escapedSnapshot = '{"name":"مريم","note":"مسار\\\\ملف"}';
  const newestSnapshot = 'نقطة حديثة';
  const rawLength = escapedSnapshot.length + newestSnapshot.length;
  const budget = rawLength + 1;
  const result = fit([escapedSnapshot, newestSnapshot], 8, budget);

  assert.deepEqual(Array.from(result.snapshots), [newestSnapshot]);
  assert.equal(result.usedChars, JSON.stringify([newestSnapshot]).length);
  assert.ok(JSON.stringify(result.snapshots).length <= budget);
  assert.ok(JSON.stringify([escapedSnapshot, newestSnapshot]).length > budget,
    'the escaped JSON representation must be larger than the raw character sum');
});

test('إذا تجاوزت نقطة واحدة الحد، تُتخطى مع الاحتفاظ بالنقاط الأقدم الصالحة', () => {
  const history = ['older-1', 'older-2', 'x'.repeat(20)];
  const result = fit(history, 8, 12);

  assert.deepEqual(Array.from(result.snapshots), ['older-2']);
  assert.equal(result.skippedNewest, true);
  assert.equal(result.usedChars, JSON.stringify(['older-2']).length);
});

test('المدخلات القديمة غير النصية لا تكسر السجل ولا يتم تعديل المصفوفة الأصلية', () => {
  const history = ['snapshot-a', null, 'snapshot-b', {}, ''];
  const original = history.slice();
  const result = fit(history, 8, 100);

  assert.deepEqual(Array.from(result.snapshots), ['snapshot-a', 'snapshot-b']);
  assert.deepEqual(history, original);
});

test('التقدم بالعمر يطبق ميزانية التخزين، والواجهة تعرض العدد الفعلي وحد التخزين', () => {
  assert.match(ageUpSource, /fitTimeMachineSnapshots\(state\.timeMachineSnapshots,historyLimit\)/);
  assert.match(ageUpSource, /if\(boundedHistory\.skippedNewest\)flash\(/);
  assert.match(menuSource, /المتاح حاليًا '\+history\.length\+' نقطة/);
  assert.match(menuSource, /الحد الآمن التقريبي/);
  assert.match(app, /timeMachineSnapshots:\[\]/,
    'legacy v1 lives should continue to initialize with an empty optional rewind history');
  assert.match(app, /const KEY = 'hekayat_hayah_save_v1';/);
  assert.match(app, /const BACKUP_KEY = 'hekayat_hayah_save_backup_v1';/);
});


test('نسخة الحفظ الاحتياطية القديمة تُقلّص سجل الرجوع قبل كتابتها دون تغيير بقية الحياة', () => {
  const oldHistory = Array.from({ length: 8 }, (_, index) =>
    JSON.stringify({ age: index + 1, payload: 'x'.repeat(50000) }));
  const previous = {
    version: 1,
    lifeId: 'legacy-life',
    name: 'مريم',
    age: 41,
    bank: 125000,
    marker: { preserve: true },
    timeMachineSnapshots: oldHistory
  };
  const current = {
    version: 1,
    lifeId: 'legacy-life',
    name: 'مريم',
    age: 42,
    bank: 130000,
    timeMachineSnapshots: ['current-snapshot']
  };
  const values = new Map([['life-save', JSON.stringify(previous)]]);
  const storage = {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); }
  };
  const context = {
    state: current,
    KEY: 'life-save',
    BACKUP_KEY: 'life-backup',
    localStorage: storage,
    isValidSaveData(value) {
      return !!value && value.version === 1 && typeof value.name === 'string' && Number.isFinite(Number(value.age));
    },
    perkOwned() { return false; },
    $() { return { textContent: '' }; }
  };
  vm.runInNewContext(helperSource + '\n' + saveSource + '\nglobalThis.runSave = save;', context);

  assert.equal(context.runSave(), true);
  const backup = JSON.parse(values.get('life-backup'));
  const primary = JSON.parse(values.get('life-save'));
  assert.equal(backup.age, 41);
  assert.equal(backup.bank, 125000);
  assert.deepEqual(backup.marker, { preserve: true });
  assert.ok(JSON.stringify(backup.timeMachineSnapshots).length <= 300000);
  assert.ok(backup.timeMachineSnapshots.length < oldHistory.length);
  assert.equal(primary.age, 42);
  assert.deepEqual(primary.timeMachineSnapshots, ['current-snapshot']);
});


test('الحد الأدنى للميزانية يغطي تمثيل المصفوفة الفارغة دون تجاوزه', () => {
  const result = fit([], 8, 1);

  assert.deepEqual(Array.from(result.snapshots), []);
  assert.equal(result.usedChars, 2);
  assert.equal(JSON.stringify(result.snapshots).length, 2);
});
