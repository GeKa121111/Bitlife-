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

  function isFiniteNumericValue(value) {
    if (typeof value === 'number') return Number.isFinite(value);
    if (typeof value !== 'string' || !value.trim()) return false;
    return Number.isFinite(Number(value.trim()));
  }

  function hasFinite(record, key) {
    return isRecord(record) && isFiniteNumericValue(record[key]);
  }

  function number(value, fallback) {
    if (!isFiniteNumericValue(value)) return fallback === undefined ? 0 : fallback;
    return Number(typeof value === 'string' ? value.trim() : value);
  }

  function readFinancialMetrics(report) {
    if (!isRecord(report) || !hasFinite(report, 'revenue')) return null;
    const revenue = number(report.revenue, NaN);
    if (revenue < 0) return null;

    const hasProfit = hasFinite(report, 'profit');
    const costs = hasFinite(report, 'costs') ? number(report.costs, NaN) : NaN;
    const hasCosts = Number.isFinite(costs) && costs >= 0;
    if (!hasProfit && !hasCosts) return null;

    return {
      revenue,
      costs: hasCosts ? costs : null,
      profit: hasProfit ? number(report.profit, 0) : revenue - costs
    };
  }

  function isValidFiscalYear(value) {
    if (typeof value !== 'number' && typeof value !== 'string') return false;
    if (typeof value === 'string' && !value.trim()) return false;
    const year = Number(value);
    return Number.isSafeInteger(year) && year >= 1 && year <= 9999;
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


  function analyzeBusinessOwnership(entity, fallbackBeneficiaryId, fallbackName) {
    const safeEntity = isRecord(entity) ? entity : {};
    const fallbackId = String(fallbackBeneficiaryId || 'current-owner').trim().slice(0, 120) || 'current-owner';
    const fallbackOwnerName = String(fallbackName || 'المالك الحالي').trim().slice(0, 80) || 'المالك الحالي';
    const raw = safeEntity.ownershipLedger;

    if (raw === undefined) {
      return {
        valid: true,
        legacyFallback: true,
        activeBeneficiaryId: fallbackId,
        activeShareBps: 10000,
        shareholders: [{ beneficiaryId: fallbackId, name: fallbackOwnerName, kind: 'owner', shareBps: 10000 }],
        auditIssues: []
      };
    }

    const invalid = issues => ({
      valid: false,
      legacyFallback: false,
      activeBeneficiaryId: null,
      activeShareBps: 0,
      shareholders: [],
      auditIssues: issues
    });
    if (!isRecord(raw) || raw.version !== 1 || !Array.isArray(raw.shareholders) ||
      raw.shareholders.length < 1 || raw.shareholders.length > 100) {
      return invalid(['ownership_ledger_shape_invalid']);
    }

    const ids = new Set();
    const shareholders = [];
    let totalShareBps = 0;
    for (const item of raw.shareholders) {
      if (!isRecord(item)) return invalid(['shareholder_entry_invalid']);
      const beneficiaryId = String(item.beneficiaryId || '').trim().slice(0, 120);
      const name = String(item.name || '').trim().slice(0, 80);
      const shareBps = Number(item.shareBps);
      if (!beneficiaryId || !name || ids.has(beneficiaryId) ||
        !Number.isSafeInteger(shareBps) || shareBps <= 0 || shareBps > 10000) {
        return invalid(['shareholder_entry_invalid']);
      }
      ids.add(beneficiaryId);
      totalShareBps += shareBps;
      shareholders.push({
        beneficiaryId,
        name,
        kind: String(item.kind || 'other').trim().slice(0, 24) || 'other',
        shareBps
      });
    }

    const activeBeneficiaryId = String(raw.activeBeneficiaryId || '').trim().slice(0, 120);
    if (totalShareBps !== 10000 || !ids.has(activeBeneficiaryId)) {
      return invalid(['ownership_total_or_active_owner_invalid']);
    }

    if (raw.transactions !== undefined) {
      if (!Array.isArray(raw.transactions) || raw.transactions.length > 200) {
        return invalid(['ownership_transaction_history_invalid']);
      }
      const transactionIds = new Set();
      for (const item of raw.transactions) {
        if (!isRecord(item)) return invalid(['ownership_transaction_history_invalid']);
        const id = String(item.id || '').trim().slice(0, 160);
        const type = item.type === 'gift' || item.type === 'inheritance' ? item.type : '';
        const age = Number(item.age);
        const fromBeneficiaryId = String(item.fromBeneficiaryId || '').trim().slice(0, 120);
        const toBeneficiaryId = String(item.toBeneficiaryId || '').trim().slice(0, 120);
        const fromName = String(item.fromName || '').trim().slice(0, 80);
        const toName = String(item.toName || '').trim().slice(0, 80);
        const shareBps = Number(item.shareBps);
        if (!id || transactionIds.has(id) || !type ||
          !Number.isSafeInteger(age) || age < 0 || age > 150 ||
          !fromBeneficiaryId || !toBeneficiaryId || fromBeneficiaryId === toBeneficiaryId ||
          !fromName || !toName || !Number.isSafeInteger(shareBps) || shareBps <= 0 || shareBps > 10000) {
          return invalid(['ownership_transaction_history_invalid']);
        }
        transactionIds.add(id);
      }

      // Rewind the retained audit trail from today's balances. This catches
      // structurally valid receipts that could not have produced the current ledger.
      const balances = new Map(shareholders.map(item => [item.beneficiaryId, item.shareBps]));
      for (let index = raw.transactions.length - 1; index >= 0; index -= 1) {
        const item = raw.transactions[index];
        const fromId = String(item.fromBeneficiaryId || '').trim().slice(0, 120);
        const toId = String(item.toBeneficiaryId || '').trim().slice(0, 120);
        const shareBps = Number(item.shareBps);
        const recipientBalance = balances.get(toId) || 0;
        if (recipientBalance < shareBps) {
          return invalid(['ownership_transaction_flow_invalid']);
        }
        balances.set(toId, recipientBalance - shareBps);
        balances.set(fromId, (balances.get(fromId) || 0) + shareBps);
      }
    }

    const active = shareholders.find(item => item.beneficiaryId === activeBeneficiaryId);
    return {
      valid: !!active,
      legacyFallback: false,
      activeBeneficiaryId,
      activeShareBps: active ? active.shareBps : 0,
      shareholders,
      auditIssues: []
    };
  }

  function formatOwnershipShare(shareBps) {
    const percent = Math.max(0, Math.min(10000, Number(shareBps) || 0)) / 100;
    try {
      return new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 2 }).format(percent) + '%';
    } catch {
      return percent.toFixed(2) + '%';
    }
  }

  function analyzeBusiness(entity, fallbackTitle, contextState) {
    const safeEntity = isRecord(entity) ? entity : {};
    const title = String(safeEntity.title || safeEntity.name || fallbackTitle || 'نشاط تجاري').trim().slice(0, 100);
    const ownership = analyzeBusinessOwnership(safeEntity, contextState && contextState.lifeId, contextState && contextState.name);
    const rawHistory = (Array.isArray(safeEntity.financialHistory) ? safeEntity.financialHistory : [])
      .filter(isRecord);
    const invalidReportYearCount = rawHistory.filter(item => !isValidFiscalYear(item.year)).length;
    const latestByYear = new Map();
    rawHistory.forEach(item => {
      if (!isValidFiscalYear(item.year)) return;
      // Keep the last stored report for each year, matching the annual portfolio summary.
      latestByYear.set(Number(item.year), item);
    });
    const latestReports = Array.from(latestByYear.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([year, report]) => ({ year, report, metrics: readFinancialMetrics(report) }));
    const invalidFinancialReportCount = latestReports.filter(item => !item.metrics).length;
    const history = latestReports.filter(item => item.metrics);
    const reportEntry = history.length ? history[history.length - 1] : null;
    if (!reportEntry) {
      const reason = invalidFinancialReportCount > 0
        ? 'invalid-financial-report'
        : invalidReportYearCount > 0 ? 'invalid-report-year' : 'no-report';
      const message = invalidFinancialReportCount > 0
        ? 'توجد تقارير بسنة مالية صالحة، لكن الإيرادات أو صافي النتيجة والتكاليف لا تحتوي على قيم رقمية مكتملة؛ تم استبعادها من الحساب.'
        : invalidReportYearCount > 0
          ? 'توجد سجلات مالية بسنة غير صالحة؛ تم تجاهلها حتى لا تظهر كتقرير سنوي معتمد.'
          : 'لم يصدر تقرير مالي محفوظ لهذا النشاط بعد؛ ستظهر القراءة بعد إكمال سنة مالية.';
      return {
        id: String(safeEntity.id || safeEntity.assetId || title),
        title,
        ownership,
        hasReport: false,
        status: 'unknown',
        year: null,
        revenue: 0,
        profit: 0,
        margin: null,
        revenueChangePercent: null,
        revenueChangeUnavailableReason: reason,
        invalidReportYearCount,
        invalidFinancialReportCount,
        marketShare: null,
        marketShareChange: null,
        taxLiability: 0,
        loanBalance: 0,
        closingCashBalance: null,
        insights: [{
          code: reason,
          severity: 'info',
          message
        }]
      };
    }

    const report = reportEntry.report;
    const previous = history.length > 1 ? history[history.length - 2] : null;
    const revenue = reportEntry.metrics.revenue;
    const costs = reportEntry.metrics.costs === null ? 0 : reportEntry.metrics.costs;
    const profit = reportEntry.metrics.profit;
    const margin = hasFinite(report, 'margin') ? number(report.margin) : (revenue > 0 ? profit / revenue * 100 : 0);
    const previousRevenue = previous ? previous.metrics.revenue : 0;
    const reportYear = reportEntry.year;
    const previousYear = previous ? previous.year : null;
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

    if (invalidFinancialReportCount > 0) {
      addInsight('invalid-financial-report', 'warning',
        'تم استبعاد ' + invalidFinancialReportCount + ' تقرير مالي غير مكتمل؛ يعرض التحليل آخر تقرير صالح فقط.');
    }
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
      ownership,
      hasReport: true,
      status,
      invalidReportYearCount,
      invalidFinancialReportCount,
      year: reportYear,
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

  function annualPortfolioSummaries(entries) {
    const totalsByYear = new Map();
    entries.forEach(entry => {
      const history = Array.isArray(entry.entity.financialHistory) ? entry.entity.financialHistory : [];
      const latestByYear = new Map();
      history.forEach(report => {
        if (!isRecord(report)) return;
        if (!isValidFiscalYear(report.year)) return;
        const year = Number(report.year);
        // Match the per-business history rule: the last stored report for a duplicate year wins.
        latestByYear.set(year, report);
      });
      latestByYear.forEach((report, year) => {
        let annual = totalsByYear.get(year);
        if (!annual) {
          annual = { year, reportedCount: 0, invalidReportCount: 0, totalRevenue: 0, totalProfit: 0 };
          totalsByYear.set(year, annual);
        }
        const metrics = readFinancialMetrics(report);
        if (!metrics) {
          annual.invalidReportCount += 1;
          return;
        }
        annual.reportedCount += 1;
        annual.totalRevenue += metrics.revenue;
        annual.totalProfit += metrics.profit;
      });
    });

    const summaries = Array.from(totalsByYear.values())
      .sort((a, b) => b.year - a.year)
      .map(annual => {
        const missingBusinessCount = Math.max(0,
          entries.length - annual.reportedCount - annual.invalidReportCount);
        return {
          ...annual,
          businessCount: entries.length,
          missingBusinessCount,
          coverage: entries.length > 0 &&
            annual.reportedCount === entries.length &&
            annual.invalidReportCount === 0 ? 'complete' : 'partial'
        };
      });
    const summariesByYear = new Map(summaries.map(annual => [annual.year, annual]));

    // Compare like with like: both adjacent years must cover the same complete current portfolio.
    return summaries.map(annual => {
      const previous = summariesByYear.get(annual.year - 1);
      let revenueChangePercent = null;
      let comparisonUnavailableReason = 'no-consecutive-year';
      if (previous) {
        if (annual.coverage !== 'complete' || previous.coverage !== 'complete') {
          comparisonUnavailableReason = 'incomplete-coverage';
        } else if (previous.totalRevenue <= 0) {
          comparisonUnavailableReason = 'nonpositive-baseline';
        } else {
          revenueChangePercent = (annual.totalRevenue - previous.totalRevenue) / previous.totalRevenue * 100;
          comparisonUnavailableReason = null;
        }
      }
      return { ...annual, revenueChangePercent, comparisonUnavailableReason };
    }).slice(0, 5);
  }

  function analyzeBusinessPortfolio(state) {
    const entries = businessEntries(state);
    const items = entries.map(entry => analyzeBusiness(entry.entity, entry.title, state));
    const reported = items.filter(item => item.hasReport);
    const reportYears = Array.from(new Set(reported
      .map(item => item.year)
      .filter(year => Number.isInteger(year) && year > 0 && year <= 9999)))
      .sort((a, b) => a - b);
    const invalidReportYearCount = items.reduce(
      (sum, item) => sum + Math.max(0, number(item.invalidReportYearCount, 0)),
      0
    );
    const invalidFinancialReportCount = items.reduce(
      (sum, item) => sum + Math.max(0, number(item.invalidFinancialReportCount, 0)),
      0
    );
    const unknownReportYearCount = items.filter(item =>
      !item.hasReport && item.invalidReportYearCount > 0
    ).length;
    const sharedOwnershipCount = items.filter(item => item.ownership.valid && item.ownership.shareholders.length > 1).length;
    const ownershipNeedsReviewCount = items.filter(item => !item.ownership.valid).length;
    const legacyOwnershipCount = items.filter(item => item.ownership.valid && item.ownership.legacyFallback).length;
    const ownershipShareholderCount = items.reduce((sum, item) => sum + (item.ownership.valid ? item.ownership.shareholders.length : 0), 0);
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
      invalidReportYearCount,
      invalidFinancialReportCount,
      hasMixedReportYears: reportYears.length > 1 || unknownReportYearCount > 0,
      sharedOwnershipCount,
      ownershipNeedsReviewCount,
      legacyOwnershipCount,
      ownershipShareholderCount,
      annualSummaries: annualPortfolioSummaries(entries),
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
      createMetric(doc, totals, 'تقارير مالية مستبعدة', formatNumber(summary.invalidFinancialReportCount));
      createMetric(doc, totals, 'أنشطة بملكية مشتركة', formatNumber(summary.sharedOwnershipCount));
      createMetric(doc, totals, 'دفاتر ملكية تحتاج مراجعة', formatNumber(summary.ownershipNeedsReviewCount), summary.ownershipNeedsReviewCount ? 'business-insights-negative' : 'business-insights-metric-value');
      body.appendChild(totals);

      if (summary.reportedCount) {
        let periodMessage;
        if (summary.unknownReportYearCount > 0) {
          periodMessage = 'بعض الأنشطة لا تملك تقريرًا بسنة مالية صالحة؛ إجمالي أحدث التقارير لا يمثل فترة موحدة.';
        } else if (summary.reportYears.length > 1) {
          periodMessage = 'إجمالي أحدث التقارير يجمع سنوات مالية مختلفة (' +
            summary.reportYears.map(formatNumber).join('، ') +
            ')؛ لا تقارنه كإجمالي لسنة واحدة.';
        } else if (summary.invalidReportYearCount > 0) {
          periodMessage = 'تم استبعاد ' + formatNumber(summary.invalidReportYearCount) +
            ' سجل مالي بسنة غير صالحة من التحليل؛ راجع سجلات الشركات.';
        } else {
          periodMessage = 'كل التقارير المالية المتاحة تخص السنة المالية ' +
            formatNumber(summary.reportYears[0]) + '.';
        }
        appendText(doc, body, 'p', 'business-insights-period-note', periodMessage);
      }
      if (summary.invalidFinancialReportCount > 0) {
        appendText(doc, body, 'p', 'business-insights-period-note',
          'تم استبعاد ' + formatNumber(summary.invalidFinancialReportCount) +
          ' تقرير مالي بسبب غياب الإيرادات أو عدم توافر صافي نتيجة وتكاليف رقمية صالحة.');
      }

      if (summary.annualSummaries.length) {
        const annualSection = doc.createElement('section');
        annualSection.className = 'business-insights-annual';
        appendText(doc, annualSection, 'h3', 'business-insights-annual-title', 'ملخص التقارير حسب السنة');
        appendText(doc, annualSection, 'p', 'business-insights-annual-intro',
          'كل سنة تُجمع بشكل مستقل؛ راجع عدد الأنشطة التي أصدرت تقريرًا قبل مقارنة الإجمالي.');

        const annualGrid = doc.createElement('div');
        annualGrid.className = 'business-insights-annual-grid';
        summary.annualSummaries.forEach(annual => {
          const annualCard = doc.createElement('article');
          annualCard.className = 'business-insights-annual-card';
          annualCard.dataset.year = String(annual.year);
          annualCard.dataset.coverage = annual.coverage;
          annualCard.dataset.reportedCount = String(annual.reportedCount);
          annualCard.dataset.businessCount = String(annual.businessCount);
          annualCard.dataset.comparison = annual.comparisonUnavailableReason || 'available';

          const annualHeader = doc.createElement('div');
          annualHeader.className = 'business-insights-annual-header';
          appendText(doc, annualHeader, 'h4', 'business-insights-annual-year',
            'السنة المالية ' + formatNumber(annual.year));
          appendText(doc, annualHeader, 'span', 'business-insights-annual-coverage',
            annual.coverage === 'complete' ? 'تغطية كاملة' : 'تغطية جزئية');
          annualCard.appendChild(annualHeader);

          appendText(doc, annualCard, 'p', 'business-insights-annual-meta',
            'تقارير متاحة: ' + formatNumber(annual.reportedCount) + ' من ' +
            formatNumber(annual.businessCount) + ' نشاط');

          const annualMetrics = doc.createElement('div');
          annualMetrics.className = 'business-insights-card-metrics';
          createMetric(doc, annualMetrics, 'الإيرادات المجمعة',
            formatMoney(annual.totalRevenue, state.place && state.place.unit));
          createMetric(doc, annualMetrics, 'صافي النتيجة',
            formatMoney(annual.totalProfit, state.place && state.place.unit),
            annual.totalProfit < 0 ? 'business-insights-negative' : 'business-insights-metric-value');
          const annualChangeLabel = annual.revenueChangePercent !== null
            ? formatPercent(annual.revenueChangePercent, true)
            : annual.comparisonUnavailableReason === 'incomplete-coverage'
              ? 'لا تُحسب؛ تغطية إحدى السنتين جزئية'
              : annual.comparisonUnavailableReason === 'nonpositive-baseline'
                ? 'لا تُحسب؛ إيرادات السنة السابقة غير موجبة'
                : 'لا توجد سنة مالية متتالية للمقارنة';
          createMetric(doc, annualMetrics, 'تغير الإيرادات السنوي', annualChangeLabel,
            annual.revenueChangePercent !== null && annual.revenueChangePercent < 0
              ? 'business-insights-negative'
              : 'business-insights-metric-value');
          annualCard.appendChild(annualMetrics);

          if (annual.missingBusinessCount > 0) {
            appendText(doc, annualCard, 'p', 'business-insights-annual-note',
              'الإجمالي لا يشمل ' + formatNumber(annual.missingBusinessCount) +
              ' نشاط دون تقرير لهذه السنة.');
          }
          if (annual.invalidReportCount > 0) {
            appendText(doc, annualCard, 'p', 'business-insights-annual-note',
              'تم استبعاد ' + formatNumber(annual.invalidReportCount) +
              ' تقرير غير مكتمل لهذه السنة؛ لم يدخل في الإيرادات أو صافي النتيجة.');
          }
          annualGrid.appendChild(annualCard);
        });
        annualSection.appendChild(annualGrid);
        body.appendChild(annualSection);
      }

      if (!summary.reportedCount) {
        const emptyMessage = summary.invalidFinancialReportCount > 0
          ? 'توجد تقارير مالية، لكن لم يتوفر تقرير صالح للحساب؛ تم استبعاد ' +
            formatNumber(summary.invalidFinancialReportCount) + ' تقرير غير مكتمل.'
          : 'لم تصدر تقارير مالية للأنشطة بعد. ستظهر المؤشرات بعد إكمال سنة مالية.';
        appendText(doc, body, 'p', 'business-insights-empty', emptyMessage);
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
          appendText(doc, card, 'p', 'business-insights-meta', 'آخر سنة مالية صالحة: ' + formatNumber(item.year));
          if (item.invalidFinancialReportCount > 0) {
            appendText(doc, card, 'p', 'business-insights-meta',
              'تم استبعاد ' + formatNumber(item.invalidFinancialReportCount) +
              ' تقرير مالي غير مكتمل؛ لا يدخل في المؤشرات.');
          }
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
          const missingReportMessage = item.invalidFinancialReportCount > 0
            ? 'لا يوجد تقرير مالي مكتمل؛ تم استبعاد ' + formatNumber(item.invalidFinancialReportCount) + ' سجل لا يحتوي على قيم مالية صالحة.'
            : item.invalidReportYearCount > 0
              ? 'لا يوجد تقرير بسنة مالية صالحة؛ تم تجاهل ' + formatNumber(item.invalidReportYearCount) + ' سجل غير صالح.'
              : 'لا يوجد تقرير مالي محفوظ لهذا النشاط.';
          appendText(doc, card, 'p', 'business-insights-meta', missingReportMessage);
        }


        const ownershipSection = doc.createElement('section');
        ownershipSection.className = 'business-insights-ownership';
        appendText(doc, ownershipSection, 'h4', 'business-insights-ownership-title', 'هيكل الملكية');
        if (!item.ownership || !item.ownership.valid) {
          const hasFlowMismatch = item.ownership && Array.isArray(item.ownership.auditIssues) &&
            item.ownership.auditIssues.includes('ownership_transaction_flow_invalid');
          appendText(doc, ownershipSection, 'p', 'business-insights-ownership-warning',
            hasFlowMismatch
              ? 'سجل انتقال الحصص لا يتوافق حسابيًا مع الملكية الحالية؛ أوقفنا عرض النسب حتى مراجعة السجل.'
              : 'دفتر الملكية غير صالح أو يحتاج مراجعة؛ لم نعرض نسبًا قد تكون مضللة.');
        } else {
          const activeShare = formatOwnershipShare(item.ownership.activeShareBps);
          appendText(doc, ownershipSection, 'p', 'business-insights-ownership-meta',
            'عدد الملاك: ' + formatNumber(item.ownership.shareholders.length) +
            ' · حصة صاحب الحياة الحالية: ' + activeShare);
          if (item.ownership.legacyFallback) {
            appendText(doc, ownershipSection, 'p', 'business-insights-ownership-note',
              'سجل قديم بلا دفتر حصص صريح؛ يُعرض صاحب الحياة كمالك وحيد دون تعديل ملف الحفظ.');
          }
          const ownerList = doc.createElement('ul');
          ownerList.className = 'business-insights-owner-list';
          ownerList.setAttribute('aria-label', 'نسب ملاك النشاط');
          item.ownership.shareholders.slice(0, 8).forEach(owner => {
            const row = doc.createElement('li');
            row.className = 'business-insights-owner-row';
            row.dataset.active = owner.beneficiaryId === item.ownership.activeBeneficiaryId ? 'true' : 'false';
            appendText(doc, row, 'span', 'business-insights-owner-name', owner.name);
            appendText(doc, row, 'strong', 'business-insights-owner-share', formatOwnershipShare(owner.shareBps));
            ownerList.appendChild(row);
          });
          ownershipSection.appendChild(ownerList);
          if (item.ownership.shareholders.length > 8) {
            appendText(doc, ownershipSection, 'p', 'business-insights-ownership-note',
              'يوجد ' + formatNumber(item.ownership.shareholders.length - 8) + ' مالك إضافي في السجل الكامل.');
          }
        }
        card.appendChild(ownershipSection);

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

  return { analyzeBusiness, analyzeBusinessOwnership, analyzeBusinessPortfolio, formatMoney, formatPercent, mount };
});
