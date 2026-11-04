'use strict';

(() => {
  if (!('serviceWorker' in navigator)) return;

  // A first install has no previous controller. Only notify when an existing
  // app session receives a replacement worker after an update.
  const hadController = Boolean(navigator.serviceWorker.controller);
  if (!hadController) return;

  let noticeShown = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (noticeShown) return;
    noticeShown = true;

    const notice = document.createElement('aside');
    notice.className = 'pwa-update-notice';
    notice.setAttribute('role', 'status');
    notice.setAttribute('aria-live', 'polite');

    const message = document.createElement('span');
    message.textContent = 'يتوفر تحديث جديد من حياة. أعد التحميل لتطبيقه.';

    const action = document.createElement('button');
    action.type = 'button';
    action.className = 'pwa-update-action';
    action.textContent = 'تحديث الآن';
    action.addEventListener('click', () => window.location.reload());

    notice.append(message, action);
    document.body.appendChild(notice);
  });
})();
