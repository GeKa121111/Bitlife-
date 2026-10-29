'use strict';
(() => {
const $ = id => document.getElementById(id);
const KEY = 'hekayat_hayah_save_v1';
const fmt = n => new Intl.NumberFormat('ar-EG',{maximumFractionDigits:0}).format(Math.round(Number(n)||0));
const cash = n => fmt(n)+' ج.م';
const clamp = (n,min=0,max=100) => Math.max(min,Math.min(max,Math.round(n)));
const pick = list => list[Math.floor(Math.random()*list.length)];
const chance = p => Math.random()<p;
const esc = s => String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let state, dead=false;
const names = {
 male:['آدم','يوسف','عمر','مالك','زياد','حمزة','كريم','سليم','ياسين','علي','إياد','مروان','أحمد','سيف','نوح'],
 female:['مريم','ليلى','سلمى','نور','جنى','ملك','فريدة','ياسمين','هنا','تاليا','آية','دانا','لارا','مكة','ريماس'],
 family:['عبدالله','حسن','إبراهيم','منصور','عادل','عمر','سعيد','فتحي','شريف','كمال','النجار','الحمادي','هاشم']
};
const places=[
 {country:'مصر',city:'القاهرة',flag:'🇪🇬',start:18000,unit:'ج.م'},
 {country:'مصر',city:'الإسكندرية',flag:'🇪🇬',start:16000,unit:'ج.م'},
 {country:'السعودية',city:'جدة',flag:'🇸🇦',start:4200,unit:'ر.س'},
 {country:'الإمارات',city:'دبي',flag:'🇦🇪',start:5200,unit:'د.إ'}
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
 {id:'founder',title:'صاحب مشروع',salary:180000,age:23,smart:52,edu:0,emoji:'🚀',desc:'فرصة للنمو مع مخاطرة أعلى.'}
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
function makePerson(gender,relation,emoji,age,level){
 return {id:relation+'-'+Math.random().toString(36).slice(2,8),name:pick(names[gender])+' '+pick(names.family),relation,emoji,age,relationshipLevel:level,personality:pick(['حنون','عملي','مرح','جاد','طموح','فضولي'])};
}
function newLife(){
 const gender=pick(['male','female']),place=pick(places);
 const father=makePerson('male','الأب','👨',28+Math.floor(Math.random()*12),68+Math.floor(Math.random()*28));
 const mother=makePerson('female','الأم','👩',25+Math.floor(Math.random()*12),72+Math.floor(Math.random()*26));
 const sibling=makePerson(gender,'الأخ/الأخت','🧒',Math.floor(Math.random()*8),55+Math.floor(Math.random()*35));
 return {version:1,name:pick(names[gender])+' '+pick(names.family),gender,age:0,place,bank:place.start,stats:{happiness:65+Math.floor(Math.random()*26),health:76+Math.floor(Math.random()*22),smart:35+Math.floor(Math.random()*41),looks:35+Math.floor(Math.random()*51)},education:{level:0,school:'لم تبدأ الدراسة',major:null,yearsLeft:0,tuition:0},job:null,performance:50,assets:[],family:[father,mother,sibling],friends:[],partner:null,log:[],accomplishments:['بدأت رحلة الحياة'],status:'حي',cause:null,retired:false,yearCount:0,wealthPeak:place.start};
}
function save(){
 try{localStorage.setItem(KEY,JSON.stringify(state));$('saveStatus').textContent='● محفوظة';}
 catch(e){$('saveStatus').textContent='⚠ الحفظ غير متاح';}
}
function load(){
 try{const x=JSON.parse(localStorage.getItem(KEY)||'null');if(x&&x.version===1&&x.stats&&Array.isArray(x.log))return x;}catch(e){}
 return null;
}
function flash(text,bad=false){
 const el=document.createElement('div');el.className='feedback '+(bad?'bad':'good');el.textContent=text;$('feedbackRoot').appendChild(el);setTimeout(()=>el.remove(),1320);
}
function stat(key,delta){
 if(!delta)return;
 if(key==='bank'){state.bank+=delta;flash((delta>0?'+':'')+cash(delta),delta<0);return;}
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
 renderFeed();save();
}
function achievement(s){if(!state.accomplishments.includes(s))state.accomplishments.push(s);}
function title(){
 if(state.status==='متوفى')return 'رحل عن الدنيا';
 if(state.retired)return 'متقاعد';
 if(state.age<2)return 'رضيع';
 if(state.age<6)return 'طفل صغير';
 if(state.age<12)return 'تلميذ ابتدائي';
 if(state.age<15)return 'طالب إعدادي';
 if(state.age<18)return 'طالب ثانوي';
 if(state.job)return state.job.title;
 if(state.education.yearsLeft>0)return 'طالب جامعي';
 if(state.age<23)return 'شاب';
 return 'بالغ';
}
function avatar(){
 if(state.status==='متوفى')return '🪦';
 if(state.age<2)return '👶🏻';
 if(state.age<6)return state.gender==='male'?'🧒🏻':'👧🏻';
 if(state.age<18)return state.gender==='male'?'👦🏻':'👧🏻';
 if(state.age<60)return state.gender==='male'?'🧑🏻':'👩🏻';
 return state.gender==='male'?'👴🏻':'👵🏻';
}
function renderHeader(){
 $('avatar').childNodes[0].nodeValue=avatar();$('flag').textContent=state.place.flag;
 $('characterName').textContent=state.name;$('ageTag').textContent='العمر '+fmt(state.age)+' سنة';$('titleTag').textContent=title();
 $('cityTag').textContent=state.place.city+'، '+state.place.country;$('bankBalance').textContent=cash(state.bank);
 $('bankBalance').classList.toggle('negative',state.bank<0);
 $('wealthNote').textContent=state.bank<0?'رصيدك بالسالب — راجع مصاريفك':state.bank>100000?'بتبني أمان مالي كويس':'كل سنة فرصة جديدة';
 $('lifeMeta').textContent='السنة '+fmt(state.yearCount+1)+' من حكايتك';
}
function renderStats(){
 const rows=[['happiness','😄','السعادة'],['health','❤️','الصحة'],['smart','🧠','الذكاء'],['looks','✨','المظهر']];
 $('statsPanel').innerHTML=rows.map(r=>{const v=state.stats[r[0]],color=v>=65?'#5de1ae':v>=35?'#f5c96d':'#ff7185';return '<div class="statrow"><div class="stathead"><span class="statlabel">'+r[1]+' '+r[2]+'</span><span class="statvalue">'+v+'%</span></div><div class="track"><div class="fill" style="width:'+v+'%;background:'+color+'"></div></div></div>';}).join('');
}
function renderFeed(){
 const feed=$('lifeFeed');
 if(!state.log.length){feed.innerHTML='<div class="empty">لسه حكايتك في أولها. اضغط على زر <b>＋ سنة</b> عشان تشوف إيه اللي هيحصل.</div>';return;}
 let html='',last=null;
 state.log.forEach(x=>{if(x.age!==last){last=x.age;html+='<div class="agegroup"><span>العمر: '+fmt(last)+' سنة</span></div>';}
 html+='<article class="logcard'+(x.tone==='good'?' good':x.tone==='bad'?' bad':x.tone==='special'?' special':'')+'"><div class="logicon">'+esc(x.icon)+'</div><div class="logcontent"><div class="logtitle">'+esc(x.title)+'</div><div class="logtext">'+esc(x.text)+'</div></div></article>';});
 feed.innerHTML=html;requestAnimationFrame(()=>{feed.scrollTop=feed.scrollHeight;});
}
function render(){
 renderHeader();renderStats();renderFeed();document.querySelectorAll('.navbtn').forEach(b=>b.classList.remove('active'));save();
}
function closeModal(){ $('modalRoot').innerHTML=''; }
function choice(icon,title,desc,action,price=''){return {icon,title,desc,action,price};}
function modal(icon,title,desc,choices,closable=true){
 const root=$('modalRoot');
 const list=choices.map((c,i)=>'<button class="choice" data-i="'+i+'" '+(c.disabled?'disabled':'')+'><span class="choiceico">'+(c.icon||'›')+'</span><span class="ctext"><span class="ctitle">'+esc(c.title||c.label||'اختيار')+'</span>'+(c.desc?'<span class="cdesc">'+esc(c.desc)+'</span>':'')+'</span>'+(c.price?'<span class="price">'+esc(c.price)+'</span>':'')+'</button>').join('');
 root.innerHTML='<div class="overlay" id="overlay"><section class="modal" role="dialog" aria-modal="true" aria-label="'+esc(title)+'"><div class="modalhead"><div class="modalicon">'+icon+'</div><div class="modaltitle">'+esc(title)+'</div>'+(closable?'<button class="closebtn" id="closeModal" aria-label="إغلاق">×</button>':'')+'</div><div class="modalbody">'+(desc?'<p class="desc">'+esc(desc)+'</p>':'')+'<div class="choicegrid">'+list+'</div></div></section></div>';
 const overlay=$('overlay');overlay.addEventListener('click',e=>{if(e.target===overlay&&closable)closeModal();});
 if(closable&&$('closeModal'))$('closeModal').addEventListener('click',closeModal);
 root.querySelectorAll('[data-i]').forEach(b=>b.addEventListener('click',()=>{const c=choices[Number(b.dataset.i)];if(c&&c.action)c.action();}));
}
function info(icon,title,desc,choices=[choice('✓','تمام','',closeModal)]){modal(icon,title,desc,choices);}
function validState(){return state&&state.status==='حي'&&!dead;}
function availableEvents(){return events.filter(e=>state.age>=e.range[0]&&state.age<=e.range[1]);}
function randomEvent(){
 if(!validState())return;
 const pool=availableEvents();if(!pool.length){info('🌤️','سنة هادئة','عدّت السنة من غير حدث استثنائي، بس اختياراتك اليومية لسه بتبني مستقبلك.');return;}
 const e=pick(pool);
 modal(e.icon,e.title,e.text,e.choices.map(c=>choice('›',c.label,c.desc,()=>{
   closeModal();
   if(c.cost&&state.bank<c.cost){info('💳','الرصيد مش كفاية','الاختيار ده محتاج '+cash(c.cost)+'، ورصيدك الحالي '+cash(state.bank)+'.',[choice('↩️','تمام','',()=>{closeModal();afterDecision();})]);return;}
   if(c.cost)state.bank-=c.cost;
   let failed=false,result=c.result||'اخدت قرارك وكمّلت طريقك.';
   if(c.risk&&chance(c.risk)){failed=true;result=c.failText||'النتيجة ما كانتش زي ما توقعت.';effects(c.fail);if(c.fail&&c.fail.bank)state.bank+=c.fail.bank;}
   else{effects(c.effects);if(c.win)effects(c.win);}
   if(c.effects&&c.effects.bank){} 
   log(e.icon,e.title,result,failed?'bad':'special');render();
   if(state.stats.health<=0){death('تدهور الحالة الصحية');return;}
   afterDecision();
 },c.cost?'− '+cash(c.cost):'')),false);
}
function afterDecision(){if(!validState())return;if(state.stats.health<=0){death('تدهور الحالة الصحية');return;}render();}
function ageUp(){
 if(!validState())return;
 state.age++;state.yearCount++;
 const assetUpkeep=state.assets.reduce((s,a)=>s+a.upkeep,0);
 if(state.job&&!state.retired){
   const salary=Math.round(state.job.salary*state.performance/100);state.bank+=salary;
   log('💼','دخل سنوي','استلمت '+cash(salary)+' من شغلك في '+state.job.title+'.','good');
   state.performance=clamp(state.performance+(chance(.58)?2:-1),20,100);
 }
 if(state.age>=18&&!state.retired){
   const living=Math.round(9000+state.age*180);state.bank-=living;
   log('🧾','مصاريف المعيشة','دفعت '+cash(living)+' لمصاريف السنة من أكل ومواصلات واحتياجات أساسية.');
 }
 if(assetUpkeep){state.bank-=assetUpkeep;log('🔧','صيانة الأصول','صيانة ممتلكاتك كلّفتك '+cash(assetUpkeep)+'.','bad');}
 if(state.age>=3){
   state.stats.health=clamp(state.stats.health+(chance(.5)?1:-1)+(state.age>55?-2:0));
   state.stats.happiness=clamp(state.stats.happiness+(chance(.5)?2:-1));
   if(state.age>45)state.stats.looks=clamp(state.stats.looks-1);
 }
 if(state.education.yearsLeft>0){
   if(state.bank>=state.education.tuition){state.bank-=state.education.tuition;state.education.yearsLeft--;state.stats.smart=clamp(state.stats.smart+3);log('🎓','سنة جامعية جديدة','نجحت في سنة من دراسة '+state.education.major+'. المتبقي '+state.education.yearsLeft+' سنوات.','special');
    if(state.education.yearsLeft===0){state.education.level=state.education.major==='تجارة وإدارة'?2:state.education.major==='علوم الحاسب'?3:state.education.major==='هندسة'?4:5;state.education.school='خريج '+state.education.major;log('🎓','اتخرجت من الجامعة','أنهيت دراسة '+state.education.major+'. فرص جديدة بقت متاحة ليك.','good');achievement('التخرج من '+state.education.major);}
   }else{log('⚠️','تعثر دراسي','الرصيد مش كافي لدفع رسوم السنة. الدراسة اتوقفت مؤقتًا.','bad');state.education.yearsLeft=0;}
 }
 if(state.age===6){state.education.level=Math.max(state.education.level,1);state.education.school='المدرسة الابتدائية';log('🏫','أول يوم مدرسة','بدأت رحلتك في المدرسة الابتدائية. هتتعلم حاجات كتير وتكوّن صداقات.','special');achievement('بدأت التعليم الابتدائي');}
 if(state.age===12){state.education.school='المرحلة الإعدادية';log('📚','مرحلة جديدة','خلصت المرحلة الابتدائية وبدأت الإعدادي. اختياراتك الدراسية هتبدأ تفرق أكتر.','special');}
 if(state.age===15){state.education.school='المرحلة الثانوية';log('🎒','الثانوية العامة','دخلت مرحلة مهمة؛ حاول توازن بين المذاكرة وصحتك.','special');}
 if(state.age===18){state.education.school='خريج ثانوية';log('🎓','نهاية مرحلة وبداية التانية','خلصت سنين المدرسة. قدامك الجامعة أو الشغل أو سنة راحة.','special');achievement('أنهيت التعليم المدرسي');}
 if(state.age===60&&!state.retired){state.retired=true;if(state.job){log('🌅','التقاعد','وصلت لسن التقاعد. حان وقت الراحة والاستمتاع باللي بنيته.','special');state.job=null;}achievement('وصلت لمرحلة التقاعد');}
 if(state.age===60)log('🌅','ستون سنة من الحكايات','وصلت لمرحلة جديدة. اهتم بصحتك وعلاقاتك وخططك للسنين الجاية.','special');
 if(state.age>=65&&chance(.12))state.stats.health=clamp(state.stats.health-5);
 state.wealthPeak=Math.max(state.wealthPeak,state.bank);render();save();
 if(state.stats.health<=0){death('تدهور الحالة الصحية');return;}
 let risk=state.age>95?.2:state.age>90?.12:state.age>85?.06:state.age>80?.025:0;
 if((risk&&chance(risk))||state.age>105){death(state.age>105?'نهاية رحلة طويلة':'أسباب طبيعية بعد عمر طويل');return;}
 if(state.age===18){age18Choice();return;}
 randomEvent();
}
function age18Choice(){
 modal('🎓','وبعد المدرسة؟','عندك 18 سنة. تختار تبدأ إزاي؟ مفيش طريق واحد صح، وكل اختيار له تكلفة وفرص مختلفة.',[
 choice('🏛️','أقدّم على الجامعة','اختار تخصص يناسب مستواك وميزانيتك.',()=>{closeModal();university(true);}),
 choice('💼','أدور على شغل','ابدأ تكسب خبرة وفلوس.',()=>{closeModal();career();}),
 choice('🌤️','آخد سنة راحة','أرتّب أهدافي وأهتم بنفسي.',()=>{closeModal();stat('happiness',4);log('🌤️','سنة لإعادة الترتيب','اخدت وقت تراجع أهدافك وتفكر في الخطوة الجاية.','special');render();randomEvent();})
 ],false);
}
function death(cause){
 dead=true;state.status='متوفى';state.cause=cause;save();render();
 const assetValue=state.assets.reduce((sum,a)=>sum+a.value,0),net=state.bank+assetValue;
 const achievements=state.accomplishments.length?state.accomplishments.map(a=>'• '+esc(a)).join('<br>'):'لسه مفيش إنجازات مسجلة، بس كل حياة ليها حكايتها.';
 $('modalRoot').innerHTML='<div class="overlay"><section class="modal"><div class="death"><div class="tomb">🪦</div><div class="deathtitle">انتهت حكاية '+esc(state.name)+'</div><div class="deathsub">عشت '+fmt(state.age)+' سنة.<br>سبب الوفاة: '+esc(cause)+'.<br>كل قرار ساب أثر، وكل سنة كانت فصل من قصتك.</div><div class="summarygrid"><div class="summarycell"><div class="summarylabel">الثروة النهائية</div><div class="summaryvalue">'+cash(net)+'</div></div><div class="summarycell"><div class="summarylabel">العمر</div><div class="summaryvalue">'+fmt(state.age)+' سنة</div></div><div class="summarycell"><div class="summarylabel">إنجازات</div><div class="summaryvalue">'+fmt(state.accomplishments.length)+'</div></div><div class="summarycell"><div class="summarylabel">الأصول</div><div class="summaryvalue">'+fmt(state.assets.length)+'</div></div></div><div class="listitem" style="text-align:right"><div class="listtitle">محطات من حياتك</div><div class="muted" style="margin-top:8px;line-height:2">'+achievements+'</div></div><button class="primarybtn" id="newLifeBtn">🌱 حياة جديدة</button><button class="smallbtn" id="reviewBtn" style="width:100%;margin-top:9px">راجع دفتر حياتك</button></div></section></div>';
 $('newLifeBtn').addEventListener('click',()=>{closeModal();if(confirm('تبدأ حياة جديدة وتستبدل الحفظ الحالي؟'))startNew();});
 $('reviewBtn').addEventListener('click',closeModal);
}
function startNew(){
 state=newLife();dead=false;
 log('👶','أول يوم في الدنيا','اتولدت في '+state.place.city+'، '+state.place.country+'. أهلك '+state.family[0].name+' و'+state.family[1].name+' بيبدأوا معاك أول فصل في الحكاية.','special');
 log('🏡','البيت والعيلة','أبوك شغال '+state.family[0].personality+'، وأمك '+state.family[1].personality+'. العيلة هي أول شبكة أمان ليك.');
 achievement('بدأت رحلة الحياة');render();
}
function showCareer(){
 if(state.job){
  const opts=[
   choice('📈','طلب علاوة','أداءك الحالي '+state.performance+'%.',()=>{
    closeModal();
    if(state.performance<58){state.performance=clamp(state.performance+4);log('🗣️','مناقشة مع المدير','مديرك طلب منك تحسن الأداء شوية قبل زيادة المرتب.');info('🗣️','مش دلوقتي','حافظ على أداءك واطلب تاني بعد فترة.');return;}
    if(chance(.62)){const inc=Math.round(state.job.salary*.12);state.job.salary+=inc;state.performance=clamp(state.performance+5);log('🎉','علاوة في المرتب','وافق مديرك على علاوة سنوية '+cash(inc)+'.','good');info('🎉','مبروك العلاوة','مرتبك السنوي الجديد '+cash(state.job.salary)+'.');}else{state.performance=clamp(state.performance+2);log('🗣️','لسه بدري على العلاوة','مديرك طلب نتائج إضافية قبل الزيادة.');info('🗣️','المرة الجاية','استمر على نفس المستوى وجرب بعد فترة.');}render();
   }),
   choice('🧰','تطوير الأداء','تدريب يرفع فرص الترقية مقابل 1,200 جنيه.',()=>{closeModal();if(state.bank<1200){info('💳','الرصيد مش كفاية','التدريب يكلف 1,200 جنيه.');return;}state.bank-=1200;state.performance=clamp(state.performance+14);stat('smart',2);log('🧰','تدريب مهني','دفعت 1,200 جنيه في تدريب زوّد أداءك ومهاراتك.','good');render();}),
   choice('🚪','الاستقالة','تسيب شغلك وتفقد الدخل السنوي.',()=>{closeModal();info('🚪','تأكيد الاستقالة','متأكد إنك عايز تسيب '+state.job.title+'؟',[choice('✓','أيوه، أستقيل','',()=>{closeModal();state.job=null;state.performance=50;log('🚪','استقالة','سيبت شغلك وبدأت تدور على الخطوة التالية.');render();career();}),choice('↩️','أتراجع','',closeModal)]);})
  ];
  modal('💼','الدراسة والشغل','شغلك الحالي: '+state.job.title+' — الأداء '+state.performance+'%.',opts);return;
 }
 let intro='مفيش شغل حاليًا. الوظائف بتتغير حسب سنك وتعليمك ومستوى ذكاءك.';
 if(state.age<16){info('📚','لسه بدري على الشغل الرسمي','ركّز على التعليم والمهارات، وجرب المكتبة أو الأنشطة المناسبة لسنك.');return;}
 const eligible=jobs.filter(j=>state.age>=j.age&&state.stats.smart>=j.smart&&state.education.level>=j.edu);
 const opts=eligible.map(j=>choice(j.emoji,j.title,j.desc+' الراتب السنوي المتوقع '+cash(j.salary)+'.',()=>applyJob(j),cash(j.salary)+'/سنة'));
 const unmet=jobs.filter(j=>state.age>=j.age&&!eligible.includes(j));
 if(!opts.length)intro+=' محتاج ترفع الذكاء أو مستوى التعليم عشان تتأهل للوظائف المتاحة.';
 opts.push(choice('🎓','التعليم والجامعة','اختار تخصصًا يفتح فرصًا جديدة.',()=>{closeModal();university(false);}));
 modal('💼','الدراسة والشغل',intro,opts);
}
function applyJob(job){
 closeModal();
 if(state.age<job.age||state.stats.smart<job.smart||state.education.level<job.edu){info('🔒','لسه مش مؤهل','الوظيفة محتاجة سنًا أو تعليمًا أو مهارات أعلى.');return;}
 const success=.5+state.stats.smart/100*.22+state.performance/100*.15;
 if(chance(success)){state.job={id:job.id,title:job.title,salary:job.salary};state.performance=clamp(50+Math.floor(state.stats.smart/8));state.retired=false;log('💼','اتقبلت في وظيفة جديدة','بدأت شغل '+job.title+' براتب سنوي '+cash(job.salary)+'.','good');achievement('بدأت العمل: '+job.title);info('🎉','مبروك الوظيفة','اتقبلت في '+job.title+'. كل سنة هتستلم دخل على قد أداءك.');}
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
   state.bank-=m.cost;state.education.major=m.title;state.education.yearsLeft=m.years;state.education.tuition=m.cost;state.education.school='جامعة - '+m.title;state.stats.smart=clamp(state.stats.smart+3);log('🏛️','بدأت الجامعة','اتقبلت في '+m.title+'. دفعت رسوم السنة الأولى '+cash(m.cost)+'.','special');achievement('الالتحاق بالجامعة: '+m.title);render();info('🎓','أهلًا بالجامعة','هتتقدم في الدراسة مع مرور السنين. حاول تحافظ على صحتك ومستواك.');
 },cash(m.cost)+'/سنة'));
 opts.push(choice('📚','أستعد للدراسة','نشاط مجاني يزيد الذكاء.',()=>{closeModal();stat('smart',4);log('📚','استعداد للجامعة','قضيت وقتًا في التعلم قبل التقديم.');render();}));
 modal('🏛️','التخصصات الجامعية','اختار تخصصًا مناسبًا. رسوم السنة التالية تُخصم عند تقدم العمر، ولو الرصيد مش كافي الدراسة تتوقف.',opts);
}
function assets(){
 const opts=assetShop.map(a=>choice(a.emoji,a.title,a.desc+' التكلفة '+cash(a.value)+'. صيانة سنوية '+cash(a.upkeep)+'.',()=>buyAsset(a),cash(a.value)));
 if(state.assets.length)opts.push(choice('📦','إدارة أصولي','شوف ممتلكاتك وبع اللي مش محتاجه.',manageAssets));
 modal('🏠','الأصول والمشتريات','اشتري لما ميزانيتك تسمح. بيع أي أصل بيرجع لك 80% من سعره الأصلي، ولا تنسَ الصيانة السنوية.',opts);
}
function buyAsset(a){
 closeModal();if(state.age<18){info('🔒','الشراء مش متاح دلوقتي','تقدر تشتري أصولك بعد سن 18.');return;}
 if(state.bank<a.value){info('💳','الرصيد مش كفاية','معاك '+cash(state.bank)+'، وسعر الأصل '+cash(a.value)+'.');return;}
 state.bank-=a.value;state.assets.push({id:Date.now()+Math.random(),title:a.title,emoji:a.emoji,kind:a.kind,value:a.value,upkeep:a.upkeep,bought:state.age});stat('happiness',6);log(a.emoji,'اشتريت '+a.title,'دفعت '+cash(a.value)+'. خلي بالك من مصاريف الصيانة كل سنة.','good');achievement('امتلاك '+a.title);render();info('🎉','مبروك الأصل الجديد','الأصل اتضاف لممتلكاتك، وتقدر تبيعه لاحقًا مقابل 80% من قيمته الأصلية.');
}
function manageAssets(){
 const opts=state.assets.map((a,i)=>choice(a.emoji,a.title,'القيمة '+cash(a.value)+' · الصيانة '+cash(a.upkeep)+' سنويًا',()=>{closeModal();const sale=Math.round(a.value*.8);info('💰','بيع '+a.title,'هتبيع الأصل مقابل '+cash(sale)+'.',[choice('💵','أبيع الأصل','',()=>{closeModal();state.assets.splice(i,1);state.bank+=sale;log('💵','بيع أصل','بعت '+a.title+' مقابل '+cash(sale)+'.','good');render();}),choice('↩️','أحتفظ بيه','',closeModal)]);},cash(Math.round(a.value*.8))));
 if(!opts.length)opts.push(choice('📦','مفيش أصول لسه','ابدأ بالشراء لما ميزانيتك تسمح.',()=>{closeModal();assets();}));
 opts.push(choice('↩️','رجوع للأصول','',()=>{closeModal();assets();}));modal('📦','إدارة الممتلكات','كل أصل له قيمة ومصاريف تشغيل.',opts);
}
function person(gender,relation,emoji,age,level){return {id:relation+'-'+Math.random().toString(36).slice(2,8),name:pick(names[gender])+' '+pick(names.family),relation,emoji,age,relationshipLevel:level,personality:pick(['حنون','عملي','مرح','جاد','طموح','فضولي'])};}
function relations(){
 const opts=[];
 state.family.forEach(n=>opts.push(choice(n.emoji,n.name+' · '+n.relation,n.personality+' · مستوى العلاقة '+n.relationshipLevel+'%',()=>{closeModal();personModal(n);},n.relationshipLevel+'%')));
 state.friends.forEach(n=>opts.push(choice(n.emoji,n.name+' · صديق','مستوى العلاقة '+n.relationshipLevel+'%',()=>{closeModal();personModal(n);},n.relationshipLevel+'%')));
 if(state.partner)opts.push(choice(state.partner.emoji,state.partner.name+' · شريك الحياة','مستوى العلاقة '+state.partner.relationshipLevel+'%',()=>{closeModal();personModal(state.partner);},state.partner.relationshipLevel+'%'));
 opts.push(choice('🤝','تكوين صداقة جديدة','تتعرف على شخص جديد وتبدأ علاقة.',()=>{closeModal();addFriend();}));
 if(state.age>=18&&!state.partner)opts.push(choice('💞','التعرف على شريك','فرصة تعارف واحترام متبادل.',()=>{closeModal();meetPartner();}));
 modal('💞','العلاقات','العلاقات محتاجة وقت واهتمام. اختار شخصًا عشان تتفاعل معاه.',opts);
}
function personModal(n){
 modal(n.emoji,n.name+' · '+n.relation,'شخصيته '+n.personality+'، ومستوى العلاقة '+n.relationshipLevel+'%.',[
  choice('☕','قضاء وقت','خصص وقت للشخص ده.',()=>relationshipAction(n,'time')),
  choice('💬','محادثة','اسأل عن أخباره واسمعه كويس.',()=>relationshipAction(n,'talk')),
  choice('🎁','تقديم هدية','هدية صغيرة بتكلفة 500 جنيه.',()=>relationshipAction(n,'gift')),
  choice('😤','شجار','الخلاف ممكن يقلل مستوى العلاقة.',()=>relationshipAction(n,'argue'))
 ]);
}
function relationshipAction(n,act){
 closeModal();if(act==='gift'&&state.bank<500){info('💳','الرصيد مش كفاية','الهدية محتاجة 500 جنيه.');return;}
 let d=0,text='',tone='good';
 if(act==='time'){d=chance(.78)?7:3;stat('happiness',2);text='قضيت وقت مع '+n.name+' واتكلمتوا عن حاجات كتير.';}
 if(act==='talk'){d=chance(.72)?5:2;text='اتكلمت مع '+n.name+' وسمعت أخباره.';}
 if(act==='gift'){state.bank-=500;d=chance(.82)?10:4;text='قدمت هدية بسيطة لـ'+n.name+' بتكلفة 500 جنيه.';}
 if(act==='argue'){d=chance(.7)?-12:-5;stat('happiness',-3);text='دخلت في خلاف مع '+n.name+'. كان ممكن تختار الكلام بهدوء.';tone='bad';}
 n.relationshipLevel=clamp(n.relationshipLevel+d);if(n.relationshipLevel>=85)achievement('بناء علاقة قوية مع '+n.name);
 log(act==='argue'?'💢':'💞','تفاعل مع '+n.name,text,tone);render();info(act==='argue'?'💢':'💞','مستوى العلاقة: '+n.relationshipLevel+'%',d>=0?'العلاقة اتحسنت، والاستمرار في الاهتمام يفرق.':'العلاقة اتأثرت سلبًا. ممكن تحاول تصلح الموقف بعدين.',[choice('✓','تمام','',()=>{closeModal();relations();})]);
}
function addFriend(){
 const g=pick(['male','female']),f=person(g,'صديق',g==='male'?'🧑':'👩',Math.max(8,state.age+Math.floor(Math.random()*7)-3),45+Math.floor(Math.random()*38));
 state.friends.push(f);stat('happiness',3);log('🤝','صداقة جديدة','اتعرفت على '+f.name+'، وبداية الصداقة كانت لطيفة.','good');render();info('🤝','صديق جديد','بقي عندك حد جديد ممكن تقضي معاه وقت وتبني علاقة قوية.');
}
function meetPartner(){
 const g=state.gender==='male'?'female':'male',p=person(g,'شريك الحياة',g==='male'?'🧑':'👩',Math.max(18,state.age+Math.floor(Math.random()*5)-2),32+Math.floor(Math.random()*28));
 modal('💞','فرصة تعارف','قابلت '+p.name+'، وشخصيته '+p.personality+'. تحب تبدأوا تتعرفوا على بعض؟',[
  choice('💬','أبدأ التعارف','بهدوء واحترام ومن غير استعجال.',()=>{closeModal();state.partner=p;stat('happiness',5);log('💞','بداية علاقة','بدأت تتعرف على '+p.name+'. العلاقة هتتطور حسب اهتمامكم ببعض.','special');achievement('بدأت علاقة جديدة');render();}),
  choice('🌿','مش الوقت المناسب','قرارك محترم، الفرص مش سباق.',()=>{closeModal();log('🌿','قرار شخصي','قررت تركز على نفسك في المرحلة الحالية.');render();})
 ]);
}
function activities(){
 modal('✨','الأنشطة','اختار نشاط مناسب لسنك وميزانيتك. الأثر بيتراكم مع الوقت.',[
  choice('🩺','زيارة الطبيب','تكلفة 1,200 جنيه، تستعيد جزءًا من الصحة.',()=>activity('doctor'),'1,200 ج.م'),
  choice('🏋️','الجيم','تكلفة 300 جنيه، تحسن الصحة والمظهر.',()=>activity('gym'),'300 ج.م'),
  choice('📚','المكتبة','نشاط مجاني يزيد الذكاء.',()=>activity('library'),'مجانًا'),
  choice('🏖️','خروجة أو إجازة','تكلفة 1,800 جنيه لتحسين المزاج.',()=>activity('vacation'),'1,800 ج.م'),
  choice('🤝','مساعدة مجتمعية','مساهمة بسيطة في وقتك.',()=>activity('volunteer'),'مجانًا'),
  choice('⚖️','مخاطرة غير قانونية','مكسب محتمل مع خسارة أو تبعات قانونية.',()=>activity('crime')),
  choice('💾','تصدير الحفظ','نزّل ملف JSON تحتفظ بيه.',exportSave),
  choice('🌱','حياة جديدة','استبدل الشخصية الحالية بشخصية مختلفة.',()=>{closeModal();info('🌱','حياة جديدة','هتبدأ حياة جديدة وتستبدل الحفظ الحالي.',[choice('↻','ابدأ من جديد','',()=>{closeModal();if(confirm('تبدأ حياة جديدة وتستبدل الحفظ الحالي؟'))startNew();}),choice('رجوع','أحتفظ بالحياة الحالية','',closeModal)]);})
 ]);
}
function activity(type){
 closeModal();
 if(type==='doctor'){if(state.bank<1200){info('💳','الرصيد مش كفاية','زيارة الطبيب تكلف 1,200 جنيه.');return;}state.bank-=1200;stat('health',16);log('🩺','زيارة الطبيب','دفعت 1,200 جنيه واهتميت بصحتك. لو التعب مستمر، المتابعة الطبية المنتظمة أفضل.','good');}
 if(type==='gym'){if(state.age<12){info('🏃','نشاط مناسب للعمر','اللعب والحركة المناسبة لسنك كفاية في المرحلة دي.');return;}if(state.bank<300){info('💳','الرصيد مش كفاية','اشتراك الجيم يكلف 300 جنيه.');return;}state.bank-=300;stat('health',7);stat('looks',4);stat('happiness',2);log('🏋️','تمرنت في الجيم','دفعت 300 جنيه وتمرنت. الاستمرار أهم من تمرينة واحدة.','good');}
 if(type==='library'){stat('smart',5);stat('happiness',1);log('📚','وقت في المكتبة','قرأت وتعلمت حاجة جديدة من غير ما تدفع فلوس.','good');}
 if(type==='vacation'){if(state.bank<1800){info('💳','الرصيد مش كفاية','الخروجة تكلف 1,800 جنيه. جرب نشاط مجاني.');return;}state.bank-=1800;stat('happiness',8);stat('health',2);log('🏖️','خروجة لتغيير الجو','دفعت 1,800 جنيه وغيّرت روتينك شوية.','good');}
 if(type==='volunteer'){stat('happiness',5);log('🤝','مساعدة مجتمعية','خصصت وقتك لمساعدة ناس في محيطك.','good');achievement('شاركت في عمل مجتمعي');}
 if(type==='crime'){
  modal('⚖️','قرار فيه مخاطرة','التصرف غير القانوني ممكن يسبب ضرر للناس ويعرّضك لعواقب داخل اللعبة. تقدر تختار طريق قانوني بدلًا منه.',[
   choice('🚫','أتراجع','أدور على طريقة قانونية أكسب منها.',()=>{closeModal();stat('smart',1);log('⚖️','قرار مسؤول','تراجعت عن المخاطرة وقررت تدور على بديل أفضل.','good');render();}),
   choice('🎲','أخاطر','خسارة مالية أو تبعات قانونية محتملة.',()=>{closeModal();if(chance(.48)){const gain=3000+Math.floor(Math.random()*7000);state.bank+=gain;flash('+'+cash(gain));log('⚠️','مكسب قصير المدى','حققت '+cash(gain)+'، لكن المخاطرة كانت كبيرة.','bad');}else{const fine=Math.min(Math.max(0,state.bank),5000);state.bank-=fine;stat('happiness',-8);if(chance(.45)){state.job=null;log('🚔','عواقب قانونية','خسرت '+cash(fine)+' وتضررت سمعتك وفقدت عملك بسبب القضية.','bad');}else log('🚔','عواقب قانونية','خسرت '+cash(fine)+' وتعلمت إن المكسب السريع ممكن تكون تكلفته أكبر.','bad');}render();})
  ]);return;
 }
 render();closeModal();
}
function exportSave(){
 const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='hekayat-hayah-save.json';a.click();URL.revokeObjectURL(url);closeModal();flash('تم تجهيز ملف الحفظ');
}
document.querySelectorAll('[data-panel]').forEach(btn=>btn.addEventListener('click',()=>{
 document.querySelectorAll('.navbtn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');
 const p=btn.dataset.panel;if(p==='career')showCareer();if(p==='assets')assets();if(p==='relations')relations();if(p==='activities')activities();
}));
$('ageUpBtn').addEventListener('click',ageUp);
function init(){
 state=load();
 if(state){dead=state.status==='متوفى';render();if(dead)death(state.cause||'نهاية رحلة الحياة');}
 else{state=newLife();log('👶','أول يوم في الدنيا','اتولدت في '+state.place.city+'، '+state.place.country+'. أهلك '+state.family[0].name+' و'+state.family[1].name+' بيبدأوا معاك أول فصل في الحكاية.','special');log('🏡','البيت والعيلة','أبوك '+state.family[0].name+' شخص '+state.family[0].personality+'، وأمك '+state.family[1].name+' شخصيتها '+state.family[1].personality+'. دي أول شبكة أمان ليك.');achievement('بدأت رحلة الحياة');render();}
}
init();
})();