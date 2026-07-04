/**
 * Tiered wedding image prefetch: index intent + in-page priority loading.
 * On mobile, hydrate gallery images well before they enter the viewport
 * so scrolling does not show empty dark placeholders.
 */
(function () {
  const prefetched = new Set();
  const queue = [];
  let active = 0;
  const MAX_CONCURRENT = 4;
  const PRIORITY_COUNT = 8;
  const WEDDING_PATH_RE = /wedding-details-|details-sofi-armando/i;

  function isTouchDevice() {
    return (
      (typeof ScrollTrigger !== 'undefined' && ScrollTrigger.isTouch === 1) ||
      window.matchMedia('(pointer: coarse)').matches
    );
  }

  function isSlowConnection() {
    const conn = navigator.connection;
    if (!conn) return false;
    if (conn.saveData) return true;
    return conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g';
  }

  function isModerateConnection() {
    const conn = navigator.connection;
    return conn && conn.effectiveType === '3g';
  }

  function resolveUrl(url) {
    if (!url) return '';
    try {
      return new URL(url, window.location.href).href;
    } catch (e) {
      return url;
    }
  }

  function prefetchUrl(url) {
    const resolved = resolveUrl(url);
    if (!resolved || prefetched.has(resolved)) {
      return Promise.resolve();
    }
    prefetched.add(resolved);

    return new Promise(function (resolve) {
      const img = new Image();
      img.decoding = 'async';
      img.onload = function () {
        resolve();
      };
      img.onerror = function () {
        resolve();
      };
      img.src = resolved;
    });
  }

  function runQueue() {
    while (active < MAX_CONCURRENT && queue.length) {
      const url = queue.shift();
      active += 1;
      prefetchUrl(url).finally(function () {
        active -= 1;
        runQueue();
      });
    }
  }

  function enqueue(url) {
    const resolved = resolveUrl(url);
    if (!resolved || prefetched.has(resolved)) return;
    queue.push(resolved);
    runQueue();
  }

  function collectImageUrls(root) {
    const urls = [];
    if (!root) return urls;

    root.querySelectorAll('img[data-src]').forEach(function (img) {
      const src = img.getAttribute('data-src');
      if (src && /\.(webp|jpe?g|png|gif)(\?|$)/i.test(src)) {
        urls.push(src);
      }
    });

    return urls.filter(function (url, index, list) {
      return list.indexOf(url) === index;
    });
  }

  function loadLazyElement(img) {
    if (!img || !img.getAttribute('data-src')) return;

    if (typeof window.LazyLoad !== 'undefined' && typeof window.LazyLoad.load === 'function') {
      window.LazyLoad.load(img);
      return;
    }

    if (app && app.lazy && typeof app.lazy.load === 'function') {
      app.lazy.load(img);
      return;
    }

    img.src = img.getAttribute('data-src');
    img.removeAttribute('data-src');
    img.classList.remove('lazy');
  }

  function getPageRoot() {
    return document.querySelector('[data-barba="container"]') || document.getElementById('page-wrapper') || document;
  }

  function isWeddingPage() {
    return WEDDING_PATH_RE.test(window.location.pathname);
  }

  function leadMarginPx() {
    const vh = window.innerHeight || 800;
    if (isSlowConnection()) return Math.round(vh * 1.25);
    if (isTouchDevice()) return Math.max(2400, Math.round(vh * 3));
    return Math.max(1600, Math.round(vh * 2));
  }

  /**
   * Force-load gallery images as they approach the viewport (DOM hydrate,
   * not only cache prefetch), so mobile scroll never shows empty tiles.
   */
  function observeUpcomingImages(scope) {
    if (typeof IntersectionObserver === 'undefined') return;

    const imgs = scope.querySelectorAll('img.lazy[data-src]');
    if (!imgs.length) return;

    const margin = leadMarginPx();
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          loadLazyElement(entry.target);
          observer.unobserve(entry.target);
        });
      },
      {
        root: null,
        rootMargin: margin + 'px 0px',
        threshold: 0,
      }
    );

    imgs.forEach(function (img) {
      observer.observe(img);
    });
  }

  function hydrateWeddingPage(root) {
    const scope = root || getPageRoot();
    const imgs = Array.prototype.slice.call(scope.querySelectorAll('img.lazy[data-src]'));
    if (!imgs.length) return;

    const slow = isSlowConnection();
    const moderate = isModerateConnection();
    const touch = isTouchDevice();
    const priorityLimit = slow ? 3 : moderate ? 6 : touch ? PRIORITY_COUNT + 2 : PRIORITY_COUNT;

    imgs.slice(0, priorityLimit).forEach(loadLazyElement);

    if (slow) {
      observeUpcomingImages(scope);
      return;
    }

    // Prefetch remaining into cache, and also hydrate via IO well ahead of view.
    imgs.slice(priorityLimit).forEach(function (img) {
      enqueue(img.getAttribute('data-src'));
    });
    observeUpcomingImages(scope);
  }

  /**
   * Index (and other pages): hydrate lazy images ahead of scroll so sections
   * like portfolio / places do not flash empty on mobile.
   */
  function hydrateScrollAhead(root) {
    if (isWeddingPage()) return;
    observeUpcomingImages(root || getPageRoot());
  }

  function getHeroFromLink(link) {
    if (!link) return null;
    const img = link.querySelector('img[data-src]');
    return img ? img.getAttribute('data-src') : null;
  }

  function prefetchFromHref(href) {
    if (!href || !WEDDING_PATH_RE.test(href)) return;

    const link = document.querySelector('a[href="' + href + '"]');
    const hero = getHeroFromLink(link);
    if (hero) {
      enqueue(hero);
    }

    if (isSlowConnection()) return;

    const docLimit = isModerateConnection() ? 8 : isTouchDevice() ? 12 : 14;

    fetch(href, { credentials: 'same-origin' })
      .then(function (res) {
        if (!res.ok) return null;
        return res.text();
      })
      .then(function (html) {
        if (!html) return;
        const doc = new DOMParser().parseFromString(html, 'text/html');
        collectImageUrls(doc).slice(0, docLimit).forEach(enqueue);
      })
      .catch(function (err) {
        console.warn('[weddingImagePrefetch] document prefetch failed:', err);
      });
  }

  function bindIndexCards(scope) {
    const root = scope || getPageRoot();
    const links = root.querySelectorAll('a[href*="wedding-details-"]');

    links.forEach(function (link) {
      if (link.dataset.prefetchBound === 'true') return;
      link.dataset.prefetchBound = 'true';

      const href = link.getAttribute('href');
      let intentStarted = false;

      function onIntent() {
        if (intentStarted) return;
        intentStarted = true;
        prefetchFromHref(href);
      }

      link.addEventListener('mouseenter', onIntent, { passive: true });
      link.addEventListener('touchstart', onIntent, { passive: true });
      link.addEventListener('pointerdown', onIntent, { passive: true });
    });

    if (typeof IntersectionObserver === 'undefined' || isSlowConnection()) return;

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          const link = entry.target;
          const hero = getHeroFromLink(link);
          if (hero) enqueue(hero);
          observer.unobserve(link);
        });
      },
      { rootMargin: '400px', threshold: 0.1 }
    );

    links.forEach(function (link) {
      observer.observe(link);
    });
  }

  function init(scope) {
    const root = scope || getPageRoot();

    if (isWeddingPage()) {
      hydrateWeddingPage(root);
    } else {
      hydrateScrollAhead(root);
    }

    bindIndexCards(root);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      init();
    });
  } else {
    init();
  }

  document.addEventListener('arts/barba/transition/end', function () {
    window.requestAnimationFrame(function () {
      init();
    });
  });

  window.WeddingImagePrefetch = {
    init: init,
    enqueue: enqueue,
    prefetchUrl: prefetchUrl,
    hydrateWeddingPage: hydrateWeddingPage,
  };
})();
