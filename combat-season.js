(function installHayahCombatSeasons(global) {
  'use strict';

  const HISTORY_LIMIT = 12;
  const MAX_FIGHTERS = 20;

  function boundedNumber(value, fallback, min, max) {
    const number = Number(value);
    return Math.max(min, Math.min(max, Number.isFinite(number) ? number : fallback));
  }

  function boundedInteger(value, fallback, min, max) {
    return Math.trunc(boundedNumber(value, fallback, min, max));
  }

  function safeId(value) {
    return String(value == null ? '' : value).trim().slice(0, 80);
  }

  function safeName(value, fallback) {
    const name = String(value == null ? '' : value).replace(/[\u0000-\u001f]/g, '').trim();
    return (name || fallback).slice(0, 60);
  }

  function normalizeStanding(item, index) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
    const id = safeId(item.id);
    if (!id) return null;
    return {
      position: boundedInteger(item.position, index + 1, 1, MAX_FIGHTERS),
      id,
      name: safeName(item.name, 'منافس'),
      points: boundedInteger(item.points, 0, 0, 1000000),
      played: boundedInteger(item.played, 0, 0, MAX_FIGHTERS),
      wins: boundedInteger(item.wins, 0, 0, MAX_FIGHTERS),
      draws: boundedInteger(item.draws, 0, 0, MAX_FIGHTERS),
      losses: boundedInteger(item.losses, 0, 0, MAX_FIGHTERS),
      rating: boundedInteger(item.rating, 20, 20, 95)
    };
  }

  function normalizeCommunityLeague(value) {
    const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    const standings = Array.isArray(source.standings)
      ? source.standings.slice(0, MAX_FIGHTERS).map(normalizeStanding).filter(Boolean)
      : [];
    const history = Array.isArray(source.history)
      ? source.history.slice(-HISTORY_LIMIT).map(item => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
        const topThree = Array.isArray(item.topThree)
          ? item.topThree.slice(0, 3).map((entry, index) => normalizeStanding(entry, index)).filter(Boolean)
          : [];
        return {
          season: boundedInteger(item.season, 0, 0, 1000000),
          age: boundedInteger(item.age, 0, 0, 150),
          matches: boundedInteger(item.matches, 0, 0, 190),
          leaderId: safeId(item.leaderId),
          leaderName: safeName(item.leaderName, 'لم يُحسم'),
          leaderPoints: boundedInteger(item.leaderPoints, 0, 0, 1000000),
          topThree
        };
      }).filter(Boolean)
      : [];

    return {
      season: boundedInteger(source.season, 0, 0, 1000000),
      lastSimulatedAge: boundedInteger(source.lastSimulatedAge, -1, -1, 150),
      matchesLastSeason: boundedInteger(source.matchesLastSeason, 0, 0, 190),
      standings,
      history
    };
  }

  function gameState() {
    try {
      if (typeof state !== 'undefined' && state && typeof state === 'object') return state;
    } catch (error) {
      // The app may not have initialized its life state yet.
    }
    return global.state && typeof global.state === 'object' ? global.state : null;
  }

  function currentAge() {
    const current = gameState();
    if (!current) return -1;
    const age = Number(current.age);
    if (!Number.isFinite(age)) return -1;
    return boundedInteger(age, -1, 0, 150);
  }

  function getEnsureCombatCareer() {
    if (typeof global.ensureCombatCareer === 'function') return global.ensureCombatCareer;
    if (typeof ensureCombatCareer === 'function') return ensureCombatCareer;
    return null;
  }

  function hasModalHelper() {
    if (typeof global.modal === 'function') return true;
    return typeof modal === 'function';
  }

  function hasChoiceHelper() {
    if (typeof global.choice === 'function') return true;
    return typeof choice === 'function';
  }

  function makeChoice(icon, title, description, action) {
    if (typeof global.choice === 'function') return global.choice(icon, title, description, action);
    if (typeof choice === 'function') return choice(icon, title, description, action);
    return { icon, title, description, action };
  }

  function showModal(icon, title, body, options) {
    if (typeof global.modal === 'function') return global.modal(icon, title, body, options);
    if (typeof modal === 'function') return modal(icon, title, body, options);
    return undefined;
  }

  function showInfo(icon, title, body) {
    if (typeof global.info === 'function') return global.info(icon, title, body);
    if (typeof info === 'function') return info(icon, title, body);
    return showModal(icon, title, body, []);
  }

  function returnToCommunityMenu() {
    if (typeof global.combatCommunityMenu === 'function') return global.combatCommunityMenu();
    if (typeof combatCommunityMenu === 'function') return combatCommunityMenu();
    return undefined;
  }

  function stableHash(value) {
    const text = String(value);
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619) >>> 0;
    }
    return hash >>> 0;
  }

  function fighterPower(fighter) {
    const rating = boundedNumber(fighter.rating, 20, 20, 95);
    const momentum = boundedNumber(fighter.momentum, 0, -5, 5);
    const respect = boundedNumber(fighter.respect, 50, 0, 100);
    const tension = boundedNumber(fighter.tension, 0, 0, 100);
    return rating + momentum * 1.5 + (respect - tension) * 0.04;
  }

  function applySeasonForm(fighter, momentumDelta, respectDelta) {
    fighter.momentum = boundedInteger(
      boundedNumber(fighter.momentum, 0, -5, 5) + momentumDelta,
      0,
      -5,
      5
    );
    fighter.respect = boundedInteger(
      boundedNumber(fighter.respect, 50, 0, 100) + respectDelta,
      50,
      0,
      100
    );
  }

  function simulateCommunitySeason(career) {
    if (!career || typeof career !== 'object' || Array.isArray(career)) return null;
    const age = currentAge();
    if (age < 0) return null;

    const league = normalizeCommunityLeague(career.communityLeague);
    career.communityLeague = league;
    if (league.lastSimulatedAge === age) return null;

    const seen = new Set();
    const fighters = (Array.isArray(career.community) ? career.community : [])
      .filter(fighter => fighter && typeof fighter === 'object' && !Array.isArray(fighter))
      .filter(fighter => fighter.retired !== true && fighter.deceased !== true)
      .map(fighter => ({ fighter, id: safeId(fighter.id) }))
      .filter(entry => {
        if (!entry.id || seen.has(entry.id)) return false;
        seen.add(entry.id);
        return true;
      })
      .sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
      .slice(0, MAX_FIGHTERS);

    if (fighters.length < 2) return null;

    const season = league.season + 1;
    const table = new Map();
    fighters.forEach(entry => {
      table.set(entry.id, {
        position: 0,
        id: entry.id,
        name: safeName(entry.fighter.name, 'منافس'),
        points: 0,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        rating: boundedInteger(entry.fighter.rating, 20, 20, 95)
      });
    });

    let matches = 0;
    for (let left = 0; left < fighters.length; left += 1) {
      for (let right = left + 1; right < fighters.length; right += 1) {
        const a = fighters[left];
        const b = fighters[right];
        const rowA = table.get(a.id);
        const rowB = table.get(b.id);
        const seed = season + '|' + a.id + '|' + b.id;
        const isDraw = stableHash('draw|' + seed) % 19 === 0;
        rowA.played += 1;
        rowB.played += 1;
        matches += 1;

        if (isDraw) {
          rowA.draws += 1;
          rowB.draws += 1;
          rowA.points += 1;
          rowB.points += 1;
          continue;
        }

        const chanceA = boundedNumber(
          50 + (fighterPower(a.fighter) - fighterPower(b.fighter)) * 2.2,
          50,
          10,
          90
        );
        const roll = stableHash('winner|' + seed) % 100;
        const aWon = roll < chanceA;
        const winner = aWon ? a : b;
        const loser = aWon ? b : a;
        const winnerRow = aWon ? rowA : rowB;
        const loserRow = aWon ? rowB : rowA;

        winnerRow.wins += 1;
        winnerRow.points += 3;
        loserRow.losses += 1;
        applySeasonForm(winner.fighter, 1, 1);
        applySeasonForm(loser.fighter, -1, -1);
      }
    }

    const standings = Array.from(table.values()).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.rating !== a.rating) return b.rating - a.rating;
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    }).map((row, index) => Object.assign({}, row, { position: index + 1 }));

    const leader = standings[0];
    const topThree = standings.slice(0, 3).map(row => Object.assign({}, row));
    const historyEntry = {
      season,
      age,
      matches,
      leaderId: leader.id,
      leaderName: leader.name,
      leaderPoints: leader.points,
      topThree
    };

    league.season = season;
    league.lastSimulatedAge = age;
    league.matchesLastSeason = matches;
    league.standings = standings;
    league.history.push(historyEntry);
    league.history = league.history.slice(-HISTORY_LIMIT);
    career.communityLeague = league;

    return {
      season,
      age,
      matches,
      standings: standings.map(row => Object.assign({}, row)),
      leader: Object.assign({}, leader)
    };
  }

  function createFallbackChoice(doc, iconText, titleText, descriptionText, action) {
    const button = doc.createElement('button');
    button.type = 'button';
    button.className = 'choice';
    const icon = doc.createElement('span');
    icon.className = 'choiceico';
    icon.textContent = iconText;
    const copy = doc.createElement('span');
    copy.className = 'ctext';
    const title = doc.createElement('span');
    title.className = 'ctitle';
    title.textContent = titleText;
    const description = doc.createElement('span');
    description.className = 'cdesc';
    description.textContent = descriptionText;
    copy.appendChild(title);
    copy.appendChild(description);
    button.appendChild(icon);
    button.appendChild(copy);
    button.addEventListener('click', action);
    return button;
  }

  function renderFallbackSeasonModal(summary) {
    const doc = global.document;
    const root = doc && typeof doc.getElementById === 'function' ? doc.getElementById('modalRoot') : null;
    if (!root || typeof doc.createElement !== 'function') return;

    const previousMarkup = root.innerHTML;
    root.innerHTML = '';
    const overlay = doc.createElement('div');
    overlay.className = 'overlay';
    const panel = doc.createElement('section');
    panel.className = 'modal';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');

    const header = doc.createElement('div');
    header.className = 'modalhead';
    const icon = doc.createElement('div');
    icon.className = 'modalicon';
    icon.textContent = '🏆';
    const heading = doc.createElement('div');
    heading.className = 'modaltitle';
    heading.textContent = 'سجل مواسم المنافسين';
    const close = doc.createElement('button');
    close.type = 'button';
    close.className = 'closebtn';
    close.setAttribute('aria-label', 'العودة إلى مجتمع المقاتلين');
    close.textContent = '×';
    close.addEventListener('click', () => { root.innerHTML = previousMarkup; });
    header.appendChild(icon);
    header.appendChild(heading);
    header.appendChild(close);

    const body = doc.createElement('div');
    body.className = 'modalbody';
    const description = doc.createElement('p');
    description.className = 'desc';
    description.textContent = summary;
    body.appendChild(description);

    const grid = doc.createElement('div');
    grid.className = 'choicegrid';
    const about = createFallbackChoice(
      doc,
      '📘',
      'عن نظام المواسم',
      'تُحاكى مواجهات المنافسين مرة واحدة لكل عمر، ولا تُحتسب ضمن سجل اللاعب أو دفاعاته عن اللقب.',
      () => {
        description.textContent = 'كل منافس نشط يواجه بقية المنافسين مرة واحدة في الموسم. الفوز 3 نقاط والتعادل نقطة والخسارة بلا نقاط. النتائج تخص مجتمع المنافسين ولا تغيّر لقب اللاعب.';
      }
    );
    const back = createFallbackChoice(
      doc,
      '↩️',
      'رجوع إلى مجتمع المقاتلين',
      '',
      () => { root.innerHTML = previousMarkup; }
    );
    grid.appendChild(about);
    grid.appendChild(back);
    body.appendChild(grid);
    panel.appendChild(header);
    panel.appendChild(body);
    overlay.appendChild(panel);
    root.appendChild(overlay);
  }

  function openCommunitySeasonMenu() {
    const current = gameState();
    const getCareer = getEnsureCombatCareer();
    const career = getCareer ? getCareer() : (current && current.combatCareer);
    if (!career || typeof career !== 'object') return;
    const modalRoot = global.document && global.document.getElementById('modalRoot');
    const previousCommunityMarkup = modalRoot ? modalRoot.innerHTML : '';
    const backToMenu = () => {
      if (typeof global.combatCommunityMenu === 'function' || typeof combatCommunityMenu === 'function') {
        return returnToCommunityMenu();
      }
      if (modalRoot) modalRoot.innerHTML = previousCommunityMarkup;
    };
    const league = normalizeCommunityLeague(career.communityLeague);
    career.communityLeague = league;

    const lines = league.standings.slice(0, 10).map(row =>
      row.position + '. ' + row.name + ' — ' + row.points + ' نقطة · ' +
      row.wins + ' فوز · ' + row.draws + ' تعادل · ' + row.losses + ' خسارة'
    );
    const latest = league.history.length ? league.history[league.history.length - 1] : null;
    const summary = league.season
      ? 'آخر موسم: ' + league.season + ' · العمر عند المحاكاة: ' + league.lastSimulatedAge +
        ' · عدد المواجهات: ' + league.matchesLastSeason + '.\n' +
        'متصدر الموسم: ' + (latest ? latest.leaderName : 'غير متاح') +
        (latest ? ' برصيد ' + latest.leaderPoints + ' نقطة.' : '.') +
        '\n\nترتيب المنافسين:\n' + (lines.length ? lines.join('\n') : 'لا توجد نتائج محفوظة.')
      : 'لم يبدأ موسم بعد. تُحاكى مواجهات المنافسين تلقائيًا عند التقدم بالعمر داخل مسيرة القتال، بعد تحديث أعمار المجتمع.\n\nالنتائج تخص منافسي المجتمع فقط، ولا تضيف نقاطًا إلى مسيرة اللاعب أو تغيّر لقب العالم مباشرة.';

    if (hasModalHelper() && hasChoiceHelper()) {
      const options = [
        makeChoice('📘', 'عن نظام المواسم', 'يواجه كل منافس نشط بقية المنافسين مرة واحدة في الموسم. النتائج حتمية وقابلة لإعادة الاختبار، وتؤثر تدريجيًا في الزخم والاحترام.', () => {
          showInfo('📘', 'عن نظام المواسم', 'تُحاكى مواجهات المنافسين مرة واحدة لكل عمر عند تقدم الحياة. لا تُحتسب هذه النتائج ضمن سجل نزالات اللاعب أو دفاعاته عن لقب العالم.');
        }),
        makeChoice('↩️', 'رجوع إلى مجتمع المقاتلين', '', backToMenu)
      ];
      showModal('🏆', 'سجل مواسم المنافسين', summary, options);
      return;
    }

    renderFallbackSeasonModal(summary);
  }

  function injectSeasonMenuEntry(root) {
    if (!root || typeof root.querySelector !== 'function' || !global.document) return false;
    const heading = root.querySelector('.modaltitle');
    if (!heading || !String(heading.textContent || '').includes('مجتمع المقاتلين')) return false;
    let grid = root.querySelector('.choicegrid');
    if (!grid) {
      const body = root.querySelector('.modalbody');
      if (!body || typeof body.appendChild !== 'function') return false;
      grid = global.document.createElement('div');
      grid.className = 'choicegrid';
      body.appendChild(grid);
    }
    if (typeof grid.appendChild !== 'function') return false;
    if (typeof grid.querySelector === 'function' && grid.querySelector('[data-hayah-combat-season-entry]')) return false;

    const button = global.document.createElement('button');
    button.type = 'button';
    button.className = 'choice';
    button.setAttribute('data-hayah-combat-season-entry', 'true');
    button.setAttribute('aria-label', 'سجل مواسم المنافسين');

    const icon = global.document.createElement('span');
    icon.className = 'choiceico';
    icon.textContent = '🏆';
    const copy = global.document.createElement('span');
    copy.className = 'ctext';
    const title = global.document.createElement('span');
    title.className = 'ctitle';
    title.textContent = 'سجل مواسم المنافسين';
    const description = global.document.createElement('span');
    description.className = 'cdesc';
    description.textContent = 'تابع نتائج المواجهات السنوية وترتيب منافسي المجتمع.';

    copy.appendChild(title);
    copy.appendChild(description);
    button.appendChild(icon);
    button.appendChild(copy);
    button.addEventListener('click', openCommunitySeasonMenu);
    grid.appendChild(button);
    return true;
  }

  function installCommunityMenuObserver() {
    if (!global.document || typeof global.document.getElementById !== 'function') return;
    const root = global.document.getElementById('modalRoot');
    if (!root) return;
    injectSeasonMenuEntry(root);
    if (typeof global.MutationObserver === 'function') {
      const observer = new global.MutationObserver(() => injectSeasonMenuEntry(root));
      observer.observe(root, { childList: true, subtree: true });
      global.__hayahCombatSeasonMenuObserver = observer;
    }
    const originalCommunityMenu = global.combatCommunityMenu;
    if (typeof originalCommunityMenu === 'function') {
      global.combatCommunityMenu = function () {
        const result = originalCommunityMenu.apply(this, arguments);
        injectSeasonMenuEntry(root);
        return result;
      };
    }
  }

  function installAgeButtonFallback() {
    if (!global.document || typeof global.document.getElementById !== 'function') return;
    const button = global.document.getElementById('ageUpBtn');
    if (!button || typeof button.addEventListener !== 'function') return;
    let observedAge = currentAge();
    button.addEventListener('click', () => {
      const afterAgeChange = () => {
        const age = currentAge();
        if (age < 0 || age === observedAge) return;
        observedAge = age;
        const current = gameState();
        if (current && current.combatCareer) simulateCommunitySeason(current.combatCareer);
      };
      if (typeof global.queueMicrotask === 'function') global.queueMicrotask(afterAgeChange);
      else Promise.resolve().then(afterAgeChange);
    });
  }

  const originalAdvance = global.advanceCombatCommunity;
  if (typeof originalAdvance === 'function') {
    global.advanceCombatCommunity = function (career) {
      const result = originalAdvance.apply(this, arguments);
      if (result === true) {
        simulateCommunitySeason(career || (
          typeof global.ensureCombatCareer === 'function' ? global.ensureCombatCareer() : null
        ));
      }
      return result;
    };
  }

  installCommunityMenuObserver();
  installAgeButtonFallback();

  global.HayahCombatSeason = Object.freeze({
    normalize: normalizeCommunityLeague,
    simulate: simulateCommunitySeason,
    openMenu: openCommunitySeasonMenu,
    injectMenuEntry: injectSeasonMenuEntry
  });
})(window);
