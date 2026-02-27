/**
 * Gallery Randomizer
 * Shuffles the CSS grid-area assignments of .grid_gallery_container items on each page load.
 * Add this <script> tag to your index.html just before the closing </body> tag,
 * or include this file with: <script src="gallery-randomizer.js"></script>
 */
(function () {
  function randomizeGallery() {
    const container = document.querySelector('.grid_gallery_container');
    if (!container) return;

    const items = Array.from(container.children);
    if (!items.length) return;

    // Collect the original grid-area letter from each item's class (A, B, C…)
    const areas = items
      .map(el => [...el.classList].find(c => /^[A-Z]$/.test(c)))
      .filter(Boolean);

    // Fisher-Yates shuffle
    const shuffled = [...areas];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Override grid-area inline style so each item lands in a random cell
    items.forEach((item, i) => {
      if (shuffled[i]) item.style.gridArea = shuffled[i];
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', randomizeGallery);
  } else {
    randomizeGallery();
  }
})();