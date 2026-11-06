'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const accessibility = fs.readFileSync(path.join(root, 'accessibility.css'), 'utf8');
const style = fs.readFileSync(path.join(root, 'style.css'), 'utf8');

function functionSource(name) {
  const start = app.indexOf('function ' + name + '(');
  assert.notEqual(start, -1, 'expected function ' + name);
  const end = app.indexOf('\nfunction ', start + 1);
  assert.notEqual(end, -1, 'expected a following function after ' + name);
  return app.slice(start, end);
}

const classes = new Set();
const stored = new Map();
const themeMeta = { value: '', setAttribute(name, value) { if (name === 'content') this.value = value; } };
const context = vm.createContext({
  document: {
    body: {
      classList: {
        toggle(name, enabled) {
          if (enabled) classes.add(name);
          else classes.delete(name);
        }
      }
    },
    querySelector(selector) {
      return selector === 'meta[name="theme-color"]' ? themeMeta : null;
    }
  },
  localStorage: {
    setItem(key, value) { stored.set(key, String(value)); },
    getItem(key) { return stored.has(key) ? stored.get(key) : null; }
  },
  SETTINGS_KEY: 'hayah_ui_settings_v1'
});
context.uiSettings = {
  theme: 'light',
  textScale: 'normal',
  sound: false,
  haptics: false,
  boosts: true,
  combatTimingAssist: false,
  reducedMotion: false
};

vm.runInContext([
  functionSource('applyUiSettings'),
  functionSource('normalizeUiSettings'),
  functionSource('persistUiSettings'),
  'globalThis.api = { normalize: normalizeUiSettings, apply: applyUiSettings, persist: persistUiSettings };'
].join(String.fromCharCode(10)), context, { filename: 'accessibility-reduced-motion.test.cjs' });

test('الإعدادات القديمة تظل صالحة ويكون تقليل الحركة متوقفًا افتراضيًا', () => {
  const legacy = context.api.normalize({
    theme: 'dark',
    textScale: 'large',
    sound: true,
    haptics: true,
    boosts: false,
    combatTimingAssist: true
  });
  assert.equal(legacy.reducedMotion, false);
  assert.equal(legacy.theme, 'dark');
  assert.equal(legacy.textScale, 'large');
  assert.equal(legacy.sound, true);
  assert.equal(legacy.haptics, true);

  assert.equal(context.api.normalize({ reducedMotion: 'yes' }).reducedMotion, false);
  assert.equal(context.api.normalize({ reducedMotion: true }).reducedMotion, true);
});

test('تطبيق التفضيل يضيف ويزيل طبقة تقليل الحركة دون تغيير الطابع أو حجم النص', () => {
  context.uiSettings = context.api.normalize({ theme: 'dark', textScale: 'large', reducedMotion: true });
  context.api.apply();
  assert.equal(classes.has('reduce-motion'), true);
  assert.equal(classes.has('theme-dark'), true);
  assert.equal(classes.has('text-large'), true);
  assert.equal(themeMeta.value, '#17232c');

  context.uiSettings.reducedMotion = false;
  context.api.apply();
  assert.equal(classes.has('reduce-motion'), false);
  assert.equal(classes.has('theme-dark'), true);
});

test('قائمة الإعدادات تعرض خيار تقليل الحركة وتحفظه في مفتاح الواجهة فقط', () => {
  const menu = functionSource('settingsMenu');
  assert.ok(menu.includes("choice(uiSettings.reducedMotion?'🧘':'🎞️'"));
  assert.ok(menu.includes("uiSettings.reducedMotion?'تقليل الحركة: مفعّل':'تقليل الحركة: متوقف'"));
  assert.ok(menu.includes('uiSettings.reducedMotion=!uiSettings.reducedMotion;persistUiSettings();settingsMenu();'));
  assert.ok(menu.includes('reducedMotion:false'), 'resetting display settings should restore the default motion preference');

  context.uiSettings = context.api.normalize({ reducedMotion: true });
  context.api.persist();
  assert.equal(classes.has('reduce-motion'), true);
  assert.equal(JSON.parse(stored.get('hayah_ui_settings_v1')).reducedMotion, true);
  assert.deepEqual(Array.from(stored.keys()), ['hayah_ui_settings_v1']);

  context.uiSettings = context.api.normalize(null);
  context.api.persist();
  assert.equal(classes.has('reduce-motion'), false);
  assert.equal(JSON.parse(stored.get('hayah_ui_settings_v1')).reducedMotion, false);
});

test('التفضيل اليدوي وتفضيل نظام التشغيل يقللان الحركة غير الضرورية', () => {
  assert.ok(accessibility.includes('body.reduce-motion *'));
  assert.ok(accessibility.includes('animation-duration: .01ms !important'));
  assert.ok(accessibility.includes('transition-duration: .01ms !important'));
  assert.ok(style.includes('@media(prefers-reduced-motion:reduce)'));
  assert.ok(app.includes("const SETTINGS_KEY = 'hayah_ui_settings_v1';"));
  const persistSource = functionSource('persistUiSettings');
  assert.ok(persistSource.includes('localStorage.setItem(SETTINGS_KEY'));
  assert.equal(persistSource.includes('localStorage.setItem(KEY,'), false);
});
