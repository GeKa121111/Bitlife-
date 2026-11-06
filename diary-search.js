(function (root) {
  'use strict';
  const originalHidden = new WeakMap();
  const normalizeText = value => String(value ?? '')
    .normalize('NFKC')
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
    .replace(/\u0640/g, '')
    .replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627')
    .replace(/\u0649/g, '\u064a')
    .toLocaleLowerCase('ar')
    .trim();

  function setSearchHidden(element, hidden) {
    if (!originalHidden.has(element)) originalHidden.set(element, Boolean(element.hidden));
    element.hidden = Boolean(hidden) || originalHidden.get(element);
  }

  function filterFeed(feed, query, tone = 'all') {
    if (!feed) return { visibleCount: 0, totalCount: 0 };
    const normalized = normalizeText(query);
    const selectedTone = ['good', 'bad', 'special'].includes(tone) ? tone : 'all';
    const hasFilter = Boolean(normalized) || selectedTone !== 'all';
    const children = typeof feed.querySelectorAll === 'function'
      ? Array.from(feed.querySelectorAll('.agegroup, .logcard'))
      : Array.from(feed.children || []);
    let currentHeading = null;
    let groupMatches = 0;
    let headingMatches = false;
    let visibleCount = 0;
    let totalCount = 0;
    const finishGroup = () => {
      if (!currentHeading) return;
      setSearchHidden(currentHeading, hasFilter && groupMatches === 0);
    };

    for (const child of children) {
      if (child.classList?.contains('agegroup')) {
        finishGroup();
        currentHeading = child;
        groupMatches = 0;
        headingMatches = Boolean(normalized) && normalizeText(child.textContent).includes(normalized);
        continue;
      }
      if (!child.classList?.contains('logcard')) continue;
      totalCount += 1;
      const textMatches = !normalized || headingMatches || normalizeText(child.textContent).includes(normalized);
      const toneMatches = selectedTone === 'all' || child.classList.contains(selectedTone);
      const matches = textMatches && toneMatches;
      const wasHidden = originalHidden.has(child) ? originalHidden.get(child) : Boolean(child.hidden);
      setSearchHidden(child, !matches);
      if (matches && !wasHidden) {
        visibleCount += 1;
        groupMatches += 1;
      }
    }
    finishGroup();
    return { visibleCount, totalCount };
  }

  function visibleCards(feed) {
    if (!feed) return [];
    const cards = typeof feed.querySelectorAll === 'function'
      ? Array.from(feed.querySelectorAll('.logcard'))
      : Array.from(feed.children || []).filter(child => child.classList?.contains('logcard'));
    return cards.filter(card => !card.hidden);
  }

  function jumpToEdge(feed, edge) {
    const cards = visibleCards(feed);
    const target = edge === 'last' ? cards[cards.length - 1] : cards[0];
    if (!target) return null;
    if (typeof target.scrollIntoView === 'function') {
      target.scrollIntoView({ behavior: 'auto', block: 'nearest' });
    }
    return target;
  }

  function init() {
    const documentRef = root.document;
    if (!documentRef) return null;
    const heading = documentRef.querySelector('.story-heading');
    const feed = documentRef.getElementById('lifeFeed');
    if (!heading || !feed || documentRef.getElementById('diarySearchToggle')) return null;

    heading.classList.add('has-diary-search');
    const tools = documentRef.createElement('div');
    tools.className = 'diary-search-tools';
    const toggle = documentRef.createElement('button');
    toggle.type = 'button';
    toggle.id = 'diarySearchToggle';
    toggle.className = 'diary-search-toggle';
    toggle.textContent = 'بحث';
    toggle.setAttribute('aria-label', 'بحث في يوميات الحياة');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', 'diarySearchPanel');
    tools.appendChild(toggle);
    heading.appendChild(tools);

    const panel = documentRef.createElement('section');
    panel.id = 'diarySearchPanel';
    panel.className = 'diary-search-panel';
    panel.hidden = true;
    panel.setAttribute('role', 'search');
    panel.setAttribute('aria-label', 'البحث والتصفية في يوميات الحياة');
    const label = documentRef.createElement('label');
    label.htmlFor = 'diarySearchInput';
    label.textContent = 'ابحث في أحداث حياتك';
    const row = documentRef.createElement('div');
    row.className = 'diary-search-row';
    const input = documentRef.createElement('input');
    input.type = 'search';
    input.id = 'diarySearchInput';
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.placeholder = 'مثال: الجامعة، العمل، السفر';
    const clear = documentRef.createElement('button');
    clear.type = 'button';
    clear.id = 'diarySearchClear';
    clear.className = 'diary-search-clear';
    clear.textContent = 'مسح';
    clear.disabled = true;
    row.append(input, clear);

    const toneLabels = { all: 'كل الأنواع', good: 'إيجابية', bad: 'سلبية', special: 'مميزة' };
    let activeTone = 'all';
    const filterGroup = documentRef.createElement('div');
    filterGroup.id = 'diarySearchFilters';
    filterGroup.className = 'diary-search-filters';
    filterGroup.setAttribute('role', 'group');
    filterGroup.setAttribute('aria-label', 'تصفية الأحداث حسب النوع');
    const filterButtons = ['all', 'good', 'bad', 'special'].map(tone => {
      const button = documentRef.createElement('button');
      button.type = 'button';
      button.className = 'diary-search-filter';
      button.dataset.tone = tone;
      button.textContent = tone === 'all' ? 'كل الأحداث' : toneLabels[tone];
      button.setAttribute('aria-pressed', String(tone === activeTone));
      filterGroup.appendChild(button);
      return button;
    });
    const jumpGroup = documentRef.createElement('div');
    jumpGroup.className = 'diary-search-jump';
    jumpGroup.setAttribute('role', 'group');
    jumpGroup.setAttribute('aria-label', 'التنقل بين أحداث اليوميات');
    const oldestButton = documentRef.createElement('button');
    oldestButton.type = 'button';
    oldestButton.className = 'diary-search-jump-button';
    oldestButton.textContent = 'أقدم حدث ظاهر';
    oldestButton.setAttribute('aria-label', 'الانتقال إلى أقدم حدث ظاهر');
    const newestButton = documentRef.createElement('button');
    newestButton.type = 'button';
    newestButton.className = 'diary-search-jump-button';
    newestButton.textContent = 'أحدث حدث ظاهر';
    newestButton.setAttribute('aria-label', 'الانتقال إلى أحدث حدث ظاهر');
    jumpGroup.append(oldestButton, newestButton);

    const status = documentRef.createElement('p');
    status.id = 'diarySearchStatus';
    status.className = 'diary-search-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    panel.append(label, row, filterGroup, jumpGroup, status);
    heading.insertAdjacentElement('afterend', panel);

    const syncFilterButtons = () => {
      filterButtons.forEach(button => {
        button.setAttribute('aria-pressed', String(button.dataset.tone === activeTone));
      });
    };
    const syncJumpButtons = () => {
      const hasVisibleEvents = visibleCards(feed).length > 0;
      oldestButton.disabled = !hasVisibleEvents;
      newestButton.disabled = !hasVisibleEvents;
    };
    const update = () => {
      const result = filterFeed(feed, input.value, activeTone);
      syncJumpButtons();
      const hasQuery = Boolean(normalizeText(input.value));
      const hasTone = activeTone !== 'all';
      clear.disabled = !hasQuery;
      status.textContent = !hasQuery && !hasTone
        ? 'يعرض كل أحداث يومياتك.'
        : result.visibleCount
          ? 'تم العثور على ' + result.visibleCount + ' من ' + result.totalCount + ' حدثًا · ' + toneLabels[activeTone] + '.'
          : 'لا توجد أحداث مطابقة للبحث والتصفية.';
    };
    const setTone = tone => {
      activeTone = ['good', 'bad', 'special'].includes(tone) ? tone : 'all';
      syncFilterButtons();
      update();
    };
    const close = () => {
      panel.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      input.value = '';
      activeTone = 'all';
      syncFilterButtons();
      filterFeed(feed, '', 'all');
      syncJumpButtons();
      clear.disabled = true;
      status.textContent = '';
      toggle.focus();
    };

    toggle.addEventListener('click', () => {
      if (panel.hidden) {
        panel.hidden = false;
        toggle.setAttribute('aria-expanded', 'true');
        update();
        status.textContent = 'اكتب كلمة أو اختر نوع الحدث.';
        input.focus();
      } else {
        close();
      }
    });
    input.addEventListener('input', update);
    clear.addEventListener('click', () => {
      input.value = '';
      update();
      input.focus();
    });
    filterButtons.forEach(button => {
      button.addEventListener('click', () => setTone(button.dataset.tone));
    });
    const jump = edge => {
      const target = jumpToEdge(feed, edge);
      if (!target) {
        status.textContent = 'لا توجد أحداث ظاهرة للانتقال إليها.';
        return;
      }
      const title = target.querySelector?.('.logtitle')?.textContent || target.textContent || '';
      const labelText = String(title).trim().replace(/\s+/g, ' ').slice(0, 90);
      status.textContent = (edge === 'last' ? 'انتقلت إلى أحدث حدث ظاهر: ' : 'انتقلت إلى أقدم حدث ظاهر: ') + labelText;
    };
    oldestButton.addEventListener('click', () => jump('first'));
    newestButton.addEventListener('click', () => jump('last'));
    input.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      if (input.value) {
        input.value = '';
        update();
      } else if (activeTone !== 'all') {
        setTone('all');
      } else {
        close();
      }
    });

    let observer = null;
    if (typeof root.MutationObserver === 'function') {
      observer = new root.MutationObserver(() => {
        if (!panel.hidden) update();
        else syncJumpButtons();
      });
      observer.observe(feed, { childList: true, subtree: true });
    }
    syncJumpButtons();
    return { toggle, panel, input, clear, status, observer, filterGroup, filterButtons, jumpGroup, oldestButton, newestButton };
  }

  root.HayahDiarySearch = Object.freeze({ normalizeText, filterFeed, visibleCards, jumpToEdge, init });
  if (!root.document) return;
  if (root.document.readyState === 'loading') {
    root.document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})(window);
