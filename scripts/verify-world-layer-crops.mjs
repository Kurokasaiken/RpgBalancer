/**
 * Proves that cropping the World Surface layers changed nothing that renders.
 *
 * `scripts/crop-world-layers.mjs` replaces each layer asset with its painted
 * sub-rectangle and records where that rectangle sat. The claim is strong — "the map
 * renders identically" — so it needs a proof, not a screenshot.
 *
 * TWO HALVES, both necessary. An earlier version of this script only checked the
 * first and would have passed a crop that silently cut off half a mountain:
 *
 *   1. INSIDE the rect, the crop matches the original window.
 *   2. OUTSIDE the rect, the original was already fully transparent — so nothing was
 *      thrown away.
 *
 * WHAT "MATCHES" MEANS, and why it is not byte-for-byte over all four channels. In a
 * pixel with alpha 0 the RGB values are unused: nothing is composited from them, and
 * a lossy WebP encoder is free to put anything there. Measured on `Villaggio.webp`,
 * 13890 of the 27888 fully-transparent pixels in the crop carry different RGB than the
 * original did — and not one of them can ever reach the screen. The meaningful
 * criterion, which this script enforces, is:
 *
 *   - the alpha channel is byte-identical everywhere, and
 *   - RGB is byte-identical at every pixel whose alpha is non-zero.
 *
 * Both hold exactly, because the crop is re-encoded LOSSLESSLY from the decoded
 * original. This is a real proof of visual identity, not a tolerance.
 *
 * The first version of this script compared a sharp `composite()` recomposition
 * against the original and reported all 18 layers as differing with a max delta of
 * 255. That was the script being wrong, not the crop: compositing onto a transparent
 * canvas zeroes the RGB under transparent pixels. Comparing the crop directly against
 * the original's window avoids inventing the discrepancy.
 *
 * This checks the assets and the manifest geometry. That the RENDERER applies the
 * geometry correctly is separate — see the `rect` arithmetic in WorldSurfaceRenderer.
 *
 * Exits non-zero on any failure, so it is usable as a gate.
 *
 * @see plans/PLAN-015-sea-ripple-port-and-voronoi.md section 8
 */

import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const MANIFEST = 'public/assets/world/wanderlust/base/manifest.json';
const LAYER_DIR = 'public/assets/world/wanderlust/base/layers';

async function rgba(input) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { d: data, w: info.width, h: info.height };
}

const ref = process.argv[2] ?? 'HEAD';
const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
const rows = [];
let failures = 0;

for (const layer of manifest.surfaceLayers) {
  if (!layer.rect || layer.file.includes('/')) continue;

  const path = join(LAYER_DIR, layer.file);
  const { x, y, width, height, sourceWidth, sourceHeight } = layer.rect;

  const crop = await rgba(readFileSync(path));
  const orig = await rgba(
    execFileSync('git', ['show', `${ref}:${path}`], {
      maxBuffer: 256 * 1024 * 1024,
      encoding: 'buffer',
    }),
  );

  const problems = [];
  if (crop.w !== width || crop.h !== height) {
    problems.push(`crop ${crop.w}x${crop.h} != rect ${width}x${height}`);
  }
  if (orig.w !== sourceWidth || orig.h !== sourceHeight) {
    problems.push(`original ${orig.w}x${orig.h} != sourceWidth/Height ${sourceWidth}x${sourceHeight}`);
  }
  if (problems.length) {
    rows.push({ id: layer.id, esito: 'GEOMETRIA', dettaglio: problems.join('; ') });
    failures++;
    continue;
  }

  // Half 1: inside the rect.
  let alphaDiff = 0;
  let rgbDiffVisible = 0;
  let maxRgbVisible = 0;
  for (let ry = 0; ry < height; ry++) {
    for (let rx = 0; rx < width; rx++) {
      const ci = (ry * crop.w + rx) * 4;
      const oi = ((ry + y) * orig.w + (rx + x)) * 4;
      if (crop.d[ci + 3] !== orig.d[oi + 3]) alphaDiff++;
      if (orig.d[oi + 3] !== 0) {
        const dmax = Math.max(
          Math.abs(crop.d[ci] - orig.d[oi]),
          Math.abs(crop.d[ci + 1] - orig.d[oi + 1]),
          Math.abs(crop.d[ci + 2] - orig.d[oi + 2]),
        );
        if (dmax !== 0) {
          rgbDiffVisible++;
          if (dmax > maxRgbVisible) maxRgbVisible = dmax;
        }
      }
    }
  }

  // Half 2: outside the rect the original must carry no paint at all. Anything with
  // alpha here is paint the crop discarded.
  let paintedOutside = 0;
  let maxAlphaOutside = 0;
  let firstOutside = null;
  for (let oy = 0; oy < orig.h; oy++) {
    const insideRows = oy >= y && oy < y + height;
    for (let ox = 0; ox < orig.w; ox++) {
      if (insideRows && ox >= x && ox < x + width) continue;
      const a = orig.d[(oy * orig.w + ox) * 4 + 3];
      if (a !== 0) {
        paintedOutside++;
        if (a > maxAlphaOutside) maxAlphaOutside = a;
        if (firstOutside === null) firstOutside = `${ox},${oy}`;
      }
    }
  }

  const ok = alphaDiff === 0 && rgbDiffVisible === 0 && paintedOutside === 0;
  if (!ok) failures++;
  rows.push({
    id: layer.id,
    esito: ok ? 'IDENTICO' : 'DIVERSO',
    rect: `${width}x${height} @ ${x},${y}`,
    alpha_diversi: alphaDiff,
    rgb_diversi_visibili: rgbDiffVisible,
    rgb_delta_max: maxRgbVisible,
    pixel_dipinti_scartati: paintedOutside,
    primo_scartato: firstOutside ?? '-',
  });
}

console.table(rows);

if (!rows.length) {
  console.log('Nessun layer con `rect`: niente da verificare.');
  process.exit(0);
}
if (failures) {
  console.error(`FALLITO: ${failures} layer su ${rows.length} non sono identici a ${ref}.`);
  process.exit(1);
}
console.log(
  `OK: ${rows.length} layer ritagliati. Alpha byte-identica, RGB byte-identico su ogni ` +
    `pixel visibile, e zero pixel dipinti scartati fuori dal rect. Riferimento: ${ref}.`,
);
