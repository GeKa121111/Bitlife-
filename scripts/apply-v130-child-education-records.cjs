'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
function replaceOnce(source, before, after, label) {
  const count = source.split(before).length - 1;
  if (count !== 1) throw new Error(label + ': expected exactly one source match, found ' + count);
  return source.replace(before, after);
}
function replaceInFunction(source, startMarker, endMarker, before, after, label) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0) throw new Error(label + ': function boundary not found');
  const block = replaceOnce(source.slice(start, end), before, after, label);
  return source.slice(0, start) + block + source.slice(end);
}

let app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const oldEvent = [
"  C('أساعده يقارن الاختيارات','خليه يفهم المميزات والالتزامات',{happiness:4,smart:3},'ساعدته يوازن بين اهتمامه والوقت والتكلفة.',{followUp:{delay:2,icon:'🎓',title:'أثر التوجيه التعليمي',text:'بعد سنتين، استقر ابنك على مسار يناسب اهتمامه وبدأ يحقق تقدمًا واضحًا.',effects:{happiness:3,smart:1}}}),",
"  C('أوفر له دعمًا مناسبًا','سانده من غير ضغط',{happiness:5,smart:1},'حس إنك بتدعمه، واتفقتم على ميزانية واضحة.',{cost:1800,followUp:{delay:2,icon:'🏅',title:'أثر الدعم التعليمي',text:'بعد سنتين، أكمل ابنك مرحلة تدريبية وحصل على فرصة دعم جزئي خففت جزءًا من مصروفات الأسرة.',effects:{bank:1200,happiness:4}}}),",
"  C('أسيبه يجرّب بنفسه','التجربة جزء من التعلم',{happiness:2,smart:2},'احترمت اختياره وفضلت موجود لو احتاج نصيحة.',{followUp:{delay:2,icon:'🌱',title:'نتيجة التجربة التعليمية',text:'بعد سنتين، ساعدته التجربة يحدد المجال الأقرب لاهتمامه ويختار خطوة عملية تالية.',effects:{smart:2,happiness:2}}})",
" ],'children'),"
].join('\n');
const newEvent = [
"  C('أساعده يقارن الاختيارات','خليه يفهم المميزات والالتزامات',{happiness:4,smart:3},'ساعدته يوازن بين اهتمامه والوقت والتكلفة.',{followUp:{delay:2,icon:'🎓',title:'أثر التوجيه التعليمي',text:'بعد سنتين، استقر ابنك على مسار يناسب اهتمامه وبدأ يحقق تقدمًا واضحًا.',effects:{happiness:3,smart:1},childEducation:{kind:'guided',metrics:{schoolSupport:6,schoolPerformance:3,careerPotential:2,smart:1}}}}),",
"  C('أوفر له دعمًا مناسبًا','سانده من غير ضغط',{happiness:5,smart:1},'حس إنك بتدعمه، واتفقتم على ميزانية واضحة.',{cost:1800,followUp:{delay:2,icon:'🏅',title:'أثر الدعم التعليمي',text:'بعد سنتين، أكمل ابنك مرحلة تدريبية وحصل على فرصة دعم جزئي خففت جزءًا من مصروفات الأسرة.',effects:{bank:1200,happiness:4},childEducation:{kind:'supported',metrics:{schoolSupport:10,schoolPerformance:4,careerPotential:2,smart:1}}}}),",
"  C('أسيبه يجرّب بنفسه','التجربة جزء من التعلم',{happiness:2,smart:2},'احترمت اختياره وفضلت موجود لو احتاج نصيحة.',{followUp:{delay:2,icon:'🌱',title:'نتيجة التجربة التعليمية',text:'بعد سنتين، ساعدته التجربة يحدد المجال الأقرب لاهتمامه ويختار خطوة عملية تالية.',effects:{smart:2,happiness:2},childEducation:{kind:'explored',metrics:{schoolSupport:3,schoolPerformance:1,careerPotential:4,smart:2}}}})",
" ],'schoolChild'),"
].join('\n');
app = replaceOnce(app, oldEvent, newEvent, 'family education event');
app = replaceOnce(
  app,
  "if(r==='children')return (state.children||[]).length>0;",
  "if(r==='children')return (state.children||[]).length>0;if(r==='schoolChild')return (state.children||[]).some(c=>c&&Number(c.age)>=6&&Number(c.age)<=15);",
  'school-age event eligibility'
);
app = replaceOnce(
  app,
  " return safeEffects;\n}\nfunction normalizePendingLifeConsequences(items,currentAge){",
  [
    " return safeEffects;",
    "}",
    "function sanitizeChildEducationOutcome(raw){",
    " if(!raw||typeof raw!=='object'||Array.isArray(raw))return null;",
    " const kind=String(raw.kind||'');",
    " if(!['guided','supported','explored'].includes(kind))return null;",
    " const source=raw.metrics&&typeof raw.metrics==='object'&&!Array.isArray(raw.metrics)?raw.metrics:{};",
    " const limits={schoolSupport:20,schoolPerformance:10,careerPotential:10,smart:10};",
    " const metrics={};",
    " Object.keys(limits).forEach(key=>{const value=Number(source[key]);if(Number.isFinite(value)&&value>0)metrics[key]=Math.min(limits[key],Math.max(1,Math.round(value)));});",
    " if(!Object.keys(metrics).length)return null;",
    " return {kind,metrics};",
    "}",
    "function normalizePendingLifeConsequences(items,currentAge){"
  ].join('\n'),
  'child education outcome sanitizer'
);
app = replaceOnce(
  app,
  "  const safeEffects=sanitizeLifeConsequenceEffects(item.effects);\n  if(!Object.keys(safeEffects).length)return;\n  seen.add(id);",
  [
    "  const safeEffects=sanitizeLifeConsequenceEffects(item.effects);",
    "  if(!Object.keys(safeEffects).length)return;",
    "  const hasChildEducation=Object.prototype.hasOwnProperty.call(item,'childEducation');",
    "  const childEducation=hasChildEducation?sanitizeChildEducationOutcome(item.childEducation):null;",
    "  const targetChildId=String(item.targetChildId||'').trim().slice(0,180);",
    "  if(hasChildEducation&&(!childEducation||!targetChildId))return;",
    "  seen.add(id);"
  ].join('\n'),
  'normalize delayed child education payload'
);
app = replaceOnce(
  app,
  "   tone:item.tone==='good'?'good':'special'\n  });",
  "   tone:item.tone==='good'?'good':'special',\n   ...(hasChildEducation?{targetChildId,childEducation}:{})\n  });",
  'persist child education payload'
);
app = replaceOnce(
  app,
  "function queueLifeConsequence(followUp){",
  [
    "function selectChildForEducationOutcome(){",
    " if(!state||!Array.isArray(state.children))return null;",
    " const eligible=state.children.filter(child=>child&&typeof child==='object').map(child=>ensureChildGrowthProfile(child)).filter(child=>child&&String(child.id||'').trim()&&Number(child.age)>=6&&Number(child.age)<=15);",
    " eligible.sort((a,b)=>Number(a.schoolPerformance)-Number(b.schoolPerformance)||Number(b.age)-Number(a.age)||String(a.id).localeCompare(String(b.id)));",
    " return eligible[0]||null;",
    "}",
    "function queueLifeConsequence(followUp){"
  ].join('\n'),
  'school child selection helper'
);
app = replaceOnce(
  app,
  " const safeEffects=sanitizeLifeConsequenceEffects(followUp.effects);\n if(!title||!text||!Object.keys(safeEffects).length)return false;",
  [
    " const safeEffects=sanitizeLifeConsequenceEffects(followUp.effects);",
    " const hasChildEducation=Object.prototype.hasOwnProperty.call(followUp,'childEducation');",
    " const childEducation=hasChildEducation?sanitizeChildEducationOutcome(followUp.childEducation):null;",
    " const targetChild=hasChildEducation?selectChildForEducationOutcome():null;",
    " const targetChildId=String(targetChild&&targetChild.id||'').trim().slice(0,180);",
    " if(!title||!text||!Object.keys(safeEffects).length)return false;",
    " if(hasChildEducation&&(!childEducation||!targetChildId))return false;"
  ].join('\n'),
  'queue child education outcome'
);
app = replaceOnce(
  app,
  "  tone:followUp.tone==='good'?'good':'special'\n });",
  "  tone:followUp.tone==='good'?'good':'special',\n  ...(hasChildEducation?{targetChildId,childEducation}:{})\n });",
  'store selected child with queued outcome'
);
app = replaceOnce(
  app,
  "  const safeEffects=sanitizeLifeConsequenceEffects(item.effects);\n  if(Object.keys(safeEffects).length)effects(safeEffects);",
  "  if(item.childEducation&&!applyChildEducationOutcome(item)){processed++;return;}\n  const safeEffects=sanitizeLifeConsequenceEffects(item.effects);\n  if(Object.keys(safeEffects).length)effects(safeEffects);",
  'apply delayed outcome to the selected child'
);
app = replaceOnce(
  app,
  " if(!Array.isArray(c.growthHistory))c.growthHistory=[];if(!Array.isArray(c.interactions))c.interactions=[];\n c.age=Math.min(100,Math.floor(age));",
  " if(!Array.isArray(c.growthHistory))c.growthHistory=[];if(!Array.isArray(c.interactions))c.interactions=[];if(!Array.isArray(c.educationHistory))c.educationHistory=[];c.educationHistory=c.educationHistory.filter(entry=>entry&&typeof entry==='object'&&String(entry.id||'').trim()&&String(entry.title||'').trim()).slice(-12);\n c.age=Math.min(100,Math.floor(age));",
  'legacy child education history normalization'
);
app = replaceOnce(
  app,
  "function childCareerFromInterest(interest){",
  [
    "function recordChildEducationHistory(child,entry){",
    " const c=ensureChildGrowthProfile(child),source=entry&&typeof entry==='object'?entry:{};",
    " if(!c)return false;",
    " const id=String(source.id||'').trim().slice(0,180),title=String(source.title||'').trim().slice(0,100);",
    " const kind=String(source.kind||'');",
    " if(!id||!title||!['school','study','career','guided','supported','explored'].includes(kind))return false;",
    " if(c.educationHistory.some(item=>item&&item.id===id))return false;",
    " c.educationHistory.push({id,age:Math.max(0,Math.min(100,Math.floor(Number(c.age)||0))),familyAge:Math.max(0,Math.min(150,Math.floor(Number(source.familyAge??(state&&state.age))||0))),kind,title,track:String(source.track||c.interest||'مسار عام').slice(0,80),note:String(source.note||'').slice(0,240),stage:childDevelopmentStage(c.age),schoolPerformance:c.schoolPerformance,schoolSupport:c.schoolSupport,careerPotential:c.careerPotential,smart:c.smart});",
    " if(c.educationHistory.length>12)c.educationHistory.splice(0,c.educationHistory.length-12);",
    " return true;",
    "}",
    "function applyChildEducationOutcome(item){",
    " if(!item||!item.childEducation||!item.targetChildId||!state||!Array.isArray(state.children))return false;",
    " const child=state.children.find(candidate=>candidate&&String(candidate.id||'')===String(item.targetChildId));",
    " const outcome=sanitizeChildEducationOutcome(item.childEducation);",
    " if(!child||!outcome)return false;",
    " ensureChildGrowthProfile(child);",
    " if(child.educationHistory.some(entry=>entry&&entry.id===item.id))return false;",
    " Object.keys(outcome.metrics).forEach(key=>{child[key]=clamp(Number(child[key]||0)+outcome.metrics[key]);});",
    " return recordChildEducationHistory(child,{id:item.id,age:child.age,familyAge:state.age,kind:outcome.kind,title:item.title,note:item.text,track:child.interest});",
    "}",
    "function childEducationHistoryMarkup(child){",
    " const entries=Array.isArray(child&&child.educationHistory)?child.educationHistory.slice(-3).reverse():[];",
    " const rows=entries.map(entry=>'<div class=\"child-growth-metric\"><div><span>'+esc(entry.title)+'</span><b>'+fmt(entry.age)+' سنة</b></div><small>'+esc(entry.track||'مسار عام')+' · تحصيل '+fmt(entry.schoolPerformance)+'%</small></div>').join('');",
    " return '<div class=\"child-growth-panel\"><div class=\"child-growth-heading\">سجل التعليم والتوجيه</div>'+(rows||'<div class=\"pill\">لم تُسجل محطات تعليمية بعد.</div>')+'</div>';",
    "}",
    "function childCareerFromInterest(interest){"
  ].join('\n'),
  'child education record and history helpers'
);

