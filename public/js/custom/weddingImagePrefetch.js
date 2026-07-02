/**
 * Tiered wedding image prefetch: index intent + in-page priority loading.
 */
(function () {
  const prefetched = new Set();
  const queue = [];
  let active = 0;
  const MAX_CONCURRENT = 3;
  const PRIORITY_COUNT = 6;
  const WEDDING_PATH_RE = /wedding-details-|details-sofi-armando/i;

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

  function hydrateWeddingPage(root) {
    const scope = root || getPageRoot();
    const imgs = Array.prototype.slice.call(scope.querySelectorAll('img.lazy[data-src]'));
    if (!imgs.length) return;

    const slow = isSlowConnection();
    const moderate = isModerateConnection();
    const priorityLimit = slow ? 2 : moderate ? 4 : PRIORITY_COUNT;

    imgs.slice(0, priorityLimit).forEach(loadLazyElement);

    if (slow) return;

    imgs.slice(priorityLimit).forEach(function (img) {
      enqueue(img.getAttribute('data-src'));
    });
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

    const docLimit = isModerateConnection() ? 8 : 14;

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
      { rootMargin: '240px', threshold: 0.15 }
    );

    links.forEach(function (link) {
      observer.observe(link);
    });
  }

  function init(scope) {
    const root = scope || getPageRoot();

    if (isWeddingPage()) {
      hydrateWeddingPage(root);
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
