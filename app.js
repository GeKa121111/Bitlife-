'use strict';
(() => {
const $ = id => document.getElementById(id);
const KEY = 'hekayat_hayah_save_v1';
const BACKUP_KEY = 'hekayat_hayah_save_backup_v1';
const CEMETERY_KEY = 'hekayat_hayah_cemetery_v1';
const SETTINGS_KEY = 'hayah_ui_settings_v1';
const fmt = n => new Intl.NumberFormat('ar-EG',{maximumFractionDigits:0}).format(Math.round(Number(n)||0));
const cash = n => fmt(n)+' '+(state&&state.place?state.place.unit:'ج.م');
const clamp = (n,min=0,max=100) => Math.max(min,Math.min(max,Math.round(n)));
const pick = list => list[Math.floor(Math.random()*list.length)];
const chance = p => Math.random()<p;
const esc = s => String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let state, dead=false, logBatchDepth=0, logBatchDirty=false, saveRecovered=false;
let uiSettings={theme:'light',textScale:'normal'};
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
 {id:'computer',title:'علوم الحاسب',min:58,edu:3,cost:26000,years:4,emoji:'💻',desc:'برمجة وأنظمة وبيانات.'},
 {id:'engineering',title:'هندسة',min:65,edu:4,cost:30000,years:5,emoji:'🦺',desc:'تصميم وبناء وحلول تقنية.'},
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
 {id:'ring-general',title:'إدارة الحلبة',style:'تقنية',strongAgainst:'دفاع',power:52,rank:3,cost:11000,desc:'قراءة تكتيكية توازن بين التوقيت والطاقة.'}
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
function createCombatCareer(){
 return {rank:0,leaguePoints:0,streetCred:0,streetWins:0,leagueWins:0,wins:0,losses:0,knockouts:0,draws:0,
  technique:32+Math.floor(Math.random()*8),power:28+Math.floor(Math.random()*8),speed:31+Math.floor(Math.random()*8),defense:28+Math.floor(Math.random()*8),stamina:34+Math.floor(Math.random()*8),energy:100,
  injury:0,injuryYears:0,restUsedYear:-1,coach:null,movesKnown:['quick-jab','high-guard'],selectedMove:'quick-jab',champion:false,bouts:[],startedAge:state?state.age:18};
}
function ensureCombatCareer(){
 if(!state)return null;
 let c=state.combatCareer;
 if(!c||typeof c!=='object')c=state.combatCareer=createCombatCareer();
 const defaults={rank:0,leaguePoints:0,streetCred:0,streetWins:0,leagueWins:0,wins:0,losses:0,knockouts:0,draws:0,technique:25,power:25,speed:25,defense:25,stamina:30,energy:100,injury:0,injuryYears:0,restUsedYear:-1,coach:null,movesKnown:['quick-jab','high-guard'],selectedMove:'quick-jab',champion:false,bouts:[]};
 Object.keys(defaults).forEach(k=>{if(c[k]===undefined||c[k]===null)c[k]=defaults[k];});
 if(!Array.isArray(c.movesKnown))c.movesKnown=['quick-jab','high-guard'];
 if(!c.movesKnown.length)c.movesKnown=['quick-jab','high-guard'];
 if(!Array.isArray(c.bouts))c.bouts=[];
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
 return {version:1,lifeId:Date.now()+Math.random(),cemeterySaved:false,name:pick(names[gender])+' '+pick(names.family),gender,age:0,place,bank:place.start,stats:{happiness:65+Math.floor(Math.random()*26),health:76+Math.floor(Math.random()*22),smart:35+Math.floor(Math.random()*41),looks:35+Math.floor(Math.random()*51)},education:{level:0,school:'لم تبدأ الدراسة',major:null,yearsLeft:0,tuition:0},job:null,jobHistory:[],specialCareer:null,specialCareerHistory:[],combatCareer:null,filmStudio:null,esportsCareer:null,talents:{gaming:15+Math.floor(Math.random()*71)},performance:50,assets:[],investments:[],business:null,family:[father,mother,sibling],friends:[],partner:null,married:false,children:[],coParentingPlans:[],pets:[],hobbies:[],fame:0,followers:0,socialMediaAccount:false,socialMediaPosts:0,reputation:50,crimeRecord:0,prison:null,debt:0,willDistribution:'الأسرة بالتساوي',heirlooms:[],dailyRewardDate:null,dailyChallenges:null,timeMachineSnapshots:[],legacy:{name:null,inheritance:0,heirloom:null},driversLicense:false,travelHistory:[],log:[],accomplishments:['بدأت رحلة الحياة'],status:'حي',cause:null,retired:false,yearCount:0,wealthPeak:place.start};
}
function isValidSaveData(data){
 return !!(data&&data.version===1&&data.stats&&typeof data.stats==='object'&&!Array.isArray(data.stats)&&Array.isArray(data.log));
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
 }catch(e){$('saveStatus').textContent='⚠ الحفظ غير متاح';}
}
function normalizeCoreState(data){
 const rawPlace=data.place&&typeof data.place==='object'&&!Array.isArray(data.place)?data.place:{};
 const fallbackPlace=places.find(p=>p.country===rawPlace.country&&p.city===rawPlace.city)||places[0];
 data.place={...fallbackPlace,...rawPlace};
 ['country','city','flag','unit'].forEach(key=>{if(typeof data.place[key]!=='string'||!data.place[key].trim())data.place[key]=fallbackPlace[key];});
 if(!Number.isFinite(Number(data.place.start))||Number(data.place.start)<=0)data.place.start=fallbackPlace.start;
 const statDefaults={happiness:65,health:80,smart:40,looks:45};
 Object.keys(statDefaults).forEach(key=>{const value=Number(data.stats[key]);data.stats[key]=Number.isFinite(value)?clamp(value):statDefaults[key];});
 data.age=Number.isFinite(Number(data.age))?Math.max(0,Math.min(120,Math.floor(Number(data.age)))):0;
 data.bank=Number.isFinite(Number(data.bank))?Number(data.bank):Number(data.place.start)||0;
 if(!data.talents||typeof data.talents!=='object'||Array.isArray(data.talents))data.talents={};
 const gamingHobby=Array.isArray(data.hobbies)?data.hobbies.find(h=>h&&h.id==='gaming'):null;
 if(!Number.isFinite(Number(data.talents.gaming)))data.talents.gaming=gamingHobby?clamp(25+(Number(gamingHobby.level)||1)*5,0,100):35;
 data.talents.gaming=clamp(Number(data.talents.gaming),0,100);
 if(!data.esportsCareer||typeof data.esportsCareer!=='object'||Array.isArray(data.esportsCareer))data.esportsCareer=null;
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
  const defaults={lifeId:Date.now()+Math.random(),cemeterySaved:false,jobHistory:[],specialCareer:null,specialCareerHistory:[],combatCareer:null,filmStudio:null,investments:[],business:null,married:false,children:[],coParentingPlans:[],pets:[],hobbies:[],fame:0,followers:0,socialMediaAccount:false,socialMediaPosts:0,reputation:50,crimeRecord:0,prison:null,debt:0,willDistribution:'الأسرة بالتساوي',heirlooms:[],dailyRewardDate:null,dailyChallenges:null,timeMachineSnapshots:[],legacy:{name:null,inheritance:0,heirloom:null},driversLicense:false,travelHistory:[]};
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
function renderStats(){
 const rows=[['happiness','😄','السعادة'],['health','❤️','الصحة'],['smart','🧠','الذكاء'],['looks','😎','المظهر']];
 $('statsPanel').innerHTML=rows.map(r=>{
  const v=clamp(r[0]==='fame'?(state.fame||0):state.stats[r[0]]);
  const color=r[0]==='fame'?'#FDD835':v>=31?'#43A047':v>=13?'#FB8C00':'#E53935';
  const warn=v<=12&&r[0]!=='fame'?' <span class="stat-warning" aria-label="تحذير">⚠️</span>':'';
  return '<div class="statrow '+(r[0]==='fame'?'fame-row':'')+'"><div class="stathead"><span class="statlabel">'+r[2]+' '+r[1]+warn+'</span></div><div class="statbar"><div class="track"><div class="fill" style="width:'+v+'%;background:'+color+'"></div><span class="statvalue">'+v+'%</span></div></div></div>';
 }).join('');
}
function renderFeed(){
 const feed=$('lifeFeed');
 if(!state.log.length){feed.innerHTML='<div class="empty">لسه حكايتك في أولها. اضغط على زر <b>+ سنة</b> عشان تشوف إيه اللي هيحصل.</div>';return;}
 let html='',last=null;
 state.log.forEach(x=>{
  if(x.age!==last){last=x.age;html+='<div class="agegroup"><span>العمر: '+fmt(last)+' سنة</span></div>';}
  const tone=x.tone==='good'?' good':x.tone==='bad'?' bad':x.tone==='special'?' special':'';
  html+='<article class="logcard'+tone+'"><div class="logicon" aria-hidden="true">'+esc(x.icon)+'</div><div class="logcontent"><div class="logtitle">'+esc(x.title)+'</div><p class="logtext">'+esc(x.text)+'</p></div></article>';
 });
 feed.innerHTML=html;
 requestAnimationFrame(()=>{
  if(typeof feed.scrollTo==='function')feed.scrollTo({top:feed.scrollHeight,behavior:'smooth'});
  else feed.scrollTop=feed.scrollHeight;
 });
}
function syncBusinessAsset(){
 if(!state||!state.business)return;
 const asset=(state.assets||[]).find(a=>a.kind==='business'&&(a.id===state.business.assetId||a.title===state.business.title));
 if(asset){state.business.assetId=asset.id;asset.value=Math.max(1000,Math.round(Number(state.business.value)||asset.value||1000));}
}
function render(){
 syncBusinessAsset();renderHeader();renderStats();renderFeed();document.querySelectorAll('.navbtn').forEach(b=>b.classList.remove('active'));save();
}
function closeModal(){ $('modalRoot').innerHTML=''; }
function choice(icon,title,desc,action,price='',progress=null){return {icon,title,desc,action,price,progress};}
function modal(icon,title,desc,choices,closable=true,extra=''){
 const root=$('modalRoot');
 const isDrawer=['الدراسة والشغل','الأصول والمشتريات','العلاقات والأسرة','الأنشطة والحياة اليومية'].includes(title);
 const category=/(جريمة|سجن|طبيب|صحة|إصابة|خطر|مرض|وفاة|عقوبة)/.test(title)?'danger':
  /(مهنة|الشغل|وظيفة|عمل|مال|بنك|استثمار|مشروع|ترقية|راتب|أصول)/.test(title)?'success':
  /(شهرة|إنجاز|مقتنيات|ملك|أمير|جائزة|تاج)/.test(title)?'special':'normal';
 const labels={danger:'تنبيه مهم',success:'المهنة والمال',special:'إنجاز خاص',normal:'حدث من الحياة'};
 const list=choices.map((c,i)=>
  '<button class="choice" data-i="'+i+'" '+(c.disabled?'disabled':'')+'>'+
   '<span class="choiceico">'+(c.icon||'›')+'</span>'+
   '<span class="ctext"><span class="ctitle">'+esc(c.title||c.label||'اختيار')+'</span>'+
   (c.desc?'<span class="cdesc">'+esc(c.desc)+'</span>':'')+
   (c.progress!==null&&c.progress!==undefined&&Number.isFinite(Number(c.progress))?'<span class="choice-progress"><span style="width:'+clamp(c.progress)+'%"></span></span>':'')+
   '</span>'+(c.price?'<span class="price">'+esc(c.price)+'</span>':'')+
   (isDrawer?'<span class="choice-chevron" aria-hidden="true">‹</span>':'')+
  '</button>').join('');
 if(isDrawer){
  root.innerHTML='<div class="overlay drawer-overlay" id="overlay"><section class="modal drawer" role="dialog" aria-modal="true" aria-label="'+esc(title)+'"><div class="modalhead drawer-head"><div class="modalicon">'+icon+'</div><div class="modaltitle">'+esc(title)+'</div>'+(closable?'<button class="closebtn" id="closeModal" aria-label="إغلاق">×</button>':'')+'</div><div class="modalbody drawer-body">'+(desc?'<p class="desc">'+esc(desc)+'</p>':'')+extra+'<div class="choicegrid">'+list+'</div></div></section></div>';
 }else{
  root.innerHTML='<div class="overlay event-overlay" id="overlay"><section class="modal event-modal" role="dialog" aria-modal="true" aria-label="'+esc(title)+'"><div class="event-banner banner-'+category+'"><span>'+labels[category]+'</span>'+(closable?'<button class="closebtn" id="closeModal" aria-label="إغلاق">×</button>':'')+'</div><div class="event-summary"><div class="event-icon">'+icon+'</div><h2 class="event-title">'+esc(title)+'</h2>'+(desc?'<p class="desc">'+esc(desc)+'</p>':'')+'</div><div class="modalbody event-body">'+extra+'<div class="choicegrid">'+list+'</div></div></section></div>';
 }
 const overlay=$('overlay');
 overlay.addEventListener('click',e=>{if(e.target===overlay&&closable)closeModal();});
 if(closable&&$('closeModal'))$('closeModal').addEventListener('click',closeModal);
 root.querySelectorAll('[data-i]').forEach(b=>b.addEventListener('click',()=>{const c=choices[Number(b.dataset.i)];if(c&&c.action)c.action();}));
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

function advanceAge(){
 if(!validState())return;
 state.age++;state.yearCount++;
 if(state.specialCareer&&state.specialCareer.id==='fighter'&&state.combatCareer){const cc=ensureCombatCareer();cc.energy=100;if(cc.injuryYears>0){cc.injuryYears--;cc.injury=clamp(cc.injury-28);if(cc.injuryYears===0||cc.injury===0){cc.injury=0;cc.injuryYears=0;log('🩹','التعافي من الإصابة','تعافيت من إصابة القتال وعدت جاهزًا للتدريب.','good');}}if(cc.coach&&cc.coach.yearsLeft>0){const annualCost=cc.coach.annualCost||0;if(state.bank<annualCost){log('💳','تعذر دفع مصاريف المدرب','الرصيد لا يكفي مصاريف المدرب السنوية؛ انتهى التعاقد دون خصم المصروف.','bad');cc.coach=null;}else{state.bank-=annualCost;cc.coach.yearsLeft--;if(cc.coach.yearsLeft<=0){log('🧑‍🏫','انتهاء عقد المدرب','انتهى عقد المدرب. يمكنك تجديده من مسيرة القتال.');cc.coach=null;}}}}
 advanceChildren();
 (state.family||[]).forEach(relative=>{if(relative.deceased)return;relative.age=(relative.age||0)+1;const oldest=relative.age>=100;const parent=/(الأب|الأم|والد|والدة)/.test(relative.relation||'');const risk=relative.age>75?Math.min(.45,.012+(relative.age-75)*.012):0;if(oldest||(risk&&chance(risk))){relative.deceased=true;const close=(relative.relationshipLevel||50)>=70;state.stats.happiness=clamp(state.stats.happiness-(close?12:5));log('🕯️','وفاة أحد أفراد العائلة','توفي '+relative.name+' بعد رحلة من العمر. الخبر أثر عليك وعلى علاقتك بالعائلة.','bad');achievement('وداع '+relative.name);}});
 if(state.partner&&typeof state.partner.age==='number'){
  state.partner.age++;
  const partnerRisk=state.partner.age>78?Math.min(.38,.008+(state.partner.age-78)*.012):0;
  if(state.partner.age>=103||(partnerRisk&&chance(partnerRisk))){const departed={...state.partner,relation:state.married?'الزوج/الزوجة المتوفى':'الشريك السابق المتوفى',deceased:true};state.family.push(departed);state.partner=null;state.married=false;state.stats.happiness=clamp(state.stats.happiness-18);log('🕯️','رحيل شريك الحياة','فقدت شريك حياتك بعد سنوات من المشاركة. الذكريات والعائلة تفضل جزءًا من قصتك.','bad');}
 }
 if(state.prison&&state.prison.years>0){state.prison.years--;state.stats.happiness=clamp(state.stats.happiness-5);state.stats.health=clamp(state.stats.health-2);if(state.prison.years===0){log('🔓','انتهاء العقوبة','انتهت مدة العقوبة وعُدت لحياتك خارج السجن.','special');state.prison=null;}}
 const assetUpkeep=state.assets.reduce((s,a)=>s+(a.upkeep||0),0);
 state.assets.forEach(a=>{const before=a.value||0;if(a.kind==='property'){a.condition=clamp((a.condition??100)-2);a.value=Math.round(before*(a.condition<25?1.005:1.025));}else if(a.kind==='car'){a.condition=clamp((a.condition??100)-4);a.value=Math.round(before*.91);}else if(a.kind==='business')a.value=Math.round(before*1.03);});
 if(state.job&&!state.retired){
   const salary=Math.round(state.job.salary*state.performance/100);state.bank+=salary;flash('+'+cash(salary));
   log('💼','دخل سنوي','استلمت '+cash(salary)+' من شغلك في '+state.job.title+'.','good');
   state.performance=clamp(state.performance+(chance(.58)?2:-1),20,100);
   if(state.performance>=78&&state.age<60&&chance(.09)){const raise=Math.round(state.job.salary*.14);state.job.salary+=raise;state.performance=clamp(state.performance+3);if(!state.job.title.endsWith(' أول'))state.job.title+=' أول';log('📈','ترقية مهنية','أداءك المتميز ساعدك تحصل على ترقية وزيادة سنوية '+cash(raise)+'.','good');achievement('الحصول على ترقية مهنية');}
 }
 if(state.age>=18&&!state.retired){
   const living=Math.round(9000+state.age*180);state.bank-=living;flash('-'+cash(living),true);
   log('🧾','مصاريف المعيشة','دفعت '+cash(living)+' لمصاريف السنة من أكل ومواصلات واحتياجات أساسية.');
 }
 const childCosts=(state.children||[]).reduce((sum,c)=>{const base=(c.age||0)<6?4500:((c.age||0)<18?7500:0);if(!base)return sum;const plan=(state.coParentingPlans||[]).find(p=>p&&p.active!==false&&(p.childIds||[]).includes(c.id||c.name));if(!plan)return sum+base;if(plan.mode==='shared')return sum+Math.round(base*.6);if(plan.mode==='other')return sum+Math.round(base*.2);return sum+base;},0);if(childCosts>0){state.bank-=childCosts;log('🧸','مصاريف الأبناء','احتياجات وتعليم ورعاية الأبناء كلّفتك '+cash(childCosts)+' هذا العام بعد احتساب ترتيبات الرعاية.','bad');}applyCoParentingAnnualEffects();
 if(assetUpkeep){state.bank-=assetUpkeep;flash('-'+cash(assetUpkeep),true);log('🔧','صيانة الأصول','صيانة ممتلكاتك كلّفتك '+cash(assetUpkeep)+'.','bad');}
 const rentIncome=(state.assets||[]).filter(a=>a.kind==='property'&&a.rented).reduce((total,a)=>total+Math.round((a.value||0)*.045),0);if(rentIncome>0){state.bank+=rentIncome;log('🏠','دخل إيجار سنوي','دخل لك '+cash(rentIncome)+' من تأجير العقارات.','good');}
 if(state.debt>0){const interest=Math.max(100,Math.round(state.debt*.08));state.debt+=interest;log('🏦','فوائد الديون','زادت ديونك بمقدار '+cash(interest)+' بسبب الفوائد. إجمالي الدين '+cash(state.debt)+'.','bad');}
 if((state.investments||[]).length){let totalGain=0;state.investments.forEach(inv=>{const before=inv.value;const move=inv.kind==='مخاطرة عالية'?(Math.random()*.46-.18):(Math.random()*.24-.04);inv.value=Math.max(0,Math.round(inv.value*(1+move)));totalGain+=inv.value-before;});if(totalGain)log('📈','تقرير الاستثمارات',(totalGain>=0?'استثماراتك زادت بقيمة ':'استثماراتك خسرت بقيمة ')+cash(Math.abs(totalGain))+'. السوق بيتحرك صعودًا وهبوطًا. ',totalGain>=0?'good':'bad');}
 if(state.business){const level=Math.max(1,state.business.level||1);const revenue=Math.round(state.business.value*(.03+Math.random()*.08)*(.8+level*.15));const costs=Math.round(state.business.value*(.02+Math.random()*.05)*(1+Math.max(0,level-1)*.08));const profit=revenue-costs;state.bank+=profit;state.business.value=Math.max(1000,Math.round(state.business.value*(profit>=0?1.04:.97)));log('🏪','التقرير السنوي للمشروع',(profit>=0?'صافي الأرباح ':'صافي الخسارة ')+cash(Math.abs(profit))+' · مستوى الإدارة '+level+'.','special');}
 if((state.pets||[]).length){const care=state.pets.length*350;state.bank-=care;state.pets.forEach(p=>{p.age=(p.age||0)+1;p.happiness=clamp((p.happiness||70)+(chance(.7)?3:-6));p.health=clamp((p.health||70)-(p.age>10?2:0)+(p.happiness>40&&chance(.5)?1:-1));});const lost=state.pets.filter(p=>(p.species==='طائر'?p.age>19:p.age>15)&&chance(.35));if(lost.length){state.pets=state.pets.filter(p=>!lost.includes(p));lost.forEach(p=>log('🐾','وداع صديق','توفي '+p.name+' بعد سنوات من الرفقة. ستفضل ذكراه جزءًا من حكايتك.','bad'));}if(state.bank<0)log('🐾','مصاريف الحيوانات','رعاية الحيوانات كلفتك '+cash(care)+' هذا العام.','bad');}
 if((state.hobbies||[]).length&&chance(.7)){state.stats.happiness=clamp(state.stats.happiness+1);if(state.hobbies.some(h=>h.id==='reading'||h.id==='writing'))state.stats.smart=clamp(state.stats.smart+1);}
 if(state.partner){const loyalty=clamp(state.partner.loyalty??55),reliability=clamp(state.partner.reliability??55),generosity=clamp(state.partner.generosity??50),petulance=clamp(state.partner.petulance??50),jealousy=clamp(state.partner.jealousy??40);const stability=clamp(36+loyalty*.22+reliability*.20+generosity*.12-petulance*.16-jealousy*.10+(state.partner.personality==='حنون'?8:0),8,92);const drift=state.partner.relationshipLevel<35?-3:(chance(stability/100)?1:-1);state.partner.relationshipLevel=clamp((state.partner.relationshipLevel||50)+drift);if(jealousy>=75&&state.partner.relationshipLevel<45&&chance(.12)){state.partner.relationshipLevel=clamp(state.partner.relationshipLevel-3);stat('happiness',-2);log('💬','غيرة وسوء تفاهم','الغيرة العالية عند '+state.partner.name+' سببت سوء تفاهم محتاج حوارًا وطمأنة.','bad');}if(state.married&&state.partner.relationshipLevel<15&&chance(clamp(10+petulance*.20+jealousy*.28,10,70)/100)){state.married=false;log('💔','أزمة زوجية','الخلافات زادت بينك وبين '+state.partner.name+'. محتاجين حوار واهتمام قبل ما العلاقة تنهار.','bad');}}
 if(state.specialCareer){const income=Math.round((state.specialCareer.income||0)*(0.6+(state.fame||0)/120));if(income>0){state.bank+=income;log('🌟','دخل من الشهرة','جالك دخل بقيمة '+cash(income)+' من مسارك في '+state.specialCareer.title+'.','good');}state.fame=clamp((state.fame||0)+(chance(.6)?2:-1));}
 if(state.specialCareer&&state.specialCareer.id==='esports'&&state.esportsCareer){const esports=ensureEsportsCareer();if(esports.sponsor&&esports.sponsorYears>0){const payout=Math.max(0,Math.round(Number(esports.sponsorAnnualIncome)||0));state.bank+=payout;esports.sponsorYears--;log('🤝','دخل رعاية الألعاب الإلكترونية','استلمت '+cash(payout)+' من عقد الرعاية مع '+esports.sponsor+'.','good');if(esports.sponsorYears===0){log('📄','انتهاء عقد الرعاية','انتهى عقد الرعاية مع '+esports.sponsor+'. تقدر تتفاوض على عقد جديد.');esports.sponsor=null;esports.sponsorAnnualIncome=0;}}}
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
     state.education.level=state.education.major==='تجارة وإدارة'?2:state.education.major==='علوم الحاسب'?3:state.education.major==='هندسة'?4:5;
     state.education.school='خريج '+state.education.major;
     log('🎓','اتخرجت من الجامعة','أنهيت دراسة '+state.education.major+'. فرص جديدة بقت متاحة ليك.','good');
     achievement('التخرج من '+state.education.major);
   }
 }
 if(state.age===6){state.education.level=Math.max(state.education.level,1);state.education.school='المدرسة الابتدائية';log('🏫','أول يوم مدرسة','بدأت رحلتك في المدرسة الابتدائية. هتتعلم حاجات كتير وتكوّن صداقات.','special');achievement('بدأت التعليم الابتدائي');}
 if(state.age===12){state.education.school='المرحلة الإعدادية';log('📚','مرحلة جديدة','خلصت المرحلة الابتدائية وبدأت الإعدادي. اختياراتك الدراسية هتبدأ تفرق أكتر.','special');}
 if(state.age===15){state.education.school='المرحلة الثانوية';log('🎒','الثانوية العامة','دخلت مرحلة مهمة؛ حاول توازن بين المذاكرة وصحتك.','special');}
 if(state.age===18){state.education.school='خريج ثانوية';log('🎓','نهاية مرحلة وبداية التانية','خلصت سنين المدرسة. قدامك الجامعة أو الشغل أو سنة راحة.','special');achievement('أنهيت التعليم المدرسي');}
 if(state.age===60&&!state.retired){state.retired=true;if(state.job){state.jobHistory=state.jobHistory||[];state.jobHistory.push({title:state.job.title,salary:state.job.salary,startAge:state.job.startAge??18,endAge:state.age});log('🌅','التقاعد','وصلت لسن التقاعد. حان وقت الراحة والاستمتاع باللي بنيته.','special');state.job=null;}achievement('وصلت لمرحلة التقاعد');}
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
 const snapshot=JSON.parse(JSON.stringify(state)),logLength=Array.isArray(snapshot.log)?snapshot.log.length:0;delete snapshot.timeMachineSnapshots;delete snapshot.log;
 // Near the rolling-log limit, keep an exact checkpoint so rewind cannot include future events.
 const logSnapshot=logLength>=280&&Array.isArray(state.log)?JSON.parse(JSON.stringify(state.log)):null;
 if(!Array.isArray(state.timeMachineSnapshots))state.timeMachineSnapshots=[];
 const checkpoint={snapshotVersion:1,logLength,state:snapshot};if(logSnapshot)checkpoint.logSnapshot=logSnapshot;
 state.timeMachineSnapshots.push(JSON.stringify(checkpoint));if(state.timeMachineSnapshots.length>8)state.timeMachineSnapshots.shift();
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
 dead=true;state.status='متوفى';state.cause=cause;archiveLife();save();render();
 const assetValue=state.assets.reduce((sum,a)=>sum+a.value,0),investmentValue=(state.investments||[]).reduce((sum,a)=>sum+(a.value||0),0),net=state.bank+assetValue+investmentValue-(state.debt||0);
 const achievements=state.accomplishments.length?state.accomplishments.map(a=>'• '+esc(a)).join('<br>'):'لسه مفيش إنجازات مسجلة، بس كل حياة ليها حكايتها.';
 $('modalRoot').innerHTML='<div class="overlay"><section class="modal"><div class="death"><div class="tomb">🪦</div><div class="deathtitle">انتهت حكاية '+esc(state.name)+'</div><div class="deathsub">عشت '+fmt(state.age)+' سنة.<br>سبب الوفاة: '+esc(cause)+'.<br>شريط حياتك: '+esc(lifeRibbon())+'.<br>كل قرار ساب أثر، وكل سنة كانت فصل من قصتك.</div><div class="summarygrid"><div class="summarycell"><div class="summarylabel">الثروة النهائية</div><div class="summaryvalue">'+cash(net)+'</div></div><div class="summarycell"><div class="summarylabel">العمر</div><div class="summaryvalue">'+fmt(state.age)+' سنة</div></div><div class="summarycell"><div class="summarylabel">إنجازات</div><div class="summaryvalue">'+fmt(state.accomplishments.length)+'</div></div><div class="summarycell"><div class="summarylabel">الأصول</div><div class="summaryvalue">'+fmt(state.assets.length)+'</div></div></div><div class="listitem" style="text-align:right"><div class="listtitle">محطات من حياتك</div><div class="muted" style="margin-top:8px;line-height:2">'+achievements+'</div></div><button class="primarybtn" id="newLifeBtn">🌱 حياة جديدة</button>'+((state.timeMachineSnapshots||[]).length?'<button class="smallbtn" id="timeMachineDeathBtn" style="width:100%;margin-top:8px">⏳ تراجع عن سنة قاتلة</button>':'')+(state.children.length?'<div class="muted" style="margin:8px 0">كمّل إرث العائلة:</div>'+state.children.map((c,i)=>'<button class="smallbtn" data-heir="'+i+'" style="width:100%;margin:4px 0">🌳 استكمل كـ '+esc(c.name)+'</button>').join(''):'')+'<button class="smallbtn" id="reviewBtn" style="width:100%;margin-top:9px">راجع دفتر حياتك</button></div></section></div>';
 $('newLifeBtn').addEventListener('click',()=>{closeModal();if(confirm('تبدأ حياة جديدة وتستبدل الحفظ الحالي؟'))newLifeSetup();});
 $('reviewBtn').addEventListener('click',closeModal);
 const rewindDeathBtn=$('timeMachineDeathBtn');if(rewindDeathBtn)rewindDeathBtn.addEventListener('click',timeMachineMenu);
 $('modalRoot').querySelectorAll('[data-heir]').forEach(btn=>btn.addEventListener('click',()=>startAsChild(Number(btn.dataset.heir))));
}
function startNew(){
 if(state&&state.status==='حي'&&state.age>0)archiveLife('بدأ حياة جديدة');
 state=newLife();dead=false;
 log('👶','أول يوم في الدنيا','اتولدت في '+state.place.city+'، '+state.place.country+'. أهلك '+state.family[0].name+' و'+state.family[1].name+' بيبدأوا معاك أول فصل في الحكاية.','special');
 log('🏡','البيت والعيلة','أبوك شغال '+state.family[0].personality+'، وأمك '+state.family[1].personality+'. العيلة هي أول شبكة أمان ليك.');
 achievement('بدأت رحلة الحياة');render();
}
function schoolHub(){
 const education=state.education||(state.education={level:0,school:'لم تبدأ الدراسة',major:null,yearsLeft:0,tuition:0});
 const isUniversity=(education.yearsLeft||0)>0;
 const stage=education.droppedOut?'ترك الدراسة':isUniversity?'طالب جامعي · '+education.major:(education.school||'المدرسة');
 const score=clamp(education.studyScore||50);
 const clubs=Array.isArray(education.clubs)?education.clubs:[];
 const options=[
  choice('📚','ذاكر بجد','جلسة مذاكرة ترفع الذكاء والمستوى الدراسي، لكنها تحتاج مجهود.',()=>{
   closeModal();if(education.droppedOut){info('🚪','تركت الدراسة','ارجع لمسار التعليم الأول عشان تقدر تستخدم المذاكرة المدرسية.');return;}education.studyScore=clamp((education.studyScore||50)+12);stat('smart',4);stat('happiness',-1);
   log('📚','ذاكرت بجد','خصصت وقتًا للمذاكرة، وارتفع تقييمك الدراسي إلى '+education.studyScore+'%.','good');render();
   info('📚','مجهودك فرق','الذكاء اتحسن وتقييمك الدراسي بقى '+education.studyScore+'%.');
  }),
  choice('🧑‍🤝‍🧑','تفاعل مع زملاء الفصل','كوّن صداقة أو قوّي علاقة موجودة.',()=>{
   closeModal();
   if(state.friends.length){const n=pick(state.friends);n.relationshipLevel=clamp((n.relationshipLevel||50)+8);stat('happiness',3);log('🧑‍🤝‍🧑','وقت مع زملاء الفصل','قضيت وقت مع '+n.name+' واتقربتوا من بعض.','good');render();info('🧑‍🤝‍🧑','علاقات المدرسة','مستوى علاقتك بـ'+n.name+' بقى '+n.relationshipLevel+'%.');}
   else addFriend();
  }),
  choice('🏫','الأنشطة الطلابية','رياضة، علوم، مسرح أو مجلس طلاب.',schoolClubs),
  choice('🧭','التخصصات والجامعة','راجع شروط الجامعة ورسوم الدراسة.',()=>{closeModal();university(false);})
 ];
 if(isUniversity)options.unshift(choice('🎓','التقدم الدراسي','متبقي '+education.yearsLeft+' سنة · التخصص '+education.major+'.',()=>{closeModal();info('🎓','ملف الجامعة','المتبقي '+education.yearsLeft+' سنة. الرسوم السنوية '+cash(education.tuition||0)+'. حافظ على رصيدك وذاكر كل سنة.');},Math.round(education.tuition||0)?cash(education.tuition)+'/سنة':''));
 if(!education.droppedOut)options.push(choice('🚪','ترك الدراسة','الانسحاب يوقف التقدم التعليمي وقد يقلل فرص التوظيف.',()=>dropOutConfirm()));
 if(education.droppedOut)options.push(choice('🔁','العودة لمسار التعليم','تقدر تعيد فتح المسار الدراسي.',()=>{
  closeModal();education.droppedOut=false;education.school=state.age<12?'المدرسة الابتدائية':state.age<15?'المرحلة الإعدادية':state.age<18?'المرحلة الثانوية':'التعليم المستمر';
  log('🎓','العودة للتعليم','قررت ترجع لمسار التعليم وتكمل تطوير نفسك.','good');render();info('🎓','رجعت للدراسة','التعليم رجع متاح في ملف حياتك.');
 }));
 options.push(choice('↩️','رجوع','ارجع لقائمة المهنة والعمل.',()=>{closeModal();showCareer();}));
 modal('🎓', 'الدراسة والشغل',stage+' · المستوى الدراسي '+(education.level||0)+' · تقييم المذاكرة '+score+'%.',options,true,'<div class="school-progress"><div class="muted">التقييم الدراسي</div><div class="progressline"><div style="width:'+score+'%"></div></div><div class="muted">'+clubs.length+' نشاط طلابي</div></div>');
}
function schoolClubs(){
 closeModal();if(state.education&&state.education.droppedOut){info('🚪','الأنشطة الطلابية غير متاحة','ارجع لمسار التعليم عشان تنضم للأندية والأنشطة.');return;}
 const catalog=[
  {id:'sports',name:'النادي الرياضي',icon:'⚽',effect:'الصحة والروح الرياضية'},
  {id:'science',name:'نادي العلوم',icon:'🔬',effect:'التعلم والفضول'},
  {id:'arts',name:'نادي الفنون والمسرح',icon:'🎭',effect:'الإبداع والسعادة'},
  {id:'leadership',name:'مجلس الطلاب',icon:'🏫',effect:'القيادة والعلاقات'}
 ];
 const choices=catalog.map(c=>{
  const joined=(state.education.clubs||[]).includes(c.id);
  return choice(c.icon,joined?'ممارسة '+c.name:'الانضمام إلى '+c.name,'تطوير '+c.effect+'.'+(joined?' أنت عضو بالفعل.':''),()=>{
   closeModal();if(!state.education.clubs)state.education.clubs=[];
   if(!state.education.clubs.includes(c.id)){state.education.clubs.push(c.id);achievement('انضممت إلى '+c.name);}
   if(c.id==='sports'){stat('health',4);stat('happiness',2);}
   if(c.id==='science'){stat('smart',4);stat('happiness',1);}
   if(c.id==='arts'){stat('happiness',4);stat('looks',1);}
   if(c.id==='leadership'){stat('happiness',3);if(state.friends.length)state.friends[0].relationshipLevel=clamp((state.friends[0].relationshipLevel||50)+5);}
   log(c.icon,c.name,joined?'شاركت في نشاط '+c.name+' وطورت مهاراتك.':'انضممت إلى '+c.name+'، وبدأت تبني مهارات خارج الفصل.','good');render();info(c.icon,joined?'نشاط طلابي':'تم الانضمام',c.name+' · '+c.effect+'.');
  });
 });
 choices.push(choice('↩️','رجوع للدراسة','',()=>{closeModal();schoolHub();}));
 modal('🏫','الأنشطة الطلابية','اختار نشاطًا يناسب اهتماماتك. تقدر تجرب أكتر من نادي.',choices);
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
function showCareer(){
 if(state.age<6){info('📚','لسه بدري','التعليم التفاعلي يبدأ في سن المدرسة. دلوقتي تقدر تتابع أحداث الطفولة وتتقدم بالعمر.');return;}
 if(!state.job&&(state.age<18||state.education.yearsLeft>0)&&!state.retired){schoolHub();return;}
 if(state.job){
  const opts=[
   ...(state.education.yearsLeft>0? [choice('🎓','الجامعة والدراسة','تابع الدراسة والأنشطة الجامعية بالتوازي مع العمل.',()=>{closeModal();schoolHub();})] : []),
   choice('🌟','المهن الخاصة والشهرة','مسار إضافي بجانب وظيفتك التقليدية.',specialCareers),
   choice('📚','سجل الوظائف السابقة','راجع الوظائف التي تركتها أو انتقلت منها.',()=>{closeModal();const records=(state.jobHistory||[]).map(j=>choice('💼',j.title,(j.startAge??'?')+'–'+(j.endAge??'؟')+' سنة · الراتب '+cash(j.salary),()=>{closeModal();info('💼',j.title,'وظيفة سابقة في سجل حياتك.');}));modal('📚','التاريخ الوظيفي','مسار العمل خلال حياتك.',records.length?records:[choice('📚','لا توجد وظائف سابقة','سيظهر السجل بعد تغيير وظيفة أو الاستقالة.',closeModal)]);}),
   choice('📈','طلب علاوة','أداءك الحالي '+state.performance+'%.',()=>{
    closeModal();
    if(state.performance<58){state.performance=clamp(state.performance+4);log('🗣️','مناقشة مع المدير','مديرك طلب منك تحسن الأداء شوية قبل زيادة المرتب.');info('🗣️','مش دلوقتي','حافظ على أداءك واطلب تاني بعد فترة.');return;}
    if(chance(.62)){const inc=Math.round(state.job.salary*.12);state.job.salary+=inc;state.performance=clamp(state.performance+5);log('🎉','علاوة في المرتب','وافق مديرك على علاوة سنوية '+cash(inc)+'.','good');info('🎉','مبروك العلاوة','مرتبك السنوي الجديد '+cash(state.job.salary)+'.');}else{state.performance=clamp(state.performance+2);log('🗣️','لسه بدري على العلاوة','مديرك طلب نتائج إضافية قبل الزيادة.');info('🗣️','المرة الجاية','استمر على نفس المستوى وجرب بعد فترة.');}render();
   }),
   choice('🧰','تطوير الأداء','تدريب يرفع فرص الترقية مقابل 1,200 '+state.place.unit+'.',()=>{closeModal();if(state.bank<1200){info('💳','الرصيد مش كفاية','التدريب يكلف 1,200 '+state.place.unit+'.');return;}state.bank-=1200;state.performance=clamp(state.performance+14);stat('smart',2);log('🧰','تدريب مهني','دفعت 1,200 '+state.place.unit+' في تدريب زوّد أداءك ومهاراتك.','good');render();},cash(1200)),
   choice('🚪','الاستقالة','تسيب شغلك وتفقد الدخل السنوي.',()=>{closeModal();info('🚪','تأكيد الاستقالة','متأكد إنك عايز تسيب '+state.job.title+'؟',[choice('✓','أيوه، أستقيل','',()=>{closeModal();state.jobHistory.push({title:state.job.title,salary:state.job.salary,startAge:state.job.startAge??state.age,endAge:state.age});state.job=null;state.performance=50;log('🚪','استقالة','سيبت شغلك وبدأت تدور على الخطوة التالية.');render();showCareer();}),choice('↩️','أتراجع','',closeModal)]);})
  ];
  modal('💼','الدراسة والشغل','شغلك الحالي: '+state.job.title+' — الأداء '+state.performance+'%.',opts,true,'<div class="muted performance-summary">مستوى الأداء · '+state.performance+'%</div><div class="progressline"><div style="width:'+clamp(state.performance)+'%"></div></div>');return;
 }
 let intro='مفيش شغل حاليًا. الوظائف بتتغير حسب سنك وتعليمك ومستوى ذكاءك.';
 const eligible=jobs.filter(j=>state.age>=j.age&&state.stats.smart>=j.smart&&state.education.level>=j.edu);
 const opts=eligible.map(j=>choice(j.emoji,j.title,j.desc+' الراتب السنوي المتوقع '+cash(j.salary)+'.',()=>applyJob(j),cash(j.salary)+'/سنة'));
 if(!opts.length)intro+=' محتاج ترفع الذكاء أو مستوى التعليم عشان تتأهل للوظائف المتاحة.';
 opts.push(choice('🎓','التعليم والجامعة','اختار تخصصًا يفتح فرصًا جديدة.',()=>{closeModal();university(false);}));
 opts.push(choice('🌟','المهن الخاصة والشهرة','التمثيل والموسيقى والمحتوى والرياضة والكتابة والإخراج.',specialCareers));
 if((state.jobHistory||[]).length)opts.push(choice('📚','سجل الوظائف السابقة','عدد الوظائف السابقة '+state.jobHistory.length+'.',()=>{closeModal();const records=state.jobHistory.map(j=>choice('💼',j.title,'الراتب '+cash(j.salary)+' · بداية '+j.startAge+' سنة',()=>{closeModal();info('💼',j.title,'وظيفة سابقة في سجل حياتك.');}));modal('📚','التاريخ الوظيفي','كل وظيفة تركت أثرًا في المسار المهني.',records);}));
 modal('💼','الدراسة والشغل',intro,opts);
}
function applyJob(job){
 closeModal();
 if(state.age<job.age||state.stats.smart<job.smart||state.education.level<job.edu){info('🔒','لسه مش مؤهل','الوظيفة محتاجة سنًا أو تعليمًا أو مهارات أعلى.');return;}
 const success=.5+state.stats.smart/100*.22+state.performance/100*.15;
 if(chance(success)){state.job={id:job.id,title:job.title,salary:job.salary,startAge:state.age};state.jobHistory=state.jobHistory||[];state.performance=clamp(50+Math.floor(state.stats.smart/8));state.retired=false;log('💼','اتقبلت في وظيفة جديدة','بدأت شغل '+job.title+' براتب سنوي '+cash(job.salary)+'.','good');achievement('بدأت العمل: '+job.title);info('🎉','مبروك الوظيفة','اتقبلت في '+job.title+'. كل سنة هتستلم دخل على قد أداءك.');}
 else{log('📨','طلب وظيفة','قدمت على '+job.title+' لكنهم اختاروا مرشحًا آخر. جهّز نفسك وحاول تاني.','bad');info('📨','المرة الجاية','طوّر مهاراتك وخليك مستمر في التقديم.');}
 render();
}
function university(from18){
 if(state.age<18){info('🔒','لسه بدري','تقدر تقدم للجامعة بعد سن 18.');return;}
 if(state.education.yearsLeft>0){info('🎓','أنت طالب جامعي','تخصصك الحالي '+state.education.major+'. المتبقي '+state.education.yearsLeft+' سنوات.');return;}
 const opts=majors.map(m=>choice(m.emoji,m.title,m.desc+' الحد الأدنى للذكاء '+m.min+'%. الرسوم السنوية '+cash(m.cost)+'، والمدة '+m.years+' سنوات.',()=>{
   closeModal();
   if(state.stats.smart<m.min){info('🧠','محتاج تستعد أكتر','التخصص ده محتاج ذكاء '+m.min+'% على الأقل. استخدم المكتبة وطوّر مهاراتك.');return;}
   if(state.bank<m.cost){info('💳','الرسوم مش متاحة','محتاج '+cash(m.cost)+' كبداية. ممكن تبدأ شغل أو تجمع فلوس.');return;}
   state.bank-=m.cost;flash('-'+cash(m.cost),true);state.education.major=m.title;state.education.yearsLeft=m.years;state.education.tuition=m.cost;state.education.prepaidYear=true;state.education.school='جامعة - '+m.title;state.stats.smart=clamp(state.stats.smart+3);log('🏛️','بدأت الجامعة','اتقبلت في '+m.title+'. دفعت رسوم السنة الأولى '+cash(m.cost)+'.','special');achievement('الالتحاق بالجامعة: '+m.title);render();info('🎓','أهلًا بالجامعة','هتتقدم في الدراسة مع مرور السنين. حاول تحافظ على صحتك ومستواك.');
 },cash(m.cost)+'/سنة'));
 opts.push(choice('📚','أستعد للدراسة','نشاط مجاني يزيد الذكاء.',()=>{closeModal();stat('smart',4);log('📚','استعداد للجامعة','قضيت وقتًا في التعلم قبل التقديم.');render();}));
 modal('🏛️','التخصصات الجامعية','اختار تخصصًا مناسبًا. رسوم السنة التالية تُخصم عند تقدم العمر، ولو الرصيد مش كافي الدراسة تتوقف.',opts);
}
function assets(){
 const opts=assetShop.map(a=>choice(a.emoji,a.title,a.desc+' التكلفة '+cash(a.value)+'. صيانة سنوية '+cash(a.upkeep)+'.',()=>buyAsset(a),cash(a.value)));
 if(state.business)opts.unshift(choice('🏪','إدارة مشروعي','قيمة المشروع '+cash(state.business.value)+' · مستوى الإدارة '+(state.business.level||1)+'.',businessMenu));
 if(state.assets.length)opts.push(choice('📦','إدارة أصولي','شوف ممتلكاتك وبع اللي مش محتاجه أو أجّر العقارات.',manageAssets));
 modal('🏠','الأصول والمشتريات','العقارات ممكن تجيب دخل إيجار، والسيارات تنخفض قيمتها مع الوقت، والمشروع يحتاج إدارة سنوية.',opts);
}
function businessMenu(){
 if(!state.business){info('🏪','مفيش مشروع حاليًا','اشتري مشروعًا صغيرًا من قائمة الأصول عشان تبدأ الإدارة.');return;}
 const b=state.business,level=Math.max(1,b.level||1);
 modal('🏪','إدارة '+(b.title||'مشروعك'),'قيمة المشروع '+cash(b.value)+' · مستوى الإدارة '+level+' · الشهرة '+(state.fame||0)+'%. اختيارات الإدارة تؤثر على دخل السنوات القادمة.',[
  choice('📊','التقرير السنوي','عرض تقديري عن قيمة المشروع وأرباحه المتوقعة.',()=>{closeModal();const forecast=Math.round(b.value*(.02+level*.015));info('📊','تقرير المشروع','القيمة الحالية '+cash(b.value)+'. الدخل التقريبي المحتمل '+cash(forecast)+' إلى '+cash(forecast*3)+' قبل التكاليف. النتائج مش مضمونة.');}),
  choice('📣','حملة تسويق','حملة تكلف 2,500 '+state.place.unit+' قد ترفع المبيعات والسمعة.',()=>businessAction('marketing'),'2,500 '+state.place.unit),
  choice('👔','تعيين مدير','تحسين الإدارة مقابل 5,000 '+state.place.unit+'؛ يزيد الكفاءة السنوية.',()=>businessAction('manager'),'5,000 '+state.place.unit),
  choice('🏗️','توسيع المشروع','استثمار 10,000 '+state.place.unit+' لزيادة قيمة النشاط.',()=>businessAction('expand'),'10,000 '+state.place.unit),
  choice('🧾','تقليل النفقات','مراجعة العمليات لتقليل المصاريف السنوية.',()=>businessAction('costs')),
  choice('↩️','رجوع للأصول','',()=>{closeModal();assets();})
 ]);
}
function businessAction(action){
 closeModal();if(!state.business)return;
 const b=state.business;
 if(action==='marketing'){
  if(state.bank<2500){info('💳','الرصيد مش كفاية','حملة التسويق تكلف 2,500 '+state.place.unit+'.');return;}
  state.bank-=2500;const win=chance(.7),gain=win?Math.round(b.value*(.04+Math.random()*.12)):0;state.fame=clamp((state.fame||0)+(win?3:1));state.reputation=clamp((state.reputation||50)+(win?4:-1));if(gain)b.value+=gain;
  log('📣','حملة تسويقية',win?'الحملة جابت عملاء جدد ورفعت قيمة المشروع التقديرية '+cash(gain)+'.':'الحملة ما جابتش النتيجة المتوقعة، لكنك عرفت جمهورك أفضل.',win?'good':'bad');render();info('📣','انتهت الحملة',win?'قيمة المشروع بقت '+cash(b.value)+'.':'راجع الجمهور والميزانية قبل الحملة الجاية.');return;
 }
 if(action==='manager'){
  if(state.bank<5000){info('💳','الرصيد مش كفاية','تعيين مدير يكلف 5,000 '+state.place.unit+'.');return;}
  state.bank-=5000;b.level=clamp((b.level||1)+1,1,20);b.value=Math.round(b.value*1.06);log('👔','تعيين مدير','استثمرت في الإدارة وارتفع مستوى المشروع إلى '+b.level+'. التكاليف السنوية هتزيد قليلًا، لكن الكفاءة تتحسن.','good');render();info('👔','الإدارة اتحسنت','مستوى المشروع بقى '+b.level+'، وده هيؤثر على التقرير السنوي.');return;
 }
 if(action==='expand'){
  if(state.bank<10000){info('💳','الرصيد مش كفاية','توسيع المشروع يكلف 10,000 '+state.place.unit+'.');return;}
  state.bank-=10000;b.value=Math.round(b.value*1.25);b.level=clamp((b.level||1)+1,1,20);log('🏗️','توسيع المشروع','وسّعت النشاط واستثمرت في النمو. القيمة التقديرية الجديدة '+cash(b.value)+'.','special');render();info('🏗️','التوسع اكتمل','المشروع بقى أكبر، لكنه محتاج متابعة للمصاريف.');return;
 }
 if(action==='costs'){
  const saved=Math.round(b.value*(.015+Math.random()*.025));b.value=Math.max(1000,Math.round(b.value*1.01));state.reputation=clamp((state.reputation||50)+(chance(.75)?2:-2));log('🧾','مراجعة المصاريف','راجعت الموردين والعمليات وخفضت تكاليفًا تقديرية بقيمة '+cash(saved)+' في التقرير السنوي.','good');render();info('🧾','تمت مراجعة العمليات','التوفير أثره هيبان على الربح السنوي المتوقع.');
 }
}
function buyAsset(a){
 closeModal();if(state.age<18){info('🔒','الشراء مش متاح دلوقتي','تقدر تشتري أصولك بعد سن 18.');return;}
 if(a.kind==='business'&&(state.business||(state.assets||[]).some(x=>x.kind==='business'))){info('🏪','عندك مشروع بالفعل','النسخة الحالية بتدعم إدارة مشروع واحد؛ طوّر مشروعك الحالي بدل شراء مشروع تاني.');return;}
 if(state.bank<a.value){info('💳','الرصيد مش كفاية','معاك '+cash(state.bank)+'، وسعر الأصل '+cash(a.value)+'.');return;}
 const assetId=Date.now()+Math.random();state.bank-=a.value;flash('-'+cash(a.value),true);
 const condition=(a.kind==='car'||a.kind==='property')?100:undefined;
 state.assets.push({id:assetId,title:a.title,emoji:a.emoji,kind:a.kind,value:a.value,upkeep:a.upkeep,bought:state.age,...(condition===undefined?{}:{condition})});
 if(a.kind==='business')state.business={assetId,title:a.title,value:a.value,level:1};
 stat('happiness',6);log(a.emoji,'اشتريت '+a.title,'دفعت '+cash(a.value)+'. خلي بالك من مصاريف الصيانة كل سنة.','good');achievement('امتلاك '+a.title);render();info('🎉','مبروك الأصل الجديد','الأصل اتضاف لممتلكاتك، وتقدر تبيعه لاحقًا حسب قيمته وحالته الحالية.');
}
function manageAssets(){
 const opts=state.assets.map((a,i)=>{
  const condition=(a.kind==='property'||a.kind==='car')?clamp(a.condition??100):null;
  const conditionText=condition===null?'':(' · الحالة '+condition+'%');
  const sale=Math.round(a.value*(condition===null?0.8:(.6+.004*condition)));
  const progress=condition===null?null:condition;
  return choice(a.emoji,a.title,'القيمة '+cash(a.value)+conditionText+' · الصيانة '+cash(a.upkeep)+' سنويًا'+(a.kind==='property'?(a.rented?' · مؤجّر':' · غير مؤجّر'):''),()=>{
   closeModal();
   const actions=[];
   if(condition!==null)actions.push(choice('🧰','صيانة / تجديد','استعادة الحالة إلى 100% ورفع قيمة إعادة البيع.',()=>maintainAsset(i),cash(Math.max(500,Math.round(a.value*(a.kind==='car'?.018:.03)*((100-condition)/100))))));
   actions.push(choice('💵','أبيع الأصل','القيمة المتوقعة حاليًا '+cash(sale),()=>sellAsset(i),cash(sale)));
   if(a.kind==='property')actions.push(choice('🔑',a.rented?'إيقاف التأجير':'عرض العقار للإيجار','دخل إيجار سنوي تقديري '+cash(Math.round(a.value*.045))+'.',()=>{closeModal();a.rented=!a.rented;log('🏠',a.rented?'تأجير عقار':'إيقاف تأجير العقار',a.rented?'عرضت '+a.title+' للإيجار وبدأ احتساب دخل سنوي.':'أوقفت التأجير للعقار '+a.title+'.',a.rented?'good':'');render();manageAssets();}));
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
 const opts=[];
 state.family.forEach(n=>{if(n.deceased)opts.push(choice('🕯️',n.name+' · '+n.relation,'ذكرى عائلية · توفي عن عمر '+(n.age||'?')+' سنة.',()=>{closeModal();info('🕯️',n.name,'هذا الفرد من العائلة جزء من تاريخ حياتك، وسجّلت اللعبة وفاته في دفتر الأحداث.');}));else opts.push(choice(n.emoji,n.name+' · '+n.relation,n.personality+' · مستوى العلاقة '+n.relationshipLevel+'%',()=>{closeModal();personModal(n);},n.relationshipLevel+'%',n.relationshipLevel));});
 state.friends.forEach(n=>opts.push(choice(n.emoji,n.name+' · صديق','مستوى العلاقة '+n.relationshipLevel+'%',()=>{closeModal();personModal(n);},n.relationshipLevel+'%',n.relationshipLevel)));
 if(state.partner)opts.push(choice(state.married?'💍':'💞',state.partner.name+(state.married?' · زوج/زوجة':' · شريك عاطفي'),'مستوى العلاقة '+state.partner.relationshipLevel+'%',()=>{closeModal();personModal(state.partner);},state.partner.relationshipLevel+'%',state.partner.relationshipLevel));
 (state.children||[]).forEach((n,i)=>opts.push(choice(n.emoji||'🧒',n.name+' · '+(n.age<18?'ابن/ابنة':'ابن/ابنة بالغ'), 'العمر '+n.age+' سنة · العلاقة '+n.relationshipLevel+'%',()=>{closeModal();childMenu(i);},n.relationshipLevel+'%',n.relationshipLevel)));
 opts.push(choice('🤝','تكوين صداقة جديدة','تتعرف على شخص جديد وتبدأ علاقة.',()=>{closeModal();addFriend();}));
 opts.push(choice('👤','إضافة شخص مخصص','أدخل اسم شخص تعرفه ليظهر في شبكة علاقاتك.',()=>{closeModal();addCustomFriend();}));
 if(state.age>=16&&!state.partner)opts.push(choice('💞','التعرف على شريك','تبدأ علاقة بالتعارف والاحترام المتبادل.',()=>{closeModal();meetPartner();}));
 opts.push(choice('👪','الزواج والأسرة','الزواج، الأبناء، إدارة العلاقة وشجرة العائلة.',familyMenu));
 opts.push(choice('📜','شجرة العائلة والإرث','استعرض أفراد الأسرة، الأبناء وخيارات الوصية.',familyTreeMenu));
 modal('💞','العلاقات والأسرة','العلاقات تتغير بمرور السنين. اهتم بالناس القريبين منك، لأن اختياراتك بتأثر على قوة العلاقة.',opts);
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
 if(state.partner&&state.age>=20&&(state.married||state.partner.relationshipLevel>=70))opts.push(choice('👶','إنجاب طفل','إضافة فرد جديد للعائلة مع تكاليف تربية سنوية.',haveChild,'8,000 '+state.place.unit));
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
function haveChild(){
 closeModal();
 if(state.age<20||!state.partner||(!state.married&&state.partner.relationshipLevel<70)){info('👶','مش الوقت المناسب','لازم تكون بالغ وعندك شريك بعلاقة مستقرة.');return;}
 if(state.bank<8000){info('💳','جهّز الميزانية','بداية تكاليف الطفل حوالي 8,000 '+state.place.unit+'.');return;}
 state.bank-=8000;
 const gender=pick(['male','female']),child=makePerson(gender,gender==='male'?'ابن':'ابنة',gender==='male'?'👶🏻':'👶🏻',0,78);
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
 modal(c.emoji||'🧒',c.name+' · '+c.age+' سنة',stage+' · '+(c.adopted?'ابن/ابنة بالتبنّي':'فرد من الأسرة')+' · العلاقة '+c.relationshipLevel+'%. '+(c.job?'الوضع الحالي: '+c.job+'.':'مستقبله بيتأثر بالتحصيل والاهتمام والتوجيه.'),opts,true,extra);
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

function relationshipAction(n,act){
 closeModal();if(act==='gift'&&state.bank<500){info('💳','الرصيد مش كفاية','الهدية محتاجة '+cash(500)+'.');return;}
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
 state.friends.push(f);stat('happiness',3);log('🤝','صداقة جديدة','اتعرفت على '+f.name+'، وبداية الصداقة كانت لطيفة.','good');render();info('🤝','صديق جديد','بقي عندك حد جديد ممكن تقضي معاه وقت وتبني علاقة قوية.');
}
function addCustomFriend(){
 if(typeof prompt!=='function'){addFriend();return;}const entered=prompt('اسم الشخص');if(!entered||!entered.trim()){relations();return;}
 const g=pick(['male','female']),f=person(g,'صديق',g==='male'?'🧑':'👩',Math.max(8,state.age),55);f.name=entered.trim().slice(0,50);state.friends.push(f);log('🤝','إضافة شخص إلى العلاقات','أضفت '+f.name+' إلى شبكة علاقاتك.','good');render();info('🤝','تمت الإضافة','تقدر تتفاعل مع '+f.name+' من شاشة العلاقات.');
}
function meetPartner(){
 const g=state.gender==='male'?'female':'male',p=person(g,'شريك الحياة',g==='male'?'🧑':'👩',Math.max(18,state.age+Math.floor(Math.random()*5)-2),32+Math.floor(Math.random()*28));
 modal('💞','فرصة تعارف','قابلت '+p.name+'، وشخصيته '+p.personality+'. تحب تبدأوا تتعرفوا على بعض؟',[
  choice('💬','أبدأ التعارف','بهدوء واحترام ومن غير استعجال.',()=>{closeModal();state.partner=p;stat('happiness',5);log('💞','بداية علاقة','بدأت تتعرف على '+p.name+'. العلاقة هتتطور حسب اهتمامكم ببعض.','special');achievement('بدأت علاقة جديدة');render();}),
  choice('🌿','مش الوقت المناسب','قرارك محترم، الفرص مش سباق.',()=>{closeModal();log('🌿','قرار شخصي','قررت تركز على نفسك في المرحلة الحالية.');render();})
 ]);
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
 const opts=places.filter(p=>p.country!==state.place.country).map(p=>choice(p.flag,'الهجرة إلى '+p.country,'الوجهة '+p.city+'. تكلفة الانتقال والتأسيس 15,000 '+state.place.unit+'.',()=>emigrate(p),'15,000 '+state.place.unit));
 opts.unshift(choice('🏖️','رحلة داخل البلد','إجازة قصيرة لتحسين المزاج.',()=>{closeModal();if(state.bank<2500){info('💳','الرصيد مش كفاية','الرحلة محتاجة '+cash(2500)+'.');return;}state.bank-=2500;stat('happiness',10);stat('health',2);log('🏖️','رحلة قصيرة','أخدت إجازة داخل البلد ورجعت بطاقة أحسن.','good');render();},'2,500 '+state.place.unit));
 modal('🌍','السفر والهجرة','الهجرة ممكن تفتح فرص جديدة، لكنها بتحتاج مصاريف وتغيير في الحياة.',opts);
}
function emigrate(destination){
 closeModal();const cost=15000;
 if(state.age<18){info('🌍','الهجرة غير متاحة','تحتاج تكون بالغ عشان تتخذ قرار الهجرة بنفسك.');return;}
 if(state.bank<cost){info('💳','الرصيد مش كفاية','الانتقال محتاج '+cash(cost)+' قبل ما تبدأ من جديد.');return;}
 const old=state.place;state.bank-=cost;state.travelHistory.push({from:old.country,to:destination.country,age:state.age});
 state.place={...destination};state.stats.happiness=clamp(state.stats.happiness-2);
 if(state.job){state.job.salary=Math.round(state.job.salary*1.15);state.performance=clamp(state.performance-8);}
 log('🌍','بدأت حياة في بلد جديدة','انتقلت من '+old.country+' إلى '+destination.country+'. محتاج وقت تتأقلم مع المجتمع وسوق العمل.','special');achievement('الهجرة إلى '+destination.country);render();info('🌍','وصلت '+destination.city,'غيّرت بلد الإقامة. وظيفتك ومصاريفك وفرصك هتتأثر بالمكان الجديد.');
}
function investingMenu(){
 const opts=[];
 if(state.age<18){opts.push(choice('🔒','الاستثمار بعد 18 سنة','ابدأ بالتعلم والادخار لحد ما تقدر تستثمر قانونيًا.',()=>{closeModal();info('📊','لسه بدري','الاستثمار متاح بعد سن 18.');}));}
 else{
  opts.push(choice('🏦','استثمار محافظ','مبلغ 2,000 في محفظة أقل تقلبًا.',()=>investAmount('محافظ',2000),'2,000 '+state.place.unit));
  opts.push(choice('📈','أسهم متوازنة','مبلغ 10,000 مع صعود وهبوط سنوي.',()=>investAmount('متوازن',10000),'10,000 '+state.place.unit));
  opts.push(choice('🎢','استثمار عالي المخاطر','مبلغ 5,000 مع احتمال مكسب أو خسارة كبيرين.',()=>investAmount('مخاطرة عالية',5000),'5,000 '+state.place.unit));
 }
 (state.investments||[]).forEach((inv,i)=>opts.push(choice('📊',inv.kind+' · '+cash(inv.value),'القيمة الحالية بعد تغير السوق.',()=>sellInvestment(i),cash(inv.value))));
 modal('📊','الاستثمارات','قيمة المحافظ بتتغير كل سنة. مفيش عائد مضمون، وممكن تخسر جزءًا من رأس المال.',opts);
}
function investAmount(kind,amount){
 closeModal();if(state.age<18){info('🔒','الاستثمار بعد 18 سنة','');return;}if(state.bank<amount){info('💳','الرصيد مش كفاية','تحتاج '+cash(amount)+' عشان تبدأ.');return;}
 state.bank-=amount;state.investments.push({id:Date.now()+Math.random(),kind,value:amount,started:state.age});log('📊','بدأت الاستثمار','خصصت '+cash(amount)+' لمحفظة '+kind+'. راجع قيمتها كل سنة ولا تستثمر أموال احتياجاتك الأساسية.','special');render();info('📊','تم إنشاء المحفظة','رأس المال المستثمر '+cash(amount)+'. النتائج هتتغير مع تقدم السنين.');
}
function sellInvestment(i){
 closeModal();const inv=state.investments[i];if(!inv)return;
 info('💵','بيع الاستثمار','القيمة الحالية '+cash(inv.value)+'. هل تريد تصفية المحفظة؟',[
  choice('💵','أبيع المحفظة','تحويل القيمة الحالية إلى رصيد نقدي.',()=>{closeModal();state.bank+=inv.value;log('💵','تصفية استثمار','بعت محفظة '+inv.kind+' مقابل '+cash(inv.value)+'.','good');state.investments.splice(i,1);render();}),
  choice('↩️','أحتفظ بها','',()=>{closeModal();investingMenu();})
 ]);
}

function combatCareerMenu(){
 if(!validState()||!state.specialCareer||state.specialCareer.id!=='fighter'){info('🥊','مسيرة القتال','ابدأ مسار المقاتل المحترف من قائمة المهن الخاصة أولًا.');return;}
 const c=ensureCombatCareer(),r=state.specialCareer.record||{},rank=combatRankName(c),moves=c.movesKnown.length;
 const injury=c.injury>0?' · إصابة '+c.injury+'%':'';
 const coach=c.coach?' · المدرب '+c.coach.name+' ('+fmt(c.coach.yearsLeft||0)+' سنوات متبقية)':' · من غير مدرب';
 const summary='الرتبة: '+rank+' · نقاط الدوري '+fmt(c.leaguePoints)+' · رصيد الشارع '+fmt(c.streetCred)+injury+coach;
 const opts=[
  choice('📊','ملف المقاتل',summary,()=>{closeModal();info('🥊','ملف المقاتل',summary+' · فوز '+c.wins+' · خسارة '+c.losses+' · نزالات الشوارع '+c.streetWins+' · نزالات الدوري '+c.leagueWins+' · الطاقة '+c.energy+'%.');},'',c.leaguePoints/2),
  choice('🏋️','تدريب القدرات','تقنية '+c.technique+'% · قوة '+c.power+'% · سرعة '+c.speed+'% · دفاع '+c.defense+'% · لياقة '+c.stamina+'%.',combatTrainingMenu,'',Math.round((c.technique+c.power+c.speed+c.defense+c.stamina)/5)),
  choice('📚','تعلّم حركة جديدة','تعلّم حركات بأساليب وقوة مختلفة، وافتح الحركات المتقدمة مع التقدم.',learnCombatMove),
  choice('🎯','اختيار الحركة الرئيسية','الحركة المختارة: '+((combatMoveCatalog.find(m=>m.id===c.selectedMove)||combatMoveCatalog[0]).title)+'.',selectCombatMove),
  choice('🧑‍🏫',c.coach?'تغيير المدرب':'التعاقد مع مدرب','المدرب يحسّن فرصك، لكن له تكلفة سنوية.',hireCombatCoach),
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
  const desc=m.desc+' · الأسلوب: '+m.style+' · قوي أمام: '+m.strongAgainst+' · القوة '+m.power+'.'+(known?' تم تعلمها بالفعل.':locked?' تحتاج رتبة '+['مبتدئ','هاوٍ','محترف','منافس على اللقب','بطل الدوري'][m.rank]+'.':'');
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
  return choice(m.id===c.selectedMove?'✅':'🥋',m.title,'الأسلوب '+m.style+' · قوية أمام '+m.strongAgainst+' · القوة '+m.power+'.',()=>{closeModal();c.selectedMove=m.id;log('🎯','تغيير خطة النزال','اخترت '+m.title+' كحركة رئيسية.');save();render();combatCareerMenu();},'',m.power);
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
function startCombatBout(mode){
 if(!validState()||!state.specialCareer||state.specialCareer.id!=='fighter'){specialCareers();return;}
 const c=ensureCombatCareer();
 if(c.injuryYears>0||c.injury>=65){closeModal();info('🩹','محتاج تتعافى','عندك إصابة '+c.injury+'% ولسه '+c.injuryYears+' سنوات متوقعة للتعافي. اختار العلاج أو انتظر قبل النزال.');return;}
 if(c.energy<25){closeModal();info('🫁','الطاقة منخفضة','استرح سنة أو تدرب بخفة قبل النزال التالي.');return;}
 if(mode==='league'&&(c.streetWins<2||c.streetCred<20)){closeModal();info('🔒','الدوري لسه مقفول','محتاج فوزين في نزالات الشوارع ورصيد شارع 20 على الأقل. الحالي: '+c.streetWins+' فوز و'+c.streetCred+' رصيد.');return;}
 if(mode==='league'&&state.bank<1500){closeModal();info('💳','رسوم الدوري','المشاركة في نزال الدوري تحتاج '+cash(1500)+'.');return;}
 const type=pick(combatOpponentTypes),opponent={name:pick(combatOpponentNames),style:type.style,weakTo:type.weakTo,emoji:type.emoji,
  rating:mode==='league'?34+c.rank*8+Math.floor(Math.random()*13):18+Math.floor(Math.random()*31),
  mode,fee:mode==='league'?1500:0};
 const opts=c.movesKnown.map(id=>{
  const m=combatMoveCatalog.find(x=>x.id===id);if(!m)return null;
  return choice(m.id===c.selectedMove?'🎯':'🥋',m.title,'أسلوبك '+m.style+' · قوي أمام '+m.strongAgainst+' · القوة '+m.power+'.'+(m.strongAgainst===opponent.style?' ميزة تكتيكية أمام أسلوب المنافس الحالي.':''),()=>resolveCombatBout(mode,opponent,m.id),'',m.power);
 }).filter(Boolean);
 opts.push(choice('↩️','انسحب من الاختيار','ارجع من غير دفع رسوم أو لعب النزال.',combatCareerMenu));
 modal(mode==='league'?'🏆':'🥊',mode==='league'?'نزال الدوري':'نزال الشوارع',opponent.emoji+' '+opponent.name+' · أسلوبه '+opponent.style+' · مستوى التحدي '+opponent.rating+'. اختار حركتك. '+(mode==='league'?'رسوم النزال '+cash(opponent.fee)+'.':'لا توجد رسوم دخول.'),opts);
}
function resolveCombatBout(mode,opponent,moveId){
 if(!validState()||!state.specialCareer||state.specialCareer.id!=='fighter')return;
 const c=ensureCombatCareer(),move=combatMoveCatalog.find(m=>m.id===moveId&&c.movesKnown.includes(m.id));
 if(!move){closeModal();info('🥋','الحركة غير متاحة','اختار واحدة من الحركات التي تعلمتها.');return;}
 if(mode==='league'&&state.bank<1500){closeModal();info('💳','الرصيد مش كفاية','رسوم الدوري تحتاج '+cash(1500)+'.');return;}
 closeModal();if(mode==='league')state.bank-=1500;
 const coachBonus=c.coach?c.coach.bonus:0,counterBonus=move.strongAgainst===opponent.style?12:(move.style===opponent.weakTo?7:(move.style===opponent.style?-4:0));
 const agePenalty=state.age>38?(state.age-38)*.8:0;
 const playerScore=c.technique*.19+c.power*.18+c.speed*.16+c.defense*.13+c.stamina*.10+state.stats.health*.10+(state.specialCareer.level||1)*.8+move.power*.12+coachBonus-c.injury*.16-agePenalty;
 const opponentScore=opponent.rating+(Math.random()*12-6);
 const probability=clamp(50+(playerScore-opponentScore)*1.65+counterBonus,12,88);
 const won=chance(probability/100);
 c.energy=clamp(c.energy-(mode==='league'?30:20));
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
  // Losing a street fight does not remove street credibility; the current official game explicitly changed that rule.
  const injuryGain=12+Math.floor(Math.random()*19)+(state.age>38?5:0);c.injury=clamp(c.injury+injuryGain);c.injuryYears=Math.max(c.injuryYears,c.injury>=65?2:1);
  state.stats.health=clamp(state.stats.health-(5+Math.floor(Math.random()*7)));state.stats.happiness=clamp(state.stats.happiness-3);
  if(mode==='league'){c.leaguePoints=Math.max(0,c.leaguePoints-4);title='خسارة في الدوري';detail='خسرت أمام '+opponent.name+'. لم ينقص رصيدك في الشوارع، لكن ترتيب الدوري تراجع قليلًا.';}
  else{title='خسارة في نزال الشوارع';detail='خسرت أمام '+opponent.name+'. رصيد الشارع لا ينقص بسبب الخسارة، لكنك تحتاج راحة بسبب الإصابة.';}
  state.reputation=clamp((state.reputation||50)-1);
 }
 c.rank=c.leaguePoints>=150?4:c.leaguePoints>=100?3:c.leaguePoints>=60?2:c.leaguePoints>=25?1:0;
 c.bouts.push({age:state.age,mode,opponent:opponent.name,opponentStyle:opponent.style,move:move.title,won,probability,earnings,injury:c.injury,rank:c.rank});
 if(c.bouts.length>30)c.bouts.shift();
 const record=state.specialCareer.record||(state.specialCareer.record={attempts:0,wins:0,losses:0,projects:0,totalEarnings:0,bestLevel:1});
 record.attempts=(record.attempts||0)+1;record.wins=(record.wins||0)+(won?1:0);record.losses=(record.losses||0)+(won?0:1);record.totalEarnings=(record.totalEarnings||0)+earnings;record.bestLevel=Math.max(record.bestLevel||1,state.specialCareer.level||1);
 if(won){state.specialCareer.level=clamp((state.specialCareer.level||1)+1,1,100);stat('happiness',2);}else stat('happiness',-1);
 log(won?'🏆':'🥊',title,detail+(won?' المكافأة '+cash(earnings)+'.':' الإصابة الحالية '+c.injury+'%.') ,tone);
 save();render();info(won?'🏆':'🩹',title,detail+' احتمال الفوز قبل النزال كان '+probability+'%.',[
  choice('📊','تفاصيل النزال','حركتك: '+move.title+' · أسلوب المنافس: '+opponent.style+' · مدرب: '+(c.coach?c.coach.name:'لا يوجد')+'.',()=>{closeModal();combatCareerMenu();}),
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
 const c=ensureCombatCareer(),opts=c.bouts.slice().reverse().map(b=>choice(b.won?'🏆':'🥊',(b.mode==='league'?'الدوري':'الشوارع')+' · '+b.opponent+' · '+(b.won?'فوز':'خسارة'),'العمر '+b.age+' · الحركة '+b.move+' · الاحتمال المقدر '+b.probability+'% · إصابة بعد النزال '+b.injury+'%'+(b.earnings?' · المكافأة '+cash(b.earnings):''),()=>{closeModal();info(b.won?'🏆':'🥊',b.opponent,(b.won?'فزت':'خسرت')+' باستخدام '+b.move+'. الاحتمال المقدر قبل النزال '+b.probability+'%.');}));
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
 {id:'documentary',title:'وثائقي',emoji:'📽️',critic:12,audience:-2,desc:'عمل واقعي يعتمد على البحث والتوثيق.',titles:['حكاية مكان','ناس من الشارع','أثر قديم']}
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
function createFilmStudio(){
 return {filmography:[],projects:0,totalBudget:0,totalBoxOffice:0,awards:0,bestCritic:0,genreFocus:null};
}
function ensureFilmStudio(){
 if(!state)return null;
 if(!state.filmStudio||typeof state.filmStudio!=='object')state.filmStudio=createFilmStudio();
 const defaults={filmography:[],projects:0,totalBudget:0,totalBoxOffice:0,awards:0,bestCritic:0,genreFocus:null};
 Object.keys(defaults).forEach(k=>{if(state.filmStudio[k]===undefined||state.filmStudio[k]===null)state.filmStudio[k]=defaults[k];});
 if(!Array.isArray(state.filmStudio.filmography))state.filmStudio.filmography=[];
 state.filmStudio.projects=Math.max(0,Number(state.filmStudio.projects)||0);state.filmStudio.awards=Math.max(0,Number(state.filmStudio.awards)||0);
 if(state.filmStudio.genreFocus&&!filmGenreCatalog.some(g=>g.id===state.filmStudio.genreFocus))state.filmStudio.genreFocus=null;
 return state.filmStudio;
}

function filmStudioMenu(){
 if(!validState()||!state.specialCareer||state.specialCareer.id!=='director'){info('🎬','استوديو الأفلام','ابدأ مسار إخراج الأفلام من المهن الخاصة أولًا.');return;}
 const studio=ensureFilmStudio(),focus=filmGenreCatalog.find(g=>g.id===studio.genreFocus),r=state.specialCareer.record||{};
 const summary='الأفلام '+studio.projects+' · الجوائز '+studio.awards+' · إجمالي شباك التذاكر '+cash(studio.totalBoxOffice)+' · أفضل تقييم '+studio.bestCritic+'%'+(focus?' · تخصص الاستوديو '+focus.title:' · من غير تخصص ثابت');
 modal('🎥','استوديو الأفلام',summary,[
  choice('🎬','إنتاج فيلم جديد','اختار النوع والميزانية واتجاه القصة والطاقم والتسويق.',filmGenreMenu),
  choice('🎭','تحديد تخصص الاستوديو','اختار نوعًا يمنحك خبرة إضافية عندما تنتج فيه.',filmFocusMenu),
  choice('🏆','سجل الأفلام','راجع الميزانيات والإيرادات وتقييم النقاد والجوائز.',filmographyMenu),
  choice('📊','تقرير الاستوديو','المستوى الإخراجي '+fmt(state.specialCareer.level||1)+' · محاولات '+fmt(r.attempts||0)+' · نجاحات '+fmt(r.wins||0)+' · إخفاقات '+fmt(r.losses||0)+'.',()=>{closeModal();info('📊','تقرير الاستوديو',summary+' · دخل المسار المسجل '+cash(r.totalEarnings||0)+'.');}),
  choice('⭐','تدريب الإخراج','جلسة تدريب للمسار المتخصص.',trainSpecialCareer),
  choice('↩️','المهن الخاصة','',specialCareers)
 ]);
}
function filmFocusMenu(){
 const studio=ensureFilmStudio(),opts=filmGenreCatalog.map(g=>choice(g.emoji,g.title,g.desc+' اختيار النوع ده كتخصص يزيد كفاءة مشاريع النوع نفسه.',()=>{closeModal();studio.genreFocus=g.id;log('🎬','تخصص الاستوديو','اخترت '+g.title+' كتخصص لاستوديو الأفلام.','good');save();render();filmStudioMenu();},'',g.id===studio.genreFocus?100:undefined));
 opts.unshift(choice('🎞️','استوديو متنوع','إلغاء التخصص للحصول على نفس الفرص في كل الأنواع.',()=>{closeModal();studio.genreFocus=null;save();render();filmStudioMenu();}));
 modal('🎭','تخصص الاستوديو','التخصص يمنح مكافأة عند إنتاج النوع المختار، لكنه لا يمنعك من تجربة الأنواع الأخرى.',opts);
}
function filmGenreMenu(){
 const studio=ensureFilmStudio(),opts=filmGenreCatalog.map(g=>choice(g.emoji,g.title,g.desc+(studio.genreFocus===g.id?' · النوع المفضل للاستوديو.':''),()=>filmBudgetMenu(g.id)));
 modal('🎬','اختار نوع الفيلم','ابدأ بإحدى الأفكار الأصلية. النوع يغير توقعات الجمهور والنقاد.',opts);
}
function filmBudgetMenu(genreId){
 const genre=filmGenreCatalog.find(g=>g.id===genreId);if(!genre){closeModal();filmStudioMenu();return;}
 const opts=filmBudgetCatalog.map(b=>choice(b.id==='blockbuster'?'💎':b.id==='standard'?'🎞️':'🎬',b.title,b.desc+' تكلفة الإنتاج '+cash(b.cost)+'.',()=>filmCreativeMenu(genreId,b.id),cash(b.cost),state.bank>=b.cost?100:35));
 modal('💰','ميزانية الفيلم','الفيلم: '+genre.title+'. اختر مستوى المخاطرة قبل إضافة الطاقم والتسويق. الميزانية لا تُخصم إلا عند إصدار الفيلم.',opts);
}
function filmCreativeMenu(genreId,budgetId){
 const genre=filmGenreCatalog.find(g=>g.id===genreId),budget=filmBudgetCatalog.find(b=>b.id===budgetId);if(!genre||!budget){closeModal();filmStudioMenu();return;}
 const opts=filmCreativeCatalog.map(style=>choice('✍️',style.title,style.desc,()=>filmCastMenu(genreId,budgetId,style.id),'',style.criticBonus+20));
 modal('📝','اتجاه القصة','اختار شكل الحكاية؛ قرارك يوازن بين فرصة النجاح الجماهيري وتقييم النقاد.',opts);
}
function filmCastMenu(genreId,budgetId,creativeId){
 const budget=filmBudgetCatalog.find(b=>b.id===budgetId),style=filmCreativeCatalog.find(x=>x.id===creativeId);if(!budget||!style){closeModal();filmStudioMenu();return;}
 const opts=filmCastCatalog.map(cast=>choice('🎭',cast.title,cast.desc+' تكلفة الطاقم '+cash(cast.cost)+'.',()=>filmMarketingMenu(genreId,budgetId,creativeId,cast.id),cash(cast.cost),cast.cost===0?100:Math.round(cast.cost/(cast.cost+budget.cost)*100)));
 modal('🎭','اختيار طاقم التمثيل','اتزان تكلفة الطاقم مع الميزانية قد يحدد نجاح الإنتاج.',opts);
}
function filmMarketingMenu(genreId,budgetId,creativeId,castId){
 const opts=filmMarketingCatalog.map(marketing=>choice('📣',marketing.title,marketing.desc+' تكلفة التسويق '+cash(marketing.cost)+'.',()=>releaseFilm(genreId,budgetId,creativeId,castId,marketing.id),cash(marketing.cost)));
 modal('📣','خطة إطلاق الفيلم','اختار التسويق. إجمالي التكلفة هيظهر ويتراجع قبل تنفيذ الإنتاج.',opts);
}
function releaseFilm(genreId,budgetId,creativeId,castId,marketingId){
 const genre=filmGenreCatalog.find(g=>g.id===genreId),budget=filmBudgetCatalog.find(b=>b.id===budgetId),style=filmCreativeCatalog.find(x=>x.id===creativeId),cast=filmCastCatalog.find(x=>x.id===castId),marketing=filmMarketingCatalog.find(x=>x.id===marketingId);
 if(!genre||!budget||!style||!cast||!marketing){closeModal();info('🎬','تفاصيل الفيلم غير مكتملة','ارجع لاختيار النوع والميزانية والطاقم من جديد.');return;}
 const studio=ensureFilmStudio(),totalCost=budget.cost+cast.cost+marketing.cost;
 if(state.bank<totalCost){closeModal();info('💳','الميزانية مش كفاية','إنتاج '+budget.title+' مع '+cast.title+' وتسويق '+marketing.title+' يحتاج '+cash(totalCost)+'. اختار حزمة أقل تكلفة.',[choice('💰','اختيار ميزانية أخرى','',()=>filmBudgetMenu(genreId)),choice('↩️','الاستوديو','',filmStudioMenu)]);return;}
 closeModal();
 const focusBonus=studio.genreFocus===genre.id?5:0,level=Math.max(1,state.specialCareer.level||1);
 const probability=clamp(42+level*2.4+state.stats.smart*.14+(state.fame||0)*.07+(state.reputation||50)*.04+style.successBonus+cast.successBonus+marketing.successBonus+focusBonus+Math.floor(Math.random()*15)-7,12,90);
 const success=chance(probability/100);
 const criticScore=clamp(38+state.stats.smart*.22+level*1.8+genre.critic+style.criticBonus+cast.criticBonus+(success?6:-7)+Math.floor(Math.random()*31)-15+(studio.genreFocus===genre.id?4:0),5,100);
 const audienceModifier=(genre.audience+style.audienceBonus+marketing.audienceBonus+budget.reach*3)/100;
 const revenueMultiplier=success?1.3+level*.075+Math.max(-.04,audienceModifier)*.55+Math.random()*.55:.22+Math.random()*.36;
 const boxOffice=Math.max(0,Math.round(totalCost*revenueMultiplier));
 const title=pick(genre.titles),award=success&&criticScore>=82;
 const film={id:Date.now()+Math.random(),title,genre:genre.title,budget:budget.cost,totalCost,creative:style.title,cast:cast.title,marketing:marketing.title,releaseAge:state.age,criticScore,probability,success,boxOffice,net:boxOffice-totalCost,award};
 state.bank-=totalCost;state.bank+=boxOffice;studio.projects++;studio.totalBudget+=totalCost;studio.totalBoxOffice+=boxOffice;studio.bestCritic=Math.max(studio.bestCritic,criticScore);if(award)studio.awards++;studio.filmography.push(film);if(studio.filmography.length>20)studio.filmography.shift();
 state.fame=clamp((state.fame||0)+(success?3+Math.floor(criticScore/25)+cast.fameBonus: -1));state.reputation=clamp((state.reputation||50)+(success?3:-2));
 if(!state.specialCareer.record||typeof state.specialCareer.record!=='object')state.specialCareer.record={attempts:0,wins:0,losses:0,projects:0,totalEarnings:0,bestLevel:level};
 const record=state.specialCareer.record;record.attempts=(record.attempts||0)+1;record.wins=(record.wins||0)+(success?1:0);record.losses=(record.losses||0)+(success?0:1);record.projects=(record.projects||0)+1;record.totalEarnings=(record.totalEarnings||0)+boxOffice;
 if(success)state.specialCareer.level=clamp(level+1,1,100);
 if(!Array.isArray(state.specialCareer.history))state.specialCareer.history=[];state.specialCareer.history.push({age:state.age,title:'إنتاج فيلم: '+title,success,earnings:boxOffice,fameGain:success?3+Math.floor(criticScore/25):0});if(state.specialCareer.history.length>20)state.specialCareer.history.shift();
 if(award){achievement('حصلت على جائزة نقدية في إخراج الأفلام');log('🏆','جائزة نقدية','فيلم «'+title+'» حصل على تقييم '+criticScore+'% ونال جائزة داخل اللعبة.','special');}
 log(success?'🎥':'🎞️',success?'نجاح إصدار الفيلم':'إصدار فيلم لم يحقق التوقعات','«'+title+'» · '+genre.title+' · تقييم النقاد '+criticScore+'% · إيرادات '+cash(boxOffice)+' · صافي النتيجة '+cash(boxOffice-totalCost)+'.',success?'good':'bad');
 save();render();info(success?'🎬':'🎞️',success?'صدر الفيلم بنجاح':'الفيلم لم يحقق التوقعات','«'+title+'» · احتمال النجاح قبل الإنتاج '+probability+'% · تقييم النقاد '+criticScore+'% · الميزانية الإجمالية '+cash(totalCost)+' · الإيرادات '+cash(boxOffice)+(award?' · فزت بجائزة نقدية!':'')+'.',[choice('📊','تفاصيل الإنتاج','الاتجاه '+style.title+' · الطاقم '+cast.title+' · التسويق '+marketing.title+'.',()=>{closeModal();filmStudioMenu();}),choice('🎥','الاستوديو','',()=>{closeModal();filmStudioMenu();})]);
}
function filmographyMenu(){
 const studio=ensureFilmStudio(),opts=studio.filmography.slice().reverse().map(f=>choice(f.award?'🏆':f.success?'🎬':'🎞️',f.title+' · '+f.genre,'النقاد '+f.criticScore+'% · الإيرادات '+cash(f.boxOffice)+' · تكلفة '+cash(f.totalCost)+' · صافي '+cash(f.net)+(f.award?' · جائزة':'')+'.',()=>{closeModal();info(f.award?'🏆':f.success?'🎬':'🎞️',f.title,'النوع '+f.genre+' · الاتجاه '+f.creative+' · الطاقم '+f.cast+' · التسويق '+f.marketing+' · تقييم النقاد '+f.criticScore+'% · '+(f.success?'نجاح':'إخفاق')+' · صافي '+cash(f.net)+(f.award?' · جائزة نقدية':'')+'.');}));
 if(!opts.length)opts.push(choice('🎬','لا توجد أفلام بعد','ابدأ إنتاج أول فيلم من قائمة الاستوديو.',closeModal));opts.push(choice('↩️','رجوع إلى الاستوديو','',filmStudioMenu));
 modal('🏆','أرشيف الأفلام','آخر 20 فيلمًا مع تكلفة الإنتاج والإيرادات والتقييمات والجوائز.',opts);
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
  {id:'actor',title:'التمثيل',emoji:'🎬',min:16,looks:50,income:14000,desc:'اختبارات أداء وأدوار قد ترفع شهرتك.'},
  {id:'musician',title:'الموسيقى',emoji:'🎤',min:14,looks:25,income:11000,desc:'تدريب ونشر أعمال وفرص حفلات.'},
  {id:'influencer',title:'صانع محتوى',emoji:'📱',min:13,looks:30,income:7000,desc:'نشر مستمر وتفاعل جماهيري.'},
  {id:'athlete',title:'الرياضة الاحترافية',emoji:'🏅',min:15,looks:0,income:18000,desc:'لياقة وتدريب ومنافسة.'},
  {id:'esports',title:'الرياضات الإلكترونية',emoji:'🎮',min:16,looks:0,income:8500,desc:'بطولات تنافسية ورعايات تعتمد على المهارة والتدريب.'},
  {id:'fighter',title:'مقاتل محترف',emoji:'🥊',min:18,looks:0,income:22000,desc:'تدريب بدني ومنافسات عالية المخاطر.'},
  {id:'writer',title:'الكتابة والنشر',emoji:'✍️',min:16,looks:0,income:5000,desc:'بناء جمهور من الأعمال المنشورة.'},
  {id:'director',title:'إخراج الأفلام',emoji:'🎥',min:25,looks:0,income:26000,desc:'قيادة إنتاج فني ومشاريع كبيرة.'},
  {id:'military',title:'الخدمة العسكرية',emoji:'🪖',min:18,looks:0,income:16000,desc:'تدريب وانضباط ومهمات ميدانية ومخاطر.'},
  {id:'politician',title:'الحياة السياسية',emoji:'🏛️',min:25,looks:0,income:28000,desc:'خدمة عامة وحملات انتخابية وسمعة وثقة.'},
  {id:'crimeboss',title:'العالم السفلي',emoji:'🕶️',min:21,looks:0,income:18000,desc:'مسار خيالي محفوف بالمخاطر القانونية وقد ينتهي بالسجن.'}
 ];
 const opts=catalog.map(c=>choice(c.emoji,c.title,c.desc+' الحد الأدنى للعمر '+c.min+'.',()=>startSpecialCareer(c)));
 if(state.specialCareer){const r=state.specialCareer.record||{};opts.unshift(choice('📊','سجل المسار الحالي','المستوى '+fmt(state.specialCareer.level||1)+' · نجاحات '+fmt(r.wins||0)+' · إخفاقات '+fmt(r.losses||0)+' · دخل '+cash(r.totalEarnings||0)+'.',()=>{closeModal();info('📊','سجل '+state.specialCareer.title,'عدد المحاولات '+fmt(r.attempts||0)+' · النجاح '+fmt(r.wins||0)+' · الإخفاق '+fmt(r.losses||0)+' · المشاريع/الأنشطة '+fmt(r.projects||0)+' · إجمالي الدخل المسجل '+cash(r.totalEarnings||0)+' · أفضل مستوى '+fmt(r.bestLevel||1)+'.');}));opts.unshift(choice('📚','تاريخ المهن السابقة','اعرض المسارات التي أنهيتها ونتائجها.',specialCareerHistoryMenu));if(state.specialCareer.id==='fighter'){opts.unshift(choice('🥊','إدارة مسيرة القتال','تدريب وتكتيك ومنافسات وارتقاء نحو اللقب العالمي.',combatCareerMenu));}else if(state.specialCareer.id==='director'){opts.unshift(choice('🎥','إدارة استوديو الأفلام','إنتاج أفلام، اختيار الميزانية والطاقم والتسويق، ومراجعة الإيرادات.',filmStudioMenu));opts.unshift(choice('⭐','التدريب والعمل في '+state.specialCareer.title,'الشهرة الحالية '+state.fame+'%.',()=>trainSpecialCareer()));}else if(state.specialCareer.id==='esports'){opts.unshift(choice('🎮','إدارة مسيرة الرياضات الإلكترونية','بطولات ورعايات وتجهيزات وسجل منافسات.',esportsCareerMenu));opts.unshift(choice('⭐','تدريب تنافسي','موهبة الألعاب '+clamp(state.talents&&state.talents.gaming)+'%.',()=>trainSpecialCareer()));}else{opts.unshift(choice('🎬','تنفيذ نشاط تخصصي','إنتاج عمل أو إصدار أو منافسة مرتبطة بمسارك.',()=>specialCareerActivity()));opts.unshift(choice('⭐','التدريب والعمل في '+state.specialCareer.title,'الشهرة الحالية '+state.fame+'%.',()=>trainSpecialCareer()));opts.unshift(choice('🎟️','اختبار أداء / فرصة جديدة','اختبر حظك في فرصة جديدة.',()=>tryAudition()));}}
 modal('🌟','المهن الخاصة والشهرة','المسارات دي مختلفة عن الوظيفة التقليدية؛ النجاح فيها غير مضمون وقد يحتاج سنوات.',opts);
}
function startSpecialCareer(c){
 closeModal();if(state.age<c.min){info('🔒','لسه بدري','المسار ده متاح من سن '+c.min+'.');return;}
 if(c.looks&&state.stats.looks<c.looks&&c.id==='actor'){info('🎭','طوّر مهاراتك','فرص التمثيل تزيد مع المظهر والتدريب، جرّب الهوايات والتدريب.');return;}
 if(state.specialCareer&&state.specialCareer.id===c.id){if(c.id==='fighter'){ensureCombatCareer();combatCareerMenu();}else if(c.id==='director'){ensureFilmStudio();filmStudioMenu();}else if(c.id==='esports'){ensureEsportsCareer();esportsCareerMenu();}else info('🌟','أنت بالفعل في المسار ده','كمل تدريبك وأنشطتك عشان تتقدم بدل ما تبدأ من الصفر.');return;}
 if(state.specialCareer){if(!Array.isArray(state.specialCareerHistory))state.specialCareerHistory=[];state.specialCareerHistory.unshift(Object.assign({},state.specialCareer,{record:Object.assign({},state.specialCareer.record||{}),history:(state.specialCareer.history||[]).slice(),combatProfile:state.specialCareer.id==='fighter'?JSON.parse(JSON.stringify(state.combatCareer||null)):null,filmProfile:state.specialCareer.id==='director'?JSON.parse(JSON.stringify(state.filmStudio||null)):null,esportsProfile:state.specialCareer.id==='esports'?JSON.parse(JSON.stringify(state.esportsCareer||null)):null,endedAge:state.age,ending:'تغيير المسار'}));state.specialCareerHistory=state.specialCareerHistory.slice(0,20);}
 state.specialCareer={id:c.id,title:c.title,income:c.income,level:1,startedAge:state.age,record:{attempts:0,wins:0,losses:0,projects:0,totalEarnings:0,bestLevel:1},history:[]};state.combatCareer=c.id==='fighter'?createCombatCareer():null;state.filmStudio=c.id==='director'?createFilmStudio():null;state.esportsCareer=c.id==='esports'?createEsportsCareer():null;if(c.id==='influencer'){state.socialMediaAccount=true;state.followers=Math.max(state.followers||0,100);state.socialMediaPosts=(state.socialMediaPosts||0)+1;}state.fame=clamp((state.fame||0)+4);state.reputation=clamp((state.reputation||50)+2);achievement('بدأ مسار الشهرة: '+c.title);
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
 const costs={actor:7000,musician:3500,influencer:1800,athlete:1500,fighter:2200,writer:1500,director:12000};
 const cost=costs[c.id]||1500;
 if(state.bank<cost){info('💳','الرصيد مش كفاية','النشاط الخاص محتاج '+cash(cost)+'.');return;}
 state.bank-=cost;
 const power=(state.stats.smart/100)+(state.stats.health/140)+(state.fame/180)+(level/22)+(state.reputation/220);
 let gain=0,fame=0,success=chance(Math.min(.9,.18+power*.22));
 let title='',text='';
 if(c.id==='actor'||c.id==='director'){
  title=c.id==='director'?'إنتاج فيلم جديد':'تصوير عمل فني';gain=success?Math.round(5000+Math.random()*30000+state.fame*180):0;fame=success?5+Math.floor(Math.random()*12):0;text=success?'العمل حقق استجابة إيجابية ووصل لجمهور أوسع.':'العمل ما حققش النجاح المتوقع، واتعلمت من التجربة.';
 }else if(c.id==='musician'){
  title='إصدار أغنية';gain=success?Math.round(1500+Math.random()*18000+state.fame*120):0;fame=success?4+Math.floor(Math.random()*10):0;text=success?'الأغنية انتشرت وبدأ يوصلك اهتمام جديد.':'التفاعل كان أقل من المتوقع، ومحتاج تطوّر أسلوبك.';
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
 state.fame=clamp(state.fame+fame);const newLevel=clamp(level+(success?1:0),1,100);if(state.specialCareer)state.specialCareer.level=newLevel;
 c.record.attempts=(c.record.attempts||0)+1;c.record.wins=(c.record.wins||0)+(success?1:0);c.record.losses=(c.record.losses||0)+(success?0:1);
 if(['actor','director','musician','influencer','writer'].includes(c.id))c.record.projects=(c.record.projects||0)+1;
 c.record.totalEarnings=(c.record.totalEarnings||0)+(success?gain:0);c.record.bestLevel=Math.max(c.record.bestLevel||1,newLevel);
 c.history.push({age:state.age,title,success,earnings:success?gain:0,fameGain:fame});if(c.history.length>20)c.history.shift();
 if(success){state.bank+=gain;state.reputation=clamp((state.reputation||50)+3);achievement('نشاط ناجح في '+c.title);}else{state.stats.happiness=clamp(state.stats.happiness-3);state.reputation=clamp((state.reputation||50)-2);}
 log(c.id==='director'?'🎥':c.id==='actor'?'🎬':c.id==='musician'?'🎤':c.id==='influencer'?'📱':c.id==='athlete'?'🏅':c.id==='fighter'?'🥊':'✍️',title,text+(success?' الدخل: '+cash(gain)+'.':''),success?'good':'bad');
 render();info(success?'⭐':'🔁',success?'نشاط ناجح':'تجربة جديدة',text+(success?' الشهرة الحالية '+state.fame+'%.':' جرب التدريب أو نشاطًا مختلفًا في المرة القادمة.'));
}
function tryAudition(){
 closeModal();if(!state.specialCareer){specialCareers();return;}if(state.specialCareer.id==='fighter'){combatCareerMenu();return;}if(state.specialCareer.id==='director'){filmStudioMenu();return;}if(state.specialCareer.id==='esports'){esportsCareerMenu();return;}
 const chanceScore=.22+(state.stats.looks/500)+(state.stats.smart/700)+(state.fame/220)+((state.specialCareer.level||1)/200);
 if(chance(Math.min(.85,chanceScore))){const fameGain=5+Math.floor(Math.random()*10),income=5000+Math.floor(Math.random()*25000);state.fame=clamp(state.fame+fameGain);state.bank+=income;state.specialCareer.level=clamp((state.specialCareer.level||1)+1);log('🌟','فرصة ناجحة','نجحت في فرصة جديدة وكسبت '+cash(income)+'. شهرتك زادت '+fameGain+' نقاط.','good');achievement('نجاح مهني في '+state.specialCareer.title);render();info('🎉','فرصة ناجحة','شهرتك الحالية '+state.fame+'%.');}
 else{state.stats.happiness=clamp(state.stats.happiness-2);log('🎟️','رفض في اختبار أداء','الفرصة دي ما ظبطتش. راجع مهاراتك وحاول مرة تانية.','bad');render();info('🎟️','المرة الجاية','الرفض جزء طبيعي من المسار؛ التدريب يزيد فرصك.');}
}
function crimeMenu(){
 const opts=[
  choice('🛍️','سرقة بسيطة','مكسب محدود مع احتمال غرامة أو سجل جنائي.',()=>commitCrime('سرقة بسيطة',1500,.22,12)),
  choice('🧾','احتيال مالي','مكسب محتمل أكبر وعواقب قانونية أشد.',()=>commitCrime('احتيال مالي',9000,.4,24)),
  choice('🏚️','اقتحام ممتلكات','مجازفة عالية وعواقب خطيرة.',()=>commitCrime('اقتحام ممتلكات',12000,.52,36)),
  choice('🚚','تهريب خيالي','مهمة عالية المخاطر بنتائج متغيرة.',()=>commitCrime('تهريب',16000,.58,42)),
  choice('🏦','سطو كبير','احتمال اعتقال مرتفع جدًا.',()=>commitCrime('سطو كبير',35000,.72,60)),
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
function prisonEvent(){
 const opts=[
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
 let item='';
 if(chance(.28)){const trinkets=['ساعة قديمة','ميدالية عائلية','كاميرا كلاسيكية','كتاب نادر','خاتم موروث'];item=pick(trinkets);state.heirlooms.push({name:item,value:500+Math.floor(Math.random()*4500),age:state.age});}
 log('🎁','هدية اليوم','استلمت '+cash(amount)+(item?' وعثرت على مقتنى نادر: '+item:'')+'.','good');achievement('استلام مكافأة يومية');render();info('🎁','مكافأة اليوم','حصلت على '+cash(amount)+(item?'، وأضيف '+item+' إلى مقتنياتك.':'.'));
}

function challengeDateKey(date){
 return date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');
}
function challengeYesterdayKey(date){
 const d=new Date(date);d.setDate(d.getDate()-1);return challengeDateKey(d);
}
function ensureDailyChallengeBoard(){
 if(!state)return null;
 const now=new Date(),today=challengeDateKey(now),old=state.dailyChallenges&&typeof state.dailyChallenges==='object'?state.dailyChallenges:null;
 if(!old||old.date!==today||!Array.isArray(old.ids)||old.ids.length!==3||!Array.isArray(old.claimed)){
  const eligible=dailyChallengeDefs.filter(c=>c.available(state));
  for(let i=eligible.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[eligible[i],eligible[j]]=[eligible[j],eligible[i]];}
  const streak=old&&old.lastCompletionDate===challengeYesterdayKey(now)?Number(old.streak)||0:0;
  state.dailyChallenges={date:today,ids:eligible.slice(0,3).map(c=>c.id),claimed:[],streak,lastCompletionDate:old&&old.lastCompletionDate||null};
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
 opts.unshift(choice('🔥','سلسلة الإنجاز','أكملت '+completed+' من 3 مهام اليوم. سلسلة الأيام الكاملة: '+(board.streak||0)+'.',()=>{closeModal();info('🔥','سلسلة الإنجاز','استكمل المهام الثلاث في اليوم نفسه للحفاظ على سلسلة التحديات.');}));
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

function achievementsMenu(){
 const opts=(state.accomplishments||[]).slice().reverse().map(a=>choice('🏆',a,'إنجاز مسجل في هذه الحياة.',()=>{closeModal();info('🏆',a,'ده واحد من إنجازات رحلتك الحالية.');}));
 if(!opts.length)opts.push(choice('🌱','لسه مفيش إنجازات','تقدم بالعمر وجرّب أنظمة اللعبة المختلفة.',closeModal));
 opts.unshift(choice('🎁','مكافأة اليوم','مكافأة مرة كل يوم مع احتمال مقتنى موروث.',dailyReward));
 opts.unshift(choice('🏅','شريط حياتك','تصنيف ختامي يعتمد على إنجازاتك.',()=>{closeModal();info('🏅','شريط الحياة',lifeRibbon()+'. هيتسجل التصنيف النهائي عند نهاية الرحلة.');}));
 opts.unshift(choice('🎯','تحديات اليوم','أنجز مهام قصيرة واحصل على مكافآت يومية.',dailyChallengesMenu));
 opts.unshift(choice('🪦','المقبرة والحيوات السابقة','راجع ملخصات الشخصيات التي انتهت حياتها على هذا الجهاز.',cemeteryMenu));
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
 closeModal();if(state&&state.status==='حي'&&state.age>0)archiveLife('اختيار حياة جديدة');state=newLife();dead=false;state.gender=gender;state.name=pick(names[gender])+' '+pick(names.family);state.place={...place};state.bank=place.start;
 if(typeof prompt==='function'){const name=prompt('اكتب اسم الشخصية (اختياري)',state.name);if(name&&name.trim())state.name=name.trim().slice(0,50);}
 log('👶','أول يوم في الدنيا','اتولدت في '+state.place.city+'، '+state.place.country+'. بدأت حكايتك بعائلة وظروف مختلفة، وكل سنة هتفتح قدامك اختيارات جديدة.','special');
 log('🏡','البيت والعيلة','أبوك '+state.family[0].name+' وأمك '+state.family[1].name+' هما أول شبكة أمان ليك.');achievement('بدأت رحلة الحياة');render();
}
function archiveLife(reason){
 if(!state||state.cemeterySaved)return;
 try{
  const list=JSON.parse(localStorage.getItem(CEMETERY_KEY)||'[]');const id=state.lifeId||('life-'+Date.now());
  if(!list.some(x=>x.id===id)){const assets=(state.assets||[]).reduce((n,a)=>n+(a.value||0),0),invest=(state.investments||[]).reduce((n,a)=>n+(a.value||0),0);
   list.unshift({id,name:state.name,age:state.age,cause:state.cause||reason||'نهاية الرحلة',netWorth:(state.bank||0)+assets+invest-(state.debt||0),ribbon:reason&&state.status==='حي'?'حياة متروكة · '+lifeRibbon():lifeRibbon(),country:state.place?.country||'',accomplishments:(state.accomplishments||[]).slice(0,40),children:(state.children||[]).length,createdAt:new Date().toISOString()});
   localStorage.setItem(CEMETERY_KEY,JSON.stringify(list.slice(0,100)));
  }
  state.cemeterySaved=true;
 }catch(e){state.cemeterySaved=true;}
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
 modal('⏳','الرجوع بالزمن','تقدر ترجع لواحدة من آخر 8 نقاط حفظ سنوية. الرجوع يستعيد المال والعلاقات والإحصائيات والسجل كما كانت في تلك السنة.',opts);
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
  choice('📤','تصدير الحفظ','نزّل نسخة JSON من تقدمك.',exportSave),
  choice('📥','استيراد حفظ سابق','استرجع نسخة سبق تصديرها من اللعبة.',importSave)
 ];
 modal('🪪','ملف الشخصية','اسمك ومهاراتك وسجلك هي أجزاء من هويتك. غيّر الاسم أو جهّز مستقبلك.',opts);
}
function getLicense(){
 closeModal();if(state.age<16){info('🚗','لسه بدري','رخصة القيادة متاحة من سن 16.');return;}
 if(state.driversLicense){info('🚗','معاك رخصة بالفعل','تقدر تستخدمها كجزء من أحداث السفر والعمل.');return;}
 if(chance(.75)){state.driversLicense=true;stat('happiness',2);achievement('الحصول على رخصة قيادة');log('🚗','نجحت في اختبار القيادة','اجتزت الاختبار وحصلت على رخصة قيادة.','good');render();info('🚗','مبروك الرخصة','بقى عندك رخصة قيادة، وده ممكن يفتح فرص في بعض الأحداث.');}
 else{stat('happiness',-2);log('🚗','اختبار قيادة غير ناجح','ماعدّتش الاختبار المرة دي. جرّب تتدرب وتعيد المحاولة.','bad');render();info('🚗','حاول مرة أخرى','التدريب والتعلم بيرفعوا فرص النجاح.');}
}
function startAsChild(index){
 if(!state.children[index])return;
 const previous=state,child=previous.children[index],oldPartner=previous.partner;
 const estate=Math.max(0,previous.bank)+previous.assets.reduce((sum,a)=>sum+(a.value||0),0)+previous.investments.reduce((sum,a)=>sum+(a.value||0),0);
 const cashEstate=Math.max(0,previous.bank)+previous.investments.reduce((sum,a)=>sum+(a.value||0),0);
 const share=previous.willDistribution==='الأبناء أولًا'?.9:previous.willDistribution==='الشريك أولًا'?.55:previous.willDistribution==='التبرع بجزء'?.65:.8;
 const heir=newLife();ensureChildGrowthProfile(child);heir.name=child.name;heir.gender=child.gender||'male';heir.age=typeof child.age==='number'?child.age:18;heir.place={...previous.place};heir.bank=Math.round(Math.max(0,previous.bank)*share);heir.stats={...heir.stats,health:clamp(child.health??heir.stats.health),happiness:clamp(child.happiness??heir.stats.happiness),smart:clamp(child.smart??heir.stats.smart),looks:clamp(child.looks??heir.stats.looks)};heir.reputation=clamp((Number(child.schoolPerformance)||50)*.35+(Number(child.careerPotential)||40)*.35+(Number(child.relationshipLevel)||50)*.3);
 heir.family=[...previous.family];previous.children.forEach((sibling,i)=>{if(i!==index)heir.family.push({...sibling,relation:'أخ/أخت'});});heir.partner=null;heir.married=false;heir.children=[];heir.legacy={name:previous.name,inheritance:estate,heirloom:(previous.heirlooms||[])[0]?.name||null};
 heir.heirlooms=[...(previous.heirlooms||[])];heir.accomplishments=['بدأ حياة جديدة كامتداد لعائلة '+previous.name,'ورث '+cash(estate)];
 heir.job=null;heir.assets=previous.assets.map(a=>({...a,id:Date.now()+Math.random()}));heir.investments=previous.investments.map(a=>({...a,value:Math.round((a.value||0)*share),id:Date.now()+Math.random()}));
 heir.family.push({id:'legacy-parent-'+Date.now(),name:previous.name,relation:'والد/والدة متوفى',emoji:previous.gender==='male'?'👨‍🦳':'👩‍🦳',age:previous.age,job:previous.job?previous.job.title:'متوفى',relationshipLevel:100,personality:'موروث عائلي'});if(oldPartner)heir.family.push({...oldPartner,relation:'الأم/الأب'});
 state=heir;dead=false;log('🌳','استمرار السلالة','بدأت حياة جديدة باسم '+state.name+'، وارثًا قصة '+previous.name+' وإرث العائلة.','special');render();closeModal();info('🌳','جيل جديد','ورثت ثروة تقديرية '+cash(estate)+' وبعض مقتنيات العائلة. تبدأ الآن مرحلة مستقلة باختياراتك.');
}
function applyUiSettings(){
 const body=document.body;
 if(body&&body.classList){
  body.classList.toggle('theme-dark',uiSettings.theme==='dark');
  body.classList.toggle('text-large',uiSettings.textScale==='large');
 }
 if(typeof document.querySelector==='function'){
  const themeMeta=document.querySelector('meta[name="theme-color"]');
  if(themeMeta)themeMeta.setAttribute('content',uiSettings.theme==='dark'?'#17232c':'#E53935');
 }
}
function loadUiSettings(){
 try{
  const raw=JSON.parse(localStorage.getItem(SETTINGS_KEY)||'null');
  if(raw&&typeof raw==='object'&&!Array.isArray(raw)){
   if(raw.theme==='dark'||raw.theme==='light')uiSettings.theme=raw.theme;
   if(raw.textScale==='large'||raw.textScale==='normal')uiSettings.textScale=raw.textScale;
  }
 }catch(e){}
 applyUiSettings();
}
function persistUiSettings(){
 try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(uiSettings));}catch(e){}
 applyUiSettings();
}
function settingsMenu(){
 modal('⚙️','إعدادات العرض','الإعدادات دي بتتخزن على الجهاز بشكل مستقل عن ملف حياتك، ومش بتغيّر الحفظ القديم.',[
  choice(uiSettings.theme==='dark'?'☀️':'🌙',uiSettings.theme==='dark'?'تفعيل الوضع الفاتح':'تفعيل الوضع الداكن','المظهر الحالي: '+(uiSettings.theme==='dark'?'داكن':'فاتح')+'.',()=>{
   uiSettings.theme=uiSettings.theme==='dark'?'light':'dark';persistUiSettings();settingsMenu();
  }),
  choice('🔤',uiSettings.textScale==='large'?'حجم النص: كبير':'حجم النص: عادي','كبّر نص سجل الأحداث والقرارات لسهولة القراءة.',()=>{
   uiSettings.textScale=uiSettings.textScale==='large'?'normal':'large';persistUiSettings();settingsMenu();
  }),
  choice('↩️','استعادة إعدادات العرض الافتراضية','العودة للوضع الفاتح وحجم النص العادي.',()=>{
   uiSettings={theme:'light',textScale:'normal'};persistUiSettings();settingsMenu();
  }),
  choice('↩️','رجوع للقائمة الرئيسية','',mainMenu)
 ]);
}
function mainMenu(){
 modal('☰','القائمة الرئيسية','إدارة حياتك وحفظ تقدمك واستعراض إنجازاتك.',[
  choice('🌱','حياة جديدة','ابدأ شخصية جديدة أو خصّص بلد الميلاد.',()=>newLifeSetup()),
  choice('🪦','مقبرة الحيوات','استعرض الشخصيات السابقة وأعمارها ونهاياتها.',()=>cemeteryMenu()),
  choice('🏆','الإنجازات والأشرطة','الأهداف التي حققتها في رحلتك.',()=>achievementsMenu()),
  choice('🎯','تحديات اليوم','ثلاث مهام يومية ومكافآت إضافية عند إكمالها.',()=>dailyChallengesMenu()),
  choice('⏳','الرجوع بالزمن','استرجع نقطة حفظ سنوية سابقة.',timeMachineMenu),
  choice('🎁','المكافأة اليومية','احصل على مكافأتك اليومية إن كانت متاحة.',()=>dailyReward()),
  choice('🪪','ملف الشخصية','تعديل الاسم وبيانات الشخصية.',()=>customizeMenu()),
  choice('⚙️','إعدادات العرض','الوضع الداكن وحجم النص، من غير تغيير بيانات حياتك.',()=>settingsMenu()),
  choice('💾','تصدير الحفظ','نزّل نسخة احتياطية من حياتك الحالية.',()=>exportSave()),
  choice('📥','تحميل حفظ','استرجع حياة من ملف JSON قمت بتصديره سابقًا.',()=>importSave()),
  choice('☰','كل الأنشطة','الصحة والهوايات والحيوانات والسفر والمال والمزيد.',()=>activities())
 ]);
}
function activities(){
 modal('☰','الأنشطة والحياة اليومية','اختار أي جانب من حياتك تحب تديره. التغييرات بتتسجل تلقائيًا على جهازك.',[
  choice('🩺','الصحة والعناية بالنفس','طبيب، جيم، راحة ونشاط بدني.',()=>healthMenu()),
  choice('🎨','الهوايات والمهارات','ابدأ هواية أو زوّد مستواك.',()=>hobbiesMenu()),
  choice('🐾','الحيوانات الأليفة','تبنّي حيوان أو الاهتمام بالحيوانات الحالية.',()=>petsMenu()),
  choice('🌟','المهن الخاصة والشهرة','تمثيل وموسيقى ومحتوى ورياضة ومسارات مختلفة.',()=>specialCareers()),
  choice('⚖️','الجريمة والسجل القانوني','قرارات خيالية عالية المخاطر لها عواقب.',()=>crimeMenu()),
  choice('🌍','السفر والهجرة','إجازة أو انتقال لبلد جديدة.',()=>travelMenu()),
  choice('📊','البنك والاستثمارات','قروض، سداد ديون ومحافظ استثمار.',()=>financeMenu()),
  choice('👪','الأسرة والأبناء','إدارة العلاقة والزواج وتربية الأبناء.',()=>familyMenu()),
  choice('🏆','الإنجازات والمقتنيات','إنجازاتك، الأشرطة الختامية والمكافأة اليومية.',()=>achievementsMenu()),
  choice('🪪','ملف الشخصية','تعديل الاسم ورخصة القيادة وتصدير الحفظ.',()=>customizeMenu()),
  choice('📱','السوشيال ميديا','حسابات ومحتوى ومتابعون وتعاونات.',()=>socialMediaMenu()),
  choice('💈','الصالون والمظهر','قص الشعر والملابس وتغيير الإطلالة.',()=>salonMenu()),
  choice('🎬','السينما','اختر فيلمًا لوقت ترفيه قصير.',()=>cinemaMenu()),
  choice('🩺','زيارة الطبيب','تكلفة 1,200 '+state.place.unit+'، تستعيد جزءًا من الصحة.',()=>activity('doctor'),'1,200 '+state.place.unit),
  choice('🏋️','الجيم','تكلفة 300 '+state.place.unit+'، تحسن الصحة والمظهر.',()=>activity('gym'),'300 '+state.place.unit),
  choice('📚','المكتبة','نشاط مجاني يزيد الذكاء.',()=>activity('library'),'مجانًا'),
  choice('🏖️','خروجة أو إجازة','تكلفة 1,800 '+state.place.unit+' لتحسين المزاج.',()=>activity('vacation'),'1,800 '+state.place.unit),
  choice('🤝','مساعدة مجتمعية','نشاط مجاني لرفع السعادة والسمعة.',()=>activity('volunteer'),'مجانًا'),
  choice('🎟️','اليانصيب','تذكرة 100 '+state.place.unit+'؛ مكسب نادر وخسارة غالبًا.',()=>activity('lottery'),'100 '+state.place.unit),
  choice('🌃','الحياة الليلية','خروجة من سن 18 مقابل 1,200 '+state.place.unit+'.',()=>activity('nightlife'),'1,200 '+state.place.unit),
  choice('❤️','تبرّع خيري','ساهم بـ1,000 '+state.place.unit+' لرفع السمعة والسعادة.',()=>activity('donate'),'1,000 '+state.place.unit),
  choice('💾','تصدير الحفظ','نزّل ملف JSON تحتفظ بيه.',exportSave),
  choice('🌱','حياة جديدة','ابدأ قصة جديدة مع اختيار عشوائي أو تخصيص بلد الميلاد والنوع.',()=>{closeModal();info('🌱','حياة جديدة','هتبدأ حياة جديدة وتستبدل الحفظ الحالي.',[choice('↻','تابع','',()=>{closeModal();if(confirm('تبدأ حياة جديدة وتستبدل الحفظ الحالي؟'))newLifeSetup();}),choice('رجوع','أحتفظ بالحياة الحالية','',closeModal)]);})
 ]);
}
function healthMenu(){
 modal('❤️','الصحة والعافية','حالتك الصحية بتتأثر بالعمر والعادات والعلاقات والمخاطر. دي أنشطة داخل اللعبة وليست نصيحة طبية.',[
  choice('🩺','زيارة الطبيب','كشف مقابل 1,200 '+state.place.unit+'.',()=>activity('doctor'),'1,200 '+state.place.unit),
  choice('🏋️','التمرين','مناسب من سن 12، يحسن اللياقة والمظهر.',()=>activity('gym'),'300 '+state.place.unit),
  choice('🧘','تأمل وراحة','نشاط مجاني يقلل الضغط ويحسن المزاج.',()=>{closeModal();stat('happiness',5);stat('health',2);log('🧘','وقت للراحة','خصصت وقتًا للهدوء واستعادة طاقتك.','good');render();}),
  choice('🛌','تنظيم النوم','يزود الصحة ويقلل آثار الإرهاق.',()=>{closeModal();stat('health',6);stat('happiness',2);log('🛌','نوم منتظم','حاولت تنظم النوم وتخفف السهر.','good');render();}),
  choice('📚','معرفة صحية','تعلم عادات صحية بدون تكلفة.',()=>{closeModal();stat('smart',2);log('📚','تثقيف صحي','قرأت عن العادات اليومية المفيدة.');render();})
 ]);
}
function socialMediaMenu(){
 const opts=[];
 if(!state.socialMediaAccount)opts.push(choice('📱','إنشاء حساب','ابدأ حسابًا باسمك بدون تكلفة.',createSocialAccount));
 else{
  opts.push(choice('📸','نشر صورة أو قصة','محتوى بسيط قد يزيد التفاعل والمتابعين.',()=>publishSocialContent('story')));
  opts.push(choice('🎥','نشر فيديو','جهد أكبر وفرصة انتشار أوسع.',()=>publishSocialContent('video')));
  opts.push(choice('🤝','تعاون مدفوع','حملة برعاية شركة، تحتاج سمعة وجمهورًا.',()=>publishSocialContent('sponsor')));
  opts.push(choice('📊','إحصاءات الحساب','تابع المتابعين والمنشورات والشهرة.',()=>{closeModal();info('📊','إحصاءات حسابك','المتابعون: '+fmt(state.followers||0)+'. المنشورات: '+fmt(state.socialMediaPosts||0)+'. الشهرة: '+clamp(state.fame||0)+'%. السمعة: '+clamp(state.reputation||50)+'%.');}));
  opts.push(choice('🗑️','إيقاف الحساب','إغلاق الحساب وإيقاف النمو العضوي.',()=>{closeModal();state.socialMediaAccount=false;log('📱','إغلاق حساب التواصل','قررت توقف نشاطك على السوشيال ميديا.','');render();info('📱','تم إغلاق الحساب','المتابعون محفوظون في سجل حياتك لكن النمو توقف.');}));
 }
 modal('📱','السوشيال ميديا','ابنِ جمهورًا بالتدريج. المحتوى قد ينتشر أو يتعرض لانتقاد حسب اختياراتك وسمعتك.',opts);
}
function createSocialAccount(){
 closeModal();if(state.age<10){info('🔒','لسه بدري','إنشاء حساب شخصي متاح من سن 10 داخل اللعبة.');return;}
 state.socialMediaAccount=true;state.followers=Math.max(state.followers||0,10+Math.floor(Math.random()*90));state.socialMediaPosts=0;log('📱','إنشاء حساب جديد','بدأت حسابًا على السوشيال ميديا. النمو هيعتمد على المحتوى والاستمرار.','good');render();info('📱','حسابك جاهز','انشر أول محتوى عشان تبدأ في بناء جمهور.');
}
function publishSocialContent(kind){
 closeModal();if(!state.socialMediaAccount){socialMediaMenu();return;}
 const costs={story:0,video:250,sponsor:2000},cost=costs[kind]||0;
 if(state.bank<cost){info('💳','الرصيد مش كفاية','النشاط محتاج '+cash(cost)+'.');return;}
 if(state.age<13&&kind==='sponsor'){info('🔒','التعاون التجاري متاح للبالغين','تعاونات العلامات التجارية متاحة من سن 18 داخل اللعبة.');return;}
 if(kind==='sponsor'&&state.age<18){info('🔒','التعاون التجاري متاح للبالغين','تعاونات العلامات التجارية متاحة من سن 18 داخل اللعبة.');return;}
 state.bank-=cost;state.socialMediaPosts=(state.socialMediaPosts||0)+1;
 const strength=(state.stats.smart/200)+(state.stats.looks/250)+(state.fame/180)+(state.reputation/220);
 let viral=chance(Math.min(.78,.12+strength)),gain=0;
 if(viral){gain=kind==='sponsor'?Math.round(1500+state.followers*.05+Math.random()*5000):kind==='video'?Math.round(40+Math.random()*400+state.fame*6):Math.round(8+Math.random()*100);state.followers=Math.max(0,(state.followers||0)+gain);state.fame=clamp(state.fame+(kind==='video'?4:2));state.reputation=clamp(state.reputation+2);if(kind==='sponsor')state.bank+=gain;log('📱',kind==='sponsor'?'تعاون تجاري ناجح':kind==='video'?'فيديو انتشر':'تفاعل مع منشور','زاد جمهورك بمقدار '+fmt(gain)+' متابع.'+(kind==='sponsor'?' وكسبت '+cash(gain)+'.':''),'good');}
 else{state.stats.happiness=clamp(state.stats.happiness-1);if(chance(.25))state.reputation=clamp(state.reputation-3);log('📱','تفاعل محدود','المحتوى ماوصلش لجمهور كبير المرة دي. راجع التوقيت والأسلوب وجرب تاني.','');}
 if(state.followers>=1000)achievement('بناء جمهور على السوشيال ميديا');if(state.followers>=100000)achievement('وصلت إلى مئة ألف متابع');render();info(viral?'⭐':'📱',viral?'المحتوى انتشر':'المحتوى لم ينتشر',viral?'إجمالي المتابعين '+fmt(state.followers)+'. الشهرة '+state.fame+'%.':'المتابعون الحاليون '+fmt(state.followers)+'. الانتشار مش مضمون وكل منشور تجربة جديدة.');
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
 if(type==='doctor'){if(state.bank<1200){info('💳','الرصيد مش كفاية','زيارة الطبيب تكلف '+cash(1200)+'.');return;}state.bank-=1200;flash('-'+cash(1200),true);stat('health',16);log('🩺','زيارة الطبيب','دفعت '+cash(1200)+' واهتميت بصحتك. لو التعب مستمر، المتابعة الطبية المنتظمة أفضل.','good');}
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
   choice('🎲','أخاطر','خسارة مالية أو تبعات قانونية محتملة.',()=>{closeModal();if(chance(.48)){const gain=3000+Math.floor(Math.random()*7000);state.bank+=gain;flash('+'+cash(gain));log('⚠️','مكسب قصير المدى','حققت '+cash(gain)+'، لكن المخاطرة كانت كبيرة.','bad');}else{const fine=Math.min(Math.max(0,state.bank),5000);state.bank-=fine;stat('happiness',-8);if(chance(.45)){state.job=null;log('🚔','عواقب قانونية','خسرت '+cash(fine)+' وتضررت سمعتك وفقدت عملك بسبب القضية.','bad');}else log('🚔','عواقب قانونية','خسرت '+cash(fine)+' وتعلمت إن المكسب السريع ممكن تكون تكلفته أكبر.','bad');}render();})
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
    const data=JSON.parse(String(reader.result||''));
    if(!data||typeof data!=='object'||Array.isArray(data)||data.version!==1||!data.stats||typeof data.stats!=='object'||Array.isArray(data.stats)||!Array.isArray(data.log)||!Array.isArray(data.family)||!data.place||typeof data.place!=='object'||Array.isArray(data.place))throw new Error('invalid');
    normalizeCoreState(data);
    const defaults={lifeId:Date.now()+Math.random(),cemeterySaved:false,jobHistory:[],specialCareer:null,specialCareerHistory:[],combatCareer:null,filmStudio:null,investments:[],business:null,married:false,children:[],coParentingPlans:[],pets:[],hobbies:[],fame:0,followers:0,socialMediaAccount:false,socialMediaPosts:0,reputation:50,crimeRecord:0,prison:null,debt:0,willDistribution:'الأسرة بالتساوي',heirlooms:[],dailyRewardDate:null,dailyChallenges:null,timeMachineSnapshots:[],legacy:{name:null,inheritance:0,heirloom:null},driversLicense:false,travelHistory:[],retired:false,yearCount:data.age||0,assets:[],friends:[],accomplishments:[],status:'حي'};
    Object.keys(defaults).forEach(k=>{if(data[k]===undefined||data[k]===null)data[k]=defaults[k];});
    if(!Array.isArray(data.assets))data.assets=[];if(!Array.isArray(data.timeMachineSnapshots))data.timeMachineSnapshots=[];if(!Array.isArray(data.coParentingPlans))data.coParentingPlans=[];data.coParentingPlans.forEach(p=>{if(p&&typeof p==='object'){if(!Array.isArray(p.childIds))p.childIds=[];if(!Array.isArray(p.history))p.history=[];if(!Number.isFinite(Number(p.supportPerChild)))p.supportPerChild=2200;if(!Number.isFinite(Number(p.arrears)))p.arrears=0;}});data.assets.forEach(a=>{if((a.kind==='car'||a.kind==='property')&&!Number.isFinite(Number(a.condition)))a.condition=100;});
    if(!data.education||typeof data.education!=='object')data.education={level:0,school:'لم تبدأ الدراسة',major:null,yearsLeft:0,tuition:0};data.education.clubs=Array.isArray(data.education.clubs)?data.education.clubs:[];
    const npcDefaults=n=>{if(!n||typeof n!=='object')return;if(!Number.isFinite(Number(n.generosity)))n.generosity=50;if(!Number.isFinite(Number(n.craziness)))n.craziness=50;if(!Number.isFinite(Number(n.money)))n.money=50;if(!Number.isFinite(Number(n.petulance)))n.petulance=50;if(!Number.isFinite(Number(n.loyalty)))n.loyalty=55;if(!Number.isFinite(Number(n.jealousy)))n.jealousy=40;if(!Number.isFinite(Number(n.reliability)))n.reliability=55;if(!Array.isArray(n.interactions))n.interactions=[];};if(!Array.isArray(data.specialCareerHistory))data.specialCareerHistory=[];const careerDefaults=c=>{if(!c||typeof c!=='object')return;if(!c.record||typeof c.record!=='object')c.record={attempts:0,wins:0,losses:0,projects:0,totalEarnings:0,bestLevel:clamp(c.level||1)};if(!Array.isArray(c.history))c.history=[];};careerDefaults(data.specialCareer);data.specialCareerHistory.forEach(careerDefaults);(data.family||[]).forEach(npcDefaults);(data.friends||[]).forEach(npcDefaults);(data.children||[]).forEach(npcDefaults);npcDefaults(data.partner);
    state=data;dead=state.status==='متوفى';save();render();if(dead)death(state.cause||'نهاية رحلة الحياة');else info('📥','تم استيراد الحفظ','تم تحميل '+state.name+' · العمر '+state.age+' سنة.');
   }catch(e){info('⚠️','ملف حفظ غير صالح','اختار ملف JSON تم تصديره من لعبة حياة. الحفظ الحالي لم يتغير.');}
  };
  reader.onerror=()=>info('⚠️','تعذرت قراءة الملف','جرّب ملفًا آخر.');
  reader.readAsText(file);
 });
 input.click();
}
function exportSave(){
 const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='hekayat-hayah-save.json';a.click();URL.revokeObjectURL(url);closeModal();flash('تم تجهيز ملف الحفظ');
}
document.querySelectorAll('[data-panel]').forEach(btn=>btn.addEventListener('click',()=>{
 document.querySelectorAll('.navbtn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');
 const p=btn.dataset.panel;if(p==='career')showCareer();if(p==='assets')assets();if(p==='relations')relations();if(p==='activities')activities();
}));
$('ageUpBtn').addEventListener('click',ageUp);
if($('menuBtn'))$('menuBtn').addEventListener('click',()=>mainMenu());
if($('profileBtn'))$('profileBtn').addEventListener('click',()=>achievementsMenu());
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
