#!/usr/bin/env node
/**
 * Wrap lazy <img data-src="*.jpg"> in <picture> + WebP source across public HTML.
 * Skips images already inside <picture>.
 */

const fs = require('fs');
const path = require('path');

const PUBLIC = path.join(__dirname, '..', 'public');

function isInsidePicture(html, index) {
  const before = html.slice(0, index);
  const lastOpen = before.lastIndexOf('<picture');
  if (lastOpen === -1) return false;
  const lastClose = before.lastIndexOf('</picture>');
  return lastOpen > lastClose;
}

function webpPath(jpgPath) {
  return jpgPath.replace(/\.jpe?g$/i, '.webp');
}

function wrapLazyImages(html) {
  const imgRe = /<img\b[^>]*>/gi;
  let wrapped = 0;
  let offset = 0;
  let result = '';
  let match;

  while ((match = imgRe.exec(html)) !== null) {
    const tag = match[0];
    const start = match.index;
    result += html.slice(offset, start);

    const hasLazy = /\bclass="[^"]*\blazy\b/i.test(tag) || /\bclass='[^']*\blazy\b/i.test(tag);
    const srcMatch = tag.match(/\bdata-src="(img\/[^"]+\.jpe?g)"/i);
    const isRaster = srcMatch && !/\.(svg|webp)$/i.test(srcMatch[1]);
    const skipLogo = /logo-eternus|favicon/i.test(tag);

    if (hasLazy && isRaster && !skipLogo && !isInsidePicture(html, start)) {
      const jpg = srcMatch[1];
      const webp = webpPath(jpg);
      result += `<picture>\n<source type="image/webp" data-srcset="${webp}" />\n${tag}\n</picture>`;
      wrapped++;
    } else {
      result += tag;
    }

    offset = start + tag.length;
  }

  result += html.slice(offset);
  return { html: result, wrapped };
}

function main() {
  let totalWrapped = 0;
  const files = fs.readdirSync(PUBLIC).filter((f) => f.endsWith('.html'));

  for (const name of files) {
    const filePath = path.join(PUBLIC, name);
    const original = fs.readFileSync(filePath, 'utf8');
    const { html, wrapped } = wrapLazyImages(original);
    if (wrapped > 0) {
      fs.writeFileSync(filePath, html);
      console.log(`${name}: wrapped ${wrapped} image(s)`);
      totalWrapped += wrapped;
    }
  }

  console.log(`\nDone. ${totalWrapped} total picture wrapper(s) added.`);
}

main();
