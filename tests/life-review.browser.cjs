'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml'
};

function createServer() {
  return http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
    const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const filename = path.resolve(root, relative);
    if (!filename.startsWith(root + path.sep)) {
      response.writeHead(403).end();
      return;
    }
    fs.readFile(filename, (error, content) => {
      if (error) {
        response.writeHead(404).end();
        return;
      }
      response.writeHead(200, { 'Content-Type': mime[path.extname(filename)] || 'application/octet-stream' });
      response.end(content);
    });
  });
}

(async () => {
  const server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:' + address.port + '/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.HayahLifeReview && typeof window.HayahLifeReview.openReport === 'function');

    const result = await page.evaluate(() => {
      const life = {
        version: 1,
        lifeId: 'browser-life-review',
        name: '<img src=x onerror=alert(1)>',
        age: 68,
        cause: 'كبر السن',
        place: { country: 'مصر', unit: 'ج.م' },
        bank: 120000,
        debt: 30000,
        assets: [{ value: 80000 }],
        investments: [{ value: 50000 }],
        children: [{ name: 'ليلى' }],
        family: [{ name: 'الأب' }],
        friends: [{ name: 'صديق' }],
        pets: [],
        partner: { name: 'سلمى' },
        job: { title: 'مهندس' },
        jobHistory: [{ title: 'محلل بيانات' }],
        specialCareerHistory: [{ title: 'مخرج' }],
        education: { major: 'هندسة' },
        accomplishments: ['تخرجت من الجامعة'],
        combatCareer: { wins: 12, losses: 3, draws: 2, knockouts: 5, rank: 4, retired: true, champion: true, championshipHistory: [{ age: 40, year: 2040, opponent: 'منافس' }], titleDefenseHistory: [{ result: 'defended' }] },
        filmStudio: { projects: 4, awards: 2, bestCritic: 92, totalBoxOffice: 1200000, filmography: [] },
        esportsCareer: { tournaments: 6, wins: 4, losses: 2, rank: 5 },
        business: { id: 'main-business', title: 'مشروع رئيسي' },
        companies: [{ id: 'main-business', title: 'مكرر' }, { id: 'company-2', title: 'شركة إضافية' }],
        log: [
          { age: 22, title: '<img src=x onerror=alert(2)>', text: 'محطة آمنة كنص.', tone: 'special' },
          { age: 29, title: 'بداية مشروع', text: 'بدأت مشروعك الأول.', tone: 'special' }
        ],
        status: 'متوفى'
      };
      localStorage.setItem('hekayat_hayah_save_v1', JSON.stringify(life));
      localStorage.setItem('hekayat_hayah_cemetery_v1', JSON.stringify([
        { id: 'browser-life-review', ribbon: 'مسار مهني ناجح' }
      ]));
      const before = localStorage.getItem('hekayat_hayah_save_v1');
      const dialog = document.createElement('section');
      dialog.id = 'deathDialog';
      dialog.className = 'modal';
      dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('aria-modal', 'false');
      dialog.setAttribute('aria-labelledby', 'originalDeathTitle');
      dialog.setAttribute('aria-describedby', 'originalDeathDescription');
      const originalTitle = document.createElement('h2');
      originalTitle.id = 'originalDeathTitle';
      originalTitle.textContent = 'نهاية الحياة';
      const reviewButton = document.createElement('button');
      reviewButton.id = 'reviewBtn';
      reviewButton.type = 'button';
      reviewButton.textContent = 'راجع دفتر حياتك';
      dialog.append(originalTitle, reviewButton);
      document.getElementById('modalRoot').appendChild(dialog);

      const appRoot = document.getElementById('app');
      const feedbackRoot = document.getElementById('feedbackRoot');
      const skipLink = document.querySelector('.skip-link');
      skipLink.setAttribute('aria-hidden', 'false');
      feedbackRoot.setAttribute('inert', '');
      feedbackRoot.setAttribute('aria-hidden', 'false');

      reviewButton.focus();
      reviewButton.click();
      const panel = dialog.querySelector('[data-life-review-panel]');
      const title = panel && panel.querySelector('h2');
      const imageCount = panel ? panel.querySelectorAll('img').length : -1;
      const reportText = panel ? panel.textContent : '';
      const closeButton = panel && panel.querySelector('[data-life-review-close]');
      const doneButton = panel && panel.querySelector('.life-review-done');
      const initialFocus = document.activeElement === title;
      const headingTabIndex = !!title && title.getAttribute('tabindex') === '-1';
      const descriptionRemovedWhileOpen = !dialog.hasAttribute('aria-describedby');
      let headingShiftWrapped = false;
      let headingForwardAllowed = false;
      if (title && doneButton) {
        title.focus();
        const reverseFromHeading = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true });
        document.dispatchEvent(reverseFromHeading);
        headingShiftWrapped = document.activeElement === doneButton && reverseFromHeading.defaultPrevented;
        title.focus();
        const forwardFromHeading = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
        document.dispatchEvent(forwardFromHeading);
        headingForwardAllowed = !forwardFromHeading.defaultPrevented;
      }
      const modalDuring = dialog.getAttribute('aria-modal');
      const appInertDuring = appRoot.hasAttribute('inert');
      const appHiddenDuring = appRoot.getAttribute('aria-hidden') === 'true';
      const feedbackInertDuring = feedbackRoot.hasAttribute('inert');
      const feedbackHiddenDuring = feedbackRoot.getAttribute('aria-hidden') === 'true';
      const skipLinkInertDuring = skipLink.hasAttribute('inert');
      const skipLinkHiddenDuring = skipLink.getAttribute('aria-hidden') === 'true';
      const modalRootRemainsActive = !document.getElementById('modalRoot').hasAttribute('inert');
      let shiftWrapped = false;
      let forwardWrapped = false;
      if (closeButton && doneButton) {
        closeButton.focus();
        const reverseTab = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true });
        document.dispatchEvent(reverseTab);
        shiftWrapped = document.activeElement === doneButton && reverseTab.defaultPrevented;
        doneButton.focus();
        const forwardTab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
        document.dispatchEvent(forwardTab);
        forwardWrapped = document.activeElement === closeButton && forwardTab.defaultPrevented;
      }
      if (closeButton) closeButton.click();
      const focusRestored = document.activeElement === reviewButton;
      const appInertRestored = !appRoot.hasAttribute('inert');
      const appHiddenRestored = appRoot.getAttribute('aria-hidden') === null;
      const feedbackInertRestored = feedbackRoot.hasAttribute('inert');
      const feedbackHiddenRestored = feedbackRoot.getAttribute('aria-hidden') === 'false';
      const skipLinkInertRestored = !skipLink.hasAttribute('inert');
      const skipLinkHiddenRestored = skipLink.getAttribute('aria-hidden') === 'false';
      const restoredModal = dialog.getAttribute('aria-modal');
      const restoredRole = dialog.getAttribute('role');
      const restoredDescription = dialog.getAttribute('aria-describedby');
      reviewButton.click();
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
      document.dispatchEvent(escapeEvent);
      const escapeClosed = !dialog.hasAttribute('data-life-review-open');
      const escapePrevented = escapeEvent.defaultPrevented;
      const escapeFocusRestored = document.activeElement === reviewButton;
      const escapeBackgroundRestored = !appRoot.hasAttribute('inert') &&
        appRoot.getAttribute('aria-hidden') === null &&
        feedbackRoot.hasAttribute('inert') && feedbackRoot.getAttribute('aria-hidden') === 'false' &&
        !skipLink.hasAttribute('inert') && skipLink.getAttribute('aria-hidden') === 'false';
      return {
        opened: !!panel,
        title: title && title.textContent,
        containsCareer: reportText.includes('مهندس'),
        containsSpecializedHeading: reportText.includes('بصمة المسارات المتخصصة'),
        containsCombatRecord: reportText.includes('مسيرة القتال') && reportText.includes('دفاع ناجح عن اللقب') && reportText.includes('تعادل') && reportText.includes('تتويج عالمي') && reportText.includes('اعتزل المنافسة'),
        containsFilmRecord: reportText.includes('استوديو الأفلام') && reportText.includes('جائزة') && reportText.includes('أعلى تقييم نقدي'),
        containsEsportsRecord: reportText.includes('الألعاب الإلكترونية') && reportText.includes('الترتيب'),
        containsBusinessRecord: reportText.includes('إدارة الأعمال') && reportText.includes('نشاط تجاري'),
        noUndefinedAge: !reportText.includes('عمر undefined'),
        containsNetWorth: reportText.includes('220,000') || reportText.includes('٢٢٠٬٠٠٠') || reportText.includes('220000'),
        imageCount,
        restored: dialog.contains(reviewButton),
        restoredLabel: dialog.getAttribute('aria-labelledby'),
        initialFocus,
        headingTabIndex,
        descriptionRemovedWhileOpen,
        headingShiftWrapped,
        headingForwardAllowed,
        restoredDescription,
        modalDuring,
        appInertDuring,
        appHiddenDuring,
        feedbackInertDuring,
        feedbackHiddenDuring,
        skipLinkInertDuring,
        skipLinkHiddenDuring,
        modalRootRemainsActive,
        appInertRestored,
        appHiddenRestored,
        feedbackInertRestored,
        feedbackHiddenRestored,
        skipLinkInertRestored,
        skipLinkHiddenRestored,
        escapeBackgroundRestored,
        shiftWrapped,
        forwardWrapped,
        focusRestored,
        restoredModal,
        restoredRole,
        escapeClosed,
        escapePrevented,
        escapeFocusRestored,
        unchanged: localStorage.getItem('hekayat_hayah_save_v1') === before
      };
    });

    assert.equal(result.opened, true, 'the existing end-of-life review button must open the report');
    assert.equal(result.title, 'حياة <img src=x onerror=alert(1)>');
    assert.equal(result.containsCareer, true);
    assert.equal(result.containsSpecializedHeading, true);
    assert.equal(result.containsCombatRecord, true, 'the final review should retain draws, title wins, and retirement status');
    assert.equal(result.containsFilmRecord, true, 'the final review should show the best critic score');
    assert.equal(result.containsEsportsRecord, true);
    assert.equal(result.containsBusinessRecord, true);
    assert.equal(result.noUndefinedAge, true, 'specialized records must not be rendered as age-based milestones');
    assert.equal(result.containsNetWorth, true);
    assert.equal(result.imageCount, 0, 'saved strings must be rendered as text, not executable markup');
    assert.equal(result.restored, true, 'closing the report must restore the original end-of-life summary');
    assert.equal(result.restoredLabel, 'originalDeathTitle');
    assert.equal(result.initialFocus, true, 'opening the report must focus the report heading first');
    assert.equal(result.headingTabIndex, true, 'the report heading must accept programmatic focus without entering the Tab order');
    assert.equal(result.descriptionRemovedWhileOpen, true, 'structured report content must not be flattened into aria-describedby');
    assert.equal(result.headingShiftWrapped, true, 'Shift+Tab from the initial heading must wrap to the last dialog control');
    assert.equal(result.headingForwardAllowed, true, 'Tab from the initial heading must proceed to the first dialog control');
    assert.equal(result.restoredDescription, 'originalDeathDescription', 'the dialog must restore its original description after closing');
    assert.equal(result.modalDuring, 'true', 'the report must be announced as a modal dialog');
    assert.equal(result.appInertDuring && result.appHiddenDuring, true, 'the game screen behind the report must be inert and hidden from assistive technology');
    assert.equal(result.feedbackInertDuring && result.feedbackHiddenDuring, true, 'background feedback must be isolated while the report is open');
    assert.equal(result.skipLinkInertDuring && result.skipLinkHiddenDuring, true, 'the bypass link must not remain reachable behind the modal');
    assert.equal(result.modalRootRemainsActive, true, 'the active modal container must never be made inert');
    assert.equal(result.shiftWrapped, true, 'Shift+Tab from the first control must wrap to the last');
    assert.equal(result.forwardWrapped, true, 'Tab from the last control must wrap to the first');
    assert.equal(result.focusRestored, true, 'closing the report must return focus to its trigger');
    assert.equal(result.appInertRestored && result.appHiddenRestored, true, 'the app background state must be restored after closing');
    assert.equal(result.feedbackInertRestored && result.feedbackHiddenRestored, true, 'pre-existing feedback-root accessibility state must be preserved');
    assert.equal(result.skipLinkInertRestored && result.skipLinkHiddenRestored, true, 'the bypass link state must be restored exactly');
    assert.equal(result.restoredModal, 'false', 'the original aria-modal value must be restored');
    assert.equal(result.restoredRole, 'dialog', 'the original dialog role must be preserved');
    assert.equal(result.escapeClosed, true, 'Escape must close the report');
    assert.equal(result.escapePrevented, true, 'Escape must be consumed by the report');
    assert.equal(result.escapeFocusRestored, true, 'Escape must restore focus to the trigger');
    assert.equal(result.escapeBackgroundRestored, true, 'Escape must restore every background inert and aria-hidden state');
    assert.equal(result.unchanged, true, 'opening the report must not write to the save');

    assert.deepEqual(errors, [], 'life review should not create browser runtime errors');
    process.stdout.write('Life review browser checks passed.\n');
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => {
  process.stderr.write(error.stack + '\n');
  process.exitCode = 1;
});
