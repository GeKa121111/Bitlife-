(function (root) {
  'use strict';

  const originalHidden = new WeakMap();
  const normalizeText = value => String(value ?? '')
    .normalize('NFKC')
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
    .replace(/\u0640/g, '')
    .toLocaleLowerCase('ar')
    .trim();

  function setSearchHidden(element, hidden) {
    if (!originalHidden.has(element)) originalHidden.set(element, Boolean(element.hidden));
    element.hidden = Boolean(hidden) || originalHidden.get(element);
  }

  function filterFeed(feed, query) {
    if (!feed) return { visibleCount: 0, totalCount: 0 };
    const normalized = normalizeText(query);
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
      setSearchHidden(currentHeading, Boolean(normalized) && groupMatches === 0 && !headingMatches);
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
      const matches = !normalized || headingMatches || normalizeText(child.textContent).includes(normalized);
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

  function init() {
    const documentRef = root.document;
    if (!documentRef) return null;
    const heading = documentRef.querySelector('.story-heading');
    const feed = documentRef.getElementById('lifeFeed');
    if (!heading || !feed || documentRef.getElementById('diarySearchToggle')) return null;

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
    panel.setAttribute('aria-label', 'البحث في يوميات الحياة');

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
    const status = documentRef.createElement('p');
    status.id = 'diarySearchStatus';
    status.className = 'diary-search-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    panel.append(label, row, status);
    heading.insertAdjacentElement('afterend', panel);

    const update = () => {
      const result = filterFeed(feed, input.value);
      const hasQuery = Boolean(normalizeText(input.value));
      clear.disabled = !hasQuery;
      status.textContent = !hasQuery
        ? 'اكتب كلمة للبحث في أحداث حياتك.'
        : result.visibleCount
          ? `تم العثور على ${result.visibleCount} من ${result.totalCount} حدثًا.`
          : 'لا توجد أحداث مطابقة.';
    };

    const close = () => {
      panel.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      input.value = '';
      filterFeed(feed, '');
      clear.disabled = true;
      status.textContent = '';
    };

    toggle.addEventListener('click', () => {
      if (panel.hidden) {
        panel.hidden = false;
        toggle.setAttribute('aria-expanded', 'true');
        status.textContent = 'اكتب كلمة للبحث في أحداث حياتك.';
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
    input.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      if (input.value) {
        input.value = '';
        update();
      } else {
        close();
        toggle.focus();
      }
    });

    let observer = null;
    if (typeof root.MutationObserver === 'function') {
      observer = new root.MutationObserver(() => {
        if (!panel.hidden && normalizeText(input.value)) update();
      });
      observer.observe(feed, { childList: true, subtree: true });
    }

    return { toggle, panel, input, clear, status, observer };
  }

  root.HayahDiarySearch = Object.freeze({ normalizeText, filterFeed, init });
  if (!root.document) return;
  if (root.document.readyState === 'loading') {
    root.document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})(window);
