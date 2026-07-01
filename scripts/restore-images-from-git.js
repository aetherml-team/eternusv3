#!/usr/bin/env node
/**
 * Restore HTML-referenced images (and hero pool) from a pre-optimization git commit.
 * Default: a0f4bda (before sharp overwrite pass).
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { collectFromAllHtml, toAssetsRel } = require('./lib/html-image-refs');

const PUBLIC = path.join(__dirname, '..', 'public');
const IMG = path.join(PUBLIC, 'img', 'assets');
const DEFAULT_COMMIT = 'a0f4bda';

function collectFiles() {
  const files = new Set();
  const { all } = collectFromAllHtml();

  for (const imgPath of all) {
    const rel = toAssetsRel(imgPath);
    if (rel) files.add(rel);
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

function restoreFile(commit, relPath) {
  const gitPath = `public/img/assets/${relPath.replace(/\\/g, '/')}`;
  let buf = gitCat(commit, gitPath);

  if (!buf && /\.jpe?g$/i.test(relPath)) {
    const pngPath = gitPath.replace(/\.jpe?g$/i, '.png');
    buf = gitCat(commit, pngPath);
  }

  if (!buf) return { status: 'missing' };

  const absPath = path.join(IMG, relPath);
  fs.mkdirSync(path.dirname(absPath), { recursive: true });
  fs.writeFileSync(absPath, buf);

  const webpPath = absPath.replace(/\.[^.]+$/, '.webp');
  if (fs.existsSync(webpPath)) {
    fs.unlinkSync(webpPath);
  }

  return { status: 'restored', bytes: buf.length };
}

function main() {
  const commit = process.argv[2] || DEFAULT_COMMIT;
  const files = collectFiles();

  console.log(`Restoring ${files.length} images from commit ${commit}...\n`);

  let restored = 0;
  let missing = 0;

  for (const rel of files) {
    const result = restoreFile(commit, rel);
    if (result.status === 'restored') {
      restored++;
      console.log(`  OK ${rel} (${(result.bytes / 1024).toFixed(0)} KB)`);
    } else {
      missing++;
      console.warn(`  SKIP (not in git): ${rel}`);
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Restored: ${restored}, not found in git: ${missing}`);
}

main();
