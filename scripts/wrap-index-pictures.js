#!/usr/bin/env node
/**
 * Fix PNG paths in index.html that were converted to JPEG by optimize-index-images.js.
 * Does NOT add <picture> wrappers — those break theme layout (of-cover-absolute, etc.).
 */

const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'public', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

const pngToJpg = {
  'img/assets/section/sectionArcImages/arc-2.png': 'img/assets/section/sectionArcImages/arc-2.jpg',
  'img/assets/section/sectionArcImages/arc-3.png': 'img/assets/section/sectionArcImages/arc-3.jpg',
  'img/assets/wedingDetails/Fer&Ricky/Fer&Ricky.png': 'img/assets/wedingDetails/Fer&Ricky/Fer&Ricky.jpg',
  'img/assets/wedingDetails/Domi&Tavo/Domi&Tavo.png': 'img/assets/wedingDetails/Domi&Tavo/Domi&Tavo.jpg',
  'img/assets/wedingDetails/David&Edurne/David&Edurne.png': 'img/assets/wedingDetails/David&Edurne/David&Edurne.jpg',
  'img/assets/wedingDetails/Izaak-Simi/Isaac&Simi.png': 'img/assets/wedingDetails/Izaak-Simi/Isaac&Simi.jpg',
  'img/assets/wedingDetails/Erika&Joey/Erika&Joey.png': 'img/assets/wedingDetails/Erika&Joey/Erika&Joey.jpg',
  'img/assets/places/NY.png': 'img/assets/places/NY.jpg',
  'img/assets/places/RD.png': 'img/assets/places/RD.jpg',
  'img/assets/places/Tulum.png': 'img/assets/places/Tulum.jpg',
  'img/assets/places/MenorcaEspaña.png': 'img/assets/places/MenorcaEspaña.jpg',
  'img/assets/section/sectionTestimonials/fondoTestimonios.png': 'img/assets/section/sectionTestimonials/fondoTestimonios.jpg',
};

let changes = 0;
for (const [from, to] of Object.entries(pngToJpg)) {
  const count = html.split(from).length - 1;
  if (count > 0) {
    html = html.split(from).join(to);
    changes += count;
  }
}

fs.writeFileSync(indexPath, html);
console.log(`Updated ${changes} PNG path reference(s) to JPEG in index.html.`);
