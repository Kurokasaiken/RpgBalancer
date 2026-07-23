// Erosione dell'alpha mask: rimuove i pixel semi-trasparenti al bordo del blob.
// Un pixel con 0 < alpha < 255 viene azzerato se ha un vicino alpha=0 entro raggio R.
// Questo elimina la "linea di contorno" visibile senza toccare il colore interno.
// I pixel completamente opachi (alpha=255) vengono preservati.

const sharp = require('sharp');
const { readFileSync, writeFileSync } = require('fs');
const { join } = require('path');

const BASE = 'public/assets/world/wanderlust/base';
const LAYERS_DIR = join(BASE, 'layers');
const MANIFEST = JSON.parse(readFileSync(join(BASE, 'manifest.json'), 'utf8'));
const SKIP_IDS = new Set(['background', 'sea', 'border', 'frame']);
const RADIUS = 3;

async function erodeEdge(layerEntry) {
  const filePath = join(LAYERS_DIR, layerEntry.file);
  const { data, info } = await sharp(filePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // Pre-compute alpha map per velocità
  const alphaMap = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) alphaMap[i] = data[i * channels + 3];

  let eroded = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const a = alphaMap[i];
      if (a === 0 || a === 255) continue; // già trasparente o pienamente opaco → skip

      // Controlla se c'è un alpha=0 vicino entro RADIUS
      let hasTransparentNeighbor = false;
      outer: for (let dy = -RADIUS; dy <= RADIUS; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;
        for (let dx = -RADIUS; dx <= RADIUS; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= width) continue;
          if (alphaMap[ny * width + nx] === 0) { hasTransparentNeighbor = true; break outer; }
        }
      }

      if (hasTransparentNeighbor) {
        data[i * channels + 3] = 0;
        eroded++;
      }
    }
  }

  if (eroded === 0) { console.log(`  ~ ${layerEntry.file}`); return; }

  const out = await sharp(data, { raw: { width, height, channels } }).png({ compressionLevel: 9 }).toBuffer();
  writeFileSync(filePath, out);
  console.log(`  ✓ ${layerEntry.file}  (${eroded} px erosi)`);
}

async function main() {
  const allLayers = [...(MANIFEST.surfaceLayers ?? []), ...(MANIFEST.atmosphereLayers ?? [])];
  const toProcess = allLayers.filter(l => !SKIP_IDS.has(l.id));
  console.log(`Erosione alpha-edge (R=${RADIUS}) su ${toProcess.length} layer...`);
  for (const l of toProcess) await erodeEdge(l);
  console.log('Done.');
}

main().catch(e => { console.error(e); process.exit(1); });
