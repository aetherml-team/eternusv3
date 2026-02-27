/**
 * Gallery Randomizer – Fer & Ricky
 * For this page the gallery uses a named-area CSS grid (A, B, C…).
 * We neutralize the named areas and then shuffle the DOM order so the gallery
 * is randomized even on the very first route entry (Barba/AJAX).
 */
(function () {
  function fisherYatesShuffle(items) {
    var arr = items.slice();
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function randomizeOnce() {
    var container = document.querySelector('.grid_gallery_container');
    if (!container) return false;

    var items = Array.from(container.children);
    if (items.length < 2) return false;

    // 1) Neutralize named grid-template-areas so DOM order controls layout
    var styleTag = document.getElementById('grid-layout-styles');
    if (styleTag) {
      styleTag.textContent = '\n        @media screen and (min-width: 1024px) {\n          .grid_gallery_container {\n            display: grid !important;\n            grid-template-columns: repeat(4, 1fr) !important;\n            grid-auto-rows: 320px !important;\n            grid-template-areas: none !important;\n          }\n          .grid_gallery_container .item {\n            grid-area: auto !important;\n          }\n        }\n      ';
    }

    // Clear any inline gridArea that might have been set previously
    items.forEach(function (item) {
      item.style.gridArea = '';
    });

    // 2) Shuffle DOM order so images appear in random sequence
    var shuffled = fisherYatesShuffle(items);
    shuffled.forEach(function (item) {
      container.appendChild(item);
    });

    return true;
  }

  // Poll until the gallery is present in the DOM, then randomize once.
  (function waitForGalleryAndRandomize() {
    if (randomizeOnce()) return;
    setTimeout(waitForGalleryAndRandomize, 100);
  })();
})();