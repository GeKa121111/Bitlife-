'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('index.html');
const app = read('app.js');
const css = read('style.css');
const readme = read('README.md');
const backupHtml = read('backup-check.html');

function functionSource(name, nextName) {
  const start = app.indexOf('function ' + name + '(');
  assert.notEqual(start, -1, 'expected function ' + name);
  const end = nextName ? app.indexOf('function ' + nextName + '(', start + 1) : app.length;
  assert.notEqual(end, -1, 'expected following function ' + nextName);
  return app.slice(start, end);
}


test('الأحداث الحديثة لا تتكرر حتى تنفد البدائل، والحفظ القديم يبدأ بسجل فارغ', () => {
  const availableSource = functionSource('availableEvents', 'rememberEventTitle');
  const state = { age: 30, recentEventTitles: ['حدث أ', 'حدث ب'] };
  const events = [
    { title: 'حدث أ', range: [0, 100] },
    { title: 'حدث ب', range: [0, 100] },
    { title: 'حدث ج', range: [0, 100] }
  ];
  const context = { state, events };
  vm.runInNewContext(availableSource + '\nglobalThis.result=availableEvents().map(event=>event.title);', context);
  assert.deepEqual(Array.from(context.result), ['حدث ج']);

  state.recentEventTitles = ['حدث أ', 'حدث ب', 'حدث ج'];
  vm.runInNewContext(availableSource + '\nglobalThis.result=availableEvents().map(event=>event.title);', context);
  assert.deepEqual(Array.from(context.result), ['حدث أ', 'حدث ب', 'حدث ج'],
    'when every eligible event is recent, the game must still offer an event');

  const rememberSource = functionSource('rememberEventTitle', 'chooseAdaptiveEvent');
  state.recentEventTitles = ['قديم 1', 'قديم 2', 'قديم 3', 'قديم 4', 'قديم 5', 'قديم 6'];
  vm.runInNewContext(rememberSource + '\nrememberEventTitle("حدث جديد"); rememberEventTitle("حدث جديد");', context);
  assert.deepEqual(Array.from(state.recentEventTitles), ['قديم 2', 'قديم 3', 'قديم 4', 'قديم 5', 'قديم 6', 'حدث جديد']);
  assert.match(functionSource('load', 'flash'), /recentEventTitles:\[\]/,
    'v1 saves without the optional history must receive an empty list');
  assert.match(functionSource('randomEvent', 'afterDecision'), /rememberEventTitle\(e\.title\)/);
});


test('كتالوج الأحداث الأصلي يضم 71 موقفًا صالحًا وموزعًا على مراحل العمر', () => {
  const helperStart = app.indexOf('const E=');
  const eventsStart = app.indexOf('const events=[', helperStart);
  const catalogEnd = app.indexOf('function makePerson', eventsStart);
  assert.notEqual(helperStart, -1);
  assert.notEqual(eventsStart, -1);
  assert.notEqual(catalogEnd, -1);
  const context = {};
  vm.runInNewContext(app.slice(helperStart, catalogEnd)
    + '\nglobalThis.catalog=events;', context);
  const catalog = Array.from(context.catalog);
  assert.ok(catalog.length >= 71, 'the original event catalog should contain at least 71 scenarios');
  const titles = catalog.map(event => event.title);
  assert.equal(new Set(titles).size, titles.length, 'event titles must be unique');
  for (const event of catalog) {
    assert.ok(Array.isArray(event.range) && event.range.length === 2);
    assert.ok(Number.isFinite(event.range[0]) && Number.isFinite(event.range[1]));
    assert.ok(event.range[0] >= 0 && event.range[0] <= event.range[1] && event.range[1] <= 150);
    assert.ok(Array.isArray(event.choices) && event.choices.length >= 2);
    for (const option of event.choices) {
      assert.equal(typeof option.label, 'string');
      assert.equal(typeof option.desc, 'string');
      assert.equal(typeof option.result, 'string');
      assert.ok(option.effects && typeof option.effects === 'object');
    }
  }
  const contextual = catalog.filter(event => event.requires).map(event => event.requires).sort();
  assert.deepEqual(contextual, ['business', 'job', 'job', 'partner', 'schoolChild']);
});


test('تبعات بعض القرارات تُحفظ وتظهر في العمر المحدد مرة واحدة فقط', () => {
  const sanitizeSource = functionSource('sanitizeLifeConsequenceEffects', 'normalizePendingLifeConsequences');
  const normalizeSource = functionSource('normalizePendingLifeConsequences', 'queueLifeConsequence');
  const queueSource = functionSource('queueLifeConsequence', 'randomEvent');
  const resolveSource = functionSource('resolveLifeConsequences', 'advanceAge');
  const state = { lifeId: 77, age: 24, pendingLifeConsequences: [] };
  const applied = [];
  const logs = [];
  const context = {
    state,
    effects(value) { applied.push({ ...value }); },
    log(...args) { logs.push(args); }
  };
  vm.runInNewContext(sanitizeSource + '\n' + normalizeSource + '\n' + queueSource + '\n' + resolveSource
    + '\nglobalThis.first=queueLifeConsequence({delay:1,icon:"🎓",title:"أثر التدريب",text:"ظهرت نتيجة التدريب.",effects:{smart:2,bank:900}});'
    + '\nglobalThis.duplicate=queueLifeConsequence({delay:1,title:"أثر التدريب",text:"تكرار غير مطلوب.",effects:{smart:9}});', context);
  assert.equal(context.first, true);
  assert.equal(context.duplicate, false, 'the same decision cannot schedule the same follow-up twice at one age');
  assert.equal(state.pendingLifeConsequences.length, 1);
  assert.equal(state.pendingLifeConsequences[0].dueAge, 25);

  context.resolveLifeConsequences();
  assert.equal(logs.length, 0, 'a future consequence must not run early');
  assert.equal(applied.length, 0);

  state.age = 25;
  context.resolveLifeConsequences();
  assert.equal(logs.length, 1);
  assert.equal(logs[0][1], 'أثر التدريب');
  assert.deepEqual(JSON.parse(JSON.stringify(applied)), [{ smart: 2, bank: 900 }]);
  assert.equal(state.pendingLifeConsequences.length, 0);

  context.resolveLifeConsequences();
  assert.equal(logs.length, 1, 'a resolved consequence must never be applied twice');
  assert.match(functionSource('load', 'flash'), /pendingLifeConsequences:\[\]/,
    'legacy v1 saves receive an empty optional consequence queue');
  assert.match(functionSource('randomEvent', 'afterDecision'), /if\(!failed&&c\.followUp\)queueLifeConsequence\(c\.followUp\)/,
    'failed or unaffordable choices must not schedule a reward');
  const annual = functionSource('advanceAge', 'ageUp');
  assert.ok(annual.indexOf('resolveLifeConsequences();') < annual.indexOf('state.wealthPeak='),
    'due consequences resolve before the annual checkpoint is saved');
  assert.match(app, /title:'أثر المنحة التدريبية'/);
  assert.match(app, /title:'أثر المهارة الرقمية'/);
});

test('الاختيارات المهنية والعمل المستقل والمشروع العائلي والتعليم الأسري تترك نتائج مؤجلة', () => {
  const helperStart = app.indexOf('const E=');
  const catalogEnd = app.indexOf('function makePerson', helperStart);
  assert.ok(helperStart >= 0 && catalogEnd > helperStart);
  const context = {};
  vm.runInNewContext(app.slice(helperStart, catalogEnd) + '\nglobalThis.catalog=events;', context);
  const byTitle = new Map(Array.from(context.catalog).map(event => [event.title, event]));
  const cases = [
    ['مراجعة عرض الراتب', 0, 1, 'أثر مراجعة الراتب'],
    ['مراجعة عرض الراتب', 1, 1, 'أثر التدريب الوظيفي'],
    ['طلب ترقية', 0, 1, 'أثر التقدم المهني'],
    ['طلب ترقية', 1, 1, 'أثر خطة التطوير'],
    ['عميل من خارج الدائرة', 1, 1, 'أثر عميل مستقل'],
    ['فكرة مشروع عائلي', 0, 2, 'أثر المشروع العائلي'],
    ['قرار تعليمي للأسرة', 0, 2, 'أثر التوجيه التعليمي'],
    ['قرار تعليمي للأسرة', 1, 2, 'أثر الدعم التعليمي'],
    ['قرار تعليمي للأسرة', 2, 2, 'نتيجة التجربة التعليمية']
  ];
  const followUps = cases.map(([eventTitle, choiceIndex, delay, title]) => {
    const event = byTitle.get(eventTitle);
    assert.ok(event, 'missing event: ' + eventTitle);
    const option = event.choices[choiceIndex];
    assert.ok(option && option.followUp, 'missing delayed outcome: ' + title);
    assert.equal(option.followUp.delay, delay);
    assert.equal(option.followUp.title, title);
    assert.ok(option.followUp.text.length > 0);
    const allowed = new Set(['happiness', 'health', 'smart', 'looks', 'bank', 'fame', 'reputation', 'debt']);
    assert.ok(Object.keys(option.followUp.effects).length > 0);
    assert.ok(Object.keys(option.followUp.effects).every(key => allowed.has(key)));
    assert.ok(Object.values(option.followUp.effects).every(Number.isFinite));
    return option.followUp;
  });
  assert.equal(byTitle.get('مراجعة عرض الراتب').requires, 'job');
  assert.equal(byTitle.get('طلب ترقية').requires, 'job');
  assert.equal(byTitle.get('قرار تعليمي للأسرة').requires, 'schoolChild');
  const educationKinds=['guided','supported','explored'];
  byTitle.get('قرار تعليمي للأسرة').choices.forEach((option,index)=>{
    assert.equal(option.followUp.childEducation.kind,educationKinds[index]);
    assert.ok(Object.keys(option.followUp.childEducation.metrics).length>0);
  });
  assert.equal(byTitle.get('قرار تعليمي للأسرة').choices[1].cost, 1800,
    'the funded education option must keep its affordability gate');
  assert.ok(byTitle.get('طلب ترقية').choices[0].risk > 0,
    'a failed promotion attempt must not schedule its success follow-up');
  assert.ok(byTitle.get('فكرة مشروع عائلي').choices[0].risk > 0,
    'a failed family investment must not schedule its success follow-up');

  const sanitizeSource = functionSource('sanitizeLifeConsequenceEffects', 'normalizePendingLifeConsequences');
  const normalizeSource = functionSource('normalizePendingLifeConsequences', 'selectChildForEducationOutcome');
  const queueSource = functionSource('queueLifeConsequence', 'randomEvent');
  const state = { lifeId: 125, age: 30, pendingLifeConsequences: [], children: [{id:'education-target',age:10,smart:55,health:80,happiness:70,schoolPerformance:42,careerPotential:48,schoolSupport:3,independence:0,interest:'العلوم والتقنية',educationHistory:[]}] };
  const queueContext = {
    state,
    clamp(value,min=0,max=100){const n=Number(value);return Number.isFinite(n)?Math.max(min,Math.min(max,Math.round(n))):min;},
    ensureChildGrowthProfile(child){if(!Array.isArray(child.educationHistory))child.educationHistory=[];return child;}
  };
  vm.runInNewContext(sanitizeSource + '\n' + functionSource('sanitizeChildEducationOutcome', 'normalizePendingLifeConsequences') + '\n' + normalizeSource + '\n' + functionSource('selectChildForEducationOutcome', 'queueLifeConsequence') + '\n' + queueSource
    + '\nglobalThis.scheduled=' + JSON.stringify(followUps) + '.map(item=>queueLifeConsequence(item));'
    + '\nglobalThis.duplicate=queueLifeConsequence(' + JSON.stringify(followUps[0]) + ');', queueContext);
  assert.deepEqual(Array.from(queueContext.scheduled), [true, true, true, true, true, true, true, true, true]);
  assert.equal(state.pendingLifeConsequences.length, 9);
  assert.equal(queueContext.duplicate, false);
  assert.deepEqual(Array.from(state.pendingLifeConsequences, item => item.dueAge), [31, 31, 31, 31, 31, 32, 32, 32, 32]);
});


test('النتيجة التعليمية المؤجلة تُطبق على الابن المستهدف وتُحفظ في سجله مرة واحدة', () => {
  const sources = [
    functionSource('sanitizeLifeConsequenceEffects', 'sanitizeChildEducationOutcome'),
    functionSource('sanitizeChildEducationOutcome', 'normalizePendingLifeConsequences'),
    functionSource('normalizePendingLifeConsequences', 'selectChildForEducationOutcome'),
    functionSource('selectChildForEducationOutcome', 'queueLifeConsequence'),
    functionSource('queueLifeConsequence', 'randomEvent'),
    functionSource('childDevelopmentStage', 'ensureChildGrowthProfile'),
    functionSource('ensureChildGrowthProfile', 'recordChildEducationHistory'),
    functionSource('recordChildEducationHistory', 'applyChildEducationOutcome'),
    functionSource('applyChildEducationOutcome', 'childEducationHistoryMarkup'),
    functionSource('childEducationHistoryMarkup', 'childCareerFromInterest'),
    functionSource('resolveLifeConsequences', 'advanceAge')
  ].join('\n');
  const state = {lifeId:501,age:30,pendingLifeConsequences:[],children:[
    {id:'adult-child',age:21,smart:55,health:80,happiness:70,schoolPerformance:20,careerPotential:55,schoolSupport:0,independence:40,interest:'الأعمال'},
    {id:'high-score-child',age:12,smart:65,health:85,happiness:80,schoolPerformance:78,careerPotential:60,schoolSupport:2,independence:0,interest:'الرياضة'},
    {id:'target-child',age:10,smart:55,health:82,happiness:75,schoolPerformance:44,careerPotential:50,schoolSupport:3,independence:0,interest:'العلوم والتقنية'}
  ]};
  const applied=[],logs=[];
  const context={state,clamp(value,min=0,max=100){const n=Number(value);return Number.isFinite(n)?Math.max(min,Math.min(max,Math.round(n))):min;},pick(values){return values[0];},effects(value){applied.push({...value});},log(...args){logs.push(args);},esc(value){return String(value);},fmt(value){return String(value);}};
  vm.runInNewContext(sources+
    '\nglobalThis.queued=queueLifeConsequence({delay:2,title:"أثر التوجيه التعليمي",text:"تم تسجيل تقدم دراسي للابن.",effects:{happiness:2},childEducation:{kind:"guided",metrics:{schoolSupport:6,schoolPerformance:3,careerPotential:2,smart:1}}});'+
    '\nglobalThis.targetId=state.pendingLifeConsequences[0].targetChildId;',context);
  assert.equal(context.queued,true);
  assert.equal(context.targetId,'target-child','the lowest-performing school-age child should be selected, not an adult or a higher-performing sibling');
  state.age=31;state.children[2].age=11;context.resolveLifeConsequences();
  assert.equal(state.children[2].schoolPerformance,44,'the educational outcome must not appear early');
  assert.equal(state.pendingLifeConsequences.length,1);
  state.age=32;state.children[2].age=12;context.resolveLifeConsequences();
  assert.equal(state.children[2].schoolPerformance,47);
  assert.equal(state.children[2].schoolSupport,9);
  assert.equal(state.children[2].careerPotential,52);
  assert.equal(state.children[2].smart,56);
  assert.equal(state.children[2].educationHistory.length,1);
  assert.equal(state.children[2].educationHistory[0].id,state.lifeId+':30:أثر التوجيه التعليمي');
  assert.equal(state.pendingLifeConsequences.length,0);
  assert.deepEqual(JSON.parse(JSON.stringify(applied)),[{happiness:2}]);
  context.resolveLifeConsequences();
  assert.equal(state.children[2].schoolPerformance,47,'a resolved child outcome must not be applied twice');
  assert.equal(state.children[2].educationHistory.length,1);
  vm.runInNewContext('globalThis.historyMarkup=childEducationHistoryMarkup(state.children[2]);',context);
  assert.match(context.historyMarkup,/سجل التعليم والتوجيه/);
  assert.match(context.historyMarkup,/أثر التوجيه التعليمي/);
  const legacy={id:'legacy-child',age:9,smart:40,health:75,happiness:70,schoolPerformance:55,careerPotential:45,schoolSupport:0,interest:'الفنون والإبداع'};
  context.ensureChildGrowthProfile(legacy);
  assert.deepEqual(Array.from(legacy.educationHistory),[],'legacy children should receive an empty optional education history');
  assert.match(functionSource('childMenu','childAction'),/childEducationHistoryMarkup\(c\)/);
  assert.ok(app.includes('recordChildEducationHistory(c,{'),'direct education support actions should also leave a child history entry');
});
test('تحميل طابور التبعات ينظف السجلات التالفة ويحتفظ بالنتائج المستحقة ويحد الحجم', () => {
  const sanitizeSource = functionSource('sanitizeLifeConsequenceEffects', 'normalizePendingLifeConsequences');
  const normalizeSource = functionSource('normalizePendingLifeConsequences', 'queueLifeConsequence');
  const context = {};
  const entries = [
    { id: 'valid-1', scheduledAtAge: 20, dueAge: 22, icon: '🎓', title: '  نتيجة التدريب  ', text: '  ظهرت النتيجة.  ', effects: { smart: 3, bank: 2000000, debt: -4, unknown: 99 }, tone: 'good' },
    { id: 'valid-1', scheduledAtAge: 20, dueAge: 23, title: 'تكرار', text: 'يجب تجاهله', effects: { smart: 9 } },
    { id: 'bad-order', scheduledAtAge: 22, dueAge: 21, title: 'ترتيب غير صالح', text: 'تجاهل', effects: { smart: 1 } },
    { id: 'long-delay', scheduledAtAge: 20, dueAge: 31, title: 'تأخير طويل', text: 'تجاهل', effects: { smart: 1 } },
    { id: 'empty-effects', scheduledAtAge: 20, dueAge: 21, title: 'بلا تأثير', text: 'تجاهل', effects: {} },
    { id: 'future-schedule', scheduledAtAge: 26, dueAge: 27, title: 'موعد مستقبلي غير صالح', text: 'تجاهل', effects: { smart: 1 } },
    null
  ];
  vm.runInNewContext(sanitizeSource + '\n' + normalizeSource
    + '\nglobalThis.normalized=normalizePendingLifeConsequences(' + JSON.stringify(entries) + ',25);', context);
  const normalized = Array.from(context.normalized);
  assert.equal(normalized.length, 1);
  assert.equal(normalized[0].id, 'valid-1');
  assert.equal(normalized[0].scheduledAtAge, 20);
  assert.equal(normalized[0].dueAge, 22, 'already-due items remain queued for the next safe annual resolution');
  assert.equal(normalized[0].title, 'نتيجة التدريب');
  assert.equal(normalized[0].text, 'ظهرت النتيجة.');
  assert.deepEqual(JSON.parse(JSON.stringify(normalized[0].effects)), { smart: 3, bank: 1000000, debt: -4 });
  assert.equal(normalized[0].tone, 'good');

  const many = Array.from({ length: 25 }, (_, index) => ({
    id: 'cap-' + index, scheduledAtAge: 24, dueAge: 25,
    title: 'نتيجة ' + index, text: 'وصف ' + index, effects: { smart: 1 }
  }));
  vm.runInNewContext(sanitizeSource + '\n' + normalizeSource
    + '\nglobalThis.capped=normalizePendingLifeConsequences(' + JSON.stringify(many) + ',24);', context);
  const capped = Array.from(context.capped);
  assert.equal(capped.length, 20);
  assert.equal(capped[0].id, 'cap-5');
  assert.equal(capped[19].id, 'cap-24');

  assert.match(functionSource('load', 'flash'), /normalizePendingLifeConsequences\(x\.pendingLifeConsequences,x\.age\)/,
    'the load path must sanitize optional queues in both legacy and current saves');
  assert.match(functionSource('queueLifeConsequence', 'randomEvent'), /normalizePendingLifeConsequences/,
    'new scheduling must keep the queue normalized');
  assert.match(functionSource('resolveLifeConsequences', 'advanceAge'), /normalizePendingLifeConsequences/,
    'annual resolution must revalidate queued entries before applying effects');
});

test('اختصار لوحة المفاتيح يتجاوز الرأس وينقل التركيز إلى يوميات الحياة', () => {
  assert.ok(html.includes('<a class="skip-link" href="#lifeFeed">انتقل إلى يوميات الحياة</a>'));
  assert.match(html, /<main class="feed" id="lifeFeed"[^>]*tabindex="-1"/);
  assert.ok(css.includes('.skip-link:focus{top:8px}'));
  assert.ok(css.includes('@media(prefers-reduced-motion:reduce){.skip-link{transition:none!important}}'));
});

