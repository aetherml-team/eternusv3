/**
 * Shared helpers: collect raster image paths referenced in public HTML.
 */

const fs = require('fs');
const path = require('path');

const PUBLIC = path.join(__dirname, '..', '..', 'public');
const RASTER_RE = /\.(jpe?g|png|webp|gif)$/i;

const ATTR_PATTERNS = [
  /(?:src|data-src|data-srcset|href|data-texture-src)="(img\/[^"]+)"/gi,
  /url\(['"]?(img\/[^'")\s]+)/gi,
];

function decodeHtmlPath(p) {
  return p
    .replace(/&amp;/g, '&')
    .replace(/&#38;/g, '&')
    .replace(/\/{2,}/g, '/')
    .replace('img/assets/wedingDetails/', 'img/assets/wedingDetails/'); // normalize only doubles
}

function isRasterPath(p) {
  return RASTER_RE.test(p);
}

const SKIP_PATH = /logo-eternus|favicon/i;

function toWebpPath(p) {
  if (/\.webp$/i.test(p)) return p;
  if (/\.(jpe?g|png)$/i.test(p)) return p.replace(/\.(jpe?g|png)$/i, '.webp');
  return null;
}

function toSourceRel(relPath) {
  if (/\.webp$/i.test(relPath)) {
    const jpg = relPath.replace(/\.webp$/i, '.jpg');
    const jpeg = relPath.replace(/\.webp$/i, '.jpeg');
    const png = relPath.replace(/\.webp$/i, '.png');
    return { jpg, jpeg, png, webp: relPath };
  }
  return { jpg: relPath, jpeg: null, png: null, webp: toWebpPath(relPath) };
}

function toAssetsRel(imgPath) {
  const decoded = decodeHtmlPath(imgPath);
  if (!decoded.startsWith('img/assets/')) return null;
  return decoded.slice('img/assets/'.length);
}

function collectFromHtml(html) {
  const refs = new Set();
  for (const re of ATTR_PATTERNS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(html)) !== null) {
      const raw = m[1];
      const decoded = decodeHtmlPath(raw);
      if (!isRasterPath(decoded) || SKIP_PATH.test(decoded)) continue;
      if (decoded.endsWith('.webp')) {
        refs.add(decoded);
        continue;
      }
      const webp = toWebpPath(decoded);
      if (webp) refs.add(webp);
      else refs.add(decoded);
    }
  }
  return refs;
}

function collectFromAllHtml() {
  const byPage = {};
  const all = new Set();

  for (const name of fs.readdirSync(PUBLIC)) {
    if (!name.endsWith('.html')) continue;
    const filePath = path.join(PUBLIC, name);
    const html = fs.readFileSync(filePath, 'utf8');
    const refs = collectFromHtml(html);
    byPage[name] = [...refs].sort();
    refs.forEach((r) => all.add(r));
  }

  return { byPage, all: [...all].sort() };
}

function resolveOnDisk(imgPath) {
  const decoded = decodeHtmlPath(imgPath);
  const abs = path.join(PUBLIC, decoded);
  if (fs.existsSync(abs)) return { abs, decoded, exists: true };
  return { abs, decoded, exists: false };
}

function statRefs(refs) {
  let bytes = 0;
  const missing = [];
  let count = 0;

  for (const ref of refs) {
    const { abs, decoded, exists } = resolveOnDisk(ref);
    if (!exists) {
      missing.push(decoded);
      continue;
    }
    count++;
    bytes += fs.statSync(abs).size;
  }

  return { count, bytes, webpBytes: bytes, missing };
}

module.exports = {
  PUBLIC,
  decodeHtmlPath,
  collectFromHtml,
  collectFromAllHtml,
  resolveOnDisk,
  statRefs,
  toAssetsRel,
  isRasterPath,
  toWebpPath,
  toSourceRel,
};
