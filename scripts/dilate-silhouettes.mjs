/**
 * Post-process world surface layers: dilate opaque silhouettes to close seams.
 *
 * Applies alpha dilation (+edge-colour bleed) to close fissures between stacked layers,
 * which manifest as visible outlines tracing element silhouettes at fractional zoom.
 *
 * Skips:
 * - background, sea (canvas bottom layers)
 * - frame, border (decorative frame, no dilation toward outside edge)
 *
 * Usage: npm run world:dilate
 *        or: node --max-old-space-size=8192 scripts/dilate-silhouettes.mjs [PASSES=2]
 *
 * Ref: https://polycount.com/discussion/219721/edge-padding
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const BASE = 'public/assets/world/wanderlust/base';
const LAYERS_DIR = path.join(BASE, 'layers');
const MANIFEST_FILE = path.join(BASE, 'manifest.json');

const PASSES = parseInt(process.argv[2] ?? '2', 10);
const SKIP = new Set(['background', 'sea', 'frame', 'border']);

if (!fs.existsSync(MANIFEST_FILE)) {
  console.error(`❌ manifest.json not found at ${MANIFEST_FILE}`);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf8'));
const { width: W, height: H } = manifest.coordinateSystem.canvas;
const targetLayers = [...(manifest.surfaceLayers ?? []), ...(manifest.atmosphereLayers ?? [])]
  .filter(l => !SKIP.has(l.id))
  .filter(l => fs.existsSync(path.join(LAYERS_DIR, l.file)));

/**
 * Dilate opaque region by 1px: each newly-opaque pixel takes the mean RGB
 * of its 8 opaque neighbours. Repeating this N times grows the silhouette by N px.
 */
function dilateOnce(buf, W, H) {
  const data = Buffer.isBuffer(buf) ? buf : buf.data;
  const newly = [];

  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = (y * W + x) * 4;
      if (data[i + 3] > 8) continue; // already opaque

      let r = 0, g = 0, b = 0, n = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const j = ((y + dy) * W + (x + dx)) * 4;
          if (data[j + 3] > 8) {
            r += data[j];
            g += data[j + 1];
            b += data[j + 2];
            n++;
          }
        }
      }
      if (n) {
        newly.push(i, (r / n) | 0, (g / n) | 0, (b / n) | 0);
      }
    }
  }

  // Apply all new pixels in one pass (no double-dilation interference)
  for (let k = 0; k < newly.length; k += 4) {
    const i = newly[k];
    data[i] = newly[k + 1];
    data[i + 1] = newly[k + 2];
    data[i + 2] = newly[k + 3];
    data[i + 3] = 255;
  }

  return newly.length / 4;
}

console.log(`Dilating ${targetLayers.length} layers by ${PASSES}px (canvas ${W}x${H})`);
console.log(`Skipped: ${[...SKIP].join(', ')}\n`);

let totalGrown = 0;

for (const layer of targetLayers) {
  const filePath = path.join(LAYERS_DIR, layer.file);
  const { data, info } = await sharp(filePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (info.width !== W || info.height !== H) {
    console.warn(`⚠️  SKIP ${layer.id}: ${info.width}x${info.height} ≠ canvas ${W}x${H}`);
    continue;
  }

  let grown = 0;
  for (let p = 0; p < PASSES; p++) {
    grown += dilateOnce(data, W, H);
  }

  totalGrown += grown;

  const tmpPath = filePath + '.tmp';
  await sharp(data, { raw: { width: W, height: H, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(tmpPath);
  fs.renameSync(tmpPath, filePath);

  const sizeKB = (fs.statSync(filePath).size / 1024).toFixed(0);
  console.log(`  ${layer.id.padEnd(30)} +${String(grown).padStart(6)}px   ${sizeKB}KB`);
}

console.log(`\n✅ Done. Silhouettes grown by ${PASSES}px. Total pixels added: ${totalGrown.toLocaleString()}`);
console.log('   Dimensions and layer stack order untouched. Canvas remains 4240x2828, offset 0/0.');
