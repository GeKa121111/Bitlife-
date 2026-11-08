(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.HayahBusinessInsights = api;
  if (root && root.document) api.mount(root.document, root);
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';

  const MAX_BUSINESSES = 25;

  function isRecord(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }

  function hasFinite(record, key) {
    if (!isRecord(record) || record[key] === null || record[key] === undefined || record[key] === '') return false;
    return Number.isFinite(Number(record[key]));
  }

  function number(value, fallback) {
    if (value === null || value === undefined || value === '' || !Number.isFinite(Number(value))) {
      return fallback === undefined ? 0 : fallback;
    }
    return Number(value);
  }

  function businessEntries(state) {
    if (!isRecord(state)) return [];
    const entries = [];
    const seen = new Set();
    const add = (entity, fallback, index) => {
      if (!isRecord(entity)) return;
      const rawId = entity.id !== undefined && entity.id !== null && String(entity.id).trim()
        ? String(entity.id)
        : entity.assetId !== undefined && entity.assetId !== null && String(entity.assetId).trim()
          ? String(entity.assetId)
          : '';
      const title = String(entity.title || entity.name || fallback || 'نشاط تجاري').trim().slice(0, 100);
      const key = rawId ? 'id:' + rawId : 'title:' + title + ':' + index;
      if (seen.has(key)) return;
      seen.add(key);
      entries.push({ entity, title, id: rawId || key });
    };

    const primary = state.business;
    if (isRecord(primary) && (primary.id || primary.assetId || primary.title || Array.isArray(primary.financialHistory))) {
      add(primary, 'المشروع الرئيسي', 0);
    } else if (Array.isArray(state.assets)) {
      const legacyBusinessAsset = state.assets.find(asset => isRecord(asset) && asset.kind === 'business' && asset.companyPortfolio !== true);
      if (legacyBusinessAsset) add(legacyBusinessAsset, 'المشروع الرئيسي', 0);
    }
    (Array.isArray(state.companies) ? state.companies : []).forEach((company, index) => {
      add(company, 'شركة ' + (index + 1), index + 1);
    });
    return entries.slice(0, MAX_BUSINESSES);
  }

  function analyzeBusiness(entity, fallbackTitle) {
    const safeEntity = isRecord(entity) ? entity : {};
    const title = String(safeEntity.title || safeEntity.name || fallbackTitle || 'نشاط تجاري').trim().slice(0, 100);
    const history = (Array.isArray(safeEntity.financialHistory) ? safeEntity.financialHistory : [])
      .filter(isRecord)
      .slice()
      .sort((a, b) => number(a.year, 0) - number(b.year, 0));
    const report = history.length ? history[history.length - 1] : null;
    if (!report) {
      return {
        id: String(safeEntity.id || safeEntity.assetId || title),
        title,
        hasReport: false,
        status: 'unknown',
        year: null,
        revenue: 0,
        profit: 0,
        margin: null,
        revenueChangePercent: null,
        revenueChangeUnavailableReason: 'no-report',
        marketShare: null,
        marketShareChange: null,
        taxLiability: 0,
        loanBalance: 0,
        closingCashBalance: null,
        insights: [{ code: 'no-report', severity: 'info', message: 'لم يصدر تقرير مالي محفوظ لهذا النشاط بعد؛ ستظهر القراءة بعد إكمال سنة مالية.' }]
      };
    }

    const previous = history.length > 1 ? history[history.length - 2] : null;
    const revenue = Math.max(0, number(report.revenue, 0));
    const costs = Math.max(0, number(report.costs, 0));
    const profit = hasFinite(report, 'profit') ? number(report.profit) : revenue - costs;
    const margin = hasFinite(report, 'margin') ? number(report.margin) : (revenue > 0 ? profit / revenue * 100 : 0);
    const previousRevenue = previous ? Math.max(0, number(previous.revenue, 0)) : 0;
    const reportYear = number(report.year, 0);
    const previousYear = previous ? number(previous.year, 0) : null;
    const hasConsecutivePrevious = previous && previousYear === reportYear - 1;
    const revenueChangePercent = hasConsecutivePrevious && previousRevenue > 0
      ? (revenue - previousRevenue) / previousRevenue * 100
      : null;
    const revenueChangeUnavailableReason = !previous
      ? 'no-previous-report'
      : !hasConsecutivePrevious
        ? 'nonconsecutive-year'
        : previousRevenue <= 0
          ? 'nonpositive-baseline'
          : null;
    const marketShare = hasFinite(report, 'marketShare') ? number(report.marketShare) : null;
    const marketShareChange = hasFinite(report, 'marketShareChange') ? number(report.marketShareChange) : null;
    const taxLiability = Math.max(0, number(report.taxLiability, 0));
    const loanBalance = Math.max(0, number(report.businessLoanBalance, 0));
    const closingCashBalance = hasFinite(report, 'closingCashBalance') ? number(report.closingCashBalance) : null;
    const payroll = Math.max(0, number(report.payroll, 0));
    const productCount = Math.max(0, number(report.productCount, 0));
    const productProfit = hasFinite(report, 'productProfit') ? number(report.productProfit) : null;
    const insights = [];
    const addInsight = (code, severity, message) => {
      if (insights.some(item => item.code === code) || insights.length >= 4) return;
      insights.push({ code, severity, message });
    };

    if (report.treasuryMode === 'separate' && closingCashBalance !== null && closingCashBalance < 0) {
      addInsight('negative-cash', 'danger', 'خزينة النشاط سالبة؛ راجع التحصيل والمصروفات والالتزامات قبل ضخ استثمارات جديدة.');
    }
    if (profit < 0) {
      addInsight('negative-profit', 'danger', 'النشاط سجل خسارة في آخر سنة؛ راجع تكلفة المورد والتسعير والرواتب قبل التوسع.');
    } else if (revenue > 0 && margin < 8) {
      addInsight('low-margin', 'warning', 'هامش الربح أقل من 8%؛ اختبر تكلفة الوحدة والسعر والمصروفات التشغيلية.');
    }
    if (taxLiability > 0) {
      addInsight('tax-liability', 'warning', 'توجد التزامات ضريبية غير مسددة بقيمة ' + Math.round(taxLiability) + '؛ راجع التسوية قبل استخدام سيولة الشركة في التوسع.');
    }
    if (productCount > 0 && productProfit !== null && productProfit < 0) {
      addInsight('product-loss', 'warning', 'مجموعة المنتجات سجلت نتيجة سالبة؛ راجع المنتجات الخاسرة أو أسعارها قبل إطلاق منتج إضافي.');
    }
    if (marketShareChange !== null && marketShareChange <= -2) {
      addInsight('market-share-drop', 'warning', 'الحصة السوقية تراجعت ' + Math.abs(marketShareChange).toFixed(1) + ' نقطة؛ راجع السعر والجودة والتسويق مقارنة بالمنافسين.');
    }
    if (revenueChangePercent !== null && revenueChangePercent <= -10) {
      addInsight('revenue-drop', 'warning', 'الإيرادات انخفضت ' + Math.abs(revenueChangePercent).toFixed(1) + '% عن السنة السابقة؛ افحص الطلب والمبيعات قبل زيادة الطاقة الإنتاجية.');
    }
    if (revenue > 0 && payroll / revenue >= 0.4) {
      addInsight('high-payroll', 'warning', 'الرواتب تستهلك 40% أو أكثر من الإيرادات؛ راجع توزيع الأدوار والإنتاجية دون الإضرار بالفريق.');
    }
    if (loanBalance > 0) {
      addInsight('business-debt', 'info', 'يوجد تمويل تجاري قائم بقيمة ' + Math.round(loanBalance) + '؛ قارن تكلفة الفائدة بالسيولة المتاحة قبل اقتراض جديد.');
    }
    if (!insights.length) {
      if (profit > 0 && margin >= 8) {
        addInsight('healthy-result', 'good', 'النتيجة التشغيلية موجبة؛ حافظ على متابعة السوق والسيولة قبل اتخاذ قرار توسع كبير.');
      } else {
        addInsight('limited-signals', 'info', 'لا توجد بيانات كافية لإصدار توصية قوية؛ راجع التقرير التالي بعد اكتمال سنة مالية أخرى.');
      }
    }

    const status = profit < 0 || (report.treasuryMode === 'separate' && closingCashBalance !== null && closingCashBalance < 0)
      ? 'danger'
      : insights.some(item => item.severity === 'warning') ? 'warning' : 'good';

    return {
      id: String(safeEntity.id || safeEntity.assetId || title),
      title,
      hasReport: true,
      status,
      year: number(report.year, 0),
      revenue,
      costs,
      profit,
      margin,
      revenueChangePercent,
      revenueChangeUnavailableReason,
      marketShare,
      marketShareChange,
      taxLiability,
      loanBalance,
      closingCashBalance,
      insights
    };
  }

  function analyzeBusinessPortfolio(state) {
    const items = businessEntries(state).map(entry => analyzeBusiness(entry.entity, entry.title));
    const reported = items.filter(item => item.hasReport);
    const reportYears = Array.from(new Set(reported
      .map(item => item.year)
      .filter(year => Number.isInteger(year) && year > 0 && year <= 9999)))
      .sort((a, b) => a - b);
    const unknownReportYearCount = reported.filter(item =>
      !Number.isInteger(item.year) || item.year <= 0 || item.year > 9999
    ).length;
    return {
      businessCount: items.length,
      reportedCount: reported.length,
      totalRevenue: reported.reduce((sum, item) => sum + item.revenue, 0),
      totalProfit: reported.reduce((sum, item) => sum + item.profit, 0),
      lossCount: reported.filter(item => item.profit < 0).length,
      taxLiability: reported.reduce((sum, item) => sum + item.taxLiability, 0),
      loanBalance: reported.reduce((sum, item) => sum + item.loanBalance, 0),
      reportYears,
      unknownReportYearCount,
      hasMixedReportYears: reportYears.length > 1 || unknownReportYearCount > 0,
      items
    };
  }

  function formatNumber(value) {
    const rounded = Math.round(number(value, 0));
    try {
      return new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(rounded);
    } catch {
      return String(rounded);
    }
  }

  function formatMoney(value, unit) {
    return formatNumber(value) + ' ' + String(unit || 'ج.م').slice(0, 12);
  }

  function formatPercent(value, signed) {
    const rounded = Math.round(number(value, 0) * 10) / 10;
    return (signed && rounded > 0 ? '+' : '') + rounded.toFixed(1) + '%';
  }

  function appendText(doc, parent, tag, className, value) {
    const node = doc.createElement(tag);
    if (className) node.className = className;
    node.textContent = String(value);
    parent.appendChild(node);
    return node;
  }

  function createMetric(doc, parent, label, value, className) {
    const metric = doc.createElement('div');
    metric.className = 'business-insights-metric';
    appendText(doc, metric, 'span', 'business-insights-metric-label', label);
    appendText(doc, metric, 'strong', className || 'business-insights-metric-value', value);
    parent.appendChild(metric);
  }

  function renderDialog(doc, state) {
    let dialog = doc.getElementById('businessInsightsDialog');
    if (!dialog) {
      dialog = doc.createElement('dialog');
      dialog.id = 'businessInsightsDialog';
      dialog.className = 'business-insights-dialog';
      dialog.setAttribute('aria-labelledby', 'businessInsightsTitle');
      dialog.addEventListener('click', event => {
        if (event.target === dialog && typeof dialog.close === 'function') dialog.close();
      });
      doc.body.appendChild(dialog);
    }

    dialog.replaceChildren();
    const shell = doc.createElement('div');
    shell.className = 'business-insights-shell';
    const header = doc.createElement('header');
    header.className = 'business-insights-header';
    const heading = appendText(doc, header, 'h2', 'business-insights-title', 'مؤشرات المحفظة التجارية');
    heading.id = 'businessInsightsTitle';
    appendText(doc, header, 'p', 'business-insights-subtitle', 'قراءة محلية من التقارير المالية المحفوظة؛ لا تستخدم بيانات سوق خارجية.');
    const closeButton = appendText(doc, header, 'button', 'business-insights-close', 'إغلاق');
    closeButton.type = 'button';
    closeButton.setAttribute('aria-label', 'إغلاق مؤشرات المحفظة التجارية');
    closeButton.addEventListener('click', () => {
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
    });
    shell.appendChild(header);

    const body = doc.createElement('div');
    body.className = 'business-insights-body';
    const summary = analyzeBusinessPortfolio(state);
    if (!state) {
      appendText(doc, body, 'p', 'business-insights-empty', 'تعذر قراءة ملف الحياة المحلي. لم يتم تغيير أي بيانات.');
    } else if (!summary.businessCount) {
      appendText(doc, body, 'p', 'business-insights-empty', 'لا توجد شركة أو مشروع مسجل في هذه الحياة حتى الآن.');
    } else {
      const totals = doc.createElement('div');
      totals.className = 'business-insights-summary';
      createMetric(doc, totals, 'عدد الأنشطة', formatNumber(summary.businessCount));
      createMetric(doc, totals, 'إيرادات أحدث التقارير', formatMoney(summary.totalRevenue, state.place && state.place.unit));
      createMetric(doc, totals, 'صافي أحدث التقارير', formatMoney(summary.totalProfit, state.place && state.place.unit), summary.totalProfit < 0 ? 'business-insights-negative' : 'business-insights-metric-value');
      createMetric(doc, totals, 'التزامات ضريبية', formatMoney(summary.taxLiability, state.place && state.place.unit));
      createMetric(doc, totals, 'تمويل قائم', formatMoney(summary.loanBalance, state.place && state.place.unit));
      createMetric(doc, totals, 'أنشطة سجلت خسارة', formatNumber(summary.lossCount));
      body.appendChild(totals);

      if (summary.reportedCount) {
        let periodMessage;
        if (summary.unknownReportYearCount > 0) {
          periodMessage = 'بعض التقارير لا تحمل سنة مالية صالحة؛ إجمالي أحدث التقارير لا يمثل فترة موحدة.';
        } else if (summary.reportYears.length > 1) {
          periodMessage = 'إجمالي أحدث التقارير يجمع سنوات مالية مختلفة (' +
            summary.reportYears.map(formatNumber).join('، ') +
            ')؛ لا تقارنه كإجمالي لسنة واحدة.';
        } else {
          periodMessage = 'كل التقارير المالية المتاحة تخص السنة المالية ' +
            formatNumber(summary.reportYears[0]) + '.';
        }
        appendText(doc, body, 'p', 'business-insights-period-note', periodMessage);
      }

      if (!summary.reportedCount) {
        appendText(doc, body, 'p', 'business-insights-empty', 'لم تصدر تقارير مالية للأنشطة بعد. ستظهر المؤشرات بعد إكمال سنة مالية.');
      }
      summary.items.forEach(item => {
        const card = doc.createElement('article');
        card.className = 'business-insights-card';
        card.setAttribute('data-status', item.status);
        const cardHeader = doc.createElement('div');
        cardHeader.className = 'business-insights-card-header';
        appendText(doc, cardHeader, 'h3', 'business-insights-card-title', item.title);
        const statusLabels = { danger: 'تحتاج تدخلًا', warning: 'تحتاج متابعة', good: 'مستقرة', unknown: 'لا يوجد تقرير' };
        appendText(doc, cardHeader, 'span', 'business-insights-status', statusLabels[item.status] || 'مراجعة');
        card.appendChild(cardHeader);

        if (item.hasReport) {
          appendText(doc, card, 'p', 'business-insights-meta', 'آخر سنة مالية: ' + formatNumber(item.year));
          const metrics = doc.createElement('div');
          metrics.className = 'business-insights-card-metrics';
          createMetric(doc, metrics, 'الإيرادات', formatMoney(item.revenue, state.place && state.place.unit));
          createMetric(doc, metrics, 'صافي النتيجة', formatMoney(item.profit, state.place && state.place.unit), item.profit < 0 ? 'business-insights-negative' : 'business-insights-metric-value');
          createMetric(doc, metrics, 'هامش الربح', formatPercent(item.margin, false));
          const revenueChangeLabel = item.revenueChangePercent !== null
            ? formatPercent(item.revenueChangePercent, true)
            : item.revenueChangeUnavailableReason === 'nonpositive-baseline'
              ? 'إيرادات السنة السابقة غير موجبة؛ لا تُحسب نسبة التغير'
              : item.revenueChangeUnavailableReason === 'nonconsecutive-year'
                ? 'لا توجد سنة مالية متتالية للمقارنة'
                : 'لا يوجد تقرير سابق للمقارنة';
          createMetric(doc, metrics, 'تغير الإيرادات', revenueChangeLabel);
          card.appendChild(metrics);
        } else {
          appendText(doc, card, 'p', 'business-insights-meta', 'لا يوجد تقرير مالي محفوظ لهذا النشاط.');
        }

        const list = doc.createElement('ul');
        list.className = 'business-insights-recommendations';
        item.insights.forEach(insight => appendText(doc, list, 'li', 'business-insights-recommendation', insight.message));
        card.appendChild(list);
        body.appendChild(card);
      });
    }

    shell.appendChild(body);
    appendText(doc, shell, 'p', 'business-insights-footnote', 'هذه مؤشرات إرشادية من محاكاة اللعبة وليست بيانات سوق حقيقية أو نصيحة مالية.');
    dialog.appendChild(shell);
    return dialog;
  }

  function readSavedState(host) {
    try {
      const storage = host && host.localStorage;
      if (!storage || typeof storage.getItem !== 'function') return null;
      const raw = storage.getItem('hekayat_hayah_save_v1');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return isRecord(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  function mount(doc, host) {
    if (!doc || typeof doc.getElementById !== 'function') return null;
    const button = doc.getElementById('businessInsightsBtn');
    if (!button) return null;
    const runtime = host || (typeof globalThis === 'object' ? globalThis : {});
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

  return { analyzeBusiness, analyzeBusinessPortfolio, formatMoney, formatPercent, mount };
});
