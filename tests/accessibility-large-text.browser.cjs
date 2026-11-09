'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const style = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
const accessibility = fs.readFileSync(path.join(root, 'accessibility.css'), 'utf8');


async function runMainScreenLargeTextCheck(browser) {
  const page = await browser.newPage({
    viewport: { width: 320, height: 640 },
    isMobile: true,
    hasTouch: true
  });
  try {
    const html = [
      '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>',
      '<div id="app" class="app">',
      '<header class="topbar"><button class="menu-trigger" type="button">☰</button><div class="brandlogo"><span class="brand-symbol">ح</span><strong>حياة</strong></div><div class="top-actions"><button class="header-action" type="button">⭐</button><button class="member-btn" type="button">عضوية مميزة</button></div></header>',
      '<section class="hero"><div class="profile"><div class="avatar">👶</div><div class="identity"><div class="identity-line"><span class="identity-flag">🇪🇬</span><div class="name">مريم عبد الرحمن</div><button class="identity-info" type="button">i</button></div><div class="subline identity-role"><span class="role-tag">مديرة شركة عائلية</span></div><div class="subline identity-meta"><span>العمر ٣٨ سنة</span><span>القاهرة، مصر</span></div></div></div><div class="wealth"><div class="wealthnum">١٢٬٥٠٠٬٠٠٠ ج.م</div><div class="wealthlabel">الرصيد البنكي</div><div class="wealthsmall">بداية حكايتك</div></div></section>',
      '<div class="story-heading"><div class="story-heading-copy"><span class="story-eyebrow">رحلة الشخصية</span><h1>حكايتك سنة ورا سنة</h1></div><div class="story-heading-actions"><span class="story-year">السنة الأربعون</span></div></div>',
      '<main class="feed" id="lifeFeed">' + Array.from({ length: 12 }, (_, index) => '<article class="logcard"><div class="logtitle">حدث مهم رقم ' + (index + 1) + '</div><div class="logtext">تفصيل عربي طويل نسبيًا يشرح أثر الاختيار على الأسرة والعمل والمال، مع الحفاظ على التفاف النص داخل بطاقة اليوميات.</div></article>').join('') + '</main>',
      '<div class="bottom-dock"><nav class="nav" aria-label="القائمة الرئيسية"><button class="navbtn" type="button"><span class="navico">👶</span><span>الحياة</span></button><button class="navbtn" type="button"><span class="navico">🏠</span><span>الأصول</span></button><button class="agebtn" type="button"><span>+</span><span>سنة</span></button><button class="navbtn" type="button"><span class="navico">❤️</span><span>العلاقات</span></button><button class="navbtn" type="button"><span class="navico">⋯</span><span>الأنشطة</span></button></nav><div class="stats"><div class="statrow"><div class="stathead"><span class="statlabel">السعادة</span><span class="statvalue">٨٥٪</span></div><div class="track"><div class="fill" style="width:85%"></div></div></div></div></div>',
      '</div></body></html>'
    ].join('');
    await page.setContent(html);
    await page.addStyleTag({ content: style });
    await page.addStyleTag({ content: accessibility });

    for (const width of [320, 375]) {
      await page.setViewportSize({ width, height: 640 });
      const result = await page.evaluate(() => {
        // The avatar is a decorative identity glyph, not body text. Keep its geometry visible, but do not require the text-size preference to scale it.
        const selectors = {
          name: '#app .name',
          role: '#app .role-tag',
          identityMeta: '#app .identity-meta',
          wealthValue: '#app .wealthnum',
          wealthLabel: '#app .wealthlabel',
          wealthNote: '#app .wealthsmall',
          storyEyebrow: '#app .story-eyebrow',
          storyTitle: '#app .story-heading h1',
          storyYear: '#app .story-year',
          logTitle: '#app .logtitle',
          logText: '#app .logtext',
          navLabel: '#app .navbtn',
          statLabel: '#app .statlabel',
          statValue: '#app .statvalue'
        };
        const measure = () => Object.fromEntries(Object.entries(selectors).map(([key, selector]) => {
          const element = document.querySelector(selector);
          return [key, parseFloat(getComputedStyle(element).fontSize)];
        }));
        const normal = measure();
        document.body.classList.add('text-large');
        const large = measure();
        const widthOf = selector => {
          const element = document.querySelector(selector);
          return { client: element.clientWidth, scroll: element.scrollWidth };
        };
        const touch = selector => document.querySelector(selector).getBoundingClientRect().height;
        return {
          normal,
          large,
          viewport: window.innerWidth,
          documentWidth: document.documentElement.scrollWidth,
          heroDisplay: getComputedStyle(document.querySelector('#app .hero')).display,
          heroGridColumns: getComputedStyle(document.querySelector('#app .hero')).gridTemplateColumns,
          hero: widthOf('#app .hero'),
          profile: widthOf('#app .profile'),
          wealth: widthOf('#app .wealth'),
          avatar: widthOf('#app .avatar'),
          avatarPosition: getComputedStyle(document.querySelector('#app .avatar')).position,
          avatarBounds: (() => { const r=document.querySelector('#app .avatar').getBoundingClientRect(); return {left:r.left,right:r.right,width:r.width}; })(),
          heroBounds: (() => { const r=document.querySelector('#app .hero').getBoundingClientRect(); return {left:r.left,right:r.right}; })(),
          nameWhiteSpace: getComputedStyle(document.querySelector('#app .name')).whiteSpace,
          roleWhiteSpace: getComputedStyle(document.querySelector('#app .role-tag')).whiteSpace,
          metaWhiteSpace: getComputedStyle(document.querySelector('#app .identity-meta span')).whiteSpace,
          wealthWhiteSpace: getComputedStyle(document.querySelector('#app .wealthnum')).whiteSpace,
          story: widthOf('#app .story-heading'),
          nav: widthOf('#app .nav'),
          metaWrap: getComputedStyle(document.querySelector('#app .identity-meta')).flexWrap,
          storyWrap: getComputedStyle(document.querySelector('#app .story-heading')).flexWrap,
          feedOverflow: getComputedStyle(document.querySelector('#app .feed')).overflowY,
          navButtonHeight: touch('#app .navbtn'),
          ageButtonHeight: touch('#app .agebtn')
        };
      });

      for (const key of Object.keys(result.normal)) {
        assert.ok(result.large[key] > result.normal[key],
          'main-screen large-text mode should increase ' + key + ' at ' + width + 'px');
      }
      assert.ok(result.documentWidth <= result.viewport,
        'main-screen large text must not create document-level horizontal overflow at ' + width + 'px');
      assert.equal(result.heroDisplay, 'grid',
        'the narrow large-text identity card should use the two-column grid at ' + width + 'px');
      assert.equal(result.avatarPosition, 'relative',
        'the character avatar must remain in the identity layout, not be positioned off-screen');
      assert.ok(result.avatarBounds.width > 0,
        'the character avatar must retain a visible width at ' + width + 'px');
      assert.ok(result.avatarBounds.left >= result.heroBounds.left - 1 &&
        result.avatarBounds.right <= result.heroBounds.right + 1,
        'the character avatar must remain visible inside the identity card at ' + width + 'px');
      assert.notEqual(result.nameWhiteSpace, 'nowrap',
        'the character name must wrap instead of being clipped at ' + width + 'px');
      assert.notEqual(result.roleWhiteSpace, 'nowrap',
        'the character role must wrap instead of being clipped at ' + width + 'px');
      assert.notEqual(result.metaWhiteSpace, 'nowrap',
        'identity metadata must wrap instead of being clipped at ' + width + 'px');
      assert.notEqual(result.wealthWhiteSpace, 'nowrap',
        'the bank balance must wrap instead of forcing a wide grid track at ' + width + 'px');
      for (const key of ['avatar', 'profile', 'wealth', 'hero', 'story', 'nav']) {
        assert.ok(result[key].scroll <= result[key].client + 1,
          key + ' must wrap or fit without horizontal overflow at ' + width + 'px; ' +
          JSON.stringify({measurement:result[key],grid:result.heroGridColumns,
            profile:result.profile,wealth:result.wealth}));
      }
      assert.equal(result.metaWrap, 'wrap', 'identity metadata should wrap in large-text mode');
      assert.equal(result.storyWrap, 'wrap', 'the story heading should wrap in large-text mode');
      assert.equal(result.feedOverflow, 'auto', 'the life feed should remain vertically scrollable');
      assert.ok(result.navButtonHeight >= 44, 'navigation buttons should remain touch-friendly');
      assert.ok(result.ageButtonHeight >= 44, 'the age-up action should remain touch-friendly');
    }
    process.stdout.write('Main-screen large-text checks passed at 320px and 375px.\\n');
  } finally {
    await page.close();
  }
}

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
    await runMainScreenLargeTextCheck(browser);
    process.stdout.write('Large-text browser checks passed at 320px.\n');
  } finally {
    await browser.close();
  }
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
