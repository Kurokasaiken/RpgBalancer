import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createCanvas, loadImage } from '@napi-rs/canvas';
const BASE = 'public/assets/world/wanderlust/base';
const OUT = '/private/tmp/claude-504/-Users-faustoboni-progetti-personali-RPG/ce0544c3-e9ae-4a9b-9630-be7003f45cdd/scratchpad';

// Regione di crop (world px) attorno alla montagna-isola basso sinistra
const RX = 250, RY = 1780, RW = 1150, RH = 900, SC = 0.9;
const W = Math.round(RW * SC), H = Math.round(RH * SC);

async function compose(manifestFile, layersDir, ids) {
  const m = JSON.parse(readFileSync(join(BASE, manifestFile), 'utf8'));
  const cv = createCanvas(W, H); const ctx = cv.getContext('2d');
  ctx.fillStyle = '#8bb0c0'; ctx.fillRect(0, 0, W, H);
  const layers = m.surfaceLayers.filter(l => ids.includes(l.id)).sort((a, b) => a.zIndex - b.zIndex);
  for (const l of layers) {
    const img = await loadImage(join(BASE, layersDir, l.file));
    const ox = l.offsetX ?? 0, oy = l.offsetY ?? 0, s = l.scale ?? 1;
    ctx.save();
    ctx.translate((ox - RX) * SC, (oy - RY) * SC);
    ctx.scale(SC * s, SC * s);
    ctx.drawImage(img, 0, 0);
    ctx.restore();
  }
  return cv;
}
const ids = ['background', 'island_bottom_left', 'mountain_island_bottom_left'];
const before = await compose('manifest.trimmed.bak.json', 'layers.trimmed.bak', ids);
const after = await compose('manifest.json', 'layers', ids);
const cmp = createCanvas(W * 2 + 20, H + 30); const c = cmp.getContext('2d');
c.fillStyle = '#111'; c.fillRect(0, 0, cmp.width, cmp.height);
c.fillStyle = '#fff'; c.font = '16px sans-serif';
c.fillText('PRIMA (trimmed + offset a occhio)', 10, 20);
c.fillText('DOPO (full-canvas, offset 0/0)', W + 30, 20);
c.drawImage(before, 0, 30); c.drawImage(after, W + 20, 30);
writeFileSync(join(OUT, 'compare.png'), cmp.toBuffer('image/png'));
console.log('OK');
