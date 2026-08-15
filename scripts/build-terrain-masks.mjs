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
 *   shoreline (wave marks), `land` sits well inland (flocks taking off), `sea` is
 *   open water for swell, `sky` is open water clear of the frame for clouds, and
 *   `wonder` is open water with the frame's own silhouette subtracted, for the
 *   creatures that surface there.
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
/** The carved border and its outer frame, together the map's occluding chrome. */
const CHROME_SOURCES = ['Frame.webp', 'Bordo.webp'];

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
/** Swell marks, out in open water away from every shore. */
const SEA_POINTS = 18;

/**
 * Cloud anchors: open water, and far enough inside the canvas that a cloud is not
 * half-swallowed by the carved frame.
 *
 * Separate from `sea` because the two want different things from the same water.
 * A swell mark may sit right against the border — it is a mark ON the sea, and the
 * frame cropping it is harmless. A cloud is an object floating ABOVE the sea, and
 * one clipped by the frame reads as a mistake.
 */
const CLOUD_POINTS = 14;

/** Border the cloud anchors keep clear, as a fraction of the shorter canvas edge. */
const CLOUD_MARGIN = 0.07;

/**
 * Wonder anchors: where a kraken, a whale or a ghost ship may surface.
 *
 * A wonder is an object like a cloud, not a mark like swell, so it needs the same
 * offshore clearance — but a margin cannot express "not under the frame", because
 * the chrome is not a uniform band. It is a carved border with corner cartouches
 * and mid-edge crests, and between them it is nearly transparent. Measured against
 * the shipped art, cloud anchor (199,199) sits 199px from the edge and is 100%
 * occluded, while (1590,215) sits 215px in and is grazed by 7.5%: the distance from
 * the edge says almost nothing about whether the frame covers the spot.
 *
 * So the chrome's own alpha is the mask. Every one of the 18 swell points and 8 of
 * the 11 cloud anchors fail it, which is why the wonders had to have a set of their
 * own rather than borrow either.
 *
 * 16 is not a target but a spacing dial. `scatterPoints` derives its minimum
 * separation as `min(w,h)/sqrt(count*2)`, which at 16 lands on exactly 500 world px
 * — the same `minWonderSpacing` the runtime enforces. So every anchor this emits is
 * already far enough from every other, and the runtime's spacing filter is a safety
 * net rather than the thing doing the work. Asking for fewer would space them
 * further apart and yield less of the map; asking for more would drop below 500.
 */
const WONDER_POINTS = 16;

/**
 * Fewest anchors that still make the feature work, and so the only count worth
 * warning about.
 *
 * The catalog holds three wonders and the debug spawn places all three at once, so
 * three is what the feature needs — but the runtime also drops every anchor within
 * 300px of a wave mark, and those marks are authored in TypeScript where this script
 * cannot see them. Measured on the current art that filter removes half the anchors
 * (8 down to 4), so the floor here is double the three actually needed.
 *
 * Warning against WONDER_POINTS instead would cry wolf on every run, since that
 * number is a spacing dial the scatter is never expected to fill.
 */
const WONDER_POINTS_FLOOR = 6;

/**
 * How far the chrome mask grows before it is subtracted, in SOURCE px.
 *
 * The point is the sprite's centre, so clearing the centre pixel is not enough —
 * the frame would still bite the sprite's edge. Dilating by the largest wonder's
 * half-diagonal keeps the whole footprint off the chrome. 73x64 world px is the
 * kraken, the biggest in the catalog; half its diagonal is ~48 world px, which is
 * ~35 source px at this scale, taken to 40 for slack.
 */
const CHROME_DILATE = 40;

/**
 * How much of the land falloff may still be present for water to count as "open".
 *
 * The falloff is the land silhouette blurred, so it decays to zero away from every
 * coast; requiring it to be at or below this leaves only water with real clearance.
 * Kept low rather than at 0 because a Gaussian never reaches exactly zero.
 *
 * With this threshold the guaranteed clearance is roughly 2.1x the blur sigma, so
 * the sigma is what actually sets the distance — hence one per surface below.
 */
const OFFSHORE_MAX = 4;

