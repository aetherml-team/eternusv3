#!/usr/bin/env node
/**
 * Restore HTML-referenced images (and hero pool) from best available source.
 * Picks the largest blob across dup siblings, git commits, and full git history.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { collectFromAllHtml, toAssetsRel, toSourceRel } = require('./lib/html-image-refs');

const PUBLIC = path.join(__dirname, '..', 'public');
const IMG = path.join(PUBLIC, 'img', 'assets');
const PRE_OPTIMIZE_COMMIT = '34fc9df^';
const JULY_TY_COMMIT = 'a0f4bda';
const GIT_COMMITS = [PRE_OPTIMIZE_COMMIT, JULY_TY_COMMIT];

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

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function gitCat(commit, gitPath) {
  try {
    return execSync(`git show ${commit}:${gitPath}`, {
      encoding: 'buffer',
      maxBuffer: 50 * 1024 * 1024,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch {
    return null;
  }
}

function findLargestDupSibling(relPath) {
  const ext = path.extname(relPath);
  const base = path.basename(relPath, ext);
  const absDir = path.join(IMG, path.dirname(relPath));
  if (!fs.existsSync(absDir)) return null;

  const dupRe = new RegExp(
    `^${escapeRegex(base)}(?: (\\d+)| copy (\\d+))${escapeRegex(ext)}$`,
    'i'
  );
  let best = null;
  let bestSize = 0;
  let bestName = null;

  for (const name of fs.readdirSync(absDir)) {
    if (!dupRe.test(name)) continue;
    const abs = path.join(absDir, name);
    const size = fs.statSync(abs).size;
    if (size > bestSize) {
      bestSize = size;
      best = fs.readFileSync(abs);
      bestName = name;
    }
  }

  if (!best) return null;
  return { buf: best, source: `dup:${bestName}`, bytes: bestSize };
}

function gitCatFromCommits(relPath) {
  const gitPath = `public/img/assets/${relPath.replace(/\\/g, '/')}`;
  const paths = [gitPath];
  if (/\.jpe?g$/i.test(relPath)) {
    paths.push(gitPath.replace(/\.jpe?g$/i, '.png'));
  }

  let best = null;
  let bestSize = 0;
  let bestSource = null;

  for (const commit of GIT_COMMITS) {
    for (const p of paths) {
      const buf = gitCat(commit, p);
      if (buf && buf.length > bestSize) {
        bestSize = buf.length;
        best = buf;
        bestSource = `git:${commit}`;
      }
    }
  }

  if (!best) return null;
  return { buf: best, source: bestSource, bytes: bestSize };
}

function gitCatLargestFromHistory(relPath) {
  const gitPath = `public/img/assets/${relPath.replace(/\\/g, '/')}`;
  const paths = [gitPath];
  if (/\.jpe?g$/i.test(relPath)) {
    paths.push(gitPath.replace(/\.jpe?g$/i, '.png'));
  }

  let hashes;
  try {
    hashes = execSync(`git log --follow --format=%H -- "${gitPath}"`, {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    })
      .trim()
      .split('\n')
      .filter(Boolean);
  } catch {
    return null;
  }

  let best = null;
  let bestSize = 0;
  let bestSource = null;

  for (const hash of hashes) {
    for (const p of paths) {
      const buf = gitCat(hash, p);
      if (buf && buf.length > bestSize) {
        bestSize = buf.length;
        best = buf;
        bestSource = `history:${hash.slice(0, 7)}`;
      }
    }
  }

  if (!best) return null;
  return { buf: best, source: bestSource, bytes: bestSize };
}

function resolveSource(relPath) {
  const candidates = [
    findLargestDupSibling(relPath),
    gitCatFromCommits(relPath),
    gitCatLargestFromHistory(relPath),
  ].filter(Boolean);

  if (!candidates.length) return null;
  return candidates.reduce((a, b) => (b.bytes > a.bytes ? b : a));
}

function writeRestored(relPath, buf) {
  const absPath = path.join(IMG, relPath);
  fs.mkdirSync(path.dirname(absPath), { recursive: true });
  fs.writeFileSync(absPath, buf);

  const webpPath = absPath.replace(/\.[^.]+$/, '.webp');
  if (fs.existsSync(webpPath)) {
    fs.unlinkSync(webpPath);
  }
}

function main() {
  const files = collectFiles();
  console.log(`Restoring ${files.length} images (largest of dup / git / history)...\n`);

  const stats = { restored: 0, skipped: 0, bySource: {} };

  for (const rel of files) {
    const found = resolveSource(rel);
    if (!found) {
      stats.skipped++;
      console.warn(`  SKIP (no source): ${rel}`);
      continue;
    }

    writeRestored(rel, found.buf);
    stats.restored++;
    stats.bySource[found.source.split(':')[0]] =
      (stats.bySource[found.source.split(':')[0]] || 0) + 1;
    console.log(`  OK ${rel} (${(found.bytes / 1024).toFixed(0)} KB, ${found.source})`);
  }

  console.log('\n--- Summary ---');
  console.log(`Restored: ${stats.restored}, no source: ${stats.skipped}`);
  console.log('By source:', stats.bySource);
}

main();
