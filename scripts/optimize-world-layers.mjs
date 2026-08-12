#!/usr/bin/env node
/**
 * Converts World Surface layer PNGs to WebP and caps their edge length.
 *
 * Why this exists
 * ---------------
 * The Wanderlust layers shipped as 21 PNGs of 4240x2828: 28 MB to download and,
 * once decoded, 961 MB of RGBA in compositor memory (measured, not estimated —
 * see the perf HUD on /world-surface). Two separate problems hide in that:
 *
 *   1. Download weight. PNG is the wrong container for painted artwork.
 *   2. Texture size. WebKit refuses textures past 4096px per edge and fails to
 *      blank *without throwing*. At 4240px every layer is over that ceiling,
 *      which is why a CSS 3D transform on these layers could produce a correct
 *      transform in the DOM and no visible movement on screen.
 *
 * Converting the format fixes (1) alone. Only capping the edge fixes (2), and
 * only capping the edge meaningfully reduces decoded memory, because RGBA cost
 * is a function of area — not of how well the file compresses.
 *
 * Why downscaling is safe here
 * ----------------------------
 * Every layer is exactly canvas-sized at offset 0/0 (the full-canvas invariant,
 * verified before this script was written). The world coordinate system lives in
 * the manifest, not in the pixels, so source resolution is free to vary as long
 * as the renderer stretches each layer to the world box. This script therefore
 * also flips `renderer.imageFit` from `none` to `fill`: with `none` the browser
 * paints each image at its intrinsic size, so a smaller source would render
 * smaller and top-left anchored instead of covering the canvas.
 *
 * The default cap of 3072px is not arbitrary. The map auto-fits at zoom ~0.30,
 * where 4240 world px land in roughly 2544 physical px on a 1280pt viewport at
 * DPR 2 — already downsampling. 3072 keeps headroom above that common case
 * while sitting comfortably under the 4096 ceiling.
 *
 * Usage
 * -----
 *   node scripts/optimize-world-layers.mjs [--max-edge=3072] [--quality=82]
 *                                          [--world=wanderlust] [--variant=base]
 *                                          [--dry-run]
 *
 * Originals are copied to assets-source/ (outside public/) before anything is
 * written, and the copy is never overwritten on re-runs.
 */

