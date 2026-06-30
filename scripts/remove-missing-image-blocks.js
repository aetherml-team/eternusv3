#!/usr/bin/env node
/**
 * Remove HTML blocks that reference image files missing from disk.
 */

const fs = require('fs');
const path = require('path');
const { PUBLIC, collectFromAllHtml, resolveOnDisk, decodeHtmlPath } = require('./lib/html-image-refs');

function getMissingPaths() {
  const { all } = collectFromAllHtml();
  return all.filter((ref) => !resolveOnDisk(ref).exists);
}

function blockReferencesMissing(block, missing) {
  const decoded = decodeHtmlPath(block);
  return missing.some((p) => {
    const bare = p.replace(/^img\//, '');
    return decoded.includes(p) || decoded.includes(bare) || decoded.includes(p.replace(/&/g, '&amp;'));
  });
}

function removePattern(html, pattern, missing, label) {
  let count = 0;
  const out = html.replace(pattern, (match) => {
    if (!blockReferencesMissing(match, missing)) return match;
    count++;
    return '';
  });
  return { html: out, count };
}

function removeInfiniteListItems(html, missing) {
  return removePattern(
    html,
    /<div class="infinite-list__image-item js-infinite-list__image-item">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>(?=\s*(?:<!-- Image item|<\/div>))/g,
    missing,
    'image-item'
  );
}

function removeInfiniteListHeadings(html, missingPostIds) {
  if (!missingPostIds.size) return { html, count: 0 };
  let count = 0;
  const out = html.replace(
    /<div class="infinite-list__item-heading js-infinite-list__heading"\s+data-post-id="(\d+)">[\s\S]*?<\/div>\s*<\/div>(?=\s*(?:<!-- Heading item|<\/div>))/g,
    (match, id) => {
      if (!missingPostIds.has(id)) return match;
      count++;
      return '';
    }
  );
  return { html: out, count };
}

function collectRemovedPostIds(html, missing) {
  const ids = new Set();
  const re = /<div class="infinite-list__image-item[\s\S]*?data-post-id="(\d+)"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    if (blockReferencesMissing(m[0], missing)) ids.add(m[1]);
  }
  return ids;
}

function removeSliderSlides(html, missing) {
  return removePattern(
    html,
    /<div class="slider-fullpage-backgrounds__section js-slider-fullpage__section[\s\S]*?<\/div>\s*<\/div>(?=\s*(?:<!-- Slide #|<!-- Arrows|<div class="slider-arrow))/g,
    missing,
    'slide'
  );
}

function removeHtmlCommentsWithMissing(html, missing) {
  let count = 0;
  const out = html.replace(/<!--[\s\S]*?-->/g, (comment) => {
    if (!blockReferencesMissing(comment, missing)) return comment;
    count++;
    return '';
  });
  return { html: out, count };
}

function stripSofiArmandoPage(html) {
  let count = 0;
  let out = html;

  // Masthead background image
  out = out.replace(
    /<!-- Featured media -->\s*<div class="masthead__background[\s\S]*?<!-- - Featured media -->/,
    () => {
      count++;
      return '<!-- Featured media removed (no assets) -->';
    }
  );

  // Gallery / parallax images section
  out = out.replace(
    /<!-- section IMAGES -->[\s\S]*?<!-- - section IMAGES -->/,
    () => {
      count++;
      return '<!-- section IMAGES removed (no assets) -->';
    }
  );

  // Video section background image only (keep play button)
  out = out.replace(
    /<div class="section__background overflow-hidden js-parallax"[\s\S]*?<div class="section__overlay overlay overlay_opacity-70"><\/div>\s*<\/div>/,
    () => {
      count++;
      return '<div class="section__overlay overlay overlay_opacity-70"></div>';
    }
  );

  // Auto-scroll next featured media
  out = out.replace(
    /<!-- Featured media -->\s*<div class="marquee-header__mask-media auto-scroll-next__wrapper-media"[\s\S]*?<!-- - Featured media -->/,
    () => {
      count++;
      return '<!-- Featured media removed (no assets) -->';
    }
  );

  return { html: out, count };
}

function processFile(filePath, missing) {
  let html = fs.readFileSync(filePath, 'utf8');
  const name = path.basename(filePath);
  let total = 0;

  const removedPostIds = collectRemovedPostIds(html, missing);

  let r = removeInfiniteListItems(html, missing);
  html = r.html;
  total += r.count;

  r = removeInfiniteListHeadings(html, removedPostIds);
  html = r.html;
  total += r.count;

  r = removeSliderSlides(html, missing);
  html = r.html;
  total += r.count;

  r = removeHtmlCommentsWithMissing(html, missing);
  html = r.html;
  total += r.count;

  if (name === 'details-sofi-armando.html') {
    r = stripSofiArmandoPage(html);
    html = r.html;
    total += r.count;
  }

  // Remove any remaining top-level blocks with missing lazy/src refs (col wrappers etc.)
  r = removePattern(
    html,
    /<div class="col-[^"]*">\s*<a[\s\S]*?<\/a>\s*<\/div>/g,
    missing,
    'col-block'
  );
  html = r.html;
  total += r.count;

  r = removePattern(
    html,
    /<div class="parallax[\s\S]*?<\/div>\s*<\/div>\s*(?=<div class="container-fluid|<\/div>\s*<!--)/g,
    missing,
    'parallax'
  );
  html = r.html;
  total += r.count;

  if (total > 0) {
    fs.writeFileSync(filePath, html);
  }
  return total;
}

function main() {
  const missing = getMissingPaths();
  console.log(`Missing image paths on disk: ${missing.length}\n`);

  let grand = 0;
  for (const name of fs.readdirSync(PUBLIC)) {
    if (!name.endsWith('.html')) continue;
    const n = processFile(path.join(PUBLIC, name), missing);
    if (n > 0) console.log(`${name}: removed ${n} block(s)`);
    grand += n;
  }

  console.log(`\nDone. ${grand} total block(s) removed.`);
}

main();
