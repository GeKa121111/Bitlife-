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
  assert.equal(career.communityLeague.records.length, 3);
  assert.ok(career.communityLeague.records.every(record => record.seasons === 1));
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

test('أفضل أربعة يتأهلون إلى نصف النهائي والنهائي مع سجل مستقل دون تغيير لقب اللاعب', () => {
  const context = createContext();
  const career = makeCareer();
  career.community.push({ id: 'rival-d', name: 'منافس د', rating: 82, momentum: 1, respect: 60, tension: 20 });
  const result = context.HayahCombatSeason.simulate(career);
  assert.ok(result.playoffs);
  assert.deepEqual(JSON.parse(JSON.stringify(result.playoffs.qualifiers.map(item => item.seed))), [1, 2, 3, 4]);
  assert.equal(result.playoffs.matches.length, 3);
  assert.deepEqual(JSON.parse(JSON.stringify(result.playoffs.matches.map(match => match.round))), ['semi-final', 'semi-final', 'final']);
  assert.equal(result.playoffs.matches[2].winnerId, result.playoffs.championId);
  assert.ok(result.playoffs.qualifiers.every(item => ['rival-a', 'rival-b', 'rival-c', 'rival-d'].includes(item.id)));
  const records = career.communityLeague.records;
  assert.equal(records.reduce((sum, record) => sum + record.playoffAppearances, 0), 4);
  assert.equal(records.reduce((sum, record) => sum + record.playoffWins, 0), 3);
  assert.equal(records.reduce((sum, record) => sum + record.playoffTitles, 0), 1);
  assert.equal(career.communityLeague.history[0].playoffs.championId, result.playoffs.championId);
  assert.equal(career.leagueWins, 7);
  assert.equal(career.leaguePoints, 90);
  assert.equal(career.champion, true);

  assert.deepEqual(
    JSON.parse(JSON.stringify(result.playoffs.qualifiers.map(item => item.id))),
    JSON.parse(JSON.stringify(result.standings.slice(0, 4).map(item => item.id)))
  );
  const normalized = context.HayahCombatSeason.normalize(career.communityLeague);
  assert.deepEqual(
    JSON.parse(JSON.stringify(normalized.history[0].playoffs)),
    JSON.parse(JSON.stringify(result.playoffs))
  );
  const recordsBeforeRepeat = JSON.stringify(career.communityLeague.records);
  assert.equal(context.HayahCombatSeason.simulate(career), null);
  assert.equal(JSON.stringify(career.communityLeague.records), recordsBeforeRepeat,
    'same-age replay must not award duplicate playoff appearances or titles');
});

test('لا تُقام تصفيات إذا كان عدد المنافسين النشطين أقل من أربعة', () => {
  const context = createContext();
  const career = makeCareer();
  const result = context.HayahCombatSeason.simulate(career);
  assert.equal(result.playoffs, null);
  assert.ok(career.communityLeague.records.every(record => record.playoffAppearances === 0));
  assert.ok(career.communityLeague.records.every(record => record.playoffWins === 0));
  assert.ok(career.communityLeague.records.every(record => record.playoffTitles === 0));
});

test('نتائج التصفيات حتمية لنفس الموسم والمنافسين', () => {
  const firstContext = createContext();
  const secondContext = createContext();
  const firstCareer = makeCareer();
  const secondCareer = makeCareer();
  const extra = { id: 'rival-d', name: 'منافس د', rating: 82, momentum: 1, respect: 60, tension: 20 };
  firstCareer.community.push(Object.assign({}, extra));
  secondCareer.community.push(Object.assign({}, extra));
  const first = firstContext.HayahCombatSeason.simulate(firstCareer);
  const second = secondContext.HayahCombatSeason.simulate(secondCareer);
  assert.deepEqual(JSON.parse(JSON.stringify(first.playoffs)), JSON.parse(JSON.stringify(second.playoffs)));
});

