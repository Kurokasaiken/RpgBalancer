// Rimuove il "blob background" (terreno baked-in) da ogni layer.
// In Photoshop ogni layer includeva una copia del terreno sottostante.
// In CSS (blend=normal) quel terreno è visibile come linea di contorno.
//
// Algoritmo:
//   1. Dove Background.png è opaco: rimuove pixel del layer con diff < THRESH_BG
//   2. Dove Background.png è trasparente: rimuove pixel "olive/parchment" (terreno tipico)
//   3. Pixel artwork (scuri, grigi, saturi) vengono preservati
//
// Uso: node scripts/remove-blob-bg.cjs
// Distruttivo: sovrascrive PNG in-place. Fare `git stash` prima se si vuole undo.

const sharp = require('sharp');
const { readFileSync, writeFileSync } = require('fs');
const { join } = require('path');

const BASE = 'public/assets/world/wanderlust/base';
const LAYERS_DIR = join(BASE, 'layers');
const MANIFEST = JSON.parse(readFileSync(join(BASE, 'manifest.json'), 'utf8'));

// Layer da SALTARE (non modificare)
const SKIP_IDS = new Set(['background', 'sea', 'border', 'frame']);

// Soglie
const THRESH_BG = 38;      // diff vs Background.png → rimuovi (dove BG è opaco)
const THRESH_LUM_MIN = 60; // luminanza minima per "potrebbe essere terreno"
const THRESH_LUM_MAX = 195;
const OLIVE_BIAS = 18;     // R-B deve essere > questo per essere "olive/warm"

function colorDiff(r1, g1, b1, r2, g2, b2) {
  const dr = r1-r2, dg = g1-g2, db = b1-b2;
  return Math.sqrt(dr*dr + dg*dg + db*db);
}

function isTerrainLike(r, g, b) {
  const lum = (r + g + b) / 3;
  if (lum < THRESH_LUM_MIN || lum > THRESH_LUM_MAX) return false;
  // Parchment/olive: warm bias (R e G > B)
  if (r - b < OLIVE_BIAS && g - b < OLIVE_BIAS) return false;
  // Evita colori saturi puri (artwork verde acceso, blu, ecc.)
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const saturation = max > 0 ? (max - min) / max : 0;
  if (saturation > 0.55) return false; // troppo saturo = artwork
  return true;
}

async function processLayer(layerEntry) {
  const filePath = join(LAYERS_DIR, layerEntry.file);
  const { data: ld, info } = await sharp(filePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // Background già caricato globalmente
  let modified = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const li = (y * width + x) * channels;
      const la = ld[li + 3];
      if (la === 0) continue; // già trasparente

      const lr = ld[li], lg = ld[li + 1], lb = ld[li + 2];
      const bi = (y * width + x) * 4; // background sempre RGBA
      const ba = bgData[bi + 3];

      let shouldRemove = false;

      if (ba > 200) {
        // Background opaco: confronto diretto
        const diff = colorDiff(lr, lg, lb, bgData[bi], bgData[bi + 1], bgData[bi + 2]);
        if (diff < THRESH_BG) shouldRemove = true;
      } else {
        // Background trasparente: heuristica "terrain-like"
        if (isTerrainLike(lr, lg, lb)) shouldRemove = true;
      }

      if (shouldRemove) {
        ld[li + 3] = 0;
        modified++;
      }
    }
  }

  if (modified === 0) {
    console.log(`  ~ ${layerEntry.file}  (nessuna modifica)`);
    return;
  }

  const out = await sharp(ld, { raw: { width, height, channels } }).png({ compressionLevel: 9 }).toBuffer();
  writeFileSync(filePath, out);
  console.log(`  ✓ ${layerEntry.file}  (${modified} pixel rimossi)`);
}

let bgData;

async function main() {
  // Carica Background.png una volta
  const bgResult = await sharp(join(LAYERS_DIR, 'Background.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  bgData = bgResult.data;

  const allLayers = [...(MANIFEST.surfaceLayers ?? []), ...(MANIFEST.atmosphereLayers ?? [])];
  const toProcess = allLayers.filter(l => !SKIP_IDS.has(l.id));

  console.log(`Rimozione blob-background da ${toProcess.length} layer...`);
  for (const layer of toProcess) {
    await processLayer(layer);
  }
  console.log('\nDone. Fare hard-reload nel browser (Cmd+Shift+R).');
}

main().catch(e => { console.error(e); process.exit(1); });
