/**
 * Gallery Randomizer
 * Shuffles gallery images on every page load.
 *
 * For named-area grids (e.g. Fer & Ricky): removes the CSS grid-template-areas
 * rule and switches to grid-auto-rows, then shuffles the DOM order.
 * For auto-flow grids (e.g. Juli & Ty): shuffles the DOM order directly.
 *
 * Both strategies end up using DOM shuffling so the result is consistent
 * from the very first page visit.
 *
 * Usage: <script src="js/randomnizer/gallery-randomnizer.js"></script>
 */
(function () {

    function fisherYatesShuffle(items) {
      const arr = [...items];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }
  
    function shuffleDOM(container, items) {
      const shuffled = fisherYatesShuffle(items);
      // Append in shuffled order - this re-orders them in the DOM
      shuffled.forEach(item => container.appendChild(item));
    }
  
    function removeNamedGridAreas(container) {
      // Check if a <style> tag with named grid-template-areas exists and override it
      const styleTag = document.getElementById('grid-layout-styles');
      if (styleTag) {
        // Replace the named grid-template-areas with a simple auto-flow grid
        styleTag.textContent = `
          @media screen and (min-width: 1024px) {
            .grid_gallery_container {
              display: grid !important;
              grid-template-columns: repeat(4, 1fr) !important;
              grid-auto-rows: 320px !important;
              grid-template-areas: none !important;
            }
            .grid_gallery_container .item {
              grid-area: auto !important;
            }
          }
        `;
      }
  
      // Also clear any inline grid-area styles on items
      Array.from(container.children).forEach(item => {
        item.style.gridArea = '';
      });
    }
  
    function randomizeGallery() {
      const container = document.querySelector('.grid_gallery_container');
      if (!container) return;
  
      const items = Array.from(container.children);
      if (items.length < 2) return;
  
      // Detect named-area grid by checking for unique A-Z letter classes
      const areaLetters = items
        .map(el => [...el.classList].find(c => /^[A-Z]$/.test(c)))
        .filter(Boolean);
  
      const hasUniqueNamedAreas =
        areaLetters.length === items.length &&
        new Set(areaLetters).size === items.length;
  
      if (hasUniqueNamedAreas) {
        // First neutralize the named grid-areas CSS so DOM order controls layout
        removeNamedGridAreas(container);
      }
  
      // Then shuffle the DOM order (works for both grid types)
      shuffleDOM(container, items);
    }
  
    // Run on window load (after framework scripts have initialized)
    window.addEventListener('load', randomizeGallery);
  
    // Safety net: re-run shortly after in case the framework repaints the grid
    window.addEventListener('load', function () {
      setTimeout(randomizeGallery, 150);
      setTimeout(randomizeGallery, 600);
    });
  
  })();