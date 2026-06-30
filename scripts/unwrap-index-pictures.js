#!/usr/bin/env node
/**
 * Remove <picture> wrappers from index.html (keep preloader pictures).
 * Restores direct <img> layout required by the theme.
 */

const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'public', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

function unwrapPictures(html, keepPreloader = true) {
  const pictureRe = /<picture>\s*<source[^>]*\/>\s*([\s\S]*?)<\/picture>/gi;
  let count = 0;

  return html.replace(pictureRe, (match, imgBlock, offset) => {
    const before = html.slice(Math.max(0, offset - 400), offset);
    if (keepPreloader && before.includes('preloader__image')) {
      return match;
    }
    count++;
    return imgBlock.trim();
  });
}

const before = (html.match(/<picture>/g) || []).length;
html = unwrapPictures(html);
const after = (html.match(/<picture>/g) || []).length;

fs.writeFileSync(indexPath, html);
console.log(`Unwrapped ${before - after} picture elements (${after} preloader pictures kept).`);
