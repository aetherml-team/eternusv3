#!/usr/bin/env node
/**
 * Fix image paths across all public HTML files:
 * - PNG → JPEG after optimization
 * - HTML entity normalization (&amp; → &)
 * - Double-slash cleanup in paths
 * - Fer&Ricky.png → fer&Ricky.jpg (actual on-disk name)
 */

const fs = require('fs');
const path = require('path');

const PUBLIC = path.join(__dirname, '..', 'public');

const REPLACEMENTS = [
  // Index / global PNG → JPG (from optimize script)
  ['img/assets/section/sectionArcImages/arc-2.png', 'img/assets/section/sectionArcImages/arc-2.jpg'],
  ['img/assets/section/sectionArcImages/arc-3.png', 'img/assets/section/sectionArcImages/arc-3.jpg'],
  ['img/assets/wedingDetails/Fer&Ricky/Fer&Ricky.png', 'img/assets/wedingDetails/Fer&Ricky/fer&Ricky.jpg'],
  ['img/assets/wedingDetails/Fer&amp;Ricky/Fer&amp;Ricky.png', 'img/assets/wedingDetails/Fer&Ricky/fer&Ricky.jpg'],
  ['img/assets/wedingDetails/Domi&Tavo/Domi&Tavo.png', 'img/assets/wedingDetails/Domi&Tavo/Domi&Tavo.jpg'],
  ['img/assets/wedingDetails/David&Edurne/David&Edurne.png', 'img/assets/wedingDetails/David&Edurne/David&Edurne.jpg'],
  ['img/assets/wedingDetails/Izaak-Simi/Isaac&Simi.png', 'img/assets/wedingDetails/Izaak-Simi/Isaac&Simi.jpg'],
  ['img/assets/wedingDetails/Erika&Joey/Erika&Joey.png', 'img/assets/wedingDetails/Erika&Joey/Erika&Joey.jpg'],
  ['img/assets/places/NY.png', 'img/assets/places/NY.jpg'],
  ['img/assets/places/RD.png', 'img/assets/places/RD.jpg'],
  ['img/assets/places/Tulum.png', 'img/assets/places/Tulum.jpg'],
  ['img/assets/places/MenorcaEspaña.png', 'img/assets/places/MenorcaEspaña.jpg'],
  ['img/assets/section/sectionTestimonials/fondoTestimonios.png', 'img/assets/section/sectionTestimonials/fondoTestimonios.jpg'],
  // Entity-encoded duplicates
  ['img/assets/wedingDetails/Fer&amp;Ricky/', 'img/assets/wedingDetails/Fer&Ricky/'],
  ['wedingDetails//Fer&Ricky/', 'wedingDetails/Fer&Ricky/'],
  ['wedingDetails//Fer&amp;Ricky/', 'wedingDetails/Fer&Ricky/'],
];

function normalizePathEntities(html) {
  return html
    .replace(/(img\/assets\/wedingDetails\/[^"']*?)&amp;([^"']*?)/g, '$1&$2')
    .replace(/(img\/assets\/wedingDetails\/[^"']*?)\/{2,}/g, '$1/');
}

function fixFile(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');
  const original = html;
  let changes = 0;

  for (const [from, to] of REPLACEMENTS) {
    const parts = html.split(from);
    if (parts.length > 1) {
      changes += parts.length - 1;
      html = parts.join(to);
    }
  }

  const normalized = normalizePathEntities(html);
  if (normalized !== html) {
    changes++;
    html = normalized;
  }

  if (html !== original) {
    fs.writeFileSync(filePath, html);
  }

  return changes;
}

function main() {
  let total = 0;
  const files = fs.readdirSync(PUBLIC).filter((f) => f.endsWith('.html'));

  for (const name of files) {
    const n = fixFile(path.join(PUBLIC, name));
    if (n > 0) {
      console.log(`${name}: ${n} replacement(s)`);
      total += n;
    }
  }

  console.log(`\nDone. ${total} total replacement(s) across ${files.length} HTML files.`);
}

main();
