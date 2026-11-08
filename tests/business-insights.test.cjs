'use strict';

const fs = require('node:fs');
const path = require('node:path');

const test = require('node:test');
const assert = require('node:assert/strict');
const { analyzeBusiness, analyzeBusinessPortfolio } = require('../business-insights.js');

function report(overrides = {}) {
  return {
    year: 2026,
    revenue: 100000,
    costs: 80000,
    profit: 20000,
    margin: 20,
    productCount: 1,
    productProfit: 5000,
    marketShare: 18,
    marketShareChange: 0,
    taxLiability: 0,
    businessLoanBalance: 0,
    payroll: 12000,
    treasuryMode: 'separate',
    closingCashBalance: 30000,
    ...overrides
  };
}

test('التقارير القديمة التي تفتقد مؤشرات السوق تظل قابلة للتحليل دون تحذيرات وهمية', () => {
  const result = analyzeBusiness({
    title: 'مشروع قديم',
    financialHistory: [{ year: 2024, revenue: 1000, costs: 700, profit: 300 }]
  });
  assert.equal(result.hasReport, true);
  assert.equal(result.margin, 30);
  assert.equal(result.marketShare, null);
  assert.equal(result.marketShareChange, null);
  assert.equal(result.status, 'good');
  assert.equal(result.revenueChangeUnavailableReason, 'no-previous-report');
  assert.ok(result.insights.some(item => item.code === 'healthy-result'));
});

test('السنة المالية صفر أو السالبة أو خارج النطاق لا تتغلب على آخر تقرير صالح', () => {
  const business = {
    title: 'شركة بسجل سنوات مختلط',
    financialHistory: [
      report({ year: 2025, revenue: 80000, costs: 60000, profit: 20000 }),
      report({ year: 0, revenue: 900000, costs: 0, profit: 900000 }),
      report({ year: -1, revenue: 800000, costs: 0, profit: 800000 }),
      report({ year: 10000, revenue: 700000, costs: 0, profit: 700000 }),
      report({ year: '2026', revenue: 90000, costs: 65000, profit: 25000 })
    ]
  };
  const before = JSON.stringify(business);
  const result = analyzeBusiness(business);
  assert.equal(result.hasReport, true);
  assert.equal(result.year, 2026);
  assert.equal(result.revenue, 90000);
  assert.equal(result.profit, 25000);
  assert.equal(result.invalidReportYearCount, 3);

  const portfolio = analyzeBusinessPortfolio({ business });
  assert.deepEqual(portfolio.reportYears, [2026]);
  assert.deepEqual(portfolio.annualSummaries.map(item => item.year), [2026, 2025]);
  assert.equal(portfolio.invalidReportYearCount, 3);
  assert.equal(portfolio.unknownReportYearCount, 0);
  assert.equal(portfolio.annualSummaries[0].year, 2026);
  assert.equal(JSON.stringify(business), before, 'invalid-year filtering must remain read-only');
});

test('النشاط الذي لا يملك إلا تقارير بسنة غير صالحة لا يظهر كتقرير مالي معتمد', () => {
  const state = {
    business: {
      id: 'invalid-years-only',
      title: 'سجلات تحتاج مراجعة',
      financialHistory: [
        report({ year: 0, revenue: 100000, profit: 50000 }),
        report({ year: 10000, revenue: 200000, profit: 90000 })
      ]
    }
  };
  const before = JSON.stringify(state);
  const result = analyzeBusiness(state.business);
  assert.equal(result.hasReport, false);
  assert.equal(result.status, 'unknown');
  assert.equal(result.revenueChangeUnavailableReason, 'invalid-report-year');
  assert.equal(result.invalidReportYearCount, 2);
  assert.ok(result.insights.some(item => item.code === 'invalid-report-year'));

  const portfolio = analyzeBusinessPortfolio(state);
  assert.equal(portfolio.reportedCount, 0);
  assert.equal(portfolio.totalRevenue, 0);
  assert.equal(portfolio.invalidReportYearCount, 2);
  assert.equal(portfolio.unknownReportYearCount, 1);
  assert.equal(portfolio.hasMixedReportYears, true);
  assert.equal(portfolio.items[0].hasReport, false);
  assert.equal(JSON.stringify(state), before, 'invalid-only histories must not be mutated');
});

