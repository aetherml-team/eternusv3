#!/usr/bin/env node
/**
 * Resize and compress all HTML-referenced images; generate WebP siblings.
 * Overwrites originals in place (same paths) for JPEG/PNG fallbacks.
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { collectFromAllHtml, toAssetsRel, toSourceRel } = require('./lib/html-image-refs');

const PUBLIC = path.join(__dirname, '..', 'public');
const IMG = path.join(PUBLIC, 'img', 'assets');

const WEBP_QUALITY = 90;
const JPEG_QUALITY = 92;
const PNG_QUALITY = 80;
const WEBP_EFFORT = 6;
const RESIZE_KERNEL = sharp.kernel.lanczos3;

/** @type {Record<string, { maxWidth: number, jpegQuality?: number, webpQuality?: number }>} */
const RULES = {
  'hero/': { maxWidth: 960, jpegQuality: 90, webpQuality: 88 },
  'preloader/': { maxWidth: 800 },
  'section/sectionArcImages/': { maxWidth: 1000 },
  'places/': { maxWidth: 1600 },
  'section/sectionTestimonials/fondoTestimonios.png': { maxWidth: 1600, webpQuality: 78, jpegQuality: 80 },
  'packages/': { maxWidth: 1800 },
  'team/': { maxWidth: 1500 },
  'placesDetails/': { maxWidth: 1800 },
  'postsTestimonials/': { maxWidth: 1800 },
  'postsPortfolio/': { maxWidth: 1800 },
  'wedingDetails/': { maxWidth: 2400 },
};

const HERO_COVER_RE = /\/(Hero\.jpe?g|TeaserEdit[^/]*\.jpe?g|1\.jpg)$/i;
const TESTIMONIAL_RE = /\/Testimonial\.jpe?g$/i;
const PORTADA_RE = /portada|cover/i;

function resolveProcessPath(rel) {
  if (/\.webp$/i.test(rel)) {
    const { jpg, jpeg, png } = toSourceRel(rel);
    const candidates = [jpg, jpeg, png].filter(Boolean);
    for (const c of candidates) {
      if (fs.existsSync(path.join(IMG, c))) return c;
    }
    return jpg;
  }
  return rel;
}

function collectFiles() {
  const files = new Set();
  const { all } = collectFromAllHtml();

  for (const imgPath of all) {
    const rel = toAssetsRel(imgPath);
    if (rel) files.add(resolveProcessPath(rel));
  }

  const heroDir = path.join(IMG, 'hero');
  if (fs.existsSync(heroDir)) {
    for (const name of fs.readdirSync(heroDir)) {
      if (/^hero-\d+\.jpe?g$/i.test(name)) {
        files.add(path.join('hero', name));
      }
    }
  }

  return [...files].sort();
}

function getRule(relPath) {
  if (RULES[relPath]) return RULES[relPath];

  const basename = path.basename(relPath);
  const normalized = relPath.replace(/\\/g, '/');

  if (TESTIMONIAL_RE.test(normalized)) return { maxWidth: 300 };
  if (HERO_COVER_RE.test(normalized)) return { maxWidth: 2560, jpegQuality: 92, webpQuality: 90 };
  if (PORTADA_RE.test(basename) || /\.png$/i.test(basename)) {
    return { maxWidth: 1920, jpegQuality: 92, webpQuality: 90 };
  }

  for (const [prefix, rule] of Object.entries(RULES)) {
    if (prefix.endsWith('/') && normalized.startsWith(prefix)) return rule;
  }

  return { maxWidth: 1800 };
}

async function hasAlpha(image) {
  const { channels } = image;
  if (channels === 4) {
    const { data } = await image.clone().ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 255) return true;
    }
  }
  return false;
}

