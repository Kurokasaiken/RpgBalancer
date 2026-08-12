#!/usr/bin/env node
/**
 * Derives terrain masks and placement points from the shipped layers.
 *
 * Why this can be derived
 * -----------------------
 * `Mare.webp` is cut out where the continent sits, so its alpha channel already IS
 * the water. The two island layers are painted on that water, so subtracting their
 * alpha gives the true sea and the inverse gives every landmass. Nothing here is
 * authored: the geography is already encoded in the assets, and hand-placing waves
 * or bird origins on a 4240x2828 map would be guesswork that drifts the moment the
 * illustration is re-exported.
 *
 * Outputs
 * -------
 * - `sea_mask.webp`   opaque over water, transparent over land.
 * - `land_mask.webp`  its exact complement.
 *   The two are used together to swap a cloud for its own shadow as it makes
 *   landfall: the cloud is masked by the sea, the shadow by the land, so at every
 *   pixel exactly one of the two is showing.
 * - `shallow_mask.webp` a falloff away from every shore, for tinting coastal water.
 * - `points.json`     scattered coordinates in WORLD px: `coast` sits on the
 *   shoreline (wave marks), `land` sits well inland (flocks taking off).
 *
 * Masks carry their signal in the ALPHA channel: CSS `mask-image` reads alpha by
 * default and `mask-mode: luminance` is not dependable in the WKWebView this ships
 * to.
 *
 * Usage
 *   node scripts/build-terrain-masks.mjs [--feather=12] [--shallow=45]
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const LAYERS_DIR = 'public/assets/world/wanderlust/base/layers';
const OUT_DIR = 'public/assets/atmosphere/terrain';

const SEA_SOURCE = 'Mare.webp';
const ISLAND_SOURCES = ['Isola basso a destra.webp', 'Isola basso sinistra.webp'];
const COAST_SOURCE = 'foam_mask.webp';

/** World canvas the emitted points are expressed in. */
const WORLD = { width: 4240, height: 2828 };

/**
 * Softening of the sea/land boundary, as a blur SIGMA (not a radius — sharp takes
 * sigma and the effective reach is roughly three times it).
 *
 * Enough to turn the shoreline into a crossing rather than a cut, so a cloud fades
 * into its shadow over a stretch of beach instead of popping. At sigma 60 the
 * continent dissolved into a gradient; 12 keeps the geography.
 */
const DEFAULT_FEATHER = 12;

/** Reach of the shallow-water falloff away from shore, as a blur sigma. */
const DEFAULT_SHALLOW = 45;

/** How many scattered points to emit for each surface. */
const COAST_POINTS = 26;
const LAND_POINTS = 6;

function parseArgs(argv) {
  const opts = { feather: DEFAULT_FEATHER, shallow: DEFAULT_SHALLOW };
  for (const arg of argv.slice(2)) {
    const [key, value] = arg.replace(/^--/, '').split('=');
    if (value === undefined) continue;
    if (key === 'feather') opts.feather = Number(value);
    else if (key === 'shallow') opts.shallow = Number(value);
  }
  return opts;
}

/**
 * Wraps a mask as white RGB whose ALPHA carries the signal.
 *
 * The explicit `extractChannel(0)` is load-bearing: anything that has been through
 * `composite()` comes back as 3 channels, and reading that raw while declaring
 * `channels: 1` fills the alpha with a third of the buffer at the wrong stride,
 * which silently produces a smooth gradient instead of the geography.
 */
async function writeAlphaMask(single, width, height, outPath) {
  const raw = await sharp(single).toColourspace('b-w').extractChannel(0).raw().toBuffer();
  if (raw.length !== width * height) {
    throw new Error(`mask ${outPath}: expected ${width * height} bytes, got ${raw.length}`);
  }
  return sharp({
    create: { width, height, channels: 3, background: { r: 255, g: 255, b: 255 } },
  })
    .joinChannel(raw, { raw: { width, height, channels: 1 } })
    .webp({ quality: 90, alphaQuality: 100 })
    .toFile(outPath);
}

/**
 * Picks `count` well-separated points from the bright areas of a single-channel mask.
 *
 * Candidates are walked on a coarse grid in a fixed order and accepted only when far
 * enough from every point already taken, which spreads them without clustering and
 * without a random number generator — the same sources must always yield the same
 * placement, or every re-import would shuffle the map.
 */
async function scatterPoints(single, width, height, count, threshold) {
  const raw = await sharp(single).toColourspace('b-w').extractChannel(0).raw().toBuffer();

  const candidates = [];
  const step = 6;
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      if (raw[y * width + x] >= threshold) candidates.push([x, y]);
    }
  }
  if (candidates.length === 0) return [];

  // Walking the candidate list by an irrational stride visits the shape in a scattered
  // order, so the min-distance filter is not biased towards the top-left corner.
  const stride = Math.max(1, Math.floor(candidates.length * 0.6180339887498949));
  const minDist = Math.min(width, height) / Math.sqrt(count * 2);

  const picked = [];
  for (let i = 0; i < candidates.length && picked.length < count; i += 1) {
    const [x, y] = candidates[(i * stride) % candidates.length];
    if (picked.every(([px, py]) => Math.hypot(px - x, py - y) >= minDist)) picked.push([x, y]);
  }

  const scaleX = WORLD.width / width;
  const scaleY = WORLD.height / height;
  return picked.map(([x, y]) => ({ x: Math.round(x * scaleX), y: Math.round(y * scaleY) }));
}