test('الحفظ القديم بلا بيانات تصفيات يظل صالحًا وتُهيّأ إحصاءاتها بصفر', () => {
  const context = createContext();
  const normalized = context.HayahCombatSeason.normalize({
    records: [{ id: 'legacy-rival', name: 'منافس قديم', titles: 2 }],
    history: [{ season: 1, age: 30, matches: 2, leaderId: 'legacy-rival', leaderName: 'منافس قديم', leaderPoints: 6, topThree: [] }]
  });
  assert.equal(normalized.records[0].playoffAppearances, 0);
  assert.equal(normalized.records[0].playoffWins, 0);
  assert.equal(normalized.records[0].playoffTitles, 0);
  assert.equal(normalized.history[0].playoffs, null);
});

test('تطبيع التصفيات يرفض البذور أو المواجهات أو النهائي غير المتسق', () => {
  const context = createContext();
  const career = makeCareer();
  career.community.push({ id: 'rival-d', name: 'منافس د', rating: 82, momentum: 1, respect: 60, tension: 20 });
  const result = context.HayahCombatSeason.simulate(career);
  const valid = JSON.parse(JSON.stringify(result.playoffs));
  const normalizeHistory = playoffs => context.HayahCombatSeason.normalize({
    history: [{
      season: 1,
      age: 25,
      matches: 23,
      leaderId: 'rival-a',
      leaderName: 'منافس أ',
      leaderPoints: 10,
      topThree: [],
      playoffs
    }]
  }).history[0].playoffs;

  assert.ok(normalizeHistory(valid), 'the generated seeded bracket should remain valid');

  const wrongPairings = JSON.parse(JSON.stringify(valid));
  const [first, second, third, fourth] = wrongPairings.qualifiers;
  Object.assign(wrongPairings.matches[0], {
    aId: first.id, aName: first.name, bId: second.id, bName: second.name,
    winnerId: first.id, winnerName: first.name
  });
  Object.assign(wrongPairings.matches[1], {
    aId: third.id, aName: third.name, bId: fourth.id, bName: fourth.name,
    winnerId: third.id, winnerName: third.name
  });
  Object.assign(wrongPairings.matches[2], {
    aId: first.id, aName: first.name, bId: third.id, bName: third.name,
    winnerId: first.id, winnerName: first.name
  });
  wrongPairings.championId = first.id;
  wrongPairings.championName = first.name;
  assert.equal(normalizeHistory(wrongPairings), null,
    'an imported bracket must not silently replace the 1-vs-4 and 2-vs-3 seeded pairings');

  const duplicateSeeds = JSON.parse(JSON.stringify(valid));
  duplicateSeeds.qualifiers[1].seed = duplicateSeeds.qualifiers[0].seed;
  assert.equal(normalizeHistory(duplicateSeeds), null,
    'qualifier seeds must be unique and in their recorded order');

  const invalidFinal = JSON.parse(JSON.stringify(valid));
  const semifinalWinners = new Set(invalidFinal.matches.slice(0, 2).map(match => match.winnerId));
  const nonFinalist = invalidFinal.qualifiers.find(qualifier => !semifinalWinners.has(qualifier.id));
  const finalist = invalidFinal.matches[0].winnerId;
  const finalistName = invalidFinal.qualifiers.find(qualifier => qualifier.id === finalist).name;
  Object.assign(invalidFinal.matches[2], {
    aId: finalist, aName: finalistName,
    bId: nonFinalist.id, bName: nonFinalist.name,
    winnerId: finalist, winnerName: finalistName
  });
  invalidFinal.championId = finalist;
  invalidFinal.championName = finalistName;
  assert.equal(normalizeHistory(invalidFinal), null,
    'the final must contain both semifinal winners, not an eliminated qualifier');
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
  const careerChoice = findChoiceByTitle(root, 'سجل المسيرة التاريخي');
  assert.ok(careerChoice);
  careerChoice.listeners.click();
  const careerDescription = (function find(node) {
    if (!node) return null;
    if (node.className === 'desc') return node;
    for (const child of node.children || []) { const found = find(child); if (found) return found; }
    return null;
  })(root);
  assert.match(careerDescription.textContent, /لا توجد أرقام مسيرة/);
  const back = findChoiceByTitle(root, 'رجوع إلى مجتمع المقاتلين');
  assert.ok(back);
  back.listeners.click();
  assert.equal(context.communityMenuOpened, true,
    'the fallback back action should reopen the real community menu instead of restoring inert markup');
});

