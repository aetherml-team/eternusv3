/**
 * Single-page contact form for index.html #contactForm
 */
(function () {
  const NAME_MIN_LENGTH = 2;
  const NAME_MAX_LENGTH = 80;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function getForm() {
    return document.getElementById('contactForm');
  }

  function isMeetingValid() {
    return !!(window.MeetingScheduler && window.MeetingScheduler.isValid());
  }

  function t(key, fallback) {
    return window.i18n && window.i18n.t ? window.i18n.t(key, fallback) : fallback;
  }

  function sanitizePersonName(value) {
    var str = value || '';
    var cleaned;
    try {
      cleaned = str.replace(/[^\p{L}\s]/gu, '');
    } catch (e) {
      cleaned = str.replace(/[^a-zA-ZÀ-ÿ\u00f1\u00d1\s]/g, '');
    }
    return cleaned.replace(/\s+/g, ' ').trim();
  }

  function isValidPersonName(value) {
    var name = sanitizePersonName(value);
    if (name.length < NAME_MIN_LENGTH || name.length > NAME_MAX_LENGTH) return false;
    try {
      return /^[\p{L}]+(?: [\p{L}]+)*$/u.test(name);
    } catch (e) {
      return /^[a-zA-ZÀ-ÿ\u00f1\u00d1]+(?: [a-zA-ZÀ-ÿ\u00f1\u00d1]+)*$/.test(name);
    }
  }

  function isPersonNameChar(char) {
    if (!char || char.length !== 1) return false;
    if (char === ' ') return true;
    try {
      return /\p{L}/u.test(char);
    } catch (e) {
      return /[a-zA-ZÀ-ÿ\u00f1\u00d1]/.test(char);
    }
  }

  function bindPersonNameInput(input) {
    if (!input || input.dataset.personNameBound === 'true') return;
    input.dataset.personNameBound = 'true';

    input.addEventListener('beforeinput', function (e) {
      if (
        e.inputType === 'deleteContentBackward' ||
        e.inputType === 'deleteContentForward' ||
        e.inputType === 'deleteByCut'
      ) {
        return;
      }
      if (e.data && !isPersonNameChar(e.data)) e.preventDefault();
    });

    input.addEventListener('keydown', function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key.length === 1 && !isPersonNameChar(e.key)) e.preventDefault();
    });

    input.addEventListener('input', function () {
      var sanitized = sanitizePersonName(input.value);
      if (sanitized !== input.value) input.value = sanitized;
      updateSubmitButton();
    });

    input.addEventListener('paste', function (e) {
      e.preventDefault();
      var pasted = (e.clipboardData || window.clipboardData).getData('text');
      var start = input.selectionStart;
      var end = input.selectionEnd;
      input.value = sanitizePersonName(input.value.slice(0, start) + pasted + input.value.slice(end));
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }

  function showError(id, show) {
    var el = document.getElementById(id);
    if (el) el.classList.toggle('d-none', !show);
  }

  function hideAllErrors() {
    [
      'contact-form-errors',
      'contact-form-api-error',
      'contact-form-success',
      'contact-form-bride-error',
      'contact-form-bride-invalid',
      'contact-form-groom-error',
      'contact-form-groom-invalid',
      'contact-form-email-error',
      'contact-form-type-error',
      'contact-form-budget-error',
      'contact-form-meeting-error',
    ].forEach(function (id) {
      showError(id, false);
    });
  }

  function isFormComplete(form) {
    var brideInput = form.querySelector('input[name="bride_name"]');
    var groomInput = form.querySelector('input[name="groom_name"]');
    var emailInput = form.querySelector('input[name="email"]');

    if (!brideInput || !isValidPersonName(brideInput.value)) return false;
    if (!groomInput || !isValidPersonName(groomInput.value)) return false;
    if (!emailInput || !EMAIL_RE.test((emailInput.value || '').trim())) return false;
    if (!form.querySelector('input[name="wedding_type"]:checked')) return false;
    if (!form.querySelector('input[name="budget"]:checked')) return false;
    if (!isMeetingValid()) return false;
    return true;
  }

  function validateForm(form) {
    hideAllErrors();
    var valid = true;

    var brideInput = form.querySelector('input[name="bride_name"]');
    var groomInput = form.querySelector('input[name="groom_name"]');
    if (brideInput) {
      var brideRaw = brideInput.value;
      brideInput.value = sanitizePersonName(brideRaw);
      if (!brideInput.value) {
        showError('contact-form-bride-error', brideRaw.length === 0);
        showError('contact-form-bride-invalid', brideRaw.length > 0);
        valid = false;
      } else if (!isValidPersonName(brideInput.value)) {
        showError('contact-form-bride-invalid', true);
        valid = false;
      }
    }

    if (groomInput) {
      var groomRaw = groomInput.value;
      groomInput.value = sanitizePersonName(groomRaw);
      if (!groomInput.value) {
        showError('contact-form-groom-error', groomRaw.length === 0);
        showError('contact-form-groom-invalid', groomRaw.length > 0);
        valid = false;
      } else if (!isValidPersonName(groomInput.value)) {
        showError('contact-form-groom-invalid', true);
        valid = false;
      }
    }

    var emailInput = form.querySelector('input[name="email"]');
    if (emailInput) {
      var email = (emailInput.value || '').trim();
      if (!email || !EMAIL_RE.test(email)) {
        showError('contact-form-email-error', true);
        valid = false;
      }
    }

    if (!form.querySelector('input[name="wedding_type"]:checked')) {
      showError('contact-form-type-error', true);
      valid = false;
    }

    if (!form.querySelector('input[name="budget"]:checked')) {
      showError('contact-form-budget-error', true);
      valid = false;
    }

    if (!isMeetingValid()) {
      showError('contact-form-meeting-error', true);
      valid = false;
    }

    if (!valid) {
      showError('contact-form-errors', true);
      var firstError = form.querySelector('.text-danger:not(.d-none)');
      if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    return valid;
  }

  function updateSubmitButton() {
    var form = getForm();
    if (!form) return;
    var btn = form.querySelector('button[type="submit"]');
    if (!btn || btn.dataset.submitting === 'true') return;
    var ready = isFormComplete(form);
    btn.disabled = !ready;
    btn.setAttribute('aria-disabled', ready ? 'false' : 'true');
  }

  function sanitizePersonNames(form) {
    ['bride_name', 'groom_name'].forEach(function (name) {
      var input = form.querySelector('input[name="' + name + '"]');
      if (input) input.value = sanitizePersonName(input.value);
    });
  }

  function showApiError(status, detail) {
    var technicalMessage;
    if (status === 405 || status === 0) {
      technicalMessage =
        'Form API unavailable (HTTP ' +
        status +
        '). Local dev: run npm start from the project root. Production: ensure /api/send is deployed on Vercel.';
    } else {
      technicalMessage = 'Form submit failed (HTTP ' + status + ')' + (detail ? ': ' + detail : '') + '.';
    }
    console.error('[contactForm]', technicalMessage);

    var el = document.getElementById('contact-form-api-error');
    if (!el) return;
    el.textContent = t(
      'form.index.submitFailed',
      "We couldn't send your message right now. Please try again in a moment."
    );
    showError('contact-form-api-error', true);
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function submitForm(form) {
    var btn = form.querySelector('button[type="submit"]');
    if (btn) {
      btn.dataset.submitting = 'true';
      btn.disabled = true;
    }

    if (window.MeetingScheduler && window.MeetingScheduler.sync) {
      window.MeetingScheduler.sync();
    }

    var action = form.getAttribute('action') || '/api/send';
    var body = Object.fromEntries(new FormData(form));

    fetch(action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(function (res) {
        if (res.status >= 200 && res.status < 300) {
          hideAllErrors();
          showError('contact-form-success', true);
          form.reset();
          if (window.MeetingScheduler && window.MeetingScheduler.refresh) {
            window.MeetingScheduler.refresh();
          }
          var successEl = document.getElementById('contact-form-success');
          if (successEl) successEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          return;
        }
        return res.text().then(function (body) {
          showApiError(res.status, body);
        });
      })
      .catch(function (err) {
        console.error('[contactForm]', err);
        showApiError(0);
      })
      .finally(function () {
        if (btn) delete btn.dataset.submitting;
        updateSubmitButton();
      });
  }

  function ensureMeetingScheduler(callback) {
    if (!document.getElementById('meeting-calendar')) return;
    if (window.MeetingScheduler) {
      window.MeetingScheduler.init();
      if (callback) callback();
      return;
    }
    var existing = document.getElementById('meeting-scheduler');
    function run() {
      if (window.MeetingScheduler) window.MeetingScheduler.init();
      if (callback) callback();
    }
    if (existing) {
      existing.addEventListener('load', run, { once: true });
      return;
    }
    var script = document.createElement('script');
    script.id = 'meeting-scheduler';
    script.src = 'js/custom/meetingScheduler.js';
    script.onload = run;
    document.body.appendChild(script);
  }

  function initContactForm() {
    var form = getForm();
    if (!form) return;

    bindPersonNameInput(form.querySelector('input[name="bride_name"]'));
    bindPersonNameInput(form.querySelector('input[name="groom_name"]'));

    if (form.dataset.contactFormBound === 'true') {
      ensureMeetingScheduler(updateSubmitButton);
      return;
    }
    form.dataset.contactFormBound = 'true';

    form.addEventListener('change', updateSubmitButton);
    form.addEventListener('input', function (e) {
      if (e.target && e.target.name === 'email') updateSubmitButton();
    });

    document.addEventListener('meeting-scheduler:change', updateSubmitButton);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      sanitizePersonNames(form);
      if (!validateForm(form)) {
        updateSubmitButton();
        return;
      }
      submitForm(form);
    });

    ensureMeetingScheduler(updateSubmitButton);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContactForm);
  } else {
    initContactForm();
  }

  document.addEventListener('arts/barba/transition/end', initContactForm);
})();
