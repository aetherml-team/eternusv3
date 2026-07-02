/**
 * Multi-step form handler for contact-full-form.html
 */
(function () {
  let currentStep = 0;
  const totalSteps = 8; // step-0 to step-7

  const NAME_MIN_LENGTH = 2;
  const NAME_MAX_LENGTH = 80;

  function getForm() {
    return document.getElementById('multiStepForm');
  }

  /** Letters and spaces only (supports accented names e.g. José, María). */
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

  function showNameError(step, showInvalidFormat) {
    var errorEl = document.getElementById('error-step-' + step);
    var invalidEl = document.getElementById('error-step-' + step + '-invalid');
    if (errorEl) errorEl.classList.toggle('d-none', showInvalidFormat);
    if (invalidEl) invalidEl.classList.toggle('d-none', !showInvalidFormat);
  }

  function sanitizePersonNamesOnForm(form) {
    if (!form) return;
    ['bride_name', 'groom_name'].forEach(function (name) {
      var input = form.querySelector('input[name="' + name + '"]');
      if (input) input.value = sanitizePersonName(input.value);
    });
  }

  function bindPersonNameInput(input) {
    if (!input || input.dataset.personNameBound === 'true') {
      return;
    }
    input.dataset.personNameBound = 'true';

    input.addEventListener('beforeinput', function (e) {
      if (e.inputType === 'deleteContentBackward' || e.inputType === 'deleteContentForward' || e.inputType === 'deleteByCut') {
        return;
      }
      if (e.data && !isPersonNameChar(e.data)) {
        e.preventDefault();
      }
    });

    input.addEventListener('keydown', function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key.length === 1 && !isPersonNameChar(e.key)) {
        e.preventDefault();
      }
    });

    input.addEventListener('input', function () {
      var sanitized = sanitizePersonName(input.value);
      if (sanitized !== input.value) {
        input.value = sanitized;
      }
    });

    input.addEventListener('paste', function (e) {
      e.preventDefault();
      var pasted = (e.clipboardData || window.clipboardData).getData('text');
      var start = input.selectionStart;
      var end = input.selectionEnd;
      var merged = input.value.slice(0, start) + pasted + input.value.slice(end);
      input.value = sanitizePersonName(merged);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }

  function bindPersonNameInputs() {
    var form = getForm();
    if (!form) return;
    bindPersonNameInput(form.querySelector('input[name="bride_name"]'));
    bindPersonNameInput(form.querySelector('input[name="groom_name"]'));
  }

  function loadMeetingSchedulerScript(callback) {
    if (window.MeetingScheduler) {
      callback();
      return;
    }
    var existing = document.getElementById('meeting-scheduler');
    if (existing) {
      if (existing.dataset.loaded === 'true') {
        callback();
        return;
      }
      existing.addEventListener('load', function onLoad() {
        existing.dataset.loaded = 'true';
        existing.removeEventListener('load', onLoad);
        callback();
      });
      return;
    }
    var script = document.createElement('script');
    script.id = 'meeting-scheduler';
    script.src = 'js/custom/meetingScheduler.js';
    script.onload = function () {
      script.dataset.loaded = 'true';
      callback();
    };
    script.onerror = callback;
    document.body.appendChild(script);
  }

  function ensureMeetingSchedulerInit() {
    if (!document.getElementById('meeting-calendar')) return;
    loadMeetingSchedulerScript(function () {
      if (window.MeetingScheduler) {
        window.MeetingScheduler.init();
        updateContainerHeight();
        window.setTimeout(updateContainerHeight, 100);
      }
    });
  }

  function validatePersonNameStep(step) {
    var stepElement = document.getElementById('step-' + step);
    if (!stepElement) return false;
    var input = stepElement.querySelector('input[name="bride_name"], input[name="groom_name"]');
    if (!input) return true;
    var raw = input.value;
    input.value = sanitizePersonName(raw);
    if (!input.value) {
      showNameError(step, raw.length > 0);
      return false;
    }
    if (!isValidPersonName(input.value)) {
      showNameError(step, true);
      return false;
    }
    showNameError(step, false);
    return true;
  }

  /**
   * Validates the current step and moves to the next step if valid.
   * Exposed globally so onclick handlers work.
   */
  window.validateAndNextStep = function (step) {
    var form = getForm();
    if (!form) return;

    sanitizePersonNamesOnForm(form);

    const stepElement = document.getElementById('step-' + step);
    const errorElement = document.getElementById('error-step-' + step);
    if (!stepElement) return;

    var isValid = true;

    if (step === 0 || step === 1) {
      isValid = validatePersonNameStep(step);
    } else {
      const requiredInputs = stepElement.querySelectorAll('[required]');

      if (requiredInputs.length > 0) {
        const radioInputs = stepElement.querySelectorAll('input[type="radio"][required]');
        if (radioInputs.length > 0) {
          const name = radioInputs[0].name;
          isValid = stepElement.querySelector('input[name="' + name + '"]:checked') !== null;
        } else {
          isValid = Array.from(requiredInputs).every(function (input) {
            if (input.type === 'hidden') {
              return input.value.trim() !== '';
            }
            return input.value.trim() !== '';
          });
        }
      }
    }

    /* Step 4: validate email format */
    if (step === 4 && isValid) {
      const emailInput = stepElement.querySelector('input[name="email"]');
      if (emailInput) {
        const email = (emailInput.value || '').trim();
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
          isValid = false;
        }
      }
    }

    /* Step 5: meeting date + time */
    if (step === 5 && isValid) {
      ensureMeetingSchedulerInit();
      if (!window.MeetingScheduler || !window.MeetingScheduler.isValid()) {
        isValid = false;
      }
    }

    /* Final submit: re-validate names and meeting */
    if (step === totalSteps - 1 && isValid) {
      isValid =
        validatePersonNameStep(0) &&
        validatePersonNameStep(1) &&
        window.MeetingScheduler &&
        window.MeetingScheduler.isValid();
    }

    if (isValid) {
      if (errorElement) errorElement.classList.add('d-none');
      if (step < totalSteps - 1) {
        nextStep();
      } else {
        populateReviewInfo();
        sanitizePersonNamesOnForm(form);
        form.requestSubmit();
      }
    } else {
      if (step !== 0 && step !== 1 && errorElement) {
        errorElement.classList.remove('d-none');
      }
      updateContainerHeight();
    }
  };

  /**
   * Moves the form to the next step with animations.
   */
  function nextStep() {
    const currentElement = document.getElementById('step-' + currentStep);
    const nextElement = document.getElementById('step-' + (currentStep + 1));

    if (!nextElement) return;

    currentElement.classList.add('animate-out');

    var done = false;
    var fallbackTimer;

    function finishStepTransition() {
      if (done) return;
      done = true;
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
      currentElement.removeEventListener('transitionend', finishStepTransition);

      currentElement.style.visibility = 'hidden';
      currentElement.classList.remove('active', 'animate-out');

      nextElement.style.visibility = 'visible';
      nextElement.classList.add('active');
      currentStep++;

      if (currentStep === 5) {
        ensureMeetingSchedulerInit();
      } else {
        updateContainerHeight();
      }

      const input = nextElement.querySelector('input:not([type="hidden"]), select, textarea');
      if (input) input.focus();

      if (currentStep === totalSteps - 1) {
        populateReviewInfo();
      }
    }

    fallbackTimer = window.setTimeout(finishStepTransition, 550);
    currentElement.addEventListener('transitionend', finishStepTransition);
  }

  /**
   * Adjusts the height of the form container to match the active step.
   */
  function updateContainerHeight() {
    const container = document.querySelector('.form-container');
    const activeStep = document.querySelector('.form-step.active');
    if (container && activeStep) {
      container.style.height = 'auto';
      var height = activeStep.offsetHeight;
      var extra = 48;
      container.style.height = (height + extra) + 'px';
    }
  }

  /**
   * Populates the Review step with user inputs.
   */
  function populateReviewInfo() {
    var form = getForm();
    if (!form) return;

    const reviewContainer = document.getElementById('review-info');
    if (!reviewContainer) return;

    const i18n = (typeof window !== 'undefined' && window.i18n) ? window.i18n : null;
    const labels = {
      brideName: i18n && i18n.t ? i18n.t('form.review.labels.brideName', "Bride's Name") : "Bride's Name",
      groomName: i18n && i18n.t ? i18n.t('form.review.labels.groomName', "Groom's Name") : "Groom's Name",
      weddingType: i18n && i18n.t ? i18n.t('form.review.labels.weddingType', 'Wedding Type') : 'Wedding Type',
      budget: i18n && i18n.t ? i18n.t('form.review.labels.budget', 'Budget') : 'Budget',
      email: i18n && i18n.t ? i18n.t('form.review.labels.email', 'Email') : 'Email',
      meetingDateTime: i18n && i18n.t ? i18n.t('form.review.labels.meetingDateTime', 'Meeting') : 'Meeting',
      additionalInfo: i18n && i18n.t ? i18n.t('form.review.labels.additionalInfo', 'Additional Information') : 'Additional Information'
    };

    const brideName = sanitizePersonName((form.querySelector('input[name="bride_name"]') || {}).value);
    const groomName = sanitizePersonName((form.querySelector('input[name="groom_name"]') || {}).value);
    const weddingTypeEl = form.querySelector('input[name="wedding_type"]:checked');
    let weddingType = 'N/A';
    if (weddingTypeEl) {
      const weddingTypeKeyMap = {
        'Beach Wedding': 'form.step2.beachWedding',
        'Garden Wedding': 'form.step2.gardenWedding',
        'Destination Wedding': 'form.step2.destinationWedding'
      };
      const key = weddingTypeKeyMap[weddingTypeEl.value];
      if (i18n && i18n.t && key) {
        weddingType = i18n.t(key, weddingTypeEl.value);
      } else {
        weddingType = weddingTypeEl.value;
      }
    }
    const budgetEl = form.querySelector('input[name="budget"]:checked');
    let budget = 'N/A';
    if (budgetEl) {
      const budgetKeyMap = { A: 'form.step3.budget1', B: 'form.step3.budget2', C: 'form.step3.budget3', D: 'form.step3.budget4' };
      const key = budgetKeyMap[budgetEl.value];
      if (i18n && i18n.t && key) {
        budget = i18n.t(key, budgetEl.value);
      } else {
        const fallbackLabels = { A: 'Under $5,000', B: '$5,000 - $10,000', C: '$10,000 - $20,000', D: 'Above $20,000' };
        budget = fallbackLabels[budgetEl.value] || budgetEl.value;
      }
    }
    const email = (form.querySelector('input[name="email"]') || {}).value || 'N/A';
    const meetingDateTime =
      window.MeetingScheduler && window.MeetingScheduler.getFormattedDateTime
        ? window.MeetingScheduler.getFormattedDateTime()
        : 'N/A';
    const additionalInfo = (form.querySelector('textarea[name="additional_info"]') || {}).value.trim() || 'N/A';

    reviewContainer.innerHTML =
      '<p><strong>' + escapeHtml(labels.brideName) + ':</strong> ' + escapeHtml(brideName) + '</p>' +
      '<p><strong>' + escapeHtml(labels.groomName) + ':</strong> ' + escapeHtml(groomName) + '</p>' +
      '<p><strong>' + escapeHtml(labels.weddingType) + ':</strong> ' + escapeHtml(weddingType) + '</p>' +
      '<p><strong>' + escapeHtml(labels.budget) + ':</strong> ' + escapeHtml(budget) + '</p>' +
      '<p><strong>' + escapeHtml(labels.email) + ':</strong> ' + escapeHtml(email) + '</p>' +
      '<p><strong>' + escapeHtml(labels.meetingDateTime) + ':</strong> ' + escapeHtml(meetingDateTime) + '</p>' +
      '<p><strong>' + escapeHtml(labels.additionalInfo) + ':</strong> ' + escapeHtml(additionalInfo) + '</p>';

    updateContainerHeight();
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function initForm() {
    var form = getForm();
    if (!form) return;

    currentStep = 0;
    document.querySelectorAll('.form-step').forEach(function (step, index) {
      var isFirst = index === 0;
      step.classList.toggle('active', isFirst);
      step.style.visibility = isFirst ? 'visible' : 'hidden';
      step.classList.remove('animate-out');
    });

    updateContainerHeight();
    bindPersonNameInputs();

    if (form.dataset.formSteperBound === 'true') return;
    form.dataset.formSteperBound = 'true';

    form.addEventListener('submit', function () {
      sanitizePersonNamesOnForm(form);
    });

    form.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      if (e.target && e.target.tagName === 'TEXTAREA') return;
      e.preventDefault();
      validateAndNextStep(currentStep);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initForm);
  } else {
    initForm();
  }

  document.addEventListener('arts/barba/transition/end', initForm);

  window.addEventListener('resize', updateContainerHeight);

  window.addEventListener('i18n:languageChange', function () {
    if (currentStep === totalSteps - 1) {
      populateReviewInfo();
    }
    if (currentStep === 5 && window.MeetingScheduler) {
      window.MeetingScheduler.refresh();
    }
  });
})();
