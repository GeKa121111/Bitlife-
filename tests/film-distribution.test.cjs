'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
function extractFunction(name) {
  const start = app.indexOf('function ' + name + '(');
  assert.notEqual(start, -1, 'missing function: ' + name);
  const open = app.indexOf('{', start);
  let depth = 0, quote = '', escaped = false, lineComment = false, blockComment = false;
  for (let index = open; index < app.length; index++) {
    const char = app[index], next = app[index + 1];
    if (lineComment) { if (char === '\n') lineComment = false; continue; }
    if (blockComment) { if (char === '*' && next === '/') { blockComment = false; index++; } continue; }
    if (quote) { if (escaped) { escaped = false; continue; } if (char === '\\') { escaped = true; continue; } if (char === quote) quote = ''; continue; }
    if (char === '/' && next === '/') { lineComment = true; index++; continue; }
    if (char === '/' && next === '*') { blockComment = true; index++; continue; }
    if (char === "'" || char === '"') { quote = char; continue; }
    if (char === '{') depth++;
    if (char === '}' && --depth === 0) return app.slice(start, index + 1);
  }
  throw new Error('unterminated function: ' + name);
}
function extractCatalog() {
  const start = app.indexOf('const filmDistributionPartnerCatalog = [');
  assert.notEqual(start, -1);
  const end = app.indexOf('\n];', start);
  assert.ok(end > start);
  return app.slice(start, end + 3);
}
function makeContext(overrides = {}) {
  const state = {
    age: 40, yearCount: 10, bank: 1000000, specialCareer: { id: 'director' },
    filmStudio: { filmography: [{ id: 'film-1', title: 'حكاية اختبارية', genre: 'دراما اجتماعية', boxOffice: 1000000, net: 500000, criticScore: 80 }], distributionContracts: [] },
    ...overrides
  };
  const calls = { logs: [], infos: [], saved: 0, rendered: 0, closed: 0 };
  const context = {
    state, validState: () => true, ensureFilmStudio: () => state.filmStudio,
    save: () => { calls.saved++; }, render: () => { calls.rendered++; }, closeModal: () => { calls.closed++; },
    log: (...args) => calls.logs.push(args), info: (...args) => calls.infos.push(args),
    choice: (...args) => ({ args }), modal: (...args) => { calls.modal = args; },
    cash: value => String(value), filmStudioMenu: () => {}, filmDistributionMenu: () => {},
    filmDistributionOffersMenu: () => {}, calls
  };
  vm.createContext(context);
  const names = ['filmDistributionMoney','normalizeFilmDistributionContract','readFilmDistributionContracts','calculateFilmDistributionOffer','signFilmDistributionContract','settleFilmDistributionYear'];
  vm.runInContext([extractCatalog(), ...names.map(extractFunction)].join('\n') + '\nglobalThis.api={' + names.join(',') + '};', context);
  return context;
}
test('عروض التوزيع ثابتة ومحدودة وتختلف في المدة والدفعة والعائد', () => {
  const c = makeContext(), film = c.state.filmStudio.filmography[0];
  const digital = c.api.calculateFilmDistributionOffer(film, 'streaming');
  const regional = c.api.calculateFilmDistributionOffer(film, 'regional-tv');
  const theatrical = c.api.calculateFilmDistributionOffer(film, 'theatrical');
  assert.equal(digital.termYears, 3); assert.equal(regional.termYears, 4); assert.equal(theatrical.termYears, 2);
  assert.equal(digital.annualRoyalty, 21500); assert.equal(digital.advancePaid, 30000);
  assert.ok(theatrical.annualRoyalty > digital.annualRoyalty);
  assert.equal(c.api.calculateFilmDistributionOffer(film, 'unknown'), null);
  assert.equal(c.api.calculateFilmDistributionOffer({ ...film, boxOffice: -1 }, 'streaming'), null);
});
test('توقيع العقد يدفع المقدمة مرة واحدة ويرفض التعاقد المكرر', () => {
  const c = makeContext(), initial = c.state.bank;
  assert.equal(c.api.signFilmDistributionContract('film-1', 'streaming'), true);
  assert.equal(c.state.bank, initial + 30000); assert.equal(c.state.filmStudio.distributionContracts.length, 1); assert.equal(c.calls.saved, 1);
  assert.equal(c.api.signFilmDistributionContract('film-1', 'streaming'), false);
  assert.equal(c.state.bank, initial + 30000); assert.equal(c.state.filmStudio.distributionContracts.length, 1); assert.equal(c.calls.saved, 1);
});
test('العائد السنوي يُسوى مرة واحدة في كل سنة وينتهي العقد بعد مدته', () => {
  const c = makeContext();
  assert.equal(c.api.signFilmDistributionContract('film-1', 'streaming'), true);
  const afterAdvance = c.state.bank; c.state.yearCount = 11;
  assert.equal(c.api.settleFilmDistributionYear(), 21500); assert.equal(c.state.bank, afterAdvance + 21500);
  assert.equal(c.api.settleFilmDistributionYear(), 0);
  let contract = c.state.filmStudio.distributionContracts[0];
  assert.equal(contract.yearsRemaining, 2); assert.equal(contract.totalPaid, 51500);
  c.state.yearCount = 12; assert.equal(c.api.settleFilmDistributionYear(), 21500);
  c.state.yearCount = 13; assert.equal(c.api.settleFilmDistributionYear(), 21500);
  contract = c.state.filmStudio.distributionContracts[0];
  assert.equal(contract.status, 'expired'); assert.equal(contract.yearsRemaining, 0); assert.equal(contract.totalPaid, 94500);
  c.state.yearCount = 14; assert.equal(c.api.settleFilmDistributionYear(), 0);
});
test('العقود التالفة أو المكررة لا تحصل على دفعات ولا تُحذف من الحفظ', () => {
  const c = makeContext();
  const valid = { id:'dist-a',filmId:'film-1',filmTitle:'فيلم',genre:'دراما',partnerId:'streaming',partnerTitle:'منصة السرد',startYear:10,lastPaidYear:10,termYears:3,yearsRemaining:3,annualRoyalty:100,advancePaid:0,totalPaid:0,status:'active' };
  const invalid = { ...valid, id:'dist-b', yearsRemaining:2 };
  c.state.filmStudio.distributionContracts = [valid, invalid];
  const before = JSON.stringify(c.state.filmStudio.distributionContracts); c.state.yearCount = 11;
  assert.equal(c.api.settleFilmDistributionYear(), 0); assert.equal(JSON.stringify(c.state.filmStudio.distributionContracts), before);
  assert.equal(c.state.bank, 1000000); assert.equal(c.api.signFilmDistributionContract('film-1', 'streaming'), false);
});
test('الحفظ القديم يكتسب دفتر عقود فارغًا اختياريًا ولا تتغير مفاتيح v1', () => {
  assert.match(app, /return \{version:1,lifeId:/); assert.match(app, /const KEY = 'hekayat_hayah_save_v1';/);
  assert.match(app, /distributionContracts:\[\]/); assert.match(app, /function filmDistributionMenu\(\)/);
  assert.match(app, /حقوق العرض والتوزيع/); assert.match(app, /settleFilmDistributionYear\(\);if\(perkEnabled/);
});
