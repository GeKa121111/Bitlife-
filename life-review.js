(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.HayahLifeReview = api;
  if (root && root.document) api.mount(root.document, root);
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';

  const SAVE_KEY = 'hekayat_hayah_save_v1';
  const CEMETERY_KEY = 'hekayat_hayah_cemetery_v1';
  const CEMETERY_BACKUP_KEY = 'hekayat_hayah_cemetery_backup_v1';
  const MAX_MILESTONES = 6;
  const MAX_ACCOMPLISHMENTS = 8;
  const IMPORTANT_EVENT = /تخرج|جامعة|زواج|إنجاب|مولود|ابن|ابنة|ترقية|وظيفة|شركة|مشروع|بطولة|فيلم|جائزة|سفر|هجرة|تقاعد|استثمار|عقار|نزال|لقب|ورث|إرث|شهادة|منحة|نجاح|تعافٍ|شفاء/;

  function isRecord(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }

  function finite(value, fallback) {
    if (value === null || value === undefined || value === '' || !Number.isFinite(Number(value))) {
      return fallback === undefined ? 0 : fallback;
    }
    return Number(value);
  }

  function list(value) {
    return Array.isArray(value) ? value : [];
  }

  function sumValues(items) {
    return list(items).reduce((total, item) => {
      if (!isRecord(item)) return total;
      const value = item.value !== undefined ? item.value :
        item.marketValue !== undefined ? item.marketValue : item.estimatedValue;
      return total + Math.max(0, finite(value, 0));
    }, 0);
  }

  function findCemeteryEntry(state, cemeteryEntries) {
    const lifeId = state && state.lifeId;
    if (lifeId === undefined || lifeId === null || String(lifeId).trim() === '') return null;
    return list(cemeteryEntries).find(entry =>
      isRecord(entry) && String(entry.id) === String(lifeId)
    ) || null;
  }

  function careerLabel(item) {
    if (typeof item === 'string') return item.trim().slice(0, 80);
    if (!isRecord(item)) return '';
    const value = item.title || item.name || item.role || item.position || item.company || item.id;
    return typeof value === 'string' || typeof value === 'number' ? String(value).trim().slice(0, 80) : '';
  }

  function collectCareerHistory(state) {
    const entries = [
      ...list(state && state.jobHistory),
      ...list(state && state.specialCareerHistory)
    ];
    const seen = new Set();
    return entries.map(careerLabel).filter(label => {
      if (!label || seen.has(label)) return false;
      seen.add(label);
      return true;
    }).slice(-8).reverse();
  }

  function readNonNegativeNumber(value, limit) {
    if (typeof value !== 'number' && typeof value !== 'string') return 0;
    if (typeof value === 'string' && !value.trim()) return 0;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) return 0;
    return Math.min(parsed, limit === undefined ? 1000000000000 : limit);
  }

  function formatCount(value) {
    try {
      return new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(value);
    } catch {
      return String(value);
    }
  }

  function collectSpecializedHighlights(state) {
    if (!isRecord(state)) return [];
    const highlights = [];
    const combat = isRecord(state.combatCareer) ? state.combatCareer : null;
    if (combat) {
      const wins = Math.floor(readNonNegativeNumber(combat.wins, 1000000));
      const losses = Math.floor(readNonNegativeNumber(combat.losses, 1000000));
      const knockouts = Math.floor(readNonNegativeNumber(combat.knockouts, 1000000));
      const defenses = list(combat.titleDefenseHistory).filter(item => isRecord(item) && item.result === 'defended').length;
      const parts = [];
      if (wins + losses > 0) parts.push(formatCount(wins) + ' فوز و' + formatCount(losses) + ' خسارة');
      if (knockouts > 0) parts.push(formatCount(knockouts) + ' انتصارًا بالضربة القاضية');
      if (defenses > 0) parts.push(formatCount(defenses) + ' دفاع ناجح عن اللقب');
      if (combat.champion === true) parts.push('حامل اللقب عند نهاية الرحلة');
      if (parts.length) highlights.push({ title: 'مسيرة القتال', text: parts.join(' · ') });
    }

    const studio = isRecord(state.filmStudio) ? state.filmStudio : null;
    if (studio) {
      const filmCount = Math.max(Math.floor(readNonNegativeNumber(studio.projects, 1000000)), list(studio.filmography).filter(isRecord).length);
      const awards = Math.floor(readNonNegativeNumber(studio.awards, 1000000));
      const boxOffice = readNonNegativeNumber(studio.totalBoxOffice, 1000000000000000);
      const parts = [];
      if (filmCount > 0) parts.push(formatCount(filmCount) + ' مشروع سينمائي');
      if (awards > 0) parts.push(formatCount(awards) + ' جائزة');
      if (boxOffice > 0) parts.push('إيرادات شباك التذاكر ' + formatMoney(boxOffice, isRecord(state.place) ? state.place.unit : 'ج.م'));
      if (parts.length) highlights.push({ title: 'استوديو الأفلام', text: parts.join(' · ') });
    }

    const esports = isRecord(state.esportsCareer) ? state.esportsCareer : null;
    if (esports) {
      const tournaments = Math.floor(readNonNegativeNumber(esports.tournaments, 1000000));
      const wins = Math.floor(readNonNegativeNumber(esports.wins, 1000000));
      const losses = Math.floor(readNonNegativeNumber(esports.losses, 1000000));
      if (tournaments + wins + losses > 0) {
        highlights.push({ title: 'الألعاب الإلكترونية', text: formatCount(tournaments) + ' بطولة · ' + formatCount(wins) + ' فوز · ' + formatCount(losses) + ' خسارة' });
      }
    }

    const businesses = [];
    if (isRecord(state.business)) businesses.push(state.business);
    list(state.companies).forEach(item => { if (isRecord(item)) businesses.push(item); });
    const seenBusinesses = new Set();
    businesses.forEach(item => {
      const identity = [item.id, item.assetId, item.title, item.name].find(value => (typeof value === 'string' || typeof value === 'number') && String(value).trim());
      if (identity === undefined) return;
      seenBusinesses.add(String(identity).trim().toLocaleLowerCase());
    });
    if (seenBusinesses.size > 0) highlights.push({ title: 'إدارة الأعمال', text: formatCount(seenBusinesses.size) + ' نشاط تجاري في سجل الملكية' });
    return highlights;
  }

  function collectMilestones(log) {
    const entries = list(log).filter(entry => isRecord(entry) &&
      typeof entry.title === 'string' && entry.title.trim());
    const important = entries.filter(entry =>
      IMPORTANT_EVENT.test(entry.title) || entry.tone === 'special'
    );
    const source = important.length ? important : entries;
    const seen = new Set();
    const result = [];
    for (let index = source.length - 1; index >= 0 && result.length < MAX_MILESTONES; index--) {
      const entry = source[index];
      const title = entry.title.trim().slice(0, 100);
      const age = Number.isFinite(Number(entry.age)) ? Math.max(0, Math.min(150, Math.floor(Number(entry.age)))) : null;
      const key = String(age) + '|' + title;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push({
        age,
        title,
        text: typeof entry.text === 'string' ? entry.text.trim().slice(0, 180) : ''
      });
    }
    return result;
  }

  function summarizeLife(state, cemeteryEntries) {
    if (!isRecord(state) || state.version !== 1 ||
        typeof state.name !== 'string' || !state.name.trim()) return null;
    const ageText = state.age === null || state.age === undefined ? '' : String(state.age).trim();
    const age = Number(state.age);
    if (!ageText || !Number.isFinite(age) || age < 0 || age > 150) return null;

    const assets = list(state.assets);
    const investments = list(state.investments);
    const bank = finite(state.bank, 0);
    const debt = Math.max(0, finite(state.debt, 0));
    const assetsValue = sumValues(assets);
    const investmentsValue = sumValues(investments);
    const cemeteryEntry = findCemeteryEntry(state, cemeteryEntries);
    const education = isRecord(state.education) ? state.education : {};
    const job = isRecord(state.job) ? state.job : null;
    const specialCareer = isRecord(state.specialCareer) ? state.specialCareer : null;
    const partner = isRecord(state.partner) ? state.partner : null;
    const career = job ? careerLabel(job) :
      specialCareer ? careerLabel(specialCareer) :
      state.retired ? 'متقاعد' : 'لا يوجد مسار مهني مسجل';
    const educationLabel = [education.major, education.degree, education.school]
      .find(value => typeof value === 'string' && value.trim()) ||
      (finite(education.level, 0) > 0 ? 'المستوى التعليمي ' + finite(education.level, 0) : 'غير مسجل');
    const accomplishments = list(state.accomplishments)
      .filter(value => typeof value === 'string' && value.trim())
      .map(value => value.trim().slice(0, 120))
      .slice(0, MAX_ACCOMPLISHMENTS);
    const milestones = collectMilestones(state.log);
    const country = isRecord(state.place) && typeof state.place.country === 'string'
      ? state.place.country.trim().slice(0, 80) : '';
    const unit = isRecord(state.place) && typeof state.place.unit === 'string'
      ? state.place.unit.trim().slice(0, 16) : 'ج.م';

    return {
      name: state.name.trim().slice(0, 80),
      age: Math.floor(age),
      cause: typeof state.cause === 'string' ? state.cause.trim().slice(0, 120) : 'غير مسجل',
      country,
      unit,
      ribbon: cemeteryEntry && typeof cemeteryEntry.ribbon === 'string' ? cemeteryEntry.ribbon.slice(0, 80) : 'غير مسجل',
      bank,
      debt,
      assetsCount: assets.length,
      assetsValue,
      investmentsCount: investments.length,
      investmentsValue,
      netWorth: bank + assetsValue + investmentsValue - debt,
      childrenCount: list(state.children).length,
      familyCount: list(state.family).length,
      friendsCount: list(state.friends).length,
      petsCount: list(state.pets).length,
      partnerName: partner && typeof partner.name === 'string' ? partner.name.slice(0, 80) : '',
      career,
      careerHistory: collectCareerHistory(state),
      specializedHighlights: collectSpecializedHighlights(state),
      education: String(educationLabel).slice(0, 100),
      accomplishments,
      accomplishmentsCount: list(state.accomplishments).length,
      eventCount: list(state.log).length,
      milestones
    };
  }

  function formatMoney(value, unit) {
    const amount = finite(value, 0);
    let formatted;
    try {
      formatted = new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(Math.round(amount));
    } catch {
      formatted = String(Math.round(amount));
    }
    return formatted + ' ' + (unit || 'ج.م');
  }

  function createElement(doc, tag, className, text) {
    const node = doc.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function appendMetric(doc, grid, label, value) {
    const cell = createElement(doc, 'div', 'life-review-metric');
    cell.append(
      createElement(doc, 'span', 'life-review-metric-label', label),
      createElement(doc, 'strong', 'life-review-metric-value', value)
    );
    grid.appendChild(cell);
  }

  function appendSection(doc, panel, title) {
    const section = createElement(doc, 'section', 'life-review-section');
    section.appendChild(createElement(doc, 'h3', 'life-review-section-title', title));
    panel.appendChild(section);
    return section;
  }

  function appendList(doc, section, items, emptyText) {
    const listNode = createElement(doc, 'ul', 'life-review-list');
    if (!items.length) {
      listNode.appendChild(createElement(doc, 'li', 'life-review-empty', emptyText));
    } else {
      items.forEach(item => {
        const row = createElement(doc, 'li', 'life-review-list-item');
        if (isRecord(item)) {
          const title = item.age === null ? item.title : 'عمر ' + item.age + ' · ' + item.title;
          row.appendChild(createElement(doc, 'strong', 'life-review-list-title', title));
          if (item.text) row.appendChild(createElement(doc, 'span', 'life-review-list-copy', item.text));
        } else {
          row.textContent = String(item);
        }
        listNode.appendChild(row);
      });
    }
    section.appendChild(listNode);
  }

  function buildReport(doc, summary, close) {
    const panel = createElement(doc, 'div', 'life-review-panel');
    panel.setAttribute('data-life-review-panel', 'true');
    const header = createElement(doc, 'header', 'life-review-header');
    const heading = createElement(doc, 'div', 'life-review-heading');
    heading.append(
      createElement(doc, 'span', 'life-review-eyebrow', 'دفتر الرحلة'),
      createElement(doc, 'h2', '', 'حياة ' + summary.name),
      createElement(doc, 'p', '', 'مراجعة هادئة لأهم ما تركته هذه الحياة من محطات وأثر.')
    );
    const closeButton = createElement(doc, 'button', 'life-review-close', '×');
    closeButton.type = 'button';
    closeButton.setAttribute('aria-label', 'إغلاق دفتر الرحلة');
    closeButton.setAttribute('data-life-review-close', 'true');
    closeButton.addEventListener('click', close);
    header.append(heading, closeButton);
    panel.appendChild(header);

    const ribbon = createElement(doc, 'div', 'life-review-ribbon',
      'شريط الحياة: ' + summary.ribbon + (summary.country ? ' · ' + summary.country : ''));
    panel.appendChild(ribbon);

    const metrics = createElement(doc, 'div', 'life-review-metrics');
    appendMetric(doc, metrics, 'العمر', summary.age + ' سنة');
    appendMetric(doc, metrics, 'صافي الثروة', formatMoney(summary.netWorth, summary.unit));
    appendMetric(doc, metrics, 'الأبناء', summary.childrenCount);
    appendMetric(doc, metrics, 'الإنجازات', summary.accomplishmentsCount);
    appendMetric(doc, metrics, 'الأصول', summary.assetsCount);
    appendMetric(doc, metrics, 'أحداث اليوميات', summary.eventCount);
    panel.appendChild(metrics);

    const personal = appendSection(doc, panel, 'المسار الشخصي');
    personal.appendChild(createElement(doc, 'p', 'life-review-summary-line', 'آخر مسار مهني: ' + summary.career));
    personal.appendChild(createElement(doc, 'p', 'life-review-summary-line', 'التعليم: ' + summary.education));
    appendList(doc, personal, summary.careerHistory, 'لا يوجد سجل مهني سابق محفوظ.');

    const specialized = appendSection(doc, panel, 'بصمة المسارات المتخصصة');
    appendList(doc, specialized, summary.specializedHighlights, 'لم تُسجل نتائج لمسارات متخصصة في هذه الحياة.');

    const relationships = appendSection(doc, panel, 'الأسرة والعلاقات');
    const relationshipItems = [
      'الأبناء: ' + summary.childrenCount,
      'أفراد الأسرة: ' + summary.familyCount,
      'الأصدقاء: ' + summary.friendsCount,
      'الحيوانات الأليفة: ' + summary.petsCount
    ];
    if (summary.partnerName) relationshipItems.push('الشريك: ' + summary.partnerName);
    appendList(doc, relationships, relationshipItems, 'لا توجد بيانات علاقات مسجلة.');

    const finances = appendSection(doc, panel, 'المال والأصول');
    appendList(doc, finances, [
      'الرصيد البنكي: ' + formatMoney(summary.bank, summary.unit),
      'قيمة الأصول: ' + formatMoney(summary.assetsValue, summary.unit),
      'قيمة الاستثمارات: ' + formatMoney(summary.investmentsValue, summary.unit),
      'الديون: ' + formatMoney(summary.debt, summary.unit)
    ], 'لا توجد بيانات مالية مسجلة.');

    const milestones = appendSection(doc, panel, 'محطات مختارة');
    appendList(doc, milestones, summary.milestones, 'سجل اليوميات لا يحتوي على محطات كافية للعرض.');

    const achievements = appendSection(doc, panel, 'إنجازاتك');
    appendList(doc, achievements, summary.accomplishments, 'لم تُسجل إنجازات في هذه الحياة.');

    panel.appendChild(createElement(doc, 'p', 'life-review-note',
      'هذا التقرير للقراءة فقط، ويُبنى محليًا من بيانات الحياة المحفوظة. لا يغيّر الحفظ أو سجل المقبرة.'));
    const footer = createElement(doc, 'div', 'life-review-footer');
    const done = createElement(doc, 'button', 'life-review-done', 'العودة إلى ملخص النهاية');
    done.type = 'button';
    done.addEventListener('click', close);
    footer.appendChild(done);
    panel.appendChild(footer);
    return panel;
  }

  function readJson(storage, key) {
    try {
      const raw = storage && storage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function openReport(doc, host) {
    const dialog = doc && doc.getElementById ? doc.getElementById('deathDialog') : null;
    if (!dialog || dialog.getAttribute('data-life-review-open') === 'true') return false;

    let storage = null;
    try { storage = host && host.localStorage; } catch { storage = null; }
    const state = readJson(storage, SAVE_KEY);
    const cemetery = readJson(storage, CEMETERY_KEY) || readJson(storage, CEMETERY_BACKUP_KEY);
    const summary = summarizeLife(state, cemetery);
    const originalNodes = Array.from(dialog.childNodes);
    const originalLabel = dialog.getAttribute('aria-labelledby');
    const originalDescription = dialog.getAttribute('aria-describedby');
    const originalOpenValue = dialog.getAttribute('data-life-review-open');
    const hadLabel = originalLabel !== null;
    const hadDescription = originalDescription !== null;
    let closed = false;
    let escapeHandler = null;

    const close = () => {
      if (closed) return;
      closed = true;
      dialog.replaceChildren(...originalNodes);
      if (originalOpenValue !== null) dialog.setAttribute('data-life-review-open', originalOpenValue);
      else dialog.removeAttribute('data-life-review-open');
      if (hadLabel) dialog.setAttribute('aria-labelledby', originalLabel);
      else dialog.removeAttribute('aria-labelledby');
      if (hadDescription) dialog.setAttribute('aria-describedby', originalDescription);
      else dialog.removeAttribute('aria-describedby');
      if (escapeHandler) doc.removeEventListener('keydown', escapeHandler, true);
      const reviewButton = doc.getElementById('reviewBtn');
      if (reviewButton && typeof reviewButton.focus === 'function') reviewButton.focus();
    };

    if (summary) {
      dialog.replaceChildren(buildReport(doc, summary, close));
      dialog.setAttribute('aria-labelledby', 'lifeReviewTitle');
      const title = dialog.querySelector('.life-review-heading h2');
      if (title) title.id = 'lifeReviewTitle';
      const description = dialog.querySelector('.life-review-heading p');
      if (description) {
        description.id = 'lifeReviewDescription';
        dialog.setAttribute('aria-describedby', 'lifeReviewDescription');
      } else {
        dialog.removeAttribute('aria-describedby');
      }
    } else {
      const panel = createElement(doc, 'div', 'life-review-panel');
      panel.setAttribute('data-life-review-panel', 'true');
      panel.append(
        createElement(doc, 'h2', '', 'تعذر قراءة دفتر الرحلة'),
        createElement(doc, 'p', '', 'لم نتمكن من قراءة نسخة حياة صالحة. لم نغيّر أي بيانات؛ يمكنك الرجوع إلى ملخص النهاية والمحافظة على ملف النسخة الاحتياطية.')
      );
      const closeButton = createElement(doc, 'button', 'life-review-done', 'العودة إلى ملخص النهاية');
      closeButton.type = 'button';
      closeButton.setAttribute('data-life-review-close', 'true');
      closeButton.addEventListener('click', close);
      panel.appendChild(closeButton);
      dialog.replaceChildren(panel);
      dialog.setAttribute('aria-labelledby', 'lifeReviewTitle');
      const title = panel.querySelector('h2');
      if (title) title.id = 'lifeReviewTitle';
      dialog.removeAttribute('aria-describedby');
    }

    dialog.setAttribute('data-life-review-open', 'true');
    escapeHandler = event => {
      if (event.key !== 'Escape' || closed) return;
      event.preventDefault();
      event.stopPropagation();
      close();
    };
    doc.addEventListener('keydown', escapeHandler, true);
    const firstControl = dialog.querySelector('[data-life-review-close], .life-review-done');
    if (firstControl && typeof firstControl.focus === 'function') firstControl.focus();
    return true;
  }

  function mount(doc, host) {
    if (!doc || typeof doc.addEventListener !== 'function') return () => {};
    const runtime = host || (typeof globalThis === 'object' ? globalThis : {});
    const handleReviewClick = event => {
      const target = event.target;
      const button = target && typeof target.closest === 'function' ? target.closest('#reviewBtn') : null;
      if (!button || !doc.getElementById('deathDialog')) return;
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
      openReport(doc, runtime);
    };
    doc.addEventListener('click', handleReviewClick, true);
    return () => doc.removeEventListener('click', handleReviewClick, true);
  }

  return {
    SAVE_KEY,
    summarizeLife,
    collectMilestones,
    collectSpecializedHighlights,
    formatMoney,
    openReport,
    mount
  };
});
