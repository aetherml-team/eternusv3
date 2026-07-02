#!/usr/bin/env node
/**
 * Restore + optimize images for specific HTML pages at best available resolution.
 * Usage: node scripts/optimize-page-images.js page1.html page2.html ...
 */

const fs = require('fs');
const path = require('path');
const { execSync, execFileSync } = require('child_process');
const sharp = require('sharp');
const { PUBLIC, collectFromHtml, toAssetsRel, toSourceRel } = require('./lib/html-image-refs');

const IMG = path.join(PUBLIC, 'img', 'assets');
const PAGES = process.argv.slice(2);

if (!PAGES.length) {
  console.error('Usage: node scripts/optimize-page-images.js <page.html> ...');
  process.exit(1);
}

const WEBP_QUALITY = 90;
const JPEG_QUALITY = 92;
const PNG_QUALITY = 80;
const WEBP_EFFORT = 6;
const RESIZE_KERNEL = sharp.kernel.lanczos3;

const RULES = {
  'hero/': { maxWidth: 960, jpegQuality: 90, webpQuality: 88 },
  'preloader/': { maxWidth: 1365, jpegQuality: 92, webpQuality: 90 },
  'section/sectionArcImages/': { maxWidth: 1920, jpegQuality: 92, webpQuality: 90 },
  'places/': { maxWidth: 1920, jpegQuality: 92, webpQuality: 90 },
  'section/sectionTestimonials/fondoTestimonios.png': { maxWidth: 1600, webpQuality: 78, jpegQuality: 80 },
  'packages/': { maxWidth: 1800 },
  'team/': { maxWidth: 1920, jpegQuality: 92, webpQuality: 90 },
  'placesDetails/': { maxWidth: 1920 },
  'postsTestimonials/': { maxWidth: 1800 },
  'postsPortfolio/': { maxWidth: 1800 },
  'wedingDetails/': { maxWidth: 2400, jpegQuality: 92, webpQuality: 90 },
};

const HERO_COVER_RE = /\/(Hero\.jpe?g|TeaserEdit[^/]*\.jpe?g|1\.jpg)$/i;
const TESTIMONIAL_RE = /\/Testimonial\.jpe?g$/i;
const PORTADA_RE = /portada|cover/i;

function resolveProcessPath(rel) {
  if (/\.webp$/i.test(rel)) {
    const { jpg, jpeg, png } = toSourceRel(rel);
    for (const c of [jpg, jpeg, png].filter(Boolean)) {
      if (fs.existsSync(path.join(IMG, c))) return c;
    }
    return jpg;
  }
  return rel;
}

