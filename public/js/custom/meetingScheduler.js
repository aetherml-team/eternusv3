/**
 * Inline meeting calendar + time slots for contact forms (index grid + wizard step 5).
 * Loads availability from Calendly via /api/calendly/availability when configured.
 */
(function () {
  const TIMEZONE = 'America/Mexico_City';
  const FALLBACK_TIME_SLOTS = ['10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];
  const BUFFER_MS = 60 * 60 * 1000;

  let viewYear;
  let viewMonth;
  let selectedDate = null;
  let selectedTime = null;
  let selectedSlotUtc = null;
  let initialized = false;
  let calendlyConfigured = null;
  let monthSlotsCache = {};
  let monthSlotsKey = '';
  let daySlots = [];
  let slotsLoading = false;
  let slotsError = false;

  function getLocale() {
    const lang = window.i18n && window.i18n.currentLang ? window.i18n.currentLang : 'en';
    return lang === 'es' ? 'es-MX' : 'en-US';
  }

  function t(key, fallback) {
    return window.i18n && window.i18n.t ? window.i18n.t(key, fallback) : fallback;
  }

  function todayParts() {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());
    const get = (type) => parts.find((p) => p.type === type).value;
    return {
      year: parseInt(get('year'), 10),
      month: parseInt(get('month'), 10),
      day: parseInt(get('day'), 10),
    };
  }

  function dateKey(y, m, d) {
    return y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0');
  }

  function parseDateKey(key) {
    const [y, m, d] = key.split('-').map(Number);
    return { year: y, month: m, day: d };
  }

  function isPastDate(y, m, d) {
    const t = todayParts();
    if (y < t.year) return true;
    if (y === t.year && m < t.month) return true;
    if (y === t.year && m === t.month && d < t.day) return true;
    return false;
  }

  function isToday(y, m, d) {
    const t = todayParts();
    return y === t.year && m === t.month && d === t.day;
  }

  function slotDateTime(dateKeyStr, timeStr) {
    const { year, month, day } = parseDateKey(dateKeyStr);
    const [hh, mm] = timeStr.split(':').map(Number);
    const utcGuess = Date.UTC(year, month - 1, day, hh, mm);
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    let best = utcGuess;
    for (let offset = -16; offset <= 16; offset++) {
      const candidate = utcGuess + offset * 60 * 60 * 1000;
      const parts = formatter.formatToParts(new Date(candidate));
      const get = (type) => parseInt(parts.find((p) => p.type === type).value, 10);
      if (
        get('year') === year &&
        get('month') === month &&
        get('day') === day &&
        get('hour') === hh &&
        get('minute') === mm
      ) {
        best = candidate;
        break;
      }
    }
    return new Date(best);
  }

  function isFallbackSlotAvailable(dateKeyStr, timeStr) {
    if (!dateKeyStr) return false;
    const slot = slotDateTime(dateKeyStr, timeStr);
    return slot.getTime() >= Date.now() + BUFFER_MS;
  }

  function monthCacheId(year, monthIndex) {
    return year + '-' + String(monthIndex + 1).padStart(2, '0');
  }

  function buildFallbackDaySlots(dateKeyStr) {
    return FALLBACK_TIME_SLOTS.filter(function (time) {
      return isFallbackSlotAvailable(dateKeyStr, time);
    }).map(function (time) {
      return {
        start_time_utc: slotDateTime(dateKeyStr, time).toISOString(),
        label: time,
      };
    });
  }

  function finishDaySlots(slots) {
    renderTimeSlots();
    return slots;
  }

  function fetchMonthAvailability(year, monthIndex) {
    const key = monthCacheId(year, monthIndex);
    if (monthSlotsKey === key) {
      return Promise.resolve(monthSlotsCache);
    }
    return fetch('/api/calendly/availability?month=' + encodeURIComponent(key))
      .then(function (res) {
        return res.json().then(function (data) {
          if (res.status === 503 || data.configured === false) {
            calendlyConfigured = false;
            monthSlotsCache = {};
            monthSlotsKey = key;
            return monthSlotsCache;
          }
          if (!res.ok) {
            throw new Error(data.error || 'Availability request failed');
          }
          calendlyConfigured = true;
          monthSlotsCache = data.by_date || {};
          monthSlotsKey = key;
          return monthSlotsCache;
        });
      })
      .catch(function () {
        // Month prefetch failed; day-level fetches may still work.
        monthSlotsCache = {};
        monthSlotsKey = key;
        return monthSlotsCache;
      });
  }

  function fetchDaySlots(dateKeyStr) {
    if (calendlyConfigured === false) {
      daySlots = buildFallbackDaySlots(dateKeyStr);
      slotsLoading = false;
      slotsError = false;
      return Promise.resolve(daySlots).then(finishDaySlots);
    }

    slotsLoading = true;
    slotsError = false;
    renderTimeSlots();

    return fetch('/api/calendly/availability?date=' + encodeURIComponent(dateKeyStr))
      .then(function (res) {
        return res.json().then(function (data) {
          slotsLoading = false;
          if (res.status === 503 || data.configured === false) {
            calendlyConfigured = false;
            daySlots = buildFallbackDaySlots(dateKeyStr);
            return daySlots;
          }
          if (!res.ok) {
            slotsError = true;
            daySlots = [];
            return daySlots;
          }
          calendlyConfigured = true;
          daySlots = data.slots || [];
          return daySlots;
        });
      })
      .catch(function () {
        slotsLoading = false;
        slotsError = true;
        daySlots = buildFallbackDaySlots(dateKeyStr);
        return daySlots;
      })
      .then(finishDaySlots);
  }

  function hasAvailableSlots(dateKeyStr) {
    if (calendlyConfigured === true) {
      const slots = monthSlotsCache[dateKeyStr];
      return Array.isArray(slots) && slots.length > 0;
    }
    return FALLBACK_TIME_SLOTS.some(function (time) {
      return isFallbackSlotAvailable(dateKeyStr, time);
    });
  }

  function getActiveForm() {
    return document.getElementById('contactForm') || document.getElementById('multiStepForm');
  }

  function syncHiddenInputs() {
    const form = getActiveForm();
    if (!form) return;
    const dateInput = form.querySelector('input[name="meeting_date"]');
    const timeInput = form.querySelector('input[name="meeting_time"]');
    const utcInput = form.querySelector('input[name="meeting_start_utc"]');
    if (dateInput) dateInput.value = selectedDate || '';
    if (timeInput) timeInput.value = selectedTime || '';
    if (utcInput) utcInput.value = selectedSlotUtc || '';
  }

  function notifyChange() {
    document.dispatchEvent(new CustomEvent('meeting-scheduler:change'));
  }

  function getTimeZoneDisplay() {
    const locale = getLocale();
    const date = new Date();
    let name = 'Mexico City';
    let offset = '';
    try {
      const nameParts = new Intl.DateTimeFormat(locale, {
        timeZone: TIMEZONE,
        timeZoneName: 'long',
      }).formatToParts(date);
      const tzName = nameParts.find(function (p) {
        return p.type === 'timeZoneName';
      });
      if (tzName && tzName.value) name = tzName.value;

      const offsetParts = new Intl.DateTimeFormat(locale, {
        timeZone: TIMEZONE,
        timeZoneName: 'shortOffset',
      }).formatToParts(date);
      const tzOffset = offsetParts.find(function (p) {
        return p.type === 'timeZoneName';
      });
      if (tzOffset && tzOffset.value) offset = ' (' + tzOffset.value + ')';
    } catch (e) {
      /* keep defaults */
    }
    return name + offset;
  }

  function updateTimezoneLabel() {
    const el = document.getElementById('meeting-timezone-label');
    if (!el) return;
    const zone = getTimeZoneDisplay();
    const template = t('form.stepMeeting.timeZone', 'Times shown in {zone}');
    el.textContent = template.replace('{zone}', zone);
  }

  function updateDateDisplay() {
    const el = document.getElementById('meeting-date-display');
    if (!el) return;
    if (!selectedDate) {
      el.textContent = '';
      el.classList.add('d-none');
      return;
    }
    const { year, month, day } = parseDateKey(selectedDate);
    const date = new Date(year, month - 1, day);
    const formatted = new Intl.DateTimeFormat(getLocale(), {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
    const label = t('form.stepMeeting.selectedDate', 'Selected:');
    el.textContent = label + ' ' + formatted;
    el.classList.remove('d-none');
  }

  function renderTimeSlots() {
    const container = document.getElementById('meeting-time-slots');
    if (!container) return;
    container.innerHTML = '';

    if (!selectedDate) {
      const hint = document.createElement('p');
      hint.className = 'meeting-scheduler__hint text-muted small mb-0';
      hint.setAttribute('data-i18n', 'form.stepMeeting.selectDateHint');
      hint.textContent = t('form.stepMeeting.selectDateHint', 'Select a date to see available times.');
      container.appendChild(hint);
      return;
    }

    if (slotsLoading) {
      const loading = document.createElement('p');
      loading.className = 'meeting-scheduler__hint text-muted small mb-0';
      loading.setAttribute('data-i18n', 'form.stepMeeting.loadingSlots');
      loading.textContent = t('form.stepMeeting.loadingSlots', 'Loading available times…');
      container.appendChild(loading);
      return;
    }

    if (slotsError && daySlots.length === 0) {
      const err = document.createElement('p');
      err.className = 'meeting-scheduler__hint text-danger small mb-0';
      err.setAttribute('data-i18n', 'form.stepMeeting.loadError');
      err.textContent = t(
        'form.stepMeeting.loadError',
        'Could not load available times. Please try again.'
      );
      container.appendChild(err);
      return;
    }

    const grid = document.createElement('div');
    grid.className = 'meeting-scheduler__slots meeting-scheduler__slots--grid';
    let hasSlot = false;

    daySlots.forEach(function (slot) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'meeting-scheduler__slot';
      btn.textContent = slot.label;
      hasSlot = true;
      if (selectedSlotUtc === slot.start_time_utc) {
        btn.classList.add('meeting-scheduler__slot--selected');
      }
      btn.addEventListener('click', function () {
        selectedTime = slot.label;
        selectedSlotUtc = slot.start_time_utc;
        syncHiddenInputs();
        renderTimeSlots();
        notifyChange();
      });
      grid.appendChild(btn);
    });

    container.appendChild(grid);

    if (!hasSlot) {
      const noSlots = document.createElement('p');
      noSlots.className = 'meeting-scheduler__hint text-muted small mt-2 mb-0';
      noSlots.setAttribute('data-i18n', 'form.stepMeeting.noSlots');
      noSlots.textContent = t(
        'form.stepMeeting.noSlots',
        'No times available for this day. Please choose another date.'
      );
      container.appendChild(noSlots);
      selectedTime = null;
      selectedSlotUtc = null;
      selectedDate = null;
      syncHiddenInputs();
      updateDateDisplay();
      renderCalendar();
    }
  }

  function renderCalendar() {
    const mount = document.getElementById('meeting-calendar');
    if (!mount) return;

    const locale = getLocale();
    const firstOfMonth = new Date(viewYear, viewMonth, 1);
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const startWeekday = firstOfMonth.getDay();
    const monthParts = new Intl.DateTimeFormat(locale, { month: 'long' }).format(firstOfMonth);
    const yearPart = String(viewYear);
    const weekdays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(2024, 0, i);
      weekdays.push(new Intl.DateTimeFormat(locale, { weekday: 'narrow' }).format(d));
    }

    mount.innerHTML =
      '<div class="meeting-scheduler meeting-scheduler--luxury">' +
      '<div class="meeting-scheduler__header">' +
      '<button type="button" class="meeting-scheduler__nav" data-nav="prev" aria-label="Previous month">' +
      '<span class="meeting-scheduler__nav-icon" aria-hidden="true"></span></button>' +
      '<div class="meeting-scheduler__month-wrap">' +
      '<span class="meeting-scheduler__month">' + monthParts + '</span>' +
      '<span class="meeting-scheduler__year">' + yearPart + '</span>' +
      '</div>' +
      '<button type="button" class="meeting-scheduler__nav" data-nav="next" aria-label="Next month">' +
      '<span class="meeting-scheduler__nav-icon meeting-scheduler__nav-icon--next" aria-hidden="true"></span></button>' +
      '</div>' +
      '<div class="meeting-scheduler__weekdays">' +
      weekdays.map(function (w) { return '<span class="meeting-scheduler__weekday">' + w + '</span>'; }).join('') +
      '</div>' +
      '<div class="meeting-scheduler__days"></div>' +
      '</div>';

    const daysEl = mount.querySelector('.meeting-scheduler__days');
    for (let i = 0; i < startWeekday; i++) {
      const pad = document.createElement('span');
      pad.className = 'meeting-scheduler__day meeting-scheduler__day--empty';
      daysEl.appendChild(pad);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const key = dateKey(viewYear, viewMonth + 1, day);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'meeting-scheduler__day';
      btn.textContent = String(day);
      const past = isPastDate(viewYear, viewMonth + 1, day);
      const unavailable = past || !hasAvailableSlots(key);
      if (unavailable) {
        btn.disabled = true;
        btn.classList.add('meeting-scheduler__day--disabled');
        if (past && isToday(viewYear, viewMonth + 1, day)) {
          btn.classList.add('meeting-scheduler__day--today');
        }
      } else {
        if (selectedDate === key) {
          btn.classList.add('meeting-scheduler__day--selected');
        }
        if (isToday(viewYear, viewMonth + 1, day)) {
          btn.classList.add('meeting-scheduler__day--today');
        }
        btn.addEventListener('click', function () {
          selectedDate = key;
          selectedTime = null;
          selectedSlotUtc = null;
          syncHiddenInputs();
          updateDateDisplay();
          renderCalendar();
          slotsLoading = true;
          slotsError = false;
          renderTimeSlots();
          fetchDaySlots(key);
          notifyChange();
        });
      }
      daysEl.appendChild(btn);
    }

    mount.querySelector('[data-nav="prev"]').addEventListener('click', function () {
      viewMonth -= 1;
      if (viewMonth < 0) {
        viewMonth = 11;
        viewYear -= 1;
      }
      loadMonthAndRender();
    });

    mount.querySelector('[data-nav="next"]').addEventListener('click', function () {
      viewMonth += 1;
      if (viewMonth > 11) {
        viewMonth = 0;
        viewYear += 1;
      }
      loadMonthAndRender();
    });
  }

  function loadMonthAndRender() {
    fetchMonthAvailability(viewYear, viewMonth).then(function () {
      renderCalendar();
      if (selectedDate) {
        fetchDaySlots(selectedDate);
      }
    });
  }

  function isMounted() {
    const mount = document.getElementById('meeting-calendar');
    return !!(mount && mount.querySelector('.meeting-scheduler'));
  }

  function init(options) {
    const force = !!(options && options.force);
    if (initialized && isMounted() && !force) {
      return;
    }

    const t = todayParts();
    viewYear = t.year;
    viewMonth = t.month - 1;
    if (force || !initialized) {
      selectedDate = null;
      selectedTime = null;
      selectedSlotUtc = null;
      daySlots = [];
      monthSlotsCache = {};
      monthSlotsKey = '';
    }
    syncHiddenInputs();
    updateDateDisplay();
    updateTimezoneLabel();
    loadMonthAndRender();
    initialized = true;
  }

  function initIfNeeded() {
    if (!initialized || !isMounted()) {
      init();
    }
  }

  function refreshLocale() {
    if (!initialized || !isMounted()) {
      init();
      return;
    }
    updateDateDisplay();
    updateTimezoneLabel();
    renderCalendar();
    renderTimeSlots();
  }

  function refresh() {
    monthSlotsCache = {};
    monthSlotsKey = '';
    selectedDate = null;
    selectedTime = null;
    selectedSlotUtc = null;
    daySlots = [];
    syncHiddenInputs();
    updateDateDisplay();
    if (!initialized || !isMounted()) {
      init({ force: true });
      return;
    }
    loadMonthAndRender();
    renderTimeSlots();
  }

  function isValid() {
    if (!selectedDate || !selectedTime || !selectedSlotUtc) return false;
    if (calendlyConfigured === false) {
      return isFallbackSlotAvailable(selectedDate, selectedTime);
    }
    return daySlots.some(function (slot) {
      return slot.start_time_utc === selectedSlotUtc;
    });
  }

  function getFormattedDateTime() {
    if (!selectedDate || !selectedTime) return 'N/A';
    const { year, month, day } = parseDateKey(selectedDate);
    const date = new Date(year, month - 1, day);
    const dateStr = new Intl.DateTimeFormat(getLocale(), {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
    return dateStr + ' — ' + selectedTime;
  }

  window.MeetingScheduler = {
    init: init,
    initIfNeeded: initIfNeeded,
    isInitialized: function () {
      return initialized && isMounted();
    },
    refresh: refresh,
    refreshLocale: refreshLocale,
    sync: syncHiddenInputs,
    isValid: isValid,
    getFormattedDateTime: getFormattedDateTime,
    TIME_SLOTS: FALLBACK_TIME_SLOTS,
  };

  window.addEventListener('i18n:languageChange', function () {
    if (initialized) refreshLocale();
  });

  function tryInitIfActiveStep() {
    if (document.getElementById('contactForm') && document.getElementById('meeting-calendar')) {
      initIfNeeded();
      return;
    }
    var step = document.getElementById('step-5');
    if (step && step.classList.contains('active') && document.getElementById('meeting-calendar')) {
      initIfNeeded();
    }
  }

  document.addEventListener('arts/barba/transition/end', tryInitIfActiveStep);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryInitIfActiveStep);
  } else {
    tryInitIfActiveStep();
  }
})();