/**
 * Clearance sigmas, in SOURCE px. Effective distance from shore is ~2.1x these.
 *
 * A swell mark only has to be off the painted shoreline, so it can sit closer in.
 * A cloud is an object floating above the water and has to read as being out at
 * sea with nothing near it, so it needs several times its own width of clearance.
 *
 * A wonder wants the cloud's clearance but cannot afford it: the frame is already
 * subtracted from its water, and at the cloud's 85 only 0.95% of the canvas is left,
 * which yields 3 anchors — exactly the number of wonders, with nothing spare. At 60
 * the clearance is still ~174 world px, more than twice the widest sprite, and 8
 * anchors survive. Measured, not guessed: see the sweep in the commit that added it.
 */
const SWELL_CLEARANCE_SIGMA = 45;
const CLOUD_CLEARANCE_SIGMA = 85;
const WONDER_CLEARANCE_SIGMA = 60;

/**
 * Margin the swell points keep from the canvas edge, as a fraction of the shorter
 * edge.
 *
 * Not cosmetic: the masks are blurred and the blur ramps at the canvas boundary, so
 * without this the edge itself reads as a shape. That is what put swell point 15 at
 * y=2824 of 2828 — four pixels from the bottom, on an artefact, sampling as land.
 */
const EDGE_MARGIN = 0.015;

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
/**
 * Reads any mask into a guaranteed single-channel byte array.
 *
 * Chaining sharp operators across `composite()` output is not dependable here:
 * a composited buffer comes back as three channels, and `negate().threshold()`
 * applied to one returned 57% lit where the identical call on a clean
 * single-channel buffer returned 27%. Anything that has to be exact is decided on
 * these bytes instead.
 */
