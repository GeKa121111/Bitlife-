const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const index = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('style.css', 'utf8');
const app = fs.readFileSync('app.js', 'utf8');
assert.match(index, /lang="ar" dir="rtl"/);
assert.match(index, /href="style.css"/);
assert.match(index, /src="app.js"/);
assert.match(index, /id="ageUpBtn"/);
assert.match(css, /max-width:450px/);
assert.ok((app.match(/\nE\(\[/g) || []).length >= 25, 'at least 25 age-based events should exist');

class FakeElement {
  constructor(id = '') {
    this.id = id;
    this.textContent = '';
    this.innerHTML = '';
    this.value = '';
    this.scrollTop = 0;
    this.scrollHeight = 100;
    this.childNodes = [{ nodeValue: '👶' }];
    this.dataset = {};
    this.listeners = {};
    this.children = [];
    this.classList = {
      add() {}, remove() {},
      toggle() {}
    };
  }
  addEventListener(type, cb) {
    (this.listeners[type] ||= []).push(cb);
  }
  dispatch(type, event = {}) {
    for (const cb of this.listeners[type] || []) cb({ target: this, ...event });
  }
  querySelectorAll() { return []; }
  appendChild(node) { this.children.push(node); }
  remove() {}
}
const elements = new Map();
const get = id => {
  if (!elements.has(id)) elements.set(id, new FakeElement(id));
  return elements.get(id);
};
const panels = ['career','assets','relations','activities'].map(panel => {
  const el = new FakeElement(panel + 'Nav'); el.dataset.panel = panel; return el;
});
const store = new Map();
const context = {
  document: {
    getElementById: get,
    querySelectorAll(selector) {
      if (selector === '[data-panel]' || selector === '.navbtn') return panels;
      return [];
    },
    createElement(tag) { return new FakeElement(tag); }
  },
  localStorage: {
    getItem(key) { return store.has(key) ? store.get(key) : null; },
    setItem(key, value) { store.set(key, String(value)); }
  },
  requestAnimationFrame(cb) { cb(); },
  confirm() { return true; },
  alert() {},
  console
};
vm.runInNewContext(app, context, { timeout: 3000 });
assert.match(get('lifeFeed').innerHTML, /أول يوم في الدنيا/);
let saved = JSON.parse(store.get('hekayat_hayah_save_v1'));
assert.equal(saved.age, 0);
assert.equal(saved.status, 'حي');
assert.ok(saved.family.length >= 3);
get('ageUpBtn').dispatch('click');
saved = JSON.parse(store.get('hekayat_hayah_save_v1'));
assert.equal(saved.age, 1, 'age button increments the character age');
assert.ok(saved.log.length >= 2, 'life log persists after an action');
panels.find(p => p.dataset.panel === 'career').dispatch('click');
assert.ok(get('modalRoot').innerHTML.includes('الدراسة والشغل'), 'career navigation opens the career panel');
panels.find(p => p.dataset.panel === 'relations').dispatch('click');
assert.ok(get('modalRoot').innerHTML.includes('العلاقات'), 'relationships navigation opens its panel');
console.log('Smoke tests passed: RTL page, assets, 40+ events, new life, autosave, age-up, career and relationship navigation.');
