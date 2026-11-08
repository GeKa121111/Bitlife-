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
        combatCareer: { wins: 12, losses: 3, knockouts: 5, champion: true, titleDefenseHistory: [{ result: 'defended' }] },
        filmStudio: { projects: 4, awards: 2, totalBoxOffice: 1200000, filmography: [] },
        esportsCareer: { tournaments: 6, wins: 4, losses: 2 },
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
      dialog.setAttribute('aria-labelledby', 'originalDeathTitle');
      const originalTitle = document.createElement('h2');
      originalTitle.id = 'originalDeathTitle';
      originalTitle.textContent = 'نهاية الحياة';
      const reviewButton = document.createElement('button');
      reviewButton.id = 'reviewBtn';
      reviewButton.type = 'button';
      reviewButton.textContent = 'راجع دفتر حياتك';
      dialog.append(originalTitle, reviewButton);
      document.getElementById('modalRoot').appendChild(dialog);

      reviewButton.click();
      const panel = dialog.querySelector('[data-life-review-panel]');
      const title = panel && panel.querySelector('h2');
      const imageCount = panel ? panel.querySelectorAll('img').length : -1;
      const reportText = panel ? panel.textContent : '';
      const closeButton = panel && panel.querySelector('[data-life-review-close]');
      if (closeButton) closeButton.click();
      return {
        opened: !!panel,
        title: title && title.textContent,
        containsCareer: reportText.includes('مهندس'),
        containsSpecializedHeading: reportText.includes('بصمة المسارات المتخصصة'),
        containsCombatRecord: reportText.includes('مسيرة القتال') && reportText.includes('دفاع ناجح عن اللقب'),
        containsFilmRecord: reportText.includes('استوديو الأفلام') && reportText.includes('جائزة'),
        containsEsportsRecord: reportText.includes('الألعاب الإلكترونية'),
        containsBusinessRecord: reportText.includes('إدارة الأعمال') && reportText.includes('نشاط تجاري'),
        containsNetWorth: reportText.includes('220,000') || reportText.includes('٢٢٠٬٠٠٠') || reportText.includes('220000'),
        imageCount,
        restored: dialog.contains(reviewButton),
        restoredLabel: dialog.getAttribute('aria-labelledby'),
        unchanged: localStorage.getItem('hekayat_hayah_save_v1') === before
      };
    });

    assert.equal(result.opened, true, 'the existing end-of-life review button must open the report');
    assert.equal(result.title, 'حياة <img src=x onerror=alert(1)>');
    assert.equal(result.containsCareer, true);
    assert.equal(result.containsSpecializedHeading, true);
    assert.equal(result.containsCombatRecord, true);
    assert.equal(result.containsFilmRecord, true);
    assert.equal(result.containsEsportsRecord, true);
    assert.equal(result.containsBusinessRecord, true);
    assert.equal(result.containsNetWorth, true);
    assert.equal(result.imageCount, 0, 'saved strings must be rendered as text, not executable markup');
    assert.equal(result.restored, true, 'closing the report must restore the original end-of-life summary');
    assert.equal(result.restoredLabel, 'originalDeathTitle');
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