function collectFiles() {
  const files = new Set();
  for (const name of PAGES) {
    const filePath = path.join(PUBLIC, name);
    if (!fs.existsSync(filePath)) {
      console.warn(`Skip missing page: ${name}`);
      continue;
    }
    const html = fs.readFileSync(filePath, 'utf8');
    for (const imgPath of collectFromHtml(html)) {
      const rel = toAssetsRel(imgPath);
      if (rel) files.add(resolveProcessPath(rel));
    }
  }
  if (PAGES.includes('index.html')) {
    const heroDir = path.join(IMG, 'hero');
    if (fs.existsSync(heroDir)) {
      for (const name of fs.readdirSync(heroDir)) {
        if (/^hero-\d+\.jpe?g$/i.test(name)) files.add(path.join('hero', name));
      }
    }
  }
  return [...files].sort();
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function gitCat(commit, gitPath) {
  try {
    return execFileSync('git', ['show', `${commit}:${gitPath}`], {
      encoding: 'buffer',
      maxBuffer: 50 * 1024 * 1024,
      stdio: ['pipe', 'pipe', 'ignore'],
    });
  } catch {
    return null;
  }
}

function gitLogHashes(gitPath) {
  try {
    return execFileSync('git', ['log', '--follow', '--format=%H', '--', gitPath], {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    })
      .trim()
      .split('\n')
      .filter(Boolean);
  } catch {
    return [];
  }
}

function gitPaths(relPath) {
  const gitPath = `public/img/assets/${relPath.replace(/\\/g, '/')}`;
  const paths = [gitPath];
  if (/\.jpe?g$/i.test(relPath)) paths.push(gitPath.replace(/\.jpe?g$/i, '.png'));
  return paths;
}

function findDupSibling(relPath) {
  const ext = path.extname(relPath);
  const base = path.basename(relPath, ext);
  const absDir = path.join(IMG, path.dirname(relPath));
  if (!fs.existsSync(absDir)) return null;

  const dupRe = new RegExp(
    `^${escapeRegex(base)}(?: (\\d+)| copy (\\d+))${escapeRegex(ext)}$`,
    'i'
  );
  let best = null;
  for (const name of fs.readdirSync(absDir)) {
    if (!dupRe.test(name)) continue;
    const buf = fs.readFileSync(path.join(absDir, name));
    if (!best || buf.length > best.buf.length) {
      best = { buf, source: `dup:${name}`, bytes: buf.length };
    }
  }
  return best;
}

async function gitLargestByWidth(relPath) {
  const paths = gitPaths(relPath);
  let hashes = [];
  for (const p of paths) {
    hashes = hashes.concat(gitLogHashes(p));
  }
  hashes = [...new Set(hashes)];

  let best = null;
  for (const hash of hashes) {
    for (const p of paths) {
      const buf = gitCat(hash, p);
      if (!buf) continue;
      const meta = await sharp(buf).metadata();
      const width = meta.width || 0;
      if (
        !best ||
        width > best.width ||
        (width === best.width && buf.length > best.bytes)
      ) {
        best = { buf, source: `git:${hash.slice(0, 7)}`, bytes: buf.length, width };
      }
    }
  }
  return best;
}

async function resolveSource(relPath) {
  const candidates = [];

  const dup = findDupSibling(relPath);
  if (dup) candidates.push(dup);

  const gitBest = await gitLargestByWidth(relPath);
  if (gitBest) candidates.push(gitBest);

  if (!candidates.length) {
    const absPath = path.join(IMG, relPath);
    if (fs.existsSync(absPath)) {
      const buf = fs.readFileSync(absPath);
      candidates.push({ buf, source: 'disk', bytes: buf.length });
    }
  }

  if (!candidates.length) return null;

  const scored = await Promise.all(
    candidates.map(async (c) => {
      const meta = await sharp(c.buf).metadata();
      return { ...c, width: meta.width || 0, height: meta.height || 0 };
    })
  );

  return scored.reduce((a, b) => {
    if (b.width !== a.width) return b.width > a.width ? b : a;
    return b.bytes > a.bytes ? b : a;
  });
}

function getRule(relPath) {
  const basename = path.basename(relPath);
  const normalized = relPath.replace(/\\/g, '/');
  if (TESTIMONIAL_RE.test(normalized)) return { maxWidth: 400, jpegQuality: 90, webpQuality: 88 };
  if (HERO_COVER_RE.test(normalized)) return { maxWidth: 2560, jpegQuality: 92, webpQuality: 90 };
  if (PORTADA_RE.test(basename) || /portada/i.test(basename)) {
    return { maxWidth: 2400, jpegQuality: 92, webpQuality: 90 };
  }
  if (/\.png$/i.test(basename)) return { maxWidth: 1920, jpegQuality: 92, webpQuality: 90 };
  for (const [prefix, rule] of Object.entries(RULES)) {
    if (prefix.endsWith('/') && normalized.startsWith(prefix)) return rule;
  }
  return { maxWidth: 1920, jpegQuality: 92, webpQuality: 90 };
}

async function optimizeFile(relPath) {
  const absPath = path.join(IMG, relPath);
  if (!fs.existsSync(absPath)) return null;

  const rule = getRule(relPath);
  const before = fs.statSync(absPath).size;
  const ext = path.extname(absPath).toLowerCase();
  const webpPath = absPath.replace(/\.[^.]+$/, '.webp');
  const webpQ = rule.webpQuality ?? WEBP_QUALITY;
  const jpegQ = rule.jpegQuality ?? JPEG_QUALITY;

  let pipeline = sharp(absPath).rotate().resize({
    width: rule.maxWidth,
    withoutEnlargement: true,
    fit: 'inside',
    kernel: RESIZE_KERNEL,
  });

  if (['.jpg', '.jpeg'].includes(ext)) {
    await pipeline.jpeg({ quality: jpegQ, progressive: true, mozjpeg: true }).toFile(absPath + '.tmp');
  } else if (ext === '.png') {
    await pipeline.png({ quality: PNG_QUALITY, compressionLevel: 9, effort: 10 }).toFile(absPath + '.tmp');
  } else {
    await pipeline.toFile(absPath + '.tmp');
  }
  await sharp(absPath + '.tmp').webp({ quality: webpQ, effort: WEBP_EFFORT }).toFile(webpPath);
  fs.renameSync(absPath + '.tmp', absPath);

  const meta = await sharp(webpPath).metadata();
  const after = fs.statSync(absPath).size;
  const webpSize = fs.statSync(webpPath).size;
  return { relPath, before, after, webpSize, width: meta.width, height: meta.height };
}

async function ensureWebpHtml(page) {
  const { unwrapPictureToWebp, migrateRasterPaths } = require('./migrate-html-webp');
  const filePath = path.join(PUBLIC, page);
  let html = fs.readFileSync(filePath, 'utf8');
  html = unwrapPictureToWebp(html);
  html = migrateRasterPaths(html);
  html = html.replace(/\.webp""/g, '.webp"');
  fs.writeFileSync(filePath, html);
}

async function main() {
  const files = collectFiles();
  console.log(`Pages: ${PAGES.join(', ')}`);
  console.log(`Restoring + optimizing ${files.length} source files...\n`);

  let restored = 0;
  for (const rel of files) {
    const found = await resolveSource(rel);
    if (!found) {
      console.warn(`  SKIP restore: ${rel}`);
      continue;
    }
    const absPath = path.join(IMG, rel);
    fs.mkdirSync(path.dirname(absPath), { recursive: true });
    fs.writeFileSync(absPath, found.buf);
    const webpPath = absPath.replace(/\.[^.]+$/, '.webp');
    if (fs.existsSync(webpPath)) fs.unlinkSync(webpPath);
    restored++;
    console.log(
      `  restore ${rel} → ${found.width}x${found.height} (${found.source})`
    );
  }

  console.log(`\nOptimizing ${restored} files...\n`);
  let totalWebp = 0;
  for (const rel of files) {
    try {
      const r = await optimizeFile(rel);
      if (!r) continue;
      totalWebp += r.webpSize;
      console.log(
        `  ${rel}: webp ${r.width}x${r.height} ${(r.webpSize / 1024).toFixed(0)}KB`
      );
    } catch (err) {
      console.error(`  ERROR ${rel}:`, err.message);
    }
  }

  console.log('\nEnsuring WebP in HTML...');
  for (const page of PAGES) {
    await ensureWebpHtml(page);
    console.log(`  ${page}`);
  }

  console.log(`\n--- Summary ---`);
  console.log(`Restored: ${restored}, WebP output: ${(totalWebp / 1024 / 1024).toFixed(1)} MB`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
