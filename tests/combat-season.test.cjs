'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'combat-season.js'), 'utf8');

class FakeElement {
  constructor(tagName = 'div') {
    this.tagName = tagName;
    this.children = [];
    this.attributes = {};
    this.listeners = {};
    this.className = '';
    this.textContent = '';
    this.type = '';
    this._innerHTML = '';
  }

  get innerHTML() { return this._innerHTML; }

  set innerHTML(value) {
    this._innerHTML = String(value);
    if (this._innerHTML === '') this.children = [];
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }

  appendChild(child) {
    this.children.push(child);
    child.parentElement = this;
    return child;
  }

  addEventListener(type, callback) {
    this.listeners[type] = callback;
  }

  querySelector(selector) {
    if (selector === '[data-hayah-combat-season-entry]') {
      return this.children.find(child => child.attributes['data-hayah-combat-season-entry']) || null;
    }
    return null;
  }
}

function createContext(overrides = {}) {
  const context = vm.createContext({
    state: { age: 24, yearCount: 24, specialCareer: { id: 'fighter' } },
    choice(icon, title, description, action) {
      return { icon, title, description, action };
    },
    modal(...args) {
      context.lastModal = args;
    },
    info(...args) {
      context.lastInfo = args;
    },
    ensureCombatCareer() {
      return context.career;
    },
    combatCommunityMenu() {
      context.communityMenuOpened = true;
    },
    advanceCombatCommunity() {
      return true;
    },
    save() {
      context.saveCalls = (context.saveCalls || 0) + 1;
      return true;
    },
    document: {
      getElementById() {
        return null;
      },
      createElement(tagName) {
        return new FakeElement(tagName);
      }
    },
    ...overrides
  });
  context.window = context;
  vm.runInContext(source, context, { filename: 'combat-season.js' });
  return context;
}

function makeCareer() {
  return {
    leagueWins: 7,
    leaguePoints: 90,
    champion: true,
    community: [
      { id: 'rival-c', name: 'منافس ج', rating: 75, momentum: 0, respect: 50, tension: 10 },
      { id: 'rival-a', name: 'منافس أ', rating: 88, momentum: 2, respect: 70, tension: 15 },
      { id: 'rival-b', name: 'منافس ب', rating: 68, momentum: -1, respect: 45, tension: 30 },
      { id: 'retired', name: 'معتزل', rating: 95, retired: true },
      { id: 'deceased', name: 'متوفى', rating: 95, deceased: true }
    ]
  };
}

function findChoiceByTitle(node, titleText) {
  if (!node) return null;
  if (node.className === 'choice' && node.children.some(child =>
    child.className === 'ctext' && child.children.some(item => item.className === 'ctitle' && item.textContent === titleText)
  )) return node;
  for (const child of node.children || []) {
    const found = findChoiceByTitle(child, titleText);
    if (found) return found;
  }
  return null;
}

function makeCommunityModalRoot(titleText) {
  const heading = { textContent: titleText };
  const grid = new FakeElement('div');
  const root = {
    querySelector(selector) {
      if (selector === '.modaltitle') return heading;
      if (selector === '.choicegrid') return grid;
      return null;
    }
  };
  return { root, heading, grid };
}

test('الحفظ القديم بلا سجل مواسم يحصل على بنية اختيارية آمنة دون تغيير حقول الدوري أو اللقب', () => {
  const context = createContext();
  const career = makeCareer();
  const result = context.HayahCombatSeason.simulate(career);

  assert.ok(result);
  assert.equal(career.communityLeague.season, 1);
  assert.equal(career.communityLeague.history.length, 1);
  assert.equal(career.leagueWins, 7);
  assert.equal(career.leaguePoints, 90);
  assert.equal(career.champion, true);
  assert.equal(career.communityLeague.history[0].matches, 3);
});

