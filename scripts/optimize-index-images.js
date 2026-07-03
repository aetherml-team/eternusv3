#!/usr/bin/env node
/**
 * Restore index.html images from best sources and encode WebP at mild (~10%) compression.
 * Overwrites JPEG sources + WebP outputs. Index HTML should reference WebP only.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const sharp = require('sharp');
const { collectFromHtml, toAssetsRel, toSourceRel } = require('./lib/html-image-refs');

const PUBLIC = path.join(__dirname, '..', 'public');
const IMG = path.join(PUBLIC, 'img', 'assets');
const LOGO_DIR = path.join(PUBLIC, 'img', 'logo');

/** Mild compression: ~10% smaller than full-quality encode. */
const WEBP_QUALITY = 88;
const JPEG_QUALITY = 90;
const WEBP_EFFORT = 6;
const RESIZE_KERNEL = sharp.kernel.lanczos3;

const RULES = {
  'preloader/': { maxWidth: 600, webpQuality: 88 },
  'section/sectionArcImages/': { maxWidth: 600, webpQuality: 88 },
  'wedingDetails/JulyTyV2/1.jpg': { maxWidth: 2200, webpQuality: 88 },
  'wedingDetails/Fer-Ricky/Fer-Ricky.jpg': { maxWidth: 1600, webpQuality: 88 },
  'wedingDetails/Gaby&Tono/gaby-tonio-portada.jpg': { maxWidth: 1600, webpQuality: 88 },
  'wedingDetails/Domi&Tavo/Domi&Tavo.jpg': { maxWidth: 1600, webpQuality: 88 },
  'wedingDetails/David&Edurne/David&Edurne.jpg': { maxWidth: 1600, webpQuality: 88 },
  'wedingDetails/Izaak-Simi/Isaac&Simi.jpg': { maxWidth: 1600, webpQuality: 88 },
  'wedingDetails/Erika&Joey/Erika&Joey.jpg': { maxWidth: 1600, webpQuality: 88 },
  'wedingDetails/Domi&Tavo/Testimonial.jpg': { maxWidth: 300, webpQuality: 88 },
  'wedingDetails/Erika&Joey/Testimonial.jpg': { maxWidth: 300, webpQuality: 88 },
  'wedingDetails/Izaak-Simi/Testimonial.jpg': { maxWidth: 300, webpQuality: 88 },
  'wedingDetails/David&Edurne/Testimonial.jpg': { maxWidth: 300, webpQuality: 88 },
  'places/': { maxWidth: 1280, webpQuality: 87 },
  'section/sectionTestimonials/fondoTestimonios.jpg': { maxWidth: 1600, webpQuality: 88 },
  'packages/': { maxWidth: 1600, webpQuality: 88 },
  'team/': { maxWidth: 800, webpQuality: 88 },
};

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
  const html = fs.readFileSync(path.join(PUBLIC, 'index.html'), 'utf8');
  for (const imgPath of collectFromHtml(html)) {
    const rel = toAssetsRel(imgPath);
    if (!rel) continue;
    files.add(resolveProcessPath(rel));
  }
  return [...files].sort();
}

