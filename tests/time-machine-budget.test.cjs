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
  const result = fit(history, 60, 16);

  assert.deepEqual(Array.from(result.snapshots), history.slice(-2));
  assert.equal(result.usedChars, 16);
  assert.equal(result.skippedNewest, false);
  assert.equal(result.removedCount, 2);
});

test('إذا تجاوزت نقطة واحدة الحد، تُتخطى مع الاحتفاظ بالنقاط الأقدم الصالحة', () => {
  const history = ['older-1', 'older-2', 'x'.repeat(20)];
  const result = fit(history, 8, 12);

  assert.deepEqual(Array.from(result.snapshots), ['older-2']);
  assert.equal(result.skippedNewest, true);
  assert.equal(result.usedChars, 7);
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