app = replaceInFunction(
  app,
  "function childMenu(i){",
  "\nfunction childAction(",
  "</div></div></div>';",
  "</div></div></div>'+childEducationHistoryMarkup(c);",
  'render child education history in child profile'
);
app = replaceInFunction(
  app,
  "function childAction(i,action){",
  "\nfunction ",
  " if(!Array.isArray(c.interactions))c.interactions=[];",
  [
    " if(['school','study','career'].includes(action)){",
    "  const titles={school:'مساهمة تعليمية',study:'دعم التفوق الدراسي',career:'توجيه مهني'};",
    "  recordChildEducationHistory(c,{id:String(state.lifeId||'life')+':'+state.age+':'+String(c.id||i)+':'+action+':'+Math.random().toString(36).slice(2,8),familyAge:state.age,kind:action,title:titles[action],note:text,track:c.interest});",
    " }",
    " if(!Array.isArray(c.interactions))c.interactions=[];"
  ].join('\n'),
  'record direct education actions'
);
fs.writeFileSync(path.join(root, 'app.js'), app);

let quality = fs.readFileSync(path.join(root, 'tests/quality.test.cjs'), 'utf8');
quality = replaceOnce(
  quality,
  "assert.deepEqual(contextual, ['business', 'children', 'job', 'job', 'partner']);",
  "assert.deepEqual(contextual, ['business', 'job', 'job', 'partner', 'schoolChild']);",
  'event contextual requirement expectation'
);
quality = replaceOnce(
  quality,
  "assert.equal(byTitle.get('قرار تعليمي للأسرة').requires, 'children');",
  [
    "assert.equal(byTitle.get('قرار تعليمي للأسرة').requires, 'schoolChild');",
    "  const educationKinds=['guided','supported','explored'];",
    "  byTitle.get('قرار تعليمي للأسرة').choices.forEach((option,index)=>{",
    "    assert.equal(option.followUp.childEducation.kind,educationKinds[index]);",
    "    assert.ok(Object.keys(option.followUp.childEducation.metrics).length>0);",
    "  });"
  ].join('\n'),
  'assert child-school-age event gate and outcome payloads'
);
quality = replaceOnce(
  quality,
  "const normalizeSource = functionSource('normalizePendingLifeConsequences', 'queueLifeConsequence');",
  "const normalizeSource = functionSource('normalizePendingLifeConsequences', 'selectChildForEducationOutcome');",
  'separate queue helper source in queue test'
);
quality = replaceOnce(
  quality,
  "const state = { lifeId: 125, age: 30, pendingLifeConsequences: [] };",
  "const state = { lifeId: 125, age: 30, pendingLifeConsequences: [], children: [{id:'education-target',age:10,smart:55,health:80,happiness:70,schoolPerformance:42,careerPotential:48,schoolSupport:3,independence:0,interest:'العلوم والتقنية',educationHistory:[]}] };",
  'queue test child fixture'
);
quality = replaceOnce(
  quality,
  "  const queueContext = { state };",
  [
    "  const queueContext = {",
    "    state,",
    "    clamp(value,min=0,max=100){const n=Number(value);return Number.isFinite(n)?Math.max(min,Math.min(max,Math.round(n))):min;},",
    "    ensureChildGrowthProfile(child){if(!Array.isArray(child.educationHistory))child.educationHistory=[];return child;}",
    "  };"
  ].join('\n'),
  'queue test child selection context'
);
quality = replaceOnce(
  quality,
  "vm.runInNewContext(sanitizeSource + '\\n' + normalizeSource + '\\n' + queueSource",
  "vm.runInNewContext(sanitizeSource + '\\n' + functionSource('sanitizeChildEducationOutcome', 'normalizePendingLifeConsequences') + '\\n' + normalizeSource + '\\n' + functionSource('selectChildForEducationOutcome', 'queueLifeConsequence') + '\\n' + queueSource",
  'include child education queue helpers in regression test'
);

