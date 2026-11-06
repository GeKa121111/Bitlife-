'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  inspectBackup,
  MAX_REWIND_SNAPSHOT_CHARS
} = require('../backup-check.js');

function makeLife(overrides = {}) {
  return {
    version: 1,
    name: 'مريم',
    age: 42,
    stats: { happiness: 80, health: 90, smart: 75, looks: 70 },
    log: [],
    family: [],
    place: { country: 'مصر', city: 'القاهرة' },
    ...overrides
  };
}

function makePackage(life) {
  return {
    format: 'hayah-backup',
    backupVersion: 1,
    life,
    cemetery: [],
    settings: {},
    perks: {}
  };
}

test('الحفظ القديم بلا سجل رجوع يظل صالحًا ولا يحصل على تحذير مصطنع', () => {
  const report = inspectBackup(makeLife());

  assert.equal(report.valid, true);
  assert.equal(report.rewindSnapshotCount, 0);
  assert.equal(report.rewindSnapshotChars, 0);
  assert.equal(report.rewindInvalidSnapshotCount, 0);
  assert.equal(report.warnings.some(message => message.includes('سجل الرجوع')), false);
});

test('الفاحص يعرض عدد اللقطات وطول تمثيل JSON الفعلي', () => {
  const snapshots = ['{"age":40,"name":"مريم"}', '{"age":41,"name":"مريم"}'];
  const report = inspectBackup(makeLife({ timeMachineSnapshots: snapshots }));

  assert.equal(report.valid, true);
  assert.equal(report.rewindSnapshotCount, 2);
  assert.equal(report.rewindSnapshotChars, JSON.stringify(snapshots).length);
  assert.equal(report.rewindInvalidSnapshotCount, 0);
});

test('المدخلات الفارغة وغير النصية تُحسب كمستبعدة دون تعديل ملف الحفظ', () => {
  const snapshots = ['{"age":41}', '', null, {}, 7];
  const original = snapshots.slice();
  const report = inspectBackup(makeLife({ timeMachineSnapshots: snapshots }));

  assert.equal(report.valid, true);
  assert.equal(report.rewindSnapshotCount, 1);
  assert.equal(report.rewindInvalidSnapshotCount, 4);
  assert.equal(report.rewindSnapshotChars, JSON.stringify(['{"age":41}']).length);
  assert.ok(report.warnings.some(message => message.includes('مدخل غير نصي أو فارغ')));
  assert.deepEqual(snapshots, original);
});

test('الفاحص يوضح الفرق بين الحد الأساسي والحد الموسع والحد الأقصى', () => {
  const baseOverflow = inspectBackup(makeLife({
    timeMachineSnapshots: Array.from({ length: 9 }, (_, index) => 'snapshot-' + index)
  }));
  assert.ok(baseOverflow.warnings.some(message => message.includes('الحد الأساسي (8)')));

  const absoluteOverflow = inspectBackup(makeLife({
    timeMachineSnapshots: Array.from({ length: 61 }, (_, index) => 'snapshot-' + index)
  }));
  assert.equal(absoluteOverflow.rewindSnapshotCount, 61);
  assert.ok(absoluteOverflow.warnings.some(message => message.includes('الحد الأقصى المدعوم (60 نقطة)')));
});

test('الفاحص يحذر من سجل يتجاوز ميزانية 300000 وحدة نصية', () => {
  const snapshots = ['x'.repeat(MAX_REWIND_SNAPSHOT_CHARS)];
  const report = inspectBackup(makeLife({ timeMachineSnapshots: snapshots }));

  assert.ok(report.rewindSnapshotChars > MAX_REWIND_SNAPSHOT_CHARS);
  assert.ok(report.warnings.some(message => message.includes('ميزانية التخزين البالغة 300000')));
  assert.equal(report.valid, true,
    'a large optional rewind history is a warning, not a reason to reject an otherwise valid save');
});

test('حزمة hayah-backup الكاملة تعرض بيانات الرجوع مثل ملف الحياة المنفرد', () => {
  const life = makeLife({ timeMachineSnapshots: ['{"age":39}', '{"age":40}'] });
  const report = inspectBackup(makePackage(life));

  assert.equal(report.valid, true);
  assert.equal(report.format, 'حزمة حفظ حياة كاملة');
  assert.equal(report.rewindSnapshotCount, 2);
  assert.equal(report.rewindSnapshotChars, JSON.stringify(life.timeMachineSnapshots).length);
  assert.equal(report.cemeteryCount, 0);
});
