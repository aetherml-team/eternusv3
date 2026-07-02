#!/usr/bin/env node
/**
 * Remove macOS Finder duplicate copies: "filename 2.jpg", "filename 3.webp", etc.
 * Dry-run by default; pass --apply to delete.
 */

const fs = require('fs');
const path = require('path');

const IMG = path.join(__dirname, '..', 'public', 'img', 'assets');
/** macOS Finder dupes: "file 2.jpg", "file 3.webp", "file copy 2.jpg" */
const DUP_RE = /(?:\s\d+| copy \d+)\.[^.]+$/i;

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const abs = path.join(dir, name);
    if (fs.statSync(abs).isDirectory()) {
      walk(abs, files);
    } else if (DUP_RE.test(name)) {
      files.push(abs);
    }
  }
  return files;
}

function main() {
  const apply = process.argv.includes('--apply');
  const dupes = walk(IMG);
  let totalBytes = 0;

  for (const abs of dupes) {
    totalBytes += fs.statSync(abs).size;
  }

  console.log(`Found ${dupes.length} dup-suffix files (${(totalBytes / 1024 / 1024).toFixed(1)} MB)`);

  if (!dupes.length) {
    return;
  }

  if (!apply) {
    console.log('\nDry-run — pass --apply to delete. Examples:');
    dupes.slice(0, 10).forEach((p) => console.log(`  ${path.relative(IMG, p)}`));
    if (dupes.length > 10) console.log(`  ... and ${dupes.length - 10} more`);
    return;
  }

  for (const abs of dupes) {
    fs.unlinkSync(abs);
  }
  console.log(`Deleted ${dupes.length} files, reclaimed ${(totalBytes / 1024 / 1024).toFixed(1)} MB`);
}

main();
