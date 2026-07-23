// Ricompone i PNG dei layer su un CANVAS PIENO (dimensione canvas del PSD),
// posizionando ciascuno alla coordinata REALE letta dal PSD (verita' assoluta).
// Rigenera il manifest con offsetX:0, offsetY:0, scale:1 per TUTTI i layer ->
// allineamento pixel-perfect per costruzione, zero numeri "a occhio".
//
// I PNG esistenti in layers/ sono gia' crop esatti al bounding box del PSD:
// non serve decodificare i pixel del PSD, basta ri-ancorarli.
//
// Non distruttivo: scrive in layers-fullcanvas/ e manifest.fullcanvas.json.
// Uso: node --max-old-space-size=8192 scripts/psd-extract-fullcanvas.mjs
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { readPsd } from 'ag-psd';

const PSD_PATH = 'hd-photo-Map finale3.psd';
const BASE_DIR = 'public/assets/world/wanderlust/base';
const OLD_LAYERS = join(BASE_DIR, 'layers');
const OUT_LAYERS = join(BASE_DIR, 'layers-fullcanvas');
const OLD_MANIFEST = join(BASE_DIR, 'manifest.json');
const OUT_MANIFEST = join(BASE_DIR, 'manifest.fullcanvas.json');

mkdirSync(OUT_LAYERS, { recursive: true });

console.log('Lettura struttura PSD...');
const psd = readPsd(readFileSync(PSD_PATH), {
  skipLayerImageData: true,   // solo bounds: veloce e affidabile
  skipCompositeImageData: true,
  skipThumbnail: true,
});
const CANVAS_W = psd.width;
const CANVAS_H = psd.height;
console.log(`Canvas: ${CANVAS_W}x${CANVAS_H}`);

// Indicizza i bounds dei layer PSD per nome (trim, lowercase)
const bounds = new Map();
(function walk(children) {
  for (const layer of children ?? []) {
    if (layer.children) { walk(layer.children); continue; }
    const key = (layer.name ?? '').trim().toLowerCase();
    if (key) bounds.set(key, { left: layer.left ?? 0, top: layer.top ?? 0, right: layer.right ?? 0, bottom: layer.bottom ?? 0 });
  }
})(psd.children);

const manifest = JSON.parse(readFileSync(OLD_MANIFEST, 'utf8'));
const nameKey = (file) => basename(file, '.png').trim().toLowerCase();

const warnings = [];

async function place(entry) {
  const src = join(OLD_LAYERS, entry.file);
  const out = join(OUT_LAYERS, entry.file);
  if (!existsSync(src)) { warnings.push(`PNG mancante: ${entry.file}`); return; }

  const img = await loadImage(src);
  const b = bounds.get(nameKey(entry.file));

  let x = 0, y = 0;
  if (b) {
    x = b.left; y = b.top;
    const bw = b.right - b.left, bh = b.bottom - b.top;
    if (bw !== img.width || bh !== img.height) {
      warnings.push(`${entry.file}: PNG ${img.width}x${img.height} != PSD bbox ${bw}x${bh} (ancoro comunque a top-left ${x},${y})`);
    }
  } else {
    // Nessun layer PSD (es. Mare): se full-canvas resta a 0,0, altrimenti 0,0
    warnings.push(`${entry.file}: nessun layer PSD -> ancorato a (0,0)`);
  }

  const canvas = createCanvas(CANVAS_W, CANVAS_H);
  canvas.getContext('2d').drawImage(img, x, y);
  writeFileSync(out, canvas.toBuffer('image/png'));
  console.log(`  + ${entry.file}  @ (${x},${y})`);
}

console.log('Ricomposizione layer su canvas pieno...');
const allLayers = [...(manifest.surfaceLayers ?? []), ...(manifest.atmosphereLayers ?? [])];
for (const entry of allLayers) {
  await place(entry);
  entry.offsetX = 0;
  entry.offsetY = 0;
  delete entry.scale;
}

if (manifest.renderer) manifest.renderer.imageFit = 'none';
writeFileSync(OUT_MANIFEST, JSON.stringify(manifest, null, 2) + '\n');

console.log(`\nFatto.\n  Layer:    ${OUT_LAYERS}/\n  Manifest: ${OUT_MANIFEST}`);
if (warnings.length) {
  console.log('\nAvvisi:');
  for (const w of warnings) console.log('  - ' + w);
}
