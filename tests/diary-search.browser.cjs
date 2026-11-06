'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require('playwright');

async function run() {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await page.setContent(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"></head><body class="theme-dark">
      <div class="story-heading"><div class="story-heading-copy"><span>رحلة الشخصية</span><h1>حكايتك سنة ورا سنة</h1></div><span class="story-year">السنة الحالية</span></div>
      <main id="lifeFeed" class="feed" aria-label="سجل الحياة والأحداث">
        <div class="agegroup"><span>العمر 25</span></div>
        <article class="logcard good"><strong class="logtitle">منحة دراسية</strong><p class="logtext">حصلت على فرصة لإكمال الجامعة.</p></article>
        <article class="logcard bad"><strong class="logtitle">رحلة عائلية</strong><p class="logtext">سافرت الأسرة إلى الإسكندرية.</p></article>
        <div class="agegroup"><span>العمر 26</span></div>
        <article class="logcard special"><strong class="logtitle">بداية العمل</strong><p class="logtext">بدأت إدارة أول وظيفة بدوام كامل.</p></article>
      </main>
    </body></html>`);
    await page.addStyleTag({ path: path.join(__dirname, '..', 'diary-search.css') });
    await page.addScriptTag({ path: path.join(__dirname, '..', 'diary-search.js') });

    const toggle = page.getByRole('button', { name: 'بحث في يوميات الحياة' });
    await toggle.waitFor();
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
    await toggle.click();
    const input = page.getByRole('searchbox', { name: 'ابحث في أحداث حياتك' });
    await input.waitFor();
    assert.equal(await input.evaluate(element => document.activeElement === element), true);

    const filterGroup = page.getByRole('group', { name: 'تصفية الأحداث حسب النوع' });
    await filterGroup.waitFor();
    const allFilter = page.getByRole('button', { name: 'كل الأحداث' });
    const negativeFilter = page.getByRole('button', { name: 'سلبية' });
    const specialFilter = page.getByRole('button', { name: 'مميزة' });
    assert.equal(await allFilter.getAttribute('aria-pressed'), 'true');

    await negativeFilter.click();
    await page.waitForFunction(() => document.querySelectorAll('#lifeFeed .logcard:not([hidden])').length === 1);
    assert.equal(await page.locator('#lifeFeed .logcard').nth(1).isVisible(), true);
    assert.equal(await negativeFilter.getAttribute('aria-pressed'), 'true');

    await input.fill('منحة');
    await page.waitForFunction(() => document.querySelectorAll('#lifeFeed .logcard:not([hidden])').length === 0);
    assert.match(await page.getByRole('status').textContent(), /لا توجد أحداث مطابقة/);

    await allFilter.click();
    await page.waitForFunction(() => document.querySelectorAll('#lifeFeed .logcard:not([hidden])').length === 1);
    await input.fill('');

    await input.fill('مِنْحَة');
    await page.waitForFunction(() => document.querySelectorAll('#lifeFeed .logcard:not([hidden])').length === 1);
    assert.equal(await page.locator('#lifeFeed .logcard').nth(0).isVisible(), true);
    assert.equal(await page.locator('#lifeFeed .logcard').nth(1).isVisible(), false);
    assert.equal(await page.locator('#lifeFeed .agegroup').nth(0).isVisible(), true);
    assert.equal(await page.locator('#lifeFeed .agegroup').nth(1).isVisible(), false);
    assert.match(await page.getByRole('status').textContent(), /تم العثور على 1 من 3/);

    await input.fill('ادارة');
    await page.waitForFunction(() => document.querySelectorAll('#lifeFeed .logcard:not([hidden])').length === 1);
    assert.equal(await page.locator('#lifeFeed .logcard').nth(2).isVisible(), true,
      'Arabic alef variants should match the same diary term');

    await input.fill('العمر 25');
    await page.waitForFunction(() => document.querySelectorAll('#lifeFeed .logcard:not([hidden])').length === 2);
    assert.equal(await page.locator('#lifeFeed .agegroup').nth(0).isVisible(), true);
    assert.equal(await page.locator('#lifeFeed .agegroup').nth(1).isVisible(), false);

    await input.fill('كلمة غير موجودة');
    await page.waitForFunction(() => document.querySelectorAll('#lifeFeed .logcard:not([hidden])').length === 0);
    assert.match(await page.getByRole('status').textContent(), /لا توجد أحداث مطابقة/);

    await input.fill('جامعة');
    await page.locator('#diarySearchClear').click();
    assert.equal(await page.locator('#lifeFeed .logcard:not([hidden])').count(), 3);
    assert.equal(await page.locator('#diarySearchInput').inputValue(), '');

    await specialFilter.click();
    await page.waitForFunction(() => document.querySelectorAll('#lifeFeed .logcard:not([hidden])').length === 1);
    assert.equal(await page.locator('#lifeFeed .logcard').nth(2).isVisible(), true);
    assert.equal(await specialFilter.getAttribute('aria-pressed'), 'true');
    await input.press('Escape');
    assert.equal(await allFilter.getAttribute('aria-pressed'), 'true',
      'Escape with an empty query should reset the selected tone before closing the panel');
    assert.equal(await page.locator('#lifeFeed .logcard:not([hidden])').count(), 3);

    await input.fill('مشروع');
    await page.locator('#lifeFeed').evaluate(feed => {
      const card = document.createElement('article');
      card.className = 'logcard good';
      card.textContent = 'مشروع عائلي جديد';
      feed.appendChild(card);
    });
    await page.waitForFunction(() => document.querySelectorAll('#lifeFeed .logcard:not([hidden])').length === 1);
    assert.match(await page.getByRole('status').textContent(), /تم العثور على 1 من 4/);

    await input.press('Escape');
    assert.equal(await input.inputValue(), '');
    assert.equal(await page.locator('#lifeFeed .logcard:not([hidden])').count(), 4);
    await input.press('Escape');
    assert.equal(await page.locator('#diarySearchPanel').isVisible(), false);
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
    assert.equal(await toggle.evaluate(element => document.activeElement === element), true);

    await toggle.click();
    await input.waitFor();
    await input.focus();
    await page.evaluate(() => document.getElementById('diarySearchToggle').click());
    assert.equal(await page.locator('#diarySearchPanel').isVisible(), false);
    assert.equal(await toggle.evaluate(element => document.activeElement === element), true,
      'closing the search panel should restore focus to its toggle');

    await page.setViewportSize({ width: 320, height: 720 });
    const targets = await page.evaluate(() => {
      const toggleRect = document.getElementById('diarySearchToggle').getBoundingClientRect();
      return {
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: document.documentElement.clientWidth,
        toggleWidth: toggleRect.width,
        toggleHeight: toggleRect.height
      };
    });
    assert.ok(targets.toggleWidth >= 44 && targets.toggleHeight >= 44,
      'the search control should retain a comfortable touch target on 320px screens');
    assert.ok(targets.documentWidth <= targets.viewportWidth,
      'the diary search control should not introduce horizontal overflow on narrow screens');

    console.log('Diary search browser checks passed.');
  } finally {
    await browser.close();
  }
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
