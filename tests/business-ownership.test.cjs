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
const names=['createBusinessOwnershipLedger','normalizeBusinessOwnershipLedger','formatBusinessOwnershipPercent','businessOwnershipSnapshot','buildInheritedBusinessOwnershipLedger','applyInheritedBusinessOwnership'];
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
