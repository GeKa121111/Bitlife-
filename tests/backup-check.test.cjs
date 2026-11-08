'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash, webcrypto } = require('node:crypto');
const {
  inspectBackup,
  sha256Fingerprint,
  normalizeSha256Fingerprint,
  compareSha256Fingerprints,
  MAX_REWIND_SNAPSHOT_CHARS
} = require('../backup-check.js');
const checkerSource = fs.readFileSync(path.join(__dirname, '..', 'backup-check.js'), 'utf8');

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
  assert.equal(report.rewindMalformedSnapshotCount, 0);
  assert.equal(report.rewindUnusableSnapshotCount, 0);
  assert.equal(report.rewindUsableSnapshotCount, 0);
  assert.equal(report.rewindBaseRetainedCount, 0);
  assert.equal(report.rewindExpandedRetainedCount, 0);
  assert.equal(report.rewindBaseRestorableCount, 0);
  assert.equal(report.rewindExpandedRestorableCount, 0);
  assert.equal(report.rewindBaseDroppedCount, 0);
  assert.equal(report.rewindExpandedDroppedCount, 0);
  assert.equal(report.warnings.some(message => message.includes('سجل الرجوع')), false);
});

test('الفاحص يعرض عدد اللقطات وطول تمثيل JSON الفعلي', () => {
  const snapshots = ['{"age":40,"name":"مريم"}', '{"age":41,"name":"مريم"}'];
  const report = inspectBackup(makeLife({ timeMachineSnapshots: snapshots }));

  assert.equal(report.valid, true);
  assert.equal(report.rewindSnapshotCount, 2);
  assert.equal(report.rewindSnapshotChars, JSON.stringify(snapshots).length);
  assert.equal(report.rewindInvalidSnapshotCount, 0);
  assert.equal(report.rewindMalformedSnapshotCount, 0);
  assert.equal(report.rewindUnusableSnapshotCount, 2);
  assert.equal(report.rewindUsableSnapshotCount, 0);
});

test('المدخلات الفارغة وغير النصية تُحسب كمستبعدة دون تعديل ملف الحفظ', () => {
  const snapshots = ['{"age":41}', '', null, {}, 7];
  const original = snapshots.slice();
  const report = inspectBackup(makeLife({ timeMachineSnapshots: snapshots }));

  assert.equal(report.valid, true);
  assert.equal(report.rewindSnapshotCount, 1);
  assert.equal(report.rewindInvalidSnapshotCount, 4);
  assert.equal(report.rewindSnapshotChars, JSON.stringify(['{"age":41}']).length);
  assert.equal(report.rewindUnusableSnapshotCount, 1);
  assert.equal(report.rewindUsableSnapshotCount, 0);
  assert.ok(report.warnings.some(message => message.includes('مدخل فارغ أو غير نصي')));
  assert.deepEqual(snapshots, original);
});

