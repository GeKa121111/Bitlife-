(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.HayahFilmRightsForecast = api;
  if (root && root.document) api.mount(root.document, root);
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';

  const SAVE_KEY = 'hekayat_hayah_save_v1';
  const MAX_CONTRACTS = 200;
  const MAX_HORIZON = 5;
  const MAX_TERM_YEARS = 20;

  function isRecord(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }

  function safeText(value) {
    return typeof value === 'string' ? value.trim().slice(0, 100) : '';
  }

  function isSafeNonNegativeInteger(value) {
    return Number.isSafeInteger(value) && value >= 0;
  }

  function unavailable(reason) {
    return {
      available: false,
      reason: reason || 'تعذر قراءة بيانات العقود المحفوظة.',
      currentYear: null,
      horizon: MAX_HORIZON,
      activeContracts: 0,
      excludedContracts: 0,
      complete: false,
      totalForecast: 0n,
      years: [],
      contracts: []
    };
  }

  function normalizeActiveContract(contract, currentYear) {
    if (!isRecord(contract) || contract.status !== 'active') return null;
    const id = safeText(contract.id);
    const filmId = safeText(contract.filmId);
    const filmTitle = safeText(contract.filmTitle);
    const partnerId = safeText(contract.partnerId);
    const partnerTitle = safeText(contract.partnerTitle);
    const startYear = contract.startYear;
    const lastPaidYear = contract.lastPaidYear;
    const termYears = contract.termYears;
    const yearsRemaining = contract.yearsRemaining;
    const annualRoyalty = contract.annualRoyalty;
    const advancePaid = contract.advancePaid;
    const totalPaid = contract.totalPaid;

    if (!id || !filmId || !filmTitle || !partnerId || !partnerTitle) return null;
    if (!isSafeNonNegativeInteger(startYear) || startYear > currentYear) return null;
    if (!isSafeNonNegativeInteger(lastPaidYear) || lastPaidYear < startYear || lastPaidYear > currentYear) return null;
    if (!Number.isSafeInteger(termYears) || termYears < 1 || termYears > MAX_TERM_YEARS) return null;
    if (!Number.isSafeInteger(yearsRemaining) || yearsRemaining < 1 || yearsRemaining > termYears) return null;
    if (!isSafeNonNegativeInteger(annualRoyalty)) return null;
    if (!isSafeNonNegativeInteger(advancePaid) || !isSafeNonNegativeInteger(totalPaid)) return null;

    return {
      id,
      filmId,
      filmTitle,
      partnerId,
      partnerTitle,
      startYear,
      lastPaidYear,
      termYears,
      yearsRemaining,
      annualRoyalty: BigInt(annualRoyalty)
    };
  }

  function buildForecast(state, requestedHorizon) {
    if (typeof BigInt !== 'function') return unavailable('هذا المتصفح لا يدعم الحساب الدقيق المطلوب للتوقعات.');
    if (!isRecord(state) || state.version !== 1) return unavailable('لا توجد حياة محفوظة بصيغة مدعومة.');
    const currentYear = state.yearCount;
    const horizon = Number.isSafeInteger(requestedHorizon)
      ? Math.max(1, Math.min(MAX_HORIZON, requestedHorizon))
      : MAX_HORIZON;
    if (!isSafeNonNegativeInteger(currentYear) || currentYear > Number.MAX_SAFE_INTEGER - horizon) {
      return unavailable('رقم سنة الحياة غير صالح لإعداد توقع آمن.');
    }

    const studio = isRecord(state.filmStudio) ? state.filmStudio : null;
    const rawContracts = studio && Array.isArray(studio.distributionContracts)
      ? studio.distributionContracts
      : [];
    if (rawContracts.length > MAX_CONTRACTS) {
      return unavailable('عدد العقود يتجاوز الحد الآمن للتقرير؛ لم نعرض إجماليًا جزئيًا.');
    }

    const years = Array.from({ length: horizon }, (_, index) => ({
      year: currentYear + index + 1,
      amount: 0n,
      contractCount: 0
    }));
    const contracts = [];
    const seenIds = new Set();
    const seenFilmIds = new Set();
    let excludedContracts = 0;

    rawContracts.forEach(contract => {
      if (isRecord(contract) && contract.status === 'expired') return;
      const normalized = normalizeActiveContract(contract, currentYear);
      if (!normalized || seenIds.has(normalized.id) || seenFilmIds.has(normalized.filmId)) {
        excludedContracts++;
        return;
      }
      seenIds.add(normalized.id);
      seenFilmIds.add(normalized.filmId);
      contracts.push(normalized);
      for (let offset = 1; offset <= horizon && offset <= normalized.yearsRemaining; offset++) {
        years[offset - 1].amount += normalized.annualRoyalty;
        years[offset - 1].contractCount++;
      }
    });

    const totalForecast = years.reduce((total, row) => total + row.amount, 0n);
    contracts.sort((first, second) => {
      if (first.annualRoyalty > second.annualRoyalty) return -1;
      if (first.annualRoyalty < second.annualRoyalty) return 1;
      return first.filmTitle.localeCompare(second.filmTitle, 'ar');
    });

    return {
      available: true,
      reason: '',
      currentYear,
      horizon,
      activeContracts: contracts.length,
      excludedContracts,
      complete: excludedContracts === 0,
      totalForecast,
      years,
      contracts
    };
  }

  function readSavedState(host) {
    try {
      const storage = host && host.localStorage;
      if (!storage || typeof storage.getItem !== 'function') return null;
      const raw = storage.getItem(SAVE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return isRecord(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  function formatNumber(value) {
    try {
      return new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(value);
    } catch {
      return String(value);
    }
  }

  function formatMoney(value, unit) {
    let amount;
    try {
      amount = typeof value === 'bigint' ? value : BigInt(value);
    } catch {
      return 'غير متاح';
    }
    return formatNumber(amount) + ' ' + String(unit || 'ج.م').slice(0, 12);
  }

  function appendText(doc, parent, tag, className, value) {
    const node = doc.createElement(tag);
    if (className) node.className = className;
    node.textContent = String(value);
    parent.appendChild(node);
    return node;
  }

  function appendMetric(doc, parent, label, value) {
    const metric = doc.createElement('div');
    metric.className = 'film-rights-forecast-metric';
    appendText(doc, metric, 'span', 'film-rights-forecast-label', label);
    appendText(doc, metric, 'strong', 'film-rights-forecast-value', value);
    parent.appendChild(metric);
  }

  function renderDialog(doc, state) {
    let dialog = doc.getElementById('filmRightsForecastDialog');
    if (!dialog) {
      dialog = doc.createElement('dialog');
      dialog.id = 'filmRightsForecastDialog';
      dialog.className = 'film-rights-forecast-dialog';
      dialog.setAttribute('aria-modal', 'true');
      dialog.setAttribute('aria-labelledby', 'filmRightsForecastTitle');
      dialog.addEventListener('click', event => {
        if (event.target === dialog && typeof dialog.close === 'function') dialog.close();
      });
      doc.body.appendChild(dialog);
    }

    dialog.replaceChildren();
    const shell = doc.createElement('div');
    shell.className = 'film-rights-forecast-shell';
    const header = doc.createElement('header');
    header.className = 'film-rights-forecast-header';
    const heading = appendText(doc, header, 'h2', 'film-rights-forecast-title', 'توقعات دخل حقوق الأفلام');
    heading.id = 'filmRightsForecastTitle';
    appendText(doc, header, 'p', 'film-rights-forecast-subtitle',
      'تقدير محلي للعوائد المقبلة من العقود السارية، وليس ضمانًا للتحصيل.');
    const close = appendText(doc, header, 'button', 'film-rights-forecast-close', 'إغلاق');
    close.type = 'button';
    close.addEventListener('click', () => {
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
    });
    shell.appendChild(header);

    const body = doc.createElement('div');
    body.className = 'film-rights-forecast-body';
    const savedState = isRecord(state) ? state : null;
    const forecast = buildForecast(savedState);
    if (!forecast.available) {
      appendText(doc, body, 'p', 'film-rights-forecast-empty', forecast.reason);
    } else {
      const unit = isRecord(savedState.place) && typeof savedState.place.unit === 'string'
        ? savedState.place.unit
        : 'ج.م';
      const summary = doc.createElement('div');
      summary.className = 'film-rights-forecast-summary';
      appendMetric(doc, summary, 'عقود سارية', formatNumber(forecast.activeContracts));
      appendMetric(doc, summary, 'المتوقع خلال ' + formatNumber(forecast.horizon) + ' سنوات',
        formatMoney(forecast.totalForecast, unit));
      appendMetric(doc, summary, 'دخل السنة القادمة', formatMoney(forecast.years[0].amount, unit));
      appendMetric(doc, summary, 'عقود تحتاج مراجعة', formatNumber(forecast.excludedContracts));
      body.appendChild(summary);

      if (forecast.excludedContracts > 0) {
        appendText(doc, body, 'p', 'film-rights-forecast-warning',
          'استُبعدت عقود غير صالحة أو مكررة من الحساب؛ الإجمالي المعروض جزئي حتى مراجعتها.');
      }

      if (forecast.activeContracts === 0) {
        appendText(doc, body, 'p', 'film-rights-forecast-empty',
          'لا توجد عقود توزيع سارية وصالحة للتوقع في الحفظ الحالي.');
      } else {
        const section = doc.createElement('section');
        section.className = 'film-rights-forecast-section';
        appendText(doc, section, 'h3', 'film-rights-forecast-section-title', 'التدفقات السنوية المتوقعة');
        const grid = doc.createElement('div');
        grid.className = 'film-rights-forecast-years';
        forecast.years.forEach(row => {
          const card = doc.createElement('article');
          card.className = 'film-rights-forecast-year';
          appendText(doc, card, 'h4', 'film-rights-forecast-year-title', 'السنة ' + formatNumber(row.year));
          appendText(doc, card, 'strong', 'film-rights-forecast-year-amount', formatMoney(row.amount, unit));
          appendText(doc, card, 'p', 'film-rights-forecast-year-meta',
            formatNumber(row.contractCount) + ' عقدًا ضمن التوقع');
          grid.appendChild(card);
        });
        section.appendChild(grid);
        body.appendChild(section);

        const contractsSection = doc.createElement('section');
        contractsSection.className = 'film-rights-forecast-section';
        appendText(doc, contractsSection, 'h3', 'film-rights-forecast-section-title', 'العقود المؤثرة في التوقع');
        const list = doc.createElement('ul');
        list.className = 'film-rights-forecast-contracts';
        forecast.contracts.slice(0, 12).forEach(contract => {
          const item = doc.createElement('li');
          item.className = 'film-rights-forecast-contract';
          appendText(doc, item, 'strong', 'film-rights-forecast-contract-title', contract.filmTitle);
          appendText(doc, item, 'span', 'film-rights-forecast-contract-partner', contract.partnerTitle);
          appendText(doc, item, 'span', 'film-rights-forecast-contract-value',
            formatMoney(contract.annualRoyalty, unit) + ' سنويًا · ' +
            formatNumber(contract.yearsRemaining) + ' سنوات متبقية');
          list.appendChild(item);
        });
        contractsSection.appendChild(list);
        if (forecast.contracts.length > 12) {
          appendText(doc, contractsSection, 'p', 'film-rights-forecast-note',
            'يعرض التقرير أعلى 12 عقدًا من حيث العائد السنوي؛ الإجماليات تشمل كل العقود الصالحة.');
        }
        body.appendChild(contractsSection);
      }
    }

    shell.appendChild(body);
    appendText(doc, shell, 'p', 'film-rights-forecast-footnote',
      'التقرير للقراءة فقط ويقرأ الحفظ المحلي على هذا الجهاز. لا يغيّر العقود أو الأرصدة أو ملف الحياة.');
    dialog.appendChild(shell);
    return dialog;
  }

  function mount(doc, host) {
    if (!doc || typeof doc.getElementById !== 'function') return null;
    const button = doc.getElementById('filmRightsForecastBtn');
    if (!button || button.getAttribute('data-forecast-mounted') === 'true') return null;
    const runtime = host || (typeof globalThis === 'object' ? globalThis : {});
    button.setAttribute('data-forecast-mounted', 'true');
    button.addEventListener('click', () => {
      const state = readSavedState(runtime);
      const dialog = renderDialog(doc, state);
      if (typeof dialog.showModal === 'function') {
        if (!dialog.open) dialog.showModal();
      } else {
        dialog.setAttribute('open', '');
      }
    });
    return { open: () => button.click() };
  }

  return {
    SAVE_KEY,
    buildForecast,
    formatMoney,
    readSavedState,
    renderDialog,
    mount
  };
});
