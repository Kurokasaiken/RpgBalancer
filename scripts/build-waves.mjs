#!/usr/bin/env node
/**
 * Generates the open-water swell marks and writes their placement into the
 * atmosphere config.
 *
 * Why sprites and not a shader
 * ----------------------------
 * The tactical plan budgets water as "texture/sprite motion (no UV ripple se non
 * profilato)" (§ layer budget, row Acqua: 3-5s, ±4px, 0.12). The previous
 * implementation was a Pixi DisplacementFilter, which is exactly the UV ripple the
 * plan excludes without a profile — and it was invisible in practice, because
 * displacing the sampling coordinates of a low-contrast baked texture moves nothing
 * the eye can catch.
 *
 * A mark that fades in, drifts a few pixels and fades out is visible by construction
 * and costs one compositor layer.
 *
 * Why they are drawn here
 * -----------------------
 * The marks are the swell lines of an antique chart: two or three long strokes.
 * Drawing them as vectors keeps them in the map's ink idiom, needs no artist, and
 * lets the stroke weight follow the sprite size instead of being resampled.
 *
 * Where they go
 * -------------
 * Placement comes from the `sea` set in `points.json`, sampled from open water with
 * a wide belt around every shore excluded. Against the painted coastline a mark
 * competes with the ink that is already there; out in open water it has the surface
 * to itself and reads as swell. Re-exporting the illustration re-derives the lot.
 *
 * Usage
 *   node scripts/build-waves.mjs
 */

import { existsSync, mkdirSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const OUT_DIR = 'public/assets/atmosphere/waves';
const POINTS_PATH = 'public/assets/atmosphere/terrain/points.json';
const CONFIG_PATH = 'src/ui/idleVillage/config/atmosphereAssets.ts';

/** Rasterised size of one mark, in px. Rendered larger than shown, for zoom headroom. */
const SPRITE_WIDTH = 320;

/** Aspect of the mark's box; the strokes sit inside it. */
const SPRITE_ASPECT = 0.42;

/**
 * Swell lines, as SVG paths in a 320x134 box.
 *
 * Long and flat rather than tightly wavy. The first pass used steep hatches, which
 * at map scale read as a scribble competing with the painted coastline instead of
 * as water. A swell is nearly horizontal — the eye reads the slight lift as
 * distance, not as noise.
 *
 * The three are deliberately uneven: an identical mark repeated across an ocean
 * reads as tiling.
 */
const SHAPES = [
  ['M18,60 q70,-16 140,0 q70,16 144,0', 'M56,90 q60,-13 120,0 q60,13 120,0'],
  ['M12,74 q84,-19 168,0 q60,14 128,0', 'M70,102 q54,-12 108,0 q54,12 106,0', 'M92,44 q46,-11 92,0'],
  ['M24,66 q76,-18 152,0 q72,17 140,0', 'M88,96 q50,-11 100,0 q50,11 98,0'],
];

/**
 * Widths the marks are shown at, in world px.
 *
 * Larger than the first pass: these sit in open water with nothing around them, so
 * they have to carry on their own rather than lean on the coastline.
 */
const MARK_WIDTHS = [280, 340, 420];

/** Same golden-ratio scatter the other importers use, for the same reason. */
function scatter(index, seed) {
  return (seed + index * 0.6180339887498949) % 1;
}

async function main() {
  if (!existsSync(POINTS_PATH)) {
    throw new Error(`missing ${POINTS_PATH} — run scripts/build-terrain-masks.mjs first`);
  }
  const { sea } = JSON.parse(readFileSync(POINTS_PATH, 'utf8'));
  if (!sea?.length) throw new Error('points.json carries no open-sea points');

  if (existsSync(OUT_DIR)) rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(OUT_DIR, { recursive: true });

  const height = Math.round(SPRITE_WIDTH * SPRITE_ASPECT);

  for (let i = 0; i < SHAPES.length; i += 1) {
    // White strokes: the sea is dark, so a highlight reads as a crest catching the
    // light, where the map's own dark ink would disappear into it.
    const paths = SHAPES[i]
      .map(
        (d, j) =>
          `<path d="${d}" fill="none" stroke="#ffffff" stroke-linecap="round" ` +
          `stroke-width="${10 - j}" opacity="${(1 - j * 0.22).toFixed(2)}"/>`,
      )
      .join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SPRITE_WIDTH}" height="${height}" viewBox="0 0 320 134">${paths}</svg>`;

    const info = await sharp(Buffer.from(svg))
      // A touch of blur takes the vector hardness off the stroke so it sits in a
      // painted map rather than on top of it.
      .blur(1.4)
      .webp({ quality: 92, alphaQuality: 100 })
      .toFile(join(OUT_DIR, `wave_0${i + 1}.webp`));
    console.log(`  ✓ wave_0${i + 1}.webp  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(1)} KB`);
  }

  const marks = sea.map((point, i) => {
    const shape = (i % SHAPES.length) + 1;
    const width = MARK_WIDTHS[Math.floor(scatter(i, 0.31) * MARK_WIDTHS.length)];
    const markHeight = Math.round(width * SPRITE_ASPECT);
    // Centred on the sampled shore point rather than hung from its corner.
    return (
      `    { src: 'waves/wave_0${shape}.webp', x: ${point.x - Math.round(width / 2)}, ` +
      `y: ${point.y - Math.round(markHeight / 2)}, width: ${width}, height: ${markHeight}, ` +
      `delaySeconds: ${(scatter(i, 0.77) * 100).toFixed(1)}, flip: ${scatter(i, 0.19) > 0.5} },`
    );
  });

  const block = `  waves: {
    cycleSeconds: 46,
    visibleFraction: 0.16,
    opacity: 0.46,
    bobWorldPx: 3,
    marks: [
${marks.join('\n')}
    ],
  },
`;

  const current = readFileSync(CONFIG_PATH, 'utf8');
  const pattern = / {2}waves: \{[\s\S]*?\n {2}\},\n/;
  const next = pattern.test(current)
    ? current.replace(pattern, block)
    : current.replace(/\n\};\n$/, `\n${block}};\n`);
  if (next === current) throw new Error(`could not place the waves block in ${CONFIG_PATH}`);
  writeFileSync(CONFIG_PATH, next);

  console.log(`\n${marks.length} segni d'onda → ${CONFIG_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
