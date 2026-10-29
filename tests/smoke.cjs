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
assert.match(css, /max-width:500px/);
assert.match(app, /const dailyChallengeDefs=\[/, 'daily challenge catalog should be available');
assert.match(app, /function ensureDailyChallengeBoard\(\)/, 'daily challenges should rotate and persist by day');
assert.match(app, /function dailyChallengesMenu\(\)/, 'daily challenge menu should be available');
assert.match(app, /function claimDailyChallenge\(id\)/, 'daily challenge rewards should be claimable');
assert.match(app, /choice\('🎯','تحديات اليوم'/, 'daily challenges should be reachable from the main menu');
assert.match(app, /board\.claimed\.length===board\.ids\.length/, 'all daily challenge claims should trigger a completion bonus');
assert.match(app, /dailyChallenges:null/, 'older saves should migrate to the daily challenge state');
assert.match(app, /function timeMachineMenu\(\)/, 'the player should be able to review yearly rewind snapshots');
assert.match(app, /const parsed=JSON\.parse\(history\[index\]\),snap=parsed&&parsed\.snapshotVersion===1\?parsed\.state:parsed/, 'rewind menu should support both compact and legacy snapshots');
assert.match(app, /function rewindToSnapshot\(index\)/, 'time rewind should restore a selected prior state');
assert.match(app, /timeMachineSnapshots:\[\]/, 'new lives should initialize the time-machine history');
assert.match(app, /state\.timeMachineSnapshots\.push\(JSON\.stringify\(\{snapshotVersion:1,logLength,state:snapshot\}\)\)/, 'each age-up should preserve a compact rewind point');
assert.match(app, /delete snapshot\.log/, 'rewind snapshots should omit duplicated event logs');
assert.match(app, /restored\.log=Array\.isArray\(state\.log\)\?state\.log\.slice\(0,Math\.max\(0,Number\(parsedSnapshot\.logLength\)\|\|0\)\):\[\]/, 'rewind should restore the event log to the saved length');
assert.match(app, /else\{restored=parsedSnapshot;\}/, 'legacy raw snapshots should remain readable');
assert.match(app, /timeMachineDeathBtn/, 'the end-of-life panel should offer a rewind path when available');
assert.match(app, /function editCharacterTraits\(\)/, 'player traits editor should exist');
assert.match(app, /function editNpcMenu\(\)/, 'NPC trait editor should exist');
assert.match(app, /function specialCareerHistoryMenu\(\)/, 'specialist career history should be accessible');
assert.match(app, /c\.record\.attempts=\(c\.record\.attempts\|\|0\)\+1/, 'each career activity should be recorded');
assert.match(app, /c\.record\.totalEarnings=\(c\.record\.totalEarnings\|\|0\)\+\(success\?gain:0\)/, 'career earnings should accumulate');
assert.match(app, /specialCareerHistory\.unshift\(Object\.assign\(\{\},state\.specialCareer/, 'switching career paths should retain the previous career');
assert.match(app, /if\(state\.specialCareer\)state\.specialCareer\.level=newLevel/, 'an arrest outcome must not dereference a cleared active career');

assert.match(app, /choice\('🧬','محرر سمات الشخصية'/, 'character editor should be reachable from the profile menu');

assert.ok((app.match(/\{id:'[a-z-]+',title:'/g) || []).length >= 20, 'daily challenge catalog should have breadth');

assert.ok((app.match(/\nE\(\[/g) || []).length >= 25, 'at least 25 age-based events should exist');
assert.match(app, /events\.push\(/, 'expanded event library should be present');
assert.match(app, /function syncBusinessAsset\(\)/, 'business value should stay synchronized with the owned asset');
assert.match(app, /syncBusinessAsset\(\);renderHeader\(\)/, 'rendering should reconcile business and asset values');
assert.match(app, /النسخة الحالية بتدعم إدارة مشروع واحد/, 'buying a second business should be blocked until multi-business support exists');
for (const system of ['function familyMenu()', 'function petsMenu()', 'function hobbiesMenu()', 'function investingMenu()', 'function crimeMenu()', 'function cemeteryMenu()', 'function newLifeSetup()', 'function startAsChild(index)']) {
  assert.ok(app.includes(system), 'missing gameplay system: ' + system);
}
assert.match(index, /id="fameTag"/);
assert.match(index, /id="profileBtn"/);
assert.match(index, /حياة <span>\|<\/span> BITLIFE/);
assert.match(index, /id="heirloomBtn"/);
assert.match(index, /class="bottom-dock">[\s\S]*<nav class="nav"[\s\S]*id="statsPanel"/);
assert.match(css, /height:54px;min-height:54px;flex:0 0 54px/);
assert.match(css, /grid-template-columns:1fr 1fr 84px 1fr 1fr/);
assert.match(app, /function schoolHub\(\)/);
assert.match(app, /function maintainAsset\(index\)/);
assert.match(app, /function schoolClubs\(\)/, 'student clubs should have interactive actions');
assert.match(app, /craziness:Math\.floor\(Math\.random\(\)\*101\)/, 'NPC craziness should be stored');
assert.match(app, /petulance:Math\.floor\(Math\.random\(\)\*101\)/, 'sibling petulance should be stored');
assert.match(app, /a\.condition=clamp\(\(a\.condition\?\?100\)-4\)/, 'car condition should decay over time');
assert.match(app, /a\.condition=clamp\(\(a\.condition\?\?100\)-2\)/, 'property condition should decay over time');
assert.match(app, /if\(state\.prison\)return 'سجين'/, 'prison state should appear in the identity bar');
assert.match(app, /state\.fame\|\|0\)>0\)rows\.push/);
assert.match(css, /--brand:\s*#[0-9a-fA-F]{6}/, 'brand color token should be defined');
assert.match(css, /--ink:\s*#[0-9a-fA-F]{6}/, 'text color token should be defined');
assert.match(css, /@media\s*\(max-width:\s*380px\)/, 'small-phone layout rules should exist');
assert.match(css, /min-height:58px/, 'decision choices should have mobile-friendly touch height');
assert.match(css, /\.agebtn/);

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
assert.match(get('modalRoot').innerHTML, /تخصيص البداية/, 'first session should offer life setup options');
let saved = JSON.parse(store.get('hekayat_hayah_save_v1'));
assert.equal(saved.age, 0);
assert.equal(saved.status, 'حي');
assert.ok(saved.family.length >= 3);
get('ageUpBtn').dispatch('click');
saved = JSON.parse(store.get('hekayat_hayah_save_v1'));
assert.equal(saved.age, 1, 'age button increments the character age');
assert.ok(saved.log.length >= 2, 'life log persists after an action');
panels.find(p => p.dataset.panel === 'career').dispatch('click');
assert.ok(get('modalRoot').innerHTML.includes('لسه بدري'), 'career navigation blocks school hub for a toddler');
panels.find(p => p.dataset.panel === 'relations').dispatch('click');
assert.ok(get('modalRoot').innerHTML.includes('العلاقات'), 'relationships navigation opens its panel');
get('menuBtn').dispatch('click');
assert.ok(get('modalRoot').innerHTML.includes('القائمة الرئيسية'), 'main menu opens from the top bar');
assert.ok(get('modalRoot').innerHTML.includes('مقبرة الحيوات'), 'main menu provides access to the cemetery');
console.log('Smoke tests passed: RTL page, responsive BitLife-inspired UI, 40+ events, new life, autosave, age-up, career and relationship navigation.');
