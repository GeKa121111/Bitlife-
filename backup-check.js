(function (root, factory) {
  'use strict';
  const integrityApi = root && root.HayahBackupIntegrity
    ? root.HayahBackupIntegrity
    : typeof require === 'function' ? require('./backup-integrity.js') : null;
  const api = factory(integrityApi);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.HayahBackupCheck = api;
  if (root && root.document) api.mount(root.document, root);
})(typeof globalThis === 'object' ? globalThis : this, function (integrityApi) {
  'use strict';

  const MAX_FILE_BYTES = 15 * 1024 * 1024;
  const MAX_REWIND_SNAPSHOT_CHARS = 300000;
  const BASE_REWIND_SNAPSHOT_LIMIT = 8;
  const MAX_REWIND_SNAPSHOT_LIMIT = 60;

  function isRecord(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
  }

  function inspectLife(life, errors, warnings) {
    if (!isRecord(life)) {
      errors.push('بيانات الحياة الأساسية غير موجودة أو ليست كائنًا صالحًا.');
      return { name: null, age: null, version: null };
    }

    if (life.version !== 1) errors.push('إصدار بيانات الحياة غير مدعوم؛ الإصدار المتوقع هو 1.');
    if (typeof life.name !== 'string' || !life.name.trim()) {
      errors.push('اسم الشخصية مفقود.');
    }

    // Match the game's isValidSaveData() checks before reporting a save as importable.
    const ageText = life.age === null || life.age === undefined ? '' : String(life.age).trim();
    const numericAge = Number(life.age);
    const validAge = ageText !== '' && Number.isFinite(numericAge) && numericAge >= 0 && numericAge <= 150;
    if (!validAge) errors.push('العمر مفقود أو خارج النطاق المقبول للاستيراد من 0 إلى 150 سنة.');

    if (!isRecord(life.stats)) errors.push('قسم الإحصائيات مطلوب ويجب أن يكون كائنًا صالحًا.');
    if (!Array.isArray(life.log)) errors.push('سجل الأحداث مطلوب ويجب أن يكون مصفوفة.');
    if (!Array.isArray(life.family)) errors.push('بيانات الأسرة مطلوبة ويجب أن تكون مصفوفة.');
    if (!isRecord(life.place)) errors.push('بيانات مكان الإقامة مطلوبة ويجب أن تكون كائنًا صالحًا.');

    if (isRecord(life.stats)) {
      const statKeys = ['happiness', 'health', 'smart', 'looks'];
      if (statKeys.some(key => !Number.isFinite(Number(life.stats[key])))) {
        warnings.push('بعض الإحصائيات ستُستكمل بقيم افتراضية عند الاستيراد.');
      }
    }

    const normalizedAge = validAge ? Math.max(0, Math.min(120, Math.floor(numericAge))) : null;
    if (validAge && normalizedAge !== numericAge) {
      warnings.push('سيُطبّع العمر إلى ' + normalizedAge + ' سنة عند الاستيراد.');
    }

    return {
      name: typeof life.name === 'string' && life.name.trim() ? life.name.trim() : null,
      age: normalizedAge,
      version: life.version
    };
  }
  function isRestorableRewindSnapshot(parsed, life, currentAgeOverride) {
    let snapshotState = parsed;
    const wrapped = isRecord(parsed) && parsed.snapshotVersion === 1 &&
      parsed.state && typeof parsed.state === 'object';
    if (wrapped) snapshotState = parsed.state;
    if (!isRecord(snapshotState)) return false;

    const ageText = snapshotState.age === null || snapshotState.age === undefined
      ? '' : String(snapshotState.age).trim();
    const age = Number(snapshotState.age);
    const validAge = ageText !== '' && Number.isFinite(age) && age >= 0 && age <= 150;
    if (snapshotState.version !== 1 ||
        typeof snapshotState.name !== 'string' || !snapshotState.name.trim() ||
        !validAge || !isRecord(snapshotState.stats) ||
        snapshotState.status === 'متوفى') return false;

    // Current compact checkpoints store the log length separately; legacy full
    // snapshots must still carry the log array required by the rewind engine.
    if (!wrapped && !Array.isArray(snapshotState.log)) return false;

    const currentAge = currentAgeOverride === undefined
      ? Number(life && life.age)
      : currentAgeOverride === null ? NaN : Number(currentAgeOverride);
    if (!Number.isFinite(currentAge) || age >= currentAge) return false;

    const currentLifeId = life && life.lifeId;
    const snapshotLifeId = snapshotState.lifeId;
    const hasCurrentLifeId = currentLifeId !== undefined && currentLifeId !== null &&
      String(currentLifeId).trim() !== '';
    const hasSnapshotLifeId = snapshotLifeId !== undefined && snapshotLifeId !== null &&
      String(snapshotLifeId).trim() !== '';
    // A snapshot with a different explicit identity cannot be restored into this life.
    // A legacy snapshot without an ID remains supported; the engine binds it to the active life.
    if (hasSnapshotLifeId &&
        (!hasCurrentLifeId || String(snapshotLifeId) !== String(currentLifeId))) return false;

    return true;
  }

  function estimateRetainedSnapshots(snapshots, limit) {
    // Mirror fitTimeMachineSnapshots(): scan newest to oldest, skip an oversized
    // newest entry once, then stop at the first older entry that exceeds the budget.
    // The count limit applies to retained entries, not to the last N raw candidates.
    const retained = [];
    let serializedChars = 2; // JSON.stringify([]) includes the opening and closing brackets.
    for (let index = snapshots.length - 1; index >= 0 && retained.length < limit; index -= 1) {
      const candidate = [snapshots[index], ...retained];
      const candidateChars = JSON.stringify(candidate).length;
      if (candidateChars > MAX_REWIND_SNAPSHOT_CHARS) {
        if (index === snapshots.length - 1) continue;
        break;
      }
      retained.unshift(snapshots[index]);
      serializedChars = candidateChars;
    }
    return {
      snapshots: retained,
      count: retained.length,
      droppedCount: snapshots.length - retained.length,
      serializedChars
    };
  }

  function inspectRewindHistory(life, warnings, currentAgeOverride) {
    const raw = isRecord(life) ? life.timeMachineSnapshots : undefined;
    if (raw === undefined || raw === null) {
      return {
        count: 0, serializedChars: 0, invalidCount: 0,
        malformedJsonCount: 0, unusableCount: 0, usableCount: 0,
        baseRetainedCount: 0, expandedRetainedCount: 0,
        baseRestorableCount: 0, expandedRestorableCount: 0,
        baseDroppedCount: 0, expandedDroppedCount: 0
      };
    }
    if (!Array.isArray(raw)) {
      warnings.push('حقل نقاط الرجوع موجود لكنه ليس مصفوفة؛ قد يتجاهله المحرك عند الاستيراد.');
      return {
        count: 0, serializedChars: 0, invalidCount: 1,
        malformedJsonCount: 0, unusableCount: 0, usableCount: 0,
        baseRetainedCount: 0, expandedRetainedCount: 0,
        baseRestorableCount: 0, expandedRestorableCount: 0,
        baseDroppedCount: 0, expandedDroppedCount: 0
      };
    }

    // The game stores rewind snapshots as JSON strings and filters empty/non-string entries.
    const snapshots = raw.filter(snapshot => typeof snapshot === 'string' && snapshot.length > 0);
    const invalidCount = raw.length - snapshots.length;
    let malformedJsonCount = 0;
    let unusableCount = 0;
    let usableCount = 0;
    const restorableSnapshotSet = new Set();

    if (invalidCount > 0) {
      warnings.push('يوجد ' + invalidCount + ' مدخل فارغ أو غير نصي في سجل الرجوع؛ قد يتجاهلها المحرك.');
    }

    snapshots.forEach(snapshot => {
      let parsed;
      try {
        parsed = JSON.parse(snapshot);
      } catch {
        malformedJsonCount += 1;
        return;
      }
      if (isRestorableRewindSnapshot(parsed, life, currentAgeOverride)) {
        usableCount += 1;
        restorableSnapshotSet.add(snapshot);
      } else unusableCount += 1;
    });

    if (malformedJsonCount > 0) {
      warnings.push('يوجد ' + malformedJsonCount + ' نقطة رجوع تحتوي على نص JSON تالف؛ لن يمكن قراءتها أو استعادتها.');
    }
    if (unusableCount > 0) {
      warnings.push('يوجد ' + unusableCount + ' نقطة رجوع لا تطابق بنية الاستعادة أو لا تخص عمرًا أقدم وحياة متوافقة؛ لن تظهر كخيارات صالحة.');
    }

    const serializedChars = snapshots.length ? JSON.stringify(snapshots).length : 0;
    const baseRetention = estimateRetainedSnapshots(snapshots, BASE_REWIND_SNAPSHOT_LIMIT);
    const expandedRetention = estimateRetainedSnapshots(snapshots, MAX_REWIND_SNAPSHOT_LIMIT);
    const countRestorable = retained => retained.reduce(
      (count, snapshot) => count + (restorableSnapshotSet.has(snapshot) ? 1 : 0),
      0
    );
    if (snapshots.length > MAX_REWIND_SNAPSHOT_LIMIT) {
      warnings.push('يتجاوز سجل الرجوع الحد الأقصى المدعوم (' + MAX_REWIND_SNAPSHOT_LIMIT + ' نقطة)؛ قد تُستبعد نقاط أقدم عند التطبيع.');
    } else if (snapshots.length > BASE_REWIND_SNAPSHOT_LIMIT) {
      warnings.push('يتجاوز سجل الرجوع الحد الأساسي (' + BASE_REWIND_SNAPSHOT_LIMIT + ' نقاط)؛ قد تسمح ميزة الذاكرة الموسعة بالاحتفاظ بما يصل إلى ' + MAX_REWIND_SNAPSHOT_LIMIT + ' نقطة.');
    }
    if (serializedChars > MAX_REWIND_SNAPSHOT_CHARS) {
      warnings.push('يتجاوز سجل الرجوع ميزانية التخزين البالغة ' + MAX_REWIND_SNAPSHOT_CHARS + ' وحدة نصية؛ قد يستبعد المحرك بعض اللقطات لتقليل الحجم.');
    }

    return {
      count: snapshots.length,
      serializedChars,
      invalidCount,
      malformedJsonCount,
      unusableCount,
      usableCount,
      baseRetainedCount: baseRetention.count,
      expandedRetainedCount: expandedRetention.count,
      baseRestorableCount: countRestorable(baseRetention.snapshots),
      expandedRestorableCount: countRestorable(expandedRetention.snapshots),
      baseDroppedCount: baseRetention.droppedCount,
      expandedDroppedCount: expandedRetention.droppedCount
    };
  }

  function inspectBackup(data) {
    const errors = [];
    const warnings = [];
    let integrityStatus = 'not-applicable';
    let format = 'ملف غير معروف';
    let life = null;
    let cemeteryCount = null;
    let hasSettings = false;
    let hasPerks = false;

    if (isRecord(data) && data.format === 'hayah-backup') {
      format = 'حزمة حفظ حياة كاملة';
      if (!Object.prototype.hasOwnProperty.call(data, 'integrity')) {
        if (Object.prototype.hasOwnProperty.call(data, 'integrityRequired')) {
          if (data.integrityRequired === true) {
            integrityStatus = 'missing';
            errors.push('الحزمة الحديثة تعلن أنها تتطلب بصمة داخلية لكنها لا تحتوي عليها؛ ربما حُذف سجل البصمة.');
          } else {
            integrityStatus = 'invalid-marker';
            errors.push('علامة اشتراط البصمة الداخلية غير صالحة؛ لم نعتمد الحزمة.');
          }
        } else {
          integrityStatus = 'legacy';
          warnings.push('هذه الحزمة لا تحتوي على بصمة داخلية؛ فحصنا البنية فقط. أعد تصديرها من إصدار حديث للحصول على فحص إضافي ضد التلف العرضي.');
        }
      } else if (!integrityApi || typeof integrityApi.verifyIntegrity !== 'function') {
        integrityStatus = 'unavailable';
        errors.push('تعذر التحقق من بصمة الحزمة الداخلية في هذه الصفحة.');
      } else {
        const integrityCheck = integrityApi.verifyIntegrity(data);
        integrityStatus = integrityCheck.status;
        if (!integrityCheck.valid) {
          errors.push(integrityCheck.status === 'mismatch'
            ? 'البصمة الداخلية لا تطابق محتوى الحزمة؛ قد يكون الملف تالفًا أو عُدّل بعد التصدير.'
            : integrityCheck.status === 'invalid-marker'
              ? 'علامة اشتراط البصمة الداخلية غير صالحة؛ لم نعتمد الحزمة.'
              : 'نوع البصمة الداخلية غير مدعوم؛ لم نعتمد سلامة الحزمة.');
        }
      }
      if (data.backupVersion !== 1) {
        errors.push('إصدار حزمة النسخ الاحتياطي غير مدعوم؛ الإصدار المتوقع هو 1.');
      }
      life = data.life;

      if (!Array.isArray(data.cemetery)) {
        errors.push('سجل المقبرة غير موجود كمصفوفة.');
      } else {
        cemeteryCount = data.cemetery.length;
        const invalidEntry = data.cemetery.findIndex(entry => !isRecord(entry) || typeof entry.name !== 'string' || !entry.name.trim());
        if (invalidEntry !== -1) {
          errors.push('يوجد سجل في المقبرة يفتقد اسمًا صالحًا عند الموضع ' + (invalidEntry + 1) + '.');
        }
        if (data.cemetery.length > 100) {
          warnings.push('تحتوي المقبرة على أكثر من 100 سجل؛ سيحتفظ الاستيراد بأول 100 سجل فقط.');
        }
      }

      hasSettings = isRecord(data.settings);
      hasPerks = isRecord(data.perks);
      if (!hasSettings) errors.push('إعدادات العرض مطلوبة في حزمة النسخ ويجب أن تكون كائنًا صالحًا.');
      if (!hasPerks) errors.push('بيانات المزايا الدائمة مطلوبة في حزمة النسخ ويجب أن تكون كائنًا صالحًا.');
    } else if (isRecord(data) && data.version === 1) {
      format = 'حفظ حياة منفرد — الإصدار 1';
      life = data;
      warnings.push('هذا الملف يحتوي على حياة واحدة فقط؛ لا يتضمن المقبرة أو إعدادات العرض أو المزايا الدائمة.');
    } else {
      errors.push('صيغة الملف غير معروفة. اختر حزمة hayah-backup أو ملف حياة قديمًا بإصدار بيانات 1.');
    }

    const identity = inspectLife(life, errors, warnings);
    const rewind = inspectRewindHistory(life, warnings, identity.age);
    return {
      valid: errors.length === 0,
      format,
      integrityStatus,
      name: identity.name,
      age: identity.age,
      lifeVersion: identity.version,
      rewindSnapshotCount: rewind.count,
      rewindSnapshotChars: rewind.serializedChars,
      rewindInvalidSnapshotCount: rewind.invalidCount,
      rewindMalformedSnapshotCount: rewind.malformedJsonCount,
      rewindUnusableSnapshotCount: rewind.unusableCount,
      rewindUsableSnapshotCount: rewind.usableCount,
      rewindBaseRetainedCount: rewind.baseRetainedCount,
      rewindExpandedRetainedCount: rewind.expandedRetainedCount,
      rewindBaseRestorableCount: rewind.baseRestorableCount,
      rewindExpandedRestorableCount: rewind.expandedRestorableCount,
      rewindBaseDroppedCount: rewind.baseDroppedCount,
      rewindExpandedDroppedCount: rewind.expandedDroppedCount,
      cemeteryCount,
      hasSettings,
      hasPerks,
      errors,
      warnings
    };
  }

  function formatBytes(bytes) {
    const value = Number(bytes);
    if (!Number.isFinite(value) || value < 0) return 'حجم غير معروف';
    if (value < 1024) return value + ' بايت';
    if (value < 1024 * 1024) return (value / 1024).toFixed(1) + ' كيلوبايت';
    return (value / (1024 * 1024)).toFixed(2) + ' ميجابايت';
  }

  async function sha256Fingerprint(file, cryptoApi) {
    if (!file || typeof file.arrayBuffer !== 'function' ||
        !cryptoApi || !cryptoApi.subtle || typeof cryptoApi.subtle.digest !== 'function') return null;
    try {
      const bytes = await file.arrayBuffer();
      const digest = await cryptoApi.subtle.digest('SHA-256', bytes);
      return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fingerprinting is optional; a browser limitation must not block the local save inspection.
      return null;
    }
  }


  function normalizeSha256Fingerprint(value) {
    const normalized = String(value == null ? '' : value)
      .trim()
      .replace(/^sha-?256\s*[:=]\s*/i, '')
      .replace(/\s+/g, '')
      .toLowerCase();
    return /^[a-f0-9]{64}$/.test(normalized) ? normalized : null;
  }

  function compareSha256Fingerprints(actual, expected) {
    const actualDigest = normalizeSha256Fingerprint(actual);
    const expectedDigest = normalizeSha256Fingerprint(expected);
    if (!actualDigest) return 'invalid-current';
    if (!expectedDigest) return 'invalid-reference';
    return actualDigest === expectedDigest ? 'match' : 'mismatch';
  }


  function comparableNumber(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (typeof value !== 'string' || !value.trim()) return null;
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }

  function compareBackupSnapshots(firstData, secondData) {
    const firstReport = inspectBackup(firstData);
    const secondReport = inspectBackup(secondData);
    if (!firstReport.valid || !secondReport.valid) {
      return {
        comparable: false,
        reason: 'invalid-backup',
        firstErrors: firstReport.errors.slice(),
        secondErrors: secondReport.errors.slice()
      };
    }

    const firstLife = isRecord(firstData) && firstData.format === 'hayah-backup'
      ? firstData.life : firstData;
    const secondLife = isRecord(secondData) && secondData.format === 'hayah-backup'
      ? secondData.life : secondData;
    const firstId = firstLife && firstLife.lifeId !== undefined && firstLife.lifeId !== null
      ? String(firstLife.lifeId).trim() : '';
    const secondId = secondLife && secondLife.lifeId !== undefined && secondLife.lifeId !== null
      ? String(secondLife.lifeId).trim() : '';
    if (!firstId || !secondId) {
      return { comparable: false, reason: 'identity-unavailable', firstErrors: [], secondErrors: [] };
    }
    if (firstId !== secondId) {
      return { comparable: false, reason: 'different-life', firstErrors: [], secondErrors: [] };
    }

    const readStats = life => {
      const source = isRecord(life && life.stats) ? life.stats : {};
      const result = {};
      ['happiness', 'health', 'smart', 'looks'].forEach(key => {
        result[key] = comparableNumber(source[key]);
      });
      return result;
    };
    const count = value => Array.isArray(value) ? value.length : null;
    const first = {
      name: firstReport.name,
      age: firstReport.age,
      bank: comparableNumber(firstLife.bank),
      debt: comparableNumber(firstLife.debt),
      logCount: count(firstLife.log),
      familyCount: count(firstLife.family),
      cemeteryCount: firstReport.cemeteryCount,
      stats: readStats(firstLife)
    };
    const second = {
      name: secondReport.name,
      age: secondReport.age,
      bank: comparableNumber(secondLife.bank),
      debt: comparableNumber(secondLife.debt),
      logCount: count(secondLife.log),
      familyCount: count(secondLife.family),
      cemeteryCount: secondReport.cemeteryCount,
      stats: readStats(secondLife)
    };
    const delta = (a, b) => a === null || b === null ? null : b - a;
    const statsDelta = {};
    Object.keys(first.stats).forEach(key => {
      statsDelta[key] = delta(first.stats[key], second.stats[key]);
    });
    const warnings = [];
    if (first.age !== null && second.age !== null && second.age < first.age) {
      warnings.push('العمر في النسخة الثانية أقل؛ قد تكون أقدم أو ناتجة عن الرجوع بالزمن.');
    }
    if (first.name !== second.name) {
      warnings.push('اسم الشخصية مختلف بين النسختين رغم تطابق معرّف الحياة.');
    }

    return {
      comparable: true,
      reason: 'same-life',
      identityId: firstId,
      first,
      second,
      deltas: {
        age: delta(first.age, second.age),
        bank: delta(first.bank, second.bank),
        debt: delta(first.debt, second.debt),
        logCount: delta(first.logCount, second.logCount),
        familyCount: delta(first.familyCount, second.familyCount),
        cemeteryCount: delta(first.cemeteryCount, second.cemeteryCount),
        stats: statsDelta
      },
      currency: String(firstLife.place && firstLife.place.unit || secondLife.place && secondLife.place.unit || 'ج.م').slice(0, 12),
      warnings
    };
  }

  function mount(doc, host) {
    if (!doc || !doc.getElementById) return;
    const input = doc.getElementById('backupFile');
    const compareInput = doc.getElementById('compareBackupFile');
    const dropZone = doc.getElementById('backupDropZone');
    const resultNode = doc.getElementById('backupResult');
    const comparisonResult = doc.getElementById('backupComparisonResult');
    const announcementNode = doc.getElementById('backupAnnouncement');
    const clearButton = doc.getElementById('clearBackupCheck');
    if (!input || !dropZone || !resultNode || !clearButton) return;

    const runtime = host || (typeof globalThis === 'object' ? globalThis : {});
    let activeReader = null;
    let inspectionSequence = 0;
    let comparisonReader = null;
    let comparisonSequence = 0;
    let primaryParsedData = null;
    const announce = message => {
      if (announcementNode) announcementNode.textContent = String(message || '');
    };

    // Invalidate any pending read before starting another inspection or clearing the report.
    // Some browsers may still deliver a late load callback after abort(), so the sequence
    // guard is authoritative even when cancellation is supported.
    const cancelPendingRead = () => {
      inspectionSequence += 1;
      const pending = activeReader;
      activeReader = null;
      if (pending && typeof pending.abort === 'function') {
        try { pending.abort(); } catch { /* A stale callback is still blocked by the sequence guard. */ }
      }
    };

    const cancelComparisonRead = () => {
      comparisonSequence += 1;
      const pending = comparisonReader;
      comparisonReader = null;
      if (pending && typeof pending.abort === 'function') {
        try { pending.abort(); } catch { /* The sequence guard rejects late callbacks. */ }
      }
    };

    const appendText = (parent, tag, className, value) => {
      const node = doc.createElement(tag);
      if (className) node.className = className;
      node.textContent = String(value);
      parent.appendChild(node);
      return node;
    };

    const resetComparison = message => {
      cancelComparisonRead();
      if (compareInput) {
        compareInput.value = '';
        compareInput.disabled = true;
      }
      if (comparisonResult) {
        comparisonResult.replaceChildren();
        appendText(comparisonResult, 'p', 'muted',
          message || 'افحص النسخة الأولى الصالحة، ثم اختر نسخة ثانية للمقارنة.');
      }
    };

    const showComparisonMessage = (message, kind) => {
      if (!comparisonResult) return;
      const panel = doc.createElement('div');
      panel.className = 'report-card ' + (kind || 'report-note');
      appendText(panel, 'p', 'report-status', message);
      comparisonResult.replaceChildren(panel);
      announce(message);
    };

    const showMessage = (message, kind) => {
      primaryParsedData = null;
      resetComparison('افحص نسخة أولى صالحة قبل اختيار نسخة ثانية للمقارنة.');
      const panel = doc.createElement('div');
      panel.className = 'report-card ' + (kind || 'report-note');
      appendText(panel, 'p', 'report-status', message);
      resultNode.replaceChildren(panel);
      clearButton.disabled = false;
      announce(message);
    };

    const renderReport = (file, report) => {
      const panel = doc.createElement('article');
      panel.className = 'report-card ' + (report.valid ? 'report-valid' : 'report-invalid');
      appendText(panel, 'h2', 'report-status',
        report.valid ? (report.warnings.length ? 'متوافق مبدئيًا مع شروط الاستيراد — مع ملاحظات' : 'اجتاز شروط الاستيراد الأساسية')
          : 'لن يجتاز الملف شروط الاستيراد الأساسية');

      const facts = [
        ['اسم الملف', file.name],
        ['حجم الملف', formatBytes(file.size)],
        ['بصمة SHA-256', report.sha256 || 'غير متاحة في هذا المتصفح'],
        ['نوع الملف', report.format],
        ['سلامة الحزمة', report.integrityStatus === 'verified' ? 'البصمة الداخلية سليمة' : report.integrityStatus === 'missing' ? 'بصمة مفقودة من حزمة حديثة' : report.integrityStatus === 'invalid-marker' ? 'علامة بصمة غير صالحة' : report.integrityStatus === 'legacy' ? 'نسخة قديمة بلا بصمة داخلية' : report.integrityStatus === 'mismatch' ? 'البصمة لا تطابق المحتوى' : report.integrityStatus === 'unsupported' ? 'بصمة غير مدعومة' : report.integrityStatus === 'unavailable' ? 'تعذر التحقق' : 'غير مطبق'],
        ['الشخصية', report.name || 'غير متاحة'],
        ['العمر بعد التطبيع', report.age === null ? 'غير متاح' : report.age + ' سنة'],
        ['إصدار بيانات الحياة', report.lifeVersion === null ? 'غير متاح' : report.lifeVersion],
        ['نقاط الرجوع بالزمن', report.rewindSnapshotCount],
        ['طول سجل الرجوع', report.rewindSnapshotChars ? report.rewindSnapshotChars + ' وحدة نصية' : 'لا توجد نقاط محفوظة'],
        ['نقاط قابلة للاستعادة بنيويًا قبل حدود السعة', report.rewindUsableSnapshotCount],
        ['تقدير الصالح للاستعادة — حد 8 نقاط', report.rewindBaseRestorableCount + ' من ' + report.rewindBaseRetainedCount],
        ['تقدير الصالح للاستعادة — حد 60 نقطة', report.rewindExpandedRestorableCount + ' من ' + report.rewindExpandedRetainedCount],
        ['نقاط مستبعدة — الحد الأساسي', report.rewindBaseDroppedCount],
        ['نقاط مستبعدة — الذاكرة الموسعة', report.rewindExpandedDroppedCount],
        ['نقاط JSON تالفة', report.rewindMalformedSnapshotCount],
        ['نقاط غير متوافقة مع الحياة الحالية', report.rewindUnusableSnapshotCount],
        ['مدخلات فارغة أو غير نصية', report.rewindInvalidSnapshotCount],
        ['الحيوات السابقة', report.cemeteryCount === null ? 'غير مشمولة' : report.cemeteryCount],
        ['إعدادات العرض', report.hasSettings ? 'مرفقة' : 'غير مرفقة'],
        ['المزايا الدائمة', report.hasPerks ? 'مرفقة' : 'غير مرفقة']
      ];
      const list = doc.createElement('dl');
      list.className = 'report-facts';
      facts.forEach(([label, value]) => {
        appendText(list, 'dt', '', label);
        appendText(list, 'dd', '', value);
      });
      panel.appendChild(list);

      if (report.sha256) {
        const fingerprintTools = doc.createElement('section');
        fingerprintTools.className = 'fingerprint-tools';
        fingerprintTools.setAttribute('aria-labelledby', 'fingerprintToolsTitle');
        const fingerprintTitle = appendText(fingerprintTools, 'h3', 'fingerprint-title', 'التحقق من تطابق النسخة');
        fingerprintTitle.id = 'fingerprintToolsTitle';

        const currentLabel = doc.createElement('label');
        currentLabel.className = 'fingerprint-field';
        appendText(currentLabel, 'span', 'fingerprint-label', 'بصمة الملف الحالي');
        const currentInput = doc.createElement('input');
        currentInput.type = 'text';
        currentInput.value = report.sha256;
        currentInput.readOnly = true;
        currentInput.dir = 'ltr';
        currentInput.className = 'fingerprint-value';
        currentInput.setAttribute('aria-label', 'بصمة الملف الحالي SHA-256');
        currentLabel.appendChild(currentInput);
        fingerprintTools.appendChild(currentLabel);

        const expectedLabel = doc.createElement('label');
        expectedLabel.className = 'fingerprint-field';
        appendText(expectedLabel, 'span', 'fingerprint-label', 'البصمة المسجلة قبل نقل الملف');
        const expectedInput = doc.createElement('input');
        expectedInput.type = 'text';
        expectedInput.value = '';
        expectedInput.dir = 'ltr';
        expectedInput.autocomplete = 'off';
        expectedInput.spellcheck = false;
        expectedInput.className = 'fingerprint-expected';
        expectedInput.placeholder = 'الصق بصمة SHA-256 المكونة من 64 خانة';
        expectedInput.setAttribute('aria-label', 'البصمة المرجعية من النسخة الأصلية');
        expectedLabel.appendChild(expectedInput);
        fingerprintTools.appendChild(expectedLabel);

        const actions = doc.createElement('div');
        actions.className = 'fingerprint-actions';
        const status = appendText(
          fingerprintTools,
          'p',
          'fingerprint-status',
          'الصق البصمة المسجلة قبل النقل ثم اضغط مقارنة.'
        );
        status.setAttribute('role', 'status');
        status.setAttribute('aria-live', 'polite');

        const copyButton = doc.createElement('button');
        copyButton.type = 'button';
        copyButton.className = 'button secondary fingerprint-copy';
        copyButton.textContent = 'نسخ البصمة';
        copyButton.addEventListener('click', async () => {
          const clipboard = runtime.navigator && runtime.navigator.clipboard;
          try {
            if (!clipboard || typeof clipboard.writeText !== 'function') {
              throw new Error('clipboard-unavailable');
            }
            await clipboard.writeText(report.sha256);
            status.className = 'fingerprint-status is-success';
            status.textContent = 'تم نسخ البصمة.';
          } catch {
            if (typeof currentInput.focus === 'function') currentInput.focus();
            if (typeof currentInput.select === 'function') currentInput.select();
            status.className = 'fingerprint-status';
            status.textContent = 'النسخ التلقائي غير متاح؛ حدد البصمة وانسخها يدويًا.';
          }
        });
        actions.appendChild(copyButton);

        const compareButton = doc.createElement('button');
        compareButton.type = 'button';
        compareButton.className = 'button fingerprint-compare';
        compareButton.textContent = 'مقارنة البصمة';
        compareButton.addEventListener('click', () => {
          const comparison = compareSha256Fingerprints(report.sha256, expectedInput.value);
          if (comparison === 'match') {
            status.className = 'fingerprint-status is-success';
            status.textContent = 'متطابقة: الملف يطابق البصمة المرجعية.';
          } else if (comparison === 'mismatch') {
            status.className = 'fingerprint-status is-warning';
            status.textContent = 'غير متطابقة: الملف مختلف عن البصمة المرجعية.';
          } else if (comparison === 'invalid-reference') {
            status.className = 'fingerprint-status is-warning';
            status.textContent = 'أدخل بصمة SHA-256 صحيحة من 64 خانة سداسية عشرية.';
          } else {
            status.className = 'fingerprint-status is-warning';
            status.textContent = 'بصمة الملف الحالي غير متاحة؛ أعد الفحص في متصفح يدعم Web Crypto.';
          }
        });
        actions.appendChild(compareButton);
        fingerprintTools.appendChild(actions);
        panel.appendChild(fingerprintTools);
      }


      if (report.errors.length) {
        appendText(panel, 'h3', 'report-errors-title', 'أخطاء تحتاج إلى مراجعة');
        const errors = doc.createElement('ul');
        errors.className = 'report-errors';
        report.errors.forEach(message => appendText(errors, 'li', '', message));
        panel.appendChild(errors);
      }
      if (report.warnings.length) {
        appendText(panel, 'h3', 'report-warnings-title', 'ملاحظات');
        const warnings = doc.createElement('ul');
        warnings.className = 'report-warnings';
        report.warnings.forEach(message => appendText(warnings, 'li', '', message));
        panel.appendChild(warnings);
      }
      appendText(panel, 'p', 'report-disclaimer',
        'البصمة الداخلية FNV-1a-32 تساعد على اكتشاف التلف أو التغيير العرضي، لكنها ليست توقيعًا أمنيًا ولا تثبت مصدر الملف. بصمة SHA-256 الخارجية تساعد على مقارنة الملف قبل النقل وبعده. احتفظ دائمًا بالنسخة الأصلية.');
      resultNode.replaceChildren(panel);
      clearButton.disabled = false;
      resetComparison(report.valid
        ? 'النسخة الأولى صالحة. اختر ملفًا ثانيًا لمقارنة التقدم دون تعديل أي ملف.'
        : 'لا يمكن المقارنة قبل اجتياز النسخة الأولى للفحص.');
      if (compareInput) compareInput.disabled = !report.valid;
      announce(report.valid
        ? (report.warnings.length
          ? 'اكتمل فحص ملف الحفظ: متوافق مبدئيًا مع ملاحظات.'
          : 'اكتمل فحص ملف الحفظ: اجتاز الشروط الأساسية.')
        : 'اكتمل فحص ملف الحفظ: توجد أخطاء تمنع اجتياز الشروط الأساسية.');
    };


    const formatComparisonNumber = value => {
      if (value === null || value === undefined || !Number.isFinite(Number(value))) return 'غير متاح';
      try {
        return new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 2 }).format(Number(value));
      } catch {
        return String(value);
      }
    };
    const formatComparisonDelta = value => {
      if (value === null || value === undefined || !Number.isFinite(Number(value))) return 'غير متاح';
      const number = Number(value);
      return (number > 0 ? '+' : '') + formatComparisonNumber(number);
    };

    const renderComparisonReport = (file, comparison) => {
      if (!comparisonResult) return;
      const panel = doc.createElement('article');
      panel.className = 'report-card ' + (comparison.comparable ? 'report-valid' : 'report-invalid');
      if (!comparison.comparable) {
        const messages = {
          'invalid-backup': 'تعذرت المقارنة لأن إحدى النسختين لا تجتاز فحص البنية.',
          'identity-unavailable': 'لا يمكن التأكد من أن الملفين يعودان إلى الحياة نفسها؛ أحدهما يفتقد معرّف حياة ثابتًا.',
          'different-life': 'الملفان يعودان إلى حياتين مختلفتين، لذلك لم نقارن أرقامهما.'
        };
        appendText(panel, 'h2', 'report-status', messages[comparison.reason] || 'تعذرت مقارنة النسختين.');
        if (comparison.secondErrors && comparison.secondErrors.length) {
          const errors = doc.createElement('ul');
          errors.className = 'report-errors';
          comparison.secondErrors.forEach(message => appendText(errors, 'li', '', message));
          panel.appendChild(errors);
        }
        appendText(panel, 'p', 'report-disclaimer',
          'لم يتم تعديل أي ملف أو بيانات داخل اللعبة. استخدم نسختين سليمتين من الحياة نفسها للمقارنة.');
        comparisonResult.replaceChildren(panel);
        announce('اكتملت محاولة المقارنة: تعذر إثبات تطابق هوية الحياة.');
        return;
      }

      appendText(panel, 'h2', 'report-status', 'النسختان تعودان إلى الحياة نفسها');
      const first = comparison.first;
      const second = comparison.second;
      const deltas = comparison.deltas;
      const unit = comparison.currency || 'ج.م';
      const facts = [
        ['الملف الثاني', file.name],
        ['الشخصية في النسخة الأولى', first.name || 'غير متاحة'],
        ['الشخصية في النسخة الثانية', second.name || 'غير متاحة'],
        ['العمر: الأولى ← الثانية', formatComparisonNumber(first.age) + ' ← ' + formatComparisonNumber(second.age) + ' سنة'],
        ['فرق العمر (الثانية ناقص الأولى)', formatComparisonDelta(deltas.age) + ' سنة'],
        ['فرق الرصيد البنكي', formatComparisonDelta(deltas.bank) + ' ' + unit],
        ['فرق الديون', formatComparisonDelta(deltas.debt) + ' ' + unit],
        ['فرق أحداث اليوميات', formatComparisonDelta(deltas.logCount)],
        ['فرق أفراد الأسرة', formatComparisonDelta(deltas.familyCount)],
        ['فرق سجلات المقبرة', formatComparisonDelta(deltas.cemeteryCount)]
      ];
      Object.keys(deltas.stats).forEach(key => {
        const labels = { happiness: 'السعادة', health: 'الصحة', smart: 'الذكاء', looks: 'المظهر' };
        facts.push(['فرق ' + labels[key], formatComparisonDelta(deltas.stats[key])]);
      });
      const list = doc.createElement('dl');
      list.className = 'report-facts';
      facts.forEach(([label, value]) => {
        appendText(list, 'dt', '', label);
        appendText(list, 'dd', '', value);
      });
      panel.appendChild(list);
      (comparison.warnings || []).forEach(message => appendText(panel, 'p', 'report-warnings-title', message));
      appendText(panel, 'p', 'report-disclaimer',
        'المقارنة تعرض الفرق بين الملف الأول والثاني بالترتيب الذي اخترته، ولا تفترض أن الثاني أحدث. لا يتم تعديل الملفين أو حفظ أي تغيير داخل اللعبة.');
      comparisonResult.replaceChildren(panel);
      announce('اكتملت مقارنة نسختين من الحياة نفسها.');
    };

    const inspectFile = file => {
      if (!file) return;
      cancelPendingRead();
      primaryParsedData = null;
      resetComparison('جارٍ فحص النسخة الأولى؛ ستتاح المقارنة بعد اجتياز الفحص.');
      const sequence = inspectionSequence;
      if (file.size > MAX_FILE_BYTES) {
        showMessage('حجم الملف أكبر من الحد الآمن للفحص (15 ميجابايت). لم تتم قراءة محتواه.', 'report-invalid');
        return;
      }
      if (typeof runtime.FileReader !== 'function') {
        showMessage('المتصفح الحالي لا يدعم قراءة الملفات محليًا. جرّب متصفحًا أحدث.', 'report-invalid');
        return;
      }

      announce('جارٍ فحص ملف الحفظ محليًا.');
      const reader = new runtime.FileReader();
      activeReader = reader;
      const isCurrentRead = () => sequence === inspectionSequence && activeReader === reader;
      reader.onerror = () => {
        if (!isCurrentRead()) return;
        activeReader = null;
        showMessage('تعذّرت قراءة الملف من الجهاز.', 'report-invalid');
      };
      reader.onabort = () => {
        if (isCurrentRead()) activeReader = null;
      };
      reader.onload = async () => {
        if (!isCurrentRead()) return;
        activeReader = null;
        try {
          const parsed = JSON.parse(String(reader.result || ''));
          const sha256 = await sha256Fingerprint(file, runtime.crypto);
          // A newer file selection or a clear action invalidates this async digest.
          if (sequence !== inspectionSequence) return;
          const report = inspectBackup(parsed);
          primaryParsedData = report.valid ? parsed : null;
          renderReport(file, { ...report, sha256 });
        } catch {
          if (sequence !== inspectionSequence) return;
          showMessage('الملف ليس JSON صالحًا أو تعذّرت قراءته.', 'report-invalid');
        }
      };
      try {
        reader.readAsText(file, 'UTF-8');
      } catch {
        if (!isCurrentRead()) return;
        activeReader = null;
        showMessage('تعذّرت قراءة الملف من الجهاز.', 'report-invalid');
      }
    };


    const inspectComparisonFile = file => {
      if (!file || !compareInput || !comparisonResult) return;
      cancelComparisonRead();
      const sequence = comparisonSequence;
      if (!primaryParsedData) {
        showComparisonMessage('افحص النسخة الأولى واجعلها صالحة قبل اختيار نسخة ثانية.', 'report-invalid');
        return;
      }
      if (file.size > MAX_FILE_BYTES) {
        showComparisonMessage('حجم النسخة الثانية أكبر من الحد الآمن للفحص (15 ميجابايت). لم تتم قراءتها.', 'report-invalid');
        return;
      }
      if (typeof runtime.FileReader !== 'function') {
        showComparisonMessage('المتصفح الحالي لا يدعم قراءة الملفات محليًا.', 'report-invalid');
        return;
      }
      announce('جارٍ فحص النسخة الثانية ومقارنتها محليًا.');
      const reader = new runtime.FileReader();
      comparisonReader = reader;
      const isCurrentRead = () => sequence === comparisonSequence && comparisonReader === reader;
      reader.onerror = () => {
        if (!isCurrentRead()) return;
        comparisonReader = null;
        showComparisonMessage('تعذّرت قراءة النسخة الثانية من الجهاز.', 'report-invalid');
      };
      reader.onabort = () => {
        if (isCurrentRead()) comparisonReader = null;
      };
      reader.onload = () => {
        if (!isCurrentRead()) return;
        comparisonReader = null;
        try {
          const parsed = JSON.parse(String(reader.result || ''));
          if (sequence !== comparisonSequence) return;
          renderComparisonReport(file, compareBackupSnapshots(primaryParsedData, parsed));
        } catch {
          if (sequence !== comparisonSequence) return;
          showComparisonMessage('النسخة الثانية ليست JSON صالحًا أو تعذّرت قراءتها.', 'report-invalid');
        }
      };
      try {
        reader.readAsText(file, 'UTF-8');
      } catch {
        if (!isCurrentRead()) return;
        comparisonReader = null;
        showComparisonMessage('تعذّرت قراءة النسخة الثانية من الجهاز.', 'report-invalid');
      }
    };

    input.addEventListener('change', event => inspectFile(event.target.files && event.target.files[0]));
    if (compareInput) {
      compareInput.addEventListener('change', event =>
        inspectComparisonFile(event.target.files && event.target.files[0]));
    }
    dropZone.addEventListener('dragover', event => {
      event.preventDefault();
      dropZone.classList.add('is-dragging');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('is-dragging'));
    dropZone.addEventListener('drop', event => {
      event.preventDefault();
      dropZone.classList.remove('is-dragging');
      inspectFile(event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]);
    });
    clearButton.addEventListener('click', () => {
      cancelPendingRead();
      primaryParsedData = null;
      resetComparison('افحص نسخة أولى صالحة، ثم اختر نسخة ثانية للمقارنة.');
      input.value = '';
      resultNode.replaceChildren();
      appendText(resultNode, 'p', 'muted', 'لم يتم اختيار ملف بعد.');
      clearButton.disabled = true;
      announce('تم مسح نتيجة الفحص.');
      input.focus();
    });
  }

  return { MAX_FILE_BYTES, MAX_REWIND_SNAPSHOT_CHARS, inspectRewindHistory, inspectBackup, formatBytes, sha256Fingerprint, normalizeSha256Fingerprint, compareSha256Fingerprints, compareBackupSnapshots, mount };
});