test('سجل قديم غير صالح لا يجعل تقارير السنة الموحدة تبدو مختلطة', () => {
  const summary = analyzeBusinessPortfolio({
    business: {
      id: 'current-a',
      financialHistory: [
        report({ year: 0, revenue: 999999, profit: 999999 }),
        report({ year: 2026, revenue: 100000, profit: 20000 })
      ]
    },
    companies: [{
      id: 'current-b',
      financialHistory: [report({ year: 2026, revenue: 50000, profit: 10000 })]
    }]
  });
  assert.deepEqual(summary.reportYears, [2026]);
  assert.equal(summary.invalidReportYearCount, 1);
  assert.equal(summary.unknownReportYearCount, 0);
  assert.equal(summary.hasMixedReportYears, false);
  assert.equal(summary.annualSummaries[0].coverage, 'complete');
});


test('الخسارة والسيولة السالبة والضريبة والمنتج الخاسر تظهر كتوصيات مستقلة', () => {
  const business = {
    title: 'شركة تحتاج مراجعة',
    financialHistory: [
      report({ year: 2025, revenue: 150000, costs: 100000, profit: 50000 }),
      report({
        revenue: 90000,
        costs: 120000,
        profit: -30000,
        margin: -33.3,
        productProfit: -7000,
        marketShareChange: -4,
        taxLiability: 2500,
        businessLoanBalance: 12000,
        closingCashBalance: -1800,
        payroll: 50000
      })
    ]
  };
  const before = JSON.stringify(business);
  const result = analyzeBusiness(business);
  const codes = result.insights.map(item => item.code);
  assert.equal(result.status, 'danger');
  assert.ok(codes.includes('negative-cash'));
  assert.ok(codes.includes('negative-profit'));
  assert.ok(codes.includes('tax-liability'));
  assert.ok(codes.includes('product-loss'));
  assert.ok(codes.length <= 4, 'recommendations should stay concise');
  assert.equal(JSON.stringify(business), before, 'analysis must not mutate the saved business');
});

test('مقارنة السنوات تكشف هبوط الإيرادات دون إضافة حقول إلى التقرير', () => {
  const business = {
    title: 'متجر متراجع',
    financialHistory: [
      report({ year: 2025, revenue: 200000, profit: 30000, costs: 170000 }),
      report({ year: 2026, revenue: 160000, profit: 25000, costs: 135000 })
    ]
  };
  const result = analyzeBusiness(business);
  assert.equal(result.revenueChangePercent, -20);
  assert.ok(result.insights.some(item => item.code === 'revenue-drop'));
  assert.equal(business.financialHistory[1].revenueChangePercent, undefined);
});

test('لا يقارن الإيرادات عبر سنوات مفقودة حتى لا يعرض هبوطًا مضللًا', () => {
  const business = {
    title: 'نشاط له تقارير متقطعة',
    financialHistory: [
      report({ year: 2023, revenue: 200000, profit: 30000 }),
      report({ year: 2025, revenue: 150000, profit: 20000 })
    ]
  };
  const before = JSON.stringify(business);
  const result = analyzeBusiness(business);
  assert.equal(result.revenueChangePercent, null);
  assert.equal(result.revenueChangeUnavailableReason, 'nonconsecutive-year');
  assert.equal(result.insights.some(item => item.code === 'revenue-drop'), false);
  assert.equal(JSON.stringify(business), before, 'analysis must remain read-only');
});

test('عند تكرار السنة يعتمد آخر تقرير مخزن ويقارنه بالسنة السابقة', () => {
  const business = {
    id: 'duplicate-year-business',
    title: 'نشاط بسجل سنة مكرر',
    financialHistory: [
      report({ year: 2025, revenue: 100000, profit: 12000 }),
      report({ year: 2026, revenue: 140000, profit: 18000 }),
      report({ year: '2026', revenue: 90000, profit: -5000 })
    ]
  };
  const before = JSON.stringify(business);
  const result = analyzeBusiness(business);
  assert.equal(result.year, 2026);
  assert.equal(result.revenue, 90000);
  assert.equal(result.profit, -5000);
  assert.equal(result.revenueChangePercent, -10);
  assert.equal(result.revenueChangeUnavailableReason, null);
  assert.ok(result.insights.some(item => item.code === 'revenue-drop'));

  const portfolio = analyzeBusinessPortfolio({ business });
  const annual2026 = portfolio.annualSummaries.find(item => item.year === 2026);
  assert.ok(annual2026);
  assert.equal(annual2026.totalRevenue, 90000,
    'individual and portfolio analysis must select the same last stored report');
  assert.equal(JSON.stringify(business), before, 'deduplication must remain read-only');
});

