/**
 * Wedding films chapter — scroll scrub + pointer parallax (Fer-Ricky template).
 * Depends on GSAP + ScrollTrigger (vendor.js).
 */
(function () {
  'use strict';

  var EASE_LUX = 'power3.out';
  var SCRUB_SLOW = 2.4;
  var REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE_POINTER = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function init() {
    if (REDUCED_MOTION || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      return;
    }

    var root = document.querySelector('.section-wedding-films');
    if (!root) return;

    var hero = root.querySelector('.section-wedding-film--hero');
    var heroImage = hero && hero.querySelector('.section-wedding-film__image');
    var pair = root.querySelector('.section-wedding-films__pair');
    var shells = root.querySelectorAll('.section-wedding-film__shell');
    var secondaryShells = Array.prototype.slice.call(shells, 1);

    if (hero && heroImage) {
      gsap.fromTo(
        heroImage,
        { scale: 1.05, yPercent: -2 },
        {
          scale: 1,
          yPercent: 2,
          ease: 'none',
          scrollTrigger: {
            trigger: hero,
            start: 'top bottom',
            end: 'bottom top',
            scrub: SCRUB_SLOW
          }
        }
      );
    }

    if (pair && secondaryShells.length) {
      gsap.from(secondaryShells, {
        y: 36,
        autoAlpha: 0,
        duration: 1.15,
        stagger: 0.2,
        ease: EASE_LUX,
        scrollTrigger: {
          trigger: pair,
          start: 'top 88%',
          once: true
        }
      });
    }

    if (FINE_POINTER && hero && heroImage) {
      var panX = gsap.quickTo(heroImage, 'xPercent', { duration: 1.6, ease: EASE_LUX });
      var panY = gsap.quickTo(heroImage, 'yPercent', { duration: 1.6, ease: EASE_LUX });

      hero.addEventListener('mousemove', function (event) {
        var rect = hero.getBoundingClientRect();
        var nx = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
        var ny = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
        panX(nx * 0.45);
        panY(ny * 0.45);
      });

      hero.addEventListener('mouseleave', function () {
        panX(0);
        panY(0);
      });
    }
  }

  function scheduleInit() {
    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.refresh();
    }
    init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      window.setTimeout(scheduleInit, 350);
    });
  } else {
    window.setTimeout(scheduleInit, 350);
  }
})();
