#!/usr/bin/env node
/**
 * Resize and compress index-page images; generate WebP siblings.
 * Overwrites originals in place (same paths) for JPEG/PNG fallbacks.
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const PUBLIC = path.join(__dirname, '..', 'public');
const IMG = path.join(PUBLIC, 'img', 'assets');

const WEBP_QUALITY = 81;
const JPEG_QUALITY = 84;
const PNG_QUALITY = 80;

/** @type {Record<string, { maxWidth: number, jpegQuality?: number, webpQuality?: number }>} */
const RULES = {
  'hero/': { maxWidth: 480 },
  'preloader/': { maxWidth: 800 },
  'section/sectionArcImages/': { maxWidth: 600 },
  'wedingDetails/Fer&Ricky/Fer&Ricky.png': { maxWidth: 1200 },
  'wedingDetails/JulyTyV2/1.jpg': { maxWidth: 1200 },
  'wedingDetails/Gaby&Tono/gaby-tonio-portada.jpg': { maxWidth: 1200 },
  'wedingDetails/Domi&Tavo/Domi&Tavo.png': { maxWidth: 1200 },
  'wedingDetails/David&Edurne/David&Edurne.png': { maxWidth: 1200 },
  'wedingDetails/Izaak-Simi/Isaac&Simi.png': { maxWidth: 1200 },
  'wedingDetails/Erika&Joey/Erika&Joey.png': { maxWidth: 1200 },
  'wedingDetails/Domi&Tavo/Testimonial.jpg': { maxWidth: 300 },
  'wedingDetails/Erika&Joey/Testimonial.jpg': { maxWidth: 300 },
  'wedingDetails/Izaak-Simi/Testimonial.jpg': { maxWidth: 300 },
  'wedingDetails/David&Edurne/Testimonial.jpg': { maxWidth: 300 },
  'places/': { maxWidth: 1000 },
  'section/sectionTestimonials/fondoTestimonios.png': { maxWidth: 1600, webpQuality: 78, jpegQuality: 80 },
  'packages/': { maxWidth: 1400 },
  'team/': { maxWidth: 900 },
};

function collectFiles() {
  const files = new Set();

  // Hero pool (hero-1.jpg … hero-76.jpg)
  const heroDir = path.join(IMG, 'hero');
  if (fs.existsSync(heroDir)) {
    for (const name of fs.readdirSync(heroDir)) {
      if (/^hero-\d+\.jpe?g$/i.test(name)) {
        files.add(path.join('hero', name));
      }
    }
  }

  // Explicit index.html references
  const indexRefs = [
    ...Array.from({ length: 6 }, (_, i) => `preloader/img-preloader-${i + 1}.jpg`),
    ...Array.from({ length: 10 }, (_, i) => {
      const n = i + 1;
      if (n === 2 || n === 3) return `section/sectionArcImages/arc-${n}.png`;
      return `section/sectionArcImages/arc-${n}.jpg`;
    }),
    'wedingDetails/Fer&Ricky/Fer&Ricky.png',
    'wedingDetails/JulyTyV2/1.jpg',
    'wedingDetails/Gaby&Tono/gaby-tonio-portada.jpg',
    'wedingDetails/Domi&Tavo/Domi&Tavo.png',
    'wedingDetails/David&Edurne/David&Edurne.png',
    'wedingDetails/Izaak-Simi/Isaac&Simi.png',
    'wedingDetails/Erika&Joey/Erika&Joey.png',
    'places/NY.png',
    'places/RD.png',
    'places/Tulum.png',
    'places/VDG.jpg',
    'places/MenorcaEspaña.png',
    'wedingDetails/Domi&Tavo/Testimonial.jpg',
    'wedingDetails/Erika&Joey/Testimonial.jpg',
    'wedingDetails/Izaak-Simi/Testimonial.jpg',
    'wedingDetails/David&Edurne/Testimonial.jpg',
    'section/sectionTestimonials/fondoTestimonios.png',
    'packages/EternusJ&R-6.jpeg',
    'team/sophy.jpg',
    'team/dimitri.jpg',
    'team/Giorgos-new.JPG',
  ];

  for (const rel of indexRefs) {
    files.add(rel);
  }

  return [...files].sort();
}

function getRule(relPath) {
  if (RULES[relPath]) return RULES[relPath];
  for (const [prefix, rule] of Object.entries(RULES)) {
    if (prefix.endsWith('/') && relPath.startsWith(prefix)) return rule;
  }
  return { maxWidth: 1200 };
}

async function hasAlpha(image) {
  const { channels } = image;
  if (channels === 4) {
    const { data, info } = await image
      .clone()
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
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
  });

  const meta = await sharp(absPath).metadata();
  const useAlpha = ext === '.png' && (meta.hasAlpha || await hasAlpha(sharp(absPath)));

  if (useAlpha) {
    await pipeline
      .png({ quality: PNG_QUALITY, compressionLevel: 9, effort: 10 })
      .toFile(absPath + '.tmp');
    await sharp(absPath + '.tmp')
      .webp({ quality: webpQ, effort: 4 })
      .toFile(webpPath);
    fs.renameSync(absPath + '.tmp', absPath);
  } else if (ext === '.png') {
    // Photo PNG without alpha → JPEG fallback
    const jpegPath = absPath.replace(/\.png$/i, '.jpg');
    await pipeline
      .jpeg({ quality: jpegQ, progressive: true, mozjpeg: true })
      .toFile(jpegPath + '.tmp');
    await sharp(jpegPath + '.tmp')
      .webp({ quality: webpQ, effort: 4 })
      .toFile(webpPath);
    fs.unlinkSync(absPath);
    fs.renameSync(jpegPath + '.tmp', jpegPath);
    const after = fs.statSync(jpegPath).size;
    const webpSize = fs.statSync(webpPath).size;
    return { relPath: relPath.replace(/\.png$/i, '.jpg'), before, after, webpSize, converted: 'png→jpg' };
  } else {
    const isJpeg = ['.jpg', '.jpeg'].includes(ext);
    if (isJpeg) {
      await pipeline
        .jpeg({ quality: jpegQ, progressive: true, mozjpeg: true })
        .toFile(absPath + '.tmp');
    } else {
      await pipeline.toFile(absPath + '.tmp');
    }
    await sharp(absPath + '.tmp')
      .webp({ quality: webpQ, effort: 4 })
      .toFile(webpPath);
    fs.renameSync(absPath + '.tmp', absPath);
  }

  if (fs.existsSync(absPath + '.tmp')) {
    fs.renameSync(absPath + '.tmp', absPath);
  }

  const after = fs.statSync(absPath).size;
  const webpSize = fs.statSync(webpPath).size;

  return { relPath, before, after, webpSize, converted: null };
}

async function main() {
  const files = collectFiles();
  console.log(`Optimizing ${files.length} images...\n`);

  let totalBefore = 0;
  let totalAfter = 0;
  let totalWebp = 0;
  const converted = [];

  for (const rel of files) {
    try {
      const result = await optimizeFile(rel);
      if (!result) continue;
      totalBefore += result.before;
      totalAfter += result.after;
      totalWebp += result.webpSize;
      const saved = ((1 - result.after / result.before) * 100).toFixed(0);
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
  console.log(`Fallback total: ${(totalBefore / 1024 / 1024).toFixed(1)} MB → ${(totalAfter / 1024 / 1024).toFixed(1)} MB`);
  console.log(`WebP total: ${(totalWebp / 1024 / 1024).toFixed(1)} MB`);
  if (converted.length) {
    console.log(`\nPNG converted to JPEG (update HTML paths):`);
    converted.forEach((p) => console.log(`  - ${p}`));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
