'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const appSource=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8');
function findFunction(name){
 const start=appSource.indexOf('function '+name+'(');assert.notEqual(start,-1,'missing runtime function: '+name);
 const bodyStart=appSource.indexOf('{',start);let depth=0,quote='',escaped=false,lineComment=false,blockComment=false;
 for(let index=bodyStart;index<appSource.length;index++){
  const char=appSource[index],next=appSource[index+1];
  if(lineComment){if(char==='\n')lineComment=false;continue;}
  if(blockComment){if(char==='*'&&next==='/'){blockComment=false;index++;}continue;}
  if(quote){if(escaped){escaped=false;continue;}if(char==='\\'){escaped=true;continue;}if(char===quote)quote='';continue;}
  if(char==='/'&&next==='/'){lineComment=true;index++;continue;}
  if(char==='/'&&next==='*'){blockComment=true;index++;continue;}
  if(char==="'"||char==='"'){quote=char;continue;}
  if(char==='{')depth++;else if(char==='}'&&--depth===0)return appSource.slice(start,index+1);
 }
 throw new Error('unterminated function: '+name);
}
const runtime=['siblingSafeMoney','siblingSafeSigned','siblingInvestmentHash','siblingNormalizeInheritanceRecords','siblingNormalizeChildOwnedProperties','siblingNormalizeSpousePortfolio','ensureSiblingHousehold','siblingReleaseSpouseInheritance','siblingSpouseEstateAnnualEffects','siblingSpousePropertySaleQuote','siblingSpouseSellInheritedProperty'].map(findFunction);
function makeContext(overrides={}){
 const context={
  clamp(value,min=0,max=100){const n=Number(value);return Math.max(min,Math.min(max,Number.isFinite(n)?Math.round(n):0));},
  siblingChildEstatePropertyPlan(relative,beneficiary,portfolio,record,year){
   const next=portfolio.ownedProperties.slice(),transferIds=[];let propertyCount=0;
   for(const claim of record.assetClaims||[]){
    const transferId=String(record.estateId)+'|'+String(claim.assetId)+'|'+String(beneficiary.id||beneficiary.name);transferIds.push(transferId);
    if(next.some(asset=>asset.inheritanceTransferId===transferId))continue;
    next.push({id:'inherited-'+transferIds.length,inheritanceTransferId:transferId,kind:claim.kind||'residence',label:claim.label||'عقار موروث',
     marketValue:claim.marketValueShare||0,upkeep:claim.upkeepShare||0,monthlyRent:claim.monthlyRentShare||0,rentArrears:claim.rentArrearsShare||0,
     ownershipShareBps:claim.shareBps||0,lastMarketYear:year,lastRentYear:year,lastPropertyYear:year,
     mortgage:claim.mortgageBalanceShare||claim.mortgageArrearsShare?{balance:claim.mortgageBalanceShare||0,arrears:claim.mortgageArrearsShare||0,annualPayment:claim.mortgageAnnualPaymentShare||0,lastProcessedYear:year}:null,
     lease:claim.kind==='rental'?{status:claim.leaseStatus||'vacant',tenantName:claim.tenantName||'',monthlyRent:claim.monthlyRentShare||0,startYear:claim.leaseStartYear||year,endYear:claim.leaseEndYear||year-1,termYears:claim.leaseTermYears||0,renewals:claim.leaseRenewals||0,lastProcessedYear:year,ownerManaged:claim.leaseOwnerManaged===true,history:[]}:null});
    propertyCount++;
   }
   return {ok:true,ownedProperties:next,transferIds,propertyCount};
  },
  siblingChildInheritedPropertyAnnualEffects(relative,beneficiary,portfolio,year){context.lastPropertyOwner=relative;return context.nextEffects.length?context.nextEffects.shift():{propertyExpenses:0,rentalIncome:0,mortgageDueTotal:0,mortgageDues:[],propertyCount:portfolio.ownedProperties.length};},
  siblingProfileMortgageLiability(profile){return (profile.ownedProperties||[]).reduce((sum,asset)=>sum+Number(asset.mortgage&&asset.mortgage.balance||0)+Number(asset.mortgage&&asset.mortgage.arrears||0),0);},
  siblingOwnedPropertyValue(profile){return (profile.ownedProperties||[]).reduce((sum,asset)=>sum+Number(asset.marketValue||0),0);},
  siblingMortgageSettlement(asset,year,due,unpaid){
   const mortgage=asset.mortgage,paid=Math.max(0,Number(due.due||0)-Number(unpaid||0)),arrearsPaid=Math.min(Number(due.openingArrears||0),paid);
   const remainingPaid=paid-arrearsPaid,interestPaid=Math.min(Number(due.interest||0),remainingPaid),principalPaid=Math.min(Number(due.balance||0),remainingPaid-interestPaid);
   mortgage.balance=Math.max(0,Number(due.balance||0)-principalPaid);mortgage.arrears=Number(unpaid||0);mortgage.lastProcessedYear=year;
   return {paid,unpaid:Number(unpaid||0),interestPaid,principalPaid};
  },
  siblingUpdateEstateAssetTransferStatus(profile,household){
   const spouse=household&&household.spouse,records=spouse&&spouse.inheritance&&spouse.inheritance.records||[],estate=profile&&profile.estate;
   if(estate)estate.assetClaimsPendingCount=records.filter(record=>record.estateId===estate.id&&record.assetsPending).reduce((sum,record)=>sum+record.assetClaims.length,0);
   return estate;
  },
  nextEffects:[],...overrides
 };
 vm.runInNewContext(runtime.join('\n')+'\n'+
  'globalThis.releaseSpouseInheritance=siblingReleaseSpouseInheritance;'+
  'globalThis.processSpousePortfolioYear=siblingSpouseEstateAnnualEffects;'+
  'globalThis.quoteSpousePropertySale=siblingSpousePropertySaleQuote;'+
  'globalThis.sellSpouseProperty=siblingSpouseSellInheritedProperty;'+
  'globalThis.normalizeHousehold=ensureSiblingHousehold;',context);
 return context;
}
function makeRecord(){return {
 estateId:'estate-spouse-1',year:2027,cashHeld:0,debtHeld:0,cashReleased:0,debtReleased:0,releasedYear:2027,assetsPending:true,
 assetClaims:[{assetId:'family-rental-1',kind:'rental',label:'شقة العائلة',shareBps:2500,marketValueShare:250000,upkeepShare:3000,
  monthlyRentShare:5000,mortgageBalanceShare:40000,mortgageArrearsShare:2000,mortgageAnnualPaymentShare:6000,rentArrearsShare:1500,
  leaseStatus:'active',tenantName:'مستأجر تجريبي',leaseStartYear:2025,leaseEndYear:2028,leaseTermYears:3}],history:[]
};}
test('الحفظ القديم للشريك لا ينشئ محفظة أو حقول إرث قبل وجود استحقاق',()=>{
 const context=makeContext(),profile={household:{spouse:{id:'legacy-spouse',name:'شريك قديم',age:58},children:[]}};
 const household=context.normalizeHousehold({id:'legacy-relative',age:60,deceased:false},profile,2026);
 for(const key of ['portfolio','inheritance','inheritanceCashBalance','inheritanceDebtBalance'])assert.equal(Object.prototype.hasOwnProperty.call(household.spouse,key),false);
});
test('نقل حصص الشريك يتم مرة واحدة ويحافظ على سجل المطالبة والسيولة القديمة',()=>{
 const context=makeContext(),record=makeRecord(),spouse={id:'spouse-1',name:'الشريك الباقي',age:55,deceased:false,inheritance:{records:[record]},inheritanceCashBalance:25000,inheritanceDebtBalance:5000};
 const profile={household:{spouse,children:[]},estate:{id:record.estateId,settled:true,beneficiaries:[]}},relative={id:'relative-1',name:'الشقيق المتوفى',deceased:true,economicProfile:profile};
 const result=context.releaseSpouseInheritance(relative,spouse,2028);
 assert.equal(result.released,true);assert.equal(result.properties,1);assert.equal(spouse.portfolio.ownedProperties.length,1);
 const normalizedRecord=spouse.inheritance.records[0];
 assert.equal(normalizedRecord.assetsPending,false);assert.equal(normalizedRecord.assetsTransferredYear,2028);assert.equal(normalizedRecord.transferredAssetIds.length,1);
 assert.equal(spouse.inheritanceCashBalance,25000);assert.equal(spouse.inheritanceDebtBalance,5000);
 const duplicate=context.releaseSpouseInheritance(relative,spouse,2029);assert.equal(duplicate.properties,0);assert.equal(spouse.portfolio.ownedProperties.length,1);
});
test('المحفظة تعالج الإيجار والصيانة وتسدد جزءًا من الالتزامات دون ازدواج صافي الثروة',()=>{
 const context=makeContext({nextEffects:[{propertyExpenses:100,rentalIncome:1000,mortgageDueTotal:0,mortgageDues:[],propertyCount:1}]});
 const spouse={id:'spouse-cashflow',name:'شريك المحفظة',age:60,deceased:false,inheritance:{records:[]},inheritanceCashBalance:1000,inheritanceDebtBalance:500,
  portfolio:{ownedProperties:[{id:'rental-1',kind:'rental',marketValue:10000,lastPropertyYear:2027,lastMarketYear:2027,lastRentYear:2027}],lastProcessedYear:2027,history:[]}};
 const relative={id:'relative-cashflow',deceased:true,economicProfile:{household:{spouse}}},result=context.processSpousePortfolioYear(relative,spouse,2028);
 assert.equal(result.duplicate,false);assert.equal(context.lastPropertyOwner.id,spouse.id);assert.equal(result.rentalIncome,1000);assert.equal(result.propertyExpenses,100);
 assert.equal(spouse.inheritanceCashBalance,1675);assert.equal(spouse.inheritanceDebtBalance,275);assert.equal(spouse.portfolio.lastProcessedYear,2028);assert.equal(spouse.portfolio.netWorth,11400);
 const before=spouse.inheritanceCashBalance,duplicate=context.processSpousePortfolioYear(relative,spouse,2028);
 assert.equal(duplicate.duplicate,true);assert.equal(spouse.inheritanceCashBalance,before);
});
test('عجز التشغيل يترك متأخرات التمويل في العقار والدين العام منفصلًا',()=>{
 const asset={id:'mortgaged-rental',kind:'rental',marketValue:50000,lastPropertyYear:2027,lastMarketYear:2027,lastRentYear:2027,mortgage:{balance:20000,arrears:0,lastProcessedYear:2027}};
 const context=makeContext({nextEffects:[{propertyExpenses:1000,rentalIncome:200,mortgageDueTotal:500,mortgageDues:[{asset,due:{due:500,openingArrears:0,interest:100,balance:20000}}],propertyCount:1}]});
 const spouse={id:'spouse-shortfall',name:'شريك عليه التزامات',age:61,deceased:false,inheritance:{records:[]},inheritanceCashBalance:100,inheritanceDebtBalance:0,portfolio:{ownedProperties:[asset],lastProcessedYear:2027,history:[]}};
 const relative={id:'relative-shortfall',deceased:true,economicProfile:{household:{spouse}}},result=context.processSpousePortfolioYear(relative,spouse,2028);
 assert.equal(result.debt,700);assert.equal(spouse.inheritanceCashBalance,0);assert.equal(asset.mortgage.arrears,500);assert.equal(asset.mortgage.balance,20000);
});
test('بيع الحصة يخصم تكلفة البيع والتمويل ويرفض حقوق الملكية السلبية',()=>{
 const context=makeContext(),spouse={id:'spouse-sale',name:'شريك بائع',deceased:false,inheritance:{records:[]},inheritanceCashBalance:500,inheritanceDebtBalance:0,
  portfolio:{lastProcessedYear:2028,history:[],ownedProperties:[
   {id:'sale-flat',label:'شقة موروثة',kind:'residence',marketValue:10000,mortgage:{balance:2000,arrears:500}},
   {id:'negative-equity',label:'عقار مرهون',kind:'rental',marketValue:1000,mortgage:{balance:2000,arrears:0}}
  ]}};
 const relative={id:'relative-sale',deceased:true,economicProfile:{household:{spouse}}},quote=context.quoteSpousePropertySale(spouse.portfolio.ownedProperties[0]);
 assert.equal(quote.ok,true);assert.equal(quote.transactionCost,500);assert.equal(quote.securedDebt,2500);assert.equal(quote.proceeds,7000);
 const sold=context.sellSpouseProperty(relative,spouse,'sale-flat',2029);
 assert.equal(sold.ok,true);assert.equal(sold.proceeds,7000);assert.equal(spouse.inheritanceCashBalance,7500);
 assert.equal(spouse.portfolio.ownedProperties.some(asset=>asset.id==='sale-flat'),false);
 const rejected=context.sellSpouseProperty(relative,spouse,'negative-equity',2029);
 assert.equal(rejected.ok,false);assert.equal(rejected.reason,'negative_equity');assert.equal(spouse.portfolio.ownedProperties.some(asset=>asset.id==='negative-equity'),true);
});
test('المحفظة مرتبطة بدورة الأرملة وبواجهة ملخص التركة دون تغيير إصدار الحفظ',()=>{
 assert.match(appSource,/siblingSpouseEstateAnnualEffects\(relative,household\.spouse,spouseYear\)/);
 assert.match(appSource,/function siblingSpousePortfolioMenu\(relative\)/);
 assert.match(appSource,/function siblingSpouseSellPropertyConfirm\(relative,assetId\)/);
 assert.match(appSource,/const KEY = 'hekayat_hayah_save_v1';/);
 assert.match(appSource,/return \{version:1,lifeId:/);
});