test('سجل المسيرة التراكمي يستمر بعد انتهاء أرشيف المواسم ولا يتكرر في العمر نفسه', () => {
  const context = createContext();
  const career = makeCareer();
  for (let age = 20; age < 35; age += 1) { context.state.age = age; assert.ok(context.HayahCombatSeason.simulate(career)); }
  const records = career.communityLeague.records;
  assert.equal(career.communityLeague.season, 15);
  assert.equal(career.communityLeague.history.length, 12);
  assert.equal(records.length, 3);
  assert.ok(records.every(record => record.seasons === 15));
  assert.ok(records.every(record => record.played === 30));
  assert.ok(records.every(record => record.wins + record.draws + record.losses === 30));
  assert.equal(records.reduce((total, record) => total + record.titles, 0), 15);
  const before = JSON.parse(JSON.stringify(records));
  assert.equal(context.HayahCombatSeason.simulate(career), null);
  assert.deepEqual(JSON.parse(JSON.stringify(career.communityLeague.records)), before);
  career.community = career.community.filter(fighter => fighter.id !== 'rival-c');
  context.state.age += 1;
  assert.ok(context.HayahCombatSeason.simulate(career));
  assert.ok(career.communityLeague.records.some(record => record.id === 'rival-c'),
    'a removed or retired rival keeps their historical career record');
});

test('واجهة سجل المسيرة تعرض الأرقام التراكمية وتفصلها عن لقب العالم', () => {
  const context = createContext();
  const career = makeCareer();
  career.community.push({ id: 'rival-d', name: 'منافس د', rating: 82, momentum: 1, respect: 60, tension: 20 });
  context.career = career;
  context.HayahCombatSeason.simulate(career);
  context.HayahCombatSeason.openMenu();
  assert.match(context.lastModal[2], /بطل تصفيات الموسم/);
  const recordBook = context.lastModal[3].find(option => option.title === 'سجل المسيرة التاريخي');
  assert.ok(recordBook);
  recordBook.action();
  assert.equal(context.lastInfo[1], 'سجل المسيرة التاريخي');
  assert.match(context.lastInfo[2], /لقب موسم/);
  assert.match(context.lastInfo[2], /لقب تصفيات/);
  assert.match(context.lastInfo[2], /فوز إقصائي/);
  assert.match(context.lastInfo[2], /ليس سجل لقب العالم/);
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
    records: [null, { id: 'recorded', seasons: -5, played: 9999999, wins: 9999999, titles: 9999999, bestPosition: 999, points: 9999999999 }, { id: '', name: 'بلا معرّف' }],
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
  assert.equal(normalized.records.length, 1);
  assert.equal(normalized.records[0].seasons, 0);
  assert.equal(normalized.records[0].played, 1000000);
  assert.equal(normalized.records[0].bestPosition, 20);
  assert.equal(normalized.records[0].titles, 1000000);
  assert.equal(normalized.history.length, 12);
  assert.equal(normalized.history[0].season, 4);
  assert.equal(normalized.history.at(-1).age, 150);
});

