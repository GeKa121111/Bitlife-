'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
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
const runtime=['siblingSafeMoney','siblingSafeSigned','siblingInvestmentHash','siblingChildCareerFor','siblingNormalizeChildOwnedProperties','siblingMortgageLiability','siblingProfileMortgageLiability','siblingOwnedPropertyValue','ensureSiblingChildEconomy','siblingRentalTenantName','siblingManualRentalLeaseQuote','siblingManualRentalLeaseAction','siblingChildPropertySaleQuote','siblingChildSellInheritedProperty'].map(findFunction);
function makeContext(){
 const context={clamp(value,min=0,max=100){const n=Number(value);return Math.max(min,Math.min(max,Number.isFinite(n)?Math.round(n):min));}};
 vm.runInNewContext(runtime.join('\n')+'\n'+
 'globalThis.ensureChildEconomy=ensureSiblingChildEconomy;globalThis.quoteChildPropertySale=siblingChildPropertySaleQuote;'+
 'globalThis.sellChildProperty=siblingChildSellInheritedProperty;globalThis.quoteManualRentalLease=siblingManualRentalLeaseQuote;'+
 'globalThis.applyManualRentalLease=siblingManualRentalLeaseAction;',context);return context;
}
function makeChild(properties=[],overrides={}){return {id:'adult-child-1',name:'ابن العائلة',age:26,independent:true,independentYear:2018,economy:{savings:10000,debt:5000,ownedProperties:properties,lastProcessedYear:2027},...overrides};}
function makeRental(id='inherited-rental-1'){
 return {id,kind:'rental',label:'شقة موروثة',marketValue:200000,upkeep:3000,monthlyRent:5000,rentArrears:3000,lastMarketYear:2027,lastRentYear:2027,lastPropertyYear:2027,
  mortgage:{balance:40000,arrears:2000,annualPayment:6000,interestRateBps:650,remainingYears:10,termYears:15,status:'active',lastProcessedYear:2027},
  lease:{status:'active',tenantName:'مستأجر قائم',monthlyRent:5000,startYear:2025,endYear:2028,termYears:3,renewals:0,lastProcessedYear:2027,ownerManaged:false,history:[]}};
}
test('الحفظ القديم يبدأ بدفتر عقاري فارغ دون إنشاء أرصدة رجعية',()=>{
 const c=makeContext(),child=makeChild([],{economy:{savings:12000,debt:900,ownedProperties:[]}}),e=c.ensureChildEconomy({id:'parent-1'},child,2028);
 assert.equal(e.savings,12000);assert.equal(e.debt,900);assert.equal(e.propertyTransactions.length,0);assert.equal(e.propertySalesTotal,0);
 assert.equal(e.propertySaleCostsTotal,0);assert.equal(e.mortgageDebtPaidBySalesTotal,0);assert.equal(e.rentalArrearsWrittenOffTotal,0);
});
test('معاينة البيع تخصم التكلفة وتسدد التمويل ثم الدين غير المضمون',()=>{
 const c=makeContext(),child=makeChild([makeRental()]),e=c.ensureChildEconomy({id:'parent-1'},child,2028),q=c.quoteChildPropertySale(e,'inherited-rental-1');
 assert.equal(q.ok,true);assert.equal(q.gross,200000);assert.equal(q.transactionCost,10000);assert.equal(q.netProceeds,190000);
 assert.equal(q.mortgagePayoff,42000);assert.equal(q.mortgagePaid,42000);assert.equal(q.debtPaid,5000);assert.equal(q.cashRetained,143000);assert.equal(q.arrearsWrittenOff,3000);
});
test('بيع العقار يحدّث مدخرات الابن ودفتره مرة واحدة ويحافظ على السجل بعد التطبيع',()=>{
 const c=makeContext(),child=makeChild([makeRental()]),r=c.sellChildProperty({id:'parent-1'},child,'inherited-rental-1',2028);
 assert.equal(r.ok,true);assert.equal(child.economy.ownedProperties.length,0);assert.equal(child.economy.savings,153000);assert.equal(child.economy.debt,0);
 assert.equal(child.economy.propertySalesTotal,200000);assert.equal(child.economy.propertySaleCostsTotal,10000);assert.equal(child.economy.mortgageDebtPaidBySalesTotal,42000);
 assert.equal(child.economy.rentalArrearsWrittenOffTotal,3000);assert.equal(child.economy.propertyTransactions.length,1);assert.equal(child.economy.propertyTransactions[0].year,2028);
 const e=c.ensureChildEconomy({id:'parent-1'},child,2029);assert.equal(e.propertyTransactions.length,1);assert.equal(e.propertyTransactions[0].assetId,'inherited-rental-1');assert.equal(e.netWorth,153000);
 assert.equal(c.sellChildProperty({id:'parent-1'},child,'inherited-rental-1',2029).ok,false);assert.equal(child.economy.propertyTransactions.length,1);
});
test('البيع يُرفض عند سلبية حقوق الملكية ولا يغيّر الأصل أو السيولة',()=>{
 const c=makeContext(),asset=makeRental('underwater');asset.marketValue=30000;asset.mortgage.balance=40000;asset.mortgage.arrears=0;
 const child=makeChild([asset]),before=child.economy.savings,q=c.quoteChildPropertySale(c.ensureChildEconomy({id:'parent-2'},child,2028),'underwater');
 assert.equal(q.ok,false);assert.equal(q.reason,'negative_equity');assert.equal(c.sellChildProperty({id:'parent-2'},child,'underwater',2028).ok,false);
 assert.equal(child.economy.ownedProperties.length,1);assert.equal(child.economy.savings,before);
});
test('قرار عقد الإيجار اليدوي يبقى محفوظًا ويمنع تكراره بعد تطبيع المحفظة',()=>{
 const c=makeContext(),asset=makeRental('lease-control');asset.lease={status:'vacant',tenantName:'',monthlyRent:5000,startYear:2027,endYear:2027,termYears:0,renewals:0,lastProcessedYear:2027,ownerManaged:false,history:[]};
 const child=makeChild([asset]),parent={id:'parent-3'},e=c.ensureChildEconomy(parent,child,2028),proxy={id:child.id,name:child.name,age:child.age,deceased:false,economicProfile:e};
 const q=c.quoteManualRentalLease(proxy,'lease-control','sign',2,10000,2028);assert.ok(q);assert.equal(q.startYear,2029);assert.equal(q.endYear,2030);
 assert.ok(c.applyManualRentalLease(proxy,'lease-control','sign',2,10000,2028));
 const normalized=c.ensureChildEconomy(parent,child,2028);proxy.economicProfile=normalized;
 assert.equal(normalized.ownedProperties[0].lease.lastOwnerActionYear,2028);assert.equal(c.quoteManualRentalLease(proxy,'lease-control','sign',1,10000,2028),null);
});
test('واجهة المحفظة تتيح الوصول إلى البيع وإدارة الإيجار من ملف الابن البالغ',()=>{
 assert.match(appSource,/function siblingChildPropertyPortfolioMenu\(relative,childId\)/);
 assert.match(appSource,/function siblingChildPropertyMenu\(relative,childId,assetId\)/);
 assert.match(appSource,/function siblingChildManualRentalLeaseMenu\(relative,childId,assetId\)/);
 assert.match(appSource,/function siblingChildSellPropertyConfirm\(relative,childId,assetId\)/);
 assert.match(appSource,/siblingChildPropertyPortfolioMenu\(n,child\.id\|\|child\.name\)/);assert.match(appSource,/childPortfolioChoices/);
});
