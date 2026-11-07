'use strict';

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
  assert.ok(result.insights.some(item => item.code === 'healthy-result'));
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

test('الحفظ الفارغ أو التالف لا ينتج أنشطة أو أرقامًا غير محدودة', () => {
  assert.deepEqual(analyzeBusinessPortfolio(null), {
    businessCount: 0,
    reportedCount: 0,
    totalRevenue: 0,
    totalProfit: 0,
    lossCount: 0,
    taxLiability: 0,
    loanBalance: 0,
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
