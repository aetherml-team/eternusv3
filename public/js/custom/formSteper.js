/**
 * Multi-step form handler for contact-full-form.html
 */
(function () {
  let currentStep = 0;
  const totalSteps = 7; // step-0 to step-6

  function getForm() {
    return document.getElementById('multiStepForm');
  }

  /**
   * Validates the current step and moves to the next step if valid.
   * Exposed globally so onclick handlers work.
   */
  window.validateAndNextStep = function (step) {
    var form = getForm();
    if (!form) return;

    const stepElement = document.getElementById('step-' + step);
    const errorElement = document.getElementById('error-step-' + step);
    if (!stepElement) return;

    var isValid = true;
    const requiredInputs = stepElement.querySelectorAll('[required]');

    if (requiredInputs.length > 0) {
      const radioInputs = stepElement.querySelectorAll('input[type="radio"][required]');
      if (radioInputs.length > 0) {
        const name = radioInputs[0].name;
        isValid = stepElement.querySelector('input[name="' + name + '"]:checked') !== null;
      } else {
        isValid = Array.from(requiredInputs).every(function (input) {
          return input.value.trim() !== '';
        });
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

    if (isValid) {
      if (errorElement) errorElement.classList.add('d-none');
      if (step < totalSteps - 1) {
        nextStep();
      } else {
        populateReviewInfo();
        form.requestSubmit();
      }
    } else {
      if (errorElement) errorElement.classList.remove('d-none');
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
    function handleTransitionEnd() {
      if (done) return;
      done = true;
      currentElement.removeEventListener('transitionend', handleTransitionEnd);

      currentElement.style.visibility = 'hidden';
      currentElement.classList.remove('active', 'animate-out');

      nextElement.style.visibility = 'visible';
      nextElement.classList.add('active');
      currentStep++;

      updateContainerHeight();

      const input = nextElement.querySelector('input, select, textarea');
      if (input) input.focus();

      if (currentStep === totalSteps - 1) {
        populateReviewInfo();
      }
    }

    currentElement.addEventListener('transitionend', handleTransitionEnd);
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
      var extra = 48; /* room for Next button so it is not clipped */
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

    // Localized labels for the review step
    const i18n = (typeof window !== 'undefined' && window.i18n) ? window.i18n : null;
    const labels = {
      brideName: i18n && i18n.t ? i18n.t('form.review.labels.brideName', "Bride's Name") : "Bride's Name",
      groomName: i18n && i18n.t ? i18n.t('form.review.labels.groomName', "Groom's Name") : "Groom's Name",
      weddingType: i18n && i18n.t ? i18n.t('form.review.labels.weddingType', 'Wedding Type') : 'Wedding Type',
      budget: i18n && i18n.t ? i18n.t('form.review.labels.budget', 'Budget') : 'Budget',
      email: i18n && i18n.t ? i18n.t('form.review.labels.email', 'Email') : 'Email',
      additionalInfo: i18n && i18n.t ? i18n.t('form.review.labels.additionalInfo', 'Additional Information') : 'Additional Information'
    };

    const brideName = (form.querySelector('input[name="bride_name"]') || {}).value || '';
    const groomName = (form.querySelector('input[name="groom_name"]') || {}).value || '';
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
    const additionalInfo = (form.querySelector('textarea[name="additional_info"]') || {}).value.trim() || 'N/A';

    reviewContainer.innerHTML =
      '<p><strong>' + escapeHtml(labels.brideName) + ':</strong> ' + escapeHtml(brideName) + '</p>' +
      '<p><strong>' + escapeHtml(labels.groomName) + ':</strong> ' + escapeHtml(groomName) + '</p>' +
      '<p><strong>' + escapeHtml(labels.weddingType) + ':</strong> ' + escapeHtml(weddingType) + '</p>' +
      '<p><strong>' + escapeHtml(labels.budget) + ':</strong> ' + escapeHtml(budget) + '</p>' +
      '<p><strong>' + escapeHtml(labels.email) + ':</strong> ' + escapeHtml(email) + '</p>' +
      '<p><strong>' + escapeHtml(labels.additionalInfo) + ':</strong> ' + escapeHtml(additionalInfo) + '</p>';

    updateContainerHeight();
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function initForm() {
    const firstStep = document.getElementById('step-0');
    if (firstStep) {
      firstStep.classList.add('active');
      firstStep.style.visibility = 'visible';
      updateContainerHeight();
    }

    /* Submit current step on Enter (except in textarea where Enter is newline) */
    var form = getForm();
    if (form) {
      form.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        if (e.target && e.target.tagName === 'TEXTAREA') return;
        e.preventDefault();
        validateAndNextStep(currentStep);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initForm);
  } else {
    initForm();
  }

  window.addEventListener('resize', updateContainerHeight);

  /* Re-render review step labels when language is toggled so they obey i18n */
  window.addEventListener('i18n:languageChange', function () {
    if (currentStep === totalSteps - 1) {
      populateReviewInfo();
    }
  });
})();
