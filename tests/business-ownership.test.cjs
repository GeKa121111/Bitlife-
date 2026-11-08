'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const app=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8');
function findFunction(name){
 const start=app.indexOf('function '+name+'(');assert.notEqual(start,-1,'missing runtime function: '+name);
 const bodyStart=app.indexOf('{',start);let depth=0,quote='',escaped=false,lineComment=false,blockComment=false;
 for(let index=bodyStart;index<app.length;index++){
  const char=app[index],next=app[index+1];
  if(lineComment){if(char==='\n')lineComment=false;continue;}
  if(blockComment){if(char==='*'&&next==='/'){blockComment=false;index++;}continue;}
  if(quote){if(escaped){escaped=false;continue;}if(char==='\\'){escaped=true;continue;}if(char===quote)quote='';continue;}
  if(char==='/'&&next==='/'){lineComment=true;index++;continue;}
  if(char==='/'&&next==='*'){blockComment=true;index++;continue;}
  if(char==="'"||char==='"'){quote=char;continue;}
  if(char==='{')depth++;else if(char==='}'&&--depth===0)return app.slice(start,index+1);
 }
 throw new Error('unterminated function: '+name);
}
const names=['createBusinessOwnershipLedger','normalizeBusinessOwnershipLedger','formatBusinessOwnershipPercent','businessOwnershipSnapshot','businessOwnershipEarningsSnapshot','buildInheritedBusinessOwnershipLedger','applyInheritedBusinessOwnership'];
const runtime=names.map(findFunction).join('\n');
function createApi(){
 const context={calculateEstateSnapshot(previous){return {businessEntries:previous.businessEntries||[]};}};
 vm.runInNewContext(runtime+'\nthis.api={'+names.join(',')+'};',context);
 return context.api;
}
function totalShares(ledger){return ledger.shareholders.reduce((sum,item)=>sum+item.shareBps,0);}
test('legacy businesses receive a read-only sole-owner fallback',()=>{
 const api=createApi(),company={title:'شركة قديمة',value:500000},before=JSON.stringify(company);
 const snapshot=api.businessOwnershipSnapshot(company,'heir-1','الوارث');
 assert.equal(snapshot.valid,true);assert.equal(snapshot.legacyFallback,true);assert.equal(snapshot.activeBeneficiaryId,'heir-1');
 assert.equal(snapshot.activeShareBps,10000);assert.equal(snapshot.stakeValue,500000);assert.equal(snapshot.wholeValueEstimate,500000);
 assert.equal(JSON.stringify(company),before);
});
test('inheritance splits only the active owner stake and preserves other shareholders',()=>{
 const api=createApi();
 const company={value:400000,ownershipLedger:{version:1,activeBeneficiaryId:'parent',shareholders:[
  {beneficiaryId:'parent',name:'الوالد',kind:'owner',shareBps:4000},
  {beneficiaryId:'older-sibling',name:'الأخ الأكبر',kind:'child',shareBps:6000}
 ]}};
 const accounts={accounts:[
  {beneficiaryId:'child-a',name:'الوارث الحالي',kind:'child',share:.4},
  {beneficiaryId:'child-b',name:'الأخت',kind:'child',share:.4},
  {beneficiaryId:'partner',name:'الشريك',kind:'partner',share:.2}
 ]};
 const before=JSON.stringify(company),ledger=api.buildInheritedBusinessOwnershipLedger(company,accounts,'child-a','parent','الوالد',62);
 assert.equal(ledger.auditStatus,'balanced');assert.equal(ledger.activeBeneficiaryId,'child-a');assert.equal(totalShares(ledger),10000);
 const byId=Object.fromEntries(ledger.shareholders.map(item=>[item.beneficiaryId,item.shareBps]));
 assert.equal(byId['older-sibling'],6000);assert.equal(byId['child-a'],1600);assert.equal(byId['child-b'],1600);assert.equal(byId.partner,800);
 assert.equal(JSON.stringify(company),before);
 const snapshot=api.businessOwnershipSnapshot({value:160000,ownershipLedger:ledger},'ignored','الوارث الحالي');
 assert.equal(snapshot.activeShareBps,1600);assert.equal(snapshot.wholeValueEstimate,1000000);
});
test('invalid share ledgers and unbalanced beneficiary allocations are held for review',()=>{
 const api=createApi(),invalidCompany={value:250000,ownershipLedger:{version:1,activeBeneficiaryId:'owner',shareholders:[
  {beneficiaryId:'owner',name:'مالك',shareBps:7000},{beneficiaryId:'other',name:'شريك',shareBps:2000}
 ]}};
 assert.equal(api.businessOwnershipSnapshot(invalidCompany,'owner','مالك').valid,false);
 const invalidTransfer=api.buildInheritedBusinessOwnershipLedger({value:250000},{accounts:[
  {beneficiaryId:'child-a',name:'أ',share:.6},{beneficiaryId:'child-b',name:'ب',share:.3}
 ]},'child-a','owner','مالك',70);
 assert.equal(invalidTransfer.auditStatus,'needs_review');
 assert.ok(invalidTransfer.auditIssues.includes('beneficiary_shares_not_balanced'));
});
test('business ownership stays balanced through five successive generations',()=>{
 const api=createApi();let ledger=api.createBusinessOwnershipLedger('founder','المؤسس',30),activeId='founder';
 for(let generation=1;generation<=5;generation++){
  const nextId='heir-'+generation,company={value:1000000,ownershipLedger:ledger};
  const accounts={accounts:[
   {beneficiaryId:nextId,name:'الوارث '+generation,kind:'child',share:.5},
   {beneficiaryId:'sibling-'+generation,name:'شقيق '+generation,kind:'child',share:.5}
  ]};
  ledger=api.buildInheritedBusinessOwnershipLedger(company,accounts,nextId,activeId,'المالك السابق',30+generation*20);
  assert.equal(ledger.auditStatus,'balanced');assert.equal(totalShares(ledger),10000);
  assert.ok(ledger.shareholders.some(item=>item.beneficiaryId===nextId&&item.shareBps>0));activeId=nextId;
 }
 assert.equal(ledger.shareholders.length,6);
});
test('primary and portfolio businesses receive inheritance ledgers without mutating the source owners',()=>{
 const api=createApi();
 const primary={value:200000,ownershipLedger:api.createBusinessOwnershipLedger('parent','الوالد',60)};
 const company={value:800000,ownershipLedger:api.createBusinessOwnershipLedger('parent','الوالد',60)};
 const previous={lifeId:'parent-life',name:'الوالد',age:60,legacy:{activeBeneficiaryId:'parent'},businessEntries:[
  {type:'primary',entity:primary},{type:'portfolio',entity:company}
 ]};
 const inheritance={business:{value:100000},companies:[{value:400000}]};
 const accounts={accounts:[
  {beneficiaryId:'child-a',name:'الوارث',kind:'child',share:.5},
  {beneficiaryId:'child-b',name:'الأخ',kind:'child',share:.5}
 ]};
 assert.equal(api.applyInheritedBusinessOwnership(previous,inheritance,accounts,'child-a'),true);
 assert.equal(inheritance.business.ownershipLedger.activeBeneficiaryId,'child-a');
 assert.equal(inheritance.companies[0].ownershipLedger.activeBeneficiaryId,'child-a');
 assert.equal(totalShares(inheritance.business.ownershipLedger),10000);
 assert.equal(totalShares(inheritance.companies[0].ownershipLedger),10000);
 assert.equal(primary.ownershipLedger.activeBeneficiaryId,'parent');assert.equal(company.ownershipLedger.activeBeneficiaryId,'parent');
});


