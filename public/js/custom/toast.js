/**
 * Lightweight toast notifications (fixed stack, auto-dismiss).
 */
(function () {
  var STACK_ID = 'eternus-toast-stack';
  var DEFAULT_DURATION = { success: 6500, error: 8000 };

  function t(key, fallback) {
    return window.i18n && window.i18n.t ? window.i18n.t(key, fallback) : fallback;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function ensureStack() {
    var stack = document.getElementById(STACK_ID);
    if (stack) return stack;
    stack = document.createElement('div');
    stack.id = STACK_ID;
    stack.className = 'eternus-toast-stack';
    stack.setAttribute('aria-live', 'polite');
    stack.setAttribute('aria-relevant', 'additions');
    document.body.appendChild(stack);
    return stack;
  }

  function iconSvg(variant) {
    if (variant === 'success') {
      return (
        '<svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<circle cx="11" cy="11" r="10" stroke="currentColor" stroke-width="1.5"/>' +
        '<path d="M7 11.5l2.5 2.5L15 8.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
        '</svg>'
      );
    }
    return (
      '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5"/>' +
      '<path d="M10 6v5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
      '<circle cx="10" cy="14" r="0.75" fill="currentColor"/>' +
      '</svg>'
    );
  }

  function dismissToast(toast, stack) {
    if (!toast || toast.dataset.dismissed === 'true') return;
    toast.dataset.dismissed = 'true';
    toast.classList.add('eternus-toast--out');
    var remove = function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
      if (stack && stack.children.length === 0) stack.remove();
    };
    if (prefersReducedMotion()) {
      remove();
      return;
    }
    toast.addEventListener('animationend', remove, { once: true });
    setTimeout(remove, 400);
  }

  function show(options) {
    var opts = options || {};
    var variant = opts.variant === 'success' ? 'success' : 'error';
    var title = escapeHtml(opts.title || '');
    var message = escapeHtml(opts.message || '');
    var detail = escapeHtml(opts.detail || '');
    var hint = escapeHtml(opts.hint || '');
    var duration = opts.duration != null ? opts.duration : DEFAULT_DURATION[variant];

    var stack = ensureStack();
    var toast = document.createElement('div');
    toast.className = 'eternus-toast eternus-toast--' + variant;
    toast.setAttribute('role', variant === 'success' ? 'status' : 'alert');

    var detailHtml = detail
      ? '<p class="eternus-toast__detail mb-0">' + detail + '</p>'
      : '';
    var hintHtml = hint ? '<p class="eternus-toast__hint mb-0">' + hint + '</p>' : '';

    toast.innerHTML =
      '<span class="eternus-toast__icon">' +
      iconSvg(variant) +
      '</span>' +
      '<div class="eternus-toast__content">' +
      (title ? '<p class="eternus-toast__title mb-0">' + title + '</p>' : '') +
      (message ? '<p class="eternus-toast__message mb-0">' + message + '</p>' : '') +
      hintHtml +
      detailHtml +
      '</div>' +
      '<button type="button" class="eternus-toast__close" aria-label="' +
      t('form.index.toastDismiss', 'Dismiss') +
      '">' +
      '<span aria-hidden="true">&times;</span>' +
      '</button>';

    stack.appendChild(toast);

    var closeBtn = toast.querySelector('.eternus-toast__close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        dismissToast(toast, stack);
      });
    }

    if (duration > 0) {
      setTimeout(function () {
        dismissToast(toast, stack);
      }, duration);
    }

    return toast;
  }

  window.EternusToast = { show: show, dismiss: dismissToast };
})();
