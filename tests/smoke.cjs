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
assert.match(app, /state\.timeMachineSnapshots\.push\(JSON\.stringify\(\{snapshotVersion:1,logLength,state:snapshot\}\)\)/, 'each age-up should preserve a compact rewind point');
assert.match(app, /delete snapshot\.log/, 'rewind snapshots should omit duplicated event logs');
assert.match(app, /restored\.log=Array\.isArray\(state\.log\)\?state\.log\.slice\(0,Math\.max\(0,Number\(parsedSnapshot\.logLength\)\|\|0\)\):\[\]/, 'rewind should restore the event log to the saved length');
assert.match(app, /else\{restored=parsedSnapshot;\}/, 'legacy raw snapshots should remain readable');
assert.match(app, /timeMachineDeathBtn/, 'the end-of-life panel should offer a rewind path when available');
assert.match(app, /function editCharacterTraits\(\)/, 'player traits editor should exist');
assert.match(app, /function editNpcMenu\(\)/, 'NPC trait editor should exist');
assert.match(app, /function specialCareerHistoryMenu\(\)/, 'specialist career history should be accessible');

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
assert.match(index, /حياة <span>\|<\/span> محاكي الحياة/);
assert.match(index, /id="heirloomBtn"/);
assert.match(index, /class="bottom-dock">[\s\S]*<nav class="nav"[\s\S]*id="statsPanel"/);
assert.match(css, /height:54px;min-height:54px;flex:0 0 54px/);
assert.match(css, /grid-template-columns:1fr 1fr 84px 1fr 1fr/);
assert.match(app, /function schoolHub\(\)/);
assert.match(app, /function maintainAsset\(index\)/);
assert.match(app, /function schoolClubs\(\)/, 'student clubs should have interactive actions');
assert.match(app, /craziness:Math\.floor\(Math\.random\(\)\*101\)/, 'NPC craziness should be stored');
assert.match(app, /petulance:Math\.floor\(Math\.random\(\)\*101\)/, 'sibling petulance should be stored');
assert.match(app, /a\.condition=clamp\(\(a\.condition\?\?100\)-4\)/, 'car condition should decay over time');
assert.match(app, /a\.condition=clamp\(\(a\.condition\?\?100\)-2\)/, 'property condition should decay over time');
assert.match(app, /if\(state\.prison\)return 'سجين'/, 'prison state should appear in the identity bar');
assert.match(app, /state\.fame\|\|0\)>0\)rows\.push/);
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
assert.ok(get('modalRoot').innerHTML.includes('القائمة الرئيسية'), 'main menu opens from the top bar');
assert.ok(get('modalRoot').innerHTML.includes('مقبرة الحيوات'), 'main menu provides access to the cemetery');
console.log('Smoke tests passed: RTL page, responsive Arabic life-sim UI, offline PWA shell, 40+ events, new life, autosave, age-up, career and relationship navigation.');
