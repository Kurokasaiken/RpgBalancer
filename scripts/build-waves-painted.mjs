#!/usr/bin/env node
/**
 * Generates wave marks that match the painted coastline idiom.
 *
 * Instead of smooth curves, the painted water is dense clusters of short, broken,
 * near-parallel white dashes with variable opacity — the artist's hand-drawn swell.
 * This script generates three variants using the same dash idiom, seeded for
 * deterministic output.
 */

import { existsSync, mkdirSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const OUT_DIR = 'public/assets/atmosphere/waves';
const POINTS_PATH = 'public/assets/atmosphere/terrain/points.json';
const SEA_MASK_PATH = 'public/assets/atmosphere/terrain/sea_mask.webp';
/** World canvas the emitted marks are expressed in. */
const CANVAS = { width: 4240, height: 2828 };
/**
 * How many marks to scatter over the water.
 *
 * Was 18, taken from `points.json`'s open-sea points, which exist to place rare
 * swell events far from any shore. The Director's ask is the opposite of rare:
 * water that moves everywhere, all the time. At this count the marks are the sea's
 * texture rather than an occasional incident.
 */
const MARK_COUNT = 150;
/** Minimum separation between marks, in world px. */
const MIN_SEPARATION = 210;
/**
 * Inset from the canvas edge, in world px. The carved frame overlaps the outer
 * band of the map, and a mark under it is paid for and never seen.
 */
const EDGE_INSET = 170;
const CONFIG_PATH = 'src/ui/idleVillage/config/atmosphereAssets.ts';

/** Rasterised size of one mark, in px. */
const SPRITE_WIDTH = 320;
const SPRITE_HEIGHT = 134;

/** Full period of one mark, most of which it spends invisible. */
const CYCLE_SECONDS = 15;

/**
 * Share of the cycle a mark is on screen.
 *
 * With evenly staggered delays the number visible at any moment is simply
 * marks x this fraction, so it is set from the target count rather than tuned by
 * eye: 18 x 0.222 = 4 on screen, inside the requested 3-5.
 */
const VISIBLE_FRACTION = 0.84;

/**
 * How far a mark's start may wander from its slot, as a share of one slot.
 *
 * Perfectly even delays hold the count exactly at 4 but give the sea a metronome:
 * one mark appearing every 2.6 s, forever. This jitter breaks the rhythm while
 * staying inside +/-1 of the target, so the count stays within 3-5.
 */
const DELAY_JITTER = 0.35;

/**
 * Deterministic LCG for reproducible scatter.
 * Same seed always yields the same marks.
 */
function seededRandom(seed) {
  let s = seed;
  return () => (s = (s * 9301 + 49297) % 233280) / 233280;
}

/**
 * Deterministic value in [0,1) from an index. The golden-ratio stride spreads
 * successive values evenly instead of clumping, and never repeats a run.
 */
function scatter(index, seed) {
  return (seed + index * 0.6180339887498949) % 1;
}

/**
 * Three variants of painted-water idiom: dense clusters of dashes.
 *
 * Each variant uses a different seed and dash pattern, so repetition reads as
 * variation rather than tiling. All three use short, broken, nearly-parallel
 * white strokes with variable spacing and opacity — matching the artist's hand.
 */
function generateWaveSVG(variant) {
  const width = SPRITE_WIDTH;
  const height = SPRITE_HEIGHT;
  const rnd = seededRandom(variant * 117 + 13);

  let d = '';

  // Generate 4-6 horizontal bands of dashes.
  const bands = 7 + Math.floor(rnd() * 3);
  for (let b = 0; b < bands; b++) {
    const y = 14 + (b / bands) * (height - 28) + rnd() * 6;
    let x = 8;

    // Fill the band with dashes, leaving gaps.
    while (x < width - 20) {
      const len = 16 + rnd() * 28;
      const lift = 2 + rnd() * 4;
      // Thick, in sprite px. A sprite drawn at 320px is shown at ~280 world px and
      // the map sits at 0.23 zoom, so the chain multiplies by roughly 0.20: a 1.5px
      // stroke authored for 1:1 lands at 0.3 screen px and the downscale averages it
      // away. These land near 1.5 screen px, which is where an edge can be seen.
      const sw = (3.2 + rnd() * 2.3).toFixed(1);
      const op = (0.4 + rnd() * 0.55).toFixed(2);

      // Dash: short arc that dips slightly, like a swell line.
      d += `<path d="M${x.toFixed(0)},${y.toFixed(0)} q${(len / 2).toFixed(0)},-${lift.toFixed(0)} ${len.toFixed(0)},0" ` +
           `fill="none" stroke="#f5faf9" stroke-linecap="round" stroke-width="${sw}" opacity="${op}"/>`;

      x += len + 4 + rnd() * 9;
    }
  }

  // Overlay a few denser clusters (whitewater effect).
  const clusters = 1 + Math.floor(rnd() * 3);
  for (let c = 0; c < clusters; c++) {
    const cx = 20 + rnd() * (width - 40);
    const cy = 20 + rnd() * (height - 40);

    // Tight group of short dashes.
    for (let i = 0; i < 3 + Math.floor(rnd() * 2); i++) {
      const x = cx + rnd() * 40;
      const y = cy + rnd() * 30;
      const len = 10 + rnd() * 18;
      const sw = (3.6 + rnd() * 2.2).toFixed(1);
      const op = (0.6 + rnd() * 0.4).toFixed(2);
      d += `<path d="M${x.toFixed(0)},${y.toFixed(0)} q${(len / 2).toFixed(0)},-2 ${len.toFixed(0)},0" ` +
           `fill="none" stroke="#ffffff" stroke-linecap="round" stroke-width="${sw}" opacity="${op}"/>`;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${d}</svg>`;
}

/**
 * Scatters well-separated points over the bright area of the sea mask.
 *
 * Sampling the mask directly rather than reading `points.json` is deliberate: those
 * points are generated with a wide offshore clearance, so they describe deep water
 * only and leave every bay and channel bare. Here the whole painted sea is fair
 * game, because the ask is motion everywhere.
 */
async function scatterOverSea(count, minSeparation, rnd) {
  const { data, info } = await sharp(SEA_MASK_PATH)
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const sx = CANVAS.width / info.width;
  const sy = CANVAS.height / info.height;
  const stride = info.channels;

  // Collect every candidate pixel that is solidly sea, in world coordinates.
  const candidates = [];
  for (let y = 0; y < info.height; y += 3) {
    for (let x = 0; x < info.width; x += 3) {
      if (data[(y * info.width + x) * stride] < 200) continue;
      const wx = Math.round(x * sx);
      const wy = Math.round(y * sy);
      if (wx < EDGE_INSET || wx > CANVAS.width - EDGE_INSET) continue;
      if (wy < EDGE_INSET || wy > CANVAS.height - EDGE_INSET) continue;
      candidates.push({ x: wx, y: wy });
    }
  }
  if (!candidates.length) throw new Error('sea_mask carries no sea pixels');

  // Shuffle, then accept in order while respecting the separation. Relax the
  // separation rather than return short: a thin channel cannot hold the full
  // spacing, and leaving it empty is exactly the bare water being fixed.
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  const chosen = [];
  for (let pass = 0; pass < 4 && chosen.length < count; pass++) {
    const sep = minSeparation * (1 - pass * 0.25);
    const sep2 = sep * sep;
    for (const c of candidates) {
      if (chosen.length >= count) break;
      if (chosen.every((p) => (p.x - c.x) ** 2 + (p.y - c.y) ** 2 >= sep2)) chosen.push(c);
    }
  }
  return chosen;
}

async function main() {
  if (!existsSync(POINTS_PATH)) {
    throw new Error(`missing ${POINTS_PATH} — run scripts/build-terrain-masks.mjs first`);
  }
  const sea = await scatterOverSea(MARK_COUNT, MIN_SEPARATION, seededRandom(20260830));
  console.log(`  ${sea.length} punti campionati sul mare`);

  if (existsSync(OUT_DIR)) rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(OUT_DIR, { recursive: true });

  const shapes = [];
  for (let i = 1; i <= 3; i++) {
    const svg = generateWaveSVG(i);
    const info = await sharp(Buffer.from(svg))
      .blur(0.9)
      .webp({ quality: 92, alphaQuality: 100 })
      .toFile(join(OUT_DIR, `wave_0${i}.webp`));
    console.log(`  ✓ wave_0${i}.webp  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(1)} KB`);
    shapes.push(i);
  }

  // Place marks on sea points, cycling through the three variants.
  const marks = sea.map((point, i) => {
    const shape = (i % shapes.length) + 1;
    const widths = [230, 280, 330];
    const rnd = seededRandom(i * 0.6180339887498949 + 0.31);
    const width = widths[Math.floor(rnd() * widths.length)];
    const markHeight = Math.round(width * (SPRITE_HEIGHT / SPRITE_WIDTH));

    // One slot per mark, evenly spaced round the cycle, nudged off the beat.
    // Scattered delays (the golden-ratio sequence used elsewhere) left the count
    // free to swing between 1 and 8; slots hold it at 4.
    const slot = (i + (scatter(i * 7 + 3, 0.41) * 2 - 1) * DELAY_JITTER) / sea.length;
    const delay = ((slot % 1) + 1) % 1 * CYCLE_SECONDS;

    return (
      `    { src: 'waves/wave_0${shape}.webp', x: ${point.x - Math.round(width / 2)}, ` +
      `y: ${point.y - Math.round(markHeight / 2)}, width: ${width}, height: ${markHeight}, ` +
      `delaySeconds: ${delay.toFixed(2)}, flip: ${((i * 0.19) % 1) > 0.5} },`
    );
  });

  const block = `  waves: {
    cycleSeconds: ${CYCLE_SECONDS},
    visibleFraction: ${VISIBLE_FRACTION},
    opacity: 0.72,
    bobWorldPx: 11,
    driftWorldPx: 74,
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