test('تطبيع سجل المسيرة يحتفظ بأفضل 40 سجلًا قبل تطبيق الحد الأقصى', () => {
  const context = createContext();
  const records = Array.from({ length: 45 }, (_, index) => ({
    id: 'rival-' + String(index + 1).padStart(2, '0'),
    name: 'منافس ' + (index + 1),
    seasons: 45 - index,
    played: (45 - index) * 2,
    wins: 45 - index,
    draws: 0,
    losses: 45 - index,
    points: (45 - index) * 6,
    titles: 45 - index,
    bestPosition: 1,
    lastSeason: 45 - index,
    lastAge: 30
  }));
  const normalized = context.HayahCombatSeason.normalize({ records });

  assert.equal(normalized.records.length, 40);
  assert.equal(normalized.records[0].id, 'rival-01');
  assert.equal(normalized.records.at(-1).id, 'rival-40');
  assert.ok(!normalized.records.some(record => record.id === 'rival-41'));
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
  const ageButton = new FakeElement('button');
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
      getElementById(id) { return id === 'modalRoot' ? root : id === 'ageUpBtn' ? ageButton : null; },
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
  // The fallback listener is installed during module initialization; trigger the observed age transition.
  ageButton.listeners.click();
  await Promise.resolve();
  assert.equal(career.communityLeague.season, 1);
  assert.equal(host.saveCalls, 1,
    'the host save bridge must persist a season when the age-button fallback is used');
});


test('تطبيع أسماء التصفيات يربط كل اسم بمعرّف المتأهل المسجل', () => {
  const context = createContext();
  const career = makeCareer();
  career.community.push({ id: 'rival-d', name: 'منافس د', rating: 82, momentum: 1, respect: 60, tension: 20 });
  const generated = context.HayahCombatSeason.simulate(career);
  const imported = JSON.parse(JSON.stringify(generated.playoffs));
  imported.matches[0].aName = 'اسم غير مطابق';
  imported.matches[0].bName = 'اسم آخر غير مطابق';
  imported.matches[0].winnerName = 'فائز غير مطابق';
  imported.championName = 'بطل غير مطابق';

  const normalized = context.HayahCombatSeason.normalize({
    history: [{
      season: 1,
      age: 25,
      matches: 23,
      leaderId: 'rival-a',
      leaderName: 'منافس أ',
      leaderPoints: 10,
      topThree: [],
      playoffs: imported
    }]
  }).history[0].playoffs;

  assert.ok(normalized, 'valid bracket IDs should remain readable');
  const namesById = new Map(normalized.qualifiers.map(qualifier => [qualifier.id, qualifier.name]));
  const semifinal = normalized.matches[0];
  assert.equal(semifinal.aName, namesById.get(semifinal.aId));
  assert.equal(semifinal.bName, namesById.get(semifinal.bId));
  assert.equal(semifinal.winnerName, namesById.get(semifinal.winnerId));
  assert.equal(normalized.championName, namesById.get(normalized.championId));
});


test('الترتيب يحسم تعادل النقاط والانتصارات بالمواجهات المباشرة قبل تقييم المنافس', () => {
  const context = createContext();
  const career = makeCareer();
  career.community = [
    'rival-01',
    'rival-02',
    'rival-03',
    'rival-04',
    'rival-06'
  ].map(id => ({
    id,
    name: id,
    rating: 50,
    momentum: 0,
    respect: 50,
    tension: 0
  }));

  const result = context.HayahCombatSeason.simulate(career);
  const byId = new Map(result.standings.map(row => [row.id, row]));

  assert.equal(result.matches, 5);
  assert.deepEqual(
    JSON.parse(JSON.stringify(result.standings.map(row => row.id))),
    ['rival-03', 'rival-04', 'rival-06', 'rival-01', 'rival-02']
  );
  assert.equal(byId.get('rival-01').points, 3);
  assert.equal(byId.get('rival-04').points, 3);
  assert.equal(byId.get('rival-06').points, 3);
  assert.equal(byId.get('rival-01').wins, 1);
  assert.equal(byId.get('rival-04').wins, 1);
  assert.equal(byId.get('rival-06').wins, 1);
  assert.ok(byId.get('rival-04').position < byId.get('rival-01').position,
    'the direct win should place rival-04 above a tied rival with fewer head-to-head points');
  assert.ok(byId.get('rival-06').position < byId.get('rival-01').position,
    'the direct win should place rival-06 above a tied rival with fewer head-to-head points');

  context.career = career;
  context.HayahCombatSeason.openMenu();
  assert.match(context.lastModal[2], /المواجهات المباشرة/,
    'the season screen should explain its tie-break rule');
});


