// Alpha-bleed per PNG full-canvas via sharp (straight alpha, nessun premult).
// Per ogni pixel alpha=0, propaga il colore RGB del vicino più prossimo
// con alpha > 0. Elimina il color fringing da bilinear interpolation CSS.
//
// Uso: node scripts/alpha-bleed-sharp.mjs [file.png ...]
//      node scripts/alpha-bleed-sharp.mjs  (processa tutti i layer del manifest)
//
// Distruttivo: sovrascrive i PNG in-place. Fare backup / git commit prima.

import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, basename } from 'node:path';

const BASE = 'public/assets/world/wanderlust/base';
const MANIFEST = join(BASE, 'manifest.json');
const LAYERS_DIR = join(BASE, 'layers');

// Determina i file da processare
let files;
if (process.argv.length > 2) {
  files = process.argv.slice(2);
} else {
  const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  const layers = [...(manifest.surfaceLayers ?? []), ...(manifest.atmosphereLayers ?? [])];
  files = layers.map(l => join(LAYERS_DIR, l.file));
}

const RADIUS = 3; // pixel di propagazione

async function bleed(filePath) {
  const { data, info } = await sharp(filePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info; // channels = 4 (RGBA)
  let changed = 0;

  // Per ogni pixel trasparente, cerca il vicino più vicino con alpha > 0
  // e copia il suo RGB (non l'alpha — manteniamo il gradiente originale).
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      if (data[idx + 3] > 0) continue; // già opaco/semi-trasparente

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
        // alpha rimane 0 — il pixel resta invisibile ma il colore è ora
        // quello del vicino opaco invece di (0,0,0). Il bilinear sampler
        // del browser interpola tra colori omogenei → nessun fringe.
        changed++;
      }
    }
  }

  if (changed === 0) {
    console.log(`  ✓ ${basename(filePath)}  (nessun pixel trasparente da correggere)`);
    return;
  }

  const out = await sharp(data, { raw: { width, height, channels } })
    .png({ compressionLevel: 9 })
    .toBuffer();

  writeFileSync(filePath, out);
  console.log(`  ✓ ${basename(filePath)}  (${changed} pixel corretti)`);
}

console.log(`Alpha-bleed (radius=${RADIUS}px, sharp straight-alpha)...`);
for (const f of files) {
  await bleed(f);
}
console.log('Done.');
