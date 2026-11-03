'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

function sourceOf(name, nextName) {
  const start = app.indexOf('function ' + name + '(');
  assert.notEqual(start, -1, 'expected function ' + name);
  const end = app.indexOf('function ' + nextName + '(', start + 1);
  assert.notEqual(end, -1, 'expected following function ' + nextName);
  return app.slice(start, end);
}

function literalChoiceTitles(source) {
  return Array.from(source.matchAll(/choice\(\s*'[^']*'\s*,\s*'([^']+)'/g), match => match[1]);
}

test('مركز الأنشطة يعرض كل وجهة أساسية مرة واحدة', () => {
  const activities = sourceOf('activities', 'healthMenu');
  const titles = literalChoiceTitles(activities);
  const duplicates = titles.filter((title, index) => titles.indexOf(title) !== index);

  assert.deepEqual(duplicates, [], 'activity hub must not repeat the same visible choice');
  assert.match(activities, /section\('الحياة اليومية'\)/);
  assert.match(activities, /section\('أنشطة سريعة'\)/);
  assert.match(activities, /section\('تجارب ومسارات خاصة'\)/);
  assert.doesNotMatch(activities, /سباقات السيارات|العميل السري/,
    'unfinished disabled placeholders should not appear as playable menu entries');
});

test('تنظيم الأنشطة لا يحذف مداخل الأنظمة الأساسية أو الأنشطة السريعة', () => {
  const activities = sourceOf('activities', 'healthMenu');
  for (const entry of [
    'healthMenu', 'hobbiesMenu', 'petsMenu', 'salonMenu', 'travelMenu',
    'cinemaMenu', 'socialMediaMenu', 'crimeMenu', 'vampireModeMenu',
    'outdoorLifestyleMenu', 'gatedCommunityMenu', 'cultMenu'
  ]) {
    assert.match(activities, new RegExp('\\b' + entry + '\\b'), entry + ' remains reachable');
  }
  for (const action of ['library', 'vacation', 'volunteer', 'lottery', 'nightlife', 'donate']) {
    assert.ok(activities.includes("activity('" + action + "')"), action + ' remains reachable');
  }
});

test('مركز الأصول لا يكرر الكازينو ولا يعرض أقسامًا خارج اختصاصه', () => {
  const assets = sourceOf('assets', 'markMenuRow');
  const titles = literalChoiceTitles(assets);
  assert.equal(titles.filter(title => title === 'الكازينو').length, 1);
  assert.doesNotMatch(assets, /توسعة الكازينو|حزمة مخرج الأفلام|السوشيال ميديا|الحيوانات الأليفة/);
  assert.match(assets, /companyPortfolioMenu/);
  assert.match(assets, /shoppingMenu/);
});
