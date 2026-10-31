'use strict';
(() => {
const $ = id => document.getElementById(id);
const KEY = 'hekayat_hayah_save_v1';
const BACKUP_KEY = 'hekayat_hayah_save_backup_v1';
const CEMETERY_KEY = 'hekayat_hayah_cemetery_v1';
const SETTINGS_KEY = 'hayah_ui_settings_v1';
const PERKS_KEY = 'hayah_permanent_perks_v1';
const BACKUP_FORMAT = 'hayah-backup';
const BACKUP_VERSION = 1;
const PERK_IDS = ['challengeVault','goldTheme','expandedTime','actorPack','bossMode','healthShield','goldenWrench','goldenPassport','goldenPiggyBank','goldenNeko','fameFortuneBundle','billionairesBundle','crimePaysBundle','partyAnimalBundle','hollywoodStar','goldenResume','goldenDiploma','friendshipBracelet','goldenPacifier','jailCard','businessPack','landlordPack','investorPack','mafiaPack','blackMarketPack','assassinsBlade','zooExpansionPack','superstarMode','cultPack','casinoPack','godMode','bitizenship','movieDirectorPack','dealerPack','auraRing','fighterPack','proAthletePack','politicianPack','astronautPack','modelPack','musicianPack','musicProducerPack','vampireMode','outdoorsPack','gatedCommunityPack'];
const PERK_TOGGLE_IDS = ['goldTheme','healthShield','goldenWrench','bossMode','goldenNeko','hollywoodStar','goldenResume','goldenPacifier','godMode','bitizenship'];
const JOB_PACK_IDS = ['actorPack','fighterPack','proAthletePack','politicianPack','astronautPack','businessPack','dealerPack','mafiaPack','movieDirectorPack','modelPack','musicianPack','musicProducerPack'];
const BUSINESS_SUPPLIER_CATALOG = [
 {id:'economy',title:'مورد اقتصادي',emoji:'💸',quality:58,costMultiplier:.84,feeRate:.006,description:'تكلفة أقل تساعد السيولة، مع جودة متوسطة تحتاج متابعة.'},
 {id:'balanced',title:'مورد متوازن',emoji:'📦',quality:76,costMultiplier:.96,feeRate:.01,description:'توازن بين الجودة والتكلفة واستقرار التوريد.'},
 {id:'premium',title:'مورد متخصص',emoji:'⭐',quality:94,costMultiplier:1.12,feeRate:.016,description:'جودة مرتفعة تدعم المبيعات، لكن بسعر تشغيل أعلى.'}
];
const BUSINESS_STAFF_ROLES = [
 {id:'sales',title:'مندوب مبيعات',emoji:'🧑‍💼',salaryRate:.024,revenueBonus:.055,costReduction:0,description:'يساعد في جذب عملاء جدد وتحويل الفرص إلى مبيعات.'},
 {id:'operations',title:'مسؤول تشغيل',emoji:'⚙️',salaryRate:.022,revenueBonus:.01,costReduction:.07,description:'يحسن سير العمل ويقلل الهدر والتكاليف التشغيلية.'},
 {id:'marketing',title:'مسؤول تسويق',emoji:'📣',salaryRate:.026,revenueBonus:.045,costReduction:0,description:'يدعم الوصول للعملاء ويرفع أثر الحملات التسويقية.'},
 {id:'finance',title:'محاسب',emoji:'🧾',salaryRate:.02,revenueBonus:0,costReduction:.05,description:'ينظم المصروفات ويراقب الميزانية والتدفق النقدي.'}
];
const BUSINESS_PRODUCT_CATALOG = [
 {id:'digital-service',title:'خدمة رقمية',emoji:'💻',category:'تقنية',unitPrice:850,unitCost:280,description:'خدمة قابلة للتوسع بتكلفة تشغيل مرنة.'},
 {id:'home-meals',title:'وجبات منزلية',emoji:'🥘',category:'أغذية',unitPrice:420,unitCost:180,description:'منتج يومي يعتمد على الطلب والجودة.'},
 {id:'care-products',title:'منتجات عناية',emoji:'🧴',category:'عناية',unitPrice:560,unitCost:230,description:'منتجات متكررة الشراء ومنافسة متوسطة.'},
 {id:'daily-essentials',title:'مستلزمات يومية',emoji:'🛍️',category:'تجزئة',unitPrice:650,unitCost:310,description:'مستلزمات أساسية بهوامش تحتاج متابعة.'}
];
const BUSINESS_INDUSTRY_PROFILES = {
 technology:{demandMin:62,demandRange:39,competitionMin:30,competitionRange:46,competitorMin:2,competitorRange:6,rivalPriceMin:98,rivalPriceRange:17,revenueMultiplier:1.12,operatingCostMultiplier:1.06,unitCostMultiplier:.92,corporateTaxRate:.12},
 logistics:{demandMin:55,demandRange:37,competitionMin:24,competitionRange:39,competitorMin:2,competitorRange:5,rivalPriceMin:99,rivalPriceRange:16,revenueMultiplier:1.04,operatingCostMultiplier:1.17,unitCostMultiplier:1.12,corporateTaxRate:.15},
 restaurants:{demandMin:68,demandRange:39,competitionMin:55,competitionRange:36,competitorMin:5,competitorRange:6,rivalPriceMin:92,rivalPriceRange:16,revenueMultiplier:1.08,operatingCostMultiplier:1.20,unitCostMultiplier:1.16,corporateTaxRate:.16},
 retail:{demandMin:58,demandRange:39,competitionMin:60,competitionRange:32,competitorMin:6,competitorRange:7,rivalPriceMin:88,rivalPriceRange:19,revenueMultiplier:1.03,operatingCostMultiplier:1.13,unitCostMultiplier:1.10,corporateTaxRate:.16},
 food:{demandMin:65,demandRange:36,competitionMin:48,competitionRange:35,competitorMin:4,competitorRange:6,rivalPriceMin:92,rivalPriceRange:18,revenueMultiplier:1.07,operatingCostMultiplier:1.16,unitCostMultiplier:1.14,corporateTaxRate:.15},
 care:{demandMin:56,demandRange:38,competitionMin:35,competitionRange:42,competitorMin:3,competitorRange:6,rivalPriceMin:96,rivalPriceRange:18,revenueMultiplier:1.09,operatingCostMultiplier:1.08,unitCostMultiplier:1.03,corporateTaxRate:.13},
 other:{demandMin:55,demandRange:51,competitionMin:20,competitionRange:66,competitorMin:2,competitorRange:7,rivalPriceMin:90,rivalPriceRange:21,revenueMultiplier:1,operatingCostMultiplier:1,unitCostMultiplier:1,corporateTaxRate:.14}
};
function businessIndustryProfile(industry){
 const label=String(industry||'');
 if(/تقنية|برمجيات|رقمية/.test(label))return BUSINESS_INDUSTRY_PROFILES.technology;
 if(/لوجست|نقل|توزيع/.test(label))return BUSINESS_INDUSTRY_PROFILES.logistics;
 if(/مطاعم|مطعم|مأكولات/.test(label))return BUSINESS_INDUSTRY_PROFILES.restaurants;
 if(/تجزئة|متاجر|تجارة/.test(label))return BUSINESS_INDUSTRY_PROFILES.retail;
 if(/أغذية|وجبات|طعام/.test(label))return BUSINESS_INDUSTRY_PROFILES.food;
 if(/عناية|تجميل|مستحضرات/.test(label))return BUSINESS_INDUSTRY_PROFILES.care;
 return BUSINESS_INDUSTRY_PROFILES.other;
}
const BUSINESS_RIVAL_SECTORS = {
 technology:[['مدار للحلول الرقمية','منصة إدارة سحابية'],['نواة التقنية','أنظمة أعمال ذكية'],['أفق للبرمجيات','خدمات رقمية متكاملة'],['سحابة الشرق','بنية رقمية مرنة'],['حلول نقطة','أدوات إنتاجية'],['رؤية البيانات','تحليلات الأعمال'],['شبكات المستقبل','خدمات اتصال رقمية'],['ابتكار تك','حلول المؤسسات'],['مسار رقمي','منصات تشغيل'],['تقنية الجسر','خدمات تقنية'],['منظومة بلس','أنظمة اشتراك'],['بوابة المدار','حلول التجارة الرقمية']],
 logistics:[['مسارات المدن','خدمات توزيع سريع'],['خطوة للنقل','نقل وتخزين'],['جسر الإمداد','حلول سلاسل التوريد'],['مدار الشحن','خدمات شحن محلي'],['وصلة لوجستية','توصيل للشركات'],['طريق آمن','نقل متخصص'],['مخازن النيل','إدارة مستودعات'],['شبكة وصول','توزيع إقليمي'],['خط الإمداد','خدمات شحن'],['رحاب للنقل','نقل بري'],['بوابة الشحن','إدارة الطلبات'],['اتجاه للتوزيع','خدمات الميل الأخير']],
 restaurants:[['مذاق الحارة','وجبات سريعة'],['سفرة ولمة','وجبات عائلية'],['فرن البلد','مخبوزات طازجة'],['ركن النكهة','وجبات يومية'],['طبق وريحة','أطعمة جاهزة'],['بيت التتبيلة','وجبات مميزة'],['مائدة زمان','أطباق منزلية'],['لقمة هنا','وجبات خفيفة'],['سوق المذاق','أطعمة متنوعة'],['صحن المدينة','وجبات سريعة'],['فرن الصباح','مخبوزات'],['مطبخ الدار','وجبات منزلية']],
 retail:[['سوق الحي','سلع استهلاكية'],['رفوف المدينة','منتجات يومية'],['متجر المدى','تجارة متنوعة'],['بيت الاختيار','مستلزمات منزلية'],['ركن التوفير','سلع اقتصادية'],['واجهة السوق','منتجات عامة'],['سلة المدينة','احتياجات يومية'],['المخزن المفتوح','تجزئة متنوعة'],['دكان بلس','مستلزمات شخصية'],['سوق الجوار','سلع أساسية'],['دار التجزئة','منتجات منزلية'],['رف الاختيار','منتجات متنوعة']],
 food:[['زاد الحقول','منتجات غذائية'],['مونة الدار','مواد غذائية'],['حصاد طازج','أغذية معبأة'],['سلة الريف','منتجات زراعية'],['مذاق الطبيعة','أطعمة صحية'],['مخازن الزاد','مواد تموينية'],['خير الموسم','منتجات موسمية'],['مائدة طازجة','أغذية يومية'],['مزارع النماء','منتجات طازجة'],['زاد البلد','أغذية أساسية'],['حصاد اليوم','منتجات غذائية'],['مونة الموسم','مواد تموينية']],
 care:[['نضارة بلس','منتجات عناية'],['لمسة صفاء','مستحضرات شخصية'],['روتينك','عناية يومية'],['بيت الجمال','منتجات تجميل'],['إشراقة','عناية بالبشرة'],['لمسة طبيعية','مستحضرات نباتية'],['نقاء','منتجات شخصية'],['رونق','عناية متخصصة'],['بشرة وحياة','منتجات عناية'],['توازن','مستحضرات يومية'],['ندى الصباح','عناية بالبشرة'],['لمعة','منتجات تجميل']],
 other:[['مجموعة المدار','خدمات متنوعة'],['حلول الأفق','منتجات عامة'],['شركة خطوة','خدمات محلية'],['رواد السوق','حلول أعمال'],['مدى الأعمال','خدمات متعددة'],['نقطة نمو','منتجات متنوعة'],['أصول المستقبل','خدمات تشغيل'],['بوابة النجاح','حلول متكاملة'],['مسار جديد','خدمات عامة'],['ركن الأعمال','منتجات يومية'],['رؤية السوق','خدمات متنوعة'],['إمداد بلس','حلول مؤسسات']]
};
function businessRivalSectorKey(industry){
 const label=String(industry||'');
 if(/تقنية|برمجيات|رقمية/.test(label))return 'technology';
 if(/لوجست|نقل|توزيع/.test(label))return 'logistics';
 if(/مطاعم|مطعم|مأكولات/.test(label))return 'restaurants';
 if(/تجزئة|متاجر|تجارة/.test(label))return 'retail';
 if(/أغذية|وجبات|طعام/.test(label))return 'food';
 if(/عناية|تجميل|مستحضرات/.test(label))return 'care';
 return 'other';
}
function businessRivalHash(value){
 const source=String(value||'');
 let hash=2166136261;
 for(let i=0;i<source.length;i++)hash=Math.imul(hash^source.charCodeAt(i),16777619);
 return hash>>>0;
}
function businessRivalIdentity(business){
 return String(business&&(business.ownerLifeId||business.lifeId)||state.lifeId||state.name||'hayah')+'|'+String(business&&(business.assetId||business.id||business.title)||'business');
}
function createBusinessRivals(business,industry,year,count,baselinePrice){
 const templates=BUSINESS_RIVAL_SECTORS[businessRivalSectorKey(industry)]||BUSINESS_RIVAL_SECTORS.other;
 const identity=businessRivalIdentity(business);
 const safeCount=Math.max(2,Math.min(12,Math.floor(Number(count)||3)));
 const priceBase=Math.max(75,Math.min(135,Math.round(Number(baselinePrice)||100)));
 return Array.from({length:safeCount},(_,index)=>{
  const seed=businessRivalHash(identity+'|rival|'+index);
  const template=templates[(index+(seed%templates.length))%templates.length];
  return {id:'rival-'+(index+1)+'-'+seed.toString(36),name:template[0],product:template[1],
   priceIndex:Math.max(75,Math.min(135,priceBase+((seed>>>8)%15)-7)),
   qualityIndex:55+((seed>>>12)%40),capacityIndex:70+((seed>>>17)%71),marketingIndex:65+((seed>>>22)%66),
   marketShare:0,cashBalance:150000+((seed>>>2)%1350000),lastYearRevenue:0,lastYearProfit:0,
   lastDecision:'يحافظ على موقعه في السوق',decisionYear:Math.max(0,Math.floor(Number(year)||0)),losingYears:0,active:true};
 });
}
function normalizeBusinessRivals(raw,business,industry,year,count,baselinePrice){
 const source=Array.isArray(raw)?raw.filter(rival=>rival&&typeof rival==='object'&&!Array.isArray(rival)).slice(0,12):[];
 if(!source.length)return createBusinessRivals(business,industry,year,count,baselinePrice);
 const templates=BUSINESS_RIVAL_SECTORS[businessRivalSectorKey(industry)]||BUSINESS_RIVAL_SECTORS.other;
 const identity=businessRivalIdentity(business);
 return source.map((rival,index)=>{
  const seed=businessRivalHash(identity+'|legacy-rival|'+index),template=templates[index%templates.length];
  const finite=(value,fallback)=>Number.isFinite(Number(value))?Number(value):fallback;
  return {id:String(rival.id||('rival-'+(index+1)+'-'+seed.toString(36))).slice(0,80),
   name:typeof rival.name==='string'&&rival.name.trim()?rival.name.slice(0,48):template[0],
   product:typeof rival.product==='string'&&rival.product.trim()?rival.product.slice(0,48):template[1],
   priceIndex:Math.max(70,Math.min(145,Math.round(finite(rival.priceIndex,baselinePrice||100)))),
   qualityIndex:Math.max(35,Math.min(100,Math.round(finite(rival.qualityIndex,70)))),
   capacityIndex:Math.max(40,Math.min(180,Math.round(finite(rival.capacityIndex,100)))),
   marketingIndex:Math.max(35,Math.min(170,Math.round(finite(rival.marketingIndex,95)))),
   marketShare:Math.round(Math.max(0,Math.min(85,finite(rival.marketShare,0)))*10)/10,
   cashBalance:Math.max(0,Math.min(50000000000,Math.round(finite(rival.cashBalance,250000)))),
   lastYearRevenue:Math.max(0,Math.min(8000000000,Math.round(finite(rival.lastYearRevenue,0)))),
   lastYearProfit:Math.max(-8000000000,Math.min(8000000000,Math.round(finite(rival.lastYearProfit,0)))),
   lastDecision:typeof rival.lastDecision==='string'?rival.lastDecision.slice(0,64):'يحافظ على موقعه في السوق',
   decisionYear:Math.max(0,Math.min(200,Math.floor(finite(rival.decisionYear,year)))),
   losingYears:Math.max(0,Math.min(10,Math.floor(finite(rival.losingYears,0)))),active:rival.active!==false};
 });
}
function advanceBusinessRivals(raw,business,industry,year,profile,demandIndex){
 const previous=normalizeBusinessRivals(raw,business,industry,Math.max(0,year-1),Array.isArray(raw)?raw.length:3,profile.rivalPriceMin);
 const identity=businessRivalIdentity(business),marketSize=Math.max(180000,Math.min(100000000,Math.round((Number(business.value)||180000)*1.25)));
 return previous.map(rival=>{
  if(rival.decisionYear>=year)return rival;
  const seed=businessRivalHash(identity+'|'+rival.id+'|year|'+year);
  let priceIndex=rival.priceIndex,qualityIndex=rival.qualityIndex,capacityIndex=rival.capacityIndex,marketingIndex=rival.marketingIndex;
  let decision='حافظ على استراتيجيته',investment=0;
  const choice=seed%4;
  if(choice===0){priceIndex=Math.max(75,priceIndex-3-((seed>>>5)%5));marketingIndex=Math.min(170,marketingIndex+1+((seed>>>10)%3));decision='خفض الأسعار لجذب عملاء جدد';}
  else if(choice===1){qualityIndex=Math.min(100,qualityIndex+2+((seed>>>6)%5));priceIndex=Math.min(145,priceIndex+1+((seed>>>11)%2));investment=Math.round(marketSize*.018);decision='استثمر في تحسين الجودة';}
  else if(choice===2){capacityIndex=Math.min(180,capacityIndex+5+((seed>>>7)%9));investment=Math.round(marketSize*.035);decision='وسّع الطاقة الإنتاجية';}
  else{marketingIndex=Math.min(170,marketingIndex+5+((seed>>>8)%8));investment=Math.round(marketSize*.024);decision='كثّف الحملات التسويقية';}
  const share=Math.max(1,Math.min(65,Number(rival.marketShare)||100/Math.max(2,previous.length)));
  const demandFactor=Math.max(.65,Math.min(1.3,(Number(demandIndex)||75)/80));
  const revenue=Math.max(0,Math.round(marketSize*(share/100)*demandFactor*(capacityIndex/100)*(marketingIndex/100)*(priceIndex/100)*4));
  const margin=Math.max(.04,Math.min(.32,.14+(qualityIndex-70)*.002-(priceIndex-100)*.0008));
  const upkeep=Math.round(marketSize*.003*(capacityIndex/100));
  const profit=Math.round(revenue*margin-upkeep);
  const cashBalance=Math.max(0,Math.min(50000000000,Math.round(rival.cashBalance+profit-investment)));
  return {...rival,priceIndex,qualityIndex,capacityIndex,marketingIndex,cashBalance,lastYearRevenue:revenue,lastYearProfit:profit,
   lastDecision:decision,decisionYear:year,losingYears:profit<0?Math.min(10,rival.losingYears+1):0};
 });
}
function summarizeBusinessRivals(rivals,baselineCompetition,profile){
 const active=(Array.isArray(rivals)?rivals:[]).filter(rival=>rival&&rival.active!==false);
 const average=key=>active.length?active.reduce((sum,rival)=>sum+Number(rival[key]||0),0)/active.length:100;
 const count=active.length,avgPrice=Math.round(average('priceIndex')),avgQuality=Math.round(average('qualityIndex'));
 const avgMarketing=Math.round(average('marketingIndex')),avgCapacity=Math.round(average('capacityIndex'));
 const profileMin=profile?profile.competitionMin:10,profileMax=profile?profile.competitionMin+profile.competitionRange-1:95;
 const base=Math.max(profileMin,Math.min(profileMax,Math.round(Number(baselineCompetition)||profileMin)));
 const pressure=Math.round((avgMarketing-95)*.12+(avgCapacity-100)*.04+(count-4)*.65);
 return {competitorCount:count,rivalPriceIndex:Math.max(70,Math.min(145,avgPrice||100)),
  rivalQualityIndex:Math.max(35,Math.min(100,avgQuality||70)),rivalMarketingIndex:Math.max(35,Math.min(170,avgMarketing||95)),
  rivalCapacityIndex:Math.max(40,Math.min(180,avgCapacity||100)),competitionIndex:Math.max(profileMin,Math.min(profileMax,base+pressure))};
}
function reconcileBusinessRivalShares(market){
 if(!market||!Array.isArray(market.rivals))return;
 const active=market.rivals.filter(rival=>rival&&rival.active!==false);
 if(!active.length)return;
 const playerShare=Math.max(3,Math.min(45,Number(market.marketShare)||0)),remaining=Math.max(0,100-playerShare);
 const weights=active.map(rival=>Math.max(.1,((Number(rival.qualityIndex)||70)*.42+(Number(rival.marketingIndex)||95)*.25+(Number(rival.capacityIndex)||100)*.33)/Math.max(70,Number(rival.priceIndex)||100)));
 const total=weights.reduce((sum,value)=>sum+value,0)||active.length;
 active.forEach((rival,index)=>{rival.marketShare=Math.round(remaining*weights[index]/total*10)/10;});
}
const BUSINESS_FACILITY_CATALOG = [
 {id:'store',title:'متجر إضافي',emoji:'🏬',costRate:.08,minCost:12000,capacityBonus:.3,upkeepRate:.06,minUpkeep:900,description:'نقطة بيع إضافية توسّع الوصول للعملاء والطاقة البيعية.'},
 {id:'factory',title:'مصنع صغير',emoji:'🏭',costRate:.16,minCost:22000,capacityBonus:.7,upkeepRate:.085,minUpkeep:1800,description:'منشأة إنتاج ترفع القدرة على تلبية الطلب، مع صيانة أعلى.'}
];
const JOB_PACK_PROMOS = {
 actorPack:{title:'Actor Job Pack',emoji:'🎭',cost:25000,description:'Are you the center of attention? Do you live for drama? Hire an agent, book an acting gig, and rise to fame with this job pack!',features:['Hire a professional agent!','Book auditions and acting gigs!','Film commercials and rise to fame!']},
 fighterPack:{title:'Ultimate Fighter Mode',emoji:'🥊',cost:45000,description:'Step into the cage and fight your way to the top!',features:['Become a WORLD CHAMPION!','Brawl in STREET FIGHTS!','LEARN and level up 200+ moves!','FIGHT in an epic MMA mini game!','Hire a PROFESSIONAL coach!','ENGAGE with other fighters!']},
 proAthletePack:{title:'Pro Athlete Job Pack',emoji:'🏀',cost:35000,description:'Are you a baller like LeBron? Are you the next Messi? Become the MVP of your favorite sport with this job pack!',features:['Train to become a professional athlete!','Join a team and compete for championships!','Earn contracts, trophies and fame!']},
 politicianPack:{title:'Politician Job Pack',emoji:'🏛️',cost:30000,description:'Are you a natural-born leader? Do you dream of being President? Your rise to power begins with this job pack!',features:['Run for local office!','Campaign and build public trust!','Climb the political ladder!']},
 astronautPack:{title:'Astronaut Job Pack',emoji:'🧑‍🚀',cost:50000,description:'Unlock the mysteries of the universe!',features:['Explore new planets!','Discover alien artifacts!','Train for missions in space!']},
 businessPack:{title:'Business Job Pack',emoji:'💼',cost:60000,description:'Are you a natural-born leader with a hunger for profit? Start up, acquire, or lead a company in this job pack!',features:['Start or acquire companies!','Hire teams and manage expenses!','Build wealth through business decisions!']},
 dealerPack:{title:'Street Hustler Job Pack',emoji:'🃏',cost:70000,description:'Do you dream in dollar signs? Swindle the masses out of their riches with this job pack!',features:['Start out on the street!','Build your reputation and territory!','Work your way up to the top!']},
 mafiaPack:{title:'Mafia Job Pack',emoji:'🕶️',cost:70000,description:'Does being bad tempt you? Rise to notoriety and become Godfather!',features:['Join a fictional crime family!','Earn rank and reputation!','Try to become the Godfather!']},
 movieDirectorPack:{title:'Movie Director',emoji:'🎥',cost:65000,description:'Become the next legendary filmmaker!',features:['Direct movies across 11 different genres!','Hold auditions to find the perfect actors!','Deal with actor drama behind the scenes!','Win awards for your movies!','Showcase your movies at festivals!']},
 goldenDiploma:{title:'Golden Diploma',emoji:'🎓',cost:38000,description:'Become an overnight expert in the field of your dreams!',features:['Choose a university major instantly!','Unlock the highest education tier!','Improve eligibility for careers!']},
 modelPack:{title:'Model Job Pack',emoji:'📸',cost:28000,description:'Are you a perfect 10 in a world full of 3s? Start your modeling career and strut your way to the top of the industry in this job pack!',features:['Book professional photo shoots!','Sign modeling contracts and campaigns!','Build your portfolio and fame!']},
 musicianPack:{title:'Musician Job Pack',emoji:'🎼',cost:30000,description:'Are you the next Beyoncé, just waiting to be discovered? Sing your way to the top of the charts with this job pack!',features:['Record and release original songs!','Book gigs and performances!','Grow your fanbase and fame!']},
 musicProducerPack:{title:'Music Producer Job Pack',emoji:'🎧',cost:35000,description:'Are you the next hit producer, just waiting to be discovered? Produce your way to the top of the charts with this job pack!',features:['Produce and release hit tracks!','Collaborate with musicians!','Build a production reputation!']}
};
const ACTIVITY_PACK_PROMOS = {
 vampireMode:{title:'Vampire Mode',emoji:'🧛',cost:55000,theme:'vampire',description:'Enter a supernatural life of ancient secrets, hunters and immortal ambition.',features:['Absorb ESSENCE to grow stronger!','Survive VAMPIRE HUNTER encounters!','Build your own vampire bloodline!','Use HYPNOTIC charm on encounters!','Rise through the vampire ranks!','Strive to become a VAMPIRE LORD!']},
 outdoorsPack:{title:'Outdoors Lifestyle',emoji:'🏕️',cost:45000,theme:'outdoors',description:'Get outside, explore the wilderness and make memories with the people you love.',features:['Purchase off-road vehicles and explore trails!','Search caves for lost treasure!','Take friends and family hiking and camping!','Go on fishing trips!','Discover wildlife and fill your handbook!']},
 gatedCommunityPack:{title:'Gated Community',emoji:'🏙️',cost:90000,theme:'gated',description:'The upper echelon of life is waiting for you. Climb the social ladder and explore the luxury lifestyle.',features:['Own and vacation on private islands!','Enjoy the perks of secret societies!','Attend EXCLUSIVE VIP events!','Shop new luxury items!','Unlock more high-end experiences!']}
};
const fmt = n => new Intl.NumberFormat('ar-EG',{maximumFractionDigits:0}).format(Math.round(Number(n)||0));
const cash = n => fmt(n)+' '+(state&&state.place?state.place.unit:'ج.م');
const clamp = (n,min=0,max=100) => Math.max(min,Math.min(max,Math.round(n)));
const pick = list => list[Math.floor(Math.random()*list.length)];
const chance = p => Math.random()<p;
const esc = s => String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function defaultPermanentPerks(){
 const owned={},enabled={};PERK_IDS.forEach(id=>owned[id]=false);PERK_TOGGLE_IDS.forEach(id=>enabled[id]=false);
 return {owned,enabled,streakSavers:0};
}
function normalizePermanentPerks(raw){
 const defaults=defaultPermanentPerks();
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return defaults;
 PERK_IDS.forEach(id=>defaults.owned[id]=!!(raw.owned&&raw.owned[id]));
 PERK_TOGGLE_IDS.forEach(id=>defaults.enabled[id]=!!(raw.enabled&&raw.enabled[id]));
 defaults.streakSavers=clamp(Number(raw.streakSavers)||0,0,99);
 return defaults;
}
function loadPermanentPerks(){
 try{return normalizePermanentPerks(JSON.parse(localStorage.getItem(PERKS_KEY)||'null'));}
 catch(e){return defaultPermanentPerks();}
}
function persistPermanentPerks(){try{localStorage.setItem(PERKS_KEY,JSON.stringify(permanentPerks));}catch(e){}}
function perkOwned(id){return !!(permanentPerks&&permanentPerks.owned&&permanentPerks.owned[id])||(id==='actorPack'&&!!(permanentPerks&&permanentPerks.owned&&permanentPerks.owned.bossMode))||!!(permanentPerks&&permanentPerks.owned&&permanentPerks.owned.bossMode&&JOB_PACK_IDS.includes(id));}
function perkEnabled(id){return perkOwned(id)&&!!(permanentPerks.enabled&&permanentPerks.enabled[id]);}
function careerIncomeMultiplier(){return perkEnabled('goldenNeko')?1.2:1;}
function specialCareerIncomeMultiplier(){return careerIncomeMultiplier()*(perkEnabled('bossMode')?1.1:1);}
let state, dead=false, logBatchDepth=0, logBatchDirty=false, saveRecovered=false;
let renderedLogSnapshot=null, renderedFeedElement=null;
let activeDialogKeyHandler=null, modalReturnFocus=null;
let managedCompanyId = null;
let uiSettings={theme:'light',textScale:'normal',sound:false,haptics:false,boosts:true,combatTimingAssist:false};
const STAT_BOOST_CATALOG={
 happiness:{label:'السعادة',icon:'🌿',free:{title:'وقت مع شخص قريب',cost:0,gain:7,description:'خصص وقتًا لشخص ترتاح له، حتى لو بمكالمة قصيرة.'},paid:{title:'خروجة تغيّر الجو',cost:500,gain:12,description:'نشاط ترفيهي بسيط يساعدك تفصل عن الضغط.'}},
 health:{label:'الصحة',icon:'🩺',free:{title:'راحة وتعافٍ',cost:0,gain:5,description:'خفف المجهود وخد وقتًا كافيًا للراحة.'},paid:{title:'فحص طبي',cost:1200,gain:13,description:'اطمئن على حالتك من خلال زيارة طبية داخل اللعبة.'}},
 smart:{label:'الذكاء',icon:'📚',free:{title:'مراجعة مركزة',cost:0,gain:6,description:'راجع معلومة أو مهارة تحتاجها في المرحلة الحالية.'},paid:{title:'دورة قصيرة',cost:800,gain:12,description:'استثمر في تدريب قصير يضيف معرفة جديدة.'}},
 looks:{label:'المظهر',icon:'✨',free:{title:'روتين عناية بسيط',cost:0,gain:5,description:'اهتم بالتفاصيل اليومية البسيطة لمظهرك.'},paid:{title:'جلسة عناية',cost:600,gain:11,description:'خصص ميزانية صغيرة للعناية الشخصية.'}}
};
let uiAudioContext=null;
let permanentPerks={owned:{},enabled:{},streakSavers:0};
const names = {
 male:['آدم','يوسف','عمر','مالك','زياد','حمزة','كريم','سليم','ياسين','علي','إياد','مروان','أحمد','سيف','نوح'],
 female:['مريم','ليلى','سلمى','نور','جنى','ملك','فريدة','ياسمين','هنا','تاليا','آية','دانا','لارا','مكة','ريماس'],
 family:['عبدالله','حسن','إبراهيم','منصور','عادل','عمر','سعيد','فتحي','شريف','كمال','النجار','الحمادي','هاشم']
};
const places=[
 {country:'مصر',city:'القاهرة',flag:'🇪🇬',start:18000,unit:'ج.م'},
 {country:'مصر',city:'الإسكندرية',flag:'🇪🇬',start:16000,unit:'ج.م'},
 {country:'السعودية',city:'جدة',flag:'🇸🇦',start:18000,unit:'ر.س'},
 {country:'الإمارات',city:'دبي',flag:'🇦🇪',start:18000,unit:'د.إ'},
 {country:'الولايات المتحدة',city:'نيويورك',flag:'🇺🇸',start:26000,unit:'دولار'},
 {country:'المملكة المتحدة',city:'لندن',flag:'🇬🇧',start:22000,unit:'£'},
 {country:'كندا',city:'تورونتو',flag:'🇨🇦',start:21000,unit:'دولار كندي'},
 {country:'ألمانيا',city:'برلين',flag:'🇩🇪',start:20000,unit:'€'},
 {country:'فرنسا',city:'باريس',flag:'🇫🇷',start:19000,unit:'€'},
 {country:'المغرب',city:'الدار البيضاء',flag:'🇲🇦',start:14000,unit:'د.م'}
];
const parentJobs=['مدرس','محاسب','مهندسة','طبيب','موظف حكومي','صاحب محل','ممرضة','موظف بنك','سائق','محامية','فني كهرباء','ربة منزل'];
const jobs=[
 {id:'sales',title:'موظف مبيعات',salary:72000,age:18,smart:15,edu:0,emoji:'🛍️',desc:'خبرة عملية وتواصل مع العملاء.'},
 {id:'support',title:'خدمة عملاء',salary:84000,age:18,smart:28,edu:0,emoji:'🎧',desc:'مهنة تعتمد على التواصل وحل المشكلات.'},
 {id:'admin',title:'موظف إداري',salary:96000,age:18,smart:35,edu:1,emoji:'🗂️',desc:'تنظيم ومتابعة وتقارير.'},
 {id:'designer',title:'مصمم',salary:156000,age:20,smart:45,edu:2,emoji:'🎨',desc:'إبداع ومهارات رقمية.'},
 {id:'developer',title:'مطور برمجيات',salary:240000,age:21,smart:62,edu:3,emoji:'💻',desc:'برمجة وأنظمة وبيانات.'},
 {id:'teacher',title:'مدرس',salary:132000,age:22,smart:50,edu:2,emoji:'📚',desc:'تعليم ومساعدة أجيال جديدة.'},
 {id:'engineer',title:'مهندس',salary:216000,age:22,smart:58,edu:4,emoji:'🦺',desc:'يحتاج دراسة هندسية.'},
 {id:'doctor',title:'طبيب',salary:300000,age:25,smart:76,edu:5,emoji:'🩺',desc:'مسار طويل ومسؤولية كبيرة.'},
 {id:'founder',title:'صاحب مشروع',salary:180000,age:23,smart:52,edu:0,emoji:'🚀',desc:'فرصة للنمو مع مخاطرة أعلى.'},
 {id:'nurse',title:'ممرض',salary:168000,age:22,smart:52,edu:2,emoji:'🩹',desc:'رعاية المرضى والعمل ضمن فريق طبي.'},
 {id:'lawyer',title:'محامي',salary:264000,age:24,smart:68,edu:4,emoji:'⚖️',desc:'دراسة قانونية وتفاوض ودفاع عن العملاء.'},
 {id:'accountant',title:'محاسب',salary:144000,age:21,smart:48,edu:2,emoji:'🧾',desc:'إدارة الميزانيات والمراجعة المالية.'},
 {id:'chef',title:'طاهٍ محترف',salary:150000,age:20,smart:38,edu:1,emoji:'👨‍🍳',desc:'مهارة وخبرة وترقٍ داخل المطابخ.'},
 {id:'journalist',title:'صحفي',salary:156000,age:21,smart:55,edu:2,emoji:'📰',desc:'بحث وكتابة ومقابلات.'},
 {id:'pilot',title:'طيار',salary:360000,age:25,smart:70,edu:4,emoji:'✈️',desc:'تدريب مكلف ومسؤولية عالية.'},
 {id:'police',title:'ضابط شرطة',salary:180000,age:21,smart:42,edu:2,emoji:'👮',desc:'خدمة عامة وانضباط ومخاطر مهنية.'},
 {id:'scientist',title:'باحث علمي',salary:276000,age:25,smart:80,edu:5,emoji:'🔬',desc:'بحث وتجارب ومسار أكاديمي طويل.'},
 {id:'athlete',title:'رياضي محترف',salary:220000,age:18,smart:25,edu:0,emoji:'🏅',desc:'الموهبة والتدريب والصحة تحدد مستقبلك.'},
 {id:'artist',title:'فنان',salary:120000,age:18,smart:38,edu:0,emoji:'🎭',desc:'الدخل متغير ويعتمد على الموهبة والسمعة.'},
 {id:'politician',title:'سياسي',salary:240000,age:28,smart:62,edu:3,emoji:'🏛️',desc:'سمعة عامة وعلاقات وقرارات صعبة.'}
];
const majors=[
 {id:'commerce',title:'تجارة وإدارة',min:35,edu:2,cost:18000,years:4,emoji:'📊',desc:'إدارة ومال وأعمال.'},
 {id:'history',title:'التاريخ والآثار',min:30,edu:2,cost:15000,years:4,emoji:'🏺',desc:'الحضارات والآثار والبحث التاريخي.'},
 {id:'art-history',title:'تاريخ الفن',min:33,edu:2,cost:16000,years:4,emoji:'🖼️',desc:'تاريخ الفنون وتحليل الأعمال الفنية.'},
 {id:'english',title:'اللغة الإنجليزية والترجمة',min:38,edu:2,cost:18000,years:4,emoji:'📚',desc:'اللغة والترجمة والكتابة.'},
 {id:'anthropology',title:'علم الإنسان',min:37,edu:2,cost:17000,years:4,emoji:'🌍',desc:'الثقافات والمجتمعات وتطور الإنسان.'},
 {id:'psychology',title:'علم النفس',min:45,edu:2,cost:19000,years:4,emoji:'🧠',desc:'السلوك والتفكير والصحة النفسية.'},
 {id:'media',title:'الإعلام والاتصال',min:42,edu:2,cost:19000,years:4,emoji:'🎙️',desc:'الإعلام والصحافة والإنتاج الرقمي.'},
 {id:'design',title:'الفنون والتصميم',min:40,edu:2,cost:17500,years:4,emoji:'🎨',desc:'التصميم والإبداع والممارسة الفنية.'},
 {id:'education',title:'التربية',min:40,edu:2,cost:17000,years:4,emoji:'🍎',desc:'التعليم وطرق التدريس والتعلم.'},
 {id:'law',title:'الحقوق',min:50,edu:3,cost:22000,years:4,emoji:'⚖️',desc:'القانون والحقوق والأنظمة القانونية.'},
 {id:'marketing',title:'التسويق',min:44,edu:2,cost:19000,years:4,emoji:'📣',desc:'أبحاث السوق والعلامات التجارية وسلوك العملاء.'},
 {id:'computer',title:'علوم الحاسب',min:58,edu:3,cost:26000,years:4,emoji:'💻',desc:'برمجة وأنظمة وبيانات.'},
 {id:'chemistry',title:'الكيمياء',min:55,edu:3,cost:23000,years:4,emoji:'🧪',desc:'المواد والتفاعلات والتحليل العلمي.'},
 {id:'biology',title:'الأحياء',min:50,edu:3,cost:21000,years:4,emoji:'🧬',desc:'الكائنات الحية والأنظمة البيولوجية.'},
 {id:'political-science',title:'العلوم السياسية',min:52,edu:3,cost:21500,years:4,emoji:'🏛️',desc:'الحكومات والسياسات والعلاقات الدولية.'},
 {id:'economics',title:'الاقتصاد',min:52,edu:3,cost:22000,years:4,emoji:'📈',desc:'الأسواق والموارد واتخاذ القرارات المالية.'},
 {id:'nursing',title:'التمريض',min:55,edu:3,cost:24000,years:4,emoji:'🩹',desc:'رعاية المرضى والممارسة الصحية.'},
 {id:'engineering',title:'هندسة',min:65,edu:4,cost:30000,years:5,emoji:'🦺',desc:'تصميم وبناء وحلول تقنية.'},
 {id:'physics',title:'الفيزياء',min:65,edu:4,cost:26000,years:4,emoji:'⚛️',desc:'القوانين الفيزيائية والتحليل التجريبي.'},
 {id:'pharmacy',title:'الصيدلة',min:68,edu:4,cost:32000,years:5,emoji:'💊',desc:'الأدوية وعلوم العلاج والصيدلة.'},
 {id:'dentistry',title:'طب الأسنان',min:75,edu:5,cost:36000,years:5,emoji:'🦷',desc:'صحة الفم والأسنان والتشخيص.'},
 {id:'medicine',title:'طب بشري',min:78,edu:5,cost:38000,years:6,emoji:'🩺',desc:'دراسة أطول ومهنة مؤثرة.'}
];
const assetShop=[
 {kind:'property',title:'أوضة تمليك صغيرة',emoji:'🏠',value:350000,upkeep:6500,desc:'بداية في العقارات ومكان ثابت.'},
 {kind:'property',title:'شقة متوسطة',emoji:'🏢',value:950000,upkeep:14000,desc:'مساحة أكبر ومسؤوليات أعلى.'},
 {kind:'property',title:'بيت عائلي',emoji:'🏡',value:2400000,upkeep:34000,desc:'بيت واسع يحتاج ميزانية قوية.'},
 {kind:'car',title:'عربية مستعملة',emoji:'🚗',value:260000,upkeep:17000,desc:'تنقل أسهل وتكلفة صيانة سنوية.'},
 {kind:'car',title:'عربية جديدة',emoji:'🚙',value:850000,upkeep:29000,desc:'راحة أكتر ومصاريف أعلى.'},
 {kind:'business',title:'مشروع صغير',emoji:'🏪',value:150000,upkeep:5000,desc:'أصل يمكن أن ينمو مع مخاطرة تشغيل.'}
];
const SOCIAL_PLATFORM_CATALOG=[
 {id:'facebook',title:'Facebook',emoji:'📘',desc:'شارك تحديثاتك وصورك مع الأصدقاء.',minAge:10},
 {id:'instagram',title:'Instagram',emoji:'📸',desc:'ابنِ جمهورًا من الصور والقصص.',minAge:10},
 {id:'onlyfans',title:'OnlyFans',emoji:'🪙',desc:'منصة اشتراكات مدفوعة للبالغين فقط.',minAge:18},
 {id:'tiktok',title:'TikTok',emoji:'🎵',desc:'انشر مقاطع قصيرة وحاول الوصول لجمهور جديد.',minAge:13},
 {id:'twitch',title:'Twitch',emoji:'🟣',desc:'ابدأ البث المباشر وتفاعل مع المتابعين.',minAge:13},
 {id:'twitter',title:'Twitter',emoji:'🐦',desc:'انشر أفكارًا وتحديثات قصيرة.',minAge:13},
 {id:'soundcloud',title:'SoundCloud',emoji:'☁️',desc:'شارك الموسيقى والأعمال الصوتية.',minAge:13},
 {id:'podcast',title:'Podcast',emoji:'🎙️',desc:'ابدأ برنامجًا صوتيًا واستضف ضيوفًا.',minAge:13},
 {id:'youtube',title:'YouTube',emoji:'▶️',desc:'انشر فيديوهات وابنِ قناة.',minAge:13}
];

const dailyChallengeDefs=[
 {id:'healthy',title:'صحة أولًا',desc:'حافظ على صحتك عند 85% أو أعلى.',reward:1600,rewardStat:'health',available:s=>true,done:s=>(s.stats.health||0)>=85},
 {id:'happy',title:'يوم إيجابي',desc:'وصل السعادة إلى 80% أو أعلى.',reward:1400,rewardStat:'happiness',available:s=>true,done:s=>(s.stats.happiness||0)>=80},
 {id:'smart',title:'نمّي ذكاءك',desc:'وصل الذكاء إلى 65% أو أعلى.',reward:1700,rewardStat:'smart',available:s=>true,done:s=>(s.stats.smart||0)>=65},
 {id:'age-one',title:'افتح فصلًا جديدًا',desc:'تقدّم سنة واحدة في سجل حياتك.',reward:1200,rewardStat:'happiness',available:s=>s.age===0,done:s=>s.age>=1},
 {id:'family',title:'قرّب المسافات',desc:'ارفع علاقتك بأحد أفراد العائلة إلى 65% أو أكثر.',reward:1800,rewardStat:'happiness',available:s=>(s.family||[]).some(n=>!n.deceased),done:s=>(s.family||[]).some(n=>!n.deceased&&(n.relationshipLevel||0)>=65)},
 {id:'friend',title:'كوّن صداقة',desc:'كوّن صداقة واحدة على الأقل.',reward:1500,rewardStat:'happiness',available:s=>true,done:s=>(s.friends||[]).length>=1},
 {id:'hobby',title:'خصص وقتًا لنفسك',desc:'ابدأ هواية واحدة على الأقل.',reward:1500,rewardStat:'happiness',available:s=>true,done:s=>(s.hobbies||[]).length>=1},
 {id:'pet',title:'رفيق وفيّ',desc:'تبنَّ حيوانًا أليفًا وابدأ رعايته.',reward:1800,rewardStat:'happiness',available:s=>true,done:s=>(s.pets||[]).length>=1},
 {id:'career',title:'خطوة مهنية',desc:'احصل على وظيفة أو ابدأ مسارًا مهنيًا خاصًا.',reward:2200,rewardStat:'smart',available:s=>s.age>=18,done:s=>!!s.job||!!s.specialCareer},
 {id:'study',title:'استثمار في التعليم',desc:'وصل إلى المستوى التعليمي الثاني أو أعلى.',reward:2000,rewardStat:'smart',available:s=>s.age>=15,done:s=>(s.education&&s.education.level||0)>=2},
 {id:'asset',title:'أول أصل',desc:'امتلك أصلًا واحدًا على الأقل.',reward:2200,rewardStat:'smart',available:s=>s.age>=18,done:s=>(s.assets||[]).length>=1},
 {id:'travel',title:'اكتشف مكانًا جديدًا',desc:'سجّل رحلة واحدة على الأقل.',reward:2000,rewardStat:'happiness',available:s=>s.age>=18,done:s=>(s.travelHistory||[]).length>=1},
 {id:'invest',title:'فكّر كمستثمر',desc:'ابدأ استثمارًا واحدًا على الأقل.',reward:2400,rewardStat:'smart',available:s=>s.age>=18,done:s=>(s.investments||[]).length>=1},
 {id:'fame',title:'اسمك بدأ ينتشر',desc:'وصل الشهرة إلى 15% أو أعلى.',reward:2500,rewardStat:'happiness',available:s=>s.age>=13,done:s=>(s.fame||0)>=15},
 {id:'partner',title:'رابطة مهمة',desc:'ابدأ علاقة مع شريك.',reward:1800,rewardStat:'happiness',available:s=>s.age>=18,done:s=>!!s.partner},
 {id:'business',title:'فكرة تتحول لمشروع',desc:'امتلك مشروعًا تجاريًا واحدًا على الأقل.',reward:2800,rewardStat:'smart',available:s=>s.age>=18,done:s=>!!s.business},
 {id:'license',title:'جاهز للطريق',desc:'احصل على رخصة قيادة.',reward:1500,rewardStat:'smart',available:s=>s.age>=18,done:s=>!!s.driversLicense},
 {id:'child',title:'بداية جيل جديد',desc:'أنجب أو تبنَّ طفلًا.',reward:2400,rewardStat:'happiness',available:s=>s.age>=20,done:s=>(s.children||[]).length>=1},
 {id:'savings',title:'وسادة مالية',desc:'احتفظ برصيد قدره 30,000 أو أكثر.',reward:1800,rewardStat:'smart',available:s=>s.age>=18,done:s=>(s.bank||0)>=30000},
 {id:'debt-free',title:'سيطرة مالية',desc:'حافظ على عدم وجود ديون ورصيد موجب لا يقل عن 20,000.',reward:2200,rewardStat:'smart',available:s=>s.age>=18,done:s=>(s.debt||0)<=0&&(s.bank||0)>=20000},
 {id:'club',title:'نشاط خارج الفصل',desc:'انضم إلى نادٍ أو نشاط مدرسي.',reward:1400,rewardStat:'smart',available:s=>s.age>=10&&s.age<23,done:s=>!!(s.education&&s.education.clubs&&s.education.clubs.length)}
];

const combatMoveCatalog=[
 {id:'quick-jab',title:'لكمة خاطفة',style:'سرعة',strongAgainst:'قوة',power:34,rank:0,cost:0,desc:'حركة سريعة مناسبة لاختبار المسافة.'},
 {id:'high-guard',title:'حراسة متوازنة',style:'دفاع',strongAgainst:'سرعة',power:30,rank:0,cost:0,desc:'اختيار دفاعي يقلل أثر اندفاع الخصم.'},
 {id:'footwork',title:'خطوات مراوغة',style:'سرعة',strongAgainst:'تقنية',power:36,rank:0,cost:1800,desc:'تحرك ذكي يعاقب الأسلوب الفني البطيء.'},
 {id:'counter-read',title:'قراءة الخصم',style:'تقنية',strongAgainst:'قوة',power:42,rank:1,cost:3200,desc:'راقب نمط المنافس ثم اختر التوقيت المناسب.'},
 {id:'body-force',title:'اندفاع قوي',style:'قوة',strongAgainst:'دفاع',power:48,rank:1,cost:4200,desc:'قوة أعلى مقابل استهلاك أكبر للطاقة.'},
 {id:'clinch-control',title:'سيطرة فنية',style:'تقنية',strongAgainst:'سرعة',power:45,rank:2,cost:6500,desc:'تحكم فني جيد أمام المنافس السريع.'},
 {id:'iron-guard',title:'حراسة صلبة',style:'دفاع',strongAgainst:'قوة',power:43,rank:2,cost:6200,desc:'دفاع منضبط أمام أسلوب القوة.'},
 {id:'flash-step',title:'خطوة خاطفة',style:'سرعة',strongAgainst:'تقنية',power:50,rank:3,cost:9000,desc:'حركة متقدمة تعتمد على سرعة رد الفعل.'},
 {id:'champion-finish',title:'إنهاء البطولة',style:'قوة',strongAgainst:'دفاع',power:58,rank:4,cost:16000,desc:'حركة نهائية متقدمة لا تُفتح إلا قرب قمة الترتيب.'},
 {id:'ring-general',title:'إدارة الحلبة',style:'تقنية',strongAgainst:'دفاع',power:52,rank:3,cost:11000,desc:'قراءة تكتيكية توازن بين التوقيت والطاقة.'},
 {id:'low-kick',title:'ركلة جانبية',style:'سرعة',strongAgainst:'قوة',power:38,rank:0,cost:1200,desc:'حركة سريعة لاستغلال المسافة وإرباك المنافس القوي.'},
 {id:'pivot-counter',title:'هجمة الدوران المضاد',style:'تقنية',strongAgainst:'سرعة',power:47,rank:1,cost:3600,desc:'غيّر زاوية المواجهة واستغل اندفاع الخصم.'},
 {id:'shell-defense',title:'الصد المتحرك',style:'دفاع',strongAgainst:'تقنية',power:46,rank:2,cost:6900,desc:'حافظ على التوازن وامتص اندفاع المنافس الفني.'},
 {id:'burst-combo',title:'تركيبة الاندفاع',style:'قوة',strongAgainst:'دفاع',power:55,rank:3,cost:10800,desc:'مجموعة هجومية قوية تحتاج توقيتًا وطاقة مناسبين.'},
 {id:'last-round-read',title:'قراءة الجولة الأخيرة',style:'تقنية',strongAgainst:'دفاع',power:61,rank:4,cost:17500,desc:'خطة متقدمة تستغل ثغرات الدفاع في اللحظات الحاسمة.'},
 {id:'angle-pivot',title:'ارتكاز الزاوية',style:'تقنية',strongAgainst:'سرعة',power:44,rank:1,cost:3900,desc:'غيّر اتجاه المواجهة بدل الدخول في سباق سرعة مباشر.'},
 {id:'low-line-kick',title:'ركلة خط منخفض',style:'سرعة',strongAgainst:'قوة',power:43,rank:1,cost:4100,desc:'استهدف المساحة المفتوحة بحركة سريعة محسوبة.'},
 {id:'shoulder-shell',title:'درع الكتف',style:'دفاع',strongAgainst:'تقنية',power:49,rank:2,cost:7400,desc:'امتص الضغط الفني وحافظ على وضعية آمنة.'},
 {id:'rhythm-barrage',title:'سلسلة الإيقاع',style:'قوة',strongAgainst:'دفاع',power:57,rank:3,cost:11800,desc:'ضغط هجومي متتابع يحتاج إدارة جيدة للطاقة.'},
 {id:'champion-plan',title:'خطة الحسم',style:'تقنية',strongAgainst:'دفاع',power:64,rank:4,cost:19000,desc:'خطة متقدمة تجمع قراءة المسافة واختيار اللحظة المناسبة.'},
 {id:'inside-slip',title:'انزلاق داخلي',style:'سرعة',strongAgainst:'قوة',power:46,rank:1,cost:4300,desc:'غيّر خط الحركة في اللحظة المناسبة لتفادي الاندفاع المباشر.'},
 {id:'rear-angle-check',title:'فحص الزاوية الخلفية',style:'تقنية',strongAgainst:'سرعة',power:48,rank:1,cost:4800,desc:'راقب اتجاه القدمين واختر زاوية تمنحك مساحة أفضل.'},
 {id:'frame-wall',title:'حاجز الساعد',style:'دفاع',strongAgainst:'تقنية',power:49,rank:2,cost:7200,desc:'حافظ على المسافة وامنع المنافس من فرض إيقاعه الفني.'},
 {id:'clinch-turn',title:'دوران الاشتباك',style:'تقنية',strongAgainst:'سرعة',power:52,rank:2,cost:8400,desc:'حوّل الاشتباك القريب إلى وضعية تمنحك تحكمًا أكبر.'},
 {id:'overhand-arc',title:'قوس الضربة الثقيلة',style:'قوة',strongAgainst:'دفاع',power:57,rank:2,cost:9600,desc:'هجوم محسوب يستهدف فتح الحراسة بدل تكرار الضغط.'},
 {id:'tempo-break',title:'كسر الإيقاع',style:'سرعة',strongAgainst:'تقنية',power:58,rank:3,cost:12800,desc:'بدّل سرعة الحركة حتى لا يستطيع المنافس توقع توقيتك.'},
 {id:'body-lock-shift',title:'تحويل السيطرة',style:'تقنية',strongAgainst:'قوة',power:60,rank:3,cost:14100,desc:'استخدم التوازن لتغيير اتجاه ضغط المنافس.'},
 {id:'guard-split',title:'اختراق الحراسة',style:'قوة',strongAgainst:'دفاع',power:63,rank:3,cost:15400,desc:'ركّز الهجوم على فتحة صغيرة بدل استنزاف الطاقة بلا هدف.'},
 {id:'last-minute-shell',title:'حماية الدقيقة الأخيرة',style:'دفاع',strongAgainst:'قوة',power:65,rank:4,cost:18700,desc:'حافظ على دفاعك وهدوءك عندما يشتد ضغط الجولة الأخيرة.'},
 {id:'champion-angle',title:'زاوية البطل',style:'تقنية',strongAgainst:'دفاع',power:68,rank:4,cost:22000,desc:'خطة متقدمة تجمع تغيير الزاوية وقراءة رد فعل المنافس.'}
];
const combatTacticCatalog=[
 {id:'tactic-guard',title:'حراسة متحركة',style:'دفاع',strongAgainst:'قوة',power:31,energyCost:5,desc:'خفّف الاندفاع وحافظ على توازنك في الجولة.'},
 {id:'tactic-feint',title:'خداع بالزاوية',style:'سرعة',strongAgainst:'تقنية',power:34,energyCost:7,desc:'غيّر زاوية الحركة واربح أفضلية على الخصم المتحفّظ.'},
 {id:'tactic-read',title:'قراءة الإيقاع',style:'تقنية',strongAgainst:'سرعة',power:33,energyCost:6,desc:'راقب نمط المنافس واختار توقيتًا أذكى.'},
 {id:'tactic-breathe',title:'التقاط الأنفاس',style:'دفاع',strongAgainst:'',power:20,energyCost:0,energyRecovery:14,oncePerBout:true,desc:'خفّف الضغط في هذه الجولة واستعد 14 نقطة طاقة؛ متاح مرة واحدة في النزال.'}
];
const combatCoachCatalog=[
 {id:'local',name:'كابتن كريم',title:'مدرب البداية',level:1,price:4500,annualCost:700,bonus:3,desc:'أساسيات التدريب والمتابعة.'},
 {id:'pro',name:'كابتن نادر',title:'مدرب محترف',level:2,price:11000,annualCost:1500,bonus:6,desc:'خطة تدريب أكثر تخصيصًا وقراءة للمنافسين.'},
 {id:'elite',name:'كابتن سليم',title:'مدرب النخبة',level:3,price:24000,annualCost:2800,bonus:10,desc:'خبرة عالية لمساعدة اللاعب على المنافسة على اللقب.'}
];
const combatOpponentTypes=[
 {id:'power',title:'منافس القوة',style:'قوة',weakTo:'سرعة',emoji:'💪'},
 {id:'speed',title:'منافس السرعة',style:'سرعة',weakTo:'تقنية',emoji:'⚡'},
 {id:'guard',title:'المدافع الصلب',style:'دفاع',weakTo:'قوة',emoji:'🛡️'},
 {id:'technique',title:'الفني المتمرس',style:'تقنية',weakTo:'دفاع',emoji:'🧠'}
];
const combatOpponentNames=['آدم منصور','مالك شريف','ياسين حمدي','عمر لطفي','كريم فوزي','سيف كمال','علي ناصر','زياد حسن','حمزة فريد','نوح عادل'];
const combatCommunityProfiles=[
 {id:'adam-mansour',name:'آدم منصور',style:'قوة',weakTo:'سرعة',emoji:'💪',rating:46,respect:54,tension:18},
 {id:'malek-sherif',name:'مالك شريف',style:'سرعة',weakTo:'تقنية',emoji:'⚡',rating:52,respect:48,tension:25},
 {id:'yassin-hamdy',name:'ياسين حمدي',style:'دفاع',weakTo:'قوة',emoji:'🛡️',rating:49,respect:58,tension:12},
 {id:'omar-lotfy',name:'عمر لطفي',style:'تقنية',weakTo:'دفاع',emoji:'🧠',rating:56,respect:50,tension:31},
 {id:'karim-fawzy',name:'كريم فوزي',style:'قوة',weakTo:'سرعة',emoji:'🥊',rating:61,respect:45,tension:38}
];
function normalizeCombatCommunity(raw){
 const saved=Array.isArray(raw)?raw:[];
 const bounded=(value,fallback,min,max)=>{
  const number=Number(value);
  return Math.max(min,Math.min(max,Number.isFinite(number)?Math.round(number):fallback));
 };
 return combatCommunityProfiles.map(profile=>{
  const item=saved.find(entry=>entry&&typeof entry==='object'&&!Array.isArray(entry)&&entry.id===profile.id)||{};
  return {
   ...profile,
   rating:bounded(item.rating,profile.rating,20,95),
   respect:bounded(item.respect,profile.respect,0,100),
   tension:bounded(item.tension,profile.tension,0,100),
   allied:item.allied===true,
   lastInteractionAge:bounded(item.lastInteractionAge,-1,-1,120),
   lastBoutAge:bounded(item.lastBoutAge,-1,-1,120),
   lastAction:['friendly','trash','alliance','break','spar'].includes(item.lastAction)?item.lastAction:''
  };
 });
}
function combatRoundEnergy(currentEnergy,move,mode='street',reactionCost=0){
 const before=clamp(Number(currentEnergy)||0);
 const hasExplicitCost=!!(move&&move.energyCost!==undefined&&move.energyCost!==null&&Number.isFinite(Number(move.energyCost)));
 const baseCost=hasExplicitCost?Math.max(0,Math.min(30,Math.floor(Number(move.energyCost)))):Math.max(6,Math.round((Number(move&&move.power)||48)/8));
 const moveCost=Math.min(32,baseCost+(mode==='league'?2:0));
 const safeReactionCost=Math.max(0,Math.min(8,Math.floor(Number(reactionCost)||0)));
 const energyCost=Math.min(40,moveCost+safeReactionCost);
 const rawRecovery=Number(move&&move.energyRecovery);
 const energyRecovery=Number.isFinite(rawRecovery)?Math.max(0,Math.min(20,Math.floor(rawRecovery))):0;
 return {before,moveCost,reactionCost:safeReactionCost,energyCost,energyRecovery,after:clamp(before-energyCost+energyRecovery)};
}
function combatOpponentStyleForRound(opponent,round,lastPlayerStyle){
 const baseStyles=['قوة','سرعة','دفاع','تقنية'];
 const base=opponent&&baseStyles.includes(opponent.style)?opponent.style:'قوة';
 if(Number(round)<=1)return base;
 const adaptive={'سرعة':'تقنية','تقنية':'قوة','قوة':'دفاع','دفاع':'سرعة'};
 const next=adaptive[lastPlayerStyle];
 if(!next)return base;
 if(Number(round)===2)return next;
 return baseStyles[(baseStyles.indexOf(next)+1)%baseStyles.length];
}
function combatOpponentIntent(opponent,round,lastPlayerStyle){
 const style=combatOpponentStyleForRound(opponent,round,lastPlayerStyle);
 const intents={
  'قوة':{title:'ضربة ثقيلة',description:'المنافس يحمّل هجمة مباشرة تعتمد على القوة.'},
  'سرعة':{title:'هجوم خاطف',description:'المنافس يجهز سلسلة سريعة ويبحث عن فتحة.'},
  'دفاع':{title:'استدراج دفاعي',description:'المنافس ينتظر اندفاعك ليحاول الرد من وضع آمن.'},
  'تقنية':{title:'محاولة سيطرة',description:'المنافس يغيّر المسافة ويحاول فرض اشتباك فني.'}
 };
 return {style,...intents[style]};
}
const combatReactionCatalog=[
 {id:'guard',title:'صد محكم',energyCost:1,description:'ثبّت الحراسة وامتص الهجمة المتوقعة.'},
 {id:'dodge',title:'مراوغة جانبية',energyCost:3,description:'غيّر زاويتك لتفادي خط الهجوم.'},
 {id:'counter',title:'رد مضاد',energyCost:4,description:'اقرأ اندفاع المنافس وحاول الرد في توقيت مناسب.'}
];
function combatReactionTiming(elapsedMs,assisted=false){
 if(assisted)return {elapsedMs:null,bonus:4,label:'مساعدة مفعّلة'};
 if(elapsedMs===null||elapsedMs===undefined)return {elapsedMs:null,bonus:0,label:'غير محسوبة'};
 const value=Number(elapsedMs);
 if(!Number.isFinite(value)||value<0)return {elapsedMs:null,bonus:0,label:'غير محسوبة'};
 const elapsed=Math.min(60000,Math.round(value));
 const quick=elapsed<=1800;
 return {elapsedMs:elapsed,bonus:quick?4:0,label:quick?'سريعة':'هادئة'};
}
function combatReactionEffect(opponentStyle,reactionId){
 const reaction=combatReactionCatalog.find(item=>item.id===reactionId);
 if(!reaction)return null;
 const best={'قوة':'guard','سرعة':'dodge','دفاع':'counter','تقنية':'counter'};
 const neutral={'قوة':'dodge','سرعة':'counter','دفاع':'dodge','تقنية':'guard'};
 const quality=reactionId===best[opponentStyle]?'ممتاز':reactionId===neutral[opponentStyle]?'مقبول':'مكشوف';
 return {
  id:reaction.id,title:reaction.title,quality,energyCost:reaction.energyCost,
  playerBonus:quality==='ممتاز'?8:quality==='مقبول'?3:-5,
  opponentBonus:quality==='ممتاز'?-7:quality==='مقبول'?-2:5
 };
}
function combatRoundImpact(opponentRating,defense,reactionQuality,timingBonus=0){
 const rating=clamp(Number(opponentRating)||0),defensive=clamp(Number(defense)||0);
 const baseDamage=clamp(Math.round(1+rating/32+(100-defensive)/50),1,7);
 const qualityAdjustment=reactionQuality==='ممتاز'?-2:reactionQuality==='مقبول'?-1:2;
 const timingAdjustment=Number(timingBonus)>0?-1:0;
 const healthDamage=clamp(baseDamage+qualityAdjustment+timingAdjustment,0,9);
 const injuryGain=healthDamage>=7?2:healthDamage>=5?1:0;
 return {baseDamage,healthDamage,injuryGain};
}
const combatMoveMasteryThresholds=[0,3,8,15,25];
const combatMoveMasteryLabels=['جديدة','ناشئة','متمرّسة','متقنة','خبيرة'];
function normalizeCombatMoveMastery(raw,knownMoves){
 const source=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
 const known=new Set(Array.isArray(knownMoves)?knownMoves:[]);
 const normalized={};
 combatMoveCatalog.forEach(move=>{
  if(!known.has(move.id))return;
  const uses=Number(source[move.id]);
  if(Number.isFinite(uses)&&uses>0)normalized[move.id]=Math.max(0,Math.min(100,Math.floor(uses)));
 });
 return normalized;
}
function combatMoveMasteryLevel(uses){
 const count=Math.max(0,Math.min(100,Math.floor(Number(uses)||0)));
 let level=0;
 for(let index=1;index<combatMoveMasteryThresholds.length;index++){if(count>=combatMoveMasteryThresholds[index])level=index;}
 return level;
}
function combatMoveMasteryLabel(uses){return combatMoveMasteryLabels[combatMoveMasteryLevel(uses)];}
function combatMoveMasteryBonus(uses){return combatMoveMasteryLevel(uses)*2;}
function normalizePendingCombatBout(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return null;
 const mode=raw.mode==='league'?'league':raw.mode==='street'?'street':null;
 const source=raw.opponent&&typeof raw.opponent==='object'&&!Array.isArray(raw.opponent)?raw.opponent:{};
 const styles=['قوة','سرعة','دفاع','تقنية'];
 const name=typeof source.name==='string'?source.name.trim().slice(0,48):'';
 if(!mode||!name||!styles.includes(source.style)||(mode==='league'&&raw.feePaid!==true))return null;
 const finite=(value,fallback,min,max)=>{
  const parsed=Number(value);
  return Math.max(min,Math.min(max,Number.isFinite(parsed)?parsed:fallback));
 };
 const history=(Array.isArray(raw.roundHistory)?raw.roundHistory:[]).slice(0,2).map((item,index)=>{
  if(!item||typeof item!=='object'||Array.isArray(item))return null;
  return {
   round:index+1,
   actionId:typeof item.actionId==='string'?item.actionId.slice(0,48):'',
   actionTitle:typeof item.actionTitle==='string'?item.actionTitle.slice(0,48):'حركة قتالية',
   style:styles.includes(item.style)?item.style:'تقنية',
   opponentStyle:styles.includes(item.opponentStyle)?item.opponentStyle:source.style,
   playerScore:finite(item.playerScore,0,-200,200),
   opponentScore:finite(item.opponentScore,0,-200,200),
   masteryLevel:Math.round(finite(item.masteryLevel,0,0,4)),
   masteryBonus:Math.round(finite(item.masteryBonus,0,0,8)),
   masteryUses:Math.round(finite(item.masteryUses,0,0,100)),
   energyBefore:item.energyBefore==null?null:Math.round(finite(item.energyBefore,0,0,100)),
   energyCost:item.energyCost==null?null:Math.round(finite(item.energyCost,0,0,40)),
   energyRecovery:item.energyRecovery==null?null:Math.round(finite(item.energyRecovery,0,0,20)),
   energyAfter:item.energyAfter==null?null:Math.round(finite(item.energyAfter,0,0,100)),
   intentStyle:styles.includes(item.intentStyle)?item.intentStyle:(styles.includes(item.opponentStyle)?item.opponentStyle:source.style),
   intentTitle:typeof item.intentTitle==='string'?item.intentTitle.slice(0,48):'هجمة متوقعة',
   reactionId:['guard','dodge','counter'].includes(item.reactionId)?item.reactionId:'',
   reactionTitle:typeof item.reactionTitle==='string'?item.reactionTitle.slice(0,48):'',
   reactionQuality:['ممتاز','مقبول','مكشوف'].includes(item.reactionQuality)?item.reactionQuality:'',
   reactionPlayerBonus:Math.round(finite(item.reactionPlayerBonus,0,-10,10)),
   reactionOpponentBonus:Math.round(finite(item.reactionOpponentBonus,0,-10,10)),
   reactionCost:item.reactionCost==null?null:Math.round(finite(item.reactionCost,0,0,8)),
   reactionTimeMs:item.reactionTimeMs==null||!Number.isFinite(Number(item.reactionTimeMs))?null:Math.round(finite(item.reactionTimeMs,0,0,60000)),
   reactionTimingBonus:Math.round(finite(item.reactionTimingBonus,0,0,4)),
   reactionTimingAssist:item.reactionTimingAssist===true,
   healthBefore:item.healthBefore==null?null:Math.round(finite(item.healthBefore,0,0,100)),
   healthDamage:Math.round(finite(item.healthDamage,0,0,9)),
   healthAfter:item.healthAfter==null?null:Math.round(finite(item.healthAfter,0,0,100)),
   injuryBefore:item.injuryBefore==null?null:Math.round(finite(item.injuryBefore,0,0,100)),
   injuryGain:Math.round(finite(item.injuryGain,0,0,2)),
   injuryAfter:item.injuryAfter==null?null:Math.round(finite(item.injuryAfter,0,0,100))
  };
 }).filter(Boolean);
 const last=history.length?history[history.length-1]:null;
 return {
  mode,
  opponent:{
   name,
   style:source.style,
   weakTo:styles.includes(source.weakTo)?source.weakTo:'سرعة',
   emoji:typeof source.emoji==='string'?source.emoji.slice(0,8):'🥊',
   rating:finite(source.rating,35,0,100),
   fee:mode==='league'?1500:0
  },
  round:Math.max(1,Math.min(3,history.length+1)),
  playerScore:finite(raw.playerScore,0,-600,600),
  opponentScore:finite(raw.opponentScore,0,-600,600),
  roundHistory:history,
  lastStyle:styles.includes(raw.lastStyle)?raw.lastStyle:(last?last.style:''),
  lastMoveId:typeof raw.lastMoveId==='string'?raw.lastMoveId.slice(0,48):(last?last.actionId:''),
  startedAge:finite(raw.startedAge,18,0,120),
  feePaid:mode==='league',
  communityFighterId:typeof raw.communityFighterId==='string'&&/^[a-z0-9-]{1,40}$/.test(raw.communityFighterId)?raw.communityFighterId:null,
  reactionId:['guard','dodge','counter'].includes(raw.reactionId)?raw.reactionId:'',
  reactionWindowStartedAt:raw.reactionWindowStartedAt==null||!Number.isFinite(Number(raw.reactionWindowStartedAt))?null:Math.round(finite(raw.reactionWindowStartedAt,0,0,9007199254740991)),
  reactionTimeMs:raw.reactionTimeMs==null||!Number.isFinite(Number(raw.reactionTimeMs))?null:Math.round(finite(raw.reactionTimeMs,0,0,60000)),
  reactionTimingAssist:raw.reactionTimingAssist===true
 };
}
function combatDifficultyLabel(rating){
 const score=clamp(Number(rating)||0);
 if(score<35)return 'سهل';
 if(score<55)return 'متوسط';
 if(score<70)return 'صعب';
 return 'نخبة';
}
function createCombatCareer(){
 return {rank:0,leaguePoints:0,streetCred:0,streetWins:0,leagueWins:0,wins:0,losses:0,knockouts:0,draws:0,
  technique:32+Math.floor(Math.random()*8),power:28+Math.floor(Math.random()*8),speed:31+Math.floor(Math.random()*8),defense:28+Math.floor(Math.random()*8),stamina:34+Math.floor(Math.random()*8),energy:100,
  injury:0,injuryYears:0,restUsedYear:-1,coach:null,movesKnown:['quick-jab','high-guard'],moveMastery:{},selectedMove:'quick-jab',champion:false,bouts:[],pendingBout:null,community:normalizeCombatCommunity([]),startedAge:state?state.age:18};
}
function ensureCombatCareer(){
 if(!state)return null;
 let c=state.combatCareer;
 if(!c||typeof c!=='object')c=state.combatCareer=createCombatCareer();
 const defaults={rank:0,leaguePoints:0,streetCred:0,streetWins:0,leagueWins:0,wins:0,losses:0,knockouts:0,draws:0,technique:25,power:25,speed:25,defense:25,stamina:30,energy:100,injury:0,injuryYears:0,restUsedYear:-1,coach:null,movesKnown:['quick-jab','high-guard'],moveMastery:{},selectedMove:'quick-jab',champion:false,bouts:[],pendingBout:null,community:[]};
 Object.keys(defaults).forEach(k=>{if(c[k]===undefined||c[k]===null)c[k]=defaults[k];});
 if(!Array.isArray(c.movesKnown))c.movesKnown=['quick-jab','high-guard'];
 if(!c.movesKnown.length)c.movesKnown=['quick-jab','high-guard'];
 c.moveMastery=normalizeCombatMoveMastery(c.moveMastery,c.movesKnown);
 if(!Array.isArray(c.bouts))c.bouts=[];
 c.community=normalizeCombatCommunity(c.community);
 c.pendingBout=normalizePendingCombatBout(c.pendingBout);
 c.rank=clamp(c.rank,0,4);c.streetCred=Math.max(0,Number(c.streetCred)||0);c.leaguePoints=Math.max(0,Number(c.leaguePoints)||0);
 c.energy=clamp(c.energy);c.injury=clamp(c.injury);c.injuryYears=Math.max(0,Number(c.injuryYears)||0);
 return c;
}
function combatRankName(c){
 if(c.champion)return 'بطل العالم';
 return ['مبتدئ','هاوٍ','محترف','منافس على اللقب','بطل الدوري'][clamp(c.rank,0,4)];
}

// Events are compact data records; each choice has effects, an optional cost, and optional risk outcome.
const E=(range,icon,title,text,choices)=>({range,icon,title,text,choices});
const C=(label,desc,effects,result,extra={})=>Object.assign({label,desc,effects,result},extra);
const events=[
E([6,12],'📚','امتحان مفاجئ','المدرس دخل وقال إن فيه امتحان قصير. ذاكرتك هتنقذك ولا هتجرب حظك؟',[
C('أحل بهدوء','اعتمد على اللي فاكره',{smart:2,happiness:2},'طلعت فاكر أكتر مما توقعت، والمدرس هز راسه بإعجاب.'),
C('أبص على ورقة صاحبي','مجازفة ممكن تتكشف',{happiness:1},'عدّت على خير، لكنك قررت تذاكر أحسن.',{risk:.25,fail:{happiness:-8,smart:-2},failText:'المدرس لاحظ الحركة وخصم درجات. الدرس وصل.'}),
C('أطلب فرصة تانية','صراحة ومسؤولية',{smart:1},'المدرس شرح لك المطلوب وقررت تستعد للامتحان الجاي.')
]),
E([6,13],'🧃','مقلب في الفسحة','أصحابك عايزين يخبّوا شنطة المدرس في المقلب السنوي. هتشارك؟',[
C('أشاركهم','الضحك مضمون والمخاطرة موجودة',{happiness:6},'ضحكتوا لحد ما جرس الحصة رن.',{risk:.22,fail:{happiness:-7},failText:'المقلب اتكشف واتطلب منكم تعتذروا.'}),
C('أقترح مقلب ألطف','مرح من غير زعل',{happiness:4,smart:1},'عملتوا مقلب بسيط خلّى الكل يضحك.'),
C('أبعد عن الموضوع','اختار راحة البال',{smart:1},'كمّلت يومك من غير وجع دماغ.')
]),
E([8,15],'⚽','ماتش الشارع','العيال ناقصهم لاعب عشان الماتش يكمل، وفيه تحدي على عصير قصب.',[
C('أنزل ألعب','حركة ومرح',{health:4,happiness:5},'جريت كتير وخسرتوا بفارق جول، بس اليوم كان ممتاز.'),
C('أقود الفريق','نظّم الفريق',{happiness:3,smart:2},'وزعت الأدوار وعملتوا عودة قوية في النتيجة.'),
C('أشجّع من بعيد','المعلّق الرسمي',{happiness:2},'شجعت بصوت عالي لحد ما بقيت جزء من العرض.')
]),
E([10,16],'📱','موبايل جديد','صحابك بيتكلموا عن موبايلاتهم الجديدة وإنت حاسس إن جهازك قديم.',[
C('أركز في اللي عندي','مش كل حاجة لازم تتغير',{happiness:3,smart:2},'افتكرت إن القيمة مش في الموبايل لوحده.'),
C('أوفر من مصروفي','خطة ادخار صغيرة',{smart:2,happiness:2},'بدأت أول خطة ادخار صغيرة في حياتك.'),
C('أطلب جهاز جديد','ناقش الموضوع بهدوء',{happiness:2},'أهلك قالوا إنكم هتتكلموا في الموضوع في وقت مناسب.')
]),
E([12,18],'🧠','مسابقة المدرسة','مدرستك عاملة مسابقة معلومات عامة والجايزة شهادة وتكريم.',[
C('أدخل المسابقة','جرّب حظك ومعلوماتك',{smart:6,happiness:3},'جاوبت أسئلة كتير صح واسمك اتذكر في الإذاعة.',{risk:.18,fail:{happiness:-3},failText:'ماكسبتش المرة دي، لكن عرفت نقاط ضعفك.'}),
C('أساعد صاحبي يستعد','التعلم بالمشاركة',{happiness:4,smart:2},'المراجعة مع صاحبك ثبتت المعلومات عندك كمان.')
]),
E([13,19],'💬','رسالة محرجة','رسالة كنت باعتها لصاحبك اتبعتت بالغلط في جروب الفصل.',[
C('أوضح إنها بالغلط','الصراحة أسرع طريق',{smart:2,happiness:1},'وضحت الموقف بهدوء والموضوع خلص أسرع مما توقعت.'),
C('أقلبها هزار','خلّي الموقف يعدي',{happiness:3},'ضحكتم على الموقف، وإن كان وشك احمر شوية.'),
C('أختفي يومين','تجنب المواجهة',{happiness:-2},'التجاهل زوّد التوتر، وبعدها رجعت تتكلم عادي.')
]),
E([14,20],'🎮','بطولة ألعاب','في بطولة ألعاب إلكترونية بجايزة رمزية، وأصحابك بيشجعوك تدخل.',[
C('أدخل البطولة','جرّب مهارتك',{happiness:5},'لعبت كويس ووصلت لمرحلة متقدمة.',{risk:.2,fail:{happiness:-2},failText:'خرجت بدري لكن استمتعت بالتجربة.'}),
C('أنظّم فريق','القيادة برضه مهارة',{smart:3,happiness:4},'التنظيم والتواصل كانا نقطة قوتك.'),
C('أوازن وقتي','اللعب مش كل اليوم',{health:2,smart:1},'لعبت شوية وخلّيت باقي اليوم للمذاكرة.')
]),
E([15,23],'🧭','اختيار المسار','المدرسة بتطلب منك تفكر في التخصص اللي يناسبك.',[
C('أركز على الدراسة','حط هدف واضح',{smart:5,happiness:-1},'بدأت تشتغل على هدف واضح، خطوة بخطوة.'),
C('أجرب نشاط جديد','اكتشف نفسك',{happiness:4,looks:1},'اكتشفت جانب جديد من شخصيتك.'),
C('أسأل حد أكبر مني','استفد من الخبرة',{smart:3,happiness:2},'نصيحة بسيطة فتحت لك زاوية مختلفة.')
]),
E([16,25],'🚲','مشوار مغامرة','صاحبك اقترح تروحوا مكان بعيد شوية من غير تخطيط كفاية.',[
C('أخطط للمشوار','السلامة قبل الحماس',{smart:3,happiness:3},'قسمتوا الطريق والوقت، والرحلة عدت بسهولة.'),
C('أروح على طول','عفوية مع شوية مخاطرة',{happiness:5},'كان يوم مليان حكايات جديدة.',{risk:.18,fail:{health:-5,happiness:-4},failText:'اتعطلتوا في الطريق ورجعتوا مرهقين.'}),
C('أقترح مكان قريب','فسحة أبسط',{happiness:3,health:2},'قضيتوا وقت لطيف من غير مشوار طويل.')
]),
E([18,45],'🧑‍💼','أول فرصة شغل','حد يعرفك عرض عليك تجربة شغل بسيطة، لكنك لسه بتتعلم.',[
C('أقبل وأتعلم','الخبرة بتبدأ بخطوة',{smart:3,happiness:2},'اكتسبت خبرة مفيدة واتعرفت على ناس جديدة.'),
C('أطلب تفاصيل الأول','افهم المطلوب والمقابل',{smart:3},'سألت عن المطلوب والوقت والمقابل قبل ما توافق.'),
C('أرفض باحترام','اختار اللي يناسبك',{happiness:1},'اعتذرت بأدب واحتفظت بالعلاقة الطيبة.')
]),
E([18,60],'🚌','موقف في المواصلات','المواصلات زحمة، وشخص كبير في السن واقف ومش لاقي مكان.',[
C('أقوم وأسيب مكاني','لفتة بسيطة',{happiness:4,looks:1},'شكرك بابتسامة، وحسيت إنك عملت حاجة صغيرة مهمة.'),
C('أساعده يلاقي مكان','ساعده بهدوء',{happiness:3,smart:1},'لفت نظر الركاب وساعدت الشخص يقعد.'),
C('أكمل طريقي','الموقف عدى',{happiness:-1},'عدّى الموقف، لكن فضلت تفكر فيه شوية.')
]),
E([18,60],'💼','مقابلة عمل','دخلت مقابلة شغل. السؤال الأخير: ليه نختارك إنت؟',[
C('أركز على مهاراتي','إجابة واضحة',{smart:4,happiness:2},'إجابتك كانت واضحة ومقنعة، واستنيت الرد بثقة.'),
C('أحكي عن موقف صعب','مثال حقيقي',{smart:3,happiness:3},'مثال حقيقي خلّى إجابتك مختلفة.'),
C('أبالغ في خبرتي','مجازفة في الكلام',{happiness:1},'عدّت المقابلة، لكنك قررت تستعد أفضل.',{risk:.3,fail:{happiness:-5,smart:-2},failText:'اتسألت في تفاصيل ملقتش لها إجابة، وده أثر على فرصتك.'})
]),
E([20,60],'💸','فرصة استثمار','صديق بيقترح تحط فلوس في مشروع صغير. الأرقام مش مضمونة.',[
C('أدرس التفاصيل','افهم المخاطر الأول',{smart:4},'راجعت الأرقام وقررت ما تستعجلش.'),
C('أستثمر مبلغ بسيط','مجازفة محسوبة',{smart:1},'المشروع حقق مكسب بسيط.',{cost:5000,risk:.4,win:{bank:9000,happiness:4},fail:{bank:-5000,happiness:-3},failText:'المشروع خسر، لكنك ما خاطرتش بكل فلوسك.'}),
C('أعتذر','احتفظ بسيولتك',{happiness:1},'حافظت على سيولتك وارتحت من المخاطرة.')
]),
E([21,60],'❤️','شخص لفت انتباهك','قابلت شخص عنده اهتمامات شبه اهتماماتك. تبدأ الكلام؟',[
C('أبدأ محادثة لطيفة','اهتمامات مشتركة',{happiness:5},'اتكلمتوا عن اهتمامات مشتركة، ويمكن تكون بداية صداقة.'),
C('أطلب نتكلم مرة تانية','من غير استعجال',{happiness:3,looks:1},'اتبادلتوا وسيلة تواصل واتفقتم تتكلموا لاحقًا.'),
C('أسيب الأمور لوقتها','كل حاجة بوقتها',{happiness:1},'قررت ما تستعجلش، والفرص لسه موجودة.')
]),
E([22,60],'🏢','خلاف في الشغل','زميل نسب لنفسه جزء من مجهودك في اجتماع الفريق.',[
C('أعرض شغلي بالأدلة','احتراف من غير انفعال',{smart:3,happiness:1},'عرضت مساهمتك باحتراف واتضح دورك.'),
C('أتكلم معاه على انفراد','حل هادي',{happiness:2,smart:1},'وصلتوا لتفاهم من غير ما تكبر المشكلة.'),
C('أرد بعصبية','التوتر مش حل',{happiness:-4},'خرجت من الموقف من غير تصعيد.',{risk:.3,fail:{happiness:-5},failText:'النقاش سخن واتحول لخلاف أثّر على جو الفريق.'})
]),
E([20,58],'🧰','فرصة تدريب','ظهر تدريب مهني ممكن يفتح باب شغل أفضل، لكنه هيحتاج وقت ومجهود.',[
C('أستثمر في نفسي','تعلم مهارة جديدة',{smart:7,happiness:2},'التدريب زوّد مهاراتك وخلّاك أوثق في نفسك.',{cost:2500}),
C('أتعلم مجانًا أونلاين','ابدأ بالمتاح',{smart:4},'بدأت بمصادر مجانية ونظّمت وقتك.'),
C('أأجل القرار','راجع أولوياتك',{happiness:1},'قررت تراجع أولوياتك قبل الالتزام.')
]),
E([24,60],'🚗','خَبطة بسيطة','عربية خبطت إكصدام عربيتك في الزحمة. الضرر بسيط لكن محتاج تصليح.',[
C('أحل الموضوع بهدوء','وثّق الضرر',{smart:2,happiness:1},'وثّقت الضرر واتفقتم على حل واضح.'),
C('أصلّح على حسابي','وفّر وقتك',{happiness:1},'دفعت تكلفة التصليح ووفرت وقتك.',{cost:3500}),
C('أدخل في خناقة','حافظ على أعصابك',{happiness:-4,health:-1},'رجعت خطوة وقررت ما تضيعش يومك في خناقة.')
]),
E([25,60],'🏡','فكرة مشروع عائلي','العيلة بتفكر تبدأ مشروع صغير، ومحتاجين رأيك ومشاركة محدودة.',[
C('أشارك بخطة واضحة','اتفاق على الأدوار',{smart:3,happiness:4},'تقسيم الأدوار ساعد المشروع يحقق مكسب.',{cost:4000,risk:.22,win:{bank:6000},fail:{bank:-2000,happiness:-2},failText:'المشروع واجه تكاليف زيادة واتعلمتوا أهمية الاحتياطي.'}),
C('أساعد بالخبرة','شارك من غير مخاطرة مالية',{smart:3,happiness:2},'ساعدتهم في التخطيط من غير مخاطرة مالية.'),
C('أعتذر عن المشاركة','وضّح حدودك',{happiness:1},'وضحت حدودك المالية وحافظت على الود.')
]),
E([25,60],'🩺','إشارة من جسمك','بقالك فترة نومك قليل وطاقتك مش زي الأول.',[
C('أنظّم النوم','ابدأ بعادة صغيرة',{health:7,happiness:3},'بدأت تنام أحسن وتخفف السهر.'),
C('أكشف عند طبيب','اطمن على نفسك',{health:10,smart:1},'اطمنت على نفسك وخدت نصائح مناسبة.',{cost:1200}),
C('أكمل بنفس النظام','التعب ممكن يزيد',{health:-5,happiness:-2},'التعب زاد، وبقيت محتاج تراجع عاداتك.')
]),
E([26,60],'🎁','مناسبة عائلية','في مناسبة عائلية، والكل مستنيك حتى لو جدولك مزدحم.',[
C('أروح وأقضي وقت معاهم','اللمة لها قيمة',{happiness:5},'اللمة فكرتك إن الوقت مع الناس الغاليين ليه قيمة.'),
C('أساعد في التجهيز','شارك في التحضير',{happiness:4,looks:1},'ساعدت في التنظيم والناس قدّرت وجودك.'),
C('أعتذر بسبب الشغل','وعد بالتعويض',{happiness:-2},'اعتذرت ووعدت تعوضهم في أقرب فرصة.')
]),
E([28,60],'📈','طلب ترقية','بقالك فترة بتشتغل كويس، وفيه فرصة تتكلم مع مديرك عن مسارك.',[
C('أعرض إنجازاتي','حضّر أمثلة واقعية',{smart:3},'مديرك وافق على تحسين دخلك.',{risk:.25,win:{happiness:4,bank:12000},fail:{happiness:-1},failText:'قالك محتاج تثبت نتائج إضافية قبل الترقية.'}),
C('أطلب خطة تطوير','اعرف المطلوب منك',{smart:4,happiness:1},'طلعت بخطة واضحة لمهاراتك المطلوبة.'),
C('أستنى شوية','اجمع نتائج أكثر',{happiness:1},'قررت تجمع نتائج أكتر قبل النقاش.')
]),
E([30,60],'🧾','فاتورة غير متوقعة','جالك إشعار بمصاريف صيانة أو إصلاح ماكنتش حاسب حسابها.',[
C('أدفع وأراجع الميزانية','سجّل مصاريفك',{smart:2,happiness:-1},'دفعت الفاتورة وبدأت تعمل حساب للطوارئ.',{cost:3000}),
C('أبحث عن بديل أرخص','قارن الأسعار',{smart:3},'قارنت الأسعار ووفرت جزء من المبلغ.'),
C('أأجل الدفع','التأجيل مش دايمًا أحسن',{happiness:1},'أجلت الدفع أيام قليلة.',{risk:.35,fail:{bank:-5000,happiness:-4},failText:'المصاريف زادت بسبب التأخير.'})
]),
E([30,60],'🌱','عادة جديدة','قررت تجرب عادة بسيطة لمدة شهر لتحسّن يومك.',[
C('مشي يومي','حركة بسيطة',{health:5,happiness:3},'المشي بقى فسحة صغيرة بتفصل بيها من ضغط اليوم.'),
C('قراءة قبل النوم','معرفة كل يوم',{smart:4,happiness:2},'قرأت صفحات قليلة بانتظام، ومع الوقت زادت معرفتك.'),
C('تقليل المصاريف','راجع الاشتراكات',{bank:2500,smart:2},'راجعت الاشتراكات والمشتريات ووفرت مبلغ محترم.')
]),
E([35,60],'👨‍👩‍👧','وقت مع العيلة','أسبوعك كان مزدحم، وأهلك بيقولوا إنهم محتاجين تقعدوا سوا.',[
C('أخصص يوم للعيلة','اعمل وقت ليهم',{happiness:7},'قضيتوا يوم بسيط مليان حكايات وذكريات.'),
C('أرتب مكالمة طويلة','حتى المكالمة تفرق',{happiness:4},'حتى المكالمة الطويلة قرّبت المسافات.'),
C('أأجلها','الوقت بيعدي بسرعة',{happiness:-3},'الأسبوع خلص بسرعة ووعدت نفسك ما تكررهاش.')
]),
E([35,60],'🏦','قرار مالي','عندك مبلغ مدخر. هل تزود الأمان المالي ولا تكافئ نفسك؟',[
C('أحط جزء للطوارئ','الأمان المالي مهم',{smart:4,happiness:1},'خصصت احتياطي للطوارئ وخفّ قلقك من المفاجآت.'),
C('أشتري حاجة محتاجها','مكافأة بميزانية',{happiness:5},'اشتريت حاجة كنت محتاجها من غير ما تكسر الميزانية.',{cost:2500}),
C('أراجع كل التزاماتي','شوف الصورة كاملة',{smart:5},'كتبت دخلك ومصاريفك وبقيت شايف الصورة بوضوح.')
]),
E([40,65],'🧑‍💻','تغيير مهني','بتفكر تغيّر مجالك، لكن البداية من جديد مش سهلة.',[
C('أتعلم جنب شغلي','خطوة من غير استعجال',{smart:5,happiness:2},'بدأت خطوة صغيرة من غير ما تضحي باستقرارك.'),
C('أجرب عمل حر','دخل محتمل ومخاطرة',{happiness:3},'جالك عميل جديد وبدأت توسّع شغلك.',{risk:.25,win:{bank:14000,smart:2},fail:{bank:-2000,happiness:-3},failText:'المشروع ما جابش عائد كفاية، فراجعت خطتك.'}),
C('أستشير خبير','استفد من التجربة',{smart:3,happiness:1},'استفدت من خبرة شخص مر بالتجربة.')
]),
E([45,70],'🧳','إجازة مستحقة','قدامك فرصة تاخد إجازة وتغيّر جو بعد ضغط طويل.',[
C('أسافر بميزانية محددة','راحة وتغيير جو',{happiness:9,health:4},'رجعت مرتاح ومعاك ذكريات جديدة.',{cost:6000}),
C('أعمل يومين في بلدي','إجازة بسيطة',{happiness:6,health:3},'غيّرت روتينك من غير ما تصرف كتير.',{cost:1800}),
C('أأجل الإجازة','حافظ على الميزانية',{bank:1000,happiness:-2},'وفرت فلوس، لكن قررت تحدد موعد راحة حقيقي.')
]),
E([50,75],'🪴','هواية قديمة','افتكرت هواية كنت بتحبها زمان وبطلت تمارسها بسبب الانشغال.',[
C('أرجع لها','خصص وقت صغير',{happiness:6,health:2},'اكتشفت إن المتعة القديمة لسه موجودة.'),
C('أعلمها لحد أصغر','شارك خبرتك',{happiness:5,smart:2},'شاركت خبرتك مع شخص متحمس يتعلم.'),
C('أجرب هواية جديدة','فضول صحي',{happiness:4,smart:2},'بدأت صفحة ممتعة ومختلفة.')
]),
E([55,80],'🧾','ترتيب المستقبل','بتفكر في التقاعد والالتزامات اللي عايز ترتبها بدري.',[
C('أراجع المدخرات','اعرف احتياجاتك',{smart:5,happiness:1},'عرفت إيه اللي محتاج تظبطه قبل أي تغيير.'),
C('أخطط لدخل إضافي','ابحث عن فرصة مناسبة',{smart:3},'لقيت فرصة دخل مناسبة لخبرتك.',{risk:.2,win:{bank:9000},fail:{happiness:-2},failText:'البحث محتاج وقت أطول، وده طبيعي.'}),
C('أقضي وقت مع الغاليين','العلاقات جزء من المستقبل',{happiness:5},'افتكرت إن التخطيط للمستقبل يشمل الوقت والعلاقات.')
]),
E([60,95],'🌅','بداية مرحلة جديدة','سنين الشغل عدت، وبدأت تفكر إزاي تستمتع بوقتك بشكل مختلف.',[
C('أشارك خبرتي','افد الجيل الجديد',{happiness:5,smart:3},'نصائحك فادت ناس أصغر منك وحسستك بقيمة خبرتك.'),
C('أهتم بصحتي','حركة وراحة',{health:5,happiness:3},'نظّمت يومك وخصصت وقتًا للحركة والراحة.'),
C('أتعلم حاجة جديدة','العمر مش عائق',{smart:4,happiness:3},'اكتشفت إن التعلم مش مرتبط بعمر معين.')
]),
E([62,100],'👴','صديق قديم','قابلت صديق قديم بعد سنين طويلة. كل واحد فيكم عنده حكايات كتير.',[
C('نقعد ونتكلم','ذكريات مشتركة',{happiness:7},'رجعتوا لذكريات قديمة وضحكتوا من القلب.'),
C('نتبادل أرقامنا','خليكم على تواصل',{happiness:4},'وعدتوا تفضلوا على تواصل المرة دي.'),
C('نسلّم ونكمل','لحظة لطيفة',{happiness:1},'اتمنيتوا لبعض الصحة وواصلتوا اليوم.')
]),
E([65,100],'🌳','إرثك المعنوي','حد من الجيل الأصغر سألك: إيه أهم حاجة اتعلمتها في حياتك؟',[
C('أحكي عن الصبر','خبرة السنين',{happiness:4,smart:2},'حكيت عن أوقات صعبة علمتك قيمة الاستمرار.'),
C('أحكي عن الناس','الذكريات بتفضل',{happiness:6},'قلت إن العلاقات واللحظات الحلوة بتفضل في الذاكرة.'),
C('أقول لسه بتعلم','التواضع مهم',{smart:3,happiness:3},'ضحكت وقلت إن الحياة مدرسة ملهاش آخر.')
]),
E([8,18],'🐈','قطة محتاجة مساعدة','لقيت قطة صغيرة في الشارع شكلها تايهة وبتدور على أكل.',[
C('أطلب مساعدة شخص كبير','ساعدها بأمان',{happiness:4,smart:2},'وصلت لشخص يقدر يساعدها بأمان.'),
C('أوفر لها أكل ومياه','لفتة رحيمة',{happiness:5},'وفرت لها أكل ومياه وفضلت تراقبها من بعيد.'),
C('أكمل طريقي','الموقف عدى',{happiness:-1},'كملت طريقك، لكن الموقف فضّل في بالك.')
]),
E([18,55],'📦','عرض شراء مغري','إعلان عن حاجة بسعر مغري جدًا، لكن العرض بينتهي النهارده.',[
C('أراجع السعر والاحتياج','ماتستعجلش',{smart:4},'اكتشفت إن الاستعجال مش دايمًا قرار صح.'),
C('أشتريها فورًا','مكافأة سريعة',{happiness:3},'الشراء طلع مناسب وكنت محتاج الحاجة فعلًا.',{cost:4500,risk:.22,fail:{bank:-1000,happiness:-4},failText:'طلع فيه عيب أو تكلفة إضافية ماكنتش واضحة.'}),
C('أسيب العرض','وفّر لاحتياج أهم',{bank:500,smart:1},'وفرت فلوسك لاحتياج أهم.')
]),
E([20,65],'🤝','حد محتاج مساعدتك','شخص قريب منك بيمر بظرف صعب وطلب منك تسمعه شوية.',[
C('أسمع من غير أحكام','اهتمامك يفرق',{happiness:5},'حس إن فيه حد جنبه وشكرك على وقتك.'),
C('أساعد بحل عملي','قسم المشكلة لخطوات',{smart:2,happiness:4},'ساعدته يقسم المشكلة لخطوات ممكنة.'),
C('أعتذر عن الوقت','وضّح ظروفك',{happiness:-1},'وضحت إنك مشغول ووعدته ترجع له لما تقدر.')
]),
E([30,70],'🧩','تحدي ذهني','صديق رشح لك لعبة تفكير أو لغز صعب شوية.',[
C('أحل اللغز','جرّب تاني',{smart:4,happiness:2},'وصلت للحل بعد محاولات واتعلمت طريقة جديدة.'),
C('نتعاون سوا','فريق أفضل',{smart:3,happiness:4},'التعاون خلّى التحدي أمتع.')
]),
E([18,60],'🧑‍🍳','عزومة على قد الإيد','أصحابك قرروا تتقابلوا وكل واحد يجيب حاجة بسيطة.',[
C('أشارك بحاجة بيتية','توفير ولمة',{happiness:4,smart:1},'قضيتوا وقت حلو من غير تكلفة كبيرة.'),
C('أطلب أكل جاهز','وفّر وقتك',{happiness:3},'الأكل وصل متأخر شوية، لكن القعدة كانت ممتعة.',{cost:1200}),
C('أنظم القعدة','لمّ الناس مع بعض',{happiness:5},'أنت اللي جمعت الناس، والكل استمتع بالوقت.')
]),
E([18,60],'🧾','ميزانية الشهر','لاحظت إن مصاريفك أعلى من المعتاد ومحتاج تراجعها.',[
C('أكتب المصاريف','راقب التفاصيل',{smart:4},'اكتشفت مصاريف صغيرة كانت بتجمع مبلغ كبير.'),
C('أوقف مشتريات غير ضرورية','قرار عملي',{bank:2500,happiness:1},'وفرت مبلغ يساعدك في آخر الشهر.'),
C('أتجاهل الموضوع','بعدين أشوف',{happiness:1},'عدّى الشهر، لكن الضغط المالي فضل موجود.',{risk:.25,fail:{bank:-3000,happiness:-3},failText:'ظهرت مصاريف إضافية وخليت الميزانية أضيق.'})
]),
E([40,80],'🌿','جيران جداد','أسرة جديدة انتقلت للعمارة أو الشارع وبتحاول تتعرف على الجيران.',[
C('أرحب بيهم','ابدأ بعلاقة طيبة',{happiness:4},'رحبت بيهم واتعرفت على ناس جديدة.'),
C('أعرض المساعدة','تعاون الجيران',{happiness:5},'مساعدتك البسيطة خلت الانطباع الأول لطيف.'),
C('أسيب مساحة','احترام الخصوصية',{happiness:1},'سيبت لهم وقتهم، ويمكن تتعرفوا بعدين.')
]),
E([18,60],'📈','عرض جانبي','جالك شغل جانبي محتاج وقت إضافي، لكن ممكن يحسن دخلك.',[
C('أقبل بحدود واضحة','وازن وقتك',{bank:6000,happiness:-1},'خلصت شغل إضافي وكسبت دخلًا جديدًا.'),
C('أرفض عشان صحتي','الراحة أولوية',{health:3,happiness:2},'حافظت على وقتك وطاقتك.'),
C('أتفاوض على المقابل','اعرف قيمة وقتك',{smart:2},'اتفاوضت على مقابل أفضل وشروط أوضح.',{risk:.2,win:{bank:9000},fail:{happiness:-1},failText:'المقابل ما اتغيرش، فقررت تراجع العرض.'})
])
];
events.push(
 E([1,5],'🧸','أول كلمة','بدأت تقول كلمات بسيطة، والعيلة بتحاول تفهم كل صوت جديد.',[
  C('أشجع الكلام','التفاعل يطمنك',{happiness:3,smart:1},'أهلك شجعوك وكل كلمة جديدة بقت احتفال صغير.'),
  C('أقضي وقت مع العيلة','الاهتمام مهم',{happiness:4},'قضيت وقتًا دافئًا مع أهلك وبدأت تتعرف على العالم.')
 ]),
 E([10,17],'🏅','بطولة مدرسية','المدرسة بتجهّز بطولة، والمدرب شايف إن عندك فرصة تشارك.',[
  C('أتدرب بانتظام','التزام ومجهود',{health:4,happiness:4},'تدربت باستمرار وقدمت أداءً محترمًا.'),
  C('أشارك من غير استعداد','جرّب نفسك',{happiness:2},'استمتعت بالتجربة حتى لو النتيجة مش مثالية.',{risk:.25,fail:{happiness:-3},failText:'التوتر أثر على أدائك، وقررت تستعد أحسن المرة الجاية.'}),
  C('أساند الفريق','الروح الجماعية',{happiness:3,smart:1},'ساعدت زملاءك ورفعت معنويات الفريق.')
 ]),
 E([16,22],'🧭','اختيار التخصص','مطلوب منك تحدد الطريق اللي هتبدأ منه مرحلة ما بعد المدرسة.',[
  C('اختار مجال تقني','مهارات المستقبل',{smart:4,happiness:1},'بدأت تركز على المهارات الرقمية وتبحث عن فرص تعلم.'),
  C('أختار مجال إبداعي','خلّي الموهبة تكبر',{happiness:4,looks:1},'قررت تدي مساحة للإبداع وتجرب أكتر من نشاط.'),
  C('أشتغل وأتعلم','الخبرة بالتجربة',{smart:2,bank:1800},'بدأت تفكر في الجمع بين الشغل والتعلم.')
 ]),
 E([18,45],'❤️','فرصة ارتباط','شخص قريب منك بدأ يلمّح إنه مهتم بعلاقة جدية.',[
  C('نتكلم بصراحة','وضوح واحترام',{happiness:4,smart:1},'اتكلمتوا بصراحة واتفقتم تاخدوا وقتكم.'),
  C('أطلب وقت أفكر','ما تستعجلش',{happiness:1},'وضحت إنك محتاج وقت، والطرف التاني احترم قرارك.'),
  C('أرفض بلطف','كن واضحًا',{happiness:1},'رفضت باحترام وحافظت على حدودك.')
 ]),
 E([22,60],'📈','فرصة ترقية','مديرك بيدرس إعادة توزيع المسؤوليات، واسمك مطروح.',[
  C('أعرض نتائج شغلي','الأرقام تتكلم',{smart:3},'عرضت نتائجك بشكل مهني وده قوّى موقفك.',{risk:.2,win:{bank:8000,happiness:4},fail:{happiness:-1},failText:'الترقية اتأجلت لحد ما تحقق أهداف إضافية.'}),
  C('أطلب مسار واضح','اعرف المطلوب',{smart:3,happiness:1},'خرجت بخطة تطوير ومعايير واضحة.'),
  C('أرفض مسؤوليات إضافية','حافظ على التوازن',{health:2,happiness:2},'وضحت حدودك بدل ما تتحمل ضغط أكبر من قدرتك.')
 ]),
 E([22,60],'🧾','مصدر دخل جانبي','جالك عرض لمهمة قصيرة بجانب التزاماتك الأساسية.',[
  C('أقبل المهمة','وقت إضافي مقابل دخل',{bank:3500,happiness:-1},'أنهيت المهمة وحصلت على مقابل إضافي.'),
  C('أتفاوض على المقابل','اعرف قيمة وقتك',{smart:2},'طلبت تفاصيل أوضح واتفاوضت على شروط أفضل.',{risk:.2,win:{bank:6500},fail:{happiness:-1},failText:'العرض لم يتحسن فقررت تعتذر.'}),
  C('أرفض وأرتاح','الصحة مهمة',{health:3,happiness:2},'اخترت الراحة بدل ضغط إضافي.')
 ]),
 E([30,65],'🏡','تغيير السكن','فيه فرصة تنتقل لمكان أهدى، لكن الإيجار وتكاليف الانتقال هيزيدوا.',[
  C('أنتقل لمكان أفضل','راحة مقابل تكلفة',{happiness:4,health:2},'المكان الجديد حسّن راحتك اليومية.',{cost:6000}),
  C('أدور على بديل أرخص','وازن التكلفة',{smart:2},'قارنت الخيارات ووفرت مصاريف غير ضرورية.'),
  C('أستنى شوية','لا تستعجل القرار',{happiness:1},'قررت تجمع معلومات أكتر قبل ما تتحرك.')
 ]),
 E([32,70],'💸','فاتورة طبية','ظهر احتياج صحي غير متوقع، والفاتورة أعلى من المعتاد.',[
  C('أدفع وأتابع','الاهتمام بالصحة',{health:7,happiness:1},'دفعت تكلفة المتابعة وبدأت تهتم بصحتك بشكل أفضل.',{cost:3500}),
  C('أبحث عن بدائل متاحة','قارن الخيارات',{smart:2},'بحثت عن خيارات مناسبة قبل ما تقرر.'),
  C('أهمل الموضوع','تأجيل محفوف بالمخاطر',{happiness:1},'أجلت المتابعة، لكن القلق فضل موجودًا.',{risk:.35,fail:{health:-12,happiness:-5},failText:'الحالة ساءت واحتجت متابعة أكبر.'})
 ]),
 E([35,75],'👵','صحة أحد الوالدين','أحد والديك بدأ يحتاج مساعدة أكبر في بعض الأمور اليومية.',[
  C('أخصص وقتًا للمساعدة','الأسرة قبل الزحمة',{happiness:4,health:-1},'نظمت وقتك وساعدت في المسؤوليات اليومية.'),
  C('أرتب دعمًا من العيلة','تقاسم المسؤولية',{smart:2,happiness:2},'اتفقتم على توزيع المساعدة بين أفراد الأسرة.'),
  C('أستعين بخدمة متخصصة','حل عملي بتكلفة',{happiness:2},'رتبت مساعدة مناسبة وخففت الضغط على الجميع.',{cost:2500})
 ]),
 E([40,75],'🌱','إعادة تقييم الحياة','حسيت إنك محتاج تراجع أولوياتك بعد سنين من الشغل والمسؤوليات.',[
  C('أبدأ عادة صحية','خطوة صغيرة',{health:4,happiness:4},'بدأت عادة بسيطة تساعدك تستعيد توازنك.'),
  C('أتعلم حاجة جديدة','مافيش سن للتعلم',{smart:4,happiness:2},'دخلت مجالًا جديدًا ووسعت خبرتك.'),
  C('أركز على العلاقات','الوقت له قيمة',{happiness:5},'خصصت وقتًا للناس القريبين منك.')
 ]),
 E([45,85],'🏆','تقدير مهني','جهة عملك أو مجتمعك بيستعد يكرّم أصحاب الخبرة الطويلة.',[
  C('أشارك خبرتي','ساعد الجيل الجديد',{happiness:4,smart:2},'شاركت خبرتك مع ناس أصغر منك واكتسبت احترامًا.'),
  C('أستمتع بالإنجاز','لحظة تقدير',{happiness:5},'احتفلت باللي حققته وراجعت خطواتك بفخر.'),
  C('أبدأ مشروعًا شخصيًا','فصل جديد',{smart:2,happiness:2},'بدأت تخطط لمشروع يعبر عن اهتماماتك.',{cost:2000})
 ]),
 E([18,60],'🚘','فرصة سفر للعمل','جهة خارج بلدك عرضت عليك فرصة عمل أو تدريب، لكن الانتقال مش سهل.',[
  C('أدرس العرض','اسأل عن التفاصيل',{smart:3},'راجعت الراتب والسكن والتكاليف قبل اتخاذ قرار.'),
  C('أقبل المغامرة','تجربة جديدة',{happiness:3},'بدأت مرحلة مختلفة وتعلمت الاعتماد على نفسك.',{cost:7000,risk:.25,win:{bank:12000,fame:2},fail:{happiness:-4},failText:'الفرصة ما كانتش مناسبة كما توقعت، وخسرت جزءًا من تكاليف الانتقال.'}),
  C('أفضل الاستقرار','الاستقرار اختيار',{happiness:2},'قررت تكمل خطتك الحالية بدل الانتقال.')
 ]),
 E([20,70],'🏦','مراجعة مالية','لاحظت إن المصاريف زادت، ومحتاج تراجع طريقة إدارة فلوسك.',[
  C('أعمل ميزانية','خطط قبل الصرف',{smart:3,bank:1500},'عملت ميزانية وبدأت تقلل المصاريف غير الضرورية.'),
  C('أبيع حاجة مش مهمة','سيولة سريعة',{happiness:-1},'وفرت سيولة من غير ما تدخل في ديون.'),
  C('أستمر بنفس الأسلوب','التغيير مؤجل',{happiness:1},'قررت تأجل المراجعة، لكن المشكلة لسه موجودة.')
 ]),
 E([25,65],'🎤','انتشار مفاجئ','مقطع أو عمل نشرته بدأ يجذب انتباه ناس أكتر من المعتاد.',[
  C('أستفيد من الفرصة','نظم الحضور الجديد',{fame:8,reputation:3,happiness:4},'زاد الاهتمام بيك وبدأت توصلك فرص جديدة.'),
  C('أحافظ على خصوصيتي','الهدوء أهم',{happiness:2,reputation:1},'فضّلت تحافظ على خصوصيتك وتتعامل بهدوء.'),
  C('أرد بانفعال','الضجة ليها ثمن',{fame:3,reputation:-8},'الرد زوّد المشاهدات لكنه أثر على صورتك العامة.')
 ])
);
function makePerson(gender,relation,emoji,age,level){
 const job=relation==='الأب'?pick(['مدرس','محاسب','مهندس','موظف حكومي','صاحب محل','طبيب','سائق']):relation==='الأم'?pick(['مدرسة','محاسبة','مهندسة','موظفة حكومية','صاحبة محل','طبيبة','ممرضة','ربة منزل']):'طالب';
 return {id:relation+'-'+Math.random().toString(36).slice(2,8),name:pick(names[gender])+' '+pick(names.family),relation,emoji,age,job,generosity:25+Math.floor(Math.random()*76),craziness:Math.floor(Math.random()*101),money:Math.floor(Math.random()*101),petulance:Math.floor(Math.random()*101),loyalty:25+Math.floor(Math.random()*76),jealousy:Math.floor(Math.random()*101),reliability:25+Math.floor(Math.random()*76),interactions:[],relationshipLevel:level,personality:pick(['حنون','عملي','مرح','جاد','طموح','فضولي'])};
}
function newLife(){
 const gender=pick(['male','female']),place=pick(places);
 const father=makePerson('male','الأب','👨',28+Math.floor(Math.random()*12),68+Math.floor(Math.random()*28));
 const mother=makePerson('female','الأم','👩',25+Math.floor(Math.random()*12),72+Math.floor(Math.random()*26));
 const sibling=makePerson(gender,'الأخ/الأخت','🧒',Math.floor(Math.random()*8),55+Math.floor(Math.random()*35));
 return {version:1,lifeId:Date.now()+Math.random(),cemeterySaved:false,name:pick(names[gender])+' '+pick(names.family),gender,age:0,place,bank:(perkOwned('goldenPiggyBank')?Math.max(1000000,place.start):place.start),stats:{happiness:65+Math.floor(Math.random()*26),health:76+Math.floor(Math.random()*22),smart:35+Math.floor(Math.random()*41),looks:35+Math.floor(Math.random()*51)},education:{level:0,school:'لم تبدأ الدراسة',major:null,yearsLeft:0,tuition:0},job:null,jobHistory:[],specialCareer:null,specialCareerHistory:[],combatCareer:null,filmStudio:null,esportsCareer:null,talents:{gaming:15+Math.floor(Math.random()*71)},performance:50,boostUsedAge:null,assets:[],investments:[],business:null,companies:[],mafia:{joined:false,rank:0,rep:0,earnings:0},museum:{opened:false,displayed:[]},zoo:{opened:false,animals:[],rareDiscoveries:0},assassinBladeLastUsedAge:null,cult:{founded:false,name:'',doctrine:'',members:[],fund:0,ceremonies:0,discipline:50},casino:{opened:false,games:[],amenities:[],celebrityHires:0,accessories:[]},dealer:{joined:false,rank:0,rep:0,earnings:0,territory:1},royalty:{active:false,title:null,house:null},investmentAdvisor:{hired:false,yearsLeft:0,fee:4500},marketTip:null,family:[father,mother,sibling],friends:[],partner:null,married:false,children:[],coParentingPlans:[],pets:[],hobbies:[],fame:0,followers:0,socialMediaAccount:false,socialMediaPosts:0,socialPlatforms:{},socialFeed:[],reputation:50,sti:false,crimeRecord:0,prison:null,debt:0,willDistribution:'الأسرة بالتساوي',heirlooms:[],dailyRewardDate:null,dailyChallenges:null,seasonalEvent:null,seasonalEventArchive:[],challengeArchive:[],timeMachineSnapshots:[],legacy:{name:null,inheritance:0,heirloom:null},driversLicense:false,travelHistory:[],log:[],accomplishments:['بدأت رحلة الحياة'],status:'حي',cause:null,retired:false,yearCount:0,wealthPeak:place.start};
}

function isValidSaveData(data){
 if(!data||typeof data!=='object'||Array.isArray(data)||data.version!==1)return false;
 const age=data.age;
 return typeof data.name==='string'&&data.name.trim().length>0&&
  age!==null&&age!==undefined&&String(age).trim()!==''&&Number.isFinite(Number(age))&&Number(age)>=0&&Number(age)<=150&&
  !!data.stats&&typeof data.stats==='object'&&!Array.isArray(data.stats)&&Array.isArray(data.log);
}
function save(){
 try{
  const serialized=JSON.stringify(state);
  // Keep a last-known-good checkpoint before moving to another year or life.
  // A failed backup write must never prevent the primary save from being attempted.
  try{
   const previousRaw=localStorage.getItem(KEY);
   if(previousRaw){
    const previous=JSON.parse(previousRaw);
    if(isValidSaveData(previous)&&(previous.lifeId!==state.lifeId||Number(previous.age)!==Number(state.age))){
     localStorage.setItem(BACKUP_KEY,previousRaw);
    }
   }
  }catch(e){}
  localStorage.setItem(KEY,serialized);
  $('saveStatus').textContent='● محفوظة';
  return true;
 }catch(e){$('saveStatus').textContent='⚠ الحفظ غير متاح';return false;}
}
function normalizeHeirlooms(raw,currentAge=0){
 const seen=new Set();
 return (Array.isArray(raw)?raw:[]).filter(item=>item&&typeof item==='object'&&!Array.isArray(item)).map((item,index)=>{
  const name=typeof item.name==='string'?item.name.trim().slice(0,80):'';
  if(!name)return null;
  let id=(typeof item.id==='string'||typeof item.id==='number')?String(item.id).trim().slice(0,80):'';
  if(!id)id='legacy-heirloom-'+index;
  if(seen.has(id))id=id+'-'+index;
  seen.add(id);
  const value=Number(item.value),age=Number(item.age),fallbackAge=Number(currentAge);
  return {
   ...item,
   id,
   name,
   emoji:typeof item.emoji==='string'&&item.emoji.trim()?item.emoji.slice(0,12):'🏺',
   value:Math.max(0,Math.min(1000000000,Number.isFinite(value)?Math.round(value):0)),
   age:Math.max(0,Math.min(120,Number.isFinite(age)?Math.floor(age):(Number.isFinite(fallbackAge)?Math.floor(fallbackAge):0))),
   kind:typeof item.kind==='string'&&item.kind.trim()?item.kind.slice(0,24):'legacy'
  };
 }).filter(Boolean);
}
function heirloomRarity(value){
 const amount=Math.max(0,Number(value)||0);
 if(amount>=4000)return 'أسطوري';
 if(amount>=2500)return 'نادر';
 if(amount>=1200)return 'غير شائع';
 return 'شائع';
}
function heirloomKindLabel(item){
 if(item.kind==='daily')return 'مكافأة يومية';
 if(item.kind==='blackMarket')return 'مقتنى من السوق السوداء';
 return 'إرث عائلي';
}

function normalizeStatBoostUsage(data){
 if(!data||typeof data!=='object')return null;
 const raw=data.boostUsedAge,used=Number(raw),age=Number(data.age);
 data.boostUsedAge=raw!==null&&raw!==undefined&&String(raw).trim()!==''&&Number.isInteger(used)&&Number.isFinite(age)&&used>=0&&used<=age?used:null;
 return data.boostUsedAge;
}

function normalizeCoreState(data){
 const rawPlace=data.place&&typeof data.place==='object'&&!Array.isArray(data.place)?data.place:{};
 const fallbackPlace=places.find(p=>p.country===rawPlace.country&&p.city===rawPlace.city)||places[0];
 data.place={...fallbackPlace,...rawPlace};
 ['country','city','flag','unit'].forEach(key=>{if(typeof data.place[key]!=='string'||!data.place[key].trim())data.place[key]=fallbackPlace[key];});
 if(!Number.isFinite(Number(data.place.start))||Number(data.place.start)<=0)data.place.start=fallbackPlace.start;
 const statDefaults={happiness:65,health:80,smart:40,looks:45};
 Object.keys(statDefaults).forEach(key=>{const value=Number(data.stats[key]);data.stats[key]=Number.isFinite(value)?clamp(value):statDefaults[key];});
 // Older v1 saves may not contain a performance score; keep job applications usable after migration.
 data.performance=clamp(Number.isFinite(Number(data.performance))?Number(data.performance):50);
 data.age=Number.isFinite(Number(data.age))?Math.max(0,Math.min(120,Math.floor(Number(data.age)))):0;
  normalizeStatBoostUsage(data);
 if(data.job&&typeof data.job==='object'&&!Array.isArray(data.job))ensureJobProgress(data.job,data.age);
 data.bank=Number.isFinite(Number(data.bank))?Number(data.bank):Number(data.place.start)||0;
 data.sti=typeof data.sti==='boolean'?data.sti:false;
 if(!data.socialPlatforms||typeof data.socialPlatforms!=='object'||Array.isArray(data.socialPlatforms))data.socialPlatforms={};
 const rawSocialPlatforms=data.socialPlatforms,normalizedSocialPlatforms={};
 SOCIAL_PLATFORM_CATALOG.forEach(platform=>{const saved=rawSocialPlatforms[platform.id]&&typeof rawSocialPlatforms[platform.id]==='object'?rawSocialPlatforms[platform.id]:{};normalizedSocialPlatforms[platform.id]={active:!!saved.active,followers:Math.max(0,Number(saved.followers)||0),posts:Math.max(0,Number(saved.posts)||0)};});
 if(data.socialMediaAccount&&!SOCIAL_PLATFORM_CATALOG.some(platform=>normalizedSocialPlatforms[platform.id].active)){
  normalizedSocialPlatforms.instagram={active:true,followers:Math.max(0,Number(data.followers)||10),posts:Math.max(0,Number(data.socialMediaPosts)||0)};
 }
 data.socialPlatforms=normalizedSocialPlatforms;
 data.followers=Math.max(0,Number(data.followers)||0);data.socialMediaPosts=Math.max(0,Number(data.socialMediaPosts)||0);
 data.socialMediaAccount=SOCIAL_PLATFORM_CATALOG.some(platform=>data.socialPlatforms[platform.id].active);
 data.socialFeed=normalizeSocialFeed(data.socialFeed);
 data.heirlooms=normalizeHeirlooms(data.heirlooms,data.age);
 data.seasonalEvent=normalizeSeasonalEvent(data.seasonalEvent,data);
 data.seasonalEventArchive=normalizeSeasonalEventArchive(data.seasonalEventArchive,data);
 if(!Array.isArray(data.companies))data.companies=[];
 const normalizeBusinessEntity=entity=>{
  if(!entity||typeof entity!=='object'||Array.isArray(entity))return;
  if(!Array.isArray(entity.financialHistory))entity.financialHistory=[];
  if(entity.treasuryMode==='separate'){
   const rawCashBalance=Number(entity.cashBalance);
   entity.treasuryMode='separate';
   entity.cashBalance=Math.max(-1000000000000,Math.min(1000000000000,Number.isFinite(rawCashBalance)?Math.round(rawCashBalance):0));
  }else{entity.treasuryMode='shared';entity.cashBalance=0;}
  const pendingOwnerContributions=Number(entity.pendingOwnerContributions),pendingOwnerWithdrawals=Number(entity.pendingOwnerWithdrawals);
  entity.pendingOwnerContributions=Math.max(0,Math.min(1000000000000,Number.isFinite(pendingOwnerContributions)?Math.round(pendingOwnerContributions):0));
  entity.pendingOwnerWithdrawals=Math.max(0,Math.min(1000000000000,Number.isFinite(pendingOwnerWithdrawals)?Math.round(pendingOwnerWithdrawals):0));
  const taxLiability=Number(entity.taxLiability),pendingTaxPayments=Number(entity.pendingTaxPayments);
  entity.taxLiability=Math.max(0,Math.min(8000000000,Number.isFinite(taxLiability)?Math.round(taxLiability):0));
  entity.pendingTaxPayments=Math.max(0,Math.min(8000000000,Number.isFinite(pendingTaxPayments)?Math.round(pendingTaxPayments):0));
  entity.financialHistory=entity.financialHistory.filter(report=>report&&typeof report==='object'&&Number.isFinite(Number(report.year))&&Number.isFinite(Number(report.revenue))&&Number.isFinite(Number(report.costs))&&Number.isFinite(Number(report.profit))).slice(-10);
  if(!Array.isArray(entity.staff))entity.staff=[];
  entity.staff=entity.staff.filter(employee=>employee&&typeof employee==='object'&&!Array.isArray(employee)).slice(0,5).map((employee,index)=>{
   const role=BUSINESS_STAFF_ROLES.find(item=>item.id===employee.role);
   if(!role)return null;
   const salary=Number(employee.salary);
   return {
    id:String(employee.id||('legacy-staff-'+role.id+'-'+index)),
    name:typeof employee.name==='string'&&employee.name.trim()?employee.name:role.title+' '+(index+1),
    role:role.id,
    salary:Math.max(0,Math.min(1000000000,Number.isFinite(salary)?salary:Math.max(1200,Math.round((Number(entity.value)||0)*role.salaryRate)))),
    skill:clamp(Number.isFinite(Number(employee.skill))?Number(employee.skill):55),
    morale:clamp(Number.isFinite(Number(employee.morale))?Number(employee.morale):65),
    years:Math.max(0,Math.floor(Number(employee.years)||0))
   };
  }).filter(Boolean);
  if(!Array.isArray(entity.facilities))entity.facilities=[];
  entity.facilities=entity.facilities.filter(facility=>facility&&typeof facility==='object'&&!Array.isArray(facility)).slice(0,8).map((facility,index)=>{
   const catalog=BUSINESS_FACILITY_CATALOG.find(item=>item.id===facility.type);
   if(!catalog)return null;
   const capacityBonus=Number(facility.capacityBonus),annualUpkeep=Number(facility.annualUpkeep),investment=Number(facility.investment);
   return {
    id:String(facility.id||('legacy-facility-'+catalog.id+'-'+index)),
    type:catalog.id,
    title:typeof facility.title==='string'&&facility.title.trim()?facility.title.slice(0,70):catalog.title,
    capacityBonus:Math.max(0,Math.min(1.5,Number.isFinite(capacityBonus)?capacityBonus:catalog.capacityBonus)),
    annualUpkeep:Math.max(0,Math.min(1000000000,Number.isFinite(annualUpkeep)?Math.round(annualUpkeep):catalog.minUpkeep)),
    investment:Math.max(0,Math.min(1000000000,Number.isFinite(investment)?Math.round(investment):0)),
    builtAtAge:Math.max(0,Math.min(120,Math.floor(Number(facility.builtAtAge)||0)))
   };
  }).filter(Boolean);
  const pendingFacilityCosts=Number(entity.pendingFacilityCosts);
  entity.pendingFacilityCosts=Math.max(0,Math.min(8000000000,Number.isFinite(pendingFacilityCosts)?Math.round(pendingFacilityCosts):0));
  if(entity.market&&typeof entity.market==='object'&&!Array.isArray(entity.market)){
   const market=entity.market;
   const marketYear=Math.max(0,Math.floor(Number.isFinite(Number(market.year))?Number(market.year):Number(data.age)||0));
   const marketIndustry=typeof market.industry==='string'?market.industry.slice(0,48):String(entity.sector||'سوق متنوع').slice(0,48);
   const profile=businessIndustryProfile(marketIndustry);
   const competitorCount=Math.max(2,Math.min(12,Math.floor(Number(market.competitorCount)||3)));
   const rivalPriceIndex=Math.max(75,Math.min(125,Math.round(Number(market.rivalPriceIndex)||100)));
   const baseCompetitionIndex=Math.max(profile.competitionMin,Math.min(profile.competitionMin+profile.competitionRange-1,
    Math.round(Number(market.baseCompetitionIndex!==undefined?market.baseCompetitionIndex:market.competitionIndex)||profile.competitionMin)));
   entity.market={
    year:marketYear,industry:marketIndustry,
    demandIndex:Math.max(35,Math.min(115,Math.round(Number(market.demandIndex)||75))),
    baseCompetitionIndex,
    competitionIndex:Math.max(profile.competitionMin,Math.min(profile.competitionMin+profile.competitionRange-1,Math.round(Number(market.competitionIndex)||baseCompetitionIndex))),
    competitorCount,rivalPriceIndex,
    rivalQualityIndex:Math.max(35,Math.min(100,Math.round(Number(market.rivalQualityIndex)||70))),
    rivalMarketingIndex:Math.max(35,Math.min(170,Math.round(Number(market.rivalMarketingIndex)||95))),
    rivalCapacityIndex:Math.max(40,Math.min(180,Math.round(Number(market.rivalCapacityIndex)||100))),
    marketShare:Math.round(Math.max(3,Math.min(45,Number.isFinite(Number(market.marketShare))?Number(market.marketShare):12))*10)/10,
    lastYearShareChange:Math.round(Math.max(-10,Math.min(10,Number(market.lastYearShareChange)||0))*10)/10,
    lastYearProfit:Math.max(-8000000000,Math.min(8000000000,Math.round(Number(market.lastYearProfit)||0))),
    lastYearUnits:Math.max(0,Math.min(100000000,Math.floor(Number(market.lastYearUnits)||0))),
    lastYearRevenue:Math.max(0,Math.min(8000000000,Math.round(Number(market.lastYearRevenue)||0))),
    rivals:normalizeBusinessRivals(market.rivals,{...entity,ownerLifeId:data.lifeId||data.name},marketIndustry,marketYear,competitorCount,rivalPriceIndex)
   };
   reconcileBusinessRivalShares(entity.market);
   const rivalSummary=summarizeBusinessRivals(entity.market.rivals,baseCompetitionIndex,profile);
   Object.assign(entity.market,rivalSummary);
   entity.market.baseCompetitionIndex=baseCompetitionIndex;
  }
  if(!Array.isArray(entity.products))entity.products=[];
  entity.products=entity.products.filter(product=>product&&typeof product==='object'&&!Array.isArray(product)).slice(-20).map((product,index)=>{
   const catalog=BUSINESS_PRODUCT_CATALOG.find(item=>item.id===product.catalogId);
   if(!catalog)return null;
   const unitPrice=Number(product.unitPrice),unitCost=Number(product.unitCost);
   const history=Array.isArray(product.history)?product.history:[];
   return {
    id:String(product.id||('legacy-product-'+catalog.id+'-'+index)),
    catalogId:catalog.id,
    title:typeof product.title==='string'&&product.title.trim()?product.title.slice(0,70):catalog.title,
    emoji:typeof product.emoji==='string'?product.emoji:catalog.emoji,
    category:typeof product.category==='string'?product.category:catalog.category,
    unitPrice:Math.max(50,Math.min(1000000000,Number.isFinite(unitPrice)&&unitPrice>0?Math.round(unitPrice):catalog.unitPrice)),
    unitCost:Math.max(1,Math.min(1000000000,Number.isFinite(unitCost)&&unitCost>0?Math.round(unitCost):catalog.unitCost)),
    demand:clamp(Number.isFinite(Number(product.demand))?Number(product.demand):50,5,95),
    competition:clamp(Number.isFinite(Number(product.competition))?Number(product.competition):50,5,95),
    quality:clamp(Number.isFinite(Number(product.quality))?Number(product.quality):65,20,100),
    active:product.active!==false,
    launchedAtAge:Math.max(0,Math.floor(Number(product.launchedAtAge)||0)),
    lastYearProfit:Math.round(Number(product.lastYearProfit)||0),
    history:history.filter(report=>report&&typeof report==='object'&&Number.isFinite(Number(report.year))&&Number.isFinite(Number(report.revenue))&&Number.isFinite(Number(report.costs))&&Number.isFinite(Number(report.profit))).slice(-10).map(report=>({
     year:Math.max(0,Math.floor(Number(report.year)||0)),
     unitsSold:Math.max(0,Math.floor(Number(report.unitsSold)||0)),
     revenue:Math.max(0,Math.round(Number(report.revenue)||0)),
     costs:Math.max(0,Math.round(Number(report.costs)||0)),
     profit:Math.round(Number(report.profit)||0),
     demand:clamp(Number(report.demand)||50,5,95),
     competition:clamp(Number(report.competition)||50,5,95)
    }))
   };
  }).filter(Boolean);
  if(!Array.isArray(entity.productResearch))entity.productResearch=[];
  entity.productResearch=entity.productResearch.filter(snapshot=>snapshot&&typeof snapshot==='object'&&BUSINESS_PRODUCT_CATALOG.some(item=>item.id===snapshot.productId)&&Number.isFinite(Number(snapshot.year))&&Number.isFinite(Number(snapshot.demand))&&Number.isFinite(Number(snapshot.competition))&&Number.isFinite(Number(snapshot.suggestedPrice))).slice(-4).map(snapshot=>({
   productId:snapshot.productId,
   year:Math.max(0,Math.floor(Number(snapshot.year)||0)),
   demand:clamp(Number(snapshot.demand),5,95),
   competition:clamp(Number(snapshot.competition),5,95),
   suggestedPrice:Math.max(50,Math.min(1000000000,Math.round(Number(snapshot.suggestedPrice)))),
   confidence:clamp(Number(snapshot.confidence)||65,50,99)
  }));
  const pendingProductCosts=Number(entity.pendingProductCosts);
  entity.pendingProductCosts=Math.max(0,Math.min(1000000000,Number.isFinite(pendingProductCosts)?Math.round(pendingProductCosts):0));
  const rawCredit=entity.credit&&typeof entity.credit==='object'&&!Array.isArray(entity.credit)?entity.credit:null;
  if(rawCredit){
   const principal=Math.max(0,Math.min(100000000,Math.round(Number(rawCredit.principal)||0)));
   const accruedInterest=Math.max(0,Math.min(100000000,Math.round(Number(rawCredit.accruedInterest)||0)));
   const annualRate=Math.max(.05,Math.min(.2,Number.isFinite(Number(rawCredit.annualRate))?Number(rawCredit.annualRate):.095));
   const openedAtAge=Math.max(0,Math.min(150,Math.floor(Number(rawCredit.openedAtAge)||0)));
   const lastInterestAge=Number.isFinite(Number(rawCredit.lastInterestAge))?Math.max(-1,Math.min(150,Math.floor(Number(rawCredit.lastInterestAge)))):-1;
   entity.credit=principal+accruedInterest>0?{principal,accruedInterest,annualRate:Math.round(annualRate*10000)/10000,openedAtAge,lastInterestAge}:null;
  }else entity.credit=null;
  if(entity.supplier&&typeof entity.supplier==='object'&&!Array.isArray(entity.supplier)){
   const supplier=BUSINESS_SUPPLIER_CATALOG.find(item=>item.id===entity.supplier.id);
   entity.supplier=supplier?{
   id:supplier.id,
   yearsLeft:clamp(Number(entity.supplier.yearsLeft)||3,1,3),
   startedAtAge:Math.max(0,Number(entity.supplier.startedAtAge)||0),
   quality:clamp(entity.supplier.quality!==null&&Number.isFinite(Number(entity.supplier.quality))?Number(entity.supplier.quality):supplier.quality,40,99),
   costMultiplier:Math.round(Math.max(.7,Math.min(1.3,entity.supplier.costMultiplier!==null&&Number.isFinite(Number(entity.supplier.costMultiplier))?Number(entity.supplier.costMultiplier):supplier.costMultiplier))*1000)/1000,
   feeRate:Math.round(Math.max(.004,Math.min(.03,entity.supplier.feeRate!==null&&Number.isFinite(Number(entity.supplier.feeRate))?Number(entity.supplier.feeRate):supplier.feeRate))*10000)/10000,
   marketYear:Math.max(0,Math.floor(Number(entity.supplier.marketYear)||Number(entity.supplier.startedAtAge)||0))
  }:null;
  }else entity.supplier=null;
 };
 normalizeBusinessEntity(data.business);
 data.companies.forEach(normalizeBusinessEntity);
 if(!data.mafia||typeof data.mafia!=='object'||Array.isArray(data.mafia))data.mafia={joined:false,rank:0,rep:0,earnings:0};
 data.mafia.joined=!!data.mafia.joined;data.mafia.rank=clamp(Number(data.mafia.rank)||0,0,4);data.mafia.rep=clamp(Number(data.mafia.rep)||0,0,100);data.mafia.earnings=Math.max(0,Number(data.mafia.earnings)||0);
 if(!data.museum||typeof data.museum!=='object'||Array.isArray(data.museum))data.museum={opened:false,displayed:[]};
 data.museum.opened=!!data.museum.opened;if(!Array.isArray(data.museum.displayed))data.museum.displayed=[];
 if(!data.zoo||typeof data.zoo!=='object'||Array.isArray(data.zoo))data.zoo={opened:false,animals:[],rareDiscoveries:0};
 data.zoo.opened=!!data.zoo.opened;if(!Array.isArray(data.zoo.animals))data.zoo.animals=[];data.zoo.rareDiscoveries=clamp(Number(data.zoo.rareDiscoveries)||0,0,999);
 if(data.assassinBladeLastUsedAge===undefined)data.assassinBladeLastUsedAge=null;
 if(!data.cult||typeof data.cult!=='object'||Array.isArray(data.cult))data.cult={founded:false,name:'',doctrine:'',members:[],fund:0,ceremonies:0,discipline:50};
 data.cult.founded=!!data.cult.founded;data.cult.name=typeof data.cult.name==='string'?data.cult.name.slice(0,60):'';data.cult.doctrine=typeof data.cult.doctrine==='string'?data.cult.doctrine:'';if(!Array.isArray(data.cult.members))data.cult.members=[];data.cult.members=data.cult.members.slice(0,100);data.cult.fund=Math.max(0,Number(data.cult.fund)||0);data.cult.ceremonies=clamp(Number(data.cult.ceremonies)||0,0,9999);data.cult.discipline=clamp(Number(data.cult.discipline)||50);
 if(!data.casino||typeof data.casino!=='object'||Array.isArray(data.casino))data.casino={opened:false,games:[],amenities:[],celebrityHires:0,accessories:[]};data.casino.opened=!!data.casino.opened;if(!Array.isArray(data.casino.games))data.casino.games=[];if(!Array.isArray(data.casino.amenities))data.casino.amenities=[];if(!Array.isArray(data.casino.accessories))data.casino.accessories=[];data.casino.celebrityHires=clamp(Number(data.casino.celebrityHires)||0,0,999);
 if(!data.dealer||typeof data.dealer!=='object'||Array.isArray(data.dealer))data.dealer={joined:false,rank:0,rep:0,earnings:0,territory:1};data.dealer.joined=!!data.dealer.joined;data.dealer.rank=clamp(Number(data.dealer.rank)||0,0,4);data.dealer.rep=clamp(Number(data.dealer.rep)||0,0,100);data.dealer.earnings=Math.max(0,Number(data.dealer.earnings)||0);data.dealer.territory=clamp(Number(data.dealer.territory)||1,1,10);
 if(!data.royalty||typeof data.royalty!=='object'||Array.isArray(data.royalty))data.royalty={active:false,title:null,house:null};data.royalty.active=!!data.royalty.active;data.royalty.title=typeof data.royalty.title==='string'?data.royalty.title:null;data.royalty.house=typeof data.royalty.house==='string'?data.royalty.house:null;
 if(!data.investmentAdvisor||typeof data.investmentAdvisor!=='object'||Array.isArray(data.investmentAdvisor))data.investmentAdvisor={hired:false,yearsLeft:0,fee:4500};data.investmentAdvisor.hired=!!data.investmentAdvisor.hired;data.investmentAdvisor.yearsLeft=clamp(Number(data.investmentAdvisor.yearsLeft)||0,0,20);data.investmentAdvisor.fee=Math.max(0,Number(data.investmentAdvisor.fee)||4500);if(data.marketTip!==null&&typeof data.marketTip!=='object')data.marketTip=null;
 if(!Number.isFinite(Number(data.zoo.funds)))data.zoo.funds=data.zoo.opened?75000:0;if(!Array.isArray(data.zoo.habitats))data.zoo.habitats=data.zoo.opened?['savannah','forest','aviary']:[];
 if(!data.talents||typeof data.talents!=='object'||Array.isArray(data.talents))data.talents={};
 const gamingHobby=Array.isArray(data.hobbies)?data.hobbies.find(h=>h&&h.id==='gaming'):null;
 if(!Number.isFinite(Number(data.talents.gaming)))data.talents.gaming=gamingHobby?clamp(25+(Number(gamingHobby.level)||1)*5,0,100):35;
 data.talents.gaming=clamp(Number(data.talents.gaming),0,100);
 if(!data.esportsCareer||typeof data.esportsCareer!=='object'||Array.isArray(data.esportsCareer))data.esportsCareer=null;
 if(!Array.isArray(data.challengeArchive))data.challengeArchive=[];
 data.challengeArchive=data.challengeArchive.filter(item=>item&&typeof item.date==='string'&&Array.isArray(item.ids)).slice(0,60);
 if(typeof data.name!=='string'||!data.name.trim())data.name=pick(names[data.gender==='female'?'female':'male'])+' '+pick(names.family);
 if(!['male','female'].includes(data.gender))data.gender='male';
 if(!['حي','متوفى'].includes(data.status))data.status='حي';
 if(!Array.isArray(data.family))data.family=[];
 if(!Array.isArray(data.friends))data.friends=[];
 if(!Array.isArray(data.assets))data.assets=[];
 if(!Array.isArray(data.log))data.log=[];
 if(!Array.isArray(data.accomplishments))data.accomplishments=[];
 return data;
}

function load(){
 try{
  let x=null;
  try{x=JSON.parse(localStorage.getItem(KEY)||'null');}catch(e){}
  if(!isValidSaveData(x)){
   try{
    const backupRaw=localStorage.getItem(BACKUP_KEY);
    const backup=JSON.parse(backupRaw||'null');
    if(isValidSaveData(backup)){
     x=backup;
     saveRecovered=true;
     try{localStorage.setItem(KEY,backupRaw);}catch(e){}
    }
   }catch(e){}
  }
  if(isValidSaveData(x)){
  normalizeCoreState(x);
  const defaults={lifeId:Date.now()+Math.random(),cemeterySaved:false,jobHistory:[],specialCareer:null,specialCareerHistory:[],combatCareer:null,filmStudio:null,investments:[],business:null,married:false,children:[],coParentingPlans:[],pets:[],hobbies:[],fame:0,followers:0,socialMediaAccount:false,socialMediaPosts:0,socialFeed:[],seasonalEvent:null,seasonalEventArchive:[],reputation:50,crimeRecord:0,prison:null,debt:0,willDistribution:'الأسرة بالتساوي',heirlooms:[],dailyRewardDate:null,dailyChallenges:null,boostUsedAge:null,timeMachineSnapshots:[],legacy:{name:null,inheritance:0,heirloom:null},driversLicense:false,travelHistory:[]};
  Object.keys(defaults).forEach(k=>{if(x[k]===undefined||x[k]===null)x[k]=defaults[k];});
  if(!Array.isArray(x.family))x.family=[];if(!Array.isArray(x.friends))x.friends=[];if(!Array.isArray(x.assets))x.assets=[];if(!Array.isArray(x.timeMachineSnapshots))x.timeMachineSnapshots=[];if(!Array.isArray(x.coParentingPlans))x.coParentingPlans=[];x.coParentingPlans.forEach(p=>{if(p&&typeof p==='object'){if(!Array.isArray(p.childIds))p.childIds=[];if(!Array.isArray(p.history))p.history=[];if(!Number.isFinite(Number(p.supportPerChild)))p.supportPerChild=2200;if(!Number.isFinite(Number(p.arrears)))p.arrears=0;}});
  if(!x.education||typeof x.education!=='object')x.education={level:0,school:'لم تبدأ الدراسة',major:null,yearsLeft:0,tuition:0};
  x.education.clubs=Array.isArray(x.education.clubs)?x.education.clubs:[];
  x.assets.forEach(a=>{if((a.kind==='car'||a.kind==='property')&&!Number.isFinite(Number(a.condition)))a.condition=100;});
  const npcDefaults=n=>{if(!n||typeof n!=='object')return;if(!Number.isFinite(Number(n.generosity)))n.generosity=50;if(!Number.isFinite(Number(n.craziness)))n.craziness=50;if(!Number.isFinite(Number(n.money)))n.money=50;if(!Number.isFinite(Number(n.petulance)))n.petulance=50;if(!Number.isFinite(Number(n.loyalty)))n.loyalty=55;if(!Number.isFinite(Number(n.jealousy)))n.jealousy=40;if(!Number.isFinite(Number(n.reliability)))n.reliability=55;if(!Array.isArray(n.interactions))n.interactions=[];};
  if(!Array.isArray(x.specialCareerHistory))x.specialCareerHistory=[];const careerDefaults=c=>{if(!c||typeof c!=='object')return;if(!c.record||typeof c.record!=='object')c.record={attempts:0,wins:0,losses:0,projects:0,totalEarnings:0,bestLevel:clamp(c.level||1)};if(!Array.isArray(c.history))c.history=[];};careerDefaults(x.specialCareer);x.specialCareerHistory.forEach(careerDefaults);
  x.family.forEach(npcDefaults);x.friends.forEach(npcDefaults);(x.children||[]).forEach(npcDefaults);npcDefaults(x.partner);
  return x;
 }}catch(e){}
 return null;
}
function flash(text,bad=false){
 const el=document.createElement('div');el.className='feedback '+(bad?'bad':'good');el.textContent=text;$('feedbackRoot').appendChild(el);setTimeout(()=>el.remove(),1320);
}
function stat(key,delta){
 if(!delta)return;
 if(key==='bank'){state.bank+=delta;flash((delta>0?'+':'')+cash(delta),delta<0);return;}
 if(key==='fame'||key==='reputation'){
  const before=Number(state[key]||0);state[key]=clamp(before+delta);
  if(state[key]!==before)flash((delta>0?'+':'')+fmt(state[key]-before)+'% '+(key==='fame'?'شهرة':'سمعة'),delta<0);
  return;
 }
 if(key==='debt'){state.debt=Math.max(0,(state.debt||0)+delta);return;}
 if(state.stats[key]===undefined)return;
 const labels={happiness:'سعادة',health:'صحة',smart:'ذكاء',looks:'مظهر'};
 const before=state.stats[key];state.stats[key]=clamp(before+delta);const actual=state.stats[key]-before;
 if(actual)flash((actual>0?'+':'')+fmt(actual)+'% '+labels[key],actual<0);
}
function effects(obj){
 if(!obj)return;
 Object.keys(obj).forEach(k=>stat(k,obj[k]));
}
function log(icon,title,text,tone=''){
 state.log.push({age:state.age,icon,title,text,tone});
 if(state.log.length>360)state.log=state.log.slice(-360);
 if(logBatchDepth){logBatchDirty=true;return;}
 renderFeed();save();
}
function achievement(s){if(!state.accomplishments.includes(s))state.accomplishments.push(s);}
function title(){
 if(state.status==='متوفى')return 'رحل عن الدنيا';
 if(state.prison)return 'سجين';
 if(state.retired)return 'متقاعد';
 if(state.age<2)return 'رضيع';
 if(state.age<6)return 'طفل صغير';
 if(state.age<12)return 'تلميذ ابتدائي';
 if(state.age<15)return 'طالب إعدادي';
 if(state.age<18)return 'طالب ثانوي';
 if(state.job)return state.job.title;
 if(state.specialCareer)return state.specialCareer.title;
 if(state.education.yearsLeft>0)return 'طالب جامعي';
 if(state.education.droppedOut)return 'ترك الدراسة';
 if(state.age<23)return 'شاب';
 return 'بالغ';
}
function avatar(){
 if(state.status==='متوفى')return '🪦';
 if(state.prison)return '⛓️';
 if(state.age<2)return '👶🏻';
 if(state.age<6)return state.gender==='male'?'🧒🏻':'👧🏻';
 if(state.age<18)return state.gender==='male'?'👦🏻':'👧🏻';
 if(state.age<60)return state.gender==='male'?'🧑🏻':'👩🏻';
 return state.gender==='male'?'👴🏻':'👵🏻';
}
function stageTabLabel(){
 if(state.status==='متوفى')return 'نهاية';
 if(state.prison)return 'سجين';
 if(state.retired||state.age>=65)return 'مسن';
 if(state.age<2)return 'رضيع';
 if(state.age<6)return 'طفل';
 if(state.age<18||state.education.yearsLeft>0)return 'طالب';
 if(state.age<25)return 'شاب';
 return 'بالغ';
}
function renderHeader(){
 $('avatar').childNodes[0].nodeValue=avatar();$('flag').textContent=state.place.flag;
 if($('identityFlag'))$('identityFlag').textContent=state.place.flag;
 $('characterName').innerHTML=esc(state.name)+((state.fame||0)>=25?' <span class="fame-star" aria-label="مشهور">⭐</span>':'');
 $('ageTag').textContent='العمر '+fmt(state.age)+' سنة';$('titleTag').textContent=title();
 $('cityTag').textContent=state.place.city+'، '+state.place.country;$('bankBalance').textContent=cash(state.bank);
 $('bankBalance').classList.toggle('negative',state.bank<0||(state.debt||0)>0);
 $('wealthNote').textContent=state.bank<0?'رصيدك بالسالب — راجع مصاريفك':(state.debt||0)>0?'عليك ديون '+cash(state.debt):state.bank>100000?'بتبني أمان مالي كويس':'كل سنة فرصة جديدة';
 $('lifeMeta').textContent='السنة '+fmt(state.yearCount+1)+' من حكايتك';
 if($('fameTag'))$('fameTag').textContent='⭐ الشهرة '+clamp(state.fame||0)+'%';
 if($('familyTag'))$('familyTag').textContent='👪 الأبناء '+fmt((state.children||[]).length);
 const careerNav=Array.from(document.querySelectorAll('[data-panel]')).find(b=>b.dataset.panel==='career');
 if(careerNav&&careerNav.querySelector){
  const ico=careerNav.querySelector('.navico');if(ico)ico.textContent=avatar();
  const label=$('stageNavLabel');if(label)label.textContent=stageTabLabel();
 }
}
function statBoostMenu(key){
 const item=STAT_BOOST_CATALOG[key];
 if(!state||state.status!=='حي'||!item||uiSettings.boosts===false)return;
 const current=clamp(Number(state.stats[key])||0);
 const alreadyUsed=state.boostUsedAge!==null&&state.boostUsedAge!==undefined&&Number(state.boostUsedAge)===Number(state.age);
 if(current>35){info('✨','مفيش احتياج للتحسين','مستوى '+item.label+' بقى '+current+'%؛ الفرصة بتظهر وقت ما الإحصاء ينخفض.');return;}
 if(alreadyUsed){info('⏳','فرصة السنة اتستخدمت','تقدر تستفيد من فرصة تحسين جديدة بعد التقدم لسنة تانية.');return;}
 modal(item.icon,'فرصة تحسين '+item.label,'المستوى الحالي '+current+'%. اختار تحسينًا واحدًا فقط خلال السنة الحالية؛ الاختيار المدفوع يستهلك من رصيدك.',[
  choice('🌱',item.free.title,item.free.description+' التحسن المتوقع '+item.free.gain+' نقاط.',()=>applyStatBoost(key,'free'),'مجانًا'),
  choice('✨',item.paid.title,item.paid.description+' التحسن المتوقع '+item.paid.gain+' نقاط.',()=>applyStatBoost(key,'paid'),cash(item.paid.cost)),
  choice('↩️','مش دلوقتي','احتفظ بالفرصة لوقت آخر من السنة.',closeModal)
 ]);
}
function applyStatBoost(key,tier){
 const item=STAT_BOOST_CATALOG[key],offer=item&&item[tier];
 if(!state||state.status!=='حي'||!item||!offer){closeModal();return;}
 if(uiSettings.boosts===false){closeModal();return;}
 const alreadyUsed=state.boostUsedAge!==null&&state.boostUsedAge!==undefined&&Number(state.boostUsedAge)===Number(state.age);
 if(alreadyUsed){closeModal();info('⏳','فرصة السنة اتستخدمت','تقدر تستفيد من فرصة تحسين جديدة بعد التقدم لسنة تانية.');return;}
 const current=clamp(Number(state.stats[key])||0);
 if(current>35){closeModal();info('✨','مفيش احتياج للتحسين','الإحصاء اتحسن بالفعل، فمش محتاج تستخدم الفرصة.');return;}
 const cost=Math.max(0,Math.round(Number(offer.cost)||0));
 if((Number(state.bank)||0)<cost){info('💳','الرصيد مش كفاية','الاختيار ده يحتاج '+cash(cost)+'. تقدر تختار التحسين المجاني بدلًا منه.');return;}
 closeModal();
 state.bank=Math.max(0,Number(state.bank)||0)-cost;
 stat(key,offer.gain);
 const gained=clamp(state.stats[key])-current;
 state.boostUsedAge=Number(state.age);
 log(item.icon,'فرصة تحسين '+item.label,offer.title+' رفعت المستوى بمقدار '+gained+' نقاط'+(cost?' بعد إنفاق '+cash(cost):' دون تكلفة')+'.','good');
 render();
}
function renderStats(){
 const rows=[['happiness','😄','السعادة'],['health','❤️','الصحة'],['smart','🧠','الذكاء'],['looks','😎','المظهر']];
 $('statsPanel').innerHTML=rows.map(r=>{
  const v=clamp(r[0]==='fame'?(state.fame||0):state.stats[r[0]]);
  const color=r[0]==='fame'?'#FDD835':v>=31?'#43A047':v>=13?'#FB8C00':'#E53935';
  const warn=v<=12&&r[0]!=='fame'?' <span class="stat-warning" aria-label="تحذير">⚠️</span>':'';
  const boostUsed=state.boostUsedAge!==null&&state.boostUsedAge!==undefined&&Number(state.boostUsedAge)===Number(state.age);
  const boostButton=state.status==='حي'&&uiSettings.boosts!==false&&v<=35&&!boostUsed?'<button class="statboost-btn" type="button" data-stat-boost="'+r[0]+'" aria-label="فرصة تحسين '+r[2]+'" title="فرصة تحسين '+r[2]+'">+</button>':'';
  return '<div class="statrow '+(r[0]==='fame'?'fame-row':'')+'"><div class="stathead"><span class="statlabel">'+r[2]+' '+r[1]+warn+'</span>'+boostButton+'</div><div class="statbar"><div class="track" role="progressbar" aria-label="'+r[2]+'" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+v+'" aria-valuetext="'+v+' من 100"><div class="fill" aria-hidden="true" style="width:'+v+'%;background:'+color+'"></div><span class="statvalue" aria-hidden="true">'+v+'%</span></div></div></div>';
 }).join('');
}
function logEntrySignature(entry){
 const item=entry&&typeof entry==='object'?entry:{};
 return JSON.stringify([item.age??null,item.icon??'',item.title??'',item.text??'',item.tone??'']);
}
function appendLogEntryNode(feed,entry,lastAge){
 if(entry.age!==lastAge){
  const group=document.createElement('div');group.className='agegroup';
  const label=document.createElement('span');label.textContent='العمر: '+fmt(entry.age)+' سنة';group.appendChild(label);feed.appendChild(group);
 }
 const tone=entry.tone==='good'?' good':entry.tone==='bad'?' bad':entry.tone==='special'?' special':'';
 const article=document.createElement('article');article.className='logcard'+tone;
 const icon=document.createElement('div');icon.className='logicon';if(typeof icon.setAttribute==='function')icon.setAttribute('aria-hidden','true');icon.textContent=String(entry.icon||'');
 const content=document.createElement('div');content.className='logcontent';
 const title=document.createElement('div');title.className='logtitle';title.textContent=String(entry.title||'');
 const textNode=document.createElement('p');textNode.className='logtext';textNode.textContent=String(entry.text||'');
 content.appendChild(title);content.appendChild(textNode);article.appendChild(icon);article.appendChild(content);feed.appendChild(article);
 return entry.age;
}
function announceLifeEvents(entries,startIndex){
 const live=$('lifeAnnouncement');
 if(!live||!Array.isArray(entries)||startIndex>=entries.length)return;
 const added=entries.slice(startIndex);
 if(!added.length)return;
 const latest=added.slice(-2).map(entry=>String(entry&&entry.title||'حدث جديد')).filter(Boolean);
 const age=entries[entries.length-1]&&entries[entries.length-1].age;
 const message=added.length===1
  ?'حدث جديد في عمر '+fmt(age)+' سنة: '+latest[0]+'.'
  :'تم تسجيل '+fmt(added.length)+' أحداث جديدة في عمر '+fmt(age)+' سنة. أحدثها: '+latest.join('، ')+'.';
 live.textContent=message;
}
function renderFeed(){
 const feed=$('lifeFeed');
 if(!feed)return;
 const entries=Array.isArray(state&&state.log)?state.log:[];
 const signatures=entries.map(logEntrySignature);
 const shouldFollowLatest=feed.scrollHeight-feed.scrollTop-feed.clientHeight<=80;
 const previous=renderedLogSnapshot;
 const supportsIncrementalDom=typeof document!=='undefined'&&typeof document.createElement==='function'&&typeof feed.appendChild==='function'&&'firstElementChild' in feed;
 let appendFrom=-1,shiftCount=0;
 if(renderedFeedElement===feed&&Array.isArray(previous)&&supportsIncrementalDom){
  let samePrefix=signatures.length>=previous.length;
  if(samePrefix){
   for(let i=0;i<previous.length;i++){if(previous[i]!==signatures[i]){samePrefix=false;break;}}
  }
  if(samePrefix)appendFrom=previous.length;
  else if(previous.length===360&&signatures.length===360){
   let overlap=0;
   for(let candidate=359;candidate>0;candidate--){
    let matches=true;
    for(let i=0;i<candidate;i++){
     if(previous[previous.length-candidate+i]!==signatures[i]){matches=false;break;}
    }
    if(matches){overlap=candidate;break;}
   }
   if(overlap){shiftCount=previous.length-overlap;appendFrom=overlap;}
  }
 }
 if(appendFrom>=0){
  let removedHeight=0;
  if(shiftCount){
   const beforeRemovalHeight=feed.scrollHeight;
   for(let i=0;i<shiftCount;i++){
    const group=feed.firstElementChild;
    const card=group&&group.nextElementSibling;
    if(!group||!group.classList||!group.classList.contains('agegroup')||!card||!card.classList||!card.classList.contains('logcard')){appendFrom=-1;break;}
    card.remove();
    const next=group.nextElementSibling;
    if(!next||(next.classList&&next.classList.contains('agegroup')))group.remove();
   }
   if(appendFrom>=0){
    removedHeight=Math.max(0,beforeRemovalHeight-feed.scrollHeight);
    if(!shouldFollowLatest&&removedHeight)feed.scrollTop=Math.max(0,feed.scrollTop-removedHeight);
   }
  }
  if(appendFrom>=0){
   if(previous.length===0&&entries.length)feed.innerHTML='';
   let lastAge=appendFrom>0?entries[appendFrom-1].age:null;
   for(let i=appendFrom;i<entries.length;i++)lastAge=appendLogEntryNode(feed,entries[i],lastAge);
   if(appendFrom<entries.length)announceLifeEvents(entries,appendFrom);
   renderedLogSnapshot=signatures;renderedFeedElement=feed;
   if(shouldFollowLatest&&appendFrom<entries.length){
    requestAnimationFrame(()=>{
     if(typeof feed.scrollTo==='function')feed.scrollTo({top:feed.scrollHeight,behavior:'smooth'});
     else feed.scrollTop=feed.scrollHeight;
    });
   }
   return;
  }
 }
 if(!entries.length){
  feed.innerHTML='<div class="empty">لسه حكايتك في أولها. اضغط على زر <b>+ سنة</b> عشان تشوف إيه اللي هيحصل.</div>';
  renderedLogSnapshot=[];renderedFeedElement=feed;return;
 }
 let html='',last=null;
 entries.forEach(x=>{
  if(x.age!==last){last=x.age;html+='<div class="agegroup"><span>العمر: '+fmt(last)+' سنة</span></div>';}
  const tone=x.tone==='good'?' good':x.tone==='bad'?' bad':x.tone==='special'?' special':'';
  html+='<article class="logcard'+tone+'"><div class="logicon" aria-hidden="true">'+esc(x.icon)+'</div><div class="logcontent"><div class="logtitle">'+esc(x.title)+'</div><p class="logtext">'+esc(x.text)+'</p></div></article>';
 });
 feed.innerHTML=html;
 renderedLogSnapshot=signatures;renderedFeedElement=feed;
 requestAnimationFrame(()=>{
  if(!shouldFollowLatest)return;
  if(typeof feed.scrollTo==='function')feed.scrollTo({top:feed.scrollHeight,behavior:'smooth'});
  else feed.scrollTop=feed.scrollHeight;
 });
}
function syncBusinessAsset(){
 if(!state)return;
 if(state.business){
  const asset=(state.assets||[]).find(a=>a.kind==='business'&&(a.id===state.business.assetId||a.title===state.business.title));
  if(asset){state.business.assetId=asset.id;asset.value=Math.max(1000,Math.round(Number(state.business.value)||asset.value||1000));}
 }
 (state.companies||[]).forEach(company=>{
  const asset=(state.assets||[]).find(item=>item.kind==='business'&&item.companyPortfolio&&String(item.id)===String(company.id));
  if(asset)asset.value=Math.max(1000,Math.round(Number(company.value)||asset.value||1000));
 });
}
function render(){
 syncBusinessAsset();renderHeader();renderStats();renderFeed();save();
}
function closeModal(){
 const root=$('modalRoot');
 if(activeDialogKeyHandler){document.removeEventListener('keydown',activeDialogKeyHandler);activeDialogKeyHandler=null;}
 root.innerHTML='';
 const returnFocus=modalReturnFocus;modalReturnFocus=null;
 if(returnFocus&&returnFocus.isConnected&&typeof returnFocus.focus==='function'){
  try{returnFocus.focus({preventScroll:true});}catch(e){returnFocus.focus();}
 }
}
function section(title){return {section:true,title};}
function choice(icon,title,desc,action,price='',progress=null,locked=false){return {icon,title,desc,action,price,progress,locked};}
function modal(icon,title,desc,choices,closable=true,extra=''){
 const root=$('modalRoot');
 const activeElement=document.activeElement;
 if(activeElement&&!root.contains(activeElement)&&activeElement!==document.body&&activeElement!==document.documentElement)modalReturnFocus=activeElement;
 if(activeDialogKeyHandler){document.removeEventListener('keydown',activeDialogKeyHandler);activeDialogKeyHandler=null;}
 const isDrawer=['القائمة الرئيسية','الدراسة والشغل','فرص عمل جديدة','School','University','Class','Cliques','Faculty','Activities','الأصول','الأصول والمشتريات','العلاقات','العلاقات والأسرة','الأنشطة والحياة اليومية','السوشيال ميديا','مجتمع المقاتلين','التسوق'].includes(title)||SOCIAL_PLATFORM_CATALOG.some(p=>p.title===title);
 const context=String(title||'')+' '+String(desc||'')+' '+String(extra||'');
 const symptom=/(عرض|أعراض|صداع|غثيان|حمى|حُمّى|زكام|سعال|ألم|وجع|دوخة|symptom|headache|nausea|flu|diagnosis)/i.test(context);
 const crime=/(جريمة|سرقة|سجن|مخدر|عصابة|شرطة|اختلاس|سطو|crime|robbery|prison)/i.test(context);
 const education=/(جامعة|تخصص|مدرسة|تعليم|تخرج|دراسة|شهادة|امتحان|التعليم|education|graduation|school|university|major)/i.test(context);
 const license=/(رخصة|قيادة|اختبار قيادة|license|driving test|road sign)/i.test(context);
 const racing=/(سباق|رالي|تحدي الطريق|drifting|racing|road race|street race)/i.test(context);
 const film=/(فيلم|السينما|مخرج|ممثل|تصوير|استوديو|movie|film|filming|actor|director|screenplay|on the set|costume|production assistant)/i.test(context);
 const money=/(مهنة|الشغل|وظيفة|عمل|مال|بنك|استثمار|مشروع|ترقية|راتب|أصول|دخل|ثروة|قرض|money|bank|investment)/i.test(context);
 const relations=/(صديق|صداقة|علاقة|شريك|زواج|طلاق|أب|أم|أخ|أخت|ابن|عائلة|علاقات|حبيب|friend|relationship|mother|father)/i.test(context);
 const healthcare=/(طبيب|صحة|إصابة|خطر|مرض|وفاة|علاج|تشخيص|مستشفى|جراحة|healthcare|doctor|medical|injury|illness)/i.test(context);
 const social=/(سوشيال|تواصل|بودكاست|منصة|متابع|حساب|social|podcast|instagram|facebook|tiktok|youtube|twitch|soundcloud)/i.test(context);
 const supernatural=/(مصاص دماء|مصاصو الدماء|شبح|أشباح|كائن فضائي|سحر|vampire|ghost|alien|supernatural)/i.test(context);
 const special=/(شهرة|إنجاز|مقتنيات|ملك|أمير|جائزة|تاج|بطولة|وسام|achievement|award)/i.test(context);
 const category=symptom?'success':(crime||healthcare)?'danger':special?'special':'normal';
 let categoryLabel='موقف من الحياة';
 if(symptom)categoryLabel='الصحة';
 else if(crime)categoryLabel='الجريمة';
 else if(healthcare)categoryLabel='الرعاية الصحية';
 else if(education)categoryLabel='التعليم';
 else if(license)categoryLabel='الرخصة';
 else if(racing)categoryLabel='السباق';
 else if(film)categoryLabel='الإخراج السينمائي';
 else if(social)categoryLabel='التواصل الاجتماعي';
 else if(supernatural)categoryLabel='ما وراء الطبيعة';
 else if(money)categoryLabel='المال والعمل';
 else if(relations)categoryLabel='العلاقات';
 else if(special)categoryLabel='إنجاز خاص';
 const actualChoices=choices.filter(c=>c&&!c.section&&!c.disabled&&typeof c.action==='function');
 const hasSelect=/<select[\s>]/i.test(extra||'');
 const isNotice=!isDrawer&&actualChoices.length<=1&&!hasSelect;
 const hasRandomChoice=actualChoices.length>1||hasSelect;
 const showSurprise=hasRandomChoice&&!film&&!license;
 const hasQuestion=/(هتعمل إيه|ماذا ستفعل|ماذا ستختار|هتختار إيه|؟|\?)/.test(String(desc||''));
 const questionPrompt=!isNotice&&!hasSelect&&actualChoices.length>1&&!hasQuestion?'هتعمل إيه؟':'';
 const list=choices.map((c,i)=>{
  if(c&&c.section)return '<div class="list-section" role="heading" aria-level="2">'+esc(c.title||'')+'</div>';
  if(c&&c.banner)return '<button class="drawer-action-banner" data-i="'+i+'"><span class="banner-emoji">'+(c.icon||'🛍️')+'</span><span class="banner-copy"><strong>'+esc(c.title||'تسوّق الآن')+'</strong>'+(c.desc?'<small>'+esc(c.desc)+'</small>':'')+'</span></button>';
  return '<button class="choice'+(c&&c.locked?' locked-choice':'')+(c&&c.cardClass?' '+esc(c.cardClass):'')+'" data-i="'+i+'" '+(c&&c.disabled?'disabled':'')+'>'+
   '<span class="choiceico">'+(c&&c.icon||'›')+'</span>'+
   '<span class="ctext"><span class="ctitle">'+esc(c&&(c.title||c.label)||'اختيار')+'</span>'+
   (c&&c.desc?'<span class="cdesc">'+esc(c.desc)+'</span>':'')+
   (c&&c.progress!==null&&c&&c.progress!==undefined&&Number.isFinite(Number(c.progress))?'<span class="choice-progress"><span style="width:'+clamp(c.progress)+'%"></span></span>':'')+
   '</span>'+(c&&c.price?'<span class="price">'+esc(c.price)+'</span>':'')+(c&&c.stamp?'<span class="activity-pack-stamp">'+esc(c.stamp)+'</span>':'')+
   (isDrawer?(c&&c.menuDots?'<span class="choice-dots" aria-hidden="true">•••</span>':'<span class="choice-chevron" aria-hidden="true">›</span>'):'')+
  '</button>';
 }).join('');
 if(isDrawer){
  root.innerHTML='<div class="overlay drawer-overlay" id="overlay"><section class="modal drawer'+(title==='School'?' school-screen':'')+(title==='Activities'?' activities-screen':'')+'" role="dialog" aria-modal="true" aria-label="'+esc(title)+'"><div class="modalhead drawer-head"><div class="modalicon">'+icon+'</div><div class="modaltitle">'+esc(title)+'</div>'+(closable?'<button class="closebtn" id="closeModal" aria-label="إغلاق">×</button>':'')+'</div><div class="modalbody drawer-body">'+(desc?'<p class="desc">'+esc(desc)+'</p>':'')+extra+'<div class="choicegrid">'+list+'</div></div></section></div>';
 }else{
  root.innerHTML='<div class="overlay event-overlay" id="overlay"><section class="modal event-modal banner-'+category+(isNotice?' notice-modal':'')+'" role="dialog" aria-modal="true" aria-label="'+esc(title)+'"><div class="event-banner banner-'+category+'"><span>'+categoryLabel+'</span>'+(closable?'<button class="closebtn" id="closeModal" aria-label="إغلاق">×</button>':'')+'</div><div class="event-summary"><div class="event-icon">'+icon+'</div><h2 class="event-title">'+esc(title)+'</h2>'+(desc?'<p class="desc">'+esc(desc)+'</p>':'')+(questionPrompt?'<div class="event-question">'+questionPrompt+'</div>':'')+'</div><div class="modalbody event-body">'+extra+'<div class="choicegrid">'+list+'</div>'+(showSurprise?'<button class="surprise-choice" id="surpriseChoice" type="button"><span aria-hidden="true">🎲</span> فاجئني!</button>':'')+'</div></section></div>';
 }
 const overlay=$('overlay');
 overlay.addEventListener('click',e=>{if(e.target===overlay&&closable)closeModal();});
 if(closable&&$('closeModal'))$('closeModal').addEventListener('click',closeModal);
 root.querySelectorAll('[data-i]').forEach(b=>b.addEventListener('click',()=>{const c=choices[Number(b.dataset.i)];if(c&&typeof c.action==='function'){playUiFeedback('choice');c.action();}}));
 const surprise=$('surpriseChoice');
 if(surprise)surprise.addEventListener('click',()=>{
  const selects=Array.from(root.querySelectorAll('select[data-surpriseable="true"]'));
  if(selects.length){
   selects.forEach(sel=>{if(sel.options.length)sel.selectedIndex=Math.floor(Math.random()*sel.options.length);});
   return;
  }
  if(actualChoices.length){playUiFeedback('choice');pick(actualChoices).action();}
 });
 const dialog=typeof root.querySelector==='function'?root.querySelector('[role="dialog"]'):null;
 if(dialog){
  dialog.setAttribute('tabindex','-1');
  const getFocusable=()=>Array.from(dialog.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])')).filter(element=>element.getClientRects().length>0&&element.getAttribute('aria-hidden')!=='true');
  activeDialogKeyHandler=event=>{
   if(event.key==='Escape'&&closable){event.preventDefault();closeModal();return;}
   if(event.key!=='Tab')return;
   const focusable=getFocusable();
   if(!focusable.length){event.preventDefault();dialog.focus();return;}
   const first=focusable[0],last=focusable[focusable.length-1];
   if(event.shiftKey&&(document.activeElement===first||!dialog.contains(document.activeElement))){event.preventDefault();last.focus();}
   else if(!event.shiftKey&&(document.activeElement===last||!dialog.contains(document.activeElement))){event.preventDefault();first.focus();}
  };
  document.addEventListener('keydown',activeDialogKeyHandler);
  const initialFocus=$('closeModal')||getFocusable()[0]||dialog;
  try{initialFocus.focus({preventScroll:true});}catch(e){initialFocus.focus();}
 }
}
function info(icon,title,desc,choices=[choice('✓','تمام','',closeModal)]){modal(icon,title,desc,choices);}
function validState(){return state&&state.status==='حي'&&!dead;}
function availableEvents(){return events.filter(e=>{if(state.age<e.range[0]||state.age>e.range[1])return false;const r=e.requires;if(!r)return true;if(r==='partner')return !!state.partner;if(r==='children')return (state.children||[]).length>0;if(r==='job')return !!state.job;if(r==='pet')return (state.pets||[]).length>0;if(r==='investments')return (state.investments||[]).length>0;if(r==='business')return !!state.business;if(r==='fame')return (state.fame||0)>=25;if(r==='single')return !state.partner;if(r==='noLicense')return !state.driversLicense;return true;});}
function chooseAdaptiveEvent(pool){
 // محرك ترجيح محلي: يفضّل المواقف المرتبطة باحتياجات اللاعب الحالية.
 const s=state.stats;
 const weights=pool.map(e=>{
  let w=1;
  const text=(e.title+' '+e.text).toLowerCase();
  const allChoices=e.choices||[];
  const hasEffect=k=>allChoices.some(c=>c.effects&&Number(c.effects[k])>0);
  const offersCash=hasEffect('bank');
  const improvesHealth=hasEffect('health')||/صحة|طبيب|جسم|نوم|جيم/.test(text);
  const improvesHappiness=hasEffect('happiness')||/عيلة|صديق|هواية|إجازة|عزومة|مناسبة/.test(text);
  const improvesSmart=hasEffect('smart')||/دراسة|تدريب|تعليم|تحدي|مقابلة/.test(text);
  if(s.health<40&&improvesHealth)w*=1.8;
  if(s.happiness<40&&improvesHappiness)w*=1.55;
  if(s.smart<35&&improvesSmart)w*=1.4;
  if(state.bank<10000){
   if(offersCash)w*=1.45;
   if(allChoices.every(c=>(c.cost||0)>0))w*=.55;
  }
  if(state.job&&/شغل|ترقية|وظيفة|مدير|مقابلة/.test(text))w*=1.35;
  const lowestRelation=[...(state.family||[]),...(state.friends||[]),...(state.partner?[state.partner]:[])].reduce((v,p)=>Math.min(v,p.relationshipLevel||100),100);
  if(lowestRelation<35&&/عيلة|صديق|مساعدة|ناس/.test(text))w*=1.25;
  return Math.max(.1,w);
 });
 const total=weights.reduce((sum,w)=>sum+w,0);
 let roll=Math.random()*total;
 for(let i=0;i<pool.length;i++){roll-=weights[i];if(roll<=0)return pool[i];}
 return pool[pool.length-1];
}
function randomEvent(){
 if(!validState())return;
 if(state.prison){prisonEvent();return;}
 const pool=availableEvents();if(!pool.length){info('🌤️','سنة هادئة','عدّت السنة من غير حدث استثنائي، بس اختياراتك اليومية لسه بتبني مستقبلك.');return;}
 const e=chooseAdaptiveEvent(pool);
 modal(e.icon,e.title,e.text,e.choices.map(c=>choice('›',c.label,c.desc,()=>{
   closeModal();
   if(c.cost&&state.bank<c.cost){info('💳','الرصيد مش كفاية','الاختيار ده محتاج '+cash(c.cost)+'، ورصيدك الحالي '+cash(state.bank)+'.',[choice('↩️','تمام','',()=>{closeModal();afterDecision();})]);return;}
   if(c.cost)stat('bank',-c.cost);
   let failed=false,result=c.result||'اخدت قرارك وكمّلت طريقك.';
   if(c.risk&&chance(c.risk)){failed=true;result=c.failText||'النتيجة ما كانتش زي ما توقعت.';effects(c.fail);}
   else{effects(c.effects);if(c.win)effects(c.win);}
   if(c.effects&&c.effects.bank){} 
   log(e.icon,e.title,result,failed?'bad':'special');render();
   if(state.stats.health<=0){death('تدهور الحالة الصحية');return;}
   afterDecision();
 },c.cost?'− '+cash(c.cost):'')),false);
}
function afterDecision(){if(!validState())return;if(state.stats.health<=0){death('تدهور الحالة الصحية');return;}render();}

function childDevelopmentStage(age){
 const n=Math.max(0,Number(age)||0);
 return n<4?'الطفولة المبكرة':n<6?'الروضة':n<12?'الابتدائي':n<15?'الإعدادي':n<18?'الثانوي':n<22?'بداية الجامعة والاستقلال':n<26?'بداية الحياة المهنية':'شخص بالغ';
}
function ensureChildGrowthProfile(c){
 if(!c||typeof c!=='object')return null;const age=Math.max(0,Number(c.age)||0);
 if(!Number.isFinite(Number(c.smart)))c.smart=40;if(!Number.isFinite(Number(c.health)))c.health=75;if(!Number.isFinite(Number(c.happiness)))c.happiness=70;
 if(!Number.isFinite(Number(c.schoolPerformance)))c.schoolPerformance=clamp(38+Number(c.smart)*.32+(Number(c.relationshipLevel)||50)*.12);
 if(!Number.isFinite(Number(c.careerPotential)))c.careerPotential=clamp(24+Number(c.smart)*.42+Number(c.schoolPerformance)*.22+(Number(c.relationshipLevel)||50)*.08);
 if(!Number.isFinite(Number(c.independence)))c.independence=age>=18?clamp(30+Number(c.careerPotential)*.45):0;
 if(!Number.isFinite(Number(c.schoolSupport)))c.schoolSupport=0;
 if(typeof c.educationStatus!=='string')c.educationStatus=age<6?'قبل الدراسة':age<18?'طالب في المدرسة':age<22?'لم يُحدد المسار بعد':'بالغ';
 if(typeof c.interest!=='string'||!c.interest)c.interest=pick(['العلوم والتقنية','الفنون والإبداع','الرياضة','الأعمال','المجتمع']);
 if(!Array.isArray(c.growthHistory))c.growthHistory=[];if(!Array.isArray(c.interactions))c.interactions=[];
 c.age=Math.min(100,Math.floor(age));c.schoolPerformance=clamp(c.schoolPerformance);c.careerPotential=clamp(c.careerPotential);c.independence=clamp(c.independence);c.schoolSupport=clamp(c.schoolSupport);return c;
}
function childCareerFromInterest(interest){
 return ({'العلوم والتقنية':'متخصص تقنية مبتدئ','الفنون والإبداع':'مساعد في مجال إبداعي','الرياضة':'مدرب أو رياضي مبتدئ','الأعمال':'موظف أعمال مبتدئ','المجتمع':'مساعد مجتمعي'})[interest]||'موظف مبتدئ';
}
function advanceChildren(){
 (state.children||[]).forEach(c=>{
  if(!c||typeof c!=='object')return;ensureChildGrowthProfile(c);c.age=Math.min(100,c.age+1);
  const age=c.age,smart=clamp(c.smart),rel=clamp(c.relationshipLevel??50),support=c.schoolSupport;
  c.schooling=age<4?'قبل الدراسة':age<6?'الروضة':age<12?'المرحلة الابتدائية':age<15?'المرحلة الإعدادية':age<18?'المرحلة الثانوية':c.educationStatus;
  if(age===4)log('🧸','مرحلة جديدة في حياة '+c.name,'بدأ '+c.name+' يتعلم الاعتماد على النفس والتواصل.','special');
  if(age===6){c.schooling='المرحلة الابتدائية';c.educationStatus='طالب في المدرسة';c.schoolPerformance=clamp(c.schoolPerformance+3);log('🏫','أول يوم مدرسة','بدأ '+c.name+' رحلته الدراسية. تحصيله الحالي '+c.schoolPerformance+'%.','special');}
  if(age>=7&&age<=17){if(chance(Math.min(.9,.42+smart/260+support/500)))c.schoolPerformance=clamp(c.schoolPerformance+(smart>=65?2:1)+(support>=8?1:0));else if(smart<35&&support<5)c.schoolPerformance=clamp(c.schoolPerformance-1);if(age>=13)c.careerPotential=clamp(c.careerPotential+(smart>=60?1:0)+1);c.schoolSupport=Math.max(0,support-2);}
  if(age===12){c.schooling='المرحلة الإعدادية';log('📚','مرحلة دراسية جديدة','انتقل '+c.name+' إلى المرحلة الإعدادية.','special');}
  if(age===15){c.schooling='المرحلة الثانوية';log('🎓','المرحلة الثانوية','دخل '+c.name+' المرحلة الثانوية، وبدأت اهتماماته تحدد مستقبله.','special');}
  if(age===16)log('🧭','اهتمامات المستقبل','اهتمام '+c.name+' الحالي هو '+c.interest+'. التوجيه ممكن يفتح له فرصًا أفضل.','special');
  if(age===18){const ready=clamp(c.schoolPerformance*.36+smart*.31+c.careerPotential*.23+rel*.1);c.independence=clamp(Math.max(c.independence,ready));if(c.schoolPerformance>=63&&smart>=48){c.educationStatus='طالب جامعي';c.schooling='التعليم الجامعي';c.universityYears=0;c.job='طالب جامعي';}else if(c.careerPotential>=53){c.educationStatus='يبدأ المسار المهني';c.job='موظف مبتدئ';}else{c.educationStatus='يبحث عن أول فرصة';c.job='باحث عن فرصة عمل';}log('🎓','بداية استقلال الابن','وصل '+c.name+' لسن الرشد. المسار الحالي: '+c.educationStatus+'، والاستقلال '+c.independence+'%.','good');}
  if(age>=19&&age<=22&&c.educationStatus==='طالب جامعي'){c.universityYears=(Number(c.universityYears)||0)+1;if(age===22){c.educationStatus='خريج جامعي';c.schooling='خريج جامعي';c.job='خريج جامعي';c.careerPotential=clamp(c.careerPotential+10);c.independence=clamp(c.independence+8);log('🎓','تخرج من الجامعة','أنهى '+c.name+' دراسته الجامعية وارتفعت فرصه المهنية.','good');}}
  if(age===21){if(c.educationStatus==='يبحث عن أول فرصة'&&c.careerPotential>=60){c.job=childCareerFromInterest(c.interest);c.educationStatus='بدأ أول وظيفة';c.independence=clamp(c.independence+8);log('💼','أول وظيفة للابن','حصل '+c.name+' على بداية مهنية في '+c.job+'.','good');}else if(c.educationStatus==='يبدأ المسار المهني'){c.independence=clamp(c.independence+6);log('🏡','خطوة نحو الاستقلال','بدأ '+c.name+' يتحمل مسؤوليات أكبر.','good');}}
  if(age>=23&&age<=27&&c.independence<80)c.independence=clamp(c.independence+(c.job==='باحث عن فرصة عمل'?1:3));
  if([4,6,12,15,16,18,21,22].includes(age)){c.growthHistory.push({age,stage:childDevelopmentStage(age),schoolPerformance:c.schoolPerformance,careerPotential:c.careerPotential,independence:c.independence});if(c.growthHistory.length>12)c.growthHistory.shift();}
 });
}
function familyTreeNode(p){
 const gone=!!p.deceased,level=clamp(p.relationshipLevel??0);
 return '<article class="family-tree-node'+(gone?' family-tree-deceased':'')+'"><div class="family-tree-person"><span class="family-tree-avatar">'+esc(p.emoji||'👤')+'</span><span class="family-tree-copy"><strong>'+esc(p.name||'فرد من العائلة')+'</strong><small>'+esc(p.relation||'قريب')+(Number.isFinite(Number(p.age))?' · '+fmt(p.age)+' سنة':'')+(gone?' · متوفى':'')+'</small></span></div><div class="family-tree-meter"><span style="width:'+level+'%"></span></div><small class="family-tree-foot">العلاقة '+level+'%</small></article>';
}
function familyTreeMenu(){
 if(!state)return;const fam=Array.isArray(state.family)?state.family:[],kids=Array.isArray(state.children)?state.children:[];
 const siblings=fam.filter(p=>/(أخ|أخت)/.test(String(p.relation||''))),parents=fam.filter(p=>/(الأب|الأم|والد|والدة|جد|جدة|أب|أم)/.test(String(p.relation||''))&&!siblings.includes(p)),others=fam.filter(p=>!siblings.includes(p)&&!parents.includes(p));
 const ex=(state.friends||[]).filter(p=>/(شريك سابق|زوج سابق|زوجة سابقة|الأم\/الأب)/.test(String(p.relation||'')));
 const nodes=a=>a.length?a.map(familyTreeNode).join(''):'<div class="family-tree-empty">لا توجد بيانات مسجلة في هذا الجيل حتى الآن.</div>';
 const partner=state.partner?familyTreeNode({...state.partner,relation:state.married?'الزوج/الزوجة':'الشريك الحالي'}):'<div class="family-tree-empty">لا يوجد شريك حالي.</div>';
 const childNodes=kids.length?kids.map(c=>familyTreeNode({...ensureChildGrowthProfile(c),relation:(c.adopted?'ابن/ابنة بالتبنّي':'ابن/ابنة')+' · '+childDevelopmentStage(c.age)})).join(''):'<div class="family-tree-empty">لم يتكوّن جيل الأبناء بعد.</div>';
 const extra='<div class="family-tree-view"><section class="family-tree-generation"><h3>الجيل السابق والعائلة</h3><div class="family-tree-branches">'+nodes([...parents,...others])+'</div></section><div class="family-tree-connector">↓</div><section class="family-tree-generation"><h3>الشخصية الحالية</h3><div class="family-tree-node family-tree-player"><div class="family-tree-person"><span class="family-tree-avatar">'+(state.gender==='female'?'👩':'👨')+'</span><span class="family-tree-copy"><strong>'+esc(state.name)+'</strong><small>أنت · '+fmt(state.age)+' سنة</small></span></div><small class="family-tree-foot">الجيل الحالي</small></div><div class="family-tree-connector">↔</div><div class="family-tree-branches">'+partner+'</div></section><div class="family-tree-connector">↓</div><section class="family-tree-generation"><h3>جيل الأبناء · '+kids.length+'</h3><div class="family-tree-branches">'+childNodes+'</div></section>'+(siblings.length?'<section class="family-tree-generation"><h3>الإخوة والأخوات</h3><div class="family-tree-branches">'+nodes(siblings)+'</div></section>':'')+(ex.length?'<section class="family-tree-generation"><h3>العلاقات السابقة</h3><div class="family-tree-branches">'+nodes(ex)+'</div></section>':'')+'</div>';
 const opts=[];
 [...parents,...others,...siblings,...ex].forEach(p=>opts.push(choice(p.deceased?'🕯️':(p.emoji||'👤'),(p.name||'فرد من العائلة')+' · '+(p.relation||'قريب'),'العمر '+fmt(p.age||0)+' · العلاقة '+clamp(p.relationshipLevel??0)+'%',()=>{closeModal();if(p.deceased)info('🕯️',p.name||'ذكرى عائلية','الشخص ده محفوظ في سجل الأسرة.');else personModal(p);},clamp(p.relationshipLevel??0)+'%')));
 if(state.partner)opts.push(choice('💞',state.partner.name+' · الشريك','العلاقة '+clamp(state.partner.relationshipLevel)+'%',()=>{closeModal();personModal(state.partner)}));
 kids.forEach((c,i)=>opts.push(choice(c.emoji||'🧒',c.name+' · '+childDevelopmentStage(c.age),'العمر '+fmt(c.age)+' سنة · التحصيل '+clamp(c.schoolPerformance??50)+'%',()=>{closeModal();childMenu(i)},clamp(c.relationshipLevel??0)+'%')));
 opts.push(choice('📜','إدارة الوصية والإرث','',willMenu),choice('↩️','رجوع للعلاقات','',relations));
 modal('🌳','شجرة العائلة','استعرض الجيل السابق وشخصيتك الحالية والشريك والأبناء، واضغط على فرد من القائمة لإدارة علاقتك به.',opts,true,extra);
}

function recordBusinessFinancialReport(entity,report){
 if(!entity||typeof entity!=='object')return;
 const history=Array.isArray(entity.financialHistory)?entity.financialHistory:[];
 const revenue=Math.max(0,Math.round(Number(report.revenue)||0));
 const costs=Math.max(0,Math.round(Number(report.costs)||0));
 const profit=Math.round(Number(report.profit)||0);
 const openingValue=Math.max(0,Math.round(Number(report.openingValue)||0));
 const closingValue=Math.max(0,Math.round(Number(report.closingValue)||0));
 const margin=revenue>0?Math.round(profit/revenue*1000)/10:0;
 const growthRate=openingValue>0?Math.round((closingValue-openingValue)/openingValue*1000)/10:0;
 const payroll=Math.max(0,Math.round(Number(report.payroll)||0));
 const staffCount=Math.max(0,Math.min(5,Math.floor(Number(report.staffCount)||0)));
 const supplierQuality=Number.isFinite(Number(report.supplierQuality))?clamp(Number(report.supplierQuality),0,100):0;
 const supplierCostMultiplier=Number.isFinite(Number(report.supplierCostMultiplier))?Math.round(Math.max(0,Number(report.supplierCostMultiplier))*1000)/1000:0;
 const productRevenue=Math.max(0,Math.round(Number(report.productRevenue)||0));
 const productCosts=Math.max(0,Math.round(Number(report.productCosts)||0));
 const productProfit=Number.isFinite(Number(report.productProfit))?Math.round(Number(report.productProfit)):productRevenue-productCosts;
 const productUnits=Math.max(0,Math.floor(Number(report.productUnits)||0));
 const productCount=Math.max(0,Math.min(BUSINESS_PRODUCT_CATALOG.length,Math.floor(Number(report.productCount)||0)));
 const facilityUpkeep=Math.max(0,Math.round(Number(report.facilityUpkeep)||0));
 const facilityInvestment=Math.max(0,Math.min(8000000000,Math.round(Number(report.facilityInvestment)||0)));
 const facilityCount=Math.max(0,Math.min(8,Math.floor(Number(report.facilityCount)||0)));
 const capacityMultiplier=Math.max(1,Math.min(4,Number.isFinite(Number(report.capacityMultiplier))?Number(report.capacityMultiplier):1));
 const marketDemandIndex=Math.max(0,Math.min(115,Math.floor(Number(report.marketDemandIndex)||0)));
 const marketCompetitionIndex=Math.max(0,Math.min(100,Math.floor(Number(report.marketCompetitionIndex)||0)));
 const marketCompetitorCount=Math.max(0,Math.min(12,Math.floor(Number(report.marketCompetitorCount)||0)));
 const marketRivalPriceIndex=Math.max(0,Math.min(150,Math.floor(Number(report.marketRivalPriceIndex)||0)));
 const marketShare=Math.max(0,Math.min(45,Math.round((Number(report.marketShare)||0)*10)/10));
 const marketShareChange=Math.max(-10,Math.min(10,Math.round((Number(report.marketShareChange)||0)*10)/10));
 const marketRivalPlans=typeof report.marketRivalPlans==='string'?report.marketRivalPlans.slice(0,360):'';
 const marketIndustry=typeof report.marketIndustry==='string'?report.marketIndustry.slice(0,48):'';
 const industryRevenueMultiplier=Math.round(Math.max(.7,Math.min(1.5,Number(report.industryRevenueMultiplier)||1))*1000)/1000;
 const industryOperatingCostMultiplier=Math.round(Math.max(.7,Math.min(1.5,Number(report.industryOperatingCostMultiplier)||1))*1000)/1000;
 const industryUnitCostMultiplier=Math.round(Math.max(.7,Math.min(1.5,Number(report.industryUnitCostMultiplier)||1))*1000)/1000;
 const businessLoanInterest=Math.max(0,Math.round(Number(report.businessLoanInterest)||0));
 const businessLoanInterestPaid=Math.max(0,Math.min(businessLoanInterest,Math.round(Number(report.businessLoanInterestPaid)||0)));
 const businessLoanInterestAccrued=Math.max(0,Math.min(businessLoanInterest,Math.round(Number(report.businessLoanInterestAccrued)||0)));
 const businessLoanBalance=Math.max(0,Math.min(200000000,Math.round(Number(report.businessLoanBalance)||0)));
 const taxableProfit=Math.max(0,Math.min(8000000000,Math.round(Number(report.taxableProfit)||0)));
 const corporateTaxRate=Math.round(Math.max(0,Math.min(.25,Number(report.corporateTaxRate)||0))*10000)/10000;
 const corporateTax=Math.max(0,Math.min(8000000000,Math.round(Number(report.corporateTax)||0)));
 const corporateTaxPaid=Math.max(0,Math.min(8000000000,Math.round(Number(report.corporateTaxPaid)||0)));
 const corporateTaxAccrued=Math.max(0,Math.min(8000000000,Math.round(Number(report.corporateTaxAccrued)||0)));
 const taxLiability=Math.max(0,Math.min(8000000000,Math.round(Number(report.taxLiability)||0)));
 const openingTaxLiability=Math.max(0,Math.min(8000000000,Math.round(Number(report.openingTaxLiability)||0)));
 const treasuryMode=report.treasuryMode==='separate'?'separate':'shared';
 const openingCashBalance=Math.max(-1000000000000,Math.min(1000000000000,Math.round(Number(report.openingCashBalance)||0)));
 const closingCashBalance=Math.max(-1000000000000,Math.min(1000000000000,Math.round(Number(report.closingCashBalance)||0)));
 const ownerContributions=Math.max(0,Math.min(1000000000000,Math.round(Number(report.ownerContributions)||0)));
 const ownerWithdrawals=Math.max(0,Math.min(1000000000000,Math.round(Number(report.ownerWithdrawals)||0)));
 history.push({year:Math.max(0,Math.floor(Number(report.year)||0)),openingValue,revenue,costs,profit,margin,growthRate,closingValue,level:Math.max(1,Math.floor(Number(report.level)||1)),supplier:typeof report.supplier==='string'?report.supplier:'',supplierQuality,supplierCostMultiplier,payroll,staffCount,productRevenue,productCosts,productProfit,productUnits,productCount,facilityUpkeep,facilityInvestment,facilityCount,capacityMultiplier,marketIndustry,marketDemandIndex,marketCompetitionIndex,marketCompetitorCount,marketRivalPriceIndex,marketShare,marketShareChange,marketRivalPlans,industryRevenueMultiplier,industryOperatingCostMultiplier,industryUnitCostMultiplier,businessLoanInterest,businessLoanInterestPaid,businessLoanInterestAccrued,businessLoanBalance,taxableProfit,corporateTaxRate,corporateTax,corporateTaxPaid,corporateTaxAccrued,taxLiability,openingTaxLiability,treasuryMode,openingCashBalance,closingCashBalance,ownerContributions,ownerWithdrawals});
 entity.financialHistory=history.slice(-10);
}

function businessMarketSnapshot(business){
 if(!business||typeof business!=='object')return null;
 const year=Math.max(0,Math.floor(Number(state.age)||0));
 const activeProduct=(Array.isArray(business.products)?business.products:[]).find(product=>product&&product.active!==false);
 const catalog=activeProduct&&BUSINESS_PRODUCT_CATALOG.find(item=>item.id===activeProduct.catalogId);
 const industry=String(business.sector||business.industry||(catalog&&catalog.category)||'سوق متنوع').slice(0,48);
 const previous=business.market&&typeof business.market==='object'&&!Array.isArray(business.market)?business.market:null;
 const profile=businessIndustryProfile(industry),identity=businessRivalIdentity(business);
 const yearHash=businessRivalHash(identity+'|'+year+'|market');
 const previousYear=previous?Math.max(0,Math.floor(Number(previous.year)||0)):year;
 const sameYear=!!previous&&previousYear===year,canReusePrevious=!!previous&&previousYear<=year;
 const previousShare=canReusePrevious&&Number.isFinite(Number(previous.marketShare))?Number(previous.marketShare):null;
 const demandIndex=sameYear?Math.max(35,Math.min(115,Math.round(Number(previous.demandIndex)||75))):profile.demandMin+(yearHash%profile.demandRange);
 const baselineCompetition=sameYear?Math.max(profile.competitionMin,Math.min(profile.competitionMin+profile.competitionRange-1,Math.round(Number(previous.baseCompetitionIndex||previous.competitionIndex)||profile.competitionMin))):profile.competitionMin+((yearHash>>>8)%profile.competitionRange);
 const baselinePrice=previous&&Number.isFinite(Number(previous.rivalPriceIndex))?Math.max(75,Math.min(125,Math.round(Number(previous.rivalPriceIndex)))):profile.rivalPriceMin+((yearHash>>>24)%profile.rivalPriceRange);
 const rosterSeed=businessRivalHash(identity+'|rival-roster');
 const profileCount=profile.competitorMin+(rosterSeed%profile.competitorRange);
 const fallbackCount=previous?Math.max(2,Math.min(12,Math.floor(Number(previous.competitorCount)||profileCount))):profileCount;
 let rivals;
 if(sameYear)rivals=normalizeBusinessRivals(previous.rivals,business,industry,year,fallbackCount,baselinePrice);
 else if(canReusePrevious&&previousYear<year){
  rivals=normalizeBusinessRivals(previous.rivals,business,industry,previousYear,fallbackCount,baselinePrice);
  for(let nextYear=previousYear+1;nextYear<=year;nextYear++){
   const nextHash=businessRivalHash(identity+'|'+nextYear+'|market');
   rivals=advanceBusinessRivals(rivals,business,industry,nextYear,profile,profile.demandMin+(nextHash%profile.demandRange));
  }
 }else rivals=createBusinessRivals(business,industry,year,profileCount,baselinePrice);
 const summary=summarizeBusinessRivals(rivals,baselineCompetition,profile);
 const market={
  year,industry,demandIndex,baseCompetitionIndex:baselineCompetition,
  competitionIndex:summary.competitionIndex,competitorCount:summary.competitorCount,
  rivalPriceIndex:summary.rivalPriceIndex,rivalQualityIndex:summary.rivalQualityIndex,
  rivalMarketingIndex:summary.rivalMarketingIndex,rivalCapacityIndex:summary.rivalCapacityIndex,
  marketShare:Math.round(Math.max(3,Math.min(45,previousShare===null?8+((yearHash>>>4)%13):previousShare))*10)/10,
  lastYearShareChange:sameYear?Math.round(Math.max(-10,Math.min(10,Number(previous.lastYearShareChange)||0))*10)/10:0,
  lastYearProfit:sameYear?Math.max(-8000000000,Math.min(8000000000,Math.round(Number(previous.lastYearProfit)||0))):0,
  lastYearUnits:sameYear?Math.max(0,Math.min(100000000,Math.floor(Number(previous.lastYearUnits)||0))):0,
  lastYearRevenue:sameYear?Math.max(0,Math.min(8000000000,Math.round(Number(previous.lastYearRevenue)||0))):0,
  rivals
 };
 reconcileBusinessRivalShares(market);
 business.market=market;
 return market;
}

function businessProductMarketSnapshot(business,catalog){
 const year=Math.max(0,Math.floor(Number(state.age)||0));
 const source=String(state.lifeId||state.name||'hayah')+'|'+year+'|'+String(business.assetId||business.id||business.title||'business')+'|'+catalog.id;
 let hash=2166136261;
 for(let i=0;i<source.length;i++)hash=Math.imul(hash^source.charCodeAt(i),16777619);
 hash=hash>>>0;
 return {
  productId:catalog.id,
  year,
  demand:clamp(32+(hash%59),20,90),
  competition:clamp(18+((hash>>>8)%73),10,90),
  suggestedPrice:Math.max(50,Math.round(catalog.unitPrice*(.9+((hash>>>16)%21)/100))),
  confidence:clamp(60+((hash>>>24)%35),60,94)
 };
}
function simulateBusinessProducts(business,openingValue,supplier,staffRevenueBonus){
 const facilities=Array.isArray(business.facilities)?business.facilities:[];
 const facilityCapacityBonus=facilities.reduce((sum,facility)=>sum+Math.max(0,Math.min(1.5,Number(facility.capacityBonus)||0)),0);
 const capacityMultiplier=Math.max(1,Math.min(4,1+facilityCapacityBonus));
 const market=businessMarketSnapshot(business);
 const industryProfile=businessIndustryProfile(market.industry);
 const result={revenue:0,costs:0,upfrontCosts:Math.max(0,Math.round(Number(business.pendingProductCosts)||0)),units:0,count:0,capacityUnits:0,capacityMultiplier};
 business.pendingProductCosts=0;
 const products=Array.isArray(business.products)?business.products:[];
 const marketDemandFactor=Math.max(.7,Math.min(1.3,market.demandIndex/80));
 const marketCompetitionFactor=Math.max(.78,Math.min(1.02,1.06-market.competitionIndex/300));
 const marketShareFactor=Math.max(.9,Math.min(1.3,.88+market.marketShare/100));
 products.filter(product=>product&&product.active!==false).forEach(product=>{
  const catalog=BUSINESS_PRODUCT_CATALOG.find(item=>item.id===product.catalogId);
  if(!catalog)return;
  const demand=clamp(product.demand,5,95),competition=clamp(product.competition,5,95);
  const price=Math.max(50,Math.round(Number(product.unitPrice)||catalog.unitPrice));
  const supplierFactor=supplier?Math.max(.7,Math.min(1.3,Number(supplier.costMultiplier)||1)):1;
  const unitCost=Math.max(1,Math.round((Number(product.unitCost)||catalog.unitCost)*supplierFactor*industryProfile.unitCostMultiplier));
  const capacity=Math.max(1,Math.floor(Math.max(1000,openingValue)/Math.max(1500,unitCost*10)*capacityMultiplier));
  const priceRatio=price/Math.max(1,catalog.unitPrice);
  const priceFactor=Math.max(.55,Math.min(1.2,1.12-Math.max(0,priceRatio-1)*.45+Math.max(0,1-priceRatio)*.18));
  const relativePrice=price/Math.max(1,catalog.unitPrice*(market.rivalPriceIndex/100));
  const marketPriceFactor=Math.max(.82,Math.min(1.12,1.04-Math.max(0,relativePrice-1)*.3+Math.max(0,1-relativePrice)*.12));
  const productQuality=clamp(product.quality,20,100);
  const rivalQualityFactor=Math.max(.9,Math.min(1.1,1+(productQuality-market.rivalQualityIndex)/500));
  const rivalMarketingFactor=Math.max(.9,Math.min(1.08,1-(market.rivalMarketingIndex-100)/500));
  const rivalCapacityFactor=Math.max(.92,Math.min(1.05,1-(market.rivalCapacityIndex-100)/900));
  const marketFactor=(demand/100)*Math.max(.25,1.02-competition/150)*marketDemandFactor*marketCompetitionFactor*marketPriceFactor*marketShareFactor*rivalMarketingFactor*rivalCapacityFactor;
  const qualityFactor=(.72+productQuality*.003)*rivalQualityFactor;
  const teamFactor=1+Math.min(.15,Math.max(0,Number(staffRevenueBonus)||0)*.5);
  const unitsSold=Math.max(0,Math.round(capacity*marketFactor*priceFactor*qualityFactor*teamFactor*(.9+Math.random()*.2)));
  const revenue=unitsSold*price;
  const fixedCosts=Math.round(Math.max(1000,openingValue)*.0015);
  const marketingCosts=Math.round(revenue*.025);
  const costs=unitsSold*unitCost+fixedCosts+marketingCosts;
  const profit=revenue-costs;
  result.revenue+=revenue;
  result.costs+=costs;
  result.units+=unitsSold;
  result.capacityUnits+=capacity;
  result.count++;
  if(!Array.isArray(product.history))product.history=[];
  product.history.push({year:Math.max(0,Math.floor(Number(state.age)||0)),unitsSold,revenue,costs,profit,demand,competition,marketShare:market.marketShare,competitorCount:market.competitorCount,demandIndex:market.demandIndex,competitionIndex:market.competitionIndex});
  product.history=product.history.slice(-10);
  product.lastYearProfit=profit;
  product.demand=clamp(demand+Math.round((Math.random()-.5)*10)+(profit>=0?2:-4),5,95);
  product.competition=clamp(competition+Math.round((Math.random()-.4)*8),5,95);
 });
 result.productProfit=result.revenue-result.costs-result.upfrontCosts;
 if(result.count){
  const previousShare=market.marketShare;
  const margin=result.productProfit/Math.max(1,result.revenue);
  const sellThrough=result.units/Math.max(1,result.capacityUnits);
  const profitabilityLift=margin>=.12?.9:margin>=0?.3:-.8;
  const salesLift=Math.min(.6,Math.max(0,sellThrough)*.6);
  const competitionPenalty=market.competitionIndex/120;
  const shareDelta=Math.max(-2.5,Math.min(2.5,profitabilityLift+salesLift-competitionPenalty));
  market.marketShare=Math.round(Math.max(3,Math.min(45,previousShare+shareDelta))*10)/10;
  market.lastYearShareChange=Math.round((market.marketShare-previousShare)*10)/10;
  market.lastYearProfit=result.productProfit;
  market.lastYearUnits=result.units;
  market.lastYearRevenue=result.revenue;
  reconcileBusinessRivalShares(market);
 }
 result.marketShare=market.marketShare;
 result.marketShareChange=market.lastYearShareChange;
 return result;
}

function simulateBusinessEntityYear(business,kind){
 if(!business||typeof business!=='object')return;
 const portfolio=kind==='portfolio';
 const separateTreasury=businessUsesSeparateTreasury(business);
 const pendingTaxPayments=Math.max(0,Math.round(Number(business.pendingTaxPayments)||0));
 const openingCashBalance=separateTreasury?businessTreasuryBalance(business)+pendingTaxPayments:0;
 const level=Math.max(1,Math.floor(Number(business.level)||1)),openingValue=Math.max(1000,Number(business.value)||1000);
 const supplierBase=BUSINESS_SUPPLIER_CATALOG.find(item=>business.supplier&&item.id===business.supplier.id);
 const supplier=supplierBase?{...supplierBase,
  quality:clamp(business.supplier.quality!==null&&Number.isFinite(Number(business.supplier.quality))?Number(business.supplier.quality):supplierBase.quality,40,99),
  costMultiplier:Math.round(Math.max(.7,Math.min(1.3,business.supplier.costMultiplier!==null&&Number.isFinite(Number(business.supplier.costMultiplier))?Number(business.supplier.costMultiplier):supplierBase.costMultiplier))*1000)/1000
 }:null;
 const staff=Array.isArray(business.staff)?business.staff:[];
 let staffRevenueBonus=0,staffCostReduction=0,staffPayroll=0;
 staff.forEach(employee=>{
  const role=BUSINESS_STAFF_ROLES.find(item=>item.id===employee.role);
  if(!role)return;
  const salary=Math.max(0,Math.round(Number(employee.salary)||0));
  const skill=clamp(Number.isFinite(Number(employee.skill))?Number(employee.skill):55);
  const morale=clamp(Number.isFinite(Number(employee.morale))?Number(employee.morale):65);
  const effectiveness=Math.max(.35,Math.min(1,(skill*.65+morale*.35)/100));
  staffRevenueBonus+=role.revenueBonus*effectiveness;
  staffCostReduction+=role.costReduction*effectiveness;
  staffPayroll+=salary;
 });
 const initialMarket=businessMarketSnapshot(business);
 const industryProfile=businessIndustryProfile(initialMarket.industry);
 const baseRevenue=(portfolio?Math.round(openingValue*(.03+Math.random()*.10)*(.85+level*.12)):Math.round(openingValue*(.03+Math.random()*.08)*(.8+level*.15)))*industryProfile.revenueMultiplier;
 const baseCosts=(portfolio?Math.round(openingValue*(.025+Math.random()*.055)*(1+Math.max(0,level-1)*.06)):Math.round(openingValue*(.02+Math.random()*.05)*(1+Math.max(0,level-1)*.08)))*industryProfile.operatingCostMultiplier;
 const supplierRevenueFactor=supplier?(.9+supplier.quality/100*.15):1;
 const productResult=simulateBusinessProducts(business,openingValue,supplier,staffRevenueBonus);
 const market=businessMarketSnapshot(business);
 const revenue=Math.round(baseRevenue*supplierRevenueFactor*(1+Math.min(.25,staffRevenueBonus)))+productResult.revenue;
 const supplierCosts=supplier?Math.round(baseCosts*supplier.costMultiplier):baseCosts;
 const operatingCosts=Math.round(supplierCosts*(1-Math.min(.25,staffCostReduction)));
 const facilities=Array.isArray(business.facilities)?business.facilities:[];
 const facilityUpkeep=facilities.reduce((sum,facility)=>sum+Math.max(0,Math.round(Number(facility.annualUpkeep)||0)),0);
 const facilityInvestmentCosts=Math.max(0,Math.min(8000000000,Math.round(Number(business.pendingFacilityCosts)||0)));
 business.pendingFacilityCosts=0;
 // Facility construction is capital expenditure: it was paid at purchase time, so report it separately from annual operating profit.
 const operatingCostsTotal=operatingCosts+staffPayroll+facilityUpkeep+productResult.costs;
 const credit=business.credit&&typeof business.credit==='object'?business.credit:null;
 const creditPrincipal=credit?Math.max(0,Math.round(Number(credit.principal)||0)):0;
 const creditRate=credit?Math.max(.05,Math.min(.2,Number(credit.annualRate)||.095)):.095;
 const businessLoanInterest=credit&&creditPrincipal>0&&Number(credit.lastInterestAge)!==Number(state.age)?Math.max(0,Math.round(creditPrincipal*creditRate)):0;
 if(credit&&businessLoanInterest){
  const cashBeforeInterest=Math.max(0,businessTreasuryBalance(business)+revenue-operatingCostsTotal);
  const businessLoanInterestPaid=Math.min(businessLoanInterest,Math.floor(cashBeforeInterest));
  const businessLoanInterestAccrued=businessLoanInterest-businessLoanInterestPaid;
  credit.accruedInterest=Math.min(100000000,Math.max(0,Math.round(Number(credit.accruedInterest)||0)+businessLoanInterestAccrued));
  credit.lastInterestAge=Number(state.age);
  credit._lastInterestPaid=businessLoanInterestPaid;
  credit._lastInterestAccrued=businessLoanInterestAccrued;
 }else if(credit){credit._lastInterestPaid=0;credit._lastInterestAccrued=0;}
 const businessLoanInterestPaid=credit?Math.max(0,Math.round(Number(credit._lastInterestPaid)||0)):0;
 const businessLoanInterestAccrued=credit?Math.max(0,Math.round(Number(credit._lastInterestAccrued)||0)):0;
 if(credit){delete credit._lastInterestPaid;delete credit._lastInterestAccrued;}
 const preTaxProfit=revenue-operatingCostsTotal-productResult.upfrontCosts-businessLoanInterest;
 const taxableProfit=Math.max(0,Math.round(preTaxProfit));
 const corporateTaxRate=Math.max(.05,Math.min(.25,Number(industryProfile.corporateTaxRate)||.14));
 const corporateTax=Math.max(0,Math.round(taxableProfit*corporateTaxRate));
 const openingTaxLiability=businessTaxLiability(business)+pendingTaxPayments;
 business.pendingTaxPayments=0;
 const totalTaxDue=Math.min(8000000000,openingTaxLiability-pendingTaxPayments+corporateTax);
 const cashAfterInterest=businessTreasuryBalance(business)+revenue-operatingCostsTotal-businessLoanInterestPaid;
 const corporateTaxPaidFromCash=Math.min(totalTaxDue,Math.max(0,Math.floor(cashAfterInterest)));
 const corporateTaxAccrued=Math.max(0,totalTaxDue-corporateTaxPaidFromCash);
 const corporateTaxPaid=corporateTaxPaidFromCash+pendingTaxPayments;
 business.taxLiability=corporateTaxAccrued;
 const costs=operatingCostsTotal+productResult.upfrontCosts+businessLoanInterest+corporateTax;
 const profit=revenue-costs;
 // Product launch fees were paid when chosen; tax and interest are paid only from business cash. Unpaid amounts remain liabilities instead of being charged twice.
 const cashDelta=revenue-operatingCostsTotal-businessLoanInterestPaid-corporateTaxPaidFromCash;
 adjustBusinessTreasury(business,cashDelta);
 business.value=Math.max(1000,Math.round(openingValue*(profit>=0?1.04:.97)));
 staff.forEach(employee=>{
  employee.years=Math.min(80,Math.max(0,Math.floor(Number(employee.years)||0))+1);
  employee.morale=clamp((Number.isFinite(Number(employee.morale))?Number(employee.morale):65)+(profit>=0?2:-4));
  if(employee.morale>=70&&chance(.25))employee.skill=clamp((Number(employee.skill)||55)+1);
 });
 const closingCashBalance=separateTreasury?businessTreasuryBalance(business):0;
 const ownerContributions=separateTreasury?Math.max(0,Math.round(Number(business.pendingOwnerContributions)||0)):0;
 const ownerWithdrawals=separateTreasury?Math.max(0,Math.round(Number(business.pendingOwnerWithdrawals)||0)):0;
 business.pendingOwnerContributions=0;business.pendingOwnerWithdrawals=0;
 recordBusinessFinancialReport(business,{year:state.age,openingValue,revenue,costs,profit,closingValue:business.value,treasuryMode:separateTreasury?'separate':'shared',openingCashBalance,closingCashBalance,ownerContributions,ownerWithdrawals,level,supplier:supplier?supplier.title:'',supplierQuality:supplier?supplier.quality:0,supplierCostMultiplier:supplier?supplier.costMultiplier:0,payroll:staffPayroll,staffCount:staff.length,productRevenue:productResult.revenue,productCosts:productResult.costs+productResult.upfrontCosts,productProfit:productResult.productProfit,productUnits:productResult.units,productCount:productResult.count,facilityUpkeep,facilityInvestment:facilityInvestmentCosts,facilityCount:facilities.length,capacityMultiplier:productResult.capacityMultiplier,marketIndustry:market.industry,marketDemandIndex:market.demandIndex,marketCompetitionIndex:market.competitionIndex,marketCompetitorCount:market.competitorCount,marketRivalPriceIndex:market.rivalPriceIndex,marketShare:market.marketShare,marketShareChange:market.lastYearShareChange,marketRivalPlans:(market.rivals||[]).slice(0,6).map(rival=>rival.name+': '+rival.lastDecision).join('، ').slice(0,360),industryRevenueMultiplier:industryProfile.revenueMultiplier,industryOperatingCostMultiplier:industryProfile.operatingCostMultiplier,industryUnitCostMultiplier:industryProfile.unitCostMultiplier,businessLoanInterest,businessLoanInterestPaid,businessLoanInterestAccrued,businessLoanBalance:businessCreditBalance(business),taxableProfit,corporateTaxRate,corporateTax,corporateTaxPaid,corporateTaxAccrued,taxLiability:businessTaxLiability(business),openingTaxLiability});
 const supplierLabel=supplier?' · المورد '+supplier.title:'';
 const creditBalance=businessCreditBalance(business);
 const creditLabel=creditBalance?' · تمويل قائم '+cash(creditBalance):'';
 const staffLabel=staff.length?' · الرواتب '+cash(staffPayroll)+' لعدد '+staff.length+' موظف':'';
 const productLabel=productResult.count?' · المنتجات '+productResult.count+' · مبيعاتها '+cash(productResult.revenue)+' · الوحدات المباعة '+fmt(productResult.units):productResult.upfrontCosts?' · مصروفات تطوير المنتجات '+cash(productResult.upfrontCosts):'';
 const facilityLabel=facilities.length?' · المنشآت '+facilities.length+' · صيانتها '+cash(facilityUpkeep)+' سنويًا · طاقة المنتجات ×'+productResult.capacityMultiplier.toFixed(2):facilityInvestmentCosts?' · استثمار منشآت '+cash(facilityInvestmentCosts):'';
 const marketLabel=' · السوق '+market.industry+' · الحصة '+market.marketShare+'% · المنافسون '+market.competitorCount;
 log(portfolio?'🏢':'🏪',portfolio?'التقرير السنوي: '+(business.title||'شركة من المحفظة'):'التقرير السنوي للمشروع','الإيرادات '+cash(revenue)+' · المصروفات '+cash(costs)+' · '+(profit>=0?'صافي الربح ':'صافي الخسارة ')+cash(Math.abs(profit))+' · مستوى الإدارة '+level+supplierLabel+staffLabel+productLabel+facilityLabel+marketLabel+creditLabel+'.','special');
 if(supplier){
  business.supplier.yearsLeft=Math.max(0,(Number(business.supplier.yearsLeft)||3)-1);
  if(business.supplier.yearsLeft===0){business.supplier=null;log('📦','انتهاء عقد المورد · '+(business.title||'النشاط'),'انتهى عقد المورد. راجع عروض السوق قبل السنة المالية القادمة.','bad');}
 }
 if(portfolio){
  const asset=(state.assets||[]).find(item=>item.kind==='business'&&item.companyPortfolio&&String(item.id)===String(business.id));
  if(asset)asset.value=business.value;
 }
}
function advanceAge(){
 if(!validState())return;
 state.age++;state.yearCount++;if(perkEnabled('hollywoodStar')&&(state.job||state.specialCareer))state.fame=100;
 if(state.specialCareer&&state.specialCareer.id==='fighter'&&state.combatCareer){const cc=ensureCombatCareer();cc.energy=100;if(cc.injuryYears>0){cc.injuryYears--;cc.injury=clamp(cc.injury-28);if(cc.injuryYears===0||cc.injury===0){cc.injury=0;cc.injuryYears=0;log('🩹','التعافي من الإصابة','تعافيت من إصابة القتال وعدت جاهزًا للتدريب.','good');}}if(cc.coach&&cc.coach.yearsLeft>0){const annualCost=cc.coach.annualCost||0;if(state.bank<annualCost){log('💳','تعذر دفع مصاريف المدرب','الرصيد لا يكفي مصاريف المدرب السنوية؛ انتهى التعاقد دون خصم المصروف.','bad');cc.coach=null;}else{state.bank-=annualCost;cc.coach.yearsLeft--;if(cc.coach.yearsLeft<=0){log('🧑‍🏫','انتهاء عقد المدرب','انتهى عقد المدرب. يمكنك تجديده من مسيرة القتال.');cc.coach=null;}}}}
 advanceChildren();
 (state.family||[]).forEach(relative=>{if(relative.deceased)return;relative.age=(relative.age||0)+1;const oldest=relative.age>=100;const parent=/(الأب|الأم|والد|والدة)/.test(relative.relation||'');const risk=relative.age>75?Math.min(.45,.012+(relative.age-75)*.012):0;if(oldest||(risk&&chance(risk))){relative.deceased=true;const close=(relative.relationshipLevel||50)>=70;state.stats.happiness=clamp(state.stats.happiness-(close?12:5));log('🕯️','وفاة أحد أفراد العائلة','توفي '+relative.name+' بعد رحلة من العمر. الخبر أثر عليك وعلى علاقتك بالعائلة.','bad');achievement('وداع '+relative.name);}});
 if(state.partner&&typeof state.partner.age==='number'){
  state.partner.age++;
  const partnerRisk=state.partner.age>78?Math.min(.38,.008+(state.partner.age-78)*.012):0;
  if(state.partner.age>=103||(partnerRisk&&chance(partnerRisk))){const departed={...state.partner,relation:state.married?'الزوج/الزوجة المتوفى':'الشريك السابق المتوفى',deceased:true};state.family.push(departed);state.partner=null;state.married=false;state.stats.happiness=clamp(state.stats.happiness-18);log('🕯️','رحيل شريك الحياة','فقدت شريك حياتك بعد سنوات من المشاركة. الذكريات والعائلة تفضل جزءًا من قصتك.','bad');}
 }
 if(state.prison&&state.prison.years>0){state.prison.years--;state.stats.happiness=clamp(state.stats.happiness-5);state.stats.health=clamp(state.stats.health-2);if(state.prison.years===0){log('🔓','انتهاء العقوبة','انتهت مدة العقوبة وعُدت لحياتك خارج السجن.','special');state.prison=null;}}
 const freeVehicleCare=perkEnabled('goldenWrench');
 const assetUpkeep=state.assets.reduce((s,a)=>s+(freeVehicleCare&&a.kind==='car'?0:(a.upkeep||0)),0);
 state.assets.forEach(a=>{const before=a.value||0;if(a.kind==='property'){a.condition=clamp((a.condition??100)-2);a.value=Math.round(before*(a.condition<25?1.005:1.025));}else if(a.kind==='car'){if(freeVehicleCare){a.condition=100;a.value=Math.round(before*.97);}else{a.condition=clamp((a.condition??100)-4);a.value=Math.round(before*.91);}}else if(a.kind==='business')a.value=Math.round(before*1.03);});
 if(state.job&&!state.retired){
   const job=ensureJobProgress(state.job,state.age);
   const salary=Math.round(job.salary*state.performance/100*careerIncomeMultiplier());state.bank+=salary;flash('+'+cash(salary));
   log('💼','دخل سنوي','استلمت '+cash(salary)+' من شغلك في '+job.title+'.','good');
   state.performance=clamp(state.performance+(chance(.58)?2:-1),20,100);
   const promotionChance=jobPromotionChance(job,false);
   if(promotionChance>0&&chance(promotionChance))grantJobPromotion('annual');
 }
 if(state.age>=18&&!state.retired){
   const living=Math.round(9000+state.age*180);state.bank-=living;flash('-'+cash(living),true);
   log('🧾','مصاريف المعيشة','دفعت '+cash(living)+' لمصاريف السنة من أكل ومواصلات واحتياجات أساسية.');
 }
 const childCosts=(state.children||[]).reduce((sum,c)=>{const base=(c.age||0)<6?4500:((c.age||0)<18?7500:0);if(!base)return sum;const plan=(state.coParentingPlans||[]).find(p=>p&&p.active!==false&&(p.childIds||[]).includes(c.id||c.name));if(!plan)return sum+base;if(plan.mode==='shared')return sum+Math.round(base*.6);if(plan.mode==='other')return sum+Math.round(base*.2);return sum+base;},0);if(childCosts>0){state.bank-=childCosts;log('🧸','مصاريف الأبناء','احتياجات وتعليم ورعاية الأبناء كلّفتك '+cash(childCosts)+' هذا العام بعد احتساب ترتيبات الرعاية.','bad');}applyCoParentingAnnualEffects();
 if(assetUpkeep){state.bank-=assetUpkeep;flash('-'+cash(assetUpkeep),true);log('🔧','صيانة الأصول','صيانة ممتلكاتك كلّفتك '+cash(assetUpkeep)+'.','bad');}
 const rentIncome=(state.assets||[]).filter(a=>a.kind==='property'&&a.rented).reduce((total,a)=>total+Math.round(a.tenant&&perkOwned('landlordPack')?(a.tenant.rent||a.value*.045):(a.value||0)*.045),0);
 (state.assets||[]).forEach(a=>{if(a.kind==='property'&&a.tenant&&perkOwned('landlordPack')){a.tenant.yearsLeft=Math.max(0,(a.tenant.yearsLeft||0)-1);if(a.tenant.yearsLeft===0&&chance(.25)){a.rented=false;a.tenant=null;log('🏠','انتهاء عقد الإيجار','غادر المستأجر أحد عقاراتك بعد انتهاء العقد. افتح إدارة المستأجرين للبحث عن مستأجر جديد.','bad');}else if(a.tenant&&a.tenant.yearsLeft===0)a.tenant.yearsLeft=1;}});
 if(state.zoo&&state.zoo.opened)advanceZooSystem();if(state.cult&&state.cult.founded)advanceCultSystem();if(state.casino&&state.casino.opened)advanceCasinoSystem();if(state.dealer&&state.dealer.joined)advanceDealerSystem();advanceInvestmentAdvisor();
 if(state.museum&&state.museum.opened){const visitorIncome=(state.museum.displayed||[]).length*2400;state.bank+=visitorIncome;if(visitorIncome)log('🏛️','دخل المتحف السنوي','جاء '+cash(visitorIncome)+' من الزوار بفضل المقتنيات المعروضة.','good');}if(rentIncome>0){state.bank+=rentIncome;log('🏠','دخل إيجار سنوي','دخل لك '+cash(rentIncome)+' من تأجير العقارات.','good');}
 if(state.debt>0){const interest=Math.max(100,Math.round(state.debt*.08));state.debt+=interest;log('🏦','فوائد الديون','زادت ديونك بمقدار '+cash(interest)+' بسبب الفوائد. إجمالي الدين '+cash(state.debt)+'.','bad');}
 if((state.investments||[]).length){let totalGain=0;state.investments.forEach(inv=>{const before=inv.value;let move=inv.kind==='عملات رقمية'?(Math.random()*.9-.35):inv.kind==='أسهم'?(Math.random()*.3-.09):inv.kind==='سندات'?(Math.random()*.08-.02):inv.kind==='مخاطرة عالية'?(Math.random()*.46-.18):(Math.random()*.24-.04);if(inv.strategy==='long')move=move*.62+.008;else if(inv.strategy==='short')move=move*1.2;if(state.investmentAdvisor&&state.investmentAdvisor.hired)move=move>=0?move*1.08:move*.72;inv.value=Math.max(0,Math.round(inv.value*(1+move)));totalGain+=inv.value-before;});if(totalGain)log('📈','تقرير الاستثمارات',(totalGain>=0?'استثماراتك زادت بقيمة ':'استثماراتك خسرت بقيمة ')+cash(Math.abs(totalGain))+'. السوق بيتحرك صعودًا وهبوطًا. ',totalGain>=0?'good':'bad');}
 if(state.business)simulateBusinessEntityYear(state.business,'business');
 (state.companies||[]).forEach(company=>simulateBusinessEntityYear(company,'portfolio'));
 if((state.pets||[]).length){const care=state.pets.length*350;state.bank-=care;state.pets.forEach(p=>{p.age=(p.age||0)+1;p.happiness=clamp((p.happiness||70)+(chance(.7)?3:-6));p.health=clamp((p.health||70)-(p.age>10?2:0)+(p.happiness>40&&chance(.5)?1:-1));});const lost=state.pets.filter(p=>(p.species==='طائر'?p.age>19:p.age>15)&&chance(.35));if(lost.length){state.pets=state.pets.filter(p=>!lost.includes(p));lost.forEach(p=>log('🐾','وداع صديق','توفي '+p.name+' بعد سنوات من الرفقة. ستفضل ذكراه جزءًا من حكايتك.','bad'));}if(state.bank<0)log('🐾','مصاريف الحيوانات','رعاية الحيوانات كلفتك '+cash(care)+' هذا العام.','bad');}
 if((state.hobbies||[]).length&&chance(.7)){state.stats.happiness=clamp(state.stats.happiness+1);if(state.hobbies.some(h=>h.id==='reading'||h.id==='writing'))state.stats.smart=clamp(state.stats.smart+1);}
 if(state.partner){const loyalty=clamp(state.partner.loyalty??55),reliability=clamp(state.partner.reliability??55),generosity=clamp(state.partner.generosity??50),petulance=clamp(state.partner.petulance??50),jealousy=clamp(state.partner.jealousy??40);const stability=clamp(36+loyalty*.22+reliability*.20+generosity*.12-petulance*.16-jealousy*.10+(state.partner.personality==='حنون'?8:0),8,92);const drift=state.partner.relationshipLevel<35?-3:(chance(stability/100)?1:-1);state.partner.relationshipLevel=clamp((state.partner.relationshipLevel||50)+drift);if(jealousy>=75&&state.partner.relationshipLevel<45&&chance(.12)){state.partner.relationshipLevel=clamp(state.partner.relationshipLevel-3);stat('happiness',-2);log('💬','غيرة وسوء تفاهم','الغيرة العالية عند '+state.partner.name+' سببت سوء تفاهم محتاج حوارًا وطمأنة.','bad');}if(state.married&&state.partner.relationshipLevel<15&&chance(clamp(10+petulance*.20+jealousy*.28,10,70)/100)){state.married=false;log('💔','أزمة زوجية','الخلافات زادت بينك وبين '+state.partner.name+'. محتاجين حوار واهتمام قبل ما العلاقة تنهار.','bad');}}
 if(state.specialCareer){const income=Math.round((state.specialCareer.income||0)*(0.6+(state.fame||0)/120)*specialCareerIncomeMultiplier());if(income>0){state.bank+=income;log('🌟','دخل من الشهرة','جالك دخل بقيمة '+cash(income)+' من مسارك في '+state.specialCareer.title+'.','good');}state.fame=clamp((state.fame||0)+(chance(.6)?2:-1));}
 if(state.specialCareer&&state.specialCareer.id==='esports'&&state.esportsCareer){const esports=ensureEsportsCareer();if(esports.sponsor&&esports.sponsorYears>0){const payout=Math.max(0,Math.round((Number(esports.sponsorAnnualIncome)||0)*specialCareerIncomeMultiplier()));state.bank+=payout;esports.sponsorYears--;log('🤝','دخل رعاية الألعاب الإلكترونية','استلمت '+cash(payout)+' من عقد الرعاية مع '+esports.sponsor+'.','good');if(esports.sponsorYears===0){log('📄','انتهاء عقد الرعاية','انتهى عقد الرعاية مع '+esports.sponsor+'. تقدر تتفاوض على عقد جديد.');esports.sponsor=null;esports.sponsorAnnualIncome=0;}}}
 if(state.socialMediaAccount&&(state.socialMediaPosts||0)>0){const base=Math.round((state.followers||0)*(.025+Math.random()*.12));const organic=base+Math.floor(Math.random()*(8+Math.max(1,state.fame)*2));state.followers=Math.max(0,(state.followers||0)+organic);if(organic>0&&chance(.7))log('📱','نمو المتابعين','زاد جمهورك على السوشيال ميديا بمقدار '+fmt(organic)+' متابع.','good');if(state.followers>=10000)achievement('وصلت إلى عشرة آلاف متابع');}
 if(state.age>=18&&state.bank<0){state.debt+=Math.min(20000,Math.abs(state.bank)*.12);}
 if(state.age>=3){
   state.stats.health=clamp(state.stats.health+(chance(.5)?1:-1)+(state.age>55?-2:0));
   state.stats.happiness=clamp(state.stats.happiness+(chance(.5)?2:-1));
   if(state.age>45)state.stats.looks=clamp(state.stats.looks-1);
 }
 if(state.education.yearsLeft>0){
   if(state.education.prepaidYear===true){
     state.education.prepaidYear=false;state.education.yearsLeft--;state.stats.smart=clamp(state.stats.smart+3);
     log('🎓','سنة جامعية جديدة','أنهيت سنة من دراسة '+state.education.major+'. المتبقي '+state.education.yearsLeft+' سنوات.','special');
   }else if(state.bank>=state.education.tuition){
     state.bank-=state.education.tuition;flash('-'+cash(state.education.tuition),true);state.education.yearsLeft--;state.stats.smart=clamp(state.stats.smart+3);
     log('🎓','سنة جامعية جديدة','دفعت رسوم سنة وأنهيت سنة من دراسة '+state.education.major+'. المتبقي '+state.education.yearsLeft+' سنوات.','special');
   }else{
     log('⚠️','تعثر دراسي','الرصيد مش كافي لدفع رسوم السنة. الدراسة اتوقفت مؤقتًا، والسنة هتفضل مستحقة لحد ما تقدر تدفع.','bad');
   }
   if(state.education.yearsLeft===0&&state.education.major){
     const graduatedMajor=majors.find(m=>m.title===state.education.major);state.education.level=graduatedMajor?graduatedMajor.edu:5;
     state.education.school='خريج '+state.education.major;
     log('🎓','اتخرجت من الجامعة','أنهيت دراسة '+state.education.major+'. فرص جديدة بقت متاحة ليك.','good');
     achievement('التخرج من '+state.education.major);
   }
 }
 if(state.age===6){state.education.level=Math.max(state.education.level,1);state.education.school='المدرسة الابتدائية';log('🏫','أول يوم مدرسة','بدأت رحلتك في المدرسة الابتدائية. هتتعلم حاجات كتير وتكوّن صداقات.','special');achievement('بدأت التعليم الابتدائي');}
 if(state.age===12){state.education.school='المرحلة الإعدادية';log('📚','مرحلة جديدة','خلصت المرحلة الابتدائية وبدأت الإعدادي. اختياراتك الدراسية هتبدأ تفرق أكتر.','special');}
 if(state.age===15){state.education.school='المرحلة الثانوية';log('🎒','الثانوية العامة','دخلت مرحلة مهمة؛ حاول توازن بين المذاكرة وصحتك.','special');}
 if(state.age===18){state.education.school='خريج ثانوية';log('🎓','نهاية مرحلة وبداية التانية','خلصت سنين المدرسة. قدامك الجامعة أو الشغل أو سنة راحة.','special');achievement('أنهيت التعليم المدرسي');}
 if(state.age===60&&!state.retired){state.retired=true;if(state.job){archiveCurrentJob('تقاعد');log('🌅','التقاعد','وصلت لسن التقاعد. حان وقت الراحة والاستمتاع باللي بنيته.','special');state.job=null;}achievement('وصلت لمرحلة التقاعد');}
 if(state.age===60)log('🌅','ستون سنة من الحكايات','وصلت لمرحلة جديدة. اهتم بصحتك وعلاقاتك وخططك للسنين الجاية.','special');
 if(state.age>=65&&chance(.12))state.stats.health=clamp(state.stats.health-5);
 state.wealthPeak=Math.max(state.wealthPeak,state.bank);render();save();
 if(state.stats.health<=0){death('تدهور الحالة الصحية');return;}
 let risk=state.age>95?.2:state.age>90?.12:state.age>85?.06:state.age>80?.025:0;
 if((risk&&chance(risk))||state.age>105){death(state.age>105?'نهاية رحلة طويلة':'أسباب طبيعية بعد عمر طويل');return;}
 if(state.age===18){age18Choice();return;}
 randomEvent();
}

function ageUp(){
 if(!validState())return;
 if(state.combatCareer&&state.combatCareer.pendingBout){
  const activeCombat=ensureCombatCareer();
  if(activeCombat&&activeCombat.pendingBout){info('🥊','النزال لم ينتهِ','كمّل الجولات الثلاث أو افتح مسيرة القتال لاستكمال الجولة المحفوظة قبل التقدم لسنة جديدة.');return;}
 }
 const snapshot=JSON.parse(JSON.stringify(state)),logLength=Array.isArray(snapshot.log)?snapshot.log.length:0;delete snapshot.timeMachineSnapshots;delete snapshot.log;
 // Near the rolling-log limit, keep an exact checkpoint so rewind cannot include future events.
 const logSnapshot=logLength>=280&&Array.isArray(state.log)?JSON.parse(JSON.stringify(state.log)):null;
 if(!Array.isArray(state.timeMachineSnapshots))state.timeMachineSnapshots=[];
 const checkpoint={snapshotVersion:1,logLength,state:snapshot};if(logSnapshot)checkpoint.logSnapshot=logSnapshot;
 state.timeMachineSnapshots.push(JSON.stringify(checkpoint));const historyLimit=perkOwned('expandedTime')?60:8;if(state.timeMachineSnapshots.length>historyLimit)state.timeMachineSnapshots.splice(0,state.timeMachineSnapshots.length-historyLimit);
 logBatchDepth++;
 try{advanceAge();}
 finally{
  logBatchDepth=Math.max(0,logBatchDepth-1);
  if(logBatchDepth===0&&logBatchDirty){logBatchDirty=false;renderFeed();save();}
 }
}
function age18Choice(){
 modal('🎓','وبعد المدرسة؟','عندك 18 سنة. تختار تبدأ إزاي؟ مفيش طريق واحد صح، وكل اختيار له تكلفة وفرص مختلفة.',[
 choice('🏛️','أقدّم على الجامعة','اختار تخصص يناسب مستواك وميزانيتك.',()=>{closeModal();university(true);}),
 choice('💼','أدور على شغل','ابدأ تكسب خبرة وفلوس.',()=>{closeModal();career();}),
 choice('🌤️','آخد سنة راحة','أرتّب أهدافي وأهتم بنفسي.',()=>{closeModal();stat('happiness',4);log('🌤️','سنة لإعادة الترتيب','اخدت وقت تراجع أهدافك وتفكر في الخطوة الجاية.','special');render();randomEvent();})
 ],false);
}
function death(cause){
 dead=true;state.status='متوفى';state.cause=cause;const archived=archiveLife();save();render();
 if(activeDialogKeyHandler){document.removeEventListener('keydown',activeDialogKeyHandler);activeDialogKeyHandler=null;}
 const assetValue=state.assets.reduce((sum,a)=>sum+a.value,0),investmentValue=(state.investments||[]).reduce((sum,a)=>sum+(a.value||0),0),net=state.bank+assetValue+investmentValue-(state.debt||0);
 const achievements=state.accomplishments.length?state.accomplishments.map(a=>'• '+esc(a)).join('<br>'):'لسه مفيش إنجازات مسجلة، بس كل حياة ليها حكايتها.';
 const archiveWarning=archived?'':'<div class="listitem" role="alert" style="text-align:right;border:1px solid #b45309;background:rgba(180,83,9,.08)">تعذر حفظ ملخص الحياة في المقبرة بسبب مشكلة في التخزين. لن نبدأ حياة جديدة أو ننقل الإرث قبل نجاح الحفظ؛ صدّر نسخة احتياطية كاملة، وفّر مساحة ثم أعد المحاولة.</div>';
 $('modalRoot').innerHTML='<div class="overlay death-overlay"><section class="modal" id="deathDialog" role="dialog" aria-modal="true" aria-labelledby="deathDialogTitle" aria-describedby="deathDialogDescription" tabindex="-1"><div class="death"><div class="tomb" aria-hidden="true">🪦</div><div class="deathtitle" id="deathDialogTitle" role="heading" aria-level="1">انتهت حكاية '+esc(state.name)+'</div><div class="deathsub" id="deathDialogDescription">عشت '+fmt(state.age)+' سنة.<br>سبب الوفاة: '+esc(cause)+'.<br>شريط حياتك: '+esc(lifeRibbon())+'.<br>كل قرار ساب أثر، وكل سنة كانت فصل من قصتك.</div><div class="summarygrid"><div class="summarycell"><div class="summarylabel">الثروة النهائية</div><div class="summaryvalue">'+cash(net)+'</div></div><div class="summarycell"><div class="summarylabel">العمر</div><div class="summaryvalue">'+fmt(state.age)+' سنة</div></div><div class="summarycell"><div class="summarylabel">إنجازات</div><div class="summaryvalue">'+fmt(state.accomplishments.length)+'</div></div><div class="summarycell"><div class="summarylabel">الأصول</div><div class="summaryvalue">'+fmt(state.assets.length)+'</div></div></div>'+archiveWarning+'<div class="listitem" style="text-align:right"><div class="listtitle">محطات من حياتك</div><div class="muted" style="margin-top:8px;line-height:2">'+achievements+'</div></div><button class="primarybtn" id="newLifeBtn">🌱 حياة جديدة</button>'+((state.timeMachineSnapshots||[]).length?'<button class="smallbtn" id="timeMachineDeathBtn" style="width:100%;margin-top:8px">⏳ تراجع عن سنة قاتلة</button>':'')+(state.children.length?'<div class="muted" style="margin:8px 0">كمّل إرث العائلة:</div>'+state.children.map((c,i)=>'<button class="smallbtn" data-heir="'+i+'" style="width:100%;margin:4px 0">🌳 استكمل كـ '+esc(c.name)+'</button>').join(''):'')+'<button class="smallbtn" id="reviewBtn" style="width:100%;margin-top:9px">راجع دفتر حياتك</button></div></section></div>';
 $('newLifeBtn').addEventListener('click',()=>{closeModal();if(confirm('تبدأ حياة جديدة وتستبدل الحفظ الحالي؟'))newLifeSetup();});
 $('reviewBtn').addEventListener('click',closeModal);
 const rewindDeathBtn=$('timeMachineDeathBtn');if(rewindDeathBtn)rewindDeathBtn.addEventListener('click',timeMachineMenu);
 $('modalRoot').querySelectorAll('[data-heir]').forEach(btn=>btn.addEventListener('click',()=>startAsChild(Number(btn.dataset.heir))));
 const dialog=$('deathDialog');
 if(dialog){
  const getFocusable=()=>Array.from(dialog.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])')).filter(element=>element.getClientRects().length>0&&element.getAttribute('aria-hidden')!=='true');
  activeDialogKeyHandler=event=>{
   if(event.key!=='Tab')return;
   const focusable=getFocusable();
   if(!focusable.length){event.preventDefault();dialog.focus();return;}
   const first=focusable[0],last=focusable[focusable.length-1];
   if(event.shiftKey&&(document.activeElement===first||document.activeElement===dialog||!dialog.contains(document.activeElement))){event.preventDefault();last.focus();}
   else if(!event.shiftKey&&(document.activeElement===last||document.activeElement===dialog||!dialog.contains(document.activeElement))){event.preventDefault();first.focus();}
  };
  document.addEventListener('keydown',activeDialogKeyHandler);
  try{dialog.focus({preventScroll:true});}catch(e){dialog.focus();}
 }
}
function startNew(){
 if(state&&(Number(state.age)>0||state.status==='متوفى')&&!archiveLife('بدأ حياة جديدة')){
  info('⚠️','الحياة السابقة لم تُحفظ','لم نبدأ حياة جديدة حتى لا نفقد ملخص حياتك الحالية. صدّر نسخة احتياطية كاملة، وفّر مساحة تخزين ثم حاول مرة أخرى.');
  return;
 }
 state=newLife();dead=false;
 log('👶','أول يوم في الدنيا','اتولدت في '+state.place.city+'، '+state.place.country+'. أهلك '+state.family[0].name+' و'+state.family[1].name+' بيبدأوا معاك أول فصل في الحكاية.','special');
 log('🏡','البيت والعيلة','أبوك شغال '+state.family[0].personality+'، وأمك '+state.family[1].personality+'. العيلة هي أول شبكة أمان ليك.');
 achievement('بدأت رحلة الحياة');render();
}
function goldenDiplomaMenu(){
 if(!perkOwned('goldenDiploma')){closeModal();info('🎓','الشهادة الذهبية مقفولة','افتحها من متجر مزايا حياة.');return;}
 if(state.age<18){closeModal();info('🔒','لسه بدري','الشهادة الذهبية متاحة بعد إنهاء الثانوية في سن 18.');return;}
 const options=majors.map(m=>choice(m.emoji,'شهادة في '+m.title,'تخرج فوري دون رسوم أو سنوات انتظار.',()=>grantGoldenDiploma(m)));
 options.push(choice('↩️','رجوع للدراسة','',schoolHub));
 modal('🎓','الشهادة الذهبية','اختار أي تخصص متاح. ستحصل فورًا على شهادة جامعية ودراسات عليا محسوبة في متطلبات الوظائف.',options);
}
function grantGoldenDiploma(major){
 closeModal();if(!perkOwned('goldenDiploma')||state.age<18){info('🔒','الشهادة غير متاحة','استخدم الشهادة بعد إنهاء الثانوية.');return;}
 state.education=state.education||{level:0,school:'خريج ثانوية',major:null,yearsLeft:0,tuition:0};
 state.education.level=6;state.education.major=major.title;state.education.yearsLeft=0;state.education.tuition=0;state.education.prepaidYear=false;state.education.droppedOut=false;state.education.school='خريج دراسات عليا · '+major.title;state.education.degree='دراسات عليا';state.stats.smart=clamp(state.stats.smart+8);achievement('الشهادة الذهبية: '+major.title);
 log('🎓','الحصول على الشهادة الذهبية','حصلت فورًا على شهادة دراسات عليا في '+major.title+' دون رسوم أو انتظار.','special');save();render();info('🎓','مبروك الشهادة','مستوى التعليم أصبح 6، وأصبحت مؤهلًا للوظائف التي تتطلب شهادة جامعية أو أعلى.');
}
function schoolHub(){
 const education=state.education||(state.education={level:0,school:'School',major:null,yearsLeft:0,tuition:0});
 if(!Array.isArray(education.clubs))education.clubs=[];
 if(!Array.isArray(education.cliques))education.cliques=[];
 const isUniversity=(education.yearsLeft||0)>0&&!education.droppedOut;
 const name=isUniversity?'University':state.age>=15?'High School':state.age>=12?'Middle School':'Primary School';
 const grades=clamp(education.studyScore===undefined?50:education.studyScore);
 const popularity=clamp(education.popularity===undefined?18:education.popularity);
 const options=[];
 const universityRow=choice('🏛️',name,'Grades',()=>{closeModal();isUniversity?universityStatusMenu():university(false);},'',grades);
 universityRow.menuDots=true;options.push(universityRow);
 const diploma=choice('📜','Golden Diploma','Become an overnight expert in the field of your dreams!',()=>{closeModal();perkOwned('goldenDiploma')?goldenDiplomaMenu():showJobPackOffer('goldenDiploma');});
 diploma.menuDots=true;options.push(diploma);
 options.push(section('Activities'));
 options.push(choice('⚽','Activities','Join an extracurricular activity',schoolClubs));
 options.push(choice('✏️','Class','Popularity',schoolClassMenu,'',popularity));
 options.push(choice('🤓','Cliques','Join a school clique',schoolCliqueMenu));
 const leave=choice('👋',education.droppedOut?'Return to School':isUniversity?'Drop Out of university':'Drop Out of School',education.droppedOut?'Return to your education path':isUniversity?'Drop out of university':'Drop out of school',education.droppedOut?()=>{
  closeModal();education.droppedOut=false;education.school=state.age<12?'Primary School':state.age<15?'Middle School':state.age<18?'High School':'University';
  log('🎓','Back to school','You decided to return to your education.','good');save();render();schoolHub();
 }:dropOutConfirm);
 leave.menuDots=true;options.push(leave);
 options.push(choice('👩‍🏫','Faculty','Interact with your teachers',schoolFacultyMenu));
 const skip=choice('🤫','Skip School','Skip class and do something else',skipSchool);skip.menuDots=true;options.push(skip);
 const study=choice('📚','Study Harder','Put in some extra effort',()=>{
  closeModal();if(education.droppedOut){info('🚪','You left school','Return to school before studying.');return;}
  education.studyScore=clamp((education.studyScore===undefined?50:education.studyScore)+12);education.popularity=clamp((education.popularity===undefined?18:education.popularity)-1);
  stat('smart',4);stat('happiness',-1);log('📚','Study session','You studied hard. Your grade is now '+education.studyScore+'%.','good');save();render();info('📚','Study pays off','Your smarts improved and your grades are now '+education.studyScore+'%.');
 });
 study.menuDots=true;options.push(study);
 if(isUniversity)options.push(choice('🎓','Major',(education.major||'Undeclared')+' · '+education.yearsLeft+' years remaining',()=>universityStatusMenu()));
 options.push(choice('↩️','Back','Return to your current life.',()=>{closeModal();showCareer();}));
 modal('🎓','School',isUniversity?'University · '+(education.major||'Undeclared')+' · '+education.yearsLeft+' years remaining':'Your education and school activities.',options);
}
function universityStatusMenu(){
 const education=state.education||(state.education={}),grade=clamp(education.studyScore===undefined?50:education.studyScore);
 modal('🏛️','University','Major: '+(education.major||'Undeclared')+' · '+(education.yearsLeft||0)+' years remaining · annual tuition '+cash(education.tuition||0)+'.',[
  choice('📚','Study Harder','Improve grades and smarts.',()=>{closeModal();education.studyScore=clamp(grade+12);stat('smart',4);stat('happiness',-1);log('📚','University study','You studied for your major and improved your grades.','good');save();render();schoolHub();}),
  choice('⚽','Extracurricular Activities','Join a campus activity.',schoolClubs),
  choice('👩‍🏫','Faculty','Ask a teacher for advice.',schoolFacultyMenu),
  choice('👋','Drop Out of university','Leave your current program.',dropOutConfirm),
  choice('↩️','Back to School','',()=>{closeModal();schoolHub();})
 ]);
}
function schoolClassMenu(){
 const education=state.education||(state.education={});
 if(education.droppedOut){info('🚪','School is inactive','Return to school before interacting with your class.');return;}
 const popularity=clamp(education.popularity===undefined?18:education.popularity);
 modal('✏️','Class','Popularity · '+popularity+'%',[
  choice('👋','Talk to classmates','Build friendships and school popularity.',()=>{
   closeModal();education.popularity=clamp(popularity+5);
   if(state.friends.length){const friend=pick(state.friends);friend.relationshipLevel=clamp((friend.relationshipLevel||50)+5);stat('happiness',2);log('🧑‍🤝‍🧑','Class time','You spent time talking with '+friend.name+'.','good');}
   else{const friend=makePerson(pick(['male','female']),'Classmate','🧑',state.age,45+Math.floor(Math.random()*45));state.friends.push(friend);log('🧑‍🤝‍🧑','New classmate','You made friends with '+friend.name+'.','good');}
   save();render();schoolHub();
  }),
  choice('🎭','Join a school event','Take part in class life.',()=>{closeModal();education.popularity=clamp(popularity+8);stat('happiness',3);if(chance(.25))stat('smart',1);log('🎭','School event','You joined a school event and became a little more popular.','good');save();render();schoolHub();}),
  choice('📖','Focus on class','Small grade boost.',()=>{closeModal();education.studyScore=clamp((education.studyScore===undefined?50:education.studyScore)+4);stat('smart',2);log('📖','Focused in class','You paid attention and improved your grades.','good');save();render();schoolHub();}),
  choice('↩️','Back to School','',()=>{closeModal();schoolHub();})
 ]);
}
function schoolCliqueMenu(){
 const education=state.education||(state.education={});if(!Array.isArray(education.cliques))education.cliques=[];
 if(education.droppedOut){info('🚪','School is inactive','Return to school before joining a clique.');return;}
 const catalog=[
  {id:'sports',title:'Sports Clique',emoji:'⚽',desc:'Athletes and school competitions.'},
  {id:'nerds',title:'Nerds',emoji:'🤓',desc:'Study groups and science.'},
  {id:'popular',title:'Popular Kids',emoji:'😎',desc:'Social events and a wider school circle.'},
  {id:'artists',title:'Arts Clique',emoji:'🎭',desc:'Music, drama and creative projects.'}
 ];
 const opts=catalog.map(item=>{const joined=education.cliques.includes(item.id);return choice(item.emoji,(joined?'Spend time with ':'Join ')+item.title,item.desc+(joined?' · Already joined.':''),()=>{
  closeModal();if(!education.cliques.includes(item.id)){education.cliques.push(item.id);education.popularity=clamp((education.popularity===undefined?18:education.popularity)+5);achievement('Joined the '+item.title+' clique');}
  if(item.id==='sports'){stat('health',2);stat('happiness',2);}if(item.id==='nerds')stat('smart',3);if(item.id==='popular')stat('happiness',4);if(item.id==='artists')stat('looks',1);
  log(item.emoji,'School Clique',(joined?'You spent time with the ':'You joined the ')+item.title+'.','good');save();render();info(item.emoji,joined?'Clique time':'Joined the clique',item.title+' · School popularity '+clamp(education.popularity===undefined?18:education.popularity)+'%.');
 },'',null,joined);});
 opts.push(choice('↩️','Back to School','',()=>{closeModal();schoolHub();}));
 modal('🤓','Cliques','Choose a group that matches your interests.',opts);
}
function schoolFacultyMenu(){
 const education=state.education||(state.education={}),relation=clamp(education.teacherRelationship===undefined?35:education.teacherRelationship);
 modal('👩‍🏫','Faculty','Teacher relationship · '+relation+'%',[
  choice('💬','Ask for advice','Get feedback on your grades and study habits.',()=>{closeModal();education.teacherRelationship=clamp(relation+5);education.studyScore=clamp((education.studyScore===undefined?50:education.studyScore)+4);stat('smart',2);log('👩‍🏫','Teacher advice','A teacher gave you some useful guidance.','good');save();render();schoolHub();}),
  choice('👏','Compliment a teacher','A respectful compliment may improve your rapport.',()=>{closeModal();education.teacherRelationship=clamp(relation+(chance(.8)?6:-2));stat('happiness',1);log('👏','Faculty interaction','You spoke with one of your teachers.','good');save();render();info('👩‍🏫','Faculty','Teacher relationship is now '+education.teacherRelationship+'%.');}),
  choice('📝','Ask to review a grade','A respectful review may raise a recent grade.',()=>{closeModal();if(chance(.52)){education.studyScore=clamp((education.studyScore===undefined?50:education.studyScore)+5);log('📝','Grade reviewed','Your teacher reviewed your work and adjusted your grade.','good');}else{education.teacherRelationship=clamp(relation-1);log('📝','Grade review','Your teacher kept the original grade.');}save();render();schoolHub();}),
  choice('↩️','Back to School','',()=>{closeModal();schoolHub();})
 ]);
}
function skipSchool(){
 const education=state.education||(state.education={});closeModal();
 if(education.droppedOut){info('🚪','School is inactive','Return to your education path before skipping classes.');return;}
 education.absences=clamp((education.absences||0)+1,0,1000);education.studyScore=clamp((education.studyScore===undefined?50:education.studyScore)-5);
 stat('happiness',chance(.5)?2:-1);
 if(education.absences>=3&&chance(.35)){education.popularity=clamp((education.popularity===undefined?18:education.popularity)+4);log('🤫','Skipped class','You skipped another class. Your grades slipped, but you had more time for yourself.');}
 else log('🤫','Skipped class','You skipped a class. Your grades fell to '+education.studyScore+'%.');
 save();render();info('🤫','Class skipped','Missed classes: '+education.absences+' · Grades: '+education.studyScore+'%. Repeated absences could affect your education.');
}

function schoolClubs(){
 closeModal();if(state.education&&state.education.droppedOut){info('🚪','School is inactive','Return to your education path before joining clubs.');return;}
 const catalog=[
  {id:'sports',name:'Sports Club',icon:'⚽',effect:'health and teamwork'},
  {id:'science',name:'Science Club',icon:'🔬',effect:'learning and curiosity'},
  {id:'arts',name:'Arts & Drama Club',icon:'🎭',effect:'creativity and happiness'},
  {id:'leadership',name:'Student Council',icon:'🏫',effect:'leadership and relationships'}
 ];
 const choices=catalog.map(c=>{const joined=(state.education.clubs||[]).includes(c.id);return choice(c.icon,joined?'Participate in '+c.name:'Join '+c.name,'Build '+c.effect+'.'+(joined?' You are already a member.':''),()=>{
  closeModal();if(!state.education.clubs)state.education.clubs=[];if(!state.education.clubs.includes(c.id)){state.education.clubs.push(c.id);achievement('Joined '+c.name);}
  if(c.id==='sports'){stat('health',4);stat('happiness',2);}if(c.id==='science'){stat('smart',4);stat('happiness',1);}if(c.id==='arts'){stat('happiness',4);stat('looks',1);}if(c.id==='leadership'){stat('happiness',3);if(state.friends.length)state.friends[0].relationshipLevel=clamp((state.friends[0].relationshipLevel||50)+5);}
  log(c.icon,c.name,joined?'You participated in '+c.name+' and improved your skills.':'You joined '+c.name+' and started building skills outside class.','good');save();render();info(c.icon,joined?'Activity complete':'You joined',c.name+' · '+c.effect+'.');
 },'',null,joined);});
 choices.push(choice('↩️','Back to School','',()=>{closeModal();schoolHub();}));
 modal('🏫','Activities','Choose an extracurricular activity that fits your interests.',choices);
}

function dropOutConfirm(){
 closeModal();
 modal('🚪','تأكيد ترك الدراسة','الانسحاب هيوقف التقدم التعليمي الحالي، وممكن يصعّب التأهل لبعض الوظائف.',[
  choice('🚪','أترك الدراسة','تأكيد الانسحاب من '+(state.education.school||'التعليم')+'.',()=>{
   closeModal();state.education.droppedOut=true;state.education.yearsLeft=0;state.education.school='ترك الدراسة';
   log('🚪','تركت الدراسة','قررت توقف مسارك التعليمي الحالي. تقدر تركز على اكتساب الخبرة والمهارات العملية.','bad');render();info('🚪','تم ترك الدراسة','فرص الوظائف هتتحدد حسب سنك وتعليمك ومهاراتك.');
  }),
  choice('↩️','أتراجع','الاستمرار في الدراسة.',()=>{closeModal();schoolHub();})
 ]);
}
function jobRequirements(job){
 const missing=[];
 if(state.age<job.age)missing.push('العمر المطلوب '+job.age+' سنة (عمرك '+state.age+')');
 if(state.stats.smart<job.smart)missing.push('الذكاء المطلوب '+job.smart+'% (الحالي '+clamp(state.stats.smart)+'%)');
 const educationLevel=Number(state.education&&state.education.level)||0;
 if(educationLevel<job.edu)missing.push('مستوى التعليم المطلوب '+job.edu+' (الحالي '+educationLevel+')');
 return missing;
}
function jobAcceptanceChance(){
 const performance=Number.isFinite(Number(state.performance))?Number(state.performance):50;
 return perkEnabled('goldenResume')?1:(.5+clamp(state.stats.smart)/100*.22+clamp(performance)/100*.15);
}
function jobRankLabel(level){
 return ['مبتدئ','أول','خبير','مشرف','مدير'][clamp(level,1,5)-1];
}
function ensureJobProgress(job,currentAge){
 if(!job||typeof job!=='object'||Array.isArray(job))return null;
 const age=Number.isFinite(Number(currentAge))?Math.max(0,Math.floor(Number(currentAge))):0;
 const originalTitle=String(job.title||'وظيفة');
 const suffixes=['أول','خبير','مشرف','مدير'];
 const matchedSuffix=suffixes.find(suffix=>originalTitle.endsWith(' '+suffix));
 const inferredLevel=matchedSuffix?suffixes.indexOf(matchedSuffix)+2:1;
 if(typeof job.baseTitle!=='string'||!job.baseTitle.trim()){
  job.baseTitle=matchedSuffix?originalTitle.slice(0,-matchedSuffix.length-1).trim():originalTitle;
 }
 if(!Number.isFinite(Number(job.level))||Number(job.level)<1)job.level=inferredLevel;
 job.level=clamp(job.level,1,5);
 if(job.startAge===undefined||job.startAge===null||!Number.isFinite(Number(job.startAge)))job.startAge=age;
 job.startAge=clamp(job.startAge,0,age);
 if(job.roleStartAge===undefined||job.roleStartAge===null||!Number.isFinite(Number(job.roleStartAge))){
  job.roleStartAge=job.level>1?age:job.startAge;
 }
 job.roleStartAge=clamp(job.roleStartAge,0,age);
 job.experienceYears=Math.max(0,age-job.startAge);
 job.yearsInRole=Math.max(0,age-job.roleStartAge);
 if(!Array.isArray(job.promotions))job.promotions=[];
 const suffix=['','أول','خبير','مشرف','مدير'][job.level]||'';
 job.title=job.baseTitle+(suffix?' '+suffix:'');
 return job;
}
function jobPromotionRequirements(job){
 const progress=ensureJobProgress(job,state.age);
 if(!progress)return {years:0,performance:100};
 return {
  years:progress.level===1?2:progress.level===2?3:progress.level===3?4:5,
  performance:progress.level>=4?88:progress.level>=3?82:75
 };
}
function jobPromotionChance(job,manual){
 const progress=ensureJobProgress(job,state.age);
 if(!progress||progress.level>=5||state.age>=60||state.retired)return 0;
 const requirements=jobPromotionRequirements(progress);
 if(progress.yearsInRole<requirements.years||Number(state.performance)<requirements.performance)return 0;
 const educationLevel=Number(state.education&&state.education.level)||0;
 const educationBonus=Math.min(.06,educationLevel*.012);
 const manualBonus=manual ? .10 : 0;
 const chanceValue=.10+(Number(state.performance)-requirements.performance)*.008+clamp(state.stats&&state.stats.smart||0)/100*.07+educationBonus+manualBonus;
 return Math.min(.65,Math.max(.05,chanceValue));
}
function grantJobPromotion(source){
 const job=ensureJobProgress(state.job,state.age);
 if(!job||job.level>=5)return false;
 const fromLevel=job.level,toLevel=fromLevel+1;
 const salaryBefore=Math.max(0,Number(job.salary)||0);
 const raiseRates=[0,0,.14,.13,.12,.11];
 job.level=toLevel;
 job.roleStartAge=state.age;
 job.yearsInRole=0;
 job.salary=Math.round(salaryBefore*(1+(raiseRates[toLevel]||.10)));
 const suffix=['','أول','خبير','مشرف','مدير'][toLevel]||'';
 job.title=job.baseTitle+(suffix?' '+suffix:'');
 job.promotions.push({age:state.age,fromLevel,toLevel,salaryBefore,salaryAfter:job.salary,source:source==='manual'?'طلب شخصي':'تقييم سنوي'});
 if(job.promotions.length>20)job.promotions.splice(0,job.promotions.length-20);
 state.performance=clamp(Number(state.performance||50)+3,20,100);
 log('📈','ترقية مهنية','ترقيت إلى '+job.title+' بعد '+job.experienceYears+' سنة خبرة، وزاد راتبك السنوي إلى '+cash(job.salary)+'.','good');
 achievement('الحصول على ترقية مهنية');
 return true;
}
function requestJobPromotion(){
 closeModal();
 const job=ensureJobProgress(state.job,state.age);
 if(!job)return;
 if(job.level>=5){info('🏅','وصلت لأعلى درجة','وصلت إلى أعلى درجة متاحة في المسار المهني الحالي.');return;}
 const requirements=jobPromotionRequirements(job);
 const missing=[];
 if(job.yearsInRole<requirements.years)missing.push('إكمال '+requirements.years+' سنوات في الدرجة الحالية');
 if(Number(state.performance)<requirements.performance)missing.push('رفع الأداء إلى '+requirements.performance+'% على الأقل');
 if(state.age>=60)missing.push('طلب الترقية قبل سن 60');
 if(state.retired)missing.push('لا يمكن طلب ترقية بعد التقاعد');
 if(missing.length){info('⏳','لسه محتاج تجهّز للترقية',missing.join('، ')+'. استمر في تطوير أدائك واكتساب الخبرة.');return;}
 const odds=jobPromotionChance(job,true);
 if(chance(odds)){
  grantJobPromotion('manual');
  render();save();
  info('🏅','مبروك الترقية','أصبحت '+job.title+'، وراتبك السنوي الجديد '+cash(job.salary)+'.');
 }else{
  log('📋','مراجعة الترقية','مديرك قدّر طلبك، لكنه طلب نتائج أقوى قبل اعتماد الترقية.','');
  render();save();
  info('📋','الترقية اتأجلت','استمر في الأداء الجيد، ويمكنك إعادة المحاولة بعد اكتساب خبرة ونتائج إضافية.');
 }
}
function jobRequirementsMenu(job,requirements){
 const opts=[];
 if((Number(state.education&&state.education.level)||0)<job.edu)opts.push(choice('🎓','التعليم والجامعة','استكشف التخصصات التي ترفع مؤهلك.',()=>{closeModal();university(false);}));
 if(state.stats.smart<job.smart)opts.push(choice('📚','الهوايات والمهارات','طوّر مهاراتك من خلال القراءة والكتابة والممارسة.',()=>{closeModal();hobbiesMenu();}));
 opts.push(choice('↩️','رجوع للوظائف','',()=>{closeModal();showCareer();}));
 modal('🔒','متطلبات '+job.title,'لسه مش مؤهل للتقديم. '+requirements.join('؛ ')+'.',opts);
}

function archiveCurrentJob(reason='استقالة'){
 if(!state.job)return null;
 const current=ensureJobProgress(state.job,state.age);
 if(!current)return null;
 const record={
  id:current.id||null,
  title:current.title,
  baseTitle:current.baseTitle||current.title,
  salary:Math.max(0,Number(current.salary)||0),
  startAge:current.startAge??state.age,
  endAge:state.age,
  level:clamp(current.level||1,1,5),
  experienceYears:Math.max(0,Number(current.experienceYears)||0),
  promotions:Array.isArray(current.promotions)?current.promotions.slice(-20):[],
  exitReason:reason
 };
 state.jobHistory=Array.isArray(state.jobHistory)?state.jobHistory:[];
 state.jobHistory.push(record);
 if(state.jobHistory.length>30)state.jobHistory.splice(0,state.jobHistory.length-30);
 return record;
}
function jobMarketMenu(){
 if(!state.job){showCareer();return;}
 const currentJob=ensureJobProgress(state.job,state.age);
 const opts=jobs.filter(job=>job.id!==currentJob.id).map(job=>{
  const missing=jobRequirements(job),eligible=missing.length===0;
  const details=eligible
   ?job.desc+' فرصة القبول التقديرية '+Math.round(jobAcceptanceChance()*100)+'%. التقديم لا ينهي وظيفتك الحالية إلا بعد قبول العرض.'
   :job.desc+' متطلبات ناقصة: '+missing.join('، ')+'.';
  return choice(job.emoji,job.title,details,()=>eligible?applyJob(job):jobRequirementsMenu(job,missing),cash(job.salary)+'/سنة',null,!eligible);
 });
 opts.push(choice('↩️','العودة إلى مساري الحالي','احتفظ بوظيفتك الحالية كما هي.',()=>{closeModal();showCareer();}));
 modal('🔎','فرص عمل جديدة','وظيفتك الحالية: '+currentJob.title+'. إذا لم يُقبل طلبك ستظل في عملك الحالي دون تغيير.',opts);
}
function showCareer(){
 if(state.age<6){info('📚','لسه بدري','التعليم التفاعلي يبدأ في سن المدرسة. دلوقتي تقدر تتابع أحداث الطفولة وتتقدم بالعمر.');return;}
 if(state.job)ensureJobProgress(state.job,state.age);
 if(!state.job&&(state.age<18||state.education.yearsLeft>0)&&!state.retired){schoolHub();return;}
 if(state.job){
  const opts=[
   ...(state.education.yearsLeft>0? [choice('🎓','الجامعة والدراسة','تابع الدراسة والأنشطة الجامعية بالتوازي مع العمل.',()=>{closeModal();schoolHub();})] : []),
   choice('🌟','المهن الخاصة والشهرة','مسار إضافي بجانب وظيفتك التقليدية.',specialCareers),
   choice('🔎','استكشاف فرص عمل','قارن مسارات أخرى وقدّم على وظيفة جديدة دون ترك عملك الحالي قبل قبول العرض.',()=>{closeModal();jobMarketMenu();}),
   choice('🏅','طلب ترقية','الدرجة '+jobRankLabel(state.job.level)+' · الخبرة '+state.job.experienceYears+' سنة · في الدرجة الحالية '+state.job.yearsInRole+' سنة.',requestJobPromotion),
   choice('📚','سجل الوظائف السابقة','راجع الوظائف التي تركتها أو انتقلت منها.',()=>{closeModal();const records=(state.jobHistory||[]).map(j=>choice('💼',j.title,(j.startAge??'?')+'–'+(j.endAge??'؟')+' سنة · الراتب '+cash(j.salary)+(j.exitReason?' · '+j.exitReason:''),()=>{closeModal();info('💼',j.title,'وظيفة سابقة في سجل حياتك.');}));modal('📚','التاريخ الوظيفي','مسار العمل خلال حياتك.',records.length?records:[choice('📚','لا توجد وظائف سابقة','سيظهر السجل بعد تغيير وظيفة أو الاستقالة.',closeModal)]);}),
   choice('📈','طلب علاوة','أداءك الحالي '+state.performance+'%.',()=>{
    closeModal();
    if(state.performance<58){state.performance=clamp(state.performance+4);log('🗣️','مناقشة مع المدير','مديرك طلب منك تحسن الأداء شوية قبل زيادة المرتب.');info('🗣️','مش دلوقتي','حافظ على أداءك واطلب تاني بعد فترة.');return;}
    if(chance(.62)){const inc=Math.round(state.job.salary*.12);state.job.salary+=inc;state.performance=clamp(state.performance+5);log('🎉','علاوة في المرتب','وافق مديرك على علاوة سنوية '+cash(inc)+'.','good');info('🎉','مبروك العلاوة','مرتبك السنوي الجديد '+cash(state.job.salary)+'.');}else{state.performance=clamp(state.performance+2);log('🗣️','لسه بدري على العلاوة','مديرك طلب نتائج إضافية قبل الزيادة.');info('🗣️','المرة الجاية','استمر على نفس المستوى وجرب بعد فترة.');}render();
   }),
   choice('🧰','تطوير الأداء','تدريب يرفع فرص الترقية مقابل 1,200 '+state.place.unit+'.',()=>{closeModal();if(state.bank<1200){info('💳','الرصيد مش كفاية','التدريب يكلف 1,200 '+state.place.unit+'.');return;}state.bank-=1200;state.performance=clamp(state.performance+14);stat('smart',2);log('🧰','تدريب مهني','دفعت 1,200 '+state.place.unit+' في تدريب زوّد أداءك ومهاراتك.','good');render();},cash(1200)),
   choice('🚪','الاستقالة','تسيب شغلك وتفقد الدخل السنوي.',()=>{closeModal();info('🚪','تأكيد الاستقالة','متأكد إنك عايز تسيب '+state.job.title+'؟',[choice('✓','أيوه، أستقيل','',()=>{closeModal();archiveCurrentJob('استقالة');state.job=null;state.performance=50;log('🚪','استقالة','سيبت شغلك وبدأت تدور على الخطوة التالية.');render();showCareer();}),choice('↩️','أتراجع','',closeModal)]);})
  ];
  modal('💼','الدراسة والشغل','شغلك الحالي: '+state.job.title+' — الدرجة '+jobRankLabel(state.job.level)+' — الخبرة '+state.job.experienceYears+' سنة — الأداء '+state.performance+'%.',opts,true,'<div class="muted performance-summary">مستوى الأداء · '+state.performance+'%</div><div class="progressline"><div style="width:'+clamp(state.performance)+'%"></div></div>');return;
 }
 let intro='مفيش شغل حاليًا. الوظائف بتتغير حسب سنك وتعليمك ومستوى ذكاءك.';
 const opts=jobs.map(j=>{
  const missing=jobRequirements(j),eligible=missing.length===0;
  const details=eligible?j.desc+' فرصة القبول التقديرية '+Math.round(jobAcceptanceChance()*100)+'%.':j.desc+' متطلبات ناقصة: '+missing.join('، ')+'.';
  return choice(j.emoji,j.title,details,()=>eligible?applyJob(j):jobRequirementsMenu(j,missing),cash(j.salary)+'/سنة',null,!eligible);
 });
 if(!jobs.some(j=>jobRequirements(j).length===0))intro+=' الوظائف المقفولة بتوضح لك الشروط الناقصة عشان تخطط للخطوة الجاية.';
 opts.push(choice('🎓','التعليم والجامعة','اختار تخصصًا يفتح فرصًا جديدة.',()=>{closeModal();university(false);}));
 if(perkOwned('goldenDiploma')&&state.age>=18)opts.push(choice('📜','الدراسة والشهادة الذهبية','افتح قائمة التعليم واستخدم الشهادة الفورية.',()=>{closeModal();schoolHub();}));
 opts.push(choice('🌟','المهن الخاصة والشهرة','التمثيل والموسيقى والمحتوى والرياضة والكتابة والإخراج.',specialCareers));
 if((state.jobHistory||[]).length)opts.push(choice('📚','سجل الوظائف السابقة','عدد الوظائف السابقة '+state.jobHistory.length+'.',()=>{closeModal();const records=state.jobHistory.map(j=>choice('💼',j.title,'الراتب '+cash(j.salary)+' · بداية '+j.startAge+' سنة'+(j.exitReason?' · '+j.exitReason:''),()=>{closeModal();info('💼',j.title,'وظيفة سابقة في سجل حياتك.');}));modal('📚','التاريخ الوظيفي','كل وظيفة تركت أثرًا في المسار المهني.',records);}));
 modal('💼','الدراسة والشغل',intro,opts);
}

function applyJob(job){
 closeModal();
 if(!job||typeof job!=='object')return;
 if(state.age<job.age||state.stats.smart<job.smart||state.education.level<job.edu){info('🔒','لسه مش مؤهل','الوظيفة محتاجة سنًا أو تعليمًا أو مهارات أعلى.');return;}
 const previousJob=state.job?ensureJobProgress(state.job,state.age):null;
 const previousPerformance=Number.isFinite(Number(state.performance))?Number(state.performance):50;
 const success=jobAcceptanceChance();
 if(chance(success)){
  if(previousJob)archiveCurrentJob('انتقال مهني');
  state.job={id:job.id,title:job.title,baseTitle:job.title,salary:job.salary,startAge:state.age,roleStartAge:state.age,level:1,yearsInRole:0,experienceYears:0,promotions:[]};
  state.jobHistory=Array.isArray(state.jobHistory)?state.jobHistory:[];
  state.performance=previousJob?clamp(Math.round(previousPerformance*.85+7.5),20,100):clamp(50+Math.floor(state.stats.smart/8));
  state.retired=false;
  if(perkEnabled('hollywoodStar'))state.fame=100;
  if(previousJob){
   log('💼','انتقال مهني ناجح','انتقلت من '+previousJob.title+' إلى '+job.title+' براتب سنوي '+cash(job.salary)+'. تم حفظ مسارك السابق في السجل.','good');
   info('🎉','مبروك الانتقال','اتقبلت في '+job.title+'. بدأت درجة جديدة مع الاحتفاظ بتاريخك الوظيفي وتقييم أدائك السابق.');
  }else{
   log('💼','اتقبلت في وظيفة جديدة','بدأت شغل '+job.title+' براتب سنوي '+cash(job.salary)+'.','good');
   info('🎉','مبروك الوظيفة','اتقبلت في '+job.title+'. كل سنة هتستلم دخل على قد أداءك.');
  }
  achievement('بدأت العمل: '+job.title);
 }else{
  log('📨','طلب وظيفة','قدمت على '+job.title+' لكنهم اختاروا مرشحًا آخر. جهّز نفسك وحاول تاني.','bad');
  info('📨','المرة الجاية','طوّر مهاراتك وخليك مستمر في التقديم. وظيفتك الحالية لم تتأثر.');
 }
 render();
}

function university(from18){
 if(state.age<18){info('🔒','لسه بدري','تقدر تقدم للجامعة بعد سن 18.');return;}
 if(state.education.yearsLeft>0){info('🎓','أنت طالب جامعي','تخصصك الحالي '+state.education.major+'. المتبقي '+state.education.yearsLeft+' سنوات.');return;}
 const majorOptions=majors.map(m=>'<option value="'+esc(m.id)+'">'+esc(m.title+' — '+m.years+' سنوات — '+cash(m.cost)+' سنويًا')+'</option>').join('');
 const form='<div class="event-form"><label for="majorSelect">اختار تخصصك:</label><select id="majorSelect" data-surpriseable="true">'+majorOptions+'</select><p class="field-note">القبول بيتطلب مستوى ذكاء مناسب ورصيد يغطي رسوم أول سنة.</p></div>';
 const applyMajor=()=>{
  const m=majors.find(item=>item.id===$('majorSelect')?.value);
  if(!m){info('🎓','اختار تخصصك','حدد تخصصًا من القائمة الأول.');return;}
  closeModal();
  if(state.stats.smart<m.min){info('🧠','محتاج تستعد أكتر','التخصص ده محتاج ذكاء '+m.min+'% على الأقل. استخدم المكتبة وطوّر مهاراتك.');return;}
  if(state.bank<m.cost){info('💳','الرسوم مش متاحة','محتاج '+cash(m.cost)+' كبداية. ممكن تبدأ شغل أو تجمع فلوس.');return;}
  state.bank-=m.cost;flash('-'+cash(m.cost),true);state.education.major=m.title;state.education.yearsLeft=m.years;state.education.tuition=m.cost;state.education.prepaidYear=true;state.education.school='جامعة - '+m.title;state.stats.smart=clamp(state.stats.smart+3);log('🏛️','بدأت الجامعة','اتقبلت في '+m.title+'. دفعت رسوم السنة الأولى '+cash(m.cost)+'.','special');achievement('الالتحاق بالجامعة: '+m.title);render();info('🎓','أهلًا بالجامعة','هتتقدم في الدراسة مع مرور السنين. حاول تحافظ على صحتك ومستواك.');
 };
 modal('🏛️','التخصصات الجامعية','قدّم للجامعة واختار التخصص اللي يناسبك.',[
  choice('🎓','التقديم للجامعة','تأكيد التخصص ودفع رسوم السنة الأولى.',applyMajor),
  choice('📚','أستعد للدراسة','نشاط مجاني يزيد الذكاء.',()=>{closeModal();stat('smart',4);log('📚','استعداد للجامعة','قضيت وقتًا في التعلم قبل التقديم.');render();})
 ],true,form);
}

function assets(){
 const opts=[
  section('المالية'),
  markMenuRow(choice('💰','الحسابات والمالية','الرصيد '+cash(state.bank)+' · صافي الثروة '+cash(state.bank+(state.assets||[]).reduce((sum,a)=>sum+(a.value||0),0)+(state.investments||[]).reduce((sum,a)=>sum+(a.value||0),0)-(state.debt||0))+'.',()=>{closeModal();financeMenu();})),
  choice('📊','الاستثمارات','إدارة محفظة الأسهم والسندات والأصول المالية.',()=>{closeModal();investingMenu();}),
  choice('💎','نمط الحياة الفاخر','صافي ثروتك الحالية '+cash(Math.max(0,state.bank+(state.assets||[]).reduce((sum,a)=>sum+(a.value||0),0)-(state.debt||0)))+'.',()=>{closeModal();manageAssets();},'',clamp(Math.round(Math.log10(Math.max(1,state.bank+(state.assets||[]).reduce((sum,a)=>sum+(a.value||0),0)))*13))),
  section('مزايا خاصة ليك'),
  choice('🎬','حزمة مخرج الأفلام','أخرج أفلامًا، اختبر الممثلين، واكسب الجوائز.',()=>routePack('movieDirectorPack',movieDirectorMenu),'',null,!perkOwned('movieDirectorPack')),
  choice('🎲','توسعة الكازينو','امتلك كازينو وأدر الألعاب والمرافق.',()=>routePack('casinoPack',casinoMenu),'',null,!perkOwned('casinoPack')),
  choice('🏘️','العقارات والملاك','أدر المستأجرين والعقود والعقارات المتقدمة.',()=>routePack('landlordPack',landlordPortfolioMenu),'',null,!perkOwned('landlordPack')),
  section('الأصول المميزة'),
  choice('🔨','بيوت المزادات','اقتناء المقتنيات النادرة وعرضها.',()=>routePack('blackMarketPack',blackMarketMenu),'',null,!perkOwned('blackMarketPack')),
  choice('🎰','الكازينو','إدارة الألعاب والمرافق داخل الكازينو.',()=>routePack('casinoPack',casinoMenu),'',null,!perkOwned('casinoPack')),
  choice('🏛️','المتحف','اعرض مقتنياتك واجذب الزوار.',()=>routePack('blackMarketPack',museumMenu),'',null,!perkOwned('blackMarketPack')),
  choice('🏎️','مرآب سيارات السباق','شراء سيارات سباق وإدارة المركبات.',()=>{closeModal();shoppingMenu();},'',null,false),
  choice('🦁','حديقة الحيوانات','امتلك حديقة حيوان واعتنِ بالحيوانات.',()=>routePack('zooExpansionPack',zooMenu),'',null,!perkOwned('zooExpansionPack')),
  ...((state.assets||[]).some(a=>a.kind==='property')?[section('العقارات'),...(state.assets||[]).filter(a=>a.kind==='property').map(a=>choice(a.emoji||'🏠',a.title,'القيمة '+cash(a.value)+' · '+(a.tenant?'مؤجر':'غير مؤجر'),manageAssets,cash(a.value)))]:[]),
  ...((state.assets||[]).some(a=>['car','bike','racecar','aircraft','helicopter','boat'].includes(a.kind))?[section('المركبات'),...(state.assets||[]).filter(a=>['car','bike','racecar','aircraft','helicopter','boat'].includes(a.kind)).map(a=>choice(a.emoji||'🚘',a.title,(Number.isFinite(Number(a.condition))?'الحالة '+clamp(a.condition)+'% · ':'')+'القيمة '+cash(a.value||0),manageAssets,cash(a.value||0),Number.isFinite(Number(a.condition))?clamp(a.condition):null))]:[section('المركبات'),choice('🚘','لا توجد مركبات بعد','تصفّح معارض السيارات والمركبات.',shoppingMenu)]),
  section('المقتنيات'),
  choice('🎒','ممتلكاتي','إدارة الممتلكات والأصول التي تملكها بالفعل.',manageAssets),
  choice('🐾','الحيوانات الأليفة','عرض الحيوانات الأليفة ورعايتها.',petsMenu),
  ...(state.business?[choice('🏪','إدارة مشروعي','قيمة المشروع '+cash(state.business.value)+' · المستوى '+(state.business.level||1)+'.',openPrimaryBusinessMenu)]:[]),
  ...((state.companies||[]).length?[section('الشركات المملوكة'),...(state.companies||[]).map((company,i)=>choice(company.emoji||'🏢',company.title,'القطاع '+company.sector+' · القيمة '+cash(company.value)+' · الفريق '+(Array.isArray(company.staff)?company.staff.length:0)+' · المنتجات '+(Array.isArray(company.products)?company.products.filter(product=>product&&product.active!==false).length:0),()=>companyDetailMenu(i),cash(company.value)))]:[]),
  section('متفرقات'),
  choice('📱','السوشيال ميديا','أنشئ حسابات على منصات مختلفة وتابع جمهورك.',()=>{closeModal();socialMediaMenu();}),
  choice('🏢','محفظة الشركات','اشترِ شركات إضافية وراجع تقاريرها.',()=>routePack('businessPack',companyPortfolioMenu),'',null,!perkOwned('businessPack'))
 ];
 const shopBanner=choice('🛍️','التسوّق','دراجات، سيارات، مجوهرات، آلات موسيقية، عقارات ومركبات خاصة.',shoppingMenu);shopBanner.banner=true;opts.push(shopBanner);
 modal('🏠','الأصول','إدارة المال والأصول والمقتنيات والمركبات التي تملكها.',opts);
}
function markMenuRow(row){row.menuDots=true;return row;}
function shoppingMenu(){
 const opts=[
  section('الدراجات'),
  markMenuRow(choice('🚲','دراجات نجوى','تسوّق الدراجات الهوائية والكهربائية.',()=>storeDealerMenu('bicycles'))),
  section('معارض السيارات'),
  markMenuRow(choice('🏁','جيرجس موتور وورلد','سيارات سباق ومركبات عالية الأداء.',()=>storeDealerMenu('racing'))),
  markMenuRow(choice('🚗','حنانيا للسيارات','سيارات سيدان وسيارات جديدة.',()=>storeDealerMenu('hanania'))),
  markMenuRow(choice('🚘','الأقصر للسيارات','سيارات فاخرة ورياضية.',()=>storeDealerMenu('luxor'))),
  markMenuRow(choice('🚙','ناصر موتورز','سيارات عائلية ودفع رباعي.',()=>storeDealerMenu('naser'))),
  section('محلات المجوهرات'),
  markMenuRow(choice('💎','جاليلا للمجوهرات','خواتم وقلائد ومقتنيات ثمينة.',()=>storeDealerMenu('jewelry'))),
  markMenuRow(choice('🖤','أوليمبوس للمجوهرات البديلة','إكسسوارات ومجوهرات اقتصادية.',()=>storeDealerMenu('fashionJewelry'))),
  section('محلات الموسيقى'),
  markMenuRow(choice('🎺','ثيوريز للموسيقى','آلات موسيقية للهوايات والمقتنيات.',()=>storeDealerMenu('music'))),
  section('سماسرة العقارات'),
  markMenuRow(choice('🏠','كاديت للعقارات','شقق ومنازل للمرة الأولى.',()=>storeDealerMenu('cadet'))),
  markMenuRow(choice('🏢','صديقي عماري للعقارات','منازل أوسع وعقارات استثمارية.',()=>storeDealerMenu('sadiki'))),
  section('معارض المركبات الخاصة'),
  markMenuRow(choice('✈️','بيناكل للطائرات','طائرات خاصة ومركبات جوية.',()=>storeDealerMenu('aircraft'))),
  markMenuRow(choice('🚁','ماونتن للطائرات المروحية','مروحيات ومركبات جوية خاصة.',()=>storeDealerMenu('helicopter'))),
  markMenuRow(choice('⛵','مبارك مارين','قوارب ويخوت للترفيه.',()=>storeDealerMenu('marine'))),
  choice('↩️','رجوع للأصول','',()=>{closeModal();assets();})
 ];
 modal('🛍️','التسوق','اختار المتجر واستعرض الأسعار قبل الشراء. كل المشتريات تخص ملف حياتك الحالي.',opts);
}
function storeDealerMenu(kind){
 const shops={
  bicycles:{title:'دراجات نجوى',emoji:'🚲',desc:'اختار دراجة تناسب ميزانيتك.',items:[
   {kind:'bike',title:'دراجة هوائية',emoji:'🚲',value:12000,upkeep:500,desc:'دراجة عملية للتنقل اليومي.'},
   {kind:'bike',title:'دراجة كهربائية',emoji:'🚴',value:38000,upkeep:1300,desc:'تنقل أسرع مع تكلفة صيانة أعلى.'}
  ]},
  racing:{title:'جيرجس موتور وورلد',emoji:'🏁',desc:'مركبات سباق للمهتمين بالأداء العالي.',items:[
   {kind:'racecar',title:'سيارة سباق مستعملة',emoji:'🏎️',value:1200000,upkeep:65000,desc:'سيارة سباق تحتاج صيانة سنوية مرتفعة.'},
   {kind:'racecar',title:'سيارة سباق احترافية',emoji:'🏎️',value:7500000,upkeep:240000,desc:'مركبة متقدمة لهواة السباق.'}
  ]},
  hanania:{title:'حنانيا للسيارات',emoji:'🚗',desc:'اختار من مجموعة السيارات اليومية.',items:[
   {kind:'car',title:'سيدان مستعملة',emoji:'🚗',value:260000,upkeep:17000,desc:'سيارة مستعملة اقتصادية نسبيًا.'},
   {kind:'car',title:'سيدان جديدة',emoji:'🚙',value:850000,upkeep:29000,desc:'سيارة جديدة براحة ومصاريف أعلى.'}
  ]},
  luxor:{title:'الأقصر للسيارات',emoji:'🚘',desc:'موديلات فاخرة ورياضية.',items:[
   {kind:'car',title:'سيارة فاخرة',emoji:'🚘',value:2200000,upkeep:72000,desc:'راحة وفخامة مع مصاريف سنوية مرتفعة.'},
   {kind:'car',title:'سيارة رياضية',emoji:'🏎️',value:3200000,upkeep:105000,desc:'سيارة رياضية قوية وتكاليف تشغيل عالية.'}
  ]},
  naser:{title:'ناصر موتورز',emoji:'🚙',desc:'سيارات عائلية ورحلات طويلة.',items:[
   {kind:'car',title:'سيارة دفع رباعي',emoji:'🚙',value:1350000,upkeep:51000,desc:'سيارة واسعة للطرق المختلفة.'},
   {kind:'car',title:'سيارة عائلية',emoji:'🚐',value:970000,upkeep:35000,desc:'مساحة عملية للعائلة.'}
  ]},
  jewelry:{title:'جاليلا للمجوهرات',emoji:'💎',desc:'مقتنيات ثمينة يمكنك الاحتفاظ بها أو بيعها.',items:[
   {kind:'collectible',title:'خاتم فضة',emoji:'💍',value:4500,upkeep:0,desc:'قطعة بسيطة من المجوهرات.'},
   {kind:'collectible',title:'قلادة ذهبية',emoji:'📿',value:22000,upkeep:0,desc:'قلادة ثمينة قابلة لإعادة البيع.'},
   {kind:'collectible',title:'حجر كريم نادر',emoji:'💎',value:85000,upkeep:0,desc:'مقتنى نادر مرتفع القيمة.'}
  ]},
  fashionJewelry:{title:'أوليمبوس للمجوهرات البديلة',emoji:'🖤',desc:'إكسسوارات اقتصادية للمظهر اليومي.',items:[
   {kind:'collectible',title:'سوار إكسسوار',emoji:'📿',value:900,upkeep:0,desc:'إكسسوار بسيط منخفض السعر.'},
   {kind:'collectible',title:'خاتم بديل',emoji:'💍',value:1500,upkeep:0,desc:'قطعة زينة اقتصادية.'}
  ]},
  music:{title:'ثيوريز للموسيقى',emoji:'🎺',desc:'اشترِ آلة وتعلم العزف أو احتفظ بها كمقتنى.',items:[
   {kind:'instrument',title:'جيتار صوتي',emoji:'🎸',value:2500,upkeep:100,desc:'آلة مناسبة لبداية تعلم الموسيقى.'},
   {kind:'instrument',title:'بيانو',emoji:'🎹',value:9000,upkeep:350,desc:'آلة موسيقية تحتاج مساحة وعناية.'},
   {kind:'instrument',title:'بوق موسيقي',emoji:'🎺',value:1800,upkeep:80,desc:'آلة نفخ للموسيقى والتدريب.'},
   {kind:'instrument',title:'كمان',emoji:'🎻',value:6000,upkeep:220,desc:'آلة وترية تحتاج تدريبًا وصيانة.'}
  ]},
  cadet:{title:'كاديت للعقارات',emoji:'🏠',desc:'عقارات للمبتدئين والاستقرار.',items:[
   {kind:'property',title:'شقة متوسطة',emoji:'🏢',value:950000,upkeep:14000,desc:'مساحة أكبر ومسؤوليات أعلى.'},
   {kind:'property',title:'بيت عائلي',emoji:'🏡',value:2400000,upkeep:34000,desc:'بيت واسع يحتاج ميزانية قوية.'}
  ]},
  sadiki:{title:'صديقي عماري للعقارات',emoji:'🏘️',desc:'عقارات أوسع وفرص استثمارية.',items:[
   {kind:'property',title:'فيلا عائلية',emoji:'🏡',value:5500000,upkeep:115000,desc:'فيلا كبيرة بمصاريف صيانة مرتفعة.'},
   {kind:'property',title:'مبنى سكني صغير',emoji:'🏢',value:7000000,upkeep:140000,desc:'عقار متعدد الوحدات وتكاليف تشغيل كبيرة.'}
  ]},
  aircraft:{title:'بيناكل للطائرات',emoji:'✈️',desc:'مركبات جوية خاصة مرتفعة التكلفة.',items:[
   {kind:'aircraft',title:'طائرة خاصة صغيرة',emoji:'✈️',value:12000000,upkeep:650000,desc:'طائرة خاصة بتكاليف تشغيل مرتفعة.'}
  ]},
  helicopter:{title:'ماونتن للطائرات المروحية',emoji:'🚁',desc:'مركبات جوية خاصة للاستخدام الفاخر.',items:[
   {kind:'helicopter',title:'مروحية خاصة',emoji:'🚁',value:4500000,upkeep:280000,desc:'مروحية بمصاريف صيانة سنوية عالية.'}
  ]},
  marine:{title:'مبارك مارين',emoji:'⛵',desc:'قوارب ويخوت للترفيه.',items:[
   {kind:'boat',title:'قارب ترفيهي',emoji:'⛵',value:1200000,upkeep:68000,desc:'قارب يحتاج مرسى وصيانة سنوية.'},
   {kind:'boat',title:'يخت فاخر',emoji:'🛥️',value:3300000,upkeep:190000,desc:'يخت فاخر بتكاليف تشغيل مرتفعة.'}
  ]}
 };
 const shop=shops[kind];if(!shop){shoppingMenu();return;}
 const opts=shop.items.map(item=>choice(item.emoji,item.title,item.desc+' التكلفة '+cash(item.value)+' · الصيانة السنوية '+cash(item.upkeep)+'.',()=>buyAsset(item),cash(item.value)));
 opts.push(choice('↩️','رجوع للتسوق','',shoppingMenu));
 modal(shop.emoji,shop.title,shop.desc,opts);
}

function companyPortfolioMenu(){
 if(!perkOwned('businessPack')){closeModal();info('🏭','محفظة الشركات مقفولة','افتح باقة الملياردير من متجر مزايا حياة.');return;}
 const opts=[
  choice('💻','شراء شركة تقنية','منتج رقمي ونمو محتمل أعلى مع مصاريف تشغيل.',()=>acquireCompany('شركة تقنية','تقنية',320000,'💻'),'320,000 '+state.place.unit),
  choice('🚚','شراء شركة لوجستية','نقل وتوزيع مع عقود دورية.',()=>acquireCompany('شركة لوجستية','لوجستيات',260000,'🚚'),'260,000 '+state.place.unit),
  choice('🍽️','شراء سلسلة مطاعم','مشروع تشغيلي له دخل وتكاليف سنوية.',()=>acquireCompany('سلسلة مطاعم','مطاعم',210000,'🍽️'),'210,000 '+state.place.unit),
  choice('🛒','شراء شركة تجزئة','متاجر ومبيعات مع تكلفة مخزون.',()=>acquireCompany('شركة تجزئة','تجزئة',180000,'🛒'),'180,000 '+state.place.unit)
 ];
 (state.companies||[]).forEach((company,i)=>{
  const staffCount=Array.isArray(company.staff)?company.staff.length:0;
  const productCount=Array.isArray(company.products)?company.products.filter(product=>product&&product.active!==false).length:0;
  opts.push(choice(company.emoji||'🏢',company.title+' · '+cash(company.value),'القطاع '+company.sector+' · المستوى '+company.level+' · الفريق '+staffCount+' · المنتجات '+productCount,()=>companyDetailMenu(i),cash(company.value)));
 });
 opts.push(choice('↩️','رجوع للأصول','',()=>{closeModal();assets();}));
 modal('🏢','محفظة الشركات','كل شركة لها موردون وفريق ومنتجات وتقارير مستقلة، ويمكن تشغيلها دون التأثير على المشروع الأساسي.',opts);
}
function acquireCompany(title,sector,value,emoji){
 closeModal();if(state.age<18){info('🔒','الشراء غير متاح','تقدر تستحوذ على الشركات بعد سن 18.');return;}
 if(state.bank<value){info('💳','رأس المال غير كافٍ','شراء '+title+' يحتاج '+cash(value)+'.');return;}
 state.bank-=value;const id=Date.now()+Math.random(),company={id,assetId:id,title,sector,value,level:1,upkeep:Math.round(value*.025),bought:state.age,emoji,treasuryMode:'separate',cashBalance:0,pendingOwnerContributions:0,pendingOwnerWithdrawals:0};
 state.companies.push(company);state.assets.push({id,title,emoji,kind:'business',value,upkeep:0,bought:state.age,companyPortfolio:true});
 log('🏢','استحواذ على شركة','اشتريت '+title+' في قطاع '+sector+'. تقدر تدير الموردين والموظفين والمنتجات والتقارير بشكل مستقل.','special');achievement('تنويع محفظة الشركات');save();render();companyPortfolioMenu();
}

function businessSupplierMarketOffers(business){
 const year=Math.max(0,Math.floor(Number(state.age)||0));
 const saved=business&&business.supplierMarket;
 if(saved&&Number(saved.year)===year&&Array.isArray(saved.offers)){
  const offers=saved.offers.map(offer=>{
   if(!offer||typeof offer!=='object')return null;
   const supplier=BUSINESS_SUPPLIER_CATALOG.find(item=>item.id===offer.id);
   if(!supplier)return null;
   const quality=Number(offer.quality),costMultiplier=Number(offer.costMultiplier),feeRate=Number(offer.feeRate);
   if(!Number.isFinite(quality)||!Number.isFinite(costMultiplier)||!Number.isFinite(feeRate))return null;
   return {id:supplier.id,quality:clamp(quality,40,99),costMultiplier:Math.round(Math.max(.7,Math.min(1.3,costMultiplier))*1000)/1000,feeRate:Math.round(Math.max(.004,Math.min(.03,feeRate))*10000)/10000};
  }).filter(Boolean);
  if(offers.length===BUSINESS_SUPPLIER_CATALOG.length&&new Set(offers.map(offer=>offer.id)).size===BUSINESS_SUPPLIER_CATALOG.length)return offers;
 }
 const source=String(state.lifeId||state.name||'hayah')+'|'+year+'|'+String(business.assetId||business.id||business.title||'business');
 let hash=2166136261;
 for(let i=0;i<source.length;i++)hash=Math.imul(hash^source.charCodeAt(i),16777619);
 const offers=BUSINESS_SUPPLIER_CATALOG.map((supplier,index)=>{
  const mixed=(hash^Math.imul(index+1,0x9e3779b1))>>>0;
  const quality=clamp(supplier.quality+(mixed%11)-5,40,99);
  const costMultiplier=Math.round(Math.max(.7,Math.min(1.3,supplier.costMultiplier+(((mixed>>>8)%9)-4)*.015))*1000)/1000;
  const feeRate=Math.round(Math.max(.004,Math.min(.03,supplier.feeRate+(((mixed>>>16)%5)-2)*.001))*10000)/10000;
  return {id:supplier.id,quality,costMultiplier,feeRate};
 });
 business.supplierMarket={year,offers};
 return offers;
}
function businessSupplierMenu(){
 if(!currentManagedBusiness()){info('🏪','لا يوجد نشاط','اختار مشروعًا أو شركة من المحفظة أولًا.');return;}
 const business=currentManagedBusiness(),year=Math.max(0,Math.floor(Number(state.age)||0));
 const offers=businessSupplierMarketOffers(business);
 save();
 const current=BUSINESS_SUPPLIER_CATALOG.find(item=>business.supplier&&item.id===business.supplier.id);
 const currentYears=Math.max(0,Math.floor(Number(business.supplier&&business.supplier.yearsLeft)||0));
 const earlyExitFee=current&&currentYears>0?Math.round(Math.max(0,Number(business.value)||0)*.004*currentYears):0;
 const opts=offers.map(offer=>{
  const supplier=BUSINESS_SUPPLIER_CATALOG.find(item=>item.id===offer.id);
  if(!supplier)return null;
  const active=current&&current.id===supplier.id&&currentYears>0;
  const fee=Math.max(500,Math.round(Math.max(0,Number(business.value)||0)*offer.feeRate));
  const exitFee=current&&currentYears>0&&!active?earlyExitFee:0;
  const termLabel=active?'العقد الحالي · متبقي '+currentYears+' سنة':'عقد جديد لمدة سنة مالية واحدة';
  const detail=supplier.description+' الجودة '+offer.quality+'% · معامل التكلفة '+Math.round(offer.costMultiplier*100)+'% · رسوم التعاقد '+cash(fee)+' · '+termLabel+(exitFee?' · إنهاء العقد الحالي '+cash(exitFee):'');
  return choice(supplier.emoji,supplier.title+(active?' · المتعاقد الحالي':''),detail,()=>contractBusinessSupplier(supplier.id),active?'ساري':cash(fee+exitFee));
 }).filter(Boolean);
 opts.push(choice('↩️','رجوع لإدارة المشروع','',businessMenu));
 modal('📦','سوق الموردين · السنة '+year,'العروض تتجدد سنويًا. قارن الجودة والتكلفة قبل التعاقد؛ التبديل المبكر من عقد قائم يضيف رسوم إنهاء معلنة.',opts);
}
function contractBusinessSupplier(id){
 closeModal();const business=currentManagedBusiness();if(!business)return;
 const supplier=BUSINESS_SUPPLIER_CATALOG.find(item=>item.id===id);
 const offers=businessSupplierMarketOffers(business),offer=offers.find(item=>item.id===id);
 if(!supplier||!offer){info('⚠️','عرض غير متاح','اختار موردًا من عروض السنة الحالية.');return;}
 const currentYears=Math.max(0,Math.floor(Number(business.supplier&&business.supplier.yearsLeft)||0));
 if(business.supplier&&business.supplier.id===id&&currentYears>0){info('📦','العقد ما زال ساريًا','أنت متعاقد بالفعل مع '+supplier.title+'.');return;}
 const value=Math.max(0,Number(business.value)||0);
 const fee=Math.max(500,Math.round(value*offer.feeRate));
 const earlyExitFee=business.supplier&&currentYears>0?Math.round(value*.004*currentYears):0;
 const totalFee=fee+earlyExitFee;
 if(businessTreasuryBalance(business)<totalFee){info('💳','خزينة النشاط غير كافية','رسوم التعاقد مع '+supplier.title+' ورسوم إنهاء العقد السابق '+cash(totalFee)+'؛ حوّل رأس مال إلى الشركة أولًا.');return;}
 spendBusinessTreasury(business,totalFee);
 business.supplier={id:supplier.id,quality:offer.quality,costMultiplier:offer.costMultiplier,feeRate:offer.feeRate,yearsLeft:1,startedAtAge:state.age,marketYear:business.supplierMarket.year};
 log('📦','توقيع عقد توريد','تعاقدت مع '+supplier.title+' لمدة سنة مالية واحدة بجودة '+offer.quality+'% ومعامل تكلفة '+Math.round(offer.costMultiplier*100)+'%'+(earlyExitFee?'، مع رسوم إنهاء مبكر '+cash(earlyExitFee):'')+'.','good');
 save();render();businessMenu();
}
function businessReportsMenu(entity,title,back){
 const reports=(Array.isArray(entity&&entity.financialHistory)?entity.financialHistory:[]).slice(-5).reverse();
 if(!reports.length){info('📊','لا توجد تقارير بعد','التقرير المالي الأول هيظهر بعد مرور سنة مالية كاملة.');return;}
 const opts=reports.map(report=>choice('📅','السنة '+report.year,'الإيرادات '+cash(report.revenue)+' · المصروفات '+cash(report.costs)+' · '+(report.profit>=0?'صافي ربح ':'صافي خسارة ')+cash(Math.abs(report.profit)),()=>{
  closeModal();
  const detail='الإيرادات: '+cash(report.revenue)+'\nالمصروفات التشغيلية: '+cash(Math.max(0,report.costs-(report.payroll||0)-(report.facilityUpkeep||0)))+'\nرواتب الموظفين: '+cash(report.payroll||0)+' ('+(report.staffCount||0)+' موظف)\nصيانة الفروع والمصانع: '+cash(report.facilityUpkeep||0)+' ('+(report.facilityCount||0)+' منشأة)'+(report.facilityInvestment?'\nاستثمارات إنشاء منشآت: '+cash(report.facilityInvestment):'')+'\nإجمالي المصروفات: '+cash(report.costs)+'\nصافي النتيجة: '+(report.profit>=0?'ربح ':'خسارة ')+cash(Math.abs(report.profit))+'\nهامش الربح: '+report.margin+'%\nتغير قيمة النشاط: '+(report.growthRate>=0?'+':'')+report.growthRate+'%\nالقيمة الختامية: '+cash(report.closingValue)+(report.supplier?'\nالمورد: '+report.supplier+(report.supplierQuality?'\nجودة المورد: '+report.supplierQuality+'%':'')+(report.supplierCostMultiplier?'\nمعامل تكلفة المورد: '+Math.round(report.supplierCostMultiplier*100)+'%':''):'')+(report.productCount?'\nمبيعات المنتجات: '+cash(report.productRevenue||0)+' · تكاليفها: '+cash(report.productCosts||0)+' · صافيها: '+cash(report.productProfit||0)+' · الوحدات المباعة: '+fmt(report.productUnits||0):'')+(Number.isFinite(Number(report.marketShare))?'\nالسوق: '+(report.marketIndustry||'متنوع')+' · الحصة: '+report.marketShare+'% · التغير: '+(report.marketShareChange>=0?'+':'')+report.marketShareChange+'% · المنافسون: '+(report.marketCompetitorCount||0)+' · الطلب: '+(report.marketDemandIndex||0)+' · المنافسة: '+(report.marketCompetitionIndex||0):'')+(report.marketRivalPlans?'\nتحركات المنافسين: '+report.marketRivalPlans:'')+(Number.isFinite(Number(report.industryRevenueMultiplier))?'\nمعاملات القطاع: الإيرادات ×'+Number(report.industryRevenueMultiplier).toFixed(2)+' · التشغيل ×'+Number(report.industryOperatingCostMultiplier).toFixed(2)+' · تكلفة الوحدة ×'+Number(report.industryUnitCostMultiplier).toFixed(2):'');
  const creditDetail=Number.isFinite(Number(report.businessLoanBalance))?'\nالتمويل التجاري: فائدة السنة '+cash(report.businessLoanInterest||0)+' · المدفوع '+cash(report.businessLoanInterestPaid||0)+' · المضاف للدين '+cash(report.businessLoanInterestAccrued||0)+' · الرصيد '+cash(report.businessLoanBalance):'';
  const taxDetail=Number(report.corporateTaxRate)>0?'\nضريبة الأرباح المحاكية: '+cash(report.corporateTax||0)+' على ربح خاضع '+cash(report.taxableProfit||0)+' بنسبة '+(Number(report.corporateTaxRate)*100).toFixed(1)+'% · المدفوع خلال السنة '+cash(report.corporateTaxPaid||0)+' · المتبقي '+cash(report.taxLiability||report.corporateTaxAccrued||0):'';
   const treasuryDetail=report.treasuryMode==='separate'?'\nخزينة الشركة: بداية السنة '+cash(report.openingCashBalance||0)+' · نهاية السنة '+cash(report.closingCashBalance||0)+' · تحويلات المالك '+cash(report.ownerContributions||0)+' · مسحوبات المالك '+cash(report.ownerWithdrawals||0):'';
  info('📊','التقرير المالي · '+title,detail+creditDetail+taxDetail+treasuryDetail,[choice('↩️','رجوع للتقارير','',()=>businessReportsMenu(entity,title,back))]);
 }));
 opts.push(choice('↩️','رجوع','',back));
 modal('📊','سجل التقارير · '+title,'آخر خمس سنوات مالية محفوظة. احتفظنا بعشر سنوات كحد أقصى لتقليل حجم ملف الحفظ.',opts);
}

function managedCompanyIndex(){
 if(managedCompanyId===null||!state||!Array.isArray(state.companies))return -1;
 return state.companies.findIndex(company=>company&&String(company.id)===String(managedCompanyId));
}
function currentManagedBusiness(){
 if(managedCompanyId!==null){
  const index=managedCompanyIndex();
  if(index>=0)return state.companies[index];
  managedCompanyId=null;
 }
 return state&&state.business&&typeof state.business==='object'?state.business:null;
}
function openPrimaryBusinessMenu(){managedCompanyId=null;businessMenu();}
function companyDetailMenu(index){
 const company=(state.companies||[])[index];if(!company){companyPortfolioMenu();return;}
 const staffCount=Array.isArray(company.staff)?company.staff.length:0;
 const productCount=Array.isArray(company.products)?company.products.filter(product=>product&&product.active!==false).length:0;
 const supplier=BUSINESS_SUPPLIER_CATALOG.find(item=>company.supplier&&item.id===company.supplier.id);
 const supplierLabel=supplier?' · المورد '+supplier.title:' · دون مورد متعاقد';
 const creditBalance=businessCreditBalance(company);
 const creditLabel=creditBalance?' · تمويل مستحق '+cash(creditBalance):'';
 const detail='قيمة تقديرية '+cash(company.value)+' · القطاع '+company.sector+' · المستوى '+company.level+' · الفريق '+staffCount+'/5 · المنتجات '+productCount+supplierLabel+creditLabel+'. نتائج السنة القادمة غير مضمونة.';
 modal(company.emoji||'🏢','إدارة '+company.title,detail,[
  choice('🧰','إدارة التشغيل','إدارة الموردين والموظفين والمنتجات لهذه الشركة بشكل مستقل.',()=>{managedCompanyId=String(company.id);businessMenu();}),
  choice('📊','سجل التقارير','راجع الإيرادات والمصروفات وصافي النتيجة عبر السنوات.',()=>businessReportsMenu(company,company.title,()=>companyDetailMenu(index))),
  choice('📈','إعادة استثمار','ضخ رأس مال لرفع المستوى والنمو.',()=>reinvestCompany(index),'20,000 '+state.place.unit),
  choice('💵','بيع الشركة','تصفية الشركة مقابل 75% تقريبًا من قيمتها الحالية.',()=>sellCompany(index),cash(Math.round(company.value*.75))),
  choice('↩️','رجوع للمحفظة','',companyPortfolioMenu)
 ]);
}

function reinvestCompany(index){
 closeModal();const company=(state.companies||[])[index];if(!company)return;const cost=20000;
 if(!spendBusinessTreasury(company,cost)){info('💳','خزينة النشاط غير كافية','إعادة الاستثمار تحتاج '+cash(cost)+'. حوّل رأس مال إلى الشركة أولًا.');return;}
 company.level=clamp((company.level||1)+1,1,20);company.value=Math.round(company.value*1.12);
 const asset=state.assets.find(a=>a.id===company.id);if(asset)asset.value=company.value;
 log('📈','إعادة استثمار في '+company.title,'ارتفع مستوى الشركة إلى '+company.level+' والقيمة التقديرية إلى '+cash(company.value)+'.','good');save();render();companyDetailMenu(index);
}
function sellCompany(index){
 closeModal();const company=(state.companies||[])[index];if(!company)return;const grossProceeds=Math.round(company.value*.75),creditBalance=businessCreditBalance(company);
 const companyCash=businessUsesSeparateTreasury(company)?businessTreasuryBalance(company):0;
 const proceeds=grossProceeds+companyCash-creditBalance;
 if(proceeds<0){info('🏦','تعذر بيع الشركة','صافي حصيلة البيع بعد احتساب خزينة الشركة '+cash(companyCash)+' وتسوية التمويل '+cash(creditBalance)+' سيكون '+cash(proceeds)+'. موّل النشاط أو سدّد جزءًا من الدين أولًا.');return;}
 if(managedCompanyId!==null&&String(managedCompanyId)===String(company.id))managedCompanyId=null;
 state.bank+=proceeds;company.credit=null;state.companies.splice(index,1);state.assets=state.assets.filter(a=>a.id!==company.id);
 log('💵','بيع شركة','بعت '+company.title+' بقيمة '+cash(grossProceeds)+'، وسُوّي تمويلها '+cash(creditBalance)+'، وصافي المتحصل '+cash(proceeds)+'.','good');save();render();companyPortfolioMenu();
}
function businessStaffSalary(role,businessValue){
 return Math.max(1200,Math.min(1000000000,Math.round(Math.max(0,Number(businessValue)||0)*role.salaryRate)));
}
function businessStaffMenu(){
 const business=currentManagedBusiness();
 if(!business){info('🏪','لا يوجد مشروع','امتلك مشروعًا أولًا حتى تدير فريق العمل.');return;}
 if(!Array.isArray(business.staff))business.staff=[];
 const staff=business.staff;
 const payroll=staff.reduce((sum,employee)=>sum+Math.max(0,Number(employee.salary)||0),0);
 const opts=staff.map((employee,index)=>{
  const role=BUSINESS_STAFF_ROLES.find(item=>item.id===employee.role);
  return choice(role?role.emoji:'👤',employee.name||((role&&role.title)||'موظف')+' '+(index+1),(role?role.title:'موظف')+' · الخبرة '+(employee.years||0)+' سنة · المهارة '+(employee.skill||0)+'% · الرضا '+(employee.morale||0)+'% · الراتب السنوي '+cash(employee.salary),()=>businessStaffMemberMenu(employee.id));
 });
 if(staff.length<5)opts.push(choice('➕','توظيف موظف','اختر تخصصًا يضيف قيمة للمشروع مقابل راتب سنوي ورسوم تعيين.',businessStaffHiringMenu));
 else opts.push(choice('👥','اكتمل الفريق','الحد الأقصى للفريق الحالي خمسة موظفين.',()=>info('👥','الفريق مكتمل','أنهِ تعاقد أحد الموظفين قبل إضافة عضو جديد.')));
 opts.push(choice('↩️','رجوع لإدارة المشروع','',businessMenu));
 modal('👥','فريق العمل','عدد الموظفين '+staff.length+'/5 · إجمالي الرواتب السنوية '+cash(payroll)+'. الرواتب تُخصم من نتيجة المشروع عند التقدم سنة.',opts);
}
function businessStaffHiringMenu(){
 const business=currentManagedBusiness();
 if(!business)return;
 const staff=Array.isArray(business.staff)?business.staff:[];
 if(staff.length>=5){info('👥','الفريق مكتمل','الحد الأقصى للفريق الحالي خمسة موظفين.');return;}
 const opts=BUSINESS_STAFF_ROLES.map(role=>{
  const salary=businessStaffSalary(role,business.value),fee=Math.max(250,Math.round(salary*.1));
  return choice(role.emoji,role.title,role.description+' · الراتب السنوي '+cash(salary)+' · رسوم التعيين '+cash(fee),()=>hireBusinessStaff(role.id),cash(fee));
 });
 opts.push(choice('↩️','رجوع للفريق','',businessStaffMenu));
 modal('🧑‍💼','توظيف موظف','اختار المهارة المناسبة لاحتياج مشروعك. رسوم التعيين تُدفع مرة واحدة، والراتب يُخصم سنويًا.',opts);
}
function hireBusinessStaff(roleId){
 closeModal();
 const business=currentManagedBusiness();
 if(!business)return;
 const role=BUSINESS_STAFF_ROLES.find(item=>item.id===roleId);
 if(!role){info('⚠️','وظيفة غير متاحة','اختار تخصصًا من القائمة الحالية.');return;}
 if(!Array.isArray(business.staff))business.staff=[];
 if(business.staff.length>=5){info('👥','الفريق مكتمل','الحد الأقصى للفريق الحالي خمسة موظفين.');return;}
 const salary=businessStaffSalary(role,business.value),fee=Math.max(250,Math.round(salary*.1));
 if(!spendBusinessTreasury(business,fee)){info('💳','خزينة النشاط غير كافية','رسوم تعيين '+role.title+' هي '+cash(fee)+'. حوّل رأس مال إلى الشركة أولًا.');return;}
 const roleCount=business.staff.filter(employee=>employee.role===role.id).length+1;
 const employee={id:'staff-'+String(state.lifeId||state.age)+'-'+Date.now()+'-'+business.staff.length,name:role.title+' '+roleCount,role:role.id,salary,skill:55,morale:65,years:0};
 business.staff.push(employee);
 log('👥','تعيين '+employee.name,'دفعت رسوم تعيين '+cash(fee)+'. الراتب السنوي '+cash(salary)+'، وسيظهر أثر الفريق في التقارير المالية.','good');
 save();render();businessStaffMenu();
}
function businessStaffMemberMenu(id){
 const business=currentManagedBusiness(),staff=business&&Array.isArray(business.staff)?business.staff:[];
 const employee=staff.find(item=>String(item.id)===String(id));
 if(!employee){businessStaffMenu();return;}
 const role=BUSINESS_STAFF_ROLES.find(item=>item.id===employee.role);
 const trainingFee=Math.max(250,Math.round((Number(employee.salary)||0)*.08));
 const severance=Math.max(200,Math.round((Number(employee.salary)||0)*.15));
 modal(role?role.emoji:'👤',employee.name,(role?role.title:'موظف')+' · المهارة '+employee.skill+'% · الرضا '+employee.morale+'% · الخبرة '+employee.years+' سنة · الراتب السنوي '+cash(employee.salary),[
  choice('📚','تدريب الموظف','رفع المهارة 7 درجات وتحسين الرضا مقابل '+cash(trainingFee)+'.',()=>trainBusinessStaff(id),cash(trainingFee)),
  choice('🚪','إنهاء التعاقد','إزالة الموظف مقابل تعويض إنهاء '+cash(severance)+'.',()=>fireBusinessStaff(id),cash(severance)),
  choice('↩️','رجوع للفريق','',businessStaffMenu)
 ]);
}
function trainBusinessStaff(id){
 closeModal();
 const business=currentManagedBusiness(),staff=business&&Array.isArray(business.staff)?business.staff:[];
 const employee=staff.find(item=>String(item.id)===String(id));
 if(!employee)return;
 const fee=Math.max(250,Math.round((Number(employee.salary)||0)*.08));
 if(!spendBusinessTreasury(business,fee)){info('💳','خزينة النشاط غير كافية','تدريب الموظف يحتاج '+cash(fee)+'. حوّل رأس مال إلى الشركة أولًا.');return;}
 employee.skill=clamp((Number(employee.skill)||55)+7);
 employee.morale=clamp((Number(employee.morale)||65)+4);
 log('📚','تدريب '+employee.name,'ارتفعت المهارة إلى '+employee.skill+'% وتحسن الرضا إلى '+employee.morale+'%.','good');
 save();render();businessStaffMemberMenu(id);
}
function fireBusinessStaff(id){
 closeModal();
 const business=currentManagedBusiness(),staff=business&&Array.isArray(business.staff)?business.staff:[];
 const index=staff.findIndex(item=>String(item.id)===String(id));
 if(index<0)return;
 const employee=staff[index],fee=Math.max(200,Math.round((Number(employee.salary)||0)*.15));
 if(!spendBusinessTreasury(business,fee)){info('💳','خزينة النشاط غير كافية','تعويض إنهاء التعاقد يحتاج '+cash(fee)+'. حوّل رأس مال إلى الشركة أولًا.');return;}
 staff.splice(index,1);
 log('🚪','إنهاء تعاقد '+employee.name,'دفعت تعويض إنهاء '+cash(fee)+'. تم تحديث حجم الفريق والرواتب السنوية.','bad');
 save();render();businessStaffMenu();
}

function businessFacilitiesMenu(){
 const business=currentManagedBusiness();
 if(!business){info('🏪','لا يوجد نشاط','اختار مشروعًا أو شركة من المحفظة أولًا.');return;}
 if(!Array.isArray(business.facilities))business.facilities=[];
 const facilities=business.facilities;
 const capacityBonus=facilities.reduce((sum,facility)=>sum+Math.max(0,Math.min(1.5,Number(facility.capacityBonus)||0)),0);
 const capacityMultiplier=Math.max(1,Math.min(4,1+capacityBonus));
 const annualUpkeep=facilities.reduce((sum,facility)=>sum+Math.max(0,Number(facility.annualUpkeep)||0),0);
 const opts=facilities.map((facility,index)=>choice(facility.type==='factory'?'🏭':'🏬',facility.title||'منشأة '+(index+1),'طاقة إضافية '+Math.round((Number(facility.capacityBonus)||0)*100)+'% · صيانة سنوية '+cash(facility.annualUpkeep||0)+' · استثمار '+cash(facility.investment||0)+' · سنة الإنشاء '+(facility.builtAtAge??state.age),()=>info('🏗️',facility.title||'منشأة تجارية','المنشأة ترفع طاقة بيع المنتجات وتظل تكلف صيانة سنوية. لا يمكن بيعها في الإصدار الحالي.')));
 if(facilities.length<8)opts.push(choice('➕','إضافة فرع أو مصنع','اختر متجرًا لزيادة الوصول أو مصنعًا لرفع الطاقة الإنتاجية.',businessFacilityCatalogMenu));
 else opts.push(choice('🏗️','اكتمل حد المنشآت','يمكن إدارة ثماني منشآت كحد أقصى لكل نشاط.',()=>info('🏗️','لا توجد سعة إضافية','أغلق أو طوّر المنشآت في إصدار لاحق قبل إضافة منشأة جديدة.')));
 opts.push(choice('↩️','رجوع لإدارة المشروع','',businessMenu));
 modal('🏗️','الفروع والمصانع','المنشآت الحالية '+facilities.length+'/8 · الطاقة الإنتاجية ×'+capacityMultiplier.toFixed(2)+' · الصيانة السنوية '+cash(annualUpkeep)+'. رسوم الإنشاء تُسجل مرة واحدة في التقرير المالي التالي.',opts);
}
function businessFacilityCatalogMenu(){
 const business=currentManagedBusiness();
 if(!business)return;
 const opts=BUSINESS_FACILITY_CATALOG.map(facility=>{
  const cost=Math.min(1000000000,Math.max(facility.minCost,Math.round(Math.max(0,Number(business.value)||0)*facility.costRate)));
  const upkeep=Math.max(facility.minUpkeep,Math.round(cost*facility.upkeepRate));
  return choice(facility.emoji,facility.title,facility.description+' · استثمار '+cash(cost)+' · صيانة سنوية '+cash(upkeep)+' · زيادة الطاقة '+Math.round(facility.capacityBonus*100)+'%.',()=>buyBusinessFacility(facility.id),cash(cost));
 });
 opts.push(choice('↩️','رجوع للفروع والمصانع','',businessFacilitiesMenu));
 modal('🏗️','اختيار منشأة','الاستثمار يُخصم عند الإنشاء، والصيانة تُحتسب في كل سنة مالية لاحقة.',opts);
}
function buyBusinessFacility(type){
 closeModal();
 const business=currentManagedBusiness(),facility=BUSINESS_FACILITY_CATALOG.find(item=>item.id===type);
 if(!business||!facility)return;
 if(!Array.isArray(business.facilities))business.facilities=[];
 if(business.facilities.length>=8){info('🏗️','اكتمل حد المنشآت','يمكن امتلاك ثماني منشآت كحد أقصى لكل نشاط.');return;}
 const cost=Math.min(1000000000,Math.max(facility.minCost,Math.round(Math.max(0,Number(business.value)||0)*facility.costRate)));
 const upkeep=Math.max(facility.minUpkeep,Math.round(cost*facility.upkeepRate));
 if(businessTreasuryBalance(business)<cost){info('💳','خزينة النشاط غير كافية','إنشاء '+facility.title+' يحتاج '+cash(cost)+'. حوّل رأس مال إلى الشركة أولًا.');return;}
 const sameTypeCount=business.facilities.filter(item=>item&&item.type===facility.id).length+1;
 const record={id:'facility-'+String(state.lifeId||state.age)+'-'+String(business.assetId||business.id||business.title||'business')+'-'+String(state.age)+'-'+String(business.facilities.length+1),type:facility.id,title:facility.title+' '+sameTypeCount,capacityBonus:facility.capacityBonus,annualUpkeep:upkeep,investment:cost,builtAtAge:state.age};
 spendBusinessTreasury(business,cost);
 business.pendingFacilityCosts=Math.min(8000000000,Math.max(0,Number(business.pendingFacilityCosts)||0)+cost);
 business.facilities.push(record);
 log(facility.emoji,'افتتاح '+record.title,'استثمرت '+cash(cost)+' · الطاقة الإنتاجية زادت '+Math.round(facility.capacityBonus*100)+'% · الصيانة السنوية '+cash(upkeep)+'.','good');
 save();render();businessFacilitiesMenu();
}

function businessProductsMenu(){
 const business=currentManagedBusiness();
 if(!business){info('🏪','لا يوجد مشروع','امتلك مشروعًا أولًا حتى تطلق منتجات.');return;}
 if(!Array.isArray(business.products))business.products=[];
 const active=business.products.filter(product=>product&&product.active!==false);
 const archived=business.products.filter(product=>product&&product.active===false);
 const opts=active.map(product=>{
  const last=Array.isArray(product.history)?product.history[product.history.length-1]:null;
  return choice(product.emoji||'📦',product.title,'السعر '+cash(product.unitPrice)+' · الطلب '+product.demand+'% · المنافسة '+product.competition+'%'+(last?' · آخر نتيجة '+cash(last.profit):' · لم يمر عام مالي بعد'),()=>businessProductDetailMenu(product.id),last?(last.profit>=0?'ربح':'خسارة'):'نشط');
 });
 if(active.length<BUSINESS_PRODUCT_CATALOG.length)opts.push(choice('➕','إطلاق منتج جديد','اختر منتجًا، وابحث عن الطلب والمنافسة أو أطلقه مباشرة مع مخاطرة أعلى.',businessProductCatalogMenu));
 else opts.push(choice('📦','اكتمل خط المنتجات','أوقف منتجًا قائمًا قبل إضافة منتج آخر.',()=>info('📦','خط المنتجات مكتمل','يمكن تشغيل منتج واحد من كل فئة في الوقت نفسه.')));
 if(archived.length)opts.push(choice('📚','المنتجات المتوقفة',archived.map(product=>product.title).join('، '),()=>info('📚','أرشيف المنتجات','المنتجات المتوقفة: '+archived.map(product=>product.title).join('، ')+'. يمكن إطلاقها مجددًا من الكتالوج.')));
 opts.push(choice('↩️','رجوع لإدارة المشروع','',businessMenu));
 modal('🧪','منتجات المشروع','المنتجات النشطة '+active.length+'/'+BUSINESS_PRODUCT_CATALOG.length+' · لكل منتج سجل مبيعات وطلب ومنافسة يتغير مع السنوات.',opts);
}
function businessProductCatalogMenu(){
 const business=currentManagedBusiness();
 if(!business)return;
 const activeIds=new Set((Array.isArray(business.products)?business.products:[]).filter(product=>product&&product.active!==false).map(product=>product.catalogId));
 const available=BUSINESS_PRODUCT_CATALOG.filter(product=>!activeIds.has(product.id));
 const opts=available.map(product=>choice(product.emoji,product.title,product.description+' · سعر استرشادي '+cash(product.unitPrice)+' · تكلفة وحدة '+cash(product.unitCost),()=>businessProductLaunchMenu(product.id)));
 opts.push(choice('↩️','رجوع للمنتجات','',businessProductsMenu));
 modal('🛍️','كتالوج المنتجات','كل فئة لها تكلفة وسعر مرجعيان، والنتيجة الفعلية تعتمد على السوق وقراراتك.',opts);
}
function businessProductLaunchMenu(productId){
 const business=currentManagedBusiness(),catalog=BUSINESS_PRODUCT_CATALOG.find(item=>item.id===productId);
 if(!business||!catalog){businessProductsMenu();return;}
 if(!Array.isArray(business.productResearch))business.productResearch=[];
 const year=Math.max(0,Math.floor(Number(state.age)||0));
 const research=business.productResearch.find(snapshot=>snapshot.productId===productId&&Number(snapshot.year)===year);
 const researchFee=Math.max(500,Math.round(Math.max(0,Number(business.value)||0)*.0035));
 const launchFee=Math.max(1000,Math.round(Math.max(0,Number(business.value)||0)*.012));
 const opts=[];
 if(research){
  opts.push(choice('🚀','إطلاق بنتائج البحث','الطلب '+research.demand+'% · المنافسة '+research.competition+'% · السعر المقترح '+cash(research.suggestedPrice)+' · ثقة البحث '+research.confidence+'%. رسوم الإطلاق '+cash(launchFee)+'.',()=>launchBusinessProduct(productId,true),cash(launchFee)));
 }else{
  opts.push(choice('🔬','إجراء بحث السوق','تقرير عن الطلب والمنافسة والسعر المقترح مقابل '+cash(researchFee)+'.',()=>researchBusinessProduct(productId),cash(researchFee)));
 }
 opts.push(choice('🎲','إطلاق دون بحث','اعتماد تقدير أولي غير مضمون. رسوم الإطلاق '+cash(launchFee)+'.',()=>launchBusinessProduct(productId,false),cash(launchFee)));
 opts.push(choice('↩️','رجوع للكتالوج','',businessProductCatalogMenu));
 modal(catalog.emoji,'إعداد '+catalog.title,'رسوم البحث والإطلاق تُسجل في التقرير المالي للسنة القادمة؛ نتائج البحث تخص السنة الحالية فقط.',opts);
}
function researchBusinessProduct(productId){
 closeModal();
 const business=currentManagedBusiness(),catalog=BUSINESS_PRODUCT_CATALOG.find(item=>item.id===productId);
 if(!business||!catalog)return;
 if(!Array.isArray(business.productResearch))business.productResearch=[];
 const year=Math.max(0,Math.floor(Number(state.age)||0));
 const existing=business.productResearch.find(snapshot=>snapshot.productId===productId&&Number(snapshot.year)===year);
 if(existing){businessProductLaunchMenu(productId);return;}
 const fee=Math.max(500,Math.round(Math.max(0,Number(business.value)||0)*.0035));
 if(businessTreasuryBalance(business)<fee){info('💳','خزينة النشاط غير كافية','بحث السوق يحتاج '+cash(fee)+'. حوّل رأس مال إلى الشركة أولًا.');return;}
 const snapshot=businessProductMarketSnapshot(business,catalog);
 spendBusinessTreasury(business,fee);
 business.pendingProductCosts=Math.max(0,Number(business.pendingProductCosts)||0)+fee;
 business.productResearch=business.productResearch.filter(item=>item.productId!==productId).concat(snapshot).slice(-4);
 log('🔬','اكتمل بحث '+catalog.title,'الطلب المتوقع '+snapshot.demand+'% · المنافسة '+snapshot.competition+'% · السعر المقترح '+cash(snapshot.suggestedPrice)+' · ثقة التقدير '+snapshot.confidence+'%.','good');
 save();render();businessProductLaunchMenu(productId);
}
function launchBusinessProduct(productId,useResearch){
 closeModal();
 const business=currentManagedBusiness(),catalog=BUSINESS_PRODUCT_CATALOG.find(item=>item.id===productId);
 if(!business||!catalog)return;
 if(!Array.isArray(business.products))business.products=[];
 const active=business.products.filter(product=>product&&product.active!==false);
 if(active.some(product=>product.catalogId===productId)){info('📦','المنتج موجود بالفعل','أوقف النسخة الحالية قبل إطلاق منتج جديد من الفئة نفسها.');return;}
 if(active.length>=BUSINESS_PRODUCT_CATALOG.length){info('📦','خط المنتجات مكتمل','أوقف منتجًا قائمًا قبل إضافة منتج جديد.');return;}
 const year=Math.max(0,Math.floor(Number(state.age)||0));
 const researchSnapshot=(Array.isArray(business.productResearch)?business.productResearch:[]).find(snapshot=>snapshot.productId===productId&&Number(snapshot.year)===year);
 if(useResearch&&!researchSnapshot){info('🔬','بحث السوق غير متاح','أعد البحث للسنة الحالية أو أطلق المنتج دون بحث.');return;}
 const research=useResearch?researchSnapshot:null;
 const fee=Math.max(1000,Math.round(Math.max(0,Number(business.value)||0)*.012));
 if(businessTreasuryBalance(business)<fee){info('💳','خزينة النشاط غير كافية','إطلاق المنتج يحتاج '+cash(fee)+'. حوّل رأس مال إلى الشركة أولًا.');return;}
 const supplier=BUSINESS_SUPPLIER_CATALOG.find(item=>business.supplier&&item.id===business.supplier.id);
 const demand=research?research.demand:clamp(34+Math.floor(Math.random()*47),20,85);
 const competition=research?research.competition:clamp(28+Math.floor(Math.random()*55),15,90);
 const unitPrice=research?research.suggestedPrice:Math.max(50,Math.round(catalog.unitPrice*(.9+Math.random()*.2)));
 const quality=clamp(64+(supplier?(Number(business.supplier.quality||supplier.quality)-70)*.35:0),20,100);
 const product={id:'product-'+String(state.lifeId||state.age)+'-'+String(business.assetId||business.id||business.title||'business')+'-'+String(business.products.length+1)+'-'+String(Math.floor(Math.random()*1000000)),catalogId:catalog.id,title:catalog.title,emoji:catalog.emoji,category:catalog.category,unitPrice,unitCost:catalog.unitCost,demand,competition,quality,active:true,launchedAtAge:state.age,lastYearProfit:0,history:[]};
 spendBusinessTreasury(business,fee);
 business.pendingProductCosts=Math.max(0,Number(business.pendingProductCosts)||0)+fee;
 business.products.push(product);
 business.productResearch=Array.isArray(business.productResearch)?business.productResearch.filter(snapshot=>snapshot.productId!==productId):[];
 log('🚀','إطلاق '+product.title,'دفعت '+cash(fee)+' لتجهيز المنتج. سعر البيع '+cash(unitPrice)+'، والطلب الأولي '+demand+'% والمنافسة '+competition+'%.','good');
 save();render();businessProductDetailMenu(product.id);
}
function businessProductDetailMenu(id){
 const business=currentManagedBusiness(),product=business&&Array.isArray(business.products)?business.products.find(item=>String(item.id)===String(id)):null;
 if(!product){businessProductsMenu();return;}
 const last=Array.isArray(product.history)?product.history[product.history.length-1]:null;
 const detail='سعر البيع للوحدة '+cash(product.unitPrice)+' · تكلفة الوحدة الأساسية '+cash(product.unitCost)+' · الطلب '+product.demand+'% · المنافسة '+product.competition+'% · الجودة '+product.quality+'%'+(last?'\nآخر سنة: '+last.unitsSold+' وحدة · إيرادات '+cash(last.revenue)+' · مصروفات '+cash(last.costs)+' · '+(last.profit>=0?'ربح ':'خسارة ')+cash(Math.abs(last.profit)):'\nلم يمر عام مالي كامل منذ الإطلاق.');
 const opts=[];
 if(product.active!==false){
  opts.push(choice('⬆️','رفع السعر 10%','زيادة السعر قد تحسن هامش الوحدة وتقلل الطلب.',()=>adjustBusinessProductPrice(id,1)));
  opts.push(choice('⬇️','خفض السعر 10%','خفض السعر قد يزيد الوحدات المباعة ويضغط هامش الربح.',()=>adjustBusinessProductPrice(id,-1)));
  opts.push(choice('⏸️','إيقاف المنتج','إيقاف المبيعات المستقبلية مع الاحتفاظ بسجل الأداء.',()=>retireBusinessProduct(id)));
 }else opts.push(choice('🚀','إعادة إطلاق الفئة','يمكنك إطلاق نسخة جديدة من الكتالوج بعد مراجعة السوق.',()=>businessProductLaunchMenu(product.catalogId)));
 opts.push(choice('↩️','رجوع للمنتجات','',businessProductsMenu));
 modal(product.emoji||'📦',product.title,detail,opts);
}
function adjustBusinessProductPrice(id,direction){
 closeModal();
 const business=currentManagedBusiness(),product=business&&Array.isArray(business.products)?business.products.find(item=>String(item.id)===String(id)):null;
 if(!product||product.active===false)return;
 const previous=Math.max(50,Number(product.unitPrice)||50);
 product.unitPrice=Math.max(50,Math.round(previous*(direction>0?1.1:.9)));
 log('🏷️','تعديل سعر '+product.title,'تغير سعر البيع من '+cash(previous)+' إلى '+cash(product.unitPrice)+' للوحدة.','special');
 save();render();businessProductDetailMenu(id);
}
function retireBusinessProduct(id){
 closeModal();
 const business=currentManagedBusiness(),product=business&&Array.isArray(business.products)?business.products.find(item=>String(item.id)===String(id)):null;
 if(!product||product.active===false)return;
 product.active=false;
 log('📦','إيقاف '+product.title,'أوقفت المنتج مع الاحتفاظ بسجل مبيعاته وتقاريره السابقة.','bad');
 save();render();businessProductsMenu();
}

function businessMarketMenu(){
 const business=currentManagedBusiness();
 if(!business){info('🏪','لا يوجد نشاط','اختار مشروعًا أو شركة من المحفظة أولًا.');return;}
 const previousYear=business.market&&Number(business.market.year);
 const market=businessMarketSnapshot(business);
 if(previousYear!==market.year)save();
 const change=Number(market.lastYearShareChange)||0;
 const rivals=(market.rivals||[]).filter(rival=>rival&&rival.active!==false).slice(0,6);
 const rivalDetail=rivals.length?'\nالشركات المنافسة داخل المحاكاة:\n'+rivals.map((rival,index)=>(index+1)+'. '+rival.name+' — '+rival.product+'\nقرار السنة: '+rival.lastDecision+' · السعر '+rival.priceIndex+'% · الجودة '+rival.qualityIndex+'% · الطاقة '+rival.capacityIndex+'% · الحصة '+rival.marketShare+'%').join('\n\n'):'\nلا توجد كيانات منافسة مسجلة لهذا السوق بعد.';
 const detail='القطاع: '+market.industry+'\nمؤشر الطلب: '+market.demandIndex+'/115\nحدة المنافسة: '+market.competitionIndex+'/100\nعدد الشركات المنافسة: '+market.competitorCount+'\nمتوسط سعر المنافسين: '+market.rivalPriceIndex+'% من السعر المرجعي\nمتوسط الجودة: '+market.rivalQualityIndex+'% · التسويق: '+market.rivalMarketingIndex+'% · الطاقة: '+market.rivalCapacityIndex+'%\nحصتك التقديرية: '+market.marketShare+'%\nآخر تغير في الحصة: '+(change>=0?'+':'')+change+'%'+rivalDetail+'\nتتحرك الشركات مع كل سنة مالية بقرارات مستقلة محفوظة داخل هذا النشاط. هذه محاكاة داخلية وليست بيانات سوق حقيقية.';
 modal('📈','السوق والمنافسون',detail,[
  choice('🧪','إدارة المنتجات','راجع أسعارك ونتائج المنتجات.',businessProductsMenu),
  choice('📊','التقرير السنوي','راجع أثر السوق وتحركات المنافسين.',()=>businessReportsMenu(business,business.title||'النشاط',businessMenu)),
  choice('↩️','رجوع لإدارة النشاط','',businessMenu)
 ]);
}

function businessTaxLiability(business){
 if(!business||typeof business!=='object')return 0;
 return Math.max(0,Math.min(8000000000,Math.round(Number(business.taxLiability)||0)));
}
function repayBusinessTax(amount){
 closeModal();
 const business=currentManagedBusiness();
 if(!business)return;
 const due=businessTaxLiability(business),payment=Math.min(due,Math.max(0,Math.round(Number(amount)||0)));
 if(payment<=0){businessTreasuryMenu();return;}
 if(businessTreasuryBalance(business)<payment){info('🧾','السيولة غير كافية','سداد '+cash(payment)+' من المتأخرات يحتاج رصيدًا داخل خزينة النشاط.');return;}
 adjustBusinessTreasury(business,-payment);
 business.taxLiability=Math.max(0,due-payment);
 business.pendingTaxPayments=Math.min(8000000000,Math.max(0,Math.round(Number(business.pendingTaxPayments)||0))+payment);
 log('🧾','سداد التزامات ضريبية · '+(business.title||'النشاط'),'سددت '+cash(payment)+' من المتأخرات الضريبية من خزينة النشاط.','good');
 save();render();businessTreasuryMenu();
}
function businessUsesSeparateTreasury(business){
 return !!business&&business.treasuryMode==='separate';
}
function businessTreasuryBalance(business){
 if(!business)return 0;
 if(!businessUsesSeparateTreasury(business))return Math.round(Number(state.bank)||0);
 const balance=Number(business.cashBalance);
 return Number.isFinite(balance)?Math.round(balance):0;
}
function adjustBusinessTreasury(business,amount){
 if(!business||!Number.isFinite(Number(amount)))return 0;
 const delta=Math.round(Number(amount));
 if(businessUsesSeparateTreasury(business)){
  const current=businessTreasuryBalance(business);
  business.cashBalance=Math.max(-1000000000000,Math.min(1000000000000,current+delta));
  return business.cashBalance;
 }
 state.bank=Math.max(-1000000000000,Math.min(1000000000000,Math.round(Number(state.bank)||0)+delta));
 return state.bank;
}
function spendBusinessTreasury(business,amount){
 const cost=Math.max(0,Math.round(Number(amount)||0));
 if(businessTreasuryBalance(business)<cost)return false;
 adjustBusinessTreasury(business,-cost);
 return true;
}
function activateBusinessTreasury(amount){
 closeModal();
 const business=currentManagedBusiness();
 if(!business)return;
 if(businessUsesSeparateTreasury(business)){businessTreasuryMenu();return;}
 const capital=Math.min(1000000000000,Math.max(0,Math.round(Number(amount)||0)));
 if(capital>0&&Number(state.bank||0)<capital){info('💳','الرصيد الشخصي غير كافٍ','لا يمكن تحويل رأس مال أكبر من رصيدك الحالي.');return;}
 state.bank=Math.round(Number(state.bank)||0)-capital;
 business.treasuryMode='separate';
 business.cashBalance=capital;
 business.pendingOwnerContributions=Math.min(1000000000000,Math.max(0,Math.round(Number(business.pendingOwnerContributions)||0))+capital);
 business.pendingOwnerWithdrawals=Math.max(0,Math.round(Number(business.pendingOwnerWithdrawals)||0));
 log('🏦','فصل خزينة '+(business.title||'النشاط'),'أصبحت أموال النشاط مستقلة عن رصيدك الشخصي. حُوّل '+cash(capital)+' كرأس مال افتتاحي من المالك.','good');
 save();render();businessTreasuryMenu();
}
function transferBusinessCapital(direction,amount){
 closeModal();
 const business=currentManagedBusiness();
 if(!business||!businessUsesSeparateTreasury(business))return;
 const requested=Math.min(1000000000000,Math.max(0,Math.round(Number(amount)||0)));
 if(!requested){businessTreasuryMenu();return;}
 if(direction==='ownerToCompany'){
  const value=Math.min(requested,Math.max(0,1000000000000-businessTreasuryBalance(business)));
  if(value<=0){info('🏦','الخزينة وصلت للحد','لا يمكن إضافة رأس مال أكثر من الحد الآمن لخزينة الشركة.');return;}
  if(Number(state.bank||0)<value){info('💳','الرصيد الشخصي غير كافٍ','لا يمكن تحويل '+cash(value)+' إلى خزينة الشركة.');return;}
  state.bank=Math.round(Number(state.bank)||0)-value;
  adjustBusinessTreasury(business,value);
  business.pendingOwnerContributions=Math.min(1000000000000,Math.max(0,Math.round(Number(business.pendingOwnerContributions)||0))+value);
  log('🏦','زيادة رأس مال الشركة','حوّلت '+cash(value)+' من رصيدك الشخصي إلى خزينة '+(business.title||'النشاط')+'.','good');
 }else if(direction==='companyToOwner'){
  const value=Math.min(requested,Math.max(0,businessTreasuryBalance(business)));
  if(value<=0){info('💳','خزينة الشركة غير كافية','لا توجد نقدية موجبة قابلة للسحب من النشاط.');return;}
  adjustBusinessTreasury(business,-value);
  state.bank=Math.round(Number(state.bank)||0)+value;
  business.pendingOwnerWithdrawals=Math.min(1000000000000,Math.max(0,Math.round(Number(business.pendingOwnerWithdrawals)||0))+value);
  log('💵','سحب من خزينة الشركة','حوّلت '+cash(value)+' من خزينة '+(business.title||'النشاط')+' إلى رصيدك الشخصي.','good');
 }
 save();render();businessTreasuryMenu();
}
function businessTreasuryMenu(){
 const business=currentManagedBusiness();
 if(!business){info('🏦','لا يوجد نشاط','اختار مشروعًا أو شركة من المحفظة أولًا.');return;}
 const separate=businessUsesSeparateTreasury(business);
 const ownerCash=Math.max(0,Math.round(Number(state.bank)||0));
 const companyCash=businessTreasuryBalance(business);
 const taxLiability=businessTaxLiability(business);
 const opts=[];
 if(!separate){
  const seen=new Set();
  [.1,.25,.5].forEach(ratio=>{
   const amount=Math.min(1000000000000,Math.round(ownerCash*ratio));
   if(amount<=0||seen.has(amount))return;
   seen.add(amount);
   opts.push(choice('🔓','فصل الخزينة وتحويل '+Math.round(ratio*100)+'% من رصيدك','نقل '+cash(amount)+' كرأس مال افتتاحي من أموالك الشخصية إلى الشركة.',()=>activateBusinessTreasury(amount),cash(amount)));
  });
  opts.push(choice('🏦','فصل الخزينة بدون تحويل','إنشاء حساب مستقل للنشاط والبدء برصيد صفر، ثم تمويله عند الحاجة.',()=>activateBusinessTreasury(0),'0'));
 }else{
  const seenIn=new Set();
  [.1,.25,.5].forEach(ratio=>{
   const amount=Math.min(1000000000000,Math.round(ownerCash*ratio));
   if(amount<=0||seenIn.has(amount))return;
   seenIn.add(amount);
   opts.push(choice('➕','إضافة '+Math.round(ratio*100)+'% من رصيدك إلى الشركة','تحويل '+cash(amount)+' من أموالك الشخصية إلى خزينة النشاط.',()=>transferBusinessCapital('ownerToCompany',amount),cash(amount)));
  });
  const seenOut=new Set();
  [.25,.5,1].forEach(ratio=>{
   const amount=Math.min(1000000000000,Math.round(companyCash*ratio));
   if(amount<=0||seenOut.has(amount))return;
   seenOut.add(amount);
   opts.push(choice('↗️','سحب '+Math.round(ratio*100)+'% من خزينة الشركة','تحويل '+cash(amount)+' من أموال النشاط إلى رصيدك الشخصي.',()=>transferBusinessCapital('companyToOwner',amount),cash(amount)));
  });
 }
 if(taxLiability>0){
  [.25,.5,1].forEach(ratio=>{
   const amount=Math.min(taxLiability,Math.max(1,Math.round(taxLiability*ratio)));
   if(amount>0&&amount<=companyCash)opts.push(choice('🧾','سداد '+Math.round(ratio*100)+'% من المتأخرات الضريبية','دفع '+cash(amount)+' من خزينة النشاط لتخفيض الالتزام الضريبي.',()=>repayBusinessTax(amount),cash(amount)));
  });
 }
 opts.push(choice('↩️','رجوع لإدارة النشاط','',businessMenu));
 const detail=separate
  ?'الخزينة مستقلة. رصيد الشركة '+cash(companyCash)+' · رصيدك الشخصي '+cash(ownerCash)+'. المتأخرات الضريبية '+cash(taxLiability)+'. التحويلات بين المالك والشركة تسجل في التقرير السنوي ولا تختلط بالمبيعات أو الأرباح.'
  :'هذا حفظ قديم يستخدم الرصيد المشترك للتوافق. القروض القديمة تظل مرتبطة بالنشاط؛ اختر رأس مال افتتاحيًا اختياريًا أو ابدأ بصفر. المتأخرات الضريبية '+cash(taxLiability)+'. بعد الفصل تتحمل الشركة مصروفاتها من رصيدها وحده.';
 modal('🏦','خزينة النشاط ورأس المال',detail,opts);
}

function businessCreditBalance(business){
 if(!business||typeof business!=='object')return 0;
 const credit=business.credit&&typeof business.credit==='object'?business.credit:null;
 if(!credit)return 0;
 return Math.max(0,Math.min(200000000,Math.round(Number(credit.principal)||0)+Math.round(Number(credit.accruedInterest)||0)));
}
function businessCreditLimit(business){
 const value=Math.max(1000,Number(business&&business.value)||1000);
 return Math.max(10000,Math.min(100000000,Math.round(value*.35)));
}
function businessCreditRate(business){
 const market=businessMarketSnapshot(business);
 const profile=businessIndustryProfile(market&&market.industry);
 const competition=Math.max(10,Math.min(95,Number(market&&market.competitionIndex)||50));
 const riskPremium=Math.max(0,(profile.operatingCostMultiplier-1)*.08)+Math.max(0,competition-45)*.0002;
 return Math.round(Math.max(.075,Math.min(.14,.085+riskPremium))*10000)/10000;
}
function businessCreditMenu(){
 const business=currentManagedBusiness();
 if(!business){info('🏦','لا يوجد نشاط','اختار مشروعًا أو شركة من المحفظة أولًا.');return;}
 const credit=business.credit&&typeof business.credit==='object'?business.credit:null;
 const balance=businessCreditBalance(business),principal=credit?Math.max(0,Math.round(Number(credit.principal)||0)):0;
 const accrued=credit?Math.max(0,Math.round(Number(credit.accruedInterest)||0)):0;
 const limit=businessCreditLimit(business),rate=credit?Number(credit.annualRate)||businessCreditRate(business):businessCreditRate(business);
 save();
 const opts=[];
 if(balance<=0){
  const amounts=[...new Set([Math.max(5000,Math.round(limit*.5)),limit])].filter(amount=>amount>0&&amount<=limit);
  amounts.forEach(amount=>opts.push(choice('🏦','طلب تمويل '+cash(amount),'تسهيل برصيد '+cash(amount)+' · فائدة سنوية '+(rate*100).toFixed(2)+'% · السداد اختياري على دفعات من السيولة المتاحة.',()=>borrowBusinessCredit(amount),cash(amount))));
 }else{
  [0.25,0.5,1].forEach(ratio=>{
   const amount=Math.min(balance,Math.max(1,Math.round(balance*ratio)));
   opts.push(choice('💵',ratio===1?'سداد كامل الرصيد':'سداد '+Math.round(ratio*100)+'%','سداد '+cash(amount)+'؛ تُسوى الفوائد المتراكمة أولًا ثم أصل التمويل.',()=>repayBusinessCredit(amount),cash(amount)));
  });
 }
 opts.push(choice('↩️','رجوع لإدارة النشاط','',businessMenu));
 const cashLabel=businessUsesSeparateTreasury(business)?'خزينة الشركة المتاحة '+cash(businessTreasuryBalance(business)):'الرصيد المشترك المتاح '+cash(businessTreasuryBalance(business))+' (وضع توافق للحفظ القديم)';
 const detail='حد التمويل التقديري '+cash(limit)+' · الرصيد المستحق '+cash(balance)+' · أصل التمويل '+cash(principal)+' · فوائد متراكمة '+cash(accrued)+' · الفائدة السنوية '+(rate*100).toFixed(2)+'% · '+cashLabel+'. التمويل يضاف إلى خزينة النشاط المستقلة عند تفعيلها.';
 modal('🏦','تمويل النشاط',detail,opts);
}
function borrowBusinessCredit(amount){
 closeModal();
 const business=currentManagedBusiness();
 if(!business)return;
 if(businessCreditBalance(business)>0){info('🏦','يوجد تمويل قائم','سدّد التمويل الحالي قبل طلب تسهيل جديد.');return;}
 const limit=businessCreditLimit(business),value=Math.round(Number(amount)||0);
 if(value<5000||value>limit){info('🏦','قيمة التمويل غير متاحة','قيمة التسهيل يجب أن تكون بين '+cash(5000)+' و'+cash(limit)+'.');return;}
 const rate=businessCreditRate(business);
 business.credit={principal:value,accruedInterest:0,annualRate:rate,openedAtAge:Math.max(0,Number(state.age)||0),lastInterestAge:Math.max(-1,Number(state.age)||0)};
 adjustBusinessTreasury(business,value);
 log('🏦','تمويل تجاري · '+(business.title||'النشاط'),'حصل النشاط على تسهيل '+cash(value)+' بفائدة سنوية '+(rate*100).toFixed(2)+'%. أُضيفت السيولة إلى خزينة النشاط'+(businessUsesSeparateTreasury(business)?' المستقلة':' المشتركة مؤقتًا للحفظ القديم')+'.','good');
 save();render();businessCreditMenu();
}
function repayBusinessCredit(amount){
 closeModal();
 const business=currentManagedBusiness();
 if(!business||!business.credit)return;
 const credit=business.credit,balance=businessCreditBalance(business),payment=Math.min(balance,Math.max(0,Math.round(Number(amount)||0)));
 if(payment<=0){businessCreditMenu();return;}
 if(businessTreasuryBalance(business)<payment){info('💳','خزينة النشاط غير كافية','سداد '+cash(payment)+' يحتاج رصيدًا داخل الشركة. حوّل رأس مال أو انتظر تحسن التدفق النقدي.');return;}
 adjustBusinessTreasury(business,-payment);
 let remaining=payment;
 const interestPaid=Math.min(Math.max(0,Number(credit.accruedInterest)||0),remaining);
 credit.accruedInterest=Math.max(0,Math.round((Number(credit.accruedInterest)||0)-interestPaid));
 remaining-=interestPaid;
 const principalPaid=Math.min(Math.max(0,Number(credit.principal)||0),remaining);
 credit.principal=Math.max(0,Math.round((Number(credit.principal)||0)-principalPaid));
 if(businessCreditBalance(business)===0)business.credit=null;
 log('💵','سداد تمويل · '+(business.title||'النشاط'),'سددت '+cash(payment)+'؛ منها '+cash(interestPaid)+' فوائد و'+cash(principalPaid)+' من أصل التمويل.','good');
 save();render();businessCreditMenu();
}

function businessMenu(){
 const b=currentManagedBusiness();
 if(!b){if(perkOwned('businessPack')){companyPortfolioMenu();return;}info('🏪','مفيش مشروع حاليًا','اشتري مشروعًا صغيرًا من قائمة الأصول عشان تبدأ الإدارة.');return;}
 const isPortfolioCompany=managedCompanyId!==null&&String(b.id)===String(managedCompanyId);
 const portfolioIndex=isPortfolioCompany?managedCompanyIndex():-1;
 const level=Math.max(1,b.level||1),supplier=BUSINESS_SUPPLIER_CATALOG.find(item=>b.supplier&&item.id===b.supplier.id);
 const staff=Array.isArray(b.staff)?b.staff:[];
 const staffPayroll=staff.reduce((sum,employee)=>sum+Math.max(0,Number(employee.salary)||0),0);
 const activeProducts=(Array.isArray(b.products)?b.products:[]).filter(product=>product&&product.active!==false).length;
 const facilities=Array.isArray(b.facilities)?b.facilities:[];
 const facilityCapacityBonus=facilities.reduce((sum,facility)=>sum+Math.max(0,Math.min(1.5,Number(facility.capacityBonus)||0)),0);
 const facilityStatus=' · المنشآت '+facilities.length+'/8 · طاقة إضافية '+Math.round(facilityCapacityBonus*100)+'%';
 const treasuryStatus=businessUsesSeparateTreasury(b)?' · خزينة الشركة '+cash(businessTreasuryBalance(b)):' · خزينة مشتركة (حفظ قديم)';
 const supplierStatus=supplier?' · المورد '+supplier.title+' ('+(Number(b.supplier.yearsLeft)||0)+' سنوات متبقية)':' · لم يتم التعاقد مع مورد';
 const staffStatus=' · فريق العمل '+staff.length+'/5 · الرواتب السنوية '+cash(staffPayroll);
 const productStatus=' · المنتجات النشطة '+activeProducts+'/'+BUSINESS_PRODUCT_CATALOG.length;
 const creditBalance=businessCreditBalance(b);
 const creditStatus=creditBalance?' · تمويل مستحق '+cash(creditBalance):' · دون تمويل تجاري';
 const taxLiability=businessTaxLiability(b);
 const taxLabel=taxLiability?' · متأخرات ضريبية '+cash(taxLiability):' · لا توجد متأخرات ضريبية';
 const opts=[
  choice('📊','التقرير السنوي','راجع الإيرادات والمصروفات وصافي النتيجة.',()=>businessReportsMenu(b,b.title||'مشروعك',businessMenu)),
  choice('🏦','خزينة النشاط ورأس المال','افصل أموال الشركة عن أموالك الشخصية أو حوّل رأس المال بين الحسابين.',businessTreasuryMenu,cash(businessTreasuryBalance(b))),
  choice('🏦','تمويل النشاط','اطلب تسهيلًا تجاريًا أو سدّد التمويل القائم مع متابعة الفوائد.',businessCreditMenu,creditBalance?cash(creditBalance):cash(businessCreditLimit(b))),
  choice('📦','التعاقد مع مورد','قارن الجودة والتكلفة ومدة العقد قبل الاختيار.',businessSupplierMenu),
  choice('👥','إدارة الموظفين','عيّن فريقًا صغيرًا ودرّبه وراجع أثر الرواتب على أرباح النشاط.',businessStaffMenu),
  choice('🧪','إدارة المنتجات','أطلق منتجات جديدة وابحث عن الطلب والمنافسة قبل الاستثمار.',businessProductsMenu),
  choice('📈','تحليل السوق والمنافسين','راجع الطلب والمنافسة وعدد المنافسين وحصتك التقديرية.',businessMarketMenu),
  choice('📣','حملة تسويق','حملة تكلف 2,500 '+state.place.unit+' قد ترفع المبيعات والسمعة.',()=>businessAction('marketing'),'2,500 '+state.place.unit),
  choice('👔','تعيين مدير','تحسين الإدارة مقابل 5,000 '+state.place.unit+'؛ يزيد الكفاءة السنوية.',()=>businessAction('manager'),'5,000 '+state.place.unit),
  choice('🏗️','الفروع والمصانع','افتح متجرًا أو مصنعًا لزيادة الطاقة الإنتاجية مقابل استثمار وصيانة سنوية.',businessFacilitiesMenu),
  ...(perkOwned('businessPack')?[choice('🏢','محفظة الشركات','شراء شركات إضافية وإدارة كل نشاط بصورة مستقلة.',companyPortfolioMenu)]:[]),
  choice('🧾','تقليل النفقات','مراجعة العمليات لتقليل المصاريف السنوية.',()=>businessAction('costs')),
  isPortfolioCompany&&portfolioIndex>=0
   ?choice('↩️','رجوع لملف الشركة','العودة إلى ملخص الشركة في المحفظة.',()=>companyDetailMenu(portfolioIndex))
   :choice('↩️','رجوع للأصول','',()=>{closeModal();assets();})
 ];
 modal('🏪','إدارة '+(b.title||'مشروعك'),'قيمة النشاط '+cash(b.value)+' · مستوى الإدارة '+level+' · الشهرة '+(state.fame||0)+'%'+supplierStatus+staffStatus+productStatus+facilityStatus+creditStatus+taxLabel+treasuryStatus+'. اختيارات الإدارة تؤثر على دخل السنوات القادمة.',opts);
}

function businessAction(action){
 closeModal();const b=currentManagedBusiness();if(!b)return;
 if(action==='marketing'){
  if(!spendBusinessTreasury(b,2500)){info('💳','خزينة النشاط غير كافية','حملة التسويق تكلف 2,500 '+state.place.unit+'. حوّل رأس مال إلى الشركة أولًا.');return;}const win=chance(.7),gain=win?Math.round(b.value*(.04+Math.random()*.12)):0;state.fame=clamp((state.fame||0)+(win?3:1));state.reputation=clamp((state.reputation||50)+(win?4:-1));if(gain)b.value+=gain;
  log('📣','حملة تسويقية · '+(b.title||'المشروع'),win?'الحملة جابت عملاء جدد ورفعت قيمة النشاط التقديرية '+cash(gain)+'.':'الحملة ما جابتش النتيجة المتوقعة، لكنك عرفت جمهورك أفضل.',win?'good':'bad');render();info('📣','انتهت الحملة',win?'قيمة النشاط بقت '+cash(b.value)+'.':'راجع الجمهور والميزانية قبل الحملة الجاية.');return;
 }
 if(action==='manager'){
  if(!spendBusinessTreasury(b,5000)){info('💳','خزينة النشاط غير كافية','تعيين مدير يكلف 5,000 '+state.place.unit+'. حوّل رأس مال إلى الشركة أولًا.');return;}b.level=clamp((b.level||1)+1,1,20);b.value=Math.round(b.value*1.06);log('👔','تعيين مدير · '+(b.title||'المشروع'),'استثمرت في الإدارة وارتفع مستوى النشاط إلى '+b.level+'. التكاليف السنوية هتزيد قليلًا، لكن الكفاءة تتحسن.','good');render();info('👔','الإدارة اتحسنت','مستوى النشاط بقى '+b.level+'، وده هيؤثر على التقرير السنوي.');return;
 }
 if(action==='expand'){
  if(!spendBusinessTreasury(b,10000)){info('💳','خزينة النشاط غير كافية','توسيع النشاط يكلف 10,000 '+state.place.unit+'. حوّل رأس مال إلى الشركة أولًا.');return;}b.value=Math.round(b.value*1.25);b.level=clamp((b.level||1)+1,1,20);log('🏗️','توسيع '+(b.title||'المشروع'),'وسّعت النشاط واستثمرت في النمو. القيمة التقديرية الجديدة '+cash(b.value)+'.','special');render();info('🏗️','التوسع اكتمل','النشاط بقى أكبر، لكنه محتاج متابعة للمصاريف.');return;
 }
 if(action==='costs'){
  const saved=Math.round(b.value*(.015+Math.random()*.025));b.value=Math.max(1000,Math.round(b.value*1.01));state.reputation=clamp((state.reputation||50)+(chance(.75)?2:-2));log('🧾','مراجعة المصاريف · '+(b.title||'المشروع'),'راجعت الموردين والعمليات وخفضت تكاليفًا تقديرية بقيمة '+cash(saved)+' في التقرير السنوي.','good');render();info('🧾','تمت مراجعة العمليات','التوفير أثره هيبان على الربح السنوي المتوقع.');
 }
}
function buyAsset(a){
 closeModal();if(state.age<18){info('🔒','الشراء مش متاح دلوقتي','تقدر تشتري أصولك بعد سن 18.');return;}
 if(a.kind==='business'&&(state.business||(state.assets||[]).some(x=>x.kind==='business'))){if(perkOwned('businessPack')){companyPortfolioMenu();return;}info('🏪','عندك مشروع بالفعل','النسخة الحالية بتدعم إدارة مشروع واحد؛ افتح باقة الملياردير لامتلاك شركات إضافية.');return;}
 if(state.bank<a.value){info('💳','الرصيد مش كفاية','معاك '+cash(state.bank)+'، وسعر الأصل '+cash(a.value)+'.');return;}
 const assetId=Date.now()+Math.random();state.bank-=a.value;flash('-'+cash(a.value),true);
 const condition=(a.kind==='car'||a.kind==='property')?100:undefined;
 state.assets.push({id:assetId,title:a.title,emoji:a.emoji,kind:a.kind,value:a.value,upkeep:a.upkeep,bought:state.age,...(condition===undefined?{}:{condition})});
 if(a.kind==='business')state.business={assetId,title:a.title,value:a.value,level:1,treasuryMode:'separate',cashBalance:0,pendingOwnerContributions:0,pendingOwnerWithdrawals:0};
 stat('happiness',6);log(a.emoji,'اشتريت '+a.title,'دفعت '+cash(a.value)+'. خلي بالك من مصاريف الصيانة كل سنة.','good');achievement('امتلاك '+a.title);render();info('🎉','مبروك الأصل الجديد','الأصل اتضاف لممتلكاتك، وتقدر تبيعه لاحقًا حسب قيمته وحالته الحالية.');
}

function landlordTenantMenu(index){
 const property=(state.assets||[])[index];if(!property||property.kind!=='property'){manageAssets();return;}
 if(!perkOwned('landlordPack')){info('🔒','إدارة المستأجرين مقفولة','افتح باقة الملياردير من متجر مزايا حياة.');return;}
 const tenant=property.tenant,opts=[];
 if(!tenant)opts.push(choice('🔑','توقيع عقد مع مستأجر','اختيار مستأجر جديد ودخل إيجار مرتبط بالعقد.',()=>signPropertyTenant(index)));
 else{
  opts.push(choice('📊','تفاصيل عقد الإيجار',tenant.name+' · الإيجار السنوي '+cash(tenant.rent)+' · متبقي '+tenant.yearsLeft+' سنة · الرضا '+tenant.satisfaction+'%.',()=>{closeModal();info('📑','عقد '+property.title,'المستأجر: '+tenant.name+' · الإيجار السنوي '+cash(tenant.rent)+' · المدة المتبقية '+tenant.yearsLeft+' سنة · رضا المستأجر '+tenant.satisfaction+'%.');}));
  opts.push(choice('📈','رفع الإيجار 10%','دخل أعلى مع احتمال تراجع رضا المستأجر.',()=>changeTenantRent(index,1.1)));
  opts.push(choice('🤝','خفض الإيجار 10%','دخل أقل مقابل زيادة رضا المستأجر.',()=>changeTenantRent(index,.9)));
  opts.push(choice('📆','تجديد عقد لثلاث سنوات','تأمين دخل الإيجار لثلاث سنوات.',()=>{closeModal();property.tenant.yearsLeft=3;log('📑','تجديد عقد إيجار','جددت عقد '+tenant.name+' للعقار '+property.title+' لمدة 3 سنوات.','good');save();render();landlordTenantMenu(index);}));
  opts.push(choice('🚪','إنهاء عقد الإيجار','إخلاء العقار وإيقاف دخل الإيجار.',()=>{closeModal();property.tenant=null;property.rented=false;log('🏠','إنهاء عقد إيجار','أنهيت عقد العقار '+property.title+'.','');save();render();manageAssets();}));
 }
 opts.push(choice('↩️','رجوع للأصول','',manageAssets));
 modal('🏘️','إدارة المستأجرين · '+property.title,'إدارة العقارات بعقود ومدد ورضا المستأجرين.',opts);
}
function signPropertyTenant(index){
 closeModal();const property=(state.assets||[])[index];if(!property||property.kind!=='property')return;
 const names=['أحمد','مريم','عمر','نور','يوسف','ليلى','كريم','سلمى'];
 property.tenant={name:pick(names),rent:Math.round((property.value||0)*.045),yearsLeft:1,satisfaction:70};property.rented=true;
 log('🔑','توقيع عقد إيجار','وقعت عقدًا مع '+property.tenant.name+' للعقار '+property.title+'.','good');save();render();landlordTenantMenu(index);
}
function changeTenantRent(index,multiplier){
 closeModal();const property=(state.assets||[])[index];if(!property||!property.tenant)return;
 property.tenant.rent=Math.max(500,Math.round(property.tenant.rent*multiplier));property.tenant.satisfaction=clamp(property.tenant.satisfaction+(multiplier<1?10:-12));
 log('📑','تعديل عقد الإيجار','أصبح الإيجار السنوي '+cash(property.tenant.rent)+'، ورضا المستأجر '+property.tenant.satisfaction+'%.',multiplier<1?'good':'');save();render();landlordTenantMenu(index);
}
function manageAssets(){
 const opts=state.assets.map((a,i)=>{
  const condition=(a.kind==='property'||a.kind==='car')?clamp(a.condition??100):null;
  const conditionText=condition===null?'':(' · الحالة '+condition+'%');
  const sale=Math.round(a.value*(condition===null?0.8:(.6+.004*condition)));
  const progress=condition===null?null:condition;
  return choice(a.emoji,a.title,'القيمة '+cash(a.value)+conditionText+' · الصيانة '+cash(a.upkeep)+' سنويًا'+(a.kind==='property'?(a.rented?' · مؤجّر':' · غير مؤجّر'):''),()=>{
   closeModal();
   if(a.companyPortfolio){const companyIndex=(state.companies||[]).findIndex(c=>c.id===a.id);if(companyIndex>=0){companyDetailMenu(companyIndex);return;}}
   const actions=[];
   if(condition!==null)actions.push(choice('🧰','صيانة / تجديد','استعادة الحالة إلى 100% ورفع قيمة إعادة البيع.',()=>maintainAsset(i),cash(Math.max(500,Math.round(a.value*(a.kind==='car'?.018:.03)*((100-condition)/100))))));
   actions.push(choice('💵','أبيع الأصل','القيمة المتوقعة حاليًا '+cash(sale),()=>sellAsset(i),cash(sale)));
   if(a.kind==='property')actions.push(choice('🔑',a.rented?'إيقاف التأجير':'عرض العقار للإيجار','دخل إيجار سنوي تقديري '+cash(Math.round(a.value*.045))+'.',()=>{closeModal();a.rented=!a.rented;log('🏠',a.rented?'تأجير عقار':'إيقاف تأجير العقار',a.rented?'عرضت '+a.title+' للإيجار وبدأ احتساب دخل سنوي.':'أوقفت التأجير للعقار '+a.title+'.',a.rented?'good':'');render();manageAssets();}));
   if(a.kind==='property'&&perkOwned('landlordPack'))actions.push(choice('🏘️','إدارة المستأجرين','عقود إيجار وتفاوض على السعر وتجديد العقد.',()=>landlordTenantMenu(i)));
   actions.push(choice('↩️','أحتفظ بيه','',closeModal));
   const detail=condition===null?'القيمة الحالية '+cash(a.value)+'.':'حالة الأصل '+condition+'%'+(condition<31?' — محتاج صيانة قريب.':' — الحالة جيدة نسبيًا.');
   info('💰','إدارة '+a.title,detail,actions);
  },cash(sale),progress);
 });
 if(!opts.length)opts.push(choice('📦','مفيش أصول لسه','ابدأ بالشراء لما ميزانيتك تسمح.',()=>{closeModal();assets();}));
 opts.push(choice('↩️','رجوع للأصول','',()=>{closeModal();assets();}));
 modal('📦','الأصول والمشتريات','الأصول لها قيمة سوقية وحالة وصيانة. الحالة الأقل تعني سعر بيع أقل.',opts);
}

function sellAsset(index){
 closeModal();const a=state.assets[index];if(!a)return;
 const condition=(a.kind==='property'||a.kind==='car')?clamp(a.condition??100):null;
 const sale=Math.round(a.value*(condition===null?0.8:(.6+.004*condition)));
 state.assets.splice(index,1);
 if(a.kind==='business'&&state.business&&state.business.assetId===a.id)state.business=null;
 state.bank+=sale;log('💵','بيع أصل','بعت '+a.title+' مقابل '+cash(sale)+'.','good');render();
 info('💵','تم بيع الأصل','اتضاف '+cash(sale)+' لرصيدك بعد احتساب حالة الأصل.');
}
function maintainAsset(index){
 closeModal();const a=state.assets[index];if(!a)return;
 if(a.kind!=='property'&&a.kind!=='car'){info('🧰','الصيانة غير متاحة','النوع ده ملوش نظام حالة في النسخة الحالية.');return;}
 const condition=clamp(a.condition??100),missing=100-condition;
 if(missing===0){info('✅','الأصل في أفضل حالة','مش محتاج صيانة دلوقتي.');return;}
 const cost=Math.max(500,Math.round(a.value*(a.kind==='car'?.018:.03)*(missing/100)));
 if(state.bank<cost){info('💳','الرصيد مش كفاية','الصيانة أو التجديد تكلف '+cash(cost)+'. حاول توفر المبلغ الأول.');return;}
 const before=condition;state.bank-=cost;a.condition=100;
 a.value=Math.round(a.value*(1+missing*.0015));
 log(a.kind==='car'?'🔧':'🏠','صيانة / تجديد '+a.title,'دفعت '+cash(cost)+'، ورجّعت الحالة من '+before+'% إلى 100%. قيمة إعادة البيع المتوقعة اتحسنت.','good');
 render();info('🧰','الصيانة اكتملت',a.title+' بقى في حالة 100%، وتكلفة الصيانة اتخصمت من رصيدك.');
}
function person(gender,relation,emoji,age,level){return {id:relation+'-'+Math.random().toString(36).slice(2,8),name:pick(names[gender])+' '+pick(names.family),relation,emoji,age,job:pick(['طالب','محاسب','مصمم','مدرس','موظف','مطور']),generosity:25+Math.floor(Math.random()*76),craziness:Math.floor(Math.random()*101),money:Math.floor(Math.random()*101),petulance:Math.floor(Math.random()*101),loyalty:25+Math.floor(Math.random()*76),jealousy:Math.floor(Math.random()*101),reliability:25+Math.floor(Math.random()*76),interactions:[],relationshipLevel:level,personality:pick(['حنون','عملي','مرح','جاد','طموح','فضولي'])};}
function relations(){
 const opts=[section('مزايا إضافية')];
 opts.push(choice('💍','خاتم الهالة','ميزة دائمة تضيف لمسة مميزة إلى حضور الشخصية.',()=>routePack('auraRing',auraRingMenu),'',null,!perkOwned('auraRing')));
 opts.push(choice('🕯️','مجتمع خيالي','أنشئ مجتمعًا خاصًا وأدر أعضاءه وموارده.',()=>routePack('cultPack',cultMenu),'',null,!perkOwned('cultPack')));
 opts.push(section('الوالدان'));
 const parents=(state.family||[]).filter(n=>/(الأب|الأم|والد|والدة|father|mother|parent)/i.test(n.relation||''));
 const others=(state.family||[]).filter(n=>!parents.includes(n));
 parents.forEach(n=>{
  if(n.deceased)opts.push(choice('🕯️',n.name+' · '+n.relation,'ذكرى عائلية · توفي عن عمر '+(n.age||'?')+' سنة.',()=>{closeModal();info('🕯️',n.name,'هذا الفرد من العائلة جزء من تاريخ حياتك، وسجّلت اللعبة وفاته في دفتر الأحداث.');}));
  else opts.push(choice(n.emoji,n.name+' · '+n.relation,'مستوى العلاقة '+n.relationshipLevel+'%',()=>{closeModal();personModal(n);},n.relationshipLevel+'%',n.relationshipLevel));
 });
 if(others.length){opts.push(section('باقي أفراد العائلة'));others.forEach(n=>opts.push(choice(n.deceased?'🕯️':n.emoji,n.name+' · '+n.relation,n.deceased?'ذكرى عائلية':'مستوى العلاقة '+n.relationshipLevel+'%',()=>{closeModal();if(n.deceased)info('🕯️',n.name,'سجل عائلي');else personModal(n);},n.relationshipLevel+'%',n.relationshipLevel)));}
 if((state.friends||[]).length){opts.push(section('الأصدقاء'));state.friends.forEach(n=>opts.push(choice(n.emoji,n.name+' · صديق','مستوى العلاقة '+n.relationshipLevel+'%',()=>{closeModal();personModal(n);},n.relationshipLevel+'%',n.relationshipLevel)));}
 if(state.partner){opts.push(section('الشريك'));opts.push(choice(state.married?'💍':'💞',state.partner.name+(state.married?' · زوج/زوجة':' · شريك عاطفي'),'مستوى العلاقة '+state.partner.relationshipLevel+'%',()=>{closeModal();personModal(state.partner);},state.partner.relationshipLevel+'%',state.partner.relationshipLevel));}
 if((state.children||[]).length){opts.push(section('الأبناء'));(state.children||[]).forEach((n,i)=>opts.push(choice(n.emoji||'🧒',n.name+' · '+(n.age<18?'ابن/ابنة':'ابن/ابنة بالغ'),'العمر '+n.age+' سنة · العلاقة '+n.relationshipLevel+'%',()=>{closeModal();childMenu(i);},n.relationshipLevel+'%',n.relationshipLevel)));}
 opts.push(section('توسيع شبكة العلاقات'));
 opts.push(choice('🤝','تكوين صداقة جديدة','تتعرف على شخص جديد وتبدأ علاقة.',()=>{closeModal();addFriend();}));
 opts.push(choice('👤','إضافة شخص مخصص','أدخل اسم شخص تعرفه ليظهر في شبكة علاقاتك.',()=>{closeModal();addCustomFriend();}));
 if(state.age>=16&&!state.partner)opts.push(choice('💞','التعرف على شريك','تبدأ علاقة بالتعارف والاحترام المتبادل.',()=>{closeModal();meetPartner();}));
 opts.push(choice('👪','الزواج والأسرة','الزواج، الأبناء، إدارة العلاقة وشجرة العائلة.',familyMenu));
 opts.push(choice('📜','شجرة العائلة والإرث','استعرض أفراد الأسرة، الأبناء وخيارات الوصية.',familyTreeMenu));
 modal('💞','العلاقات','العلاقات تتغير بمرور السنين. اهتم بالناس القريبين منك، لأن اختياراتك بتأثر على قوة العلاقة.',opts);
}

function custodyModeLabel(mode){
 return mode==='shared'?'رعاية مشتركة':mode==='other'?'الإقامة الأساسية مع الطرف الآخر':'الإقامة الأساسية معك';
}
function eligibleChildrenForCoParent(ex){
 const assigned=new Set((state.coParentingPlans||[]).filter(p=>p&&p.active!==false).flatMap(p=>Array.isArray(p.childIds)?p.childIds:[]));
 return (state.children||[]).filter((child,index)=>{
  if(!child.id)child.id='child-'+String(child.name||index)+'-'+Date.now()+'-'+index;
  const key=child.id||child.name;
  return (child.age||0)<18&&!assigned.has(key)&&(!child.otherParentId||child.otherParentId===ex.id);
 });
}
function childrenForCustodyPlan(plan){
 const ids=Array.isArray(plan.childIds)?plan.childIds:[];
 return (state.children||[]).filter(c=>ids.includes(c.id||c.name));
}
function recordCustody(plan,action,details){
 if(!Array.isArray(plan.history))plan.history=[];
 plan.history.push({age:state.age,action,details:String(details||'')});
 if(plan.history.length>20)plan.history.shift();
}
function createCoParentingPlan(ex,mode){
 const eligible=eligibleChildrenForCoParent(ex);
 if(!eligible.length){closeModal();save();render();info('👪','لا توجد حضانة جديدة','مفيش أبناء قاصرين مشمولين باتفاق جديد مع الطرف الآخر ده.');return;}
 if(!Array.isArray(state.coParentingPlans))state.coParentingPlans=[];
 eligible.forEach(child=>{child.otherParentId=ex.id;child.otherParentName=ex.name;});
 const plan={id:'custody-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),otherParent:{...ex},otherParentName:ex.name,mode,childIds:eligible.map(c=>c.id||c.name),supportPerChild:2200,arrears:0,active:true,createdAge:state.age,history:[]};
 recordCustody(plan,'إنشاء الخطة','تم الاتفاق على '+custodyModeLabel(mode)+' لـ '+eligible.length+' أبناء قاصرين.');
 state.coParentingPlans.push(plan);
 log('👪','اتفاق رعاية الأبناء','بعد الانفصال، اتفقت مع '+ex.name+' على '+custodyModeLabel(mode)+'. طريقة الرعاية هتأثر على مصاريف الأبناء والنفقة السنوية.','special');
 save();render();
 info('👪','اتفاق رعاية الأبناء','اتفقتم على '+custodyModeLabel(mode)+'. تقدر تغيّر طريقة الرعاية أو النفقة من قائمة الزواج والأسرة.',[choice('👪','إدارة الاتفاق','',()=>{closeModal();coParentingMenu();}),choice('✓','تمام','',closeModal)]);
}
function custodyChoiceMenu(ex){
 if(!eligibleChildrenForCoParent(ex).length){closeModal();save();render();info('👪','لا توجد حضانة جديدة','الأبناء القاصرون الموجودون مشمولون بالفعل في اتفاق سابق أو مش تابعين للطرف الآخر ده.');return;}
 modal('👪','اتفاق رعاية الأبناء','اختاروا ترتيبًا مبدئيًا لرعاية الأبناء القاصرين بعد الانفصال. القرار بيغيّر مصاريف الرعاية ونفقة الأبناء ومتابعة العلاقة.',[
  choice('🏡','الإقامة الأساسية معايا','أنت مسؤول عن أغلب مصاريف الرعاية، والزيارات مستمرة.',()=>createCoParentingPlan(ex,'primary')),
  choice('🤝','رعاية مشتركة','تقسيم الوقت والمصاريف بين الطرفين.',()=>createCoParentingPlan(ex,'shared')),
  choice('🏠','الإقامة الأساسية مع الطرف الآخر','تتحمل نفقة سنوية وتتابع علاقتك بالأبناء بالزيارات.',()=>createCoParentingPlan(ex,'other')),
  choice('↩️','رجوع','',()=>{closeModal();familyMenu();})
 ]);
}
function coParentingMenu(){
 const plans=Array.isArray(state.coParentingPlans)?state.coParentingPlans:[];
 const opts=plans.filter(p=>p&&p.active!==false).map(p=>{
  const children=childrenForCustodyPlan(p),minor=children.filter(c=>(c.age||0)<18).length;
  return choice(p.mode==='shared'?'🤝':p.mode==='other'?'🏠':'🏡',(p.otherParentName||p.otherParent?.name||'الطرف الآخر')+' · '+custodyModeLabel(p.mode),'الأبناء ضمن الاتفاق '+children.length+' · القاصرون '+minor+' · النفقة لكل ابن '+cash(p.supportPerChild||0)+' · متأخرات '+cash(p.arrears||0)+'.',()=>coParentingPlanDetails(p),'',minor?75:35);
 });
 if(!opts.length)opts.push(choice('👪','لا توجد اتفاقات رعاية','تظهر هنا خطط الرعاية بعد الانفصال مع وجود أبناء قاصرين.',closeModal));
 opts.push(choice('↩️','رجوع للزواج والأسرة','',familyMenu));
 modal('👪','رعاية الأبناء بعد الانفصال','راجع طريقة الرعاية والنفقة السنوية لكل اتفاق. تظل قادرًا على التفاعل مع أبنائك من قائمة العلاقات.',opts);
}
function coParentingPlanDetails(plan){
 if(!state.coParentingPlans||!state.coParentingPlans.includes(plan)){closeModal();coParentingMenu();return;}
 const children=childrenForCustodyPlan(plan),minor=children.filter(c=>(c.age||0)<18).length;
 const modeChoices=[
  choice('🏡','الإقامة الأساسية معايا','مصاريف الرعاية الكاملة للأبناء المشمولين بالخطة.',()=>setCoParentingMode(plan,'primary')),
  choice('🤝','رعاية مشتركة','تقسيم مصاريف الرعاية بين الطرفين.',()=>setCoParentingMode(plan,'shared')),
  choice('🏠','الإقامة الأساسية مع الطرف الآخر','نفقة سنوية ومصاريف رعاية أقل داخل ميزانيتك.',()=>setCoParentingMode(plan,'other'))
 ];
 const opts=[
  choice('📋','تفاصيل الاتفاق',custodyModeLabel(plan.mode)+' · '+children.map(c=>c.name).join('، ')+'.',()=>{closeModal();info('📋','تفاصيل الرعاية','طريقة الرعاية: '+custodyModeLabel(plan.mode)+' · الأبناء '+children.length+' · القاصرون '+minor+' · النفقة لكل ابن '+cash(plan.supportPerChild||0)+' · المتأخرات '+cash(plan.arrears||0)+'.');}),
  ...modeChoices,
  choice('💵','تعديل قيمة النفقة','القيمة الحالية '+cash(plan.supportPerChild||0)+' لكل ابن في السنة عند الإقامة الأساسية مع الطرف الآخر.',()=>setCoParentingSupport(plan)),
  choice('📜','سجل الاتفاق','راجع تغييرات طريقة الرعاية والنفقة.',()=>coParentingHistory(plan)),
  choice('↩️','رجوع للاتفاقات','',coParentingMenu)
 ];
 modal('👪','إدارة اتفاق الرعاية','الطرف الآخر: '+(plan.otherParentName||plan.otherParent?.name||'غير محدد')+' · '+custodyModeLabel(plan.mode)+'.',opts);
}
function setCoParentingMode(plan,mode){
 if(!['primary','shared','other'].includes(mode))return;
 closeModal();const previous=plan.mode;plan.mode=mode;recordCustody(plan,'تغيير طريقة الرعاية',custodyModeLabel(previous)+' ← '+custodyModeLabel(mode));
 log('👪','تعديل اتفاق الرعاية','غيّرت ترتيب رعاية الأبناء مع '+(plan.otherParentName||'الطرف الآخر')+' إلى '+custodyModeLabel(mode)+'.','special');
 save();render();coParentingPlanDetails(plan);
}
function setCoParentingSupport(plan){
 const options=[1000,2200,4000,6500].map(amount=>choice('💵',cash(amount)+' لكل ابن سنويًا','تحديد النفقة السنوية إذا كانت الإقامة الأساسية مع الطرف الآخر.',()=>{closeModal();const old=plan.supportPerChild||0;plan.supportPerChild=amount;recordCustody(plan,'تعديل النفقة',cash(old)+' ← '+cash(amount));log('💵','تعديل نفقة الأبناء','أصبحت النفقة السنوية '+cash(amount)+' لكل ابن في الخطة.','good');save();render();coParentingPlanDetails(plan);}));
 options.push(choice('↩️','رجوع لتفاصيل الاتفاق','',()=>{closeModal();coParentingPlanDetails(plan);}));
 modal('💵','تحديد النفقة','القيمة تؤثر على المصروفات السنوية إذا كانت الإقامة الأساسية مع الطرف الآخر.',options);
}
function coParentingHistory(plan){
 const history=(plan.history||[]).slice().reverse();
 const labels={'إنشاء الخطة':'إنشاء الاتفاق','تغيير طريقة الرعاية':'تغيير طريقة الرعاية','تعديل النفقة':'تعديل قيمة النفقة'};
 const opts=history.map(h=>choice('📜',(labels[h.action]||h.action)+' · عمر '+fmt(h.age||0),h.details||'تغيير مسجل في الاتفاق.',()=>{closeModal();info('📜',labels[h.action]||h.action,(h.details||'تم تسجيل تغيير في اتفاق الرعاية.')+' · العمر '+fmt(h.age||0)+'.');}));
 if(!opts.length)opts.push(choice('📜','لا توجد تغييرات بعد','سجل الاتفاق سيعرض التغييرات التالية.',closeModal));
 opts.push(choice('↩️','رجوع للتفاصيل','',()=>{closeModal();coParentingPlanDetails(plan);}));
 modal('📜','سجل اتفاق الرعاية','آخر تغييرات الرعاية والنفقة المحفوظة.',opts);
}
function applyCoParentingAnnualEffects(){
 const plans=(state.coParentingPlans||[]).filter(p=>p&&p.active!==false);
 plans.forEach(plan=>{
  const minors=childrenForCustodyPlan(plan).filter(c=>(c.age||0)<18);
  if(!minors.length)return;
  const mode=plan.mode||'primary';
  if(mode==='other'){
   const perChild=clamp(plan.supportPerChild??2200,0,10000),due=perChild*minors.length,paid=Math.min(Math.max(0,state.bank||0),due);
   state.bank-=paid;
   if(paid<due)plan.arrears=Math.max(0,Number(plan.arrears)||0)+(due-paid);
   else if((plan.arrears||0)>0){const extra=Math.min(Number(plan.arrears)||0,Math.max(0,state.bank)*.15);state.bank-=extra;plan.arrears-=extra;}
   if(paid>0)log('💵','نفقة الأبناء','دفعت '+cash(paid)+' نفقة سنوية لأبنائك من ترتيب الرعاية.','good');
   if(paid<due)log('⚖️','متأخرات نفقة','لم يكن الرصيد كافيًا لسداد النفقة كاملة. المتبقي '+cash((plan.arrears||0))+'.','bad');
   minors.forEach(child=>{child.relationshipLevel=clamp((child.relationshipLevel||50)+(paid===due?0:-1));});
  }else if(mode==='shared'){minors.forEach(child=>{child.relationshipLevel=clamp((child.relationshipLevel||50)+1);});}
 });
}

function familyMenu(){
 const opts=[];
 opts.push(choice('🌳','شجرة العائلة','الأجيال المسجلة والأبناء وتطورهم.',familyTreeMenu));
 if(state.partner&&state.age>=18&&!state.married)opts.push(choice('💍','الزواج','تقدروا تتجوزوا لو العلاقة مستقرة ومعاكم تكلفة البداية.',marry,'4,500 '+state.place.unit));
 if(state.partner&&state.married)opts.push(choice('💔','الانفصال أو الطلاق','إنهاء الزواج وتغيير وضع الأسرة.',divorce));
 if(state.partner&&!state.married)opts.push(choice('💔','إنهاء العلاقة','إنهاء العلاقة الحالية والاحتفاظ بسجل الشريك السابق.',breakUp));
 if(state.partner&&state.age>=(perkEnabled('goldenPacifier')?18:20)&&(state.married||state.partner.relationshipLevel>=70)&&(state.children.length<6||perkEnabled('goldenPacifier')))opts.push(choice('👶','إنجاب طفل','اللهاية الذهبية تتيح اختيار العدد والنوع والموهبة الخاصة.',haveChild,perkEnabled('goldenPacifier')?'اختيار العدد':'8,000 '+state.place.unit));
 if(state.age>=21&&state.children.length<6)opts.push(choice('🧸','تبنّي طفل','توسيع الأسرة من خلال التبنّي، مع مصاريف بداية ورعاية مستمرة.',adoptChild,'12,000 '+state.place.unit));
 if((state.children||[]).length)opts.push(choice('🧒','أبنائي','الاطمئنان على الأبناء والتفاعل معاهم.',()=>{closeModal();relations();}));
 if((state.coParentingPlans||[]).some(p=>p&&p.active!==false))opts.push(choice('👪','رعاية الأبناء بعد الانفصال','إدارة ترتيب الرعاية والنفقة وسجل الاتفاق.',coParentingMenu));
 if(!state.partner)opts.push(choice('💞','التعرف على شريك','ابدأ بعلاقة قبل الزواج وتكوين الأسرة.',()=>{closeModal();meetPartner();}));
 opts.push(choice('📜','ترتيب الوصية','حدد تصورك لتوزيع الإرث عند نهاية الحياة.',willMenu));
 opts.push(choice('↩️','رجوع للعلاقات','',relations));
 modal('👪','الزواج والأسرة','بناء الأسرة قرار طويل المدى؛ راعي استقرار العلاقة والصحة والميزانية.',opts);
}

function marry(){
 closeModal();
 if(state.age<18||!state.partner){info('🔒','الزواج غير متاح','تحتاج تكون بالغ وفيه شريك في حياتك.');return;}
 if(state.married){info('💍','أنت متزوج بالفعل','تقدر تراجع علاقتك من قائمة الأسرة.');return;}
 if((state.partner.relationshipLevel||0)<45){info('💞','قوّي العلاقة الأول','العلاقة محتاجة ثقة ووقت قبل خطوة كبيرة.');return;}
 if(state.bank<4500){info('💳','المصاريف مش متاحة','مصاريف الزواج والبداية 4,500 '+state.place.unit+'.');return;}
 state.bank-=4500;state.married=true;state.partner.relation=state.gender==='male'?'الزوجة':'الزوج';state.partner.relationshipLevel=clamp(state.partner.relationshipLevel+12);stat('happiness',8);achievement('الزواج وتكوين أسرة');
 log('💍','بداية حياة زوجية','اتجوزت '+state.partner.name+'. مسؤولياتكم وأهدافكم المالية والعاطفية هتتطور مع الوقت.','special');
 render();info('💍','ألف مبروك','بدأتوا حياة جديدة مع بعض. حافظ على التواصل والميزانية المشتركة.',[choice('تمام','متابعة','',()=>{closeModal();relations();})]);
}
function goldenPacifierMenu(){
 if(!perkEnabled('goldenPacifier')){closeModal();info('🍼','اللهاية الذهبية متوقفة','فعّلها من القائمة الرئيسية أو متجر المزايا.');return;}
 if(state.age<18||!state.partner||(!state.married&&state.partner.relationshipLevel<70)){closeModal();info('👶','الشرط العائلي غير مكتمل','تحتاج أن تكون بالغًا مع شريك حالي وعلاقة مستقرة.');return;}
 const opts=[1,2,3,4,5].map(n=>choice('👶',n===1?'طفل واحد':n+' أطفال','اختيار عدد المواليد في هذه الولادة.',()=>goldenPacifierGenderMenu(n)));
 opts.push(choice('↩️','رجوع للأسرة','',familyMenu));
 modal('🍼','اللهاية الذهبية · عدد الأبناء','حدد عدد المواليد، ثم النوع والموهبة الخاصة لكل طفل.',opts);
}
function goldenPacifierGenderMenu(count){
 closeModal();const opts=[
  choice('🎲','نوع عشوائي','تختار اللعبة النوع لكل طفل.',()=>goldenPacifierTalentMenu(count,'random')),
  choice('👦','ذكور','كل المواليد في الاختيار ده ذكور.',()=>goldenPacifierTalentMenu(count,'male')),
  choice('👧','إناث','كل المواليد في الاختيار ده إناث.',()=>goldenPacifierTalentMenu(count,'female'))
 ];
 modal('👶','اختيار النوع','عدد المواليد: '+count+'. اختار النوع.',opts);
}
function goldenPacifierTalentMenu(count,gender){
 closeModal();const opts=[
  choice('🧠','ذكاء استثنائي','ذكاء مرتفع ومساعدة تعليمية داخل اللعبة.',()=>planGoldenBirth(count,gender,'ذكاء استثنائي')),
  choice('🏅','موهبة رياضية','صحة ولياقة مرتفعة.',()=>planGoldenBirth(count,gender,'موهبة رياضية')),
  choice('🎨','موهبة فنية','مظهر وإبداع أعلى.',()=>planGoldenBirth(count,gender,'موهبة فنية')),
  choice('🍀','محظوظ','بداية قوية في العلاقات والسعادة.',()=>planGoldenBirth(count,gender,'محظوظ')),
  choice('🌱','بدون موهبة خاصة','طفل بسمات طبيعية عشوائية.',()=>planGoldenBirth(count,gender,'عادية'))
 ];
 modal('✨','اختيار الموهبة الخاصة','نوع الأطفال: '+(gender==='random'?'عشوائي':gender==='male'?'ذكور':'إناث')+' · العدد '+count+'.',opts);
}
function planGoldenBirth(count,gender,talent){
 closeModal();if(!perkEnabled('goldenPacifier')){info('🍼','اللهاية الذهبية متوقفة','فعّل الميزة ثم حاول مرة أخرى.');return;}
 if(state.age<18||!state.partner||(!state.married&&state.partner.relationshipLevel<70)){info('👶','الشرط العائلي غير مكتمل','تحتاج علاقة مستقرة مع الشريك الحالي.');return;}
 const cost=count*8000;if(state.bank<cost){info('💳','الرصيد مش كفاية','التكلفة الإجمالية '+cash(cost)+' لعدد '+count+' مواليد.');return;}
 if(state.children.length+count>30){info('👶','عدد الأبناء كبير','تقدر تضيف حتى 30 ابن/ابنة للحفاظ على سلاسة اللعبة على الهاتف.');return;}
 state.bank-=cost;const created=[];
 for(let i=0;i<count;i++){
  const g=gender==='random'?pick(['male','female']):gender;
  const child=makePerson(g,g==='male'?'ابن':'ابنة','👶🏻',0,78);
  child.gender=g;child.job='طفل';child.specialTalent=talent;child.generosity=50+Math.floor(Math.random()*30);child.bornAt=state.age;child.otherParentId=state.partner.id||null;child.otherParentName=state.partner.name;
  if(talent==='ذكاء استثنائي'){child.smart=100;child.careerPotential=90;}
  else if(talent==='موهبة رياضية'){child.health=100;child.looks=clamp((child.looks||50)+12);}
  else if(talent==='موهبة فنية'){child.looks=100;child.smart=clamp((child.smart||50)+12);}
  else if(talent==='محظوظ'){child.generosity=100;child.relationshipLevel=90;}
  state.children.push(child);created.push(child);
 }
 state.partner.relationshipLevel=clamp(state.partner.relationshipLevel+Math.min(12,count*2));stat('happiness',Math.min(20,count*5));achievement('إنجاب أبناء باللهاية الذهبية');
 log('🍼','ولادة مخططة','أضفت '+count+' إلى الأسرة؛ النوع '+(gender==='random'?'عشوائي':gender==='male'?'ذكور':'إناث')+'، والموهبة '+talent+'. تكلفة الرعاية الأولية '+cash(cost)+'.','special');
 save();render();info('🎉','مبروك الأسرة الجديدة',created.map(c=>c.name+' · '+(c.gender==='male'?'ذكر':'أنثى')+' · '+talent).join('، ')+'.',[choice('👪','متابعة الأسرة','',familyMenu),choice('🧒','عرض الأبناء','',relations)]);
}
function haveChild(){
 closeModal();
 const minimumAge=perkEnabled('goldenPacifier')?18:20;
 if(state.age<minimumAge||!state.partner||(!state.married&&state.partner.relationshipLevel<70)){info('👶','مش الوقت المناسب','لازم تكون بالغ وعندك شريك بعلاقة مستقرة.');return;}
 if(perkEnabled('goldenPacifier')){goldenPacifierMenu();return;}
 if(state.bank<8000){info('💳','جهّز الميزانية','بداية تكاليف الطفل حوالي 8,000 '+state.place.unit+'.');return;}
 state.bank-=8000;
 const gender=pick(['male','female']),child=makePerson(gender,gender==='male'?'ابن':'ابنة','👶🏻',0,78);
 child.gender=gender;child.job='طفل';child.generosity=50+Math.floor(Math.random()*30);child.bornAt=state.age;child.otherParentId=state.partner.id||null;child.otherParentName=state.partner.name;
 state.children.push(child);state.partner.relationshipLevel=clamp(state.partner.relationshipLevel+4);stat('happiness',7);achievement('إنجاب طفل');
 log('👶','فرد جديد في الأسرة','اتولد '+child.name+'، وبدأ فصل جديد من حياتكم. تربية الأطفال لها مصاريف ووقت ومسؤولية.','special');
 render();info('🎉','مبروك المولود الجديد','اتضاف '+child.name+' لشجرة العائلة. احتياجاته وتعليمه وعلاقتك بيه هتتغير مع العمر.');
}

function adoptChild(){
 closeModal();if(state.age<21){info('🔒','لسه بدري','التبنّي متاح من سن 21 داخل اللعبة.');return;}
 if(state.children.length>=6){info('👪','الأسرة كبيرة بالفعل','النسخة الحالية تدعم حتى ستة أبناء لكل حياة.');return;}
 if(state.bank<12000){info('💳','الرصيد مش كفاية','تكاليف بداية التبنّي 12,000 '+state.place.unit+'.');return;}
 state.bank-=12000;const gender=pick(['male','female']);const child=makePerson(gender,gender==='male'?'ابن بالتبنّي':'ابنة بالتبنّي','🧒',0,72+Math.floor(Math.random()*22));child.gender=gender;child.job='طفل بالتبنّي';child.adopted=true;child.bornAt=state.age;child.otherParentId=state.partner?state.partner.id||null:null;child.otherParentName=state.partner?state.partner.name:null;state.children.push(child);state.stats.happiness=clamp(state.stats.happiness+6);achievement('توسيع الأسرة بالتبنّي');log('🧸','أصبحت أسرة بالتبنّي','رحبت بـ'+child.name+' في الأسرة. محتاج وقت واهتمام عشان يبقى جزءًا من البيت.','special');render();info('🧸','أهلًا بفرد جديد','أُضيف '+child.name+' إلى أبنائك. مصاريف رعايته هتتغير مع العمر.');
}
function divorce(){
 closeModal();
 if(!state.partner||!state.married){info('💔','لا يوجد زواج حالي','مفيش زواج قائم يحتاج إنهاء.');return;}
 modal('💔','تأكيد الطلاق','قرار كبير هيغيّر الأسرة والحالة المالية والعاطفية.',[
  choice('💔','أنهي الزواج','بعد إنهاء الزواج، لو فيه أبناء قاصرين هتختاروا ترتيب الرعاية.',()=>finalizeDivorce()),
  choice('↩️','أراجع قراري','أرجع لقائمة الأسرة.',()=>{closeModal();familyMenu();})
 ]);
}
function finalizeDivorce(){
 closeModal();if(!state.partner||!state.married){familyMenu();return;}
 const ex={...state.partner,id:state.partner.id||'parent-'+Date.now(),relation:'شريك سابق',relationshipLevel:clamp(state.partner.relationshipLevel-25)};
 state.friends.push(ex);state.partner=null;state.married=false;state.stats.happiness=clamp(state.stats.happiness-10);
 log('💔','انتهى الزواج','انفصلت عن '+ex.name+'. دلوقتي اختاروا طريقة رعاية الأبناء القاصرين إن وُجدوا.','bad');
 if(eligibleChildrenForCoParent(ex).length){custodyChoiceMenu(ex);return;}
 save();render();info('💔','انتهى الزواج','انفصلت عن '+ex.name+'. لا توجد أبناء قاصرين مشمولون باتفاق رعاية جديد.');
}
function breakUp(){
 closeModal();if(!state.partner||state.married){familyMenu();return;}
 const ex={...state.partner,id:state.partner.id||'parent-'+Date.now(),relation:'شريك سابق',relationshipLevel:clamp(state.partner.relationshipLevel-20)};
 state.friends.push(ex);state.partner=null;state.stats.happiness=clamp(state.stats.happiness-6);
 log('💔','انتهت العلاقة','قررت تنهي علاقتك بـ'+ex.name+'. العلاقة السابقة بقت جزءًا من تاريخك.','bad');save();render();
 if(eligibleChildrenForCoParent(ex).length){custodyChoiceMenu(ex);return;}
 info('💔','انتهت العلاقة','تقدر تفتح صفحة جديدة في وقت لاحق، مع الاحتفاظ بسجل العلاقة السابقة.');
}
function childMenu(i){
 const c=ensureChildGrowthProfile(state.children[i]);if(!c)return;const stage=childDevelopmentStage(c.age);
 const extra='<div class="child-growth-panel"><div class="child-growth-heading">تطور '+esc(c.name)+'</div><div class="pillrow"><span class="pill">🎂 '+fmt(c.age)+' سنة</span><span class="pill">📚 '+esc(c.schooling||stage)+'</span><span class="pill">🧭 '+esc(c.interest)+'</span></div><div class="child-growth-metric"><div><span>التحصيل الدراسي</span><b>'+c.schoolPerformance+'%</b></div><div class="progressline"><div style="width:'+c.schoolPerformance+'%"></div></div></div><div class="child-growth-metric"><div><span>الاستعداد المهني</span><b>'+c.careerPotential+'%</b></div><div class="progressline"><div style="width:'+c.careerPotential+'%"></div></div></div><div class="child-growth-metric"><div><span>الاستقلال</span><b>'+c.independence+'%</b></div><div class="progressline"><div style="width:'+c.independence+'%"></div></div></div></div>';
 const opts=[choice('🧸','قضاء وقت معاه','تقوية الارتباط وتحسين المزاج.',()=>childAction(i,'time')),choice('💬','الاستماع لمشكلته','دعم عاطفي وتواصل.',()=>childAction(i,'talk')),choice('🎁','هدية','هدية بميزانية 500 '+state.place.unit+'.',()=>childAction(i,'gift'),'500 '+state.place.unit),choice('📚','دعم التعليم','مساهمة في التعلم من سن 4 سنوات.',()=>childAction(i,'school'),'1,000 '+state.place.unit)];
 if(c.age>=6&&c.age<18)opts.push(choice('🎓','دعم التفوق الدراسي','يرفع التحصيل الدراسي والذكاء وفرص المستقبل.',()=>childAction(i,'study'),'1,500 '+state.place.unit,c.schoolPerformance));
 if(c.age>=16)opts.push(choice('🧭','توجيه مهني','اربط اهتماماته بخيارات الدراسة والعمل.',()=>childAction(i,'career'),'مجانًا',c.careerPotential));
 if(c.age>=18)opts.push(choice('🚀','مساعدته على الاستقلال','ساعده في بداية حياته العملية.',()=>childAction(i,'launch'),'3,000 '+state.place.unit,c.independence));
 opts.push(choice('🌳','شجرة العائلة','',familyTreeMenu),choice('↩️','رجوع للعلاقات','',()=>{closeModal();relations();}));
 modal(c.emoji||'🧒',c.name+' · '+c.age+' سنة',stage+' · '+(c.adopted?'ابن/ابنة بالتبنّي':'فرد من الأسرة')+' · العلاقة '+c.relationshipLevel+'%. '+(c.specialTalent?'الموهبة الخاصة: '+c.specialTalent+'. ':'')+(c.job?'الوضع الحالي: '+c.job+'.':'مستقبله بيتأثر بالتحصيل والاهتمام والتوجيه.'),opts,true,extra);
}

function childAction(i,action){
 closeModal();const c=ensureChildGrowthProfile(state.children[i]);if(!c)return;
 const cost={gift:500,school:1000,study:1500,career:0,launch:3000}[action]||0;
 if(state.bank<cost){info('💳','الرصيد مش كفاية','الاختيار محتاج '+cash(cost)+'.');return;}
 if(action==='school'&&c.age<4){info('📚','لسه صغير','التعليم المنظم مناسب من سن 4 سنوات.');return;}
 if(action==='study'&&(c.age<6||c.age>=18)){info('🎓','الدعم الدراسي غير متاح','متاح من سن 6 إلى 17 سنة.');return;}
 if(action==='career'&&c.age<16){info('🧭','لسه بدري','التوجيه المهني متاح من سن 16 سنة.');return;}
 if(action==='launch'&&c.age<18){info('🚀','لسه بدري','دعم الاستقلال متاح بعد سن 18.');return;}
 state.bank-=cost;const petulance=clamp(c.petulance??40),reliability=clamp(c.reliability??55);
 let delta=action==='time'?7+Math.floor(reliability/45):action==='talk'?5+Math.floor(reliability/55):action==='gift'?7+Math.floor(clamp(c.generosity??50)/30):action==='study'?7:action==='career'?6:action==='launch'?4:4;
 if(petulance>=75)delta-=2;if(c.personality==='حنون'&&(action==='time'||action==='talk'))delta+=2;if(c.personality==='فضولي'&&(action==='school'||action==='study'||action==='career'))delta+=2;c.relationshipLevel=clamp(c.relationshipLevel+delta);
 let text='';
 if(action==='school'){c.smart=clamp(c.smart+5);c.schoolPerformance=clamp(c.schoolPerformance+4);c.schoolSupport=clamp(c.schoolSupport+5);text='ساهمت في تعليم '+c.name+'، وارتفع التحصيل إلى '+c.schoolPerformance+'%.';
 }else if(action==='study'){c.smart=clamp(c.smart+4);c.schoolPerformance=clamp(c.schoolPerformance+9);c.schoolSupport=clamp(c.schoolSupport+12);c.careerPotential=clamp(c.careerPotential+3);text='استثمرت في تفوق '+c.name+' الدراسي، فارتفع التحصيل إلى '+c.schoolPerformance+'%.';
 }else if(action==='career'){c.careerPotential=clamp(c.careerPotential+10);c.independence=clamp(c.independence+3);c.careerGuidanceCount=(Number(c.careerGuidanceCount)||0)+1;text='ناقشت مع '+c.name+' اهتمامه بـ'+c.interest+' وخياراته المهنية. الاستعداد المهني '+c.careerPotential+'%.';
 }else if(action==='launch'){c.independence=clamp(c.independence+12);c.careerPotential=clamp(c.careerPotential+3);if(c.job==='باحث عن فرصة عمل'&&c.careerPotential>=55){c.job=childCareerFromInterest(c.interest);c.educationStatus='بدأ أول وظيفة بدعم الأسرة';}text='ساعدت '+c.name+' في خطوة الاستقلال. مستوى الاستقلال '+c.independence+'%.';
 }else if(action==='time'){stat('happiness',2);text='قضيت وقت مع '+c.name+' وبنيتوا ذكرى جديدة.';}else if(action==='talk'){text='سمعت '+c.name+' باهتمام وخلّيته يحكي اللي مضايقه.';}else{stat('happiness',2);text='قدمت هدية لـ'+c.name+' بتكلفة '+cash(cost)+'.';}
 if(!Array.isArray(c.interactions))c.interactions=[];c.interactions.push({age:state.age,action,delta,levelAfter:c.relationshipLevel,schoolPerformance:c.schoolPerformance,careerPotential:c.careerPotential,independence:c.independence});if(c.interactions.length>12)c.interactions.shift();
 const icon=action==='study'||action==='school'?'🎓':action==='career'?'🧭':action==='launch'?'🚀':'👪';
 log(icon,action==='study'?'استثمار في التعليم':action==='school'?'دعم تعليم الأبناء':action==='career'?'توجيه مهني':action==='launch'?'دعم استقلال الابن':'وقت مع الأسرة',text,'good');
 save();render();info('💞','التطور الجديد لـ'+c.name,text+' العلاقة '+c.relationshipLevel+'% · التحصيل '+c.schoolPerformance+'% · الاستعداد المهني '+c.careerPotential+'% · الاستقلال '+c.independence+'%.',[choice('👪','متابعة تطوره','',()=>{closeModal();childMenu(i)}),choice('🌳','شجرة العائلة','',familyTreeMenu)]);
}
function personModal(n){
 const relationName=String(n.relation||'');
 const isSibling=/أخ|أخت/.test(relationName),isPartner=/شريك|زوج|زوجة/.test(relationName);
 const stats=isSibling
  ?[['العناد والشغب',n.petulance],['الكرم',n.generosity]]
  :isPartner?[['الوفاء',n.loyalty],['الغيرة',n.jealousy],['الاعتمادية',n.reliability]]
  :[['الكرم',n.generosity],['الجنون',n.craziness],['المال',n.money]];
 const bars=stats.map(([label,value])=>{const v=clamp(value??50);return '<div class="npc-stat"><span>'+label+'</span><div class="mini-track"><span style="width:'+v+'%"></span></div><b>'+v+'%</b></div>';}).join('');
 const progress='<div class="relationship-progress"><div class="muted">قوة العلاقة · '+clamp(n.relationshipLevel)+'%</div><div class="progressline"><div style="width:'+clamp(n.relationshipLevel)+'%"></div></div></div><div class="npc-stats">'+bars+'</div><div class="pillrow"><span class="pill">💼 '+esc(n.job||'غير محدد')+'</span><span class="pill">🧠 '+esc(n.personality||'غير محدد')+'</span><span class="pill">🎂 '+fmt(n.age||0)+' سنة</span></div>';
 modal(n.emoji,n.name+' · '+n.relation,'بيشتغل '+(n.job||'غير محدد')+'، وشخصيته '+(n.personality||'غير محدد')+'.',[
  choice('☕','قضاء وقت','خصص وقت للشخص ده.',()=>relationshipAction(n,'time')),
  choice('💬','محادثة','اسأل عن أخباره واسمعه كويس.',()=>relationshipAction(n,'talk')),
  choice('🎁','تقديم هدية','هدية صغيرة بتكلفة 500 '+state.place.unit+'.',()=>relationshipAction(n,'gift'),'500 '+state.place.unit),
  choice('😤','شجار','الخلاف ممكن يقلل مستوى العلاقة.',()=>relationshipAction(n,'argue')),
  ...(n===state.partner&&state.age>=18?[choice('🛡️','وقت خاص مع الشريك','اختيار بالغ داخل اللعبة؛ فيه احتمال مضاعفة صحية خيالية، ويمكن لدرع العافية تعطيل الخطر.',()=>relationshipAction(n,'intimate'))]:[]),
  choice('📜','سجل العلاقة','راجع آخر التفاعلات وأثرها على مستوى العلاقة.',()=>relationshipHistory(n))
 ],true,progress);
}

function relationshipHistory(n){
 const history=Array.isArray(n.interactions)?n.interactions.slice().reverse():[];
 const labels={time:'قضاء وقت',talk:'محادثة',gift:'هدية',argue:'خلاف',school:'نشاط تعليمي'};
 const opts=history.map(item=>choice(item.delta<0?'💢':item.action==='gift'?'🎁':'💞',(labels[item.action]||'تفاعل')+' · عمر '+fmt(item.age||0),'التأثير '+(item.delta>0?'+':'')+item.delta+' · مستوى العلاقة بعد التفاعل '+fmt(item.levelAfter)+'%.',()=>{closeModal();info(item.delta<0?'💢':'💞',labels[item.action]||'تفاعل مسجل','في عمر '+fmt(item.age||0)+' سنة، أثر التفاعل على العلاقة بمقدار '+(item.delta>0?'+':'')+item.delta+' نقطة.');}));
 if(!opts.length)opts.push(choice('🌱','لسه مفيش تفاعلات مسجلة','ابدأ بقضاء وقت أو محادثة أو هدية عشان يبدأ سجل العلاقة.',closeModal));
 opts.push(choice('↩️','العودة لملف الشخصية','',()=>{closeModal();personModal(n);}));
 modal('📜','سجل العلاقة · '+(n.name||'الشخصية'),'آخر 12 تفاعلًا وأثر كل منها على العلاقة.',opts);
}

function relationshipIntimacy(n){
 if(state.age<18||state.partner!==n){info('🔒','الاختيار غير متاح','الاختيار ده متاح للبالغين مع الشريك الحالي فقط.');return;}
 const protectedByShield=perkEnabled('healthShield');
 const infection=!protectedByShield&&!state.sti&&chance(.14);
 state.stats.happiness=clamp(state.stats.happiness+4);
 state.partner.relationshipLevel=clamp((state.partner.relationshipLevel||50)+5);
 if(infection){state.sti=true;state.stats.health=clamp(state.stats.health-12);}
 if(!Array.isArray(n.interactions))n.interactions=[];
 n.interactions.push({age:state.age,action:'intimate',delta:5,levelAfter:n.relationshipLevel});
 if(n.interactions.length>12)n.interactions.shift();
 const title=infection?'عدوى صحية محاكية':'وقت خاص مع الشريك';
 const message=infection?'ظهرت عدوى منقولة جنسيًا في محاكاة اللعبة وانخفضت الصحة 12 نقطة. يمكن علاج الحالة بزيارة الطبيب داخل اللعبة.':(state.sti?'التواصل تحسّن، لكن ما زالت هناك حالة صحية محاكية مسجلة وتحتاج إلى علاج داخل اللعبة.':protectedByShield?'قضيت وقتًا خاصًا مع '+n.name+' وتحسّن التواصل، ودرع العافية منع العدوى المحاكية.':'قضيت وقتًا خاصًا مع '+n.name+' وتحسّن التواصل. لم تظهر عدوى هذه المرة.');
 log(infection?'🩺':protectedByShield?'🛡️':'💞',title,message,infection?'bad':'good');
 save();render();
 info(infection?'🩺':'💞',infection?'حالة صحية داخل اللعبة':'تقارب ناجح',infection?'زيارة الطبيب داخل اللعبة تزيل الحالة المسجلة.':(protectedByShield?'درع العافية يمنع هذا الخطر طوال فترة التفعيل.':state.sti?'يمكنك علاج الحالة الحالية بزيارة الطبيب داخل اللعبة.':'التأثير إيجابي هذه المرة، لكن الخطر المحاكي يظل قائمًا دون درع العافية.'));
}

function relationshipAction(n,act){
 closeModal();
 if(act==='intimate'){relationshipIntimacy(n);return;}
 if(act==='gift'&&state.bank<500){info('💳','الرصيد مش كفاية','الهدية محتاجة '+cash(500)+'.');return;}
 const generosity=clamp(n.generosity??50),craziness=clamp(n.craziness??50),money=clamp(n.money??50),petulance=clamp(n.petulance??50),loyalty=clamp(n.loyalty??55),jealousy=clamp(n.jealousy??40),reliability=clamp(n.reliability??55),personality=n.personality||'عملي';
 let d=0,text='',tone='good',reaction;
 if(act==='time'){
  reaction=clamp(42+reliability*.26+generosity*.10+(personality==='مرح'?9:0)-craziness*.08-petulance*.12,10,90);
  d=chance(reaction/100)?6+Math.floor(reliability/40):2;stat('happiness',d>=5?3:1);
  text=d>=5?'قضيت وقتًا لطيفًا مع '+n.name+'، والشخصية دي بتقدّر الوقت المشترك.':'قضيت وقتًا مع '+n.name+'، لكن التفاعل كان عاديًا ومحتاج اهتمامًا يناسب شخصيته.';
 }
 if(act==='talk'){
  reaction=clamp(38+loyalty*.20+reliability*.20+(personality==='فضولي'?14:0)-craziness*.12-petulance*.10,10,90);
  d=chance(reaction/100)?4+Math.floor(reliability/45):1;
  text=d>=4?'اتكلمت مع '+n.name+' وسمعك باهتمام.':'اتكلمت مع '+n.name+'، لكن الحوار ما فتحش مساحة كبيرة للتقارب.';
 }
 if(act==='gift'){
  state.bank-=500;flash('-'+cash(500),true);
  reaction=clamp(28+generosity*.42+(100-money)*.12-petulance*.20,8,92);
  const welcomed=chance(reaction/100);d=welcomed?6+Math.floor(generosity/32):1;
  if(money>=85)d=Math.max(1,d-2);
  text=welcomed?'قدمت هدية لـ'+n.name+'، وقدّر اللفتة واهتمامك.':'قدمت هدية لـ'+n.name+'، لكن الهدية ما أثرتش كتير على العلاقة.';
 }
 if(act==='argue'){
  reaction=clamp(24+craziness*.22+petulance*.42+jealousy*.12-generosity*.12-(personality==='حنون'?12:0),5,90);
  d=chance(reaction/100)?-14:-5;stat('happiness',-3);text=d<=-10?'الخلاف مع '+n.name+' تصاعد بسبب رد فعل حاد.':'اختلفت مع '+n.name+'، لكن الموقف ما اتصعّدش بنفس الدرجة.';tone='bad';
 }
 if(personality==='حنون'&&(act==='talk'||act==='time'))d+=1;
 if(personality==='عملي'&&act==='gift')d+=1;
 if(personality==='فضولي'&&act==='talk')d+=1;
 if(personality==='جاد'&&act==='argue')d-=1;
 n.relationshipLevel=clamp((n.relationshipLevel||50)+d);
 if(act==='argue'&&jealousy>=78&&n.relationshipLevel<45&&chance(.18)){n.relationshipLevel=clamp(n.relationshipLevel-3);text+=' الغيرة العالية زوّدت سوء الفهم.';d-=3;}
 if(!Array.isArray(n.interactions))n.interactions=[];
 n.interactions.push({age:state.age,action:act,delta:d,levelAfter:n.relationshipLevel});
 if(n.interactions.length>12)n.interactions.shift();
 if(n.relationshipLevel>=85)achievement('بناء علاقة قوية مع '+n.name);
 save();log(act==='argue'?'💢':'💞','تفاعل مع '+n.name,text,tone);render();
 info(act==='argue'?'💢':'💞','مستوى العلاقة: '+n.relationshipLevel+'%',d>=0?'العلاقة اتحسنت. النتيجة اتأثرت بسمات الشخصية وطريقة التفاعل.':'العلاقة اتأثرت سلبًا، وكل شخصية بتستجيب للخلاف بشكل مختلف.',[choice('✓','تمام','',()=>{closeModal();relations();})]);
}
function addFriend(){
 const g=pick(['male','female']),f=person(g,'صديق',g==='male'?'🧑':'👩',Math.max(8,state.age+Math.floor(Math.random()*7)-3),45+Math.floor(Math.random()*38));
 if(perkOwned('friendshipBracelet'))f.relationshipLevel=100;
 state.friends.push(f);stat('happiness',3);log('🤝','صداقة جديدة','اتعرفت على '+f.name+'، وبداية الصداقة كانت لطيفة.','good');render();info('🤝','صديق جديد','بقي عندك حد جديد ممكن تقضي معاه وقت وتبني علاقة قوية.');
}

function addCustomFriend(){
 if(typeof prompt!=='function'){addFriend();return;}const entered=prompt('اسم الشخص');if(!entered||!entered.trim()){relations();return;}
 const g=pick(['male','female']),f=person(g,'صديق',g==='male'?'🧑':'👩',Math.max(8,state.age),55);f.name=entered.trim().slice(0,50);if(perkOwned('friendshipBracelet'))f.relationshipLevel=100;state.friends.push(f);log('🤝','إضافة شخص إلى العلاقات','أضفت '+f.name+' إلى شبكة علاقاتك.','good');render();info('🤝','تمت الإضافة','تقدر تتفاعل مع '+f.name+' من شاشة العلاقات.');
}

function meetPartner(){
 const g=state.gender==='male'?'female':'male',p=person(g,'شريك الحياة',g==='male'?'🧑':'👩',Math.max(18,state.age+Math.floor(Math.random()*5)-2),32+Math.floor(Math.random()*28));
 modal('💞','فرصة تعارف','قابلت '+p.name+'، وشخصيته '+p.personality+'. تحب تبدأوا تتعرفوا على بعض؟',[
  choice('💬','أبدأ التعارف','بهدوء واحترام ومن غير استعجال.',()=>{closeModal();state.partner=p;stat('happiness',5);log('💞','بداية علاقة','بدأت تتعرف على '+p.name+'. العلاقة هتتطور حسب اهتمامكم ببعض.','special');achievement('بدأت علاقة جديدة');render();}),
  choice('🌿','مش الوقت المناسب','قرارك محترم، الفرص مش سباق.',()=>{closeModal();log('🌿','قرار شخصي','قررت تركز على نفسك في المرحلة الحالية.');render();})
 ]);
}

const zooHabitatCatalog=[
 {id:'savannah',title:'سافانا',emoji:'🌾',cost:35000,upkeep:3200},
 {id:'forest',title:'غابة',emoji:'🌳',cost:38000,upkeep:3500},
 {id:'aviary',title:'بيت الطيور',emoji:'🪶',cost:28000,upkeep:2600},
 {id:'aquatic',title:'حوض مائي',emoji:'🐟',cost:65000,upkeep:6500},
 {id:'arctic',title:'موئل قطبي',emoji:'❄️',cost:57000,upkeep:5200},
 {id:'desert',title:'موئل صحراوي',emoji:'🏜️',cost:40000,upkeep:3500},
 {id:'wetland',title:'أرض رطبة',emoji:'🪷',cost:42000,upkeep:3900},
 {id:'reptile',title:'بيت الزواحف',emoji:'🦎',cost:32000,upkeep:3000},
 {id:'insect',title:'بيت الحشرات',emoji:'🦋',cost:22000,upkeep:1800},
 {id:'mountain',title:'موئل جبلي',emoji:'⛰️',cost:48000,upkeep:4200}
];
const zooSpeciesCatalog=[
 ['lion','أسد','🦁','savannah'],['zebra','حمار وحشي','🦓','savannah'],['monkey','قرد','🐒','forest'],['elephant','فيل','🐘','savannah'],['giraffe','زرافة','🦒','savannah'],['tiger','نمر','🐅','forest'],['leopard','فهد','🐆','forest'],['cheetah','فهد صائد','🐆','savannah'],['hippo','فرس النهر','🦛','wetland'],['rhino','وحيد القرن','🦏','savannah'],
 ['gorilla','غوريلا','🦍','forest'],['chimpanzee','شمبانزي','🐵','forest'],['orangutan','إنسان الغاب','🦧','forest'],['panda','باندا عملاقة','🐼','forest'],['red-panda','باندا حمراء','🐾','forest'],['polar-bear','دب قطبي','🐻‍❄️','arctic'],['grizzly','دب أشيب','🐻','forest'],['black-bear','دب أسود','🐻','forest'],['wolf','ذئب','🐺','forest'],['fox','ثعلب','🦊','forest'],
 ['fennec','ثعلب صحراوي','🦊','desert'],['hyena','ضبع','🐾','savannah'],['wild-dog','كلب بري','🐕','savannah'],['meerkat','ميركات','🐿️','desert'],['otter','قضاعة','🦦','aquatic'],['beaver','قندس','🦫','wetland'],['raccoon','راكون','🦝','forest'],['sloth','كسلان','🦥','forest'],['armadillo','أرماديلو','🐾','desert'],['anteater','آكل النمل','🐜','forest'],
 ['kangaroo','كنغر','🦘','savannah'],['koala','كوالا','🐨','forest'],['wombat','ومبت','🐾','forest'],['wallaby','والابي','🦘','savannah'],['camel','جمل','🐪','desert'],['llama','لاما','🦙','mountain'],['alpaca','ألباكا','🦙','mountain'],['bison','بيسون','🐃','mountain'],['buffalo','جاموس بري','🐃','savannah'],['deer','غزال','🦌','forest'],
 ['moose','موظ','🫎','arctic'],['reindeer','رنة','🦌','arctic'],['elk','أيل','🦌','forest'],['boar','خنزير بري','🐗','forest'],['warthog','خنزير ثؤلولي','🐗','savannah'],['tapir','تابير','🐾','forest'],['okapi','أوكابي','🦓','forest'],['lemur','ليمور','🐒','forest'],['mandrill','مندريل','🐒','forest'],['capybara','كابيبارا','🐹','wetland'],
 ['porcupine','نيص','🦔','forest'],['hedgehog','قنفذ','🦔','forest'],['mongoose','نمس','🐾','desert'],['squirrel','سنجاب','🐿️','forest'],['prairie-dog','كلب البراري','🐿️','savannah'],['bat','خفاش','🦇','forest'],['seal','فقمة','🦭','aquatic'],['sea-lion','أسد بحر','🦭','aquatic'],['walrus','فظ','🦭','arctic'],['dolphin','دلفين','🐬','aquatic'],
 ['beluga','حوت أبيض','🐋','aquatic'],['orca','حوت قاتل','🐳','aquatic'],['manatee','خروف البحر','🐋','aquatic'],['penguin','بطريق','🐧','arctic'],['flamingo','فلامنجو','🦩','wetland'],['ostrich','نعامة','🪶','savannah'],['emu','إيمو','🪶','savannah'],['cassowary','كاسواري','🪶','forest'],['eagle','نسر','🦅','aviary'],['hawk','صقر','🦅','aviary'],
 ['owl','بومة','🦉','forest'],['parrot','ببغاء','🦜','aviary'],['macaw','مكاو','🦜','aviary'],['cockatoo','كوكاتو','🦜','aviary'],['toucan','طوقان','🦜','aviary'],['peacock','طاووس','🦚','aviary'],['crane','كركي','🪶','wetland'],['stork','لقلق','🪶','wetland'],['pelican','بجع','🦢','wetland'],['swan','بجعة','🦢','wetland'],
 ['duck','بط','🦆','wetland'],['goose','إوز','🪿','wetland'],['turkey','ديك رومي','🦃','aviary'],['pheasant','تدرج','🪶','aviary'],['hornbill','أبو قرن','🦜','aviary'],['kingfisher','رفراف','🐦','wetland'],['snake','ثعبان','🐍','reptile'],['python','أصلة','🐍','reptile'],['cobra','كوبرا','🐍','reptile'],['alligator','تمساح أمريكي','🐊','wetland'],
 ['crocodile','تمساح','🐊','wetland'],['tortoise','سلحفاة برية','🐢','reptile'],['turtle','سلحفاة','🐢','aquatic'],['iguana','إغوانا','🦎','reptile'],['chameleon','حرباء','🦎','reptile'],['gecko','أبو بريص','🦎','reptile'],['monitor-lizard','ورل','🦎','desert'],['frog','ضفدع','🐸','wetland'],['salamander','سمندر','🦎','wetland'],['axolotl','أكسولوتل','🦎','aquatic'],
 ['tarantula','عنكبوت طائر','🕷️','insect'],['scorpion','عقرب','🦂','desert'],['butterfly','فراشة','🦋','insect'],['beetle','خنفساء','🪲','insect'],['ant','نملة','🐜','insect'],['koi','سمكة كوي','🐟','aquatic'],['shark','قرش','🦈','aquatic'],['ray','شفنين','🐟','aquatic'],['octopus','أخطبوط','🐙','aquatic'],['sea-turtle','سلحفاة بحرية','🐢','aquatic'],
 ['snow-leopard','نمر ثلجي','🐆','mountain'],['jaguar','جاغوار','🐆','forest'],['lynx','وشق','🐈','mountain'],['arctic-fox','ثعلب قطبي','🦊','arctic'],['mountain-goat','ماعز جبلي','🐐','mountain'],['yak','ياك','🐂','mountain'],['wild-horse','حصان بري','🐎','savannah'],['wild-boar','خنزير بري أوروبي','🐗','forest'],['bongo','ظبي بونجو','🦌','forest'],['ibex','وعل','🐐','mountain'],
 ['vulture','رخمة','🦅','aviary'],['condor','كوندور','🦅','mountain'],['parakeet','ببغاء صغير','🦜','aviary'],['lovebird','طائر الحب','🐦','aviary'],['puffin','بفن','🐧','arctic'],['sea-otter','قضاعة بحرية','🦦','aquatic'],['stingray','راي لاسع','🐟','aquatic'],['jellyfish','قنديل البحر','🪼','aquatic'],['seahorse','فرس البحر','🐠','aquatic'],['clownfish','سمكة مهرج','🐠','aquatic'],
 ['unicorn','حصان أسطوري','🦄','mountain'],['phoenix','طائر الفينيق الأسطوري','🔥','aviary'],['griffin','غريفين أسطوري','🦅','mountain'],['dragon','تنين أسطوري','🐉','mountain']
].map((a,i)=>({id:a[0],name:a[1],emoji:a[2],habitat:a[3],cost:Math.round(9000+i*620+(a[0]==='dragon'?150000:a[0]==='phoenix'?95000:a[0]==='unicorn'?80000:a[0]==='griffin'?110000:0)),legendary:['unicorn','phoenix','griffin','dragon'].includes(a[0])}));
const zooAccessoryCatalog=[
 {id:'enrichment-ball',title:'كرة إثراء',emoji:'⚽',cost:3500},
 {id:'climbing-rope',title:'حبل تسلق',emoji:'🪢',cost:5000},
 {id:'nest',title:'عش فاخر',emoji:'🪺',cost:4200},
 {id:'water-feature',title:'نافورة مياه',emoji:'⛲',cost:8500},
 {id:'shade',title:'منطقة ظل',emoji:'🌴',cost:6000},
 {id:'scratch-tree',title:'شجرة خدش',emoji:'🌳',cost:4500},
 {id:'puzzle-feeder',title:'موزع طعام تفاعلي',emoji:'🧩',cost:7000},
 {id:'warming-rock',title:'صخرة تدفئة',emoji:'🪨',cost:3800}
];
function zooMenu(){
 if(!perkOwned('zooExpansionPack')){closeModal();info('🦁','حديقة الحيوان مقفولة','افتح توسعة حديقة الحيوان من متجر مزايا حياة أو باقة الحيوان الحفّال.');return;}
 const z=state.zoo||(state.zoo={opened:false,animals:[],rareDiscoveries:0,funds:0,habitats:[]}),opts=[];
 if(!z.opened)opts.push(choice('🏗️','إنشاء حديقة الحيوان','تكلفة الإنشاء 250,000، ومعها تمويل تشغيلي مجاني داخل الحديقة بقيمة 75,000.',openZoo,'250,000 '+state.place.unit));
 else{
  opts.push(choice('🐘','الحيوانات والأنواع','اختيار من '+zooSpeciesCatalog.length+' نوعًا، منها أنواع نادرة وأسطورية.',zooAnimalShop));
  opts.push(choice('🌳','الموائل والمرافق','بناء موائل جديدة وإصلاح الموائل الحالية.',zooHabitatMenu));
  opts.push(choice('🧬','التكاثر والرعاية','مساعدة الحيوانات على التكاثر عند توفر الظروف.',zooBreedingMenu));
  opts.push(choice('✨','رحلة اكتشاف نادر','رحلة ميدانية بتكلفة 12,000 قد تكشف نوعًا أسطوريًا.',discoverZooAnimal,'12,000 '+state.place.unit));
  opts.push(choice('💰','صندوق حديقة الحيوان','الصندوق '+cash(z.funds||0)+' · اسحب الأرباح المتاحة.',zooTreasuryMenu));
  opts.push(choice('📊','تقرير الحديقة','الحيوانات '+z.animals.length+' · الموائل '+z.habitats.length+' · اكتشافات نادرة '+(z.rareDiscoveries||0)+'.',()=>{closeModal();info('🦁','تقرير الحديقة','الأنواع المسجلة '+zooSpeciesCatalog.length+' · الحيوانات '+z.animals.length+' · الموائل '+z.habitats.length+' · الاكتشافات الأسطورية '+(z.rareDiscoveries||0)+' · صندوق التشغيل '+cash(z.funds||0)+'.');}));
  z.animals.slice(-8).forEach((animal,offset)=>{const i=z.animals.length-Math.min(8,z.animals.length)+offset;opts.push(choice(animal.emoji||'🐾',animal.name+' · '+animal.species,'العمر '+animal.age+' سنة · '+((animal.accessories||[]).length)+' إكسسوار',()=>zooAnimalDetails(i)));});
  if(z.animals.length>8)opts.push(choice('📖','سجل الحيوانات الكامل','عرض قائمة مقسمة إلى صفحات لتظل الواجهة سريعة على الهاتف.',()=>zooOwnedAnimalsMenu(0)));
 }
 opts.push(choice('↩️','رجوع للأنشطة','',activities));modal('🦁','إدارة حديقة الحيوان',z.opened?'موائل تتطلب صيانة، حيوانات لها احتياجات، وصندوق تمويل يبدأ بمنحة مجانية.':'ابدأ مشروع الحديقة عندما تسمح ميزانيتك، ثم افتح الموائل واشترِ أنواعًا مناسبة لها.',opts);
}

function openZoo(){
 closeModal();if(!perkOwned('zooExpansionPack'))return;const cost=250000;
 if(state.age<18){info('🔒','الافتتاح من سن 18','تقدر تفتح الحديقة بعد سن 18.');return;}
 if(state.bank<cost){info('💳','الميزانية غير كافية','تجهيز الحديقة يحتاج '+cash(cost)+'.');return;}
 state.bank-=cost;state.zoo={opened:true,animals:[],rareDiscoveries:0,funds:75000,habitats:['savannah','forest','aviary'],habitatHealth:{savannah:100,forest:100,aviary:100}};
 log('🦁','افتتاح حديقة الحيوان','افتتحت الحديقة وحصلت على منحة تشغيل مجانية بقيمة '+cash(75000)+'. بدأت بثلاثة موائل أساسية.','special');achievement('افتتاح حديقة حيوان');save();render();zooMenu();
}

function zooAnimalShop(){
 const z=state.zoo;if(!z||!z.opened){zooMenu();return;}
 const grouped=zooHabitatCatalog.map(h=>{const count=zooSpeciesCatalog.filter(s=>s.habitat===h.id).length;return choice(h.emoji,h.title+' · '+count+' أنواع','الموئل '+(z.habitats.includes(h.id)?'متاح':'غير مبني')+'.',()=>zooBrowseSpecies(h.id));});
 grouped.push(choice('✨','الأنواع الأسطورية','حصان أسطوري وفينيق وغريفين وتنين.',()=>zooBrowseSpecies('legendary')));
 grouped.push(choice('↩️','رجوع','',zooMenu));modal('🐾','كتالوج حديقة الحيوان','أكثر من 100 نوع من الحيوانات والطيور والزواحف والكائنات المائية، بالإضافة إلى أنواع أسطورية.',grouped);
}

function zooBrowseSpecies(habitatId){
 const z=state.zoo;let species=zooSpeciesCatalog.filter(s=>habitatId==='legendary'?s.legendary:s.habitat===habitatId);
 const habitat=zooHabitatCatalog.find(h=>h.id===habitatId);
 const opts=species.map(s=>choice(s.emoji,s.name+(s.legendary?' · نادر/أسطوري':''),'سعر الاقتناء '+cash(s.cost)+' · الموئل '+(zooHabitatCatalog.find(h=>h.id===s.habitat)||{title:s.habitat}).title+'.',()=>buyZooAnimal(s.id),cash(s.cost)));
 if(!z.habitats.includes(habitatId)&&habitatId!=='legendary'&&habitat)opts.unshift(choice('🏗️','بناء موئل '+habitat.title,'الموئل غير متاح. تكلفة البناء '+cash(habitat.cost)+'.',()=>buildZooHabitat(habitatId),cash(habitat.cost)));
 opts.push(choice('↩️','رجوع للكتالوج','',zooAnimalShop));modal('🐾',habitat?habitat.title:'الأنواع الأسطورية','اختار نوعًا مناسبًا للموائل المتاحة. يوجد '+species.length+' نوع في هذا القسم.',opts);
}
function buyZooAnimal(speciesId){
 closeModal();const z=state.zoo,s=zooSpeciesCatalog.find(x=>x.id===speciesId);if(!z||!z.opened||!s)return;
 if(!z.habitats.includes(s.habitat)){const h=zooHabitatCatalog.find(x=>x.id===s.habitat);info('🏗️','الموئل غير جاهز','يحتاج '+s.name+' إلى موئل '+h.title+'.',[choice('🏗️','بناء الموئل','',()=>buildZooHabitat(s.habitat)),choice('↩️','رجوع','',()=>zooBrowseSpecies(s.habitat))]);return;}
 if(state.bank<s.cost){info('💳','الرصيد مش كفاية','شراء '+s.name+' يحتاج '+cash(s.cost)+'.');return;}
 if(z.animals.length>=120){info('🐾','وصلت لحد الحديقة','حد الحديقة 120 حيوانًا لتظل مستقرة على الموبايل.');return;}
 state.bank-=s.cost;const animal={id:Date.now()+Math.random(),species:s.name,name:s.name+' '+(z.animals.length+1),emoji:s.emoji,habitat:s.habitat,age:0,legendary:s.legendary,accessories:[],happiness:75,health:90};
 z.animals.push(animal);if(s.legendary)z.rareDiscoveries=(z.rareDiscoveries||0)+1;
 log('🐾','حيوان جديد في الحديقة','أضفت '+animal.name+' إلى موئل '+(zooHabitatCatalog.find(h=>h.id===s.habitat)||{title:s.habitat}).title+'.','good');save();render();zooMenu();
}

function zooOwnedAnimalsMenu(page=0){
 const z=state.zoo;if(!z||!z.opened){zooMenu();return;}
 const pageSize=10,total=z.animals.length,totalPages=Math.max(1,Math.ceil(total/pageSize)),safePage=Math.max(0,Math.min(totalPages-1,page));
 const start=safePage*pageSize,opts=z.animals.slice(start,start+pageSize).map((animal,offset)=>{const index=start+offset;return choice(animal.emoji||'🐾',animal.name+' · '+animal.species,'العمر '+animal.age+' · الصحة '+(animal.health||80)+'% · السعادة '+(animal.happiness||70)+'%.',()=>zooAnimalDetails(index));});
 if(safePage>0)opts.push(choice('⬅️','الصفحة السابقة','',()=>zooOwnedAnimalsMenu(safePage-1)));
 if(safePage<totalPages-1)opts.push(choice('➡️','الصفحة التالية','',()=>zooOwnedAnimalsMenu(safePage+1)));
 opts.push(choice('↩️','رجوع للحديقة','',zooMenu));modal('📖','سجل حيوانات الحديقة','الصفحة '+(safePage+1)+' من '+totalPages+' · إجمالي الحيوانات '+total+'.',opts);
}
function zooHabitatMenu(){
 const z=state.zoo;if(!z||!z.opened){zooMenu();return;}
 const actions=zooHabitatCatalog.map(h=>{const built=z.habitats.includes(h.id);return choice(built?'🟢':h.emoji,h.title+(built?' · مبني':' · غير متاح'),built?'حالة الموئل '+((z.habitatHealth&&z.habitatHealth[h.id])??100)+'% · الصيانة السنوية '+cash(h.upkeep)+'.':'تكلفة البناء '+cash(h.cost)+'.',()=>built?repairZooHabitat(h.id):buildZooHabitat(h.id),built?'صيانة':cash(h.cost));});
 actions.push(choice('↩️','رجوع للحديقة','',zooMenu));modal('🌳','الموائل والمرافق','ابنِ الموائل المناسبة للأنواع وحافظ على سلامتها. الموائل المهملة تقلل دخل الزوار.',actions);
}
function buildZooHabitat(habitatId){
 closeModal();const z=state.zoo,h=zooHabitatCatalog.find(x=>x.id===habitatId);if(!z||!z.opened||!h)return;
 if(z.habitats.includes(h.id)){repairZooHabitat(h.id);return;}
 if(state.bank<h.cost){info('💳','الرصيد مش كفاية','بناء موئل '+h.title+' يحتاج '+cash(h.cost)+'.');return;}
 state.bank-=h.cost;z.habitats.push(h.id);z.habitatHealth=z.habitatHealth||{};z.habitatHealth[h.id]=100;
 log('🌳','بناء موئل جديد','أنشأت موئل '+h.title+' ليستوعب أنواعًا جديدة.','good');save();render();zooHabitatMenu();
}
function repairZooHabitat(habitatId){
 closeModal();const z=state.zoo,h=zooHabitatCatalog.find(x=>x.id===habitatId);if(!z||!z.opened||!z.habitats.includes(habitatId)||!h)return;
 z.habitatHealth=z.habitatHealth||{};const current=clamp(z.habitatHealth[habitatId]??100);const cost=Math.max(1000,Math.round((100-current)*h.upkeep*.12));
 if(current>=100){info('✅','الموئل بحالة ممتازة','الموئل '+h.title+' حالته 100%.');return;}
 if(state.bank<cost){info('💳','الرصيد مش كفاية','إصلاح الموئل يحتاج '+cash(cost)+'.');return;}
 state.bank-=cost;z.habitatHealth[habitatId]=100;log('🛠️','صيانة موئل','أصلحت '+h.title+' مقابل '+cash(cost)+'.','good');save();render();zooHabitatMenu();
}
function zooTreasuryMenu(){
 const z=state.zoo;if(!z||!z.opened){zooMenu();return;}
 modal('💰','صندوق حديقة الحيوان','الرصيد '+cash(z.funds||0)+'. أرباح الزوار وتكاليف الموائل والحيوانات تنعكس هنا كل سنة.',[
  choice('💵','سحب 10,000','تحويل أرباح الحديقة للحساب الشخصي.',()=>{closeModal();if((z.funds||0)<10000){info('💳','صندوق الحديقة غير كافٍ','لا يوجد 10,000 قابلة للسحب.');return;}z.funds-=10000;state.bank+=10000;log('💵','سحب أرباح الحديقة','حوّلت '+cash(10000)+' من أرباح الحديقة لحسابك.','good');save();render();zooMenu();}),
  choice('📈','إعادة استثمار 10,000','رفع جودة الموائل وجذب زوار أكثر.',()=>{closeModal();if(state.bank<10000){info('💳','الرصيد مش كفاية','إعادة الاستثمار تحتاج '+cash(10000)+'.');return;}state.bank-=10000;z.funds=(z.funds||0)+10000;z.habitats.forEach(id=>{z.habitatHealth=z.habitatHealth||{};z.habitatHealth[id]=clamp((z.habitatHealth[id]??100)+5);});log('📈','إعادة استثمار في الحديقة','أعدت استثمار '+cash(10000)+' في جودة الموائل.','good');save();render();zooMenu();},'10,000 '+state.place.unit),
  choice('↩️','رجوع','',zooMenu)
 ]);
}
function zooBreedingMenu(){
 const z=state.zoo,animals=z&&Array.isArray(z.animals)?z.animals:[];if(!animals.length){info('🧬','لا توجد حيوانات','اشترِ حيوانًا واحدًا على الأقل قبل محاولة التكاثر.');return;}
 modal('🧬','التكاثر والرعاية','كل محاولة تكلف 5,000، والنجاح يعتمد على صحة الحيوان وسعادته.',animals.map((animal,i)=>choice(animal.emoji||'🐾',animal.name,'الصحة '+(animal.health||80)+'% · السعادة '+(animal.happiness||70)+'%.',()=>breedZooAnimal(i))));
}

function breedZooAnimal(index){
 closeModal();const z=state.zoo;if(!z||!z.animals[index])return;const animal=z.animals[index],cost=5000;
 if(state.bank<cost){info('💳','الرصيد مش كفاية','الرعاية والتجهيز للتكاثر تحتاج '+cash(cost)+'.');return;}
 state.bank-=cost;const chanceRate=.35+(animal.health||80)/250+(animal.happiness||70)/350;
 if(chance(chanceRate)&&z.animals.length<120){z.animals.push({id:Date.now()+Math.random(),name:'صغير '+animal.species,species:animal.species,emoji:animal.emoji,habitat:animal.habitat,age:0,legendary:false,accessories:[],happiness:80,health:100});log('🧬','مولود جديد في الحديقة','نجحت الرعاية وولد حيوان صغير من نوع '+animal.species+'.','good');}
 else log('🧬','محاولة تكاثر غير ناجحة','لم تنجح المحاولة هذه المرة أو وصلت الحديقة للحد الأقصى؛ حسّن الرعاية وحاول لاحقًا.','bad');
 save();render();zooMenu();
}

function zooAnimalDetails(index){
 const z=state.zoo,a=z&&z.animals[index];if(!a){zooMenu();return;}
 modal(a.emoji||'🐾',a.name,'النوع '+a.species+' · العمر '+a.age+' · الصحة '+(a.health||80)+'% · السعادة '+(a.happiness||70)+'% · الموئل '+a.habitat+'.',[
  choice('🎁','إكسسوارات ووسائل إثراء','إضافة لعبة أو مرفق خاص للحيوان.',()=>zooAccessoryMenu(index)),
  choice('🩺','رعاية بيطرية','تكلفة 2,500 لرفع الصحة والسعادة.',()=>{closeModal();if(state.bank<2500){info('💳','الرصيد مش كفاية','الرعاية تكلف '+cash(2500)+'.');return;}state.bank-=2500;a.health=clamp((a.health||80)+18);a.happiness=clamp((a.happiness||70)+10);log('🩺','رعاية حيوان','قدمت رعاية إلى '+a.name+'.','good');save();render();zooAnimalDetails(index);},'2,500 '+state.place.unit),
  choice('↩️','رجوع للحديقة','',zooMenu)
 ]);
}
function zooAccessoryMenu(index){
 const z=state.zoo,a=z&&z.animals[index];if(!a){zooMenu();return;}
 a.accessories=Array.isArray(a.accessories)?a.accessories:[];
 const opts=zooAccessoryCatalog.filter(item=>!a.accessories.includes(item.id)).map(item=>choice(item.emoji,item.title,'تكلفة الإضافة '+cash(item.cost)+'.',()=>installZooAccessory(index,item.id),cash(item.cost)));
 if(!opts.length)opts.push(choice('✅','كل الإكسسوارات مركبة','هذا الحيوان لديه كل وسائل الإثراء المتاحة.',closeModal));
 opts.push(choice('↩️','رجوع للحيوان','',()=>zooAnimalDetails(index)));modal('🎁','إكسسوارات '+a.name,'الإكسسوارات تحسن السعادة وتزيد جاذبية الحديقة بصورة صغيرة.',opts);
}
function installZooAccessory(index,accessoryId){
 closeModal();const z=state.zoo,a=z&&z.animals[index],item=zooAccessoryCatalog.find(x=>x.id===accessoryId);if(!a||!item)return;
 a.accessories=Array.isArray(a.accessories)?a.accessories:[];if(a.accessories.includes(item.id)){zooAnimalDetails(index);return;}
 if(state.bank<item.cost){info('💳','الرصيد مش كفاية','الإكسسوار يحتاج '+cash(item.cost)+'.');return;}
 state.bank-=item.cost;a.accessories.push(item.id);a.happiness=clamp((a.happiness||70)+10);log('🎁','إكسسوار جديد للحيوان','أضفت '+item.title+' إلى '+a.name+'.','good');save();render();zooAnimalDetails(index);
}
function discoverZooAnimal(){
 closeModal();const z=state.zoo;if(!z||!z.opened)return;const cost=12000;
 if(state.bank<cost){info('💳','الرصيد مش كفاية','رحلة الاكتشاف تكلف '+cash(cost)+'.');return;}state.bank-=cost;
 if(z.animals.length>=120){info('🐾','وصلت لحد الحديقة','وصلت للحد الأقصى البالغ 120 حيوانًا.');return;}if(chance(.28)){const species=pick(zooSpeciesCatalog.filter(s=>s.legendary));z.animals.push({id:Date.now()+Math.random(),name:species.name+' مكتشف',species:species.name,emoji:species.emoji,habitat:species.habitat,age:0,legendary:true,accessories:[],happiness:85,health:100});z.rareDiscoveries=(z.rareDiscoveries||0)+1;log('✨','اكتشاف أسطوري','اكتشفت '+species.name+' وأضفته للحديقة.','special');achievement('اكتشاف حيوان أسطوري');}
 else log('🔎','رحلة بحث','لم تعثر على نوع نادر هذه المرة؛ فريق الحديقة جمع معلومات مفيدة.','');
 save();render();zooMenu();
}

function petsMenu(){
 const opts=[];
 opts.push(choice('🐕','تبنّي كلب','رفيق نشيط محتاج وقت ورعاية.',()=>adoptPet('كلب','🐕',1200)));
 opts.push(choice('🐈','تبنّي قطة','حيوان أليف مستقل نسبيًا.',()=>adoptPet('قطة','🐈',900)));
 opts.push(choice('🐦','تبنّي طائر','رعاية يومية ومصاريف أقل.',()=>adoptPet('طائر','🐦',500)));
 (state.pets||[]).forEach((p,i)=>opts.push(choice(p.emoji,p.name+' · '+p.species,'العمر '+p.age+' سنة · السعادة '+p.happiness+'%',()=>carePet(i))));
 modal('🐾','الحيوانات الأليفة','الحيوان الأليف محتاج أكل ورعاية ومصاريف سنوية.',opts);
}
function adoptPet(species,emoji,cost){
 closeModal();if(state.age<6){info('🐾','لسه صغير','تقدر تتبنى حيوان لما تكون أكبر وقادر تشارك في رعايته.');return;}
 if(state.bank<cost){info('💳','الرصيد مش كفاية','رسوم التبنّي والتجهيز '+cash(cost)+'.');return;}
 const petNames=species==='كلب'?['زيكو','بندق','روكي','لولو']:species==='قطة'?['مشمش','لوزة','فلفل','مشمشة']:['توتة','زقزوق','ريشة'];
 state.bank-=cost;state.pets.push({id:Date.now()+Math.random(),species,emoji,name:pick(petNames),age:0,health:80,happiness:75,cost});stat('happiness',6);achievement('تبنّي حيوان أليف');
 log(emoji,'حيوان أليف جديد','تبنيت '+state.pets[state.pets.length-1].name+'. هتحتاج تهتم بصحته وسعادته كل سنة.','good');render();info('🐾','أهلًا بصديقك الجديد','اتضاف الحيوان لقائمة الرعاية، ومصاريفه السنوية هتتحسب مع تقدم العمر.');
}
function carePet(i){
 const p=state.pets[i];if(!p)return;
 modal(p.emoji,p.name+' · '+p.species,'الصحة '+p.health+'% · السعادة '+p.happiness+'%.',[
  choice('🦴','اللعب معاه','وقت بسيط يرفع السعادة.',()=>petAction(i,'play')),
  choice('🩺','كشف بيطري','فحص صحي مقابل 700 '+state.place.unit+'.',()=>petAction(i,'vet'),'700 '+state.place.unit),
  choice('🍲','أكل ومكافأة','رعاية يومية مقابل 250 '+state.place.unit+'.',()=>petAction(i,'food'),'250 '+state.place.unit),
  choice('↩️','رجوع','',petsMenu)
 ]);
}
function petAction(i,act){
 closeModal();const p=state.pets[i];if(!p)return;const cost=act==='vet'?700:act==='food'?250:0;
 if(state.bank<cost){info('💳','الرصيد مش كفاية','الرعاية محتاجة '+cash(cost)+'.');return;}state.bank-=cost;
 if(act==='play')p.happiness=clamp(p.happiness+12);
 if(act==='vet'){p.health=clamp(p.health+18);p.happiness=clamp(p.happiness+2);}
 if(act==='food'){p.health=clamp(p.health+5);p.happiness=clamp(p.happiness+6);}
 log(p.emoji,'اهتمام بـ'+p.name,act==='play'?'قضيت وقتًا ممتعًا مع '+p.name+'.':act==='vet'?'اخدت '+p.name+' للكشف البيطري.':'قدمت رعاية وأكل لـ'+p.name+'.','good');render();info('🐾','رعاية ناجحة','صحة '+p.name+' بقت '+p.health+'% وسعادته '+p.happiness+'%.');
}
function hobbiesMenu(){
 const catalog=[
  {id:'reading',title:'القراءة',emoji:'📚',cost:0,desc:'تنمّي المعرفة والخيال.'},
  {id:'music',title:'الموسيقى',emoji:'🎸',cost:800,desc:'هواية إبداعية وقد تتحول لمسار فني.'},
  {id:'sports',title:'رياضة',emoji:'⚽',cost:500,desc:'تحسّن الصحة واللياقة.'},
  {id:'cooking',title:'الطبخ',emoji:'🍳',cost:300,desc:'مهارة عملية تساعدك في الحياة.'},
  {id:'writing',title:'الكتابة',emoji:'✍️',cost:0,desc:'تنمّي التعبير والذكاء.'},
  {id:'photography',title:'التصوير',emoji:'📷',cost:1200,desc:'هواية فنية وتفتح فرصًا جانبية.'},
  {id:'gaming',title:'الألعاب',emoji:'🎮',cost:600,desc:'ترفيه وتواصل مع الأصدقاء.'}
 ];
 const opts=catalog.map(h=>choice(h.emoji,h.title,h.desc+(h.cost?' التكلفة '+cash(h.cost)+'.':' مجانية.'),()=>startHobby(h),h.cost?cash(h.cost):'مجانًا'));
 opts.unshift(choice('🎮','موهبة الألعاب الإلكترونية','استعدادك الحالي '+ensureGamingTalent()+'%. ممارسة هواية الألعاب والتدريب التنافسي يساعدان على تطويرها.',()=>{closeModal();info('🎮','موهبة الألعاب الإلكترونية','مستوى استعدادك '+ensureGamingTalent()+'%. تقدر تطورها بالممارسة أو بمسيرة الرياضات الإلكترونية.');}));
 (state.hobbies||[]).forEach(h=>opts.unshift(choice('✅','ممارسة '+h.title,'رفع مهارتك وتحسين الحالة.',()=>practiceHobby(h.id))));
 modal('🎨','الهوايات والمهارات','اختار هواياتك ودرّب مهاراتك على مدار السنين.',opts);
}
function startHobby(h){
 closeModal();if(state.age<5){info('🎨','لسه صغير','الهوايات المنظمة هتكون أنسب من سن 5 سنوات.');return;}
 if(state.hobbies.some(x=>x.id===h.id)){info('✅','الهواية موجودة','أنت بالفعل بتتعلم '+h.title+'. تقدر تمارسها من القائمة.');return;}
 if(state.bank<h.cost){info('💳','الرصيد مش كفاية','الهواية محتاجة '+cash(h.cost)+'.');return;}
 state.bank-=h.cost;state.hobbies.push({id:h.id,title:h.title,level:1});stat('happiness',4);if(h.id==='sports')stat('health',4);if(h.id==='reading'||h.id==='writing')stat('smart',2);
 log(h.emoji,'هواية جديدة','بدأت تتعلم '+h.title+'. مع الممارسة ممكن تتحول لمهارة قوية.','good');achievement('بدأ هواية: '+h.title);render();info('🎨','بداية حلوة','هواية '+h.title+' اتضافت لسجلك. الاستمرار بيرفع مستواك.');
}
function practiceHobby(id){
 closeModal();const h=state.hobbies.find(x=>x.id===id);if(!h)return;
 h.level=clamp((h.level||1)+1,1,100);if(id==='gaming'){ensureGamingTalent();state.talents.gaming=clamp(state.talents.gaming+2,0,100);}stat('happiness',3);
 if(id==='sports')stat('health',4);if(id==='reading'||id==='writing')stat('smart',3);if(id==='music'||id==='photography')state.fame=clamp((state.fame||0)+(chance(.3)?2:0));
 log('🎨','تدريب على '+h.title,'خصصت وقتًا لتطوير هواية '+h.title+'. مستواك الحالي '+h.level+'.','good');render();info('⭐','مستوى الهواية '+h.level,'الممارسة المستمرة تحسن مهاراتك وتفتح فرصًا جديدة.');
}
function travelMenu(){
 const passport=perkOwned('goldenPassport');
 const opts=places.filter(p=>p.country!==state.place.country).map(p=>choice(p.flag,'الهجرة إلى '+p.country,'الوجهة '+p.city+'. '+(passport?'جواز العالم يلغي رسوم الانتقال.':'تكلفة الانتقال والتأسيس 15,000 '+state.place.unit+'.'),()=>emigrate(p),passport?'مجانًا':cash(15000)));
 opts.unshift(choice('🏖️','رحلة داخل البلد','إجازة قصيرة لتحسين المزاج.',()=>{closeModal();if(state.bank<2500){info('💳','الرصيد مش كفاية','الرحلة محتاجة '+cash(2500)+'.');return;}state.bank-=2500;stat('happiness',10);stat('health',2);log('🏖️','رحلة قصيرة','أخدت إجازة داخل البلد ورجعت بطاقة أحسن.','good');render();},cash(2500)));
 modal('🌍','السفر والهجرة','الهجرة ممكن تفتح فرص جديدة، وجواز العالم يسمح بالانتقال لأي وجهة داخل اللعبة من دون رسوم.',opts);
}

function emigrate(destination){
 closeModal();const cost=perkOwned('goldenPassport')?0:15000;
 if(state.age<18){info('🌍','الهجرة غير متاحة','تحتاج تكون بالغ عشان تتخذ قرار الهجرة بنفسك.');return;}
 if(state.bank<cost){info('💳','الرصيد مش كفاية','الانتقال محتاج '+cash(cost)+' قبل ما تبدأ من جديد.');return;}
 const old=state.place;state.bank-=cost;state.travelHistory.push({from:old.country,to:destination.country,age:state.age});
 state.place={...destination};state.stats.happiness=clamp(state.stats.happiness-2);
 if(state.job){state.job.salary=Math.round(state.job.salary*1.15);state.performance=clamp(state.performance-8);}
 log('🌍','بدأت حياة في بلد جديدة','انتقلت من '+old.country+' إلى '+destination.country+'. '+(cost?'محتاج وقت تتأقلم مع المجتمع وسوق العمل.':'جواز العالم غطّى رسوم الانتقال؛ الآن ابدأ التكيّف مع المجتمع وسوق العمل.'),'special');achievement('الهجرة إلى '+destination.country);render();info('🌍','وصلت '+destination.city,'غيّرت بلد الإقامة. وظيفتك ومصاريفك وفرصك هتتأثر بالمكان الجديد.');
}

function investAmount(kind,amount){
 closeModal();if(state.age<18){info('🔒','الاستثمار بعد 18 سنة','');return;}if(state.bank<amount){info('💳','الرصيد مش كفاية','تحتاج '+cash(amount)+' عشان تبدأ.');return;}
 state.bank-=amount;state.investments.push({id:Date.now()+Math.random(),kind,value:amount,initialValue:amount,strategy:'balanced',started:state.age});
 log('📊','بدأت الاستثمار','خصصت '+cash(amount)+' لمحفظة '+kind+'. تقدر تختار استراتيجية قصيرة أو طويلة المدى من تفاصيل المحفظة.','special');save();render();info('📊','تم إنشاء المحفظة','رأس المال المستثمر '+cash(amount)+'. النتائج هتتغير مع تقدم السنين.');
}

function sellInvestment(i){
 closeModal();const inv=state.investments[i];if(!inv)return;
 info('💵','بيع الاستثمار','القيمة الحالية '+cash(inv.value)+'. هل تريد تصفية المحفظة؟',[
  choice('💵','أبيع المحفظة','تحويل القيمة الحالية إلى رصيد نقدي.',()=>{closeModal();state.bank+=inv.value;log('💵','تصفية استثمار','بعت محفظة '+inv.kind+' مقابل '+cash(inv.value)+'.','good');state.investments.splice(i,1);render();}),
  choice('↩️','أحتفظ بها','',()=>{closeModal();investingMenu();})
 ]);
}

function combatCommunityRelationLabel(fighter){
 if(fighter.allied)return 'حليف';
 if(fighter.tension>=65)return 'خصومة مشتعلة';
 if(fighter.tension>=40)return 'منافس متوتر';
 if(fighter.respect>=65)return 'احترام متبادل';
 return 'زميل في المجتمع';
}
function combatCommunityMenu(){
 if(!validState()||!state.specialCareer||state.specialCareer.id!=='fighter'){
  info('🤝','مجتمع المقاتلين','ابدأ مسيرة القتال أولًا لفتح شبكة المقاتلين.');return;
 }
 const c=ensureCombatCareer();
 const allies=c.community.filter(fighter=>fighter.allied).length;
 const rivals=c.community.filter(fighter=>fighter.tension>=65).length;
 const opts=c.community.map(fighter=>choice(fighter.emoji,fighter.name,
  'الأسلوب '+fighter.style+' · '+combatCommunityRelationLabel(fighter)+' · الاحترام '+fighter.respect+'% · التوتر '+fighter.tension+'%',
  ()=>combatCommunityFighterMenu(fighter.id),'',fighter.respect));
 opts.push(choice('↩️','رجوع لمسيرة القتال','',combatCareerMenu));
 modal('🤝','مجتمع المقاتلين','خمسة مقاتلين داخل مجتمعك المحلي · '+allies+' حلفاء · '+rivals+' خصومات مشتعلة. العلاقات تؤثر على النزالات ولا تحتاج اتصالًا بالإنترنت.',opts);
}
function combatCommunityFighterMenu(fighterId){
 const c=ensureCombatCareer(),fighter=c.community.find(item=>item.id===fighterId);
 if(!fighter){combatCommunityMenu();return;}
 const canInteract=fighter.lastInteractionAge!==state.age;
 const contactNote=canInteract?'تفاعل اجتماعي واحد مع هذا المقاتل كل سنة.':'استخدمت تفاعلك الاجتماعي معه في هذه السنة؛ تقدر تتواصل من جديد بعد التقدم بالعمر.';
 const opts=[
  choice('🔎','قراءة المنافس','التقييم '+fighter.rating+'/100 · '+combatDifficultyLabel(fighter.rating)+' · أسلوبه '+fighter.style+' · نقطة ضعفه '+fighter.weakTo+'.',()=>{closeModal();info('📊','ملف '+fighter.name,'الاحترام '+fighter.respect+'% · التوتر '+fighter.tension+'% · الحالة '+combatCommunityRelationLabel(fighter)+'. آخر تواصل: '+(fighter.lastInteractionAge<0?'لم يحدث بعد':'عمر '+fighter.lastInteractionAge)+'.');}),
  choice('💬','حديث ودي',contactNote+' زوّد الاحترام وهدّي التوتر.',()=>interactCombatFighter(fighter.id,'friendly')),
  choice('📣','استفزاز إعلامي',contactNote+' قد يحوّل المنافس إلى خصم دائم ويرفع شهرتك قليلًا.',()=>interactCombatFighter(fighter.id,'trash')),
  choice(fighter.allied?'🔓':'🤝',fighter.allied?'إنهاء التحالف':'عرض تحالف',fighter.allied?'إنهاء التعاون وفتح باب المنافسة من جديد.':'يتطلب احترامًا 55% على الأقل وتوترًا لا يتجاوز 45%.',()=>interactCombatFighter(fighter.id,fighter.allied?'break':'alliance')),
  choice('🥊','تحدي على الحلبة','ابدأ نزال شوارع أمام هذا المقاتل تحديدًا؛ النتيجة ستؤثر على علاقتكما.',()=>startCombatBout('street',fighter.id)),
  ...(fighter.allied?[choice('🥋','تدريب مشترك','تدريب مع حليفك مقابل 800 من عملة اللعبة؛ يحسن التقنية والدفاع قليلًا.',()=>interactCombatFighter(fighter.id,'spar'),'800 '+state.place.unit)]:[]),
  choice('↩️','رجوع للمجتمع','',combatCommunityMenu)
 ];
 modal('⚔️',fighter.name,'الاحترام '+fighter.respect+'% · التوتر '+fighter.tension+'% · '+combatCommunityRelationLabel(fighter)+'. '+contactNote,opts);
}
function interactCombatFighter(fighterId,action){
 const c=ensureCombatCareer(),fighter=c.community.find(item=>item.id===fighterId);
 if(!fighter){combatCommunityMenu();return;}
 if(fighter.lastInteractionAge===state.age){
  closeModal();info('⏳','خد الأمور بهدوء','تقدر تعمل تفاعل اجتماعي واحد مع نفس المقاتل في كل سنة من عمر الشخصية.');return;
 }
 if(action==='alliance'&&!fighter.allied&&(fighter.respect<55||fighter.tension>45)){
  closeModal();info('🤝','التحالف محتاج ثقة','ابدأ بحديث ودي أو كسب احترامه في نزال، ثم حاول عرض التحالف عندما يصل الاحترام إلى 55% ويقل التوتر عن 45%.');return;
 }
 if(action==='spar'){
  if(!fighter.allied){closeModal();info('🥋','التدريب يحتاج حليفًا','كوّن تحالفًا مع المقاتل قبل طلب التدريب المشترك.');return;}
  const cost=800;
  if(state.bank<cost){closeModal();info('💳','الرصيد غير كافٍ','تحتاج '+cash(cost)+' للتدريب المشترك.');return;}
  state.bank-=cost;c.technique=clamp(c.technique+3);c.defense=clamp(c.defense+2);c.energy=clamp(c.energy-5);
  fighter.respect=clamp(fighter.respect+3);
  fighter.lastAction='spar';fighter.lastInteractionAge=state.age;
  log('🥋','تدريب مشترك','تدربت مع '+fighter.name+'؛ تحسنت التقنية والدفاع مقابل تكلفة التدريب.','good');
 }else if(action==='friendly'){
  fighter.respect=clamp(fighter.respect+12);fighter.tension=clamp(fighter.tension-5);
  fighter.lastAction='friendly';
  log('💬','حديث ودي','قضيت وقتًا مع '+fighter.name+' وزاد الاحترام المتبادل.','good');
 }else if(action==='trash'){
  fighter.respect=clamp(fighter.respect-8);fighter.tension=clamp(fighter.tension+20);
  fighter.lastAction='trash';state.fame=clamp((state.fame||0)+1);state.reputation=clamp((state.reputation||50)+1);
  log('📣','استفزاز إعلامي','أشعلت التوتر مع '+fighter.name+' وأصبحت المواجهة بينكما أكثر شخصية.','special');
 }else if(action==='alliance'){
  fighter.allied=true;fighter.respect=clamp(fighter.respect+5);fighter.tension=clamp(fighter.tension-8);
  fighter.lastAction='alliance';
  log('🤝','تحالف جديد','وافَق '+fighter.name+' على التعاون معك؛ أصبح بإمكانكما التدريب المشترك.','good');
 }else if(action==='break'){
  fighter.allied=false;fighter.tension=clamp(fighter.tension+12);fighter.lastAction='break';
  log('⚖️','إنهاء التحالف','أنهيت تحالفك مع '+fighter.name+' وعادت المنافسة بينكما.','');
 }else return;
 fighter.lastInteractionAge=state.age;
 save();render();combatCommunityFighterMenu(fighter.id);
}

function combatCareerMenu(){
 if(!validState()||!state.specialCareer||state.specialCareer.id!=='fighter'){info('🥊','مسيرة القتال','ابدأ مسار المقاتل المحترف من قائمة المهن الخاصة أولًا.');return;}
 const c=ensureCombatCareer();if(c.pendingBout){combatBoutRoundMenu();return;}
 const rank=combatRankName(c),moves=c.movesKnown.length,masteredMoves=c.movesKnown.filter(id=>combatMoveMasteryLevel(c.moveMastery[id]||0)===4).length;
 const injury=c.injury>0?' · إصابة '+c.injury+'%':'';
 const coach=c.coach?' · المدرب '+c.coach.name+' ('+fmt(c.coach.yearsLeft||0)+' سنوات متبقية)':' · من غير مدرب';
 const summary='الرتبة: '+rank+' · نقاط الدوري '+fmt(c.leaguePoints)+' · رصيد الشارع '+fmt(c.streetCred)+injury+coach+' · حركات خبيرة '+masteredMoves+'/'+moves;
 const opts=[
  choice('📊','ملف المقاتل',summary,()=>{closeModal();info('🥊','ملف المقاتل',summary+' · فوز '+c.wins+' · خسارة '+c.losses+' · نزالات الشوارع '+c.streetWins+' · نزالات الدوري '+c.leagueWins+' · الطاقة '+c.energy+'%.');},'',c.leaguePoints/2),
  choice('🏋️','تدريب القدرات','تقنية '+c.technique+'% · قوة '+c.power+'% · سرعة '+c.speed+'% · دفاع '+c.defense+'% · لياقة '+c.stamina+'%.',combatTrainingMenu,'',Math.round((c.technique+c.power+c.speed+c.defense+c.stamina)/5)),
  choice('📚','تعلّم حركة جديدة','تعلّم حركات بأساليب وقوة مختلفة، وافتح الحركات المتقدمة مع التقدم.',learnCombatMove),
  choice('🎯','اختيار الحركة الرئيسية','الحركة المختارة: '+((combatMoveCatalog.find(m=>m.id===c.selectedMove)||combatMoveCatalog[0]).title)+'.',selectCombatMove),
  choice('🧑‍🏫',c.coach?'تغيير المدرب':'التعاقد مع مدرب','المدرب يحسّن فرصك، لكن له تكلفة سنوية.',hireCombatCoach),
  choice('🤝','مجتمع المقاتلين','تعرّف على المنافسين، ابنِ تحالفات أو خصومات، وتحدّ مقاتلًا بعينه.',combatCommunityMenu,'',c.community.filter(fighter=>fighter.allied).length*20),
  choice('🥊','نزال شوارع','منافسة تدريبية تبني خبرتك وسمعتك في عالم القتال.',()=>startCombatBout('street'),''),
  choice('🏆','نزال الدوري','افتح الدوري بعد فوزين في الشوارع ورصيد 20 على الأقل. الفوز يرفع رتبتك.',()=>startCombatBout('league'),''),
  choice('🩹','التعافي من الإصابات','الإصابة الحالية '+c.injury+'% · '+c.injuryYears+' سنوات متوقعة. الراحة والعلاج يساعدانك.',recoverCombatInjury,''),
  choice('📜','سجل النزالات','راجع نتائج آخر النزالات ومكاسبها.',combatBoutHistory),
  choice('↩️','قائمة المهن الخاصة','ارجع إلى قائمة المسارات المتخصصة.',specialCareers)
 ];
 modal('🥊','مسيرة القتال',summary+' · الحركات المتاحة '+moves+' · سجل النزالات '+c.wins+' فوز و'+c.losses+' خسارة.',opts);
}
function combatTrainingMenu(){
 if(!validState()||!state.specialCareer||state.specialCareer.id!=='fighter'){specialCareers();return;}
 const c=ensureCombatCareer(),coachBonus=c.coach?c.coach.level:0;
 const opts=[
  choice('🧠','التقنية · '+c.technique+'%','التوقيت وقراءة المنافس والحركة المختارة.',()=>trainCombatAttribute('technique','التقنية'), '1,500 '+state.place.unit,c.technique),
  choice('💪','القوة · '+c.power+'%','ارفع القوة تدريجيًا لتحسين مستوى أدائك.',()=>trainCombatAttribute('power','القوة'),'1,500 '+state.place.unit,c.power),
  choice('⚡','السرعة · '+c.speed+'%','تحسين السرعة يساعدك أمام أساليب معينة.',()=>trainCombatAttribute('speed','السرعة'),'1,500 '+state.place.unit,c.speed),
  choice('🛡️','الدفاع · '+c.defense+'%','قلّل فرص الخسارة الكبيرة وتعلم الانضباط.',()=>trainCombatAttribute('defense','الدفاع'),'1,500 '+state.place.unit,c.defense),
  choice('🫁','اللياقة · '+c.stamina+'%','لياقة أفضل تعني الحفاظ على الطاقة أثناء النزال.',()=>trainCombatAttribute('stamina','اللياقة'),'1,500 '+state.place.unit,c.stamina),
  choice('↩️','رجوع لمسيرة القتال','',combatCareerMenu)
 ];
 modal('🏋️','تدريب المقاتل','كل جلسة تكلف 1,500 '+state.place.unit+'. '+(coachBonus?'مدربك يضيف مكافأة تدريب بمقدار '+coachBonus+' نقاط.':'تعيين مدرب يحسّن أثر التدريب.'),opts);
}
function trainCombatAttribute(key,label){
 if(!validState()||!state.specialCareer||state.specialCareer.id!=='fighter')return;
 const c=ensureCombatCareer(),cost=1500;
 if(state.bank<cost){closeModal();info('💳','الرصيد مش كفاية','تحتاج '+cash(cost)+' لجلسة تدريب.');return;}
 if(c[key]>=100){closeModal();info('🏋️','وصلت للحد الأقصى','مستوى '+label+' وصل إلى 100%. جرّب تدريب سمة أخرى.');return;}
 closeModal();state.bank-=cost;
 const gain=3+Math.floor(Math.random()*5)+(c.coach?Math.min(4,c.coach.level):0);
 c[key]=clamp(c[key]+gain);c.energy=clamp(c.energy-5);
 let result='زادت '+label+' بمقدار '+gain+' نقاط وأصبحت '+c[key]+'%.';
 if((state.stats.health||0)<45&&chance(.12)){c.injury=clamp(c.injury+12);c.injuryYears=Math.max(c.injuryYears,1);result+=' الإجهاد سبب إصابة بسيطة داخل اللعبة؛ خُد وقتًا للتعافي.';}
 log('🏋️','تدريب المقاتل',result,'good');save();render();combatTrainingMenu();
}
function learnCombatMove(){
 const c=ensureCombatCareer();
 const opts=combatMoveCatalog.map(m=>{
  const known=c.movesKnown.includes(m.id),locked=c.rank<m.rank,available=!known&&!locked;
  const uses=Math.max(0,Number(c.moveMastery[m.id])||0),mastery=known?' · الإتقان: '+combatMoveMasteryLabel(uses)+' · '+Math.min(uses,25)+'/25 استخدام · مكافأة '+combatMoveMasteryBonus(uses)+' نقاط':'';
  const desc=m.desc+' · الأسلوب: '+m.style+' · قوي أمام: '+m.strongAgainst+' · القوة '+m.power+'.'+mastery+(known?' تم تعلمها بالفعل.':locked?' تحتاج رتبة '+['مبتدئ','هاوٍ','محترف','منافس على اللقب','بطل الدوري'][m.rank]+'.':'');
  return choice(known?'✅':locked?'🔒':'🥋',m.title,desc,()=>buyCombatMove(m.id),m.cost?cash(m.cost):'مفتوحة',m.power);
 });
 opts.push(choice('↩️','رجوع','',combatCareerMenu));
 modal('📚','أكاديمية الحركات','الحركات هنا أصلية ومصممة للعبة. كل حركة لها أسلوب وميزة أمام أسلوب منافس محدد.',opts);
}
function buyCombatMove(id){
 const c=ensureCombatCareer(),m=combatMoveCatalog.find(x=>x.id===id);
 if(!m)return;
 if(c.movesKnown.includes(id)){closeModal();info('🥋','الحركة معروفة','أنت تعلمت '+m.title+' بالفعل.');return;}
 if(c.rank<m.rank){closeModal();info('🔒','الحركة مقفولة','تحتاج الوصول إلى رتبة '+['مبتدئ','هاوٍ','محترف','منافس على اللقب','بطل الدوري'][m.rank]+' قبل تعلم '+m.title+'.');return;}
 if(state.bank<m.cost){closeModal();info('💳','الرصيد مش كفاية','تحتاج '+cash(m.cost)+' لتعلم الحركة.');return;}
 closeModal();state.bank-=m.cost;c.movesKnown.push(m.id);c.selectedMove=m.id;log('🥋','تعلمت حركة جديدة','تعلمت '+m.title+' · أسلوب '+m.style+' · قوية أمام أسلوب '+m.strongAgainst+'.','good');achievement('تعلم حركة قتالية جديدة');save();render();combatCareerMenu();
}
function selectCombatMove(){
 const c=ensureCombatCareer(),opts=c.movesKnown.map(id=>{
  const m=combatMoveCatalog.find(x=>x.id===id);if(!m)return null;
  const uses=Math.max(0,Number(c.moveMastery[m.id])||0);
  return choice(m.id===c.selectedMove?'✅':'🥋',m.title,'الأسلوب '+m.style+' · قوية أمام '+m.strongAgainst+' · القوة '+m.power+' · الإتقان '+combatMoveMasteryLabel(uses)+' · '+Math.min(uses,25)+'/25 استخدام · مكافأة '+combatMoveMasteryBonus(uses)+'.',()=>{closeModal();c.selectedMove=m.id;log('🎯','تغيير خطة النزال','اخترت '+m.title+' كحركة رئيسية.');save();render();combatCareerMenu();},'',m.power+combatMoveMasteryBonus(uses));
 }).filter(Boolean);
 modal('🎯','الحركة الرئيسية','اختار حركة تناسب أسلوب منافسك القادم.',opts);
}
function hireCombatCoach(){
 const c=ensureCombatCareer();
 const opts=combatCoachCatalog.map(coach=>choice(coach.level===3?'🌟':coach.level===2?'🧑‍🏫':'🥋',coach.title+' · '+coach.name,coach.desc+' مكافأة النزال +'+coach.bonus+' · تكلفة سنوية '+cash(coach.annualCost)+'.',()=>assignCombatCoach(coach.id),cash(coach.price)));
 if(c.coach)opts.unshift(choice('↩️','إنهاء التعاقد','إيقاف المصاريف السنوية للمدرب الحالي.',()=>{closeModal();c.coach=null;log('🧑‍🏫','إنهاء التعاقد','أنهيت التعاقد مع المدرب لتقليل المصاريف السنوية.');save();render();combatCareerMenu();}));
 modal('🧑‍🏫','اختيار المدرب','التعاقد له سعر بداية ومصاريف سنوية. لو رصيدك لا يكفي المصروف السنوي، ينتهي العقد تلقائيًا.',opts);
}
function assignCombatCoach(id){
 const c=ensureCombatCareer(),coach=combatCoachCatalog.find(x=>x.id===id);
 if(!coach)return;
 if(state.bank<coach.price){closeModal();info('💳','الرصيد مش كفاية','التعاقد يحتاج '+cash(coach.price)+' كبداية.');return;}
 closeModal();state.bank-=coach.price;c.coach={...coach,yearsLeft:3};
 log('🧑‍🏫','تعاقدت مع مدرب','بدأت التدريب مع '+coach.name+'. العقد مدته 3 سنوات مع مصاريف سنوية '+cash(coach.annualCost)+'.','good');
 achievement('التعاقد مع مدرب قتال');save();render();combatCareerMenu();
}
function startCombatBout(mode,communityFighterId=null){
 if(!validState()||!state.specialCareer||state.specialCareer.id!=='fighter'){specialCareers();return;}
 const c=ensureCombatCareer();
 if(c.pendingBout){combatBoutRoundMenu();return;}
 if(c.injuryYears>0||c.injury>=65){closeModal();info('🩹','محتاج تتعافى','عندك إصابة '+c.injury+'% ولسه '+c.injuryYears+' سنوات متوقعة للتعافي. اختار العلاج أو انتظر قبل النزال التالي.');return;}
 if(c.energy<25){closeModal();info('🫁','الطاقة منخفضة','استرح سنة أو تدرب بخفة قبل النزال التالي.');return;}
 if(mode==='league'&&(c.streetWins<2||c.streetCred<20)){closeModal();info('🔒','الدوري لسه مقفول','محتاج فوزين في نزالات الشوارع ورصيد شارع 20 على الأقل. الحالي: '+c.streetWins+' فوز و'+c.streetCred+' رصيد.');return;}
 if(mode==='league'&&state.bank<1500){closeModal();info('💳','رسوم الدوري','المشاركة في نزال الدوري تحتاج '+cash(1500)+'.');return;}
 const communityFighter=communityFighterId?c.community.find(fighter=>fighter.id===communityFighterId):null;
 if(communityFighterId&&!communityFighter){closeModal();info('🥊','المنافس غير متاح','لم نتمكن من العثور على المقاتل المطلوب في مجتمعك.');combatCommunityMenu();return;}
 const type=communityFighter?null:pick(combatOpponentTypes);
 const opponent=communityFighter?
  {name:communityFighter.name,style:communityFighter.style,weakTo:communityFighter.weakTo,emoji:communityFighter.emoji,
   rating:clamp(communityFighter.rating+(mode==='league'?c.rank*4:0),18,95),mode,fee:mode==='league'?1500:0}:
  {name:pick(combatOpponentNames),style:type.style,weakTo:type.weakTo,emoji:type.emoji,
   rating:mode==='league'?34+c.rank*8+Math.floor(Math.random()*13):18+Math.floor(Math.random()*31),mode,fee:mode==='league'?1500:0};
 if(mode==='league')state.bank-=1500;
 c.pendingBout=normalizePendingCombatBout({mode,opponent,round:1,playerScore:0,opponentScore:0,roundHistory:[],lastStyle:'',lastMoveId:'',startedAge:state.age,feePaid:mode==='league',communityFighterId:communityFighter?communityFighter.id:null,reactionId:''});
 log('🥊','بدأ النزال','دخلت مواجهة من ثلاث جولات أمام '+opponent.name+'. '+(communityFighter?'هذه مواجهة مباشرة مع أحد أعضاء مجتمعك. ':'')+'راقب أسلوب المنافس ووازن بين الهجوم والطاقة.','special');
 save();render();combatBoutRoundMenu();
}
function combatBoutRoundMenu(){
 const c=ensureCombatCareer(),session=c&&c.pendingBout;
 if(!session){combatCareerMenu();return;}
 const opponent=session.opponent,round=session.round;
 const intent=combatOpponentIntent(opponent,round,session.lastStyle);
 if(!session.reactionId){
  if(session.reactionTimingAssist!==true&&(!Number.isFinite(Number(session.reactionWindowStartedAt))||Number(session.reactionWindowStartedAt)<=0)){
   session.reactionTimingAssist=uiSettings.combatTimingAssist===true;
   if(!session.reactionTimingAssist)session.reactionWindowStartedAt=Date.now();
   save();
  }
  const elapsedSinceOpen=Math.max(0,Date.now()-Number(session.reactionWindowStartedAt));
  const animationDelay=Math.min(1800,elapsedSinceOpen);
  const timingMarkup=session.reactionTimingAssist===true
   ?'<p class="combat-reaction-hint" role="status">مساعدة التوقيت مفعّلة: لا يوجد عدّ تنازلي أو استجابة سريعة مطلوبة، وتحصل على 4 نقاط ثابتة.</p>'
   :'<div class="combat-reaction-clock" aria-hidden="true"><span style="animation-delay:-'+animationDelay+'ms"></span></div><p class="combat-reaction-hint">استجابة سريعة خلال 1.8 ثانية تمنحك 4 نقاط إضافية. التأخر لا يخصم نقاطًا.</p>';
  const reactionOptions=combatReactionCatalog.map(item=>{
   const effect=combatReactionEffect(intent.style,item.id);
   const qualityText=effect.quality==='ممتاز'?'أفضل رد متوقع':effect.quality==='مقبول'?'رد مقبول':'رد محفوف بالمخاطرة';
   return choice('🛡️',item.title,item.description+' · '+qualityText+' أمام '+intent.style+' · استهلاك '+item.energyCost+' طاقة.',()=>chooseCombatReaction(item.id));
  });
  reactionOptions.unshift({icon:'⚠️',title:'إشارة المنافس: '+intent.title,desc:intent.description+' · الأسلوب المتوقع '+intent.style+' · '+combatDifficultyLabel(opponent.rating)+' · طاقتك '+c.energy+'%.',progress:opponent.rating,disabled:true});
  modal(session.mode==='league'?'🏆':'🥊','الجولة '+round+' من 3 · اقرأ نية المنافس','قبل اختيار حركتك، حدّد رد فعلك على الهجمة التي يستعد لها المنافس. اختيارك يؤثر على نقاط الجولة واستهلاك الطاقة.',reactionOptions,true,timingMarkup);
  return;
 }
 const reaction=combatReactionEffect(intent.style,session.reactionId);
 if(!reaction){session.reactionId='';save();combatBoutRoundMenu();return;}
 const opts=c.movesKnown.map(id=>{
  const move=combatMoveCatalog.find(item=>item.id===id);if(!move)return null;
  const uses=Math.max(0,Number(c.moveMastery[move.id])||0),masteryBonus=combatMoveMasteryBonus(uses);
  const advantage=move.strongAgainst===intent.style?' ميزة مباشرة ضد أسلوب الجولة.':move.style===opponent.weakTo?' أسلوبك يستغل نقطة ضعف المنافس.':'';
  return choice('🥋',move.title,'أسلوب '+move.style+' · قوي أمام '+move.strongAgainst+' · القوة '+move.power+'. الإتقان '+combatMoveMasteryLabel(uses)+' · مكافأة '+masteryBonus+' نقاط. '+advantage,()=>resolveCombatRound(move.id),'',move.power+masteryBonus);
 }).filter(Boolean);
 const recoveryUsed=session.roundHistory.some(item=>item.actionId==='tactic-breathe');
 combatTacticCatalog.forEach(tactic=>{
  if(tactic.oncePerBout&&recoveryUsed)return;
  const advantage=tactic.strongAgainst===intent.style?' ميزة مباشرة ضد أسلوب الجولة.':tactic.style===opponent.weakTo?' يستغل نقطة ضعف المنافس.':'';
  const recoveryNote=tactic.energyRecovery?' · استعادة '+tactic.energyRecovery+' طاقة مرة واحدة في النزال.':'';
  opts.push(choice('🎯',tactic.title,tactic.desc+' · الأسلوب '+tactic.style+' · القوة '+tactic.power+'.'+advantage+recoveryNote,()=>resolveCombatRound(tactic.id),'',tactic.power));
 });
 opts.unshift({icon:'🛡️',title:'رد فعلك: '+reaction.title+' · '+reaction.quality,desc:'إشارة المنافس: '+intent.title+' · مكافأة الجولة '+reaction.playerBonus+' · تكلفة الرد '+reaction.energyCost+' طاقة.',disabled:true});
 opts.unshift({icon:'📊',title:'الجولة '+round+' من 3',desc:'المنافس: '+opponent.name+' · الأسلوب المتوقع: '+intent.style+' · '+combatDifficultyLabel(opponent.rating)+' · الطاقة '+c.energy+'%.',progress:opponent.rating,disabled:true});
 modal(session.mode==='league'?'🏆':'🥊','نزال '+(session.mode==='league'?'الدوري':'الشوارع')+' · الجولة '+round,'اختر حركة أو تكتيك بعد رد الفعل. الطاقة المتبقية والإتقان وقراءة أسلوب المنافس تؤثر على النتيجة.',opts);
}
function chooseCombatReaction(reactionId){
 if(!validState()||!state.specialCareer||state.specialCareer.id!=='fighter')return;
 const session=ensureCombatCareer().pendingBout;
 const reaction=combatReactionCatalog.find(item=>item.id===reactionId);
 if(!session||session.reactionId||!reaction){combatBoutRoundMenu();return;}
 const startedAt=Number(session.reactionWindowStartedAt);
 const assisted=session.reactionTimingAssist===true;
 const timing=combatReactionTiming(assisted?null:(session.reactionWindowStartedAt==null?null:Date.now()-startedAt),assisted);
 session.reactionId=reaction.id;
 session.reactionTimeMs=timing.elapsedMs;
 session.reactionWindowStartedAt=null;
 save();render();combatBoutRoundMenu();
}
function resolveCombatRound(actionId){
 if(!validState()||!state.specialCareer||state.specialCareer.id!=='fighter')return;
 const c=ensureCombatCareer(),session=c.pendingBout;
 if(!session){combatCareerMenu();return;}
 if(!['guard','dodge','counter'].includes(session.reactionId)){combatBoutRoundMenu();return;}
 const learnedMove=combatMoveCatalog.find(item=>item.id===actionId&&c.movesKnown.includes(item.id));
 const tactic=combatTacticCatalog.find(item=>item.id===actionId);
 const move=learnedMove||tactic;
 if(!move){closeModal();info('🥋','الحركة غير متاحة','اختار حركة تعلمتها أو تكتيكًا متاحًا في الجولة.');combatBoutRoundMenu();return;}
 if(move.oncePerBout&&session.roundHistory.some(item=>item.actionId===move.id)){
  closeModal();info('🫁','استعادة الطاقة مستخدمة','تقدر تستخدم التقاط الأنفاس مرة واحدة فقط في النزال.');combatBoutRoundMenu();return;
 }
 const round=session.round,opponent=session.opponent;
 const intent=combatOpponentIntent(opponent,round,session.lastStyle),opponentStyle=intent.style;
 const reaction=combatReactionEffect(opponentStyle,session.reactionId);
 if(!reaction){session.reactionId='';session.reactionTimeMs=null;session.reactionWindowStartedAt=null;session.reactionTimingAssist=false;save();combatBoutRoundMenu();return;}
 const reactionTiming=combatReactionTiming(session.reactionTimeMs,session.reactionTimingAssist===true);
 const masteryUses=learnedMove?Math.max(0,Number(c.moveMastery[move.id])||0):0;
 const masteryLevel=learnedMove?combatMoveMasteryLevel(masteryUses):0;
 const masteryBonus=learnedMove?combatMoveMasteryBonus(masteryUses):0;
 const coachBonus=c.coach?c.coach.bonus:0;
 const counterBonus=move.strongAgainst===opponentStyle?12:(move.style===opponent.weakTo?7:(move.style===opponentStyle?-4:0));
 const agePenalty=state.age>38?(state.age-38)*.8:0;
 const energyFactor=.62+c.energy/263;
 const repeatedPenalty=session.lastStyle===move.style?3:0;
 const communityFighter=session.communityFighterId?c.community.find(fighter=>fighter.id===session.communityFighterId):null;
 const communityAdjustment=communityFighter?clamp(Math.round((communityFighter.respect-communityFighter.tension)/25),-4,4):0;
 const playerScore=(c.technique*.19+c.power*.18+c.speed*.16+c.defense*.13+c.stamina*.10+state.stats.health*.10+(state.specialCareer.level||1)*.8+move.power*.12+coachBonus-c.injury*.16-agePenalty)*energyFactor+counterBonus-repeatedPenalty+communityAdjustment+masteryBonus+reaction.playerBonus+reactionTiming.bonus;
 const opponentScore=opponent.rating+(Math.random()*12-6)+(round-1)*1.2+reaction.opponentBonus;
 const healthBefore=clamp(state.stats.health),injuryBefore=clamp(c.injury);
 const impact=combatRoundImpact(opponent.rating,c.defense,reaction.quality,reactionTiming.bonus);
 state.stats.health=clamp(healthBefore-impact.healthDamage);
 c.injury=clamp(injuryBefore+impact.injuryGain);
 if(impact.injuryGain>0)c.injuryYears=Math.max(c.injuryYears,1);
 const energyResult=combatRoundEnergy(c.energy,move,session.mode,reaction.energyCost);
 c.energy=energyResult.after;
 const nextMasteryUses=learnedMove?Math.min(100,masteryUses+1):masteryUses;
 if(learnedMove)c.moveMastery[move.id]=nextMasteryUses;
 session.playerScore+=playerScore;session.opponentScore+=opponentScore;
 session.roundHistory.push({round,actionId:move.id,actionTitle:move.title,style:move.style,opponentStyle,playerScore,opponentScore,masteryLevel,masteryBonus,masteryUses:nextMasteryUses,
  intentStyle:intent.style,intentTitle:intent.title,reactionId:reaction.id,reactionTitle:reaction.title,reactionQuality:reaction.quality,
  reactionPlayerBonus:reaction.playerBonus,reactionOpponentBonus:reaction.opponentBonus,reactionCost:energyResult.reactionCost,
  reactionTimeMs:reactionTiming.elapsedMs,reactionTimingBonus:reactionTiming.bonus,reactionTimingAssist:session.reactionTimingAssist===true,
  energyBefore:energyResult.before,energyCost:energyResult.energyCost,energyRecovery:energyResult.energyRecovery,energyAfter:energyResult.after,
  healthBefore,healthDamage:impact.healthDamage,healthAfter:state.stats.health,
  injuryBefore,injuryGain:impact.injuryGain,injuryAfter:c.injury});
 session.lastStyle=move.style;session.lastMoveId=move.id;
 log('🥊','انتهت الجولة '+round,move.title+' · إشارة المنافس '+intent.title+' · ردك '+reaction.title+' ('+reaction.quality+') · توقيت الاستجابة '+reactionTiming.label+(reactionTiming.bonus?' +'+reactionTiming.bonus+' نقاط':'')+' · نقاط الجولة '+Math.round(playerScore)+' مقابل '+Math.round(opponentScore)+' · الطاقة المتبقية '+c.energy+'% · الصحة -'+impact.healthDamage+'%'+(impact.injuryGain?' · إصابة +'+impact.injuryGain+'%':'')+'.'+(energyResult.energyRecovery?' · استعدت '+energyResult.energyRecovery+' طاقة.':''),'');
 if(learnedMove&&combatMoveMasteryLevel(nextMasteryUses)>masteryLevel){
  log('🥋','تطور إتقان الحركة','وصلت إلى مستوى '+combatMoveMasteryLabel(nextMasteryUses)+' في '+move.title+'. أصبحت تضيف '+combatMoveMasteryBonus(nextMasteryUses)+' نقاط إلى أدائك عند استخدامها.','good');
  achievement('إتقان حركة قتالية: '+move.title+' · '+combatMoveMasteryLabel(nextMasteryUses));
 }
 if(session.roundHistory.length>=3){
  const completed={...session,roundHistory:session.roundHistory.slice(0,3)};
  const probability=clamp(50+((completed.playerScore-completed.opponentScore)/3)*1.65,12,88);
  c.pendingBout=null;
  resolveCombatBout(completed.mode,completed.opponent,move.id,probability,completed);
  return;
 }
 session.round=session.roundHistory.length+1;session.reactionId='';session.reactionTimeMs=null;session.reactionWindowStartedAt=null;session.reactionTimingAssist=false;
 save();render();combatBoutRoundMenu();
}
function resolveCombatBout(mode,opponent,moveId,probabilityOverride=null,session=null){
 if(!validState()||!state.specialCareer||state.specialCareer.id!=='fighter')return;
 const c=ensureCombatCareer(),move=combatMoveCatalog.find(m=>m.id===moveId&&c.movesKnown.includes(m.id))||combatTacticCatalog.find(m=>m.id===moveId);
 if(!move){closeModal();info('🥋','الحركة غير متاحة','اختار واحدة من الحركات التي تعلمتها.');return;}
 if(mode==='league'&&!session&&state.bank<1500){closeModal();info('💳','الرصيد مش كفاية','رسوم الدوري تحتاج '+cash(1500)+'.');return;}
 closeModal();if(mode==='league'&&!session)state.bank-=1500;
 const coachBonus=c.coach?c.coach.bonus:0,counterBonus=move.strongAgainst===opponent.style?12:(move.style===opponent.weakTo?7:(move.style===opponent.style?-4:0));
 const agePenalty=state.age>38?(state.age-38)*.8:0;
 const masteryBonus=combatMoveCatalog.some(item=>item.id===move.id)?combatMoveMasteryBonus(c.moveMastery[move.id]||0):0;
 const playerScore=c.technique*.19+c.power*.18+c.speed*.16+c.defense*.13+c.stamina*.10+state.stats.health*.10+(state.specialCareer.level||1)*.8+move.power*.12+coachBonus-c.injury*.16-agePenalty+masteryBonus;
 const opponentScore=opponent.rating+(Math.random()*12-6);
 const probability=probabilityOverride!==null&&probabilityOverride!==undefined&&Number.isFinite(Number(probabilityOverride))?clamp(Number(probabilityOverride),12,88):clamp(50+(playerScore-opponentScore)*1.65+counterBonus,12,88);
 const won=chance(probability/100);
 if(!session)c.energy=clamp(c.energy-(mode==='league'?30:20));
 let earnings=0,title,detail,tone='bad';
 if(won){
  c.wins++;c.knockouts+=chance(.23)?1:0;
  if(mode==='street'){c.streetWins++;c.streetCred+=12;c.leaguePoints+=5;earnings=500+Math.floor(Math.random()*1200);title='فوز في نزال الشوارع';detail='كسبت النزال أمام '+opponent.name+' وبنيت خبرتك وسمعتك في عالم القتال.';}
  else{c.leagueWins++;c.leaguePoints+=25;earnings=4500+Math.floor(Math.random()*9500);title='فوز في الدوري';detail='فزت على '+opponent.name+' وتقدمت في ترتيب الدوري.';}
  state.bank+=earnings;state.fame=clamp((state.fame||0)+(mode==='league'?3:1));state.reputation=clamp((state.reputation||50)+2);
  const newRank=c.leaguePoints>=150?4:c.leaguePoints>=100?3:c.leaguePoints>=60?2:c.leaguePoints>=25?1:0;
  if(newRank>c.rank){c.rank=newRank;detail+=' ارتفعت رتبتك إلى '+combatRankName(c)+'.';log('🏆','ترقية في ترتيب المقاتلين','وصلت إلى رتبة '+combatRankName(c)+' بعد تقدمك في الدوري.','special');achievement('ارتقيت في ترتيب المقاتلين: '+combatRankName(c));}
  if(c.rank>=4&&c.leagueWins>=3&&!c.champion){c.champion=true;title='توجت بطلًا للعالم';detail+=' حققت شرط البطولة وتوجت بلقب بطل العالم!';achievement('بطل العالم في القتال');}
  tone='good';
 }else{
  c.losses++;
  // Losing a street fight does not remove street credibility; this follows the current official rule.
  const injuryGain=12+Math.floor(Math.random()*19)+(state.age>38?5:0);c.injury=clamp(c.injury+injuryGain);c.injuryYears=Math.max(c.injuryYears,c.injury>=65?2:1);
  state.stats.health=clamp(state.stats.health-(5+Math.floor(Math.random()*7)));state.stats.happiness=clamp(state.stats.happiness-3);
  if(mode==='league'){c.leaguePoints=Math.max(0,c.leaguePoints-4);title='خسارة في الدوري';detail='خسرت أمام '+opponent.name+'. لم ينقص رصيدك في الشوارع، لكن ترتيب الدوري تراجع قليلًا.';}
  else{title='خسارة في نزال الشوارع';detail='خسرت أمام '+opponent.name+'. رصيد الشارع لا ينقص بسبب الخسارة، لكنك تحتاج راحة بسبب الإصابة.';}
  state.reputation=clamp((state.reputation||50)-1);
 }
 const communityFighter=session&&session.communityFighterId?c.community.find(fighter=>fighter.id===session.communityFighterId):null;
 if(communityFighter){
  communityFighter.respect=clamp(communityFighter.respect+(won?10:3));
  communityFighter.tension=clamp(communityFighter.tension+(won?-12:14));
  communityFighter.lastBoutAge=state.age;
  if(communityFighter.allied&&!won&&communityFighter.tension>=75){
   communityFighter.allied=false;detail+=' التوتر بعد النزال أنهى التحالف بينكما.';
  }
  detail+=won?' زاد الاحترام بينك وبين '+communityFighter.name+' وهدأ التوتر.':' أصبح التنافس بينك وبين '+communityFighter.name+' أكثر حدة.';
 }
 c.rank=c.leaguePoints>=150?4:c.leaguePoints>=100?3:c.leaguePoints>=60?2:c.leaguePoints>=25?1:0;
 const roundSummary=session?session.roundHistory.map(item=>({round:item.round,move:item.actionTitle,style:item.style,opponentStyle:item.opponentStyle,playerScore:Math.round(item.playerScore),opponentScore:Math.round(item.opponentScore),masteryLevel:item.masteryLevel||0,masteryBonus:item.masteryBonus||0,masteryUses:item.masteryUses||0,
  intentStyle:item.intentStyle||item.opponentStyle,intentTitle:item.intentTitle||'',reactionId:item.reactionId||'',reactionTitle:item.reactionTitle||'',reactionQuality:item.reactionQuality||'',reactionCost:item.reactionCost===undefined?null:item.reactionCost,
  reactionTimeMs:item.reactionTimeMs===undefined?null:item.reactionTimeMs,reactionTimingBonus:item.reactionTimingBonus||0,reactionTimingAssist:item.reactionTimingAssist===true,
  energyBefore:item.energyBefore===undefined?null:item.energyBefore,energyCost:item.energyCost===undefined?null:item.energyCost,energyRecovery:item.energyRecovery===undefined?null:item.energyRecovery,energyAfter:item.energyAfter===undefined?null:item.energyAfter,
  healthBefore:item.healthBefore===undefined?null:item.healthBefore,healthDamage:item.healthDamage||0,healthAfter:item.healthAfter===undefined?null:item.healthAfter,
  injuryBefore:item.injuryBefore===undefined?null:item.injuryBefore,injuryGain:item.injuryGain||0,injuryAfter:item.injuryAfter===undefined?null:item.injuryAfter})):[];
 const roundHealthDamage=roundSummary.reduce((sum,item)=>sum+Math.max(0,Number(item.healthDamage)||0),0);
 const roundInjuryGain=roundSummary.reduce((sum,item)=>sum+Math.max(0,Number(item.injuryGain)||0),0);
 c.bouts.push({age:state.age,mode,opponent:opponent.name,opponentStyle:opponent.style,communityFighterId:session&&session.communityFighterId?session.communityFighterId:null,move:move.title,moves:roundSummary.map(item=>item.move),rounds:roundSummary,scoreline:session?{player:Math.round(session.playerScore),opponent:Math.round(session.opponentScore)}:null,won,probability,earnings,injury:c.injury,rank:c.rank,healthDamage:roundHealthDamage,roundInjuryGain,healthAfterBout:clamp(state.stats.health)});
 if(c.bouts.length>30)c.bouts.shift();
 const record=state.specialCareer.record||(state.specialCareer.record={attempts:0,wins:0,losses:0,projects:0,totalEarnings:0,bestLevel:1});
 record.attempts=(record.attempts||0)+1;record.wins=(record.wins||0)+(won?1:0);record.losses=(record.losses||0)+(won?0:1);record.totalEarnings=(record.totalEarnings||0)+earnings;record.bestLevel=Math.max(record.bestLevel||1,state.specialCareer.level||1);
 if(won){state.specialCareer.level=clamp((state.specialCareer.level||1)+1,1,100);stat('happiness',2);}else stat('happiness',-1);
 if(session)detail+=' نتيجة الجولات: '+Math.round(session.playerScore)+' مقابل '+Math.round(session.opponentScore)+'.';
 log(won?'🏆':'🥊',title,detail+(won?' المكافأة '+cash(earnings)+'.':' الإصابة الحالية '+c.injury+'%.') ,tone);
 save();render();info(won?'🏆':'🩹',title,detail+' احتمال الفوز قبل النزال كان '+probability+'%.',[
  choice('📊','تفاصيل النزال','حركتك الأخيرة: '+move.title+' · الجولات المكتملة '+(session?session.roundHistory.length:1)+' · أسلوب المنافس: '+opponent.style+' · مدرب: '+(c.coach?c.coach.name:'لا يوجد')+'.',()=>{closeModal();combatCareerMenu();}),
  choice('🥊','إدارة مسيرة القتال','',()=>{closeModal();combatCareerMenu();})
 ]);
}
function recoverCombatInjury(){
 const c=ensureCombatCareer();
 const opts=[
  choice('🩹','علاج وتأهيل','تكلفة 2,500 '+state.place.unit+' لتقليل الإصابة بنحو 45 نقطة.',()=>treatCombatInjury(),'2,500 '+state.place.unit),
  choice('🛌','راحة وتدريب خفيف',(c.restUsedYear===state.yearCount?'استخدمت راحة السنة دي بالفعل. ':'راحة واحدة في كل سنة من اللعبة. ')+'قلّل الإصابة 20 نقطة واستعد 25 طاقة من غير تكلفة.',()=>{if(c.restUsedYear===state.yearCount){closeModal();info('🛌','الراحة السنوية مستخدمة','تقدر تستخدم الراحة المجانية مرة واحدة في كل سنة من عمر الشخصية.');return;}closeModal();c.restUsedYear=state.yearCount;c.injury=clamp(c.injury-20);if(c.injury===0)c.injuryYears=0;c.energy=clamp(c.energy+25);log('🛌','راحة المقاتل','أخذت راحة وتراجعت الإصابة إلى '+c.injury+'%.','good');save();render();combatCareerMenu();}),
  choice('↩️','رجوع','',combatCareerMenu)
 ];
 modal('🩹','التعافي من الإصابات','الإصابة تقلل نتيجتك في النزالات، والراحة مهمة خصوصًا قبل الدوري.',opts);
}
function treatCombatInjury(){
 const c=ensureCombatCareer(),cost=2500;
 if(state.bank<cost){closeModal();info('💳','الرصيد مش كفاية','تحتاج '+cash(cost)+' للعلاج والتأهيل.');return;}
 closeModal();state.bank-=cost;c.injury=clamp(c.injury-45);if(c.injury===0)c.injuryYears=0;
 state.stats.health=clamp(state.stats.health+5);
 log('🩹','جلسة تأهيل','قللت الإصابة إلى '+c.injury+'% وتحسنت صحتك مع العلاج.','good');save();render();combatCareerMenu();
}
function combatBoutHistory(){
 const c=ensureCombatCareer(),opts=c.bouts.slice().reverse().map(b=>{
  const rounds=Array.isArray(b.rounds)?b.rounds:[],hasImpact=rounds.some(item=>item&&item.healthDamage!==undefined);
  const damage=rounds.reduce((sum,item)=>sum+Math.max(0,Number(item&&item.healthDamage)||0),0);
  const roundInjury=rounds.reduce((sum,item)=>sum+Math.max(0,Number(item&&item.injuryGain)||0),0);
  const impactLabel=hasImpact?' · ضرر الصحة أثناء الجولات '+damage+'% · إصابات الجولات '+roundInjury+'%':' · تفاصيل الضرر غير متاحة لهذا النزال القديم';
  return choice(b.won?'🏆':'🥊',(b.mode==='league'?'الدوري':'الشوارع')+' · '+b.opponent+' · '+(b.won?'فوز':'خسارة'),'العمر '+b.age+' · الحركة '+b.move+' · الجولات '+(rounds.length||1)+' · الاحتمال المقدر '+b.probability+'% · إصابة بعد النزال '+b.injury+'%'+impactLabel+(b.earnings?' · المكافأة '+cash(b.earnings):''),()=>{closeModal();info(b.won?'🏆':'🥊',b.opponent,(b.won?'فزت':'خسرت')+' باستخدام '+b.move+'. الاحتمال المقدر قبل النزال '+b.probability+'%. '+(hasImpact?'ضرر الصحة أثناء الجولات '+damage+'% وإصابات الجولات '+roundInjury+'%.':'النزال من سجل قديم لا يحتوي على تفاصيل الضرر لكل جولة.'));});
 });
 if(!opts.length)opts.push(choice('🥊','لسه مفيش نزالات','ابدأ بنزال شوارع لبناء الخبرة وفتح الدوري.',closeModal));
 opts.push(choice('↩️','رجوع لمسيرة القتال','',combatCareerMenu));
 modal('📜','سجل النزالات','آخر 30 نزالًا محفوظة في الحياة الحالية.',opts);
}


const filmGenreCatalog=[
 {id:'drama',title:'دراما إنسانية',emoji:'🎭',critic:10,audience:0,desc:'قصة شخصيات وقرارات صعبة.',titles:['آخر رسالة','نوافذ مغلقة','قبل أن ننسى']},
 {id:'action',title:'أكشن ومغامرة',emoji:'💥',critic:-2,audience:10,desc:'إيقاع سريع ومغامرة كبيرة.',titles:['طريق الصفر','الساعة الأخيرة','خارج الحدود']},
 {id:'comedy',title:'كوميديا',emoji:'😂',critic:1,audience:12,desc:'مواقف خفيفة وفرصة للوصول لجمهور أوسع.',titles:['يوم مش عادي','جارنا الجديد','ممنوع الضحك']},
 {id:'scifi',title:'خيال علمي',emoji:'🚀',critic:7,audience:4,desc:'عالم مختلف وفكرة مستقبلية.',titles:['مدينة الغد','إشارة من بعيد','بعد المدار']},
 {id:'mystery',title:'غموض وتحقيق',emoji:'🕵️',critic:8,audience:5,desc:'لغز بتفاصيل مترابطة ونهاية مفاجئة.',titles:['الممر رقم سبعة','ظل على الزجاج','الشاهد الأخير']},
 {id:'family',title:'عائلي ومغامرات',emoji:'🏡',critic:2,audience:9,desc:'قصة تناسب المشاهدة العائلية.',titles:['رحلة إلى البيت','أصدقاء الصيف','سر الحديقة']},
 {id:'documentary',title:'وثائقي',emoji:'📽️',critic:12,audience:-2,desc:'عمل واقعي يعتمد على البحث والتوثيق.',titles:['حكاية مكان','ناس من الشارع','أثر قديم']},
 {id:'horror',title:'رعب وغموض',emoji:'👻',critic:4,audience:9,desc:'أجواء متوترة وأسرار مخيفة.',titles:['البيت الأخير','الطابق السفلي','بعد منتصف الليل'],packOnly:true},
 {id:'romance',title:'رومانسية',emoji:'💌',critic:5,audience:11,desc:'قصة علاقات وتغيّرات شخصية.',titles:['موعد في المطر','رسالة لم تصل','صيف آخر'],packOnly:true},
 {id:'thriller',title:'إثارة وتشويق',emoji:'🧩',critic:8,audience:6,desc:'إيقاع سريع وقرارات حاسمة.',titles:['خمس دقائق','الخط الأحمر','نقطة عمياء'],packOnly:true},
 {id:'animation',title:'رسوم متحركة',emoji:'🎨',critic:6,audience:13,desc:'حكاية مرئية تناسب جمهورًا واسعًا.',titles:['مدينة الورق','رحلة لولو','الكوكب الأزرق'],packOnly:true}
];
const filmBudgetCatalog=[
 {id:'indie',title:'إنتاج مستقل',cost:5000,reach:0,desc:'طاقم صغير ومخاطرة مالية أقل.'},
 {id:'standard',title:'إنتاج متوسط',cost:15000,reach:1,desc:'فريق أكبر وفرصة توزيع أوسع.'},
 {id:'blockbuster',title:'إنتاج ضخم',cost:35000,reach:2,desc:'إنفاق أكبر وتوقعات أعلى ومخاطرة مالية أعلى.'}
];
const filmCreativeCatalog=[
 {id:'commercial',title:'أسلوب جماهيري',successBonus:5,audienceBonus:12,criticBonus:-4,desc:'تركيز على إيقاع سهل الوصول لجمهور واسع.'},
 {id:'artistic',title:'أسلوب فني',successBonus:0,audienceBonus:1,criticBonus:13,desc:'تركيز على جودة الفكرة والتفاصيل والأداء.'},
 {id:'experimental',title:'أسلوب تجريبي',successBonus:-3,audienceBonus:5,criticBonus:8,desc:'فكرة غير تقليدية؛ قد تثير إعجاب النقاد أو تنقسم حولها الآراء.'}
];
const filmCastCatalog=[
 {id:'newcomers',title:'وجوه جديدة',cost:0,successBonus:0,criticBonus:0,fameBonus:0,desc:'ميزانية تمثيل أقل وفرصة لاكتشاف مواهب.'},
 {id:'experienced',title:'طاقم محترف',cost:6500,successBonus:8,criticBonus:5,fameBonus:2,desc:'خبرة تساعد على تماسك الإنتاج.'},
 {id:'stars',title:'نجوم معروفون',cost:17000,successBonus:12,criticBonus:3,fameBonus:6,desc:'تكلفة أعلى وقوة تسويقية أكبر.'}
];
const filmMarketingCatalog=[
 {id:'organic',title:'انتشار طبيعي',cost:0,successBonus:0,audienceBonus:0,desc:'تعتمد على جودة العمل والتوصيات.'},
 {id:'social',title:'حملة منصات',cost:2500,successBonus:2,audienceBonus:8,desc:'حملة رقمية بميزانية متوسطة.'},
 {id:'wide',title:'إطلاق واسع',cost:8500,successBonus:5,audienceBonus:18,desc:'توزيع وتسويق أوسع وتكلفة أكبر.'}
];
function normalizeFilmActor(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return null;
 const id=typeof raw.id==='string'?raw.id.trim().slice(0,96):'',name=typeof raw.name==='string'?raw.name.trim().slice(0,64):'';
 if(!/^film-actor-[a-z0-9-]{6,90}$/.test(id)||!name)return null;
 const bounded=(value,fallback,min,max)=>{const number=Number(value);return clamp(Number.isFinite(number)?number:fallback,min,max);};
 const genreId=filmGenreCatalog.some(genre=>genre.id===raw.genreId)?raw.genreId:'general';
 return {id,name,genreId,acting:bounded(raw.acting,50,20,100),professionalism:bounded(raw.professionalism,60,0,100),ego:bounded(raw.ego,40,0,100),genreFit:bounded(raw.genreFit,55,0,100),fee:bounded(raw.fee,3500,0,1000000),projects:bounded(raw.projects,0,0,1000)};
}
function createFilmActorCandidate(genreId){
 const gender=chance(.5)?'male':'female',acting=45+Math.floor(Math.random()*51),professionalism=40+Math.floor(Math.random()*56),ego=15+Math.floor(Math.random()*81),genreFit=40+Math.floor(Math.random()*56);
 return normalizeFilmActor({id:'film-actor-'+Date.now()+'-'+Math.random().toString(36).slice(2,8),name:pick(names[gender])+' '+pick(names.family),genreId,acting,professionalism,ego,genreFit,fee:1800+acting*72+genreFit*18,projects:0});
}
function filmActorImpact(actor,genreId,actorDrama=false){
 if(!actor)return {successBonus:-8,criticBonus:-5,dramaRisk:0,dramaPenalty:0};
 const acting=clamp(actor.acting),professionalism=clamp(actor.professionalism),ego=clamp(actor.ego),fit=actor.genreId===genreId?clamp(actor.genreFit):Math.max(20,clamp(actor.genreFit)-18);
 const dramaRisk=clamp(Math.round(ego*.45+(100-professionalism)*.55));
 const dramaPenalty=actorDrama?Math.max(2,Math.round(dramaRisk/14)):0;
 return {
  successBonus:clamp(Math.round((acting-60)*.12+(fit-60)*.10+(professionalism-60)*.06)-dramaPenalty,-12,12),
  criticBonus:clamp(Math.round((acting-60)*.10+(fit-60)*.08)-(actorDrama?4:0),-8,10),
  dramaRisk,dramaPenalty
 };
}
function createFilmStudio(){
 return {filmography:[],projects:0,totalBudget:0,totalBoxOffice:0,awards:0,bestCritic:0,genreFocus:null,actorRoster:[],pendingAuditions:[],pendingAuditionGenre:null,pendingProject:null,festivalEntries:[]};
}
function ensureFilmStudio(){
 if(!state)return null;
 if(!state.filmStudio||typeof state.filmStudio!=='object'||Array.isArray(state.filmStudio))state.filmStudio=createFilmStudio();
 const studio=state.filmStudio,defaults={filmography:[],projects:0,totalBudget:0,totalBoxOffice:0,awards:0,bestCritic:0,genreFocus:null,actorRoster:[],pendingAuditions:[],pendingAuditionGenre:null,pendingProject:null,festivalEntries:[]};
 Object.keys(defaults).forEach(key=>{if(studio[key]===undefined||studio[key]===null)studio[key]=defaults[key];});
 if(!Array.isArray(studio.filmography))studio.filmography=[];
 if(!Array.isArray(studio.festivalEntries))studio.festivalEntries=[];
 const seenFestivalFilms=new Set();
 studio.festivalEntries=studio.festivalEntries.map(normalizeFilmFestivalEntry).filter(entry=>{if(!entry||seenFestivalFilms.has(entry.filmId))return false;seenFestivalFilms.add(entry.filmId);return true;}).slice(-40);
 studio.projects=Math.max(0,Number(studio.projects)||0);studio.awards=Math.max(0,Number(studio.awards)||0);
 if(studio.genreFocus&&!filmGenreCatalog.some(genre=>genre.id===studio.genreFocus))studio.genreFocus=null;
 const seenActors=new Set();
 studio.actorRoster=(Array.isArray(studio.actorRoster)?studio.actorRoster:[]).map(normalizeFilmActor).filter(actor=>{if(!actor||seenActors.has(actor.id))return false;seenActors.add(actor.id);return true;}).slice(0,12);
 const seenAuditions=new Set();
 studio.pendingAuditions=(Array.isArray(studio.pendingAuditions)?studio.pendingAuditions:[]).map(normalizeFilmActor).filter(actor=>{if(!actor||seenAuditions.has(actor.id))return false;seenAuditions.add(actor.id);return true;}).slice(0,3);
 if(!filmGenreCatalog.some(genre=>genre.id===studio.pendingAuditionGenre))studio.pendingAuditionGenre=null;
 const project=studio.pendingProject;
 const projectGenre=project&&filmGenreCatalog.find(genre=>genre.id===project.genreId);
 const projectBudget=project&&filmBudgetCatalog.find(budget=>budget.id===project.budgetId);
 const projectStyle=project&&filmCreativeCatalog.find(style=>style.id===project.creativeId);
 studio.pendingProject=projectGenre&&projectBudget&&projectStyle?{genreId:projectGenre.id,budgetId:projectBudget.id,creativeId:projectStyle.id}:null;
 return studio;
}


function normalizeFilmFestivalEntry(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return null;
 const rawId=raw.filmId,filmId=(typeof rawId==='string'||typeof rawId==='number')?String(rawId).trim().slice(0,96):'';
 if(!filmId)return null;
 const bounded=(value,fallback,min,max)=>{const number=Number(value);return clamp(Number.isFinite(number)?number:fallback,min,max);};
 const outcome=['award','selection','not-selected'].includes(raw.outcome)?raw.outcome:'not-selected';
 return {
  filmId,
  filmTitle:typeof raw.filmTitle==='string'&&raw.filmTitle.trim()?raw.filmTitle.trim().slice(0,80):'فيلم بلا عنوان',
  genre:typeof raw.genre==='string'&&raw.genre.trim()?raw.genre.trim().slice(0,48):'عام',
  submittedAge:bounded(raw.submittedAge,0,0,150),
  score:bounded(raw.score,0,0,100),
  outcome,
  awardTitle:outcome==='award'?(typeof raw.awardTitle==='string'&&raw.awardTitle.trim()?raw.awardTitle.trim().slice(0,64):'جائزة لجنة التحكيم'):'',
  prize:bounded(raw.prize,0,0,100000),
  fameGain:bounded(raw.fameGain,0,0,20),
  reputationGain:bounded(raw.reputationGain,0,0,20)
 };
}
function filmFestivalResult(film){
 const critic=clamp(film&&film.criticScore,0,100),cost=clamp(film&&film.totalCost,0,100000000);
 const netValue=Number(film&&film.net),net=Number.isFinite(netValue)?netValue:0;
 const success=!!(film&&film.success),actorDrama=!!(film&&film.actorDrama);
 const score=clamp(Math.round(critic*.72+(success?10:-8)+(net>=0?6:-4)+(actorDrama?-6:3)),0,100);
 const outcome=score>=86?'award':score>=72?'selection':'not-selected';
 const prize=outcome==='award'?clamp(Math.round(cost*.12),2500,100000):0;
 return {score,outcome,prize,awardTitle:outcome==='award'?'جائزة لجنة التحكيم':'',fameGain:outcome==='award'?4:outcome==='selection'?2:0,reputationGain:outcome==='award'?5:outcome==='selection'?2:0};
}
function submitFilmToFestival(filmId){
 if(!state||!state.specialCareer||state.specialCareer.id!=='director'){closeModal();info('🎬','مهرجان السينما','ابدأ مسار إخراج الأفلام من المهن الخاصة أولًا.');return false;}
 const studio=ensureFilmStudio(),id=String(filmId??'');
 const film=studio.filmography.find(item=>item&&item.id!==undefined&&item.id!==null&&String(item.id)===id);
 if(!film){closeModal();info('🎞️','الفيلم غير موجود','قد يكون الفيلم خرج من الأرشيف أو لم يعد متاحًا للتقديم.');return false;}
 if(studio.festivalEntries.some(entry=>entry.filmId===id)){closeModal();info('🏆','الفيلم شارك بالفعل','كل فيلم يقدر يدخل مهرجان حكايات السينما مرة واحدة فقط.');return false;}
 const result=filmFestivalResult(film);
 const entry=normalizeFilmFestivalEntry({filmId:id,filmTitle:film.title,genre:film.genre,submittedAge:state.age,...result});
 if(!entry)return false;
 studio.festivalEntries.push(entry);
 if(studio.festivalEntries.length>40)studio.festivalEntries.shift();
 if(entry.outcome==='award')studio.awards=Math.max(0,Number(studio.awards)||0)+1;
 state.bank=(Number(state.bank)||0)+entry.prize;
 state.fame=clamp((state.fame||0)+entry.fameGain);
 state.reputation=clamp((state.reputation||50)+entry.reputationGain);
 if(entry.outcome==='award')achievement('فاز بجائزة مهرجان سينمائي');
 const status=entry.outcome==='award'?'نال جائزة لجنة التحكيم':entry.outcome==='selection'?'دخل الاختيار الرسمي':'لم يصل إلى القائمة النهائية';
 log(entry.outcome==='award'?'🏆':entry.outcome==='selection'?'🎬':'🎞️','نتيجة مهرجان حكايات السينما','«'+entry.filmTitle+'» · '+status+' · تقييم المهرجان '+entry.score+'%'+(entry.prize?' · مكافأة '+cash(entry.prize):'')+'.',entry.outcome==='award'?'special':entry.outcome==='selection'?'good':'bad');
 save();render();closeModal();
 info(entry.outcome==='award'?'🏆':entry.outcome==='selection'?'🎬':'🎞️','نتيجة مشاركة الفيلم','«'+entry.filmTitle+'» · '+status+' · تقييم اللجنة '+entry.score+'% · '+(entry.prize?'مكافأة '+cash(entry.prize):'بدون مكافأة مالية')+'.',[choice('🏆','العودة للمهرجان','',filmFestivalMenu),choice('🎥','الاستوديو','',filmStudioMenu)]);
 return true;
}
function filmFestivalMenu(){
 if(!validState()||!state.specialCareer||state.specialCareer.id!=='director'){info('🎬','مهرجان السينما','ابدأ مسار إخراج الأفلام من المهن الخاصة أولًا.');return;}
 const studio=ensureFilmStudio(),submitted=new Set(studio.festivalEntries.map(entry=>entry.filmId));
 const eligible=studio.filmography.filter(film=>film&&film.id!==undefined&&film.id!==null&&!submitted.has(String(film.id)));
 const awards=studio.festivalEntries.filter(entry=>entry.outcome==='award').length;
 const selections=studio.festivalEntries.filter(entry=>entry.outcome==='selection').length;
 const opts=[];
 if(eligible.length){
  opts.push({section:true,title:'أفلام جاهزة للتقديم'});
  eligible.slice().reverse().slice(0,10).forEach(film=>opts.push(choice('🎬',film.title||'فيلم بلا عنوان','النوع '+(film.genre||'عام')+' · النقاد '+clamp(film.criticScore)+'% · الصافي '+cash(film.net||0),()=>submitFilmToFestival(film.id))));
 }else opts.push(choice('🎞️','لا توجد أفلام جديدة للتقديم','كل الأفلام الموجودة شاركت بالفعل، أو لا يحتوي الأرشيف على معرّفات صالحة.',closeModal));
 if(studio.festivalEntries.length){
  opts.push({section:true,title:'نتائج المشاركات السابقة'});
  studio.festivalEntries.slice().reverse().slice(0,10).forEach(entry=>{
   const label=entry.outcome==='award'?'🏆':entry.outcome==='selection'?'🎬':'🎞️';
   const status=entry.outcome==='award'?entry.awardTitle:entry.outcome==='selection'?'اختيار رسمي':'خارج القائمة النهائية';
   opts.push(choice(label,entry.filmTitle+' · '+status,'تقييم اللجنة '+entry.score+'% · '+(entry.prize?'مكافأة '+cash(entry.prize):'بدون مكافأة'),()=>{closeModal();info(label,entry.filmTitle,status+' · تقييم '+entry.score+'% · سنة التقديم '+entry.submittedAge+'.');}));
  });
 }
 opts.push(choice('↩️','رجوع إلى الاستوديو','',filmStudioMenu));
 modal('🏆','مهرجان حكايات السينما','مشاركات '+studio.festivalEntries.length+' · جوائز المهرجان '+awards+' · اختيارات رسمية '+selections+'. كل فيلم يتقدم مرة واحدة فقط.',opts);
}

function filmActorRosterMenu(){
 const studio=ensureFilmStudio(),opts=studio.actorRoster.map(actor=>choice('🎭',actor.name,'الموهبة '+actor.acting+'% · الانضباط '+actor.professionalism+'% · الغرور '+actor.ego+'% · التوافق النوعي '+actor.genreFit+'% · شارك في '+actor.projects+' أفلام · أجره '+cash(actor.fee)+'.',()=>{closeModal();info('🎭',actor.name,'ممثل متعاقد مع الاستوديو. الموهبة '+actor.acting+'%، الانضباط '+actor.professionalism+'%، الغرور '+actor.ego+'%، وشارك في '+actor.projects+' أفلام.');}));
 if(!opts.length)opts.push(choice('🌱','لا يوجد ممثلون متعاقدون','ابدأ مشروعًا جديدًا ثم أجرِ اختبارات أداء لاكتشاف أول موهبة.',closeModal));
 opts.push(choice('↩️','العودة إلى الاستوديو','',filmStudioMenu));
 modal('🎭','الممثلون المتعاقدون','قائمة المواهب التي اكتشفها الاستوديو وسجل مشاركاتها.',opts);
}
function filmActorMenu(genreId,budgetId,creativeId){
 const studio=ensureFilmStudio();
 if(!studio.pendingProject||studio.pendingProject.genreId!==genreId||studio.pendingProject.budgetId!==budgetId||studio.pendingProject.creativeId!==creativeId){filmStudioMenu();return;}
 const opts=studio.actorRoster.map(actor=>choice('🎭',actor.name,'الموهبة '+actor.acting+'% · الانضباط '+actor.professionalism+'% · التوافق مع النوع '+(actor.genreId===genreId?actor.genreFit:Math.max(20,actor.genreFit-18))+'% · أجر الفيلم '+cash(actor.fee)+'.',()=>filmCastMenu(genreId,budgetId,creativeId,actor.id)));
 if(studio.pendingAuditions.length&&studio.pendingAuditionGenre===genreId)opts.unshift(choice('📋','استكمال اختبارات الأداء','لديك '+studio.pendingAuditions.length+' مرشحين محفوظين للمشروع الحالي.',()=>filmAuditionResultsMenu(genreId,budgetId,creativeId,false)));
 if(studio.actorRoster.length<12)opts.push(choice('🎟️','اختبارات أداء جديدة','قابل 3 مرشحين بمهارات وانضباط وتوافق وتكاليف مختلفة.',()=>filmAuditionResultsMenu(genreId,budgetId,creativeId,true)));
 else opts.push(choice('🔒','اكتملت قائمة الممثلين','وصل الاستوديو إلى الحد الآمن البالغ 12 ممثلًا. اختر ممثلًا متعاقدًا أو راجع القائمة.',filmActorRosterMenu));
 opts.push(choice('↩️','العودة إلى الاستوديو','',filmStudioMenu));
 modal('🎭','اختيار الممثل الرئيسي','اختيار الممثل يؤثر على تكلفة الفيلم وفرص نجاحه واحتمال الخلافات أثناء التصوير.',opts);
}
function filmAuditionResultsMenu(genreId,budgetId,creativeId,refresh=false){
 const studio=ensureFilmStudio();
 if(!studio.pendingProject||studio.pendingProject.genreId!==genreId||studio.pendingProject.budgetId!==budgetId||studio.pendingProject.creativeId!==creativeId){filmStudioMenu();return;}
 if(studio.actorRoster.length>=12){info('🎭','قائمة الممثلين مكتملة','لا يمكن إضافة مرشحين جدد قبل مراجعة القائمة الحالية.');filmActorMenu(genreId,budgetId,creativeId);return;}
 if(refresh||studio.pendingAuditionGenre!==genreId||studio.pendingAuditions.length!==3){
  studio.pendingAuditions=Array.from({length:3},()=>createFilmActorCandidate(genreId));
  studio.pendingAuditionGenre=genreId;
  save();
 }
 const opts=studio.pendingAuditions.map(actor=>choice('🎭',actor.name,'الموهبة '+actor.acting+'% · الانضباط '+actor.professionalism+'% · الغرور '+actor.ego+'% · التوافق النوعي '+actor.genreFit+'% · أجر الفيلم '+cash(actor.fee)+'.',()=>selectFilmActor(genreId,budgetId,creativeId,actor.id),cash(actor.fee)));
 opts.push(choice('🔄','إعادة الاختبارات','غيّر المرشحين الثلاثة قبل توقيع اتفاق الفيلم.',()=>filmAuditionResultsMenu(genreId,budgetId,creativeId,true)));
 opts.push(choice('↩️','العودة إلى الممثلين','',()=>filmActorMenu(genreId,budgetId,creativeId)));
 modal('🎟️','نتائج اختبارات الأداء','اختار ممثلًا رئيسيًا. الموهبة والتوافق يرفعان الجودة، بينما الغرور وضعف الانضباط يزيدان خطر الخلافات.',opts);
}
function selectFilmActor(genreId,budgetId,creativeId,actorId){
 const studio=ensureFilmStudio(),actor=studio.pendingAuditions.find(item=>item.id===actorId);
 if(!actor){info('🎭','المرشح لم يعد متاحًا','أعد اختبارات الأداء للحصول على قائمة محدثة.');filmActorMenu(genreId,budgetId,creativeId);return;}
 if(studio.actorRoster.length>=12){info('🎭','قائمة الممثلين مكتملة','راجع الممثلين المتعاقدين قبل إضافة موهبة جديدة.');filmActorMenu(genreId,budgetId,creativeId);return;}
 if(!studio.actorRoster.some(item=>item.id===actor.id))studio.actorRoster.push(actor);
 studio.pendingAuditions=[];studio.pendingAuditionGenre=null;
 save();
 filmCastMenu(genreId,budgetId,creativeId,actor.id);
}
function filmStudioMenu(){
 if(!validState()||!state.specialCareer||state.specialCareer.id!=='director'){info('🎬','استوديو الأفلام','ابدأ مسار إخراج الأفلام من المهن الخاصة أولًا.');return;}
 const studio=ensureFilmStudio(),focus=filmGenreCatalog.find(g=>g.id===studio.genreFocus),r=state.specialCareer.record||{};
 const summary='الأفلام '+studio.projects+' · الجوائز '+studio.awards+' · مشاركات المهرجان '+studio.festivalEntries.length+' · إجمالي شباك التذاكر '+cash(studio.totalBoxOffice)+' · أفضل تقييم '+studio.bestCritic+'% · الممثلون '+studio.actorRoster.length+(focus?' · تخصص الاستوديو '+focus.title:' · من غير تخصص ثابت');
 const opts=[
  choice('🎬','إنتاج فيلم جديد','اختار النوع والميزانية واتجاه القصة ثم اختبر الممثلين والطاقم والتسويق.',filmGenreMenu),
  choice('🎭','إدارة الممثلين','راجع المواهب المتعاقدة ومستويات الموهبة والانضباط والمشاركات.',filmActorRosterMenu),
  choice('🏆','مهرجان حكايات السينما','قدّم أفلامك مرة واحدة للمنافسة على جوائز وتقدير نقدي.',filmFestivalMenu),
  choice('🎭','تحديد تخصص الاستوديو','اختار نوعًا يمنحك خبرة إضافية عندما تنتج فيه.',filmFocusMenu),
  choice('🏆','سجل الأفلام','راجع الميزانيات والإيرادات وتقييم النقاد والجوائز والممثلين والمهرجان.',filmographyMenu),
  choice('📊','تقرير الاستوديو','المستوى الإخراجي '+fmt(state.specialCareer.level||1)+' · محاولات '+fmt(r.attempts||0)+' · نجاحات '+fmt(r.wins||0)+' · إخفاقات '+fmt(r.losses||0)+'.',()=>{closeModal();info('📊','تقرير الاستوديو',summary+' · دخل المسار المسجل '+cash(r.totalEarnings||0)+'.');}),
  choice('⭐','تدريب الإخراج','جلسة تدريب للمسار المتخصص.',trainSpecialCareer),
  choice('↩️','المهن الخاصة','',specialCareers)
 ];
 if(studio.pendingProject){
  const pendingGenre=filmGenreCatalog.find(genre=>genre.id===studio.pendingProject.genreId);
  opts.unshift(choice('🗑️','إلغاء المشروع الجاري','إلغاء التجهيز دون خصم ميزانية أو تغيير سجل الأفلام.',()=>{studio.pendingProject=null;studio.pendingAuditions=[];studio.pendingAuditionGenre=null;save();filmStudioMenu();}));
  opts.unshift(choice('▶️','استكمال المشروع الجاري','مشروع '+(pendingGenre?pendingGenre.title:'سينمائي')+' محفوظ ويمكنك متابعة اختيار الممثل.',()=>filmActorMenu(studio.pendingProject.genreId,studio.pendingProject.budgetId,studio.pendingProject.creativeId)));
 }
 modal('🎥','استوديو الأفلام',summary,opts);
}
function filmFocusMenu(){
 const studio=ensureFilmStudio(),genres=filmGenreCatalog.filter(g=>!g.packOnly||perkOwned('movieDirectorPack')),opts=genres.map(g=>choice(g.emoji,g.title,g.desc+' اختيار النوع ده كتخصص يزيد كفاءة مشاريع النوع نفسه.',()=>{closeModal();studio.genreFocus=g.id;log('🎬','تخصص الاستوديو','اخترت '+g.title+' كتخصص لاستوديو الأفلام.','good');save();render();filmStudioMenu();},'',g.id===studio.genreFocus?100:undefined));
 opts.unshift(choice('🎞️','استوديو متنوع','إلغاء التخصص للحصول على نفس الفرص في كل الأنواع.',()=>{closeModal();studio.genreFocus=null;save();render();filmStudioMenu();}));
 modal('🎭','تخصص الاستوديو','التخصص يمنح مكافأة عند إنتاج النوع المختار، لكنه لا يمنعك من تجربة الأنواع الأخرى.',opts);
}

function filmGenreMenu(){
 const studio=ensureFilmStudio(),genres=filmGenreCatalog.filter(g=>!g.packOnly||perkOwned('movieDirectorPack')),opts=genres.map(g=>choice(g.emoji,g.title,g.desc+(studio.genreFocus===g.id?' · النوع المفضل للاستوديو.':''),()=>filmBudgetMenu(g.id)));
 modal('🎬','اختار نوع الفيلم','ابدأ بإحدى الأفكار الأصلية. النوع يغير توقعات الجمهور والنقاد.',opts);
}

function filmBudgetMenu(genreId){
 const genre=filmGenreCatalog.find(g=>g.id===genreId);if(!genre){closeModal();filmStudioMenu();return;}
 const opts=filmBudgetCatalog.map(b=>choice(b.id==='blockbuster'?'💎':b.id==='standard'?'🎞️':'🎬',b.title,b.desc+' تكلفة الإنتاج '+cash(b.cost)+'.',()=>filmCreativeMenu(genreId,b.id),cash(b.cost),state.bank>=b.cost?100:35));
 modal('💰','ميزانية الفيلم','الفيلم: '+genre.title+'. اختر مستوى المخاطرة قبل إضافة الطاقم والتسويق. الميزانية لا تُخصم إلا عند إصدار الفيلم.',opts);
}
function filmCreativeMenu(genreId,budgetId){
 const genre=filmGenreCatalog.find(g=>g.id===genreId),budget=filmBudgetCatalog.find(b=>b.id===budgetId);if(!genre||!budget){closeModal();filmStudioMenu();return;}
 const opts=filmCreativeCatalog.map(style=>choice('✍️',style.title,style.desc,()=>{const studio=ensureFilmStudio();studio.pendingProject={genreId,budgetId,creativeId:style.id};studio.pendingAuditions=[];studio.pendingAuditionGenre=null;save();filmActorMenu(genreId,budgetId,style.id);},'',style.criticBonus+20));
 modal('📝','اتجاه القصة','اختار شكل الحكاية؛ قرارك يوازن بين فرصة النجاح الجماهيري وتقييم النقاد.',opts);
}
function filmCastMenu(genreId,budgetId,creativeId,actorId){
 const budget=filmBudgetCatalog.find(b=>b.id===budgetId),style=filmCreativeCatalog.find(x=>x.id===creativeId),studio=ensureFilmStudio(),actor=studio.actorRoster.find(item=>item.id===actorId);
 if(!budget||!style||!actor){closeModal();filmActorMenu(genreId,budgetId,creativeId);return;}
 const castOptions=filmCastCatalog.map(cast=>'<option value="'+esc(cast.id)+'">'+esc(cast.title+' — '+cash(cast.cost))+'</option>').join('');
 const form='<div class="event-form"><label for="filmCastSelect">اختار فئة طاقم الإنتاج:</label><select id="filmCastSelect" data-surpriseable="true">'+castOptions+'</select><p class="field-note">الممثل الرئيسي: '+esc(actor.name)+'. فئة الطاقم الإضافية تؤثر على التكلفة وفرص النجاح.</p></div>';
 const continueToMarketing=()=>{
  const selected=filmCastCatalog.find(cast=>cast.id===$('filmCastSelect')?.value);
  if(!selected){info('🎭','اختار طاقم الإنتاج','حدد فئة طاقم من القائمة الأول.');return;}
  filmMarketingMenu(genreId,budgetId,creativeId,selected.id,actorId);
 };
 modal('🎭','اختيار طاقم الإنتاج','الممثل الرئيسي: '+actor.name+' · أجره '+cash(actor.fee)+'. اختار حجم فريق الإنتاج قبل التسويق.',[
  choice('➡️','متابعة إلى التسويق','اختيار الخطة التسويقية التالية.',continueToMarketing)
 ],true,form);
}

function filmMarketingMenu(genreId,budgetId,creativeId,castId,actorId){
 const studio=ensureFilmStudio(),actor=studio.actorRoster.find(item=>item.id===actorId);
 if(!actor){filmActorMenu(genreId,budgetId,creativeId);return;}
 const opts=filmMarketingCatalog.map(marketing=>choice('📣',marketing.title,marketing.desc+' تكلفة التسويق '+cash(marketing.cost)+'.',()=>releaseFilm(genreId,budgetId,creativeId,castId,marketing.id,actorId),cash(marketing.cost)));
 modal('📣','خطة إطلاق الفيلم','الممثل الرئيسي: '+actor.name+' · أجره '+cash(actor.fee)+'. اختار التسويق؛ ستُراجع الميزانية الكاملة قبل إصدار الفيلم.',opts);
}
function releaseFilm(genreId,budgetId,creativeId,castId,marketingId,actorId){
 const genre=filmGenreCatalog.find(g=>g.id===genreId),budget=filmBudgetCatalog.find(b=>b.id===budgetId),style=filmCreativeCatalog.find(x=>x.id===creativeId),cast=filmCastCatalog.find(x=>x.id===castId),marketing=filmMarketingCatalog.find(x=>x.id===marketingId),studio=ensureFilmStudio(),actor=studio.actorRoster.find(item=>item.id===actorId);
 if(!genre||!budget||!style||!cast||!marketing||!actor){closeModal();info('🎬','تفاصيل الفيلم غير مكتملة','ارجع لاختيار النوع والميزانية والممثل والطاقم من جديد.');return;}
 const totalCost=budget.cost+cast.cost+marketing.cost+actor.fee;
 if(state.bank<totalCost){closeModal();info('💳','الميزانية مش كفاية','إنتاج '+budget.title+' مع '+actor.name+' و'+cast.title+' وتسويق '+marketing.title+' يحتاج '+cash(totalCost)+'. اختار حزمة أقل تكلفة.',[choice('💰','اختيار ميزانية أخرى','',()=>filmBudgetMenu(genreId)),choice('↩️','الاستوديو','',filmStudioMenu)]);return;}
 closeModal();
 const focusBonus=studio.genreFocus===genre.id?5:0,level=Math.max(1,state.specialCareer.level||1);
 const actorBaseImpact=filmActorImpact(actor,genre.id,false),actorDrama=chance(actorBaseImpact.dramaRisk/100*.28),actorImpact=filmActorImpact(actor,genre.id,actorDrama);
 const probability=clamp(42+level*2.4+state.stats.smart*.14+(state.fame||0)*.07+(state.reputation||50)*.04+style.successBonus+cast.successBonus+marketing.successBonus+focusBonus+actorImpact.successBonus+Math.floor(Math.random()*15)-7,12,90);
 const success=chance(probability/100);
 const criticScore=clamp(38+state.stats.smart*.22+level*1.8+genre.critic+style.criticBonus+cast.criticBonus+actorImpact.criticBonus+(success?6:-7)+Math.floor(Math.random()*31)-15+(studio.genreFocus===genre.id?4:0),5,100);
 const audienceModifier=(genre.audience+style.audienceBonus+marketing.audienceBonus+budget.reach*3)/100;
 const revenueMultiplier=success?1.3+level*.075+Math.max(-.04,audienceModifier)*.55+Math.random()*.55:.22+Math.random()*.36;
 const boxOffice=Math.max(0,Math.round(totalCost*revenueMultiplier));
 const title=pick(genre.titles),award=success&&criticScore>=82;
 const film={id:Date.now()+Math.random(),title,genre:genre.title,budget:budget.cost,castCost:cast.cost,marketingCost:marketing.cost,actorFee:actor.fee,totalCost,creative:style.title,cast:cast.title,leadActor:actor.name,actorId:actor.id,actorDrama,actorImpact:{successBonus:actorImpact.successBonus,criticBonus:actorImpact.criticBonus,dramaRisk:actorImpact.dramaRisk,dramaPenalty:actorImpact.dramaPenalty},marketing:marketing.title,releaseAge:state.age,criticScore,probability,success,boxOffice,net:boxOffice-totalCost,award};
 actor.projects=Math.min(1000,actor.projects+1);
 if(actorDrama){actor.professionalism=clamp(actor.professionalism-3);actor.ego=clamp(actor.ego+2);}
 else{actor.professionalism=clamp(actor.professionalism+1);actor.ego=clamp(actor.ego-1);}
 studio.pendingProject=null;studio.pendingAuditions=[];studio.pendingAuditionGenre=null;
 state.bank-=totalCost;state.bank+=boxOffice;studio.projects++;studio.totalBudget+=totalCost;studio.totalBoxOffice+=boxOffice;studio.bestCritic=Math.max(studio.bestCritic,criticScore);if(award)studio.awards++;studio.filmography.push(film);if(studio.filmography.length>20)studio.filmography.shift();
 state.fame=clamp((state.fame||0)+(success?3+Math.floor(criticScore/25)+cast.fameBonus+(actor.acting>=85?2:0): -1));state.reputation=clamp((state.reputation||50)+(success?3:-2));
 if(actorDrama)log('🎭','توتر في موقع التصوير',actor.name+' دخل في خلاف أثناء التصوير. انخفض الانضباط وقلّ تأثيره على الفيلم.','bad');
 if(!state.specialCareer.record||typeof state.specialCareer.record!=='object')state.specialCareer.record={attempts:0,wins:0,losses:0,projects:0,totalEarnings:0,bestLevel:level};
 const record=state.specialCareer.record;record.attempts=(record.attempts||0)+1;record.wins=(record.wins||0)+(success?1:0);record.losses=(record.losses||0)+(success?0:1);record.projects=(record.projects||0)+1;record.totalEarnings=(record.totalEarnings||0)+boxOffice;
 if(success)state.specialCareer.level=clamp(level+1,1,100);
 if(!Array.isArray(state.specialCareer.history))state.specialCareer.history=[];state.specialCareer.history.push({age:state.age,title:'إنتاج فيلم: '+title,success,earnings:boxOffice,fameGain:success?3+Math.floor(criticScore/25):0});if(state.specialCareer.history.length>20)state.specialCareer.history.shift();
 if(award){achievement('حصلت على جائزة نقدية في إخراج الأفلام');log('🏆','جائزة نقدية','فيلم «'+title+'» حصل على تقييم '+criticScore+'% ونال جائزة داخل اللعبة.','special');}
 log(success?'🎥':'🎞️',success?'نجاح إصدار الفيلم':'إصدار فيلم لم يحقق التوقعات','«'+title+'» · '+genre.title+' · الممثل '+actor.name+' · تقييم النقاد '+criticScore+'% · إيرادات '+cash(boxOffice)+' · صافي النتيجة '+cash(boxOffice-totalCost)+'.',success?'good':'bad');
 save();render();info(success?'🎬':'🎞️',success?'صدر الفيلم بنجاح':'الفيلم لم يحقق التوقعات','«'+title+'» · الممثل الرئيسي '+actor.name+(actorDrama?' · حدث خلاف أثناء التصوير':' · اكتمل التصوير بانضباط')+' · احتمال النجاح قبل الإنتاج '+probability+'% · تقييم النقاد '+criticScore+'% · الميزانية الإجمالية '+cash(totalCost)+' · الإيرادات '+cash(boxOffice)+(award?' · فزت بجائزة نقدية!':'')+'.',[choice('📊','تفاصيل الإنتاج','الاتجاه '+style.title+' · الممثل '+actor.name+' · الطاقم '+cast.title+' · التسويق '+marketing.title+'.',()=>{closeModal();filmStudioMenu();}),choice('🎥','الاستوديو','',()=>{closeModal();filmStudioMenu();})]);
}
function filmographyMenu(){
 const studio=ensureFilmStudio(),opts=studio.filmography.slice().reverse().map(f=>{
  const festival=studio.festivalEntries.find(entry=>entry.filmId===String(f.id));
  const festivalStatus=festival?(festival.outcome==='award'?' · جائزة مهرجان':festival.outcome==='selection'?' · اختيار رسمي بالمهرجان':' · شارك بالمهرجان'):'';
  const icon=festival&&festival.outcome==='award'?'🏆':f.award?'🏆':f.success?'🎬':'🎞️';
  return choice(icon,f.title+' · '+f.genre,'الممثل '+(f.leadActor||'غير مسجل في السجل القديم')+' · النقاد '+f.criticScore+'% · الإيرادات '+cash(f.boxOffice)+' · تكلفة '+cash(f.totalCost)+' · صافي '+cash(f.net)+(f.actorDrama?' · خلاف أثناء التصوير':'')+(f.award?' · جائزة':'')+festivalStatus+'.',()=>{closeModal();info(icon,f.title,'النوع '+f.genre+' · الممثل الرئيسي '+(f.leadActor||'غير مسجل في السجل القديم')+' · الاتجاه '+f.creative+' · الطاقم '+f.cast+' · التسويق '+f.marketing+' · تقييم النقاد '+f.criticScore+'% · '+(f.success?'نجاح':'إخفاق')+' · صافي '+cash(f.net)+(f.actorDrama?' · شهد التصوير خلافًا مع الممثل':'')+(f.award?' · جائزة نقدية':'')+(festival?' · نتيجة المهرجان: '+(festival.outcome==='award'?festival.awardTitle:festival.outcome==='selection'?'اختيار رسمي':'خارج القائمة النهائية'):' · لم يشارك في المهرجان')+'.');});
 });
 if(!opts.length)opts.push(choice('🎬','لا توجد أفلام بعد','ابدأ إنتاج أول فيلم من قائمة الاستوديو.',closeModal));opts.push(choice('↩️','رجوع إلى الاستوديو','',filmStudioMenu));
 modal('🏆','أرشيف الأفلام','آخر 20 فيلمًا مع الممثل الرئيسي وتكلفة الإنتاج والإيرادات والتقييمات والجوائز وحالة المهرجان.',opts);
}

function specialCareerHistoryMenu(){
 const history=Array.isArray(state.specialCareerHistory)?state.specialCareerHistory:[];
 const opts=history.map(c=>{const r=c.record||{};return choice('📜',(c.title||c.id||'مسار سابق')+' · انتهى بعمر '+fmt(c.endedAge??state.age),'المستوى '+fmt(c.level||1)+' · محاولات '+fmt(r.attempts||0)+' · نجاحات '+fmt(r.wins||0)+' · إخفاقات '+fmt(r.losses||0)+' · دخل مسجّل '+cash(r.totalEarnings||0),()=>{closeModal();info('📜','سجل مسار سابق',(c.title||'مسار')+' · المستوى '+fmt(c.level||1)+' · '+fmt(r.wins||0)+' نجاح · '+fmt(r.losses||0)+' إخفاق · دخل '+cash(r.totalEarnings||0)+(c.ending?' · سبب الانتهاء: '+c.ending:'')+'.');});});
 if(!opts.length)opts.push(choice('🌱','لا توجد مسارات سابقة','ابدأ مسارًا متخصصًا ثم غيّره لاحقًا لتظهر سيرته هنا.',closeModal));
 modal('📜','تاريخ المهن الخاصة','ملخص المسارات السابقة ونتائجها والمكاسب التي حققتها.',opts);
}
function ensureGamingTalent(){
 if(!state.talents||typeof state.talents!=='object'||Array.isArray(state.talents))state.talents={};
 if(state.talents.gaming===undefined||state.talents.gaming===null||!Number.isFinite(Number(state.talents.gaming)))state.talents.gaming=35;
 state.talents.gaming=clamp(Number(state.talents.gaming),0,100);
 return state.talents.gaming;
}
function createEsportsCareer(){
 return {rank:1,tournaments:0,wins:0,losses:0,sponsor:null,sponsorYears:0,sponsorAnnualIncome:0,equipment:1,history:[]};
}
function ensureEsportsCareer(){
 if(!state.esportsCareer||typeof state.esportsCareer!=='object'||Array.isArray(state.esportsCareer))state.esportsCareer=createEsportsCareer();
 const e=state.esportsCareer;
 ['tournaments','wins','losses','sponsorYears'].forEach(key=>{e[key]=Math.max(0,Math.floor(Number(e[key])||0));});
 e.rank=clamp(Number(e.rank)||1,1,100);
 e.equipment=clamp(Number(e.equipment)||1,1,5);
 e.sponsorAnnualIncome=Math.max(0,Math.round(Number(e.sponsorAnnualIncome)||0));
 if(typeof e.sponsor!=='string')e.sponsor=null;
 if(!Array.isArray(e.history))e.history=[];
 if(!state.specialCareer.record||typeof state.specialCareer.record!=='object')state.specialCareer.record={attempts:0,wins:0,losses:0,projects:0,totalEarnings:0,bestLevel:Math.max(1,Number(state.specialCareer.level)||1)};
 if(!Array.isArray(state.specialCareer.history))state.specialCareer.history=[];
 return e;
}
function esportsCareerMenu(){
 if(!state.specialCareer||state.specialCareer.id!=='esports'){specialCareers();return;}
 const e=ensureEsportsCareer(),talent=ensureGamingTalent(),hobby=(state.hobbies||[]).find(item=>item&&item.id==='gaming'),hobbyLevel=hobby?Math.max(1,Number(hobby.level)||1):0;
 const sponsorText=e.sponsor&&e.sponsorYears>0?'الرعاية الحالية: '+e.sponsor+' · متبقي '+e.sponsorYears+' سنة · دخل سنوي '+cash(e.sponsorAnnualIncome)+'.':'لا يوجد عقد رعاية نشط.';
 const options=[
  choice('🏆','دخول بطولة','رسوم الدخول '+cash(700+e.rank*50)+'. فرص الفوز تعتمد على الموهبة والخبرة والتجهيزات.',enterEsportsTournament,cash(700+e.rank*50)),
  choice('🎯','تدريب تنافسي','تطوير موهبة الألعاب والخبرة مقابل 1,000 '+state.place.unit+'.',trainSpecialCareer,'1,000 '+state.place.unit),
  choice('🤝','التفاوض على رعاية','حاول الحصول على عقد خيالي لمدة سنتين أو ثلاث سنوات.',negotiateEsportsSponsorship),
  choice('🖥️','ترقية التجهيزات','رفع مستوى الجهاز حتى المستوى الخامس لتحسين فرص البطولات.',upgradeEsportsSetup),
  choice('📊','سجل البطولات','راجع نتائج آخر المنافسات والمكافآت.',esportsHistoryMenu)
 ];
 modal('🎮','مسيرة الرياضات الإلكترونية','موهبة الألعاب '+talent+'% · مستوى الهواية '+hobbyLevel+' · الرتبة '+e.rank+' · بطولات '+e.tournaments+' · انتصارات '+e.wins+' · إخفاقات '+e.losses+'. '+sponsorText,options);
}
function enterEsportsTournament(){
 closeModal();
 if(!state.specialCareer||state.specialCareer.id!=='esports'){info('🎮','ابدأ مسيرتك أولًا','اختار الرياضات الإلكترونية من قائمة المهن الخاصة.');return;}
 const e=ensureEsportsCareer(),fee=700+e.rank*50;
 if(state.bank<fee){info('💳','الرصيد مش كفاية','رسوم دخول البطولة '+cash(fee)+'.');return;}
 state.bank-=fee;
 const talent=ensureGamingTalent(),level=clamp(state.specialCareer.level||1,1,100),hobby=(state.hobbies||[]).find(item=>item&&item.id==='gaming'),hobbyLevel=hobby?Math.max(1,Number(hobby.level)||1):0;
 const odds=clamp(22+talent*.42+level*.28+(e.equipment-1)*4+hobbyLevel*1.5+(state.stats.smart-50)*.12+(state.fame||0)*.06,12,88);
 const won=chance(odds/100),prize=won?Math.round(2200+Math.random()*4800+talent*35+level*240+e.rank*180):0;
 e.tournaments++;
 if(won){e.wins++;e.rank=clamp(e.rank+1,1,100);state.specialCareer.level=clamp(level+1,1,100);state.fame=clamp(state.fame+3+Math.floor(Math.random()*5));state.bank+=prize;state.reputation=clamp((state.reputation||50)+2);achievement('فزت ببطولة إلكترونية');}
 else{e.losses++;state.stats.happiness=clamp(state.stats.happiness-4);state.reputation=clamp((state.reputation||50)-1);}
 const record=state.specialCareer.record;
 record.attempts=(record.attempts||0)+1;record.wins=(record.wins||0)+(won?1:0);record.losses=(record.losses||0)+(won?0:1);record.projects=(record.projects||0)+1;record.totalEarnings=(record.totalEarnings||0)+prize;record.bestLevel=Math.max(record.bestLevel||1,Number(state.specialCareer.level)||1);
 const result={age:state.age,won,prize,rank:e.rank,odds};e.history.unshift(result);if(e.history.length>12)e.history.length=12;
 if(!Array.isArray(state.specialCareer.history))state.specialCareer.history=[];
 state.specialCareer.history.unshift({age:state.age,title:'بطولة رياضات إلكترونية',success:won,earnings:prize,fameGain:won?3:0});if(state.specialCareer.history.length>20)state.specialCareer.history.length=20;
 const message=won?'فزت في البطولة بعد أداء قوي، وحصلت على '+cash(prize)+'. رتبتك الحالية '+e.rank+'.':'خرجت من البطولة بدون جائزة. راجع التدريب أو حسّن تجهيزاتك قبل المنافسة القادمة.';
 log('🎮',won?'فوز في بطولة إلكترونية':'خروج من البطولة',message,won?'good':'bad');save();render();info(won?'🏆':'🔁',won?'بطولة ناجحة':'تجربة تنافسية',message);
}
function negotiateEsportsSponsorship(){
 closeModal();
 if(!state.specialCareer||state.specialCareer.id!=='esports'){info('🤝','ابدأ مسيرتك أولًا','اختار الرياضات الإلكترونية من قائمة المهن الخاصة.');return;}
 const e=ensureEsportsCareer();
 if(e.sponsor&&e.sponsorYears>0){info('🤝','عقد الرعاية مستمر','عندك عقد مع '+e.sponsor+' لمدة '+e.sponsorYears+' سنة إضافية.');return;}
 const talent=ensureGamingTalent(),level=clamp(state.specialCareer.level||1,1,100);
 const odds=clamp(18+talent*.3+(state.fame||0)*.2+level*.2+e.rank*1.5,12,85);
 if(chance(odds/100)){
  e.sponsor=pick(['نبضة التقنية','مدار للأجهزة','ساحة اللاعبين']);e.sponsorYears=2+(e.rank>=5?1:0);e.sponsorAnnualIncome=Math.round(1200+talent*24+(state.fame||0)*28+e.rank*220);
  log('🤝','توقيع عقد رعاية','وقّعت عقدًا مع '+e.sponsor+' لمدة '+e.sponsorYears+' سنوات، بدخل سنوي '+cash(e.sponsorAnnualIncome)+'.','good');state.reputation=clamp((state.reputation||50)+4);achievement('حصلت على رعاية للألعاب الإلكترونية');
  save();render();info('🤝','عرض رعاية ناجح','الدخل السنوي '+cash(e.sponsorAnnualIncome)+' لمدة '+e.sponsorYears+' سنوات.');
 }else{
  state.stats.happiness=clamp(state.stats.happiness-2);log('📄','لم تحصل على الرعاية','الشركات طلبت نتائج أو جمهورًا أكبر قبل توقيع عقد.','bad');save();render();info('📄','لسه بدري','زود نتائجك وشهرتك وحاول مرة أخرى.');
 }
}
function upgradeEsportsSetup(){
 closeModal();
 if(!state.specialCareer||state.specialCareer.id!=='esports'){info('🎮','ابدأ مسيرتك أولًا','اختار الرياضات الإلكترونية من قائمة المهن الخاصة.');return;}
 const e=ensureEsportsCareer();
 if(e.equipment>=5){info('🖥️','تجهيزاتك مكتملة','وصلت لأعلى مستوى تجهيزات.');return;}
 const cost=6000+(e.equipment-1)*3500;
 if(state.bank<cost){info('💳','الرصيد مش كفاية','ترقية التجهيزات تكلف '+cash(cost)+'.');return;}
 state.bank-=cost;e.equipment++;
 log('🖥️','تحديث تجهيزات اللعب','طورت تجهيزاتك إلى المستوى '+e.equipment+'، وده هيساعدك في البطولات القادمة.','good');save();render();info('🖥️','التجهيزات اتطورت','مستوى التجهيزات '+e.equipment+' من 5.');
}
function esportsHistoryMenu(){
 const e=ensureEsportsCareer();
 const options=(e.history||[]).map(item=>choice(item.won?'🏆':'🔁',(item.won?'فوز':'خروج')+' · عمر '+item.age,'الرتبة بعد البطولة '+item.rank+' · فرصة الفوز وقتها '+Math.round(item.odds)+'% · الجائزة '+cash(item.prize||0),()=>{closeModal();info('🎮','تفاصيل البطولة','العمر '+item.age+' · '+(item.won?'فوز':'خروج')+' · الجائزة '+cash(item.prize||0)+'.');}));
 if(!options.length)options.push(choice('📊','لا توجد نتائج بعد','أول بطولة هتظهر هنا بعد المشاركة.',closeModal));
 options.push(choice('↩️','العودة لمسيرة الألعاب','ارجع لإدارة التدريب والبطولات والرعاية.',esportsCareerMenu));
 modal('📊','سجل البطولات','آخر 12 بطولة في مسيرتك.',options);
}

function specialCareers(){
 const catalog=[
  {id:'actor',title:'Actor',emoji:'🎭',min:16,looks:50,income:14000,desc:'Auditions, acting gigs and new opportunities.',packId:'actorPack'},
  {id:'model',title:'Model',emoji:'📸',min:16,looks:65,income:16000,desc:'Photo shoots, modeling contracts and fashion campaigns.',packId:'modelPack'},
  {id:'musician',title:'Musician',emoji:'🎼',min:14,looks:25,income:11000,desc:'Record songs, book performances and build a fanbase.',packId:'musicianPack'},
  {id:'musicProducer',title:'Music Producer',emoji:'🎧',min:18,looks:0,income:18000,desc:'Produce tracks, collaborate with artists and build a reputation.',packId:'musicProducerPack'},
  {id:'influencer',title:'Influencer',emoji:'📱',min:13,looks:30,income:7000,desc:'Post consistently and grow your audience.'},
  {id:'athlete',title:'Pro Athlete',emoji:'🏅',min:15,looks:0,income:18000,desc:'Fitness, training and championship competition.',packId:'proAthletePack'},
  {id:'esports',title:'الرياضات الإلكترونية',emoji:'🎮',min:16,looks:0,income:8500,desc:'بطولات تنافسية ورعايات تعتمد على المهارة والتدريب.'},
  {id:'fighter',title:'Professional Fighter',emoji:'🥊',min:18,looks:0,income:22000,desc:'Training, tactics and high-risk competitions.',packId:'fighterPack'},
  {id:'writer',title:'Writer & Publisher',emoji:'✍️',min:16,looks:0,income:5000,desc:'Build an audience through published work.'},
  {id:'director',title:'Movie Director',emoji:'🎥',min:25,looks:0,income:26000,desc:'Lead film productions and creative projects.',packId:'movieDirectorPack'},
  {id:'military',title:'Military Service',emoji:'🪖',min:18,looks:0,income:16000,desc:'Training, discipline, field missions and risk.'},
  {id:'politician',title:'Politician',emoji:'🏛️',min:25,looks:0,income:28000,desc:'Public service, campaigns and public trust.',packId:'politicianPack'},
  {id:'astronaut',title:'Astronaut',emoji:'🧑‍🚀',min:21,looks:0,income:40000,desc:'Train for space missions and explore the universe.',packId:'astronautPack'},
  {id:'crimeboss',title:'Mafia',emoji:'🕶️',min:21,looks:0,income:18000,desc:'A fictional underworld path with legal risks.',packId:'mafiaPack'},
  {id:'dealer',title:'Street Hustler',emoji:'🃏',min:18,looks:0,income:14000,desc:'A fictional street hustle story with risks and a reputation ladder.',packId:'dealerPack'}
 ];
 const opts=catalog.map(c=>choice(c.emoji,c.title,c.desc+' Minimum age '+c.min+'.',()=>{
  if(c.packId&&!perkOwned(c.packId)){showJobPackOffer(c.packId,c);return;}
  if(c.id==='dealer'){dealerMenu();return;}if(c.id==='crimeboss'){mafiaMenu();return;}startSpecialCareer(c);
 },'',null,!!(c.packId&&!perkOwned(c.packId))));
 if(perkOwned('actorPack'))opts.unshift(choice('🎬','Actor Job Pack','Paid commercials, agents and advanced auditions.',actorPackMenu));
 if(perkOwned('bossMode'))opts.unshift(choice('🧰','Boss Mode','Career-wide access and a toggleable 10% income bonus.',bossModeMenu));
 if(state.specialCareer){const r=state.specialCareer.record||{};
  opts.unshift(choice('📊','Current Career Record','Level '+fmt(state.specialCareer.level||1)+' · wins '+fmt(r.wins||0)+' · losses '+fmt(r.losses||0)+' · income '+cash(r.totalEarnings||0)+'.',()=>{closeModal();info('📊','Career Record','Attempts '+fmt(r.attempts||0)+' · wins '+fmt(r.wins||0)+' · losses '+fmt(r.losses||0)+' · projects '+fmt(r.projects||0)+' · total earnings '+cash(r.totalEarnings||0)+' · best level '+fmt(r.bestLevel||1)+'.');}));
  opts.unshift(choice('📚','Previous Careers','Review careers you have completed.',specialCareerHistoryMenu));
  if(state.specialCareer.id==='fighter'){opts.unshift(choice('🥊','إدارة مسيرة القتال','تدريب وتكتيك ومنافسات وارتقاء نحو اللقب العالمي.',combatCareerMenu));}
  else if(state.specialCareer.id==='director'){opts.unshift(choice('🎥','Manage Film Studio','Produce films, select budgets and casts, and review revenue.',filmStudioMenu));opts.unshift(choice('⭐','Train as '+state.specialCareer.title,'Current fame '+state.fame+'%.',()=>trainSpecialCareer()));}
  else if(state.specialCareer.id==='esports'){opts.unshift(choice('🎮','Manage Esports Career','Competitions, sponsorships, equipment and records.',esportsCareerMenu));opts.unshift(choice('⭐','Competitive Training','Gaming talent '+clamp(state.talents&&state.talents.gaming)+'%.',()=>trainSpecialCareer()));}
  else{opts.unshift(choice('🎬','Specialized Activity','Create a work, release or competition linked to your career.',()=>specialCareerActivity()));opts.unshift(choice('⭐','Train as '+state.specialCareer.title,'Current fame '+state.fame+'%.',()=>trainSpecialCareer()));opts.unshift(choice('🎟️','Audition / New Opportunity','Try for another career opportunity.',()=>tryAudition()));}
 }
 modal('🌟','Special Careers','Explore careers beyond traditional employment. Success takes practice and time.',opts);
}

function startSpecialCareer(c){
 if(state.combatCareer&&state.combatCareer.pendingBout){
  const activeCombat=ensureCombatCareer();
  if(activeCombat&&activeCombat.pendingBout){closeModal();info('🥊','النزال لسه مستمر','كمّل المواجهة الحالية قبل بدء مسار مهني آخر.');return;}
 }
 const requiredPack=({actor:'actorPack',model:'modelPack',musician:'musicianPack',musicProducer:'musicProducerPack',athlete:'proAthletePack',fighter:'fighterPack',director:'movieDirectorPack',politician:'politicianPack',astronaut:'astronautPack',crimeboss:'mafiaPack',dealer:'dealerPack'})[c.id]||c.packId;
 if(requiredPack&&!perkOwned(requiredPack)){closeModal();showJobPackOffer(requiredPack,c);return;}
 closeModal();if(state.age<c.min){info('🔒','لسه بدري','المسار ده متاح من سن '+c.min+'.');return;}
 if(c.looks&&state.stats.looks<c.looks&&(c.id==='actor'||c.id==='model')){info('🎭','طوّر مهاراتك','فرص التمثيل والأزياء تزيد مع المظهر والتدريب، جرّب الهوايات والتدريب.');return;}
 if(state.specialCareer&&state.specialCareer.id===c.id){if(c.id==='fighter'){ensureCombatCareer();combatCareerMenu();}else if(c.id==='director'){ensureFilmStudio();filmStudioMenu();}else if(c.id==='esports'){ensureEsportsCareer();esportsCareerMenu();}else info('🌟','أنت بالفعل في المسار ده','كمل تدريبك وأنشطتك عشان تتقدم بدل ما تبدأ من الصفر.');return;}
 if(state.specialCareer){if(!Array.isArray(state.specialCareerHistory))state.specialCareerHistory=[];state.specialCareerHistory.unshift(Object.assign({},state.specialCareer,{record:Object.assign({},state.specialCareer.record||{}),history:(state.specialCareer.history||[]).slice(),combatProfile:state.specialCareer.id==='fighter'?JSON.parse(JSON.stringify(state.combatCareer||null)):null,filmProfile:state.specialCareer.id==='director'?JSON.parse(JSON.stringify(state.filmStudio||null)):null,esportsProfile:state.specialCareer.id==='esports'?JSON.parse(JSON.stringify(state.esportsCareer||null)):null,endedAge:state.age,ending:'تغيير المسار'}));state.specialCareerHistory=state.specialCareerHistory.slice(0,20);}
 state.specialCareer={id:c.id,title:c.title,income:c.income,level:1,startedAge:state.age,record:{attempts:0,wins:0,losses:0,projects:0,totalEarnings:0,bestLevel:1},history:[]};state.combatCareer=c.id==='fighter'?createCombatCareer():null;state.filmStudio=c.id==='director'?createFilmStudio():null;state.esportsCareer=c.id==='esports'?createEsportsCareer():null;if(c.id==='influencer'){state.socialMediaAccount=true;state.followers=Math.max(state.followers||0,100);state.socialMediaPosts=(state.socialMediaPosts||0)+1;}state.fame=clamp((state.fame||0)+4);if(perkEnabled('hollywoodStar'))state.fame=100;state.reputation=clamp((state.reputation||50)+2);achievement('بدأ مسار الشهرة: '+c.title);
 log(c.emoji,'بداية مسار جديد','بدأت مسارك في '+c.title+'. النجاح محتاج تدريب واستمرارية، والدخل ممكن يتغير من سنة للتانية.','special');render();info('🌟','بدأت المسار',c.id==='esports'?'موهبة الألعاب عندك '+ensureGamingTalent()+'%. افتح إدارة المسيرة للتدريب والبطولات والرعاية.':'تقدر تتدرب أو تختبر فرص جديدة من قائمة المهن الخاصة.');
}

function trainSpecialCareer(){
 closeModal();if(state.specialCareer&&state.specialCareer.id==='fighter'){combatTrainingMenu();return;}
 if(state.specialCareer&&state.specialCareer.id==='esports'){
  const e=ensureEsportsCareer();if(state.bank<1000){info('💳','الرصيد مش كفاية','التدريب التنافسي يكلف 1,000 '+state.place.unit+'.');return;}
  state.bank-=1000;state.specialCareer.level=clamp((state.specialCareer.level||1)+1,1,100);ensureGamingTalent();state.talents.gaming=clamp(state.talents.gaming+3,0,100);stat('smart',1);stat('happiness',-1);
  log('🎯','تدريب تنافسي','تدربت على الاستراتيجية وسرعة اتخاذ القرار. موهبة الألعاب وصلت '+state.talents.gaming+'%، ومستوى المسيرة '+state.specialCareer.level+'.','good');save();render();info('🎮','تدريب ناجح','موهبة الألعاب '+state.talents.gaming+'% · مستوى المسيرة '+state.specialCareer.level+'.');return;
 }
 if(state.bank<800){info('💳','الرصيد مش كفاية','التدريب يكلف 800 '+state.place.unit+'.');return;}
 state.bank-=800;state.specialCareer.level=clamp((state.specialCareer.level||1)+1,1,100);state.fame=clamp(state.fame+3);stat('happiness',2);
 log('🌟','تدريب في '+state.specialCareer.title,'طورت مهاراتك في المسار الفني أو الاحترافي ورفعت مستوى الخبرة إلى '+state.specialCareer.level+'.','good');render();info('⭐','تدريب ناجح','مستوى المسار '+state.specialCareer.level+'، والشهرة '+state.fame+'%.');
}
function specialCareerActivity(){
 closeModal();if(!state.specialCareer){specialCareers();return;}if(state.specialCareer.id==='fighter'){combatCareerMenu();return;}if(state.specialCareer.id==='director'){filmStudioMenu();return;}if(state.specialCareer.id==='esports'){esportsCareerMenu();return;}
 const c=state.specialCareer;const level=Math.max(1,c.level||1);
 if(!c.record||typeof c.record!=='object')c.record={attempts:0,wins:0,losses:0,projects:0,totalEarnings:0,bestLevel:level};if(!Array.isArray(c.history))c.history=[];
 const costs={actor:7000,model:2500,musician:3500,musicProducer:6000,influencer:1800,athlete:1500,fighter:2200,writer:1500,director:12000};
 const cost=costs[c.id]||1500;
 if(state.bank<cost){info('💳','الرصيد مش كفاية','النشاط الخاص محتاج '+cash(cost)+'.');return;}
 state.bank-=cost;
 const power=(state.stats.smart/100)+(state.stats.health/140)+(state.fame/180)+(level/22)+(state.reputation/220);
 let gain=0,fame=0,success=chance(Math.min(.9,.18+power*.22));
 let title='',text='';
 if(c.id==='actor'||c.id==='director'){
  title=c.id==='director'?'إنتاج فيلم جديد':'تصوير عمل فني';gain=success?Math.round(5000+Math.random()*30000+state.fame*180):0;fame=success?5+Math.floor(Math.random()*12):0;text=success?'العمل حقق استجابة إيجابية ووصل لجمهور أوسع.':'العمل ما حققش النجاح المتوقع، واتعلمت من التجربة.';
 }else if(c.id==='model'){
  title='جلسة تصوير أزياء';success=chance(Math.min(.92,.2+power*.17+state.stats.looks/260+level/80));gain=success?Math.round(3500+Math.random()*22000+state.fame*130):0;fame=success?4+Math.floor(Math.random()*12):0;text=success?'جلسة التصوير نجحت ووصل لك عرض لحملة أزياء جديدة.':'جلسة التصوير لم تجذب الاهتمام المتوقع؛ راجع ملف أعمالك وجرّب مرة أخرى.';
 }else if(c.id==='musician'){
  title='إصدار أغنية';gain=success?Math.round(1500+Math.random()*18000+state.fame*120):0;fame=success?4+Math.floor(Math.random()*10):0;text=success?'الأغنية انتشرت وبدأ يوصلك اهتمام جديد.':'التفاعل كان أقل من المتوقع، ومحتاج تطوّر أسلوبك.';
 }else if(c.id==='musicProducer'){
  title='إنتاج مقطوعة موسيقية';success=chance(Math.min(.9,.18+power*.2+state.stats.smart/450+level/90));gain=success?Math.round(3000+Math.random()*24000+state.fame*150):0;fame=success?4+Math.floor(Math.random()*11):0;text=success?'المقطوعة جذبت فنانًا جديدًا وجالك عرض تعاون وإنتاج.':'الإصدار لم يصل للجمهور المطلوب؛ تطوير المهارة والتعاون مع فنانين قد يساعدان.';
 }else if(c.id==='influencer'){
  title='نشر حملة محتوى';gain=success?Math.round(1000+Math.random()*11000+state.fame*100):0;fame=success?3+Math.floor(Math.random()*12):0;text=success?'المحتوى وصل لمتابعين أكتر وجالك عرض تعاون.':'المحتوى ما انتشرش بالشكل المتوقع.';
 }else if(c.id==='athlete'||c.id==='fighter'){
  title=c.id==='fighter'?'منافسة قتالية':'منافسة رياضية';gain=success?Math.round(4000+Math.random()*26000+level*500):0;fame=success?5+Math.floor(Math.random()*10):0;state.stats.health=clamp(state.stats.health+(success?-2:-8));text=success?'قدمت أداءً قويًا وفزت بمكافأة المنافسة.':'خسرت المنافسة واحتجت وقتًا للتعافي والتدريب.';
 }else if(c.id==='military'){
  title='مهمة عسكرية';success=chance(Math.min(.85,.25+state.stats.health/200+state.stats.smart/350+level/40));gain=success?Math.round(1800+Math.random()*7000+level*300):0;fame=success?2+Math.floor(Math.random()*5):0;state.stats.health=clamp(state.stats.health+(success?-1:-12));text=success?'أنجزت المهمة ورجعت بخبرة ومكافأة.':'المهمة كانت صعبة وتعرضت لإرهاق وإصابة داخل اللعبة.';if(!success)state.reputation=clamp(state.reputation+1);
 }else if(c.id==='politician'){
  title='حملة انتخابية';success=chance(Math.min(.85,.2+state.reputation/170+state.stats.smart/250+state.fame/200+level/35));gain=success?Math.round(5000+Math.random()*25000+level*400):0;fame=success?4+Math.floor(Math.random()*9):0;state.reputation=clamp(state.reputation+(success?8:-6));text=success?'حملتك كسبت دعمًا وثقة وأصبحت أمامك مسؤوليات أكبر.':'الحملة لم تحصل على الدعم الكافي، واحتجت تراجع رسالتك وخطتك.';
 }else if(c.id==='crimeboss'){
  title='صراع نفوذ';success=chance(Math.min(.75,.2+state.stats.smart/250+level/40-(state.crimeRecord||0)*.03));gain=success?Math.round(4000+Math.random()*18000):0;fame=success?3+Math.floor(Math.random()*7):0;state.crimeRecord=(state.crimeRecord||0)+1;state.reputation=clamp(state.reputation-(success?3:14));if(!success&&chance(.45)){state.prison={years:2+Math.floor(Math.random()*4),kind:'قضية العالم السفلي'};state.job=null;if(!Array.isArray(state.specialCareerHistory))state.specialCareerHistory=[];state.specialCareerHistory.unshift(Object.assign({},state.specialCareer,{endedAge:state.age,ending:'اعتقال'}));state.specialCareerHistory=state.specialCareerHistory.slice(0,20);state.specialCareer=null;}text=success?'حافظت على نفوذك داخل القصة الخيالية وحققت مكسبًا.':'انقلب الصراع عليك وواجهت تبعات قانونية داخل اللعبة.';
 }else{
  title='نشر عمل مكتوب';gain=success?Math.round(800+Math.random()*14000+state.stats.smart*90):0;fame=success?2+Math.floor(Math.random()*8):0;text=success?'العمل وصل لقراء جدد وبدأ يحقق دخلًا من المبيعات.':'العمل محتاج مراجعة وتسويق أفضل قبل الإصدار القادم.';
 }
 if(success&&gain>0)gain=Math.round(gain*specialCareerIncomeMultiplier());state.fame=clamp(state.fame+fame);const newLevel=clamp(level+(success?1:0),1,100);if(state.specialCareer)state.specialCareer.level=newLevel;
 c.record.attempts=(c.record.attempts||0)+1;c.record.wins=(c.record.wins||0)+(success?1:0);c.record.losses=(c.record.losses||0)+(success?0:1);
 if(['actor','director','model','musician','musicProducer','influencer','writer'].includes(c.id))c.record.projects=(c.record.projects||0)+1;
 c.record.totalEarnings=(c.record.totalEarnings||0)+(success?gain:0);c.record.bestLevel=Math.max(c.record.bestLevel||1,newLevel);
 c.history.push({age:state.age,title,success,earnings:success?gain:0,fameGain:fame});if(c.history.length>20)c.history.shift();
 if(success){state.bank+=gain;state.reputation=clamp((state.reputation||50)+3);achievement('نشاط ناجح في '+c.title);}else{state.stats.happiness=clamp(state.stats.happiness-3);state.reputation=clamp((state.reputation||50)-2);}
 log(c.id==='director'?'🎥':c.id==='actor'?'🎬':c.id==='model'?'📸':c.id==='musician'?'🎼':c.id==='musicProducer'?'🎧':c.id==='influencer'?'📱':c.id==='athlete'?'🏅':c.id==='fighter'?'🥊':'✍️',title,text+(success?' الدخل: '+cash(gain)+'.':''),success?'good':'bad');
 render();info(success?'⭐':'🔁',success?'نشاط ناجح':'تجربة جديدة',text+(success?' الشهرة الحالية '+state.fame+'%.':' جرب التدريب أو نشاطًا مختلفًا في المرة القادمة.'));
}
function tryAudition(){
 closeModal();if(!state.specialCareer){specialCareers();return;}if(state.specialCareer.id==='fighter'){combatCareerMenu();return;}if(state.specialCareer.id==='director'){filmStudioMenu();return;}if(state.specialCareer.id==='esports'){esportsCareerMenu();return;}
 const agentBonus=state.specialCareer.id==='actor'&&state.specialCareer.agent?Number(state.specialCareer.agent.bonus)||.12:0;const chanceScore=.22+(state.stats.looks/500)+(state.stats.smart/700)+(state.fame/220)+((state.specialCareer.level||1)/200)+agentBonus;
 if(chance(Math.min(.85,chanceScore))){const fameGain=5+Math.floor(Math.random()*10),income=Math.round((5000+Math.floor(Math.random()*25000))*specialCareerIncomeMultiplier());state.fame=clamp(state.fame+fameGain);state.bank+=income;state.specialCareer.level=clamp((state.specialCareer.level||1)+1);log('🌟','فرصة ناجحة','نجحت في فرصة جديدة وكسبت '+cash(income)+'. شهرتك زادت '+fameGain+' نقاط.','good');achievement('نجاح مهني في '+state.specialCareer.title);render();info('🎉','فرصة ناجحة','شهرتك الحالية '+state.fame+'%.');}
 else{state.stats.happiness=clamp(state.stats.happiness-2);log('🎟️','رفض في اختبار أداء','الفرصة دي ما ظبطتش. راجع مهاراتك وحاول مرة تانية.','bad');render();info('🎟️','المرة الجاية','الرفض جزء طبيعي من المسار؛ التدريب يزيد فرصك.');}
}
function mafiaMenu(){
 if(!perkOwned('mafiaPack')){closeModal();info('🕶️','مسار المافيا مقفول','افتح باقة عالم الجريمة من متجر مزايا حياة.');return;}
 const mafia=state.mafia||(state.mafia={joined:false,rank:0,rep:0,earnings:0}),rankNames=['عضو جديد','عضو موثوق','مسؤول منطقة','مستشار العائلة','الأب الروحي'],opts=[];
 if(!mafia.joined)opts.push(choice('🤝','الانضمام إلى عائلة خيالية','يتطلب سن 18 سنة؛ المسار قد يسبب قضايا أو عقوبة داخل اللعبة.',joinMafia));
 else{
  opts.push(choice('📊','سجل المافيا',rankNames[mafia.rank]+' · السمعة '+mafia.rep+' · إجمالي دخل المسار '+cash(mafia.earnings)+'.',()=>{closeModal();info('🕶️','سجل المسار','الرتبة: '+rankNames[mafia.rank]+' · السمعة '+mafia.rep+' · إجمالي الدخل '+cash(mafia.earnings)+'.');}));
  opts.push(choice('🎭','مهمة نفوذ خيالية','مهمة تعتمد على الحظ والذكاء وقد تسبب تبعات قانونية.',mafiaMission));
  opts.push(choice('↩️','ترك العائلة','إنهاء المسار والاحتفاظ بسجل الخبرة.',()=>{closeModal();state.mafia.joined=false;log('🚪','تركت عائلة المافيا','قررت الابتعاد عن المسار الخيالي والبدء من جديد.','good');save();render();mafiaMenu();}));
 }
 opts.push(choice('↩️','رجوع للجريمة','',crimeMenu));
 modal('🕶️','مسار المافيا',mafia.joined?'ارتقِ تدريجيًا من عضو إلى الأب الروحي، مع احتمالات المكسب أو السجن.':'انضم إلى عائلة خيالية وابدأ بناء السمعة داخل المسار.',opts);
}
function joinMafia(){
 closeModal();if(state.age<18){info('🔒','لسه بدري','الانضمام متاح من سن 18 سنة.');return;}
 state.mafia={joined:true,rank:0,rep:10,earnings:0};state.crimeRecord=(state.crimeRecord||0)+1;log('🕶️','انضممت لعائلة خيالية','بدأت مسار المافيا في عالم اللعبة. القرارات القادمة قد ترفع رتبتك أو تعرضك للعقوبات.','special');save();render();mafiaMenu();
}
function mafiaMission(){
 closeModal();if(!state.mafia||!state.mafia.joined)return;
 const mafia=state.mafia,success=chance(Math.min(.86,.38+state.stats.smart*.003+mafia.rank*.09+mafia.rep*.0015));
 if(success){const gain=8000+Math.floor(Math.random()*18000)+mafia.rank*4000;state.bank+=gain;mafia.earnings+=gain;mafia.rep=clamp(mafia.rep+18,0,100);if(mafia.rep>=35&&mafia.rank<4){mafia.rank++;mafia.rep=0;}log('🕶️','نجحت مهمة نفوذ','حققت '+cash(gain)+' وزادت مكانتك في المسار الخيالي.','good');}
 else{state.crimeRecord=(state.crimeRecord||0)+1;state.reputation=clamp(state.reputation-8);if(chance(.25)){state.prison={years:1+Math.floor(Math.random()*3),kind:'قضية من مسار المافيا'};state.job=null;state.specialCareer=null;log('🚔','مهمة فاشلة وعقوبة','فشلت المهمة وواجهت حكمًا بالسجن داخل اللعبة.','bad');}else log('⚠️','مهمة فاشلة','فشلت المهمة وتضررت سمعتك؛ تحتاج تعيد تقييم المسار.','bad');}
 save();render();if(state.prison)prisonEvent();else mafiaMenu();
}
function blackMarketMenu(){
 if(!perkOwned('blackMarketPack')){closeModal();info('🏛️','السوق السوداء مقفول','افتح باقة عالم الجريمة من متجر مزايا حياة.');return;}
 modal('🏛️','السوق السوداء والمتحف','بائعون خياليون للقطع النادرة والتحف، مع إمكانية إنشاء متحف وعرض مقتنياتك.',[
  choice('🏛️',state.museum&&state.museum.opened?'إدارة المتحف':'إنشاء متحف','تكلفة الإنشاء 150,000 '+state.place.unit+'.',museumMenu,state.museum&&state.museum.opened?'مفتوح':'150,000 '+state.place.unit),
  choice('🖼️','شراء لوحة نادرة','قطعة فنية قابلة للعرض بقيمة متغيرة.',()=>buyBlackMarketItem('لوحة نادرة','🖼️',18000,42000),'18,000 '+state.place.unit),
  choice('🏺','شراء قطعة أثرية','قطعة أثرية نادرة، مناسبة للعرض والتجميع.',()=>buyBlackMarketItem('قطعة أثرية','🏺',24000,50000),'24,000 '+state.place.unit),
  choice('🪙','شراء عملة قديمة','مقتنى صغير قد تزيد قيمته مع الوقت.',()=>buyBlackMarketItem('عملة قديمة','🪙',9500,22000),'9,500 '+state.place.unit),
  choice('📦','مقتنياتي النادرة','اعرض مقتنياتك وعدد المعروض في المتحف.',()=>{closeModal();info('📦','المقتنيات','إجمالي المقتنيات '+(state.heirlooms||[]).length+' · المعروض في المتحف '+((state.museum&&state.museum.displayed)||[]).length+'.');}),
  choice('↩️','رجوع للجريمة','',crimeMenu)
 ]);
}
function buyBlackMarketItem(name,emoji,cost,value){
 closeModal();if(state.age<18){info('🔒','الشراء غير متاح','شراء القطع النادرة متاح من سن 18.');return;}
 if(state.bank<cost){info('💳','الرصيد مش كفاية','شراء المقتنى يحتاج '+cash(cost)+'.');return;}
 state.bank-=cost;state.heirlooms=Array.isArray(state.heirlooms)?state.heirlooms:[];
 state.heirlooms.push({id:Date.now()+Math.random(),name,emoji,value,age:state.age,kind:'blackMarket'});
 log('🏺','شراء مقتنى نادر','اشتريت '+name+' مقابل '+cash(cost)+'. القيمة التقديرية غير مضمونة.','good');save();render();blackMarketMenu();
}
function museumMenu(){
 if(!perkOwned('blackMarketPack')){closeModal();info('🔒','المتحف مقفول','افتح توسعة السوق السوداء أولًا.');return;}
 state.museum=state.museum||{opened:false,displayed:[]};
 if(!state.museum.opened){
  closeModal();const cost=150000;if(state.bank<cost){info('💳','الميزانية غير كافية','إنشاء المتحف يحتاج '+cash(cost)+'.');return;}
  state.bank-=cost;state.museum={opened:true,displayed:[]};log('🏛️','افتتاح المتحف','أنشأت متحفًا لعرض المقتنيات النادرة.','special');achievement('افتتاح متحف');save();render();museumMenu();return;
 }
 const displayed=state.museum.displayed||[];
 const artifacts=(state.heirlooms||[]).filter(item=>item&&item.name&&!displayed.includes(item.name));
 const opts=artifacts.map(item=>choice(item.emoji||'🏺',item.name,'القيمة التقديرية '+cash(item.value||0)+'.',()=>{closeModal();state.museum.displayed.push(item.name);log('🖼️','عرض مقتنى في المتحف','وضعت '+item.name+' ضمن القطع المعروضة للجمهور.','good');save();render();museumMenu();}));
 opts.push(choice('📊','تقرير المتحف','المعروض '+displayed.length+' قطعة. دخل سنوي محتمل من الزوار.',()=>{closeModal();info('🏛️','تقرير المتحف','عدد القطع المعروضة '+displayed.length+' · إجمالي المقتنيات '+(state.heirlooms||[]).length+'. دخل الزوار يُحتسب عند تقدم العمر.');}));
 opts.push(choice('↩️','رجوع للسوق السوداء','',blackMarketMenu));
 modal('🏛️','متحف المقتنيات','اعرض مقتنياتك النادرة واستقبل زوارًا داخل محاكاة الحياة.',opts);
}
function assassinBladeMission(){
 if(!perkOwned('assassinsBlade')){closeModal();info('🗡️','نصل المهام مقفول','افتح باقة عالم الجريمة من متجر مزايا حياة.');return;}
 closeModal();if(state.age<18){info('🔒','المهمة غير متاحة','المهمة الخيالية متاحة من سن 18.');return;}
 if(state.assassinBladeLastUsedAge===state.age){info('🗡️','المهمة استُخدمت هذا العام','استخدمت نصل المهام الخاصة بالفعل في هذه السنة داخل اللعبة.');return;}
 const success=chance(Math.min(.82,.42+state.stats.smart*.0028+state.reputation*.001));
 state.assassinBladeLastUsedAge=state.age;
 if(success){const gain=15000+Math.floor(Math.random()*30000);state.bank+=gain;state.fame=clamp((state.fame||0)+8);log('🗡️','نجحت مهمة سرية خيالية','اكتملت المهمة داخل عالم اللعبة وتجاوزت العواقب القانونية هذه المرة، وحصلت على '+cash(gain)+'.','special');}
 else{state.crimeRecord=(state.crimeRecord||0)+1;state.reputation=clamp(state.reputation-16);state.stats.happiness=clamp(state.stats.happiness-8);if(chance(.32)){state.prison={years:2+Math.floor(Math.random()*4),kind:'قضية مهمة سرية'};state.job=null;state.specialCareer=null;log('🚔','فشل في المهمة السرية','انكشفت المهمة داخل اللعبة وواجهت عقوبة قانونية.','bad');}else log('🗡️','مهمة لم تكتمل','لم تنجح المهمة وارتفعت المخاطر القانونية.','bad');}
 save();render();if(state.prison)prisonEvent();else info(success?'🗡️':'⚠️',success?'نجاح المهمة':'عواقب المهمة',success?'تجاوزت التحقيق في سيناريو اللعبة.':'سجلك القانوني تضرر من المحاولة.');
}
function crimeMenu(){
 const opts=[
  choice('🛍️','سرقة بسيطة','مكسب محدود مع احتمال غرامة أو سجل جنائي.',()=>commitCrime('سرقة بسيطة',1500,.22,12)),
  choice('🧾','احتيال مالي','مكسب محتمل أكبر وعواقب قانونية أشد.',()=>commitCrime('احتيال مالي',9000,.4,24)),
  choice('🏚️','اقتحام ممتلكات','مجازفة عالية وعواقب خطيرة.',()=>commitCrime('اقتحام ممتلكات',12000,.52,36)),
  choice('🚚','تهريب خيالي','مهمة عالية المخاطر بنتائج متغيرة.',()=>commitCrime('تهريب',16000,.58,42)),
  choice('🏦','سطو كبير','احتمال اعتقال مرتفع جدًا.',()=>commitCrime('سطو كبير',35000,.72,60)),
  ...(perkOwned('mafiaPack')?[choice('🕶️','مسار المافيا','انضم إلى عائلة خيالية وتقدم نحو رتبة الأب الروحي.',mafiaMenu)]:[]),
  ...(perkOwned('blackMarketPack')?[choice('🏛️','السوق السوداء والمتحف','بائعون خياليون ومقتنيات نادرة ومتحف.',blackMarketMenu)]:[]),
  ...(perkOwned('assassinsBlade')?[choice('🗡️','مهمة نصل خاصة','مهمة خيالية عالية المخاطر مرة كل سنة.',assassinBladeMission)]:[]),
  choice('🚔','السجل القانوني','اعرض عدد القضايا ووضعك الحالي.',()=>{closeModal();info('⚖️','السجل القانوني','عدد مرات التورط: '+(state.crimeRecord||0)+' · '+(state.prison?'تقضي عقوبة متبقية '+state.prison.years+' سنة':'لا توجد عقوبة سجن حالية')+'.');})
 ];
 modal('⚖️','قرارات قانونية خطرة','دي اختيارات خيالية داخل اللعبة فقط. الاحتمالات تعتمد على الحظ والسجل السابق، والنتائج ممكن تشمل غرامة أو سجن.',opts);
}

function commitCrime(kind,reward,risk,severity){
 closeModal();if(state.age<14){info('🔒','لسه صغير','الاختيار ده مش متاح في السن ده.');return;}
 const p=Math.min(.9,risk+(state.crimeRecord||0)*.035-(state.stats.smart-50)*.001);
 if(chance(1-p)){
  const gain=Math.round(reward*(.65+Math.random()*.7));state.bank+=gain;state.crimeRecord=(state.crimeRecord||0)+1;state.reputation=clamp((state.reputation||50)-8);state.stats.happiness=clamp(state.stats.happiness+2);
  log('⚠️','نجحت في '+kind,'حققت '+cash(gain)+' داخل اللعبة، لكن المخاطرة زادت سجلك القانوني وقللت سمعتك.','bad');render();info('⚠️','مكسب محفوف بالمخاطر','السجل القانوني ممكن يزيد احتمال العقوبة في قرارات لاحقة.');
 }else{
  const fine=Math.min(Math.max(0,state.bank),Math.round(reward*.25));state.bank-=fine;state.crimeRecord=(state.crimeRecord||0)+1;state.reputation=clamp((state.reputation||50)-18);state.stats.happiness=clamp(state.stats.happiness-12);
  const years=Math.max(1,Math.round(severity/12)+(state.crimeRecord>2?1:0));state.prison={years,kind};state.job=null;state.specialCareer=null;
  log('🚔','القبض عليك','اتقبض عليك بسبب '+kind+'. خسرت '+cash(fine)+' كغرامة، وصدر حكم بالسجن '+years+' سنة.','bad');render();info('🚔','حكم بالسجن','هتقضي '+years+' سنة داخل السجن. القرارات اللي هتاخدها هناك هتأثر على حالتك وفرصك بعد الخروج.');
 }
}
function useJailFreeCard(){
 closeModal();if(!state.prison||!perkOwned('jailCard')){info('🃏','البطاقة غير متاحة','تحتاج تكون في السجن ومعاك بطاقة غير مستخدمة.');return;}
 state.prison=null;state.crimeRecord=0;permanentPerks.owned.jailCard=false;persistPermanentPerks();log('🃏','استخدام بطاقة الخروج','خرجت من السجن فورًا ومُحي السجل القانوني داخل اللعبة.','good');achievement('الخروج من السجن بالبطاقة');save();render();info('🔓','حر طليق','تم إنهاء العقوبة ومحو السجل القانوني. البطاقة استُهلكت.');
}
function prisonEvent(){
 const opts=[
  ...(state.prison&&perkOwned('jailCard')?[choice('🃏','استخدام بطاقة الخروج من السجن','خروج فوري ومحو كامل للسجل القانوني؛ البطاقة تُستهلك عند الاستخدام.',useJailFreeCard)]:[]),
  choice('🧘','تجنب المشاكل','حاول تحافظ على صحتك وسلوكك.',()=>{closeModal();state.reputation=clamp(state.reputation+1);state.stats.happiness=clamp(state.stats.happiness+1);log('🧘','سنة هادئة في السجن','حاولت تبعد عن المشاكل وتحافظ على نفسك.','good');render();}),
  choice('🧹','عمل داخل السجن','دخل بسيط يقلل أثر المصاريف.',()=>{closeModal();const pay=300+Math.floor(Math.random()*900);state.bank+=pay;state.stats.happiness=clamp(state.stats.happiness+2);log('🧹','عمل داخل السجن','اشتغلت مهمة داخلية وكسبت '+cash(pay)+'.','good');render();}),
  choice('📨','طلب مراجعة الحكم','فرصة محدودة لتخفيف العقوبة.',()=>{closeModal();if(chance(.2)){state.prison=null;state.reputation=clamp(state.reputation+3);log('⚖️','مراجعة ناجحة','تمت مراجعة الحكم وخرجت قبل نهاية المدة.','good');render();info('🔓','خرجت من السجن','تقدر تعيد ترتيب حياتك وتبحث عن بداية جديدة.');}else{state.stats.happiness=clamp(state.stats.happiness-2);log('⚖️','لم يُقبل الطلب','الطلب لم يغيّر مدة العقوبة.','bad');render();info('⚖️','العقوبة مستمرة','هتحتاج تكمل المدة المتبقية.');}}),
  choice('⚖️','تعيين محامي','دفع 5,000 '+state.place.unit+' لفرصة تخفيف العقوبة.',()=>{closeModal();if(state.bank<5000){info('💳','الرصيد مش كفاية','تعيين محامي يكلف 5,000 '+state.place.unit+'.');return;}state.bank-=5000;if(chance(.38)){state.prison.years=Math.max(0,state.prison.years-1);log('⚖️','نجحت مراجعة القضية','ساعدك المحامي على تخفيف مدة العقوبة سنة.','good');if(state.prison.years===0)state.prison=null;}else{log('⚖️','لم تتغير العقوبة','المحامي لم ينجح في تقليل مدة العقوبة.','bad');}render();info('⚖️','انتهت جلسة المراجعة','العقوبة المتبقية '+(state.prison?state.prison.years:0)+' سنة.');}),
  choice('🏃','محاولة هروب','مخاطرة كبيرة قد تضيف سنوات للعقوبة.',()=>{closeModal();if(chance(.16+(state.stats.smart/500))){state.prison=null;state.crimeRecord=(state.crimeRecord||0)+1;stat('happiness',5);log('🏃','نجحت في الهروب','تمكنت من الهروب في سيناريو اللعبة، لكن السجل القانوني مازال موجودًا.','bad');render();info('🏃','هروب ناجح','حاول إعادة بناء حياتك مع تجنب مخالفات جديدة.');}else{state.prison.years+=2;stat('health',-8);stat('happiness',-10);log('🚨','فشلت محاولة الهروب','تم اكتشاف المحاولة وزادت العقوبة سنتين.','bad');render();info('🚔','عقوبة إضافية','مدة العقوبة الجديدة '+state.prison.years+' سنوات.');}})
 ];
 modal('🚔','الحياة داخل السجن','العقوبة المتبقية: '+state.prison.years+' سنة. كل سنة بتعدي تأثر على صحتك وحالتك.',opts,false);
}

function willMenu(){
 const opts=[
   choice('🌳','عرض شجرة العائلة','استعراض أفراد الأسرة والأجيال المسجلة.',familyTreeMenu),
  choice('👪','الأسرة بالتساوي','اختيار افتراضي لتوزيع الإرث على الأسرة.',()=>setWill('الأسرة بالتساوي')),
  choice('🧒','الأبناء أولًا','تركيز الميراث على الأبناء إن وجدوا.',()=>setWill('الأبناء أولًا')),
  choice('❤️','الشريك أولًا','تفضيل الزوج/الزوجة في ترتيب الإرث.',()=>setWill('الشريك أولًا')),
  choice('🤝','التبرع بجزء','تخصيص جزء خيري عند نهاية الحياة.',()=>setWill('التبرع بجزء'))
 ];
 modal('📜','الوصية والإرث','الخيار ده يحدد نيتك في نهاية الرحلة. لو استكملت كأحد أبنائك، ممكن تنتقل بعض الممتلكات معه.',opts);
}
function setWill(value){closeModal();state.willDistribution=value;log('📜','تحديث الوصية','حددت توزيع الإرث: '+value+'.','special');render();info('📜','تم تحديث الوصية','توزيع الإرث الحالي: '+value+'.');}
function dailyReward(){
 closeModal();const now=new Date(),today=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');
 if(state.dailyRewardDate===today){info('🎁','المكافأة اتاخدت','ارجع بكرة عشان مكافأة يوم جديد.');return;}
 state.dailyRewardDate=today;const amount=1000+Math.floor(Math.random()*4000);state.bank+=amount;
 state.heirlooms=normalizeHeirlooms(state.heirlooms,state.age);
 let item='';
 if(chance(.28)){
  const trinkets=[{name:'ساعة قديمة',emoji:'⌚'},{name:'ميدالية عائلية',emoji:'🏅'},{name:'كاميرا كلاسيكية',emoji:'📷'},{name:'كتاب نادر',emoji:'📚'},{name:'خاتم موروث',emoji:'💍'}];
  const found=pick(trinkets);item=found.name;
  state.heirlooms.push({id:'daily-'+Date.now()+'-'+Math.random().toString(36).slice(2,8),name:item,emoji:found.emoji,value:500+Math.floor(Math.random()*4500),age:state.age,kind:'daily'});
 }
 log('🎁','هدية اليوم','استلمت '+cash(amount)+(item?' وعثرت على مقتنى نادر: '+item:'')+'.','good');achievement('استلام مكافأة يومية');render();info('🎁','مكافأة اليوم','حصلت على '+cash(amount)+(item?'، وأضيف '+item+' إلى مقتنياتك.':'.'));
}

function challengeDateKey(date){
 return date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');
}
function challengeYesterdayKey(date){
 const d=new Date(date);d.setDate(d.getDate()-1);return challengeDateKey(d);
}
function seasonalWeekDetails(date){
 const input=date instanceof Date?date:new Date(date||Date.now());
 const current=Number.isFinite(input.getTime())?input:new Date();
 const localDay=new Date(current.getFullYear(),current.getMonth(),current.getDate());
 const mondayOffset=(localDay.getDay()+6)%7;
 const start=new Date(localDay);start.setDate(start.getDate()-mondayOffset);
 const end=new Date(start);end.setDate(end.getDate()+6);
 const thursday=new Date(start);thursday.setDate(thursday.getDate()+3);
 const isoYear=thursday.getFullYear();
 const jan4=new Date(isoYear,0,4);
 const firstMonday=new Date(jan4);firstMonday.setDate(firstMonday.getDate()-((firstMonday.getDay()+6)%7));
 const startUtc=Date.UTC(start.getFullYear(),start.getMonth(),start.getDate()),firstMondayUtc=Date.UTC(firstMonday.getFullYear(),firstMonday.getMonth(),firstMonday.getDate());
 const week=Math.floor((startUtc-firstMondayUtc)/604800000)+1;
 return {id:isoYear+'-W'+String(week).padStart(2,'0'),startDate:challengeDateKey(start),endDate:challengeDateKey(end)};
}
function seasonalEventBaseline(source=state){
 const player=source&&typeof source==='object'?source:{};
 const stats=player.stats&&typeof player.stats==='object'?player.stats:{};
 const count=value=>Math.max(0,Math.min(1000000000,Math.floor(Number.isFinite(Number(value))?Number(value):0)));
 const people=[...(Array.isArray(player.family)?player.family:[]),...(Array.isArray(player.friends)?player.friends:[]),...(player.partner?[player.partner]:[])];
 const bestRelationship=people.reduce((best,person)=>Math.max(best,clamp(Number(person&&person.relationshipLevel)||0)),0);
 const careerProgress=(Array.isArray(player.jobHistory)?player.jobHistory.length:0)+
  (Array.isArray(player.specialCareerHistory)?player.specialCareerHistory.length:0)+
  (player.job?Math.max(1,Math.floor(Number(player.job.level)||1)):0)+
  (player.specialCareer?Math.max(1,Math.floor(Number(player.specialCareer.level)||1)):0);
 return {
  age:Math.max(0,Math.min(120,count(player.age))),
  friends:count(Array.isArray(player.friends)?player.friends.length:0),
  hobbies:count(Array.isArray(player.hobbies)?player.hobbies.length:0),
  posts:count(player.socialMediaPosts),
  smart:clamp(Number.isFinite(Number(stats.smart))?Number(stats.smart):40),
  health:clamp(Number.isFinite(Number(stats.health))?Number(stats.health):80),
  happiness:clamp(Number.isFinite(Number(stats.happiness))?Number(stats.happiness):65),
  careerProgress:count(careerProgress),
  assets:count(Array.isArray(player.assets)?player.assets.length:0),
  investments:count(Array.isArray(player.investments)?player.investments.length:0),
  pets:count(Array.isArray(player.pets)?player.pets.length:0),
  trips:count(Array.isArray(player.travelHistory)?player.travelHistory.length:0),
  children:count(Array.isArray(player.children)?player.children.length:0),
  bestRelationship
 };
}
function normalizeSeasonalEvent(raw,source=state){
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||!/^\d{4}-W\d{2}$/.test(String(raw.weekId||'')))return null;
 const baseline=raw.baseline&&typeof raw.baseline==='object'&&!Array.isArray(raw.baseline)?raw.baseline:{};
 const fallback=seasonalEventBaseline(source);
 const number=(value,defaultValue,min,max)=>{const parsed=Number(value);return Math.max(min,Math.min(max,Number.isFinite(parsed)?parsed:defaultValue));};
 const validBadgeIds=['chapter','friend','hobby','voice','learning','balance','career','asset','invest','pet','travel','family'];
 const claimed=Array.isArray(raw.claimed)?Array.from(new Set(raw.claimed.map(value=>String(value)).filter(id=>validBadgeIds.includes(id)))).slice(0,11):[];
 return {
  weekId:String(raw.weekId),
  title:'مهرجان صُنّاع الحكاية',
  startDate:/^\d{4}-\d{2}-\d{2}$/.test(String(raw.startDate||''))?String(raw.startDate):'',
  endDate:/^\d{4}-\d{2}-\d{2}$/.test(String(raw.endDate||''))?String(raw.endDate):'',
  baseline:{
   age:number(baseline.age,0,0,120),
   friends:number(baseline.friends,0,0,1000000000),
   hobbies:number(baseline.hobbies,0,0,1000000000),
   posts:number(baseline.posts,0,0,1000000000),
   smart:number(baseline.smart,40,0,100),
   health:number(baseline.health,80,0,100),
   happiness:number(baseline.happiness,65,0,100),
   careerProgress:number(baseline.careerProgress,fallback.careerProgress,0,1000000000),
   assets:number(baseline.assets,fallback.assets,0,1000000000),
   investments:number(baseline.investments,fallback.investments,0,1000000000),
   pets:number(baseline.pets,fallback.pets,0,1000000000),
   trips:number(baseline.trips,fallback.trips,0,1000000000),
   children:number(baseline.children,fallback.children,0,1000000000),
   bestRelationship:number(baseline.bestRelationship,fallback.bestRelationship,0,100)
  },
  claimed,
  bonusClaimed:raw.bonusClaimed===true
 };
}
function normalizeSeasonalEventArchive(raw,source=state){
 if(!Array.isArray(raw))return [];
 return raw.filter(item=>item&&typeof item==='object'&&!Array.isArray(item)&&/^\d{4}-W\d{2}$/.test(String(item.weekId||''))).slice(0,8).map(item=>{
  const normalized=normalizeSeasonalEvent(item,source);
  return normalized?{weekId:normalized.weekId,title:normalized.title,startDate:normalized.startDate,endDate:normalized.endDate,claimed:normalized.claimed,bonusClaimed:normalized.bonusClaimed}:null;
 }).filter(Boolean);
}
function ensureSeasonalEvent(){
 if(!state)return null;
 state.seasonalEventArchive=normalizeSeasonalEventArchive(state.seasonalEventArchive,state);
 const week=seasonalWeekDetails();
 let event=normalizeSeasonalEvent(state.seasonalEvent,state);
 if(!event||event.weekId!==week.id){
  if(event&&!state.seasonalEventArchive.some(item=>item.weekId===event.weekId)){state.seasonalEventArchive.unshift({weekId:event.weekId,title:event.title,startDate:event.startDate,endDate:event.endDate,claimed:event.claimed.slice(0,11),bonusClaimed:event.bonusClaimed});state.seasonalEventArchive=state.seasonalEventArchive.slice(0,8);}
  event={weekId:week.id,title:'مهرجان صُنّاع الحكاية',startDate:week.startDate,endDate:week.endDate,baseline:seasonalEventBaseline(state),claimed:[],bonusClaimed:false};
  state.seasonalEvent=event;save();
 }else{event.startDate=event.startDate||week.startDate;event.endDate=event.endDate||week.endDate;state.seasonalEvent=event;}
 return event;
}
function seasonalEventBadges(event){
 if(!state||!event)return [];
 const baseline=event.baseline||seasonalEventBaseline(),stats=state.stats&&typeof state.stats==='object'?state.stats:{};
 const currentAge=Math.max(0,Number(state.age)||0),currentFriends=Array.isArray(state.friends)?state.friends.length:0,currentHobbies=Array.isArray(state.hobbies)?state.hobbies.length:0,currentPosts=Math.max(0,Number(state.socialMediaPosts)||0);
 const people=[...(Array.isArray(state.family)?state.family:[]),...(Array.isArray(state.friends)?state.friends:[]),...(state.partner?[state.partner]:[])];
 const bestRelationship=people.reduce((best,person)=>Math.max(best,clamp(Number(person&&person.relationshipLevel)||0)),0);
 const careerProgress=(Array.isArray(state.jobHistory)?state.jobHistory.length:0)+
  (Array.isArray(state.specialCareerHistory)?state.specialCareerHistory.length:0)+
  (state.job?Math.max(1,Math.floor(Number(state.job.level)||1)):0)+
  (state.specialCareer?Math.max(1,Math.floor(Number(state.specialCareer.level)||1)):0);
 const assetCount=Array.isArray(state.assets)?state.assets.length:0;
 const investmentCount=Array.isArray(state.investments)?state.investments.length:0;
 const petCount=Array.isArray(state.pets)?state.pets.length:0;
 const tripCount=Array.isArray(state.travelHistory)?state.travelHistory.length:0;
 const childCount=Array.isArray(state.children)?state.children.length:0;
 const badges=[
  {id:'chapter',title:'فصل جديد',desc:'قدّم عمر شخصيتك سنة واحدة خلال الأسبوع.',reward:2600,rewardStat:'happiness',done:currentAge>=baseline.age+1},
  {id:'friend',title:'صاحب جديد',desc:'كوّن صداقة جديدة ووسّع دايرة معارفك.',reward:2200,rewardStat:'happiness',done:currentFriends>=baseline.friends+1},
  {id:'hobby',title:'موهبة بتكبر',desc:'ابدأ هواية جديدة وخصص لها وقتًا.',reward:2200,rewardStat:'smart',done:currentHobbies>=baseline.hobbies+1}
 ];
 if(baseline.age<13)badges.push({id:'learning',title:'عقل بيتفتح',desc:'طوّر ذكاءك أربع نقاط على الأقل خلال الأسبوع.',reward:2800,rewardStat:'smart',done:(Number(stats.smart)||0)>=Math.min(100,baseline.smart+4)});
 else badges.push({id:'voice',title:'صوتك وصل',desc:'انشر محتوى واحدًا على الأقل في إحدى قنواتك.',reward:3200,rewardStat:'happiness',done:currentPosts>=baseline.posts+1});
 badges.push(
  {id:'balance',title:'توازن جميل',desc:'حافظ على الصحة والسعادة عند 70% أو أعلى.',reward:3000,rewardStat:'health',done:(Number(stats.health)||0)>=Math.max(70,baseline.health)&&(Number(stats.happiness)||0)>=Math.max(70,baseline.happiness)},
  {id:'career',title:'خطوة لقدّام',desc:'ابدأ مسارًا مهنيًا أو حقق تقدمًا جديدًا في عملك.',reward:3400,rewardStat:'smart',done:careerProgress>baseline.careerProgress},
  {id:'asset',title:'أصل جديد',desc:'أضف أصلًا جديدًا إلى ممتلكاتك خلال الأسبوع.',reward:3000,rewardStat:'happiness',done:assetCount>baseline.assets},
  {id:'invest',title:'عقلية استثمار',desc:'ابدأ استثمارًا جديدًا وراقب تطوره.',reward:3200,rewardStat:'smart',done:investmentCount>baseline.investments},
  {id:'pet',title:'رفيق جديد',desc:'استقبل حيوانًا أليفًا وابدأ رعايته.',reward:2600,rewardStat:'happiness',done:petCount>baseline.pets},
  {id:'travel',title:'اكتشاف جديد',desc:'سجّل رحلة مختلفة عن رحلاتك السابقة.',reward:2800,rewardStat:'happiness',done:tripCount>baseline.trips},
  {id:'family',title:'رابطة أقوى',desc:'حسّن علاقتك بأحد المقربين خمس نقاط أو كوّن أسرة جديدة.',reward:3000,rewardStat:'happiness',done:bestRelationship>=Math.min(100,baseline.bestRelationship+5)||childCount>baseline.children}
 );
 return badges;
}
function seasonalEventMenu(){
 if(!validState())return;
 const event=ensureSeasonalEvent(),badges=seasonalEventBadges(event);
 const claimedCount=badges.filter(badge=>event.claimed.includes(badge.id)).length,readyCount=badges.filter(badge=>badge.done&&!event.claimed.includes(badge.id)).length;
 const today=new Date(),endAt=event.endDate?new Date(event.endDate+'T00:00:00'):null;
 const dayDistance=endAt&&Number.isFinite(endAt.getTime())?Math.floor((Date.UTC(endAt.getFullYear(),endAt.getMonth(),endAt.getDate())-Date.UTC(today.getFullYear(),today.getMonth(),today.getDate()))/86400000):0;
 const daysLeft=Math.max(0,dayDistance+1);
 const opts=[{icon:'📊',title:'تقدم الأسبوع',desc:'جمعت '+claimedCount+' من '+badges.length+' شارات · '+readyCount+' جاهزة للاستلام · متبقي '+daysLeft+' يوم.',progress:Math.round(claimedCount/badges.length*100),disabled:true}];
 badges.forEach(badge=>{const claimed=event.claimed.includes(badge.id),status=claimed?'تم جمع الشارة':badge.done?'جاهزة للاستلام':'قيد التقدم';opts.push(choice(claimed?'🏅':badge.done?'🎁':'🔒',badge.title,badge.desc+' الحالة: '+status+' · المكافأة '+cash(badge.reward)+'.',()=>claimSeasonalEventBadge(badge.id)));});
 if(event.bonusClaimed)opts.push({icon:'🏆',title:'مكافأة إكمال المهرجان',desc:'استلمت المكافأة الختامية بالفعل. إجمالي الشارات '+badges.length+'.',disabled:true});
 else opts.push({icon:'🏆',title:'مكافأة إكمال المهرجان',desc:'تُمنح تلقائيًا بعد جمع الشارات الإحدى عشرة: '+cash(9000)+' وزيادة السعادة.',disabled:true,progress:Math.round(claimedCount/badges.length*100)});
 if(state.seasonalEventArchive.length)opts.push(choice('📚','سجل المواسم السابقة','راجع الشارات التي جمعتها في الأسابيع الماضية.',seasonalEventArchiveMenu));
 modal('🏅','مهرجان صُنّاع الحكاية','حدث أسبوعي محلي من تصميم حياة. اجمع الشارات قبل نهاية الأسبوع ('+event.startDate+' إلى '+event.endDate+'). تقدمك محفوظ مع هذه الحياة ولا يحتاج اتصالًا بخدمة خارجية.',opts);
}
function claimSeasonalEventBadge(id){
 if(!validState())return;
 const event=ensureSeasonalEvent(),badges=seasonalEventBadges(event),badge=badges.find(item=>item.id===id);
 if(!badge){closeModal();info('🏅','الشارة غير متاحة','هذه الشارة ليست ضمن موسمك الحالي.');return;}
 if(event.claimed.includes(id)){closeModal();info('🏅','الشارة مستلمة بالفعل','المكافأة الخاصة بهذه الشارة لا تُصرف أكثر من مرة.');return;}
 if(!badge.done){closeModal();info('🎯','كمّل الشرط الأول',badge.desc);return;}
 event.claimed.push(id);state.bank=(Number(state.bank)||0)+badge.reward;stat(badge.rewardStat||'happiness',2);
 log('🏅','جمعت شارة '+badge.title,'حصلت على '+cash(badge.reward)+' بعد إكمال تحدي المهرجان.','good');
 if(badges.every(item=>event.claimed.includes(item.id))&&!event.bonusClaimed){event.bonusClaimed=true;state.bank+=9000;stat('happiness',4);log('🏆','اكتمل مهرجان صُنّاع الحكاية','جمعت كل الشارات الإحدى عشرة وحصلت على مكافأة ختامية '+cash(9000)+'.','special');}
 save();render();seasonalEventMenu();
}
function seasonalEventArchiveMenu(){
 const archive=normalizeSeasonalEventArchive(state&&state.seasonalEventArchive);
 const badgeNames={chapter:'فصل جديد',friend:'صاحب جديد',hobby:'موهبة بتكبر',voice:'صوتك وصل',learning:'عقل بيتفتح',balance:'توازن جميل',career:'خطوة لقدّام',asset:'أصل جديد',invest:'عقلية استثمار',pet:'رفيق جديد',travel:'اكتشاف جديد',family:'رابطة أقوى'};
 const opts=archive.map(item=>choice('📜','موسم '+item.weekId,'جمعت '+item.claimed.length+' شارات'+(item.bonusClaimed?' · أكملت المهرجان':' · لم تكتمل كل الشارات'),()=>{closeModal();info('📜','موسم '+item.weekId,'الشارات المحفوظة: '+(item.claimed.map(id=>badgeNames[id]||'شارة').join('، ')||'لا توجد')+'.');}));
 if(!opts.length)opts.push({icon:'📚',title:'لا توجد مواسم سابقة',desc:'سيظهر سجل الموسم بعد انتقال الأسبوع التالي.',disabled:true});
 opts.push(choice('↩️','العودة للمهرجان الحالي','',seasonalEventMenu));
 modal('📚','سجل المواسم السابقة','ملخص آخر ثمانية مواسم محفوظة داخل هذه الحياة.',opts);
}
function ensureDailyChallengeBoard(){
 if(!state)return null;
 const now=new Date(),today=challengeDateKey(now),old=state.dailyChallenges&&typeof state.dailyChallenges==='object'?state.dailyChallenges:null;
 if(!old||old.date!==today||!Array.isArray(old.ids)||old.ids.length!==3||!Array.isArray(old.claimed)){
  if(old&&old.date!==today&&Array.isArray(old.ids)&&perkOwned('challengeVault')){
   if(!Array.isArray(state.challengeArchive))state.challengeArchive=[];
   if(!state.challengeArchive.some(item=>item&&item.date===old.date)){
    state.challengeArchive.unshift({date:old.date,ids:old.ids.slice(0,3),claimed:Array.isArray(old.claimed)?old.claimed.slice(0,3):[],vaultClaimed:[],streak:Number(old.streak)||0});
    state.challengeArchive=state.challengeArchive.slice(0,60);
   }
  }
  const eligible=dailyChallengeDefs.filter(c=>c.available(state));
  for(let i=eligible.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[eligible[i],eligible[j]]=[eligible[j],eligible[i]];}
  const yesterday=challengeYesterdayKey(now);
  let streak=old&&old.lastCompletionDate===yesterday?Number(old.streak)||0:0;
  let streakSaved=false;
  const twoDaysAgo=challengeYesterdayKey(new Date(now.getTime()-86400000));
  if(!streak&&old&&(Number(old.streak)||0)>0&&old.lastCompletionDate===twoDaysAgo&&(permanentPerks.streakSavers||0)>0){
   streak=Number(old.streak)||0;streakSaved=true;permanentPerks.streakSavers--;persistPermanentPerks();
  }
  state.dailyChallenges={date:today,ids:eligible.slice(0,3).map(c=>c.id),claimed:[],streak,lastCompletionDate:old&&old.lastCompletionDate||null,streakSaved};
  if(streakSaved)log('🛡️','حماية سلسلة الإنجاز','استخدمت حماية تلقائية واحدة للحفاظ على سلسلة '+streak+' يومًا بعد تفويت يوم واحد. المتبقي '+permanentPerks.streakSavers+'.','special');
  save();
 }
 return state.dailyChallenges;
}

function dailyChallengesMenu(){
 if(!validState())return;
 const board=ensureDailyChallengeBoard();
 const completed=board.claimed.length;
 const opts=board.ids.map(id=>{
  const c=dailyChallengeDefs.find(x=>x.id===id);
  if(!c)return null;
  const done=!!c.done(state),claimed=board.claimed.includes(id);
  const status=claimed?'تم استلام المكافأة':(done?'اكتملت — استلم مكافأتك':'لم تكتمل بعد');
  return choice(claimed?'✅':(done?'🎁':'🎯'),c.title,c.desc+' الحالة: '+status+'. المكافأة: '+cash(c.reward)+'.',()=>{
   if(claimed){closeModal();info('✅','المهمة مكتملة','استلمت مكافأة هذه المهمة بالفعل.');return;}
   if(!c.done(state)){closeModal();info('🎯','كمّل المهمة الأول',c.desc+' وبعدها ارجع هنا لاستلام المكافأة.');return;}
   claimDailyChallenge(id);
  });
 }).filter(Boolean);
 opts.unshift(choice('🔥','سلسلة الإنجاز','أكملت '+completed+' من 3 مهام اليوم. سلسلة الأيام الكاملة: '+(board.streak||0)+'. حماة السلسلة المتاحة: '+(permanentPerks.streakSavers||0)+(board.streakSaved?' · تم إنقاذها اليوم':''),()=>{closeModal();info('🔥','سلسلة الإنجاز','استكمل المهام الثلاث في اليوم نفسه. حماية السلسلة لا تعمل إلا عند تفويت يوم واحد متتالٍ. المتبقي '+(permanentPerks.streakSavers||0)+'.');}));
 if(perkOwned('challengeVault'))opts.unshift(choice('🗄️','خزنة التحديات السابقة','راجع الأيام السابقة وأكمل شروط المهام غير المستلمة بمكافأة مخفضة.',challengeVaultMenu));
 modal('🎯','تحديات اليوم','ثلاث مهام متجددة كل يوم، بمكافآت داخل اللعبة. تقدمك يُحفظ مع الحياة الحالية.',opts);
}
function claimDailyChallenge(id){
 if(!validState())return;
 const board=ensureDailyChallengeBoard(),c=dailyChallengeDefs.find(x=>x.id===id);
 if(!c||!board.ids.includes(id)||board.claimed.includes(id)||!c.done(state)){closeModal();info('🎯','المهمة غير جاهزة','تأكد من شروط المهمة قبل المطالبة بالمكافأة.');return;}
 closeModal();
 board.claimed.push(id);state.bank=(state.bank||0)+c.reward;stat(c.rewardStat||'happiness',3);
 log('🎯','مكافأة تحدي يومي','أكملت مهمة «'+c.title+'» وحصلت على '+cash(c.reward)+'.','good');
 achievement('أكملت تحديًا يوميًا');
 if(board.claimed.length===board.ids.length){
  const now=new Date(),today=challengeDateKey(now),yesterday=challengeYesterdayKey(now);
  board.streak=board.lastCompletionDate===yesterday?(Number(board.streak)||0)+1:1;
  board.lastCompletionDate=today;
  const bonus=2500+Math.min(10,board.streak)*250;state.bank+=bonus;
  log('🏆','اكتملت تحديات اليوم','أنهيت المهام الثلاث وحصلت على مكافأة إضافية '+cash(bonus)+'. سلسلة الإنجاز: '+board.streak+' يوم.','special');
 }
 save();render();dailyChallengesMenu();
}

function heirloomCollectionMenu(){
 state.heirlooms=normalizeHeirlooms(state.heirlooms,state.age);
 const items=state.heirlooms.slice().sort((a,b)=>(Number(b.value)||0)-(Number(a.value)||0));
 const total=items.reduce((sum,item)=>sum+(Number(item.value)||0),0);
 const opts=items.map(item=>choice(item.emoji||'🏺',item.name,
  heirloomRarity(item.value)+' · القيمة التقديرية '+cash(item.value)+' · عُثر عليها في عمر '+fmt(item.age),
  ()=>heirloomDetailMenu(item.id)));
 if(!opts.length)opts.push(choice('🌱','لسه مفيش مقتنيات','استلم مكافأة اليوم أو اكتشف قطعًا نادرة خلال رحلتك.',closeModal));
 opts.push(choice('↩️','رجوع للإنجازات','',achievementsMenu));
 modal('🏺','مقتنياتي الموروثة','عدد القطع '+items.length+' · القيمة التقديرية '+cash(total)+'. اختار قطعة لمراجعة تفاصيلها أو بيعها.',opts);
}
function heirloomDetailMenu(id){
 const item=(state.heirlooms||[]).find(entry=>entry&&entry.id===id);
 if(!item){closeModal();heirloomCollectionMenu();return;}
 const payout=Math.max(0,Math.round((Number(item.value)||0)*.85));
 const displayed=!!(state.museum&&Array.isArray(state.museum.displayed)&&state.museum.displayed.includes(item.name));
 const opts=[
  choice('💰','بيع المقتنى','تحصل على 85% من القيمة التقديرية: '+cash(payout)+'.'+(displayed?' ستُزال القطعة من عرض المتحف إذا لم يتبق منها نسخة أخرى.':''),()=>sellHeirloom(item.id),cash(payout)),
  choice('↩️','رجوع للمقتنيات','',heirloomCollectionMenu)
 ];
 modal(item.emoji||'🏺',item.name,heirloomRarity(item.value)+' · '+heirloomKindLabel(item)+' · القيمة التقديرية '+cash(item.value)+' · عُثر عليها في عمر '+fmt(item.age)+'.',opts);
}
function sellHeirloom(id){
 const index=(state.heirlooms||[]).findIndex(item=>item&&item.id===id);
 if(index<0){closeModal();info('🏺','المقتنى غير موجود','يمكن أن تكون القطعة قد بيعت بالفعل.');return;}
 const item=state.heirlooms[index],payout=Math.max(0,Math.round((Number(item.value)||0)*.85));
 state.heirlooms.splice(index,1);
 if(state.museum&&Array.isArray(state.museum.displayed)&&!state.heirlooms.some(entry=>entry&&entry.name===item.name)){
  state.museum.displayed=state.museum.displayed.filter(name=>name!==item.name);
 }
 state.bank=(Number(state.bank)||0)+payout;
 log('💰','بيع مقتنى موروث','بعت '+item.name+' مقابل '+cash(payout)+'.','good');
 save();render();heirloomCollectionMenu();
}

function achievementsMenu(){
 const opts=(state.accomplishments||[]).slice().reverse().map(a=>choice('🏆',a,'إنجاز مسجل في هذه الحياة.',()=>{closeModal();info('🏆',a,'ده واحد من إنجازات رحلتك الحالية.');}));
 if(!opts.length)opts.push(choice('🌱','لسه مفيش إنجازات','تقدم بالعمر وجرّب أنظمة اللعبة المختلفة.',closeModal));
 opts.unshift(choice('🎁','مكافأة اليوم','مكافأة مرة كل يوم مع احتمال مقتنى موروث.',dailyReward));
 opts.unshift(choice('🏅','شريط حياتك','تصنيف ختامي يعتمد على إنجازاتك.',()=>{closeModal();info('🏅','شريط الحياة',lifeRibbon()+'. هيتسجل التصنيف النهائي عند نهاية الرحلة.');}));
 opts.unshift(choice('🎯','تحديات اليوم','أنجز مهام قصيرة واحصل على مكافآت يومية.',dailyChallengesMenu));
 opts.unshift(choice('🪦','المقبرة والحيوات السابقة','راجع ملخصات الشخصيات التي انتهت حياتها على هذا الجهاز.',cemeteryMenu));
 opts.unshift(choice('🏺','مقتنياتي الموروثة','راجع القطع التي جمعتها أو بع قطعة لم تعد تحتاجها.',heirloomCollectionMenu));
 modal('🏆','الإنجازات والمقتنيات','إنجازاتك بتتراكم خلال الحياة. المقتنيات النادرة ممكن تصبح إرثًا للأجيال القادمة.',opts);
}
function lifeRibbon(){
 if(state.fame>=80)return 'نجم مشهور';if(state.crimeRecord>=4)return 'حياة إجرامية';if(state.bank>10000000)return 'ثروة استثنائية';if(state.children.length>=4)return 'أسرة كبيرة';if(state.job&&state.education.level>=4)return 'مسار مهني ناجح';if(state.age>=85)return 'عمر مديد';if(state.stats.happiness>=80)return 'حياة سعيدة';return 'حياة عادية';
}
function newLifeSetup(){
 modal('🌱','ابدأ حياة جديدة','كل حياة لها بداية مختلفة. تقدر تبدأ بشكل عشوائي أو تختار النوع وبلد الميلاد.',[
  choice('🎲','حياة عشوائية','اسم وجنس وبلد وعائلة عشوائيين.',()=>{closeModal();startNew();}),
  choice('🪪','تخصيص البداية','اختيار النوع وبلد الميلاد، مع إمكانية تعديل الاسم.',()=>{closeModal();chooseStartGender();}),
  choice('↩️','أكمل حياتي الحالية','إلغاء والرجوع للحياة الحالية.',closeModal)
 ]);
}
function chooseStartGender(){
 modal('👤','اختيار الشخصية','اختار نوع الشخصية اللي تحب تبدأ بيها.',[
  choice('👦','ذكر','اسم وشخصية ذكر.',()=>{closeModal();chooseBirthCountry('male');}),
  choice('👧','أنثى','اسم وشخصية أنثى.',()=>{closeModal();chooseBirthCountry('female');})
 ]);
}
function chooseBirthCountry(gender){
 const opts=places.map(p=>choice(p.flag,p.country,'مدينة البداية: '+p.city+' · رصيد بداية '+fmt(p.start)+' '+p.unit,()=>createLifeConfigured(gender,p)));
 modal('🌍','بلد الميلاد','البلد هتحدد المدينة والعملة ورصيد البداية.',opts);
}
function createLifeConfigured(gender,place){
 closeModal();if(state&&(Number(state.age)>0||state.status==='متوفى')&&!archiveLife('اختيار حياة جديدة')){info('⚠️','الحياة السابقة لم تُحفظ','لم نبدأ حياة جديدة حتى لا نفقد ملخص حياتك الحالية. صدّر نسخة احتياطية كاملة، وفّر مساحة تخزين ثم حاول مرة أخرى.');return;}state=newLife();dead=false;state.gender=gender;state.name=pick(names[gender])+' '+pick(names.family);state.place={...place};state.bank=place.start;
 if(typeof prompt==='function'){const name=prompt('اكتب اسم الشخصية (اختياري)',state.name);if(name&&name.trim())state.name=name.trim().slice(0,50);}
 log('👶','أول يوم في الدنيا','اتولدت في '+state.place.city+'، '+state.place.country+'. بدأت حكايتك بعائلة وظروف مختلفة، وكل سنة هتفتح قدامك اختيارات جديدة.','special');
 log('🏡','البيت والعيلة','أبوك '+state.family[0].name+' وأمك '+state.family[1].name+' هما أول شبكة أمان ليك.');achievement('بدأت رحلة الحياة');render();
}
function normalizeCemetery(raw){
 if(!Array.isArray(raw))return [];
 const seen=new Set();
 return raw.filter(item=>item&&typeof item==='object'&&!Array.isArray(item)).slice(0,100).map((item,index)=>{
  const name=typeof item.name==='string'?item.name.trim().slice(0,80):'';
  if(!name)return null;
  let id=String(item.id||('legacy-life-'+index)).trim().slice(0,80);
  if(!id)id='legacy-life-'+index;
  if(seen.has(id))id=id+'-'+index;
  seen.add(id);
  const age=Number(item.age),netWorth=Number(item.netWorth),children=Number(item.children);
  return {
   id,name,
   age:Number.isFinite(age)?Math.max(0,Math.min(150,Math.floor(age))):0,
   cause:typeof item.cause==='string'?item.cause.slice(0,160):'نهاية الرحلة',
   netWorth:Number.isFinite(netWorth)?Math.max(-1000000000000,Math.min(1000000000000,Math.round(netWorth))):0,
   ribbon:typeof item.ribbon==='string'?item.ribbon.slice(0,80):'حياة سابقة',
   country:typeof item.country==='string'?item.country.slice(0,80):'',
   accomplishments:Array.isArray(item.accomplishments)?item.accomplishments.filter(value=>typeof value==='string').slice(0,40).map(value=>value.slice(0,120)):[],
   children:Number.isFinite(children)?Math.max(0,Math.min(100,Math.floor(children))):0,
   createdAt:typeof item.createdAt==='string'?item.createdAt.slice(0,40):''
  };
 }).filter(Boolean);
}
function archiveLife(reason){
 if(!state)return false;
 try{
  // Do not trust the old cemeterySaved flag by itself: earlier storage failures
  // could set it even when the archive entry was never written.
  const raw=localStorage.getItem(CEMETERY_KEY);
  const parsed=raw===null?[]:JSON.parse(raw);
  if(!Array.isArray(parsed))throw new Error('invalid-cemetery');
  const list=normalizeCemetery(parsed),id=state.lifeId||('life-'+Date.now());
  if(list.some(item=>String(item.id)===String(id))){
   state.cemeterySaved=true;
   return true;
  }
  const assets=(state.assets||[]).reduce((n,a)=>n+(a.value||0),0),invest=(state.investments||[]).reduce((n,a)=>n+(a.value||0),0);
  const entry={id,name:state.name,age:state.age,cause:state.cause||reason||'نهاية الرحلة',netWorth:(state.bank||0)+assets+invest-(state.debt||0),ribbon:reason&&state.status==='حي'?'حياة متروكة · '+lifeRibbon():lifeRibbon(),country:state.place?.country||'',accomplishments:(state.accomplishments||[]).slice(0,40),children:(state.children||[]).length,createdAt:new Date().toISOString()};
  const nextList=[entry,...list].slice(0,100);
  localStorage.setItem(CEMETERY_KEY,JSON.stringify(nextList));
  const persistedRaw=localStorage.getItem(CEMETERY_KEY);
  const persisted=persistedRaw?JSON.parse(persistedRaw):null;
  if(!Array.isArray(persisted)||!persisted.some(item=>item&&String(item.id)===String(id)))throw new Error('cemetery-write-unverified');
  state.cemeterySaved=true;
  return true;
 }catch(e){
  state.cemeterySaved=false;
  return false;
 }
}
function cemeteryMenu(){
 let list=[];try{list=JSON.parse(localStorage.getItem(CEMETERY_KEY)||'[]');}catch(e){}
 const opts=list.map((l,i)=>choice('🪦',l.name+' · '+l.age+' سنة',l.country+' · '+l.ribbon+' · الثروة '+cash(l.netWorth),()=>{closeModal();info('🪦','حياة سابقة: '+l.name,'عاش '+l.age+' سنة. سبب النهاية: '+l.cause+'. شريط الحياة: '+l.ribbon+'. الإنجازات المسجلة: '+(l.accomplishments||[]).join('، ')+'.');}));
 if(!opts.length)opts.push(choice('🌱','لا توجد حيوات سابقة','عند انتهاء حياة شخصية، هتظهر هنا على نفس الجهاز.',closeModal));
 modal('🪦','المقبرة والحيوات السابقة','سجل محلي لأهم ملخصات الحيوات المنتهية، محفوظ على نفس المتصفح.',opts);
}

function editCharacterTraits(){
 const rows=[['health','الصحة','❤️'],['happiness','السعادة','😄'],['smart','الذكاء','🧠'],['looks','المظهر','😎']];
 const opts=rows.map(([key,label,icon])=>choice(icon,label+' · '+clamp(state.stats[key])+'%', 'تعديل مستوى '+label+' من 0 إلى 100.',()=>editCharacterTrait(key,label)));
 modal('🧬','محرر سمات الشخصية','وضع تخصيص اختياري لتجربة أنماط حياة مختلفة. التغييرات تؤثر على المحاكاة الحالية.',opts);
}
function editCharacterTrait(key,label){
 const levels=[100,80,60,40,20,0];
 const opts=levels.map(value=>choice(value===100?'💯':value>=70?'⬆️':value<=30?'⬇️':'⚖️',value+'%', 'ضبط '+label+' عند '+value+'%.',()=>{
  closeModal();state.stats[key]=clamp(value);log('🧬','تعديل سمات الشخصية','تم ضبط '+label+' عند '+value+'% باستخدام محرر الشخصية.','special');save();render();editCharacterTraits();
 }));
 modal('🧬',label+' · '+clamp(state.stats[key])+'%','اختار قيمة جديدة. ده وضع تخصيص اختياري وليس نتيجة عشوائية من أحداث الحياة.',opts);
}
function editNpcMenu(){
 const people=[];
 (state.family||[]).filter(n=>!n.deceased).forEach(n=>people.push(n));
 (state.friends||[]).forEach(n=>people.push(n));
 (state.children||[]).forEach(n=>people.push(n));
 if(state.partner)people.push(state.partner);
 const opts=people.map(n=>choice(n.emoji||'👤',(n.name||'شخص')+' · '+(n.relation||'شخص'), 'تعديل السمات المخفية وقوة العلاقة للشخصية دي.',()=>editNpcTraits(n)));
 if(!opts.length)opts.push(choice('👥','لا توجد شخصيات متاحة','كوّن علاقة أو تعرّف على صديق الأول.',closeModal));
 modal('👥','محرر الشخصيات','اختار فردًا من العائلة أو صديقًا أو الشريك لتعديل سماته داخل وضع التخصيص.',opts);
}
function editNpcTraits(n){
 const props=[['relationshipLevel','قوة العلاقة','❤️'],['generosity','الكرم','🎁'],['craziness','الاندفاع','⚡'],['money','الوضع المالي','💰'],['petulance','العناد','😤'],['loyalty','الوفاء','🤝'],['jealousy','الغيرة','👁️'],['reliability','الاعتمادية','🧱']];
 const opts=props.map(([key,label,icon])=>choice(icon,label+' · '+clamp(n[key]??50)+'%', 'اختار قيمة جديدة لصفة '+label+'.',()=>editNpcTraitLevel(n,key,label)));
 opts.unshift(choice(n.emoji||'👤','رجوع لقائمة الشخصيات','اختار شخصية تانية.',editNpcMenu));
 modal('🧬',(n.name||'شخص')+' · محرر السمات','الصفات دي بتأثر على انطباعك عن الشخصية وتفاعل العلاقة داخل اللعبة.',opts);
}
function editNpcTraitLevel(n,key,label){
 const levels=[100,80,60,40,20,0];
 const opts=levels.map(value=>choice(value===100?'💯':value>=70?'⬆️':value<=30?'⬇️':'⚖️',value+'%', 'ضبط '+label+' عند '+value+'%.',()=>{
  closeModal();n[key]=clamp(value);log('🧬','تعديل شخصية','تم تعديل '+label+' لدى '+(n.name||'الشخصية')+' إلى '+value+'%.','special');save();render();editNpcTraits(n);
 }));
 modal('🧬',label+' · '+clamp(n[key]??50)+'%','اختار المستوى الجديد.',opts);
}
function challengeVaultMenu(){
 if(!perkOwned('challengeVault')){closeModal();info('🗄️','الخزنة مقفولة','افتح خزنة التحديات من متجر مزايا حياة.');return;}
 const archive=Array.isArray(state.challengeArchive)?state.challengeArchive:[];
 const opts=archive.slice(0,30).map(entry=>choice('📅','تحديات '+entry.date,'مهام محفوظة: '+entry.ids.length+' · مكافآت أصلية مستلمة: '+(entry.claimed||[]).length+' · السلسلة وقتها: '+(entry.streak||0)+'.',()=>challengeArchiveDay(entry.date)));
 if(!opts.length)opts.push(choice('🗄️','لسه مفيش أيام محفوظة','الأيام الجديدة هتظهر هنا تلقائيًا من بكرة بعد فتح الخزنة.',()=>{closeModal();info('🗄️','الخزنة جاهزة','أكمل يومًا أو أكثر، وبعد تغيّر اليوم هتلاقي التحديات القديمة هنا.');}));
 opts.push(choice('↩️','رجوع للمزايا','',premiumPerksMenu));
 modal('🗄️','خزنة التحديات','تحتفظ اللعبة بآخر 60 يومًا على الأكثر. يمكن استلام مكافأة استرجاع مرة واحدة لكل مهمة محفوظة، بقيمة 60% من المكافأة الأصلية.',opts);
}
function challengeArchiveDay(date){
 const entry=(state.challengeArchive||[]).find(item=>item&&item.date===date);
 if(!entry){closeModal();challengeVaultMenu();return;}
 if(!Array.isArray(entry.vaultClaimed))entry.vaultClaimed=[];
 const opts=(entry.ids||[]).map(id=>{
  const c=dailyChallengeDefs.find(item=>item.id===id);if(!c)return null;
  const original=(entry.claimed||[]).includes(id),replay=entry.vaultClaimed.includes(id),ready=!!c.done(state);
  return choice(original||replay?'✅':ready?'🎁':'🎯',c.title,original?'استلمت مكافأتها في يومها.':replay?'استلمت مكافأة الاسترجاع بالفعل.':c.desc+' الحالة الحالية: '+(ready?'الشروط متحققة':'الشروط غير متحققة')+'. مكافأة الاسترجاع '+cash(Math.round(c.reward*.6))+'.',()=>claimVaultChallenge(date,id));
 }).filter(Boolean);
 opts.push(choice('↩️','رجوع للخزنة','',challengeVaultMenu));
 modal('📅','تحديات '+date,'التحديات المحفوظة من هذا اليوم. المكافأة متاحة مرة واحدة إذا لم تكن استلمتها من قبل.',opts);
}
function claimVaultChallenge(date,id){
 const entry=(state.challengeArchive||[]).find(item=>item&&item.date===date),c=dailyChallengeDefs.find(item=>item.id===id);
 if(!entry||!c){closeModal();info('🗄️','المهمة غير موجودة','تعذر العثور على التحدي المحفوظ.');return;}
 if(!Array.isArray(entry.vaultClaimed))entry.vaultClaimed=[];
 if((entry.claimed||[]).includes(id)||entry.vaultClaimed.includes(id)){closeModal();info('✅','المكافأة مستلمة','المهمة دي مش متاحة لمكافأة إضافية.');return;}
 if(!c.done(state)){closeModal();info('🎯','الشروط لسه مش متحققة',c.desc);return;}
 const reward=Math.round(c.reward*.6);entry.vaultClaimed.push(id);state.bank+=reward;stat(c.rewardStat||'happiness',2);
 log('🗄️','مكافأة من خزنة التحديات','استعدت مهمة «'+c.title+'» من '+date+' وحصلت على '+cash(reward)+'.','good');
 save();render();challengeArchiveDay(date);
}
function actorPackMenu(){
 if(!perkOwned('actorPack')){closeModal();info('🎬','حزمة التمثيل مقفولة','تقدر تفتحها من متجر مزايا حياة.');return;}
 const opts=[];
 if(state.specialCareer&&state.specialCareer.id==='actor'){
  opts.push(choice('🎟️','اختبار أداء متقدم','اختبار فرصة تمثيل مع مكافآت خبرة وشهرة.',tryAudition));
  opts.push(choice('📺','تصوير إعلان مدفوع','فرصة عمل إضافية في مسيرة التمثيل.',actorCommercialGig));
  opts.push(choice('🤝',state.specialCareer.agent?'إنهاء عقد الوكيل':'تعيين وكيل أعمال',state.specialCareer.agent?'إدارة المسيرة بدون وكيل.':'وكيل الأعمال يرفع فرصة النجاح في اختبارات الأداء، بتكلفة لمرة واحدة.',actorAgent));
 }else{
  opts.push(choice('🎭','ابدأ مسيرة التمثيل','يتطلب عمر 16 سنة ومظهرًا 50% على الأقل.',()=>startSpecialCareer({id:'actor',title:'التمثيل',emoji:'🎬',min:16,looks:50,income:14000,desc:'اختبارات أداء وأدوار قد ترفع شهرتك.'})));
 }
 opts.push(choice('🌟','كل المهن الخاصة','ارجع لقائمة المسارات المهنية.',specialCareers),choice('↩️','رجوع للمزايا','',premiumPerksMenu));
 modal('🎬','حزمة التمثيل الاحترافية','فرص إضافية أصلية لمسيرة الممثل، مع وكيل أعمال وعقود إعلانية.',opts);
}
function actorAgent(){
 closeModal();if(!state.specialCareer||state.specialCareer.id!=='actor'){actorPackMenu();return;}
 if(state.specialCareer.agent){state.specialCareer.agent=null;log('🤝','إنهاء عقد وكيل الأعمال','قررت إدارة مسيرتك الفنية بنفسك.');render();info('🎬','تم إنهاء العقد','يمكنك تعيين وكيل جديد لاحقًا.');return;}
 const cost=5000;if(state.bank<cost){info('💳','الرصيد مش كفاية','التعاقد مع وكيل أعمال يحتاج '+cash(cost)+'.');return;}
 state.bank-=cost;state.specialCareer.agent={signedAge:state.age,bonus:.12};
 log('🤝','تعيين وكيل أعمال','بدأ وكيل أعمال مساعدتك في الحصول على فرص تمثيل أفضل.','good');render();info('🎬','الوكيل جاهز','سترتفع فرصة نجاح اختبارات الأداء في مسيرة التمثيل.');
}
function actorCommercialGig(){
 closeModal();if(!state.specialCareer||state.specialCareer.id!=='actor'){actorPackMenu();return;}
 const cost=2500;if(state.bank<cost){info('💳','الرصيد مش كفاية','تجهيز إعلان تجاري يحتاج '+cash(cost)+'.');return;}
 state.bank-=cost;
 const agentBonus=state.specialCareer.agent?.bonus||0;
 const odds=Math.max(10,Math.min(88,Math.round(24+state.stats.looks*.34+state.stats.smart*.12+(state.fame||0)*.12+(state.specialCareer.level||1)*2+agentBonus*100)));
 const success=chance(odds/100),gain=success?Math.round((8000+Math.random()*22000+(state.fame||0)*90)*specialCareerIncomeMultiplier()):0;
 if(success){state.bank+=gain;state.fame=clamp((state.fame||0)+4+Math.floor(Math.random()*5));state.specialCareer.level=clamp((state.specialCareer.level||1)+1,1,100);}
 const record=state.specialCareer.record||(state.specialCareer.record={attempts:0,wins:0,losses:0,projects:0,totalEarnings:0,bestLevel:1});
 record.attempts=(record.attempts||0)+1;record.projects=(record.projects||0)+1;record.wins=(record.wins||0)+(success?1:0);record.losses=(record.losses||0)+(success?0:1);record.totalEarnings=(record.totalEarnings||0)+gain;record.bestLevel=Math.max(record.bestLevel||1,state.specialCareer.level||1);
 log(success?'📺':'🎬',success?'إعلان ناجح':'إعلان لم يحقق الانتشار','دفعت '+cash(cost)+(success?'، وكسبت '+cash(gain)+' وارتفعت شهرتك.':'، لكن الإعلان لم يحقق الانتشار المتوقع. راجع مهاراتك وحاول تاني.'),success?'good':'bad');
 save();render();info(success?'⭐':'🎬',success?'فرصة إعلانية ناجحة':'تجربة مهنية جديدة',success?'شهرتك الحالية '+state.fame+'%.':'التجارب غير الناجحة جزء من مسار المهنة.');
}
function bossModeMenu(){
 if(!perkOwned('bossMode')){closeModal();info('🧰','مركز المهن مقفول','افتحه من متجر مزايا حياة.');return;}
 const active=perkEnabled('bossMode');
 modal('🧰','مركز المهن الشامل','وصول سريع لمسارات المهن الخاصة، مع علاوة دخل 10% لهذه المسارات عند تفعيل المركز.',[
  choice(active?'🟢':'⚪',active?'إيقاف علاوة دخل المسارات':'تفعيل علاوة دخل المسارات','الحالة الحالية: '+(active?'مفعّلة':'متوقفة')+'.',()=>togglePremiumPerk('bossMode')),
  choice('🌟','استعراض جميع المهن الخاصة','التمثيل والموسيقى وصناعة المحتوى والرياضة والكتابة وغيرها.',specialCareers),
  choice('📚','تاريخ المهن السابقة','عرض المسارات التي أنهيتها ونتائجها.',specialCareerHistoryMenu),
  choice('↩️','رجوع للمزايا','',premiumPerksMenu)
 ]);
}
function timeMachineMenu(){
 if(!state||!Array.isArray(state.timeMachineSnapshots)||!state.timeMachineSnapshots.length){
  closeModal();info('⏳','الرجوع بالزمن','الميزة بتظهر بعد ما تتقدم سنة واحدة على الأقل في الحياة.');return;
 }
 const isDead=state.status==='متوفى',history=state.timeMachineSnapshots,opts=[];
 for(let index=history.length-1;index>=0;index--){
  try{
   const parsed=JSON.parse(history[index]),snap=parsed&&parsed.snapshotVersion===1?parsed.state:parsed;
   opts.push(choice('⏪','العودة إلى عمر '+fmt(snap.age)+' سنة','استرجاع حالة الحياة كما كانت قبل التقدم إلى السنة التالية. كل ما حدث بعدها سيتراجع.',()=>rewindToSnapshot(index)));
  }catch(e){}
 }
 opts.push(choice('↩️','رجوع','العودة للحياة الحالية دون تغيير.',()=>{closeModal();if(isDead)death(state.cause||'نهاية رحلة الحياة');}));
 modal('⏳','الرجوع بالزمن',perkOwned('expandedTime')?'ذاكرة الزمن الموسّعة تحفظ حتى 60 نقطة سنوية على هذا الجهاز، بحد آمن لحجم الحفظ.':'تقدر ترجع لواحدة من آخر 8 نقاط حفظ سنوية. افتح ذاكرة الزمن الموسّعة لزيادة العدد إلى 60.',opts);
}
function rewindToSnapshot(index){
 const history=Array.isArray(state.timeMachineSnapshots)?state.timeMachineSnapshots:[];
 if(index<0||index>=history.length){closeModal();info('⏳','نقطة الحفظ غير متاحة','اختار سنة ظاهرة في القائمة.');return;}
 const wasDead=state.status==='متوفى',currentAge=state.age,lifeId=state.lifeId;
 let restored,parsedSnapshot;
 try{parsedSnapshot=JSON.parse(history[index]);if(parsedSnapshot&&parsedSnapshot.snapshotVersion===1&&parsedSnapshot.state&&typeof parsedSnapshot.state==='object'){restored=parsedSnapshot.state;restored.log=Array.isArray(parsedSnapshot.logSnapshot)?parsedSnapshot.logSnapshot:(Array.isArray(state.log)?state.log.slice(0,Math.max(0,Number(parsedSnapshot.logLength)||0)):[]);}else{restored=parsedSnapshot;}}catch(e){closeModal();info('⚠️','تعذر الرجوع','نقطة الحفظ دي غير صالحة.');return;}
 if(wasDead){
  try{const list=JSON.parse(localStorage.getItem(CEMETERY_KEY)||'[]');localStorage.setItem(CEMETERY_KEY,JSON.stringify(list.filter(item=>item.id!==lifeId)));}catch(e){}
 }
 restored.timeMachineSnapshots=history.slice(0,index);
 restored.status='حي';restored.cause=null;restored.cemeterySaved=false;
 state=restored;dead=false;ensureGamingTalent();closeModal();
 log('⏳','رجوع بالزمن','رجعت من عمر '+currentAge+' إلى عمر '+state.age+'. مسار الحياة اتراجع، وتقدر تختار قرارات مختلفة من هنا.','special');
 achievement('استخدمت الرجوع بالزمن');save();render();
 info('⏳','تم الرجوع بالزمن','تم استرجاع الحياة عند عمر '+state.age+' سنة، مع استعادة حالة الشخصية في ذلك الوقت.');
}

function customizeMenu(){
 const opts=[
  choice('✍️','تغيير الاسم','اكتب اسم جديد للشخصية.',()=>{closeModal();if(typeof prompt!=='function'){info('✍️','تعديل الاسم','التعديل اليدوي غير متاح في بيئة الاختبار.');return;}const v=prompt('اكتب الاسم الجديد',state.name);if(v&&v.trim()){state.name=v.trim().slice(0,50);log('🪪','تغيير الاسم','أصبح اسمك '+state.name+'.','special');render();}}),
  choice('🎲','اسم عشوائي','اختيار اسم جديد من الأسماء المتاحة.',()=>{closeModal();state.name=pick(names[state.gender])+' '+pick(names.family);log('🪪','اسم جديد','اسم شخصيتك أصبح '+state.name+'.');render();}),
  choice('👤','تغيير نوع الشخصية','تغيير الصورة الرمزية ونوع الاسم العشوائي القادم.',()=>{closeModal();modal('👤','نوع الشخصية','تأكيد تغيير النوع الظاهر للشخصية.',[choice('👦','ذكر','',()=>{closeModal();state.gender='male';render();}),choice('👧','أنثى','',()=>{closeModal();state.gender='female';render();})]);}),
  choice('🧬','محرر سمات الشخصية','عدّل الصحة والسعادة والذكاء والمظهر في وضع التخصيص.',editCharacterTraits),
  choice('👥','محرر العائلة والأصدقاء','غيّر السمات المخفية وقوة العلاقة لشخصياتك.',editNpcMenu),
  choice('🚗','رخصة قيادة','اختبار بسيط للحصول على رخصة بعد سن 16.',()=>{closeModal();getLicense();}),
  choice('🌍','السفر والهجرة','تغيير بلد الإقامة أو السفر.',travelMenu),
  choice('⏳','الرجوع بالزمن','استرجع حالة الحياة من إحدى السنوات السابقة.',timeMachineMenu),
  choice('📤','تصدير الحفظ','نزّل نسخة كاملة تشمل الحياة والمقبرة والإعدادات والمزايا المملوكة.',exportSave),
  choice('📥','استيراد حفظ سابق','استرجع حزمة كاملة أو ملف حياة قديم بصيغة v1.',importSave)
 ];
 modal('🪪','ملف الشخصية','اسمك ومهاراتك وسجلك هي أجزاء من هويتك. غيّر الاسم أو جهّز مستقبلك.',opts);
}
function getLicense(){
 closeModal();
 if(state.age<16){info('🚗','لسه بدري','رخصة القيادة متاحة من سن 16.');return;}
 if(state.driversLicense){info('🚗','معاك رخصة بالفعل','تقدر تستخدمها كجزء من أحداث السفر والعمل.');return;}
 modal('🚗','رخصة القيادة','حان وقت اختبار القيادة. هل هتخوض الاختبار؟',[
  choice('🚘','خوض الاختبار','جاوب على سؤال عن علامة من علامات الطريق.',startDrivingTest),
  choice('⏳','مش دلوقتي','ممكن ترجع للاختبار في أي وقت بعد كده.',closeModal)
 ]);
}
function startDrivingTest(){
 const sign='<div class="road-sign-wrap" aria-label="علامة توقف"><div class="road-sign-stop"><span>قف</span></div></div>';
 modal('🚘','اختبار القيادة','علامة الطريق دي معناها إيه؟',[
  choice('✓','توقف تمامًا قبل الاستمرار','الإجابة الصحيحة.',()=>finishDrivingTest(true)),
  choice('↗','زود السرعة وعدّي بسرعة','',()=>finishDrivingTest(false)),
  choice('×','تجاهل العلامة لو الطريق فاضي','',()=>finishDrivingTest(false))
 ],false,sign);
}
function finishDrivingTest(passed){
 closeModal();
 if(passed){
  state.driversLicense=true;stat('happiness',2);achievement('الحصول على رخصة قيادة');log('🚗','نجحت في اختبار القيادة','اجتزت الاختبار وحصلت على رخصة قيادة.','good');render();
  info('🚘','اجتزت الاختبار!','مبروك! حصلت على رخصة القيادة، وده ممكن يفتح فرص جديدة في أحداث العمل والسفر.');
 }else{
  stat('happiness',-2);log('🚗','اختبار قيادة غير ناجح','ماعدّتش الاختبار المرة دي. راجع علامات الطريق وحاول تاني.','bad');render();
  info('🚘','ماعدّتش الاختبار','الإجابة الصحيحة كانت التوقف تمامًا قبل الاستمرار. تقدر تحاول مرة تانية.');
 }
}

function calculateInheritance(previous,share){
 const bank=Math.max(0,Number(previous&&previous.bank)||0);
 const assets=Array.isArray(previous&&previous.assets)?previous.assets:[];
 const investments=Array.isArray(previous&&previous.investments)?previous.investments:[];
 const valueOf=item=>Math.max(0,Number(item&&item.value)||0);
 const assetValue=assets.reduce((sum,item)=>sum+valueOf(item),0);
 const investmentValue=investments.reduce((sum,item)=>sum+valueOf(item),0);
 const gross=bank+assetValue+investmentValue;
 const debt=Math.max(0,Number(previous&&previous.debt)||0);
 const net=Math.max(0,gross-debt);
 const shareRate=Math.max(0,Math.min(1,Number(share)||0));
 const netRate=gross>0?net/gross:0;
 const factor=shareRate*netRate;
 const inheritedAssets=factor>0?assets.map(item=>({
  ...item,
  value:Math.round(valueOf(item)*factor),
  upkeep:Math.round(Math.max(0,Number(item&&item.upkeep)||0)*factor),
  id:Date.now()+Math.random()
 })):[];
 const inheritedInvestments=factor>0?investments.map(item=>({
  ...item,
  value:Math.round(valueOf(item)*factor),
  id:Date.now()+Math.random()
 })):[];
 const inheritedBank=Math.round(bank*factor);
 const inheritedValue=inheritedBank
  +inheritedAssets.reduce((sum,item)=>sum+valueOf(item),0)
  +inheritedInvestments.reduce((sum,item)=>sum+valueOf(item),0);
 return {value:inheritedValue,bank:inheritedBank,assets:inheritedAssets,investments:inheritedInvestments};
}
function startAsChild(index){
 if(!state||!Array.isArray(state.children)||!state.children[index])return;
 if(!archiveLife()){
  info('⚠️','الإرث لم يُحفظ بعد','تعذر حفظ ملخص حياة الوالد في المقبرة. لم ننقل الإرث حتى لا نفقد سجل الجيل السابق؛ صدّر نسخة احتياطية كاملة، وفّر مساحة ثم أعد المحاولة.');
  return;
 }
 const previous=state,child=previous.children[index],oldPartner=previous.partner;
 const share=previous.willDistribution==='الأبناء أولًا'?.9:previous.willDistribution==='الشريك أولًا'?.55:previous.willDistribution==='التبرع بجزء'?.65:.8;
 const inheritance=calculateInheritance(previous,share);
 const heir=newLife();ensureChildGrowthProfile(child);heir.name=child.name;heir.gender=child.gender||'male';heir.age=typeof child.age==='number'?child.age:18;heir.place={...previous.place};heir.bank=inheritance.bank;if(perkOwned('goldenPiggyBank'))heir.bank+=1000000;heir.stats={...heir.stats,health:clamp(child.health??heir.stats.health),happiness:clamp(child.happiness??heir.stats.happiness),smart:clamp(child.smart??heir.stats.smart),looks:clamp(child.looks??heir.stats.looks)};heir.reputation=clamp((Number(child.schoolPerformance)||50)*.35+(Number(child.careerPotential)||40)*.35+(Number(child.relationshipLevel)||50)*.3);
 heir.family=[...previous.family];previous.children.forEach((sibling,i)=>{if(i!==index)heir.family.push({...sibling,relation:'أخ/أخت'});});heir.partner=null;heir.married=false;heir.children=[];heir.legacy={name:previous.name,inheritance:inheritance.value,heirloom:(previous.heirlooms||[])[0]?.name||null};
 heir.heirlooms=[...(previous.heirlooms||[])];heir.accomplishments=['بدأ حياة جديدة كامتداد لعائلة '+previous.name,'ورث '+cash(inheritance.value)];
 heir.job=null;heir.assets=inheritance.assets;heir.investments=inheritance.investments;
 heir.family.push({id:'legacy-parent-'+Date.now(),name:previous.name,relation:'والد/والدة متوفى',emoji:previous.gender==='male'?'👨‍🦳':'👩‍🦳',age:previous.age,job:previous.job?previous.job.title:'متوفى',relationshipLevel:100,personality:'موروث عائلي'});if(oldPartner)heir.family.push({...oldPartner,relation:'الأم/الأب'});
 state=heir;dead=false;log('🌳','استمرار السلالة','بدأت حياة جديدة باسم '+state.name+'، وارثًا قصة '+previous.name+' وإرث العائلة.','special');render();closeModal();info('🌳','جيل جديد','ورثت ثروة تقديرية '+cash(inheritance.value)+' بعد احتساب الوصية والالتزامات. تبدأ الآن مرحلة مستقلة باختياراتك.');
}
function applyUiSettings(){
 const body=document.body;
 if(body&&body.classList){body.classList.toggle('theme-dark',uiSettings.theme==='dark');body.classList.toggle('theme-gold',uiSettings.theme==='gold');body.classList.toggle('text-large',uiSettings.textScale==='large');}
 if(typeof document.querySelector==='function'){const themeMeta=document.querySelector('meta[name="theme-color"]');if(themeMeta)themeMeta.setAttribute('content',uiSettings.theme==='dark'?'#17232c':uiSettings.theme==='gold'?'#c3982a':'#E53935');}
}

function normalizeUiSettings(raw){
 const defaults={theme:'light',textScale:'normal',sound:false,haptics:false,boosts:true,combatTimingAssist:false};
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return defaults;
 return {
  theme:['dark','light','gold'].includes(raw.theme)?raw.theme:defaults.theme,
  textScale:raw.textScale==='large'?'large':defaults.textScale,
  sound:typeof raw.sound==='boolean'?raw.sound:defaults.sound,
  haptics:typeof raw.haptics==='boolean'?raw.haptics:defaults.haptics,
  boosts:typeof raw.boosts==='boolean'?raw.boosts:defaults.boosts,
  combatTimingAssist:typeof raw.combatTimingAssist==='boolean'?raw.combatTimingAssist:defaults.combatTimingAssist
 };
}
function loadUiSettings(){
 try{uiSettings=normalizeUiSettings(JSON.parse(localStorage.getItem(SETTINGS_KEY)||'null'));}
 catch(e){uiSettings=normalizeUiSettings(null);}
 applyUiSettings();
}
function persistUiSettings(){
 try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(uiSettings));}catch(e){}
 applyUiSettings();
}
function playUiFeedback(kind='tap'){
 if(uiSettings.haptics&&typeof navigator!=='undefined'&&typeof navigator.vibrate==='function'){
  try{navigator.vibrate(kind==='year'?[18,24,18]:kind==='confirm'?16:9);}catch(e){}
 }
 if(!uiSettings.sound)return;
 try{
  const AudioContextType=typeof window!=='undefined'&&(window.AudioContext||window.webkitAudioContext);
  if(!AudioContextType)return;
  if(!uiAudioContext)uiAudioContext=new AudioContextType();
  const context=uiAudioContext;
  if(context.state==='suspended'&&typeof context.resume==='function'){
   const resumed=context.resume();
   if(resumed&&typeof resumed.catch==='function')resumed.catch(()=>{});
  }
  const now=Number(context.currentTime)||0;
  const oscillator=context.createOscillator(),gain=context.createGain();
  oscillator.type='sine';
  const base=kind==='year'?440:kind==='confirm'?660:520;
  oscillator.frequency.setValueAtTime(base,now);
  if(kind==='year')oscillator.frequency.exponentialRampToValueAtTime(660,now+.09);
  gain.gain.setValueAtTime(.0001,now);
  gain.gain.exponentialRampToValueAtTime(.025,now+.012);
  gain.gain.exponentialRampToValueAtTime(.0001,now+.13);
  oscillator.connect(gain);gain.connect(context.destination);
  oscillator.start(now);oscillator.stop(now+.14);
 }catch(e){}
}
function settingsMenu(){
 const opts=[
  choice(uiSettings.theme==='dark'?'☀️':'🌙',uiSettings.theme==='dark'?'تفعيل الوضع الفاتح':'تفعيل الوضع الداكن','المظهر الحالي: '+(uiSettings.theme==='dark'?'داكن':uiSettings.theme==='gold'?'ذهبي':'فاتح')+'.',()=>{uiSettings.theme=uiSettings.theme==='dark'?'light':'dark';persistUiSettings();settingsMenu();}),
  choice('🔤',uiSettings.textScale==='large'?'حجم النص: كبير':'حجم النص: عادي','كبّر نص سجل الأحداث والقرارات لسهولة القراءة.',()=>{uiSettings.textScale=uiSettings.textScale==='large'?'normal':'large';persistUiSettings();settingsMenu();}),
  choice(uiSettings.sound?'🔊':'🔇',uiSettings.sound?'الأصوات: مفعّلة':'الأصوات: متوقفة','نغمة قصيرة أصلية عند اختيار قرار أو التقدم سنة. لا تعمل إلا بعد تفعيلها.',()=>{uiSettings.sound=!uiSettings.sound;persistUiSettings();settingsMenu();}),
  choice(uiSettings.haptics?'📳':'📴',uiSettings.haptics?'الاهتزاز: مفعّل':'الاهتزاز: متوقف','اهتزاز خفيف عند القرارات والتقدم سنة، إذا كان المتصفح والجهاز يدعمانه.',()=>{uiSettings.haptics=!uiSettings.haptics;persistUiSettings();settingsMenu();}),
  choice(uiSettings.combatTimingAssist?'🧭':'⏱️',uiSettings.combatTimingAssist?'مساعدة توقيت القتال: مفعّلة':'مساعدة توقيت القتال: متوقفة','عند التفعيل لا تحتاج إلى استجابة سريعة؛ تحصل على مكافأة توقيت ثابتة قدرها 4 نقاط. يطبق الاختيار من الجولة التالية.',()=>{uiSettings.combatTimingAssist=!uiSettings.combatTimingAssist;persistUiSettings();settingsMenu();}),
  choice(uiSettings.boosts?'✨':'▫️',uiSettings.boosts?'فرص تحسين الإحصاءات: مفعّلة':'فرص تحسين الإحصاءات: متوقفة','تظهر فرصة واحدة في السنة عند انخفاض أحد الإحصاءات الأساسية، مع اختيار مجاني أو مدفوع.',()=>{uiSettings.boosts=!uiSettings.boosts;persistUiSettings();renderStats();settingsMenu();}),
  choice('↩️','استعادة إعدادات العرض الافتراضية','العودة للوضع الفاتح وحجم النص العادي وإيقاف الصوت والاهتزاز.',()=>{uiSettings={theme:'light',textScale:'normal',sound:false,haptics:false,boosts:true,combatTimingAssist:false};persistUiSettings();renderStats();settingsMenu();})
 ];
 if(perkOwned('goldTheme'))opts.push(choice(uiSettings.theme==='gold'?'⭐':'🌟',uiSettings.theme==='gold'?'إيقاف الطابع الذهبي':'تفعيل الطابع الذهبي','هوية لونية ذهبية أصلية للعبة حياة.',()=>togglePremiumPerk('goldTheme')));
 else opts.push(choice('⭐','الطابع الذهبي','افتحه من متجر مزايا حياة لتفعيله من هنا.',premiumPerksMenu));
 opts.push(choice('✨','متجر مزايا حياة','إدارة المزايا الدائمة.',premiumPerksMenu),choice('↩️','رجوع للقائمة الرئيسية','',mainMenu));
 modal('⚙️','إعدادات العرض','الإعدادات دي بتتخزن على الجهاز بشكل مستقل عن ملف حياتك، ومش بتغيّر صيغة الحفظ القديم.',opts);
}


function cultMenu(){
 if(!perkOwned('cultPack')){closeModal();info('🛕','توسعة المجتمع مقفولة','افتحها من متجر مزايا حياة.');return;}
 const c=state.cult||(state.cult={founded:false,name:'',doctrine:'',members:[],fund:0,ceremonies:0,discipline:50});
 if(!c.founded){
  modal('🛕','تأسيس مجتمعك','أنشئ مقرًا لمجتمعك الخيالي، وحدد مبادئه وابدأ بتجنيد الأعضاء.',[
   choice('🌱','مجتمع المعرفة','يركز على التعليم والتعاون؛ يجذب أعضاء أكثر استقرارًا.',()=>foundCult('المعرفة')),
   choice('🌿','مجتمع الطبيعة','يركز على الطبيعة والرعاية والأنشطة المشتركة.',()=>foundCult('الطبيعة')),
   choice('🎭','مجتمع الفن','يركز على الاحتفالات والأنشطة الإبداعية.',()=>foundCult('الفن')),
   choice('↩️','رجوع للمتجر','',premiumPerksMenu)
  ]);return;
 }
 const opts=[
  choice('👥','الأعضاء والتجنيد','الأعضاء '+c.members.length+' · الرصيد المجتمعي '+cash(c.fund)+'.',cultMembersMenu),
  choice('📦','نقل الأتباع إلى المقر','انقل الأعضاء الجدد من قائمة المنتظرين إلى المجتمع.',moveCultFollowers),
  choice('📜','القواعد والمبادئ','المبدأ الحالي: '+c.doctrine+'.',cultRulesMenu),
  choice('🎉','إقامة مراسم','تنظم اجتماعًا عامًا لرفع الروح المعنوية والتبرعات.',cultCeremonyMenu),
  choice('🧭','إدارة الانضباط','انضباط المجتمع '+c.discipline+'%. فرض قيود امتيازات رمزية له تبعات على الولاء.',cultDisciplineMenu),
  choice('💰','إدارة أموال المجتمع','رصيد المجتمع '+cash(c.fund)+' · تحويل الفائض لحسابك أو تمويل نشاط.',cultTreasuryMenu),
  choice('↩️','رجوع للأنشطة','',activities)
 ];
 modal('🛕',c.name,'مجتمع خيالي · المبدأ '+c.doctrine+' · الأعضاء '+c.members.length+' · المراسم '+c.ceremonies+'.',opts);
}
function foundCult(doctrine){
 closeModal();if(state.age<18){info('🔒','لسه بدري','تقدر تأسس مجتمعك من سن 18.');return;}
 const cost=60000;if(state.bank<cost){info('💳','الميزانية غير كافية','تجهيز المقر يحتاج '+cash(cost)+'.');return;}
 state.bank-=cost;state.cult={founded:true,name:'مجتمع '+doctrine,doctrine,members:[],fund:10000,ceremonies:0,discipline:65};
 log('🛕','تأسيس مجتمع جديد','أنشأت '+state.cult.name+' بعد استثمار '+cash(cost)+'. بدأ المجتمع برصيد تأسيسي '+cash(state.cult.fund)+'.','special');
 achievement('تأسيس مجتمع خيالي');save();render();cultMenu();
}
function cultMembersMenu(){
 closeModal();const c=state.cult;if(!c||!c.founded){cultMenu();return;}
 const opts=[
  choice('➕','تجنيد عضو واحد','التكلفة 2,000 '+state.place.unit+'.',()=>recruitCultMembers(1),'2,000 '+state.place.unit),
  choice('👥','تجنيد 3 أعضاء','التكلفة 5,000 '+state.place.unit+'.',()=>recruitCultMembers(3),'5,000 '+state.place.unit),
  choice('👥','تجنيد 5 أعضاء','التكلفة 8,000 '+state.place.unit+'.',()=>recruitCultMembers(5),'8,000 '+state.place.unit)
 ];
 c.members.forEach((m,i)=>opts.push(choice('🧑',m.name+' · '+m.role,'الولاء '+m.loyalty+'% · الحالة '+m.status+'.',()=>cultFollowerMenu(i),m.loyalty+'%',m.loyalty)));
 opts.push(choice('↩️','رجوع للمجتمع','',cultMenu));
 modal('👥','الأعضاء والتجنيد','عدد الأعضاء الحالي '+c.members.length+' من 100.',opts);
}
function recruitCultMembers(count){
 closeModal();const c=state.cult;if(!c||!c.founded)return;
 if(c.members.length+count>100){info('👥','وصلت للحد الأقصى','المجتمع يدعم حتى 100 عضو للحفاظ على الأداء على الهاتف.');return;}
 const cost=count===1?2000:count===3?5000:8000;if(state.bank<cost){info('💳','الرصيد مش كفاية','التجنيد يحتاج '+cash(cost)+'.');return;}
 state.bank-=cost;const first=c.members.length;
 for(let i=0;i<count;i++)c.members.push({id:Date.now()+Math.random()+i,name:pick(['أحمد','مريم','عمر','نور','يوسف','ليلى','كريم','سلمى','سيف','فريدة']),role:'عضو جديد',loyalty:45+Math.floor(Math.random()*30),status:'منتظر',joinedAge:state.age});
 log('👥','تجنيد أعضاء','انضم '+count+' أعضاء محتملين إلى قائمة الانتظار في '+c.name+'. انقلهم للمقر إذا كنت تريد ضمّهم.', 'good');
 save();render();cultMembersMenu();
}
function moveCultFollowers(){
 closeModal();const c=state.cult;if(!c||!c.founded)return;
 const waiting=c.members.map((m,i)=>({m,i})).filter(x=>x.m.status==='منتظر');
 if(!waiting.length){info('👥','مفيش أتباع منتظرين','جند أعضاء جدد أولًا من قائمة الأعضاء.');return;}
 modal('🏡','نقل الأتباع إلى المجتمع','نقل العضو يستهلك 500 من رصيد المجتمع للرعاية والتجهيز.',waiting.map(({m,i})=>choice('🏡',m.name,'الولاء '+m.loyalty+'%.',()=>{closeModal();if(c.fund<500){info('💳','صندوق المجتمع غير كافٍ','محتاج '+cash(500)+' في حساب المجتمع.');return;}c.fund-=500;m.status='داخل المجتمع';m.role='عضو';m.loyalty=clamp(m.loyalty+8);log('🏡','انتقل عضو إلى المقر','انتقل '+m.name+' إلى '+c.name+'.','good');save();render();cultMembersMenu();})) );
}
function cultFollowerMenu(index){
 const c=state.cult,m=c&&c.members[index];if(!m){cultMembersMenu();return;}
 modal('🧑',m.name,'الرتبة '+m.role+' · الحالة '+m.status+' · الولاء '+m.loyalty+'%.',[
  choice('🏡','نقله إلى المقر','نقل العضو إلى المجتمع.',()=>moveSingleCultFollower(index)),
  choice('🎓','تدريب قيادي','تكلفة 1,500 ترفع الولاء والقدرة على التنظيم.',()=>{closeModal();if(state.bank<1500){info('💳','الرصيد مش كفاية','التدريب يحتاج '+cash(1500)+'.');return;}state.bank-=1500;m.loyalty=clamp(m.loyalty+12);m.role='منظم';log('🎓','تدريب عضو','أصبح '+m.name+' منظمًا داخل المجتمع.','good');save();render();cultMembersMenu();},'1,500 '+state.place.unit),
  choice('⚖️','إجراء انضباط رمزي','تقليل امتيازات العضو لفترة؛ قد يتراجع ولاؤه.',()=>cultDisciplineFollower(index)),
  choice('↩️','رجوع للأعضاء','',cultMembersMenu)
 ]);
}
function moveSingleCultFollower(index){
 closeModal();const c=state.cult,m=c&&c.members[index];if(!m||m.status!=='منتظر'){cultMembersMenu();return;}
 if(c.fund<500){info('💳','صندوق المجتمع غير كافٍ','محتاج '+cash(500)+' في حساب المجتمع.');return;}
 c.fund-=500;m.status='داخل المجتمع';m.role='عضو';m.loyalty=clamp(m.loyalty+8);log('🏡','انتقل عضو إلى المقر','انتقل '+m.name+' إلى '+c.name+'.','good');save();render();cultMembersMenu();
}
function cultRulesMenu(){
 const c=state.cult;if(!c||!c.founded){cultMenu();return;}
 modal('📜','قواعد المجتمع','تغيير المبادئ يغيّر سهولة التجنيد وولاء الأعضاء.',[
  choice('📚','المعرفة والتعاون','زيادة ولاء الأعضاء عند التدريب.',()=>setCultDoctrine('المعرفة')),
  choice('🌿','الطبيعة والرعاية','تكاليف رعاية أقل قليلًا.',()=>setCultDoctrine('الطبيعة')),
  choice('🎭','الفن والمراسم','تأثير أكبر للمراسم على المعنويات.',()=>setCultDoctrine('الفن')),
  choice('↩️','رجوع','',cultMenu)
 ]);
}
function setCultDoctrine(doctrine){
 closeModal();const c=state.cult;if(!c||!c.founded)return;
 c.doctrine=doctrine;c.members.forEach(m=>{m.loyalty=clamp(m.loyalty+(doctrine==='المعرفة'?3:doctrine==='الطبيعة'?2:1));});
 log('📜','تحديث قواعد المجتمع','أصبحت مبادئ المجتمع '+doctrine+'.','good');save();render();cultMenu();
}
function cultCeremonyMenu(){
 const c=state.cult;if(!c||!c.founded){cultMenu();return;}
 modal('🎉','مراسم المجتمع','كل مراسم لها تكاليف تنظيمية وقد تجذب تبرعات من الحاضرين.',[
  choice('☕','لقاء مجتمعي','تكلفة 2,000 · معنويات أفضل وتبرعات صغيرة.',()=>holdCultCeremony('لقاء مجتمعي',2000,3500)),
  choice('🎨','مهرجان فني','تكلفة 6,000 · أثر أقوى عند اختيار مبدأ الفن.',()=>holdCultCeremony('مهرجان فني',6000,8500)),
  choice('🌿','يوم تطوعي','تكلفة 3,000 · يحسن السمعة ويزيد ولاء الأعضاء.',()=>holdCultCeremony('يوم تطوعي',3000,4800)),
  choice('↩️','رجوع','',cultMenu)
 ]);
}
function holdCultCeremony(title,cost,donation){
 closeModal();const c=state.cult;if(!c||!c.founded)return;
 if(state.bank<cost){info('💳','الميزانية غير كافية','تنظيم المراسم يحتاج '+cash(cost)+'.');return;}
 state.bank-=cost;const received=Math.round(donation*(.5+Math.random()*.8)+(c.doctrine==='الفن'&&title==='مهرجان فني'?2500:0));
 c.fund+=received;c.ceremonies++;c.members.forEach(m=>{if(m.status==='داخل المجتمع')m.loyalty=clamp(m.loyalty+(title==='يوم تطوعي'?8:5));});
 stat('happiness',3);log('🎉','إقامة '+title,'أنفقت '+cash(cost)+' وتلقى المجتمع تبرعات '+cash(received)+'.','good');save();render();cultMenu();
}
function cultDisciplineMenu(){
 const c=state.cult;if(!c||!c.founded){cultMenu();return;}
 const opts=c.members.filter(m=>m.status==='داخل المجتمع').map(m=>choice('⚖️',m.name,'الولاء '+m.loyalty+'% · فرض قيود امتيازات رمزية لفترة.',()=>cultDisciplineFollower(c.members.indexOf(m))));
 if(!opts.length)opts.push(choice('👥','لا يوجد أعضاء داخل المقر','انقل الأعضاء أولًا.',moveCultFollowers));
 opts.push(choice('↩️','رجوع','',cultMenu));modal('⚖️','إدارة الانضباط','استخدم الإجراءات الرمزية بحذر: قد ينخفض الولاء وسمعة المجتمع.',opts);
}
function cultDisciplineFollower(index){
 closeModal();const c=state.cult,m=c&&c.members[index];if(!m||m.status!=='داخل المجتمع'){cultMenu();return;}
 m.loyalty=clamp(m.loyalty-12);c.discipline=clamp(c.discipline+4);if(chance(.2)){m.status='غادر المجتمع';c.discipline=clamp(c.discipline-7);}
 state.reputation=clamp(state.reputation-2);log('⚖️','إجراء انضباط رمزي','اتخذت إجراءً تنظيميًا ضد '+m.name+'. الولاء الآن '+m.loyalty+'%، وقد يغادر العضو إذا شعر أن القواعد غير عادلة.','bad');save();render();cultMembersMenu();
}
function cultTreasuryMenu(){
 const c=state.cult;if(!c||!c.founded){cultMenu();return;}
 modal('💰','خزينة المجتمع','رصيد المجتمع '+cash(c.fund)+'.',[
  choice('💵','تحويل 5,000 لحسابك','لو صندوق المجتمع يسمح، اسحب جزءًا من الفائض.',()=>{closeModal();if(c.fund<5000){info('💳','الرصيد غير كافٍ','محتاج 5,000 في صندوق المجتمع.');return;}c.fund-=5000;state.bank+=5000;log('💵','تحويل من صندوق المجتمع','حوّلت '+cash(5000)+' لحسابك الشخصي.','');save();render();cultMenu();}),
  choice('🏗️','دعم المجتمع','تبرع بـ 3,000 لرفع الولاء وتحسين الاستقرار.',()=>{closeModal();if(state.bank<3000){info('💳','الرصيد مش كفاية','الدعم يحتاج '+cash(3000)+'.');return;}state.bank-=3000;c.fund+=3000;c.members.forEach(m=>m.loyalty=clamp(m.loyalty+2));log('🏗️','دعم المجتمع','أضفت '+cash(3000)+' لصندوق المجتمع.','good');save();render();cultMenu();},'3,000 '+state.place.unit),
  choice('↩️','رجوع','',cultMenu)
 ]);
}

const casinoGameCatalog=[
 {id:'roulette',title:'روليت',emoji:'🎡',cost:25000,desc:'جولة دوارة بنتائج عشوائية.'},
 {id:'blackjack',title:'بلاك جاك',emoji:'🂡',cost:30000,desc:'لعبة أوراق سريعة.'},
 {id:'slots',title:'ماكينات الحظ',emoji:'🎰',cost:22000,desc:'جولات قصيرة بنتائج متقلبة.'},
 {id:'poker',title:'بوكر تكساس',emoji:'🃏',cost:45000,desc:'منافسة أوراق افتراضية.'},
 {id:'dice',title:'النرد',emoji:'🎲',cost:12000,desc:'تحديات تعتمد على رمية افتراضية.'},
 {id:'bingo',title:'بينجو',emoji:'🎟️',cost:15000,desc:'جولة أرقام ترفيهية.'},
 {id:'wheel',title:'عجلة الجوائز',emoji:'🎁',cost:18000,desc:'عجلة مكافآت للزوار.'},
 {id:'race',title:'سباق افتراضي',emoji:'🏁',cost:35000,desc:'سباق خيالي قصير داخل الكازينو.'}
];
const casinoAmenities=[
 {id:'hotel',title:'فندق',emoji:'🏨',cost:90000},
 {id:'stage',title:'مسرح',emoji:'🎤',cost:65000},
 {id:'restaurant',title:'مطعم فاخر',emoji:'🍽️',cost:45000},
 {id:'lounge',title:'صالة كبار الزوار',emoji:'🥂',cost:55000},
 {id:'security',title:'نظام أمن',emoji:'🛡️',cost:35000}
];
function casinoMenu(){
 if(!perkOwned('casinoPack')){closeModal();info('🎰','توسعة الكازينو مقفولة','افتحها من متجر مزايا حياة.');return;}
 const c=state.casino||(state.casino={opened:false,games:[],amenities:[],celebrityHires:0,accessories:[],funds:0});
 if(!c.opened){modal('🎰','افتتاح الكازينو','الكازينو مشروع كبير. تكلفة الافتتاح 450,000 '+state.place.unit+'، ويتضمن التمويل الأولي 75,000 من أموال تشغيل الكازينو.',[
  choice('🏨','افتتاح وتجهيز','استثمار صافٍ 375,000 بعد التمويل التأسيسي.',openCasino,'375,000 '+state.place.unit),
  choice('↩️','رجوع','',premiumPerksMenu)
 ]);return;}
 modal('🎰','إدارة الكازينو','ألعاب مثبتة '+c.games.length+'/8 · المرافق '+c.amenities.length+'/5 · صندوق التشغيل '+cash(c.funds)+'.',[
  choice('🎲','تركيب ألعاب','اختار الألعاب التي تريد إضافتها للكازينو.',casinoInstallGames),
  choice('🏨','المرافق والخدمات','فندق ومسرح ومطعم وصالة وأمن.',casinoAmenitiesMenu),
  choice('🌟','استضافة مشاهير','اجذب زوارًا أكثر واستثمر في الترفيه.',hireCasinoCelebrity),
  choice('🎮','تجربة لعبة','اختبر جولة بأموال افتراضية داخل اللعبة واكسب إكسسوارات.',casinoPlayMenu),
  choice('🎁','إكسسوارات الكازينو','مقتنيات مفتوحة بعد الفوز في الألعاب.',casinoAccessoryMenu),
  choice('💰','تقرير الإيرادات','عرض دخل وتكاليف السنة الحالية.',casinoReport),
  choice('↩️','رجوع للأنشطة','',activities)
 ]);
}
function openCasino(){
 closeModal();if(!perkOwned('casinoPack'))return;const cost=375000;
 if(state.age<18){info('🔒','الافتتاح من سن 18','ابدأ مشروعك التجاري بعد سن 18.');return;}
 if(state.bank<cost){info('💳','الميزانية غير كافية','الافتتاح يحتاج '+cash(cost)+'.');return;}
 state.bank-=cost;state.casino={opened:true,games:[],amenities:[],celebrityHires:0,accessories:[],funds:75000};
 log('🎰','افتتاح كازينو','دفعت '+cash(cost)+' وبدأت بصندوق تشغيل '+cash(75000)+'. كل الألعاب تستخدم أموالًا افتراضية داخل اللعبة فقط.','special');achievement('افتتاح كازينو');save();render();casinoMenu();
}
function casinoInstallGames(){
 const c=state.casino;if(!c||!c.opened){casinoMenu();return;}
 const opts=casinoGameCatalog.filter(g=>!c.games.includes(g.id)).map(g=>choice(g.emoji,g.title,g.desc+' تكلفة التركيب '+cash(g.cost)+'.',()=>{closeModal();if(state.bank<g.cost){info('💳','الرصيد مش كفاية','تركيب اللعبة يحتاج '+cash(g.cost)+'.');return;}state.bank-=g.cost;c.games.push(g.id);log('🎰','تركيب لعبة','أضفت '+g.title+' إلى الكازينو.','good');save();render();casinoMenu();},cash(g.cost)));
 if(!opts.length)opts.push(choice('✅','كل الألعاب متاحة','تم تركيب الألعاب الثماني.',closeModal));
 opts.push(choice('↩️','رجوع','',casinoMenu));modal('🎲','تركيب الألعاب','تركيب الألعاب يفتحها لاختبارات افتراضية ويزيد زيارات الكازينو السنوية.',opts);
}
function casinoAmenitiesMenu(){
 const c=state.casino;if(!c||!c.opened){casinoMenu();return;}
 const opts=casinoAmenities.filter(a=>!c.amenities.includes(a.id)).map(a=>choice(a.emoji,a.title,'تكلفة الإنشاء '+cash(a.cost)+'.',()=>{closeModal();if(state.bank<a.cost){info('💳','الرصيد مش كفاية','المرفق يحتاج '+cash(a.cost)+'.');return;}state.bank-=a.cost;c.amenities.push(a.id);log('🏨','إضافة مرفق','أضفت '+a.title+' للكازينو.','good');save();render();casinoMenu();},cash(a.cost)));
 if(!opts.length)opts.push(choice('✅','كل المرافق جاهزة','اكتملت المرافق المتاحة.',closeModal));
 opts.push(choice('↩️','رجوع','',casinoMenu));modal('🏨','مرافق الكازينو','المرافق ترفع دخل الزوار، لكن بعضها يضيف تكلفة سنوية.',opts);
}
function hireCasinoCelebrity(){
 closeModal();const c=state.casino;if(!c||!c.opened){casinoMenu();return;}
 const cost=18000+((c.celebrityHires||0)*5000);if(state.bank<cost){info('💳','الرصيد مش كفاية','استضافة نجم خيالي تكلف '+cash(cost)+'.');return;}
 state.bank-=cost;c.celebrityHires++;state.fame=clamp(state.fame+4);log('🌟','ليلة مشاهير','استضفت فنانًا خياليًا مقابل '+cash(cost)+'. زادت شهرة الكازينو وجاذبيته.','good');save();render();casinoMenu();
}
function casinoPlayMenu(){
 const c=state.casino;if(!c||!c.opened){casinoMenu();return;}
 const games=casinoGameCatalog.filter(g=>c.games.includes(g.id));
 const opts=games.map(g=>choice(g.emoji,g.title,g.desc,()=>casinoBetMenu(g.id)));
 if(!opts.length)opts.push(choice('🎰','لا توجد ألعاب مثبتة','ركّب لعبة واحدة على الأقل قبل بدء جولة.',casinoInstallGames));
 opts.push(choice('↩️','رجوع','',casinoMenu));modal('🎮','تجربة لعبة افتراضية','جميع الرهانات نقاط نقدية افتراضية داخل اللعبة، ولا يوجد أي دفع حقيقي.',opts);
}
function casinoBetMenu(gameId){
 const g=casinoGameCatalog.find(x=>x.id===gameId);if(!g)return casinoPlayMenu();
 modal(g.emoji,g.title,'اختار مبلغًا افتراضيًا للجولة.',[
  choice('🪙','رهان 500','جولة بسيطة.',()=>casinoPlay(gameId,500)),
  choice('💵','رهان 2,000','جولة متوسطة.',()=>casinoPlay(gameId,2000)),
  choice('💎','رهان 5,000','جولة أعلى مخاطرة.',()=>casinoPlay(gameId,5000)),
  choice('↩️','رجوع','',casinoPlayMenu)
 ]);
}
function casinoPlay(gameId,bet){
 closeModal();const c=state.casino,g=casinoGameCatalog.find(x=>x.id===gameId);if(!c||!c.opened||!c.games.includes(gameId))return;
 if(state.bank<bet){info('💳','الرصيد مش كفاية','رصيدك لا يغطي الرهان الافتراضي '+cash(bet)+'.');return;}
 state.bank-=bet;const win=chance(gameId==='bingo'?.5:gameId==='roulette'?.34:gameId==='blackjack'?.43:gameId==='slots'?.25:gameId==='poker'?.32:.38);
 const payout=win?Math.round(bet*(gameId==='slots'?3:gameId==='roulette'?2.1:gameId==='poker'?2.5:1.9)):0;state.bank+=payout;
 if(win&&chance(.22)){const item=pick(['بطاقة ذهبية','تميمة نرد','كأس الروليت','وشاح الكازينو','عملة تذكارية']);c.accessories.push({id:Date.now()+Math.random(),name:item,game:g.title});}
 log(win?'🎉':'🎲','جولة '+g.title,win?'كسبت '+cash(payout)+' في المحاكاة الافتراضية.':'انتهت الجولة بخسارة '+cash(bet)+' من رصيد اللعبة.',''+(win?'good':'bad'));
 save();render();info(win?'🎉':'🎲',win?'جولة ناجحة':'جولة انتهت',win?'رصيد الجائزة '+cash(payout)+'. '+(c.accessories.length?'قد تفتح إكسسوارًا بعد بعض الانتصارات.':''):'تقدر تدير أموال الكازينو وتثبت ألعابًا أخرى.',[choice('🎮','جولة جديدة','',casinoPlayMenu),choice('↩️','إدارة الكازينو','',casinoMenu)]);
}
function casinoAccessoryMenu(){
 const c=state.casino;if(!c||!c.opened){casinoMenu();return;}
 const opts=(c.accessories||[]).map(a=>choice('🎁',a.name,'تم الحصول عليه من '+a.game+'.',()=>{closeModal();info('🎁',a.name,'إكسسوار تجميلي من مجموعة الكازينو داخل اللعبة.');}));
 if(!opts.length)opts.push(choice('🎲','لسه مفيش إكسسوارات','يمكن الحصول عليها من جولات الفوز.',casinoPlayMenu));
 opts.push(choice('↩️','رجوع','',casinoMenu));modal('🎁','إكسسوارات الكازينو','عدد الإكسسوارات '+c.accessories.length+'.',opts);
}
function casinoReport(){
 closeModal();const c=state.casino;if(!c||!c.opened)return;
 info('📊','تقرير الكازينو','ألعاب مثبتة '+c.games.length+'/8 · المرافق '+c.amenities.length+'/5 · استضافات المشاهير '+c.celebrityHires+' · صندوق التشغيل '+cash(c.funds)+'. دخل التشغيل يتأثر بالألعاب والمرافق والشهرة.');
}

function dealerMenu(){
 if(!perkOwned('dealerPack')){closeModal();info('🃏','حزمة التاجر مقفولة','افتحها من متجر مزايا حياة.');return;}
 const d=state.dealer||(state.dealer={joined:false,rank:0,rep:0,earnings:0,territory:1});
 const ranks=['مبتدئ','تاجر محلي','منسق شبكة','مدير منطقة','رئيس الشبكة'];
 if(!d.joined){modal('🃏','مسار التاجر الخيالي','مسار قصصي افتراضي عالي المخاطر، من دون تعليمات أو إرشادات واقعية. قراراته قد تسبب فقدان المال أو عقوبات قانونية داخل اللعبة.',[
  choice('🃏','ابدأ المسار','عمر 18 سنة فأكثر.',joinDealer),
  choice('↩️','رجوع للأنشطة','',activities)
 ]);return;}
 modal('🃏','مسار التاجر',ranks[d.rank]+' · السمعة '+d.rep+'% · نطاق الشبكة '+d.territory+' · إجمالي الأرباح '+cash(d.earnings)+'.',[
  choice('📦','مهمة شبكة افتراضية','مهمة سردية تعتمد على الحظ والمهارات.',dealerMission),
  choice('🧭','توسيع النطاق','استثمار 12,000 لزيادة نطاق العمل الافتراضي.',expandDealerTerritory,'12,000 '+state.place.unit),
  choice('📊','تقرير المسار','رتبتك وأرباحك ومخاطرك.',()=>{closeModal();info('📊','تقرير التاجر','الرتبة '+ranks[d.rank]+' · السمعة '+d.rep+'% · النطاق '+d.territory+' · إجمالي الأرباح '+cash(d.earnings)+'.');}),
  choice('🚪','ترك المسار','إنهاء المسار القصصي مع الاحتفاظ بالسجل.',()=>{closeModal();d.joined=false;log('🚪','ترك مسار التاجر','اخترت الابتعاد عن الشبكة الخيالية والبدء من جديد.','good');save();render();dealerMenu();}),
  choice('↩️','رجوع للأنشطة','',activities)
 ]);
}
function joinDealer(){
 closeModal();if(state.age<18){info('🔒','لسه بدري','المسار متاح من سن 18.');return;}
 state.dealer={joined:true,rank:0,rep:10,earnings:0,territory:1};log('🃏','بدأ مسار التاجر','دخلت مسارًا قصصيًا خياليًا. النتائج مبنية على الاحتمالات داخل اللعبة وقد تؤدي إلى عواقب قانونية.', 'special');save();render();dealerMenu();
}
function dealerMission(){
 closeModal();const d=state.dealer;if(!d||!d.joined)return;
 const success=chance(Math.min(.82,.43+state.stats.smart*.0025+d.rep*.001+d.territory*.025-d.rank*.012));
 if(success){const gain=5000+Math.floor(Math.random()*18000)+d.territory*700;state.bank+=gain;d.earnings+=gain;d.rep=clamp(d.rep+12);if(d.rep>=35&&d.rank<4){d.rep=0;d.rank++;}log('📦','نجحت المهمة القصصية','حققت '+cash(gain)+' داخل اللعبة وتقدمت في المسار الافتراضي.','good');}
 else{d.rep=clamp(d.rep-12);state.crimeRecord=(state.crimeRecord||0)+1;if(chance(.22)){state.prison={years:1+Math.floor(Math.random()*3),kind:'قضية من مسار التاجر الخيالي'};state.job=null;state.specialCareer=null;log('🚔','فشلت المهمة','تسببت المهمة في عقوبة قانونية داخل اللعبة.','bad');}else log('⚠️','مهمة غير ناجحة','خسرت فرصة ربح وانخفضت سمعة الشبكة.','bad');}
 save();render();if(state.prison)prisonEvent();else dealerMenu();
}
function expandDealerTerritory(){
 closeModal();const d=state.dealer;if(!d||!d.joined)return;const cost=12000;
 if(state.bank<cost){info('💳','الرصيد مش كفاية','التوسع يحتاج '+cash(cost)+'.');return;}
 if(d.territory>=10){info('🧭','أقصى نطاق','وصلت للحد الأقصى داخل محاكاة اللعبة.');return;}
 state.bank-=cost;d.territory++;d.rep=clamp(d.rep+3);log('🧭','توسيع النطاق','زاد النطاق الافتراضي إلى '+d.territory+'.','good');save();render();dealerMenu();
}

function godModeMenu(){
 if(!perkOwned('godMode')||!perkEnabled('godMode')){closeModal();info('⚡','وضع الإله متوقف','فعّل وضع الإله من متجر المزايا أو القائمة الرئيسية.');return;}
 const opts=[
  choice('🌱','تخصيص حياة جديدة','اختيار النوع وبلد الميلاد من البداية.',newLifeSetup),
  choice('👑','ابدأ حياة ملكية','ابدأ حياة جديدة بثروة وقصر وألقاب ملكية.',startRoyalLife),
  choice('👥','محرر الشخصيات','عدّل سمات أفراد العائلة والأصدقاء.',editNpcMenu),
  choice('🧬','مواهب خاصة','اختيار موهبة مميزة لشخصيتك الحالية.',godModeTalentsMenu),
  ...(state.children&&state.children.length?[choice('🌳','التحول إلى حياة أحد الأبناء','استكمل قصة أحد الأبناء كوريث جديد.',godModeHeirMenu)]:[]),
  choice('🧑‍🦱','سمات شخصيتي','تعديل الصحة والسعادة والذكاء والمظهر.',editCharacterTraits),
  choice('↩️','رجوع','',mainMenu)
 ];
 modal('⚡','وضع الإله','وضع تخصيص اختياري داخل اللعبة. كل التغييرات تخص ملف الحفظ الحالي.',opts);
}
function startRoyalLife(){
 closeModal();startNew();const title=pick(['الأمير','الأميرة','الوريث الملكي','الوريثة الملكية']),house=pick(['آل النور','آل الياقوت','آل النيل','آل الشروق']);
 state.royalty={active:true,title,house};state.bank+=5000000;state.fame=45;state.reputation=75;
 state.assets.push({id:Date.now()+Math.random(),title:'قصر '+house,emoji:'🏰',kind:'property',value:4500000,upkeep:125000,bought:0,condition:100,rented:false,amenities:['حدائق ملكية','حراسة']});
 state.family[0].relation='الملك';state.family[1].relation='الملكة';state.family[0].job='حاكم';state.family[1].job='حاكمة';
 log('👑','بدأت حياة ملكية','أصبحت '+title+' من '+house+' مع موارد ملكية وبداية مختلفة.','special');achievement('بدء حياة ملكية');save();render();info('👑','أهلًا بالعائلة الملكية','بدأت حياة ملكية جديدة. تقدر تستكملها طبيعيًا أو تغيّر مصيرك عبر الأنشطة ووضع الإله.');
}
function godModeTalentsMenu(){
 if(!perkOwned('godMode')||!perkEnabled('godMode')){godModeMenu();return;}
 modal('🧬','اختيار موهبة خاصة','اختيار موهبة يرفع السمات المرتبطة بها داخل لعبة المحاكاة.',[
  choice('🧠','عبقري','ذكاء مرتفع جدًا.',()=>applyGodTalent('عبقري')),
  choice('🏅','رياضي استثنائي','صحة ومظهر بدني أفضل.',()=>applyGodTalent('رياضي استثنائي')),
  choice('🎨','فنان','مظهر وشهرة ابتدائية أعلى.',()=>applyGodTalent('فنان')),
  choice('🍀','محظوظ','سعادة وسمعة أعلى.',()=>applyGodTalent('محظوظ')),
  choice('🎮','عبقري ألعاب','موهبة الألعاب عالية.',()=>applyGodTalent('عبقري ألعاب')),
  choice('↩️','رجوع','',godModeMenu)
 ]);
}
function applyGodTalent(talent){
 closeModal();state.talents=state.talents||{};
 if(talent==='عبقري')state.stats.smart=100;
 else if(talent==='رياضي استثنائي')state.stats.health=100;
 else if(talent==='فنان'){state.stats.looks=100;state.fame=clamp(state.fame+15);}
 else if(talent==='محظوظ'){state.stats.happiness=100;state.reputation=clamp(state.reputation+20);}
 else if(talent==='عبقري ألعاب')state.talents.gaming=100;
 state.specialTalent=talent;log('🧬','تفعيل موهبة خاصة','اخترت موهبة '+talent+' لوضع التخصيص.','special');save();render();info('✨','الموهبة اتفعلت','تم تطبيق '+talent+' على الشخصية الحالية.');
}
function godModeHeirMenu(){
 const opts=(state.children||[]).map((c,i)=>choice(c.emoji||'🧒',c.name+' · '+c.age+' سنة','متابعة حياة الابن/الابنة كوريث.',()=>{closeModal();startAsChild(i);}));
 opts.push(choice('↩️','رجوع','',godModeMenu));modal('🌳','اختيار وريث','استكمل حياتك من منظور أحد الأبناء. الثروة تتبع قواعد الإرث الحالية.',opts);
}
function bitizenshipMenu(){
 if(!perkOwned('bitizenship')||!perkEnabled('bitizenship')){closeModal();info('🌟','عضوية Bitizen متوقفة','فعّل العضوية من متجر المزايا.');return;}
 modal('🌟','عضوية Bitizen','وصول مميز داخل اللعبة: أجيال متعددة، محرر الشخصيات، المظهر والأنشطة. النسخة الحالية لا تحتوي على إعلانات قسرية أصلًا.',[
  choice('👥','محرر الشخصيات','تعديل سمات أفراد العائلة والأصدقاء.',editNpcMenu),
  choice('🧬','سمات شخصيتي','تحكم في السمات الأساسية.',editCharacterTraits),
  choice('💈','الصالون والمظهر','',salonMenu),
  choice('🐾','الحيوانات الأليفة','',petsMenu),
  choice('🌳','متابعة حياة ابن/ابنة','استكمل قصة أحد الأبناء لو كان عندك أبناء.',()=>{if(state.children&&state.children.length)godModeHeirMenu();else info('🌳','لا يوجد أبناء','ابدأ حياة عائلية ثم عد هنا.');}),
  choice('🗣️','التفاعل مع المعلم أو المدير','محادثة تؤثر على الدراسة أو الأداء المهني.',bitizenshipInteractionMenu),
  choice('⚙️','المظهر الداكن','تغيير مظهر التطبيق.',settingsMenu),
  choice('↩️','رجوع','',mainMenu)
 ]);
}
function bitizenshipInteractionMenu(){
 const opts=[];
 if(state.age>=6&&state.age<18)opts.push(choice('🏫','التحدث إلى المعلم','تحسين تقييم الدراسة أو الذكاء.',()=>{closeModal();state.education.studyScore=clamp((state.education.studyScore||50)+10);stat('smart',2);log('🏫','حديث مع المعلم','طلبت نصائح دراسية وحصلت على توجيه لتحسين مستواك.','good');save();render();info('🏫','نصيحة مفيدة','ارتفع تقييم الدراسة 10 نقاط والذكاء نقطتين.');}));
 if(state.job)opts.push(choice('💼','التحدث إلى المدير','رفع الأداء وفرصة علاوة في وقت لاحق.',()=>{closeModal();state.performance=clamp(state.performance+8);state.reputation=clamp(state.reputation+2);log('💼','محادثة مع المدير','ناقشت تقدمك وخططك المهنية مع مديرك.','good');save();render();info('💼','تمت المحادثة','أداءك المهني الحالي '+state.performance+'%.');}));
 if(!opts.length)opts.push(choice('🗣️','لا يوجد تفاعل متاح الآن','التفاعل مع المعلم يبدأ في المدرسة ومع المدير بعد التوظيف.',closeModal));
 opts.push(choice('↩️','رجوع للعضوية','',bitizenshipMenu));modal('🗣️','تفاعلات Bitizen','اختار تفاعلًا متاحًا حسب مرحلة حياتك.',opts);
}
function movieDirectorMenu(){
 if(!perkOwned('movieDirectorPack')){closeModal();showJobPackOffer('movieDirectorPack');return;}
 if(state.specialCareer&&state.specialCareer.id==='director'){filmStudioMenu();return;}
 modal('🎥','حزمة مخرج الأفلام','المسار متاح من سن 25. بعد بدئه يمكنك إنتاج أفلام أصلية عبر 11 نوعًا سينمائيًا.',[
  choice('🎬','بدء مسار الإخراج','تحتاج سن 25 سنة.',()=>startSpecialCareer({id:'director',title:'إخراج الأفلام',emoji:'🎥',min:25,looks:0,income:26000,desc:'إدارة إنتاج أفلام أصلية.'})),
  choice('🎞️','أفكار الأنواع السينمائية','استعرض أنواع الأفلام المتاحة.',()=>{closeModal();info('🎞️','الأنواع السينمائية','دراما، أكشن، كوميديا، خيال علمي، غموض، عائلي، وثائقي، رعب، رومانسية، إثارة، ورسوم متحركة.');}),
  choice('↩️','رجوع للمتجر','',premiumPerksMenu)
 ]);
}
function landlordPortfolioMenu(){
 if(!perkOwned('landlordPack')){closeModal();info('🏘️','توسعة العقارات مقفولة','افتحها من متجر مزايا حياة أو باقة الملياردير.');return;}
 const opts=[
  choice('🏙️','منزل ذكي مستقبلي','عقار مزود بتقنيات تحكم واستهلاك وصيانة أعلى.',()=>buyLandlordProperty('منزل ذكي مستقبلي','🏠',2600000,52000),'2,600,000 '+state.place.unit),
  choice('🏰','فيلا فاخرة ذكية','فيلا كبيرة مع إمكانية تركيب مرافق.',()=>buyLandlordProperty('فيلا فاخرة ذكية','🏰',4800000,95000),'4,800,000 '+state.place.unit),
  choice('🏢','مبنى سكني','عقار متعدد الوحدات ودخل إيجار أعلى.',()=>buyLandlordProperty('مبنى سكني','🏢',7000000,140000),'7,000,000 '+state.place.unit),
  choice('📦','إدارة جميع العقارات','عقود الإيجار والمرافق والإخلاء والصيانة.',manageAssets)
 ];
 (state.assets||[]).forEach((a,i)=>{if(a.kind==='property')opts.push(choice(a.emoji||'🏠',a.title,'قيمة '+cash(a.value)+' · مرافق '+((a.amenities||[]).length)+' · '+(a.tenant?'مؤجر إلى '+a.tenant.name:'غير مؤجر'),()=>landlordPropertyMenu(i)));});
 opts.push(choice('↩️','رجوع','',premiumPerksMenu));modal('🏘️','العقارات والملاك','اشترِ عقارات خاصة وأضف مرافق واستخدم العقود أو أخلِ المستأجرين عند الحاجة.',opts);
}
function buyLandlordProperty(title,emoji,value,upkeep){
 closeModal();if(state.age<18){info('🔒','الشراء بعد سن 18','');return;}if(state.bank<value){info('💳','الرصيد مش كفاية','شراء '+title+' يحتاج '+cash(value)+'.');return;}
 const id=Date.now()+Math.random();state.bank-=value;state.assets.push({id,title,emoji,kind:'property',value,upkeep,bought:state.age,condition:100,rented:false,tenant:null,amenities:[],futuristic:true});
 log('🏘️','شراء عقار جديد','اشتريت '+title+' مقابل '+cash(value)+'. تقدر تضيف مرافق من قائمة إدارة العقار.','good');save();render();landlordPortfolioMenu();
}
function landlordPropertyMenu(index){
 const p=(state.assets||[])[index];if(!p||p.kind!=='property'){landlordPortfolioMenu();return;}
 const options=[
  choice('🛠️','تخصيص المرافق','تركيب غرفة آمنة أو قبو نبيذ أو سينما أو حديقة ذكية.',customizePropertyAmenities.bind(null,index)),
  choice('🔑','إدارة المستأجرين',p.tenant?'المستأجر '+p.tenant.name+' · '+cash(p.tenant.rent)+' سنويًا.':'العقار غير مؤجر؛ ابحث عن مستأجر.',()=>{closeModal();landlordTenantMenu(index);}),
  ...(p.tenant?[choice('🚪','إخلاء المستأجر','إنهاء العقد قد يخفض السمعة أو يتطلب تعويضًا داخل اللعبة.',()=>evictTenant(index))]:[]),
  choice('📊','تفاصيل العقار','القيمة الحالية '+cash(p.value)+' · الصيانة '+cash(p.upkeep)+' سنويًا.',()=>{closeModal();info('🏘️',p.title,'القيمة '+cash(p.value)+' · المرافق '+((p.amenities||[]).join('، ')||'لا توجد')+' · '+(p.tenant?'المستأجر '+p.tenant.name:'غير مؤجر')+'.');}),
  choice('↩️','رجوع للعقارات','',landlordPortfolioMenu)
 ];
 modal('🏘️',p.title,'العقار ومرافقه تؤثر على قيمته والإيجار وتكاليف الصيانة.',options);
}
const propertyAmenities=[
 {id:'panic-room',title:'غرفة آمنة',emoji:'🛡️',cost:85000,bonus:.008},
 {id:'wine-cellar',title:'قبو نبيذ',emoji:'🍷',cost:60000,bonus:.006},
 {id:'home-cinema',title:'سينما منزلية',emoji:'🎬',cost:50000,bonus:.005},
 {id:'smart-garden',title:'حديقة ذكية',emoji:'🌿',cost:42000,bonus:.004},
 {id:'smart-security',title:'أمن ذكي',emoji:'🔐',cost:70000,bonus:.007}
];
function customizePropertyAmenities(index){
 const p=(state.assets||[])[index];if(!p||p.kind!=='property'){landlordPortfolioMenu();return;}
 const owns=p.amenities||(p.amenities=[]),opts=propertyAmenities.filter(a=>!owns.includes(a.id)).map(a=>choice(a.emoji,a.title,'تكلفة التركيب '+cash(a.cost)+'. يزيد الإيجار المحتمل قليلًا.',()=>installPropertyAmenity(index,a.id),cash(a.cost)));
 if(!opts.length)opts.push(choice('✅','المرافق مكتملة','تم تركيب كل المرافق المتاحة.',closeModal));
 opts.push(choice('↩️','رجوع للعقار','',()=>landlordPropertyMenu(index)));modal('🛠️','تخصيص المرافق','المرافق ترفع القيمة والإيجار المحتمل، وتضيف مصروفًا أوليًا.',opts);
}
function installPropertyAmenity(index,amenityId){
 closeModal();const p=(state.assets||[])[index],a=propertyAmenities.find(x=>x.id===amenityId);if(!p||!a)return;
 if((p.amenities||[]).includes(a.id)){landlordPropertyMenu(index);return;}if(state.bank<a.cost){info('💳','الرصيد مش كفاية','التركيب يحتاج '+cash(a.cost)+'.');return;}
 state.bank-=a.cost;p.amenities=p.amenities||[];p.amenities.push(a.id);p.value=Math.round(p.value*(1+a.bonus));p.upkeep=(p.upkeep||0)+Math.round(a.cost*.025);
 log('🛠️','تركيب مرفق','أضفت '+a.title+' إلى '+p.title+'.','good');save();render();landlordPropertyMenu(index);
}
function evictTenant(index){
 closeModal();const p=(state.assets||[])[index];if(!p||!p.tenant)return;
 const compensation=Math.round((p.tenant.rent||0)*.15);if(state.bank<compensation){info('💳','الرصيد مش كفاية','تعويض الإخلاء الرمزي يحتاج '+cash(compensation)+'.');return;}
 state.bank-=compensation;const name=p.tenant.name;p.tenant=null;p.rented=false;state.reputation=clamp(state.reputation-4);log('🚪','إنهاء عقد وإخلاء','أنهيت عقد '+name+' بعد دفع تعويض '+cash(compensation)+'.','bad');save();render();landlordPortfolioMenu();
}

function financialAdvisorMenu(){
 if(!perkOwned('investorPack')){closeModal();info('📊','حزمة المستثمر مقفولة','افتحها من متجر مزايا حياة.');return;}
 const a=state.investmentAdvisor||(state.investmentAdvisor={hired:false,yearsLeft:0,fee:4500});
 const opts=[];
 if(!a.hired)opts.push(choice('🧑‍💼','تعيين مستشار مالي','رسوم التعاقد 8,000، ثم 4,500 سنويًا لمدة 3 سنوات. المستشار يخفف تقلب المحافظ ويستثمر تلقائيًا عندما تسمح الميزانية.',hireFinancialAdvisor,'8,000 '+state.place.unit));
 else{
  opts.push(choice('📄','عقد المستشار','المتبقي '+a.yearsLeft+' سنوات · الرسوم السنوية '+cash(a.fee)+'.',()=>{closeModal();info('🧑‍💼','عقد المستشار','المستشار ينفذ استثمارًا آليًا محافظًا إذا كان رصيد البنك يسمح، ويخفف الخسائر المحتملة بدل ضمان الأرباح.');}));
  opts.push(choice('🧭','استراتيجية طويلة المدى','تطبيق استراتيجية طويلة المدى على كل المحافظ الحالية.',()=>{closeModal();(state.investments||[]).forEach(inv=>inv.strategy='long');log('🧭','تحديث استراتيجية الاستثمار','حوّلت المحافظ الحالية إلى استراتيجية طويلة المدى.','good');save();render();investingMenu();}));
  opts.push(choice('🚪','إنهاء التعاقد','إيقاف الرسوم السنوية والاستثمار الآلي.',()=>{closeModal();a.hired=false;a.yearsLeft=0;log('🧑‍💼','إنهاء عقد المستشار','أنهيت التعاقد مع المستشار المالي.','');save();render();investingMenu();}));
 }
 opts.push(choice('↩️','رجوع للاستثمارات','',investingMenu));
 modal('🧑‍💼','المستشار المالي',a.hired?'المستشار يعمل لمدة '+a.yearsLeft+' سنوات.':'عيّن مستشارًا لمساعدتك في التخطيط وتوزيع المخاطر.',opts);
}
function hireFinancialAdvisor(){
 closeModal();const a=state.investmentAdvisor||(state.investmentAdvisor={hired:false,yearsLeft:0,fee:4500});
 if(a.hired){financialAdvisorMenu();return;}const cost=8000;
 if(state.bank<cost){info('💳','الرصيد مش كفاية','التعاقد يحتاج '+cash(cost)+'.');return;}
 state.bank-=cost;a.hired=true;a.yearsLeft=3;a.fee=4500;
 log('🧑‍💼','تعيين مستشار مالي','دفعت '+cash(cost)+' وبدأ عقد مستشار لمدة 3 سنوات. لا توجد أرباح مضمونة.','good');save();render();financialAdvisorMenu();
}
function investmentPositionMenu(index){
 const inv=(state.investments||[])[index];if(!inv){investingMenu();return;}
 if(!Number.isFinite(Number(inv.initialValue)))inv.initialValue=inv.value;if(!inv.strategy)inv.strategy='balanced';
 const delta=inv.value-inv.initialValue,percent=inv.initialValue?Math.round(delta/inv.initialValue*100):0;
 modal('📊',inv.kind+' · المحفظة','القيمة الحالية '+cash(inv.value)+' · رأس المال الأولي '+cash(inv.initialValue)+' · التغير '+(delta>=0?'+':'')+cash(delta)+' ('+percent+'%) · الاستراتيجية '+inv.strategy+'.',[
  choice('🧭','تغيير الاستراتيجية','قصيرة المدى أكثر تقلبًا، وطويلة المدى أقل تقلبًا في المحاكاة.',()=>investmentStrategyMenu(index)),
  choice('💵','بيع المحفظة','تحويل القيمة الحالية إلى رصيد نقدي.',()=>sellInvestment(index)),
  choice('↩️','رجوع للاستثمارات','',investingMenu)
 ]);
}
function investmentStrategyMenu(index){
 const inv=(state.investments||[])[index];if(!inv){investingMenu();return;}
 modal('🧭','استراتيجية '+inv.kind,'هذه إعدادات محاكاة داخل اللعبة وليست نصيحة استثمارية حقيقية.',[
  choice('⚡','قصيرة المدى','تقلب أعلى مع تغيرات أكثر حدة.',()=>setInvestmentStrategy(index,'short')),
  choice('⚖️','متوازنة','مزيج بين النمو وتقليل التقلب.',()=>setInvestmentStrategy(index,'balanced')),
  choice('🌱','طويلة المدى','تقلب أقل ومكافأة زمنية افتراضية صغيرة.',()=>setInvestmentStrategy(index,'long')),
  choice('↩️','رجوع','',()=>investmentPositionMenu(index))
 ]);
}
function setInvestmentStrategy(index,strategy){
 closeModal();const inv=(state.investments||[])[index];if(!inv)return;inv.strategy=strategy;
 log('🧭','تغيير استراتيجية الاستثمار','ضبطت محفظة '+inv.kind+' على استراتيجية '+({short:'قصيرة المدى',balanced:'متوازنة',long:'طويلة المدى'}[strategy]||strategy)+'.','good');save();render();investmentPositionMenu(index);
}
function investmentTipsMenu(){
 if(!perkOwned('investorPack')){closeModal();info('📊','حزمة المستثمر مقفولة','افتحها من متجر مزايا حياة.');return;}
 const people=[...(state.friends||[]),...(state.family||[]).filter(p=>p&&!p.deceased)];
 const opts=people.map(p=>choice(p.emoji||'👤',p.name+' · '+(p.relation||'معرفة'),'اسأل الشخص عن رأيه في السوق الافتراضي.',()=>requestInvestmentTip(p)));
 if(!opts.length)opts.push(choice('📰','اقرأ الصحيفة بدلًا من ذلك','تقرير سوق افتراضي.',marketNewspaperMenu));
 opts.push(choice('↩️','رجوع','',investingMenu));modal('🗣️','نصائح من الأصدقاء والعائلة','الآراء متغيرة وقد تكون خاطئة؛ قارِنها بالأخبار ولا تستثمر أموال احتياجاتك الأساسية.',opts);
}
function requestInvestmentTip(person){
 closeModal();const kind=pick(['أسهم','سندات','عملات رقمية']),notes={
  'أسهم':'الشخص شايف أن شركات معروفة داخل عالم اللعبة ممكن يكون لها نمو، مع احتمالية خسارة.',
  'سندات':'الشخص يفضل عائدًا أقل تقلبًا في المحاكاة، لكنه ليس مضمونًا.',
  'عملات رقمية':'الشخص يتوقع حركة كبيرة في السوق الافتراضي؛ المخاطر أعلى.'
 };
 state.marketTip={kind,source:person.name,age:state.age,note:notes[kind]};
 info('🗣️','نصيحة من '+person.name,notes[kind]+' دي مجرد وجهة نظر داخل اللعبة.',[
  choice('📊','جرّب استثمارًا صغيرًا','محفظة '+kind+' بمبلغ 8,000.',()=>investAmount(kind,8000),'8,000 '+state.place.unit),
  choice('📰','قارنها بالصحيفة','',marketNewspaperMenu),
  choice('↩️','رجوع','',investmentTipsMenu)
 ]);
}
function marketNewspaperMenu(){
 const holdings=(state.investments||[]).map(inv=>{
  if(!Number.isFinite(Number(inv.initialValue)))inv.initialValue=inv.value;
  const difference=inv.value-inv.initialValue;
  return choice('📊',inv.kind+' · '+cash(inv.value),'التغير منذ البداية '+(difference>=0?'+':'')+cash(difference)+'.',()=>investmentPositionMenu(state.investments.indexOf(inv)));
 });
 const articles=[
  'مؤشر الشركات الافتراضي متقلب هذا العام؛ تابع النتائج ولا تعتمد على عنوان واحد.',
  'السندات أقل تقلبًا في المحاكاة الحالية، لكن عائدها عادة أهدأ.',
  'العملات الرقمية قد تتحرك صعودًا أو هبوطًا بحدة؛ نوّع محفظتك الافتراضية.',
  'التخطيط طويل المدى يقلل القرارات المتسرعة داخل اللعبة، لكنه لا يضمن الربح.'
 ];
 const opts=[choice('🗞️','خبر السوق','اقرأ موجزًا افتراضيًا لأسعار السوق.',()=>{closeModal();info('🗞️','موجز السوق',pick(articles));}),...holdings,choice('↩️','رجوع للاستثمارات','',investingMenu)];
 modal('📰','صحيفة السوق','تقرير تعليمي افتراضي، وليس نصيحة مالية حقيقية. المحافظ الحالية '+holdings.length+'.',opts);
}
function investorQuitJob(){
 closeModal();if(!perkOwned('investorPack')||!state.job){investingMenu();return;}
 const holdings=(state.investments||[]).reduce((s,x)=>s+(Number(x.value)||0),0),assets=(state.assets||[]).reduce((s,x)=>s+(Number(x.value)||0),0),net=state.bank+holdings+assets-(state.debt||0);
 if(net<1000000){info('💼','الاستقلال المالي لسه بدري','صافي الثروة التقديري '+cash(net)+'. احتفظ بوظيفتك حتى تكوّن احتياطيًا أكبر.');return;}
 info('💼','التفرغ للاستثمار','صافي ثروتك التقديري '+cash(net)+'. ترك الوظيفة يوقف الدخل السنوي؛ هل أنت متأكد؟',[
  choice('✓','أستقيل وأتفرغ','',()=>{closeModal();archiveCurrentJob('تفرغ للاستثمار');state.job=null;state.performance=50;log('💼','التفرغ للاستثمار','تركت الوظيفة بعد وصول صافي الثروة لمستوى الاستقلال المالي.','special');save();render();investingMenu();}),
  choice('↩️','أحتفظ بالوظيفة','',investingMenu)
 ]);
}
function investingMenu(){
 const opts=[];
 if(state.age<18){opts.push(choice('🔒','الاستثمار بعد 18 سنة','ابدأ بالتعلم والادخار لحد ما تقدر تستثمر قانونيًا.',()=>{closeModal();info('📊','لسه بدري','الاستثمار متاح بعد سن 18.');}));}
 else{
  opts.push(choice('🏦','استثمار محافظ','مبلغ 2,000 في محفظة أقل تقلبًا.',()=>investAmount('محافظ',2000),'2,000 '+state.place.unit));
  opts.push(choice('📈','أسهم متوازنة','مبلغ 10,000 مع صعود وهبوط سنوي.',()=>investAmount('متوازن',10000),'10,000 '+state.place.unit));
  opts.push(choice('🎢','استثمار عالي المخاطر','مبلغ 5,000 مع احتمال مكسب أو خسارة كبيرين.',()=>investAmount('مخاطرة عالية',5000),'5,000 '+state.place.unit));
  if(perkOwned('investorPack')){
   opts.unshift(choice('🪙','عملات رقمية','محفظة شديدة التقلب، بمبلغ 8,000.',()=>investAmount('عملات رقمية',8000),'8,000 '+state.place.unit));
   opts.unshift(choice('🏛️','سندات','محفظة محافظة نسبيًا، بمبلغ 5,000.',()=>investAmount('سندات',5000),'5,000 '+state.place.unit));
   opts.unshift(choice('📊','أسهم شركات','محفظة أسهم منفصلة بمبلغ 10,000.',()=>investAmount('أسهم',10000),'10,000 '+state.place.unit));
  }
 }
 (state.investments||[]).forEach((inv,i)=>opts.push(choice('📊',inv.kind+' · '+cash(inv.value),'إدارة المحفظة وتغيير استراتيجيتها.',()=>investmentPositionMenu(i),cash(inv.value))));
 if(perkOwned('investorPack')){
  opts.push(choice('🧑‍💼','المستشار المالي',state.investmentAdvisor&&state.investmentAdvisor.hired?'عقد نشط · '+state.investmentAdvisor.yearsLeft+' سنوات':'تعيين مستشار يدير محفظة افتراضية.',financialAdvisorMenu));
  opts.push(choice('🗣️','نصائح الأصدقاء والعائلة','اسأل شخصًا تعرفه عن نوع استثمار افتراضي.',investmentTipsMenu));
  opts.push(choice('📰','صحيفة السوق','عناوين السوق والتغير في المحافظ.',marketNewspaperMenu));
  if(state.job)opts.push(choice('💼','التفرغ للاستثمار','الاستقالة متاحة عند صافي ثروة تقديري يتجاوز مليونًا.',investorQuitJob));
 }
 modal('📊','الاستثمارات','النتائج داخل المحاكاة متغيرة وليست مضمونة؛ احتفظ بمبلغ للطوارئ ولا تستثمر أموال احتياجاتك الأساسية.',opts);
}


function advanceZooSystem(){
 const z=state.zoo;if(!z||!z.opened)return;
 if(!Number.isFinite(Number(z.funds)))z.funds=75000;
 if(!Array.isArray(z.habitats))z.habitats=['savannah','forest','aviary'];
 z.habitatHealth=z.habitatHealth||{};
 const animals=z.animals||[],habitats=z.habitats||[];
 const visitors=12000+Math.floor(Math.random()*7000)+animals.length*850+habitats.length*2300+animals.reduce((n,a)=>n+(a.legendary?900:0)+(a.accessories||[]).length*160,0);
 const habitatIncome=habitats.reduce((n,id)=>n+Math.round(((z.habitatHealth[id]??100)/100)*900),0);
 const upkeep=14000+animals.length*360+habitats.reduce((n,id)=>n+(zooHabitatCatalog.find(h=>h.id===id)?.upkeep||2500),0);
 z.funds+=visitors+habitatIncome-upkeep;
 habitats.forEach(id=>z.habitatHealth[id]=clamp((z.habitatHealth[id]??100)-4));
 animals.forEach(a=>{a.age=(a.age||0)+1;a.health=clamp((a.health??85)-(a.age>15?3:1));a.happiness=clamp((a.happiness??70)-2+Math.min(4,(a.accessories||[]).length));});
 if(z.funds<0){state.bank+=z.funds;z.funds=0;log('💳','دعم مالي للحديقة','صندوق الحديقة لم يغطِ تكاليف التشغيل بالكامل، فتم تغطية العجز من حسابك الشخصي.','bad');}
 if(chance(.07)&&animals.length>0&&animals.length<120){const parent=pick(animals);z.animals.push({id:Date.now()+Math.random(),name:'صغير '+parent.species,species:parent.species,emoji:parent.emoji,habitat:parent.habitat,age:0,legendary:false,accessories:[],happiness:85,health:100});log('🦁','مولود جديد في الحديقة','استقبلت الحديقة صغيرًا جديدًا من نوع '+parent.species+'.','good');}
 log('🦁','تقرير تشغيل الحديقة','دخل الزوار '+cash(visitors)+' · تكاليف التشغيل '+cash(upkeep)+' · تغير الصندوق '+cash(visitors+habitatIncome-upkeep)+'.','special');
}
function advanceCultSystem(){
 const c=state.cult;if(!c||!c.founded)return;
 const inside=c.members.filter(m=>m.status==='داخل المجتمع');
 const donations=inside.reduce((n,m)=>n+Math.round(250+Math.random()*650+(m.loyalty||50)*3),0);
 const upkeep=2500+inside.length*450;c.fund=Math.max(-30000,(c.fund||0)+donations-upkeep);
 inside.forEach(m=>{m.loyalty=clamp(m.loyalty+(c.doctrine==='المعرفة'?2:1)-(c.discipline<25?2:0));if(m.loyalty<20&&chance(.18))m.status='غادر المجتمع';});
 if(c.fund<0){const deficit=Math.min(Math.max(0,state.bank),Math.abs(c.fund));state.bank-=deficit;c.fund+=deficit;log('💳','عجز مالي في المجتمع','اضطررت لتغطية جزء من تكاليف المجتمع من حسابك الشخصي.','bad');}
 log('🛕','تقرير المجتمع السنوي','المساهمات '+cash(donations)+' · التكاليف '+cash(upkeep)+' · الأعضاء داخل المقر '+inside.filter(m=>m.status==='داخل المجتمع').length+'.','');
}
function advanceCasinoSystem(){
 const c=state.casino;if(!c||!c.opened)return;
 if(!Number.isFinite(Number(c.funds)))c.funds=75000;
 const revenue=18000+(c.games||[]).length*12000+(c.amenities||[]).length*7500+(c.celebrityHires||0)*11000+Math.round((state.fame||0)*250);
 const cost=20000+(c.games||[]).length*4000+(c.amenities||[]).length*3500+(c.celebrityHires||0)*8500;
 c.funds+=revenue-cost;
 if(c.funds<0){state.bank+=c.funds;c.funds=0;log('💳','تغطية عجز الكازينو','صندوق التشغيل لم يغطِ المصاريف، فتم خصم العجز من حسابك الشخصي.','bad');}
 log('🎰','التقرير السنوي للكازينو','إيرادات '+cash(revenue)+' · تكاليف '+cash(cost)+' · التغير الصافي '+cash(revenue-cost)+'.','special');
}
function advanceDealerSystem(){
 const d=state.dealer;if(!d||!d.joined)return;
 if(chance(Math.min(.72,.32+d.rank*.07+d.territory*.025))){const gain=3500+Math.floor(Math.random()*9000)+d.rank*2200+d.territory*500;state.bank+=gain;d.earnings+=gain;d.rep=clamp(d.rep+4);log('🃏','تقرير مسار التاجر','دخل افتراضي من نشاط المسار '+cash(gain)+'.','special');}
 else if(chance(.12)){d.rep=clamp(d.rep-8);state.crimeRecord=(state.crimeRecord||0)+1;log('⚠️','توتر في مسار التاجر','تراجعت سمعة الشبكة الافتراضية بسبب حدث عشوائي.','bad');if(chance(.18)){state.prison={years:1,kind:'قضية من المسار الخيالي'};state.job=null;state.specialCareer=null;log('🚔','قضية قانونية','أدى حدث عشوائي إلى عقوبة داخل اللعبة.','bad');}}
}
function advanceInvestmentAdvisor(){
 const a=state.investmentAdvisor;if(!a||!a.hired)return;
 if(state.bank<a.fee){a.hired=false;a.yearsLeft=0;log('🧑‍💼','انتهاء عقد المستشار','لم يكفِ الرصيد لدفع رسوم المستشار السنوية، فتم إنهاء العقد دون زيادة الديون.','bad');return;}
 state.bank-=a.fee;
 if(state.bank>15000&&state.investments.length<30){const amount=5000;state.bank-=amount;state.investments.push({id:Date.now()+Math.random(),kind:'سندات',value:amount,initialValue:amount,strategy:'long',started:state.age,advisorManaged:true});log('🧑‍💼','استثمار آلي من المستشار','خصص المستشار '+cash(amount)+' لمحفظة سندات طويلة المدى داخل اللعبة.','special');}
 a.yearsLeft=Math.max(0,(a.yearsLeft||0)-1);log('🧑‍💼','رسوم المستشار المالي','دُفعت رسوم سنوية '+cash(a.fee)+'.','');
 if(a.yearsLeft===0){a.hired=false;log('🧑‍💼','انتهاء عقد المستشار','انتهت مدة العقد. يمكنك تجديده من قائمة الاستثمارات.');}
}
function premiumPerksMenu(){
 if(!state)return;
 const catalog=[
  {id:'fameFortuneBundle',title:'باقة الشهرة والثروة',emoji:'🛩️',cost:135000,desc:'تفتح حصالة المليون وجواز العالم ونجم هوليوود.'},
  {id:'billionairesBundle',title:'باقة الملياردير',emoji:'💼',cost:160000,desc:'تفتح حزم الأعمال وإدارة العقارات والمستثمر: شركات متعددة، مستأجرون، أسهم وسندات وعملات رقمية.'},
  {id:'crimePaysBundle',title:'باقة عالم الجريمة',emoji:'🕶️',cost:145000,desc:'تفتح مسار المافيا، والسوق السوداء والمتحف، ونصل المهام الخاصة الخيالية.'},
  {id:'partyAnimalBundle',title:'باقة الحيوان الحفّال',emoji:'🦁',cost:175000,desc:'تفتح حديقة الحيوان وبطاقة الخروج من السجن ووضع النجومية الذهبي.'},
  {id:'businessPack',title:'حزمة الأعمال',emoji:'📈',cost:60000,desc:'تملك شركات إضافية وتوسع محفظتك وتتابع أرباح كل شركة.'},
  {id:'landlordPack',title:'توسعة العقارات والملاك',emoji:'🏘️',cost:55000,desc:'عقارات متطورة ومرافق فاخرة وعقود إيجار وتفاوض وإخلاء مستأجرين.'},
  {id:'investorPack',title:'حزمة المستثمر',emoji:'📊',cost:55000,desc:'أسهم وسندات وعملات رقمية ومستشار مالي ونصائح من الأصدقاء والصحف.'},
  {id:'cultPack',title:'توسعة الطائفة والمجتمع',emoji:'🛕',cost:72000,desc:'أسّس مجتمعك، اجمع الأتباع، ضع القواعد، ونظّم المراسم والانضباط داخل محاكاة خيالية.'},
  {id:'casinoPack',title:'توسعة الكازينو',emoji:'🎰',cost:95000,desc:'امتلك كازينو، ثبّت الألعاب والمرافق، استضف مشاهير وافتح إكسسوارات للفوز داخل اللعبة.'},
  {id:'godMode',title:'وضع الإله',emoji:'⚡',cost:110000,desc:'خصص بداية الحيوات، ابدأ حياة ملكية، حرر الشخصيات وسمات المواهب، واستكمل حياة أحد الأبناء.'},
  {id:'bitizenship',title:'عضوية المواطن Bitizen',emoji:'🌟',cost:85000,desc:'افتح وصولًا مميزًا لمحرر الشخصيات والأجيال والأنشطة والمظهر؛ لا توجد إعلانات قسرية أو مدفوعات حقيقية في هذه النسخة.'},
  {id:'movieDirectorPack',title:'حزمة مخرج الأفلام',emoji:'🎥',cost:65000,desc:'استوديو أفلام مع 11 نوعًا سينمائيًا واختبارات أداء ودراما الممثلين والجوائز والمهرجانات.'},
  {id:'dealerPack',title:'حزمة التاجر',emoji:'🃏',cost:70000,desc:'ابدأ مسار تاجر خيالي وتدرج إلى قيادة شبكة داخل عالم اللعبة مع أرباح ومخاطر قانونية مجردة.'},
  {id:'auraRing',title:'خاتم الهالة',emoji:'💍',cost:32000,desc:'إكسسوار اجتماعي نادر يمنح الشخصية دفعة للمظهر والسمعة عند استخدامه مرة كل سنة داخل اللعبة.'},
  {id:'challengeVault',title:'خزنة التحديات',emoji:'🗄️',cost:22000,desc:'حفظ تحديات الأيام السابقة وإتاحة مكافأة استرجاع غير مستلمة.'},
  {id:'goldTheme',title:'الطابع الذهبي',emoji:'⭐',cost:16000,desc:'افتح مظهرًا ذهبيًا أصليًا ويمكنك تشغيله أو إيقافه.'},
  {id:'streakSaver',title:'حماة السلسلة ×5',emoji:'🛡️',cost:8000,desc:'حزمة من 5 وسائل حماية للسلسلة عند تفويت يوم واحد.'},
  {id:'expandedTime',title:'ذاكرة الزمن الموسّعة',emoji:'⏳',cost:30000,desc:'ارفع عدد نقاط الرجوع من 8 إلى 60.'},
  {id:'actorPack',title:'Actor Job Pack',emoji:'🎭',cost:25000,desc:'أدوار، اختبارات أداء، وإعلانات مدفوعة.'},
  {id:'fighterPack',title:'Ultimate Fighter Mode',emoji:'🥊',cost:45000,desc:'مسار مقاتل احترافي وتدريب ومنافسات.'},
  {id:'proAthletePack',title:'Pro Athlete Job Pack',emoji:'🏀',cost:35000,desc:'افتح مسار الرياضة الاحترافية.'},
  {id:'politicianPack',title:'Politician Job Pack',emoji:'🏛️',cost:30000,desc:'افتح مسار الحياة السياسية.'},
  {id:'astronautPack',title:'Astronaut Job Pack',emoji:'🧑‍🚀',cost:50000,desc:'افتح مسار استكشاف الفضاء.'},
  {id:'modelPack',title:'Model Job Pack',emoji:'📸',cost:28000,desc:'جلسات تصوير وعقود أزياء وحملات تجارية.'},
  {id:'musicianPack',title:'Musician Job Pack',emoji:'🎼',cost:30000,desc:'تسجيل أغاني وحفلات وبناء جمهور موسيقي.'},
  {id:'musicProducerPack',title:'Music Producer Job Pack',emoji:'🎧',cost:35000,desc:'إنتاج مقطوعات موسيقية وتعاونات مع الفنانين.'},
  {id:'vampireMode',title:'Vampire Mode',emoji:'🧛',cost:55000,desc:'قصة خارقة للطبيعة مع جوهر مصاصي الدماء والصيادين وتكوين سلالة.'},
  {id:'outdoorsPack',title:'Outdoors Lifestyle',emoji:'🏕️',cost:45000,desc:'مركبات وعرة ورحلات تخييم وصيد واستكشاف الحياة البرية.'},
  {id:'gatedCommunityPack',title:'Gated Community',emoji:'🏙️',cost:90000,desc:'جزر خاصة ومجتمعات سرية وفعاليات VIP وتجارب رفاهية.'},
  {id:'bossMode',title:'مركز المهن الشامل',emoji:'🧰',cost:45000,desc:'لوحة للمهن الخاصة وعلاوة دخل 10% عند التفعيل.'},
  {id:'healthShield',title:'درع العافية',emoji:'🩺',cost:18000,desc:'يمنع عدوى محاكية في خيار اختياري للبالغين داخل اللعبة.'},
  {id:'goldenWrench',title:'الورشة الذهبية',emoji:'🔧',cost:20000,desc:'صيانة السيارات مجانًا مع الحفاظ على حالتها.'},
  {id:'goldenPassport',title:'جواز العالم',emoji:'🌍',cost:30000,desc:'الهجرة لأي وجهة متاحة داخل اللعبة من دون رسوم.'},
  {id:'goldenPiggyBank',title:'حصالة المليون',emoji:'🐷',cost:75000,desc:'ابدأ كل حياة جديدة بمليون من عملة بلد الشخصية.'},
  {id:'goldenNeko',title:'تميمة الازدهار',emoji:'🐈',cost:55000,desc:'علاوة راتب 20% في الوظائف والمسارات المهنية.'},
  {id:'hollywoodStar',title:'نجم هوليوود',emoji:'🌟',cost:60000,desc:'فعّل الشهرة الفورية في الوظيفة أو المهنة الخاصة، ويمكنك إيقاف التأثير من القائمة الرئيسية.'},
  {id:'goldenResume',title:'السيرة الذاتية الذهبية',emoji:'📄',cost:48000,desc:'تضمن القبول في الوظائف المؤهل لها وتحمي الوظيفة من الفصل العشوائي.'},
  {id:'goldenDiploma',title:'الشهادة الذهبية',emoji:'🎓',cost:38000,desc:'احصل فورًا على شهادة جامعية أو دراسات عليا في تخصص تختاره بعد سن 18.'},
  {id:'friendshipBracelet',title:'سوار الصداقة',emoji:'🤝',cost:28000,desc:'أي صداقة جديدة تبدأ بعلاقة قوية مضمونة.'},
  {id:'goldenPacifier',title:'اللهاية الذهبية',emoji:'🍼',cost:52000,desc:'اختر عدد الأبناء ونوعهم وموهبتهم الخاصة، مع تخطيط الولادة من سن 18.'},
  {id:'jailCard',title:'بطاقة الخروج من السجن',emoji:'🃏',cost:25000,desc:'استخدمها مرة عند السجن للخروج فورًا ومحو السجل القانوني.'},
  {id:'superstarMode',title:'وضع النجومية',emoji:'🌟',cost:20000,desc:'يفتح الطابع الذهبي للعبة حياة ويمكنك تشغيله من إعدادات العرض.'},
  {id:'zooExpansionPack',title:'توسعة حديقة الحيوان',emoji:'🦓',cost:60000,desc:'افتح حديقة حيوان، اشترِ الحيوانات، ساعدها على التكاثر واكتشف أنواعًا أسطورية.'},
  {id:'mafiaPack',title:'حزمة المافيا',emoji:'🕶️',cost:70000,desc:'انضم إلى عائلة خيالية وارتقِ من عضو إلى الأب الروحي.'},
  {id:'blackMarketPack',title:'توسعة السوق السوداء',emoji:'🏛️',cost:65000,desc:'افتح بائعين خياليين للقطع النادرة، وأنشئ متحفًا واعرض مقتنياتك.'},
  {id:'assassinsBlade',title:'نصل المهام الخاصة',emoji:'🗡️',cost:40000,desc:'يفتح مهمة خيالية عالية المخاطر مرة كل سنة، مع احتمال تجاوز العواقب القانونية أو الوقوع فيها.'}
 ];
 const opts=catalog.map(item=>{
  if(item.id==='streakSaver')return choice(item.emoji,item.title+' · المتبقي '+(permanentPerks.streakSavers||0),item.desc+' التكلفة '+cash(item.cost)+'.',()=>buyPremiumPerk(item.id),cash(item.cost));
  if(perkOwned(item.id)){
   if(PERK_TOGGLE_IDS.includes(item.id))return choice(perkEnabled(item.id)?'🟢':'⚪',item.title+(perkEnabled(item.id)?' · مفعّل':' · متوقف'),item.desc,()=>togglePremiumPerk(item.id));
   const actions={challengeVault:challengeVaultMenu,expandedTime:timeMachineMenu,actorPack:actorPackMenu,bossMode:bossModeMenu,superstarMode:()=>togglePremiumPerk('goldTheme'),zooExpansionPack:zooMenu,mafiaPack:mafiaMenu,blackMarketPack:blackMarketMenu,assassinsBlade:assassinBladeMission,goldenDiploma:goldenDiplomaMenu,businessPack:companyPortfolioMenu,landlordPack:landlordPortfolioMenu,investorPack:investingMenu,cultPack:cultMenu,casinoPack:casinoMenu,godMode:godModeMenu,bitizenship:bitizenshipMenu,movieDirectorPack:movieDirectorMenu,dealerPack:dealerMenu,auraRing:auraRingMenu,fighterPack:()=>openJobPackDestination('fighterPack'),proAthletePack:()=>openJobPackDestination('proAthletePack'),politicianPack:()=>openJobPackDestination('politicianPack'),astronautPack:()=>openJobPackDestination('astronautPack'),modelPack:()=>openJobPackDestination('modelPack'),musicianPack:()=>openJobPackDestination('musicianPack'),musicProducerPack:()=>openJobPackDestination('musicProducerPack'),vampireMode:()=>openActivityPackDestination('vampireMode'),outdoorsPack:()=>openActivityPackDestination('outdoorsPack'),gatedCommunityPack:()=>openActivityPackDestination('gatedCommunityPack')};
   return choice('✅',item.title+' · مفتوح',item.desc,actions[item.id]||(()=>info(item.emoji,item.title,item.desc)));
  }
  return choice(item.emoji,item.title,item.desc+' شراء مرة واحدة من رصيد اللعبة: '+cash(item.cost)+'.',()=>buyPremiumPerk(item.id),cash(item.cost));
 });
 modal('✨','متجر مزايا حياة','باقات ومزايا دائمة تُفتح بعملة اللعبة فقط؛ لا توجد مدفوعات حقيقية. الملكيات الأساسية محفوظة على نفس المتصفح والجهاز.',opts);
}

function grantLandlordStarterProperty(){
 if(!state||!Array.isArray(state.assets)||state.assets.some(a=>a&&a.landlordStarter))return;
 state.assets.push({id:'landlord-starter-'+Date.now(),title:'منزل مستقبلي حصري',emoji:'🏠',kind:'property',value:950000,upkeep:22000,bought:state.age,condition:100,rented:false,tenant:null,amenities:[],futuristic:true,landlordStarter:true});
 log('🏠','هدية العقار الحصري','حصلت على منزل مستقبلي حصري مجانًا مع توسعة العقارات.','good');
}
function buyPremiumPerk(id){
 const catalog={
  fameFortuneBundle:{cost:135000,title:'باقة الشهرة والثروة'},billionairesBundle:{cost:160000,title:'باقة الملياردير'},crimePaysBundle:{cost:145000,title:'باقة عالم الجريمة'},partyAnimalBundle:{cost:175000,title:'باقة الحيوان الحفّال'},
  fighterPack:{cost:45000,title:'Ultimate Fighter Mode'},proAthletePack:{cost:35000,title:'Pro Athlete Job Pack'},politicianPack:{cost:30000,title:'Politician Job Pack'},astronautPack:{cost:50000,title:'Astronaut Job Pack'},
  modelPack:{cost:28000,title:'Model Job Pack'},musicianPack:{cost:30000,title:'Musician Job Pack'},musicProducerPack:{cost:35000,title:'Music Producer Job Pack'},
  vampireMode:{cost:55000,title:'Vampire Mode'},outdoorsPack:{cost:45000,title:'Outdoors Lifestyle'},gatedCommunityPack:{cost:90000,title:'Gated Community'},
  challengeVault:{cost:22000,title:'خزنة التحديات'},goldTheme:{cost:16000,title:'الطابع الذهبي'},streakSaver:{cost:8000,title:'حماة السلسلة'},expandedTime:{cost:30000,title:'ذاكرة الزمن الموسّعة'},businessPack:{cost:60000,title:'حزمة الأعمال'},landlordPack:{cost:55000,title:'توسعة العقارات والملاك'},investorPack:{cost:55000,title:'حزمة المستثمر'},cultPack:{cost:72000,title:'توسعة الطائفة والمجتمع'},casinoPack:{cost:95000,title:'توسعة الكازينو'},godMode:{cost:110000,title:'وضع الإله'},bitizenship:{cost:85000,title:'عضوية المواطن Bitizen'},movieDirectorPack:{cost:65000,title:'حزمة مخرج الأفلام'},dealerPack:{cost:70000,title:'حزمة التاجر'},auraRing:{cost:32000,title:'خاتم الهالة'},
  actorPack:{cost:25000,title:'حزمة التمثيل الاحترافية'},bossMode:{cost:45000,title:'مركز المهن الشامل'},healthShield:{cost:18000,title:'درع العافية'},goldenWrench:{cost:20000,title:'الورشة الذهبية'},
  goldenPassport:{cost:30000,title:'جواز العالم'},goldenPiggyBank:{cost:75000,title:'حصالة المليون'},goldenNeko:{cost:55000,title:'تميمة الازدهار'},hollywoodStar:{cost:60000,title:'نجم هوليوود'},
  goldenResume:{cost:48000,title:'السيرة الذاتية الذهبية'},goldenDiploma:{cost:38000,title:'الشهادة الذهبية'},friendshipBracelet:{cost:28000,title:'سوار الصداقة'},goldenPacifier:{cost:52000,title:'اللهاية الذهبية'},
  jailCard:{cost:25000,title:'بطاقة الخروج من السجن'},superstarMode:{cost:20000,title:'وضع النجومية'},zooExpansionPack:{cost:60000,title:'توسعة حديقة الحيوان'},mafiaPack:{cost:70000,title:'حزمة المافيا'},blackMarketPack:{cost:65000,title:'توسعة السوق السوداء'},assassinsBlade:{cost:40000,title:'نصل المهام الخاصة'}
 };
 const bundles={fameFortuneBundle:['goldenPiggyBank','goldenPassport','hollywoodStar'],billionairesBundle:['businessPack','landlordPack','investorPack'],crimePaysBundle:['mafiaPack','blackMarketPack','assassinsBlade'],partyAnimalBundle:['zooExpansionPack','jailCard','superstarMode','goldTheme']};
 const item=catalog[id];if(!item)return;
 if(id!=='streakSaver'&&perkOwned(id)){perkAction(id);return;}
 if((Number(state.bank)||0)<item.cost){closeModal();info('💳','الرصيد مش كفاية','محتاج '+cash(item.cost)+'، ورصيدك '+cash(state.bank)+'.');return;}
 state.bank-=item.cost;
 if(id==='streakSaver'){
  permanentPerks.streakSavers=Math.min(99,(permanentPerks.streakSavers||0)+5);persistPermanentPerks();log('🛡️','شراء حماة السلسلة','أضفت 5 وسائل حماية لسلسلة التحديات. المتبقي '+permanentPerks.streakSavers+'.','good');
 }else if(bundles[id]){
  permanentPerks.owned[id]=true;bundles[id].forEach(perk=>{permanentPerks.owned[perk]=true;if(PERK_TOGGLE_IDS.includes(perk))permanentPerks.enabled[perk]=true;});
  if(bundles[id].includes('superstarMode')||bundles[id].includes('goldTheme')){permanentPerks.owned.goldTheme=true;permanentPerks.enabled.goldTheme=true;uiSettings.theme='gold';persistUiSettings();}
  if(bundles[id].includes('hollywoodStar')){permanentPerks.enabled.hollywoodStar=true;if(state.job||state.specialCareer)state.fame=100;}
  if(bundles[id].includes('landlordPack'))grantLandlordStarterProperty();
  persistPermanentPerks();log('🎁','تم فتح '+item.title,'اتفتحت '+bundles[id].length+' مزايا مرتبطة بالباقة. راجع الأنشطة والقائمة الرئيسية لاستخدامها.','special');
 }else{
  permanentPerks.owned[id]=true;if(PERK_TOGGLE_IDS.includes(id))permanentPerks.enabled[id]=true;
  if(id==='goldTheme'||id==='superstarMode'){permanentPerks.owned.goldTheme=true;permanentPerks.enabled.goldTheme=true;uiSettings.theme='gold';persistUiSettings();}
  if(id==='hollywoodStar'){permanentPerks.enabled.hollywoodStar=true;if(state.job||state.specialCareer)state.fame=100;}
  if(id==='goldenResume')permanentPerks.enabled.goldenResume=true;
  if(id==='goldenPacifier')permanentPerks.enabled.goldenPacifier=true;
  if(id==='godMode')permanentPerks.enabled.godMode=true;
  if(id==='bitizenship')permanentPerks.enabled.bitizenship=true;
  if(id==='goldenWrench')state.assets.forEach(a=>{if(a.kind==='car')a.condition=100;});
  if(id==='landlordPack')grantLandlordStarterProperty();
  persistPermanentPerks();log('✨','ميزة جديدة: '+item.title,'فتحت '+item.title+' من رصيد اللعبة. تقدر تدير المزايا من المتجر والقائمة الرئيسية.','special');
 }
 save();render();
 if(JOB_PACK_PROMOS[id]||id==='bossMode'){openJobPackDestination(id);return;}
 premiumPerksMenu();
}
function buyPremiumPerkWithAction(id,afterPurchase){
 const before=Number(state&&state.bank)||0,alreadyOwned=perkOwned(id);
 buyPremiumPerk(id);
 if(typeof afterPurchase==='function'&&!alreadyOwned&&perkOwned(id)&&(Number(state&&state.bank)||0)<before)afterPurchase();
}

function perkAction(id){
 if(id==='challengeVault'){challengeVaultMenu();return;}if(id==='expandedTime'){timeMachineMenu();return;}if(id==='actorPack'){actorPackMenu();return;}if(id==='bossMode'){bossModeMenu();return;}
 if(['fighterPack','proAthletePack','politicianPack','astronautPack','businessPack','dealerPack','mafiaPack','movieDirectorPack','goldenDiploma'].includes(id)){openJobPackDestination(id);return;}
 if(id==='goldenDiploma'){goldenDiplomaMenu();return;}if(id==='zooExpansionPack'){zooMenu();return;}if(id==='mafiaPack'){mafiaMenu();return;}if(id==='blackMarketPack'){blackMarketMenu();return;}if(id==='assassinsBlade'){assassinBladeMission();return;}if(id==='superstarMode'){togglePremiumPerk('goldTheme');return;}if(id==='businessPack'){companyPortfolioMenu();return;}if(id==='landlordPack'){landlordPortfolioMenu();return;}if(id==='investorPack'){investingMenu();return;}if(id==='cultPack'){cultMenu();return;}if(id==='casinoPack'){casinoMenu();return;}if(id==='godMode'){godModeMenu();return;}if(id==='bitizenship'){bitizenshipMenu();return;}if(id==='movieDirectorPack'){movieDirectorMenu();return;}if(id==='dealerPack'){dealerMenu();return;}
 if(PERK_TOGGLE_IDS.includes(id)){togglePremiumPerk(id);return;}
 const details={goldenPassport:'جواز العالم يلغي رسوم الهجرة للوجهات المتاحة داخل اللعبة.',goldenPiggyBank:'كل حياة جديدة تبدأ بمليون من عملة بلد الشخصية، بما فيها حياة الوارث.',friendshipBracelet:'كل صديق جديد يبدأ بعلاقة قوية مضمونة.',jailCard:'تقدر استخدام البطاقة مرة واحدة عند وجودك في السجن.',goldenNeko:'علاوة الراتب تزيد بنسبة 20% عند التفعيل.',businessPack:'تقدر فتح وإدارة شركات إضافية من قائمة الأصول.',landlordPack:'إدارة عقود المستأجرين متاحة من تفاصيل العقارات.',investorPack:'أسهم وسندات وعملات رقمية متاحة من قائمة الاستثمارات.'};
 closeModal();info('✅','ميزة مملوكة',details[id]||'الميزة مفعّلة على هذا المتصفح.');
}

function togglePremiumPerk(id){
 if(!PERK_TOGGLE_IDS.includes(id)||!perkOwned(id)){closeModal();premiumPerksMenu();return;}
 permanentPerks.enabled[id]=!permanentPerks.enabled[id];
 if(id==='goldTheme'){if(permanentPerks.enabled[id])uiSettings.theme='gold';else if(uiSettings.theme==='gold')uiSettings.theme='light';persistUiSettings();}
 if(id==='goldenWrench'&&permanentPerks.enabled[id])state.assets.forEach(a=>{if(a.kind==='car')a.condition=100;});
 if(id==='hollywoodStar'&&permanentPerks.enabled[id]&&(state.job||state.specialCareer))state.fame=100;
 persistPermanentPerks();save();render();if(dead)death(state.cause||'نهاية رحلة الحياة');else mainMenu();
}

function mainMenu(){
 modal('☰','القائمة الرئيسية','اختار القسم اللي عايز تديره. كل جزء متجمع حسب نوعه عشان توصل للي محتاجه أسرع.',[
  section('الحياة والشخصية'),
  choice('🪪','ملف الشخصية','تعديل الاسم وبيانات الشخصية.',()=>customizeMenu()),
  choice('🌱','حياة جديدة','ابدأ شخصية جديدة أو خصّص بلد الميلاد.',()=>newLifeSetup()),
  choice('🪦','مقبرة الحيوات','استعرض الشخصيات السابقة وأعمارها ونهاياتها.',()=>cemeteryMenu()),
  choice('⏳','الرجوع بالزمن','استرجع نقطة حفظ سنوية سابقة.',timeMachineMenu),

  section('الإنجازات والمكافآت'),
  choice('🏆','الإنجازات والأشرطة','الأهداف التي حققتها في رحلتك.',()=>achievementsMenu()),
  choice('🎯','تحديات اليوم','ثلاث مهام يومية ومكافآت إضافية عند إكمالها.',()=>dailyChallengesMenu()),
  choice('🏅','مهرجان صُنّاع الحكاية','حدث أسبوعي محلي من إحدى عشرة شارة ومكافأة ختامية.',()=>seasonalEventMenu()),
  choice('🎁','المكافأة اليومية','احصل على مكافأتك اليومية إن كانت متاحة.',()=>dailyReward()),

  section('المزايا والأنشطة'),
  choice('✨','متجر مزايا حياة','باقات ومزايا دائمة ومسارات إضافية.',premiumPerksMenu),
  ...(perkOwned('hollywoodStar')?[choice(perkEnabled('hollywoodStar')?'🌟':'⭐',perkEnabled('hollywoodStar')?'إيقاف نجم هوليوود':'تفعيل نجم هوليوود','الشهرة الفورية في الوظائف والمهن الخاصة.',()=>togglePremiumPerk('hollywoodStar'))]:[]),
  ...(perkOwned('goldenResume')?[choice(perkEnabled('goldenResume')?'📄':'📝',perkEnabled('goldenResume')?'إيقاف السيرة الذاتية الذهبية':'تفعيل السيرة الذاتية الذهبية','قبول مضمون للوظائف المؤهل لها وحماية من الفصل العشوائي.',()=>togglePremiumPerk('goldenResume'))]:[]),
  ...(perkOwned('goldenPacifier')?[choice(perkEnabled('goldenPacifier')?'🍼':'👶',perkEnabled('goldenPacifier')?'إيقاف إعداد الولادات':'تفعيل إعداد الولادات','اختيار عدد الأبناء والنوع والموهبة الخاصة.',()=>togglePremiumPerk('goldenPacifier'))]:[]),
  ...(perkOwned('godMode')?[choice(perkEnabled('godMode')?'⚡':'⚪',perkEnabled('godMode')?'إيقاف وضع الإله':'تفعيل وضع الإله','تخصيص الحيوات والمواهب والشخصيات.',()=>togglePremiumPerk('godMode')),...(perkEnabled('godMode')?[choice('👑','قائمة وضع الإله','حياة ملكية ومحرر الشخصيات والمواهب.',godModeMenu)]:[])]:[]),
  ...(perkOwned('bitizenship')?[choice(perkEnabled('bitizenship')?'🌟':'⚪',perkEnabled('bitizenship')?'إيقاف عضوية Bitizen':'تفعيل عضوية Bitizen','الوصول المميز للأنشطة ومحرر الشخصيات والأجيال.',()=>togglePremiumPerk('bitizenship')),...(perkEnabled('bitizenship')?[choice('🌟','قائمة Bitizen','الحيوانات والصالون والتفاعل مع المعلمين والمدير.',bitizenshipMenu)]:[])]:[]),
  ...(state.prison?[choice('🚔','الحياة داخل السجن','استعرض خيارات العقوبة أو استخدم بطاقة الخروج.',prisonEvent)]:[]),
  choice('☰','كل الأنشطة','الصحة والهوايات والحيوانات والسفر والمال والمزيد.',()=>activities()),

  section('الإعدادات وبيانات الحفظ'),
  choice('⚙️','إعدادات العرض','الوضع الداكن وحجم النص والمظهر الذهبي.',()=>settingsMenu()),
  choice('💾','تصدير الحفظ','نسخة كاملة من الحياة والمقبرة والإعدادات والمزايا المملوكة.',()=>exportSave()),
  choice('📥','تحميل حفظ','استرجع حزمة كاملة أو ملف حياة قديم بصيغة v1.',()=>importSave())
 ]);
}


function auraRingMenu(){
 if(!perkOwned('auraRing')){closeModal();premiumPerksMenu();return;}
 const last=Number(state.auraRingLastUsedAge);
 const ready=!Number.isFinite(last)||last!==state.age;
 modal('💍','خاتم الهالة','إكسسوار اجتماعي نادر. استخدامه يمنح دفعة صغيرة للمظهر والسمعة، مرة واحدة في كل سنة من العمر.',[
  choice(ready?'💍':'⏳',ready?'استخدم خاتم الهالة':'استخدمته هذا العام',ready?'رفع المظهر والسمعة داخل اللعبة.':'تقدر تستخدمه بعد التقدم سنة.',()=>{closeModal();if(!ready){info('⏳','الخاتم يحتاج وقتًا','يمكنك استخدام الخاتم عند التقدم إلى سنة جديدة.');return;}state.auraRingLastUsedAge=state.age;stat('looks',5);state.reputation=clamp((state.reputation||50)+5);log('💍','تأثير خاتم الهالة','أضاف الخاتم دفعة للمظهر والسمعة في هذه السنة.','good');save();render();auraRingMenu();}),
  choice('↩️','رجوع للعلاقات','',relations)
 ]);
}
function routePack(id,openAction){
 closeModal();
 if(perkOwned(id)){openAction();return;}
 if(JOB_PACK_PROMOS[id]){showJobPackOffer(id);return;}
 if(ACTIVITY_PACK_PROMOS[id]){showActivityPackOffer(id);return;}
 premiumPerksMenu();
}
function openJobPackDestination(id){
 if(id==='goldenDiploma'){goldenDiplomaMenu();return;}if(id==='actorPack'){actorPackMenu();return;}if(id==='movieDirectorPack'){movieDirectorMenu();return;}if(id==='businessPack'){companyPortfolioMenu();return;}if(id==='dealerPack'){dealerMenu();return;}if(id==='mafiaPack'){mafiaMenu();return;}if(id==='bossMode'){bossModeMenu();return;}
 if(id==='modelPack'){startSpecialCareer({id:'model',title:'Model',emoji:'📸',min:16,looks:65,income:16000,desc:'Photo shoots, modeling contracts and fashion campaigns.'});return;}
 if(id==='musicianPack'){startSpecialCareer({id:'musician',title:'Musician',emoji:'🎼',min:14,looks:25,income:11000,desc:'Record songs, book performances and build a fanbase.'});return;}
 if(id==='musicProducerPack'){startSpecialCareer({id:'musicProducer',title:'Music Producer',emoji:'🎧',min:18,looks:0,income:18000,desc:'Produce tracks, collaborate with artists and build a reputation.'});return;}
 const careers={
  fighterPack:{id:'fighter',title:'Professional Fighter',emoji:'🥊',min:18,looks:0,income:22000,desc:'Training, tactical choices and high-risk competitions.'},
  proAthletePack:{id:'athlete',title:'Pro Athlete',emoji:'🏅',min:15,looks:0,income:18000,desc:'Fitness, training and championship competition.'},
  politicianPack:{id:'politician',title:'Politician',emoji:'🏛️',min:25,looks:0,income:28000,desc:'Public service, campaigns and building public trust.'},
  astronautPack:{id:'astronaut',title:'Astronaut',emoji:'🧑‍🚀',min:21,looks:0,income:40000,desc:'Train for missions, explore space and build your flight record.'}
 }[id];
 if(careers){startSpecialCareer(careers);return;}premiumPerksMenu();
}
function showJobPackOffer(id,career){
 const pack=JOB_PACK_PROMOS[id];if(!pack){premiumPerksMenu();return;}
 if(perkOwned(id)){if(career)startSpecialCareer(career);else openJobPackDestination(id);return;}
 const root=$('modalRoot');let selected=id;
 const features=pack.features.map((f,i)=>'<div class="job-pack-feature"><span>'+['🥊','🏆','🎬','🎭','🌟','⭐'][i%6]+'</span><strong>'+esc(f)+'</strong></div>').join('');
 root.innerHTML='<div class="overlay job-pack-offer-overlay" id="jobPackOfferOverlay"><button class="job-pack-close" id="jobPackClose" type="button" aria-label="Close">×</button><section class="job-pack-stage" role="dialog" aria-modal="true" aria-label="'+esc(pack.title)+'"><button class="job-pack-card selected" id="jobPackSelectCard" type="button"><div class="job-pack-card-head"><span class="job-pack-card-price">'+cash(pack.cost)+'</span><span class="job-pack-new">NEW!</span></div><div class="job-pack-card-icon">'+pack.emoji+'</div><h2>'+esc(pack.title)+'</h2><p>'+esc(pack.description)+'</p><div class="job-pack-card-features">'+features+'</div></button><button class="job-pack-boss-card" id="jobPackBossCard" type="button"><span class="job-pack-check" aria-hidden="true">✓</span><div class="job-pack-boss-head"><span>🏛️</span><span>📈</span><span>🧑‍🚀</span><span>🎮</span></div><h2>Boss Mode</h2><p>Unlock every single job pack, including the '+esc(pack.title)+'!</p><div class="job-pack-boss-extra"><span>🎼</span><span>🎭</span><span>🏀</span><span>🌿</span></div><small>'+cash(45000)+' · Unlock every career pack</small></button><div class="job-pack-actions"><button class="job-pack-buy" id="jobPackBuy" type="button"><span>Get it now!</span><small id="jobPackBuyPrice">'+cash(pack.cost)+'</small></button><button class="job-pack-restore" id="jobPackRestore" type="button">restore earlier purchase</button></div></section></div>';
 const close=()=>{root.innerHTML='';},overlay=$('jobPackOfferOverlay'),packCard=$('jobPackSelectCard'),bossCard=$('jobPackBossCard'),price=$('jobPackBuyPrice');
 overlay.addEventListener('click',e=>{if(e.target===overlay)close();});$('jobPackClose').addEventListener('click',close);
 const select=choiceId=>{selected=choiceId;packCard.classList.toggle('selected',selected===id);bossCard.classList.toggle('selected',selected==='bossMode');price.textContent=cash(selected==='bossMode'?45000:pack.cost);};
 packCard.addEventListener('click',()=>select(id));bossCard.addEventListener('click',()=>select('bossMode'));
 $('jobPackBuy').addEventListener('click',()=>buyPremiumPerkWithAction(selected,()=>{if(career){startSpecialCareer(career);return;}openJobPackDestination(selected==='bossMode'?id:selected);}));
 $('jobPackRestore').addEventListener('click',()=>{permanentPerks=loadPermanentPerks();if(perkOwned(id)||perkOwned('bossMode')){close();if(career)startSpecialCareer(career);else openJobPackDestination(id);}else{close();info('↻','No previous purchase found','Job packs in this version are unlocked with in-game currency saved on this device. There are no external payments to restore.');}});
}
function showMovieDirectorOffer(){showJobPackOffer('movieDirectorPack');}

function openActivityPackDestination(id){
 if(!perkOwned(id)){showActivityPackOffer(id);return;}
 if(id==='vampireMode'){vampireModeMenu();return;}
 if(id==='outdoorsPack'){outdoorLifestyleMenu();return;}
 if(id==='gatedCommunityPack'){gatedCommunityMenu();return;}
 premiumPerksMenu();
}
function showActivityPackOffer(id){
 const pack=ACTIVITY_PACK_PROMOS[id];if(!pack){premiumPerksMenu();return;}
 if(perkOwned(id)){openActivityPackDestination(id);return;}
 const root=$('modalRoot'),theme=pack.theme;
 const bullet=theme==='vampire'?'🩸':theme==='outdoors'?'🐾':'✦';
 const features=pack.features.map(f=>'<div class="activity-pack-feature"><span>'+bullet+'</span><strong>'+esc(f)+'</strong></div>').join('');
 const art=theme==='outdoors'?'🏞️　🏕️　🛻　🌲':theme==='gated'?'🏝️　🏙️　✨':'🦇　🌕　🦇';
 const logo=theme==='vampire'?'VAMPIRE MODE':theme==='outdoors'?'OUTDOORS LIFESTYLE':'GATED COMMUNITY';
 root.innerHTML='<div class="overlay activity-pack-offer-overlay activity-theme-'+theme+'" id="activityPackOfferOverlay"><button class="activity-pack-close" id="activityPackClose" type="button" aria-label="Close">×</button><section class="activity-pack-panel" role="dialog" aria-modal="true" aria-label="'+esc(pack.title)+'"><div class="activity-pack-hero"><span class="activity-pack-new">NEW</span><div class="activity-pack-art" aria-hidden="true">'+art+'</div><div class="activity-pack-symbol">'+pack.emoji+'</div><div class="activity-pack-logo">'+logo+'</div><p>'+esc(pack.description)+'</p></div><div class="activity-pack-features">'+features+'</div><div class="activity-pack-actions"><button class="activity-pack-buy" id="activityPackBuy" type="button"><span>Get it now!</span><small>'+cash(pack.cost)+' · in-game currency</small></button><button class="activity-pack-restore" id="activityPackRestore" type="button">restore earlier purchase</button></div></section></div>';
 const close=()=>{root.innerHTML='';},overlay=$('activityPackOfferOverlay');
 overlay.addEventListener('click',e=>{if(e.target===overlay)close();});$('activityPackClose').addEventListener('click',close);
 $('activityPackBuy').addEventListener('click',()=>buyPremiumPerkWithAction(id,()=>{close();openActivityPackDestination(id);}));
 $('activityPackRestore').addEventListener('click',()=>{permanentPerks=loadPermanentPerks();if(perkOwned(id)){close();openActivityPackDestination(id);}else{close();info('↻','No previous purchase found','These packs use in-game currency saved on this device. There are no external payments to restore.');}});
}
function refreshVampireRank(vampire){
 const essence=Math.max(0,Number(vampire.essence)||0);
 vampire.rank=essence>=300?'Vampire Lord':essence>=150?'Ancient Vampire':essence>=50?'Night Stalker':essence>0?'Newborn Vampire':'Fledgling';
 return vampire.rank;
}
function vampireModeMenu(){
 if(!perkOwned('vampireMode')){closeModal();showActivityPackOffer('vampireMode');return;}
 const vampire=state.vampireMode||(state.vampireMode={isVampire:false,essence:0,bloodline:0,hypnosis:0,hunterEncounters:0,rank:'Human'});
 vampire.essence=Math.max(0,Number(vampire.essence)||0);vampire.bloodline=Math.max(0,Number(vampire.bloodline)||0);
 const opts=[];
 if(!vampire.isVampire){
  opts.push(choice('🧛','Become a Vampire','Enter the supernatural storyline and unlock vampire actions.',()=>{
   closeModal();vampire.isVampire=true;vampire.rank=refreshVampireRank(vampire);stat('happiness',3);log('🦇','A supernatural change','You chose to become a vampire in the fictional life simulation.','special');save();render();info('🧛','Vampire Mode','Your new supernatural storyline has begun.');
  }));
 }else{
  opts.push(choice('🩸','Absorb Essence','Gain essence and progress toward higher vampire ranks. Hunters may occasionally appear.',()=>{
   closeModal();const gain=12+Math.floor(Math.random()*19);vampire.essence+=gain;vampire.rank=refreshVampireRank(vampire);let message='You absorbed '+gain+' essence and reached the '+vampire.rank+' rank.';
   if(chance(.22)){vampire.hunterEncounters++;stat('health',-8);message+=' A vampire hunter appeared, leaving you exhausted.';}
   log('🩸','Essence absorbed',message,'special');save();render();info('🩸','Essence gained',message);
  }));
  opts.push(choice('🌀','Use Hypnotic Charm','A fictional supernatural encounter that can improve your mood and charisma.',()=>{
   closeModal();vampire.hypnosis++;vampire.essence+=8;vampire.rank=refreshVampireRank(vampire);stat('happiness',3);state.reputation=clamp((state.reputation||50)+1);
   log('🌀','Hypnotic Charm','Your supernatural charm worked in a fictional encounter. Essence +8.','good');save();render();vampireModeMenu();
  }));
  opts.push(choice('🧛‍♀️','Grow the Vampire Bloodline','Grow your fictional vampire family and deepen the storyline.',()=>{
   closeModal();vampire.bloodline++;vampire.essence+=15;vampire.rank=refreshVampireRank(vampire);stat('happiness',4);
   log('🧛‍♀️','Vampire Bloodline','Your vampire bloodline grew. Total lineage '+vampire.bloodline+'.','special');save();render();vampireModeMenu();
  }));
  opts.push(choice('🦇','Encounter Vampire Hunters','A risky fictional encounter. Resolve it with your current essence and health.',()=>{
   closeModal();vampire.hunterEncounters++;const won=chance(Math.min(.9,.28+vampire.essence/450+state.stats.smart/250));
   if(won){vampire.essence+=22;state.reputation=clamp(state.reputation+3);log('🦇','Hunter encounter','You escaped the encounter and gained 22 essence.','good');}
   else{stat('health',-14);stat('happiness',-4);log('🦇','Hunter encounter','You escaped but were hurt and lost some confidence.','bad');}
   vampire.rank=refreshVampireRank(vampire);save();render();info(won?'🏆':'🩹',won?'Hunters outsmarted':'A narrow escape','Current rank: '+vampire.rank+' · essence '+vampire.essence+'.');
  }));
  opts.push(choice('🌅','Return to Human Life','Leave the supernatural storyline. Your life save remains intact.',()=>{
   closeModal();vampire.isVampire=false;vampire.rank='Human';log('🌅','Returned to ordinary life','You left Vampire Mode without resetting your life save.');save();render();info('🌅','Back to ordinary life','Your vampire progress is saved if you choose to return.');
  }));
 }
 opts.push(choice('📊','Vampire Handbook','Rank '+(vampire.isVampire?refreshVampireRank(vampire):'Human')+' · Essence '+vampire.essence+' · Bloodline '+vampire.bloodline+' · Hunter encounters '+vampire.hunterEncounters+'.',()=>{closeModal();info('📊','Vampire Handbook','Mode '+(vampire.isVampire?'active':'inactive')+' · rank '+vampire.rank+' · essence '+vampire.essence+' · bloodline '+vampire.bloodline+' · hypnosis '+vampire.hypnosis+'.');}));
 opts.push(choice('↩️','Back to Activities','',()=>{closeModal();activities();}));
 modal('🧛','Vampire Mode','A fictional supernatural expansion. Your rank rises as you collect essence and grow your bloodline.',opts);
}
function outdoorLifestyleMenu(){
 if(!perkOwned('outdoorsPack')){closeModal();showActivityPackOffer('outdoorsPack');return;}
 const outdoors=state.outdoors||(state.outdoors={vehicle:false,trips:0,treasures:0,fishingTrips:0,wildlife:[],islandTrips:0});
 if(!Array.isArray(outdoors.wildlife))outdoors.wildlife=[];
 const opts=[
  choice(outdoors.vehicle?'🛻':'🚙',outdoors.vehicle?'Explore in Your Off-Road Vehicle':'Purchase an Off-Road Vehicle',outdoors.vehicle?'Vehicle ready · trails explored '+outdoors.trips:'Buy a vehicle for '+cash(120000)+' to unlock off-road trails.',()=>{
   closeModal();if(outdoors.vehicle){outdoorActivity('trail');return;}if(state.age<18){info('🔒','Adults only','Off-road vehicle purchases are available from age 18.');return;}
   const cost=120000;if(state.bank<cost){info('💳','Not enough money','The off-road vehicle costs '+cash(cost)+'.');return;}
   state.bank-=cost;outdoors.vehicle=true;log('🛻','Off-road vehicle','You bought an off-road vehicle and unlocked trail adventures.','good');save();render();outdoorLifestyleMenu();
  },outdoors.vehicle?'Owned':cash(120000)),
  choice('🏞️','Hike and Camp','Take friends or family hiking and camping.',()=>outdoorActivity('camp'),cash(900)),
  choice('🪨','Explore a Cave','Search for a hidden treasure underground.',()=>outdoorActivity('cave'),cash(1200)),
  choice('🎣','Go Fishing','Spend a day fishing; the trip may bring a catch or a small reward.',()=>outdoorActivity('fishing'),cash(600)),
  choice('🐾','Wildlife Handbook','Discover and log new wildlife entries.',()=>outdoorActivity('wildlife')),
  choice('📊','Outdoors Journal','Trips '+outdoors.trips+' · treasures '+outdoors.treasures+' · fishing trips '+outdoors.fishingTrips+' · wildlife entries '+outdoors.wildlife.length+'.',()=>{closeModal();info('📊','Outdoors Journal','Off-road vehicle: '+(outdoors.vehicle?'owned':'not owned')+' · trips '+outdoors.trips+' · treasures '+outdoors.treasures+' · fishing '+outdoors.fishingTrips+' · wildlife log '+outdoors.wildlife.length+'.');}),
  choice('↩️','Back to Activities','',()=>{closeModal();activities();})
 ];
 modal('🏕️','Outdoors Lifestyle','Explore nature, spend time with loved ones and build your own wilderness journal.',opts);
}
function outdoorActivity(kind){
 const outdoors=state.outdoors||(state.outdoors={vehicle:false,trips:0,treasures:0,fishingTrips:0,wildlife:[],islandTrips:0});
 if(!Array.isArray(outdoors.wildlife))outdoors.wildlife=[];
 closeModal();const costs={trail:1800,camp:900,cave:1200,fishing:600,wildlife:250},cost=costs[kind]||0;
 if(kind==='trail'&&!outdoors.vehicle){info('🛻','Vehicle required','Purchase an off-road vehicle before exploring the trails.');return;}
 if(state.bank<cost){info('💳','Not enough money','This activity costs '+cash(cost)+'.');return;}
 if(state.age<8){info('🔒','Too young for this trip','Outdoor adventures become available from age 8.');return;}
 state.bank-=cost;let title='',message='',reward=0;
 if(kind==='trail'){
  title='Off-road Trail';outdoors.trips++;stat('happiness',4);stat('health',chance(.8)?2:-3);
  if(chance(.18)){reward=2500+Math.floor(Math.random()*10000);state.bank+=reward;outdoors.treasures++;message='You found a forgotten stash on the trail and earned '+cash(reward)+'.';}
  else message='You completed a scenic off-road trail and logged the trip.';
 }else if(kind==='camp'){
  title='Hiking and Camping';outdoors.trips++;stat('health',4);stat('happiness',5);
  if(state.friends&&state.friends.length){const friend=pick(state.friends);friend.relationshipLevel=clamp((friend.relationshipLevel||50)+5);message='You camped outdoors and grew closer to '+friend.name+'.';}
  else if(state.partner){state.partner.relationshipLevel=clamp((state.partner.relationshipLevel||50)+5);message='You camped outdoors with your partner and strengthened the relationship.';}
  else message='You took a peaceful hiking and camping trip and felt refreshed.';
 }else if(kind==='cave'){
  title='Cave Exploration';outdoors.trips++;stat('happiness',2);
  if(chance(.35)){reward=4000+Math.floor(Math.random()*18000);state.bank+=reward;outdoors.treasures++;message='You found a hidden treasure in the cave worth '+cash(reward)+'.';}
  else{stat('health',-2);message='No treasure this time, but you recorded a new cave in your journal.';}
 }else if(kind==='fishing'){
  title='Fishing Trip';outdoors.fishingTrips++;outdoors.trips++;stat('happiness',3);
  if(chance(.5)){reward=900+Math.floor(Math.random()*4000);state.bank+=reward;message='You had a good catch and earned '+cash(reward)+'.';}
  else message='The fish were not biting, but the quiet day helped you relax.';
 }else{
  title='Wildlife Handbook';const entries=['fox','deer','owl','eagle','turtle','otter','wild horse','hedgehog','falcon','mountain goat','badger','heron'];
  const unseen=entries.filter(entry=>!outdoors.wildlife.includes(entry)),count=Math.min(unseen.length,1+Math.floor(Math.random()*3)),found=[];
  for(let i=0;i<count;i++){const entry=unseen.splice(Math.floor(Math.random()*unseen.length),1)[0];if(entry){outdoors.wildlife.push(entry);found.push(entry);}}
  message=found.length?'You logged new wildlife: '+found.join(', ')+'.':'You reviewed your wildlife journal. New entries are waiting on another trip.';
  outdoors.trips++;stat('smart',2);stat('happiness',2);
 }
 log(kind==='wildlife'?'🐾':kind==='trail'?'🛻':kind==='fishing'?'🎣':'🏕️',title,message,'good');save();render();info('🏕️',title,message);
}
function netWorthForLuxury(){
 return Math.max(0,(Number(state.bank)||0)+(state.assets||[]).reduce((sum,item)=>sum+Math.max(0,Number(item.value)||0),0)+(state.investments||[]).reduce((sum,item)=>sum+Math.max(0,Number(item.value)||0),0)+(state.business?Math.max(0,Number(state.business.value)||0):0)-(Number(state.debt)||0));
}
function gatedCommunityMenu(){
 if(!perkOwned('gatedCommunityPack')){closeModal();showActivityPackOffer('gatedCommunityPack');return;}
 const netWorth=netWorthForLuxury(),required=1000000;
 if(netWorth<required){
  modal('🏙️','Gated Community','The upper echelon of life is waiting for you—climb that social ladder! Your current net worth is '+cash(netWorth)+'. You need at least '+cash(required)+' to qualify for the Luxury Lifestyle.',[
   choice('💼','Find a Job','Build steady income before entering the gated community.',()=>{closeModal();showCareer();}),
   choice('📈','Manage Assets','Review property, investments and business value.',()=>{closeModal();assets();}),
   choice('↩️','Back to Activities','',()=>{closeModal();activities();})
  ]);return;
 }
 const luxury=state.gatedCommunity||(state.gatedCommunity={privateIsland:false,societyMember:false,vipEvents:0,luxuryItems:0}),opts=[];
 if(!luxury.privateIsland)opts.push(choice('🏝️','Own a Private Island','A rare luxury asset with an annual upkeep cost.',()=>buyLuxuryIsland(),cash(1200000)));
 else opts.push(choice('🏝️','Vacation on Your Private Island','Enjoy a private holiday away from ordinary life.',()=>luxuryIslandVacation(),cash(25000)));
 opts.push(choice('🤝','Join a Secret Society',luxury.societyMember?'You are already a member.':'A private networking club with annual dues.',()=>joinLuxurySociety(),cash(80000)));
 opts.push(choice('🥂','Attend an Exclusive VIP Event','A high-profile event that may improve fame and connections.',()=>attendLuxuryEvent(),cash(12000)));
 opts.push(choice('💎','Shop Luxury Items','Purchase luxury pieces and increase your lifestyle score.',()=>buyLuxuryItem(),cash(18000)));
 opts.push(choice('📊','Luxury Profile','Net worth '+cash(netWorthForLuxury())+' · private island '+(luxury.privateIsland?'owned':'not owned')+' · VIP events '+luxury.vipEvents+' · luxury items '+luxury.luxuryItems+'.',()=>{closeModal();info('🏙️','Luxury Profile','Net worth '+cash(netWorthForLuxury())+' · society '+(luxury.societyMember?'member':'not a member')+' · VIP events '+luxury.vipEvents+' · luxury items '+luxury.luxuryItems+'.');}));
 opts.push(choice('↩️','Back to Activities','',()=>{closeModal();activities();}));
 modal('🏙️','Gated Community','Private islands, secret societies, VIP events and high-end shopping. Your wealth unlocks the next tier.',opts);
}
function buyLuxuryIsland(){
 closeModal();const cost=1200000;if(state.bank<cost){info('💳','Not enough money','A private island costs '+cash(cost)+'.');return;}
 const luxury=state.gatedCommunity||(state.gatedCommunity={privateIsland:false,societyMember:false,vipEvents:0,luxuryItems:0});
 state.bank-=cost;luxury.privateIsland=true;state.assets.push({id:Date.now()+Math.random(),title:'Private Island',emoji:'🏝️',kind:'property',value:cost,upkeep:18000,bought:state.age,condition:100,rented:false,tenant:null,amenities:[],luxuryAsset:true});
 log('🏝️','Private Island','You purchased a private island and unlocked private vacations.','special');save();render();gatedCommunityMenu();
}
function luxuryIslandVacation(){
 closeModal();const cost=25000;const luxury=state.gatedCommunity||(state.gatedCommunity={privateIsland:false,societyMember:false,vipEvents:0,luxuryItems:0});
 if(!luxury.privateIsland){gatedCommunityMenu();return;}if(state.bank<cost){info('💳','Not enough money','A private vacation costs '+cash(cost)+'.');return;}
 state.bank-=cost;state.gatedCommunity.islandTrips=(state.gatedCommunity.islandTrips||0)+1;stat('happiness',8);stat('health',3);log('🏝️','Private Island Vacation','You relaxed on your private island.','good');save();render();gatedCommunityMenu();
}
function joinLuxurySociety(){
 closeModal();const luxury=state.gatedCommunity||(state.gatedCommunity={privateIsland:false,societyMember:false,vipEvents:0,luxuryItems:0}),cost=80000;
 if(luxury.societyMember){info('🤝','Already a member','You already belong to this society.');return;}if(state.bank<cost){info('💳','Not enough money','Membership costs '+cash(cost)+'.');return;}
 state.bank-=cost;luxury.societyMember=true;state.reputation=clamp(state.reputation+8);log('🤝','Secret Society','You joined a private society and expanded your network.','special');save();render();gatedCommunityMenu();
}
function attendLuxuryEvent(){
 closeModal();const luxury=state.gatedCommunity||(state.gatedCommunity={privateIsland:false,societyMember:false,vipEvents:0,luxuryItems:0}),cost=12000;
 if(state.bank<cost){info('💳','Not enough money','The VIP event costs '+cash(cost)+'.');return;}
 state.bank-=cost;luxury.vipEvents++;stat('happiness',4);state.fame=clamp(state.fame+2);state.reputation=clamp(state.reputation+3);log('🥂','VIP Event','You attended an exclusive event and built new connections.','good');save();render();gatedCommunityMenu();
}
function buyLuxuryItem(){
 closeModal();const luxury=state.gatedCommunity||(state.gatedCommunity={privateIsland:false,societyMember:false,vipEvents:0,luxuryItems:0}),cost=18000;
 if(state.bank<cost){info('💳','Not enough money','A luxury item costs '+cash(cost)+'.');return;}
 state.bank-=cost;luxury.luxuryItems++;stat('happiness',3);state.reputation=clamp(state.reputation+1);log('💎','Luxury Shopping','You purchased a luxury item and upgraded your lifestyle.','good');save();render();gatedCommunityMenu();
}
function activities(){
 const netWorth=netWorthForLuxury();
 const opts=[
  section('اختيارات سريعة'),
  choice('❤️','الحب والعلاقات','تعرّف على شريك أو تابع علاقتك الحالية',()=>{closeModal();if(state.partner)relations();else meetPartner();}),
  choice('🧘','الصحة والعافية','اهتم بصحتك ولياقتك وراحتك النفسية',healthMenu),
  (()=>{const row=choice('🐕','الحيوانات الأليفة','تبنَّ حيوانًا أو تابع رعايته',petsMenu);row.menuDots=true;return row;})(),
  choice('💆','العناية بالمظهر','غيّر إطلالتك وخد وقتًا لنفسك',salonMenu),
  section('مسارات وتوسعات'),
  (()=>{const row=choice('🎬','إخراج الأفلام','أخرج أعمالًا سينمائية وابنِ مسيرتك الفنية',()=>routePack('movieDirectorPack',movieDirectorMenu));row.cardClass='activity-movie-row';row.stamp='إخراج الأفلام';return row;})(),
  (()=>{const row=choice('🧛','نمط مصاص الدماء','ابدأ حياة خارقة وابنِ سلالة خاصة',()=>routePack('vampireMode',vampireModeMenu));row.cardClass='activity-vampire-row';row.stamp='نمط خارق';return row;})(),
  (()=>{const row=choice('🌲','الحياة في الطبيعة','استكشف الأنشطة الخارجية والرحلات',()=>routePack('outdoorsPack',outdoorLifestyleMenu));row.cardClass='activity-outdoors-row';row.stamp='الطبيعة';return row;})(),
  (()=>{const row=choice('💎','نمط الحياة الفاخر','طوّر مستوى معيشتك واستثمر في الرفاهية',()=>routePack('gatedCommunityPack',gatedCommunityMenu),'',clamp(netWorth/20000000*100));row.cardClass='activity-luxury-row';row.menuDots=true;return row;})(),
  choice('🎰','الكازينو','أنشئ كازينو وأدر ألعابه ومرافقه',()=>routePack('casinoPack',casinoMenu),'',null,!perkOwned('casinoPack')),
  choice('🕶️','السوق الخفي','استكشف المقتنيات النادرة وأدر متحفك',()=>routePack('blackMarketPack',blackMarketMenu),'',null,!perkOwned('blackMarketPack')),
  choice('🕯️','مجتمع خيالي','أنشئ مجتمعًا خاصًا وأدر أعضاءه وموارده',()=>routePack('cultPack',cultMenu),'',null,!perkOwned('cultPack')),
  choice('🏁','سباقات السيارات','شارك في منافسات السرعة والتحديات',()=>{closeModal();specialCareers();},'',null,true),
  choice('🕵️','العميل السري','افتح مسار المهمات والعمليات الخاصة',()=>{closeModal();premiumPerksMenu();},'',null,true),
  choice('🦁','حديقة الحيوانات','امتلك حديقة حيوان واعتنِ بالحيوانات',()=>routePack('zooExpansionPack',zooMenu),'',null,!perkOwned('zooExpansionPack')),
  section('أنشطة الحياة اليومية'),
  choice('🩺','الصحة والعلاج','زيارة الطبيب والتمرين والراحة',healthMenu),
  choice('🎨','الهوايات والمهارات','ابدأ هواية أو طوّر مهاراتك',hobbiesMenu),
  choice('🐾','رعاية الحيوانات','تبنَّ حيوانًا أو اهتم بحيواناتك الحالية',petsMenu),
  choice('🌟','المهن الخاصة','التمثيل والموسيقى وصناعة المحتوى والرياضة',specialCareers),
  choice('⚖️','الجريمة والقانون','قرارات محفوفة بالمخاطر ولها عواقب',crimeMenu),
  choice('🌍','السفر والهجرة','سافر في عطلة أو انتقل إلى بلد آخر',travelMenu),
  choice('👪','الأسرة والأبناء','أدر الزواج والعلاقات ورعاية الأبناء',familyMenu),
  choice('💈','المظهر والأناقة','غيّر أسلوبك واهتم بمظهرك',salonMenu),
  choice('🎬','السينما','اختر فيلمًا لقضاء وقت ممتع',cinemaMenu),
  choice('🩺','زيارة الطبيب','التكلفة '+cash(1200)+' · استعادة جزء من الصحة',()=>activity('doctor'),cash(1200)),
  choice('🏋️','النادي الرياضي','التكلفة '+cash(300)+' · تحسين الصحة والمظهر',()=>activity('gym'),cash(300)),
  choice('📚','المكتبة','نشاط مجاني لزيادة الذكاء',()=>activity('library'),'مجانًا'),
  choice('🏖️','إجازة','التكلفة '+cash(1800)+' · تحسين السعادة',()=>activity('vacation'),cash(1800)),
  choice('🤝','التطوع','نشاط مجاني لتحسين السعادة والسمعة',()=>activity('volunteer'),'مجانًا'),
  choice('🎟️','اليانصيب','تذكرة بقيمة '+cash(100)+' مع فرصة محدودة للفوز',()=>activity('lottery'),cash(100)),
  choice('🌃','الحياة الليلية','متاحة من سن 18 · التكلفة '+cash(1200),()=>activity('nightlife'),cash(1200)),
  choice('❤️','التبرع','تبرع بقيمة '+cash(1000)+' لتحسين السمعة',()=>activity('donate'),cash(1000)),
  section('إدارة الشخصية'),
  choice('📊','البنك والاستثمارات','القروض وسداد الديون وإدارة المحافظ الاستثمارية',financeMenu),
  choice('🏆','الإنجازات والأوسمة','إنجازاتك وأوسمة الحيوات والمكافآت اليومية',achievementsMenu),
  choice('✨','متجر مزايا حياة','المزايا الدائمة والمسارات المهنية الإضافية',premiumPerksMenu),
  choice('🪪','ملف الشخصية','تعديل الاسم ورخصة القيادة وتصدير الحفظ',customizeMenu),
  choice('📱','السوشيال ميديا','الحسابات والمنشورات والمتابعون والتعاونات',socialMediaMenu),
  choice('💾','تصدير الحفظ','نسخة كاملة من الحياة والمقبرة والإعدادات والمزايا المملوكة',exportSave),
  choice('🌱','حياة جديدة','ابدأ شخصية جديدة بمكان ميلاد ونوع تختارهما',()=>{closeModal();info('🌱','حياة جديدة','بدء حياة جديدة سيستبدل الحفظ الحالي.',[choice('↻','متابعة','',()=>{closeModal();if(confirm('تبدأ حياة جديدة وتستبدل الحفظ الحالي؟'))newLifeSetup();}),choice('↩️','الاحتفاظ بالحياة الحالية','',closeModal)]);})
 ];
 modal('☰','الأنشطة والحياة اليومية','اختار القسم المناسب، وكل اختياراتك محفوظة في نفس حكايتك.',opts);
}
function healthMenu(){
 const healthDesc='حالتك الصحية بتتأثر بالعمر والعادات والعلاقات والمخاطر. دي أنشطة داخل اللعبة وليست نصيحة طبية. '+(state.sti?'فيه حالة صحية محاكية مسجلة؛ زيارة الطبيب داخل اللعبة تقدر تعالجها.':'لا توجد حالة صحية محاكية مسجلة حاليًا.');
 modal('❤️','الصحة والعافية',healthDesc,[
  choice('🩺','زيارة الطبيب','كشف مقابل 1,200 '+state.place.unit+(state.sti?' — يعالج الحالة الصحية المحاكية المسجلة.':''),()=>activity('doctor'),'1,200 '+state.place.unit),
  choice('🏋️','التمرين','مناسب من سن 12، يحسن اللياقة والمظهر.',()=>activity('gym'),'300 '+state.place.unit),
  choice('🧘','تأمل وراحة','نشاط مجاني يقلل الضغط ويحسن المزاج.',()=>{closeModal();stat('happiness',5);stat('health',2);log('🧘','وقت للراحة','خصصت وقتًا للهدوء واستعادة طاقتك.','good');render();}),
  choice('🛌','تنظيم النوم','يزود الصحة ويقلل آثار الإرهاق.',()=>{closeModal();stat('health',6);stat('happiness',2);log('🛌','نوم منتظم','حاولت تنظم النوم وتخفف السهر.','good');render();}),
  choice('📚','معرفة صحية','تعلم عادات صحية بدون تكلفة.',()=>{closeModal();stat('smart',2);log('📚','تثقيف صحي','قرأت عن العادات اليومية المفيدة.');render();})
 ]);
}


const SOCIAL_REACTION_NAMES=['مريم','عمر','ليلى','آدم','نور','يوسف','سلمى','زياد','ملك','ياسين','جنى','كريم'];
const SOCIAL_REACTION_BANK={
 positive:['المحتوى ده خلاني أبتسم.','استمر، عندك أسلوب مميز.','مستنيين الجديد منك.','فكرة جميلة وتنفيذ أحسن.','واضح إنك تعبت في الشغل ده.'],
 neutral:['ممكن توضح الفكرة أكتر؟','محتوى لطيف، بس محتاج تفاصيل.','زاوية مختلفة ممكن تخلي الفكرة أقوى.','شفت الفكرة دي قبل كده، جرّب لمستك الخاصة.'],
 critical:['مش متفق معاك في النقطة دي.','التقديم محتاج شوية شغل.','المحتوى مش مناسب لذوقي، بس بالتوفيق.','كان ممكن تختار توقيت أوضح للنشر.']
};
function normalizeSocialFeed(raw){
 if(!Array.isArray(raw))return [];
 return raw.filter(item=>item&&typeof item==='object'&&!Array.isArray(item)).slice(-30).map((item,index)=>{
  const platformId=String(item.platformId||'instagram').slice(0,30);
  const platform=SOCIAL_PLATFORM_CATALOG.find(entry=>entry.id===platformId);
  const reactions=Array.isArray(item.reactions)?item.reactions.slice(0,3).map(reaction=>{
   if(!reaction||typeof reaction!=='object')return null;
   const tone=['positive','neutral','critical'].includes(reaction.tone)?reaction.tone:'neutral';
   return {name:String(reaction.name||'متابع').slice(0,40),tone,emoji:String(reaction.emoji||'💬').slice(0,8),text:String(reaction.text||'').slice(0,180)};
  }).filter(reaction=>reaction&&reaction.text):[];
  const age=Number(item.age),likes=Number(item.likes),followersGained=Number(item.followersGained);
  return {
   id:String(item.id||'social-legacy-'+index).slice(0,80),
   platformId,
   platformTitle:String(item.platformTitle||(platform&&platform.title)||'منصة اجتماعية').slice(0,50),
   kind:['story','video','sponsor','track','collab'].includes(item.kind)?item.kind:'story',
   title:String(item.title||'').slice(0,80),
   age:Number.isFinite(age)?Math.max(0,Math.min(150,Math.floor(age))):0,
   likes:Number.isFinite(likes)?Math.max(0,Math.min(1000000000,Math.round(likes))):0,
   followersGained:Number.isFinite(followersGained)?Math.max(0,Math.min(1000000000,Math.round(followersGained))):0,
   outcome:item.outcome==='انتشار واسع'?'انتشار واسع':'تفاعل محدود',
   reactions
  };
 }).filter(post=>post.title);
}
function buildSocialReactions(viral){
 const tones=viral?['positive','positive','neutral']:['positive','neutral','critical'];
 return tones.map(tone=>({name:pick(SOCIAL_REACTION_NAMES),tone,emoji:tone==='positive'?'❤️':tone==='critical'?'🗣️':'💬',text:pick(SOCIAL_REACTION_BANK[tone])}));
}
function createSocialAudiencePost(platform,kind,viral,likes,followersGained){
 const titles={story:'صورة أو قصة جديدة',video:'فيديو جديد',sponsor:'تعاون تجاري',track:'مقطع صوتي جديد',collab:'تعاون فني جديد'};
 return {
  id:'social-'+Date.now()+'-'+Math.floor(Math.random()*1000000),
  platformId:platform.id,
  platformTitle:platform.title,
  kind,
  title:titles[kind]||'منشور جديد',
  age:state.age,
  likes:Math.max(0,Math.round(Number(likes)||0)),
  followersGained:Math.max(0,Math.round(Number(followersGained)||0)),
  outcome:viral?'انتشار واسع':'تفاعل محدود',
  reactions:buildSocialReactions(viral)
 };
}

function ensureSocialPlatforms(){
 if(!state.socialPlatforms||typeof state.socialPlatforms!=='object'||Array.isArray(state.socialPlatforms))state.socialPlatforms={};
 const raw=state.socialPlatforms,normalized={};
 SOCIAL_PLATFORM_CATALOG.forEach(platform=>{
  const saved=raw[platform.id]&&typeof raw[platform.id]==='object'?raw[platform.id]:{};
  normalized[platform.id]={active:!!saved.active,followers:Math.max(0,Number(saved.followers)||0),posts:Math.max(0,Number(saved.posts)||0)};
 });
 if(state.socialMediaAccount&&!SOCIAL_PLATFORM_CATALOG.some(platform=>normalized[platform.id].active)){
  normalized.instagram={active:true,followers:Math.max(0,Number(state.followers)||10),posts:Math.max(0,Number(state.socialMediaPosts)||0)};
 }
 state.socialPlatforms=normalized;
 state.followers=Math.max(0,Number(state.followers)||0);
 state.socialMediaPosts=Math.max(0,Number(state.socialMediaPosts)||0);
 state.socialMediaAccount=SOCIAL_PLATFORM_CATALOG.some(platform=>normalized[platform.id].active);
 return normalized;
}
function socialMediaMenu(){
 const platforms=ensureSocialPlatforms(),active=SOCIAL_PLATFORM_CATALOG.filter(platform=>platforms[platform.id].active),inactive=SOCIAL_PLATFORM_CATALOG.filter(platform=>!platforms[platform.id].active);
 const opts=[];
 if(active.length){
  opts.push(section('القنوات النشطة'));
  active.forEach(platform=>{
   const data=platforms[platform.id],row=choice(platform.emoji,platform.title,'المتابعون '+fmt(data.followers)+' · المنشورات '+fmt(data.posts),()=>socialPlatformMenu(platform.id));
   row.menuDots=true;opts.push(row);
  });
 }
 if(inactive.length){
  opts.push(section('القنوات غير النشطة'));
  inactive.forEach(platform=>{
   const subtitle=state.age<platform.minAge?'التسجيل متاح من سن '+platform.minAge+' سنة':'إنشاء حساب على '+platform.title;
   const row=choice(platform.emoji,platform.title,subtitle,()=>signUpSocialPlatform(platform.id));
   row.menuDots=true;opts.push(row);
  });
 }
 if(active.length){
  opts.push(section('إحصاءات عامة'));
  opts.push(choice('📊','إحصاءات كل الحسابات','إجمالي المتابعين '+fmt(state.followers||0)+' · المنشورات '+fmt(state.socialMediaPosts||0)+'.',()=>{closeModal();info('📊','إحصاءات السوشيال ميديا','إجمالي المتابعين '+fmt(state.followers||0)+'. إجمالي المنشورات '+fmt(state.socialMediaPosts||0)+'. الشهرة '+clamp(state.fame||0)+'%. السمعة '+clamp(state.reputation||50)+'%.');}));
  opts.push(choice('💬','صدى الجمهور','راجع آخر ردود المتابعين على منشوراتك.',()=>socialAudienceFeedMenu()));
 }
 modal('📱','السوشيال ميديا','أنشئ حسابات على منصات مختلفة، وانشر محتوى، وراقب نمو الجمهور.',opts);
}
function signUpSocialPlatform(id){
 closeModal();const platforms=ensureSocialPlatforms(),platform=SOCIAL_PLATFORM_CATALOG.find(item=>item.id===id);if(!platform)return;
 if(state.age<platform.minAge){info('🔒','التسجيل غير متاح بعد','تقدر تنشئ حساب '+platform.title+' من سن '+platform.minAge+' سنة.');return;}
 const account=platforms[id];
 if(account.active){socialPlatformMenu(id);return;}
 account.active=true;
 if(account.followers<=0){account.followers=10+Math.floor(Math.random()*91);state.followers+=account.followers;}
 state.socialMediaAccount=true;
 log('📱','إنشاء حساب على '+platform.title,'بدأت حسابًا جديدًا. النمو هيعتمد على نوع المحتوى والاستمرار.','good');
 save();render();socialPlatformMenu(id);
}
function createSocialAccount(){signUpSocialPlatform('instagram');}
function socialPlatformMenu(id){
 const platforms=ensureSocialPlatforms(),platform=SOCIAL_PLATFORM_CATALOG.find(item=>item.id===id),account=platforms[id];
 if(!platform||!account||!account.active){socialMediaMenu();return;}
 const opts=platform.id==='soundcloud'?[
  choice('🎧','نشر مقطع صوتي','سجّل عملًا جديدًا واختبر تفاعل الجمهور.',()=>publishSocialContent('track',id)),
  choice('🤝','التعاون مع فنان','اعمل على مقطع مشترك لزيادة فرص الوصول.',()=>publishSocialContent('collab',id)),
  choice('🏷️','عرض مقطع على شركة إنتاج','قد تحصل على عرض شراء إذا كان لديك عمل منشور.',()=>offerSoundCloudTrackToLabel(id))
 ]:[
  choice('📸','نشر صورة أو قصة','محتوى بسيط قد يزيد التفاعل والمتابعين.',()=>publishSocialContent('story',id)),
  choice('🎥','نشر فيديو','جهد أكبر وفرصة انتشار أوسع.',()=>publishSocialContent('video',id)),
  choice('🤝','تعاون مدفوع','حملة برعاية شركة، تحتاج سمعة وجمهورًا.',()=>publishSocialContent('sponsor',id),'2,000 '+state.place.unit)
 ];
 opts.push(section('إحصاءات القناة'));
 opts.push(choice('💬','ردود الجمهور','افتح آخر التفاعلات والتعليقات على منشورات القناة.',()=>socialAudienceFeedMenu(id)));
 opts.push(choice('📊','أداء '+platform.title,'المتابعون '+fmt(account.followers)+' · المنشورات '+fmt(account.posts)+'.',()=>{closeModal();info('📊',platform.title,'المتابعون: '+fmt(account.followers)+'. المنشورات: '+fmt(account.posts)+'. الشهرة '+clamp(state.fame||0)+'%.');}));
 opts.push(choice('⏸️','إيقاف القناة','إخفاء القناة من قائمة النشطة مع الاحتفاظ بسجلها.',()=>{closeModal();account.active=false;state.socialMediaAccount=SOCIAL_PLATFORM_CATALOG.some(item=>platforms[item.id].active);log('📱','إيقاف قناة '+platform.title,'أوقفت النشر على '+platform.title+'. بيانات القناة محفوظة.','');save();render();socialMediaMenu();}));
 opts.push(choice('↩️','رجوع للقنوات','',socialMediaMenu));
 modal(platform.emoji,platform.title,'إدارة القناة ومحتواها. الانتشار غير مضمون ومرتبط بالاختيارات.',opts);
}
function socialAudienceFeedMenu(platformId){
 const posts=normalizeSocialFeed(state.socialFeed).filter(post=>!platformId||post.platformId===platformId).slice().reverse();
 const opts=posts.map(post=>choice('💬',post.title,post.platformTitle+' · '+post.age+' سنة · '+fmt(post.likes)+' إعجاب · '+post.outcome,()=>socialPostDetailMenu(post.id)));
 if(!posts.length)opts.push({icon:'🫧',title:'لسه مفيش تفاعلات',desc:'انشر محتوى من إحدى القنوات عشان يبدأ الجمهور يرد عليك.',disabled:true});
 opts.push(choice('↩️',platformId?'رجوع للقناة':'رجوع للمنصات','',()=>platformId?socialPlatformMenu(platformId):socialMediaMenu()));
 modal('💬','صدى الجمهور',posts.length?'آخر '+posts.length+' منشورًا وردود الجمهور عليها.':'هنا هتظهر ردود المتابعين بعد نشر المحتوى.',opts);
}
function socialPostDetailMenu(postId){
 const post=normalizeSocialFeed(state.socialFeed).find(item=>item.id===postId);
 if(!post){socialAudienceFeedMenu();return;}
 const opts=[section('ردود المتابعين'),...post.reactions.map(reaction=>({icon:reaction.emoji,title:reaction.name,desc:reaction.text,disabled:true}))];
 if(!post.reactions.length)opts.push({icon:'💬',title:'لا توجد ردود محفوظة',desc:'التفاعل اتسجل من غير تعليقات نصية.',disabled:true});
 opts.push(choice('↩️','رجوع لصدى الجمهور','',()=>socialAudienceFeedMenu(post.platformId)));
 modal('💬',post.title,post.platformTitle+' · '+post.age+' سنة · '+fmt(post.likes)+' إعجاب · '+fmt(post.followersGained)+' متابع جديد · '+post.outcome,opts);
}
function offerSoundCloudTrackToLabel(platformId='soundcloud'){
 closeModal();
 const platforms=ensureSocialPlatforms(),platform=SOCIAL_PLATFORM_CATALOG.find(item=>item.id===platformId),account=platforms[platformId];
 if(!platform||!account||!account.active){socialMediaMenu();return;}
 const hasTrack=normalizeSocialFeed(state.socialFeed).some(post=>post.platformId==='soundcloud'&&post.kind==='track');
 if(!hasTrack){info('🎧','انشر مقطعًا أولًا','لازم يكون عندك مقطع صوتي منشور قبل ما تعرضه على شركة إنتاج.');return;}
 const offerChance=clamp(22+(Number(state.fame)||0)*.45+Math.min(24,(Number(account.followers)||0)/500),8,82);
 if(chance(offerChance/100)){
  const payment=Math.round(5000+(Number(account.followers)||0)*.06+Math.random()*7000);
  state.bank+=payment;state.fame=clamp((state.fame||0)+3);state.reputation=clamp((state.reputation||50)+2);
  log('🏷️','عرض من شركة إنتاج','شركة إنتاج أعجبت بمقطعك وعرضت شراء حقوق استخدامه مقابل '+cash(payment)+'.','good');
  save();render();info('⭐','وصل عرض إنتاج','وافقت شركة إنتاج على شراء حقوق استخدام المقطع مقابل '+cash(payment)+'.');
 }else{
  state.stats.happiness=clamp(state.stats.happiness-1);
  log('🎧','لم يصل عرض هذه المرة','راجعت شركة إنتاج المقطع، لكنها لم تقدم عرضًا الآن. تقدر تطور أعمالك وتحاول لاحقًا.','');
  save();render();info('🎧','لا يوجد عرض حاليًا','الرفض مش نهاية الطريق؛ انشر أعمالًا جديدة وطوّر جمهورك.');
 }
}
function publishSocialContent(kind,platformId){
 closeModal();
 const platforms=ensureSocialPlatforms(),activeId=platformId||(SOCIAL_PLATFORM_CATALOG.find(platform=>platforms[platform.id].active)||{}).id,platform=SOCIAL_PLATFORM_CATALOG.find(item=>item.id===activeId),account=platforms[activeId];
 if(!state.socialMediaAccount||!platform||!account||!account.active){socialMediaMenu();return;}
 const costs={story:0,video:250,sponsor:2000,track:350,collab:700},cost=costs[kind]||0;
 if(state.bank<cost){info('💳','الرصيد مش كفاية','النشاط محتاج '+cash(cost)+'.');return;}
 if(kind==='sponsor'&&state.age<18){info('🔒','التعاون التجاري متاح للبالغين','التعاونات التجارية متاحة من سن 18 داخل اللعبة.');return;}
 if(kind==='collab'&&state.age<13){info('🔒','التعاون الفني متاح لاحقًا','التعاونات الفنية متاحة من سن 13 سنة داخل اللعبة.');return;}
 if((kind==='track'||kind==='collab')&&platform.id!=='soundcloud'){info('🔒','النشاط مرتبط بمنصة صوتية','المقاطع الصوتية والتعاون الفني متاحان من قناة SoundCloud داخل اللعبة.');return;}
 if(platform.id==='onlyfans'&&state.age<18){info('🔒','القناة متاحة للبالغين','النشر على هذه المنصة متاح من سن 18 داخل اللعبة.');return;}
 state.bank-=cost;state.socialMediaPosts=(state.socialMediaPosts||0)+1;account.posts=(account.posts||0)+1;
 const strength=(state.stats.smart/200)+(state.stats.looks/250)+(state.fame/180)+(state.reputation/220);
 const formatBonus=kind==='collab'?.12:kind==='track'?.08:0;
 const viral=chance(Math.min(.82,.12+strength+formatBonus));let gain=0;
 if(viral){
  gain=kind==='sponsor'?Math.round(1500+state.followers*.05+Math.random()*5000):kind==='video'?Math.round(40+Math.random()*400+state.fame*6):kind==='track'?Math.round(20+Math.random()*180+state.fame*3):kind==='collab'?Math.round(60+Math.random()*360+state.fame*5):Math.round(8+Math.random()*100);
  state.followers=Math.max(0,(state.followers||0)+gain);account.followers=Math.max(0,(account.followers||0)+gain);
  state.fame=clamp(state.fame+(kind==='video'?4:kind==='collab'?3:2));state.reputation=clamp(state.reputation+2);
  if(kind==='sponsor')state.bank+=gain;
  const eventTitle=kind==='sponsor'?'تعاون تجاري ناجح':kind==='video'?'فيديو انتشر':kind==='track'?'مقطع صوتي انتشر':kind==='collab'?'تعاون فني ناجح':'تفاعل مع منشور';
  log('📱',eventTitle,'زاد جمهور '+platform.title+' بمقدار '+fmt(gain)+' متابع.'+(kind==='sponsor'?' وكسبت '+cash(gain)+'.':''),'good');
 }else{
  state.stats.happiness=clamp(state.stats.happiness-1);if(chance(.25))state.reputation=clamp(state.reputation-3);
  log('📱','تفاعل محدود','المحتوى على '+platform.title+' ماوصلش لجمهور كبير المرة دي. راجع التوقيت والأسلوب وجرب تاني.','');
 }
 const likes=Math.max(0,Math.round((Number(account.followers)||0)*(viral?.18:.035)+Math.random()*12));
 const post=createSocialAudiencePost(platform,kind,viral,likes,gain);
 state.socialFeed=normalizeSocialFeed([...(Array.isArray(state.socialFeed)?state.socialFeed:[]),post]);
 if(state.followers>=1000)achievement('بناء جمهور على السوشيال ميديا');if(state.followers>=100000)achievement('وصلت إلى مئة ألف متابع');
 save();render();
 const firstReaction=post.reactions[0];
 info(viral?'⭐':'💬',viral?'المحتوى انتشر':'المحتوى لم ينتشر',(viral?'متابعو '+platform.title+': '+fmt(account.followers)+'. إجمالي المتابعين '+fmt(state.followers)+'. الشهرة '+state.fame+'%. ':'متابعو '+platform.title+': '+fmt(account.followers)+'. الانتشار مش مضمون. ')+'أول رد من '+firstReaction.name+': «'+firstReaction.text+'». افتح صدى الجمهور لقراءة باقي الردود.');
}


function salonMenu(){
 const opts=[
  choice('💈','قَصّة شعر جديدة','تعديل بسيط في المظهر مقابل 400 '+state.place.unit+'.',()=>salonAction('hair'),'400 '+state.place.unit),
  choice('👕','تجديد الملابس','إطلالة جديدة مقابل 1,500 '+state.place.unit+'.',()=>salonAction('clothes'),'1,500 '+state.place.unit),
  choice('✨','تغيير كامل للإطلالة','مظهر جديد مقابل 3,000 '+state.place.unit+'.',()=>salonAction('makeover'),'3,000 '+state.place.unit),
  choice('↩️','الأنشطة','',()=>{closeModal();activities();})
 ];
 modal('💈','الصالون والمظهر','غيّر إطلالتك لرفع الثقة والمظهر. الأثر داخل اللعبة فقط.',opts);
}
function salonAction(kind){
 closeModal();const cost=kind==='hair'?400:kind==='clothes'?1500:3000;if(state.bank<cost){info('💳','الرصيد مش كفاية','الخدمة تكلف '+cash(cost)+'.');return;}
 if(state.age<5){info('🔒','لسه بدري','الخدمات دي هتكون مناسبة من سن 5 سنوات.');return;}
 state.bank-=cost;const gain=kind==='hair'?3:kind==='clothes'?4:8;stat('looks',gain);stat('happiness',kind==='makeover'?5:3);log('💈','تغيير الإطلالة',kind==='hair'?'غيّرت قصة شعرك واهتميت بمظهرك.':kind==='clothes'?'جددت ملابسك وغيّرت أسلوبك.':'عملت تغييرًا كاملًا للإطلالة.','good');render();info('✨','إطلالة جديدة','مستوى المظهر الحالي '+state.stats.looks+'%.');
}
function cinemaMenu(){
 const opts=[
  choice('😂','كوميديا','خروجة خفيفة تحسّن المزاج.',()=>cinemaAction('comedy')),
  choice('🎭','دراما','قصة مؤثرة وتجربة ثقافية.',()=>cinemaAction('drama')),
  choice('🚀','خيال علمي','تجربة ممتعة ومختلفة.',()=>cinemaAction('scifi')),
  choice('↩️','رجوع','',()=>{closeModal();activities();})
 ];
 modal('🎬','السينما','تذكرة الفيلم تكلف 300 '+state.place.unit+'. اختار نوع الفيلم.',opts);
}
function cinemaAction(kind){
 closeModal();if(state.bank<300){info('💳','الرصيد مش كفاية','التذكرة تكلف 300 '+state.place.unit+'.');return;}
 state.bank-=300;stat('happiness',kind==='comedy'?6:4);if(kind==='drama')stat('smart',1);log('🎬','زيارة السينما',kind==='comedy'?'ضحكت وغيّرت جو بعيدًا عن ضغط اليوم.':kind==='drama'?'شفت فيلمًا دراميًا وخرجت بأفكار جديدة.':'حضرت فيلم خيال علمي واستمتعت بالتجربة.','good');render();info('🎬','انتهى الفيلم','حالتك الحالية: السعادة '+state.stats.happiness+'%.');
}
function financeMenu(){
 const opts=[];
 opts.push(choice('📊','الاستثمارات','أسهم ومحافظ تتغير قيمتها سنويًا.',investingMenu));
 if(perkOwned('investorPack'))opts.push(choice('🧑‍💼','المستشار المالي','إدارة استثمارية اختيارية برسوم معلومة.',financialAdvisorMenu));
 if(state.debt>0)opts.push(choice('💳','سداد الديون','إجمالي الدين '+cash(state.debt)+'.',repayDebt));
 opts.push(choice('🏦','قرض طارئ','استلف 10,000 '+state.place.unit+' مع فائدة سنوية.',takeLoan,'10,000 '+state.place.unit));
 opts.push(choice('💰','ملخص مالي','رصيد البنك '+cash(state.bank)+' · الديون '+cash(state.debt||0)+' · قيمة الأصول '+cash(state.assets.reduce((t,a)=>t+a.value,0)) ,()=>{closeModal();info('💰','ملخص مالي','صافي الثروة التقديري '+cash(state.bank+(state.assets||[]).reduce((t,a)=>t+a.value,0)+(state.investments||[]).reduce((t,a)=>t+a.value,0)-(state.debt||0))+'.');}));
 modal('🏦','المال والديون','راقب صافي ثروتك، واحتفظ باحتياطي للطوارئ قبل الاستثمار.',opts);
}
function takeLoan(){
 closeModal();if(state.age<18){info('🔒','القرض بعد 18 سنة','الاقتراض متاح للبالغين فقط.');return;}
 state.bank+=10000;state.debt=(state.debt||0)+10000;log('🏦','قرض جديد','استلفت 10,000 '+state.place.unit+'. الفائدة السنوية 8% والدين مسؤولية لازم تسددها.','bad');render();info('🏦','تمت إضافة القرض','الرصيد زاد، لكن إجمالي ديونك بقى '+cash(state.debt)+'.');
}
function repayDebt(){
 closeModal();const amount=Math.min(Math.max(0,state.bank),state.debt||0);if(amount<=0){info('💳','مفيش مبلغ متاح للسداد','الرصيد الحالي مش كافي للسداد.');return;}
 modal('💳','سداد الديون','تقدر تسدد جزءًا من الدين أو تسدده بالكامل.',[
  choice('💵','سداد 25%','تقليل الدين تدريجيًا.',()=>payDebt(Math.min(amount,Math.max(1000,Math.round(state.debt*.25))))),
  choice('✅','سداد كل المتاح','سداد حتى رصيدك المتاح.',()=>payDebt(amount)),
  choice('↩️','رجوع','',financeMenu)
 ]);
}
function payDebt(amount){
 closeModal();const paid=Math.min(amount,Math.max(0,state.bank),state.debt);if(paid<=0){info('💳','لا يوجد رصيد كافٍ','');return;}
 state.bank-=paid;state.debt-=paid;log('💳','سداد دين','سددت '+cash(paid)+'. المتبقي من الدين '+cash(state.debt)+'.','good');render();info('💳','تم السداد','قللت ديونك، وده هيقلل ضغط الفوائد في السنوات القادمة.');
}
function activity(type){
 closeModal();
 if(type==='doctor'){
  if(state.bank<1200){info('💳','الرصيد مش كفاية','زيارة الطبيب تكلف '+cash(1200)+'.');return;}
  state.bank-=1200;flash('-'+cash(1200),true);stat('health',16);
  const treatedCondition=state.sti===true;if(treatedCondition)state.sti=false;
  log('🩺','زيارة الطبيب','دفعت '+cash(1200)+' واهتميت بصحتك.'+(treatedCondition?' وتم علاج الحالة الصحية المحاكية المسجلة في اللعبة.':' لو التعب مستمر، المتابعة الطبية المنتظمة أفضل.'),'good');
 }
 if(type==='gym'){if(state.age<12){info('🏃','نشاط مناسب للعمر','اللعب والحركة المناسبة لسنك كفاية في المرحلة دي.');return;}if(state.bank<300){info('💳','الرصيد مش كفاية','اشتراك الجيم يكلف '+cash(300)+'.');return;}state.bank-=300;flash('-'+cash(300),true);stat('health',7);stat('looks',4);stat('happiness',2);log('🏋️','تمرنت في الجيم','دفعت '+cash(300)+' وتمرنت. الاستمرار أهم من تمرينة واحدة.','good');}
 if(type==='library'){stat('smart',5);stat('happiness',1);log('📚','وقت في المكتبة','قرأت وتعلمت حاجة جديدة من غير ما تدفع فلوس.','good');}
 if(type==='vacation'){if(state.bank<1800){info('💳','الرصيد مش كفاية','الخروجة تكلف '+cash(1800)+'. جرب نشاط مجاني.');return;}state.bank-=1800;flash('-'+cash(1800),true);stat('happiness',8);stat('health',2);log('🏖️','خروجة لتغيير الجو','دفعت '+cash(1800)+' وغيّرت روتينك شوية.','good');}
 if(type==='volunteer'){stat('happiness',5);stat('reputation',2);log('🤝','مساعدة مجتمعية','خصصت وقتك لمساعدة ناس في محيطك.','good');achievement('شاركت في عمل مجتمعي');}
 if(type==='lottery'){if(state.bank<100){info('💳','الرصيد مش كفاية','تذكرة اليانصيب تكلف 100 '+state.place.unit+'.');return;}state.bank-=100;if(chance(.065)){const prize=5000+Math.floor(Math.random()*45000);state.bank+=prize;stat('happiness',7);log('🎟️','فزت في اليانصيب','فزت بجائزة '+cash(prize)+' بعد شراء تذكرة.','good');achievement('الفوز بجائزة اليانصيب');}else{log('🎟️','تذكرة يانصيب','ماكسبتش المرة دي وخسرت سعر التذكرة. خلي اللعب في حدود ميزانيتك.','');}render();}
 if(type==='nightlife'){if(state.age<18){info('🔒','النشاط متاح للبالغين','الحياة الليلية متاحة من سن 18 داخل اللعبة.');return;}if(state.bank<1200){info('💳','الرصيد مش كفاية','الخروجة تكلف 1,200 '+state.place.unit+'.');return;}state.bank-=1200;const fun=chance(.78);stat('happiness',fun?7:2);if(!fun)stat('health',-3);log('🌃','خروجة ليلية',fun?'قضيت وقتًا ممتعًا ورجعت بمزاج أفضل.':'الخروجة كانت مرهقة ومكلفة أكتر من المتوقع.',fun?'good':'bad');render();}
 if(type==='donate'){if(state.bank<1000){info('💳','الرصيد مش كفاية','التبرع يحتاج 1,000 '+state.place.unit+'.');return;}state.bank-=1000;stat('reputation',4);stat('happiness',3);log('❤️','تبرع خيري','خصصت مبلغًا لمساعدة جهة مجتمعية.','good');achievement('قدمت تبرعًا خيريًا');render();}
 if(type==='crime'){
  modal('⚖️','قرار فيه مخاطرة','التصرف غير القانوني ممكن يسبب ضرر للناس ويعرّضك لعواقب داخل اللعبة. تقدر تختار طريق قانوني بدلًا منه.',[
   choice('🚫','أتراجع','أدور على طريقة قانونية أكسب منها.',()=>{closeModal();stat('smart',1);log('⚖️','قرار مسؤول','تراجعت عن المخاطرة وقررت تدور على بديل أفضل.','good');render();}),
   choice('🎲','أخاطر','خسارة مالية أو تبعات قانونية محتملة.',()=>{closeModal();if(chance(.48)){const gain=3000+Math.floor(Math.random()*7000);state.bank+=gain;flash('+'+cash(gain));log('⚠️','مكسب قصير المدى','حققت '+cash(gain)+'، لكن المخاطرة كانت كبيرة.','bad');}else{const fine=Math.min(Math.max(0,state.bank),5000);state.bank-=fine;stat('happiness',-8);if(chance(.45)){if(perkEnabled('goldenResume'))log('🛡️','حماية السيرة الذهبية','حافظت على وظيفتك رغم العواقب القانونية داخل اللعبة.','good');else{state.job=null;log('🚔','عواقب قانونية','خسرت '+cash(fine)+' وتضررت سمعتك وفقدت عملك بسبب القضية.','bad');}}else log('🚔','عواقب قانونية','خسرت '+cash(fine)+' وتعلمت إن المكسب السريع ممكن تكون تكلفته أكبر.','bad');}render();})
  ]);return;
 }
 render();closeModal();
}

function importSave(){
 closeModal();
 const input=document.createElement('input');input.type='file';input.accept='application/json,.json';
 input.addEventListener('change',()=>{
  const file=input.files&&input.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=()=>{
   try{
    const parsed=JSON.parse(String(reader.result||''));
    const isBundle=!!(parsed&&parsed.format===BACKUP_FORMAT);
    if(isBundle&&(parsed.backupVersion!==BACKUP_VERSION||!Array.isArray(parsed.cemetery)||!parsed.settings||typeof parsed.settings!=='object'||Array.isArray(parsed.settings)||!parsed.perks||typeof parsed.perks!=='object'||Array.isArray(parsed.perks)))throw new Error('invalid-bundle');
    const data=isBundle?parsed.life:parsed;
    const importedAux=isBundle?{cemetery:normalizeCemetery(parsed.cemetery),settings:normalizeUiSettings(parsed.settings),perks:normalizePermanentPerks(parsed.perks)}:null;
    if(!isValidSaveData(data)||!Array.isArray(data.family)||!data.place||typeof data.place!=='object'||Array.isArray(data.place))throw new Error('invalid');
    normalizeCoreState(data);
    const defaults={lifeId:Date.now()+Math.random(),cemeterySaved:false,jobHistory:[],specialCareer:null,specialCareerHistory:[],combatCareer:null,filmStudio:null,investments:[],business:null,married:false,children:[],coParentingPlans:[],pets:[],hobbies:[],fame:0,followers:0,socialMediaAccount:false,socialMediaPosts:0,socialFeed:[],reputation:50,crimeRecord:0,prison:null,debt:0,willDistribution:'الأسرة بالتساوي',heirlooms:[],dailyRewardDate:null,dailyChallenges:null,boostUsedAge:null,timeMachineSnapshots:[],legacy:{name:null,inheritance:0,heirloom:null},driversLicense:false,travelHistory:[],retired:false,yearCount:data.age||0,assets:[],friends:[],accomplishments:[],status:'حي'};
    Object.keys(defaults).forEach(k=>{if(data[k]===undefined||data[k]===null)data[k]=defaults[k];});
    if(!Array.isArray(data.assets))data.assets=[];if(!Array.isArray(data.timeMachineSnapshots))data.timeMachineSnapshots=[];if(!Array.isArray(data.coParentingPlans))data.coParentingPlans=[];data.coParentingPlans.forEach(p=>{if(p&&typeof p==='object'){if(!Array.isArray(p.childIds))p.childIds=[];if(!Array.isArray(p.history))p.history=[];if(!Number.isFinite(Number(p.supportPerChild)))p.supportPerChild=2200;if(!Number.isFinite(Number(p.arrears)))p.arrears=0;}});data.assets.forEach(a=>{if((a.kind==='car'||a.kind==='property')&&!Number.isFinite(Number(a.condition)))a.condition=100;});
    if(!data.education||typeof data.education!=='object')data.education={level:0,school:'لم تبدأ الدراسة',major:null,yearsLeft:0,tuition:0};data.education.clubs=Array.isArray(data.education.clubs)?data.education.clubs:[];
    const npcDefaults=n=>{if(!n||typeof n!=='object')return;if(!Number.isFinite(Number(n.generosity)))n.generosity=50;if(!Number.isFinite(Number(n.craziness)))n.craziness=50;if(!Number.isFinite(Number(n.money)))n.money=50;if(!Number.isFinite(Number(n.petulance)))n.petulance=50;if(!Number.isFinite(Number(n.loyalty)))n.loyalty=55;if(!Number.isFinite(Number(n.jealousy)))n.jealousy=40;if(!Number.isFinite(Number(n.reliability)))n.reliability=55;if(!Array.isArray(n.interactions))n.interactions=[];};if(!Array.isArray(data.specialCareerHistory))data.specialCareerHistory=[];const careerDefaults=c=>{if(!c||typeof c!=='object')return;if(!c.record||typeof c.record!=='object')c.record={attempts:0,wins:0,losses:0,projects:0,totalEarnings:0,bestLevel:clamp(c.level||1)};if(!Array.isArray(c.history))c.history=[];};careerDefaults(data.specialCareer);data.specialCareerHistory.forEach(careerDefaults);(data.family||[]).forEach(npcDefaults);(data.friends||[]).forEach(npcDefaults);(data.children||[]).forEach(npcDefaults);npcDefaults(data.partner);
    const previousState=state,previousDead=dead,previousSettings={...uiSettings},previousPerks=permanentPerks;
    const storageKeys=[KEY,BACKUP_KEY,CEMETERY_KEY,SETTINGS_KEY,PERKS_KEY],previousStorage={};
    storageKeys.forEach(key=>{previousStorage[key]=localStorage.getItem(key);});
    try{
     // Preserve the currently active life before any import, even when the incoming
     // file has the same lifeId and age (the normal save checkpoint would skip it).
     const previousLifeRaw=previousStorage[KEY];
     if(previousLifeRaw){
      let previousLife=null;
      try{previousLife=JSON.parse(previousLifeRaw);}catch(e){}
      if(isValidSaveData(previousLife))localStorage.setItem(BACKUP_KEY,previousLifeRaw);
     }
     if(importedAux){
      localStorage.setItem(CEMETERY_KEY,JSON.stringify(importedAux.cemetery));
      localStorage.setItem(SETTINGS_KEY,JSON.stringify(importedAux.settings));
      localStorage.setItem(PERKS_KEY,JSON.stringify(importedAux.perks));
      uiSettings=importedAux.settings;permanentPerks=importedAux.perks;applyUiSettings();
     }
     state=data;dead=state.status==='متوفى';
     if(!save())throw new Error('storage-write-failed');
     render();
     if(dead)death(state.cause||'نهاية رحلة الحياة');else info('📥','تم استيراد الحفظ','تم تحميل '+state.name+' · العمر '+state.age+' سنة.');
    }catch(importError){
     state=previousState;dead=previousDead;uiSettings=previousSettings;permanentPerks=previousPerks;applyUiSettings();
     storageKeys.forEach(key=>{try{const value=previousStorage[key];if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,value);}catch(e){}});
     if(previousState){try{render();}catch(e){}}
     throw importError;
    }
   }catch(e){info('⚠️','ملف حفظ غير صالح','اختار ملف JSON تم تصديره من لعبة حياة. الحفظ الحالي لم يتغير.');}
  };
  reader.onerror=()=>info('⚠️','تعذرت قراءة الملف','جرّب ملفًا آخر.');
  reader.readAsText(file);
 });
 input.click();
}
function createBackupBundle(){
 let cemetery=[];
 try{cemetery=normalizeCemetery(JSON.parse(localStorage.getItem(CEMETERY_KEY)||'[]'));}catch(e){}
 return {
  format:BACKUP_FORMAT,
  backupVersion:BACKUP_VERSION,
  exportedAt:new Date().toISOString(),
  life:JSON.parse(JSON.stringify(state)),
  cemetery,
  settings:normalizeUiSettings(uiSettings),
  perks:normalizePermanentPerks(permanentPerks)
 };
}
function exportSave(){
 if(!state){info('⚠️','لا توجد حياة للتصدير','ابدأ حياة أو حمّل ملف حفظ أولًا.');return;}
 let url=null,anchor=null;
 try{
  const bundle=createBackupBundle();
  const blob=new Blob([JSON.stringify(bundle,null,2)],{type:'application/json'});
  url=URL.createObjectURL(blob);
  anchor=document.createElement('a');anchor.href=url;anchor.download='hekayat-hayah-save.json';anchor.style.display='none';
  document.body.appendChild(anchor);
  anchor.click();
 }catch(e){
  if(anchor&&typeof anchor.remove==='function')anchor.remove();
  if(url){try{URL.revokeObjectURL(url);}catch(_){}}
  closeModal();info('⚠️','تعذر تصدير الحفظ','ما قدرناش نجهز الملف في المتصفح الحالي. الحفظ المحلي لم يتغير؛ جرّب متصفحًا أحدث.');return;
 }
 // Keep the download URL alive briefly so mobile browsers can start reading the file.
 setTimeout(()=>{if(anchor&&typeof anchor.remove==='function')anchor.remove();try{URL.revokeObjectURL(url);}catch(e){}},1000);
 closeModal();flash('تم تجهيز نسخة احتياطية كاملة');
}
document.querySelectorAll('[data-panel]').forEach(btn=>btn.addEventListener('click',()=>{
 document.querySelectorAll('.navbtn').forEach(b=>{
  const selected=b===btn;
  b.classList.toggle('active',selected);
  if(typeof b.setAttribute==='function')b.setAttribute('aria-pressed',String(selected));
 });
 const p=btn.dataset.panel;if(p==='career')showCareer();if(p==='assets')assets();if(p==='relations')relations();if(p==='activities')activities();
}));
$('statsPanel').addEventListener('click',event=>{
 const target=event.target&&typeof event.target.closest==='function'?event.target.closest('[data-stat-boost]'):null;
 if(target)statBoostMenu(target.getAttribute('data-stat-boost'));
});
$('ageUpBtn').addEventListener('click',()=>{playUiFeedback('year');ageUp();});
if($('menuBtn'))$('menuBtn').addEventListener('click',()=>mainMenu());
if($('profileBtn'))$('profileBtn').addEventListener('click',()=>achievementsMenu());
if($('marketBtn'))$('marketBtn').addEventListener('click',()=>premiumPerksMenu());
if($('characterInfoBtn'))$('characterInfoBtn').addEventListener('click',()=>{
 if(!state)return;
 const occupation=state.job?state.job.title:state.specialCareer?state.specialCareer.title:state.education.yearsLeft>0?'طالب جامعي':title();
 const details='العمر: '+fmt(state.age)+' سنة · '+state.place.city+'، '+state.place.country+'. الحالة: '+occupation+'. الرصيد: '+cash(state.bank)+'. الصحة '+clamp(state.stats.health)+'% · السعادة '+clamp(state.stats.happiness)+'% · الذكاء '+clamp(state.stats.smart)+'% · المظهر '+clamp(state.stats.looks)+'%.';
 info('👤','ملف الشخصية',details,[
  choice('🪪','تعديل بيانات الشخصية','الاسم وبيانات الحياة.',()=>{closeModal();customizeMenu();}),
  choice('✓','تمام','',closeModal)
 ]);
});
if($('heirloomBtn'))$('heirloomBtn').addEventListener('click',()=>dailyReward());
function init(){
 permanentPerks=loadPermanentPerks();
 loadUiSettings();
 state=load();
 if(state){dead=state.status==='متوفى';render();if(saveRecovered)$('saveStatus').textContent='↺ نسخة مستردة';if(dead)death(state.cause||'نهاية رحلة الحياة');}
 else{state=newLife();log('👶','أول يوم في الدنيا','اتولدت في '+state.place.city+'، '+state.place.country+'. أهلك '+state.family[0].name+' و'+state.family[1].name+' بيبدأوا معاك أول فصل في الحكاية.','special');log('🏡','البيت والعيلة','أبوك '+state.family[0].name+' شخص '+state.family[0].personality+'، وأمك '+state.family[1].name+' شخصيتها '+state.family[1].personality+'. دي أول شبكة أمان ليك.');achievement('بدأت رحلة الحياة');render();newLifeSetup();}
}
init();
})();
if(typeof window!=='undefined'&&typeof navigator!=='undefined'&&navigator.serviceWorker){
 window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
}