test('الموسم يحاكي كل مواجهة فريدة بين المنافسين النشطين مرة واحدة', () => {
  const context = createContext();
  const career = makeCareer();
  const result = context.HayahCombatSeason.simulate(career);

  assert.equal(result.matches, 3);
  assert.equal(result.standings.length, 3);
  assert.deepEqual(
    JSON.parse(JSON.stringify(result.standings.map(row => row.played))),
    [2, 2, 2]
  );
  assert.ok(result.standings.every(row => row.wins + row.draws + row.losses === 2));
  assert.ok(result.standings.every((row, index, rows) =>
    index === 0 || rows[index - 1].points >= row.points
  ));
  assert.ok(result.standings.every(row => row.id !== 'retired' && row.id !== 'deceased'));
  assert.equal(new Set(result.matchups.map(pair => pair.slice().sort().join('|'))).size, 3,
    'the three-fighter schedule should not repeat a matchup within the season');
});

test('الموسم يحد النزالات بمواجهتين لكل منافس ويغير خصومه بين المواسم', () => {
  const context = createContext();
  const career = makeCareer();
  career.community = Array.from({ length: 20 }, (_, index) => ({
    id: 'fighter-' + String(index).padStart(2, '0'),
    name: 'مقاتل ' + (index + 1),
    rating: 45 + (index % 40),
    momentum: 0,
    respect: 50,
    tension: 10
  }));

  const first = context.HayahCombatSeason.simulate(career);
  assert.equal(first.matches, 20);
  assert.equal(first.matchups.length, 20);
  assert.equal(new Set(first.matchups.map(pair => pair.slice().sort().join('|'))).size, 20,
    'the season must not schedule the same pair twice');
  assert.ok(first.standings.every(row => row.played === 2),
    'each of the twenty active fighters should have exactly two bouts');
  assert.ok(first.standings.every(row => row.wins + row.draws + row.losses === 2));

  context.state.age += 1;
  const second = context.HayahCombatSeason.simulate(career);
  assert.ok(second);
  assert.notDeepEqual(JSON.parse(JSON.stringify(first.matchups)), JSON.parse(JSON.stringify(second.matchups)),
    'the deterministic opponent rotation should change in the next season');
});

test('موسم المنافسين يكتفي بنزال واحد إذا لم يوجد سوى مقاتلين اثنين', () => {
  const context = createContext();
  const career = makeCareer();
  career.community = career.community.slice(0, 2);
  const result = context.HayahCombatSeason.simulate(career);

  assert.equal(result.matches, 1);
  assert.deepEqual(
    JSON.parse(JSON.stringify(result.standings.map(row => row.played))),
    [1, 1]
  );
});

test('نتائج الموسم حتمية لنفس العمر والبيانات ولا تستخدم عشوائية', () => {
  const firstContext = createContext();
  const secondContext = createContext();
  const firstCareer = makeCareer();
  const secondCareer = JSON.parse(JSON.stringify(firstCareer));

  const first = firstContext.HayahCombatSeason.simulate(firstCareer);
  const second = secondContext.HayahCombatSeason.simulate(secondCareer);

  assert.deepEqual(
    JSON.parse(JSON.stringify(first.standings)),
    JSON.parse(JSON.stringify(second.standings))
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(firstCareer.community)),
    JSON.parse(JSON.stringify(secondCareer.community))
  );
});

test('لا يتكرر الموسم مرتين في العمر نفسه، ويبدأ موسم جديد بعد تقدم العمر', () => {
  const context = createContext();
  const career = makeCareer();

  assert.ok(context.HayahCombatSeason.simulate(career));
  assert.equal(context.HayahCombatSeason.simulate(career), null);
  assert.equal(career.communityLeague.season, 1);

  context.state.age += 1;
  assert.ok(context.HayahCombatSeason.simulate(career));
  assert.equal(career.communityLeague.season, 2);
});

test('سجل النتائج يحتفظ بآخر 12 موسمًا فقط', () => {
  const context = createContext();
  const career = makeCareer();

  for (let age = 20; age < 35; age += 1) {
    context.state.age = age;
    assert.ok(context.HayahCombatSeason.simulate(career));
  }

  assert.equal(career.communityLeague.season, 15);
  assert.equal(career.communityLeague.history.length, 12);
  assert.equal(career.communityLeague.history[0].season, 4);
  assert.equal(career.communityLeague.history.at(-1).season, 15);
});

