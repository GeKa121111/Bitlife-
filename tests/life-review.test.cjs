'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { summarizeLife, collectMilestones, formatMoney } = require('../life-review.js');

function sampleLife(overrides = {}) {
  return {
    version: 1,
    lifeId: 'life-42',
    name: 'شخصية تجريبية',
    age: 68,
    cause: 'كبر السن',
    place: { country: 'مصر', unit: 'ج.م' },
    bank: 120000,
    debt: 30000,
    assets: [{ value: 80000 }, { marketValue: 20000 }],
    investments: [{ estimatedValue: 50000 }],
    children: [{ name: 'ليلى' }, { name: 'عمر' }],
    family: [{ name: 'الأب' }, { name: 'الأم' }],
    friends: [{ name: 'صديق' }],
    pets: [{ name: 'قطة' }],
    partner: { name: 'سلمى' },
    job: { title: 'مهندس' },
    jobHistory: [{ title: 'محلل بيانات' }, { title: 'مهندس' }],
    specialCareerHistory: [{ title: 'مخرج' }],
    education: { level: 4, major: 'هندسة' },
    accomplishments: ['تخرجت من الجامعة', 'أسست مشروعًا'],
    log: [
      { age: 22, title: 'التخرج من الجامعة', text: 'أنهيت دراستك بنجاح.', tone: 'good' },
      { age: 29, title: 'بداية مشروع', text: 'بدأت مشروعك الأول.', tone: 'special' },
      { age: 40, title: 'ذكرى عائلية', text: 'اجتمعت الأسرة.', tone: '' }
    ],
    ...overrides
  };
}

test('ملخص الرحلة يجمع مؤشرات الحياة من دون تعديل الحفظ', () => {
  const life = sampleLife();
  const before = JSON.stringify(life);
  const summary = summarizeLife(life, [{ id: 'life-42', ribbon: 'مسار مهني ناجح' }]);

  assert.equal(summary.name, 'شخصية تجريبية');
  assert.equal(summary.age, 68);
  assert.equal(summary.ribbon, 'مسار مهني ناجح');
  assert.equal(summary.netWorth, 240000);
  assert.equal(summary.assetsCount, 2);
  assert.equal(summary.investmentsCount, 1);
  assert.equal(summary.childrenCount, 2);
  assert.equal(summary.familyCount, 2);
  assert.equal(summary.friendsCount, 1);
  assert.equal(summary.petsCount, 1);
  assert.equal(summary.career, 'مهندس');
  assert.deepEqual(summary.careerHistory, ['مخرج', 'مهندس', 'محلل بيانات']);
  assert.deepEqual(summary.accomplishments, ['تخرجت من الجامعة', 'أسست مشروعًا']);
  assert.equal(JSON.stringify(life), before, 'the report must not mutate the saved life');
});

test('الحفظ القديم الذي يفتقد الأقسام الاختيارية ينتج ملخصًا آمنًا', () => {
  const summary = summarizeLife({
    version: 1,
    name: 'حياة قديمة',
    age: 44,
    bank: 900,
    stats: {},
    log: []
  }, []);

  assert.equal(summary.name, 'حياة قديمة');
  assert.equal(summary.netWorth, 900);
  assert.equal(summary.childrenCount, 0);
  assert.equal(summary.career, 'لا يوجد مسار مهني مسجل');
  assert.equal(summary.ribbon, 'غير مسجل');
  assert.deepEqual(summary.milestones, []);
});

test('الحفظ غير الصالح لا ينتج تقريرًا مضللًا', () => {
  assert.equal(summarizeLife(null, []), null);
  assert.equal(summarizeLife({ version: 2, name: 'غير مدعوم', age: 30 }, []), null);
  assert.equal(summarizeLife({ version: 1, name: 'عمر غير صالح', age: 151 }, []), null);
  assert.equal(summarizeLife({ version: 1, name: 'اسم مفقود', age: 20 }, []), null);
});

test('المحطات محدودة وتُعرض الأحدث أولًا مع إزالة التكرار', () => {
  const log = Array.from({ length: 12 }, (_, index) => ({
    age: 18 + index,
    title: index % 2 ? 'إنجاز مهني ' + index : 'حدث عائلي ' + index,
    text: 'تفاصيل المحطة ' + index,
    tone: index % 2 ? 'special' : ''
  }));
  log.push({ age: 29, title: 'إنجاز مهني 11', text: 'تكرار', tone: 'special' });
  const result = collectMilestones(log);

  assert.ok(result.length <= 6);
  assert.equal(result[0].title, 'إنجاز مهني 11');
  assert.ok(result.every(item => item.text.length <= 180));
});

test('القيم المالية غير الرقمية لا تفسد الحساب أو التنسيق', () => {
  const summary = summarizeLife(sampleLife({
    bank: 'غير معروف',
    debt: Infinity,
    assets: [{ value: 'غير معروف' }, { value: 1000 }],
    investments: 'غير صالحة'
  }), []);

  assert.equal(summary.bank, 0);
  assert.equal(summary.debt, 0);
  assert.equal(summary.assetsValue, 1000);
  assert.equal(summary.investmentsValue, 0);
  assert.equal(summary.netWorth, 1000);
  assert.ok(formatMoney(1200, 'ج.م').endsWith('ج.م'));
});
