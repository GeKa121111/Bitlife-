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
  compareBackupSnapshots,
  MAX_REWIND_SNAPSHOT_CHARS
} = require('../backup-check.js');
const checkerSource = fs.readFileSync(path.join(__dirname, '..', 'backup-check.js'), 'utf8');
const integrity = require('../backup-integrity.js');

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


test('حزم النسخ الجديدة تحمل بصمة داخلية وتكشف تغيير المحتوى دون تعديل الحزمة', () => {
  const bundle = makePackage(makeLife({ bank: 125000, log: ['حدث محفوظ'] }));
  const before = JSON.stringify(bundle);
  const integrityRecord = integrity.createIntegrity(bundle);
  assert.equal(JSON.stringify(bundle), before, 'creating a checksum must not mutate the source bundle');
  bundle.integrity = integrityRecord;
  const withIntegrity = JSON.stringify(bundle);
  const report = inspectBackup(bundle);

  assert.equal(report.valid, true);
  assert.equal(report.integrityStatus, 'verified');
  assert.equal(JSON.stringify(bundle), withIntegrity, 'verification must remain read-only');

  const reordered = JSON.parse(withIntegrity);
  const reversed = Object.fromEntries(Object.entries(reordered).reverse());
  assert.equal(integrity.verifyIntegrity(reversed).valid, true,
    'canonical key ordering must not invalidate a semantically identical JSON bundle');

  const tampered = JSON.parse(withIntegrity);
  tampered.life.bank += 1;
  const tamperedReport = inspectBackup(tampered);
  assert.equal(tamperedReport.valid, false);
  assert.equal(tamperedReport.integrityStatus, 'mismatch');
  assert.ok(tamperedReport.errors.some(message => message.includes('البصمة الداخلية لا تطابق')));
});

test('البصمة تشمل مفتاح __proto__ العادي دون السماح بتجاوزه عبر خاصية النموذج الأولي', () => {
  const bundle = JSON.parse(JSON.stringify(makePackage(makeLife())));
  Object.defineProperty(bundle, '__proto__', {
    value: { marker: 'original' },
    enumerable: true,
    configurable: true,
    writable: true
  });
  bundle.integrity = integrity.createIntegrity(bundle);
  assert.equal(integrity.verifyIntegrity(bundle).valid, true);
  bundle.__proto__.marker = 'changed';
  assert.equal(integrity.verifyIntegrity(bundle).valid, false,
    'special JSON keys must be included in the integrity calculation');
});

test('الحزم القديمة تظل قابلة للفحص، والبصمات غير المدعومة تُرفض بوضوح', () => {
  const legacy = inspectBackup(makePackage(makeLife()));
  assert.equal(legacy.valid, true);
  assert.equal(legacy.integrityStatus, 'legacy');
  assert.ok(legacy.warnings.some(message => message.includes('لا تحتوي على بصمة داخلية')));

  const missingRequired = makePackage(makeLife());
  missingRequired.integrityRequired = true;
  assert.equal(integrity.verifyIntegrity(missingRequired).status, 'missing');
  const missingRequiredReport = inspectBackup(missingRequired);
  assert.equal(missingRequiredReport.valid, false);
  assert.equal(missingRequiredReport.integrityStatus, 'missing');
  assert.ok(missingRequiredReport.errors.some(message => message.includes('تتطلب بصمة داخلية')));

  const malformedMarker = makePackage(makeLife());
  malformedMarker.integrityRequired = 'true';
  assert.equal(integrity.verifyIntegrity(malformedMarker).status, 'invalid-marker');
  const malformedMarkerReport = inspectBackup(malformedMarker);
  assert.equal(malformedMarkerReport.valid, false);
  assert.equal(malformedMarkerReport.integrityStatus, 'invalid-marker');
  assert.ok(malformedMarkerReport.errors.some(message => message.includes('علامة اشتراط البصمة')));

  const unsupported = makePackage(makeLife());
  unsupported.integrity = { algorithm: 'SHA-256', checksum: 'a'.repeat(64) };
  const report = inspectBackup(unsupported);
  assert.equal(report.valid, false);
  assert.equal(report.integrityStatus, 'unsupported');
});