async function toGrey(buf, width, height) {
  const raw = await sharp(buf).toColourspace('b-w').extractChannel(0).raw().toBuffer();
  if (raw.length !== width * height) {
    throw new Error(`mask: expected ${width * height} bytes, got ${raw.length}`);
  }
  return raw;
}

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

  const coastPath = join(LAYERS_DIR, COAST_SOURCE);
  const coast = existsSync(coastPath)
    ? await scatterPoints(await sharp(coastPath).toBuffer(), width, height, COAST_POINTS, 40)
    : [];

  // Flocks lift off from well inland, so the land shape is eroded first and only its
  // core is sampled — otherwise a take-off point lands on a beach or in the water.
  const inland = await sharp(landHard).blur(30).threshold(230).toBuffer();
  const land = await scatterPoints(inland, width, height, LAND_POINTS, 200);

  // Open water: the sea minus a wide belt around every shore. `spread` is already
  // the falloff away from land, so the water that is far from any coast is where it
  // has decayed to nothing. Swell belongs out there — against the painted shoreline
  // a wave mark competes with the ink instead of reading as sea.
  //
  // Decided on raw bytes, not by chaining operators. The previous version
  // (`negate().threshold(250)` then multiply by the sea) measured 43.9% lit — which
  // is EXACTLY the whole sea, so the coastal belt was never excluded at all and
  // every swell mark and cloud anchor was sampled from the full sea, shoreline
  // included. Eleven of fourteen anchors had land within 170 world px and three sat
  // on the continent itself.
  const seaGrey = await toGrey(seaOnly, width, height);

  /**
   * Water that is `sigma`-far from every shore and `margin`-far from the canvas
   * edge, as a mask ready to scatter over.
   */
  const openWater = async (sigma, marginFraction) => {
    const falloff = await toGrey(await sharp(landHard).blur(sigma).toBuffer(), width, height);
    const margin = Math.round(Math.min(width, height) * marginFraction);
    const out = Buffer.alloc(width * height);
    for (let y = margin; y < height - margin; y += 1) {
      for (let x = margin; x < width - margin; x += 1) {
        const i = y * width + x;
        out[i] = seaGrey[i] >= 128 && falloff[i] <= OFFSHORE_MAX ? 255 : 0;
      }
    }
    return {
      mask: await sharp(out, { raw: { width, height, channels: 1 } }).png().toBuffer(),
      raw: out,
      lit: out.reduce((n, v) => n + (v ? 1 : 0), 0) / out.length,
      margin,
    };
  };

  const swellWater = await openWater(SWELL_CLEARANCE_SIGMA, EDGE_MARGIN);
  const sea = await scatterPoints(swellWater.mask, width, height, SEA_POINTS, 200);

  // Cloud anchors want far more room than swell marks, and a margin wide enough
  // that no cloud is half-swallowed by the carved frame. Masking before the scatter
  // rather than dropping points afterwards keeps the min-distance spacing honest —
  // filtering after the fact would leave the survivors bunched wherever the cut
  // happened to spare them.
  const skyWater = await openWater(CLOUD_CLEARANCE_SIGMA, CLOUD_MARGIN);
  const sky = await scatterPoints(skyWater.mask, width, height, CLOUD_POINTS, 200);

  // Wonder anchors: open water with the chrome's own silhouette taken out of it.
  //
  // The union of the frame and border alpha is grown by a sprite half-diagonal and
  // subtracted, so a surfacing wonder is never clipped. Same reason as the cloud
  // anchors for masking before the scatter: dropping points afterwards would leave
  // the survivors bunched wherever the frame happened to spare them.
  const chromeAlphas = await Promise.all(
    CHROME_SOURCES.filter((f) => existsSync(join(LAYERS_DIR, f))).map((f) =>
      sharp(join(LAYERS_DIR, f)).ensureAlpha().extractChannel('alpha').toBuffer(),
    ),
  );
  const chromeUnion = await sharp({
    create: { width, height, channels: 3, background: { r: 0, g: 0, b: 0 } },
  })
    .composite(chromeAlphas.map((input) => ({ input, blend: 'lighten' })))
    .toColourspace('b-w')
    .png()
    .toBuffer();
  // Blur-then-threshold-low is the dilation: any pixel within reach of opaque chrome
  // keeps some signal, and a low cut keeps all of it.
  const chromeGrown = await toGrey(
    await sharp(chromeUnion).blur(CHROME_DILATE).threshold(1).toBuffer(),
    width,
    height,
  );

  const wonderWater = await openWater(WONDER_CLEARANCE_SIGMA, EDGE_MARGIN);
  const wonderRaw = Buffer.alloc(width * height);
  for (let i = 0; i < wonderRaw.length; i += 1) {
    wonderRaw[i] = wonderWater.raw[i] && !chromeGrown[i] ? 255 : 0;
  }
  const wonderMask = await sharp(wonderRaw, { raw: { width, height, channels: 1 } })
    .png()
    .toBuffer();
  const wonder = await scatterPoints(wonderMask, width, height, WONDER_POINTS, 200);
  const wonderLit = wonderRaw.reduce((n, v) => n + (v ? 1 : 0), 0) / wonderRaw.length;

  writeFileSync(
    join(OUT_DIR, 'points.json'),
    `${JSON.stringify({ coast, land, sea, sky, wonder }, null, 2)}\n`,
  );

  const cover = async (buf) => (((await sharp(buf).stats()).channels[0].mean / 255) * 100).toFixed(1);
  console.log(`\n  ✓ sea_mask.webp      ${(seaInfo.size / 1024).toFixed(0)} KB   ${await cover(seaSoft)}% mare`);
  console.log(`  ✓ land_mask.webp     ${(landInfo.size / 1024).toFixed(0)} KB   ${await cover(landSoft)}% terra`);
  console.log(`  ✓ shallow_mask.webp  ${(shallowInfo.size / 1024).toFixed(0)} KB   ${await cover(shallow)}% acqua bassa`);
  console.log(`  ✓ points.json        ${coast.length} costa, ${land.length} entroterra, ${sea.length} mare aperto`);
  console.log(
    `                       acqua onde ${(swellWater.lit * 100).toFixed(1)}%, ` +
      `acqua nuvole ${(skyWater.lit * 100).toFixed(1)}% (margine ${skyWater.margin}px)`,
  );
  console.log(`                       ${sky.length} ancore nuvole`);
  console.log(
    `                       acqua meraviglie ${(wonderLit * 100).toFixed(1)}% ` +
      `(cornice dilatata ${CHROME_DILATE}px), ${wonder.length} ancore meraviglie`,
  );

  if (coast.length < COAST_POINTS) console.warn(`\n⚠️  solo ${coast.length}/${COAST_POINTS} punti costa`);
  if (land.length < LAND_POINTS) console.warn(`⚠️  solo ${land.length}/${LAND_POINTS} punti entroterra`);
  if (sky.length < CLOUD_POINTS) console.warn(`⚠️  solo ${sky.length}/${CLOUD_POINTS} ancore nuvole — abbassa CLOUD_MARGIN`);
  if (wonder.length < WONDER_POINTS_FLOOR)
    console.warn(
      `⚠️  solo ${wonder.length} ancore meraviglie, minimo ${WONDER_POINTS_FLOOR} — ` +
        `abbassa WONDER_CLEARANCE_SIGMA o CHROME_DILATE`,
    );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