test('الفاحص يوضح الفرق بين الحد الأساسي والحد الموسع والحد الأقصى', () => {
  const baseOverflow = inspectBackup(makeLife({
    timeMachineSnapshots: Array.from({ length: 9 }, (_, index) => 'snapshot-' + index)
  }));
  assert.ok(baseOverflow.warnings.some(message => message.includes('الحد الأساسي (8 نقاط)')));

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

test('حزمة كاملة تفتقد الحياة لا تُعرض بالخطأ كنسخة صالحة', () => {
  const report = inspectBackup(makePackage(null));

  assert.equal(report.valid, false);
  assert.ok(report.errors.some(message => message.includes('بيانات الحياة الأساسية')));
});

test('حقل سجل الرجوع غير المصفوفي يعطي تحذيرًا ولا يرفض حفظ v1 صالحًا', () => {
  const report = inspectBackup(makeLife({ timeMachineSnapshots: { unexpected: true } }));

  assert.equal(report.valid, true);
  assert.equal(report.rewindSnapshotCount, 0);
  assert.equal(report.rewindInvalidSnapshotCount, 1);
  assert.equal(report.rewindMalformedSnapshotCount, 0);
  assert.equal(report.rewindUnusableSnapshotCount, 0);
  assert.equal(report.rewindUsableSnapshotCount, 0);
  assert.equal(report.rewindBaseRetainedCount, 0);
  assert.equal(report.rewindExpandedRetainedCount, 0);
  assert.equal(report.rewindBaseRestorableCount, 0);
  assert.equal(report.rewindExpandedRestorableCount, 0);
  assert.equal(report.rewindBaseDroppedCount, 0);
  assert.equal(report.rewindExpandedDroppedCount, 0);
  assert.ok(report.warnings.some(message => message.includes('ليس مصفوفة')));
});

test('حزمة hayah-backup الكاملة تعرض بيانات الرجوع مثل ملف الحياة المنفرد', () => {
  const life = makeLife({ timeMachineSnapshots: ['{"age":39}', '{"age":40}'] });
  const report = inspectBackup(makePackage(life));

  assert.equal(report.valid, true);
  assert.equal(report.format, 'حزمة حفظ حياة كاملة');
  assert.equal(report.rewindSnapshotCount, 2);
  assert.equal(report.rewindSnapshotChars, JSON.stringify(life.timeMachineSnapshots).length);
  assert.equal(report.rewindUsableSnapshotCount, 0);
  assert.equal(report.rewindUnusableSnapshotCount, 2);
  assert.equal(report.cemeteryCount, 0);
});


function makeWrappedSnapshot(age, lifeId = 77, overrides = {}) {
  return JSON.stringify({
    snapshotVersion: 1,
    logLength: 0,
    state: {
      version: 1,
      lifeId,
      name: 'مريم',
      age,
      stats: {},
      status: 'حي',
      ...overrides
    }
  });
}

test('الفاحص يميز الصلاحية البنيوية عن النقاط التي تبقى بعد حد العدد', () => {
  const life = makeLife({
    lifeId: 77,
    age: 20,
    timeMachineSnapshots: Array.from({ length: 9 }, (_, index) =>
      makeWrappedSnapshot(index + 1, 77))
  });
  const report = inspectBackup(life);

  assert.equal(report.rewindUsableSnapshotCount, 9);
  assert.equal(report.rewindBaseRetainedCount, 8);
  assert.equal(report.rewindBaseRestorableCount, 8);
  assert.equal(report.rewindBaseDroppedCount, 1);
  assert.equal(report.rewindExpandedRetainedCount, 9);
  assert.equal(report.rewindExpandedRestorableCount, 9);
  assert.equal(report.rewindExpandedDroppedCount, 0);
});

test('تقدير الميزانية يتخطى نقطة ضخمة ولا يمنع الاحتفاظ بنقاط أقدم صالحة', () => {
  const life = makeLife({
    lifeId: 77,
    age: 10,
    timeMachineSnapshots: [
      makeWrappedSnapshot(1, 77),
      makeWrappedSnapshot(2, 77),
      makeWrappedSnapshot(3, 77, { note: 'x'.repeat(MAX_REWIND_SNAPSHOT_CHARS) }),
      makeWrappedSnapshot(4, 77)
    ]
  });
  const report = inspectBackup(life);

  assert.equal(report.rewindUsableSnapshotCount, 4);
  assert.equal(report.rewindExpandedRetainedCount, 3);
  assert.equal(report.rewindExpandedRestorableCount, 3);
  assert.equal(report.rewindExpandedDroppedCount, 1);
  assert.ok(report.warnings.some(message => message.includes('ميزانية التخزين')));
});

test('واجهة الفاحص تفرق بين الصلاحية البنيوية وتقدير ما سيبقى بعد الاستيراد', () => {
  assert.match(checkerSource, /نقاط قابلة للاستعادة بنيويًا قبل حدود السعة/);
  assert.match(checkerSource, /تقدير الصالح للاستعادة — حد 8 نقاط/);
  assert.match(checkerSource, /تقدير الصالح للاستعادة — حد 60 نقطة/);
  assert.match(checkerSource, /نقاط مستبعدة — الذاكرة الموسعة/);
});

function makeLegacySnapshot(age, lifeId, overrides = {}) {
  return JSON.stringify({
    version: 1,
    ...(lifeId === undefined ? {} : { lifeId }),
    name: 'مريم',
    age,
    stats: {},
    log: [],
    status: 'حي',
    ...overrides
  });
}

test('فاحص الرجوع يقارن اللقطات بالعمر بعد تطبيع الاستيراد الفعلي', () => {
  const life = makeLife({
    lifeId: 77,
    age: 150,
    timeMachineSnapshots: [
      makeWrappedSnapshot(130, 77),
      makeWrappedSnapshot(119, 77)
    ]
  });
  const report = inspectBackup(life);

  assert.equal(report.valid, true);
  assert.equal(report.age, 120,
    'the import engine clamps the accepted v1 age to 120 before restoring snapshots');
  assert.equal(report.rewindSnapshotCount, 2);
  assert.equal(report.rewindUsableSnapshotCount, 1,
    'a checkpoint at age 130 is not earlier than the imported age 120');
  assert.equal(report.rewindUnusableSnapshotCount, 1);
});

test('الفاحص يميز اللقطات الحالية القديمة القابلة للاستعادة', () => {
  const life = makeLife({
    lifeId: 77,
    age: 45,
    timeMachineSnapshots: [
      makeWrappedSnapshot(43, 77),
      makeLegacySnapshot(44, 77),
      makeLegacySnapshot(42, undefined)
    ]
  });
  const report = inspectBackup(life);

  assert.equal(report.valid, true);
  assert.equal(report.rewindSnapshotCount, 3);
  assert.equal(report.rewindUsableSnapshotCount, 3);
  assert.equal(report.rewindMalformedSnapshotCount, 0);
  assert.equal(report.rewindUnusableSnapshotCount, 0);
});

test('نصوص JSON التالفة تحذر اللاعب دون رفض حياة سليمة', () => {
  const report = inspectBackup(makeLife({
    timeMachineSnapshots: ['{"snapshotVersion":1,', 'not-json', '']
  }));

  assert.equal(report.valid, true);
  assert.equal(report.rewindSnapshotCount, 2);
  assert.equal(report.rewindInvalidSnapshotCount, 1);
  assert.equal(report.rewindMalformedSnapshotCount, 2);
  assert.equal(report.rewindUnusableSnapshotCount, 0);
  assert.equal(report.rewindUsableSnapshotCount, 0);
  assert.ok(report.warnings.some(message => message.includes('نص JSON تالف')));
});

test('النقاط القابلة للتحليل لكنها غير صالحة للاستعادة تُفصل عن JSON التالف', () => {
  const report = inspectBackup(makeLife({
    lifeId: 77,
    age: 45,
    timeMachineSnapshots: [
      makeWrappedSnapshot(45, 77),
      makeLegacySnapshot(44, 88),
      makeWrappedSnapshot(43, 77, { status: 'متوفى' }),
      JSON.stringify({ snapshotVersion: 1, state: null })
    ]
  }));

  assert.equal(report.valid, true);
  assert.equal(report.rewindMalformedSnapshotCount, 0);
  assert.equal(report.rewindUnusableSnapshotCount, 4);
  assert.equal(report.rewindUsableSnapshotCount, 0);
  assert.ok(report.warnings.some(message => message.includes('لا تخص عمرًا أقدم')));
});


test('فاحص الحفظ يحسب بصمة SHA-256 مطابقة لبايتات الملف دون تعديلها', async () => {
  const bytes = Buffer.from('حياة — نسخة احتياطية');
  const file = {
    arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
  };
  const before = Buffer.from(bytes);
  const fingerprint = await sha256Fingerprint(file, webcrypto);

  assert.equal(fingerprint, createHash('sha256').update(bytes).digest('hex'));
  assert.match(fingerprint, /^[a-f0-9]{64}$/);
  assert.deepEqual(bytes, before);
});

test('تعذر Web Crypto لا يمنع فحص ملف الحفظ', async () => {
  const file = { arrayBuffer: async () => new ArrayBuffer(0) };
  const unavailable = await sha256Fingerprint(file, null);
  const missingFileReaderApi = await sha256Fingerprint({}, webcrypto);
  const rejectedDigest = await sha256Fingerprint(file, {
    subtle: { digest: async () => { throw new Error('digest unavailable'); } }
  });

  assert.equal(unavailable, null);
  assert.equal(missingFileReaderApi, null);
  assert.equal(rejectedDigest, null);
});

test('واجهة فاحص الحفظ تعرض البصمة وتوضح أنها ليست إثباتًا لمصدر الملف', () => {
  assert.match(checkerSource, /بصمة SHA-256/);
  assert.match(checkerSource, /sha256Fingerprint\(file, runtime\.crypto\)/);
  assert.match(checkerSource, /تطابق البصمة لا يثبت مصدر الملف/);
});


test('مقارنة البصمة تطبع المسافات والحروف الكبيرة والبادئة دون قبول قيمة غير صحيحة', () => {
  const digest = '0123456789abcdef'.repeat(4);
  assert.equal(normalizeSha256Fingerprint(' SHA-256: ' + digest.toUpperCase() + ' '), digest);
  assert.equal(compareSha256Fingerprints(digest, 'sha256=' + digest.toUpperCase()), 'match');
  assert.equal(compareSha256Fingerprints(digest, 'f'.repeat(64)), 'mismatch');
  assert.equal(compareSha256Fingerprints(digest, 'ليست بصمة'), 'invalid-reference');
  assert.equal(compareSha256Fingerprints('غير صالحة', digest), 'invalid-current');
});

test('واجهة الفاحص تسمح بنسخ البصمة ومقارنتها ببصمة مرجعية', async () => {
  const checker = require('../backup-check.js');
  class FakeNode {
    constructor() {
      this.children = [];
      this.listeners = {};
      this.className = '';
      this.value = '';
      this.disabled = false;
      this.attributes = {};
      this.selected = false;
    }
    addEventListener(type, callback) { this.listeners[type] = callback; }
    appendChild(child) { this.children.push(child); return child; }
    replaceChildren(...children) { this.children = children; }
    setAttribute(name, value) { this.attributes[name] = value; }
    focus() { this.focused = true; }
    select() { this.selected = true; }
    set textContent(value) { this._text = String(value); this.children = []; }
    get textContent() {
      return [this._text || '', ...this.children.map(child => child.textContent)].filter(Boolean).join(' ');
    }
  }
  const nodes = new Map([
    ['backupFile', new FakeNode()],
    ['backupDropZone', new FakeNode()],
    ['backupResult', new FakeNode()],
    ['clearBackupCheck', new FakeNode()]
  ]);
  const readers = [];
  class FakeFileReader {
    constructor() { this.result = ''; readers.push(this); }
    readAsText(file) { this.file = file; this.result = file.text; }
    abort() { this.aborted = true; if (this.onabort) this.onabort(); }
  }
  const doc = {
    getElementById(id) { return nodes.get(id) || null; },
    createElement() { return new FakeNode(); }
  };
  let copied = '';
  const runtime = {
    FileReader: FakeFileReader,
    crypto: webcrypto,
    navigator: { clipboard: { writeText: async value => { copied = value; } } }
  };
  checker.mount(doc, runtime);

  const bytes = Buffer.from(JSON.stringify(makeLife()));
  const file = {
    name: 'نسخة-حياة.json',
    size: bytes.length,
    text: bytes.toString('utf8'),
    arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
  };
  nodes.get('backupFile').listeners.change({ target: { files: [file] } });
  await readers[0].onload();

  const findByClass = (node, className) => {
    if (String(node.className || '').split(/\s+/).includes(className)) return node;
    for (const child of node.children || []) {
      const found = findByClass(child, className);
      if (found) return found;
    }
    return null;
  };
  const currentInput = findByClass(nodes.get('backupResult'), 'fingerprint-value');
  const expectedInput = findByClass(nodes.get('backupResult'), 'fingerprint-expected');
  const copyButton = findByClass(nodes.get('backupResult'), 'fingerprint-copy');
  const compareButton = findByClass(nodes.get('backupResult'), 'fingerprint-compare');
  const status = findByClass(nodes.get('backupResult'), 'fingerprint-status');
  assert.ok(currentInput && expectedInput && copyButton && compareButton && status);

  const expectedDigest = createHash('sha256').update(bytes).digest('hex');
  await copyButton.listeners.click();
  assert.equal(copied, expectedDigest);
  expectedInput.value = 'SHA-256: ' + expectedDigest.toUpperCase();
  compareButton.listeners.click();
  assert.match(status.textContent, /^متطابقة:/);

  expectedInput.value = 'f'.repeat(64);
  compareButton.listeners.click();
  assert.match(status.textContent, /غير متطابقة/);

  expectedInput.value = 'قيمة غير صالحة';
  compareButton.listeners.click();
  assert.match(status.textContent, /64 خانة/);

  runtime.navigator.clipboard = null;
  await copyButton.listeners.click();
  assert.equal(currentInput.selected, true, 'the fallback should select the current digest for manual copying');
  assert.match(status.textContent, /النسخ التلقائي غير متاح/);
});