test('لون شريط المتصفح يطابق هوية حياة في الصفحة والـ PWA والإعدادات', () => {
  const manifest = read('manifest.webmanifest');
  const settingsSource = functionSource('applyUiSettings', 'normalizeUiSettings');
  assert.match(html, /name="theme-color" content="#0f766e"/);
  assert.match(manifest, /"theme_color": "#0f766e"/);
  assert.match(settingsSource, /#0f766e/);
});

test('واجهة حياة عربية RTL وتحافظ على اسمها المستقل', () => {
  assert.match(html, /<html lang="ar" dir="rtl">/);
  assert.match(html, /class="brandlogo" aria-label="حياة"/);
  assert.match(html, /class="brand-symbol"/);
  assert.match(html, /id="identityFlag"/);
  assert.match(html, /id="characterInfoBtn"/);
  assert.match(html, /id="stageNavLabel"/);
  assert.doesNotMatch(html, /BITLIFE|BitLife|Candywriter/);
});

test('سجل الحياة لا يعيد قراءة التاريخ كاملًا ويعلن الأحداث الجديدة فقط لقارئ الشاشة', () => {
  assert.ok(html.includes('<main class="feed" id="lifeFeed" aria-label="سجل الحياة والأحداث" tabindex="-1"></main>'));
  assert.doesNotMatch(html, /id="lifeFeed"[^>]*aria-live=/);
  assert.match(html, /id="lifeAnnouncement" class="sr-only" role="status" aria-live="polite" aria-atomic="true"/);

  const source = functionSource('announceLifeEvents', 'renderFeed');
  const live = { textContent: '' };
  const context = {
    $(id) { return id === 'lifeAnnouncement' ? live : null; },
    fmt(value) { return String(value); }
  };
  vm.runInNewContext(source + '\nglobalThis.announceLifeEvents(['
    + '{age:31,title:"تقدم مهني"},{age:31,title:"مصاريف المعيشة"},{age:31,title:"تقرير سنوي"}'
    + '],0);', context);
  assert.equal(live.textContent,
    'تم تسجيل 3 أحداث جديدة في عمر 31 سنة. أحدثها: مصاريف المعيشة، تقرير سنوي.');

  const previousMessage = live.textContent;
  vm.runInNewContext(source + '\nglobalThis.announceLifeEvents([{age:31,title:"قديم"}],1);', context);
  assert.equal(live.textContent, previousMessage,
    'a history refresh with no appended entries must not announce anything');
});

test('سجل الميراث يعيد حساب فرق التسوية من حسابات المستفيدين ولا يثق بملخص قديم', () => {
  const historyMenu = functionSource('inheritanceHistoryRecordMenu', 'recordBusinessFinancialReport');
  const historyRecord = functionSource('createInheritanceHistoryRecord', 'getInheritanceHistoryRecords');
  assert.match(historyRecord, /calculatedReconciliationDelta=transferredSettled-transferredAllocated/);
  assert.match(historyRecord, /reconciliationMetadataMismatch/);
  assert.match(historyRecord, /reportedReconciliationDelta/);
  assert.match(historyMenu, /record\.reconciliationMetadataMismatch/);
  assert.match(historyMenu, /بيانات التسوية المسجلة لا تطابق تفاصيل المستفيدين/);
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
  assert.match(app, /const CEMETERY_BACKUP_KEY = 'hekayat_hayah_cemetery_backup_v1';/);
  assert.match(app, /return \{version:1,lifeId:/);
  assert.match(app, /function isValidSaveData\(data\)[\s\S]*?data\.version!==1/);
  assert.match(app, /function load\(\)[\s\S]*?isValidSaveData\(x\)[\s\S]*?BACKUP_KEY/);
});

test('التحقق يرفض حفظ v1 الذي يفتقد هوية الشخصية أو عمرًا صالحًا', () => {
  assert.match(app, /typeof data\.name==='string'&&data\.name\.trim\(\)\.length>0/);
  assert.match(app, /Number\.isFinite\(Number\(age\)\)&&Number\(age\)>=0&&Number\(age\)<=150/);
  assert.match(app, /if\(!isValidSaveData\(data\)\|\|!Array\.isArray\(data\.family\)/);
});

test('الحفظ يحتفظ بنقطة استعادة محلية من آخر نسخة سليمة دون تغيير صيغة v1', () => {
  assert.match(app, /const BACKUP_KEY = 'hekayat_hayah_save_backup_v1';/);
  assert.match(app, /function isValidSaveData\(data\)/);
  assert.match(app, /localStorage\.setItem\(BACKUP_KEY,checkpointRaw\)/);
  assert.match(app, /previous\.lifeId!==state\.lifeId\|\|Number\(previous\.age\)!==Number\(state\.age\)/);
  assert.match(app, /saveRecovered=true/);
  assert.match(app, /localStorage\.setItem\(KEY,backupRaw\)/);
  assert.match(app, /const KEY = 'hekayat_hayah_save_v1';/);
  assert.match(app, /return \{version:1,lifeId:/);
});


test('طلب حماية التخزين اختياري ولا يغيّر الحفظ عند الرفض أو عدم الدعم', async () => {
  const source = functionSource('requestStorageProtection', 'requestStorageProtectionFromSettings');
  async function run(storage) {
    const context = {};
    if (storage) context.navigator = { storage };
    vm.runInNewContext(source + '\nglobalThis.result=requestStorageProtection();', context);
    return context.result;
  }

  assert.equal(await run(null), 'unsupported');

  let persistCalls = 0;
  assert.equal(await run({
    persisted: () => Promise.resolve(true),
    persist: () => { persistCalls += 1; return Promise.resolve(true); }
  }), 'already');
  assert.equal(persistCalls, 0, 'an already-persistent origin should not request again');

  assert.equal(await run({
    persisted: () => Promise.resolve(false),
    persist: () => Promise.resolve(true)
  }), 'granted');
  assert.equal(await run({
    persisted: () => Promise.resolve(false),
    persist: () => Promise.resolve(false)
  }), 'denied');
  assert.equal(await run({
    persisted: () => Promise.reject(new Error('storage-disabled')),
    persist: () => Promise.resolve(true)
  }), 'error');

  const settingsSource = functionSource('settingsMenu', 'cultMenu');
  assert.ok(settingsSource.includes('حماية بيانات الحفظ'));
  assert.ok(settingsSource.includes('requestStorageProtectionFromSettings'));
});


test('أرشفة الحياة لا تعلن النجاح عند فشل التخزين وتعيد المحاولة حتى مع علم حفظ قديم خاطئ', () => {
  const cemeterySource = functionSource('normalizeCemetery', 'archiveLife')
    + functionSource('validateCemeteryBackup', 'createBackupBundle')
    + functionSource('archiveLife', 'cemeteryMenu');
  const store = new Map();
  let failNextWrite = true;
  const context = {
    state: {
      lifeId: 'archive-retry-life', name: 'شخصية اختبار الأرشفة', age: 47,
      cause: null, status: 'حي', bank: 1200, assets: [{ value: 800 }],
      investments: [{ value: 200 }], debt: 100, place: { country: 'مصر' },
      accomplishments: ['أسس مشروعًا'], children: [{ name: 'وارث' }], cemeterySaved: false
    },
    CEMETERY_KEY: 'hekayat_hayah_cemetery_v1',
    CEMETERY_BACKUP_KEY: 'hekayat_hayah_cemetery_backup_v1',
    localStorage: {
      getItem(key) { return store.has(key) ? store.get(key) : null; },
      setItem(key, value) {
        if (key === 'hekayat_hayah_cemetery_v1' && failNextWrite) {
          failNextWrite = false;
          throw new Error('quota-exceeded');
        }
        store.set(key, String(value));
      }
    },
    lifeRibbon: () => 'حياة متوازنة'
  };
  vm.runInNewContext(
    cemeterySource
      + '\nglobalThis.firstResult=archiveLife("بدأ حياة جديدة");'
      + 'globalThis.flagAfterFailure=state.cemeterySaved;'
      + 'globalThis.retryResult=archiveLife("بدأ حياة جديدة");'
      + 'globalThis.flagAfterRetry=state.cemeterySaved;',
    context
  );
  assert.equal(context.firstResult, false);
  assert.equal(context.flagAfterFailure, false);
  assert.equal(context.retryResult, true);
  assert.equal(context.flagAfterRetry, true);
  let saved = JSON.parse(store.get('hekayat_hayah_cemetery_v1'));
  assert.equal(saved.length, 1);
  assert.equal(saved[0].id, 'archive-retry-life');
  assert.equal(saved[0].netWorth, 2100);

  context.state = {
    lifeId: 'legacy-missed-archive', name: 'حياة لم تُسجل قديمًا', age: 61,
    status: 'متوفى', cause: 'نهاية الرحلة', bank: 500, assets: [],
    investments: [], debt: 0, place: { country: 'مصر' }, accomplishments: [],
    children: [], cemeterySaved: true
  };
  vm.runInNewContext('globalThis.legacyRetry=archiveLife();', context);
  assert.equal(context.legacyRetry, true);
  saved = JSON.parse(store.get('hekayat_hayah_cemetery_v1'));
  assert.ok(saved.some(item => item.id === 'legacy-missed-archive'));

  store.delete('hekayat_hayah_cemetery_backup_v1');
  store.set('hekayat_hayah_cemetery_v1', '{broken-json');
  context.state = {
    lifeId: 'do-not-overwrite-corrupt-cemetery', name: 'حياة ثالثة', age: 32,
    status: 'حي', bank: 100, assets: [], investments: [], debt: 0,
    place: { country: 'مصر' }, accomplishments: [], children: [], cemeterySaved: false
  };
  vm.runInNewContext('globalThis.corruptResult=archiveLife();', context);
  assert.equal(context.corruptResult, false);
  assert.equal(store.get('hekayat_hayah_cemetery_v1'), '{broken-json');
});

test('تحميل الحفظ القديم واستيراده يطبّعان البيانات الناقصة بدل كسر اللعبة', () => {
  assert.match(app, /function normalizeCoreState\(data\)/);
  assert.match(app, /const statDefaults=\{happiness:65,health:80,smart:40,looks:45\}/);
  assert.match(app, /data\.place=\{\.\.\.fallbackPlace,\.\.\.rawPlace\}/);
  assert.match(app, /function load\(\)[\s\S]*?normalizeCoreState\(x\)/);
  assert.match(app, /function importSave\(\)[\s\S]*?normalizeCoreState\(data\)/);
  assert.match(app, /data\.version!==1/);
});

test('النسخة الاحتياطية الكاملة تجمع الحياة والمقبرة والإعدادات والمزايا مع دعم ملفات v1 القديمة', () => {
  assert.match(app, /const BACKUP_FORMAT = 'hayah-backup';/);
  assert.match(app, /const BACKUP_VERSION = 1;/);
  assert.match(app, /const data=isBundle\?parsed\.life:parsed/);
  assert.match(app, /const previousLifeRaw=previousStorage\[KEY\]/);
  assert.match(app, /if\(isValidSaveData\(previousLife\)\)localStorage\.setItem\(BACKUP_KEY,previousLifeRaw\)/);
  assert.match(app, /previousLifeRaw=previousStorage\[KEY\][\s\S]*?state=data/);
  assert.match(app, /if\(!save\(\)\)throw new Error\('storage-write-failed'\)/);
  assert.match(app, /storageKeys\.forEach\(key=>\{try\{const value=previousStorage\[key\]/);
  assert.match(app, /function createBackupBundle\(\)/);
  assert.match(app, /life:JSON\.parse\(JSON\.stringify\(state\)\)/);
  assert.match(app, /cemetery,/);
  assert.match(app, /settings:normalizeUiSettings\(uiSettings\)/);
  assert.match(app, /perks:normalizePermanentPerks\(permanentPerks\)/);
  assert.match(app, /const KEY = 'hekayat_hayah_save_v1';/);
  assert.match(app, /return \{version:1,lifeId:/);

  const settingsSource = functionSource('normalizeUiSettings', 'loadUiSettings');
  const settingsContext = { raw: { theme: 'gold', textScale: 'large', sound: true, haptics: false, boosts: false, extra: true } };
  vm.runInNewContext(settingsSource + '\nglobalThis.normalized=normalizeUiSettings(raw);', settingsContext);
  assert.deepEqual(JSON.parse(JSON.stringify(settingsContext.normalized)),
    { theme: 'gold', textScale: 'large', sound: true, haptics: false, boosts: false, combatTimingAssist: false, reducedMotion: false },
    'settings import should retain supported choices and discard unknown fields');

  const perksSource = functionSource('defaultPermanentPerks', 'loadPermanentPerks');
  const perksContext = {
    PERK_IDS: ['fighterPack', 'goldTheme'],
    PERK_TOGGLE_IDS: ['goldTheme'],
    clamp: (value, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(Number(value) || 0))),
    raw: { owned: { fighterPack: true, unknownPack: true }, enabled: { goldTheme: true, fighterPack: true }, streakSavers: 140 }
  };
  vm.runInNewContext(perksSource + '\nglobalThis.normalized=normalizePermanentPerks(raw);', perksContext);
  assert.deepEqual(JSON.parse(JSON.stringify(perksContext.normalized)),
    { owned: { fighterPack: true, goldTheme: false }, enabled: { goldTheme: true }, streakSavers: 99 },
    'perk import should retain known ownership, clamp counters, and discard unknown ids');

  const cemeterySource = functionSource('normalizeCemetery', 'archiveLife');
  const cemeteryContext = { raw: [
    { id: 'life-a', name: 'حياة أولى', age: 45, netWorth: 1200, accomplishments: ['إنجاز'], children: 2 },
    { id: 'life-a', name: 'حياة ثانية', age: 52, netWorth: -300, accomplishments: 'invalid', children: -4 },
    null,
    { id: 'empty', name: '   ' }
  ] };
  vm.runInNewContext(cemeterySource + '\nglobalThis.normalized=normalizeCemetery(raw);', cemeteryContext);
  assert.equal(cemeteryContext.normalized.length, 2);
  assert.equal(cemeteryContext.normalized[1].id, 'life-a-1');
  assert.equal(cemeteryContext.normalized[1].netWorth, -300);
  assert.deepEqual(Array.from(cemeteryContext.normalized[1].accomplishments), []);

  const integrityHelpers = functionSource('validateCemeteryBackup', 'createBackupBundle');
  const bundleSource = [
    cemeterySource,
    integrityHelpers,
    settingsSource,
    perksSource,
    functionSource('createBackupBundle', 'exportSave')
  ].join('\n');
  const bundleContext = {
    BACKUP_FORMAT: 'hayah-backup',
    BACKUP_VERSION: 1,
    CEMETERY_KEY: 'hekayat_hayah_cemetery_v1',
    CEMETERY_BACKUP_KEY: 'hekayat_hayah_cemetery_backup_v1',
    PERK_IDS: ['fighterPack', 'goldTheme'],
    PERK_TOGGLE_IDS: ['goldTheme'],
    clamp: (value, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(Number(value) || 0))),
    state: { version: 1, name: 'اختبار', age: 30, log: [] },
    uiSettings: { theme: 'dark', textScale: 'large', sound: false, haptics: true, boosts: true },
    permanentPerks: { owned: { fighterPack: true }, enabled: {}, streakSavers: 2 },
    localStorage: { getItem: () => JSON.stringify([{ id: 'life-a', name: 'حياة سابقة', age: 50 }]) }
  };
  vm.runInNewContext(bundleSource + '\nglobalThis.bundle=createBackupBundle();', bundleContext);
  assert.equal(bundleContext.bundle.format, 'hayah-backup');
  assert.equal(bundleContext.bundle.backupVersion, 1);
  assert.equal(bundleContext.bundle.life.name, 'اختبار');
  assert.equal(bundleContext.bundle.cemetery.length, 1);
  assert.equal(bundleContext.bundle.settings.textScale, 'large');
  assert.equal(bundleContext.bundle.perks.owned.fighterPack, true);

  const cemeteryStore = new Map();
  const integrityContext = {
    CEMETERY_KEY: 'hekayat_hayah_cemetery_v1',
    CEMETERY_BACKUP_KEY: 'hekayat_hayah_cemetery_backup_v1',
    localStorage: {
      getItem(key) { return cemeteryStore.has(key) ? cemeteryStore.get(key) : null; },
      setItem(key, value) { cemeteryStore.set(key, String(value)); }
    }
  };
  vm.runInNewContext(cemeterySource + integrityHelpers + String.fromCharCode(10) + 'globalThis.readCemeteryForBackup=readCemeteryForBackup;', integrityContext);
  assert.deepEqual(JSON.parse(JSON.stringify(integrityContext.readCemeteryForBackup())), [],
    'a missing cemetery key should remain a valid empty archive');
  const validArchive = JSON.stringify([{ id: 'saved-life', name: 'حياة محفوظة', age: 61 }]);
  cemeteryStore.set('hekayat_hayah_cemetery_v1', validArchive);
  assert.equal(integrityContext.readCemeteryForBackup()[0].id, 'saved-life');
  assert.ok(cemeteryStore.has('hekayat_hayah_cemetery_backup_v1'),
    'a valid primary archive should seed a local recovery copy');
  assert.equal(integrityContext.validateCemeteryBackup([{ name: 'حياة صالحة' }]), true);
  assert.equal(integrityContext.validateCemeteryBackup([null]), false);
  assert.equal(integrityContext.validateCemeteryBackup([{ name: '   ' }]), false);
  assert.equal(integrityContext.validateCemeteryBackup({}), false);

  const corruptArchive = '{broken-json';
  cemeteryStore.set('hekayat_hayah_cemetery_v1', corruptArchive);
  const recoveredArchive = integrityContext.readCemeteryForBackup();
  assert.equal(recoveredArchive[0].id, 'saved-life',
    'a damaged primary archive should recover from the last verified local copy');
  assert.equal(JSON.parse(cemeteryStore.get('hekayat_hayah_cemetery_v1'))[0].id, 'saved-life');
  assert.equal(JSON.parse(cemeteryStore.get('hekayat_hayah_cemetery_backup_v1'))[0].id, 'saved-life');

  cemeteryStore.delete('hekayat_hayah_cemetery_v1');
  assert.equal(integrityContext.readCemeteryForBackup()[0].id, 'saved-life',
    'a missing primary archive should also recover when a valid local copy exists');
  assert.equal(JSON.parse(cemeteryStore.get('hekayat_hayah_cemetery_v1'))[0].id, 'saved-life');

  const corruptBackup = '{broken-backup';
  cemeteryStore.set('hekayat_hayah_cemetery_v1', corruptArchive);
  cemeteryStore.set('hekayat_hayah_cemetery_backup_v1', corruptBackup);
  assert.throws(() => integrityContext.readCemeteryForBackup(), /cemetery-unreadable/);
  assert.equal(cemeteryStore.get('hekayat_hayah_cemetery_v1'), corruptArchive);
  assert.equal(cemeteryStore.get('hekayat_hayah_cemetery_backup_v1'), corruptBackup);

  // A valid recovery copy must remain intact if the browser refuses to restore the primary key.
  const validBackupRaw = JSON.stringify([{ id: 'saved-life', name: 'حياة محفوظة', age: 61 }]);
  const unreadablePrimaryRaw = '{primary-write-blocked';
  cemeteryStore.set('hekayat_hayah_cemetery_v1', unreadablePrimaryRaw);
  cemeteryStore.set('hekayat_hayah_cemetery_backup_v1', validBackupRaw);
  const originalSetItem = integrityContext.localStorage.setItem;
  integrityContext.localStorage.setItem = (key, value) => {
    if (key === 'hekayat_hayah_cemetery_v1') throw new Error('quota-exceeded');
    originalSetItem(key, value);
  };
  assert.throws(() => integrityContext.readCemeteryForBackup(), /cemetery-recovery-write-failed/);
  assert.equal(cemeteryStore.get('hekayat_hayah_cemetery_v1'), unreadablePrimaryRaw);
  assert.equal(cemeteryStore.get('hekayat_hayah_cemetery_backup_v1'), validBackupRaw);
  integrityContext.localStorage.setItem = originalSetItem;

  const wrongShapeArchive = JSON.stringify({ records: [] });
  cemeteryStore.set('hekayat_hayah_cemetery_v1', wrongShapeArchive);
  const recoveredShapeArchive = integrityContext.readCemeteryForBackup();
  assert.equal(recoveredShapeArchive[0].id, 'saved-life',
    'a structurally invalid primary archive should recover from a valid local copy');
  assert.equal(JSON.parse(cemeteryStore.get('hekayat_hayah_cemetery_v1'))[0].id, 'saved-life');

  const malformedRecordArchive = JSON.stringify([null]);
  cemeteryStore.set('hekayat_hayah_cemetery_v1', malformedRecordArchive);
  cemeteryStore.set('hekayat_hayah_cemetery_backup_v1', corruptBackup);
  assert.throws(() => integrityContext.readCemeteryForBackup(), /cemetery-invalid/);
  assert.equal(cemeteryStore.get('hekayat_hayah_cemetery_v1'), malformedRecordArchive);

  assert.ok(app.includes('!validateCemeteryBackup(parsed.cemetery)'), 'backup imports must reject malformed cemetery records before writing local stores');
  assert.match(app, /سجل الحيوات السابقة غير قابل للقراءة/);
});

test('كتالوج الوظائف يعرض المسارات المقفولة ويوضح شروط القبول', () => {
  assert.match(app, /function jobRequirements\(job\)/);
  assert.match(app, /function jobAcceptanceChance\(\)/);
  assert.match(app, /function jobRequirementsMenu\(job,requirements\)/);
  assert.match(app, /function showCareer\(\)[\s\S]*?const opts=jobs\.map\(j=>[\s\S]*?jobRequirementsMenu\(j,missing\)/);
  assert.match(app, /فرصة القبول التقديرية/);
  assert.match(app, /data\.performance=clamp\(Number\.isFinite\(Number\(data\.performance\)\)\?Number\(data\.performance\):50\)/);
  assert.match(css, /\.locked-choice/);
});

test('المسار المهني يدعم درجات متعددة ويهيئ الحفظ القديم دون تغيير الإصدار', () => {
  assert.match(app, /function jobRankLabel\(level\)/);
  assert.match(app, /function ensureJobProgress\(job,currentAge\)/);
  assert.match(app, /function jobPromotionRequirements\(job\)/);
  assert.match(app, /function jobPromotionChance\(job,manual\)/);
  assert.match(app, /function grantJobPromotion\(source\)/);
  assert.match(app, /function requestJobPromotion\(\)/);
  assert.match(app, /ensureJobProgress\(data\.job,data\.age\)/);
  assert.match(app, /job\.promotions\.push/);
  assert.match(app, /roleStartAge/);
  assert.match(app, /choice\('🏅','طلب ترقية'/);
  assert.match(app, /state\.job=\{id:job\.id,title:job\.title,baseTitle:job\.title[\s\S]*?promotions:\[\]\}/);
  assert.match(app, /promotionChance>0&&chance\(promotionChance\)\)grantJobPromotion\('annual'\)/);
  assert.match(app, /return \{version:1,lifeId:/);
});


test('الانتقال الوظيفي يحفظ المسار السابق ولا يمس الوظيفة الحالية عند رفض العرض', () => {
  assert.ok(app.includes("function archiveCurrentJob(reason='استقالة')"));
  assert.ok(app.includes("function jobMarketMenu()"));
  assert.ok(app.includes("choice('🔎','استكشاف فرص عمل'"));
  assert.ok(app.includes("archiveCurrentJob('انتقال مهني')"));
  assert.ok(app.includes("archiveCurrentJob('استقالة')"));
  assert.ok(app.includes("archiveCurrentJob('تفرغ للاستثمار')"));
  assert.ok(app.includes("archiveCurrentJob('تقاعد')"));
  assert.ok(app.includes("exitReason:reason"));
  assert.ok(app.includes("وظيفتك الحالية لم تتأثر"));
  assert.ok(app.includes("const KEY = 'hekayat_hayah_save_v1'"));
  assert.ok(app.includes("return {version:1,lifeId:"));
});

test('المقتنيات الموروثة تُطبّع بأمان وتدعم عرض القيمة والبيع دون تغيير حفظ v1', () => {
  assert.ok(app.includes('function normalizeHeirlooms(raw,currentAge=0)'));
  assert.ok(app.includes('data.heirlooms=normalizeHeirlooms(data.heirlooms,data.age)'));
  assert.ok(app.includes('function heirloomCollectionMenu()'));
  assert.ok(app.includes('function heirloomDetailMenu(id)'));
  assert.ok(app.includes('function sellHeirloom(id)'));
  assert.ok(app.includes('85% من القيمة التقديرية'));
  const normalizer = functionSource('normalizeHeirlooms', 'heirloomRarity');
  const context = {
    raw: [
      { name: 'ساعة قديمة', value: '2500', age: '20' },
      { id: 'kept-book', name: 'كتاب عائلي', value: -9, age: 999, emoji: '📚' },
      { id: 'kept-book', name: 'صندوق الصور', value: '1200' },
      null,
      { id: 'duplicate', name: '', value: 100, age: 2 }
    ],
    age: 40
  };
  vm.runInNewContext(normalizer + '\nglobalThis.first=normalizeHeirlooms(raw,age); globalThis.second=normalizeHeirlooms(first,age);', context);
  assert.equal(context.first.length, 3);
  assert.equal(context.first[0].id, 'legacy-heirloom-0');
  assert.equal(context.first[0].value, 2500);
  assert.equal(context.first[0].age, 20);
  assert.equal(context.first[1].id, 'kept-book');
  assert.equal(context.first[1].value, 0);
  assert.equal(context.first[1].age, 120);
  assert.equal(context.first[2].id, 'kept-book-2');
  assert.equal(context.first[2].age, 40, 'legacy items without an age should inherit the current character age');
  assert.equal(context.second[0].id, context.first[0].id, 'legacy identifiers should remain stable after the first migration');
  assert.equal(context.second[2].id, 'kept-book-2');
  assert.ok(app.includes("const KEY = 'hekayat_hayah_save_v1';"));
  assert.ok(app.includes('return {version:1,lifeId:'));
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

test('هوية حياة البصرية تستخدم نظام ألوان عربيًا مستقلًا', () => {
  assert.match(css, /--hayah-primary:#0f766e/);
  assert.match(css, /--hayah-primary-deep:#123b3a/);
  assert.match(css, /--hayah-accent:#c06c4f/);
  assert.doesNotMatch(css, /BitLife|--bitlife-/i);
});

test('تخطيط الهاتف وإمكانية الوصول ما زالا موجودين', () => {
  assert.match(css, /@media\(max-width:380px\)/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /button:focus-visible/);
  assert.match(css, /\.brand-symbol\{/);
});

test('القائمة الرئيسية مقسمة بوضوح وحالة التبويب لا تختفي عند تحديث الشخصية', () => {
  const menu = functionSource('mainMenu', 'auraRingMenu');
  assert.match(menu, /section\('الحياة والشخصية'\)/);
  assert.match(menu, /section\('الإنجازات والمكافآت'\)/);
  assert.match(menu, /section\('المزايا والأنشطة'\)/);
  assert.match(menu, /section\('الإعدادات وبيانات الحفظ'\)/);

  const modalSource = functionSource('modal', 'info');
  assert.match(modalSource, /'القائمة الرئيسية'/, 'the long main menu should open in a scrollable drawer');

  const renderSource = functionSource('render', 'closeModal');
  assert.doesNotMatch(renderSource, /classList\.remove\('active'\)/);
  assert.match(app, /b\.setAttribute\('aria-pressed',String\(selected\)\)/);
});


test('قوائم الأنشطة والعلاقات منظمة ومترجمة بالكامل إلى العربية', () => {
  const activities = functionSource('activities', 'healthMenu');
  const relations = functionSource('relations', 'custodyModeLabel');
  assert.match(activities, /section\('الحياة اليومية'\)/);
  assert.match(activities, /section\('أنشطة سريعة'\)/);
  assert.match(activities, /section\('تجارب ومسارات خاصة'\)/);
  assert.match(activities, /modal\('☰','الأنشطة والحياة اليومية'/);
  assert.doesNotMatch(activities, /Favorites|Premium Activities|Health & Wellness|Export Save|New Life|سباقات السيارات|العميل السري/);
  assert.match(relations, /section\('الوالدان'\)/);
  assert.match(relations, /section\('الأصدقاء'\)/);
  assert.match(relations, /section\('الأبناء'\)/);
  assert.match(relations, /section\('توسيع شبكة العلاقات'\)/);
  assert.doesNotMatch(relations, /section\('(Special|Parents|Family|Friends|Partner|Children|Relationships)'\)/);
});

test('سجل الحياة يحافظ على موضع القراءة ولا يقفز عند مراجعة الأحداث القديمة', () => {
  const feed = functionSource('renderFeed', 'syncBusinessAsset');
  assert.match(feed, /const shouldFollowLatest=feed\.scrollHeight-feed\.scrollTop-feed\.clientHeight<=80/);
  assert.match(feed, /if\(!shouldFollowLatest\)return/);
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
  assert.match(worker, /const CACHE_NAME = 'hayah-shell-v224'/);
  assert.match(worker, /cache\.addAll\(APP_SHELL\)/);
  assert.match(worker, /APP_SHELL\.find\(url => new URL\(url\)\.pathname === requestUrl\.pathname\) \|\| APP_SHELL\[0\]/);
  assert.match(worker, /const matchCached = async \(\) =>/);
  assert.match(icon, /حياة/);
});

test('توثيق الجودة لا يدّعي اختبار متصفح غير موجود', () => {
  assert.match(readme, /صياغة.*app\.js/);
  assert.match(readme, /اختبار يدوي كامل داخل متصفح الهاتف/);
});


test('شجرة العائلة تفتح من العلاقات والوصية', () => {
  const relationMenu=functionSource('relations','familyMenu');
  const will=functionSource('willMenu','setWill');
  assert.match(relationMenu,/familyTreeMenu/);
  assert.match(will,/familyTreeMenu/);
  assert.match(app,/function familyTreeMenu\(\)/);
  assert.match(app,/family-tree-generation/);
  assert.match(app,/function familyTreeNode\(p\)/);
});
test('تطور الأبناء يربط العمر بالتعليم والاستقلال ويحافظ على الحفظ القديم', () => {
  assert.match(app,/function ensureChildGrowthProfile\(c\)/);
  assert.match(app,/function advanceChildren\(\)/);
  assert.match(app,/advanceChildren\(\);/);
  assert.match(app,/c\.schoolPerformance/);
  assert.match(app,/c\.careerPotential/);
  assert.match(app,/c\.independence/);
  assert.match(app,/c\.educationStatus='خريج جامعي'/);
  const childActions=functionSource('childAction','personModal');
  assert.match(childActions,/action==='study'/);
  assert.match(childActions,/action==='career'/);
  assert.match(childActions,/action==='launch'/);
  assert.match(app,/heir\.stats=\{\.\.\.heir\.stats,health:clamp\(child\.health/);
});


test('الاستقلال المالي للأشقاء البالغين محفوظ اختياريًا ويظهر في ملف العائلة', () => {
  assert.match(app,/function ensureSiblingEconomicProfile\(relative\)/);
  assert.match(app,/function advanceSiblingEconomies\(\)/);
  assert.match(app,/advanceSiblingEconomies\(\);/);
  assert.match(app,/lastProcessedYear>=year/);
  assert.match(app,/cumulativeIncome/);
  assert.match(app,/cumulativeExpenses/);
  assert.match(app,/function siblingInvestmentAnnualReturn\(relative,year,risk,balance\)/);
  assert.match(app,/function siblingEmploymentDecision\(relative,profile,year,age\)/);
  assert.match(app,/employmentState/);
  assert.match(app,/بيبحث حاليًا عن فرصة عمل/);
  assert.match(app,/investmentContributionsTotal/);
  assert.match(app,/investmentBalance/);
  assert.match(app,/المحفظة الاستثمارية/);
  assert.match(app,/function siblingEconomicDetails\(n\)/);
  assert.match(app,/الاستقلال المالي/);
  assert.match(app,/صافي الثروة/);
  assert.match(app,/n\.economicProfile/);
  assert.match(app,/return \{version:1,lifeId:/);
  assert.match(read('sw.js'),/hayah-shell-v224/);
});

test('إعدادات العرض منفصلة عن حفظ الحياة ويمكن الوصول إليها من القائمة', () => {
  assert.match(app, /const SETTINGS_KEY = 'hayah_ui_settings_v1';/);
  assert.match(app, /function loadUiSettings\(\)/);
  assert.match(app, /function applyUiSettings\(\)/);
  assert.match(app, /localStorage\.setItem\(SETTINGS_KEY,JSON\.stringify\(uiSettings\)\)/);
  assert.match(app, /choice\('⚙️','إعدادات العرض'/);
  assert.match(app, /function init\(\)[\s\S]*?loadUiSettings\(\);\s*state=load\(\)/);
  assert.match(app, /const KEY = 'hekayat_hayah_save_v1';/);
  assert.match(css, /body\.theme-dark\{/);
  assert.match(css, /body\.text-large \.logtext/);
  assert.ok(app.includes('uiSettings.reducedMotion'));
  assert.ok(read('accessibility.css').includes('body.reduce-motion *'));
});



test('مساعدة توقيت القتال إعداد وصول مستقل ومتوافق مع إعدادات الحفظ القديمة', () => {
  const source = functionSource('normalizeUiSettings', 'loadUiSettings');
  const context = {};
  vm.runInNewContext(source + `
    globalThis.enabled=normalizeUiSettings({combatTimingAssist:true});
    globalThis.legacy=normalizeUiSettings({theme:'dark',textScale:'large'});
    globalThis.invalid=normalizeUiSettings({combatTimingAssist:'yes'});
  `, context);
  assert.equal(context.enabled.combatTimingAssist, true);
  assert.equal(context.legacy.combatTimingAssist, false, 'older settings should default to timed combat');
  assert.equal(context.invalid.combatTimingAssist, false, 'invalid imported settings must not enable assistance');
  assert.ok(app.includes("combatTimingAssist:typeof raw.combatTimingAssist==='boolean'?raw.combatTimingAssist:defaults.combatTimingAssist"));
  assert.ok(app.includes("session.reactionTimingAssist=uiSettings.combatTimingAssist===true"));
  assert.ok(app.includes("reactionTimingAssist:session.reactionTimingAssist===true"));
  assert.match(app, /مساعدة التوقيت مفعّلة/);
  assert.match(app, /مساعدة توقيت القتال/);
  assert.match(read('sw.js'), /hayah-shell-v224/);
});

test('فرص تحسين الإحصاءات اختيارية ومحدودة بسنة العمر وتحافظ على حفظ v1', () => {
  assert.match(app, /let uiSettings=\{[^}]*boosts:true/);
  assert.match(app, /boosts:typeof raw\.boosts==='boolean'\?raw\.boosts:defaults\.boosts/);
  assert.match(app, /function statBoostMenu\(key\)/);
  assert.match(app, /function applyStatBoost\(key,tier\)/);
  assert.match(app, /state\.status!=='حي'/, 'recovery actions must not remain available after the life ends');
  assert.match(app, /data-stat-boost=/);
  assert.match(app, /state\.boostUsedAge=Number\(state\.age\)/);
  assert.match(app, /function normalizeStatBoostUsage\(data\)/);
  const source = functionSource('normalizeStatBoostUsage', 'normalizeCoreState');
  const context = {};
  vm.runInNewContext(source + ';globalThis.normalize=normalizeStatBoostUsage;', context);
  assert.equal(context.normalize({age: 24}), null);
  assert.equal(context.normalize({age: 24, boostUsedAge: 23}), 23);
  assert.equal(context.normalize({age: 24, boostUsedAge: 25}), null);
  assert.equal(context.normalize({age: 24, boostUsedAge: -1}), null);
  assert.match(app, /const KEY = 'hekayat_hayah_save_v1';/);
  assert.match(app, /return \{version:1,lifeId:/);
  assert.match(read('sw.js'), /hayah-shell-v224/);
});

test('واجهة الهاتف تحافظ على نظام حياة البصري وتخطيطها العربي', () => {
  const finalUi = css.slice(css.lastIndexOf('/* v195: Hayah visual identity system'));
  assert.ok(finalUi.length > 0, 'the v195 identity layer should be the final visual layer');
  assert.match(finalUi, /--hayah-primary:#0f766e/);
  assert.match(finalUi, /--hayah-primary-deep:#123b3a/);
  assert.match(finalUi, /--hayah-accent:#c06c4f/);
  assert.match(finalUi, /\.nav\s*\{[^}]*order:0!important/s);
  assert.match(finalUi, /\.stats\s*\{[^}]*order:1!important/s);
  assert.match(finalUi, /grid-template-columns:72px minmax\(0,1fr\)/);
  assert.match(finalUi, /\.agebtn\s*\{[^}]*border-radius:50%/s);
  assert.match(finalUi, /\.statvalue\s*\{[^}]*position:absolute[^}]*z-index:1/s);
  assert.match(finalUi, /direction:ltr!important/);
  assert.match(finalUi, /left:0!important;right:auto!important/);
  assert.match(finalUi, /body\.theme-dark #app \.nav\{[^}]*background:var\(--hayah-surface\)!important/);
  assert.match(finalUi, /@media\(max-width:380px\)/);
  assert.doesNotMatch(css, /BitLife|--bitlife-/i);
  assert.ok(app.includes("const rows=[['happiness','😄','السعادة'],['health','❤️','الصحة'],['smart','🧠','الذكاء'],['looks','😎','المظهر']];"));
});

test('الشاشات القصيرة تضغط المساحات الثابتة وتحافظ على يوميات قابلة للتمرير', () => {
  const compactLayout = css.slice(css.lastIndexOf('/* v120: reclaim vertical space'));
  assert.ok(compactLayout.includes('@media(max-height:620px)'));
  assert.ok(compactLayout.includes('#app > .topbar'));
  assert.ok(compactLayout.includes('#app > .bottom-dock > .nav > .agebtn'));
  assert.ok(compactLayout.includes('#modalRoot .drawer-overlay'));
  assert.ok(compactLayout.includes('height:56px!important'));
  assert.ok(compactLayout.includes('height:52px!important'));
});

test('الرجوع بالزمن يستعيد سجل الأحداث الصحيح بعد بلوغ حد السجل الدوّار', () => {
  const ageUp = functionSource('ageUp', 'age18Choice');
  const rewind = functionSource('rewindToSnapshot', 'customizeMenu');
  assert.match(ageUp, /const logSnapshot=logLength>=280&&Array\.isArray\(state\.log\)\?JSON\.parse\(JSON\.stringify\(state\.log\)\):null/);
  assert.match(ageUp, /if\(logSnapshot\)checkpoint\.logSnapshot=logSnapshot/);
  assert.match(rewind, /Array\.isArray\(parsedSnapshot\.logSnapshot\)\?parsedSnapshot\.logSnapshot/);
  assert.match(rewind, /Number\(parsedSnapshot\.logLength\)/, 'older snapshots without a log checkpoint remain supported');
});


test('مسيرة الرياضات الإلكترونية أصلية وتحافظ على التوافق مع الحفظ القديم', () => {
  assert.match(app, /function ensureGamingTalent\(\)/);
  assert.match(app, /function createEsportsCareer\(\)/);
  assert.match(app, /function enterEsportsTournament\(\)/);
  assert.match(app, /function negotiateEsportsSponsorship\(\)/);
  assert.match(app, /function upgradeEsportsSetup\(\)/);
  assert.match(app, /موهبة الألعاب الإلكترونية/);
  assert.match(app, /data\.talents\.gaming=clamp\(Number\(data\.talents\.gaming\),0,100\)/);
  assert.match(read('sw.js'), /hayah-shell-v224/);
  assert.match(functionSource('rewindToSnapshot', 'customizeMenu'), /ensureGamingTalent\(\)/, 'rewinding a pre-feature snapshot should restore a valid talent default');
});


test('متجر مزايا حياة يحفظ المزايا بشكل مستقل ويحافظ على حفظ v1', () => {
  assert.match(app, /const KEY = 'hekayat_hayah_save_v1';/);
  assert.match(app, /const PERKS_KEY = 'hayah_permanent_perks_v1';/);
  assert.match(app, /function loadPermanentPerks\(\)/);
  assert.match(app, /function premiumPerksMenu\(\)/);
  assert.match(app, /function buyPremiumPerk\(id\)/);
  assert.match(app, /function togglePremiumPerk\(id\)/);
  assert.match(app, /version:1,lifeId:/);
  assert.match(app, /function challengeVaultMenu\(\)/);
  assert.match(app, /function claimVaultChallenge\(date,id\)/);
  assert.match(app, /historyLimit=perkOwned\('expandedTime'\)\?60:8/);
  assert.match(app, /function actorPackMenu\(\)/);
  assert.match(app, /function actorCommercialGig\(\)/);
  assert.match(app, /freeVehicleCare=perkEnabled\('goldenWrench'\)/);
  assert.match(app, /const cost=perkOwned\('goldenPassport'\)\?0:15000/);
  assert.match(app, /careerIncomeMultiplier\(\)/);
  assert.match(app, /Math.max\(1000000,place.start\)/);
  assert.match(app, /if\(perkOwned\('goldenPiggyBank'\)\)heir\.bank\+=1000000/);
  assert.match(app, /protectedByShield/);
});

test('الطابع الذهبي يتخزن ويعاد تحميله ويغيّر مظهر حياة فقط', () => {
  assert.match(app, /theme:\['dark','light','gold'\]\.includes\(raw\.theme\)\?raw\.theme:defaults\.theme/);
  assert.match(app, /body\.classList\.toggle\('theme-gold',uiSettings\.theme==='gold'\)/);
  assert.match(css, /body\.theme-gold\{/);
  assert.match(css, /--brand:#b8861b/);
});

test('حماة سلسلة التحديات يعملون عند تفويت يوم كامل مع حد ثابت للمزايا', () => {
  assert.match(app, /old\.lastCompletionDate===twoDaysAgo&&\(permanentPerks\.streakSavers\|\|0\)>0/);
  assert.match(app, /permanentPerks\.streakSavers--/);
  assert.match(app, /state\.challengeArchive=state\.challengeArchive\.slice\(0,60\)/);
  assert.match(app, /data\.challengeArchive=data\.challengeArchive\.filter\([\s\S]*?\.slice\(0,60\)/);
});


test('مركز المهن يفتح حزمة التمثيل ودرع العافية يحمي ويُعالج الحالة المحاكية', () => {
  assert.match(app, /id==='actorPack'&&!!\(permanentPerks&&permanentPerks\.owned&&permanentPerks\.owned\.bossMode\)/);
  assert.match(app, /data\.sti=typeof data\.sti==='boolean'\?data\.sti:false/);
  assert.match(app, /const infection=!protectedByShield&&!state\.sti&&chance\(\.14\)/);
  assert.match(app, /if\(infection\)\{state\.sti=true;state\.stats\.health=clamp\(state\.stats\.health-12\);\}/);
  assert.match(app, /const treatedCondition=state\.sti===true;if\(treatedCondition\)state\.sti=false/);
  assert.match(app, /عدوى منقولة جنسيًا في محاكاة اللعبة/);
});


test('حزم الصور تفتح أنظمة المهن والثروة والجريمة والحيوانات فعليًا', () => {
  const required = [
    "id:'fameFortuneBundle'",
    "id:'billionairesBundle'",
    "id:'crimePaysBundle'",
    "id:'partyAnimalBundle'",
    "fameFortuneBundle:['goldenPiggyBank','goldenPassport','hollywoodStar']",
    "billionairesBundle:['businessPack','landlordPack','investorPack']",
    "crimePaysBundle:['mafiaPack','blackMarketPack','assassinsBlade']",
    "partyAnimalBundle:['zooExpansionPack','jailCard','superstarMode','goldTheme']",
    "function companyPortfolioMenu()",
    "function landlordTenantMenu(index)",
    "function investingMenu()",
    "inv.kind==='عملات رقمية'",
    "function zooMenu()",
    "function discoverZooAnimal()",
    "function mafiaMenu()",
    "function mafiaMission()",
    "function blackMarketMenu()",
    "function museumMenu()",
    "function assassinBladeMission()",
    "function useJailFreeCard()"
  ];
  required.forEach(fragment => assert.ok(app.includes(fragment), 'missing feature: ' + fragment));
});

test('المزايا الفردية للوظيفة والتعليم والصداقة والولادة تحافظ على حفظ v1', () => {
  const required = [
    "const KEY = 'hekayat_hayah_save_v1';",
    "function goldenDiplomaMenu()",
    "function grantGoldenDiploma(major)",
    "function goldenPacifierMenu()",
    "function planGoldenBirth(count,gender,talent)",
    "if(perkOwned('friendshipBracelet'))f.relationshipLevel=100",
    "perkEnabled('goldenResume')?1",
    "perkEnabled('goldenPacifier')?18:20",
    "function companyDetailMenu(index)",
    "if(a.companyPortfolio){const companyIndex=",
    "if(!Array.isArray(data.companies))data.companies=[]"
  ];
  required.forEach(fragment => assert.ok(app.includes(fragment), 'missing feature: ' + fragment));
});


test('باقات السوق الجديدة مرتبطة بأنظمة لعب فعلية', () => {
  const required = [
    "id:'cultPack'",
    "id:'casinoPack'",
    "id:'godMode'",
    "id:'bitizenship'",
    "id:'movieDirectorPack'",
    "id:'dealerPack'",
    "id:'businessPack'",
    "id:'landlordPack'",
    "id:'investorPack'",
    "function cultMenu()",
    "function advanceCultSystem()",
    "function casinoMenu()",
    "const casinoGameCatalog=[",
    "function advanceCasinoSystem()",
    "function dealerMenu()",
    "function advanceDealerSystem()",
    "function godModeMenu()",
    "function startRoyalLife()",
    "function godModeTalentsMenu()",
    "function bitizenshipMenu()",
    "function bitizenshipInteractionMenu()",
    "function movieDirectorMenu()",
    "function financialAdvisorMenu()",
    "function investmentTipsMenu()",
    "function marketNewspaperMenu()",
    "function advanceInvestmentAdvisor()",
    "function landlordPortfolioMenu()",
    "function customizePropertyAmenities(index)",
    "function evictTenant(index)",
    "function advanceZooSystem()",
    "function zooHabitatMenu()",
    "function zooOwnedAnimalsMenu(page=0)",
    "function grantLandlordStarterProperty()",
    "funds:75000,habitats:['savannah','forest','aviary']"
  ];
  required.forEach(fragment => assert.ok(app.includes(fragment), 'missing feature: ' + fragment));
});

test('حديقة الحيوان تدعم أكثر من 100 نوع، وحزمة المخرج تفتح 11 نوعًا سينمائيًا', () => {
  const zooStart = app.indexOf('const zooSpeciesCatalog=[');
  const zooEnd = app.indexOf('].map((a,i)=>', zooStart);
  assert.notEqual(zooStart, -1);
  assert.notEqual(zooEnd, -1);
  const species = (app.slice(zooStart, zooEnd).match(/\['[a-z0-9-]+','/g) || []).length;
  assert.ok(species >= 100, 'expected 100+ zoo species, found ' + species);

  const filmStart = app.indexOf('const filmGenreCatalog=[');
  const filmEnd = app.indexOf('\n];', filmStart);
  assert.notEqual(filmStart, -1);
  assert.notEqual(filmEnd, -1);
  const genres = (app.slice(filmStart, filmEnd).match(/\{id:'/g) || []).length;
  assert.equal(genres, 11, 'director expansion should expose 11 film genres');
  assert.ok(app.includes('function filmAuditionResultsMenu(genreId,budgetId,creativeId,refresh=false)'));
  assert.ok(app.includes('function filmActorRosterMenu()'));
  assert.ok(app.includes('actorDrama,actorImpact:'));
  assert.ok(app.includes('studio.actorRoster'));
  assert.match(app, /genres=filmGenreCatalog\.filter\(g=>!g\.packOnly\|\|perkOwned\('movieDirectorPack'\)\)/);
});

test('استوديو الأفلام يدعم اختبارات الأداء والممثلين المتعاقدين دون كسر سجلاته القديمة', () => {
  const start = app.indexOf('function normalizeFilmActor(');
  const end = app.indexOf('function filmStudioMenu(', start);
  assert.ok(start >= 0 && end > start, 'film actor helpers and studio normalization should be present');
  const source = app.slice(start, end);
  const actor = { id: 'film-actor-123456-abcdef', name: 'ممثلة اختبار', genreId: 'drama',
    acting: 90, professionalism: 82, ego: 20, genreFit: 92, fee: 9000, projects: 1 };
  const context = {
    filmGenreCatalog: [{ id: 'drama' }, { id: 'action' }],
    filmBudgetCatalog: [{ id: 'indie' }, { id: 'standard' }],
    filmCreativeCatalog: [{ id: 'artistic' }, { id: 'commercial' }],
    names: { male: ['آدم'], female: ['مريم'], family: ['منصور'] },
    pick(list) { return list[0]; },
    chance() { return false; },
    clamp(value, min = 0, max = 100) { return Math.max(min, Math.min(max, Math.round(Number(value) || 0))); },
    state: { filmStudio: { filmography: [], projects: 2, totalBudget: 15000, totalBoxOffice: 22000,
      awards: 1, bestCritic: 86, genreFocus: 'drama', actorRoster: [actor, { id: 'invalid', name: 'تالف' }],
      pendingAuditions: [actor], pendingAuditionGenre: 'drama',
      pendingProject: { genreId: 'drama', budgetId: 'indie', creativeId: 'artistic', ignored: true } } }
  };
  vm.runInNewContext(source + '\nglobalThis.studio=ensureFilmStudio();globalThis.candidate=createFilmActorCandidate("drama");' +
    'globalThis.matched=filmActorImpact(' + JSON.stringify(actor) + ',"drama",false);' +
    'globalThis.mismatched=filmActorImpact(' + JSON.stringify(actor) + ',"action",false);' +
    'globalThis.drama=filmActorImpact(' + JSON.stringify(actor) + ',"drama",true);' +
    'globalThis.defaults=createFilmStudio();', context);
  assert.equal(context.studio.actorRoster.length, 1, 'legacy actor lists should discard invalid entries and keep known actors');
  assert.equal(context.studio.pendingAuditions.length, 1, 'pending auditions should survive a save reload');
  assert.deepEqual(JSON.parse(JSON.stringify(context.studio.pendingProject)),
    { genreId: 'drama', budgetId: 'indie', creativeId: 'artistic' },
    'only supported project choices should survive normalization');
  assert.equal(context.defaults.actorRoster.length, 0, 'old studio saves should receive an empty actor roster');
  assert.equal(context.defaults.pendingProject, null, 'old studio saves should not invent an in-progress project');
  assert.match(context.candidate.id, /^film-actor-/);
  assert.ok(context.candidate.fee > 0 && context.candidate.acting >= 45 && context.candidate.acting <= 95);
  assert.ok(context.matched.successBonus > context.mismatched.successBonus,
    'genre-fit actors should outperform the same actor outside their preferred genre');
  assert.ok(context.drama.successBonus < context.matched.successBonus && context.drama.dramaPenalty > 0,
    'on-set conflict should reduce the actor contribution to film success');
  assert.ok(context.drama.criticBonus < context.matched.criticBonus,
    'on-set conflict should also affect the critics score');
});

test('الأنظمة الجديدة تضيف بيانات افتراضية آمنة للحفظ القديم ولا تمس إصدار v1', () => {
  assert.match(app, /const KEY = 'hekayat_hayah_save_v1';/);
  assert.match(app, /const PERK_IDS = \[[^\n]*'cultPack'[^\n]*'casinoPack'[^\n]*'godMode'[^\n]*'bitizenship'[^\n]*'movieDirectorPack'[^\n]*'dealerPack'/);
  assert.match(app, /if\(!data\.cult\|\|typeof data\.cult!=='object'/);
  assert.match(app, /if\(!data\.casino\|\|typeof data\.casino!=='object'/);
  assert.match(app, /if\(!data\.dealer\|\|typeof data\.dealer!=='object'/);
  assert.match(app, /if\(!data\.investmentAdvisor\|\|typeof data\.investmentAdvisor!=='object'/);
  assert.match(app, /function advanceInvestmentAdvisor\(\)/);
  assert.match(app, /function advanceZooSystem\(\)/);
});


test('واجهة الهاتف الجديدة تطابق تخطيط الصفحات المرجعية وتحافظ على هوية حياة', () => {
  assert.match(html, /id="marketBtn"/);
  assert.doesNotMatch(html, /adSlot|closeAdSlot|ad-slot|مساحة إعلان/);
  assert.doesNotMatch(app, /closeAdSlot|ad-hidden/);
  assert.doesNotMatch(css, /\.ad-slot|ad-hidden/);
  assert.match(app, /function section\(title\)/);
  assert.match(app, /if\(c&&c\.section\)return '<div class="list-section"/);
  assert.match(app, /function auraRingMenu\(\)/);
  assert.match(app, /function shoppingMenu\(\)/);
  assert.match(app, /function schoolHub\(\)/);
  assert.match(app, /function schoolClassMenu\(\)/);
  assert.match(app, /function schoolCliqueMenu\(\)/);
  assert.match(app, /function schoolFacultyMenu\(\)/);
  assert.match(app, /function showJobPackOffer\(id,career\)/);
  assert.match(app, /function showActivityPackOffer\(id\)/);
  assert.match(app, /function vampireModeMenu\(\)/);
  assert.match(app, /function outdoorLifestyleMenu\(\)/);
  assert.match(app, /function gatedCommunityMenu\(\)/);
  assert.match(app, /id:'modelPack'/);
  assert.match(app, /id:'musicianPack'/);
  assert.match(app, /id:'musicProducerPack'/);
  assert.match(css, /\.activities-screen/);
  assert.match(css, /\.activity-vampire-row/);
  assert.match(app, /id:'astronautPack'/);
  assert.match(app, /function openJobPackDestination\(id\)/);
  assert.match(css, /\.school-screen/);
  assert.match(css, /\.job-pack-card/);
  assert.match(app, /function storeDealerMenu\(kind\)/);
  assert.match(app, /function ensureSocialPlatforms\(\)/);
  assert.match(app, /function showMovieDirectorOffer\(\)/);
  assert.match(css, /\.drawer-action-banner/);
  assert.match(css, /\.pack-offer-buy/);
  assert.match(app, /section\('الوالدان'\)/);
  assert.match(app, /section\('تجارب ومسارات خاصة'\)/);
  assert.match(app, /section\('إدارة الأصول المتخصصة'\)/);
  assert.match(app, /id="majorSelect"/);
  assert.match(app, /function startDrivingTest\(\)/);
  assert.match(app, /function finishDrivingTest\(passed\)/);
  assert.match(app, /auraRing:\{cost:32000,title:'خاتم الهالة'\}/);
  assert.match(css, /--blue:#075a9b/);
  assert.match(css, /\.drawer-body \.choice\.locked-choice/);
  assert.match(css, /\.agebtn[\s\S]{0,200}border-radius:50%/);
  assert.doesNotMatch(css, /\.ad-slot|ad-hidden/);
  assert.match(css, /\.list-section/);
  assert.match(css, /grid-template-columns:minmax\(0,1fr\)/);
  assert.doesNotMatch(html, /BITLIFE|BitLife|Candywriter/);
});


test('إدارة المشروع تدعم عقود الموردين وتقاريرًا مالية سنوية محدودة ومتوافقة مع الحفظ القديم', () => {
  assert.match(app, /const BUSINESS_SUPPLIER_CATALOG = \[/);
  assert.match(app, /function businessSupplierMenu\(\)/);
  assert.match(app, /function contractBusinessSupplier\(id\)/);
  assert.match(app, /function recordBusinessFinancialReport\(entity,report\)/);
  assert.match(app, /function businessReportsMenu\(entity,title,back\)/);
  assert.match(app, /entity\.financialHistory=history\.slice\(-10\)/);
  assert.match(app, /business\.supplier\.yearsLeft=Math\.max\(0,/);
  assert.match(app, /choice\('📦','التعاقد مع مورد'/);
  assert.match(app, /choice\('📊','سجل التقارير'/);
  assert.match(app, /const normalizeBusinessEntity=entity=>/);
  assert.match(read('sw.js'), /hayah-shell-v224/);
});


test('إدارة فريق المشروع تحفظ الموظفين وتؤثر في التقرير السنوي', () => {
  assert.match(app, /const BUSINESS_STAFF_ROLES = \[/);
  assert.match(app, /function businessStaffMenu\(\)/);
  assert.match(app, /function businessStaffHiringMenu\(\)/);
  assert.match(app, /function hireBusinessStaff\(roleId\)/);
  assert.match(app, /function trainBusinessStaff\(id\)/);
  assert.match(app, /function fireBusinessStaff\(id\)/);
  assert.match(app, /entity\.staff=entity\.staff\.filter/);
  assert.match(app, /staffPayroll/);
  assert.match(app, /staffCount/);
  assert.match(app, /choice\('👥','إدارة الموظفين'/);
  assert.match(read('sw.js'), /hayah-shell-v224/);
});


test('سوق الموردين يتجدد سنويًا ويحفظ عروض الأسعار مع احترام العقود القديمة', () => {
  assert.match(app, /function businessSupplierMarketOffers\(business\)/);
  assert.match(app, /business\.supplierMarket=\{year,offers\}/);
  assert.match(app, /yearsLeft:1,startedAtAge:state\.age/);
  assert.match(app, /earlyExitFee/);
  assert.match(app, /supplierQuality/);
  assert.match(app, /supplierCostMultiplier/);
  assert.match(app, /entity\.supplier\.yearsLeft\)\|\|3,1,3/);
  assert.match(app, /entity\.supplier\.quality/);
  assert.match(read('sw.js'), /hayah-shell-v224/);
});


test('إدارة المنتجات تدعم بحث السوق والمبيعات السنوية مع حفظ متوافق', () => {
  assert.match(app, /const BUSINESS_PRODUCT_CATALOG = \[/);
  assert.match(app, /function businessProductMarketSnapshot\(business,catalog\)/);
  assert.match(app, /function researchBusinessProduct\(productId\)/);
  assert.match(app, /function launchBusinessProduct\(productId,useResearch\)/);
  assert.match(app, /function simulateBusinessProducts\(business,openingValue,supplier,staffRevenueBonus\)/);
  assert.match(app, /business\.pendingProductCosts/);
  assert.match(app, /productRevenue/);
  assert.match(app, /competition/);
  assert.match(app, /choice\('🧪','إدارة المنتجات'/);
  assert.match(app, /entity\.productResearch=entity\.productResearch\.filter/);
  assert.match(read('sw.js'), /hayah-shell-v224/);
});


test('شركات المحفظة تدير الموردين والموظفين والمنتجات وتغلق سنتها المالية باستقلال', () => {
  assert.match(app, /let managedCompanyId = null/);
  assert.match(app, /function currentManagedBusiness\(\)/);
  assert.match(app, /function openPrimaryBusinessMenu\(\)/);
  assert.match(app, /choice\('🧰','إدارة التشغيل'/);
  assert.match(app, /section\('الشركات المملوكة'\)/);
  assert.match(app, /companyDetailMenu\(i\)/);
  assert.match(app, /function simulateBusinessEntityYear\(business,kind\)/);
  assert.match(app, /simulateBusinessEntityYear\(state\.business,'business'\)/);
  assert.match(app, /simulateBusinessEntityYear\(company,'portfolio'\)/);
  assert.match(app, /business\.assetId\|\|business\.id\|\|business\.title/);
  assert.match(read('sw.js'), /hayah-shell-v224/);
});


test('الفروع والمصانع محفوظة لكل نشاط وتزيد طاقة المنتجات وتظهر تكلفتها في التقرير', () => {
  assert.match(app, /const BUSINESS_FACILITY_CATALOG = \[/);
  assert.match(app, /function businessFacilitiesMenu\(\)/);
  assert.match(app, /function businessFacilityCatalogMenu\(\)/);
  assert.match(app, /function buyBusinessFacility\(type\)/);
  assert.match(app, /if\(!Array\.isArray\(entity\.facilities\)\)entity\.facilities=\[\]/);
  assert.match(app, /entity\.pendingFacilityCosts/);
  assert.match(app, /capacityMultiplier/);
  assert.match(app, /facilityUpkeep/);
  assert.match(app, /facilityInvestment/);
  assert.match(app, /choice\('🏗️','الفروع والمصانع'/);
  assert.match(app, /return \{version:1,lifeId:/);
  assert.match(read('sw.js'), /hayah-shell-v224/);
});

test('استثمار المنشأة رأسمالي منفصل عن صافي الربح والصيانة السنوية', () => {
  const annualSimulation = functionSource('simulateBusinessEntityYear', 'advanceAge');
  assert.match(annualSimulation, /const operatingCostsTotal=operatingCosts\+staffPayroll\+facilityUpkeep\+productResult\.costs/);
  assert.match(annualSimulation, /const costs=operatingCostsTotal\+productResult\.upfrontCosts\+businessLoanInterest/);
  assert.match(annualSimulation, /facilityInvestmentCosts/);
  assert.match(annualSimulation, /const cashDelta=revenue-operatingCostsTotal-businessLoanInterestPaid-corporateTaxPaidFromCash/);
});

test('نسب طاقة المنشآت العشرية لا تُقرّب إلى أعداد صحيحة', () => {
  assert.match(app, /Math\.max\(0,Math\.min\(1\.5,Number\.isFinite\(capacityBonus\)\?capacityBonus:catalog\.capacityBonus\)\)/);
  assert.match(app, /facilityCapacityBonus=facilities\.reduce\(\(sum,facility\)=>sum\+Math\.max\(0,Math\.min\(1\.5,Number\(facility\.capacityBonus\)\|\|0\)\),0\)/);
});

test('سوق المنافسة يحفظ شركات مستقلة وقرارات سنوية تؤثر في المبيعات والتقارير', () => {
  [
    "function businessMarketSnapshot(business)",
    "function businessMarketMenu()",
    "function businessRivalHash(value)",
    "function createBusinessRivals(business,industry,year,count,baselinePrice)",
    "function normalizeBusinessRivals(raw,business,industry,year,count,baselinePrice)",
    "function advanceBusinessRivals(raw,business,industry,year,profile,demandIndex)",
    "function summarizeBusinessRivals(rivals,baselineCompetition,profile)",
    "function reconcileBusinessRivalShares(market)",
    "marketDemandFactor","marketCompetitionFactor","marketPriceFactor",
    "rivalQualityFactor","rivalMarketingFactor","rivalCapacityFactor",
    "marketRivalPlans","decisionYear",
    "rivals:normalizeBusinessRivals(market.rivals",
    "الشركات المنافسة داخل المحاكاة",
    "choice('📈','تحليل السوق والمنافسين'",
    "return {version:1,lifeId:"
  ].forEach(fragment => assert.ok(app.includes(fragment), 'missing independent rival behavior: '+fragment));
  assert.match(read('sw.js'), /hayah-shell-v224/);
});


test('النوافذ الحوارية تدير التركيز بلوحة المفاتيح وتعيده إلى زر الفتح', () => {
  assert.match(app, /let activeDialogKeyHandler=null, modalReturnFocus=null/);
  assert.match(app, /dialog\.setAttribute\('tabindex','-1'\)/);
  assert.match(app, /event\.key==='Escape'&&closable/);
  assert.match(app, /event\.key!=='Tab'/);
  assert.match(app, /document\.addEventListener\('keydown',activeDialogKeyHandler\)/);
  assert.match(app, /returnFocus&&returnFocus\.isConnected/);
  assert.match(app, /const initialFocus=\$\('closeModal'\)\|\|getFocusable\(\)\[0\]\|\|dialog/);
  assert.match(read('style.css'), /\.modal button:focus-visible/);
  assert.match(read('style.css'), /#modalRoot \.modal button:focus-visible/);
  assert.match(read('style.css'), /var\(--hayah-focus-ring/);
  assert.match(read('sw.js'), /hayah-shell-v224/);
});

test('اختبارات Node دون DOM كامل لا تتطلب querySelector من عنصر الجذر', () => {
  assert.match(app, /const dialog=typeof root\.querySelector==='function'\?root\.querySelector\('\[role="dialog"\]'\):null/);
});


test('إعدادات الصوت والاهتزاز ومساعدة القتال مستقلة عن حفظ الحياة', () => {
  assert.ok(app.includes("let uiSettings={theme:'light',textScale:'normal',sound:false,haptics:false,boosts:true,combatTimingAssist:false,reducedMotion:false}"));
  assert.ok(app.includes("function playUiFeedback(kind='tap')"));
  assert.ok(app.includes("typeof navigator.vibrate==='function'"));
  assert.ok(app.includes("window.AudioContext||window.webkitAudioContext"));
  assert.ok(app.includes("sound:typeof raw.sound==='boolean'?raw.sound:defaults.sound"));
  assert.ok(app.includes("haptics:typeof raw.haptics==='boolean'?raw.haptics:defaults.haptics"));
  assert.ok(app.includes("choice(uiSettings.sound?'🔊':'🔇'"));
  assert.ok(app.includes("choice(uiSettings.haptics?'📳':'📴'"));
  assert.ok(app.includes("choice(uiSettings.reducedMotion?'🧘':'🎞️'"));
  assert.ok(app.includes("reducedMotion:typeof raw.reducedMotion==='boolean'?raw.reducedMotion:defaults.reducedMotion"));
  assert.ok(app.includes("localStorage.setItem(SETTINGS_KEY,JSON.stringify(uiSettings))"));
  assert.match(read('sw.js'), /hayah-shell-v224/);
});


test('سجل الحياة يضيف الأحداث الجديدة تدريجيًا ويحافظ على عناصر السجل القديمة', () => {
  assert.match(app, /let renderedLogSnapshot=null, renderedFeedElement=null/);
  assert.match(app, /function logEntrySignature\(entry\)/);
  assert.match(app, /function appendLogEntryNode\(feed,entry,lastAge\)/);
  assert.match(app, /if\(renderedFeedElement===feed&&Array\.isArray\(previous\)&&supportsIncrementalDom\)/);
  assert.match(app, /for\(let candidate=359;candidate>0;candidate--\)/);
  assert.match(app, /renderedLogSnapshot=signatures;renderedFeedElement=feed/);
  assert.doesNotMatch(html, /id="lifeFeed"[^>]*aria-live=/);
  assert.match(app, /announceLifeEvents\(entries,appendFrom\)/);
  assert.match(read('sw.js'), /hayah-shell-v224/);
});


test('اقتصاد الشركات يختلف حسب الصناعة ويظهر أثره في التقرير المالي', () => {
  assert.ok(app.includes("const BUSINESS_INDUSTRY_PROFILES = {"));
  assert.ok(app.includes("function businessIndustryProfile(industry)"));
  assert.ok(app.includes("industryProfile.revenueMultiplier"));
  assert.ok(app.includes("industryProfile.operatingCostMultiplier"));
  assert.ok(app.includes("industryProfile.unitCostMultiplier"));
  assert.ok(app.includes("industryRevenueMultiplier"));
  assert.ok(app.includes("industryOperatingCostMultiplier"));
  assert.ok(app.includes("industryUnitCostMultiplier"));
  assert.ok(app.includes("معاملات القطاع: الإيرادات"));
  assert.match(read('sw.js'), /hayah-shell-v224/);
});


test('تمويل النشاط مستقل لكل شركة ويُحتسب مرة واحدة مع حماية الحفظ القديم', () => {
  [
    "function businessCreditBalance(business)",
    "function businessCreditLimit(business)",
    "function businessCreditRate(business)",
    "function businessCreditMenu()",
    "function borrowBusinessCredit(amount)",
    "function repayBusinessCredit(amount)",
    "entity.credit=principal+accruedInterest>0?",
    "businessLoanInterestPaid",
    "businessLoanInterestAccrued",
    "businessLoanBalance",
    "Number(credit.lastInterestAge)!==Number(state.age)",
    "grossProceeds+companyCash-creditBalance",
    "سداد كامل الرصيد",
    "return {version:1,lifeId:"
  ].forEach(fragment => assert.ok(app.includes(fragment), 'missing business credit behavior: ' + fragment));
  const annualSimulation = functionSource('simulateBusinessEntityYear', 'advanceAge');
  assert.ok(annualSimulation.includes("const costs=operatingCostsTotal+productResult.upfrontCosts+businessLoanInterest"));
  assert.ok(annualSimulation.includes("const cashDelta=revenue-operatingCostsTotal-businessLoanInterestPaid-corporateTaxPaidFromCash"));
  assert.ok(read('sw.js').includes("hayah-shell-v224"));
});


test('الخزينة المستقلة تفصل نقدية كل شركة عن رصيد المالك وتحافظ على الحفظ القديم', () => {
  [
    "function businessUsesSeparateTreasury(business)",
    "function businessTreasuryBalance(business)",
    "function adjustBusinessTreasury(business,amount)",
    "function spendBusinessTreasury(business,amount)",
    "function activateBusinessTreasury(amount)",
    "function transferBusinessCapital(direction,amount)",
    "function businessTreasuryMenu()",
    "entity.treasuryMode='shared'",
    "entity.treasuryMode='separate'",
    "pendingOwnerContributions",
    "pendingOwnerWithdrawals",
    "openingCashBalance",
    "closingCashBalance",
    "treasuryMode:'separate',cashBalance:0",
    "grossProceeds+companyCash-creditBalance",
    "خزينة النشاط ورأس المال"
  ].forEach(fragment => assert.ok(app.includes(fragment), 'missing separate treasury behavior: ' + fragment));
  const annualSimulation = functionSource('simulateBusinessEntityYear', 'advanceAge');
  assert.ok(annualSimulation.includes("businessTreasuryBalance(business)+revenue-operatingCostsTotal"));
  assert.ok(annualSimulation.includes("const cashDelta=revenue-operatingCostsTotal-businessLoanInterestPaid-corporateTaxPaidFromCash"));
  assert.ok(annualSimulation.includes("treasuryMode:separateTreasury?'separate':'shared'"));
  assert.match(read('sw.js'), /hayah-shell-v224/);
});


test('ضرائب الشركات تُحسب على الربح الموجب وتُسدد من خزينة النشاط مع ترحيل المتأخرات', () => {
  [
    "corporateTaxRate:.12",
    "corporateTaxRate:.16",
    "function businessTaxLiability(business)",
    "function repayBusinessTax(amount)",
    "business.taxLiability=corporateTaxAccrued",
    "const corporateTax=Math.max(0,Math.round(taxableProfit*corporateTaxRate))",
    "const corporateTaxPaidFromCash=Math.min(totalTaxDue,Math.max(0,Math.floor(cashAfterInterest)))",
    "business.pendingTaxPayments=0",
    "سداد '+Math.round(ratio*100)+'% من المتأخرات الضريبية",
    "corporateTaxPaid,corporateTaxAccrued,taxLiability"
  ].forEach(fragment => assert.ok(app.includes(fragment), 'missing company tax behavior: ' + fragment));
  const annualSimulation = functionSource('simulateBusinessEntityYear', 'advanceAge');
  assert.ok(annualSimulation.includes('const taxableProfit=Math.max(0,Math.round(preTaxProfit))'));
  assert.ok(annualSimulation.includes('const cashDelta=revenue-operatingCostsTotal-businessLoanInterestPaid-corporateTaxPaidFromCash'));
  assert.ok(annualSimulation.includes('const costs=operatingCostsTotal+productResult.upfrontCosts+businessLoanInterest+corporateTax'));
  assert.match(read('sw.js'), /hayah-shell-v224/);
});

test('مسيرة القتال تدير ثلاث جولات وتستعيد النزال المحفوظ مع الحفظ القديم', () => {
  const catalogStart = app.indexOf('const combatMoveCatalog=[');
  const catalogEnd = app.indexOf('];' + String.fromCharCode(10) + 'const combatTacticCatalog=', catalogStart);
  assert.ok(catalogStart >= 0 && catalogEnd > catalogStart, 'the combat move catalogue should remain available');
  const catalogText = app.slice(catalogStart, catalogEnd);
  const ids = catalogText.split("{id:'").slice(1).map(part => part.split("'")[0]);
  assert.equal(ids.length, 50, 'the expanded move catalogue should contain fifty distinct moves');
  assert.equal(new Set(ids).size, ids.length, 'every move should have a unique id');
  for (const id of ['low-kick', 'pivot-counter', 'shell-defense', 'burst-combo', 'last-round-read',
    'angle-pivot', 'low-line-kick', 'shoulder-shell', 'rhythm-barrage', 'champion-plan']) {
    assert.ok(ids.includes(id), 'missing original combat move ' + id);
  }
  assert.ok(catalogText.includes('style:'), 'moves should retain their own fighting style');
  assert.ok(catalogText.includes('strongAgainst:'), 'moves should retain their counter data');
  assert.ok(app.includes('move.strongAgainst===opponent.style'));
  assert.ok(app.includes('const combatTacticCatalog=['));
  assert.ok(app.includes('function combatBoutRoundMenu()'));
  assert.ok(app.includes('function chooseCombatReaction(reactionId)'));
  assert.ok(app.includes('const combatReactionCatalog=['));
  assert.ok(app.includes('function combatReactionEffect(opponentStyle,reactionId)'));
  assert.ok(app.includes('function resolveCombatRound(actionId)'));
  assert.ok(app.includes('session.roundHistory.length>=3'));
  assert.ok(app.includes("id:'tactic-breathe'"));
  assert.ok(app.includes("energyRecovery:14,oncePerBout:true"));
  assert.ok(app.includes('c.pendingBout=normalizePendingCombatBout(c.pendingBout)'));
  assert.ok(app.includes('كمّل الجولات الثلاث'));
  assert.ok(app.includes('c.pendingBout=null'));

  const energyHelper = functionSource('combatRoundEnergy', 'combatOpponentStyleForRound');
  const energyContext = { clamp: (value,min=0,max=100) => Math.max(min,Math.min(max,Math.round(Number(value)||0))) };
  vm.runInNewContext(energyHelper + `
    globalThis.normal=combatRoundEnergy(70,{power:34},'street');
    globalThis.league=combatRoundEnergy(70,{power:20,energyCost:0,energyRecovery:14},'league');
    globalThis.recovered=combatRoundEnergy(94,{power:20,energyCost:0,energyRecovery:14},'street');
    globalThis.capped=combatRoundEnergy(98,{power:20,energyCost:0,energyRecovery:14},'street');
    globalThis.reacted=combatRoundEnergy(70,{power:34},'street',3);
    globalThis.maxReactionCost=combatRoundEnergy(100,{energyCost:30,energyRecovery:0},'league',4);
  `, energyContext);
  assert.equal(JSON.stringify(energyContext.normal),JSON.stringify({before:70,moveCost:6,reactionCost:0,energyCost:6,energyRecovery:0,after:64}));
  assert.equal(JSON.stringify(energyContext.league),JSON.stringify({before:70,moveCost:2,reactionCost:0,energyCost:2,energyRecovery:14,after:82}));
  assert.equal(JSON.stringify(energyContext.recovered),JSON.stringify({before:94,moveCost:0,reactionCost:0,energyCost:0,energyRecovery:14,after:100}));
  assert.equal(JSON.stringify(energyContext.capped),JSON.stringify({before:98,moveCost:0,reactionCost:0,energyCost:0,energyRecovery:14,after:100}));
  assert.equal(JSON.stringify(energyContext.reacted),JSON.stringify({before:70,moveCost:6,reactionCost:3,energyCost:9,energyRecovery:0,after:61}));
  assert.equal(JSON.stringify(energyContext.maxReactionCost),JSON.stringify({before:100,moveCost:32,reactionCost:4,energyCost:36,energyRecovery:0,after:64}));
  assert.match(app,/session\.roundHistory\.some\(item=>item\.actionId===move\.id\)/,
    'a once-per-bout recovery tactic must be rejected if already used');

  const varietyHelper = functionSource('combatStyleVarietyModifier', 'combatOpponentStyleForRound');
  const varietyContext = {};
  vm.runInNewContext(varietyHelper + `
    globalThis.modifiers = [
      combatStyleVarietyModifier([], 'سرعة'),
      combatStyleVarietyModifier([{style:'قوة'}], 'سرعة'),
      combatStyleVarietyModifier([{style:'سرعة'}], 'سرعة'),
      combatStyleVarietyModifier([{style:'سرعة'},{style:'قوة'}], 'سرعة'),
      combatStyleVarietyModifier([{style:'سرعة'},{style:'سرعة'}], 'سرعة'),
      combatStyleVarietyModifier([{style:'قوة'},{style:'تقنية'},{style:'سرعة'}], 'سرعة'),
      combatStyleVarietyModifier([{style:'قوة'},{style:'تقنية'}], 'سرعة'),
      combatStyleVarietyModifier([{style:'سرعة'}], 'غير معروف')
    ];
  `, varietyContext);
  assert.deepEqual(Array.from(varietyContext.modifiers), [0,2,-3,-3,-6,-3,2,0],
    'style variety should reward a fresh style and penalize repetition across the last two rounds');
  const resolveRoundSource = functionSource('resolveCombatRound', 'resolveCombatBout');
  assert.match(resolveRoundSource, /const styleVarietyModifier=combatStyleVarietyModifier\(session\.roundHistory,move\.style\)/);
  assert.match(resolveRoundSource, /counterBonus\+styleVarietyModifier-playerAdaptationPenalty\+communityAdjustment/);
  assert.match(resolveRoundSource, /const moveAdaptation=combatMoveAdaptationEffect\(opponent,session\.roundHistory/);
  assert.match(resolveRoundSource, /styleVarietyModifier,/);
  assert.match(resolveRoundSource, /combatOpponentIntent\(opponent,round,session\.lastStyle,session\.roundHistory,session\.communityFighterId,rememberedRival\?rememberedRival\.styleMemory:\[\],rememberedRival\?rememberedRival\.moveMemory:\[\]\)/);
  assert.match(resolveRoundSource, /intent\.read/);
  const roundMenuSource = functionSource('combatBoutRoundMenu', 'chooseCombatReaction');
  assert.match(roundMenuSource, /combatStyleVarietyModifier\(session\.roundHistory,move\.style\)/);
  assert.match(roundMenuSource, /تنويع الأسلوب/);
  assert.match(roundMenuSource, /combatOpponentIntent\(opponent,round,session\.lastStyle,session\.roundHistory,session\.communityFighterId,rememberedRival\?rememberedRival\.styleMemory:\[\],rememberedRival\?rememberedRival\.moveMemory:\[\]\)/);
  assert.match(roundMenuSource, /intent\.read/);


  const reactionHelpers = app.slice(app.indexOf('const combatMemoryStyles=['), app.indexOf('const combatMoveMasteryThresholds='));
  const reactionContext = { clamp: (value,min=0,max=100) => Math.max(min,Math.min(max,Math.round(Number(value)||0))) };
  vm.runInNewContext(reactionHelpers + `
    globalThis.powerGuard=combatReactionEffect('قوة','guard');
    globalThis.speedDodge=combatReactionEffect('سرعة','dodge');
    globalThis.techniqueCounter=combatReactionEffect('تقنية','counter');
    globalThis.powerCounter=combatReactionEffect('قوة','counter');
    globalThis.intent=combatOpponentIntent({style:'قوة'},1,'');
  `, reactionContext);
  assert.equal(reactionContext.powerGuard.quality,'ممتاز');
  assert.equal(reactionContext.powerGuard.playerBonus,8);
  assert.equal(reactionContext.powerGuard.opponentBonus,-7);
  assert.equal(reactionContext.powerGuard.energyCost,1);
  assert.equal(reactionContext.speedDodge.quality,'ممتاز');
  assert.equal(reactionContext.techniqueCounter.quality,'ممتاز');
  assert.equal(reactionContext.powerCounter.quality,'مكشوف');
  assert.equal(reactionContext.intent.title,'ضربة ثقيلة');

  const adaptiveContext = {};
  vm.runInNewContext(reactionHelpers + `
    globalThis.repeatedElite=combatOpponentStyleForRound({style:'قوة',rating:72},3,'سرعة',[{style:'سرعة'},{style:'سرعة'}]);
    globalThis.repeatedNovice=combatOpponentStyleForRound({style:'قوة',rating:42},3,'سرعة',[{style:'سرعة'},{style:'سرعة'}]);
    globalThis.mixedElite=combatOpponentStyleForRound({style:'قوة',rating:72},3,'سرعة',[{style:'قوة'},{style:'سرعة'}]);
    globalThis.mixedExperienced=combatOpponentStyleForRound({style:'قوة',rating:55},3,'سرعة',[{style:'قوة'},{style:'سرعة'}]);
    globalThis.mixedNovice=combatOpponentStyleForRound({style:'قوة',rating:42},3,'سرعة',[{style:'قوة'},{style:'سرعة'}]);
    globalThis.secondRound=combatOpponentStyleForRound({style:'قوة',rating:25},2,'سرعة',[]);
    globalThis.repeatedRead=combatOpponentIntent({style:'قوة',rating:72},3,'سرعة',[{style:'سرعة'},{style:'سرعة'}]).read;
    globalThis.mixedRead=combatOpponentIntent({style:'قوة',rating:72},3,'سرعة',[{style:'قوة'},{style:'سرعة'}]).read;
    globalThis.legacyRead=combatOpponentIntent({style:'قوة',rating:52},3,'سرعة',[{style:'سرعة'}]).read;
    globalThis.noviceMixedRead=combatOpponentIntent({style:'قوة',rating:42},3,'سرعة',[{style:'قوة'},{style:'سرعة'}]).read;
  `, adaptiveContext);
  assert.deepEqual([
    adaptiveContext.repeatedElite,
    adaptiveContext.repeatedNovice,
    adaptiveContext.mixedElite,
    adaptiveContext.mixedExperienced,
    adaptiveContext.mixedNovice,
    adaptiveContext.secondRound
  ], ['تقنية','قوة','تقنية','دفاع','قوة','تقنية'],
    'opponent awareness should use the last two styles while preserving round-two behavior');
  assert.match(adaptiveContext.repeatedRead,/لاحظ المنافس تكرار أسلوبك/);
  assert.match(adaptiveContext.mixedRead,/يراقب آخر اختيار لك/);
  assert.match(adaptiveContext.legacyRead,/سجل الجولات غير مكتمل.*استجابة احتياطية/,
    'legacy bouts with incomplete history must explain the fallback response');
  assert.match(adaptiveContext.noviceMixedRead,/استجابة محدودة/,
    'novice opponents should not claim to use their usual style when taking a fallback response');

  const helper = functionSource('combatDifficultyLabel', 'createCombatCareer');
  const context = { clamp: value => Math.max(0, Math.min(100, Number(value) || 0)) };
  vm.runInNewContext(helper + ';globalThis.levels=[combatDifficultyLabel(10),combatDifficultyLabel(45),combatDifficultyLabel(62),combatDifficultyLabel(90)];', context);
  assert.deepEqual(Array.from(context.levels), ['سهل', 'متوسط', 'صعب', 'نخبة']);

  const pendingHelpers = app.slice(app.indexOf('const combatMemoryStyles=['), app.indexOf('function createCombatCareer('));
  const pendingContext = { clamp: (value,min=0,max=100) => Math.max(min,Math.min(max,Math.round(value))) };
  vm.runInNewContext(pendingHelpers + `
    globalThis.styles=[
      combatOpponentStyleForRound({style:'قوة'},1,''),
      combatOpponentStyleForRound({style:'قوة'},2,'سرعة'),
      combatOpponentStyleForRound({style:'قوة'},3,'سرعة')
    ];
    globalThis.pending=normalizePendingCombatBout({
      mode:'league',feePaid:true,
      opponent:{name:'منافس تجريبي',style:'قوة',weakTo:'سرعة',emoji:'💪',rating:52},
      round:3,playerScore:104,opponentScore:99,lastStyle:'دفاع',reactionId:'counter',
      roundHistory:[
        {actionId:'quick-jab',actionTitle:'لكمة خاطفة',style:'سرعة',styleVarietyModifier:2,opponentStyle:'قوة',playerScore:55,opponentScore:49,energyBefore:100,energyCost:6,energyRecovery:0,energyAfter:94},
        {actionId:'tactic-guard',actionTitle:'حراسة متحركة',style:'دفاع',opponentStyle:'تقنية',playerScore:49,opponentScore:50}
      ]
    });
    globalThis.invalidLeague=normalizePendingCombatBout({
      mode:'league',feePaid:false,
      opponent:{name:'منافس',style:'قوة',weakTo:'سرعة',rating:40}
    });
    globalThis.legacyPending=normalizePendingCombatBout({
      mode:'street',opponent:{name:'منافس قديم',style:'سرعة',weakTo:'تقنية',rating:40},
      roundHistory:[],playerScore:0,opponentScore:0
    });
  `, pendingContext);
  assert.deepEqual(Array.from(pendingContext.styles), ['قوة', 'تقنية', 'قوة']);
  assert.equal(pendingContext.pending.round, 3, 'a saved two-round bout should resume at round three');
  assert.equal(pendingContext.pending.roundHistory.length, 2);
  assert.equal(pendingContext.pending.roundHistory[0].energyAfter,94,
    'saved round energy details should survive pending-bout normalization');
  assert.equal(pendingContext.pending.roundHistory[0].styleVarietyModifier,2,
    'saved style-variety feedback should survive pending-bout normalization');
  assert.equal(pendingContext.pending.roundHistory[1].styleVarietyModifier,0,
    'legacy pending rounds should default the optional style-variety field safely');
  assert.equal(pendingContext.pending.roundHistory[1].energyAfter,null,
    'legacy pending rounds without energy metadata should remain explicitly unknown');
  assert.equal(pendingContext.pending.reactionId,'counter',
    'a selected response should survive reloading a pending round');
  assert.equal(pendingContext.pending.roundHistory[0].reactionId,'',
    'legacy round records without response data should normalize safely');
  assert.equal(pendingContext.legacyPending.reactionId,'',
    'old pending bouts should enter the new reaction phase without losing the bout');
  assert.equal(pendingContext.pending.feePaid, true);
  assert.equal(pendingContext.invalidLeague, null, 'an unpaid league bout must not be restored from imported data');

  assert.ok(app.includes("c.movesKnown=['quick-jab','high-guard']"), 'old fighter saves should retain their known move defaults');
  assert.ok(app.includes("const KEY = 'hekayat_hayah_save_v1';"));
  assert.ok(app.includes('return {version:1,lifeId:'));
});


test('ضرر كل جولة يؤثر على الصحة والإصابة تدريجيًا مع حفظ بيانات الجولات القديمة', () => {
  const impactStart = app.indexOf('function combatRoundImpact(');
  const impactEnd = app.indexOf('const combatMoveMasteryThresholds=', impactStart);
  assert.ok(impactStart >= 0 && impactEnd > impactStart, 'round impact helper should exist');
  const impactSource = app.slice(impactStart, impactEnd);
  const context = { clamp: (value, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(Number(value) || 0))) };
  vm.runInNewContext(impactSource + '\n' +
    'globalThis.safe=combatRoundImpact(30,80,"ممتاز",4);' +
    'globalThis.balanced=combatRoundImpact(55,60,"مقبول",0);' +
    'globalThis.exposed=combatRoundImpact(90,30,"مكشوف",0);' +
    'globalThis.strongDefense=combatRoundImpact(65,95,"مقبول",0);' +
    'globalThis.weakDefense=combatRoundImpact(65,25,"مقبول",0);', context);
  assert.deepEqual(JSON.parse(JSON.stringify(context.safe)), {baseDamage:2,healthDamage:0,injuryGain:0});
  assert.deepEqual(JSON.parse(JSON.stringify(context.balanced)), {baseDamage:4,healthDamage:3,injuryGain:0});
  assert.deepEqual(JSON.parse(JSON.stringify(context.exposed)), {baseDamage:5,healthDamage:7,injuryGain:2});
  assert.ok(context.strongDefense.healthDamage < context.weakDefense.healthDamage,
    'defense should reduce incoming damage for the same opponent and response');
  assert.ok(app.includes('state.stats.health=clamp(healthBefore-appliedHealthDamage)'));
  assert.ok(app.includes('c.injury=clamp(injuryBefore+appliedInjuryGain)'));
  assert.match(app, /healthDamage:roundHealthDamage,roundInjuryGain/);

  const pendingSource = functionSource('normalizePendingCombatBout', 'combatDifficultyLabel');
  const pendingContext = { clamp: (value, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(Number(value) || 0))) };
  vm.runInNewContext(pendingSource + '\n' +
    'globalThis.normalized=normalizePendingCombatBout({mode:"street",opponent:{name:"منافس اختبار",style:"قوة",rating:60},roundHistory:[{actionId:"quick-jab",healthBefore:91,healthDamage:3,healthAfter:88,injuryBefore:2,injuryGain:1,injuryAfter:3}]});' +
    'globalThis.legacy=normalizePendingCombatBout({mode:"street",opponent:{name:"منافس قديم",style:"سرعة",rating:40},roundHistory:[{actionId:"quick-jab"}]});', pendingContext);
  assert.equal(pendingContext.normalized.roundHistory[0].healthDamage, 3);
  assert.equal(pendingContext.normalized.roundHistory[0].healthAfter, 88);
  assert.equal(pendingContext.normalized.roundHistory[0].injuryGain, 1);
  assert.equal(pendingContext.legacy.roundHistory[0].healthBefore, null);
  assert.equal(pendingContext.legacy.roundHistory[0].healthDamage, 0);
  assert.equal(pendingContext.legacy.roundHistory[0].injuryAfter, null);
});


test('محرك ضرر القتال يظل محدودًا ومتوازنًا عبر 61,206 حالة', () => {
  const impactSource = functionSource('combatRoundImpact', 'normalizeCombatInjuryYears');
  const context = {
    clamp(value, min = 0, max = 100) {
      return Math.max(min, Math.min(max, Math.round(Number(value) || 0)));
    }
  };
  vm.runInNewContext(impactSource + '\nglobalThis.impact = combatRoundImpact;', context);
  const qualities = ['ممتاز', 'مقبول', 'مكشوف'];
  let cases = 0;

  for (let rating = 0; rating <= 100; rating++) {
    for (const quality of qualities) {
      for (const timing of [0, 4]) {
        let previousDamage = Infinity;
        for (let defense = 0; defense <= 100; defense++) {
          const result = context.impact(rating, defense, quality, timing);
          assert.ok(result.baseDamage >= 1 && result.baseDamage <= 7);
          assert.ok(result.healthDamage >= 0 && result.healthDamage <= 9);
          assert.ok(result.injuryGain >= 0 && result.injuryGain <= 2);
          assert.ok(result.healthDamage <= previousDamage,
            'raising defense must never increase damage for the same matchup');
          previousDamage = result.healthDamage;
          cases++;
        }
      }
    }
  }

  for (let rating = 0; rating <= 100; rating++) {
    for (let defense = 0; defense <= 100; defense++) {
      for (const timing of [0, 4]) {
        const excellent = context.impact(rating, defense, 'ممتاز', timing);
        const acceptable = context.impact(rating, defense, 'مقبول', timing);
        const exposed = context.impact(rating, defense, 'مكشوف', timing);
        assert.ok(excellent.healthDamage <= acceptable.healthDamage);
        assert.ok(acceptable.healthDamage <= exposed.healthDamage);
      }
    }
  }
  assert.equal(cases, 61206);
});

test('سنوات التعافي تُطبّع بأمان ولا تظل إصابات الحفظ القديم عالقة', () => {
  const helperStart = app.indexOf('function normalizeCombatInjuryYears(');
  const helperEnd = app.indexOf('const combatMoveMasteryThresholds=', helperStart);
  assert.ok(helperStart >= 0 && helperEnd > helperStart, 'injury recovery normalizer should exist');
  const helperSource = app.slice(helperStart, helperEnd);
  const championshipStart = app.indexOf('function normalizeCombatChampionshipHistory(');
  const championshipEnd = app.indexOf('function createCombatCareer(', championshipStart);
  const championshipSource = app.slice(championshipStart, championshipEnd);
  const ensureSource = functionSource('ensureCombatCareer', 'combatRankName');
  const context = {
    state: { combatCareer: null },
    createCombatCareer() { return { injury: 0, injuryYears: 0 }; },
    normalizeCombatMoveMastery() { return {}; },
    normalizeCombatCommunity() { return []; },
    normalizePendingCombatBout() { return null; },
    clamp(value, min = 0, max = 100) {
      return Math.max(min, Math.min(max, Math.round(Number(value) || 0)));
    }
  };
  vm.runInNewContext(helperSource + championshipSource + ensureSource +
    '\nglobalThis.normalizeYears = raw => { state.combatCareer = raw; return ensureCombatCareer().injuryYears; };', context);

  assert.equal(context.normalizeYears({ injury: 30, injuryYears: 1.9 }), 2,
    'fractional legacy duration should round up rather than shorten recovery');
  assert.equal(context.normalizeYears({ injury: 30, injuryYears: 0.4 }), 1);
  assert.equal(context.normalizeYears({ injury: 30, injuryYears: 99 }), 2,
    'corrupt or unbounded durations must not lock a fighter out for many years');
  assert.equal(context.normalizeYears({ injury: 30, injuryYears: -4 }), 0);
  assert.equal(context.normalizeYears({ injury: 30, injuryYears: 'invalid' }), 0);
  assert.equal(context.normalizeYears({ injury: 0, injuryYears: 2 }), 0,
    'a fully healed fighter must not remain blocked by a stale recovery counter');
  assert.ok(app.includes('c.injuryYears=normalizeCombatInjuryYears(c.injuryYears)'));
});

test('التعافي يستمر بعد إيقاف مسيرة القتال ولا يعتمد على المسار النشط', () => {
  const helperStart = app.indexOf('function normalizeCombatInjuryYears(');
  const helperEnd = app.indexOf('const combatMoveMasteryThresholds=', helperStart);
  assert.ok(helperStart >= 0 && helperEnd > helperStart, 'combat recovery helpers should exist');
  const helperSource = app.slice(helperStart, helperEnd);
  const context = {
    clamp(value, min = 0, max = 100) {
      return Math.max(min, Math.min(max, Math.round(Number(value) || 0)));
    }
  };
  vm.runInNewContext(helperSource + '\nglobalThis.advanceRecovery=advanceCombatRecovery;', context);
  assert.equal(context.advanceRecovery(null), false, 'missing legacy fighter records should be ignored safely');

  const singleYear = { injury: 40, injuryYears: 1 };
  assert.equal(context.advanceRecovery(singleYear), true);
  assert.deepEqual(JSON.parse(JSON.stringify(singleYear)), { injury: 0, injuryYears: 0 });

  const twoYears = { injury: 80, injuryYears: 2 };
  assert.equal(context.advanceRecovery(twoYears), false);
  assert.deepEqual(JSON.parse(JSON.stringify(twoYears)), { injury: 52, injuryYears: 1 });
  assert.equal(context.advanceRecovery(twoYears), true);
  assert.deepEqual(JSON.parse(JSON.stringify(twoYears)), { injury: 0, injuryYears: 0 });

  const healed = { injury: 0, injuryYears: 2 };
  assert.equal(context.advanceRecovery(healed), false);
  assert.deepEqual(JSON.parse(JSON.stringify(healed)), { injury: 0, injuryYears: 0 });

  const ageStart = app.indexOf('function advanceAge(){');
  const ageEnd = app.indexOf('\nfunction ', ageStart + 1);
  assert.ok(ageStart >= 0 && ageEnd > ageStart, 'annual progression should be available for inspection');
  const ageSource = app.slice(ageStart, ageEnd);
  const recoveryIndex = ageSource.indexOf('advanceCombatRecovery(state.combatCareer)');
  const activeFighterIndex = ageSource.indexOf("const playerCareerActive=!!(");
  assert.ok(recoveryIndex >= 0 && activeFighterIndex > recoveryIndex,
    'injury recovery must run before and outside the active-fighter-only energy and coach block');
});

test('مجتمع المقاتلين يحفظ العلاقات والتحالفات ويؤثر على النزالات دون كسر الحفظ القديم', () => {
  const profilesStart = app.indexOf('const combatCommunityProfiles=[');
  const helpersEnd = app.indexOf('function combatDifficultyLabel', profilesStart);
  assert.ok(profilesStart >= 0 && helpersEnd > profilesStart, 'the community profiles and normalizer should exist');
  const helpers = app.slice(profilesStart, helpersEnd);
  const context = { clamp: (value, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(Number(value) || 0))) };
  vm.runInNewContext(helpers + "globalThis.community = normalizeCombatCommunity([\n { id: 'adam-mansour', respect: 140, tension: -20, allied: true, lastInteractionAge: 29 },\n { id: 'malek-sherif', respect: 'invalid', tension: 150, allied: 'yes', lastInteractionAge: 'bad' },\n { id: 'unknown-id', respect: 99, tension: 99, allied: true }\n]);\nglobalThis.pending = normalizePendingCombatBout({\n mode: 'street', opponent: { name: 'آدم منصور', style: 'قوة', weakTo: 'سرعة', emoji: '💪', rating: 46 },\n round: 1, playerScore: 0, opponentScore: 0, roundHistory: [],\n startedAge: 30, feePaid: false, communityFighterId: 'adam-mansour'\n});", context);
  assert.equal(context.community.length, 5, 'legacy and imported saves should receive the stable original roster');
  assert.equal(new Set(Array.from(context.community, fighter => fighter.id)).size, 5, 'community ids must be unique');
  assert.equal(context.community[0].respect, 100, 'respect must be bounded to 100');
  assert.equal(context.community[0].tension, 0, 'tension must be bounded to zero');
  assert.equal(context.community[0].allied, true, 'valid alliance state should persist');
  assert.equal(context.community[0].lastInteractionAge, 29);
  assert.equal(context.community[1].respect, 48, 'invalid legacy values should use safe defaults');
  assert.equal(context.community[1].allied, false);
  assert.equal(context.community[1].lastInteractionAge, -1);
  assert.equal(context.pending.communityFighterId, 'adam-mansour', 'saved named opponents should survive a reload');
  assert.ok(app.includes("choice('🤝','مجتمع المقاتلين'"));
  assert.ok(app.includes('function combatCommunityMenu()'));
  assert.ok(app.includes('function combatCommunityFighterMenu(fighterId)'));
  assert.ok(app.includes('function interactCombatFighter(fighterId,action)'));
  assert.ok(app.includes("startCombatBout('street',fighter.id)"));
  assert.ok(app.includes('communityFighter.respect=clamp(communityFighter.respect+(won?10:3))'));
  assert.ok(app.includes('communityFighter.tension=clamp(communityFighter.tension+(won?-12:14))'));
  assert.ok(app.includes('communityFighterId:session&&session.communityFighterId?session.communityFighterId:null'));
  assert.ok(app.includes("const KEY = 'hekayat_hayah_save_v1';"));
  assert.ok(app.includes('return {version:1,lifeId:'));
  assert.match(read('sw.js'), /hayah-shell-v224/);
});
test('المهرجان الأسبوعي يدعم 11 شارة ويطبع بيانات المواسم القديمة دون مكافآت مجانية', () => {
  [
    "function seasonalWeekDetails(date)",
    "function ensureSeasonalEvent()",
    "function seasonalEventMenu()",
    "function claimSeasonalEventBadge(id)",
    "function seasonalEventBadges(event)",
    "data.seasonalEvent=normalizeSeasonalEvent(data.seasonalEvent,data)",
    "data.seasonalEventArchive=normalizeSeasonalEventArchive(data.seasonalEventArchive,data)",
    "seasonalEvent:null,seasonalEventArchive:[]",
    "choice('🏅','مهرجان صُنّاع الحكاية'",
    "function seasonalEventArchiveMenu()",
    "const KEY = 'hekayat_hayah_save_v1';",
    "return {version:1,lifeId:"
  ].forEach(fragment => assert.ok(app.includes(fragment), 'missing weekly event behavior: ' + fragment));

  const helpers = app.slice(app.indexOf('function challengeDateKey('), app.indexOf('function ensureDailyChallengeBoard('));
  const context = {
    state: {
      age:21,
      friends:[{relationshipLevel:80}],
      hobbies:[{}],
      socialMediaPosts:1,
      stats:{smart:44,health:78,happiness:74},
      jobHistory:[{}],specialCareerHistory:[],job:null,specialCareer:null,
      assets:[{}],investments:[{}],pets:[{}],travelHistory:[{}],children:[{}],
      family:[{relationshipLevel:80}],partner:null
    },
    clamp: value => Math.max(0, Math.min(100, Number(value) || 0))
  };
  vm.runInNewContext(helpers + `
    globalThis.week = seasonalWeekDetails(new Date('2026-10-30T12:00:00'));
    globalThis.event = normalizeSeasonalEvent({
      weekId:'2026-W44',startDate:'2026-10-26',endDate:'2026-11-01',
      baseline:{age:20,friends:0,hobbies:0,posts:0,smart:40,health:70,happiness:70,
        careerProgress:0,assets:0,investments:0,pets:0,trips:0,children:0,bestRelationship:70},
      claimed:['chapter','chapter','unknown','friend'],bonusClaimed:false
    },state);
    globalThis.badges = seasonalEventBadges(globalThis.event);
    globalThis.legacyEvent = normalizeSeasonalEvent({
      weekId:'2026-W43',
      baseline:{age:20,friends:0,hobbies:0,posts:0,smart:40,health:70,happiness:70},
      claimed:['chapter','friend','hobby','voice','balance'],bonusClaimed:false
    },state);
  `, context);
  assert.equal(context.week.id, '2026-W44');
  assert.equal(context.week.startDate, '2026-10-26');
  assert.equal(context.week.endDate, '2026-11-01');
  const originalTimezone = process.env.TZ;
  try {
    process.env.TZ = 'Africa/Cairo';
    const cairoContext = {
      state: {age:30,friends:[],hobbies:[],socialMediaPosts:0,stats:{smart:60,health:80,happiness:70}},
      clamp: value => Math.max(0, Math.min(100, Number(value) || 0))
    };
    vm.runInNewContext(helpers + "globalThis.cairoWeek=seasonalWeekDetails(new Date(2026,9,30,12));", cairoContext);
    assert.equal(cairoContext.cairoWeek.id, '2026-W44', 'DST changes must not shift the ISO week');
    assert.equal(cairoContext.cairoWeek.startDate, '2026-10-26');
  } finally {
    if (originalTimezone === undefined) delete process.env.TZ;
    else process.env.TZ = originalTimezone;
  }
  vm.runInNewContext(helpers + "globalThis.newYearWeek=seasonalWeekDetails(new Date('2027-01-01T12:00:00'));", context);
  assert.equal(context.newYearWeek.id, '2026-W53', 'ISO weeks spanning New Year must keep the ISO year');
  assert.deepEqual(Array.from(context.event.claimed), ['chapter','friend']);
  assert.deepEqual(Array.from(context.badges.map(badge=>badge.id)), [
    'chapter','friend','hobby','voice','balance','career','asset','invest','pet','travel','family'
  ]);
  assert.ok(context.badges.every(badge=>badge.done));
  assert.equal(context.legacyEvent.claimed.length, 5, 'legacy five-badge records should remain readable');
  assert.equal(context.legacyEvent.baseline.assets, 1, 'missing legacy counters should use the saved life as baseline');
  assert.equal(context.legacyEvent.baseline.investments, 1);
  assert.equal(context.legacyEvent.baseline.pets, 1);
  assert.equal(context.legacyEvent.baseline.trips, 1);

  const childContext = {
    state:{age:12,friends:[],hobbies:[],socialMediaPosts:0,stats:{smart:44,health:75,happiness:72},
      jobHistory:[],specialCareerHistory:[],assets:[],investments:[],pets:[],travelHistory:[],children:[],family:[],partner:null},
    clamp:value=>Math.max(0,Math.min(100,Number(value)||0)),
    childEvent:{weekId:'2026-W44',baseline:{age:12,friends:0,hobbies:0,posts:0,smart:40,health:70,happiness:70,
      careerProgress:0,assets:0,investments:0,pets:0,trips:0,children:0,bestRelationship:0}}
  };
  vm.runInNewContext(helpers+'globalThis.childBadges=seasonalEventBadges(childEvent);',childContext);
  assert.equal(childContext.childBadges.length,11);
  assert.ok(childContext.childBadges.some(badge=>badge.id==='learning'&&badge.done));
  assert.ok(!childContext.childBadges.some(badge=>badge.id==='voice'));

  const archive=Array.from({length:10},(_,index)=>({weekId:'2026-W'+String(index+1).padStart(2,'0'),claimed:['chapter','family','travel'],bonusClaimed:false}));
  const archiveContext={archive,state:context.state,clamp:context.clamp};
  vm.runInNewContext(helpers+'globalThis.normalizedArchive=normalizeSeasonalEventArchive(archive,state);',archiveContext);
  assert.equal(archiveContext.normalizedArchive.length,8);
  assert.ok(archiveContext.normalizedArchive[0].claimed.includes('family'));
  assert.match(read('sw.js'), /hayah-shell-v224/);
});


test('السوشيال ميديا تحفظ صدى الجمهور وتدعم مسار SoundCloud دون كسر حفظ v1', () => {
  assert.match(app, /function normalizeSocialFeed\(raw\)/);
  assert.match(app, /data\.socialFeed=normalizeSocialFeed\(data\.socialFeed\)/);
  assert.match(app, /socialFeed:\[\]/);
  assert.match(app, /function socialAudienceFeedMenu\(platformId\)/);
  assert.match(app, /function socialPostDetailMenu\(postId\)/);
  assert.match(app, /function offerSoundCloudTrackToLabel\(platformId='soundcloud'\)/);
  assert.match(app, /نشر مقطع صوتي/);
  assert.match(app, /التعاون مع فنان/);
  assert.match(app, /choice\('💬','صدى الجمهور'/);
  assert.match(app, /state\.socialFeed=normalizeSocialFeed\(\[\.\.\.\(Array\.isArray\(state\.socialFeed\)\?state\.socialFeed:\[\]\),post\]\)/);
  assert.match(app, /const KEY = 'hekayat_hayah_save_v1';/);
  assert.match(app, /return \{version:1,lifeId:/);

  const normalizer = functionSource('normalizeSocialFeed', 'buildSocialReactions');
  const context = {
    SOCIAL_PLATFORM_CATALOG: [{id:'instagram',title:'Instagram'}]
  };
  vm.runInNewContext(normalizer + "\nglobalThis.normalized=normalizeSocialFeed([{id:'old',platformId:'instagram',title:'منشور قديم',age:22,likes:4,reactions:[{name:'ليلى',text:'جميل',tone:'positive'}]},null,{id:'bad',title:'',reactions:[]}]);", context);
  assert.equal(context.normalized.length, 1);
  assert.equal(context.normalized[0].platformTitle, 'Instagram');
  assert.equal(context.normalized[0].reactions[0].name, 'ليلى');

  const many = Array.from({length:40}, (_,index)=>({id:'p'+index,title:'منشور '+index,platformId:'instagram'}));
  const limitedContext = {SOCIAL_PLATFORM_CATALOG: context.SOCIAL_PLATFORM_CATALOG, input: many};
  vm.runInNewContext(normalizer + "\nglobalThis.limited=normalizeSocialFeed(input);", limitedContext);
  assert.equal(limitedContext.limited.length, 30);
  assert.equal(limitedContext.limited[0].id, 'p10');
  assert.match(read('sw.js'), /hayah-shell-v224/);
});


test('الشريط السفلي والإحصائيات بعرض التطبيق الكامل دون تحريك نصف الشاشة', () => {
  assert.match(css, /#app > \.bottom-dock\{[\s\S]*?transform:none!important/);
  assert.match(css, /#app > \.bottom-dock > \.stats\{[\s\S]*?width:100%!important/);
  assert.match(css, /#app > \.bottom-dock > \.nav\{[\s\S]*?width:100%!important/);
  assert.match(css, /#app > \.feed\{[\s\S]*?min-height:0!important/);
  assert.match(read('sw.js'), /hayah-shell-v224/);
});

test('الواجهة الرئيسية منظمة وتعرض عناوين أحداث الحياة مع الحفاظ على الهوية العربية', () => {
  assert.match(html, /class="story-heading"/);
  assert.match(html, /id="lifeMeta" class="story-year" aria-live="polite"/);
  assert.match(html, /<h1>حكايتك سنة ورا سنة<\/h1>/);
  assert.match(css, /\.story-heading\{/);
  assert.match(css, /\.logtitle\{display:block!important/);
  assert.match(css, /grid-template-columns:repeat\(2,minmax\(0,1fr\)\)!important/);
  assert.match(css, /body\.theme-dark \.story-heading/);
  assert.match(css, /body\.theme-gold \.story-heading/);
});


test('كتالوج القتال يضم 50 حركة أصلية بمعرّفات وخصائص متسقة مع الرتب القديمة', () => {
  const block = app.match(/const combatMoveCatalog=\[([\s\S]*?)\n\];/);
  assert.ok(block, 'combat move catalog should remain data-driven');
  const context = {};
  vm.runInNewContext('globalThis.moves = [' + block[1] + '];', context);
  const moves = Array.from(context.moves);
  const ids = moves.map(move => move.id);
  assert.equal(moves.length, 50, 'the catalog should contain 40 existing moves plus 10 additional moves');
  assert.equal(new Set(ids).size, moves.length, 'every move id must be unique');
  const legacyIds = [
    'quick-jab','high-guard','footwork','counter-read','body-force',
    'clinch-control','iron-guard','flash-step','champion-finish','ring-general',
    'low-kick','pivot-counter','shell-defense','burst-combo','last-round-read',
    'angle-pivot','low-line-kick','shoulder-shell','rhythm-barrage','champion-plan'
  ];
  legacyIds.forEach(id => assert.ok(ids.includes(id), 'legacy move id must remain available: ' + id));
  const newIds = [
    'inside-slip','rear-angle-check','frame-wall','clinch-turn','overhand-arc',
    'tempo-break','body-lock-shift','guard-split','last-minute-shell','champion-angle',
    'step-in-feint','shoulder-frame','wrist-turn','body-angle-shift','distance-check',
    'forearm-wall','level-switch','counter-spiral','rhythm-cut','champion-lock'
  ];
  newIds.forEach(id => assert.ok(ids.includes(id), 'new move should be registered: ' + id));
  const rangeAwareIds = [
    'snap-teep','wrist-control','elbow-shell','double-level-change','angle-burst',
    'corner-exit','counter-knee','pivot-throw','range-breaker','last-breath-shell',
    'step-in-feint','shoulder-frame','wrist-turn','body-angle-shift','distance-check',
    'forearm-wall','level-switch','counter-spiral','rhythm-cut','champion-lock'
  ];
  rangeAwareIds.forEach(id => assert.ok(ids.includes(id), 'range-aware move should be registered: ' + id));
  for (const move of moves.filter(item => rangeAwareIds.includes(item.id))) {
    assert.ok(['close','mid','long'].includes(move.range), move.id + ' needs an explicit range');
    assert.ok(Number.isInteger(move.energyCost) && move.energyCost >= 0 && move.energyCost <= 30, move.id + ' needs a bounded energy cost');
  }
  const rangeSource = functionSource('combatMoveRange', 'combatDistanceEffects');
  const rangeContext = {};
  vm.runInNewContext(rangeSource + String.fromCharCode(10) +
    "globalThis.ranges=[combatMoveRange({id:'quick-jab',range:'close'}),combatMoveRange({id:'quick-jab'}),combatMoveRange({id:'unknown',range:'invalid'})];", rangeContext);
  assert.deepEqual(Array.from(rangeContext.ranges), ['close','long','mid'],
    'explicit range metadata should override legacy id-based defaults');
  for (const move of moves) {
    assert.ok(['سرعة','قوة','دفاع','تقنية'].includes(move.style), move.id + ' needs a known style');
    assert.ok(['سرعة','قوة','دفاع','تقنية'].includes(move.strongAgainst), move.id + ' needs a valid counter style');
    assert.ok(Number.isFinite(move.power) && move.power >= 25 && move.power <= 75, move.id + ' power should stay balanced');
    assert.ok(Number.isInteger(move.rank) && move.rank >= 0 && move.rank <= 4, move.id + ' rank should be supported');
    assert.ok(Number.isFinite(move.cost) && move.cost >= 0, move.id + ' cost should be valid');
    assert.ok(typeof move.title === 'string' && move.title.length > 0 && typeof move.desc === 'string' && move.desc.length > 0);
  }
  assert.match(app, /const KEY = 'hekayat_hayah_save_v1';/);
  assert.match(app, /return \{version:1,lifeId:/);
});

test('مؤشرات الإحصاءات تعرض قيمة مفهومة لقارئات الشاشة وتتحدث مع الحالة', () => {
  const panel = { innerHTML: '' };
  const context = {
    state: {
      status: 'حي',
      age: 34,
      stats: { happiness: 67, health: 52, smart: 88, looks: 19 },
      boostUsedAge: null
    },
    uiSettings: { boosts: true },
    clamp: (value, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(Number(value) || 0))),
    $: id => id === 'statsPanel' ? panel : null
  };
  const source = functionSource('renderStats', 'logEntrySignature');
  vm.runInNewContext(source + '\nrenderStats();', context);
  assert.equal((panel.innerHTML.match(/role="progressbar"/g) || []).length, 4,
    'the four core life stats should expose progressbar semantics');
  for (const [label, value] of [['السعادة', 67], ['الصحة', 52], ['الذكاء', 88], ['المظهر', 19]]) {
    assert.ok(panel.innerHTML.includes('aria-label="' + label + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + value + '" aria-valuetext="' + value + ' من 100"'),
      label + ' should expose its current value and range to assistive technology');
  }
  context.state.stats.happiness = 27;
  vm.runInNewContext(source + '\nrenderStats();', context);
  assert.ok(panel.innerHTML.includes('aria-valuenow="27" aria-valuetext="27 من 100"'),
    'accessible values should update after a stat change');
});


test('إتقان الحركات يتدرج بالاستخدام ويُطبع بأمان في الحفظ القديم', () => {
  const catalogStart = app.indexOf('const combatMoveCatalog=[');
  const catalogEnd = app.indexOf('];' + String.fromCharCode(10) + 'const combatTacticCatalog=', catalogStart);
  assert.ok(catalogStart >= 0 && catalogEnd > catalogStart, 'combat move catalog should be available to the mastery normalizer');
  const catalogSource = app.slice(catalogStart + 'const combatMoveCatalog=['.length, catalogEnd);
  const helpersStart = app.indexOf('const combatMoveMasteryThresholds=');
  const helpersEnd = app.indexOf('function normalizePendingCombatBout(', helpersStart);
  assert.ok(helpersStart >= 0 && helpersEnd > helpersStart, 'move mastery helpers should remain grouped');
  const helperSource = app.slice(helpersStart, helpersEnd);
  const injuryYearsStart = app.indexOf('function normalizeCombatInjuryYears(');
  const injuryYearsEnd = app.indexOf('const combatMoveMasteryThresholds=', injuryYearsStart);
  const injuryYearsSource = app.slice(injuryYearsStart, injuryYearsEnd);
  const careerSource = functionSource('ensureCombatCareer', 'combatRankName');
  const championshipStart = app.indexOf('function normalizeCombatChampionshipHistory(');
  const championshipEnd = app.indexOf('function createCombatCareer(', championshipStart);
  const championshipSource = app.slice(championshipStart, championshipEnd);
  const context = {
    state: { yearCount: 10, combatCareer: { movesKnown: ['quick-jab', 'high-guard'],
      moveMastery: { 'quick-jab': 8, 'high-guard': -3, 'removed-move': 99 } } },
    clamp: (value, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(Number(value) || 0))),
    normalizeCombatCommunity: () => [],
    normalizePendingCombatBout: value => value
  };
  vm.runInNewContext(injuryYearsSource + String.fromCharCode(10) + 'const combatMoveCatalog=[' + catalogSource + '];' + String.fromCharCode(10) + helperSource + String.fromCharCode(10) + championshipSource + String.fromCharCode(10) +
    careerSource + String.fromCharCode(10) + 'globalThis.career=ensureCombatCareer();' +
    'globalThis.levels=[0,2,3,7,8,14,15,24,25,100].map(combatMoveMasteryLevel);' +
    'globalThis.bonuses=[0,3,8,15,25,100].map(combatMoveMasteryBonus);', context);
  assert.deepEqual(Array.from(context.levels), [0,0,1,1,2,2,3,3,4,4]);
  assert.deepEqual(Array.from(context.bonuses), [0,2,4,6,8,8]);
  assert.deepEqual(JSON.parse(JSON.stringify(context.career.moveMastery)), { 'quick-jab': 8 },
    'unknown moves and invalid counters should be discarded while valid mastery survives');
  assert.equal(context.career.lastMovePracticeYear, -1,
    'legacy fighter saves should receive an unused yearly practice slot');
  context.state.combatCareer.lastMovePracticeYear = 9999;
  vm.runInNewContext(careerSource + String.fromCharCode(10) + 'globalThis.reloaded=ensureCombatCareer();', context);
  assert.equal(context.reloaded.lastMovePracticeYear, 10,
    'a corrupt future practice year must be bounded to the current game year');
  assert.ok(app.includes('moveMastery:{}'), 'new fighter careers should initialize an empty mastery map');
  assert.ok(app.includes('c.moveMastery=normalizeCombatMoveMastery(c.moveMastery,c.movesKnown)'),
    'legacy fighter saves should receive a normalized optional mastery map');
  assert.ok(app.includes('masteryUses:nextMasteryUses'),
    'round history should retain the mastery level used during each saved round');
  assert.ok(app.includes("achievement('إتقان حركة قتالية:"),
    'mastery milestones should become part of the character story');
  assert.match(read('sw.js'), /hayah-shell-v224/);
});

test('تدريب حركة محددة يرفع الإتقان مرة سنويًا ويحترم المدرب والحفظ القديم', () => {
  const source = functionSource('practiceCombatMove', 'learnCombatMove');
  const career = {
    movesKnown: ['quick-jab'],
    moveMastery: { 'quick-jab': 2 },
    energy: 80,
    injury: 0,
    injuryYears: 0,
    lastMovePracticeYear: -1,
    coach: { level: 2 },
    pendingBout: null
  };
  const state = {
    specialCareer: { id: 'fighter' },
    combatCareer: career,
    bank: 5000,
    yearCount: 10
  };
  const metrics = { info: [], logs: [], achievements: [], saves: 0, renders: 0, menus: 0, closed: 0 };
  const context = {
    state,
    validState: () => true,
    ensureCombatCareer: () => career,
    combatMoveCatalog: [{ id: 'quick-jab', title: 'لكمة خاطفة' }],
    combatMoveMasteryLevel: uses => uses >= 25 ? 4 : uses >= 15 ? 3 : uses >= 8 ? 2 : uses >= 3 ? 1 : 0,
    combatMoveMasteryLabel: uses => uses >= 25 ? 'خبيرة' : uses >= 15 ? 'متقنة' : uses >= 8 ? 'متمرّسة' : uses >= 3 ? 'ناشئة' : 'جديدة',
    combatMoveMasteryBonus: uses => Math.min(8, (uses >= 25 ? 4 : uses >= 15 ? 3 : uses >= 8 ? 2 : uses >= 3 ? 1 : 0) * 2),
    clamp: (value, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(Number(value) || 0))),
    cash: value => String(value),
    closeModal: () => { metrics.closed++; },
    info: (...args) => { metrics.info.push(args); },
    log: (...args) => { metrics.logs.push(args); },
    achievement: value => { metrics.achievements.push(value); },
    save: () => { metrics.saves++; },
    render: () => { metrics.renders++; },
    practiceCombatMoveMenu: () => { metrics.menus++; }
  };
  vm.runInNewContext(source + String.fromCharCode(10) + 'globalThis.practice=practiceCombatMove;', context);

  context.practice('quick-jab');
  assert.equal(state.bank, 3800, 'a focused practice session should cost 1,200');
  assert.equal(career.energy, 77, 'a focused practice session should consume three energy');
  assert.equal(career.moveMastery['quick-jab'], 4, 'a level-two coach should add two mastery points');
  assert.equal(career.lastMovePracticeYear, 10);
  assert.equal(metrics.achievements.length, 1, 'crossing a mastery threshold should award its achievement');
  assert.equal(metrics.saves, 1);

  context.practice('quick-jab');
  assert.equal(state.bank, 3800, 'the yearly practice limit must prevent a second charge');
  assert.equal(career.moveMastery['quick-jab'], 4);
  assert.equal(metrics.info.length, 1);

  state.yearCount = 11;
  career.coach = null;
  context.practice('quick-jab');
  assert.equal(state.bank, 2600, 'a new game year should unlock one new session');
  assert.equal(career.moveMastery['quick-jab'], 5, 'training without a coach should add one point');
  assert.equal(career.energy, 74);

  state.yearCount = 12;
  career.moveMastery['quick-jab'] = 25;
  context.practice('quick-jab');
  assert.equal(state.bank, 2600, 'an expert move should not consume a paid session');
  assert.equal(metrics.info.length, 2);

  state.yearCount = 13;
  career.pendingBout = { round: 2 };
  context.practice('quick-jab');
  assert.equal(state.bank, 2600, 'training must not interrupt a pending bout');
  assert.equal(metrics.info.length, 3);

  assert.ok(app.includes("choice('🥋','تدريب حركة محددة'"),
    'the fighter training menu should expose focused move practice');
  assert.ok(app.includes('lastMovePracticeYear:-1'),
    'new and legacy fighter records should initialize the optional practice guard');
  assert.ok(app.includes("c.moveMastery[move.id]=next;c.lastMovePracticeYear=year"),
    'the selected move progress and yearly guard should be persisted together');
  assert.ok(app.includes('تقدم الإتقان') && app.includes('25 نقطة إتقان'),
    'the UI should describe progress accurately without counting practice as a live bout');
  assert.ok(app.includes("جلسات تطوير القدرات تكلف 1,500 '+state.place.unit+'. جلسة تدريب الحركة المحددة تكلف 1,200 '+state.place.unit+'."),
    'the training menu should show the separate, correct price for focused move practice');
  assert.match(read('sw.js'), /hayah-shell-v224/);
});

test('مهرجان السينما يسجل كل فيلم مرة واحدة ويكافئ النتائج المؤهلة ويحافظ على الحفظ القديم', () => {
  const start = app.indexOf('function normalizeFilmActor(');
  const end = app.indexOf('function filmStudioMenu(', start);
  assert.ok(start >= 0 && end > start, 'film studio helpers should include the festival circuit');
  const source = app.slice(start, end);
  const metrics = { saves: 0, renders: 0, logs: 0, achievements: 0 };
  const film = { id: 101, title: 'حكاية اختبارية', genre: 'دراما إنسانية',
    criticScore: 100, success: true, actorDrama: false, totalCost: 20000, net: 10000, boxOffice: 30000 };
  const context = {
    filmStudioMenu() {},
    filmGenreCatalog: [{ id: 'drama' }],
    filmBudgetCatalog: [{ id: 'indie' }],
    filmCreativeCatalog: [{ id: 'artistic' }],
    clamp(value, min = 0, max = 100) { return Math.max(min, Math.min(max, Math.round(Number(value) || 0))); },
    validState: () => true,
    closeModal() {},
    info() {},
    choice(...args) { return { args }; },
    modal() {},
    save() { metrics.saves += 1; },
    render() { metrics.renders += 1; },
    log() { metrics.logs += 1; },
    achievement() { metrics.achievements += 1; },
    cash(value) { return String(value); },
    fmt(value) { return String(value); },
    state: {
      age: 38, bank: 100000, fame: 20, reputation: 50,
      specialCareer: { id: 'director', level: 3, record: {} },
      filmStudio: { filmography: [film], projects: 1, totalBudget: 20000, totalBoxOffice: 30000,
        awards: 0, bestCritic: 100, genreFocus: null, actorRoster: [], pendingAuditions: [],
        pendingAuditionGenre: null, pendingProject: null, festivalEntries: [] }
    }
  };
  vm.runInNewContext(source +
    '\nglobalThis.result=filmFestivalResult(state.filmStudio.filmography[0]);' +
    '\nglobalThis.first=submitFilmToFestival(101);' +
    '\nglobalThis.afterFirst={entries:state.filmStudio.festivalEntries.length,awards:state.filmStudio.awards,bank:state.bank,fame:state.fame,reputation:state.reputation};' +
    '\nglobalThis.second=submitFilmToFestival(101);' +
    '\nglobalThis.afterSecond={entries:state.filmStudio.festivalEntries.length,awards:state.filmStudio.awards,bank:state.bank,fame:state.fame,reputation:state.reputation};', context);
  assert.deepEqual(JSON.parse(JSON.stringify(context.result)),
    { score: 91, outcome: 'award', prize: 2500, awardTitle: 'جائزة لجنة التحكيم', fameGain: 4, reputationGain: 5 });
  assert.equal(context.first, true, 'a completed film should be accepted once');
  assert.deepEqual(JSON.parse(JSON.stringify(context.afterFirst)),
    { entries: 1, awards: 1, bank: 102500, fame: 24, reputation: 55 });
  assert.equal(context.second, false, 'the same film must not be submitted twice');
  assert.deepEqual(JSON.parse(JSON.stringify(context.afterSecond)),
    JSON.parse(JSON.stringify(context.afterFirst)), 'duplicate submission must not grant another prize or reputation');
  assert.deepEqual(metrics, { saves: 1, renders: 1, logs: 1, achievements: 1 },
    'only the first valid submission should persist and award the achievement');

  const legacyContext = {
    filmGenreCatalog: [{ id: 'drama' }],
    filmBudgetCatalog: [{ id: 'indie' }],
    filmCreativeCatalog: [{ id: 'artistic' }],
    clamp(value, min = 0, max = 100) { return Math.max(min, Math.min(max, Math.round(Number(value) || 0))); },
    state: { filmStudio: { filmography: [{ title: 'فيلم قديم بلا معرّف' }] } }
  };
  vm.runInNewContext(source + '\nglobalThis.legacy=ensureFilmStudio();', legacyContext);
  assert.deepEqual(JSON.parse(JSON.stringify(legacyContext.legacy.festivalEntries)), [],
    'legacy studios should receive an empty festival history without changing old films');
});

test('شاشة نهاية الحياة تعلن نفسها كحوار وتحصر التنقل بلوحة المفاتيح', () => {
  const death = functionSource('death', 'startNew');
  assert.match(death, /id="deathDialog" role="dialog" aria-modal="true" aria-labelledby="deathDialogTitle" aria-describedby="deathDialogDescription" tabindex="-1"/);
  assert.match(death, /id="deathDialogTitle" role="heading" aria-level="1"/);
  assert.match(death, /id="deathDialogDescription"/);
  assert.match(death, /activeDialogKeyHandler=event=>\{[\s\S]*?event\.key!=='Tab'/);
  assert.match(death, /document\.activeElement===dialog/);
  assert.match(death, /dialog\.focus/);
});


test('نافذة توقيت رد الفعل تدعم اللعب الموقّت ومساعدة الوصول دون عقوبة عند التأخر', () => {
  const source = functionSource('combatReactionTiming', 'combatReactionEffect');
  const context = {};
  vm.runInNewContext(source + `
    globalThis.fast=combatReactionTiming(900);
    globalThis.edge=combatReactionTiming(1800);
    globalThis.slow=combatReactionTiming(1801);
    globalThis.invalid=combatReactionTiming(null);
    globalThis.backwards=combatReactionTiming(-1);
    globalThis.assisted=combatReactionTiming(null,true);
  `, context);
  assert.deepEqual(JSON.parse(JSON.stringify(context.fast)), { elapsedMs: 900, bonus: 4, label: 'سريعة' });
  assert.deepEqual(JSON.parse(JSON.stringify(context.edge)), { elapsedMs: 1800, bonus: 4, label: 'سريعة' });
  assert.deepEqual(JSON.parse(JSON.stringify(context.slow)), { elapsedMs: 1801, bonus: 0, label: 'هادئة' });
  assert.deepEqual(JSON.parse(JSON.stringify(context.invalid)), { elapsedMs: null, bonus: 0, label: 'غير محسوبة' });
  assert.deepEqual(JSON.parse(JSON.stringify(context.backwards)), { elapsedMs: null, bonus: 0, label: 'غير محسوبة' });
  assert.deepEqual(JSON.parse(JSON.stringify(context.assisted)), { elapsedMs: null, bonus: 4, label: 'مساعدة مفعّلة' });
  assert.match(app, /session\.reactionWindowStartedAt=Date\.now\(\)/);
  const normalizerSource = functionSource('normalizePendingCombatBout', 'combatDifficultyLabel');
  const normalizerContext = {};
  vm.runInNewContext(normalizerSource + `\n    globalThis.invalidPending=normalizePendingCombatBout({mode:'street',opponent:{name:'منافس',style:'قوة'},reactionId:'guard',reactionTimeMs:'not-a-number',reactionWindowStartedAt:'not-a-date'});\n  `, normalizerContext);
  assert.equal(normalizerContext.invalidPending.reactionTimeMs, null, 'invalid imported timing must not receive the quick-response bonus');
  assert.equal(normalizerContext.invalidPending.reactionWindowStartedAt, null, 'invalid imported timestamps should be discarded safely');
  assert.match(app, /session\.reactionTimeMs=timing\.elapsedMs/);
  assert.match(app, /reactionTimeMs:reactionTiming\.elapsedMs,reactionTimingBonus:reactionTiming\.bonus/);
  assert.match(app, /reactionTimeMs:item\.reactionTimeMs===undefined\?null:item\.reactionTimeMs,reactionTimingBonus:item\.reactionTimingBonus\|\|0/);
  assert.match(app, /استجابة سريعة خلال 1\.8 ثانية تمنحك 4 نقاط إضافية/);
  assert.match(css, /\.combat-reaction-clock/);
  assert.match(css, /hayah-reaction-window/);
  assert.match(read('sw.js'), /hayah-shell-v224/);
});


test('تقدير مساحة التخزين يعرض قيمًا آمنة ولا يغيّر بيانات الحفظ', async () => {
  const formatSource = functionSource('formatStorageBytes', 'inspectStorageCapacity');
  const estimateSource = functionSource('inspectStorageCapacity', 'inspectStorageCapacityFromSettings');
  async function run(storage) {
    const context = {};
    if (storage) context.navigator = { storage };
    vm.runInNewContext(
      formatSource + String.fromCharCode(10) + estimateSource +
      String.fromCharCode(10) + 'globalThis.formatted=[formatStorageBytes(0),formatStorageBytes(1024),formatStorageBytes(86*1024*1024),formatStorageBytes(-1),formatStorageBytes(NaN)];' +
      String.fromCharCode(10) + 'globalThis.result=inspectStorageCapacity();',
      context
    );
    return { formatted: Array.from(context.formatted), result: await context.result };
  }
  const unsupported = await run(null);
  assert.equal(unsupported.result.status, 'unsupported');
  assert.deepEqual(unsupported.formatted, ['0 بايت','1 ك.ب','86 م.ب','0 بايت','0 بايت']);

  const measured = await run({
    estimate: () => Promise.resolve({ usage: 86 * 1024 * 1024, quota: 100 * 1024 * 1024 }),
    persisted: () => Promise.resolve(true)
  });
  assert.deepEqual(JSON.parse(JSON.stringify(measured.result)), {
    status: 'ok', usage: 86 * 1024 * 1024, quota: 100 * 1024 * 1024,
    remaining: 14 * 1024 * 1024, percent: 86, persistent: true
  });

  const noPersistenceApi = await run({
    estimate: () => Promise.resolve({ usage: 5, quota: 10 })
  });
  assert.equal(noPersistenceApi.result.persistent, null);
  assert.equal(noPersistenceApi.result.percent, 50);

  const malformed = await run({ estimate: () => Promise.resolve({ usage: 'bad', quota: 0 }) });
  assert.equal(malformed.result.status, 'unavailable');

  const rejected = await run({ estimate: () => Promise.reject(new Error('quota-api-failed')) });
  assert.equal(rejected.result.status, 'error');

  const settingsSource = functionSource('settingsMenu', 'cultMenu');
  assert.ok(settingsSource.includes('فحص مساحة التخزين'));
  assert.ok(settingsSource.includes('inspectStorageCapacityFromSettings'));
  assert.ok(app.includes('const highUsage=result.percent>=85;'));
  assert.match(app, /ليس حجم ملف الحفظ وحده/);
});


test('النوافذ الحوارية تعلن العنوان والوصف والسؤال المرئي لقارئات الشاشة', () => {
  const modalSource = functionSource('modal', 'info');
  const helperSource = functionSource('buildDialogDescriptionIds', 'modal');
  const helperContext = {};
  vm.runInNewContext(helperSource + "\nglobalThis.descriptionCases = [buildDialogDescriptionIds('وصف', 'سؤال'), buildDialogDescriptionIds('', 'سؤال'), buildDialogDescriptionIds('', '')];", helperContext);
  assert.deepEqual(Array.from(helperContext.descriptionCases[0]), ['dialogDescription', 'dialogQuestion']);
  assert.deepEqual(Array.from(helperContext.descriptionCases[1]), ['dialogQuestion']);
  assert.deepEqual(Array.from(helperContext.descriptionCases[2]), []);
  assert.equal((modalSource.match(/aria-labelledby="dialogTitle"/g) || []).length, 2,
    'both drawer and event dialogs should expose their visible title as the accessible name');
  assert.equal((modalSource.match(/\+describedBy\+/g) || []).length, 2,
    'both dialog variants should use only the visible description references they render');
  assert.match(modalSource, /const questionPrompt=!isDrawer&&!isNotice/);
  assert.match(modalSource, /buildDialogDescriptionIds\(desc,questionPrompt\)/);
  assert.match(modalSource, /class="modaltitle" id="dialogTitle" role="heading" aria-level="2"/);
  assert.match(modalSource, /class="event-title" id="dialogTitle"/);
  assert.equal((modalSource.match(/class="desc" id="dialogDescription"/g) || []).length, 2);
  assert.match(modalSource, /class="event-question" id="dialogQuestion"/);
});


test('سجل استحقاقات التركة يظل تاريخيًا بينما المحافظ الحالية تُدار بشكل منفصل', () => {
  const builder = functionSource('buildInheritanceAccounts', 'startAsChild');
  const familyTree = functionSource('familyTreeMenu', 'recordBusinessFinancialReport');
  const ledgerMenu = functionSource('inheritanceAccountsMenu', 'recordBusinessFinancialReport');
  assert.match(builder, /status==='transferred'\?0:allocatedAmount/);
  assert.match(builder, /totalAllocated/);
  assert.match(builder, /totalReservedBalance/);
  assert.match(familyTree, /سجل استحقاقات التركة/);
  assert.match(ledgerMenu, /المحافظ الحالية وحركات المساندة تُعرض في قسم مستقل/);
  assert.match(app, /beneficiaryAccounts,selectedAccountId/);
});


test('سجل مواريث العائلة يحتفظ بتاريخ الأجيال ويعرض كل تركة منفصلة', () => {
  const reader = functionSource('getInheritanceHistoryRecords', 'buildInheritanceHistory');
  const builder = functionSource('buildInheritanceHistory', 'startAsChild');
  const ledgerMenu = functionSource('inheritanceAccountsMenu', 'recordBusinessFinancialReport');
  assert.match(reader, /source\.inheritanceHistory/);
  assert.match(reader, /source\.distribution&&source\.distribution\.beneficiaryAccounts/);
  assert.match(builder, /getInheritanceHistoryRecords\(legacy\)/);
  assert.match(builder, /records\.slice\(-50\)/);
  assert.match(app, /inheritanceHistory:buildInheritanceHistory\(previous,beneficiaryAccounts\)/);
  assert.match(ledgerMenu, /سجل مواريث العائلة/);
  assert.match(ledgerMenu, /inheritanceHistoryRecordMenu/);
  assert.match(ledgerMenu, /fmt\(allocated\)\+' '\+currency/);
  assert.match(ledgerMenu, /fmt\(record\.totalEstateValue\)\+' '\+currency/);
  assert.match(read('sw.js'), /hayah-shell-v224/);
});


test('محرك الميراث يطابق قيمة الحصة المنقولة مع سجل الاستحقاق ويكشف فرق التسوية التاريخي', () => {
  const inheritanceSource = functionSource('calculateInheritance', 'inheritanceBeneficiaryShares');
  const historySource = functionSource('createInheritanceHistoryRecord', 'getInheritanceHistoryRecords');
  assert.match(inheritanceSource, /targetValue/);
  assert.match(inheritanceSource, /roundingAdjustment/);
  assert.match(historySource, /reconciliationDelta/);
  assert.match(app, /فرق تسوية/);
});


test('سجل الميراث يراجع توازن كل حساب وملخص الأرصدة قبل إعلان سلامة الدفتر', () => {
  const historySource = functionSource('createInheritanceHistoryRecord', 'getInheritanceHistoryRecords');
  const menuSource = functionSource('inheritanceHistoryRecordMenu', 'recordBusinessFinancialReport');
  assert.match(historySource, /ledgerAuditComplete/);
  assert.match(historySource, /account\.balance\+account\.settledAmount-account\.allocatedAmount/);
  assert.match(historySource, /accountLedgerSummaryIssues/);
  assert.match(historySource, /accountLedgerIncompleteCount/);
  assert.match(menuSource, /record\.accountLedgerMismatch/);
  assert.match(menuSource, /دفتر الاستحقاقات غير متوازن/);
  assert.match(read('sw.js'), /hayah-shell-v224/);
});


test('دفتر الميراث يدقق نسب المستفيدين وهوية الحساب والعملة ومصدر التركة', () => {
  const historySource = functionSource('createInheritanceHistoryRecord', 'getInheritanceHistoryRecords');
  const menuSource = functionSource('inheritanceHistoryRecordMenu', 'recordBusinessFinancialReport');
  assert.match(historySource, /ledgerShareAuditInvalid/);
  assert.match(historySource, /share_total_mismatch/);
  assert.match(historySource, /duplicate_beneficiary_id/);
  assert.match(historySource, /currency_mismatch/);
  assert.match(historySource, /source_life_mismatch/);
  assert.match(historySource, /accountLedgerAmountIncompleteCount/);
  assert.match(menuSource, /issueReasonLabels/);
  assert.match(menuSource, /مجموع نسب المستفيدين/);
  assert.match(read('sw.js'), /hayah-shell-v224/);
});


test('محافظ الورثة تحفظ حصص الأسرة وتدعم المساندة المالية دون تغيير الحفظ الأساسي', () => {
  const walletBuilder = functionSource('buildBeneficiaryWallets', 'familyPropertyOwnershipRecords');
  const walletLedger = functionSource('beneficiaryWalletLedgerTotals', 'recordBeneficiaryWalletSupport');
  const walletSupport = functionSource('recordBeneficiaryWalletSupport', 'recordBeneficiaryWalletRentalIncome');
  const walletRent = functionSource('recordBeneficiaryWalletRentalIncome', 'distributeFamilyPropertyRent');
  const rentDistribution = functionSource('distributeFamilyPropertyRent', 'beneficiaryWalletsMenu');
  const walletMenu = functionSource('beneficiaryWalletsMenu', 'beneficiaryWalletMenu');
  const walletDetail = functionSource('beneficiaryWalletMenu', 'beneficiaryWalletSupportMenu');
  const walletTransactions = functionSource('beneficiaryWalletTransactionsMenu', 'supportBeneficiaryWallet');
  const familyMenu = functionSource('familyTreeMenu', 'inheritanceAccountsMenu');
  const annualAge = functionSource('advanceAge', 'ageUp');
  const browserWalletTest = read('tests/browser.cjs');
  assert.match(walletBuilder, /status!=='reserved'/);
  assert.match(walletBuilder, /ledgerShareAuditComplete/);
  assert.match(walletBuilder, /rentalIncomeTotal/);
  assert.match(walletBuilder, /rental_income/);
  assert.match(walletLedger, /opening\+support\+rentalIncome/);
  assert.match(walletSupport, /beneficiaryWalletLedgerTotals/);
  assert.match(walletSupport, /duplicate_transaction/);
  assert.match(walletRent, /type:'rental_income'/);
  assert.match(rentDistribution, /rent_distribution/);
  assert.match(rentDistribution, /rentReserveTotal/);
  assert.match(rentDistribution, /externalRentPaidTotal/);
  assert.match(annualAge, /distributeFamilyPropertyRent/);
  assert.match(annualAge, /rentEntries/);
  assert.match(walletMenu, /محافظ الورثة/);
  assert.match(walletDetail, /دخل إيجار/);
  assert.match(walletTransactions, /دخل إيجار عقار/);
  assert.match(browserWalletTest, /rental_income/);
  assert.match(browserWalletTest, /دخل إيجار/);
  assert.match(familyMenu, /beneficiaryWalletsMenu/);
  assert.match(app, /const beneficiaryWallets=buildBeneficiaryWallets\(previous\.legacy,beneficiaryAccounts,previous\.name,previous\.age\)/);
  assert.match(app, /inheritanceHistory:buildInheritanceHistory\(previous,beneficiaryAccounts\),beneficiaryWallets,familyPropertyOwnership,distribution/);
  assert.match(app, /hekayat_hayah_save_v1/);
  assert.match(read('sw.js'), /hayah-shell-v224/);
});


test('سجل الملكية المشتركة يحافظ على حصص الأسرة عبر الأجيال ويمنع بيع حصة غير مدققة', () => {
  const builder = functionSource('buildFamilyPropertyOwnership', 'recordFamilyPropertySale');
  const sale = functionSource('recordFamilyPropertySale', 'safeFamilyOwnershipShare');
  const sync = functionSource('syncFamilyPropertyMarketValue', 'getBeneficiaryWallets');
  const inheritance = functionSource('calculateInheritance', 'inheritanceBeneficiaryShares');
  const familyTree = functionSource('familyTreeMenu', 'familyPropertyOwnershipMenu');
  const menu = functionSource('familyPropertyOwnershipMenu', 'familyPropertyOwnershipRecordMenu');
  const details = functionSource('familyPropertyOwnershipRecordMenu', 'inheritanceAccountsMenu');
  const annualAge = functionSource('advanceAge', 'ageUp');
  assert.match(builder, /estateFactor/);
  assert.match(builder, /encumberedShare/);
  assert.match(builder, /beneficiary_shares_incomplete/);
  assert.match(builder, /current_owner_missing/);
  assert.match(sale, /ownership_audit_incomplete/);
  assert.match(sale, /external-buyer-/);
  assert.match(sync, /record\.marketValue/);
  assert.match(annualAge, /syncFamilyPropertyMarketValue\(a,null,0\)/);
  assert.match(inheritance, /familyAssetOriginalValue/);
  assert.match(inheritance, /ownershipShare/);
  assert.match(familyTree, /ملكية عقارات العائلة/);
  assert.match(menu, /القيمة الكاملة للعقار لا تُضاف مرة ثانية/);
  assert.match(details, /حصة محفوظة للوريث/);
  assert.match(app, /buildFamilyPropertyOwnership\(previous,beneficiaryAccounts\)/);
  assert.match(app, /recordFamilyPropertySale\(a,sale\)/);
  assert.match(app, /distributeFamilyPropertyExpense\(a,ownerCost/);
  assert.match(read('sw.js'), /hayah-shell-v224/);
});

test('مصروفات العقارات المشتركة تخصم من محافظ الورثة وفق دفتر حساب متوافق مع الحفظ القديم', () => {
  assert.match(app, /function recordBeneficiaryWalletPropertyExpense\(/);
  assert.match(app, /function distributeFamilyPropertyExpense\(/);
  assert.match(app, /propertyExpenseTotal/);
  assert.match(app, /propertyExpenseOwed/);
  assert.match(app, /insufficient_active_funds/);
  assert.match(read('sw.js'), /hayah-shell-v224/);
});



test('الضريبة العقارية اختيارية وتستخدم دفتر المصروفات المشترك دون فرض معدلات قانونية', () => {
  const rate = functionSource('familyPropertyTaxRateBps', 'formatFamilyPropertyTaxRate');
  const format = functionSource('formatFamilyPropertyTaxRate', 'calculateFamilyPropertyAnnualTax');
  const assessment = functionSource('calculateFamilyPropertyAnnualTax', 'setFamilyPropertyTaxRateBps');
  const setter = functionSource('setFamilyPropertyTaxRateBps', 'beneficiaryWalletsMenu');
  const details = functionSource('familyPropertyOwnershipRecordMenu', 'familyPropertyTaxPolicyMenu');
  const policy = functionSource('familyPropertyTaxPolicyMenu', 'inheritanceAccountsMenu');
  const annualAge = functionSource('advanceAge', 'ageUp');
  assert.match(rate, /annualTaxRateBps/);
  assert.match(rate, /rate<=200/);
  assert.match(format, /toFixed\(2\)/);
  assert.match(assessment, /auditStatus!=='balanced'/);
  assert.match(assessment, /marketValue\*rateBps\/10000/);
  assert.match(setter, /ownership_audit_incomplete/);
  assert.match(details, /سياسة الضريبة العقارية/);
  assert.match(details, /معدل محاكاة اختياري وليس نسبة قانونية/);
  assert.match(policy, /rates=\[0,25,50,100,150,200\]/);
  assert.match(policy, /formatFamilyPropertyTaxRate\(rateBps\)/);
  assert.match(policy, /ليست معدلات قانونية لأي بلد/);
  assert.match(annualAge, /action:'annual-property-tax'/);
  assert.match(annualAge, /distributeFamilyPropertyExpense/);
  assert.match(read('sw.js'), /hayah-shell-v224/);
});


test('متأخرات العقار تنتقل مع حصة الوارث وتظل في دفتر الملكية', () => {
  const builder = functionSource('buildFamilyPropertyOwnership', 'recordFamilyPropertySale');
  assert.match(builder, /currentOwnerArrears/);
  assert.match(builder, /property_expense_arrears_invalid/);
  assert.match(builder, /propertyExpenseOwedTotal/);
  assert.match(builder, /property_expense_inheritance/);
  assert.match(builder, /remainingArrears/);
  assert.match(read('sw.js'), /hayah-shell-v224/);
});


test('التأمين العقاري العائلي اختياري ويربط القسط السنوي بالتعويض دون تغيير الحفظ القديم', () => {
  const policy = functionSource('familyPropertyInsurancePolicy', 'setFamilyPropertyInsurancePolicy');
  const setter = functionSource('setFamilyPropertyInsurancePolicy', 'calculateFamilyPropertyAnnualInsurancePremium');
  const premium = functionSource('calculateFamilyPropertyAnnualInsurancePremium', 'calculateFamilyPropertyInsuranceClaim');
  const claim = functionSource('calculateFamilyPropertyInsuranceClaim', 'recordFamilyPropertyInsuranceClaim');
  const recordClaim = functionSource('recordFamilyPropertyInsuranceClaim', 'familyPropertyTaxRateBps');
  const details = functionSource('familyPropertyOwnershipRecordMenu', 'familyPropertyTaxPolicyMenu');
  const menu = functionSource('familyPropertyInsurancePolicyMenu', 'beneficiaryWalletsMenu');
  const annualAge = functionSource('advanceAge', 'ageUp');
  const maintenance = functionSource('maintainAsset', 'familyMenu');
  const expense = functionSource('distributeFamilyPropertyExpense', 'familyPropertyTaxRateBps');
  assert.match(policy, /insurancePolicy/);
  assert.match(policy, /enabled:false/);
  assert.ok(setter.includes('basic:') && setter.includes('standard:') && setter.includes('comprehensive:'));
  assert.match(premium, /annualPremiumRateBps/);
  assert.match(claim, /insurancePremiumPaidYear/);
  assert.match(claim, /duplicate_claim/);
  assert.match(recordClaim, /insurance_claim/);
  assert.match(details, /تأمين العقار/);
  assert.match(menu, /قسط سنوي/);
  assert.match(menu, /التغطية/);
  assert.match(annualAge, /annual-insurance-premium/);
  assert.match(annualAge, /requireFullPayment:true/);
  assert.match(annualAge, /insurancePremiumPaidLifeId/);
  assert.match(maintenance, /calculateFamilyPropertyInsuranceClaim/);
  assert.match(maintenance, /recordFamilyPropertyInsuranceClaim/);
  assert.match(expense, /insufficient_owner_funds/);
  assert.match(app, /hekayat_hayah_save_v1/);
  assert.match(read('sw.js'), /hayah-shell-v224/);
});

 
test('الأشقاء يمتلكون مساكن مستقلة وتدخل قيمتها وصيانتها في المحاكاة والواجهة', () => {
  const purchase = functionSource('siblingPropertyPurchaseDecision', 'ensureSiblingEconomicProfile');
  const sale = functionSource('siblingPropertySaleDecision', 'ensureSiblingEconomicProfile');
  const annual = functionSource('advanceSiblingEconomies', 'familyTreeNode');
  const familyTree = functionSource('familyTreeNode', 'buildBeneficiaryWallets');
  const details = functionSource('siblingEconomicDetails', 'relationshipHistory');
  const profile = functionSource('ensureSiblingEconomicProfile', 'advanceSiblingEconomies');
  assert.match(purchase, /employmentState!=='working'/);
  assert.match(sale, /previous.employmentState!=='seeking'/);
  assert.match(sale, /transactionCost/);
  assert.match(purchase, /price\+reserve/);
  assert.match(annual, /siblingPropertyMarketChangeBps/);
  assert.match(annual, /siblingPropertyAnnualUpkeep/);
  assert.match(annual, /siblingPropertyPurchaseDecision/);
  assert.match(annual, /siblingPropertySaleDecision/);
  assert.match(annual, /propertySaleGross/);
  assert.match(annual, /siblingOwnedPropertyValue/);
  assert.match(profile, /ownedProperties/);
  assert.match(familyTree, /عقارات/);
  assert.match(details, /مسكن مستقل/);
  assert.match(details, /propertyExpensesAnnual/);
  assert.match(read('sw.js'), /hayah-shell-v224/);
  assert.match(app, /const KEY = 'hekayat_hayah_save_v1';/);
  assert.match(app, /return \{version:1,lifeId:/);
});


test('العقارات الاستثمارية للأشقاء تحسب الإيجار والشغور والتحصيل وتُفضّل البيع قبل المسكن الأساسي', () => {
  const rentalHelpers = functionSource('siblingRentalPropertyPrice', 'ensureSiblingEconomicProfile');
  const sale = functionSource('siblingPropertySaleDecision', 'siblingRentalPropertyPrice');
  const annual = functionSource('advanceSiblingEconomies', 'familyTreeNode');
  const details = functionSource('siblingEconomicDetails', 'relationshipHistory');
  const profile = functionSource('ensureSiblingEconomicProfile', 'advanceSiblingEconomies');
  assert.match(rentalHelpers, /siblingRentalPurchaseDecision/);
  assert.match(rentalHelpers, /siblingRentalAnnualIncome/);
  assert.match(rentalHelpers, /vacancyLoss/);
  assert.match(rentalHelpers, /collectionLoss/);
  assert.match(sale, /a\.kind==='rental'\?0:1/);
  assert.match(annual, /siblingRentalAnnualIncome/);
  assert.match(annual, /rentalIncomeTotal/);
  assert.match(annual, /rentalLossTotal/);
  assert.match(annual, /purchasedRentalProperty/);
  assert.match(profile, /kind==='rental'/);
  assert.match(details, /دخل إيجار/);
  assert.match(details, /إيجار شهري/);
  assert.match(read('sw.js'), /hayah-shell-v224/);
  assert.match(app, /const KEY = 'hekayat_hayah_save_v1';/);
  assert.match(app, /return \{version:1,lifeId:/);
});


test('دفتر متأخرات إيجار الأشقاء يحفظ الرصيد والتحصيل والشطب ويعرضه دون تضخيم صافي الثروة', () => {
  const settlement = functionSource('siblingRentalArrearsSettlement', 'ensureSiblingEconomicProfile');
  const annual = functionSource('advanceSiblingEconomies', 'familyTreeNode');
  const profile = functionSource('ensureSiblingEconomicProfile', 'advanceSiblingEconomies');
  const details = functionSource('siblingEconomicDetails', 'relationshipHistory');
  const familyTree = functionSource('familyTreeNode', 'buildBeneficiaryWallets');
  assert.match(settlement, /rental-arrears/);
  assert.match(settlement, /closingArrears/);
  assert.match(annual, /rentArrearsCollected/);
  assert.match(annual, /rentArrearsWrittenOff/);
  assert.match(annual, /rentalArrearsBalance/);
  assert.match(profile, /rentArrearsAddedTotal/);
  assert.match(profile, /rentArrearsCollectedTotal/);
  assert.match(profile, /rentalArrearsWrittenOffTotal/);
  assert.match(details, /متأخرات إيجار قائمة/);
  assert.match(details, /متأخرات غير المحصلة لا تدخل في صافي الثروة/);
  assert.match(familyTree, /متأخرات إيجار/);
  assert.match(read('sw.js'), /hayah-shell-v224/);
  assert.match(app, /const KEY = 'hekayat_hayah_save_v1';/);
  assert.ok(app.includes('return {version:1,lifeId:'), 'legacy backup format remains version 1');
});

 
 
test('تمويل العقار الاستثماري للأشقاء يحفظ جدول السداد والتعثر والسداد المبكر والحفظ القديم', () => {
  const purchase = functionSource('siblingRentalPurchaseDecision', 'siblingRentalAnnualIncome');
  const due = functionSource('siblingMortgageAnnualDue', 'siblingMortgageSettlement');
  const settlement = functionSource('siblingMortgageSettlement', 'siblingMortgagePrepaymentQuote');
  const prepayment = functionSource('siblingMortgagePrepayment', 'ensureSiblingEconomicProfile');
  const annual = functionSource('advanceSiblingEconomies', 'familyTreeNode');
  const profile = functionSource('ensureSiblingEconomicProfile', 'advanceSiblingEconomies');
  const details = functionSource('siblingEconomicDetails', 'relationshipHistory');
  assert.match(purchase, /downPayment/);
  assert.match(purchase, /loanPrincipal/);
  assert.match(purchase, /siblingMortgageAnnualPayment/);
  assert.match(due, /interestRateBps/);
  assert.match(settlement, /closingArrears/);
  assert.match(annual, /mortgageDueTotal/);
  assert.match(annual, /mortgageUnpaidTotal/);
  assert.match(annual, /mortgageDefault/);
  assert.match(annual, /mortgageDebtPaidBySalesTotal/);
  assert.match(prepayment, /mortgagePrepaymentsTotal/);
  assert.match(details, /مراجعة السداد المبكر/);
  assert.match(details, /متأخرات تمويل/);
  assert.match(profile, /mortgageDebtBalance/);
  assert.match(profile, /mortgage_prepayment/);
  assert.match(read('sw.js'), /hayah-shell-v224/);
  assert.match(app, /const KEY = 'hekayat_hayah_save_v1';/);
  assert.ok(app.includes('return {version:1,lifeId:'), 'legacy backup format remains version 1');
});

test('البيع اليدوي للعقار الاستثماري يحتاج تأكيدًا ويسوي الحساب المستقل وسجل العملية', () => {
  const quote = functionSource('siblingManualRentalSaleQuote', 'siblingManualRentalSale');
  const sale = functionSource('siblingManualRentalSale', 'ensureSiblingEconomicProfile');
  const confirm = functionSource('siblingManualRentalSaleConfirm', 'siblingEconomicDetails');
  const details = functionSource('siblingEconomicDetails', 'relationshipHistory');
  const profile = functionSource('ensureSiblingEconomicProfile', 'advanceSiblingEconomies');
  assert.match(quote, /item\.kind==='rental'/);
  assert.match(quote, /transactionCost/);
  assert.match(sale, /propertySalesTotal/);
  assert.match(sale, /rentalArrearsWrittenOffTotal/);
  assert.match(sale, /propertyTransactions/);
  assert.match(confirm, /siblingManualRentalSale\(/);
  assert.match(confirm, /تأكيد البيع/);
  assert.match(confirm, /الاحتفاظ بالعقار/);
  assert.match(confirm, /save\(\)/);
  assert.match(details, /siblingManualRentalSaleConfirm/);
  assert.match(details, /مراجعة بيع/);
  assert.match(profile, /propertyTransactions/);
  assert.match(read('sw.js'), /hayah-shell-v224/);
  assert.match(app, /const KEY = 'hekayat_hayah_save_v1';/);
  assert.ok(app.includes('return {version:1,lifeId:'), 'legacy backup format remains version 1');
});


test('عقود الإيجار للأشقاء تحفظ المستأجر والمدة والتجديد وتعرض حالة العقد', () => {
  const tenant = functionSource('siblingRentalTenantName', 'siblingRentalLeaseDecision');
  const lease = functionSource('siblingRentalLeaseDecision', 'siblingRentalAnnualIncome');
  const annual = functionSource('siblingRentalAnnualIncome', 'siblingRentalArrearsSettlement');
  const profile = functionSource('ensureSiblingEconomicProfile', 'advanceSiblingEconomies');
  const details = functionSource('siblingEconomicDetails', 'relationshipHistory');
  assert.match(tenant, /rental-tenant/);
  assert.match(lease, /lease-renewal/);
  assert.match(lease, /recordEvent/);
  assert.match(lease, /lease-signing/);
  assert.match(annual, /leaseStatus/);
  assert.match(annual, /vacancyLoss/);
  assert.match(profile, /normalized\.lease/);
  assert.match(profile, /rawLease\.history/);
  assert.match(details, /المستأجر/);
  assert.match(details, /العقد حتى سنة/);
  assert.match(details, /عقود إيجار/);
  assert.match(app, /rentLeaseEvents/);
  assert.match(read('sw.js'), /hayah-shell-v224/);
  assert.match(app, /const KEY = 'hekayat_hayah_save_v1';/);
  assert.ok(app.includes('return {version:1,lifeId:'), 'legacy save format remains version 1');
});


test('إدارة المالك اليدوية لعقود إيجار الأشقاء تحفظ القرار وتمنع القرارات الآلية اللاحقة', () => {
  const quote = functionSource('siblingManualRentalLeaseQuote', 'siblingManualRentalLeaseAction');
  const action = functionSource('siblingManualRentalLeaseAction', 'siblingRentalAnnualIncome');
  const decision = functionSource('siblingRentalLeaseDecision', 'siblingManualRentalLeaseQuote');
  const profile = functionSource('ensureSiblingEconomicProfile', 'advanceSiblingEconomies');
  const details = functionSource('siblingEconomicDetails', 'relationshipHistory');
  const menu = functionSource('siblingManualRentalLeaseMenu', 'siblingManualRentalSaleConfirm');
  assert.match(quote, /lastOwnerActionYear/);
  assert.match(quote, /siblingRentalTenantName/);
  assert.match(action, /ownerManaged:true/);
  assert.match(action, /lastRentYear/);
  assert.match(decision, /lease\.ownerManaged===true/);
  assert.match(profile, /ownerManaged:rawLease\.ownerManaged===true/);
  assert.match(profile, /startYear<=year\+1/);
  assert.match(details, /rentalLeaseChoices/);
  assert.match(details, /siblingManualRentalLeaseMenu/);
  assert.match(menu, /تولي إدارة العقد يدويًا/);
  assert.match(menu, /actionAlreadyUsed/);
  assert.match(menu, /تم تسجيل قرار لهذا العام/);
  assert.match(menu, /تجديد سنة دون زيادة/);
  assert.match(menu, /إنهاء العقد من السنة القادمة/);
  assert.match(read('sw.js'), /hayah-shell-v224/);
  assert.match(app, /const KEY = 'hekayat_hayah_save_v1';/);
  assert.ok(app.includes('return {version:1,lifeId:'), 'legacy backup format remains version 1');
});


test('الأسرة المستقلة للأشقاء تحفظ الشريك والأبناء وتربط دخلهم ومصروفاتهم بالمحاكاة', () => {
  assert.match(app, /function ensureSiblingHousehold\(relative,profile,year\)/);
  assert.match(app, /function siblingHouseholdAnnualEffects\(relative,profile,year,age\)/);
  assert.match(app, /householdEffects\.spouseIncome/);
  assert.match(app, /householdEffects\.familyExpenses/);
  assert.match(app, /householdEvents/);
  assert.match(app, /الأسرة المستقلة:/);
  assert.match(read('sw.js'), /hayah-shell-v224/);
  assert.match(app, /const KEY = 'hekayat_hayah_save_v1';/);
  assert.ok(app.includes('return {version:1,lifeId:'), 'legacy save format remains version 1');
});

 
test('أبناء الإخوة والأخوات يظهرون في شجرة العائلة بمساراتهم التعليمية والمهنية المستقلة', () => {
  assert.match(app, /function siblingChildCareerFor\(aptitude\)/);
  assert.match(app, /function ensureSiblingChildEconomy\(relative,child,year\)/);
  assert.match(app, /function siblingChildEconomicAnnualEffects\(relative,child,year\)/);
  const node = functionSource('siblingHouseholdChildNode', 'familyTreeMenu');
  assert.match(node, /educationStatus/);
  assert.match(node, /annualIncome/);
  const tree = functionSource('familyTreeMenu', 'familyPropertyOwnershipMenu');
  assert.match(tree, /أبناء الإخوة والأخوات/);
  assert.match(tree, /siblingHouseholdChildNode/);
  const details = functionSource('siblingEconomicDetails', 'relationshipHistory');
  assert.match(details, /childCareerSummary/);
  assert.match(app, /independentYear/);
  assert.match(app, /child_graduated/);
});


test('أبناء الأشقاء يواصلون التقدم بعد وفاة الوالد وتظهر استمرارية الفرع في شجرة العائلة', () => {
  const advancement = functionSource('advanceSiblingEconomies', 'familyTreeNode');
  const childNode = functionSource('siblingHouseholdChildNode', 'familyTreeMenu');
  assert.match(advancement, /siblingDeceasedHouseholdAnnualEffects/);
  assert.match(advancement, /relative\.deceased/);
  assert.match(app, /function siblingDeceasedHouseholdAnnualEffects\(relative,profile,year\)/);
  assert.match(app, /ownerDeceased/);
  assert.match(childNode, /فرع مستمر بعد وفاة/);
  assert.match(read('sw.js'), /hayah-shell-v224/);
  assert.match(app, /const KEY = 'hekayat_hayah_save_v1';/);
  assert.ok(app.includes('return {version:1,lifeId:'), 'the legacy save and backup format must remain version 1');
});


test('الملكية العقارية الموروثة تنتقل لاقتصاد الابن عند الاستحقاق وتدخل في محاكاته السنوية', () => {
  const release = functionSource('siblingReleaseChildInheritance', 'siblingChildEconomicAnnualEffects');
  const childEconomy = functionSource('siblingChildEconomicAnnualEffects', 'siblingNormalizeInheritanceRecords');
  const childPropertyEffects = functionSource('siblingChildInheritedPropertyAnnualEffects', 'siblingEstateSettlement');
  const childTreeNode = functionSource('siblingHouseholdChildNode', 'familyTreeMenu');
  assert.match(app, /function siblingNormalizeChildOwnedProperties\(raw,year\)/);
  assert.match(app, /function siblingChildEstatePropertyPlan\(relative,child,economy,record,year\)/);
  assert.match(app, /function siblingUpdateEstateAssetTransferStatus\(profile,household\)/);
  assert.match(release, /siblingChildEstatePropertyPlan/);
  assert.match(release, /assetsTransferredYear/);
  assert.match(release, /transferredAssetIds/);
  assert.match(childEconomy, /siblingChildInheritedPropertyAnnualEffects/);
  assert.match(childPropertyEffects, /siblingMortgageAnnualDue/);
  assert.match(childPropertyEffects, /siblingRentalAnnualIncome/);
  assert.match(childTreeNode, /عقارات موروثة/);
  assert.match(childTreeNode, /propertyDebt/);
  assert.match(read('sw.js'), /hayah-shell-v224/);
  assert.match(app, /const KEY = 'hekayat_hayah_save_v1';/);
  assert.ok(app.includes('return {version:1,lifeId:'), 'legacy save must remain version 1');
});

test('الشريك الباقي يدخل دفتر تركة الأشقاء بحصة متوازنة ويحفظ حصص الأصول والديون', () => {
  const shareSource = functionSource('siblingEstateBeneficiaryShares', 'siblingEstatePlanAction');
  const allocationSource = functionSource('siblingAllocateEstateAmount', 'siblingEstateAssetSnapshot');
  const snapshotSource = functionSource('siblingEstateAssetSnapshot', 'siblingNormalizeChildOwnedProperties');
  const ensureHouseholdSource = functionSource('ensureSiblingHousehold', 'siblingHouseholdAnnualEffects');
  const updateStatusSource = functionSource('siblingUpdateEstateAssetTransferStatus', 'siblingChildInheritedPropertyAnnualEffects');
  const settlementSource = functionSource('siblingEstateSettlement', 'siblingOwnedPropertyValue');
  const context = {
    clamp(value, min = 0, max = 100) {
      const number = Number(value);
      return Math.max(min, Math.min(max, Number.isFinite(number) ? number : 0));
    },
    siblingSafeMoney(value) {
      return Math.max(0, Math.round(Number(value) || 0));
    },
    siblingProfileMortgageLiability() { return 0; },
    siblingInvestmentHash() { return 17; },
    siblingEstatePlanNormalize(raw) {
      return { mode: ['equal_children', 'eldest_child', 'youngest_child'].includes(raw && raw.mode) ? raw.mode : 'equal_children' };
    },
    siblingNormalizeInheritanceRecords(raw) {
      const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
      return { records: Array.isArray(source.records) ? source.records : [] };
    },
    siblingReleaseChildInheritance() { return { released: false, cash: 0, debt: 0, count: 0 }; },
    siblingPropertyAnnualUpkeep() { return 0; }
  };
  vm.runInNewContext([
    shareSource, allocationSource, snapshotSource, ensureHouseholdSource, updateStatusSource, settlementSource,
    'globalThis.settleSiblingEstate = siblingEstateSettlement;'
  ].join('\n'), context);

  const makeChild = (id, name) => ({
    id, name, age: 12, birthYear: 2014, lastAgeYear: 2026, independent: false, inheritance: { records: [] }
  });
  const relative = { id: 'sibling-1', name: 'الشقيق المتوفى', age: 60, deceased: true };
  const spouse = {
    id: 'spouse-1', name: 'الشريك الباقي', age: 52, marriedYear: 2004, lastAgeYear: 2026,
    deceased: false, inheritance: { records: [] }
  };
  const children = [makeChild('child-1', 'الابن الأول'), makeChild('child-2', 'الابن الثاني')];
  const profile = {
    household: { spouse, children, lastProcessedYear: 2026, history: [] },
    savings: 100000, investmentBalance: 0, debt: 0,
    ownedProperties: [{ id: 'home-1', kind: 'residence', label: 'بيت الأسرة', marketValue: 101, upkeep: 5 }],
    estatePlan: { mode: 'equal_children' }
  };
  const result = context.settleSiblingEstate(relative, profile, 2027);
  const normalizedSpouse = profile.household.spouse;
  const normalizedChildren = profile.household.children;

  assert.equal(result.settled, true);
  assert.deepEqual(Array.from(result.beneficiaries, item => item.shareBps), [2500, 3750, 3750]);
  assert.equal(result.beneficiaries.reduce((sum, item) => sum + item.shareBps, 0), 10000);
  assert.equal(normalizedSpouse.inheritanceCashBalance, 25000);
  assert.equal(normalizedSpouse.inheritanceDebtBalance, 0);
  assert.equal(normalizedSpouse.inheritance.records[0].cashHeld, 0);
  assert.equal(normalizedSpouse.inheritance.records[0].cashReleased, 25000);
  assert.deepEqual(Array.from(normalizedChildren, child => child.inheritance.records[0].cashHeld), [37500, 37500]);
  const inheritedValues = [
    normalizedSpouse.inheritance.records[0].assetClaims[0].marketValueShare,
    normalizedChildren[0].inheritance.records[0].assetClaims[0].marketValueShare,
    normalizedChildren[1].inheritance.records[0].assetClaims[0].marketValueShare
  ];
  assert.equal(inheritedValues.reduce((sum, value) => sum + value, 0), 101);
  assert.equal(profile.estate.assetClaimsCount, 3);
  assert.equal(profile.estate.assetClaimsPendingCount, 3);
  assert.equal(profile.estate.assetTransferStatus, 'pending');

  const spouseOnly = {
    household: { spouse: { id: 'spouse-only', name: 'شريك بلا أبناء', deceased: false }, children: [] },
    savings: 64000, investmentBalance: 0, debt: 0, ownedProperties: [], estatePlan: { mode: 'equal_children' }
  };
  const spouseOnlyResult = context.settleSiblingEstate(relative, spouseOnly, 2028);
  assert.deepEqual(Array.from(spouseOnlyResult.beneficiaries, item => item.shareBps), [10000]);
  assert.equal(spouseOnly.household.spouse.inheritanceCashBalance, 64000);

  const debtEstate = {
    household: { spouse: { id: 'debt-spouse', name: 'شريك عليه التزام', deceased: false }, children: [makeChild('debt-child-1', 'الأول'), makeChild('debt-child-2', 'الثاني')] },
    savings: 5000, investmentBalance: 0, debt: 20000, ownedProperties: [], estatePlan: { mode: 'equal_children' }
  };
  const debtResult = context.settleSiblingEstate(relative, debtEstate, 2029);
  assert.equal(debtResult.estate.unsecuredDebtRemaining, 15000);
  assert.equal(debtEstate.household.spouse.inheritanceDebtBalance, 3750);
  assert.deepEqual(Array.from(debtEstate.household.children, child => child.inheritance.records[0].debtHeld), [5625, 5625]);

  const spouseDeceased = {
    household: { spouse: { id: 'spouse-deceased', name: 'شريك متوفى', deceased: true }, children: [makeChild('only-child', 'الابن الوحيد')] },
    savings: 30000, investmentBalance: 0, debt: 0, ownedProperties: [], estatePlan: { mode: 'equal_children' }
  };
  const childOnlyResult = context.settleSiblingEstate(relative, spouseDeceased, 2030);
  assert.deepEqual(Array.from(childOnlyResult.beneficiaries, item => item.shareBps), [10000]);
  assert.equal(childOnlyResult.beneficiaries[0].beneficiaryType, 'child');

  const noHeirs = {
    household: { spouse: null, children: [] },
    savings: 12000, investmentBalance: 0, debt: 0, ownedProperties: [], estatePlan: { mode: 'equal_children' }
  };
  const unclaimed = context.settleSiblingEstate(relative, noHeirs, 2031);
  assert.equal(unclaimed.estate.status, 'unclaimed_no_children');
  assert.equal(unclaimed.beneficiaries.length, 0);
  assert.match(functionSource('siblingEstateSummaryMenu', 'familyTreeMenu'), /beneficiaryType==='spouse'/);
  assert.match(functionSource('siblingEstatePlanMenu', 'siblingEstateSummaryMenu'), /حصة محاكاة 25%/);
});

test('الحفظ القديم لا يضيف دفتر إرث للشريك قبل تسوية التركة', () => {
  const ensureHouseholdSource = functionSource('ensureSiblingHousehold', 'siblingHouseholdAnnualEffects');
  const context = {
    clamp(value, min = 0, max = 100) {
      const number = Number(value);
      return Math.max(min, Math.min(max, Number.isFinite(number) ? number : 0));
    },
    siblingSafeMoney(value) {
      return Math.max(0, Math.round(Number(value) || 0));
    },
    siblingNormalizeInheritanceRecords(raw) {
      const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
      return { records: Array.isArray(source.records) ? source.records : [] };
    }
  };
  vm.runInNewContext(ensureHouseholdSource + '\nglobalThis.normalizeHousehold = ensureSiblingHousehold;', context);
  const normalized = context.normalizeHousehold(
    { id: 'old-sibling', age: 48, deceased: false },
    { household: { spouse: { id: 'old-spouse', name: 'شريك قديم' }, children: [] } },
    2026
  );
  assert.equal(Object.prototype.hasOwnProperty.call(normalized.spouse, 'inheritance'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(normalized.spouse, 'inheritanceCashBalance'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(normalized.spouse, 'inheritanceDebtBalance'), false);
  const withLedger = context.normalizeHousehold(
    { id: 'old-sibling', age: 48, deceased: false },
    { household: { spouse: { id: 'old-spouse', name: 'شريك قديم', inheritance: { records: [{ estateId: 'estate-1' }] }, inheritanceCashBalance: 1234, inheritanceDebtBalance: 567 }, children: [] } },
    2027
  );
  assert.equal(withLedger.spouse.inheritanceCashBalance, 1234);
  assert.equal(withLedger.spouse.inheritanceDebtBalance, 567);
  assert.equal(withLedger.spouse.inheritance.records[0].estateId, 'estate-1');
});

test('وصية الأشقاء ودفتر التركة يظهران في الواجهة مع إبقاء نقل العقارات مرحلة منفصلة', () => {
  assert.match(app, /function siblingEstatePlanAction\(relative,mode\)/);
  assert.match(app, /function siblingEstateSettlement\(relative,profile,year\)/);
  assert.match(app, /function siblingEstatePlanMenu\(relative\)/);
  assert.match(app, /function siblingEstateSummaryMenu\(relative\)/);
  assert.match(app, /assetTransferStatus/);
  assert.match(app, /siblingEstateSettlement\(relative,deceasedProfile,year\)/);
  assert.match(app, /siblingEstatePlanMenu\(n\)/);
  assert.match(app, /siblingEstateSummaryMenu\(p\)/);
  assert.match(read('sw.js'), /hayah-shell-v224/);
  assert.match(app, /const KEY = 'hekayat_hayah_save_v1';/);
  assert.ok(app.includes('return {version:1,lifeId:'), 'the legacy save remains version 1');
});


test('مؤشر لوحة المفاتيح واضح ومتوافق مع ألوان الثيمات', () => {
  const focusUi = css.slice(css.lastIndexOf('/* v126: theme-aware, high-contrast keyboard focus'));
  assert.match(focusUi, /--hayah-focus-ring:#075e59/);
  assert.match(focusUi, /body\.theme-dark\{--hayah-focus-ring:#a6ead5\}/);
  assert.match(focusUi, /body\.theme-gold\{--hayah-focus-ring:#76520f\}/);
  assert.match(focusUi, /#app button:focus-visible/);
  assert.match(focusUi, /#app a\[href\]:focus-visible/);
  assert.match(focusUi, /outline:3px solid var\(--hayah-focus-ring/);
  assert.match(focusUi, /outline-offset:3px/);
});

test('تكبير النص وتقليل الحركة يظلان مدعومين في نظام الهوية الجديد', () => {
  const accessibleUi = css.slice(css.lastIndexOf('/* v195: Hayah visual identity system'));
  assert.match(accessibleUi, /body\.text-large #modalRoot \.choice \.ctitle\{font-size:15px!important/);
  assert.match(accessibleUi, /body\.text-large #modalRoot \.choice \.cdesc\{font-size:13px!important/);
  assert.match(accessibleUi, /body\.text-large #app \.sectiontitle\{font-size:16px!important/);
  assert.match(accessibleUi, /body\.text-large #app \.navbtn/);
  assert.match(accessibleUi, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(accessibleUi, /animation:none!important/);
  assert.match(accessibleUi, /transition:none!important/);
  assert.match(accessibleUi, /animation-duration:\.01ms!important/);
  assert.match(accessibleUi, /transition-duration:\.01ms!important/);
  assert.match(read('sw.js'), /hayah-shell-v224/);
});


test('رابط تجاوز التنقل يستخدم لون التركيز الموحد في الثيمات الثلاثة', () => {
  const skipLink = css.match(/\.skip-link\{[^}]*\}/);
  const skipFocus = css.match(/\.skip-link:focus-visible\{[^}]*\}/);
  assert.ok(skipLink, 'the keyboard bypass link should have a dedicated style');
  assert.ok(skipFocus, 'the keyboard bypass link should expose a visible focus style');
  assert.match(skipLink[0], /border:2px solid var\(--hayah-focus-ring/);
  assert.match(skipFocus[0], /outline:3px solid var\(--hayah-focus-ring/);
  assert.match(css, /body\.theme-dark\{--hayah-focus-ring:#a6ead5\}/);
  assert.match(css, /body\.theme-gold\{--hayah-focus-ring:#76520f\}/);
});


test('الأزرار المدمجة تظل سهلة اللمس على شاشات الهاتف', () => {
  const touchUi = css.slice(css.lastIndexOf('/* v131: improve mobile reachability without changing the five-zone layout. */'));
  assert.ok(touchUi.length > 0, 'the mobile touch-target rules should be the final cascade layer');
  for (const selector of [
    '#app .menu-trigger',
    '#app .top-actions .header-action',
    '#app .member-btn',
    '#app .identity-info',
    '#modalRoot .closebtn',
    '#modalRoot .smallbtn'
  ]) assert.ok(touchUi.includes(selector), 'missing touch-target coverage for ' + selector);
  assert.match(touchUi, /min-width:44px!important/);
  assert.match(touchUi, /min-height:44px!important/);
  assert.match(read('sw.js'), /hayah-shell-v224/);
});


test('تطور مجتمع المقاتلين سنويًا يعكس النشاط والخصومة ويظل محدودًا ومتوافقًا مع الحفظ القديم', () => {
  const profilesStart = app.indexOf('const combatCommunityProfiles=[');
  const helpersEnd = app.indexOf('function combatDifficultyLabel', profilesStart);
  assert.ok(profilesStart >= 0 && helpersEnd > profilesStart, 'the original community roster and safe normalizer should remain available');
  const helpers = app.slice(profilesStart, helpersEnd);
  const formSource = functionSource('combatCommunityFormLabel', 'advanceCombatCommunity');
  const advanceSource = functionSource('advanceCombatCommunity', 'combatRankName');
  const context = {
    state: { age: 30, yearCount: 10 },
    clamp(value, min = 0, max = 100) {
      const number = Number(value);
      return Number.isFinite(number) ? Math.max(min, Math.min(max, Math.round(number))) : min;
    }
  };
  vm.runInNewContext(helpers + '\n' + formSource + '\n' + advanceSource + `
    globalThis.community = normalizeCombatCommunity([
      { id: 'adam-mansour', momentum: 0, respect: 70, tension: 20, lastBoutAge: 29, lastInteractionAge: 28, lastProgressYear: 9 },
      { id: 'malek-sherif', momentum: 0, respect: 40, tension: 80, lastBoutAge: 20, lastInteractionAge: 20, lastProgressYear: 9 },
      { id: 'yassin-hamdy', momentum: 0, respect: 80, tension: 10, allied: true, lastBoutAge: 20, lastInteractionAge: 29, lastProgressYear: 9 },
      { id: 'omar-lotfy', momentum: 0, respect: 40, tension: 10, lastBoutAge: 10, lastInteractionAge: 10, lastProgressYear: 9 },
      { id: 'karim-fawzy', momentum: 99, respect: 40, tension: 10, lastBoutAge: 10, lastInteractionAge: 10, lastProgressYear: 9 }
    ], state.yearCount);
    globalThis.career = { community };
    globalThis.first = advanceCombatCommunity(career);
    globalThis.afterFirst = community.map(item => ({ id: item.id, momentum: item.momentum, lastProgressYear: item.lastProgressYear }));
    globalThis.second = advanceCombatCommunity(career);
    state.age = 31; state.yearCount = 11;
    globalThis.third = advanceCombatCommunity(career);
    globalThis.afterSecond = community.map(item => ({ id: item.id, momentum: item.momentum, lastProgressYear: item.lastProgressYear }));
    globalThis.legacy = normalizeCombatCommunity([], state.yearCount);
    globalThis.invalid = normalizeCombatCommunity([{ id: 'adam-mansour', momentum: 99, lastProgressYear: 999 }], 10)[0];
    globalThis.labels = [
      combatCommunityFormLabel({ momentum: 5 }),
      combatCommunityFormLabel({ momentum: 1 }),
      combatCommunityFormLabel({ momentum: 0 }),
      combatCommunityFormLabel({ momentum: -1 }),
      combatCommunityFormLabel({ momentum: -5 })
    ];
  `, context);

  assert.equal(context.first, true);
  assert.deepEqual(JSON.parse(JSON.stringify(context.afterFirst.map(item => item.momentum))), [1, 0, 1, -1, 4],
    'recent bouts and respected relationships should lift form, inactivity should lower it, and heated rivals should hold steady');
  assert.equal(context.second, false, 'rivals must not progress twice during the same game year');
  assert.equal(context.third, true);
  assert.deepEqual(JSON.parse(JSON.stringify(context.afterSecond.map(item => item.momentum))), [2, 0, 2, -2, 3],
    'each rival should receive one bounded update in the next game year');
  assert.ok(context.legacy.every(item => item.momentum === 0 && item.lastProgressYear === 11),
    'legacy fighter records should start with neutral form at the current year, without an immediate penalty');
  assert.equal(context.invalid.momentum, 5, 'imported momentum must be clamped');
  assert.equal(context.invalid.lastProgressYear, 10, 'future progress years must be normalized to the current year');
  assert.deepEqual(Array.from(context.labels), ['في قمة النشاط', 'مستواه صاعد', 'مستقر', 'مستواه متراجع', 'بحاجة لاستعادة مستواه']);

  const annual = functionSource('advanceAge', 'ageUp');
  assert.ok(annual.indexOf('state.yearCount++') < annual.indexOf('advanceCombatCommunityWorld(cc)'),
    'rival progression must happen after the player advances the game year');
  assert.match(annual, /advanceCombatCommunityWorld\(cc\)/);
  assert.match(functionSource('startCombatBout', 'combatBoutRoundMenu'),
    /communityFighter\.rating\+\(Number\(communityFighter\.momentum\)\|\|0\)/);
  assert.match(functionSource('resolveCombatBout', 'recoverCombatInjury'),
    /communityFighter\.momentum=clamp\(\(Number\(communityFighter\.momentum\)\|\|0\)\+\(won\?1:2\),-5,5\)/);
  assert.match(functionSource('combatCommunityFighterMenu', 'interactCombatFighter'),
    /combatCommunityFormLabel\(fighter\)/);
  assert.match(functionSource('ensureCombatCareer', 'combatRankName'),
    /normalizeCombatCommunity\(c\.community,Math\.max\(0,Math\.floor\(Number\(state\.yearCount\)\|\|0\)\)\)/);
  assert.ok(app.includes('community:normalizeCombatCommunity([],state?state.yearCount:0)'));
  assert.ok(app.includes("const KEY = 'hekayat_hayah_save_v1';"));
  assert.ok(app.includes('return {version:1,lifeId:'));
  assert.match(read('sw.js'), /hayah-shell-v224/);
});


test('مجتمع المقاتلين يستقبل منافسين جددًا كل خمس سنوات ويحافظ على الحفظ القديم', () => {
  const profilesStart = app.indexOf('const combatCommunityProfiles=[');
  const catalogEnd = app.indexOf('function combatRoundEnergy', profilesStart);
  assert.ok(profilesStart >= 0 && catalogEnd > profilesStart, 'the original and newcomer fighter catalogs must remain available');
  const catalogSource = app.slice(profilesStart, catalogEnd);
  const rosterSource = functionSource('advanceCombatCommunityRoster', 'createCombatCareer');
  const context = {
    state: { age: 22, yearCount: 4 },
    clamp(value, min = 0, max = 100) {
      const number = Number(value);
      return Number.isFinite(number) ? Math.max(min, Math.min(max, Math.round(number))) : min;
    }
  };

  vm.runInNewContext(catalogSource + '\n' + rosterSource + `
    globalThis.career = {
      startedAge: 18,
      community: normalizeCombatCommunity([], state.yearCount),
      nextRecruitmentAge: 23
    };
    globalThis.initialCount = career.community.length;
    globalThis.beforeDueAge = advanceCombatCommunityRoster(career);
    state.age = 23; state.yearCount = 5;
    const first = advanceCombatCommunityRoster(career);
    globalThis.first = first;
    globalThis.firstName = first && first.name;
    globalThis.firstCount = career.community.length;
    globalThis.firstNextAge = career.nextRecruitmentAge;
    globalThis.repeatSameYear = advanceCombatCommunityRoster(career);
    state.age = 28; state.yearCount = 10;
    const second = advanceCombatCommunityRoster(career);
    globalThis.second = second;
    globalThis.secondName = second && second.name;
    globalThis.secondCount = career.community.length;
    globalThis.roundTrip = normalizeCombatCommunity(career.community, state.yearCount);
    globalThis.unknown = normalizeCombatCommunity([...career.community, { id: 'unknown-rival', name: 'اسم غير موثوق' }], state.yearCount);
    state.age = 22; state.yearCount = 4;
    globalThis.legacyCareer = { startedAge: 18, community: normalizeCombatCommunity([], state.yearCount) };
    globalThis.legacyBefore = advanceCombatCommunityRoster(legacyCareer);
    globalThis.legacyNextAge = legacyCareer.nextRecruitmentAge;
    state.age = 23; state.yearCount = 11;
    globalThis.legacyFirst = advanceCombatCommunityRoster(legacyCareer);
    state.age = 22; state.yearCount = 4;
    globalThis.invalidCareer = { startedAge: 18, nextRecruitmentAge: 999, community: normalizeCombatCommunity([], state.yearCount) };
    globalThis.invalidBefore = advanceCombatCommunityRoster(invalidCareer);
    globalThis.invalidNextAge = invalidCareer.nextRecruitmentAge;
    state.age = 40; state.yearCount = 22;
    globalThis.expandedLegacyCareer = {
      startedAge: 18,
      community: normalizeCombatCommunity([...combatCommunityProfiles, ...combatCommunityNewcomerProfiles.slice(0, 10)], state.yearCount),
      nextRecruitmentAge: 150
    };
    globalThis.expandedLegacyBefore = advanceCombatCommunityRoster(expandedLegacyCareer);
    globalThis.expandedLegacyNextAge = expandedLegacyCareer.nextRecruitmentAge;
    state.age = 45; state.yearCount = 27;
    globalThis.expandedLegacyFirst = advanceCombatCommunityRoster(expandedLegacyCareer);
    globalThis.expandedLegacyFirstName = expandedLegacyFirst && expandedLegacyFirst.name;
    while (career.community.length < 20 && state.age < 150) {
      state.age = career.nextRecruitmentAge;
      state.yearCount++;
      advanceCombatCommunityRoster(career);
    }
    globalThis.finalCount = career.community.length;
    globalThis.uniqueIds = new Set(career.community.map(fighter => fighter.id)).size;
    state.age = career.nextRecruitmentAge; state.yearCount++;
    globalThis.exhausted = advanceCombatCommunityRoster(career);
    globalThis.exhaustedNextAge = career.nextRecruitmentAge;
  `, context);

  assert.equal(context.initialCount, 5, 'legacy careers should keep the original five rivals');
  assert.equal(context.beforeDueAge, null, 'the first newcomer should not arrive before five career years');
  assert.equal(context.firstName, 'سيف كمال');
  assert.equal(context.firstCount, 6);
  assert.equal(context.firstNextAge, 28);
  assert.equal(context.repeatSameYear, null, 'a newcomer must not be added twice in one age');
  assert.equal(context.secondName, 'علي ناصر');
  assert.equal(context.secondCount, 7);
  assert.equal(context.roundTrip.length, 7, 'saved newcomers must survive normalization');
  assert.equal(context.unknown.length, 7, 'unknown imported rivals must not enter the trusted roster');
  assert.equal(context.legacyBefore, null, 'legacy saves should receive a safe future recruitment date');
  assert.equal(context.legacyNextAge, 23);
  assert.equal(context.legacyFirst.name, 'سيف كمال');
  assert.equal(context.invalidBefore, null, 'invalid future dates must be normalized instead of triggering a burst of recruits');
  assert.equal(context.invalidNextAge, 23);
  assert.equal(context.expandedLegacyBefore, null, 'an exhausted v1 roster should resume its reserve schedule without an immediate burst');
  assert.equal(context.expandedLegacyNextAge, 45, 'old saves at the former 15-rival limit should receive a new five-year recruitment date');
  assert.equal(context.expandedLegacyFirstName, 'رائد توفيق', 'legacy careers should be able to recruit the newly added reserve fighters');
  assert.equal(context.finalCount, 20, 'the expanded original and reserve roster should contain twenty unique fighters');
  assert.equal(context.uniqueIds, 20, 'fighter IDs must remain unique');
  assert.equal(context.exhausted, null, 'the roster must stop cleanly after all newcomers have joined');
  assert.equal(context.exhaustedNextAge, 150);

  const createSource = functionSource('createCombatCareer', 'ensureCombatCareer');
  const ensureSource = functionSource('ensureCombatCareer', 'combatRankName');
  const annualSource = functionSource('advanceAge', 'ageUp');
  const menuSource = functionSource('combatCommunityMenu', 'combatCommunityFighterMenu');
  assert.match(createSource, /nextRecruitmentAge:/);
  assert.match(ensureSource, /c\.nextRecruitmentAge=/);
  const worldSource = functionSource('advanceCombatCommunityWorld', 'createCombatCareer');
  assert.match(worldSource, /advanceCombatCommunityRoster\(career\)/);
  assert.match(worldSource, /منافس جديد في المجتمع/);
  assert.match(menuSource, /c\.community\.length\+/);
  assert.ok(app.includes("const KEY = 'hekayat_hayah_save_v1';"));
  assert.ok(app.includes('return {version:1,lifeId:'));
  assert.match(read('sw.js'), /hayah-shell-v224/);
});


test('اعتزال مسيرة القتال يحتفظ بالسجل ويوقف التدريب والنزالات', () => {
  const career = {
    rank: 2, leaguePoints: 140, streetCred: 35, streetWins: 4, leagueWins: 3,
    wins: 9, losses: 3, energy: 72, injury: 0, injuryYears: 0,
    coach: { id: 'coach-test', name: 'مدرب تجريبي', yearsLeft: 2, annualCost: 900 },
    movesKnown: ['quick-jab'], moveMastery: { 'quick-jab': 12 },
    bouts: [{ opponent: 'خصم سابق', won: true }], pendingBout: null,
    community: [], retired: false, retiredAge: null, retiredYear: null
  };
  const state = { age: 37, yearCount: 19, bank: 5000, specialCareer: { id: 'fighter' }, combatCareer: career };
  const dialogs = [], logs = [], achievements = [];
  let saves = 0, renders = 0, menuCalls = 0;
  const context = {
    state,
    ensureCombatCareer: () => career,
    closeModal() {},
    info(icon, title, description, options) { dialogs.push({ icon, title, description, options }); },
    choice(icon, title, description, action) { return { icon, title, description, action }; },
    clamp(value, min = 0, max = 100) {
      const number = Number(value);
      return Number.isFinite(number) ? Math.max(min, Math.min(max, Math.round(number))) : min;
    },
    log(...args) { logs.push(args); },
    achievement(value) { achievements.push(value); },
    save() { saves++; },
    render() { renders++; },
    combatCareerMenu() { menuCalls++; }
  };
  const retirementSource = functionSource('retireCombatCareer', 'combatCareerMenu');
  vm.runInNewContext(retirementSource + '\nglobalThis.retire=retireCombatCareer;', context);
  context.retire();
  assert.equal(dialogs.length, 1);
  assert.equal(dialogs[0].options.length, 2, 'retirement must require an explicit confirmation');
  dialogs[0].options[0].action();

  assert.equal(career.retired, true);
  assert.equal(career.retiredAge, 37);
  assert.equal(career.retiredYear, 19);
  assert.equal(career.coach, null, 'retirement must stop future coach renewals');
  assert.equal(career.wins, 9, 'career results must remain intact');
  assert.equal(career.losses, 3);
  assert.equal(career.bouts.length, 1, 'bout history must remain intact');
  assert.equal(saves, 1);
  assert.equal(renders, 1);
  assert.equal(menuCalls, 1);
  assert.ok(logs.some(entry => entry[1] === 'اعتزال مسيرة القتال'));
  assert.ok(achievements.includes('اعتزال مسيرة القتال'));

  const startSource = functionSource('startCombatBout', 'combatBoutRoundMenu');
  const accessSource = functionSource('combatBoutAccessGuard', 'createCombatCareer');
  const practiceSource = functionSource('practiceCombatMove', 'learnCombatMove');
  const guardDialogs = [];
  const guardContext = {
    state,
    validState: () => true,
    ensureCombatCareer: () => career,
    closeModal() {},
    info(icon, title, description) { guardDialogs.push({ icon, title, description }); },
    combatBoutRoundMenu() { throw new Error('retired career must not resume a pending bout'); }
  };
  vm.runInNewContext(
    accessSource + '\n' + startSource + '\n' + practiceSource +
    '\nglobalThis.start=startCombatBout;globalThis.practice=practiceCombatMove;',
    guardContext
  );
  const previousBank = state.bank, previousEnergy = career.energy, previousMastery = career.moveMastery['quick-jab'];
  guardContext.start('street');
  guardContext.practice('quick-jab');
  assert.equal(guardDialogs.length, 2, 'new bouts and focused training must both be blocked');
  assert.equal(state.bank, previousBank);
  assert.equal(career.energy, previousEnergy);
  assert.equal(career.moveMastery['quick-jab'], previousMastery);
  assert.equal(career.pendingBout, null);

  const ensureSource = functionSource('ensureCombatCareer', 'combatRankName');
  const menuSource = functionSource('combatCareerMenu', 'combatTrainingMenu');
  const communitySource = functionSource('combatCommunityFighterMenu', 'interactCombatFighter');
  const annualSource = functionSource('advanceAge', 'ageUp');
  assert.match(ensureSource, /c\.retired=c\.retired===true/, 'legacy saves should default to an active career');
  assert.match(menuSource, /if\(c\.retired\)/, 'retired careers should use a read-only menu');
  assert.match(menuSource, /سجل النزالات/);
  assert.match(communitySource, /أرشيف المنافسين/, 'retired players should be able to review, not challenge, rivals');
  assert.match(annualSource, /advanceCombatCommunityWorld\(cc\)/, 'the rival world must keep progressing after the player retires');
  assert.match(annualSource, /if\(playerCareerActive&&cc\.coach/, 'coach fees must remain limited to an active player career');
  assert.ok(app.includes('retiredAge:null'));
  assert.ok(app.includes('retiredYear:null'));
  assert.match(read('sw.js'), /hayah-shell-v224/);
});


test('منافسو القتال يتقدمون في العمر ويعتزلون وتظل ملفاتهم محفوظة للقراءة فقط', () => {
  const profilesStart = app.indexOf('const combatCommunityProfiles=[');
  const helpersEnd = app.indexOf('function combatRoundEnergy', profilesStart);
  assert.ok(profilesStart >= 0 && helpersEnd > profilesStart);
  const catalog = app.slice(profilesStart, helpersEnd);
  const advanceSource = functionSource('advanceCombatCommunity', 'advanceCombatCommunityRoster');
  const newline = String.fromCharCode(10);
  const context = {
    state: { age: 31, yearCount: 9 },
    clamp(value, min = 0, max = 100) {
      const number = Number(value);
      return Number.isFinite(number) ? Math.max(min, Math.min(max, Math.round(number))) : min;
    }
  };
  vm.runInNewContext(catalog + newline + advanceSource + `
    globalThis.career = { community: normalizeCombatCommunity([
      { id: 'adam-mansour', age: 44, retirementAge: 45, retired: false, allied: true, lastProgressYear: 8, momentum: 2 }
    ], 8) };
    globalThis.before = { ...career.community[0] };
    globalThis.first = advanceCombatCommunity(career);
    globalThis.after = { ...career.community[0] };
    globalThis.secondSameYear = advanceCombatCommunity(career);
    state.yearCount = 10; state.age = 32;
    globalThis.nextYear = advanceCombatCommunity(career);
    globalThis.afterNextYear = { age: career.community[0].age, momentum: career.community[0].momentum, retired: career.community[0].retired, lastProgressYear: career.community[0].lastProgressYear };
    globalThis.savedAgain = normalizeCombatCommunity(career.community, state.yearCount)[0];
    globalThis.legacy = normalizeCombatCommunity([], state.yearCount);
    globalThis.invalid = normalizeCombatCommunity([
      { id: 'adam-mansour', age: 999, retirementAge: 999, retired: false, retiredYear: 999 }
    ], state.yearCount)[0];
  `, context);

  assert.equal(context.before.retired, false);
  assert.equal(context.first, true);
  assert.equal(context.after.age, 45);
  assert.equal(context.after.retired, true);
  assert.equal(context.after.retiredAge, 45);
  assert.equal(context.after.retiredYear, 9);
  assert.equal(context.after.allied, false, 'retirement must close active alliances');
  assert.equal(context.secondSameYear, false, 'the same rival cannot age twice in one game year');
  assert.equal(context.nextYear, true, 'other active rivals may continue progressing');
  assert.equal(context.afterNextYear.age, 46, 'retired rivals continue aging until their recorded natural end');
  assert.equal(context.afterNextYear.momentum, 2, 'a retired rival must keep its final competitive form');
  assert.equal(context.afterNextYear.retired, true);
  assert.equal(context.afterNextYear.lastProgressYear, 10, 'the archive still records the latest simulated year');
  assert.equal(context.savedAgain.retired, true);
  assert.equal(context.savedAgain.retiredAge, 45);
  assert.equal(context.savedAgain.retiredYear, 9);
  assert.ok(context.legacy.every(fighter => fighter.retired === false),
    'legacy saves without rival ages must normalize to active rivals');
  assert.equal(context.invalid.age, 100);
  assert.equal(context.invalid.retirementAge, 60);
  assert.equal(context.invalid.retired, true);
  assert.equal(context.invalid.retiredYear, 10, 'future retirement years must be clamped');

  const startSource = functionSource('startCombatBout', 'combatBoutRoundMenu');
  const accessSource = functionSource('combatBoutAccessGuard', 'createCombatCareer');
  const rival = { id: 'adam-mansour', name: 'آدم منصور', retired: true, style: 'قوة', weakTo: 'سرعة', emoji: '💪', rating: 46, momentum: 0, respect: 50, tension: 10 };
  const career = {
    retired: false, pendingBout: null, injuryYears: 0, injury: 0, energy: 100,
    streetWins: 2, streetCred: 20, rank: 1, community: [rival]
  };
  const state = { specialCareer: { id: 'fighter' }, bank: 5000, age: 32, yearCount: 10 };
  const dialogs = [];
  const guardContext = {
    state,
    validState: () => true,
    ensureCombatCareer: () => career,
    closeModal() {},
    info(icon, title, description) { dialogs.push({ icon, title, description }); },
    combatCommunityMenu() {},
    combatCommunityFighterMenu() {},
    clamp(value, min = 0, max = 100) {
      const number = Number(value);
      return Number.isFinite(number) ? Math.max(min, Math.min(max, Math.round(number))) : min;
    }
  };
  vm.runInNewContext(accessSource + newline + startSource + newline + 'globalThis.start=startCombatBout;', guardContext);
  guardContext.start('league', rival.id);
  assert.equal(state.bank, 5000, 'a retired rival must be rejected before league fees are charged');
  assert.equal(career.pendingBout, null);
  assert.ok(dialogs.some(dialog => dialog.title === 'المنافس معتزل'));

  const interactionSource = functionSource('interactCombatFighter', 'retireCombatCareer');
  let saves = 0;
  const interactionContext = {
    state: { age: 32, bank: 5000 },
    ensureCombatCareer: () => career,
    closeModal() {},
    info(icon, title, description) { dialogs.push({ icon, title, description }); },
    combatCommunityMenu() {},
    clamp(value, min = 0, max = 100) {
      const number = Number(value);
      return Number.isFinite(number) ? Math.max(min, Math.min(max, Math.round(number))) : min;
    },
    save() { saves++; },
    render() {},
    log() {},
    cash(value) { return String(value); }
  };
  vm.runInNewContext(interactionSource + newline + 'globalThis.interact=interactCombatFighter;', interactionContext);
  interactionContext.interact(rival.id, 'friendly');
  assert.equal(rival.respect, 50, 'a retired rival must not receive relationship mutations');
  assert.equal(saves, 0, 'blocked interactions must not save a changed relationship');
  assert.ok(functionSource('combatCommunityMenu', 'combatCommunityFighterMenu').includes('const retired='));
  assert.ok(functionSource('combatCommunityFighterMenu', 'interactCombatFighter').includes('fighter.retired===true'));
  assert.match(functionSource('advanceCombatCommunityWorld', 'createCombatCareer'), /اعتزال منافس/);
});


test('عالم مجتمع المقاتلين يستمر بعد اعتزال اللاعب أو انتقاله لمسار آخر', () => {
  const advanceSource = functionSource('advanceCombatCommunity', 'advanceCombatCommunityRoster');
  const worldSource = functionSource('advanceCombatCommunityWorld', 'createCombatCareer');
  const annualSource = functionSource('advanceAge', 'ageUp');
  const newline = String.fromCharCode(10);
  const logs = [];
  let rosterCalls = 0;
  const context = {
    state: { age: 50, yearCount: 20, specialCareer: { id: 'actor' } },
    logs,
    clamp(value, min = 0, max = 100) {
      const number = Number(value);
      return Number.isFinite(number) ? Math.max(min, Math.min(max, Math.round(number))) : min;
    },
    advanceCombatCommunityRoster() { rosterCalls++; return null; },
    log(...args) { logs.push(args); }
  };
  const vmSource = [
    "globalThis.career = { retired: true, community: [",
    "{ id: 'retired-rival', name: 'منافس معتزل', age: 71, deathAge: 72, retired: true, retiredAge: 45, retiredYear: 15, allied: true, lastProgressYear: 19, momentum: 2 },",
    "{ id: 'active-rival', name: 'منافس نشط', age: 44, retirementAge: 45, deathAge: 82, retired: false, deceased: false, allied: true, lastProgressYear: 19, momentum: 0 }",
    "] };",
    "globalThis.first = advanceCombatCommunityWorld(career);",
    "globalThis.after = career.community.map(fighter => ({ ...fighter }));",
    "globalThis.firstLogCount = logs.length;",
    "globalThis.second = advanceCombatCommunityWorld(career);",
    "globalThis.secondLogCount = logs.length;"
  ].join(newline);
  vm.runInNewContext(advanceSource + newline + worldSource + newline + vmSource, context);

  assert.equal(context.first.advanced, true);
  assert.equal(context.after[0].age, 72);
  assert.equal(context.after[0].deceased, true, 'a retired rival should still reach the recorded end of life');
  assert.equal(context.after[0].deceasedYear, 20);
  assert.equal(context.after[0].allied, false);
  assert.equal(context.after[1].age, 45);
  assert.equal(context.after[1].retired, true, 'active rivals should still retire while the player is out of combat');
  assert.equal(context.firstLogCount, 2, 'retirement and death should be announced once');
  assert.equal(context.second.advanced, false, 'the same game year must not be simulated twice');
  assert.equal(context.secondLogCount, 2, 'reprocessing the same year must not duplicate diary events');
  assert.equal(rosterCalls, 2, 'the world recruitment scheduler should run independently of the player career state');

  const annualStart = annualSource.indexOf('if(state.combatCareer){');
  const annualEnd = annualSource.indexOf('advanceChildren();', annualStart);
  assert.ok(annualStart >= 0 && annualEnd > annualStart);
  const annualBlock = annualSource.slice(annualStart, annualEnd);
  assert.match(annualBlock, /advanceCombatCommunityWorld\(cc\)/);
  assert.match(annualBlock, /const playerCareerActive=!!\(state\.specialCareer&&state\.specialCareer\.id==='fighter'&&cc\.retired!==true\)/);
  assert.ok(annualBlock.indexOf('advanceCombatCommunityWorld(cc)') < annualBlock.indexOf('if(playerCareerActive&&cc.coach'));

  let worldCalls = 0;
  const retiredPlayerState = {
    combatCareer: { retired: true, energy: 23, coach: { annualCost: 100, yearsLeft: 3 } },
    specialCareer: { id: 'actor' },
    bank: 1000
  };
  const retiredPlayerContext = {
    state: retiredPlayerState,
    ensureCombatCareer() { return retiredPlayerState.combatCareer; },
    advanceCombatCommunityWorld() { worldCalls++; },
    log() {}
  };
  vm.runInNewContext(annualBlock, retiredPlayerContext);
  assert.equal(worldCalls, 1, 'the rival world must advance even after the player retires or changes career');
  assert.equal(retiredPlayerContext.state.bank, 1000, 'retirement must not restart coach fees');
  assert.equal(retiredPlayerContext.state.combatCareer.energy, 23, 'retirement must not restore fighter energy');

  let activeWorldCalls = 0;
  const activePlayerState = {
    combatCareer: { retired: false, energy: 23, coach: { annualCost: 100, yearsLeft: 1 } },
    specialCareer: { id: 'fighter' },
    bank: 1000
  };
  const activePlayerContext = {
    state: activePlayerState,
    ensureCombatCareer() { return activePlayerState.combatCareer; },
    advanceCombatCommunityWorld() { activeWorldCalls++; },
    log() {}
  };
  vm.runInNewContext(annualBlock, activePlayerContext);
  assert.equal(activeWorldCalls, 1);
  assert.equal(activePlayerContext.state.combatCareer.energy, 100);
  assert.equal(activePlayerContext.state.bank, 900);
  assert.equal(activePlayerContext.state.combatCareer.coach, null, 'active careers should retain the existing annual coach settlement');

  const careerFlagStart = annualSource.indexOf('const activeSpecialCareer=');
  const careerFlagEnd = annualSource.indexOf(';', careerFlagStart) + 1;
  assert.ok(careerFlagStart >= 0 && careerFlagEnd > careerFlagStart);
  const careerFlagSource = annualSource.slice(careerFlagStart, careerFlagEnd);
  const isCareerActive = stateValue => {
    const flagContext = { state: stateValue };
    vm.runInNewContext(careerFlagSource + ' globalThis.activeFlag=activeSpecialCareer;', flagContext);
    return flagContext.activeFlag;
  };
  assert.equal(isCareerActive({ specialCareer: { id: 'fighter' }, combatCareer: { retired: true } }), false,
    'a retired fighter career must no longer count as an active special career');
  assert.equal(isCareerActive({ specialCareer: { id: 'fighter' }, combatCareer: { retired: false } }), true);
  assert.equal(isCareerActive({ specialCareer: { id: 'actor' }, combatCareer: { retired: true } }), true,
    'retiring from fighting must not disable a different active career');
  assert.match(annualSource, /perkEnabled\('hollywoodStar'\)&&\(state\.job\|\|activeSpecialCareer\)/,
    'a retired fighter must not receive an automatic fame boost from the old career');

  const incomeStart = annualSource.indexOf('if(activeSpecialCareer){');
  const incomeEnd = annualSource.indexOf("if(state.specialCareer&&state.specialCareer.id==='esports'", incomeStart);
  assert.ok(incomeStart >= 0 && incomeEnd > incomeStart);
  const incomeBlock = annualSource.slice(incomeStart, incomeEnd);
  const incomeContext = activeSpecialCareer => ({
    activeSpecialCareer,
    state: { specialCareer: { id: activeSpecialCareer ? 'actor' : 'fighter', title: 'مسار تجريبي', income: 500 }, bank: 1000, fame: 50 },
    specialCareerIncomeMultiplier() { return 1; },
    cash(value) { return String(value); },
    log() {},
    chance() { return true; },
    clamp(value, min = 0, max = 100) { return Math.max(min, Math.min(max, Math.round(Number(value) || 0))); }
  });
  const retiredIncomeContext = incomeContext(false);
  vm.runInNewContext(incomeBlock, retiredIncomeContext);
  assert.equal(retiredIncomeContext.state.bank, 1000, 'a retired fighter must not keep receiving fighter-career income');
  assert.equal(retiredIncomeContext.state.fame, 50, 'a retired fighter must not keep accumulating fame from the old career');
  const activeIncomeContext = incomeContext(true);
  vm.runInNewContext(incomeBlock, activeIncomeContext);
  assert.ok(activeIncomeContext.state.bank > 1000, 'a different active special career should keep earning its income');
  assert.equal(activeIncomeContext.state.fame, 52);
});

test('تحديث PWA يعلن عن النسخة الجديدة دون فرض إعادة التحميل', () => {
  const index = read('index.html');
  const worker = read('sw.js');
  const update = read('pwa-update.js');
  const updateCss = read('pwa-update.css');
  assert.match(index, /href="pwa-update\.css"/);
  assert.ok(index.indexOf('pwa-update.js') < index.indexOf('app.js'));
  assert.match(worker, /hayah-shell-v224/);
  assert.match(worker, /pwa-update\.css/);
  assert.match(worker, /pwa-update\.js/);
  assert.match(update, /controllerchange/);
  assert.match(update, /window\.location\.reload\(\)/);
  assert.match(updateCss, /prefers-reduced-motion/);
  assert.match(updateCss, /forced-colors/);
});

test('منافسو القتال يتوفون بعد الاعتزال ويُمنع تحديهم أو التفاعل معهم', () => {
  const profilesStart = app.indexOf('const combatCommunityProfiles=[');
  const helpersEnd = app.indexOf('function combatRoundEnergy', profilesStart);
  assert.ok(profilesStart >= 0 && helpersEnd > profilesStart);
  const catalog = app.slice(profilesStart, helpersEnd);
  const advanceSource = functionSource('advanceCombatCommunity', 'advanceCombatCommunityRoster');
  const newline = String.fromCharCode(10);
  const context = {
    state: { age: 45, yearCount: 10 },
    clamp(value, min = 0, max = 100) {
      const number = Number(value);
      return Number.isFinite(number) ? Math.max(min, Math.min(max, Math.round(number))) : min;
    }
  };
  const vmSource = [
    "const rival = normalizeCombatCommunity([{ id: 'adam-mansour', age: 71, deathAge: 72, retired: true, retiredAge: 45, retiredYear: 9, allied: true, lastProgressYear: 9 }], 9)[0];",
    "globalThis.deathAge = rival.deathAge;",
    "globalThis.advanced = advanceCombatCommunity({ community: [rival] });",
    "globalThis.dead = { ...rival };",
    "globalThis.sameYear = advanceCombatCommunity({ community: [rival] });",
    "globalThis.saved = normalizeCombatCommunity([rival], state.yearCount)[0];"
  ].join(newline);
  vm.runInNewContext(catalog + newline + advanceSource + newline + vmSource, context);

  assert.equal(context.deathAge, 72);
  assert.equal(context.advanced, true);
  assert.equal(context.dead.age, 72);
  assert.equal(context.dead.deceased, true);
  assert.equal(context.dead.deceasedAge, 72);
  assert.equal(context.dead.deceasedYear, 10);
  assert.equal(context.dead.retired, true);
  assert.equal(context.dead.allied, false);
  assert.equal(context.sameYear, false, 'a rival cannot be processed twice in one game year');
  assert.equal(context.saved.deceased, true, 'the death record must survive save normalization');
  assert.equal(context.saved.deceasedYear, 10);

  const startSource = functionSource('startCombatBout', 'combatBoutRoundMenu');
  const accessSource = functionSource('combatBoutAccessGuard', 'createCombatCareer');
  const interactionSource = functionSource('interactCombatFighter', 'retireCombatCareer');
  const deadRival = {
    id: 'adam-mansour', name: 'آدم منصور', style: 'قوة', weakTo: 'سرعة',
    emoji: '💪', rating: 46, momentum: 0, respect: 50, tension: 10,
    retired: true, deceased: true, deceasedAge: 72, deceasedYear: 10
  };
  const career = {
    retired: false, pendingBout: null, injuryYears: 0, injury: 0, energy: 100,
    streetWins: 2, streetCred: 20, rank: 1, community: [deadRival]
  };
  const state = { specialCareer: { id: 'fighter' }, bank: 5000, age: 45, yearCount: 10 };
  const dialogs = [];
  let saves = 0;
  const guardContext = {
    state,
    validState: () => true,
    ensureCombatCareer: () => career,
    closeModal() {},
    info(icon, title, description) { dialogs.push({ icon, title, description }); },
    combatCommunityMenu() {},
    combatCommunityFighterMenu() {},
    clamp(value, min = 0, max = 100) {
      const number = Number(value);
      return Number.isFinite(number) ? Math.max(min, Math.min(max, Math.round(number))) : min;
    },
    save() { saves++; },
    render() {},
    log() {},
    cash(value) { return String(value); }
  };
  vm.runInNewContext(accessSource + newline + startSource + newline + interactionSource + newline +
    'globalThis.start=startCombatBout;globalThis.interact=interactCombatFighter;', guardContext);
  const previousBank = state.bank;
  guardContext.start('league', deadRival.id);
  guardContext.interact(deadRival.id, 'friendly');
  assert.equal(state.bank, previousBank, 'a deceased rival must be rejected before league fees');
  assert.equal(deadRival.respect, 50, 'a deceased rival must not receive social changes');
  assert.equal(career.pendingBout, null);
  assert.equal(saves, 0);
  assert.ok(dialogs.some(dialog => dialog.title === 'المنافس متوفى'));
  assert.match(functionSource('combatCommunityMenu', 'combatCommunityFighterMenu'), /fighter.deceased===true/);
  assert.match(functionSource('combatCommunityFighterMenu', 'interactCombatFighter'), /fighter.deceased===true/);
  assert.match(functionSource('advanceCombatCommunityWorld', 'createCombatCareer'), /وفاة منافس/);
});


test('وضع التباين القسري يحافظ على وضوح التنقل والقرارات والتركيز', () => {
  const highContrast = css.slice(css.lastIndexOf('/* v141: honor operating-system high-contrast colors'));
  assert.ok(highContrast.length > 0, 'the final accessibility cascade should include high-contrast support');
  assert.match(highContrast, /@media\s*\(forced-colors:\s*active\)/);
  for (const fragment of [
    'background: Canvas',
    'color: CanvasText',
    '.navbtn.active',
    'background: Highlight',
    'color: HighlightText',
    '.agebtn',
    '.primarybtn',
    'ButtonText',
    ':focus-visible',
    'outline: 3px solid Highlight'
  ]) {
    assert.ok(highContrast.includes(fragment), 'missing high-contrast rule: ' + fragment);
  }
});


test('تفضيل التباين الإضافي يحسن وضوح واجهة حياة دون تغيير بيانات الحياة', () => {
  const accessibility = read('accessibility.css');
  const worker = read('sw.js');
  assert.ok(html.includes('href="accessibility.css"'));
  assert.ok(worker.includes('hayah-shell-v224'));
  assert.ok(worker.includes('./accessibility.css'));
  assert.ok(accessibility.includes('@media (prefers-contrast: more) and (forced-colors: none)'));
  for (const fragment of [
    '--hayah-contrast-text',
    '--hayah-contrast-muted',
    '--hayah-contrast-border',
    'body.theme-dark',
    'body.theme-gold',
    '.logcard',
    '.navbtn.active',
    'var(--hayah-contrast-muted)',
    '.agebtn',
    ':focus-visible',
    'outline: 3px solid'
  ]) {
    assert.ok(accessibility.includes(fragment), 'missing increased-contrast rule: ' + fragment);
  }
  assert.ok(app.includes("const KEY = 'hekayat_hayah_save_v1';"));
  assert.ok(app.includes('return {version:1,lifeId:'));
});


test('واجهة التعليم والأنشطة المدرسية عربية مع الحفاظ على معرّفات الحفظ القديمة', () => {
  const school = functionSource('schoolHub', 'universityStatusMenu');
  const university = functionSource('universityStatusMenu', 'university');
  const clubs = functionSource('schoolClubs', 'dropOutConfirm');
  const classroom = functionSource('schoolClassMenu', 'schoolCliqueMenu');
  const cliques = functionSource('schoolCliqueMenu', 'schoolFacultyMenu');
  const faculty = functionSource('schoolFacultyMenu', 'skipSchool');
  const absences = functionSource('skipSchool', 'dropOutConfirm');
  const dropOut = functionSource('dropOutConfirm', 'jobRequirements');
  const modalSource = functionSource('modal', 'info');
  const worker = read('sw.js');

  for (const title of ['التعليم','الجامعة','الأنشطة المدرسية','الفصل الدراسي','المجموعات المدرسية','هيئة التدريس']) {
    assert.ok(modalSource.includes("'" + title + "'"), 'Arabic education screen should keep drawer behavior: ' + title);
  }

  for (const [source, fragment] of [
    [school, 'المرحلة الابتدائية'],
    [school, 'الشهادة الذهبية'],
    [school, 'الأنشطة المدرسية'],
    [school, 'المذاكرة بجدية'],
    [university, 'الرسوم السنوية'],
    [university, 'الأنشطة الجامعية'],
    [clubs, 'النادي الرياضي'],
    [clubs, 'نادي العلوم'],
    [classroom, 'الفصل الدراسي'],
    [classroom, 'المشاركة في فعالية مدرسية'],
    [cliques, 'مجموعة الرياضيين'],
    [cliques, 'مجموعة محبي المعرفة'],
    [faculty, 'هيئة التدريس'],
    [faculty, 'طلب مراجعة درجة'],
    [absences, 'تم تسجيل الغياب'],
    [dropOut, 'تأكيد ترك الدراسة']
  ]) assert.ok(source.includes(fragment), 'missing Arabic education UI text: ' + fragment);

  assert.doesNotMatch(school, /choice\([^,]+,'(?:Golden Diploma|Activities|Class|Cliques|Faculty|Skip School|Study Harder|Major|Back)'/);
  assert.doesNotMatch(university, /modal\('🏛️','University'/);
  assert.doesNotMatch(clubs, /modal\('🏫','Activities'/);
  assert.doesNotMatch(classroom, /modal\('✏️','Class'/);
  assert.doesNotMatch(cliques, /modal\('🤓','Cliques'/);
  assert.doesNotMatch(faculty, /modal\('👩‍🏫','Faculty'/);

  assert.ok(dropOut.includes('schoolLabels[state.education&&state.education.school]'));

  for (const id of ["sports", "science", "arts", "leadership"]) {
    assert.ok(clubs.includes("id:'" + id + "'"), 'club save id must remain stable: ' + id);
  }
  for (const id of ["sports", "nerds", "popular", "artists"]) {
    assert.ok(cliques.includes("id:'" + id + "'"), 'clique save id must remain stable: ' + id);
  }
  assert.match(school, /education\.school=state\.age<12\?'Primary School':state\.age<15\?'Middle School':state\.age<18\?'High School':'University'/);
  assert.match(app, /const KEY = 'hekayat_hayah_save_v1';/);
  assert.match(app, /return \{version:1,lifeId:/);
  assert.match(worker, /hayah-shell-v224/);
});

 
test('منافسو القتال لهم شخصيات تكتيكية حتمية ومتنوعة دون حقول حفظ جديدة', () => {
  const catalogStart = app.indexOf('const combatCommunityProfiles=[');
  const catalogEnd = app.indexOf('function combatRivalDeathAge(', catalogStart);
  const helperStart = app.indexOf('function combatOpponentArchetype(');
  const helperEnd = app.indexOf('const combatReactionCatalog=', helperStart);
  assert.ok(catalogStart >= 0 && catalogEnd > catalogStart);
  assert.ok(helperStart >= 0 && helperEnd > helperStart);
  const context = {};
  const helperSource = app.slice(catalogStart,catalogEnd) + String.fromCharCode(10) + app.slice(helperStart,helperEnd);
  const runner = [
    "const profiles=[...combatCommunityProfiles,...combatCommunityNewcomerProfiles];",
    "globalThis.profileArchetypes=profiles.map(fighter=>combatOpponentArchetype(fighter,fighter.id).id);",
    "globalThis.pressure=combatOpponentIntent({name:'مالك شريف',style:'قوة',weakTo:'سرعة',rating:75},3,'سرعة',[{style:'قوة'},{style:'سرعة'}],'malek-sherif');",
    "globalThis.watcher=combatOpponentIntent({name:'نوح عادل',style:'قوة',weakTo:'سرعة',rating:75},3,'سرعة',[{style:'قوة'},{style:'سرعة'}],'noah-adel');",
    "globalThis.stubborn=combatOpponentIntent({name:'سيف كمال',style:'قوة',weakTo:'سرعة',rating:75},3,'سرعة',[{style:'قوة'},{style:'سرعة'}],'seif-kamal');",
    "globalThis.balanced=combatOpponentIntent({name:'آدم منصور',style:'قوة',weakTo:'سرعة',rating:75},3,'سرعة',[{style:'قوة'},{style:'سرعة'}],'adam-mansour');",
    "globalThis.legacy=combatOpponentIntent({style:'قوة',rating:72},3,'سرعة',[{style:'سرعة'}]);",
    "globalThis.roundTwo=combatOpponentStyleForRound({style:'قوة',rating:20},2,'سرعة',[],'malek-sherif');",
    "globalThis.fallback=combatOpponentArchetype({style:'قوة'},'');"
  ].join(String.fromCharCode(10));
  vm.runInNewContext(helperSource + String.fromCharCode(10) + runner,context);
  const ids = new Set(Array.from(context.profileArchetypes));
  assert.deepEqual(Array.from(ids).sort(),['balanced','pressure','stubborn','watcher']);
  for(const id of ids) assert.ok(context.profileArchetypes.filter(value=>value===id).length>=3);
  assert.deepEqual([context.pressure.archetypeId,context.watcher.archetypeId,context.stubborn.archetypeId,context.balanced.archetypeId],
    ['pressure','watcher','stubborn','balanced']);
  assert.deepEqual([context.pressure.style,context.watcher.style,context.stubborn.style,context.balanced.style],
    ['تقنية','دفاع','قوة','تقنية']);
  assert.deepEqual([context.pressure.archetypeTitle,context.watcher.archetypeTitle,context.stubborn.archetypeTitle,context.balanced.archetypeTitle],
    ['مبادر','مراقب','عنيد','متزن']);
  assert.ok(context.pressure.read.includes('آخر حركة'));
  assert.ok(context.watcher.read.includes('النمط الذي بدأ به النزال'));
  assert.ok(context.stubborn.read.includes('يتمسك بخطته الأساسية'));
  assert.ok(context.balanced.read.includes('آخر اختيار لك'));
  assert.ok(context.legacy.read.includes('سجل الجولات غير مكتمل'));
  assert.equal(context.roundTwo,'تقنية');
  assert.equal(context.fallback.id,'balanced');
  assert.ok(app.includes('combatOpponentIntent(opponent,round,session.lastStyle,session.roundHistory,session.communityFighterId,rememberedRival?rememberedRival.styleMemory:[],rememberedRival?rememberedRival.moveMemory:[])'));
  assert.ok(app.includes('طابع المنافس'));
  const pendingSource=app.slice(app.indexOf('function normalizePendingCombatBout('),app.indexOf('function combatDifficultyLabel('));
  assert.ok(!pendingSource.includes('archetype'),'archetypes must not add pending-save fields');
});

 
test('سجل الألقاب القتالية يحفظ تفاصيل التتويج دون اختراع تاريخ للحفظ القديم', () => {
  const helperStart = app.indexOf('function normalizeCombatChampionshipHistory(');
  const createStart = app.indexOf('function createCombatCareer(', helperStart);
  assert.ok(helperStart >= 0 && createStart > helperStart, 'championship history helpers should be defined before career creation');
  const helperSource = app.slice(helperStart, createStart);
  const context = {};
  vm.runInNewContext(helperSource + `
    globalThis.normalize = normalizeCombatChampionshipHistory;
    globalThis.record = recordCombatChampionship;
  `, context);

  assert.deepEqual(Array.from(context.normalize(undefined)), [], 'legacy saves should not receive invented title records');
  const legacyChampion = { champion: true };
  assert.deepEqual(Array.from(context.normalize(legacyChampion.championshipHistory)), [], 'a legacy champion flag must remain without fabricated details');

  const career = { leagueWins: 4, leaguePoints: 175 };
  assert.equal(context.record(career, { name: 'منافس تجريبي' }, 34, 16), true);
  assert.deepEqual(JSON.parse(JSON.stringify(career.championshipHistory)), [{
    age: 34, year: 16, opponent: 'منافس تجريبي', leagueWins: 4, leaguePoints: 175
  }]);
  assert.equal(context.record(career, { name: 'منافس تجريبي' }, 34, 16), false, 'the same title event must not be duplicated');
  assert.equal(career.championshipHistory.length, 1);

  const oversized = Array.from({ length: 22 }, (_, index) => ({
    age: 20 + index, year: index, opponent: 'منافس ' + index, leagueWins: index, leaguePoints: index * 25
  }));
  oversized.push({ age: 'غير صالح', year: 1, opponent: 'سجل تالف' }, null);
  const normalized = context.normalize(oversized);
  assert.equal(normalized.length, 20, 'history should be bounded to the latest 20 valid title records');
  assert.equal(normalized[0].opponent, 'منافس 2');
  assert.match(app, /championshipHistory:\[\]/, 'new and legacy career defaults should include an empty optional history');
  assert.match(app, /c\.championshipHistory=normalizeCombatChampionshipHistory\(c\.championshipHistory\)/);
  assert.match(app, /recordCombatChampionship\(c,opponent,state\.age,state\.yearCount\)/);
  assert.match(app, /function combatChampionshipHistory\(/);
  assert.match(app, /سجل الألقاب/);
  assert.match(read('sw.js'), /hayah-shell-v224/);
  assert.match(app, /const KEY = 'hekayat_hayah_save_v1';/);
  assert.match(app, /return \{version:1,lifeId:/);
});


test('جمهور المقاتل والرعاية ينموان بنتائج النزالات ويحترمان شروط العقد والحفظ القديم', () => {
  const helperStart = app.indexOf('const combatSponsorshipCatalog=[');
  const helperEnd = app.indexOf('function createCombatCareer(', helperStart);
  assert.ok(helperStart >= 0 && helperEnd > helperStart, 'combat sponsorship helpers should exist before career creation');
  const context = {
    state: { fame: 95 },
    clamp: (value, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(Number(value) || 0)))
  };
  const runner = [
    'globalThis.catalog=combatSponsorshipCatalog;',
    'globalThis.legacy=normalizeCombatSponsorship(undefined);',
    "globalThis.valid=normalizeCombatSponsorship({id:'local',yearsLeft:99,annualIncome:500000,signedAge:27,signedYear:4});",
    "globalThis.invalid=normalizeCombatSponsorship({id:'unknown',yearsLeft:2,annualIncome:5000});",
    "globalThis.localEligible=combatSponsorshipEligible({rank:1,fanbase:800,retired:false,sponsorship:null},'local');",
    "globalThis.localLocked=combatSponsorshipEligible({rank:1,fanbase:749,retired:false,sponsorship:null},'local');",
    "globalThis.retiredLocked=combatSponsorshipEligible({rank:4,fanbase:50000,retired:true,sponsorship:null},'elite');",
    "globalThis.odds=combatSponsorshipOfferOdds({rank:4,fanbase:50000000},{id:'elite'});",
    'const growthCareer={fanbase:0};',
    "globalThis.winGrowth=growCombatFanbase(growthCareer,true,'league',80,3);",
    "globalThis.lossGrowth=growCombatFanbase(growthCareer,false,'street',80,3);",
    'const cappedCareer={fanbase:49999990};',
    "globalThis.capGrowth=growCombatFanbase(cappedCareer,true,'league',100,4);",
    "const contractCareer={retired:false,sponsorship:{id:'local',yearsLeft:2,annualIncome:5000,signedAge:27,signedYear:4}};",
    'globalThis.firstSettlement=settleCombatSponsorshipYear(contractCareer,1000);',
    'globalThis.remainingYears=contractCareer.sponsorship.yearsLeft;',
    'globalThis.secondSettlement=settleCombatSponsorshipYear(contractCareer,firstSettlement.bank);',
    'globalThis.expiredContract=contractCareer.sponsorship;',
    "const retiredCareer={retired:true,sponsorship:{id:'local',yearsLeft:2,annualIncome:5000}};",
    'globalThis.retiredSettlement=settleCombatSponsorshipYear(retiredCareer,1000);',
    'globalThis.retiredContract=retiredCareer.sponsorship;'
  ].join(String.fromCharCode(10));
  vm.runInNewContext(app.slice(helperStart,helperEnd)+'\n'+runner,context);
  assert.deepEqual(Array.from(context.catalog, item=>item.id),['local','regional','elite']);
  assert.equal(context.legacy,null,'old fighter saves should start with no invented sponsorship');
  assert.equal(context.invalid,null,'unknown sponsor identifiers must be discarded');
  assert.equal(context.valid.yearsLeft,2,'contract duration must not exceed the catalog duration');
  assert.equal(context.valid.annualIncome,350000,'imported annual income must be capped');
  assert.equal(context.localEligible,true);
  assert.equal(context.localLocked,false,'fanbase below the tier threshold must not qualify');
  assert.equal(context.retiredLocked,false,'retired fighters cannot negotiate new sponsorships');
  assert.equal(context.odds,88,'acceptance odds must stay within the defined upper bound');
  assert.ok(context.winGrowth.gain>context.lossGrowth.gain,'wins should grow the fanbase faster than losses');
  assert.equal(context.capGrowth.total,50000000,'fanbase must stay within the configured cap');
  assert.equal(context.firstSettlement.bank,6000);
  assert.equal(context.remainingYears,1);
  assert.equal(context.secondSettlement.bank,11000);
  assert.equal(context.secondSettlement.ended,true);
  assert.equal(context.expiredContract,null,'the contract must expire after its final annual payout');
  assert.equal(context.retiredSettlement.bank,1000,'retirement must stop future sponsorship payouts');
  assert.equal(context.retiredContract,null);
  assert.match(app,/function combatSponsorshipMenu\(\)/);
  assert.match(app,/function negotiateCombatSponsorship\(sponsorId\)/);
  assert.match(app,/choice\('📣','الجمهور وعقود الرعاية'/);
  assert.match(app,/fanbaseGain:fanbaseResult\.gain,fanbaseAfter:fanbaseResult\.total/);
  const combatDefaultsSource=functionSource('ensureCombatCareer','combatRankName');
  assert.match(combatDefaultsSource,/fanbase:0,integrity:100/);
  assert.match(combatDefaultsSource,/sponsorship:null,lastSponsorNegotiationYear:-1/);
  assert.match(app,/c\.sponsorship=c\.retired\?null:normalizeCombatSponsorship\(c\.sponsorship\)/);
  assert.match(app,/settleCombatSponsorshipYear\(cc,state\.bank\)/);
  assert.match(functionSource('retireCombatCareer','combatSponsorshipMenu'),/c\.sponsorship=null/);
  assert.match(app,/const KEY = 'hekayat_hayah_save_v1';/);
  assert.match(app,/return \{version:1,lifeId:/);
  assert.match(read('sw.js'),/hayah-shell-v224/);
});


test('المنافس يحتفظ بذاكرة تكتيكية محدودة ويستخدمها أمام اللاعب في المواجهة التالية', () => {
  const helperStart = app.indexOf('const combatCommunityProfiles=[');
  const helperEnd = app.indexOf('const combatReactionCatalog=', helperStart);
  assert.ok(helperStart >= 0 && helperEnd > helperStart, 'combat memory helpers and rival catalog should exist');
  const helperSource = app.slice(helperStart, helperEnd);
  const context = {};
  const runner = [
    "globalThis.legacy = normalizeCombatCommunity([{ id: 'adam-mansour' }], 4)[0];",
    "const rival = normalizeCombatCommunity([{ id: 'adam-mansour', styleMemory: ['سرعة', 'سرعة', 'غير صالح', 'قوة', 'سرعة'], memoryBouts: 2 }], 4)[0];",
    "globalThis.normalizedMemory = rival.styleMemory;",
    "globalThis.normalizedBouts = rival.memoryBouts;",
    "globalThis.firstRecord = recordCombatRivalStyleMemory(rival, [{ style: 'سرعة' }, { style: 'سرعة' }, { style: 'قوة' }]);",
    "globalThis.recordedMemory = rival.styleMemory;",
    "globalThis.recordedBouts = rival.memoryBouts;",
    "globalThis.adapted = combatOpponentIntent({ name: 'آدم منصور', style: 'قوة', rating: 80 }, 1, '', [], 'adam-mansour', rival.styleMemory);",
    "globalThis.noMemory = combatOpponentIntent({ name: 'آدم منصور', style: 'قوة', rating: 80 }, 1, '', [], 'adam-mansour', []);",
    "globalThis.lowAwareness = combatOpponentIntent({ name: 'آدم منصور', style: 'قوة', rating: 40 }, 1, '', [], 'adam-mansour', rival.styleMemory);",
    "globalThis.stubborn = combatOpponentIntent({ name: 'سيف كمال', style: 'سرعة', rating: 95 }, 1, '', [], 'seif-kamal', ['سرعة', 'سرعة', 'قوة']);",
    "globalThis.roundTwo = combatOpponentIntent({ name: 'آدم منصور', style: 'قوة', rating: 80 }, 2, 'قوة', [], 'adam-mansour', rival.styleMemory);",
    "globalThis.shortBout = recordCombatRivalStyleMemory(rival, [{ style: 'دفاع' }, { style: 'قوة' }]);",
    "globalThis.overlong = normalizeCombatStyleMemory(['قوة', 'سرعة', 'دفاع', 'تقنية', 'قوة', 'سرعة', 'دفاع', 'تقنية', 'قوة', 'سرعة']);"
  ].join(String.fromCharCode(10));
  vm.runInNewContext(helperSource + String.fromCharCode(10) + runner, context);

  assert.deepEqual(Array.from(context.legacy.styleMemory), [], 'old rival saves should not receive invented observations');
  assert.equal(context.legacy.memoryBouts, 0, 'old rival saves should start with no remembered bouts');
  assert.deepEqual(Array.from(context.normalizedMemory), ['سرعة', 'سرعة', 'قوة', 'سرعة'], 'invalid styles must be discarded');
  assert.equal(context.normalizedBouts, 2);
  assert.equal(context.firstRecord.added, 3, 'only a complete three-round bout should be remembered');
  assert.deepEqual(Array.from(context.recordedMemory), ['سرعة', 'سرعة', 'قوة', 'سرعة', 'سرعة', 'سرعة', 'قوة']);
  assert.equal(context.recordedBouts, 3);
  assert.equal(context.adapted.style, 'تقنية', 'a capable rival should counter the player’s repeated speed pattern');
  assert.equal(context.adapted.memoryRead, true);
  assert.match(context.adapted.read, /مواجهاتكما السابقة/);
  assert.equal(context.noMemory.style, 'قوة', 'a rival without history should keep the normal opening style');
  assert.equal(context.lowAwareness.style, 'قوة', 'low-awareness rivals should not gain an unfair memory advantage');
  assert.equal(context.stubborn.style, 'سرعة', 'stubborn rivals need a longer history before adapting');
  assert.equal(context.roundTwo.style, 'دفاع', 'within-bout adaptation must retain its existing round-two rule');
  assert.equal(context.shortBout.added, 0, 'incomplete bouts must not alter long-term memory');
  assert.equal(context.shortBout.total, 7);
  assert.deepEqual(Array.from(context.overlong), ['دفاع', 'تقنية', 'قوة', 'سرعة', 'دفاع', 'تقنية', 'قوة', 'سرعة']);
  assert.match(app, /styleMemory:normalizeCombatStyleMemory\(item\.styleMemory\)/);
  assert.match(app, /memoryBouts:bounded\(item\.memoryBouts,0,0,10000\)/);
  assert.match(app, /recordCombatRivalStyleMemory\(communityFighter,session&&session\.roundHistory\)/);
  assert.match(app, /rememberedRival\?rememberedRival\.styleMemory:\[\]/);
  assert.match(app, /ذاكرة تكتيكية/);
  assert.match(app, /const KEY = 'hekayat_hayah_save_v1';/);
  assert.match(app, /return \{version:1,lifeId:/);
  assert.match(read('sw.js'), /hayah-shell-v224/);
});


test('إعداد توجه استثمار الأشقاء يحافظ على الحفظ القديم ويحد التغيير زمنيًا', () => {
  assert.ok(app.includes('function changeSiblingInvestmentRisk('));
  assert.ok(app.includes('function siblingInvestmentRiskMenu('));
  assert.ok(app.includes('lastInvestmentRiskChangeYear'));
  assert.ok(app.includes('يمكن تغييره مرة كل 3 سنوات'));
  assert.ok(app.includes("const KEY = 'hekayat_hayah_save_v1';"));
  assert.ok(app.includes('return {version:1,lifeId:'));
  assert.match(read('sw.js'), /hayah-shell-v224/);
});



test('فاحص الحفظ يلغي القراءة السابقة ويتجاهل النتائج المتأخرة بعد اختيار ملف أحدث أو المسح', async () => {
  const checker = require('../backup-check.js');
  class FakeNode {
    constructor() {
      this.children = [];
      this.listeners = {};
      this.classList = { add() {}, remove() {} };
      this.disabled = false;
      this.value = '';
    }
    addEventListener(type, callback) { this.listeners[type] = callback; }
    appendChild(child) { this.children.push(child); return child; }
    replaceChildren(...children) { this.children = children; }
    focus() {}
    set textContent(value) { this._text = String(value); this.children = []; }
    get textContent() {
      return [this._text || '', ...this.children.map(child => child.textContent)].filter(Boolean).join(' ');
    }
  }

  const nodes = new Map([
    ['backupFile', new FakeNode()],
    ['backupDropZone', new FakeNode()],
    ['backupResult', new FakeNode()],
    ['clearBackupCheck', new FakeNode()]
  ]);
  const readers = [];
  class FakeFileReader {
    constructor() { this.result = ''; this.aborted = false; readers.push(this); }
    readAsText(file) { this.file = file; }
    abort() {
      this.aborted = true;
      if (typeof this.onabort === 'function') this.onabort();
    }
  }
  const doc = {
    getElementById(id) { return nodes.get(id) || null; },
    createElement() { return new FakeNode(); }
  };
  checker.mount(doc, { FileReader: FakeFileReader });

  const input = nodes.get('backupFile');
  const result = nodes.get('backupResult');
  const clear = nodes.get('clearBackupCheck');
  const makeFile = name => ({ name, size: 100 });
  const makeLife = (name, age) => JSON.stringify({
    version: 1, lifeId: age, name, age, stats: {}, log: [], family: [], place: {}
  });
  const reportText = () => result.textContent;
  input.listeners.change({ target: { files: [makeFile('قديم.json')] } });
  const staleReader = readers[0];
  input.listeners.change({ target: { files: [makeFile('أحدث.json')] } });
  const currentReader = readers[1];
  assert.equal(staleReader.aborted, true, 'choosing a new file should abort the previous read');

  staleReader.result = makeLife('شخصية قديمة', 20);
  await staleReader.onload();
  assert.equal(result.children.length, 0, 'a late result from the previous file must not replace the current inspection');

  currentReader.result = makeLife('الشخصية الأحدث', 21);
  await currentReader.onload();
  assert.match(reportText(), /الشخصية الأحدث/);
  assert.doesNotMatch(reportText(), /شخصية قديمة/);

  input.listeners.change({ target: { files: [makeFile('سيتم مسحه.json')] } });
  const clearedReader = readers[2];
  clear.listeners.click();
  assert.equal(clearedReader.aborted, true, 'clearing the report should cancel a pending read');
  clearedReader.result = makeLife('نتيجة بعد المسح', 22);
  await clearedReader.onload();
  assert.match(reportText(), /لم يتم اختيار ملف بعد/);
  assert.doesNotMatch(reportText(), /نتيجة بعد المسح/);
});

test('أداة فحص الحفظ تقرأ الحزم والملفات القديمة دون تعديلها أو إرسالها', () => {
  const checker = require('../backup-check.js');
  const legacy = {
    version: 1, lifeId: 77, name: 'سلمى', age: 32,
    stats: {}, log: [], family: [], place: {}
  };
  const legacyBefore = JSON.stringify(legacy);
  const legacyReport = checker.inspectBackup(legacy);
  assert.equal(legacyReport.valid, true);
  assert.equal(legacyReport.format, 'حفظ حياة منفرد — الإصدار 1');
  assert.equal(legacyReport.name, 'سلمى');
  assert.equal(legacyReport.age, 32);
  assert.ok(legacyReport.warnings.some(message => message.includes('المقبرة')));

  const bundle = {
    format: 'hayah-backup',
    backupVersion: 1,
    life: legacy,
    cemetery: [{ id: 'past-life', name: 'حياة سابقة' }],
    settings: { textScale: 'normal' },
    perks: { owned: { fighterPack: true } }
  };
  const bundleBefore = JSON.stringify(bundle);
  const bundleReport = checker.inspectBackup(bundle);
  assert.equal(bundleReport.valid, true);
  assert.equal(bundleReport.format, 'حزمة حفظ حياة كاملة');
  assert.equal(bundleReport.cemeteryCount, 1);
  assert.equal(bundleReport.hasSettings, true);
  assert.equal(bundleReport.hasPerks, true);

  const malformedBundle = { ...bundle, cemetery: [null] };
  const malformedReport = checker.inspectBackup(malformedBundle);
  assert.equal(malformedReport.valid, false);
  assert.ok(malformedReport.errors.some(message => message.includes('المقبرة')));

  const unsupportedBundle = { ...bundle, backupVersion: 2 };
  assert.equal(checker.inspectBackup(unsupportedBundle).valid, false);

  const malformedLegacy = { version: 1, stats: {}, log: [], family: [], place: {} };
  const malformedLegacyReport = checker.inspectBackup(malformedLegacy);
  assert.equal(malformedLegacyReport.valid, false);
  assert.ok(malformedLegacyReport.errors.some(message => message.includes('اسم الشخصية')));
  assert.ok(malformedLegacyReport.errors.some(message => message.includes('العمر')));

  assert.equal(JSON.stringify(legacy), legacyBefore, 'inspection must not mutate the legacy life');
  assert.equal(JSON.stringify(bundle), bundleBefore, 'inspection must not mutate the portable bundle');
  assert.equal(checker.formatBytes(1024), '1.0 كيلوبايت');
  assert.equal(checker.MAX_FILE_BYTES, 15 * 1024 * 1024);

  const source = read('backup-check.js');
  const page = read('backup-check.html');
  assert.match(source, /function compareSha256Fingerprints/);
  assert.match(source, /fingerprint-copy/);
  assert.match(source, /fingerprint-compare/);
  assert.match(page, /\.fingerprint-tools/);
  assert.match(page, /lang="ar" dir="rtl"/);
  assert.match(page, /role="status" aria-live="polite"/);
  assert.match(page, /backup-check\.js/);
  assert.doesNotMatch(source, /localStorage|fetch\s*\(|XMLHttpRequest/,
    'the checker must not write to browser storage or send file contents over the network');
  assert.match(read('sw.js'), /hayah-shell-v224/);
});

test('فاحص الحفظ يطابق شروط الاستيراد الأساسية التي يطبقها المحرك', () => {
  const checker = require('../backup-check.js');
  const makeLife = overrides => ({
    version: 1,
    lifeId: 156,
    name: 'ليلى',
    age: 37,
    stats: { happiness: 70, health: 80, smart: 60, looks: 55 },
    log: [],
    family: [],
    place: { country: 'مصر', city: 'القاهرة' },
    ...overrides
  });

  assert.equal(checker.inspectBackup(makeLife()).valid, true);
  const numericStringAge = checker.inspectBackup(makeLife({ age: '37' }));
  assert.equal(numericStringAge.valid, true, 'numeric-string ages accepted by the importer must not be rejected by the inspector');
  assert.equal(numericStringAge.age, 37);

  const normalizedAge = checker.inspectBackup(makeLife({ age: 145.7 }));
  assert.equal(normalizedAge.valid, true, 'the importer accepts ages up to 150 before normalizing them');
  assert.equal(normalizedAge.age, 120);
  assert.ok(normalizedAge.warnings.some(message => message.includes('سيُطبّع العمر إلى 120')));

  const invalidCases = [
    ['stats', { stats: null }],
    ['log', { log: null }],
    ['family', { family: null }],
    ['place', { place: [] }],
    ['age', { age: '' }]
  ];
  for (const [field, overrides] of invalidCases) {
    const report = checker.inspectBackup(makeLife(overrides));
    assert.equal(report.valid, false, field + ' is required by the actual import path');
    assert.ok(report.errors.length > 0);
  }

  const bundle = {
    format: 'hayah-backup',
    backupVersion: 1,
    life: makeLife(),
    cemetery: [{ id: 'past-life', name: 'حياة سابقة' }],
    settings: {},
    perks: {}
  };
  assert.equal(checker.inspectBackup(bundle).valid, true);

  const unnamedCemeteryEntry = checker.inspectBackup({
    ...bundle,
    cemetery: [{ id: 'past-life' }]
  });
  assert.equal(unnamedCemeteryEntry.valid, false,
    'the importer rejects cemetery entries without a non-empty name');

  assert.equal(checker.inspectBackup({ ...bundle, settings: [] }).valid, false);
  assert.equal(checker.inspectBackup({ ...bundle, perks: [] }).valid, false);

  const incompleteStats = checker.inspectBackup(makeLife({ stats: {} }));
  assert.equal(incompleteStats.valid, true);
  assert.ok(incompleteStats.warnings.some(message => message.includes('الإحصائيات')));

  const oversizedArchive = checker.inspectBackup({
    ...bundle,
    cemetery: Array.from({ length: 101 }, (_, index) => ({ name: 'حياة ' + index }))
  });
  assert.equal(oversizedArchive.valid, true);
  assert.ok(oversizedArchive.warnings.some(message => message.includes('أول 100 سجل')));
});

test('البحث في يوميات الحياة يدعم النص العربي دون المساس بحفظ الشخصية', () => {
  const search = read('diary-search.js');
  const searchCss = read('diary-search.css');
  const worker = read('sw.js');
  assert.ok(html.includes('diary-search.css'));
  assert.ok(html.includes('diary-search.js'));
  assert.ok(worker.includes('hayah-shell-v224'));
  assert.ok(worker.includes("'./diary-search.css'"));
  assert.ok(worker.includes("'./diary-search.js'"));
  assert.match(search, /aria-controls/);
  assert.match(search, /aria-live/);
  assert.match(search, /MutationObserver/);
  assert.doesNotMatch(search, /localStorage|sessionStorage|fetch\s*\(|XMLHttpRequest/);
  assert.match(searchCss, /prefers-reduced-motion/);
});

test('فاحص النسخ يفصل التقرير الطويل عن إعلان قارئ الشاشة الموجز', () => {
  assert.match(backupHtml, /id="backupResult" role="region" aria-label="نتيجة فحص ملف الحفظ" aria-live="off"/);
  assert.match(backupHtml, /id="backupAnnouncement" class="visually-hidden" role="status" aria-live="polite" aria-atomic="true"/);
  assert.match(read('backup-check.js'), /اكتمل فحص ملف الحفظ/);
});


test('كشف نتيجة السنة حسب حصص ملكية الشركة يظل للقراءة فقط ويوضح عدم وجود تحويل نقدي',()=>{
 const app=read('app.js');
 assert.ok(app.includes('function businessOwnershipEarningsSnapshot('));
 assert.ok(app.includes('function businessOwnershipEarningsMenu('));
 assert.ok(app.includes('كشف نتيجة السنة حسب الملكية'));
 assert.ok(app.includes('لا يحوّل أموالًا إلى أرصدة الملاك'));
 assert.ok(app.includes('لا ينشئ توزيعات نقدية'));
});
