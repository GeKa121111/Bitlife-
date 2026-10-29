'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('index.html');
const app = read('app.js');
const css = read('style.css');
const readme = read('README.md');

function functionSource(name, nextName) {
  const start = app.indexOf('function ' + name + '(');
  assert.notEqual(start, -1, 'expected function ' + name);
  const end = nextName ? app.indexOf('function ' + nextName + '(', start + 1) : app.length;
  assert.notEqual(end, -1, 'expected following function ' + nextName);
  return app.slice(start, end);
}

test('واجهة حياة عربية RTL وتحافظ على اسمها المستقل', () => {
  assert.match(html, /<html lang="ar" dir="rtl">/);
  assert.match(html, /class="brandlogo" aria-label="حياة \| محاكي الحياة">حياة/);
  assert.doesNotMatch(html, /BITLIFE|BitLife|Candywriter/);
});

test('ملفات الواجهة الأساسية موجودة ومربوطة محليًا', () => {
  assert.match(html, /href="style\.css"/);
  assert.match(html, /src="app\.js"/);
  assert.ok(fs.existsSync(path.join(root, 'style.css')));
  assert.ok(fs.existsSync(path.join(root, 'app.js')));
  assert.match(html, /<meta name="viewport"[^>]*viewport-fit=cover/);
});

test('مفتاح الحفظ القديم وإصدار الحفظ لم يتغيرا', () => {
  assert.match(app, /const KEY = 'hekayat_hayah_save_v1';/);
  assert.match(app, /const CEMETERY_KEY = 'hekayat_hayah_cemetery_v1';/);
  assert.match(app, /return \{version:1,lifeId:/);
  assert.match(app, /function load\(\)[\s\S]*?x\.version===1/);
});

test('تحميل الحفظ القديم واستيراده يطبّعان البيانات الناقصة بدل كسر اللعبة', () => {
  assert.match(app, /function normalizeCoreState\(data\)/);
  assert.match(app, /const statDefaults=\{happiness:65,health:80,smart:40,looks:45\}/);
  assert.match(app, /data\.place=\{\.\.\.fallbackPlace,\.\.\.rawPlace\}/);
  assert.match(app, /function load\(\)[\s\S]*?normalizeCoreState\(x\)/);
  assert.match(app, /function importSave\(\)[\s\S]*?normalizeCoreState\(data\)/);
  assert.match(app, /data\.version!==1/);
});

test('الرسائل المالية تستخدم عملة بلد الشخصية بدل افتراض الجنيه المصري', () => {
  const relationship = functionSource('relationshipAction', 'addFriend');
  const activity = functionSource('activity', 'importSave');
  assert.doesNotMatch(relationship, /جنيه/);
  assert.doesNotMatch(activity, /جنيه/);
  assert.match(relationship, /cash\(500\)/);
  assert.match(activity, /cash\(1200\)/);
  assert.match(activity, /cash\(300\)/);
  assert.match(activity, /cash\(1800\)/);
});

test('تخطيط الهاتف وإمكانية الوصول ما زالا موجودين', () => {
  assert.match(css, /@media\(max-width:380px\)/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css, /button:focus-visible/);
  assert.match(css, /\.brandlogo\{[^}]*color:#fff/);
});

test('تطبيق الويب قابل للتثبيت ويحتفظ بملفات الواجهة للعمل دون اتصال', () => {
  const manifest = JSON.parse(read('manifest.webmanifest'));
  const worker = read('sw.js');
  const icon = read('icon.svg');
  assert.equal(manifest.lang, 'ar');
  assert.equal(manifest.dir, 'rtl');
  assert.equal(manifest.display, 'standalone');
  assert.ok(manifest.icons.some(item => item.src === './icon.svg'));
  assert.match(html, /rel="manifest" href="manifest\.webmanifest"/);
  assert.match(app, /navigator\.serviceWorker\.register\('\.\/sw\.js'\)/);
  assert.match(worker, /cache\.addAll\(APP_SHELL\)/);
  assert.match(worker, /caches\.match\(APP_SHELL\[0\]\)/);
  assert.match(icon, /حياة/);
});

test('توثيق الجودة لا يدّعي اختبار متصفح غير موجود', () => {
  assert.match(readme, /صياغة.*app\.js/);
  assert.match(readme, /اختبار يدوي كامل داخل متصفح الهاتف/);
});