async function main() {
  const opts = parseArgs(process.argv);
  const seaPath = join(LAYERS_DIR, SEA_SOURCE);
  if (!existsSync(seaPath)) throw new Error(`missing ${seaPath}`);

  mkdirSync(OUT_DIR, { recursive: true });

  const { width, height } = await sharp(seaPath).metadata();
  console.log(`Canvas ${width}x${height} → mondo ${WORLD.width}x${WORLD.height}`);
  console.log(`feather ${opts.feather}, shallow ${opts.shallow}\n`);

  const seaAlpha = await sharp(seaPath).ensureAlpha().extractChannel('alpha').toBuffer();

  // Islands are painted on top of the water, so their alpha has to come back out of it.
  const islands = ISLAND_SOURCES.filter((f) => existsSync(join(LAYERS_DIR, f)));
  const islandAlphas = await Promise.all(
    islands.map((f) => sharp(join(LAYERS_DIR, f)).ensureAlpha().extractChannel('alpha').toBuffer()),
  );

  let seaOnly = seaAlpha;
  if (islandAlphas.length) {
    // sharp will not create a 1-channel canvas, so the union is accumulated on a
    // black RGB base and collapsed to greyscale afterwards. A canvas built with
    // `create` carries no source format, so the encoding has to be named or the
    // buffer cannot be read back in.
    const union = await sharp({ create: { width, height, channels: 3, background: { r: 0, g: 0, b: 0 } } })
      .composite(islandAlphas.map((input) => ({ input, blend: 'lighten' })))
      .toColourspace('b-w')
      .png()
      .toBuffer();
    const inverted = await sharp(union).negate().toBuffer();
    seaOnly = await sharp(seaAlpha).composite([{ input: inverted, blend: 'multiply' }]).toBuffer();
    islands.forEach((f) => console.log(`  − ${f}`));
  }

  const seaSoft = await sharp(seaOnly).blur(Math.max(0.3, opts.feather)).toBuffer();
  const landSoft = await sharp(seaSoft).negate().toBuffer();

  const seaInfo = await writeAlphaMask(seaSoft, width, height, join(OUT_DIR, 'sea_mask.webp'));
  const landInfo = await writeAlphaMask(landSoft, width, height, join(OUT_DIR, 'land_mask.webp'));

  // Blurring the hard land shape spreads a ramp OUT from every shore; keeping only
  // the part that falls on water leaves a band brightest at the beach and fading to
  // nothing in open ocean. That is the depth gradient, without a shader.
  const landHard = await sharp(seaOnly).negate().threshold(128).toBuffer();
  const spread = await sharp(landHard).blur(Math.max(0.3, opts.shallow)).toBuffer();
  const shallow = await sharp(spread)
    .composite([{ input: await sharp(seaOnly).threshold(128).toBuffer(), blend: 'multiply' }])
    .linear(1.8, 0)
    .toBuffer();
  const shallowInfo = await writeAlphaMask(shallow, width, height, join(OUT_DIR, 'shallow_mask.webp'));

  // Wave marks sit on the shoreline band; flocks lift off from well inland, so the
  // land shape is eroded first and only its core is sampled.
  const coastPath = join(LAYERS_DIR, COAST_SOURCE);
  const coast = existsSync(coastPath)
    ? await scatterPoints(await sharp(coastPath).toBuffer(), width, height, COAST_POINTS, 40)
    : [];
  const inland = await sharp(landHard).blur(30).threshold(230).toBuffer();
  const land = await scatterPoints(inland, width, height, LAND_POINTS, 200);

  writeFileSync(join(OUT_DIR, 'points.json'), `${JSON.stringify({ coast, land }, null, 2)}\n`);

  const cover = async (buf) => (((await sharp(buf).stats()).channels[0].mean / 255) * 100).toFixed(1);
  console.log(`\n  ✓ sea_mask.webp      ${(seaInfo.size / 1024).toFixed(0)} KB   ${await cover(seaSoft)}% mare`);
  console.log(`  ✓ land_mask.webp     ${(landInfo.size / 1024).toFixed(0)} KB   ${await cover(landSoft)}% terra`);
  console.log(`  ✓ shallow_mask.webp  ${(shallowInfo.size / 1024).toFixed(0)} KB   ${await cover(shallow)}% acqua bassa`);
  console.log(`  ✓ points.json        ${coast.length} punti costa, ${land.length} punti entroterra`);

  if (coast.length < COAST_POINTS) console.warn(`\n⚠️  solo ${coast.length}/${COAST_POINTS} punti costa`);
  if (land.length < LAND_POINTS) console.warn(`⚠️  solo ${land.length}/${LAND_POINTS} punti entroterra`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
