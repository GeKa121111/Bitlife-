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
  assert.equal(search.normalizeText('إدارة الأعمال'), 'ادارة الاعمال');
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

test('تصفية اليوميات حسب نوع الحدث تتكامل مع البحث وتحافظ على العناصر المخفية أصلًا', () => {
  const search = api();
  const age25 = node('agegroup', 'العمر 25');
  const positive = node('logcard good', 'التحاق بالجامعة');
  const negative = node('logcard bad', 'إصابة أثناء السفر');
  const special = node('logcard special', 'جائزة التميز');
  const archived = node('logcard bad', 'سجل مؤرشف', true);
  const age26 = node('agegroup', 'العمر 26');
  const work = node('logcard good', 'بداية العمل');
  const feed = { children: [age25, positive, negative, special, archived, age26, work] };

  const positives = search.filterFeed(feed, '', 'good');
  assert.deepEqual(JSON.parse(JSON.stringify(positives)), { visibleCount: 2, totalCount: 5 });
  assert.equal(positive.hidden, false);
  assert.equal(work.hidden, false);
  assert.equal(negative.hidden, true);
  assert.equal(special.hidden, true);
  assert.equal(archived.hidden, true);
  assert.equal(age25.hidden, false);
  assert.equal(age26.hidden, false);

  const combined = search.filterFeed(feed, 'جامعة', 'bad');
  assert.deepEqual(JSON.parse(JSON.stringify(combined)), { visibleCount: 0, totalCount: 5 });
  assert.equal(age25.hidden, true);
  assert.equal(age26.hidden, true);

  const negatives = search.filterFeed(feed, '', 'bad');
  assert.deepEqual(JSON.parse(JSON.stringify(negatives)), { visibleCount: 1, totalCount: 5 });
  assert.equal(negative.hidden, false);
  assert.equal(archived.hidden, true);

  const all = search.filterFeed(feed, '', 'all');
  assert.deepEqual(JSON.parse(JSON.stringify(all)), { visibleCount: 4, totalCount: 5 });
  assert.equal(archived.hidden, true, 'an event hidden before filtering must remain hidden');
  assert.equal(age25.hidden, false);
  assert.equal(age26.hidden, false);
});

test('عدادات أنواع الأحداث مستقلة عن البحث والتصفية وتحترم الإخفاء الأصلي', () => {
  const search = api();
  const goodOne = node('logcard good', 'ترقية مهنية');
  const goodTwo = node('logcard good', 'منحة دراسية');
  const bad = node('logcard bad', 'إصابة');
  const special = node('logcard special', 'جائزة');
  const neutral = node('logcard', 'زيارة عائلية');
  const archived = node('logcard bad', 'حدث مؤرشف', true);
  const feed = { children: [goodOne, goodTwo, bad, special, neutral, archived] };

  search.filterFeed(feed, 'لا يوجد تطابق', 'bad');
  assert.deepEqual(JSON.parse(JSON.stringify(search.countFeedByTone(feed))), {
    all: 5, good: 2, bad: 1, special: 1
  });

  const appended = node('logcard special', 'تكريم جديد');
  feed.children.push(appended);
  assert.deepEqual(JSON.parse(JSON.stringify(search.countFeedByTone(feed))), {
    all: 6, good: 2, bad: 1, special: 2
  });
  assert.equal(archived.hidden, true);
});

test('واجهة التصفية تعرض أعدادًا واضحة ومعلّمة دلاليًا ولا تغيّر الحفظ', () => {
  assert.match(source, /diarySearchFilters/);
  assert.match(source, /aria-pressed/);
  assert.match(source, /diary-search-filter-count/);
  assert.match(source, /countFeedByTone/);
  assert.match(source, /تصفية الأحداث حسب النوع/);
  assert.ok(source.includes('filterFeed(feed, input.value, activeTone)'));
  assert.match(css, /\.diary-search-filter\[aria-pressed="true"\]/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|fetch\s*\(/,
    'the diary filter must not access storage or the network');
});

test('المكوّن لا يقرأ الحفظ أو يكتب فيه ولا يرسل بيانات إلى الشبكة', () => {
  assert.doesNotMatch(source, /localStorage|sessionStorage|fetch\s*\(|XMLHttpRequest|sendBeacon/);
  assert.match(source, /aria-live/);
  assert.match(source, /MutationObserver/);
  assert.match(css, /#lifeFeed \.logcard\[hidden\]/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /\.diary-search-filters/);
  assert.match(css, /min-height:44px/);
});

test('التنقل يقفز إلى أقدم وأحدث حدث ظاهر فقط', () => {
  const search = api();
  const oldest = node('logcard good', 'حدث قديم');
  const hidden = node('logcard bad', 'حدث مخفي', true);
  const newest = node('logcard special', 'حدث حديث');
  const feed = { children: [oldest, hidden, newest] };
  const calls = [];
  oldest.scrollIntoView = options => calls.push({ target: 'oldest', options });
  newest.scrollIntoView = options => calls.push({ target: 'newest', options });

  const visible = search.visibleCards(feed);
  assert.equal(visible.length, 2);
  assert.equal(visible[0], oldest);
  assert.equal(visible[1], newest);
  assert.equal(search.jumpToEdge(feed, 'first'), oldest);
  assert.equal(search.jumpToEdge(feed, 'last'), newest);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].target, 'oldest');
  assert.equal(calls[0].options.behavior, 'auto');
  assert.equal(calls[0].options.block, 'nearest');
  assert.equal(calls[1].target, 'newest');
  assert.equal(calls[1].options.behavior, 'auto');
  assert.equal(calls[1].options.block, 'nearest');
  assert.equal(hidden.hidden, true);
});

test('التنقل لا يحاول تمرير اليوميات عندما لا توجد أحداث ظاهرة', () => {
  const search = api();
  const hidden = node('logcard good', 'حدث مؤرشف', true);
  const feed = { children: [hidden] };
  assert.equal(search.visibleCards(feed).length, 0);
  assert.equal(search.jumpToEdge(feed, 'first'), null);
  assert.equal(search.jumpToEdge(feed, 'last'), null);
});

test('واجهة التنقل معلّمة لقارئات الشاشة ولا تمس التخزين', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'diary-search.js'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '..', 'diary-search.css'), 'utf8');
  assert.match(source, /diary-search-jump/);
  assert.match(source, /الانتقال إلى أقدم حدث ظاهر/);
  assert.match(source, /الانتقال إلى أحدث حدث ظاهر/);
  assert.match(source, /scrollIntoView/);
  assert.match(css, /\.diary-search-jump-button/);
  assert.match(css, /min-height:44px/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|fetch\s*\(/);
});
