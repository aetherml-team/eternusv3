/**
 * Hero Section Randomizer
 * Randomly selects and displays images from the hero folder
 */

class HeroRandomizer {
  constructor() {
    this.heroFolder = 'img/assets/hero/';
    this.totalImages = 76;
    this.imagesToDisplay = 24;
    this.selectedImages = [];
    // hero-67/68 exist as .png only — no .jpg/.webp for the randomizer pool
    this.excludedImages = new Set([67, 68]);
  }

  getAllImagePaths() {
    const images = [];
    for (let i = 1; i <= this.totalImages; i++) {
      if (this.excludedImages.has(i)) {
        continue;
      }
      images.push(`${this.heroFolder}hero-${i}.jpg`);
    }
    return images;
  }

  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  getRandomImages() {
    const allImages = this.getAllImagePaths();
    const shuffled = this.shuffleArray(allImages);
    return shuffled.slice(0, this.imagesToDisplay);
  }

  isVerticalImage(imagePath) {
    const match = imagePath.match(/hero-(\d+)\.jpg$/i);
    return match ? parseInt(match[1], 10) >= 33 : true;
  }

  createImageElement(imagePath, fetchPriority) {
    const div = document.createElement('div');
    div.className = 'w-100 d-block p-1 p-md-2 js-screens-wall__list-item';
    const priorityAttr = fetchPriority ? ` fetchpriority="${fetchPriority}"` : '';
    const isVertical = this.isVerticalImage(imagePath);
    const width = 600;
    const height = isVertical ? 156 : 312;
    const webpPath = imagePath.replace(/\.jpe?g$/i, '.webp');

    div.innerHTML = `
      <div class="img-wrapper">
        <img class="lazy of-cover w-full h-full"
          src="data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='100%25'%20height='100%25'%3E%3C/svg%3E"
          decoding="async"
          data-src="${webpPath}"
          width="${width}"
          height="${height}"
          alt=""${priorityAttr} />
      </div>
    `;

    const wrapper = div.querySelector('.img-wrapper');
    if (wrapper) {
      wrapper.style.width = `${width}px`;
      wrapper.style.height = `${height}px`;
    }

    return div;
  }

  populate() {
    const randomImages = this.getRandomImages();
    const lanes = document.querySelectorAll('.js-screens-wall__list-lane');

    if (lanes.length === 0) {
      return;
    }

    let imageIndex = 0;
    lanes.forEach((lane, laneIndex) => {
      lane.innerHTML = '';

      for (let i = 0; i < 6; i++) {
        if (imageIndex < randomImages.length) {
          const fetchPriority = laneIndex === 0 && i < 2 ? 'high' : null;
          const imageElement = this.createImageElement(randomImages[imageIndex], fetchPriority);
          lane.appendChild(imageElement);
          imageIndex++;
        }
      }
    });

    if (window.app?.lazy && typeof window.app.lazy.update === 'function') {
      window.app.lazy.update();
    }
  }
}

function populateHeroWall() {
  if (!document.querySelector('.js-screens-wall')) {
    return;
  }

  new HeroRandomizer().populate();
}

// Full page load of index (once — do not listen to Barba's synthetic DOMContentLoaded)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', populateHeroWall, { once: true });
} else {
  populateHeroWall();
}

// Barba AJAX: populate after next container is assigned, before ScreensWall inits
document.addEventListener('arts/barba/transition/init/before', () => {
  queueMicrotask(populateHeroWall);
});
