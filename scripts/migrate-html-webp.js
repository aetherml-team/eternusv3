#!/usr/bin/env node
/**
 * Strip preloader counter + loading text; migrate raster refs to WebP in public HTML.
 */

const fs = require('fs');
const path = require('path');

const PUBLIC = path.join(__dirname, '..', 'public');
const SKIP_PATH = /logo-eternus|favicon|\.svg/i;

function toWebp(p) {
  return p.replace(/\.(jpe?g|png)$/i, '.webp');
}

function fixPreloaderFooter(html) {
  return html.replace(
    /<div class="preloader__footer([^>]*?)>\s*<\/div>\s*<div class="js-preloader__content-loaded">/g,
    '<div class="preloader__footer$1>\n        <div class="js-preloader__content-loaded">'
  );
}

function stripPreloaderUi(html) {
  let out = html;
  out = out.replace(
    /\s*<!-- Counter -->[\s\S]*?<div class="preloader__wrapper-counter[\s\S]*?<\/svg>\s*<\/div>\s*(<!-- - Counter -->\s*)?/g,
    '\n'
  );
  out = out.replace(
    /<div class="preloader__wrapper-counter[\s\S]*?<\/svg>\s*<\/div>\s*/g,
    ''
  );
  out = out.replace(
    /\s*<!-- Content \[before load\] -->[\s\S]*?<!-- - Content \[before load\] -->\s*/g,
    ''
  );
  out = out.replace(
    /<div class="preloader__loading js-preloader__content-loading">[\s\S]*?<\/div>\s*/g,
    ''
  );
  out = fixPreloaderFooter(out);
  return out;
}

function unwrapPictureToWebp(html) {
  return html.replace(
    /<picture>\s*<source type="image\/webp" data-srcset="(img\/[^"]+\.webp)"\s*\/?>\s*(<img[\s\S]*?)<\/picture>/gi,
    (_, webp, imgTag) => {
      let img = imgTag.replace(/\bdata-src="img\/[^"]+"/i, `data-src="${webp}"`);
      if (!/\bdata-src="/i.test(img)) {
        img = img.replace(/<img\b/i, `<img data-src="${webp}"`);
      }
      return img.trim();
    }
  );
}

function migrateRasterPaths(html) {
  return html.replace(
    /((?:src|data-src|data-srcset|href|data-texture-src)=")(img\/[^"]+)"/gi,
    (match, attr, imgPath) => {
      if (SKIP_PATH.test(imgPath) || /\.webp$/i.test(imgPath)) return match;
      if (!/\.(jpe?g|png)$/i.test(imgPath)) return match;
      return `${attr}${toWebp(imgPath)}"`;
    }
  );
}

function processFile(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');
  let html = original;
  html = fixPreloaderFooter(html);
  html = stripPreloaderUi(html);
  html = unwrapPictureToWebp(html);
  html = migrateRasterPaths(html);
  html = html.replace(/\.webp""/g, '.webp"');

  if (html !== original) {
    fs.writeFileSync(filePath, html);
    return true;
  }
  return false;
}

function main() {
  const files = fs.readdirSync(PUBLIC).filter((f) => f.endsWith('.html'));
  let updated = 0;
  for (const name of files) {
    if (processFile(path.join(PUBLIC, name))) {
      console.log(`Updated ${name}`);
      updated++;
    }
  }
  console.log(`\nDone. ${updated} HTML file(s) updated.`);
}

module.exports = {
  unwrapPictureToWebp,
  migrateRasterPaths,
  processFile,
};

if (require.main === module) {
  main();
}