test('بطل التصفيات يصبح خصمًا اختياريًا في نزال الدوري ولا يبدأ النزال عند فتح السجل', () => {
  const context = createContext();
  const career = makeCareer();
  career.community.push({ id: 'rival-d', name: 'منافس د', rating: 82, momentum: 1, respect: 60, tension: 20 });
  context.career = career;
  const result = context.HayahCombatSeason.simulate(career);
  const champion = career.community.find(fighter => fighter.id === result.playoffs.championId);
  assert.ok(champion);

  let startedBout = null;
  context.HayahCombatSeasonHost = {
    startCommunityBout(mode, fighterId) {
      startedBout = { mode, fighterId };
      return true;
    }
  };

  const pointsBefore = career.leaguePoints;
  const titleBefore = career.champion;
  context.HayahCombatSeason.openMenu();
  const option = context.lastModal[3].find(item => item.title === 'دفاع عن لقب العالم أمام بطل التصفيات');

  assert.ok(option, 'a current world champion should see the playoff winner as a title-defense opponent');
  assert.match(option.description, /نزال دوري مباشر/);
  assert.match(context.lastModal[2], /لا يبدأ النزال تلقائيًا/);
  assert.equal(startedBout, null, 'opening the season report must not start a fight');
  option.action();
  assert.deepEqual(startedBout, { mode: 'league', fighterId: champion.id });
  assert.equal(career.leaguePoints, pointsBefore, 'opening the challenge must not change league points');
  assert.equal(career.champion, titleBefore, 'opening the challenge must not change title ownership');
});

test('غير حامل اللقب يرى مواجهة ترتيبية مع بطل التصفيات بدل وصفها كدفاع عن اللقب', () => {
  const context = createContext();
  const career = makeCareer();
  career.champion = false;
  career.community.push({ id: 'rival-d', name: 'منافس د', rating: 82, momentum: 1, respect: 60, tension: 20 });
  context.career = career;
  context.HayahCombatSeason.simulate(career);
  context.HayahCombatSeason.openMenu();

  const option = context.lastModal[3].find(item => item.title === 'مواجهة بطل التصفيات');
  assert.ok(option);
  assert.match(option.description, /الفوز يضيف نقاطًا للدوري/);
  assert.equal(context.lastModal[3].some(item => item.title === 'دفاع عن لقب العالم أمام بطل التصفيات'), false);
});

test('بطل التصفيات المعتزل أو المتوفى لا يظهر كخصم قابل للتحدي', () => {
  for (const status of ['retired', 'deceased']) {
    const context = createContext();
    const career = makeCareer();
    career.community.push({ id: 'rival-d', name: 'منافس د', rating: 82, momentum: 1, respect: 60, tension: 20 });
    context.career = career;
    const result = context.HayahCombatSeason.simulate(career);
    const champion = career.community.find(fighter => fighter.id === result.playoffs.championId);
    champion[status] = true;

    context.HayahCombatSeason.openMenu();
    assert.equal(context.lastModal[3].some(item => item.title === 'دفاع عن لقب العالم أمام بطل التصفيات'), false);
    assert.match(context.lastModal[2], /لم يعد متاحًا للمواجهة/);
  }
});

