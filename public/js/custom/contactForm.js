/**
 * Single-page contact form for index.html #contactForm
 */
(function () {
  const NAME_MIN_LENGTH = 2;
  const NAME_MAX_LENGTH = 80;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const FIELD_ERROR_MAP = {
    bride: {
      errorIds: ['contact-form-bride-error', 'contact-form-bride-invalid'],
      getCol: function (form) {
        var input = form.querySelector('input[name="bride_name"]');
        return input ? input.closest('.form__col') : null;
      },
      getFocus: function (form) {
        return form.querySelector('input[name="bride_name"]');
      },
      isValid: function (form) {
        var input = form.querySelector('input[name="bride_name"]');
        return input && isValidPersonName(input.value);
      },
    },
    groom: {
      errorIds: ['contact-form-groom-error', 'contact-form-groom-invalid'],
      getCol: function (form) {
        var input = form.querySelector('input[name="groom_name"]');
        return input ? input.closest('.form__col') : null;
      },
      getFocus: function (form) {
        return form.querySelector('input[name="groom_name"]');
      },
      isValid: function (form) {
        var input = form.querySelector('input[name="groom_name"]');
        return input && isValidPersonName(input.value);
      },
    },
    email: {
      errorIds: ['contact-form-email-error'],
      getCol: function (form) {
        var input = form.querySelector('input[name="email"]');
        return input ? input.closest('.form__col') : null;
      },
      getFocus: function (form) {
        return form.querySelector('input[name="email"]');
      },
      isValid: function (form) {
        var input = form.querySelector('input[name="email"]');
        return input && EMAIL_RE.test((input.value || '').trim());
      },
    },
    wedding_type: {
      errorIds: ['contact-form-type-error'],
      getCol: function (form) {
        var group = form.querySelector('.contact-grid__radios:not(.contact-grid__radios--budget)');
        return group ? group.closest('.form__col') : null;
      },
      getFocus: function (form) {
        return form.querySelector('input[name="wedding_type"]');
      },
      isValid: function (form) {
        return !!form.querySelector('input[name="wedding_type"]:checked');
      },
    },
    budget: {
      errorIds: ['contact-form-budget-error'],
      getCol: function (form) {
        var group = form.querySelector('.contact-grid__radios--budget');
        return group ? group.closest('.form__col') : null;
      },
      getFocus: function (form) {
        return form.querySelector('input[name="budget"]');
      },
      isValid: function (form) {
        return !!form.querySelector('input[name="budget"]:checked');
      },
    },
    meeting: {
      errorIds: ['contact-form-meeting-error'],
      getCol: function () {
        return document.querySelector('.contact-grid__panel--scheduler');
      },
      getFocus: function () {
        return document.querySelector('#meeting-calendar .meeting-scheduler__day:not(.meeting-scheduler__day--empty)');
      },
      isValid: function () {
        return isMeetingValid();
      },
    },
  };

  function getForm() {
    return document.getElementById('contactForm');
  }

  function isMeetingValid() {
    return !!(window.MeetingScheduler && window.MeetingScheduler.isValid());
  }

  function t(key, fallback, vars) {
    var text = window.i18n && window.i18n.t ? window.i18n.t(key, fallback) : fallback;
    if (!vars || !text) return text;
    return String(text).replace(/\{(\w+)\}/g, function (_, name) {
      return vars[name] != null ? vars[name] : '';
    });
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
      clearFieldIfValid(input.name === 'bride_name' ? 'bride' : 'groom');
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

  function setFieldInvalid(fieldKey, invalid) {
    var form = getForm();
    if (!form) return;
    var config = FIELD_ERROR_MAP[fieldKey];
    if (!config) return;

    var col = config.getCol(form);
    if (col) col.classList.toggle('contact-grid__field--invalid', invalid);

    if (fieldKey === 'wedding_type' || fieldKey === 'budget') {
      var radios = col && col.querySelector('.contact-grid__radios');
      if (radios) radios.classList.toggle('contact-grid__radios--invalid', invalid);
    }

    if (fieldKey === 'meeting' && col) {
      col.classList.toggle('contact-grid__panel--invalid', invalid);
    }

    var focusEl = config.getFocus(form);
    if (focusEl) focusEl.setAttribute('aria-invalid', invalid ? 'true' : 'false');
  }

  function clearFieldInvalidStates() {
    Object.keys(FIELD_ERROR_MAP).forEach(function (key) {
      setFieldInvalid(key, false);
    });
  }

  function clearFieldIfValid(fieldKey) {
    var form = getForm();
    if (!form) return;
    var config = FIELD_ERROR_MAP[fieldKey];
    if (!config || !config.isValid(form)) return;

    config.errorIds.forEach(function (id) {
      showError(id, false);
    });
    setFieldInvalid(fieldKey, false);
  }

  function clearValidationMessages() {
    [
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
    clearFieldInvalidStates();
  }

  function showToast(options) {
    if (window.EternusToast && window.EternusToast.show) {
      window.EternusToast.show(options);
    }
  }

  function showValidationToast() {
    showToast({
      variant: 'error',
      title: t('form.index.submitErrorTitle', 'Almost there'),
      message: t('form.index.submitError', 'Please check the highlighted fields below.'),
    });
  }

  function focusFirstInvalid(form) {
    var order = ['bride', 'groom', 'email', 'wedding_type', 'budget', 'meeting'];
    for (var i = 0; i < order.length; i++) {
      var key = order[i];
      var config = FIELD_ERROR_MAP[key];
      if (!config || config.isValid(form)) continue;

      var target = config.getFocus(form);
      if (target && typeof target.focus === 'function') {
        try {
          target.focus({ preventScroll: true });
        } catch (e) {
          target.focus();
        }
      }
      return;
    }
  }

  function isFormComplete(form) {
    return Object.keys(FIELD_ERROR_MAP).every(function (key) {
      return FIELD_ERROR_MAP[key].isValid(form);
    });
  }

  function validateForm(form) {
    clearValidationMessages();
    var valid = true;

    var brideInput = form.querySelector('input[name="bride_name"]');
    var groomInput = form.querySelector('input[name="groom_name"]');
    if (brideInput) {
      var brideRaw = brideInput.value;
      brideInput.value = sanitizePersonName(brideRaw);
      if (!brideInput.value) {
        showError('contact-form-bride-error', brideRaw.length === 0);
        showError('contact-form-bride-invalid', brideRaw.length > 0);
        setFieldInvalid('bride', true);
        valid = false;
      } else if (!isValidPersonName(brideInput.value)) {
        showError('contact-form-bride-invalid', true);
        setFieldInvalid('bride', true);
        valid = false;
      }
    }

    if (groomInput) {
      var groomRaw = groomInput.value;
      groomInput.value = sanitizePersonName(groomRaw);
      if (!groomInput.value) {
        showError('contact-form-groom-error', groomRaw.length === 0);
        showError('contact-form-groom-invalid', groomRaw.length > 0);
        setFieldInvalid('groom', true);
        valid = false;
      } else if (!isValidPersonName(groomInput.value)) {
        showError('contact-form-groom-invalid', true);
        setFieldInvalid('groom', true);
        valid = false;
      }
    }

    var emailInput = form.querySelector('input[name="email"]');
    if (emailInput) {
      var email = (emailInput.value || '').trim();
      if (!email || !EMAIL_RE.test(email)) {
        showError('contact-form-email-error', true);
        setFieldInvalid('email', true);
        valid = false;
      }
    }

    if (!form.querySelector('input[name="wedding_type"]:checked')) {
      showError('contact-form-type-error', true);
      setFieldInvalid('wedding_type', true);
      valid = false;
    }

    if (!form.querySelector('input[name="budget"]:checked')) {
      showError('contact-form-budget-error', true);
      setFieldInvalid('budget', true);
      valid = false;
    }

    if (!isMeetingValid()) {
      showError('contact-form-meeting-error', true);
      setFieldInvalid('meeting', true);
      valid = false;
    }

    if (!valid) {
      showValidationToast();
      focusFirstInvalid(form);
    }

    return valid;
  }

  function setSubmitting(isSubmitting) {
    var form = getForm();
    if (!form) return;
    var btn = form.querySelector('button[type="submit"]');
    if (!btn) return;

    btn.classList.toggle('is-submitting', isSubmitting);
    btn.disabled = isSubmitting || !isFormComplete(form);
    btn.setAttribute('aria-disabled', btn.disabled ? 'true' : 'false');
    btn.setAttribute('aria-busy', isSubmitting ? 'true' : 'false');

    if (isSubmitting) {
      btn.dataset.submitting = 'true';
    } else {
      delete btn.dataset.submitting;
    }
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

  function formatMeetingSummary(meetingDate, meetingTime) {
    if (!meetingDate || !meetingTime) return '';

    var locale = window.i18n && window.i18n.currentLang === 'es' ? 'es-MX' : 'en-US';
    var parts = meetingDate.split('-').map(Number);
    if (parts.length !== 3) return '';

    var dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
    var dateLabel = new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(dateObj);

    var timeParts = meetingTime.split(':').map(Number);
    var timeObj = new Date(2000, 0, 1, timeParts[0] || 0, timeParts[1] || 0);
    var timeLabel = new Intl.DateTimeFormat(locale, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(timeObj);

    return t(
      'form.index.submitSuccessMeeting',
      'Your consultation is scheduled for {date} at {time}.',
      { date: dateLabel, time: timeLabel }
    );
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

    showToast({
      variant: 'error',
      title: t('form.index.submitFailedTitle', 'Something went wrong'),
      message: t('form.index.submitFailed', "We couldn't send your message right now."),
      hint: t('form.index.submitFailedRetry', 'Please try again in a moment.'),
    });
  }

  function showSuccess(meetingDate, meetingTime) {
    clearValidationMessages();

    var meetingText = formatMeetingSummary(meetingDate, meetingTime);
    showToast({
      variant: 'success',
      title: t('form.index.submitSuccessTitle', "You're all set!"),
      message: t('form.index.submitSuccess', "We've received your details and will be in touch soon."),
      detail: meetingText || '',
      duration: meetingText ? 9000 : 6500,
    });
  }

  function submitForm(form) {
    setSubmitting(true);

    if (window.MeetingScheduler && window.MeetingScheduler.sync) {
      window.MeetingScheduler.sync();
    }

    var meetingDate = (form.querySelector('input[name="meeting_date"]') || {}).value || '';
    var meetingTime = (form.querySelector('input[name="meeting_time"]') || {}).value || '';

    var action = form.getAttribute('action') || '/api/send';
    var body = Object.fromEntries(new FormData(form));

    fetch(action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(function (res) {
        if (res.status >= 200 && res.status < 300) {
          showSuccess(meetingDate, meetingTime);
          form.reset();
          if (window.MeetingScheduler && window.MeetingScheduler.refresh) {
            window.MeetingScheduler.refresh();
          }
          return;
        }
        return res.text().then(function (responseBody) {
          showApiError(res.status, responseBody);
        });
      })
      .catch(function (err) {
        console.error('[contactForm]', err);
        showApiError(0);
      })
      .finally(function () {
        setSubmitting(false);
        updateSubmitButton();
      });
  }

  function bindLiveValidation(form) {
    var emailInput = form.querySelector('input[name="email"]');
    if (emailInput && emailInput.dataset.liveValidationBound !== 'true') {
      emailInput.dataset.liveValidationBound = 'true';
      emailInput.addEventListener('input', function () {
        clearFieldIfValid('email');
        updateSubmitButton();
      });
    }

    form.querySelectorAll('input[name="wedding_type"], input[name="budget"]').forEach(function (input) {
      if (input.dataset.liveValidationBound === 'true') return;
      input.dataset.liveValidationBound = 'true';
      input.addEventListener('change', function () {
        clearFieldIfValid(input.name === 'wedding_type' ? 'wedding_type' : 'budget');
        updateSubmitButton();
      });
    });
  }

  function ensureMeetingScheduler(callback) {
    if (!document.getElementById('meeting-calendar')) return;
    function runScheduler() {
      if (!window.MeetingScheduler) return;
      if (window.MeetingScheduler.initIfNeeded) {
        window.MeetingScheduler.initIfNeeded();
      } else {
        window.MeetingScheduler.init();
      }
      if (callback) callback();
    }
    if (window.MeetingScheduler) {
      runScheduler();
      return;
    }
    var existing = document.getElementById('meeting-scheduler');
    if (existing) {
      existing.addEventListener('load', runScheduler, { once: true });
      return;
    }
    var script = document.createElement('script');
    script.id = 'meeting-scheduler';
    script.src = 'js/custom/meetingScheduler.js';
    script.onload = runScheduler;
    document.body.appendChild(script);
  }

  function initContactForm() {
    var form = getForm();
    if (!form) return;

    bindPersonNameInput(form.querySelector('input[name="bride_name"]'));
    bindPersonNameInput(form.querySelector('input[name="groom_name"]'));
    bindLiveValidation(form);

    if (form.dataset.contactFormBound === 'true') {
      ensureMeetingScheduler(updateSubmitButton);
      return;
    }
    form.dataset.contactFormBound = 'true';

    form.addEventListener('change', updateSubmitButton);
    form.addEventListener('input', function (e) {
      if (e.target && e.target.name === 'email') updateSubmitButton();
    });

    document.addEventListener('meeting-scheduler:change', function () {
      clearFieldIfValid('meeting');
      updateSubmitButton();
    });

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
