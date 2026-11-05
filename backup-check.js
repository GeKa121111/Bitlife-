(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.HayahBackupCheck = api;
  if (root && root.document) api.mount(root.document, root);
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';

  const MAX_FILE_BYTES = 15 * 1024 * 1024;

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
    if (!Number.isInteger(life.age) || life.age < 0 || life.age > 150) {
      errors.push('العمر مفقود أو خارج النطاق المتوقع من 0 إلى 150 سنة.');
    }

    if (!isRecord(life.stats)) warnings.push('قسم الإحصائيات غير موجود ككائن؛ قد يحتاج الملف إلى تطبيع عند الاستيراد.');
    if (!Array.isArray(life.log)) warnings.push('سجل الأحداث غير موجود كمصفوفة.');
    if (!Array.isArray(life.family)) warnings.push('بيانات الأسرة غير موجودة كمصفوفة.');
    if (!isRecord(life.place)) warnings.push('بيانات مكان الإقامة غير موجودة ككائن.');

    return {
      name: typeof life.name === 'string' && life.name.trim() ? life.name.trim() : null,
      age: Number.isInteger(life.age) ? life.age : null,
      version: life.version
    };
  }

  function inspectBackup(data) {
    const errors = [];
    const warnings = [];
    let format = 'ملف غير معروف';
    let life = null;
    let cemeteryCount = null;
    let hasSettings = false;
    let hasPerks = false;

    if (isRecord(data) && data.format === 'hayah-backup') {
      format = 'حزمة حفظ حياة كاملة';
      if (data.backupVersion !== 1) {
        errors.push('إصدار حزمة النسخ الاحتياطي غير مدعوم؛ الإصدار المتوقع هو 1.');
      }
      life = data.life;

      if (!Array.isArray(data.cemetery)) {
        errors.push('سجل المقبرة غير موجود كمصفوفة.');
      } else {
        cemeteryCount = data.cemetery.length;
        const invalidEntry = data.cemetery.findIndex(entry => !isRecord(entry));
        if (invalidEntry !== -1) {
          errors.push('يوجد سجل غير صالح في المقبرة عند الموضع ' + (invalidEntry + 1) + '.');
        }
      }

      hasSettings = isRecord(data.settings);
      hasPerks = isRecord(data.perks);
      if (!hasSettings) warnings.push('إعدادات العرض غير مرفقة في الحزمة.');
      if (!hasPerks) warnings.push('بيانات المزايا الدائمة غير مرفقة في الحزمة.');
    } else if (isRecord(data) && data.version === 1) {
      format = 'حفظ حياة منفرد — الإصدار 1';
      life = data;
      warnings.push('هذا الملف يحتوي على حياة واحدة فقط؛ لا يتضمن المقبرة أو إعدادات العرض أو المزايا الدائمة.');
    } else {
      errors.push('صيغة الملف غير معروفة. اختر حزمة hayah-backup أو ملف حياة قديمًا بإصدار بيانات 1.');
    }

    const identity = life ? inspectLife(life, errors, warnings) : { name: null, age: null, version: null };
    return {
      valid: errors.length === 0,
      format,
      name: identity.name,
      age: identity.age,
      lifeVersion: identity.version,
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

  function mount(doc, host) {
    if (!doc || !doc.getElementById) return;
    const input = doc.getElementById('backupFile');
    const dropZone = doc.getElementById('backupDropZone');
    const resultNode = doc.getElementById('backupResult');
    const clearButton = doc.getElementById('clearBackupCheck');
    if (!input || !dropZone || !resultNode || !clearButton) return;

    const runtime = host || (typeof globalThis === 'object' ? globalThis : {});
    const appendText = (parent, tag, className, value) => {
      const node = doc.createElement(tag);
      if (className) node.className = className;
      node.textContent = String(value);
      parent.appendChild(node);
      return node;
    };

    const showMessage = (message, kind) => {
      const panel = doc.createElement('div');
      panel.className = 'report-card ' + (kind || 'report-note');
      appendText(panel, 'p', 'report-status', message);
      resultNode.replaceChildren(panel);
      clearButton.disabled = false;
    };

    const renderReport = (file, report) => {
      const panel = doc.createElement('article');
      panel.className = 'report-card ' + (report.valid ? 'report-valid' : 'report-invalid');
      appendText(panel, 'h2', 'report-status',
        report.valid ? (report.warnings.length ? 'اكتمل الفحص مع ملاحظات' : 'البنية الأساسية سليمة')
          : 'الملف غير صالح بنيويًا');

      const facts = [
        ['اسم الملف', file.name],
        ['حجم الملف', formatBytes(file.size)],
        ['نوع الملف', report.format],
        ['الشخصية', report.name || 'غير متاحة'],
        ['العمر', report.age === null ? 'غير متاح' : report.age + ' سنة'],
        ['إصدار بيانات الحياة', report.lifeVersion === null ? 'غير متاح' : report.lifeVersion],
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
        'هذا فحص بنيوي أولي فقط، وليس ضمانًا لقبول الملف داخل اللعبة. احتفظ بالملف الأصلي ولا تستبدل حفظك الحالي اعتمادًا على هذه النتيجة وحدها.');
      resultNode.replaceChildren(panel);
      clearButton.disabled = false;
    };

    const inspectFile = file => {
      if (!file) return;
      if (file.size > MAX_FILE_BYTES) {
        showMessage('حجم الملف أكبر من الحد الآمن للفحص (15 ميجابايت). لم تتم قراءة محتواه.', 'report-invalid');
        return;
      }
      if (typeof runtime.FileReader !== 'function') {
        showMessage('المتصفح الحالي لا يدعم قراءة الملفات محليًا. جرّب متصفحًا أحدث.', 'report-invalid');
        return;
      }

      const reader = new runtime.FileReader();
      reader.onerror = () => showMessage('تعذّرت قراءة الملف من الجهاز.', 'report-invalid');
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result || ''));
          renderReport(file, inspectBackup(parsed));
        } catch {
          showMessage('الملف ليس JSON صالحًا أو تعذّرت قراءته.', 'report-invalid');
        }
      };
      reader.readAsText(file, 'UTF-8');
    };

    input.addEventListener('change', event => inspectFile(event.target.files && event.target.files[0]));
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
      input.value = '';
      resultNode.replaceChildren();
      appendText(resultNode, 'p', 'muted', 'لم يتم اختيار ملف بعد.');
      clearButton.disabled = true;
      input.focus();
    });
  }

  return { MAX_FILE_BYTES, inspectBackup, formatBytes, mount };
});
