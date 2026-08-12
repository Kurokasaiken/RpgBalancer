#!/usr/bin/env node
/**
 * Imports hand-cut cloud PNGs into the game's atmosphere assets.
 *
 * These sprites arrive already separated and with a real alpha channel, so there
 * is nothing to key here: the job is trim, downscale and encode. (Cutting them out
 * of a generator contact sheet automatically was tried and abandoned — the sheets
 * came back fully opaque with the transparency checkerboard painted into the
 * pixels, and no keying rule separated cloud-white from checker-white reliably.)
 *
 * Usage
 *   node scripts/import-clouds.mjs "<file1.png>" "<file2.png>" ...
 */

import { mkdirSync, rmSync, existsSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const OUT_DIR = 'public/assets/atmosphere/clouds';
const SHADOW_DIR = 'public/assets/atmosphere/cloud-shadows';
const CONFIG_PATH = 'src/ui/idleVillage/config/atmosphereAssets.ts';
const MAX_EDGE = 900;

/**
 * Shadow bake settings.
 *
 * The shadow is a darkened, blurred copy of the cloud's own silhouette, written
 * out as an asset rather than produced at runtime with `filter: drop-shadow`:
 * that filter falls back to software rasterisation on an animated element and can
 * burn a CPU core at 60fps, which is exactly the cost the World Surface budget
 * forbids. A baked sprite animates with `transform` alone.
 */
const SHADOW_LIGHTNESS = 0.2;
const SHADOW_BLUR = 8;

/** World canvas the coordinates below are expressed in. */
const WORLD = { width: 4240, height: 2828 };

/**
 * Band assignment. Depth reads from three things at once — size, speed and
 * opacity — so a band is a bundle of all three, not just a z-order.
 *
 * `width` is in WORLD px, not source px: the map is 4240 px wide, so a cloud has
 * to be measured against that to read as a cloud. Sizing them off the source file
 * instead produced 500 px puffs that vanished at the default zoom.
 *
 * `driftSeconds` is the time to cross the whole world. These are deliberately
 * long: at 88 s a cloud crossed an entire continent in under two minutes, which
 * read as wind-blown smoke rather than weather. Several minutes per crossing is
 * what makes it settle into the background.
 *
 * Opacity stays well under 1 on purpose. The map is the thing being read, and a
 * near-opaque cloud drifting over the village hides content the player is looking
 * at. Depth is carried by size and speed instead, so the near band can stay
 * see-through without flattening.
 */
const BANDS = [
  { name: 'far', count: 3, width: 700, driftSeconds: 1100, opacity: 0.5, shadowOpacity: 0.05, seed: 0.11 },
  { name: 'mid', count: 3, width: 1080, driftSeconds: 780, opacity: 0.62, shadowOpacity: 0.08, seed: 0.47 },
  { name: 'near', count: 2, width: 1520, driftSeconds: 520, opacity: 0.74, shadowOpacity: 0.11, seed: 0.79 },
];

/**
 * Deterministic scatter in [0,1).
 *
 * The golden-ratio sequence spreads successive values evenly without clustering,
 * which is what keeps the bands from lining up into visible rows. A seed per band
 * stops the three bands from landing on the same heights.
 */
function scatter(index, seed) {
  return (seed + index * 0.6180339887498949) % 1;
}

async function main() {
  const sources = process.argv.slice(2);
  if (sources.length === 0) throw new Error('pass the cloud PNG paths as arguments');

  if (existsSync(OUT_DIR)) rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(OUT_DIR, { recursive: true });
  if (existsSync(SHADOW_DIR)) rmSync(SHADOW_DIR, { recursive: true, force: true });
  mkdirSync(SHADOW_DIR, { recursive: true });

  const written = [];
  for (let i = 0; i < sources.length; i += 1) {
    const file = `cloud_${String(i + 1).padStart(2, '0')}.webp`;
    const shadowFile = `cloud_${String(i + 1).padStart(2, '0')}_shadow.webp`;

    // Trimming drops the empty margin so a sprite's box matches the cloud it
    // draws; otherwise its on-screen size and drift would depend on the export
    // canvas. The shadow is baked from the same trimmed pixels, so it stays in
    // register with its cloud.
    const trimmed = await sharp(sources[i])
      .ensureAlpha()
      .trim({ threshold: 1 })
      .resize({ width: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
      .png()
      .toBuffer();

    const info = await sharp(trimmed).webp({ quality: 90, alphaQuality: 100 }).toFile(join(OUT_DIR, file));

    await sharp(trimmed)
      .modulate({ lightness: SHADOW_LIGHTNESS })
      .blur(SHADOW_BLUR)
      .webp({ quality: 85, alphaQuality: 100 })
      .toFile(join(SHADOW_DIR, shadowFile));

    written.push({ file, shadowFile, width: info.width, height: info.height });
    console.log(`  ✓ ${file}  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} KB  (+ ${shadowFile})`);
  }

  // Spread the sprites over the bands, cycling if there are fewer than requested.
  let cursor = 0;
  const bands = BANDS.map((band) => {
    const sprites = [];
    for (let i = 0; i < band.count; i += 1) {
      sprites.push(written[cursor % written.length]);
      cursor += 1;
    }
    return { ...band, sprites };
  });

  const entries = bands
    .map((band) => {
      const sprites = band.sprites
        .map((s, i) => {
          // Deterministic scatter: hand-placing every cloud is noise, and
          // Math.random() at runtime would make them jump on every re-render.
          // Spread over the full height rather than one strip per band — strips
          // made the three bands read as a single row of clouds.
          const y = Math.round((0.02 + scatter(i, band.seed) * 0.78) * WORLD.height);
          const delay = Math.round(scatter(i, band.seed * 0.37) * band.driftSeconds);
          return `      { src: 'clouds/${s.file}', width: ${band.width}, y: ${y}, delaySeconds: ${delay}, shadowSrc: 'cloud-shadows/${s.shadowFile}' },`;
        })
        .join('\n');
      return `  {
    name: '${band.name}',
    driftSeconds: ${band.driftSeconds},
    opacity: ${band.opacity},
    shadowOpacity: ${band.shadowOpacity},
    sprites: [
${sprites}
    ],
  },`;
    })
    .join('\n');

  // Replace ONLY the clouds block. This script used to rewrite the whole config
  // file, which meant running it silently deleted the birds — a second importer
  // owns that block. The interfaces are hand-maintained and belong to neither.
  const cloudsBlock = `  clouds: [
${entries}
  ],
`;

  // Test for the block rather than comparing before/after: re-importing the same
  // sources regenerates a byte-identical block, and treating "no change" as
  // "block not found" made a successful no-op look like a failure.
  const blockPattern = / {2}clouds: \[[\s\S]*?\n {2}\],\n/;
  const current = readFileSync(CONFIG_PATH, 'utf8');
  if (!blockPattern.test(current)) throw new Error('could not locate the clouds block in ' + CONFIG_PATH);
  writeFileSync(CONFIG_PATH, current.replace(blockPattern, cloudsBlock));

  console.log(`\nwrote ${written.length} sprites → ${OUT_DIR}`);
  console.log(`wrote ${written.length} shadows → ${SHADOW_DIR}`);
  console.log(`updated clouds block → ${CONFIG_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