test('واجهة الاحتياط تعرض زر مواجهة بطل التصفيات وتحافظ على اختيار اللاعب الصريح', () => {
  const root = new FakeElement('div');
  const context = createContext({
    modal: undefined,
    choice: undefined,
    document: {
      getElementById(id) { return id === 'modalRoot' ? root : null; },
      createElement(tagName) { return new FakeElement(tagName); }
    }
  });
  const career = makeCareer();
  career.community.push({ id: 'rival-d', name: 'منافس د', rating: 82, momentum: 1, respect: 60, tension: 20 });
  context.career = career;
  const result = context.HayahCombatSeason.simulate(career);
  let startedBout = null;
  context.HayahCombatSeasonHost = {
    startCommunityBout(mode, fighterId) { startedBout = { mode, fighterId }; }
  };

  context.HayahCombatSeason.openMenu();
  const option = findChoiceByTitle(root, 'دفاع عن لقب العالم أمام بطل التصفيات');
  assert.ok(option);
  assert.equal(startedBout, null);
  option.listeners.click();
  assert.deepEqual(startedBout, { mode: 'league', fighterId: result.playoffs.championId });
});

test('الحفظ القديم بلا تصفيات لا يعرض مرشحًا وهميًا أو يغيّر لقب اللاعب', () => {
  const context = createContext();
  const career = makeCareer();
  context.career = career;
  const result = context.HayahCombatSeason.simulate(career);
  assert.equal(result.playoffs, null);
  const before = { champion: career.champion, leaguePoints: career.leaguePoints };
  context.HayahCombatSeason.openMenu();
  assert.equal(context.lastModal[3].some(item => item.title === 'دفاع عن لقب العالم أمام بطل التصفيات'), false);
  assert.equal(career.champion, before.champion);
  assert.equal(career.leaguePoints, before.leaguePoints);
});


test('يسجل أكبر تحسن في مؤشر الأداء بعد الدوري والتصفيات ويعرضه في سجل الموسم', () => {
  const context = createContext();
  const career = makeCareer();
  career.community.push({ id: 'rival-d', name: 'منافس د', rating: 82, momentum: 1, respect: 60, tension: 20 });
  const performance = fighter => fighter.rating +
    (Number(fighter.momentum) || 0) * 1.5 +
    ((Number.isFinite(Number(fighter.respect)) ? Number(fighter.respect) : 50) -
      (Number(fighter.tension) || 0)) * 0.04;
  const before = new Map(career.community
    .filter(fighter => fighter.retired !== true && fighter.deceased !== true)
    .map(fighter => [fighter.id, performance(fighter)]));

  const result = context.HayahCombatSeason.simulate(career);
  assert.ok(result.risingStar, 'a season with measurable positive form changes should produce an award');
  assert.equal(result.risingStar.id, 'rival-d');
  assert.equal(result.risingStar.change, 3.08);
  assert.equal(result.risingStar.position, 2);
  const expected = career.community
    .filter(fighter => before.has(fighter.id))
    .map(fighter => ({
      id: fighter.id,
      change: Math.round((performance(fighter) - before.get(fighter.id)) * 100) / 100
    }))
    .filter(entry => entry.change > 0)
    .sort((a, b) => b.change - a.change || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))[0];
  assert.equal(result.risingStar.id, expected.id);

  context.career = career;
  context.HayahCombatSeason.openMenu();
  assert.match(context.lastModal[2], /أكبر تحسن في مؤشر الأداء/);
  assert.match(context.lastModal[2], /منافس د/);
});

test('تطبيع سجل المواسم يتعامل بأمان مع جائزة التحسن الاختيارية في الحفظ القديم', () => {
  const context = createContext();
  const normalized = context.HayahCombatSeason.normalize({
    history: [
      {
        season: 1,
        age: 25,
        matches: 3,
        leaderId: 'rival-a',
        leaderName: 'منافس أ',
        leaderPoints: 6,
        topThree: []
      },
      {
        season: 2,
        age: 26,
        matches: 3,
        leaderId: 'rival-b',
        leaderName: 'منافس ب',
        leaderPoints: 6,
        topThree: [],
        risingStar: { id: '', name: 'سجل تالف', change: 8, position: 1 }
      },
      {
        season: 3,
        age: 27,
        matches: 3,
        leaderId: 'rival-c',
        leaderName: 'منافس ج',
        leaderPoints: 6,
        topThree: [],
        risingStar: { id: 'rival-c', name: 'منافس ج', change: 4.25, position: 2 }
      }
    ]
  });

  assert.equal(normalized.history[0].risingStar, null);
  assert.equal(normalized.history[1].risingStar, null);
  assert.deepEqual(
    JSON.parse(JSON.stringify(normalized.history[2].risingStar)),
    { id: 'rival-c', name: 'منافس ج', change: 4.25, position: 2 }
  );
});


