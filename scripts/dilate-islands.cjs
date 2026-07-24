// Dilation delle isole: espande i pixel opaci verso l'esterno (+12px).
// Per ogni pixel con alpha=0 entro RADIUS da un pixel opaco, copia il colore
// del vicino opaco e imposta alpha=255. L'isola diventa leggermente più grande
// e copre il bordo del buco nel Mare.png.
//
// Uso: node scripts/dilate-islands.cjs [file.png ...]
//      node scripts/dilate-islands.cjs  (processa Isola basso a destra.png, Isola basso sinistra.png)

const sharp = require('sharp');
const { readFileSync, writeFileSync } = require('node:fs');
const { join, basename } = require('node:path');

const BASE = 'public/assets/world/wanderlust/base';
const LAYERS_DIR = join(BASE, 'layers');
const DILATION_R = 12;

// Layer delle isole da processare (come da worldSurfaceKit.md)
const ISLAND_FILES = [
  'Isola basso a destra.png',
  'Isola basso sinistra.png',
];

async function dilate(filePath) {
  const { data, info } = await sharp(filePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  let changed = 0;

  // Crea una copia dei dati originali per leggere il colore dei pixel opaci
  const originalData = Buffer.from(data);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      if (originalData[idx + 3] > 0) continue; // già opaco → skip

      let bestDist = Infinity, bestR = 0, bestG = 0, bestB = 0;

      // Cerca il pixel opaco più vicino entro DILATION_R
      for (let dy = -DILATION_R; dy <= DILATION_R; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;
        for (let dx = -DILATION_R; dx <= DILATION_R; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= width) continue;
          const nidx = (ny * width + nx) * channels;
          if (originalData[nidx + 3] === 0) continue; // trasparente → skip
          const dist = dx * dx + dy * dy;
          if (dist < bestDist) {
            bestDist = dist;
            bestR = originalData[nidx];
            bestG = originalData[nidx + 1];
            bestB = originalData[nidx + 2];
          }
        }
      }

      if (bestDist < Infinity) {
        data[idx] = bestR;
        data[idx + 1] = bestG;
        data[idx + 2] = bestB;
        data[idx + 3] = 255; // imposta alpha opaco
        changed++;
      }
    }
  }

  if (changed === 0) {
    console.log(`  ~ ${basename(filePath)}  (nessun pixel da dilatare)`);
    return;
  }

  const out = await sharp(data, { raw: { width, height, channels } })
    .png({ compressionLevel: 9 })
    .toBuffer();

  writeFileSync(filePath, out);
  console.log(`  ✓ ${basename(filePath)}  (${changed} pixel dilatati)`);
}

async function main() {
  let files;
  if (process.argv.length > 2) {
    files = process.argv.slice(2);
  } else {
    files = ISLAND_FILES.map(f => join(LAYERS_DIR, f));
  }

  console.log(`Dilation delle isole (R=${DILATION_R}px) su ${files.length} file...`);
  for (const f of files) {
    await dilate(f);
  }
  console.log('Done.');
}

main().catch(e => { console.error(e); process.exit(1); });