const childEducationRegression = [
"",
"test('النتيجة التعليمية المؤجلة تُطبق على الابن المستهدف وتُحفظ في سجله مرة واحدة', () => {",
"  const sources = [",
"    functionSource('sanitizeLifeConsequenceEffects', 'sanitizeChildEducationOutcome'),",
"    functionSource('sanitizeChildEducationOutcome', 'normalizePendingLifeConsequences'),",
"    functionSource('normalizePendingLifeConsequences', 'selectChildForEducationOutcome'),",
"    functionSource('selectChildForEducationOutcome', 'queueLifeConsequence'),",
"    functionSource('queueLifeConsequence', 'randomEvent'),",
"    functionSource('childDevelopmentStage', 'ensureChildGrowthProfile'),",
"    functionSource('ensureChildGrowthProfile', 'recordChildEducationHistory'),",
"    functionSource('recordChildEducationHistory', 'applyChildEducationOutcome'),",
"    functionSource('applyChildEducationOutcome', 'childEducationHistoryMarkup'),",
"    functionSource('childEducationHistoryMarkup', 'childCareerFromInterest'),",
"    functionSource('resolveLifeConsequences', 'advanceAge')",
"  ].join('\\n');",
"  const state = {lifeId:501,age:30,pendingLifeConsequences:[],children:[",
"    {id:'adult-child',age:21,smart:55,health:80,happiness:70,schoolPerformance:20,careerPotential:55,schoolSupport:0,independence:40,interest:'الأعمال'},",
"    {id:'high-score-child',age:12,smart:65,health:85,happiness:80,schoolPerformance:78,careerPotential:60,schoolSupport:2,independence:0,interest:'الرياضة'},",
"    {id:'target-child',age:10,smart:55,health:82,happiness:75,schoolPerformance:44,careerPotential:50,schoolSupport:3,independence:0,interest:'العلوم والتقنية'}",
"  ]};",
"  const applied=[],logs=[];",
"  const context={state,clamp(value,min=0,max=100){const n=Number(value);return Number.isFinite(n)?Math.max(min,Math.min(max,Math.round(n))):min;},pick(values){return values[0];},effects(value){applied.push({...value});},log(...args){logs.push(args);},esc(value){return String(value);},fmt(value){return String(value);}};",
"  vm.runInNewContext(sources+",
"    '\\nglobalThis.queued=queueLifeConsequence({delay:2,title:\"أثر التوجيه التعليمي\",text:\"تم تسجيل تقدم دراسي للابن.\",effects:{happiness:2},childEducation:{kind:\"guided\",metrics:{schoolSupport:6,schoolPerformance:3,careerPotential:2,smart:1}}});'+",
"    '\\nglobalThis.targetId=state.pendingLifeConsequences[0].targetChildId;',context);",
"  assert.equal(context.queued,true);",
"  assert.equal(context.targetId,'target-child','the lowest-performing school-age child should be selected, not an adult or a higher-performing sibling');",
"  state.age=31;state.children[2].age=11;context.resolveLifeConsequences();",
"  assert.equal(state.children[2].schoolPerformance,44,'the educational outcome must not appear early');",
"  assert.equal(state.pendingLifeConsequences.length,1);",
"  state.age=32;state.children[2].age=12;context.resolveLifeConsequences();",
"  assert.equal(state.children[2].schoolPerformance,47);",
"  assert.equal(state.children[2].schoolSupport,9);",
"  assert.equal(state.children[2].careerPotential,52);",
"  assert.equal(state.children[2].smart,56);",
"  assert.equal(state.children[2].educationHistory.length,1);",
"  assert.equal(state.children[2].educationHistory[0].id,state.lifeId+':30:أثر التوجيه التعليمي');",
"  assert.equal(state.pendingLifeConsequences.length,0);",
"  assert.deepEqual(JSON.parse(JSON.stringify(applied)),[{happiness:2}]);",
"  context.resolveLifeConsequences();",
"  assert.equal(state.children[2].schoolPerformance,47,'a resolved child outcome must not be applied twice');",
"  assert.equal(state.children[2].educationHistory.length,1);",
"  vm.runInNewContext('globalThis.historyMarkup=childEducationHistoryMarkup(state.children[2]);',context);",
"  assert.match(context.historyMarkup,/سجل التعليم والتوجيه/);",
"  assert.match(context.historyMarkup,/أثر التوجيه التعليمي/);",
"  const legacy={id:'legacy-child',age:9,smart:40,health:75,happiness:70,schoolPerformance:55,careerPotential:45,schoolSupport:0,interest:'الفنون والإبداع'};",
"  context.ensureChildGrowthProfile(legacy);",
"  assert.deepEqual(Array.from(legacy.educationHistory),[],'legacy children should receive an empty optional education history');",
"  assert.match(functionSource('childMenu','childAction'),/childEducationHistoryMarkup\\(c\\)/);",
"  assert.ok(app.includes('recordChildEducationHistory(c,{'),'direct education support actions should also leave a child history entry');",
"});",
""
].join('\n');
quality = replaceOnce(
  quality,
  "test('تحميل طابور التبعات ينظف السجلات التالفة ويحتفظ بالنتائج المستحقة ويحد الحجم', () => {",
  childEducationRegression + "test('تحميل طابور التبعات ينظف السجلات التالفة ويحتفظ بالنتائج المستحقة ويحد الحجم', () => {",
  'add child education application and persistence regression test'
);
fs.writeFileSync(path.join(root, 'tests/quality.test.cjs'), quality);

let sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
sw = replaceOnce(sw, 'hayah-shell-v129', 'hayah-shell-v130', 'PWA cache version');
fs.writeFileSync(path.join(root, 'sw.js'), sw);

const testsDir = path.join(root, 'tests');
for (const name of fs.readdirSync(testsDir).filter(file => file.endsWith('.cjs'))) {
  const filePath = path.join(testsDir, name);
  const source = fs.readFileSync(filePath, 'utf8');
  const updated = source.replaceAll('hayah-shell-v129', 'hayah-shell-v130');
  if (updated !== source) fs.writeFileSync(filePath, updated);
}

const releaseNote = [
  "",
  "",
  "## الإصدار v130 — سجل تعليمي فعلي لكل ابن",
  "",
  "- نتائج قرارات التوجيه والدعم والتجربة التعليمية تُربط بابن محدد من الأبناء الموجودين في سن الدراسة (6–15 سنة عند تسجيل القرار).",
  "- يتم اختيار الابن الأقل تحصيلًا دراسيًا من المؤهلين، وتُطبق النتيجة بعد سنتين على التحصيل والدعم الدراسي والاستعداد المهني والذكاء.",
  "- يظهر سجل آخر المحطات التعليمية داخل ملف الابن، ويُحفظ بحد أقصى 12 محطة مع منع تكرار النتيجة نفسها.",
  "- دعم التعليم والتفوق والتوجيه المهني المباشر يضيف أيضًا محطة إلى سجل الابن.",
  "- الحقل الاختياري educationHistory يُنشأ فارغًا تلقائيًا للأبناء في الحفظ القديم؛ لا تغيير لمفتاح hekayat_hayah_save_v1 أو version: 1 أو تنسيق النسخ الاحتياطي.",
  "- لم يتم حذف أو إعادة تسمية أي ملف. كاش PWA أصبح hayah-shell-v130."
].join('\n');
for (const docPath of ['README.md', 'BITLIFE_PARITY_ROADMAP.md']) {
  const fullPath = path.join(root, docPath);
  const source = fs.readFileSync(fullPath, 'utf8');
  if (!source.includes('سجل تعليمي فعلي لكل ابن')) {
    fs.writeFileSync(fullPath, source.replace(/\s*$/, '') + releaseNote + '\n');
  }
}
console.log('v130 child education records patch applied successfully.');
