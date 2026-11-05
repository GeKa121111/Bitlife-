'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const style = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
const accessibility = fs.readFileSync(path.join(root, 'accessibility.css'), 'utf8');

async function run() {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 320, height: 640 },
      isMobile: true,
      hasTouch: true
    });
    const repeatedRows = Array.from({ length: 18 }, (_, index) =>
      '<div class="listitem"><div class="listtitle">تفصيل محفوظ رقم ' + (index + 1) +
      '</div><div class="muted">وصف عربي طويل نسبيًا لاختبار التفاف النص داخل النافذة.</div></div>'
    ).join('');
    await page.setContent(
      '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"></head><body>' +
      '<div id="modalRoot"><div class="overlay"><section class="modal">' +
      '<div class="modalhead"><div class="modaltitle">إعدادات العرض</div></div>' +
      '<div class="modalbody">' +
      '<p class="desc">يمكنك مراجعة الخيارات وتعديل تفضيلات القراءة من هذه النافذة.</p>' +
      '<div class="choice"><span class="ctitle">عنوان الاختيار</span><span class="cdesc">شرح مختصر للاختيار.</span></div>' +
      '<div class="listitem"><div class="listtitle">عنوان عنصر</div><div class="muted">وصف العنصر ومعلوماته الإضافية.</div></div>' +
      '<span class="pill">معلومة مختصرة</span>' +
      '<div class="notice">تنبيه مهم يظهر قبل تأكيد العملية.</div>' +
      '<div class="summarycell"><div class="summarylabel">القيمة الحالية</div><div class="summaryvalue">١٢٬٥٠٠</div></div>' +
      '<label for="sampleInput">اسم الشخصية</label><input id="sampleInput" value="شخصية تجريبية">' +
      '<select id="sampleSelect"><option>الخيار الأول</option></select>' +
      '<textarea id="sampleTextarea">ملاحظات إضافية</textarea>' +
      '<button class="smallbtn" type="button">إجراء ثانوي</button>' +
      '<button class="primarybtn" type="button">تأكيد</button>' +
      repeatedRows +
      '</div></section></div></div></body></html>'
    );
    await page.addStyleTag({ content: style });
    await page.addStyleTag({ content: accessibility });

    const measurements = await page.evaluate(() => {
      const selectors = {
        modalTitle: '#modalRoot .modaltitle',
        description: '#modalRoot .desc',
        choiceTitle: '#modalRoot .choice .ctitle',
        choiceDescription: '#modalRoot .choice .cdesc',
        listTitle: '#modalRoot .listtitle',
        muted: '#modalRoot .muted',
        pill: '#modalRoot .pill',
        notice: '#modalRoot .notice',
        summaryLabel: '#modalRoot .summarylabel',
        summaryValue: '#modalRoot .summaryvalue',
        input: '#modalRoot input',
        select: '#modalRoot select',
        textarea: '#modalRoot textarea',
        secondaryButton: '#modalRoot .smallbtn',
        primaryButton: '#modalRoot .primarybtn'
      };
      const measure = () => Object.fromEntries(Object.entries(selectors).map(([key, selector]) => {
        const element = document.querySelector(selector);
        return [key, {
          fontSize: parseFloat(getComputedStyle(element).fontSize),
          height: element.getBoundingClientRect().height
        }];
      }));
      const normal = measure();
      document.body.classList.add('text-large');
      const large = measure();
      const modal = document.querySelector('#modalRoot .modal');
      return {
        normal,
        large,
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        modalCanScroll: modal.scrollHeight > modal.clientHeight,
        modalOverflowY: getComputedStyle(modal).overflowY
      };
    });

    for (const key of Object.keys(measurements.normal)) {
      assert.ok(
        measurements.large[key].fontSize > measurements.normal[key].fontSize,
        'large-text mode should increase ' + key + ' text'
      );
    }
    for (const key of ['input', 'select', 'textarea']) {
      assert.ok(measurements.large[key].fontSize >= 16,
        key + ' should use at least 16px text to avoid mobile browser auto-zoom');
      assert.ok(measurements.large[key].height >= 46,
        key + ' should remain comfortably tappable in large-text mode');
    }
    assert.ok(measurements.large.secondaryButton.height >= 44,
      'secondary actions should keep a 44px minimum touch target');
    assert.ok(measurements.large.primaryButton.height >= 50,
      'primary actions should remain easy to tap');
    assert.ok(measurements.documentWidth <= measurements.viewportWidth,
      'large text should not create horizontal page overflow at 320px');
    assert.equal(measurements.modalOverflowY, 'auto',
      'long settings and detail content should remain scrollable');
    assert.equal(measurements.modalCanScroll, true,
      'the modal should scroll instead of clipping enlarged content');
    process.stdout.write('Large-text browser checks passed at 320px.\n');
  } finally {
    await browser.close();
  }
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
