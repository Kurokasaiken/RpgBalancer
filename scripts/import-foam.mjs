#!/usr/bin/env node
/**
 * Imports the hand-cut foam texture used along the coastline.
 *
 * The texture is tiled on both axes by WorldSurfaceFoam, so it is encoded square:
 * a non-square tile would stretch differently on each axis once the component
 * sizes it in world px.
 *
 * Usage
 *   node scripts/import-foam.mjs "<foam.png>"
 */

import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const OUT_DIR = 'public/assets/atmosphere/foam';
const TILE = 1024;

/** Coastline outline produced by scripts/build-foam-mask.mjs: white line on black. */
const COASTLINE_SRC = 'public/assets/world/wanderlust/base/layers/foam_mask.webp';

/**
 * Softening applied to the coastline before it becomes an alpha mask, in px of the
 * source image. The outline is a hairline; used raw it gates the foam into a drawn
 * pen stroke rather than a band of surf.
 */
const EDGE_BLUR = 6;

async function main() {
  const [source] = process.argv.slice(2);
  if (!source) throw new Error('pass the foam PNG path as an argument');

  mkdirSync(OUT_DIR, { recursive: true });

  const info = await sharp(source)
    .ensureAlpha()
    .trim({ threshold: 1 })
    .resize(TILE, TILE, { fit: 'fill' })
    .webp({ quality: 90, alphaQuality: 100 })
    .toFile(join(OUT_DIR, 'foam_texture.webp'));

  console.log(`  ✓ foam_texture.webp  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} KB`);

  // Bake the coastline's brightness into an ALPHA channel.
  //
  // CSS `mask-image` reads alpha by default, and the shipped coastline asset has no
  // alpha channel at all — so it masked nothing and the foam covered the whole map.
  // Switching the CSS to `mask-mode: luminance` would work in Chromium but is not
  // dependable in the WKWebView this ships to, so the conversion happens here and
  // the runtime keeps using the portable alpha path.
  const grey = await sharp(COASTLINE_SRC)
    .removeAlpha()
    .greyscale()
    .blur(EDGE_BLUR)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = grey.info;
  const maskInfo = await sharp({
    create: { width, height, channels: 3, background: { r: 255, g: 255, b: 255 } },
  })
    .joinChannel(grey.data, { raw: { width, height, channels: 1 } })
    .webp({ quality: 90, alphaQuality: 100 })
    .toFile(join(OUT_DIR, 'foam_mask.webp'));

  console.log(`  ✓ foam_mask.webp     ${maskInfo.width}x${maskInfo.height}  ${(maskInfo.size / 1024).toFixed(0)} KB  (alpha da luminanza)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
