/**
 * Crops the World Surface layer assets to their painted bounding box.
 *
 * WHY. The layers were authored as full-canvas bakes and most of them paint almost
 * nothing. Measured on the shipped set: 17 of 24 layers cover between 1% and 8% of the
 * canvas, and every one of them still cost a full 3072x2049x4 = 24 MB of decoded RGBA
 * in the browser. `Villaggio.webp` paints 1% of the canvas and occupied 24 MB. Of the
 * map's 562 MB of decoded RGBA, 397 MB (71%) was transparent pixels.
 *
 * Disk size is NOT the point — the whole directory is 9.5 MB of compressed WebP. The
 * cost is the decoded bitmap the browser holds per layer, which is width*height*4
 * regardless of how compressible or how empty the image is.
 *
 * WHY IT CHANGES NOTHING VISIBLE. `renderer.imageFit: 'fill'` maps the whole source
 * onto the whole canvas linearly, so a source pixel at sx lands at sx/sourceWidth of
 * the canvas. Placing a crop at rect.x/sourceWidth and sizing it to
 * rect.width/sourceWidth puts every pixel back exactly where the stretch had it. The
 * renderer does this from the `rect` this script writes into the manifest.
 *
 * Two choices that make "identical" true rather than approximately true:
 *
 * Lossless re-encode. The crop is written with `webp({ lossless: true })` from the
 * DECODED original. A lossy re-encode of an already-lossy source shifts pixel values,
 * which would make the claim false for no benefit — the file is going to be small
 * either way because the content is small.
 *
 * Alpha > 0, not alpha > threshold. The bounding box includes any pixel with even one
 * unit of alpha, plus a safety margin. Cropping to "visually opaque" pixels would trim
 * the soft edge of a brush stroke, and that IS a changed pixel.
 *
 * Originals are recoverable from git; the script refuses to run on anything untracked.
 * `scripts/verify-world-layer-crops.mjs` proves the result by recomposing.
 *
 * @see plans/PLAN-015-sea-ripple-port-and-voronoi.md section 8
 */

import sharp from 'sharp';
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const MANIFEST = 'public/assets/world/wanderlust/base/manifest.json';
const LAYER_DIR = 'public/assets/world/wanderlust/base/layers';

/**
 * Pixels of margin kept around the painted bounds. Cheap insurance: it costs a few
 * hundred KB of decoded RGBA and removes any question of clipping an edge.
 */
const MARGIN_PX = 2;

/**
 * Layers whose bounding box already covers this much of the canvas are left alone.
 * Below the threshold the crop is worth a manifest entry; above it, it is not.
 */
const SKIP_ABOVE_COVERAGE = 0.9;

/**
 * `event_shroud_*` are excluded by name, not by coverage.
 *
 * They are the only layers the renderer positions itself — it gives them an explicit
 * offset of ±canvas width and `objectFit: 'cover'` so the two halves slide in from
 * off-screen. Cropping them would fight that, and they are 100% painted anyway.
 */
const EXCLUDE_IDS = new Set(['event_shroud_left', 'event_shroud_right']);

const dryRun = process.argv.includes('--dry-run');

function isTracked(path) {
  try {
    execFileSync('git', ['ls-files', '--error-unmatch', path], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/** Bounding box of every pixel with a non-zero alpha. Returns null if fully transparent. */
async function paintedBounds(path) {
  const { data, info } = await sharp(path)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    const row = y * width * channels;
    for (let x = 0; x < width; x++) {
      if (data[row + x * channels + 3] !== 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < 0) return null;
  return { minX, minY, maxX, maxY, width, height };
}

const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
const rows = [];
let mbBefore = 0;
let mbAfter = 0;

for (const layer of manifest.surfaceLayers) {
  // A `/` in `file` means the asset lives under assets/atmosphere, not base/layers.
  if (layer.file.includes('/') || EXCLUDE_IDS.has(layer.id)) continue;

  const path = join(LAYER_DIR, layer.file);
  let stat;
  try {
    stat = statSync(path);
  } catch {
    rows.push({ id: layer.id, esito: 'FILE ASSENTE', file: layer.file });
    continue;
  }

  if (!isTracked(path)) {
    throw new Error(
      `${path} is not tracked by git. Refusing to overwrite an asset that cannot be recovered.`,
    );
  }

  const b = await paintedBounds(path);
  if (!b) {
    rows.push({ id: layer.id, esito: 'INTERAMENTE TRASPARENTE — salto' });
    continue;
  }

  const x = Math.max(0, b.minX - MARGIN_PX);
  const y = Math.max(0, b.minY - MARGIN_PX);
  const right = Math.min(b.width, b.maxX + 1 + MARGIN_PX);
  const bottom = Math.min(b.height, b.maxY + 1 + MARGIN_PX);
  const w = right - x;
  const h = bottom - y;

  const full = (b.width * b.height * 4) / 1048576;
  const cropped = (w * h * 4) / 1048576;
  const coverage = (w * h) / (b.width * b.height);

  mbBefore += full;

  if (coverage > SKIP_ABOVE_COVERAGE) {
    mbAfter += full;
    delete layer.rect;
    rows.push({
      id: layer.id,
      esito: `salto (copre ${(coverage * 100).toFixed(0)}%)`,
      MB: full.toFixed(1),
      MB_dopo: full.toFixed(1),
    });
    continue;
  }

  mbAfter += cropped;

  if (!dryRun) {
    const out = await sharp(path)
      .extract({ left: x, top: y, width: w, height: h })
      .webp({ lossless: true })
      .toBuffer();
    writeFileSync(path, out);
  }

  layer.rect = {
    x,
    y,
    width: w,
    height: h,
    sourceWidth: b.width,
    sourceHeight: b.height,
  };

  rows.push({
    id: layer.id,
    esito: dryRun ? 'da ritagliare' : 'ritagliato',
    rect: `${w}x${h} @ ${x},${y}`,
    copre: `${(coverage * 100).toFixed(0)}%`,
    MB: full.toFixed(1),
    MB_dopo: cropped.toFixed(1),
    KB_disco: dryRun ? '-' : (statSync(path).size / 1024).toFixed(0),
  });
}

if (!dryRun) {
  writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
}

console.table(rows);
console.log(
  `RGBA decodificato dei layer di base: ${mbBefore.toFixed(0)} MB -> ${mbAfter.toFixed(0)} MB ` +
    `(risparmio ${(mbBefore - mbAfter).toFixed(0)} MB, ${(((mbBefore - mbAfter) / mbBefore) * 100).toFixed(0)}%)`,
);
if (dryRun) console.log('DRY RUN: nessun file scritto.');
else console.log(`Manifest aggiornato: ${MANIFEST}`);
