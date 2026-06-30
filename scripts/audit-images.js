#!/usr/bin/env node
/**
 * Audit raster images referenced in public/*.html — sizes, missing paths, per-page totals.
 */

const path = require('path');
const { collectFromAllHtml, statRefs, toAssetsRel } = require('./lib/html-image-refs');

function mb(b) {
  return (b / 1024 / 1024).toFixed(2);
}

function folderKey(imgPath) {
  const rel = toAssetsRel(imgPath);
  if (!rel) return 'other';
  const parts = rel.split('/');
  return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : parts[0];
}

function main() {
  const { byPage, all } = collectFromAllHtml();
  const global = statRefs(all);

  console.log('=== Image audit (HTML-referenced raster files) ===\n');
  console.log(`Unique references: ${all.length}`);
  console.log(`On disk: ${global.count} files, ${mb(global.bytes)} MB fallback, ${mb(global.webpBytes)} MB webp`);
  console.log(`Missing: ${global.missing.length}`);

  if (global.missing.length) {
    console.log('\nMissing paths:');
    global.missing.forEach((p) => console.log(`  - ${p}`));
  }

  console.log('\n--- Per page ---');
  const pageRows = Object.entries(byPage)
    .map(([page, refs]) => {
      const s = statRefs(refs);
      return { page, refs: refs.length, ...s };
    })
    .sort((a, b) => b.bytes - a.bytes);

  for (const row of pageRows) {
    console.log(
      `${row.page}: ${row.refs} refs, ${mb(row.bytes)} MB fallback, ${row.missing.length} missing`
    );
  }

  const byFolder = {};
  for (const ref of all) {
    const key = folderKey(ref);
    if (!byFolder[key]) byFolder[key] = [];
    byFolder[key].push(ref);
  }

  console.log('\n--- By folder (top 15) ---');
  const folderRows = Object.entries(byFolder)
    .map(([folder, refs]) => ({ folder, ...statRefs(refs) }))
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 15);

  for (const row of folderRows) {
    const avg = row.count ? row.bytes / row.count / 1024 : 0;
    console.log(
      `${row.folder}: ${row.count} files, ${mb(row.bytes)} MB, avg ${avg.toFixed(0)} KB, ${row.missing.length} missing`
    );
  }

  console.log('\n--- WebP coverage ---');
  const withWebp = all.filter((ref) => {
    const { abs, exists } = require('./lib/html-image-refs').resolveOnDisk(ref);
    if (!exists) return false;
    const webp = abs.replace(/\.[^.]+$/, '.webp');
    return require('fs').existsSync(webp);
  });
  console.log(`${withWebp.length} / ${global.count} on-disk refs have .webp siblings`);
}

main();
