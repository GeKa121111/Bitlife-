'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const businessInsights=require('../business-insights.js');
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
const names=['createBusinessOwnershipLedger','normalizeBusinessOwnershipLedger','formatBusinessOwnershipPercent','businessOwnershipSnapshot','businessOwnershipEarningsSnapshot','businessDividendReadinessSnapshot','businessCreditBalance','businessTaxLiability','businessUsesSeparateTreasury','businessTreasuryBalance','normalizeBusinessDividendLedger','businessDividendPendingLiability','businessDividendEscrowBalance','allocateBusinessDividendShares','businessDividendClaimableSnapshot','applyBusinessDividendDistribution','applyBusinessDividendClaims','inheritBusinessDividendClaims','calculateEstateSnapshot','buildInheritedBusinessOwnershipLedger','applyInheritedBusinessOwnership'];
const runtime=names.map(findFunction).join('\n');
function createApi(){
 const context={state:{bank:0}};
 vm.runInNewContext(runtime+'\nthis.api={'+names.join(',')+'};',context);
 return context.api;
}
function createMenuApi(){
 const calls={modal:null};
 const context={
  state:{lifeId:'owner',name:'الوارث',age:45},
  cash:value=>String(value),
  choice:(icon,title,description,callback,amount)=>({icon,title,description,callback,amount}),
  modal:(...args)=>{calls.modal=args;},
  info:()=>{},
  businessOwnershipEarningsMenu:()=>{},
  businessDividendReadinessMenu:()=>{},
  businessDividendDistributionMenu:()=>{},
  claimBusinessDividendPayments:()=>{},
  companyPortfolioMenu:()=>{}
 };
 vm.runInNewContext(runtime+'\n'+findFunction('businessOwnershipMenu')+'\nthis.api={businessOwnershipMenu};',context);
 return {api:context.api,calls};
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
 const previous={lifeId:'parent-life',name:'الوالد',age:60,legacy:{activeBeneficiaryId:'parent'},business:primary,companies:[company],assets:[],investments:[],bank:0,debt:0};
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
  assert.match(sellAsset, /businessDividendPendingLiability/);
  assert.match(sellAsset, /businessDividendEscrowBalance/);
  assert.match(sellCompany, /businessDividendPendingLiability/);
  assert.match(sellCompany, /businessDividendEscrowBalance/);
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

test('dividend readiness estimates separate-treasury cash after tax, credit and reserve without mutating saved data',()=>{
 const api=createApi();
 const company={
  value:500000,
  treasuryMode:'separate',
  cashBalance:1000001,
  taxLiability:100000,
  credit:{principal:150000,accruedInterest:50000},
  ownershipLedger:{version:1,activeBeneficiaryId:'owner',shareholders:[
   {beneficiaryId:'owner',name:'المالك الحالي',kind:'owner',shareBps:4000},
   {beneficiaryId:'partner',name:'شريك العائلة',kind:'child',shareBps:6000}
  ]},
  financialHistory:[
   {year:2026,costs:800000},
   {year:0,costs:900000},
   {year:'2026',costs:400000}
  ]
 };
 const before=JSON.stringify(company);
 const result=api.businessDividendReadinessSnapshot(company,'owner','المالك الحالي');
 assert.equal(result.ready,true);
 assert.equal(result.year,2026);
 assert.equal(result.cashBalance,1000001);
 assert.equal(result.taxLiability,100000);
 assert.equal(result.creditBalance,200000);
 assert.equal(result.reserve,100000,'the reserve uses one quarter of the latest valid annual costs');
 assert.equal(result.distributable,600001);
 assert.equal(result.activeShareAmount,240000);
 assert.deepEqual(Array.from(result.shareholders,item=>[item.beneficiaryId,item.potentialAmount]),[['owner',240000],['partner',360001]]);
 assert.equal(result.shareholders.reduce((sum,item)=>sum+item.potentialAmount,0),600001);
 assert.equal(result.invalidReportYearCount,1);
 assert.equal(JSON.stringify(company),before,'the readiness estimate must not mutate saved company data');
});

test('dividend readiness never treats the shared personal wallet as company treasury',()=>{
 const api=createApi();
 const company={treasuryMode:'shared',cashBalance:900000,financialHistory:[{year:2026,costs:100000}]};
 const before=JSON.stringify(company);
 const result=api.businessDividendReadinessSnapshot(company,'owner','المالك');
 assert.equal(result.ready,false);
 assert.equal(result.reason,'shared-treasury');
 assert.equal(result.distributable,0);
 assert.equal(JSON.stringify(company),before);
});


test('inherited-stake treasury keeps prior claims available but blocks new dividend declarations',()=>{
 const api=createApi();
 const company={
  value:150000,
  treasuryMode:'separate',
  dividendTreasuryScope:'inherited-stake',
  cashBalance:25000,
  dividendEscrowBalance:800,
  ownershipLedger:{version:1,activeBeneficiaryId:'owner',shareholders:[
   {beneficiaryId:'owner',name:'الوارث الحالي',kind:'child',shareBps:5000},
   {beneficiaryId:'partner',name:'الشريك',kind:'partner',shareBps:5000}
  ]},
  dividendLedger:{version:1,entries:[{
   id:'dividend-2026',year:2026,declaredAtAge:40,createdBy:'owner',totalAmount:1000,
   allocations:[
    {beneficiaryId:'owner',name:'الوارث الحالي',kind:'child',shareBps:5000,amount:500},
    {beneficiaryId:'partner',name:'الشريك',kind:'partner',shareBps:5000,amount:500}
   ],
   claims:[
    {beneficiaryId:'owner',name:'الوارث الحالي',amount:500,paidAmount:200,paidAtAge:39},
    {beneficiaryId:'partner',name:'الشريك',amount:500,paidAmount:0,paidAtAge:null}
   ]
  }]},
  financialHistory:[{year:2026,costs:10000}]
 };
 const before=JSON.stringify(company);
 const readiness=api.businessDividendReadinessSnapshot(company,'owner','الوارث الحالي');
 assert.equal(readiness.ready,false);
 assert.equal(readiness.reason,'inherited-stake-treasury');
 const claimable=api.businessDividendClaimableSnapshot(company,'owner');
 assert.equal(claimable.valid,true);
 assert.equal(claimable.amount,300,'the inherited active owner can still collect an already-recorded claim');
 const claim=api.applyBusinessDividendClaims(company,'owner',45,1000);
 assert.equal(claim.ok,true);
 assert.equal(claim.amount,300);
 assert.equal(claim.escrowBalanceAfter,500);
 assert.equal(JSON.stringify(company),before,'readiness and claim previews must not mutate the inherited record');

 const menu=createMenuApi();
 menu.api.businessOwnershipMenu(company);
 const inheritedTitles=Array.from(menu.calls.modal[3],item=>item.title);
 assert.ok(inheritedTitles.includes('استلام مستحقاتك 300'));
 assert.ok(inheritedTitles.includes('التوزيعات الجديدة متوقفة مؤقتًا'));
 assert.ok(!inheritedTitles.includes('اعتماد توزيع أرباح سنوي'),'the inherited stake must not advertise a declaration action');

 const normalCompany={...company};
 delete normalCompany.dividendTreasuryScope;
 delete normalCompany.dividendLedger;
 delete normalCompany.dividendEscrowBalance;
 const normalMenu=createMenuApi();
 normalMenu.api.businessOwnershipMenu(normalCompany);
 const normalTitles=Array.from(normalMenu.calls.modal[3],item=>item.title);
 assert.ok(normalTitles.includes('اعتماد توزيع أرباح سنوي'),'normal company treasuries retain the annual declaration action');
});

test('dividend readiness refuses missing or invalid financial baselines',()=>{
 const api=createApi();
 const company={treasuryMode:'separate',cashBalance:500000,financialHistory:[
  {year:0,costs:10000},{year:'غير معروف',costs:20000}
 ]};
 const result=api.businessDividendReadinessSnapshot(company,'owner','المالك');
 assert.equal(result.ready,false);
 assert.equal(result.reason,'invalid-report-year');
 assert.equal(result.invalidReportYearCount,2);
 const invalidCosts=api.businessDividendReadinessSnapshot({
  treasuryMode:'separate',cashBalance:500000,financialHistory:[{year:2026,costs:''}]
 },'owner','المالك');
 assert.equal(invalidCosts.ready,false);
 assert.equal(invalidCosts.reason,'invalid-financial-result');
 const negativeCosts=api.businessDividendReadinessSnapshot({
  treasuryMode:'separate',cashBalance:500000,financialHistory:[{year:2026,costs:-100}]
 },'owner','المالك');
 assert.equal(negativeCosts.ready,false);
 assert.equal(negativeCosts.reason,'invalid-financial-result');
 const blankCash=api.businessDividendReadinessSnapshot({
  treasuryMode:'separate',cashBalance:' ',financialHistory:[{year:2026,costs:1000}]
 },'owner','المالك');
 assert.equal(blankCash.ready,false);
 assert.equal(blankCash.reason,'invalid-treasury');
 const booleanCash=api.businessDividendReadinessSnapshot({
  treasuryMode:'separate',cashBalance:true,financialHistory:[{year:2026,costs:1000}]
 },'owner','المالك');
 assert.equal(booleanCash.ready,false);
 assert.equal(booleanCash.reason,'invalid-treasury');
});

test('dividend readiness returns zero when liabilities and reserve consume available cash',()=>{
 const api=createApi();
 const company={
  treasuryMode:'separate',cashBalance:250000,taxLiability:100000,
  credit:{principal:200000,accruedInterest:0},
  financialHistory:[{year:2026,costs:400000}]
 };
 const result=api.businessDividendReadinessSnapshot(company,'owner','المالك');
 assert.equal(result.ready,true);
 assert.equal(result.reserve,100000);
 assert.equal(result.distributable,0);
 assert.equal(result.reason,'no-distributable-cash');
 assert.equal(result.shareholders.reduce((sum,item)=>sum+item.potentialAmount,0),0);
});

test('ownership menu exposes the dividend estimate, annual declaration and claim actions',()=>{
 const menu=findFunction('businessOwnershipMenu');
 const readiness=findFunction('businessDividendReadinessMenu');
 const distribution=findFunction('businessDividendDistributionMenu');
 const commit=findFunction('commitBusinessDividendDistribution');
 const claim=findFunction('claimBusinessDividendPayments');
 assert.match(menu,/تقدير السيولة القابلة للتوزيع/);
 assert.match(menu,/اعتماد توزيع أرباح سنوي/);
 assert.match(menu,/استلام مستحقاتك/);
 assert.match(readiness,/المبالغ المحجوزة للملاك/);
 assert.match(readiness,/اختيار نسبة التوزيع/);
 assert.match(readiness,/25% من مصروفات آخر تقرير/);
 assert.match(distribution,/توزيع واحد فقط لكل سنة مالية/);
 assert.match(commit,/if\(!save\(\)\)/);
 assert.match(claim,/if\(!save\(\)\)/);
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

test('dividend ledger validates immutable allocations, claims and the escrow balance',()=>{
 const api=createApi();
 const empty=api.normalizeBusinessDividendLedger(undefined);
 assert.equal(empty.valid,true);assert.deepEqual(Array.from(empty.ledger.entries),[]);
 const ledger={version:1,entries:[{id:'dividend-2026',year:2026,declaredAtAge:40,createdBy:'owner',totalAmount:1000,
  allocations:[{beneficiaryId:'owner',name:'المالك',shareBps:4000,amount:400},{beneficiaryId:'partner',name:'الشريك',shareBps:6000,amount:600}],
  claims:[{beneficiaryId:'owner',name:'المالك',amount:400,paidAmount:400,paidAtAge:40},{beneficiaryId:'partner',name:'الشريك',amount:600,paidAmount:0,paidAtAge:null}]
 }]};
 const normalized=api.normalizeBusinessDividendLedger(ledger);
 assert.equal(normalized.valid,true);
 assert.equal(api.businessDividendPendingLiability({dividendLedger:ledger}),600);
 assert.equal(api.businessDividendEscrowBalance({dividendLedger:ledger,dividendEscrowBalance:600}),600);
 assert.equal(api.businessDividendEscrowBalance({dividendLedger:ledger,dividendEscrowBalance:599}),null);
 const invalid={version:1,entries:[{...ledger.entries[0],totalAmount:1001}]};
 assert.equal(api.normalizeBusinessDividendLedger(invalid).valid,false);
 assert.equal(api.businessDividendPendingLiability({dividendLedger:invalid}),null);
});

test('largest-remainder dividend allocation reconciles every pound exactly',()=>{
 const api=createApi();
 const allocations=api.allocateBusinessDividendShares(101,[
  {beneficiaryId:'owner',name:'المالك',shareBps:4000},
  {beneficiaryId:'partner',name:'الشريك',shareBps:6000}
 ]);
 assert.deepEqual(Array.from(allocations,item=>[item.beneficiaryId,item.amount]),[['owner',40],['partner',61]]);
 assert.equal(allocations.reduce((sum,item)=>sum+item.amount,0),101);
 assert.equal(api.allocateBusinessDividendShares(10,[{beneficiaryId:'owner',name:'المالك',shareBps:9000}]),null);
});

test('annual dividend declaration pays the active owner and reserves other owners without double spending',()=>{
 const api=createApi();
 const company={treasuryMode:'separate',cashBalance:1000001,dividendEscrowBalance:0,taxLiability:100000,credit:{principal:150000,accruedInterest:50000},
  ownershipLedger:{version:1,activeBeneficiaryId:'owner',shareholders:[
   {beneficiaryId:'owner',name:'المالك',kind:'owner',shareBps:4000},
   {beneficiaryId:'partner',name:'الشريك',kind:'child',shareBps:6000}
  ]},financialHistory:[{year:2026,costs:400000}]};
 const before=JSON.stringify(company),snapshot=api.businessDividendReadinessSnapshot(company,'owner','المالك');
 assert.equal(snapshot.distributable,600001);
 const result=api.applyBusinessDividendDistribution(company,snapshot,.5,'owner',40,100000);
 assert.equal(result.ok,true);
 assert.equal(result.amount,300000);
 assert.equal(result.ownerAmount,120000);
 assert.equal(result.pendingAmount,180000);
 assert.equal(result.cashBalanceAfter,700001);
 assert.equal(result.escrowBalanceAfter,180000);
 assert.equal(result.personalBalanceAfter,220000);
 assert.equal(api.businessDividendPendingLiability({dividendLedger:result.ledger}),180000);
 assert.equal(JSON.stringify(company),before,'the calculation must not mutate the source save');
 const committed={...company,cashBalance:result.cashBalanceAfter,dividendEscrowBalance:result.escrowBalanceAfter,dividendLedger:result.ledger};
 const duplicate=api.applyBusinessDividendDistribution(committed,api.businessDividendReadinessSnapshot(committed,'owner','المالك'),.25,'owner',40,220000);
 assert.equal(duplicate.ok,false);
 assert.equal(duplicate.reason,'already-distributed');
});

test('a shareholder can claim reserved dividends once without debiting operating cash twice',()=>{
 const api=createApi();
 const company={treasuryMode:'separate',cashBalance:700001,dividendEscrowBalance:180000,dividendLedger:{version:1,entries:[{
  id:'dividend-2026',year:2026,declaredAtAge:40,createdBy:'owner',totalAmount:300000,
  allocations:[{beneficiaryId:'owner',name:'المالك',shareBps:4000,amount:120000},{beneficiaryId:'partner',name:'الشريك',shareBps:6000,amount:180000}],
  claims:[{beneficiaryId:'owner',name:'المالك',amount:120000,paidAmount:120000,paidAtAge:40},{beneficiaryId:'partner',name:'الشريك',amount:180000,paidAmount:0,paidAtAge:null}]
 }]}};
 const result=api.applyBusinessDividendClaims(company,'partner',42,5000);
 assert.equal(result.ok,true);assert.equal(result.amount,180000);assert.equal(result.personalBalanceAfter,185000);
 assert.equal(result.escrowBalanceAfter,0);assert.equal(api.businessDividendPendingLiability({dividendLedger:result.ledger}),0);
 assert.equal(company.cashBalance,700001,'claim settlement must use the reserved account, not operating cash');
 const repeated=api.applyBusinessDividendClaims({...company,dividendLedger:result.ledger,dividendEscrowBalance:0},'partner',42,result.personalBalanceAfter);
 assert.equal(repeated.ok,false);assert.equal(repeated.reason,'no-pending-claims');
});

test('pending dividend claims transfer to heirs without changing the reserved total',()=>{
 const api=createApi();
 const ledger={version:1,entries:[{id:'dividend-2025',year:2025,declaredAtAge:60,createdBy:'other',totalAmount:1000,
  allocations:[{beneficiaryId:'owner',name:'المالك',shareBps:4000,amount:400},{beneficiaryId:'partner',name:'الشريك',shareBps:6000,amount:600}],
  claims:[{beneficiaryId:'owner',name:'المالك',amount:400,paidAmount:100,paidAtAge:55},{beneficiaryId:'partner',name:'الشريك',amount:600,paidAmount:0,paidAtAge:null}]
 }]};
 const accounts={accounts:[{beneficiaryId:'child-a',name:'الوارث',share:.6},{beneficiaryId:'child-b',name:'الأخت',share:.4}]};
 const result=api.inheritBusinessDividendClaims(ledger,'owner',accounts);
 assert.equal(result.valid,true);assert.equal(result.transferredAmount,300);
 const claims=result.ledger.entries[0].claims;
 assert.deepEqual(Array.from(claims.map(item=>[item.beneficiaryId,item.amount,item.paidAmount]).sort()),[
  ['child-a',180,0],['child-b',120,0],['owner',100,100],['partner',600,0]
 ]);
 assert.equal(api.businessDividendPendingLiability({dividendLedger:result.ledger}),900);
});

test('business succession carries pending dividend claims to the selected heirs',()=>{
 const api=createApi();
 const previousBusiness={id:'estate-business',assetId:'estate-business',title:'شركة التركة',value:500000,treasuryMode:'separate',cashBalance:500000,dividendEscrowBalance:900,
  ownershipLedger:{version:1,activeBeneficiaryId:'owner',shareholders:[{beneficiaryId:'owner',name:'المالك',kind:'owner',shareBps:10000}]},
  dividendLedger:{version:1,entries:[{id:'dividend-2025',year:2025,declaredAtAge:60,createdBy:'owner',totalAmount:1000,
   allocations:[{beneficiaryId:'owner',name:'المالك',shareBps:10000,amount:1000}],
   claims:[{beneficiaryId:'owner',name:'المالك',amount:1000,paidAmount:100,paidAtAge:55}]
  }]}
 };
 const previous={lifeId:'owner',name:'المالك',age:70,bank:0,debt:0,assets:[],investments:[],business:previousBusiness,companies:[]};
 const inheritance={business:{...previousBusiness},companies:[]};
 const accounts={accounts:[{beneficiaryId:'child-a',name:'الوارث',share:.6},{beneficiaryId:'child-b',name:'الأخت',share:.4}]};
 assert.equal(api.applyInheritedBusinessOwnership(previous,inheritance,accounts,'child-a'),true);
 const claims=inheritance.business.dividendLedger.entries[0].claims;
 assert.deepEqual(Array.from(claims.map(item=>[item.beneficiaryId,item.amount,item.paidAmount]).sort()),[
  ['child-a',540,0],['child-b',360,0],['owner',100,100]
 ]);
 assert.equal(inheritance.business.ownershipLedger.activeBeneficiaryId,'child-a');
 assert.equal(api.businessDividendEscrowBalance(inheritance.business),900);
});

test('estate valuation includes escrow assets and dividend payables, and quarantines a mismatched ledger',()=>{
 const api=createApi();
 const company={id:'estate-business',treasuryMode:'separate',cashBalance:500,dividendEscrowBalance:100,
  dividendLedger:{version:1,entries:[{id:'dividend-2026',year:2026,declaredAtAge:40,createdBy:'owner',totalAmount:100,
   allocations:[{beneficiaryId:'owner',name:'المالك',shareBps:10000,amount:100}],
   claims:[{beneficiaryId:'owner',name:'المالك',amount:100,paidAmount:0,paidAtAge:null}]
  }]}};
 const estate=api.calculateEstateSnapshot({bank:0,assets:[],investments:[],business:company,companies:[],debt:0});
 assert.equal(estate.businessCash,600);
 assert.equal(estate.businessLiabilities,100);
 assert.equal(estate.net,500);
 const corrupt={...company,dividendEscrowBalance:99};
 const quarantined=api.calculateEstateSnapshot({bank:0,assets:[],investments:[],business:corrupt,companies:[],debt:0});
 assert.equal(quarantined.businessDividendAuditWarnings,1);
 assert.equal(quarantined.net,0,'a mismatched dividend ledger should not inflate estate value');
});

test('ownership and treasury menus disclose reserved dividends and block sale until claims are settled',()=>{
 const ownershipMenu=findFunction('businessOwnershipMenu');
 const treasuryMenu=findFunction('businessTreasuryMenu');
 const sellAsset=findFunction('sellAsset');
 const sellCompany=findFunction('sellCompany');
 assert.match(ownershipMenu,/مستحقات معلقة/);
 assert.match(treasuryMenu,/مبالغ محجوزة للملاك/);
 assert.match(sellAsset,/pending>0/);
 assert.match(sellCompany,/pending>0/);
});


test('business succession quarantines dividend claims when inheritance would exceed the safe claim ledger limit',()=>{
 const api=createApi();
 const ownership=api.createBusinessOwnershipLedger('owner','المالك',60);
 ownership.shareholders=Array.from({length:100},(_,index)=>({
  beneficiaryId:index===0?'owner':index===1?'heir-a':'shareholder-'+index,
  name:index===0?'المالك':index===1?'الوارث الموجود':'مساهم '+index,
  kind:index===0?'owner':'child',
  shareBps:100
 }));
 const dividendEntry={
  id:'dividend-2026',year:2026,declaredAtAge:60,createdBy:'owner',totalAmount:10000,
  allocations:ownership.shareholders.map(item=>({
   beneficiaryId:item.beneficiaryId,name:item.name,kind:item.kind,shareBps:item.shareBps,amount:100
  })),
  claims:ownership.shareholders.map(item=>({
   beneficiaryId:item.beneficiaryId,name:item.name,amount:100,
   paidAmount:item.beneficiaryId==='owner'?50:0,
   paidAtAge:item.beneficiaryId==='owner'?55:null
  }))
 };
 const previousBusiness={
  id:'dense-claims-business',assetId:'dense-claims-business',title:'شركة المطالبات الكثيفة',
  value:500000,treasuryMode:'separate',cashBalance:50000,dividendEscrowBalance:9950,
  ownershipLedger:ownership,dividendLedger:{version:1,entries:[dividendEntry]}
 };
 const previous={
  lifeId:'owner',name:'المالك',age:70,bank:0,debt:0,assets:[],investments:[],
  business:previousBusiness,companies:[]
 };
 const inheritance={business:{...previousBusiness},companies:[]};
 const accounts={accounts:[
  {beneficiaryId:'heir-a',name:'الوارث الموجود',share:.5,kind:'child'},
  {beneficiaryId:'heir-b',name:'الوارث الجديد',share:.5,kind:'child'}
 ]};
 assert.equal(api.normalizeBusinessDividendLedger(previousBusiness.dividendLedger).valid,true);
 assert.equal(api.applyInheritedBusinessOwnership(previous,inheritance,accounts,'heir-a'),true);
 assert.equal(inheritance.business.ownershipLedger.auditStatus,'balanced');
 assert.equal(inheritance.business.dividendLedger.auditStatus,'needs_review');
 assert.deepEqual(Array.from(inheritance.business.dividendLedger.auditIssues),[
  'inheritance_claim_transfer_failed','inherited-claims-invalid'
 ]);
 assert.equal(api.normalizeBusinessDividendLedger(inheritance.business.dividendLedger).valid,false);
 assert.equal(inheritance.business.dividendEscrowBalance,9950,'the reserved balance must remain untouched while quarantined');
 assert.equal(previousBusiness.dividendLedger.auditStatus,undefined,'the source life must not be mutated');
});


test('inherited proportional treasury blocks new distributions but preserves existing shareholder claims',()=>{
 const api=createApi();
 const ownership=api.createBusinessOwnershipLedger('owner','المالك',35);
 ownership.shareholders=[
  {beneficiaryId:'owner',name:'المالك',kind:'owner',shareBps:5000},
  {beneficiaryId:'partner',name:'الشريك',kind:'child',shareBps:5000}
 ];
 const company={
  treasuryMode:'separate',dividendTreasuryScope:'inherited-stake',cashBalance:50000,
  ownershipLedger:ownership,dividendEscrowBalance:500,
  financialHistory:[{year:2026,costs:10000}],
  dividendLedger:{version:1,entries:[{
   id:'dividend-2025',year:2025,declaredAtAge:35,createdBy:'owner',totalAmount:1000,
   allocations:[
    {beneficiaryId:'owner',name:'المالك',shareBps:5000,amount:500},
    {beneficiaryId:'partner',name:'الشريك',shareBps:5000,amount:500}
   ],
   claims:[
    {beneficiaryId:'owner',name:'المالك',amount:500,paidAmount:500,paidAtAge:35},
    {beneficiaryId:'partner',name:'الشريك',amount:500,paidAmount:0,paidAtAge:null}
   ]
  }]}
 };
 const before=JSON.stringify(company);
 const snapshot=api.businessDividendReadinessSnapshot(company,'owner','المالك');
 assert.equal(snapshot.valid,true);
 assert.equal(snapshot.ready,false);
 assert.equal(snapshot.reason,'inherited-stake-treasury');
 const distribution=api.applyBusinessDividendDistribution(company,snapshot,.5,'owner',35,1000);
 assert.equal(distribution.ok,false);
 assert.equal(distribution.reason,'inherited-stake-treasury');
 const claimable=api.businessDividendClaimableSnapshot(company,'partner');
 assert.equal(claimable.valid,true);
 assert.equal(claimable.amount,500,'previously reserved claims remain receivable');
 assert.equal(JSON.stringify(company),before,'the safety guard must not mutate the inherited save');
 const readinessMenu=findFunction('businessDividendReadinessMenu');
 const distributionMenu=findFunction('businessDividendDistributionMenu');
 assert.match(readinessMenu,/الخزينة المحفوظة هنا تمثل الحصة الموروثة/);
 assert.match(distributionMenu,/الخزينة الموروثة تمثل نصيب المالك الحالي/);
});


test('كشف الملاك يستبعد أحدث تقرير مالي غير مكتمل ويعود إلى أحدث سنة صالحة مثل تحليل النشاط',()=>{
 const api=createApi();
 const company={
  value:300000,
  ownershipLedger:api.createBusinessOwnershipLedger('owner','المالك',45),
  financialHistory:[
   {year:2024,revenue:80000,costs:50000,profit:30000},
   {year:2025,revenue:100000,costs:60000},
   {year:2026,revenue:'غير متاح',costs:10000,profit:99999}
  ]
 };
 const before=JSON.stringify(company);
 const ownership=api.businessOwnershipEarningsSnapshot(company,'owner','المالك');
 const insight=businessInsights.analyzeBusiness(company,'شركة الاختبار');
 assert.equal(ownership.valid,true);
 assert.equal(ownership.hasReport,true);
 assert.equal(ownership.year,2025);
 assert.equal(ownership.totalProfit,40000);
 assert.equal(ownership.invalidFinancialReportCount,1);
 assert.equal(ownership.year,insight.year);
 assert.equal(ownership.totalProfit,insight.profit);
 assert.equal(ownership.invalidFinancialReportCount,insight.invalidFinancialReportCount);
 assert.equal(JSON.stringify(company),before,'financial validation must remain read-only');
});

test('كشف الملكية يرفض القيم المنطقية والمسافات ويستمر في اشتقاق الربح من تكاليف صالحة',()=>{
 const api=createApi();
 const company={
  ownershipLedger:api.createBusinessOwnershipLedger('owner','المالك',40),
  financialHistory:[
   {year:2024,revenue:true,profit:10000},
   {year:2025,revenue:100000,profit:true,costs:40000},
   {year:2026,revenue:100000,profit:' ',costs:' '}
  ]
 };
 const result=api.businessOwnershipEarningsSnapshot(company,'owner','المالك');
 const insight=businessInsights.analyzeBusiness(company,'شركة الاختبار');
 assert.equal(result.hasReport,true);
 assert.equal(result.year,2025);
 assert.equal(result.totalProfit,60000);
 assert.equal(result.invalidFinancialReportCount,2);
 assert.equal(result.year,insight.year);
 assert.equal(result.totalProfit,insight.profit);
 assert.equal(result.invalidFinancialReportCount,insight.invalidFinancialReportCount);
 const invalidOnly=api.businessOwnershipEarningsSnapshot({
  ownershipLedger:api.createBusinessOwnershipLedger('owner','المالك',40),
  financialHistory:[{year:2026,revenue:true,profit:100000}]
 },'owner','المالك');
 assert.equal(invalidOnly.hasReport,false);
 assert.equal(invalidOnly.reason,'invalid-financial-report');
 assert.equal(invalidOnly.invalidFinancialReportCount,1);
});

test('آخر تقرير مخزن للسنة نفسها يحسم صلاحية السنة في كشف الملكية مثل تحليل الأعمال',()=>{
 const api=createApi();
 const company={
  ownershipLedger:api.createBusinessOwnershipLedger('owner','المالك',40),
  financialHistory:[
   {year:2025,revenue:100000,costs:60000,profit:40000},
   {year:'2025',revenue:'غير صالح',costs:60000,profit:40000},
   {year:2026,revenue:120000,costs:70000,profit:50000}
  ]
 };
 const ownership=api.businessOwnershipEarningsSnapshot(company,'owner','المالك');
 const insight=businessInsights.analyzeBusiness(company,'شركة الاختبار');
 assert.equal(ownership.year,2026);
 assert.equal(ownership.totalProfit,50000);
 assert.equal(ownership.invalidFinancialReportCount,1);
 assert.equal(ownership.year,insight.year);
 assert.equal(ownership.totalProfit,insight.profit);
 assert.equal(ownership.invalidFinancialReportCount,insight.invalidFinancialReportCount);
});

test('واجهة كشف الملكية توضح استبعاد التقارير المالية غير المكتملة',()=>{
 const earningsMenu=findFunction('businessOwnershipEarningsMenu');
 assert.match(earningsMenu,/invalidFinancialReportCount/);
 assert.match(earningsMenu,/تقرير مالي غير مكتمل/);
 assert.match(earningsMenu,/لم نحوّل القيم الناقصة إلى أصفار/);
});