test('صفر إيرادات السنة السابقة لا يُعرض كأنه سنة مفقودة', () => {
  const business = {
    title: 'نشاط بدأ تحقيق الإيرادات',
    financialHistory: [
      report({ year: 2025, revenue: 0, costs: 0, profit: 0, margin: 0 }),
      report({ year: 2026, revenue: 50000, costs: 35000, profit: 15000, margin: 30 })
    ]
  };
  const before = JSON.stringify(business);
  const result = analyzeBusiness(business);
  assert.equal(result.revenueChangePercent, null);
  assert.equal(result.revenueChangeUnavailableReason, 'nonpositive-baseline');
  assert.equal(result.insights.some(item => item.code === 'revenue-drop'), false);
  assert.equal(JSON.stringify(business), before, 'analysis must remain read-only');
});

test('لوحة المحفظة تجمع أحدث تقرير لكل نشاط فقط وتتجنب تكرار الشركة ذات المعرّف نفسه', () => {
  const state = {
    place: { unit: 'ج.م' },
    business: {
      id: 'primary',
      title: 'المشروع الرئيسي',
      financialHistory: [
        report({ year: 2025, revenue: 100000, profit: 10000 }),
        report({ year: 2026, revenue: 120000, profit: 20000, taxLiability: 1000 })
      ]
    },
    companies: [
      {
        id: 'portfolio-1',
        title: 'شركة المحفظة',
        financialHistory: [report({ year: 2026, revenue: 50000, costs: 65000, profit: -15000, margin: -30 })]
      },
      { id: 'primary', title: 'نسخة مكررة', financialHistory: [report({ year: 2026, revenue: 999999 })] }
    ]
  };
  const before = JSON.stringify(state);
  const summary = analyzeBusinessPortfolio(state);
  assert.equal(summary.businessCount, 2);
  assert.equal(summary.reportedCount, 2);
  assert.equal(summary.totalRevenue, 170000);
  assert.equal(summary.totalProfit, 5000);
  assert.equal(summary.lossCount, 1);
  assert.equal(summary.taxLiability, 1000);
  assert.equal(JSON.stringify(state), before, 'portfolio analysis must be read-only');
});

test('إجمالي أحدث التقارير يكشف اختلاف السنوات المالية بين الأنشطة', () => {
  const summary = analyzeBusinessPortfolio({
    business: {
      id: 'business-2024',
      title: 'شركة أ',
      financialHistory: [report({ year: 2024, revenue: 100000, profit: 20000 })]
    },
    companies: [{
      id: 'business-2026',
      title: 'شركة ب',
      financialHistory: [report({ year: 2026, revenue: 80000, profit: 12000 })]
    }]
  });
  assert.deepEqual(summary.reportYears, [2024, 2026]);
  assert.equal(summary.unknownReportYearCount, 0);
  assert.equal(summary.hasMixedReportYears, true);
  assert.equal(summary.totalRevenue, 180000);
});

test('التقارير المتاحة من سنة مالية واحدة لا تنتج تحذير اختلاف السنوات', () => {
  const summary = analyzeBusinessPortfolio({
    business: {
      id: 'business-a',
      title: 'شركة أ',
      financialHistory: [report({ year: 2026, revenue: 100000 })]
    },
    companies: [{
      id: 'business-b',
      title: 'شركة ب',
      financialHistory: [report({ year: 2026, revenue: 80000 })]
    }]
  });
  assert.deepEqual(summary.reportYears, [2026]);
  assert.equal(summary.unknownReportYearCount, 0);
  assert.equal(summary.hasMixedReportYears, false);
});

test('السنة المالية غير الصالحة تمنع وصف إجمالي المحفظة بأنه موحد', () => {
  const summary = analyzeBusinessPortfolio({
    business: {
      id: 'business-unknown',
      title: 'شركة بسنة غير صالحة',
      financialHistory: [report({ year: 'غير معروف', revenue: 100000 })]
    },
    companies: [{
      id: 'business-valid',
      title: 'شركة بسنة صالحة',
      financialHistory: [report({ year: 2026, revenue: 80000 })]
    }]
  });
  assert.deepEqual(summary.reportYears, [2026]);
  assert.equal(summary.unknownReportYearCount, 1);
  assert.equal(summary.hasMixedReportYears, true);
});

