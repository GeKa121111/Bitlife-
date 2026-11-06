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

const executable = [
  functionSource('isValidSaveData', 'save'),
  functionSource('restoreRewindStorageValue', 'restoreCemeteryAfterFailedRewind'),
  functionSource('restoreCemeteryAfterFailedRewind', 'removeLifeFromCemeteryForRewind'),
  functionSource('removeLifeFromCemeteryForRewind', 'rewindToSnapshot'),
  functionSource('rewindToSnapshot', 'customizeMenu')
].join('\n');

function createHarness({ failKey = null, saveFails = false, snapshotAge = 39, snapshotLifeId = 'life-1' } = {}) {
  const cemetery = [
    { id: 'life-1', name: 'مريم', age: 40 },
    { id: 'life-2', name: 'سليم', age: 76 }
  ];
  const snapshotState = {
    version: 1,
    lifeId: snapshotLifeId,
    name: 'مريم',
    age: snapshotAge,
    stats: { health: 82 },
    status: 'حي',
    accomplishments: []
  };
  const currentState = {
    version: 1,
    lifeId: 'life-1',
    name: 'مريم',
    age: 40,
    stats: { health: 45 },
    log: [{ title: 'آخر حدث قبل الوفاة' }],
    status: 'متوفى',
    cause: 'سبب طبيعي',
    accomplishments: [],
    timeMachineSnapshots: [JSON.stringify({
      snapshotVersion: 1,
      logLength: 1,
      state: snapshotState,
      logSnapshot: [{ title: 'ذكرى السنة السابقة' }]
    })]
  };
  const values = new Map([
    ['life-save', JSON.stringify(currentState)],
    ['life-backup', 'legacy-life-backup'],
    ['cemetery', JSON.stringify(cemetery)],
    ['cemeteryBackup', JSON.stringify(cemetery)]
  ]);
  const localStorage = {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) {
      const serialized = String(value);
      if (failKey === key && values.get(key) !== serialized) throw new Error('quota');
      values.set(key, serialized);
    },
    removeItem(key) { values.delete(key); }
  };
  const calls = { save: 0, render: 0, close: 0, info: [], achievements: [] };
  const context = {
    state: currentState,
    dead: true,
    KEY: 'life-save',
    BACKUP_KEY: 'life-backup',
    CEMETERY_KEY: 'cemetery',
    CEMETERY_BACKUP_KEY: 'cemeteryBackup',
    localStorage,
    calls,
    normalizeCemetery(list) {
      return Array.isArray(list) ? list.map(item => ({ ...item })) : [];
    },
    validateCemeteryBackup(list) {
      return Array.isArray(list) && list.every(item =>
        item && typeof item === 'object' && typeof item.name === 'string' && item.name.trim().length > 0
      );
    },
    readCemeteryForBackup() {
      const raw = localStorage.getItem('cemetery');
      if (raw === null) return [];
      const parsed = JSON.parse(raw);
      if (!context.validateCemeteryBackup(parsed)) throw new Error('cemetery-invalid');
      return context.normalizeCemetery(parsed);
    },
    persistCemeteryBackup(list) {
      const serialized = JSON.stringify(context.normalizeCemetery(list));
      if (localStorage.getItem('cemeteryBackup') !== serialized) localStorage.setItem('cemeteryBackup', serialized);
      if (localStorage.getItem('cemeteryBackup') !== serialized) throw new Error('cemetery-backup-write-unverified');
      return serialized;
    },
    closeModal() { calls.close++; },
    info(...args) { calls.info.push(args); },
    ensureGamingTalent() {},
    log(icon, title, text, tone) {
      context.state.log.push({ icon, title, text, tone });
    },
    achievement(name) { context.state.accomplishments.push(name); },
    render() { calls.render++; },
    save() {
      calls.save++;
      if (saveFails) return false;
      try {
        localStorage.setItem('life-save', JSON.stringify(context.state));
        return true;
      } catch (error) {
        return false;
      }
    }
  };
  vm.runInNewContext(executable, context);
  return { context, values, cemetery };
}

function storedList(harness, key) {
  return JSON.parse(harness.values.get(key));
}

test('الرجوع بعد الوفاة يحدّث المقبرة ونسختها الاحتياطية معًا', () => {
  const harness = createHarness();
  harness.context.rewindToSnapshot(0);

  assert.equal(harness.context.state.age, 39);
  assert.equal(harness.context.state.status, 'حي');
  assert.equal(harness.context.dead, false);
  assert.equal(harness.context.state.lifeId, 'life-1');
  assert.equal(harness.context.state.timeMachineSnapshots.length, 0);
  assert.deepEqual(storedList(harness, 'cemetery'), [{ id: 'life-2', name: 'سليم', age: 76 }]);
  assert.deepEqual(storedList(harness, 'cemeteryBackup'), [{ id: 'life-2', name: 'سليم', age: 76 }]);
  assert.equal(JSON.parse(harness.values.get('life-save')).age, 39);
  assert.equal(harness.context.calls.save, 1);
});

test('نقطة من نفس العمر أو من حياة أخرى تُرفض قبل لمس المقبرة', () => {
  const sameAge = createHarness({ snapshotAge: 40 });
  const originalState = sameAge.context.state;
  sameAge.context.rewindToSnapshot(0);
  assert.equal(sameAge.context.state, originalState);
  assert.equal(sameAge.context.dead, true);
  assert.deepEqual(storedList(sameAge, 'cemetery'), sameAge.cemetery);
  assert.deepEqual(storedList(sameAge, 'cemeteryBackup'), sameAge.cemetery);
  assert.equal(sameAge.context.calls.save, 0);

  const otherLife = createHarness({ snapshotLifeId: 'different-life' });
  otherLife.context.rewindToSnapshot(0);
  assert.equal(otherLife.context.state.status, 'متوفى');
  assert.deepEqual(storedList(otherLife, 'cemetery'), otherLife.cemetery);
  assert.equal(otherLife.context.calls.save, 0);
});

test('فشل تحديث نسخة المقبرة الاحتياطية يلغي الرجوع ويحافظ على الحفظ الحالي', () => {
  const harness = createHarness({ failKey: 'cemeteryBackup' });
  const originalState = harness.context.state;
  harness.context.rewindToSnapshot(0);

  assert.equal(harness.context.state, originalState);
  assert.equal(harness.context.dead, true);
  assert.deepEqual(storedList(harness, 'cemetery'), harness.cemetery);
  assert.deepEqual(storedList(harness, 'cemeteryBackup'), harness.cemetery);
  assert.equal(harness.context.calls.save, 0);
  assert.ok(harness.context.calls.info.length > 0);
});

test('فشل حفظ الحياة بعد إزالة المقبرة يعيد الحفظ والمقبرة إلى حالتهما السابقة', () => {
  const harness = createHarness({ saveFails: true });
  const originalState = harness.context.state;
  harness.context.rewindToSnapshot(0);

  assert.equal(harness.context.state, originalState);
  assert.equal(harness.context.state.status, 'متوفى');
  assert.equal(harness.context.dead, true);
  assert.deepEqual(storedList(harness, 'cemetery'), harness.cemetery);
  assert.deepEqual(storedList(harness, 'cemeteryBackup'), harness.cemetery);
  assert.equal(JSON.parse(harness.values.get('life-save')).status, 'متوفى');
  assert.equal(harness.context.calls.save, 1);
  assert.ok(harness.context.calls.info.length > 0);
});
