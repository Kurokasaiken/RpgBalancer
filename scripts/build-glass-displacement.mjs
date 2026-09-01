/**
 * Generates the displacement map that gives the `Window` primitive real glass
 * refraction at its rim.
 *
 * `feDisplacementMap` reads a vector field out of an image: the red channel drives
 * the horizontal shift and the green the vertical, with 128 meaning "no shift". So
 * the refraction can be solved once, offline, and baked into a texture — which is
 * what this does. The alternative is generating the field at runtime with
 * `feTurbulence`, and that is the wrong tool twice over: turbulence is noise rather
 * than a lens, and it is the single most expensive SVG filter primitive.
 *
 * The profile is a convex lens. The middle of the glass is left alone — looking
 * straight through the thickest part of a lens barely bends anything — and the
 * displacement climbs steeply through the outer band, pulling the image inward the
 * way a real curved edge does. That inward pull at the rim is the whole tell of
 * glass; without it a circular overlay reads as a coloured gradient.
 *
 * Deliberately NOT physically solved through Snell's law. The refractive index, the
 * glass thickness and the exact curve would each need a number nobody has picked,
 * and at 200-odd pixels across the difference between a correct solve and a curve
 * that behaves the same way is invisible.
 */

import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const OUT = 'public/assets/ui/glass_displacement.png';
const SIZE = 256;

/**
 * Share of the radius that refracts, from the outer edge inward.
 *
 * At 0.30 the inner 70% of the glass is optically flat, so whatever the Window
 * frames stays readable. Widening this frosts the whole disc.
 */
const BEZEL = 0.3;

/**
 * How sharply the displacement ramps up across the bezel.
 *
 * Above 1 the ramp starts gently and steepens toward the rim, which is how a convex
 * surface actually behaves. A linear ramp reads as a bevel — a flat chamfer — rather
 * than as a curve.
 */
const FALLOFF = 2.2;

const buf = Buffer.alloc(SIZE * SIZE * 4);
const centre = (SIZE - 1) / 2;

for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const dx = (x - centre) / centre;
    const dy = (y - centre) / centre;
    const r = Math.hypot(dx, dy);

    let mag = 0;
    if (r > 1 - BEZEL && r <= 1) {
      const t = (r - (1 - BEZEL)) / BEZEL;
      mag = t ** FALLOFF;
    }

    // Pull inward along the radius. Guard r = 0, where there is no direction.
    const ux = r > 1e-6 ? -dx / r : 0;
    const uy = r > 1e-6 ? -dy / r : 0;

    const i = (y * SIZE + x) * 4;
    buf[i] = Math.round(128 + ux * mag * 127);
    buf[i + 1] = Math.round(128 + uy * mag * 127);
    // Blue is unused by the filter; alpha must be opaque or the channels are
    // premultiplied away before feDisplacementMap ever samples them.
    buf[i + 2] = 128;
    buf[i + 3] = 255;
  }
}

mkdirSync('public/assets/ui', { recursive: true });

// PNG, not WebP: this is a vector field, and lossy compression on the R/G channels
// would show up as the image wobbling where the map should be perfectly smooth.
const info = await sharp(buf, { raw: { width: SIZE, height: SIZE, channels: 4 } })
  .png({ compressionLevel: 9 })
  .toFile(OUT);

console.log(`${OUT}  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(1)} KB`);
console.log(`  bezel ${BEZEL * 100}% del raggio, falloff ${FALLOFF}`);