test('الحفظ الفارغ أو التالف لا ينتج أنشطة أو أرقامًا غير محدودة', () => {
  assert.deepEqual(analyzeBusinessPortfolio(null), {
    businessCount: 0,
    reportedCount: 0,
    totalRevenue: 0,
    totalProfit: 0,
    lossCount: 0,
    taxLiability: 0,
    loanBalance: 0,
    reportYears: [],
    unknownReportYearCount: 0,
    invalidReportYearCount: 0,
    hasMixedReportYears: false,
    annualSummaries: [],
    items: []
  });
  const result = analyzeBusinessPortfolio({
    business: null,
    companies: [{ title: 'بدون تقرير', financialHistory: 'غير صالحة' }]
  });
  assert.equal(result.businessCount, 1);
  assert.equal(result.reportedCount, 0);
  assert.equal(result.items[0].status, 'unknown');
});

test('الحفظ القديم الذي يحتفظ بأصل الشركة دون كائن business يظل ظاهرًا في اللوحة', () => {
  const summary = analyzeBusinessPortfolio({
    assets: [
      { id: 'legacy-business-asset', kind: 'business', title: 'أصل تجاري قديم', value: 75000 },
      { id: 'portfolio-asset', kind: 'business', companyPortfolio: true, title: 'أصل شركة محفظة' }
    ],
    companies: []
  });
  assert.equal(summary.businessCount, 1);
  assert.equal(summary.items[0].title, 'أصل تجاري قديم');
  assert.equal(summary.items[0].hasReport, false);
});

test('ملخص السنوات يجمع تقارير السنة نفسها ويعرض اكتمال التغطية دون تعديل الحفظ', () => {
  const state = {
    business: {
      id: 'annual-a',
      title: 'شركة أ',
      financialHistory: [
        report({ year: 2025, revenue: 100000, costs: 70000, profit: 30000 }),
        report({ year: 2026, revenue: 120000, costs: 100000, profit: 20000 })
      ]
    },
    companies: [
      {
        id: 'annual-b',
        title: 'شركة ب',
        financialHistory: [
          report({ year: 2025, revenue: 50000, costs: 40000, profit: 10000 }),
          report({ year: 2026, revenue: 60000, costs: 45000, profit: 15000 })
        ]
      },
      {
        id: 'annual-c',
        title: 'شركة ج',
        financialHistory: [report({ year: 2025, revenue: 25000, costs: 20000, profit: 5000 })]
      }
    ]
  };
  const before = JSON.stringify(state);
  const summary = analyzeBusinessPortfolio(state);
  assert.deepEqual(summary.annualSummaries, [
    {
      year: 2026, reportedCount: 2, totalRevenue: 180000, totalProfit: 35000,
      businessCount: 3, missingBusinessCount: 1, coverage: 'partial',
      revenueChangePercent: null, comparisonUnavailableReason: 'incomplete-coverage'
    },
    {
      year: 2025, reportedCount: 3, totalRevenue: 175000, totalProfit: 45000,
      businessCount: 3, missingBusinessCount: 0, coverage: 'complete',
      revenueChangePercent: null, comparisonUnavailableReason: 'no-consecutive-year'
    }
  ]);
  assert.equal(JSON.stringify(state), before, 'annual aggregation must not mutate saved financial histories');
});

test('نمو الإيرادات السنوي يُحسب فقط بين سنتين متتاليتين بتغطية كاملة', () => {
  const state = {
    business: {
      id: 'growth-a',
      financialHistory: [
        report({ year: 2025, revenue: 100000, costs: 70000, profit: 30000 }),
        report({ year: 2026, revenue: 120000, costs: 85000, profit: 35000 })
      ]
    },
    companies: [{
      id: 'growth-b',
      financialHistory: [
        report({ year: 2025, revenue: 50000, costs: 40000, profit: 10000 }),
        report({ year: 2026, revenue: 60000, costs: 45000, profit: 15000 })
      ]
    }]
  };
  const before = JSON.stringify(state);
  const summary = analyzeBusinessPortfolio(state);
  assert.equal(summary.annualSummaries[0].year, 2026);
  assert.equal(summary.annualSummaries[0].coverage, 'complete');
  assert.equal(summary.annualSummaries[0].revenueChangePercent, 20);
  assert.equal(summary.annualSummaries[0].comparisonUnavailableReason, null);
  assert.equal(summary.annualSummaries[1].comparisonUnavailableReason, 'no-consecutive-year');
  assert.equal(JSON.stringify(state), before, 'year-over-year analysis must remain read-only');
});

