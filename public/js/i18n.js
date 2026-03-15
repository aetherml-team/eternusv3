/**
 * Simple i18n (Internationalization) System
 * Handles language switching via URL parameter (?lang=es) and persisted preference (localStorage)
 * Defaults to English if no language is specified
 */

const I18N_STORAGE_KEY = 'eternus-lang';

class i18n {
  constructor() {
    this.currentLang = 'en';
    this.translations = {};
    this.supportedLanguages = ['en', 'es'];
    this._initTimeoutIds = [];
    this._isTranslating = false;
    this._isSwitchingLanguage = false;
    this._pendingTranslateTimer = null;
  }

  _cancelInitTimeouts() {
    this._initTimeoutIds.forEach((id) => clearTimeout(id));
    this._initTimeoutIds = [];
  }

  _translateDOMWithTransition() {
    const root = document.documentElement;
    if (!root) {
      this.translateDOM();
      this._isSwitchingLanguage = false;
      return;
    }
    root.classList.add('i18n-switching');
    requestAnimationFrame(() => {
      this.translateDOM();
      requestAnimationFrame(() => {
        root.classList.remove('i18n-switching');
        this._isSwitchingLanguage = false;
      });
    });
  }

  /**
   * Initialize the i18n system
   * Priority: URL parameter (?lang=es) > saved preference (localStorage) > browser language > English
   */
  async init() {
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');

    if (langParam && this.supportedLanguages.includes(langParam)) {
      this.currentLang = langParam;
      try {
        localStorage.setItem(I18N_STORAGE_KEY, langParam);
      } catch (e) {}
    } else {
      try {
        const saved = localStorage.getItem(I18N_STORAGE_KEY);
        if (saved && this.supportedLanguages.includes(saved)) {
          this.currentLang = saved;
        } else {
          const browserLang = (navigator.language || '').split('-')[0];
          if (this.supportedLanguages.includes(browserLang)) {
            this.currentLang = browserLang;
          }
        }
      } catch (e) {
        const browserLang = (navigator.language || '').split('-')[0];
        if (this.supportedLanguages.includes(browserLang)) {
          this.currentLang = browserLang;
        }
      }
    }

    await this.loadTranslations(this.currentLang);
    if (document.documentElement) {
      document.documentElement.setAttribute('lang', this.currentLang);
    }
  }