function getRule(relPath) {
  const normalized = relPath.replace(/\\/g, '/');
  if (RULES[normalized]) return RULES[normalized];
  for (const [prefix, rule] of Object.entries(RULES).sort((a, b) => b[0].length - a[0].length)) {
    if (prefix.endsWith('/') && normalized.startsWith(prefix)) return rule;
  }
  return { maxWidth: 1600, webpQuality: WEBP_QUALITY };
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
  if (/\.jpeg$/i.test(relPath)) paths.push(gitPath.replace(/\.jpeg$/i, '.jpg'));
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

  const absPath = path.join(IMG, relPath);
  if (fs.existsSync(absPath)) {
    const buf = fs.readFileSync(absPath);
    candidates.push({ buf, source: 'disk', bytes: buf.length });
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

async function optimizeFile(relPath) {
  const source = await resolveSource(relPath);
  if (!source) {
    console.warn(`  SKIP (missing): ${relPath}`);
    return null;
  }

  const rule = getRule(relPath);
  const maxWidth = rule.maxWidth;
  const webpQ = rule.webpQuality ?? WEBP_QUALITY;
  const jpegQ = rule.jpegQuality ?? JPEG_QUALITY;

  const absPath = path.join(IMG, relPath);
  const webpPath = absPath.replace(/\.[^.]+$/, '.webp');
  const webpBefore = fs.existsSync(webpPath) ? fs.statSync(webpPath).size : 0;

  fs.mkdirSync(path.dirname(absPath), { recursive: true });
  fs.writeFileSync(absPath, source.buf);

  const pipeline = sharp(source.buf).rotate().resize({
    width: maxWidth,
    withoutEnlargement: true,
    fit: 'inside',
    kernel: RESIZE_KERNEL,
  });

  const ext = path.extname(absPath).toLowerCase();
  const isJpeg = ['.jpg', '.jpeg'].includes(ext);

  if (isJpeg) {
    await pipeline
      .clone()
      .jpeg({ quality: jpegQ, progressive: true, mozjpeg: true })
      .toFile(absPath + '.tmp');
    fs.renameSync(absPath + '.tmp', absPath);
  } else {
    await pipeline.clone().toFile(absPath + '.tmp');
    fs.renameSync(absPath + '.tmp', absPath);
  }

  await sharp(absPath)
    .webp({ quality: webpQ, effort: WEBP_EFFORT })
    .toFile(webpPath);

  const webpSize = fs.statSync(webpPath).size;
  const outMeta = await sharp(webpPath).metadata();

  return {
    relPath,
    source: source.source,
    webpBefore,
    webpSize,
    width: outMeta.width,
    height: outMeta.height,
  };
}

async function convertLogosToWebp() {
  const logos = ['logo-eternus-dark.png', 'logo-eternus-light.png'];
  const results = [];

  for (const name of logos) {
    const pngPath = path.join(LOGO_DIR, name);
    if (!fs.existsSync(pngPath)) {
      console.warn(`  SKIP logo (missing): ${name}`);
      continue;
    }
    const webpName = name.replace(/\.png$/i, '.webp');
    const webpPath = path.join(LOGO_DIR, webpName);
    const before = fs.statSync(pngPath).size;

    await sharp(pngPath)
      .webp({ quality: 90, effort: WEBP_EFFORT, alphaQuality: 90 })
      .toFile(webpPath);

    const after = fs.statSync(webpPath).size;
    results.push({ name: webpName, before, after });
    console.log(
      `  logo ${name} → ${webpName}: ${(before / 1024).toFixed(1)}KB → ${(after / 1024).toFixed(1)}KB`
    );
  }

  return results;
}

function updateIndexHtmlToWebpOnly() {
  const indexPath = path.join(PUBLIC, 'index.html');
  let html = fs.readFileSync(indexPath, 'utf8');
  const before = html;

  html = html.replace(
    /src="img\/logo\/logo-eternus-dark\.png"/g,
    'src="img/logo/logo-eternus-dark.webp"'
  );
  html = html.replace(
    /src="img\/logo\/logo-eternus-light\.png"/g,
    'src="img/logo/logo-eternus-light.webp"'
  );

  // Ensure content assets use .webp (no jpeg/png in data-src / src under img/assets)
  html = html.replace(
    /(data-src|src)="(img\/assets\/[^"]+)\.(jpe?g|png)"/gi,
    '$1="$2.webp"'
  );

  if (html !== before) {
    fs.writeFileSync(indexPath, html);
    console.log('  Updated index.html to WebP-only image references');
  } else {
    console.log('  index.html already WebP-only for content assets (logos updated if needed)');
  }
}

async function main() {
  const files = collectFiles();
  console.log(`Restoring + encoding ${files.length} index images at ~10% compression (WebP)...\n`);

  let totalWebpBefore = 0;
  let totalWebpAfter = 0;
  let skipped = 0;

  for (const rel of files) {
    try {
      const result = await optimizeFile(rel);
      if (!result) {
        skipped++;
        continue;
      }
      totalWebpBefore += result.webpBefore;
      totalWebpAfter += result.webpSize;
      const delta =
        result.webpBefore > 0
          ? ((result.webpSize / result.webpBefore - 1) * 100).toFixed(0)
          : 'n/a';
      const sign = result.webpBefore > 0 && result.webpSize >= result.webpBefore ? '+' : '';
      console.log(
        `  ${result.relPath}: webp ${(result.webpBefore / 1024).toFixed(0)}KB → ${(result.webpSize / 1024).toFixed(0)}KB (${sign}${delta}%) ${result.width}x${result.height} [${result.source}]`
      );
    } catch (err) {
      console.error(`  ERROR ${rel}:`, err.message);
    }
  }

  console.log('\nLogos → WebP:');
  await convertLogosToWebp();

  console.log('\nHTML:');
  updateIndexHtmlToWebpOnly();

  console.log('\n--- Summary ---');
  console.log(`Processed: ${files.length - skipped}, skipped: ${skipped}`);
  console.log(
    `WebP total: ${(totalWebpBefore / 1024 / 1024).toFixed(2)} MB → ${(totalWebpAfter / 1024 / 1024).toFixed(2)} MB`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