async function optimizeFile(relPath) {
  const absPath = path.join(IMG, relPath);
  if (!fs.existsSync(absPath)) {
    console.warn(`  SKIP (missing): ${relPath}`);
    return null;
  }

  const rule = getRule(relPath);
  const maxWidth = rule.maxWidth;
  const webpQ = rule.webpQuality ?? WEBP_QUALITY;
  const jpegQ = rule.jpegQuality ?? JPEG_QUALITY;

  const before = fs.statSync(absPath).size;
  const ext = path.extname(absPath).toLowerCase();
  const webpPath = absPath.replace(/\.[^.]+$/, '.webp');

  let pipeline = sharp(absPath).rotate().resize({
    width: maxWidth,
    withoutEnlargement: true,
    fit: 'inside',
    kernel: RESIZE_KERNEL,
  });

  const meta = await sharp(absPath).metadata();
  const useAlpha = ext === '.png' && (meta.hasAlpha || (await hasAlpha(sharp(absPath))));

  if (useAlpha) {
    await pipeline.png({ quality: PNG_QUALITY, compressionLevel: 9, effort: 10 }).toFile(absPath + '.tmp');
    await sharp(absPath + '.tmp').webp({ quality: webpQ, effort: WEBP_EFFORT }).toFile(webpPath);
    fs.renameSync(absPath + '.tmp', absPath);
  } else if (ext === '.png') {
    const jpegPath = absPath.replace(/\.png$/i, '.jpg');
    await pipeline.jpeg({ quality: jpegQ, progressive: true, mozjpeg: true }).toFile(jpegPath + '.tmp');
    await sharp(jpegPath + '.tmp').webp({ quality: webpQ, effort: WEBP_EFFORT }).toFile(webpPath);
    fs.unlinkSync(absPath);
    fs.renameSync(jpegPath + '.tmp', jpegPath);
    const after = fs.statSync(jpegPath).size;
    const webpSize = fs.statSync(webpPath).size;
    const outMeta = await sharp(jpegPath).metadata();
    return {
      relPath: relPath.replace(/\.png$/i, '.jpg'),
      before,
      after,
      webpSize,
      converted: 'png→jpg',
      width: outMeta.width,
      height: outMeta.height,
    };
  } else {
    const isJpeg = ['.jpg', '.jpeg'].includes(ext);
    if (isJpeg) {
      await pipeline.jpeg({ quality: jpegQ, progressive: true, mozjpeg: true }).toFile(absPath + '.tmp');
    } else {
      await pipeline.toFile(absPath + '.tmp');
    }
    await sharp(absPath + '.tmp').webp({ quality: webpQ, effort: WEBP_EFFORT }).toFile(webpPath);
    fs.renameSync(absPath + '.tmp', absPath);
  }

  if (fs.existsSync(absPath + '.tmp')) {
    fs.renameSync(absPath + '.tmp', absPath);
  }

  const after = fs.statSync(absPath).size;
  const webpSize = fs.statSync(webpPath).size;
  const outMeta = await sharp(absPath).metadata();

  return {
    relPath,
    before,
    after,
    webpSize,
    converted: null,
    width: outMeta.width,
    height: outMeta.height,
  };
}

async function main() {
  const files = collectFiles();
  console.log(`Optimizing ${files.length} images...\n`);

  let totalBefore = 0;
  let totalAfter = 0;
  let totalWebp = 0;
  let skipped = 0;
  const converted = [];

  for (const rel of files) {
    try {
      const result = await optimizeFile(rel);
      if (!result) {
        skipped++;
        continue;
      }
      totalBefore += result.before;
      totalAfter += result.after;
      totalWebp += result.webpSize;
      const saved = result.before > 0 ? ((1 - result.after / result.before) * 100).toFixed(0) : '0';
      const tag = result.converted ? ` [${result.converted}]` : '';
      console.log(
        `  ${result.relPath}: ${(result.before / 1024).toFixed(0)}KB → ${(result.after / 1024).toFixed(0)}KB (-${saved}%) + webp ${(result.webpSize / 1024).toFixed(0)}KB${tag}`
      );
      if (result.converted) converted.push(result.relPath);
    } catch (err) {
      console.error(`  ERROR ${rel}:`, err.message);
    }
  }

  console.log('\n--- Summary ---');
  console.log(`Processed: ${files.length - skipped}, skipped missing: ${skipped}`);
  console.log(`Fallback total: ${(totalBefore / 1024 / 1024).toFixed(1)} MB → ${(totalAfter / 1024 / 1024).toFixed(1)} MB`);
  console.log(`WebP total: ${(totalWebp / 1024 / 1024).toFixed(1)} MB`);
  if (converted.length) {
    console.log(`\nPNG converted to JPEG (run fix-image-paths):`);
    converted.forEach((p) => console.log(`  - ${p}`));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
