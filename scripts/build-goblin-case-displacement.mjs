/**
 * Rectangular displacement map for the GoblinInvasionWindow glass case.
 *
 * The Window primitive's `glass_displacement.png` is circular and distorts a
 * rectangular image into a sphere; this one is an ellipse/circular lens shaped
 * to the 476 x 376 inner aspect of the goblin case.
 *
 * `feDisplacementMap` reads R/G with 128 = no shift. The field pulls the image
 * inward at the rim, which is the tell of a convex glass pane.
 */

import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const OUT = 'public/assets/ui/goblin_case_displacement.png';
const W = 520;
const H = 420;
const RIM = 22;
const INNER_W = W - RIM * 2;
const INNER_H = H - RIM * 2;

// Keep the larger axis power-of-two-ish; derive the other to match the case aspect.
const SIZE_X = 512;
const SIZE_Y = Math.round(SIZE_X * (INNER_H / INNER_W));

/** Share of the radius that refracts, from the outer edge inward. */
const BEZEL = 0.32;
/** How sharply the displacement ramps up across the bezel. */
const FALLOFF = 2.2;

const buf = Buffer.alloc(SIZE_X * SIZE_Y * 4);
const centreX = (SIZE_X - 1) / 2;
const centreY = (SIZE_Y - 1) / 2;

for (let y = 0; y < SIZE_Y; y++) {
  for (let x = 0; x < SIZE_X; x++) {
    const dx = (x - centreX) / centreX;
    const dy = (y - centreY) / centreY;
    const r = Math.hypot(dx, dy);

    let mag = 0;
    if (r > 1 - BEZEL && r <= 1) {
      const t = (r - (1 - BEZEL)) / BEZEL;
      mag = t ** FALLOFF;
    }

    const ux = r > 1e-6 ? -dx / r : 0;
    const uy = r > 1e-6 ? -dy / r : 0;

    const i = (y * SIZE_X + x) * 4;
    buf[i] = Math.round(128 + ux * mag * 127);
    buf[i + 1] = Math.round(128 + uy * mag * 127);
    buf[i + 2] = 128;
    buf[i + 3] = 255;
  }
}

mkdirSync('public/assets/ui', { recursive: true });

const info = await sharp(buf, { raw: { width: SIZE_X, height: SIZE_Y, channels: 4 } })
  .png({ compressionLevel: 9 })
  .toFile(OUT);

console.log(`${OUT}  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(1)} KB`);
console.log(`  bezel ${BEZEL * 100}%, falloff ${FALLOFF}, aspect ${INNER_W}/${INNER_H}`);
