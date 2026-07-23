// Alpha-bleed per PNG full-canvas via sharp (straight alpha).
// Uso: node scripts/alpha-bleed-sharp.cjs [file.png ...]
//      node scripts/alpha-bleed-sharp.cjs  (processa tutti i layer del manifest)

const sharp = require('sharp');
const { readFileSync, writeFileSync } = require('node:fs');
const { join, basename } = require('node:path');

const BASE = 'public/assets/world/wanderlust/base';
const LAYERS_DIR = join(BASE, 'layers');
const RADIUS = 3;

async function bleed(filePath) {
  const { data, info } = await sharp(filePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  let changed = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      if (data[idx + 3] > 0) continue;

      let bestDist = Infinity, bestR = 0, bestG = 0, bestB = 0;

      for (let dy = -RADIUS; dy <= RADIUS; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;
        for (let dx = -RADIUS; dx <= RADIUS; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= width) continue;
          const nidx = (ny * width + nx) * channels;
          if (data[nidx + 3] === 0) continue;
          const dist = dx * dx + dy * dy;
          if (dist < bestDist) {
            bestDist = dist;
            bestR = data[nidx];
            bestG = data[nidx + 1];
            bestB = data[nidx + 2];
          }
        }
      }

      if (bestDist < Infinity) {
        data[idx]     = bestR;
        data[idx + 1] = bestG;
        data[idx + 2] = bestB;
        changed++;
      }
    }
  }

  if (changed === 0) {
    console.log(`  ✓ ${basename(filePath)}  (nessun pixel da correggere)`);
    return;
  }

  const out = await sharp(data, { raw: { width, height, channels } })
    .png({ compressionLevel: 9 })
    .toBuffer();

  writeFileSync(filePath, out);
  console.log(`  ✓ ${basename(filePath)}  (${changed} pixel corretti)`);
}

async function main() {
  let files;
  if (process.argv.length > 2) {
    files = process.argv.slice(2);
  } else {
    const manifest = JSON.parse(readFileSync(join(BASE, 'manifest.json'), 'utf8'));
    const layers = [...(manifest.surfaceLayers ?? []), ...(manifest.atmosphereLayers ?? [])];
    files = layers.map(l => join(LAYERS_DIR, l.file));
  }

  console.log(`Alpha-bleed (radius=${RADIUS}px, sharp straight-alpha) su ${files.length} file...`);
  for (const f of files) {
    await bleed(f);
  }
  console.log('Done.');
}

main().catch(e => { console.error(e); process.exit(1); });
