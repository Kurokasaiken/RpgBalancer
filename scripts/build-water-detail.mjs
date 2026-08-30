/**
 * Generates the two micro-detail tiles for the water field.
 *
 * The sea painting carries almost no high-frequency detail of its own — measured
 * at 2.4-3.4 of 255 after subtracting a 3px blur, roughly 1% of the dynamic range.
 * That is why the earlier Pixi DisplacementFilter was invisible: displacement moves
 * pixels, and moving pixels that are identical to their neighbours produces pixels
 * that are identical to their neighbours. The fix is not a better filter, it is
 * giving the sea some detail to move in the first place.
 *
 * So these tiles ARE the detail. Two of them scroll across the sea in diverging
 * directions at different speeds; the painting underneath never moves.
 *
 * Two properties matter more than the numbers:
 *
 * Seamless by construction. The noise lattice is periodic, so the tile wraps
 * exactly. Nothing is cross-faded or mirrored — a mirror seam reads as a mirror
 * seam the moment it drifts past.
 *
 * Chromatically inside the painting. The colours are sampled from the sea layer
 * itself: open water averages RGB (110, 136, 141) with luminance p10-p90 of
 * 112-150. The highlight and shadow tints sit inside that band, so the detail stays
 * within the sea's own tonal range.
 *
 * Drawn, not mottled. The first version used isotropic value noise, and it was
 * wrong for this map: soft tonal blotches read as grime on artwork whose water is
 * drawn as line work — fine curved strokes following the coast. So the pattern is
 * built as bands warped by low-frequency noise and reduced to their ridges, giving
 * broken horizontal strokes that meander like a current. Same idiom as the painting,
 * so it can be visible without looking like a stain.
 */

import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const OUT_DIR = 'public/assets/atmosphere/water';

/** Sampled from Mare.webp — see the module comment. */
const SEA_MEAN = { r: 110, g: 136, b: 141 };
/** Luminance offset either side of the mean, in 0-255 points. */
const TINT_DELTA = 16;

/**
 * A deterministic PRNG. The tiles are committed assets, so regenerating them must
 * produce the same bytes rather than a new random field every build.
 */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const fade = (t) => t * t * (3 - 2 * t);

/**
 * Value noise on a periodic lattice.
 *
 * `periodX` and `periodY` are the lattice size in cells across the tile, so both
 * axes wrap at the tile edge whatever they are. Making periodX smaller than
 * periodY stretches every feature horizontally — that is where the elongated
 * streaks come from, without a directional blur that would break the tiling.
 */
function makeNoise(periodX, periodY, rng) {
  const lattice = new Float32Array(periodX * periodY);
  for (let i = 0; i < lattice.length; i++) lattice[i] = rng();

  return (u, v) => {
    const x = u * periodX;
    const y = v * periodY;
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const fx = fade(x - x0);
    const fy = fade(y - y0);
    // The modulo is what makes it seamless: cell periodX-1 blends back into cell 0.
    const xa = ((x0 % periodX) + periodX) % periodX;
    const xb = (xa + 1) % periodX;
    const ya = ((y0 % periodY) + periodY) % periodY;
    const yb = (ya + 1) % periodY;

    const v00 = lattice[ya * periodX + xa];
    const v10 = lattice[ya * periodX + xb];
    const v01 = lattice[yb * periodX + xa];
    const v11 = lattice[yb * periodX + xb];

    const top = v00 + (v10 - v00) * fx;
    const bottom = v01 + (v11 - v01) * fx;
    return top + (bottom - top) * fy;
  };
}

/**
 * Builds one RGBA tile of broken, meandering strokes.
 *
 * `bandCount` sets how many strokes cross the tile, `warp` how far low-frequency
 * noise pushes them off straight, and `coverage` how much of the tile keeps any
 * ink at all. Coverage is the one to reach for first: strokes have to stay sparse,
 * because it is the empty water between them that lets the eye read the drift.
 */
function buildTile({ size, seed, stretch, bandCount, warp, coverage, contrast, tint }) {
  const rng = mulberry32(seed);

  // Two warp fields at different scales, so the strokes bend on a long wavelength
  // and wobble on a short one instead of marching in parallel.
  const warpA = makeNoise(4, 5, rng);
  const warpB = makeNoise(3, 11, rng);
  // Breaks the continuous ridges into dashes. Stretched hard along x, so a dash is
  // long and thin rather than a dot.
  const breakUp = makeNoise(Math.max(2, Math.round(bandCount * 2 / stretch)), bandCount * 3, rng);

  const field = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;
      const dv = (warpA(u, v) - 0.5) * warp + (warpB(u, v) - 0.5) * warp * 0.45;
      const phase = (v + dv) * bandCount;
      // Distance to the nearest band centre, as a ridge that peaks on the line.
      const ridge = Math.max(0, 1 - Math.abs(phase - Math.round(phase)) * 2);
      field[y * size + x] = ridge * breakUp(u, v);
    }
  }

  const sorted = Float32Array.from(field).sort();
  const cut = sorted[Math.floor((1 - coverage) * (sorted.length - 1))];
  const max = sorted[sorted.length - 1];
  const span = Math.max(1e-6, max - cut);

  const out = Buffer.alloc(size * size * 4);
  for (let i = 0; i < field.length; i++) {
    const raw = (field[i] - cut) / span;
    const t = raw <= 0 ? 0 : Math.min(1, raw) ** contrast;
    const o = i * 4;
    out[o] = tint.r;
    out[o + 1] = tint.g;
    out[o + 2] = tint.b;
    out[o + 3] = Math.round(t * 255);
  }

  return sharp(out, { raw: { width: size, height: size, channels: 4 } });
}

/** Shifts the sea mean by `delta` luminance points, keeping the hue. */
function tintFromSea(delta) {
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
  return { r: clamp(SEA_MEAN.r + delta), g: clamp(SEA_MEAN.g + delta), b: clamp(SEA_MEAN.b + delta) };
}

const TILES = [
  {
    // Layer A: the brighter strokes — light catching the top of a swell.
    name: 'water_detail_a.webp',
    size: 384,
    seed: 0x5eaa11,
    stretch: 26,
    bandCount: 22,
    warp: 0.5,
    coverage: 0.16,
    contrast: 1.1,
    tint: tintFromSea(TINT_DELTA),
  },
  {
    // Layer B: finer, darker, denser, and travelling the other way. It is what
    // keeps A from reading as a single sheet sliding across the sea.
    name: 'water_detail_b.webp',
    size: 256,
    seed: 0x0ceaa2,
    stretch: 18,
    bandCount: 15,
    warp: 0.7,
    coverage: 0.13,
    contrast: 1.2,
    tint: tintFromSea(-TINT_DELTA + 2),
  },
];

mkdirSync(dirname(`${OUT_DIR}/x`), { recursive: true });

for (const spec of TILES) {
  const tile = buildTile(spec);
  const path = `${OUT_DIR}/${spec.name}`;
  await tile.webp({ quality: 92, alphaQuality: 100 }).toFile(path);

  const stats = await sharp(await tile.png().toBuffer()).stats();
  const alpha = stats.channels[3];
  console.log(
    `${path}  ${spec.size}x${spec.size}  ` +
      `tint rgb(${spec.tint.r},${spec.tint.g},${spec.tint.b})  ` +
      `alpha mean ${alpha.mean.toFixed(1)} sd ${alpha.stdev.toFixed(1)}`,
  );
}