test('تقدم مجتمع المقاتلين يشغل الموسم تلقائيًا مرة واحدة بعد اكتمال تحديث العمر', async () => {
  let canAdvance = true;
  const context = createContext({
    advanceCombatCommunity() {
      if (!canAdvance) return false;
      canAdvance = false;
      return true;
    }
  });
  const career = makeCareer();

  assert.equal(context.advanceCombatCommunity(career), true);
  context.state.age += 1;
  await Promise.resolve();
  assert.equal(career.communityLeague.season, 1);
  assert.equal(career.communityLeague.lastSimulatedAge, 25);
  assert.equal(context.saveCalls, 1, 'the season result must be persisted after the annual community update');
  assert.equal(context.advanceCombatCommunity(career), false);
  assert.equal(career.communityLeague.season, 1);
  assert.equal(context.saveCalls, 1, 'a duplicate same-age callback must not write another season save');

  context.state.age += 1;
  canAdvance = true;
  assert.equal(context.advanceCombatCommunity(career), true);
  await Promise.resolve();
  assert.equal(career.communityLeague.season, 2);
  assert.equal(career.communityLeague.lastSimulatedAge, 26);
  assert.equal(context.saveCalls, 2);
});

test('زر التقدم بالعمر يشغل موسم المنافسين كمسار احتياطي بعد اكتمال تحديث السنة', async () => {
  const ageButton = new FakeElement('button');
  const document = {
    getElementById(id) {
      return id === 'ageUpBtn' ? ageButton : null;
    },
    createElement(tagName) {
      return new FakeElement(tagName);
    }
  };
  const context = createContext({ document });
  const career = makeCareer();
  context.state.combatCareer = career;

  context.state.age = 25;
  ageButton.listeners.click();
  await Promise.resolve();

  assert.equal(career.communityLeague.season, 1);
  assert.equal(context.saveCalls, 1, 'the age-button fallback must persist the newly simulated season');
  ageButton.listeners.click();
  await Promise.resolve();
  assert.equal(career.communityLeague.season, 1);
  assert.equal(context.saveCalls, 1, 'the fallback must not save a duplicate season in the same age');
});

test('مراقب واجهة المجتمع يضيف سجل المواسم مرة واحدة ويعرضه عند الضغط', () => {
  const { root, heading, grid } = makeCommunityModalRoot('مجتمع المقاتلين');
  const context = createContext();
  context.career = makeCareer();

  assert.equal(context.HayahCombatSeason.injectMenuEntry(root), true);
  assert.equal(context.HayahCombatSeason.injectMenuEntry(root), false);
  assert.equal(grid.children.length, 1);

  const entry = grid.children[0];
  assert.equal(entry.className, 'choice');
  assert.equal(entry.attributes['data-hayah-combat-season-entry'], 'true');
  assert.equal(entry.attributes['aria-label'], 'سجل مواسم المنافسين');
  assert.equal(entry.children[1].children[0].textContent, 'سجل مواسم المنافسين');
  entry.listeners.click();

  assert.equal(context.lastModal[1], 'سجل مواسم المنافسين');
  assert.match(context.lastModal[2], /لم يبدأ موسم بعد/);

  heading.textContent = 'معلومات عامة';
  assert.equal(context.HayahCombatSeason.injectMenuEntry(root), false);
});

test('لوحة الموسم تعرض الترتيب وآخر متصدر وتوضح أن نقاطها لا تخص اللاعب', () => {
  const context = createContext();
  const career = makeCareer();
  context.career = career;
  context.HayahCombatSeason.simulate(career);

  context.HayahCombatSeason.openMenu();
  assert.equal(context.lastModal[1], 'سجل مواسم المنافسين');
  assert.match(context.lastModal[2], /منافس/);
  assert.match(context.lastModal[2], /نقطة/);
  assert.match(context.lastModal[2], /آخر موسم/);
});

test('واجهة الموسم تعمل حتى إذا لم تكن دوال النافذة الرئيسية مكشوفة عالميًا', () => {
  const root = new FakeElement('div');
  root.innerHTML = 'community-menu-markup';
  const document = {
    getElementById(id) {
      return id === 'modalRoot' ? root : null;
    },
    createElement(tagName) {
      return new FakeElement(tagName);
    }
  };
  const context = createContext({ document, modal: undefined, choice: undefined });
  context.career = makeCareer();

  context.HayahCombatSeason.openMenu();
  assert.equal(root.children.length, 1);
  const back = findChoiceByTitle(root, 'رجوع إلى مجتمع المقاتلين');
  assert.ok(back);
  back.listeners.click();
  assert.equal(context.communityMenuOpened, true,
    'the fallback back action should reopen the real community menu instead of restoring inert markup');
});

