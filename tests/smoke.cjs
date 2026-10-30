const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const index = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('style.css', 'utf8');
const app = fs.readFileSync('app.js', 'utf8');
assert.match(index, /lang="ar" dir="rtl"/);
assert.match(index, /href="style.css"/);
assert.match(index, /src="app.js"/);
assert.match(index, /rel="manifest" href="manifest\.webmanifest"/);
const pwaManifest = JSON.parse(fs.readFileSync('manifest.webmanifest', 'utf8'));
const serviceWorker = fs.readFileSync('sw.js', 'utf8');
assert.equal(pwaManifest.lang, 'ar');
assert.equal(pwaManifest.dir, 'rtl');
assert.equal(pwaManifest.display, 'standalone');
assert.match(app, /navigator\.serviceWorker\.register\('\.\/sw\.js'\)/);
assert.match(serviceWorker, /request\.mode === 'navigate'/);
assert.match(serviceWorker, /caches\.match\(APP_SHELL\[0\]\)/);
assert.match(index, /id="ageUpBtn"/);
assert.match(index, /id="lifeFeed"[^>]*aria-relevant="additions" aria-atomic="false"/);
assert.match(css, /max-width:500px/);
assert.match(app, /const dailyChallengeDefs=\[/, 'daily challenge catalog should be available');
assert.match(app, /function ensureDailyChallengeBoard\(\)/, 'daily challenges should rotate and persist by day');
assert.match(app, /function dailyChallengesMenu\(\)/, 'daily challenge menu should be available');
assert.match(app, /function claimDailyChallenge\(id\)/, 'daily challenge rewards should be claimable');
assert.match(app, /choice\('🎯','تحديات اليوم'/, 'daily challenges should be reachable from the main menu');
assert.match(app, /board\.claimed\.length===board\.ids\.length/, 'all daily challenge claims should trigger a completion bonus');
assert.match(app, /dailyChallenges:null/, 'older saves should migrate to the daily challenge state');
assert.match(app, /function timeMachineMenu\(\)/, 'the player should be able to review yearly rewind snapshots');
assert.match(app, /const parsed=JSON\.parse\(history\[index\]\),snap=parsed&&parsed\.snapshotVersion===1\?parsed\.state:parsed/, 'rewind menu should support both compact and legacy snapshots');
assert.match(app, /function rewindToSnapshot\(index\)/, 'time rewind should restore a selected prior state');
assert.match(app, /timeMachineSnapshots:\[\]/, 'new lives should initialize the time-machine history');
assert.match(app, /const checkpoint=\{snapshotVersion:1,logLength,state:snapshot\};if\(logSnapshot\)checkpoint\.logSnapshot=logSnapshot;\s*state\.timeMachineSnapshots\.push\(JSON\.stringify\(checkpoint\)\)/, 'each age-up should preserve a compact rewind point and an exact log checkpoint near the rolling-log cap');
assert.match(app, /const logSnapshot=logLength>=280&&Array\.isArray\(state\.log\)\?JSON\.parse\(JSON\.stringify\(state\.log\)\):null/, 'rewind should checkpoint the full log before later events can trim it');
assert.match(app, /delete snapshot\.log/, 'rewind snapshots should omit duplicated event logs');
assert.match(app, /restored\.log=Array\.isArray\(parsedSnapshot\.logSnapshot\)\?parsedSnapshot\.logSnapshot:\(Array\.isArray\(state\.log\)\?state\.log\.slice\(0,Math\.max\(0,Number\(parsedSnapshot\.logLength\)\|\|0\)\):\[\]\)/, 'rewind should prefer the exact saved log and retain fallback support for older snapshots');
assert.match(app, /else\{restored=parsedSnapshot;\}/, 'legacy raw snapshots should remain readable');
assert.match(app, /timeMachineDeathBtn/, 'the end-of-life panel should offer a rewind path when available');
assert.match(app, /function editCharacterTraits\(\)/, 'player traits editor should exist');
assert.match(app, /function editNpcMenu\(\)/, 'NPC trait editor should exist');
assert.match(app, /function specialCareerHistoryMenu\(\)/, 'specialist career history should be accessible');
assert.match(app, /\{id:'esports',title:'الرياضات الإلكترونية',emoji:'🎮',min:16/, 'the original esports career should be available from age 16');
assert.match(app, /function ensureGamingTalent\(\)/, 'gaming talent should be normalized after loading or rewinding older saves');
assert.match(app, /function createEsportsCareer\(\)/, 'esports profile should have a dedicated persisted state');
assert.match(app, /function ensureEsportsCareer\(\)/, 'esports profile should normalize older or incomplete data');
assert.match(app, /function esportsCareerMenu\(\)/, 'esports should have a dedicated career hub');
assert.match(app, /function enterEsportsTournament\(\)/, 'esports tournaments should resolve an outcome and prize');
assert.match(app, /function negotiateEsportsSponsorship\(\)/, 'esports career should support sponsorship contracts');
assert.match(app, /function upgradeEsportsSetup\(\)/, 'esports gear should affect tournament odds');
assert.match(app, /data\.talents\.gaming=clamp\(Number\(data\.talents\.gaming\),0,100\)/, 'legacy saves should receive a bounded gaming talent');

assert.match(app, /const combatMoveCatalog=\[/, 'combat moves should have an explicit style catalog');
assert.match(app, /const combatCoachCatalog=\[/, 'combat coach options should be catalog-driven');
assert.match(app, /const combatOpponentTypes=\[/, 'combat opponents should vary by fighting style');
assert.match(app, /function createCombatCareer\(\)/, 'new fighter careers should initialize a dedicated profile');
assert.match(app, /function ensureCombatCareer\(\)/, 'old fighter saves should migrate safely');
assert.match(app, /function combatCareerMenu\(\)/, 'fighter career hub should be available');
assert.match(app, /function combatTrainingMenu\(\)/, 'fighter attributes should have dedicated training');
assert.match(app, /function learnCombatMove\(\)/, 'players should unlock moves as they rank up');
assert.match(app, /function hireCombatCoach\(\)/, 'coaches should be recruitable');
assert.match(app, /function startCombatBout\(mode\)/, 'street and league fights should have separate entry rules');
assert.match(app, /function resolveCombatBout\(mode,opponent,moveId\)/, 'bouts should resolve using player stats and move matchups');
assert.match(app, /function recoverCombatInjury\(\)/, 'combat injuries should have a recovery system');
assert.match(app, /function combatBoutHistory\(\)/, 'recent fight results should be inspectable');
assert.match(app, /const filmGenreCatalog=\[/, 'director career should have a film genre catalog');
assert.match(app, /const filmBudgetCatalog=\[/, 'film production budgets should be configurable');
assert.match(app, /function filmStudioMenu\(\)/, 'director career should have a dedicated studio hub');
assert.match(app, /function filmGenreMenu\(\)/, 'director should choose a film genre');
assert.match(app, /function filmBudgetMenu\(genreId\)/, 'director should choose a production budget');
assert.match(app, /function filmCreativeMenu\(genreId,budgetId\)/, 'director should choose a creative direction');
assert.match(app, /function filmCastMenu\(genreId,budgetId,creativeId\)/, 'director should choose a cast package');
assert.match(app, /function filmMarketingMenu\(genreId,budgetId,creativeId,castId\)/, 'director should choose a marketing package');
assert.match(app, /function releaseFilm\(genreId,budgetId,creativeId,castId,marketingId\)/, 'film releases should resolve costs and outcomes');
assert.match(app, /function filmographyMenu\(\)/, 'director should be able to review a filmography');
assert.match(app, /loyalty:25\+Math\.floor\(Math\.random\(\)\*76\)/, 'new NPCs should have a loyalty trait');
assert.match(app, /jealousy:Math\.floor\(Math\.random\(\)\*101\)/, 'new NPCs should have a jealousy trait');
assert.match(app, /reliability:25\+Math\.floor\(Math\.random\(\)\*76\)/, 'new NPCs should have a reliability trait');
assert.match(app, /function relationshipHistory\(n\)/, 'each NPC should have a relationship interaction journal');
const relationshipActionBlock = app.match(/function relationshipAction\(n,act\)\{([\s\S]*?)\n\}\nfunction addFriend\(\)/);
assert.ok(relationshipActionBlock, 'relationship interaction handler should be present');
assert.ok(relationshipActionBlock[1].indexOf("if(act==='argue'&&jealousy>=78") < relationshipActionBlock[1].indexOf("n.interactions.push"), 'journal should record the final relationship outcome after jealousy effects');

assert.match(app, /n\.interactions\.push\(\{age:state\.age,action:act,delta:d,levelAfter:n\.relationshipLevel\}\)/, 'NPC interactions should record their relationship outcome');
assert.match(app, /reaction=clamp\(28\+generosity\*\.42\+\(100-money\)\*\.12-petulance\*\.20,8,92\)/, 'gift outcomes should depend on generosity, wealth and petulance');
assert.match(app, /const stability=clamp\(36\+loyalty\*\.22\+reliability\*\.20\+generosity\*\.12-petulance\*\.16-jealousy\*\.10/, 'yearly partner stability should depend on relationship traits');
assert.match(app, /state\.partner\.relationshipLevel<45&&chance\(\.12\)/, 'high jealousy should sometimes trigger a relationship misunderstanding');
assert.match(app, /function editNpcTraits\(n\)/);
assert.match(app, /function eligibleChildrenForCoParent\(ex\)/, 'custody plans should only attach eligible minor children to the appropriate parent');
assert.match(app, /function custodyChoiceMenu\(ex\)/, 'divorce should offer parenting arrangements for eligible minor children');
assert.match(app, /function breakUp\(\)[\s\S]*eligibleChildrenForCoParent\(ex\)\.length\)\{custodyChoiceMenu\(ex\);return;\}/, 'ending an unmarried relationship should also offer a parenting arrangement when shared minors exist');
assert.match(app, /function createCoParentingPlan\(ex,mode\)/, 'custody agreements should be stored with the life');
assert.match(app, /function coParentingMenu\(\)/, 'saved custody agreements should be manageable later');
assert.match(app, /function coParentingPlanDetails\(plan\)/, 'custody agreements should have an editable details screen');
assert.match(app, /function setCoParentingSupport\(plan\)/, 'annual child support should be adjustable');
assert.match(app, /function applyCoParentingAnnualEffects\(\)/, 'annual support and arrears should be processed');
assert.match(app, /if\(plan\.mode==='shared'\)return sum\+Math\.round\(base\*\.6\)/, 'shared custody should split child care costs');
assert.match(app, /if\(plan\.mode==='other'\)return sum\+Math\.round\(base\*\.2\)/, 'other-parent custody should reduce direct child-care costs');
assert.match(app, /const perChild=clamp\(plan\.supportPerChild\?\?2200,0,10000\),due=perChild\*minors\.length/, 'other-parent custody should create support obligations');
assert.match(app, /x\.coParentingPlans\.forEach\(p=>/, 'legacy custody plans should be normalized on load');
assert.match(app, /data\.coParentingPlans\.forEach\(p=>/, 'imported custody plans should be normalized');
assert.match(app, /choice\('👪','رعاية الأبناء بعد الانفصال'/, 'family menu should expose custody management');
assert.match(app, /child\.otherParentId=state\.partner\.id\|\|null/, 'newborns should remember the other parent');


assert.match(app, /state\.filmStudio=c\.id==='director'\?createFilmStudio\(\):null/, 'starting a directing career should initialize a studio');
assert.match(app, /filmProfile:state\.specialCareer\.id==='director'\?JSON\.parse\(JSON\.stringify\(state\.filmStudio\|\|null\)\):null/, 'leaving the directing career should archive studio results');
assert.match(app, /if\(state\.bank<totalCost\)/, 'production should verify the full combined budget before charging');
assert.match(app, /studio\.filmography\.push\(film\)/, 'released films should be retained in the filmography');
const filmGenreBlock = app.match(/const filmGenreCatalog=\[([\s\S]*?)\n\];/);
assert.ok(filmGenreBlock && (filmGenreBlock[1].match(/\{id:'/g) || []).length >= 7, 'the studio should offer at least seven original film genres');

assert.match(app, /restUsedYear:-1/, 'fighter state should track the yearly rest cooldown');
assert.match(app, /c\.restUsedYear===state\.yearCount/, 'free recovery should not be infinitely repeatable in the same year');
assert.match(app, /rating:mode==='league'\?34\+c\.rank\*8\+Math\.floor\(Math\.random\(\)\*13\):18\+Math\.floor\(Math\.random\(\)\*31\)/, 'street and league opponents should have separate difficulty ranges');
assert.match(app, /move\.style===opponent\.weakTo\?7/, 'combat odds should use the opponent weakness as a tactical matchup');
assert.match(app, /if\(state\.specialCareer\.id==='fighter'\)\{opts\.unshift\(choice\('🥊','إدارة مسيرة القتال'/, 'fighter careers should show a dedicated career hub');

assert.match(app, /state\.combatCareer=c\.id==='fighter'\?createCombatCareer\(\):null/, 'changing to the fighter career should initialize the dedicated profile');
assert.match(app, /c\.streetCred\+=12/, 'street wins should build street credibility');
assert.match(app, /Losing a street fight does not remove street credibility/, 'street losses should not remove credibility');
assert.match(app, /probability=clamp\(50\+\(playerScore-opponentScore\)\*1\.65\+counterBonus,12,88\)/, 'combat outcomes should use stats and counter bonuses with bounded odds');
assert.match(app, /if\(cc\.coach&&cc\.coach\.yearsLeft>0\)/, 'coach contracts should be accounted for over time');
assert.match(app, /combatProfile:state\.specialCareer\.id==='fighter'\?JSON\.parse\(JSON\.stringify\(state\.combatCareer\|\|null\)\):null/, 'switching career paths should archive the fighter profile');
const combatMoveBlock = app.match(/const combatMoveCatalog=\[([\s\S]*?)\n\];/);
assert.ok(combatMoveBlock && (combatMoveBlock[1].match(/\{id:'/g) || []).length >= 10, 'combat move catalog should contain at least 10 moves');
const coachBlock = app.match(/const combatCoachCatalog=\[([\s\S]*?)\n\];/);
assert.ok(coachBlock && (coachBlock[1].match(/\{id:'/g) || []).length >= 3, 'combat should offer three coach tiers');

assert.match(app, /c\.record\.attempts=\(c\.record\.attempts\|\|0\)\+1/, 'each career activity should be recorded');
assert.match(app, /c\.record\.totalEarnings=\(c\.record\.totalEarnings\|\|0\)\+\(success\?gain:0\)/, 'career earnings should accumulate');
assert.match(app, /specialCareerHistory\.unshift\(Object\.assign\(\{\},state\.specialCareer/, 'switching career paths should retain the previous career');
assert.match(app, /if\(state\.specialCareer\)state\.specialCareer\.level=newLevel/, 'an arrest outcome must not dereference a cleared active career');

assert.match(app, /choice\('🧬','محرر سمات الشخصية'/, 'character editor should be reachable from the profile menu');

assert.ok((app.match(/\{id:'[a-z-]+',title:'/g) || []).length >= 20, 'daily challenge catalog should have breadth');

assert.ok((app.match(/\nE\(\[/g) || []).length >= 25, 'at least 25 age-based events should exist');
assert.match(app, /events\.push\(/, 'expanded event library should be present');
assert.match(app, /function syncBusinessAsset\(\)/, 'business value should stay synchronized with the owned asset');
assert.match(app, /syncBusinessAsset\(\);renderHeader\(\)/, 'rendering should reconcile business and asset values');
assert.match(app, /النسخة الحالية بتدعم إدارة مشروع واحد/, 'buying a second business should be blocked until multi-business support exists');
for (const system of ['function familyMenu()', 'function petsMenu()', 'function hobbiesMenu()', 'function investingMenu()', 'function crimeMenu()', 'function cemeteryMenu()', 'function newLifeSetup()', 'function startAsChild(index)']) {
  assert.ok(app.includes(system), 'missing gameplay system: ' + system);
}
assert.match(index, /id="fameTag"/);
assert.match(index, /id="profileBtn"/);
assert.match(index, /class="brandlogo" aria-label="حياة"/);
assert.match(index, /class="brand-symbol"/);
assert.match(index, /id="identityFlag"/);
assert.match(index, /id="characterInfoBtn"/);
assert.match(index, /id="stageNavLabel"/);
assert.match(index, /id="heirloomBtn"/);
assert.match(index, /class="bottom-dock">[\s\S]*<nav class="nav"[\s\S]*id="statsPanel"/);
assert.match(css, /height:54px;min-height:54px;flex:0 0 54px/);
const finalUi = css.slice(css.lastIndexOf("/* Hayah's original life screen: compact identity"));
assert.ok(finalUi.length > 0, 'the original Hayah layout block should exist');
assert.match(finalUi, /--hayah-primary:#176b66/, 'the main screen should use Hayah teal as its primary color');
assert.match(finalUi, /--hayah-navy:#1d3b53/, 'the five-tab navigation should use Hayah navy');
assert.match(finalUi, /--hayah-accent:#e5b34b/, 'the main screen should retain the warm-gold accent');
assert.match(finalUi, /\.bottom-dock\s*\{[^}]*position:fixed[^}]*left:50%/s, 'the bottom dock should stay anchored to the device viewport');
assert.match(finalUi, /\.nav\s*\{[^}]*order:0/s, 'tabs should appear above the meters');
assert.match(finalUi, /\.stats\s*\{[^}]*order:1/s, 'status meters should appear beneath the tabs');
assert.match(finalUi, /\.statrow\s*\{[^}]*grid-template-columns:78px minmax\(0,1fr\)/s, 'status bars should use the full row width');
assert.match(finalUi, /\.fill\s*\{[^}]*position:absolute[^}]*right:0/s, 'status fills should render inside the track');
assert.match(finalUi, /\.statvalue\s*\{[^}]*position:absolute[^}]*z-index:1/s, 'status values should overlay the progress bars');
assert.match(finalUi, /\.nav\{direction:ltr\}/, 'tab positions should follow the original left-to-right order');
assert.match(finalUi, /\.fill\{left:0;right:auto\}/, 'progress fills should grow from the left edge like the reference');
assert.match(serviceWorker, /hayah-shell-v38/, 'the app shell cache should refresh the new styles');
assert.match(app, /function schoolHub\(\)/);
assert.match(app, /function maintainAsset\(index\)/);
assert.match(app, /function schoolClubs\(\)/, 'student clubs should have interactive actions');
assert.match(app, /craziness:Math\.floor\(Math\.random\(\)\*101\)/, 'NPC craziness should be stored');
assert.match(app, /petulance:Math\.floor\(Math\.random\(\)\*101\)/, 'sibling petulance should be stored');
assert.match(app, /a\.condition=clamp\(\(a\.condition\?\?100\)-4\)/, 'car condition should decay over time');
assert.match(app, /a\.condition=clamp\(\(a\.condition\?\?100\)-2\)/, 'property condition should decay over time');
assert.match(app, /if\(state\.prison\)return 'سجين'/, 'prison state should appear in the identity bar');
assert.ok(app.includes("const rows=[['happiness','😄','السعادة'],['health','❤️','الصحة'],['smart','🧠','الذكاء'],['looks','😎','المظهر']];"), 'the main screen should keep the four classic life stats');
assert.match(css, /--brand:\s*#[0-9a-fA-F]{6}/, 'brand color token should be defined');
assert.match(css, /--ink:\s*#[0-9a-fA-F]{6}/, 'text color token should be defined');
assert.match(css, /@media\s*\(max-width:\s*380px\)/, 'small-phone layout rules should exist');
assert.match(css, /min-height:58px/, 'decision choices should have mobile-friendly touch height');
assert.match(css, /\.agebtn/);

class FakeElement {
  constructor(id = '') {
    this.id = id;
    this.textContent = '';
    this.innerHTML = '';
    this.value = '';
    this.scrollTop = 0;
    this.scrollHeight = 100;
    this.childNodes = [{ nodeValue: '👶' }];
    this.dataset = {};
    this.listeners = {};
    this.children = [];
    this.classList = {
      add() {}, remove() {},
      toggle() {}
    };
  }
  addEventListener(type, cb) {
    (this.listeners[type] ||= []).push(cb);
  }
  dispatch(type, event = {}) {
    for (const cb of this.listeners[type] || []) cb({ target: this, ...event });
  }
  querySelectorAll() { return []; }
  appendChild(node) { this.children.push(node); }
  remove() {}
}
const elements = new Map();
const get = id => {
  if (!elements.has(id)) elements.set(id, new FakeElement(id));
  return elements.get(id);
};
const panels = ['career','assets','relations','activities'].map(panel => {
  const el = new FakeElement(panel + 'Nav'); el.dataset.panel = panel; return el;
});
const store = new Map();
const context = {
  document: {
    getElementById: get,
    querySelectorAll(selector) {
      if (selector === '[data-panel]' || selector === '.navbtn') return panels;
      return [];
    },
    createElement(tag) { return new FakeElement(tag); }
  },
  localStorage: {
    getItem(key) { return store.has(key) ? store.get(key) : null; },
    setItem(key, value) { store.set(key, String(value)); }
  },
  requestAnimationFrame(cb) { cb(); },
  confirm() { return true; },
  alert() {},
  console
};
vm.runInNewContext(app, context, { timeout: 3000 });
assert.match(get('lifeFeed').innerHTML, /أول يوم في الدنيا/);
assert.match(get('modalRoot').innerHTML, /تخصيص البداية/, 'first session should offer life setup options');
let saved = JSON.parse(store.get('hekayat_hayah_save_v1'));
assert.equal(saved.age, 0);
assert.equal(saved.status, 'حي');
assert.ok(saved.family.length >= 3);
get('ageUpBtn').dispatch('click');
saved = JSON.parse(store.get('hekayat_hayah_save_v1'));
assert.equal(saved.age, 1, 'age button increments the character age');
assert.ok(saved.log.length >= 2, 'life log persists after an action');
panels.find(p => p.dataset.panel === 'career').dispatch('click');
assert.ok(get('modalRoot').innerHTML.includes('لسه بدري'), 'career navigation blocks school hub for a toddler');
panels.find(p => p.dataset.panel === 'relations').dispatch('click');
assert.ok(get('modalRoot').innerHTML.includes('العلاقات'), 'relationships navigation opens its panel');
get('menuBtn').dispatch('click');
assert.ok(get('modalRoot').innerHTML.includes('إعدادات العرض'), 'display settings should be reachable from the main menu');
assert.ok(get('modalRoot').innerHTML.includes('القائمة الرئيسية'), 'main menu opens from the top bar');
assert.ok(get('modalRoot').innerHTML.includes('مقبرة الحيوات'), 'main menu provides access to the cemetery');

// Exercise backup recovery in a fresh app context, not just source-text assertions.
const backupKey = 'hekayat_hayah_save_backup_v1';
assert.ok(store.has(backupKey), 'age-up should create a last-known-good backup');
const recoveryStore = new Map(store);
recoveryStore.set('hekayat_hayah_save_v1', JSON.stringify({ version: 1, name: '', age: 'not-a-number', stats: {}, log: [] }));
const recoveryElements = new Map();
const recoveryGet = id => {
  if (!recoveryElements.has(id)) recoveryElements.set(id, new FakeElement(id));
  return recoveryElements.get(id);
};
const recoveryPanels = ['career','assets','relations','activities'].map(panel => {
  const el = new FakeElement(panel + 'RecoveryNav'); el.dataset.panel = panel; return el;
});
const recoveryContext = {
  document: {
    getElementById: recoveryGet,
    querySelectorAll(selector) {
      if (selector === '[data-panel]' || selector === '.navbtn') return recoveryPanels;
      return [];
    },
    createElement(tag) { return new FakeElement(tag); }
  },
  localStorage: {
    getItem(key) { return recoveryStore.has(key) ? recoveryStore.get(key) : null; },
    setItem(key, value) { recoveryStore.set(key, String(value)); }
  },
  requestAnimationFrame(cb) { cb(); },
  confirm() { return true; },
  alert() {},
  console
};
vm.runInNewContext(app, recoveryContext, { timeout: 3000 });
const recovered = JSON.parse(recoveryStore.get('hekayat_hayah_save_v1'));
const expectedBackup = JSON.parse(store.get(backupKey));
assert.equal(recovered.lifeId, expectedBackup.lifeId, 'a parseable but structurally invalid primary save should recover the previous life');
assert.equal(recovered.age, expectedBackup.age, 'recovery should restore the checkpoint age');
assert.match(recoveryGet('saveStatus').textContent, /نسخة مستردة/, 'the interface should disclose that recovery occurred');

/* Regression: an unpaid university year must not be treated as a completed degree. */
const tuitionStore = new Map(store);
const tuitionSave = JSON.parse(tuitionStore.get('hekayat_hayah_save_v1'));
tuitionSave.age = 18;
tuitionSave.yearCount = 18;
tuitionSave.bank = 0;
tuitionSave.status = 'حي';
tuitionSave.cause = null;
tuitionSave.retired = false;
tuitionSave.job = null;
delete tuitionSave.talents;
delete tuitionSave.esportsCareer;
tuitionSave.education = {
  level: 2,
  school: 'طالب جامعي',
  major: 'علوم الحاسب',
  yearsLeft: 1,
  tuition: 26000,
  prepaidYear: false,
  clubs: []
};
tuitionStore.set('hekayat_hayah_save_v1', JSON.stringify(tuitionSave));
const tuitionElements = new Map();
const tuitionGet = id => {
  if (!tuitionElements.has(id)) tuitionElements.set(id, new FakeElement(id));
  return tuitionElements.get(id);
};
const tuitionPanels = ['career','assets','relations','activities'].map(panel => {
  const el = new FakeElement(panel + 'TuitionNav'); el.dataset.panel = panel; return el;
});
const tuitionContext = {
  document: {
    getElementById: tuitionGet,
    querySelectorAll(selector) {
      if (selector === '[data-panel]' || selector === '.navbtn') return tuitionPanels;
      return [];
    },
    createElement(tag) { return new FakeElement(tag); }
  },
  localStorage: {
    getItem(key) { return tuitionStore.has(key) ? tuitionStore.get(key) : null; },
    setItem(key, value) { tuitionStore.set(key, String(value)); }
  },
  requestAnimationFrame(cb) { cb(); },
  setTimeout(cb) { cb(); },
  confirm() { return true; },
  alert() {},
  console
};
vm.runInNewContext(app, tuitionContext, { timeout: 3000 });
tuitionGet('ageUpBtn').dispatch('click');
const afterUnpaidYear = JSON.parse(tuitionStore.get('hekayat_hayah_save_v1'));
assert.equal(afterUnpaidYear.education.yearsLeft, 1, 'unpaid tuition must leave the current study year outstanding');
assert.equal(afterUnpaidYear.education.level, 2, 'an unpaid year must not award the degree level');
assert.equal(afterUnpaidYear.education.school, 'طالب جامعي', 'an unpaid year must not mark the character as graduated');
assert.ok(!afterUnpaidYear.log.some(entry => entry.title === 'اتخرجت من الجامعة'), 'no graduation event should be recorded for an unpaid year');
assert.equal(afterUnpaidYear.talents.gaming, 35, 'legacy saves without talent data should receive a stable default gaming talent');
assert.equal(afterUnpaidYear.esportsCareer, null, 'legacy saves should initialize the new specialist profile without changing the save version');

/* Behavioral regression: an esports tournament records one result and persists its profile. */
const esportsStore = new Map(store);
const esportsSave = JSON.parse(esportsStore.get('hekayat_hayah_save_v1'));
esportsSave.age = 20;
esportsSave.yearCount = 20;
esportsSave.bank = 50000;
esportsSave.status = 'حي';
esportsSave.specialCareer = { id: 'esports', title: 'الرياضات الإلكترونية', income: 8500, level: 5, startedAge: 16, record: { attempts: 0, wins: 0, losses: 0, projects: 0, totalEarnings: 0, bestLevel: 5 }, history: [] };
esportsSave.esportsCareer = { rank: 1, tournaments: 0, wins: 0, losses: 0, sponsor: null, sponsorYears: 0, sponsorAnnualIncome: 0, equipment: 1, history: [] };
esportsSave.talents = { gaming: 95 };
esportsSave.hobbies = [{ id: 'gaming', title: 'الألعاب', level: 5 }];
esportsStore.set('hekayat_hayah_save_v1', JSON.stringify(esportsSave));
const esportsElements = new Map();
const esportsGet = id => { if (!esportsElements.has(id)) esportsElements.set(id, new FakeElement(id)); return esportsElements.get(id); };
const esportsPanels = ['career','assets','relations','activities'].map(panel => { const el = new FakeElement(panel + 'EsportsNav'); el.dataset.panel = panel; return el; });
const esportsContext = {
  document: {
    getElementById: esportsGet,
    querySelectorAll(selector) { if (selector === '[data-panel]' || selector === '.navbtn') return esportsPanels; return []; },
    createElement(tag) { return new FakeElement(tag); }
  },
  localStorage: {
    getItem(key) { return esportsStore.has(key) ? esportsStore.get(key) : null; },
    setItem(key, value) { esportsStore.set(key, String(value)); }
  },
  requestAnimationFrame(cb) { cb(); },
  setTimeout(cb) { cb(); },
  confirm() { return true; },
  alert() {},
  console
};
const esportsTestApp = app.replace("function enterEsportsTournament(){", "globalThis.__testEnterEsportsTournament=function(){").replace("\nfunction negotiateEsportsSponsorship(){", ";\nfunction negotiateEsportsSponsorship(){");
assert.notEqual(esportsTestApp, app, 'test harness should expose the tournament action only inside its isolated VM');
vm.runInNewContext(esportsTestApp, esportsContext, { timeout: 3000 });
vm.runInNewContext('globalThis.__testEnterEsportsTournament()', esportsContext, { timeout: 3000 });
const afterEsports = JSON.parse(esportsStore.get('hekayat_hayah_save_v1'));
assert.equal(afterEsports.esportsCareer.tournaments, 1, 'entering a tournament should increment the tournament count');
assert.equal(afterEsports.esportsCareer.history.length, 1, 'each tournament should be saved in the specialist history');
assert.equal(afterEsports.specialCareer.record.attempts, 1, 'a tournament should count as a specialist career activity');
assert.equal(afterEsports.specialCareer.record.wins + afterEsports.specialCareer.record.losses, 1, 'a tournament should record exactly one outcome');
assert.equal(afterEsports.talents.gaming, 95, 'the gaming talent should persist through a tournament');


/* Behavioral regression: inheritance shares must apply consistently to cash, assets, and investments after liabilities. */
const inheritanceStore = new Map(store);
const inheritanceSave = JSON.parse(inheritanceStore.get('hekayat_hayah_save_v1'));
inheritanceSave.age = 65;
inheritanceSave.yearCount = 65;
inheritanceSave.status = 'حي';
inheritanceSave.bank = 100000;
inheritanceSave.debt = 20000;
inheritanceSave.willDistribution = 'التبرع بجزء';
inheritanceSave.assets = [{ id: 'estate-house', title: 'بيت عائلي', emoji: '🏠', kind: 'property', value: 200000, upkeep: 10000, condition: 100, rented: true }];
inheritanceSave.investments = [{ id: 'estate-fund', title: 'محفظة استثمارية', value: 50000 }];
inheritanceSave.children = [{ id: 'heir-test', name: 'ليلى اختبار', gender: 'female', age: 22, health: 80, happiness: 70, smart: 75, looks: 60, schoolPerformance: 80, careerPotential: 70, independence: 75, relationshipLevel: 90 }];
inheritanceStore.set('hekayat_hayah_save_v1', JSON.stringify(inheritanceSave));
const inheritanceElements = new Map();
const inheritanceGet = id => { if (!inheritanceElements.has(id)) inheritanceElements.set(id, new FakeElement(id)); return inheritanceElements.get(id); };
const inheritancePanels = ['career','assets','relations','activities'].map(panel => { const el = new FakeElement(panel + 'InheritanceNav'); el.dataset.panel = panel; return el; });
const inheritanceContext = {
  document: {
    getElementById: inheritanceGet,
    querySelectorAll(selector) { if (selector === '[data-panel]' || selector === '.navbtn') return inheritancePanels; return []; },
    createElement(tag) { return new FakeElement(tag); }
  },
  localStorage: {
    getItem(key) { return inheritanceStore.has(key) ? inheritanceStore.get(key) : null; },
    setItem(key, value) { inheritanceStore.set(key, String(value)); }
  },
  requestAnimationFrame(cb) { cb(); },
  setTimeout(cb) { cb(); },
  confirm() { return true; },
  alert() {},
  console
};
const inheritanceTestApp = app.replace("function startAsChild(index){", "globalThis.__testStartAsChild=function(index){").replace("\nfunction applyUiSettings(){", ";\nfunction applyUiSettings(){");
assert.notEqual(inheritanceTestApp, app, 'test harness should expose heir succession only inside its isolated VM');
vm.runInNewContext(inheritanceTestApp, inheritanceContext, { timeout: 3000 });
vm.runInNewContext('globalThis.__testStartAsChild(0)', inheritanceContext, { timeout: 3000 });
const inherited = JSON.parse(inheritanceStore.get('hekayat_hayah_save_v1'));
assert.equal(inherited.version, 1, 'inheritance must keep the legacy save version');
assert.equal(inherited.bank, 61286, 'will share and estate debt should both affect inherited cash');
assert.equal(inherited.assets[0].value, 122571, 'assets should receive the same net inheritance share');
assert.equal(inherited.assets[0].upkeep, 6129, 'inherited asset upkeep should scale with the inherited share');
assert.equal(inherited.investments[0].value, 30643, 'investments should receive the same net inheritance share');
assert.equal(inherited.legacy.inheritance, 214500, 'the recorded inheritance should match the transferred net estate');
assert.equal(inherited.bank + inherited.assets.reduce((sum, item) => sum + item.value, 0) + inherited.investments.reduce((sum, item) => sum + item.value, 0), inherited.legacy.inheritance, 'transferred components should reconcile to the recorded inheritance');


/* Behavioral regression: keep the export object URL alive until the browser has had time to start the download. */
const exportStore = new Map(store);
const exportElements = new Map();
const exportGet = id => {
  if (!exportElements.has(id)) exportElements.set(id, new FakeElement(id));
  return exportElements.get(id);
};
let exportClicked = false;
let exportBlob = null;
let revokedExportUrl = null;
const exportTimers = [];
const exportBody = new FakeElement('body');
const exportPanels = ['career','assets','relations','activities'].map(panel => {
  const el = new FakeElement(panel + 'ExportNav'); el.dataset.panel = panel; return el;
});
const exportContext = {
  document: {
    body: exportBody,
    getElementById: exportGet,
    querySelectorAll(selector) { if (selector === '[data-panel]' || selector === '.navbtn') return exportPanels; return []; },
    createElement(tag) {
      const el = new FakeElement(tag);
      if (tag === 'a') { el.style = {}; el.click = () => { exportClicked = true; }; }
      return el;
    }
  },
  localStorage: {
    getItem(key) { return exportStore.has(key) ? exportStore.get(key) : null; },
    setItem(key, value) { exportStore.set(key, String(value)); }
  },
  Blob: class TestBlob { constructor(parts, options) { this.parts = parts; this.type = options.type; exportBlob = this; } },
  URL: {
    createObjectURL() { return 'blob:hayah-export-test'; },
    revokeObjectURL(url) { revokedExportUrl = url; }
  },
  setTimeout(callback, delay) { exportTimers.push({ callback, delay }); return exportTimers.length; },
  requestAnimationFrame(cb) { cb(); },
  confirm() { return true; },
  alert() {},
  console
};
const exportTestApp = app.replace("function exportSave(){", "globalThis.__testExportSave=function(){").replace("\ndocument.querySelectorAll('[data-panel]')", ";\ndocument.querySelectorAll('[data-panel]')");
assert.notEqual(exportTestApp, app, 'test harness should expose export only inside its isolated VM');
vm.runInNewContext(exportTestApp, exportContext, { timeout: 3000 });
vm.runInNewContext('globalThis.__testExportSave()', exportContext, { timeout: 3000 });
assert.equal(exportClicked, true, 'export should trigger a download anchor');
assert.equal(exportBlob.type, 'application/json', 'export should create a JSON file');
assert.match(exportBlob.parts[0], /"version":\s*1/, 'export should serialize the current life state');
assert.equal(revokedExportUrl, null, 'export URL must not be revoked immediately after the click');
const exportCleanup = exportTimers.find(timer => timer.delay === 1000);
assert.ok(exportCleanup, 'export should schedule delayed cleanup');
exportCleanup.callback();
assert.equal(revokedExportUrl, 'blob:hayah-export-test', 'export URL should be revoked after the browser has time to start the download');


assert.match(app, /function currentManagedBusiness\(\)/);
assert.match(app, /function simulateBusinessEntityYear\(business,kind\)/);
assert.match(app, /simulateBusinessEntityYear\(company,'portfolio'\)/);
assert.match(app, /choice\('🧰','إدارة التشغيل'/);
assert.match(app, /section\('الشركات المملوكة'\)/);
assert.match(app, /companyDetailMenu\(i\)/);
assert.match(app, /function businessFacilitiesMenu\(\)/);
assert.match(app, /function buyBusinessFacility\(type\)/);
assert.match(app, /facilityCapacityBonus/);
console.log('Smoke tests passed: RTL/PWA shell, autosave recovery, legacy migration, annual company portfolio operations, facility expansion, and persisted life systems.');

assert.ok(app.includes("function playUiFeedback(kind='tap')"), 'optional sound and haptic feedback should be available');
assert.ok(app.includes('uiSettings.sound'));
assert.ok(app.includes('uiSettings.haptics'));
assert.match(serviceWorker, /hayah-shell-v38/);

assert.match(app, /function businessTreasuryMenu\(\)/);
assert.match(app, /function transferBusinessCapital\(direction,amount\)/);
assert.match(app, /treasuryMode:'separate',cashBalance:0/);
assert.match(app, /entity\.treasuryMode='shared'/);

assert.match(app, /function businessTaxLiability\(business\)/);
assert.match(app, /function repayBusinessTax\(amount\)/);
assert.match(app, /corporateTaxRate/);
assert.match(app, /corporateTaxPaidFromCash/);
assert.match(app, /business\.pendingTaxPayments=0/);

assert.ok(app.includes("function businessRivalHash(value)"));
assert.ok(app.includes("function createBusinessRivals(business,industry,year,count,baselinePrice)"));
assert.ok(app.includes("function advanceBusinessRivals(raw,business,industry,year,profile,demandIndex)"));
assert.ok(app.includes("function summarizeBusinessRivals(rivals,baselineCompetition,profile)"));
assert.match(app, /marketRivalPlans/);
assert.match(app, /الشركات المنافسة داخل المحاكاة/);
assert.match(serviceWorker, /hayah-shell-v38/);

assert.match(app, /function normalizeSocialFeed\(raw\)/, 'social audience feedback should be normalized for legacy saves');
assert.match(app, /function socialAudienceFeedMenu\(platformId\)/, 'players should be able to review audience feedback');
assert.match(app, /function offerSoundCloudTrackToLabel\(platformId='soundcloud'\)/, 'SoundCloud tracks should have a label-offer path');
assert.match(app, /const KEY = 'hekayat_hayah_save_v1';/);
assert.match(serviceWorker, /hayah-shell-v38/);