test('سجل جوائز المواسم يعرض أحدث 12 موسمًا محفوظًا بترتيب عكسي دون اختراع جوائز قديمة', () => {
  const context = createContext();
  const career = makeCareer();
  career.communityLeague = {
    season: 14,
    lastSimulatedAge: 38,
    matchesLastSeason: 3,
    standings: [],
    records: [],
    history: Array.from({ length: 14 }, (_, index) => ({
      season: index + 1,
      age: 25 + index,
      matches: 3,
      leaderId: 'rival-a',
      leaderName: 'منافس أ',
      leaderPoints: 6,
      topThree: [],
      risingStar: {
        id: 'rival-' + (index + 1),
        name: 'صاحب التحسن ' + (index + 1),
        change: 1 + index / 10,
        position: 1 + (index % 4)
      }
    }))
  };
  context.career = career;

  context.HayahCombatSeason.openMenu();
  const option = context.lastModal[3].find(item => item.title === 'سجل جوائز المواسم');
  assert.ok(option, 'the main season menu should expose the award archive');
  option.action();

  const summary = context.lastInfo[2];
  assert.match(summary, /الموسم 14/);
  assert.match(summary, /الموسم 3/);
  assert.ok(!summary.includes('الموسم 2 ·'), 'only the latest twelve stored seasons should be shown');
  assert.ok(summary.indexOf('الموسم 14') < summary.indexOf('الموسم 13'),
    'the newest award should appear first');
  assert.match(summary, /صاحب التحسن 14/);
});

test('سجل جوائز المواسم يوضح غياب الجوائز في السجلات القديمة ويعمل في واجهة الاحتياط', () => {
  const root = new FakeElement('div');
  const context = createContext({
    modal: undefined,
    choice: undefined,
    document: {
      getElementById(id) { return id === 'modalRoot' ? root : null; },
      createElement(tagName) { return new FakeElement(tagName); }
    }
  });
  const career = makeCareer();
  career.communityLeague = {
    season: 2,
    lastSimulatedAge: 26,
    matchesLastSeason: 3,
    standings: [],
    records: [],
    history: [
      {
        season: 1,
        age: 25,
        matches: 3,
        leaderId: 'rival-a',
        leaderName: 'منافس أ',
        leaderPoints: 6,
        topThree: []
      },
      {
        season: 2,
        age: 26,
        matches: 3,
        leaderId: 'rival-b',
        leaderName: 'منافس ب',
        leaderPoints: 6,
        topThree: []
      }
    ]
  };
  context.career = career;

  context.HayahCombatSeason.openMenu();
  const option = findChoiceByTitle(root, 'سجل جوائز المواسم');
  assert.ok(option, 'the fallback modal should expose the award archive');
  option.listeners.click();

  const findDescription = node => {
    if (!node) return null;
    if (node.className === 'desc') return node;
    for (const child of node.children || []) {
      const found = findDescription(child);
      if (found) return found;
    }
    return null;
  };
  const description = findDescription(root);
  assert.ok(description);
  assert.match(description.textContent, /أقدم من إضافة الجائزة/);
  assert.match(description.textContent, /لم يحقق أي منافس تحسنًا إيجابيًا/);
  assert.match(description.textContent, /لن تُنشأ نتائج بأثر رجعي/);
});