test('نمو الإيرادات لا يُحسب عند خط أساس صفري أو عند غياب سنة متتالية', () => {
  const zeroBaseline = analyzeBusinessPortfolio({
    business: {
      id: 'zero-baseline',
      financialHistory: [
        report({ year: 2025, revenue: 0, costs: 0, profit: 0 }),
        report({ year: 2026, revenue: 50000, costs: 30000, profit: 20000 })
      ]
    }
  });
  assert.equal(zeroBaseline.annualSummaries[0].revenueChangePercent, null);
  assert.equal(zeroBaseline.annualSummaries[0].comparisonUnavailableReason, 'nonpositive-baseline');

  const yearGap = analyzeBusinessPortfolio({
    business: {
      id: 'year-gap',
      financialHistory: [
        report({ year: 2024, revenue: 40000, profit: 5000 }),
        report({ year: 2026, revenue: 60000, profit: 8000 })
      ]
    }
  });
  assert.equal(yearGap.annualSummaries[0].revenueChangePercent, null);
  assert.equal(yearGap.annualSummaries[0].comparisonUnavailableReason, 'no-consecutive-year');
});

test('التقرير المكرر في السنة نفسها لا يضاعف مساهمة الشركة في ملخص المحفظة السنوي', () => {
  const summary = analyzeBusinessPortfolio({
    business: {
      id: 'duplicate-a',
      title: 'شركة أ',
      financialHistory: [
        report({ year: 2026, revenue: 100000, profit: 10000 }),
        report({ year: 2026, revenue: 120000, profit: 15000 })
      ]
    },
    companies: [{
      id: 'duplicate-b',
      title: 'شركة ب',
      financialHistory: [report({ year: 2026, revenue: 50000, profit: 8000 })]
    }]
  });
  assert.equal(summary.annualSummaries.length, 1);
  assert.equal(summary.annualSummaries[0].reportedCount, 2);
  assert.equal(summary.annualSummaries[0].totalRevenue, 170000,
    'the last stored report for a duplicated company-year should replace the earlier entry');
  assert.equal(summary.annualSummaries[0].totalProfit, 23000);
  assert.equal(summary.annualSummaries[0].coverage, 'complete');
});

test('السنوات غير الصالحة لا تدخل الملخص السنوي ويُحتفظ بآخر خمس سنوات فقط', () => {
  const history = [];
  for (let year = 2020; year <= 2026; year += 1) {
    history.push(report({ year, revenue: year * 10, profit: year }));
  }
  history.push(report({ year: 'سنة غير معروفة', revenue: 999999, profit: 999999 }));
  const summary = analyzeBusinessPortfolio({
    business: { id: 'annual-limit', title: 'شركة الاختبار', financialHistory: history }
  });
  assert.deepEqual(summary.annualSummaries.map(item => item.year), [2026, 2025, 2024, 2023, 2022]);
  assert.equal(summary.annualSummaries[0].totalRevenue, 20260);
  assert.equal(summary.annualSummaries.length, 5);
});

test('واجهة المؤشرات تشرح سبب تعذر حساب نسبة تغير الإيرادات بدقة', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'business-insights.js'), 'utf8');
  assert.match(source, /إيرادات السنة السابقة غير موجبة؛ لا تُحسب نسبة التغير/);
  assert.match(source, /لا توجد سنة مالية متتالية للمقارنة/);
  assert.match(source, /لا يوجد تقرير سابق للمقارنة/);
  assert.match(source, /إجمالي أحدث التقارير يجمع سنوات مالية مختلفة/);
  assert.match(source, /تم استبعاد '/);
  assert.match(source, /' سجل مالي بسنة غير صالحة من التحليل/);
  assert.match(source, /business-insights-period-note/);
  assert.match(source, /ملخص التقارير حسب السنة/);
  assert.match(source, /business-insights-annual-card/);
  assert.match(source, /annualPortfolioSummaries\(entries\)/);
});
