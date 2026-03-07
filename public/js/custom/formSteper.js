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

    const brideName = (form.querySelector('input[name="bride_name"]') || {}).value || '';
    const groomName = (form.querySelector('input[name="groom_name"]') || {}).value || '';
    const weddingTypeEl = form.querySelector('input[name="wedding_type"]:checked');
    const weddingType = weddingTypeEl ? weddingTypeEl.value : 'N/A';
    const budgetEl = form.querySelector('input[name="budget"]:checked');
    const budgetLabels = { A: 'Under $5,000', B: '$5,000 - $10,000', C: '$10,000 - $20,000', D: 'Above $20,000' };
    const budget = budgetEl ? (budgetLabels[budgetEl.value] || budgetEl.value) : 'N/A';
    const email = (form.querySelector('input[name="email"]') || {}).value || 'N/A';
    const additionalInfo = (form.querySelector('textarea[name="additional_info"]') || {}).value.trim() || 'N/A';

    reviewContainer.innerHTML =
      '<p><strong>Bride\'s Name:</strong> ' + escapeHtml(brideName) + '</p>' +
      '<p><strong>Groom\'s Name:</strong> ' + escapeHtml(groomName) + '</p>' +
      '<p><strong>Wedding Type:</strong> ' + escapeHtml(weddingType) + '</p>' +
      '<p><strong>Budget:</strong> ' + escapeHtml(budget) + '</p>' +
      '<p><strong>Email:</strong> ' + escapeHtml(email) + '</p>' +
      '<p><strong>Additional Information:</strong> ' + escapeHtml(additionalInfo) + '</p>';

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
})();