test('واجهة فاحص النسخ توضح حالة البصمة وحدودها', () => {
  assert.match(checkerSource, /سلامة الحزمة/);
  assert.match(checkerSource, /بصمة مفقودة من حزمة حديثة/);
  assert.match(checkerSource, /علامة بصمة غير صالحة/);
  assert.match(checkerSource, /FNV-1a-32/);
  assert.match(checkerSource, /ليست توقيعًا أمنيًا/);
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

test('تقدير الميزانية يطابق المحرك عند تجاوز نقطة داخل السجل', () => {
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
  assert.equal(report.rewindExpandedRetainedCount, 1,
    'the import engine stops at the first oversized older checkpoint');
  assert.equal(report.rewindExpandedRestorableCount, 1);
  assert.equal(report.rewindExpandedDroppedCount, 3);
  assert.ok(report.warnings.some(message => message.includes('ميزانية التخزين')));
});

test('تخطي أحدث نقطة ضخمة يواصل البحث حتى يمتلئ حد العدد', () => {
  const snapshots = Array.from({ length: 9 }, (_, index) =>
    makeWrappedSnapshot(index + 1, 77));
  snapshots[8] = makeWrappedSnapshot(9, 77, {
    note: 'x'.repeat(MAX_REWIND_SNAPSHOT_CHARS)
  });
  const report = inspectBackup(makeLife({
    lifeId: 77,
    age: 20,
    timeMachineSnapshots: snapshots
  }));

  assert.equal(report.rewindUsableSnapshotCount, 9);
  assert.equal(report.rewindBaseRetainedCount, 8,
    'the import engine scans older entries after skipping an oversized newest checkpoint');
  assert.equal(report.rewindBaseRestorableCount, 8);
  assert.equal(report.rewindBaseDroppedCount, 1);
  assert.equal(report.rewindExpandedRetainedCount, 8);
  assert.equal(report.rewindExpandedDroppedCount, 1);
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
  assert.match(checkerSource, /ليست توقيعًا أمنيًا ولا تثبت مصدر الملف/);
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
    ['backupAnnouncement', new FakeNode()],
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
  assert.equal(nodes.get('backupAnnouncement').textContent,
    'اكتمل فحص ملف الحفظ: متوافق مبدئيًا مع ملاحظات.');

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

  nodes.get('backupFile').listeners.change({
    target: { files: [{ name: 'ملف-كبير.json', size: checker.MAX_FILE_BYTES + 1 }] }
  });
  assert.match(nodes.get('backupAnnouncement').textContent, /15 ميجابايت/);
  assert.equal(readers.length, 1, 'an oversized file must be rejected before another read starts');

  nodes.get('clearBackupCheck').listeners.click();
  assert.equal(nodes.get('backupAnnouncement').textContent, 'تم مسح نتيجة الفحص.');
});


test('مقارنة نسختين سليمتين من معرّف الحياة نفسه تعرض فروق العمر والمال والأسرة دون تعديلهما', () => {
  const first = makePackage(makeLife({
    lifeId: 'life-compare-1',
    age: 40,
    bank: 1000,
    debt: 300,
    log: [{ title: 'حدث 1' }, { title: 'حدث 2' }],
    family: [{ name: 'ابن' }],
    stats: { happiness: 70, health: 80, smart: 75, looks: 60 }
  }));
  first.cemetery = [{ name: 'حياة سابقة' }];
  const second = makePackage(makeLife({
    lifeId: 'life-compare-1',
    age: 43,
    bank: 1750,
    debt: 100,
    log: [{ title: 'حدث 1' }, { title: 'حدث 2' }, { title: 'حدث 3' }],
    family: [{ name: 'ابن' }, { name: 'ابنة' }],
    stats: { happiness: 75, health: 78, smart: 80, looks: 60 }
  }));
  second.cemetery = [{ name: 'حياة سابقة' }, { name: 'حياة أخرى' }];
  const firstBefore = JSON.stringify(first);
  const secondBefore = JSON.stringify(second);

  const result = compareBackupSnapshots(first, second);
  assert.equal(result.comparable, true);
  assert.equal(result.reason, 'same-life');
  assert.equal(result.deltas.age, 3);
  assert.equal(result.deltas.bank, 750);
  assert.equal(result.deltas.debt, -200);
  assert.equal(result.deltas.logCount, 1);
  assert.equal(result.deltas.familyCount, 1);
  assert.equal(result.deltas.cemeteryCount, 1);
  assert.equal(result.deltas.stats.health, -2);
  assert.equal(result.deltas.stats.smart, 5);
  assert.deepEqual(result.warnings, []);
  assert.equal(JSON.stringify(first), firstBefore);
  assert.equal(JSON.stringify(second), secondBefore);
});

test('مقارنة النسخ ترفض حياتين مختلفتين ولا تخمّن الهوية عند غياب معرّف ثابت', () => {
  const first = makeLife({ lifeId: 'life-a', age: 40 });
  const different = makeLife({ lifeId: 'life-b', age: 41 });
  assert.equal(compareBackupSnapshots(first, different).reason, 'different-life');

  const legacyWithoutId = makeLife({ age: 41 });
  const otherLegacyWithoutId = makeLife({ age: 42 });
  const result = compareBackupSnapshots(legacyWithoutId, otherLegacyWithoutId);
  assert.equal(result.comparable, false);
  assert.equal(result.reason, 'identity-unavailable');
});

test('مقارنة النسخ ترفض ملفًا غير صالح وتحذر من العمر الأقل دون اعتباره الأحدث', () => {
  const valid = makeLife({ lifeId: 'life-c', age: 50, bank: 100 });
  const invalid = makeLife({ lifeId: 'life-c', age: 'عمر غير صالح' });
  assert.equal(compareBackupSnapshots(valid, invalid).reason, 'invalid-backup');

  const earlierAge = makeLife({ lifeId: 'life-c', age: 45, bank: 80 });
  const result = compareBackupSnapshots(valid, earlierAge);
  assert.equal(result.comparable, true);
  assert.equal(result.deltas.age, -5);
  assert.ok(result.warnings.some(message => message.includes('الرجوع بالزمن')));
});

test('واجهة فاحص النسخ تتيح اختيار نسخة ثانية بعد اجتياز الأولى وتعرض مقارنة محلية', async () => {
  const checker = require('../backup-check.js');
  class FakeNode {
    constructor() {
      this.children = [];
      this.listeners = {};
      this.className = '';
      this.value = '';
      this.disabled = false;
      this.attributes = {};
    }
    addEventListener(type, callback) { this.listeners[type] = callback; }
    appendChild(child) { this.children.push(child); return child; }
    replaceChildren(...children) { this.children = children; this._text = ''; }
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
    ['compareBackupFile', new FakeNode()],
    ['backupDropZone', new FakeNode()],
    ['backupResult', new FakeNode()],
    ['backupComparisonResult', new FakeNode()],
    ['backupAnnouncement', new FakeNode()],
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
  checker.mount(doc, { FileReader: FakeFileReader, crypto: webcrypto });

  const toFile = (name, data) => {
    const bytes = Buffer.from(JSON.stringify(data));
    return {
      name,
      size: bytes.length,
      text: bytes.toString('utf8'),
      arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
    };
  };
  const first = makePackage(makeLife({ lifeId: 'life-ui', age: 30, bank: 500 }));
  const second = makePackage(makeLife({ lifeId: 'life-ui', age: 32, bank: 700 }));
  nodes.get('backupFile').listeners.change({ target: { files: [toFile('الأولى.json', first)] } });
  await readers[0].onload();
  assert.equal(nodes.get('compareBackupFile').disabled, false);

  nodes.get('compareBackupFile').listeners.change({ target: { files: [toFile('الثانية.json', second)] } });
  await readers[1].onload();
  assert.match(nodes.get('backupComparisonResult').textContent, /النسختان تعودان إلى الحياة نفسها/);
  assert.match(nodes.get('backupComparisonResult').textContent, /فرق الرصيد البنكي/);
  assert.match(nodes.get('backupComparisonResult').textContent, /النسخة الأولى/);
  assert.match(nodes.get('backupAnnouncement').textContent, /اكتملت مقارنة نسختين/);
});
