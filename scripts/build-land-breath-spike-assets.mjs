#!/usr/bin/env node
/**
 * T-000b asset builder — padded edge-extended biome composites for the land-breath spike.
 *
 * Generates full-canvas + padded biome composites from the existing Wanderlust
 * base manifest. The padding replicates the outermost pixel (edge-extend) so a
 * DisplacementFilter can sample beyond the original canvas without pulling in
 * transparent pixels.
 *
 * Output: public/spike-land-breath/composite-{biome}.webp
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MANIFEST_PATH = join(__dirname, '../public/assets/world/wanderlust/base/manifest.json');
const LAYERS_DIR = join(__dirname, '../public/assets/world/wanderlust/base/layers');
const OUT_DIR = join(__dirname, '../public/spike-land-breath');
const DEFAULT_PAD = 64; // supports displacement up to ~32px with CLAMP_TO_EDGE

const BIOME_RULES = [
  { name: 'islands', tags: ['island'] },
  { name: 'forests', tags: ['forest'] },
  { name: 'mountains', tags: ['mountain'] },
  { name: 'settlement', tags: ['settlements', 'landmarks'] },
  { name: 'terrain', tags: [] },
];

function biomeForLayer(layer) {
  for (const rule of BIOME_RULES) {
    if (rule.tags.length === 0) continue;
    if (rule.tags.some((t) => layer.tags?.includes(t))) return rule.name;
  }
  return 'terrain';
}

function parseArgs(argv) {
  const opts = { pad: DEFAULT_PAD };
  for (const arg of argv.slice(2)) {
    if (arg.startsWith('--pad=')) opts.pad = Number(arg.split('=')[1]);
  }
  return opts;
}

async function buildComposite(layers, width, height) {
  const inputs = layers
    .filter((l) => existsSync(join(LAYERS_DIR, l.file)))
    .map((l) => ({ input: join(LAYERS_DIR, l.file), top: l.offsetY ?? 0, left: l.offsetX ?? 0 }));
  if (inputs.length === 0) return null;

  const { data, info } = await sharp({
    create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite(inputs)
    .raw()
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });
  return { data, info };
}

async function edgeExtend(pngBuffer, width, height, pad) {
  if (pad <= 0) return pngBuffer;
  const base = sharp(pngBuffer).ensureAlpha();

  const topRow = await base.clone().extract({ left: 0, top: 0, width, height: 1 }).resize(width, pad, { fit: 'fill' }).png().toBuffer();
  const bottomRow = await base
    .clone()
    .extract({ left: 0, top: height - 1, width, height: 1 })
    .resize(width, pad, { fit: 'fill' })
    .png()
    .toBuffer();
  const leftCol = await base.clone().extract({ left: 0, top: 0, width: 1, height }).resize(pad, height, { fit: 'fill' }).png().toBuffer();
  const rightCol = await base
    .clone()
    .extract({ left: width - 1, top: 0, width: 1, height })
    .resize(pad, height, { fit: 'fill' })
    .png()
    .toBuffer();

  const tl = await base.clone().extract({ left: 0, top: 0, width: 1, height: 1 }).resize(pad, pad, { fit: 'fill' }).png().toBuffer();
  const tr = await base.clone().extract({ left: width - 1, top: 0, width: 1, height: 1 }).resize(pad, pad, { fit: 'fill' }).png().toBuffer();
  const bl = await base.clone().extract({ left: 0, top: height - 1, width: 1, height: 1 }).resize(pad, pad, { fit: 'fill' }).png().toBuffer();
  const br = await base
    .clone()
    .extract({ left: width - 1, top: height - 1, width: 1, height: 1 })
    .resize(pad, pad, { fit: 'fill' })
    .png()
    .toBuffer();

  const newW = width + 2 * pad;
  const newH = height + 2 * pad;

  return await sharp({
    create: { width: newW, height: newH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([
      { input: pngBuffer, left: pad, top: pad },
      { input: topRow, left: pad, top: 0 },
      { input: bottomRow, left: pad, top: height + pad },
      { input: leftCol, left: 0, top: pad },
      { input: rightCol, left: width + pad, top: pad },
      { input: tl, left: 0, top: 0 },
      { input: tr, left: width + pad, top: 0 },
      { input: bl, left: 0, top: height + pad },
      { input: br, left: width + pad, top: height + pad },
    ])
    .webp({ quality: 95 })
    .toBuffer();
}

async function main() {
  const opts = parseArgs(process.argv);
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
  const { width, height } = manifest.coordinateSystem.canvas;

  const surfaceLayers = manifest.surfaceLayers || [];
  const landLayers = surfaceLayers.filter(
    (l) =>
      l.type === 'texture' &&
      !l.tags?.includes('background') &&
      !l.tags?.includes('water') &&
      !l.tags?.includes('event') &&
      !l.tags?.includes('ui') &&
      !l.tags?.includes('border') &&
      !l.tags?.includes('frame'),
  );

  const byBiome = {};
  for (const rule of BIOME_RULES) byBiome[rule.name] = [];
  for (const layer of landLayers) byBiome[biomeForLayer(layer)].push(layer);

  mkdirSync(OUT_DIR, { recursive: true });

  const meta = {
    timestamp: new Date().toISOString(),
    pad: opts.pad,
    canvas: { width, height },
    composites: [],
  };

  console.log(`Building spike biome composites with ${opts.pad}px edge-extend padding`);
  for (const [biome, layers] of Object.entries(byBiome).sort((a, b) => a[0].localeCompare(b[0]))) {
    if (layers.length === 0) continue;
    layers.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
    const composite = await buildComposite(layers, width, height);
    if (!composite) continue;

    const pngBuffer = await sharp(composite.data, { raw: { width, height, channels: 4 } })
      .png()
      .toBuffer();
    const extended = await edgeExtend(pngBuffer, width, height, opts.pad);

    const fileName = `composite-${biome}.webp`;
    const outPath = join(OUT_DIR, fileName);
    writeFileSync(outPath, extended);

    const stats = await sharp(extended).metadata();
    meta.composites.push({
      biome,
      file: fileName,
      layers: layers.map((l) => ({ id: l.id, file: l.file, zIndex: l.zIndex })),
      size: { width: stats.width, height: stats.height },
    });
    console.log(`  ${biome}: ${layers.length} layers → ${outPath}`);
  }

  const metaPath = join(OUT_DIR, 'manifest.json');
  writeFileSync(metaPath, JSON.stringify(meta, null, 2));
  console.log(`\nManifest written: ${metaPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