test('تطبيع سجل الموسم يحد القيم ويحذف السجلات غير الصالحة', () => {
  const context = createContext();
  const normalized = context.HayahCombatSeason.normalize({
    season: -10,
    lastSimulatedAge: 999,
    matchesLastSeason: 9999,
    standings: [
      null,
      { id: 'valid', position: 999, points: -1, played: 999, wins: 999, rating: 999 },
      { id: '', name: 'بلا معرّف' }
    ],
    history: Array.from({ length: 15 }, (_, index) => ({
      season: index + 1,
      age: 200,
      matches: 999,
      leaderId: 'rival',
      leaderName: 'منافس',
      leaderPoints: 99999999,
      topThree: [{ id: 'rival', name: 'منافس', points: 99999999, played: 999 }]
    }))
  });

  assert.equal(normalized.season, 0);
  assert.equal(normalized.lastSimulatedAge, 150);
  assert.equal(normalized.matchesLastSeason, 190);
  assert.equal(normalized.standings.length, 1);
  assert.equal(normalized.standings[0].position, 20);
  assert.equal(normalized.standings[0].points, 0);
  assert.equal(normalized.standings[0].played, 20);
  assert.equal(normalized.standings[0].rating, 95);
  assert.equal(normalized.history.length, 12);
  assert.equal(normalized.history[0].season, 4);
  assert.equal(normalized.history.at(-1).age, 150);
});

test('نظام المواسم لا يكتب مباشرة إلى localStorage ولا يغير مفاتيح الحفظ الأساسية', () => {
  assert.doesNotMatch(source, /localStorage|sessionStorage/);
  assert.match(source, /communityLeague/);
  assert.doesNotMatch(source, /hekayat_hayah_save_v1\s*=/);
});

test('تكامل الجسر يقرأ حالة الحياة الخاصة ويفتح قائمة المجتمع ويحفظ الموسم', async () => {
  const career = makeCareer();
  const bridgedState = { age: 24, yearCount: 24, combatCareer: career };
  const root = new FakeElement('div');
  const host = {
    getState() { return bridgedState; },
    ensureCombatCareer() { return career; },
    save() { host.saveCalls += 1; return true; },
    openCommunityMenu() { host.communityMenuOpened = true; },
    saveCalls: 0,
    communityMenuOpened: false
  };
  const context = createContext({
    state: undefined,
    ensureCombatCareer: undefined,
    combatCommunityMenu: undefined,
    modal: undefined,
    choice: undefined,
    HayahCombatSeasonHost: host,
    document: {
      getElementById(id) { return id === 'modalRoot' ? root : null; },
      createElement(tagName) { return new FakeElement(tagName); }
    }
  });

  context.HayahCombatSeason.openMenu();
  const heading = (function find(node) {
    if (!node) return null;
    if (node.className === 'modaltitle') return node;
    for (const child of node.children || []) {
      const found = find(child);
      if (found) return found;
    }
    return null;
  })(root);
  assert.equal(heading && heading.textContent, 'سجل مواسم المنافسين',
    'the menu must use the private app state through the explicit host bridge');

  const back = findChoiceByTitle(root, 'رجوع إلى مجتمع المقاتلين');
  assert.ok(back);
  back.listeners.click();
  assert.equal(host.communityMenuOpened, true,
    'the back action must call the app-owned community menu through the bridge');

  bridgedState.age = 25;
  const ageButton = new FakeElement('button');
  context.document.getElementById = id => id === 'ageUpBtn' ? ageButton : id === 'modalRoot' ? root : null;
  // The fallback listener is installed once when the module loads; trigger it with a real age transition.
  ageButton.listeners.click?.();
  await Promise.resolve();
  assert.equal(career.communityLeague.season, 1);
  assert.equal(host.saveCalls, 1,
    'the host save bridge must persist a season when the age-button fallback is used');
});