test('shared business stakes cannot bypass the sale guard through the assets screen', () => {
  const sellAsset = findFunction('sellAsset');
  const sellCompany = findFunction('sellCompany');
  assert.match(sellAsset, /companyPortfolio/);
  assert.match(sellAsset, /businessOwnershipSnapshot/);
  assert.match(sellAsset, /ownership\.activeShareBps<10000/);
  assert.match(sellCompany, /businessOwnershipSnapshot/);
  assert.match(sellCompany, /ownership\.activeShareBps<10000/);
});


test('the child succession flow applies ownership using the selected beneficiary account', () => {
  assert.match(app, /const selectedOwnershipBeneficiaryId=String\(childAccounts\[index\]/);
  assert.match(app, /applyInheritedBusinessOwnership\(previous,inheritance,beneficiaryAccounts,selectedOwnershipBeneficiaryId\)/);
});


test('annual business result is allocated exactly by saved ownership shares without mutating the report',()=>{
 const api=createApi();
 const company={value:300000,ownershipLedger:{version:1,activeBeneficiaryId:'owner',shareholders:[
  {beneficiaryId:'owner',name:'المالك الحالي',kind:'owner',shareBps:4000},
  {beneficiaryId:'partner',name:'شريك العائلة',kind:'child',shareBps:6000}
 ]},financialHistory:[
  {year:2025,revenue:90000,costs:50000,profit:40000},
  {year:2026,revenue:120000,costs:70000,profit:101}
 ]};
 const before=JSON.stringify(company);
 const result=api.businessOwnershipEarningsSnapshot(company,'owner','المالك الحالي');
 assert.equal(result.valid,true);
 assert.equal(result.hasReport,true);
 assert.equal(result.year,2026);
 assert.equal(result.totalProfit,101);
 assert.equal(result.activeShareAmount,40);
 assert.deepEqual(Array.from(result.shareholders,item=>[item.beneficiaryId,item.resultShare]),[['owner',40],['partner',61]]);
 assert.equal(result.shareholders.reduce((sum,item)=>sum+item.resultShare,0),101);
 assert.equal(JSON.stringify(company),before,'the ownership statement must remain read-only');
});

test('loss allocation preserves the sign and sums exactly across all owners',()=>{
 const api=createApi();
 const company={ownershipLedger:{version:1,activeBeneficiaryId:'owner',shareholders:[
  {beneficiaryId:'owner',name:'المالك',shareBps:4000},
  {beneficiaryId:'partner',name:'الشريك',shareBps:6000}
 ]},financialHistory:[{year:2026,revenue:50000,costs:50103,profit:-103}]};
 const result=api.businessOwnershipEarningsSnapshot(company,'owner','المالك');
 assert.equal(result.totalProfit,-103);
 assert.deepEqual(Array.from(result.shareholders,item=>item.resultShare),[-41,-62]);
 assert.equal(result.shareholders.reduce((sum,item)=>sum+item.resultShare,0),-103);
 assert.equal(result.activeShareAmount,-41);
});

test('legacy sole-owner fallback and missing reports remain safe',()=>{
 const api=createApi();
 const legacy=api.businessOwnershipEarningsSnapshot({value:75000,financialHistory:[{year:'2025',revenue:100000,costs:60000}]},'legacy-owner','مالك قديم');
 assert.equal(legacy.valid,true);
 assert.equal(legacy.hasReport,true);
 assert.equal(legacy.totalProfit,40000);
 assert.equal(legacy.activeShareAmount,40000);
 assert.equal(legacy.shareholders.length,1);
 assert.equal(legacy.shareholders[0].shareBps,10000);
 const missing=api.businessOwnershipEarningsSnapshot({
  ownershipLedger:api.createBusinessOwnershipLedger('owner','مالك',30),
  financialHistory:[{year:'سنة غير صالحة',revenue:10000,costs:5000}]
 },'owner','مالك');
 assert.equal(missing.valid,true);
 assert.equal(missing.hasReport,false);
 assert.equal(missing.reason,'invalid-report-year');
 assert.equal(missing.invalidReportYearCount,1);
});


test('ownership earnings applies the same valid fiscal-year range as business insights',()=>{
 const api=createApi();
 const company={
  value:300000,
  ownershipLedger:api.createBusinessOwnershipLedger('owner','المالك',40),
  financialHistory:[
   {year:2026,revenue:100000,costs:60000,profit:40000},
   {year:0,revenue:900000,costs:0,profit:900000},
   {year:-1,revenue:800000,costs:0,profit:800000},
   {year:10000,revenue:700000,costs:0,profit:700000},
   {year:' ',revenue:600000,costs:0,profit:600000},
   {year:true,revenue:500000,costs:0,profit:500000},
   {year:'2026',revenue:120000,costs:70000,profit:50000}
  ]
 };
 const before=JSON.stringify(company);
 const result=api.businessOwnershipEarningsSnapshot(company,'owner','المالك');
 assert.equal(result.valid,true);
 assert.equal(result.hasReport,true);
 assert.equal(result.year,2026);
 assert.equal(result.totalProfit,50000,'the last valid report in the same year remains authoritative');
 assert.equal(result.invalidReportYearCount,5);
 assert.equal(result.shareholders[0].resultShare,50000);
 assert.equal(JSON.stringify(company),before,'invalid report filtering must remain read-only');
 const invalidOnly=api.businessOwnershipEarningsSnapshot({
  ownershipLedger:api.createBusinessOwnershipLedger('owner','المالك',40),
  financialHistory:[{year:0,revenue:10000,costs:0},{year:10000,revenue:20000,costs:0}]
 },'owner','المالك');
 assert.equal(invalidOnly.hasReport,false);
 assert.equal(invalidOnly.reason,'invalid-report-year');
 assert.equal(invalidOnly.invalidReportYearCount,2);
});
test('invalid ownership ledger never produces a shareholder earnings statement',()=>{
 const api=createApi();
 const result=api.businessOwnershipEarningsSnapshot({
  ownershipLedger:{version:1,activeBeneficiaryId:'owner',shareholders:[
   {beneficiaryId:'owner',name:'مالك',shareBps:7000},
   {beneficiaryId:'partner',name:'شريك',shareBps:2000}
  ]},
  financialHistory:[{year:2026,revenue:100000,costs:50000,profit:50000}]
 },'owner','مالك');
 assert.equal(result.valid,false);
 assert.equal(result.hasReport,false);
 assert.equal(result.shareholders.length,0);
});

test('ownership screen exposes the read-only annual statement and discloses that no cash is paid',()=>{
 const menu=findFunction('businessOwnershipMenu');
 const earningsMenu=findFunction('businessOwnershipEarningsMenu');
 assert.match(menu,/businessOwnershipEarningsMenu/);
 assert.match(menu,/كشف نتيجة السنة حسب الملكية/);
 assert.match(earningsMenu,/لا يحوّل أموالًا إلى أرصدة الملاك/);
 assert.match(earningsMenu,/لا ينشئ توزيعات نقدية/);
  assert.match(earningsMenu,/invalid-report-year/);
  assert.match(earningsMenu,/تم تجاهل/);
});
