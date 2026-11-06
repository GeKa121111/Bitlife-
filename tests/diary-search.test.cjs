'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'diary-search.js'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '..', 'diary-search.css'), 'utf8');

function api() {
  const window = { document: { readyState: 'complete', querySelector: () => null, getElementById: () => null } };
  vm.runInNewContext(source, { window }, { filename: 'diary-search.js' });
  return window.HayahDiarySearch;
}

function node(className, text, hidden = false) {
  const classes = new Set(className.split(/\s+/).filter(Boolean));
  return {
    textContent: text,
    hidden,
    classList: { contains: name => classes.has(name) }
  };
}

test('توحيد البحث العربي يزيل التشكيل والتطويل دون تغيير النص المعروض', () => {
  const search = api();
  assert.equal(search.normalizeText('  الْجَامِعَةُ  '), 'الجامعة');
  assert.equal(search.normalizeText('الســفر'), 'السفر');
  assert.equal(search.normalizeText('إدارة الأعمال'), 'ادارة الأعمال');
  assert.equal(search.normalizeText('إدارة الأعمال'), search.normalizeText('ادارة الأعمال'));
  assert.equal(search.normalizeText('على'), search.normalizeText('علي'));
});

test('البحث يخفي الأحداث غير المطابقة ويُبقي عنوان العمر عند وجود نتيجة', () => {
  const search = api();
  const age25 = node('agegroup', 'العمر 25');
  const university = node('logcard', 'التحاق بالجامعة وتحديد التخصص');
  const travel = node('logcard', 'رحلة إلى الإسكندرية');
  const age26 = node('agegroup', 'العمر 26');
  const work = node('logcard', 'الحصول على وظيفة جديدة');
  const feed = { children: [age25, university, travel, age26, work] };

  const result = search.filterFeed(feed, 'جَامِعَة');
  assert.deepEqual(JSON.parse(JSON.stringify(result)), { visibleCount: 1, totalCount: 3 });
  assert.equal(university.hidden, false);
  assert.equal(travel.hidden, true);
  assert.equal(work.hidden, true);
  assert.equal(age25.hidden, false);
  assert.equal(age26.hidden, true);
});

test('البحث بعنوان مجموعة عمرية يعرض أحداث المجموعة كلها', () => {
  const search = api();
  const heading = node('agegroup', 'العمر 30');
  const first = node('logcard', 'ترقية في العمل');
  const second = node('logcard', 'شراء منزل');
  const feed = { children: [heading, first, second] };
  const result = search.filterFeed(feed, 'العمر 30');
  assert.deepEqual(JSON.parse(JSON.stringify(result)), { visibleCount: 2, totalCount: 2 });
  assert.equal(first.hidden, false);
  assert.equal(second.hidden, false);
});

test('البحث يدعم بطاقات الأحداث المتداخلة داخل مجموعات العمر', () => {
  const search = api();
  const heading = node('agegroup', 'العمر 31');
  const matching = node('logcard', 'بداية مشروع جديد');
  const other = node('logcard', 'رحلة قصيرة');
  const feed = { children: [], querySelectorAll: () => [heading, matching, other] };
  const result = search.filterFeed(feed, 'مشروع');
  assert.deepEqual(JSON.parse(JSON.stringify(result)), { visibleCount: 1, totalCount: 2 });
  assert.equal(matching.hidden, false);
  assert.equal(other.hidden, true);
  assert.equal(heading.hidden, false);
});

test('مسح البحث يعيد إظهار العناصر ويحتفظ بحالة الإخفاء الأصلية', () => {
  const search = api();
  const heading = node('agegroup', 'العمر 40');
  const visible = node('logcard', 'حدث ظاهر');
  const originallyHidden = node('logcard', 'حدث مؤرشف', true);
  const feed = { children: [heading, visible, originallyHidden] };
  search.filterFeed(feed, 'ظاهر');
  assert.equal(originallyHidden.hidden, true);
  search.filterFeed(feed, '');
  assert.equal(heading.hidden, false);
  assert.equal(visible.hidden, false);
  assert.equal(originallyHidden.hidden, true);
});

test('المكوّن لا يقرأ الحفظ أو يكتب فيه ولا يرسل بيانات إلى الشبكة', () => {
  assert.doesNotMatch(source, /localStorage|sessionStorage|fetch\s*\(|XMLHttpRequest|sendBeacon/);
  assert.match(source, /aria-live/);
  assert.match(source, /MutationObserver/);
  assert.match(css, /#lifeFeed \.logcard\[hidden\]/);
  assert.match(css, /prefers-reduced-motion/);
});