  /**
   * Load translation file for a specific language.
   * @param {string} lang - Language code (e.g., 'en', 'es')
   * @returns {Promise<string>} - The language actually loaded (lang or 'en' on fallback)
   */
  async loadTranslations(lang) {
    const basePath = window.location.pathname.replace(/\/[^/]*$/, '') || '/';
    const url = window.location.origin + basePath + '/lang/' + lang + '.json';
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load translations for ${lang}: ${response.status}`);
      }
      this.translations = await response.json();
      console.log(`[i18n] Loaded ${lang} translations:`, Object.keys(this.translations).length, 'keys');
      return lang;
    } catch (error) {
      console.error('[i18n] Error loading translations:', error);
      if (lang !== 'en') {
        await this.loadTranslations('en');
        this.currentLang = 'en';
        return 'en';
      }
      return lang;
    }
  }

  /**
   * Get a translation string
   * @param {string} key - Translation key using dot notation (e.g., 'form.step0.title')
   * @param {*} defaultValue - Default value if key is not found
   * @returns {string} Translated string or default value
   */
  t(key, defaultValue = key) {
    const keys = key.split('.');
    let value = this.translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue;
      }
    }

    return typeof value === 'string' ? value : defaultValue;
  }

  /**
   * Change language dynamically (no page reload).
   * Loads new translations, updates URL, persists preference, and re-translates the whole DOM.
   * @param {string} lang - Language code (e.g. 'en', 'es')
   */
  async setLanguage(lang) {
    if (!this.supportedLanguages.includes(lang)) {
      console.error(`[i18n] Language ${lang} is not supported`);
      return;
    }
    if (lang === this.currentLang) return;

    this._isSwitchingLanguage = true;
    this._cancelInitTimeouts();
    if (this._pendingTranslateTimer) {
      clearTimeout(this._pendingTranslateTimer);
      this._pendingTranslateTimer = null;
    }

    try {
      const loadedLang = await this.loadTranslations(lang);
      if (loadedLang !== lang) {
        console.warn('[i18n] Requested language not loaded; kept current state.');
        return;
      }

      this.currentLang = lang;
      try {
        localStorage.setItem(I18N_STORAGE_KEY, lang);
      } catch (e) {}

      const url = new URL(window.location);
      url.searchParams.set('lang', lang);
      window.history.pushState({ lang }, '', url);

      if (document.documentElement) {
        document.documentElement.setAttribute('lang', lang);
      }

      this._translateDOMWithTransition();
      if (typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new CustomEvent('i18n:languageChange', { detail: { lang } }));
      }
    } finally {
      this._isSwitchingLanguage = false;
    }
  }

  /**
   * Get current language
   * @returns {string} Current language code
   */
  getLang() {
    return this.currentLang;
  }

  /**
   * Translate all elements with data-i18n attribute
   * Usage: <h1 data-i18n="hero.title">Eternus</h1>
   * Or with fallback text: <span data-i18n="form.step0.label">Bride's Name</span>
   */
  translateDOM() {
    if (this._isTranslating) return;
    this._isTranslating = true;
    try {
      this._translateDOM();
    } finally {
      this._isTranslating = false;
    }
  }

  _translateDOM() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const translation = this.t(key);
      const wrapTag = el.getAttribute('data-i18n-wrap');
      const wrapClass = el.getAttribute('data-i18n-wrap-class') || '';

      if (wrapTag) {
        const safe = String(translation)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        const cls = wrapClass ? ' class="' + wrapClass.replace(/"/g, '&quot;') + '"' : '';
        el.innerHTML = '<' + wrapTag + cls + '>' + safe + '</' + wrapTag + '>';
      } else if (el.innerHTML.includes('<') || translation.includes('<')) {
        el.innerHTML = translation;
      } else {
        el.textContent = translation;
      }
    });

    // Handle placeholders
    const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
    placeholderElements.forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      const translation = this.t(key);
      el.placeholder = translation;
    });

    // Handle aria-labels and titles
    const ariaElements = document.querySelectorAll('[data-i18n-aria]');
    ariaElements.forEach((el) => {
      const key = el.getAttribute('data-i18n-aria');
      const translation = this.t(key);
      el.setAttribute('aria-label', translation);
    });

    // Cursor follower labels (custom cursor text, e.g. "Explore Project" / "Explorar proyecto")
    const cursorElements = document.querySelectorAll('[data-i18n-cursor-label]');
    cursorElements.forEach((el) => {
      const key = el.getAttribute('data-i18n-cursor-label');
      const translation = key ? this.t(key) : '';
      const raw = el.getAttribute('data-arts-cursor-follower-target');
      if (!raw || !translation) return;
      try {
        const opts = JSON.parse(raw);
        opts.label = translation;
        el.setAttribute('data-arts-cursor-follower-target', JSON.stringify(opts));
      } catch (e) {
        const escaped = translation.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        const updated = raw.replace(/label:\s*['"]([^'"]*)['"]/, 'label: "' + escaped + '"');
        el.setAttribute('data-arts-cursor-follower-target', updated);
      }
    });

    this._initLangToggle();
  }

  /**
   * Initialize language toggle (EN | ES): set active state and bind click handlers
   */
  _initLangToggle() {
    const container = document.querySelector('.lang-toggle');
    if (!container) return;

    const links = container.querySelectorAll('.lang-toggle__link');
    const current = this.currentLang;

    links.forEach((el) => {
      const lang = el.getAttribute('data-lang');
      if (lang) {
        el.setAttribute('aria-current', lang === current ? 'true' : 'false');
        if (!el._i18nBound) {
          el._i18nBound = true;
          el.addEventListener('click', (e) => {
            e.preventDefault();
            if (lang !== this.currentLang) {
              this.setLanguage(lang);
            }
          });
        }
      }
    });
  }
}

// Create global instance and expose for no-reload switching and post-AJAX translation
const i18nInstance = new i18n();
if (typeof window !== 'undefined') {
  window.i18n = i18nInstance;
}

function onTransitionEnd() {
  if (i18nInstance._isSwitchingLanguage) return;
  i18nInstance.translateDOM();
  setTimeout(function () {
    if (i18nInstance._isSwitchingLanguage) return;
    i18nInstance.translateDOM();
  }, 100);
}
if (typeof document !== 'undefined') {
  document.addEventListener('arts/barba/transition/end', onTransitionEnd);
}

function scheduleInitTranslations() {
  const delays = [50, 200, 500, 1000, 2000];
  delays.forEach((ms) => {
    const id = setTimeout(() => i18nInstance.translateDOM(), ms);
    i18nInstance._initTimeoutIds.push(id);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    i18nInstance.init().then(() => {
      scheduleInitTranslations();
    });
  });
} else {
  i18nInstance.init().then(() => {
    scheduleInitTranslations();
  });
}

// Observe for dynamic content and re-translate (debounced; never during language switch)
var OBSERVER_DEBOUNCE_MS = 180;
if (typeof MutationObserver !== 'undefined') {
  const observer = new MutationObserver(function (mutations) {
    if (i18nInstance._isSwitchingLanguage) return;
    var hasI18nElements = false;
    for (var i = 0; i < mutations.length; i++) {
      var added = mutations[i].addedNodes;
      for (var j = 0; j < added.length; j++) {
        var node = added[j];
        if (node.nodeType !== 1) continue;
        if (node.getAttribute && node.getAttribute('data-i18n')) hasI18nElements = true;
        if (node.querySelectorAll && node.querySelectorAll('[data-i18n]').length > 0) hasI18nElements = true;
      }
    }
    if (!hasI18nElements) return;
    if (i18nInstance._pendingTranslateTimer) clearTimeout(i18nInstance._pendingTranslateTimer);
    i18nInstance._pendingTranslateTimer = setTimeout(function () {
      i18nInstance._pendingTranslateTimer = null;
      if (i18nInstance._isSwitchingLanguage) return;
      i18nInstance.translateDOM();
    }, OBSERVER_DEBOUNCE_MS);
  });
  setTimeout(function () {
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }, 1000);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = i18n;
}
