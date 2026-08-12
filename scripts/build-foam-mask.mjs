#!/usr/bin/env node
/**
 * Derives the coastline foam mask from the layers already in the repo.
 *
 * Why this exists
 * ---------------
 * Foam has to follow the painted coastline exactly, and no image generator can be
 * asked to produce something aligned to a specific painting. But the coastline is
 * already encoded in the assets: `Mare.webp` is cut out where the continent sits
 * (42% opaque / 55% transparent, measured), so the boundary of its opaque region IS
 * the continental shore. The two island layers supply their own shores the same way.
 *
 * So the mask is derived, not authored: a build step reads the alpha channels, finds
 * where they transition, and writes a greyscale band hugging every shore. The only
 * thing left for an artist or a generator is a plain tileable foam texture, which
 * needs to know nothing about the geography.
 *
 * How the band is built
 * ---------------------
 * For each source, alpha is thresholded to a hard in/out mask, then blurred and
 * re-thresholded at two different levels. The difference between an "eroded" and a
 * "dilated" version of the same shape is a band centred on the boundary — a cheap
 * morphological gradient that needs no per-pixel neighbourhood walk.
 *
 * The band is then feathered so foam fades out to sea instead of ending on a hard
 * line, and the results for all shores are combined with a lighten (max) so that
 * overlapping bands never sum past full intensity.
 *
 * Usage
 * -----
 *   node scripts/build-foam-mask.mjs [--width=6] [--feather=3] [--world=wanderlust]
 */

import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

/** Sources whose alpha edge is a shoreline, and whether to invert. */
const SHORE_SOURCES = [
  // The sea's opaque region ends AT the continental shore, so its own edge is the coast.
  { file: 'Mare.webp', label: 'continent + outer shore' },
  { file: 'Isola basso a destra.webp', label: 'island SE' },
  { file: 'Isola basso sinistra.webp', label: 'island SW' },
];

function parseArgs(argv) {
  const opts = { width: 6, feather: 3, world: 'wanderlust', variant: 'base' };
  for (const arg of argv.slice(2)) {
    const [rawKey, rawValue] = arg.split('=');
    const key = rawKey.replace(/^--/, '');
    if (rawValue === undefined) continue;
    if (key === 'width') opts.width = Number(rawValue);
    else if (key === 'feather') opts.feather = Number(rawValue);
    else if (key === 'world') opts.world = rawValue;
    else if (key === 'variant') opts.variant = rawValue;
  }
  if (!Number.isFinite(opts.width) || opts.width <= 0) {
    throw new Error(`--width must be positive, got ${opts.width}`);
  }
  return opts;
}

/**
 * Returns a single-channel band centred on the alpha boundary of `buffer`.
 *
 * Blurring a hard mask turns its edge into a ramp; thresholding that ramp above and
 * below the midpoint yields a shape slightly smaller and slightly larger than the
 * original, and their difference is the boundary band.
 */
async function shoreBand(buffer, width, feather) {
  const alpha = sharp(buffer).ensureAlpha().extractChannel('alpha');
  const meta = await sharp(buffer).metadata();

  // A blur radius proportional to the requested band width puts the two thresholds
  // roughly `width` pixels apart on either side of the true edge.
  const ramp = await alpha.blur(Math.max(0.3, width)).toBuffer();

  const inner = sharp(ramp).threshold(190).toBuffer();
  const outer = sharp(ramp).threshold(65).toBuffer();

  // outer - inner = the ring between the two thresholds, i.e. the shore band.
  const band = await sharp(await outer)
    .composite([{ input: await inner, blend: 'difference' }])
    .toBuffer();

  // Feather so foam dissolves seaward rather than stopping at a hard line.
  return sharp(band)
    .blur(Math.max(0.3, feather))
    .toColourspace('b-w')
    .resize(meta.width, meta.height, { fit: 'fill' })
    .toBuffer();
}

async function main() {
  const opts = parseArgs(process.argv);
  const baseDir = join('public', 'assets', 'world', opts.world, opts.variant);
  const layersDir = join(baseDir, 'layers');
  const outPath = join(layersDir, 'foam_mask.webp');
  const previewPath = join(baseDir, 'foam_mask_preview.png');

  const present = SHORE_SOURCES.filter((s) => existsSync(join(layersDir, s.file)));
  if (present.length === 0) {
    throw new Error(`no shore sources found in ${layersDir}`);
  }

  const first = await sharp(join(layersDir, present[0].file)).metadata();
  const { width, height } = first;
  console.log(`Canvas: ${width}x${height}`);
  console.log(`Band width ${opts.width}px, feather ${opts.feather}px\n`);

  const bands = [];
  for (const source of present) {
    const buffer = readFileSync(join(layersDir, source.file));
    const band = await shoreBand(buffer, opts.width, opts.feather);
    bands.push(band);
    console.log(`  ✓ ${source.file}  (${source.label})`);
  }

  // `lighten` keeps the max of overlapping bands, so a shore covered by two sources
  // does not read as twice as much foam.
  const combined = await sharp({
    create: { width, height, channels: 3, background: { r: 0, g: 0, b: 0 } },
  })
    .composite(bands.map((input) => ({ input, blend: 'lighten' })))
    .toColourspace('b-w')
    .png()
    .toBuffer();

  // Kill the canvas border.
  //
  // The sea is opaque all the way to the edge of the illustration, and blurring a
  // shape that runs off the canvas produces a ramp along that edge — which the
  // erode/dilate difference then reads as a shoreline. The result was a band of foam
  // framing the whole map. There is no coast at the border by construction, so the
  // margin is simply zeroed.
  const inset = Math.ceil(Math.max(opts.width, opts.feather) * 3 + 4);
  const frame = Buffer.from(
    `<svg width="${width}" height="${height}"><rect width="${width}" height="${height}" fill="black"/>` +
      `<rect x="${inset}" y="${inset}" width="${width - inset * 2}" height="${height - inset * 2}" fill="white"/></svg>`,
  );

  await sharp(combined)
    .composite([{ input: frame, blend: 'multiply' }])
    .toColourspace('b-w')
    .webp({ quality: 90 })
    .toFile(outPath);

  // Built by re-reading the finished mask rather than by cloning the pipeline:
  // sharp applies resize BEFORE composite, so resizing the base first would shrink
  // it below the full-size bands and the composite would fail.
  await sharp(outPath).resize(1200).png().toFile(previewPath);

  const stats = await sharp(outPath).stats();
  const mean = stats.channels[0].mean;
  console.log(`\n${'─'.repeat(52)}`);
  console.log(`wrote ${outPath}`);
  console.log(`preview ${previewPath}`);
  console.log(`coverage: ${((mean / 255) * 100).toFixed(2)}% of canvas carries foam`);
  console.log('─'.repeat(52));
  if (mean < 1) {
    console.warn('\n⚠️  Coverage is near zero — the alpha edges may not be where expected.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