import { readdirSync, existsSync, mkdirSync, copyFileSync, statSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { join, parse } from 'node:path';
import sharp from 'sharp';

/** WebKit's per-edge texture ceiling. Past this, compositing fails silently. */
const TEXTURE_EDGE_LIMIT_PX = 4096;

function parseArgs(argv) {
  const opts = {
    maxEdge: 3072,
    quality: 82,
    world: 'wanderlust',
    variant: 'base',
    dryRun: false,
  };
  for (const arg of argv.slice(2)) {
    const [rawKey, rawValue] = arg.split('=');
    const key = rawKey.replace(/^--/, '');
    if (key === 'dry-run') { opts.dryRun = true; continue; }
    if (rawValue === undefined) continue;
    if (key === 'max-edge') opts.maxEdge = Number(rawValue);
    else if (key === 'quality') opts.quality = Number(rawValue);
    else if (key === 'world') opts.world = rawValue;
    else if (key === 'variant') opts.variant = rawValue;
  }
  if (!Number.isFinite(opts.maxEdge) || opts.maxEdge <= 0) {
    throw new Error(`--max-edge must be a positive number, got ${opts.maxEdge}`);
  }
  if (opts.maxEdge > TEXTURE_EDGE_LIMIT_PX) {
    console.warn(
      `⚠️  --max-edge=${opts.maxEdge} exceeds the ${TEXTURE_EDGE_LIMIT_PX}px WebKit texture ceiling. ` +
      `Layers will still fail to composite on WebKit.`,
    );
  }
  return opts;
}

const mb = (bytes) => bytes / (1024 * 1024);
const dirBytes = (dir, predicate) =>
  readdirSync(dir).filter(predicate).reduce((sum, f) => sum + statSync(join(dir, f)).size, 0);

async function main() {
  const opts = parseArgs(process.argv);

  const baseDir = join('public', 'assets', 'world', opts.world, opts.variant);
  const layersDir = join(baseDir, 'layers');
  const manifestPath = join(baseDir, 'manifest.json');
  const backupDir = join('assets-source', 'world', opts.world, opts.variant, 'layers.png-source');

  if (!existsSync(layersDir)) throw new Error(`layers dir not found: ${layersDir}`);
  if (!existsSync(manifestPath)) throw new Error(`manifest not found: ${manifestPath}`);

  const pngs = readdirSync(layersDir).filter((f) => f.toLowerCase().endsWith('.png'));
  if (pngs.length === 0) {
    console.log('No PNGs left to convert — already optimized?');
    return;
  }

  const beforeBytes = dirBytes(layersDir, (f) => f.toLowerCase().endsWith('.png'));
  console.log(`Source: ${pngs.length} PNG, ${mb(beforeBytes).toFixed(1)} MB`);
  console.log(`Target: WebP q${opts.quality}, max edge ${opts.maxEdge}px`);
  if (opts.dryRun) console.log('(dry run — nothing will be written)\n');

  // Preserve the originals before touching anything. These are the post-dilation
  // PNGs (the seam fix), which is a different snapshot from the pre-dilation
  // backup already sitting in assets-source.
  if (!opts.dryRun) {
    mkdirSync(backupDir, { recursive: true });
    for (const f of pngs) {
      const dest = join(backupDir, f);
      if (!existsSync(dest)) copyFileSync(join(layersDir, f), dest);
    }
    console.log(`Originals preserved in ${backupDir}\n`);
  }

  /** Maps original filename → converted filename, for the manifest rewrite. */
  const renames = new Map();
  let afterBytes = 0;
  let sourcePx = 0;
  let outPx = 0;

  for (const file of pngs) {
    const src = join(layersDir, file);
    const outName = `${parse(file).name}.webp`;
    const out = join(layersDir, outName);

    const meta = await sharp(src).metadata();
    const edge = Math.max(meta.width, meta.height);
    const scale = edge > opts.maxEdge ? opts.maxEdge / edge : 1;
    const w = Math.round(meta.width * scale);
    const h = Math.round(meta.height * scale);

    sourcePx += meta.width * meta.height;
    outPx += w * h;

    if (!opts.dryRun) {
      let pipeline = sharp(src);
      if (scale < 1) pipeline = pipeline.resize(w, h, { fit: 'fill', kernel: 'lanczos3' });
      // effort:6 buys noticeably better ratios for a one-off build step.
      await pipeline.webp({ quality: opts.quality, effort: 6, alphaQuality: 100 }).toFile(out);
      afterBytes += statSync(out).size;
      unlinkSync(src);
    }

    renames.set(file, outName);
    const srcMb = mb(statSync(existsSync(src) ? src : join(backupDir, file)).size);
    const dstMb = opts.dryRun ? 0 : mb(statSync(out).size);
    console.log(
      `  ${file}\n` +
      `    ${meta.width}x${meta.height} → ${w}x${h}   ` +
      `${srcMb.toFixed(2)} MB → ${opts.dryRun ? '?' : dstMb.toFixed(2) + ' MB'}`,
    );
  }

  // ---- Manifest ----------------------------------------------------------
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  let rewritten = 0;
  for (const key of ['surfaceLayers', 'atmosphereLayers']) {
    for (const layer of manifest[key] ?? []) {
      const next = renames.get(layer.file);
      if (next) { layer.file = next; rewritten += 1; }
    }
  }

  // With a downscaled source, `imageFit: none` would paint each layer at its
  // intrinsic size and anchor it top-left instead of covering the world box.
  const previousFit = manifest.renderer?.imageFit;
  let fitChanged = false;
  if (outPx < sourcePx && manifest.renderer && previousFit === 'none') {
    manifest.renderer.imageFit = 'fill';
    fitChanged = true;
  }

  if (!opts.dryRun) {
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  }

  // ---- Report ------------------------------------------------------------
  const rgbaBefore = mb(sourcePx * 4);
  const rgbaAfter = mb(outPx * 4);
  const pct = (a, b) => (b === 0 ? '0' : (((b - a) / b) * 100).toFixed(0));

  console.log(`\n${'─'.repeat(58)}`);
  console.log(`manifest: ${rewritten} layer file references rewritten`);
  if (fitChanged) console.log(`manifest: renderer.imageFit '${previousFit}' → 'fill'`);
  console.log(`download:  ${mb(beforeBytes).toFixed(1)} MB → ${opts.dryRun ? '?' : mb(afterBytes).toFixed(1) + ' MB'}` +
    (opts.dryRun ? '' : `  (−${pct(afterBytes, beforeBytes)}%)`));
  console.log(`RGBA decoded: ${rgbaBefore.toFixed(0)} MB → ${rgbaAfter.toFixed(0)} MB  (−${pct(outPx, sourcePx)}%)`);
  const maxOutEdge = Math.min(opts.maxEdge, 4240);
  console.log(`max edge: ${maxOutEdge}px  ${maxOutEdge <= TEXTURE_EDGE_LIMIT_PX ? '✅ under' : '❌ over'} the ${TEXTURE_EDGE_LIMIT_PX}px WebKit ceiling`);
  console.log('─'.repeat(58));
  console.log('\nNext: reload /world-surface and compare the perf HUD against the baseline.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
