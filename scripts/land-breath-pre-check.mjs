#!/usr/bin/env node
/**
 * T-000a — Land Breath pre-check numerico.
 *
 * Misura il contenuto ad alta frequenza di ogni futuro composito bioma.
 * La metrica è la stessa usata nel caso del mare: varianza/range dinamico
 * residuo dopo sottrazione di un blur gaussiano 3px. Questo è un PROXY DI
 * RISCHIO, non una stima precisa della percettibilità del displacement.
 *
 * Usage:
 *   node scripts/land-breath-pre-check.mjs [--blur=3] [--manifest=<path>]
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MANIFEST_PATH = join(__dirname, '../public/assets/world/wanderlust/base/manifest.json');
const LAYERS_DIR = join(__dirname, '../public/assets/world/wanderlust/base/layers');
const OUT_DIR = join(__dirname, '../test-results');
const BLUR_SIGMA = 3;

/**
 * Precedenza bioma: la prima regola che matcha vince.
 * `tags` è l'array del manifest.
 */
const BIOME_RULES = [
  { name: 'islands', tags: ['island'] },
  { name: 'forests', tags: ['forest'] },
  { name: 'mountains', tags: ['mountain'] },
  { name: 'settlement', tags: ['settlements', 'landmarks'] },
  { name: 'terrain', tags: [] }, // catch-all per qualsiasi layer land non sopra
];

function biomeForLayer(layer) {
  for (const rule of BIOME_RULES) {
    if (rule.tags.length === 0) continue;
    if (rule.tags.some((t) => layer.tags?.includes(t))) return rule.name;
  }
  return 'terrain';
}

function parseArgs(argv) {
  const opts = { blur: BLUR_SIGMA };
  for (const arg of argv.slice(2)) {
    if (arg.startsWith('--blur=')) opts.blur = Number(arg.split('=')[1]);
    if (arg.startsWith('--manifest=')) opts.manifest = arg.split('=')[1];
  }
  return opts;
}

async function loadComposite(biome, layers, width, height) {
  const inputs = layers
    .filter((l) => existsSync(join(LAYERS_DIR, l.file)))
    .map((l) => ({ input: join(LAYERS_DIR, l.file), top: l.offsetY ?? 0, left: l.offsetX ?? 0 }));
  if (inputs.length === 0) return null;

  const composite = sharp({
    create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  }).composite(inputs);

  const { data, info } = await composite.raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  return { data, info };
}

function luminanceAndAlpha(data, width, height) {
  const pixels = width * height;
  const lum = new Float32Array(pixels);
  const alpha = new Uint8Array(pixels);
  for (let i = 0; i < pixels; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    lum[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    alpha[i] = data[i * 4 + 3];
  }
  return { lum, alpha };
}

async function blurLuma(lum, width, height, sigma) {
  const buf = Buffer.from(lum.buffer, lum.byteOffset, lum.byteLength);
  const blurred = await sharp(buf, { raw: { width, height, channels: 1 } })
    .blur(sigma)
    .raw()
    .toBuffer();
  const out = new Float32Array(width * height);
  for (let i = 0; i < out.length; i++) out[i] = blurred[i];
  return out;
}

function maskedStats(values, alpha, alphaThreshold = 10) {
  let n = 0;
  let sum = 0;
  let sumSq = 0;
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < alpha.length; i++) {
    if (alpha[i] <= alphaThreshold) continue;
    const v = values[i];
    n++;
    sum += v;
    sumSq += v * v;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (n === 0) return { count: 0, mean: 0, std: 0, min: 0, max: 0, range: 0 };
  const mean = sum / n;
  const std = Math.sqrt(sumSq / n - mean * mean);
  return { count: n, mean, std, min, max, range: max - min };
}

function percentageOfRange(range) {
  return (range / 255) * 100;
}

async function main() {
  const opts = parseArgs(process.argv);
  const manifest = JSON.parse(readFileSync(opts.manifest ?? MANIFEST_PATH, 'utf8'));
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
  for (const layer of landLayers) {
    const b = biomeForLayer(layer);
    byBiome[b].push(layer);
  }

  mkdirSync(OUT_DIR, { recursive: true });

  const results = [];
  console.log('Land Breath T-000a — high-frequency pre-check');
  console.log(`Canvas ${width}x${height}, blur sigma ${opts.blur}px\n`);

  for (const [biome, layers] of Object.entries(byBiome).sort((a, b) => a[0].localeCompare(b[0]))) {
    if (layers.length === 0) continue;
    layers.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
    const composite = await loadComposite(biome, layers, width, height);
    if (!composite) {
      console.log(`${biome}: no layers found`);
      continue;
    }
    const { lum, alpha } = luminanceAndAlpha(composite.data, width, height);
    const baseStats = maskedStats(lum, alpha);
    const blurred = await blurLuma(lum, width, height, opts.blur);

    const residual = new Float32Array(lum.length);
    for (let i = 0; i < lum.length; i++) residual[i] = Math.abs(lum[i] - blurred[i]);
    const resStats = maskedStats(residual, alpha);

    // Relative high-freq energy vs base range
    const relativeStd = baseStats.range > 0 ? (resStats.std / baseStats.range) * 100 : 0;

    const row = {
      biome,
      layerCount: layers.length,
      layerIds: layers.map((l) => l.id),
      pixels: baseStats.count,
      baseMean: +baseStats.mean.toFixed(2),
      baseRange: +baseStats.range.toFixed(2),
      residualStd: +resStats.std.toFixed(2),
      residualRange: +resStats.range.toFixed(2),
      residualRangePct: +percentageOfRange(resStats.range).toFixed(2),
      relativeStdPct: +relativeStd.toFixed(2),
      risk: resStats.range < 2.5 ? 'HIGH' : resStats.range < 5 ? 'MEDIUM' : 'LOW',
      note:
        resStats.range < 2.5
          ? 'Detail comparable to the sea case (~1-2% dynamic range); displacement likely invisible.'
          : resStats.range < 5
            ? 'Some detail; displacement may be subtle. Empirical spike needed.'
            : 'Enough high-frequency detail; displacement should be visible. Empirical spike still required.',
    };
    results.push(row);
    console.log(`${biome}: residual range ${row.residualRangePct}% (${row.risk}) — ${row.note}`);
  }

  const report = {
    timestamp: new Date().toISOString(),
    metric: `residual standard deviation and range after gaussian blur ${opts.blur}px of luminance, measured only on opaque pixels`,
    caveat:
      'This is a risk proxy, not a perceptual threshold. The sea case was ~1% dynamic range after blur and produced invisible displacement.',
    seaReference: {
      note: 'WorldSurfaceWaterField.tsx — displacement on painted sea removed because ~1% of dynamic range after 3px blur.',
      approximateRiskThreshold: { high: '<2.5%', medium: '2.5–5%', low: '>5%' },
    },
    results,
  };

  const outLog = join(OUT_DIR, `land-breath-pre-check-${new Date().toISOString().split('T')[0]}.log`);
  writeFileSync(outLog, `# T-000a — Land Breath pre-check\n\n\`\`\`json\n${JSON.stringify(report, null, 2)}\n\`\`\`\n`);
  console.log(`\nReport written: ${outLog}`);
  console.log(`Next: T-000b empirical spike with composited assets (G-COVERAGE..G-PERF).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
