#!/usr/bin/env node
/**
 * Set data-pswp-width / data-pswp-height (on gallery <a> tags) and img width/height
 * from actual image dimensions on disk.
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { PUBLIC, resolveOnDisk } = require('./lib/html-image-refs');

const WEDDING_GLOB = /^wedding-details-.*\.html$/;

async function dimensionsForSrc(src) {
  const { abs, exists } = resolveOnDisk(src);
  if (!exists) return null;
  const meta = await sharp(abs).metadata();
  if (!meta.width || !meta.height) return null;
  return { width: meta.width, height: meta.height };
}

function replacePswpAttrs(html, width, height) {
  let out = html.replace(/\bdata-pswp-width="[^"]*"/i, `data-pswp-width="${width}"`);
  out = out.replace(/\bdata-pswp-height="[^"]*"/i, `data-pswp-height="${height}"`);
  return out;
}

function replaceImgDimensions(block, width, height) {
  return block.replace(/<img\b[^>]*>/gi, (imgTag) => {
    let out = imgTag;
    if (/\bwidth="[^"]*"/i.test(out)) {
      out = out.replace(/\bwidth="[^"]*"/i, `width="${width}"`);
    }
    if (/\bheight="[^"]*"/i.test(out)) {
      out = out.replace(/\bheight="[^"]*"/i, `height="${height}"`);
    }
    return out;
  });
}

async function processFile(filePath) {
  const html = fs.readFileSync(filePath, 'utf8');
  const anchorBlockRe = /<a\b[^>]*\bdata-pswp-width="[^"]*"[^>]*>[\s\S]*?<\/a>/gi;
  let updated = 0;
  let missing = 0;
  let result = html;

  const blocks = [...html.matchAll(anchorBlockRe)];
  for (const m of blocks) {
    const block = m[0];
    const hrefMatch = block.match(/\bhref="(img\/[^"]+)"/i);
    if (!hrefMatch) continue;
    const dims = await dimensionsForSrc(hrefMatch[1]);
    if (!dims) {
      missing++;
      continue;
    }
    let newBlock = replacePswpAttrs(block, dims.width, dims.height);
    newBlock = replaceImgDimensions(newBlock, dims.width, dims.height);
    if (newBlock !== block) {
      result = result.replace(block, newBlock);
      updated++;
    }
  }

  const pictureRe = /<picture>[\s\S]*?<\/picture>/gi;
  const pictures = [...result.matchAll(pictureRe)];
  for (const m of pictures) {
    const block = m[0];
    const srcMatch = block.match(/\bdata-src="(img\/[^"]+)"/i) || block.match(/\bsrc="(img\/[^"]+)"/i);
    if (!srcMatch || srcMatch[1].startsWith('data:')) continue;
    const dims = await dimensionsForSrc(srcMatch[1]);
    if (!dims) continue;
    const newBlock = replaceImgDimensions(block, dims.width, dims.height);
    if (newBlock !== block) {
      result = result.replace(block, newBlock);
    }
  }

  if (result !== html) {
    fs.writeFileSync(filePath, result);
  }
  return { updated, missing };
}

async function main() {
  const files = fs.readdirSync(PUBLIC).filter((n) => WEDDING_GLOB.test(n));
  let totalUpdated = 0;
  let totalMissing = 0;

  for (const name of files) {
    const { updated, missing } = await processFile(path.join(PUBLIC, name));
    if (updated) console.log(`${name}: ${updated} gallery links updated`);
    totalUpdated += updated;
    totalMissing += missing;
  }

  console.log(`\nDone. Updated ${totalUpdated} pswp tags, ${totalMissing} missing on disk.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
