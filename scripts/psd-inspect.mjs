// Dry-run: elenca i layer del PSD con nome e bounding box esatti.
// Non scrive nulla. Uso: node --max-old-space-size=8192 scripts/psd-inspect.mjs
import { readFileSync } from 'node:fs';
import { readPsd } from 'ag-psd';

const PSD_PATH = 'hd-photo-Map finale3.psd';

const buf = readFileSync(PSD_PATH);
const psd = readPsd(buf, {
  skipLayerImageData: true, // solo struttura + bounds, niente pixel: velocissimo
  skipCompositeImageData: true,
  skipThumbnail: true,
});

console.log(`CANVAS PSD: ${psd.width} x ${psd.height}`);
console.log('---');

let i = 0;
function walk(children, depth = 0) {
  for (const layer of children ?? []) {
    const pad = '  '.repeat(depth);
    const l = layer.left ?? 0, t = layer.top ?? 0;
    const r = layer.right ?? 0, b = layer.bottom ?? 0;
    const w = r - l, h = b - t;
    const kind = layer.children ? '[GROUP]' : `${w}x${h} @ (${l},${t})`;
    console.log(`${String(i).padStart(2)} ${pad}${JSON.stringify(layer.name)}  ${kind}  hidden=${layer.hidden ?? false} opacity=${layer.opacity ?? 255}`);
    i++;
    if (layer.children) walk(layer.children, depth + 1);
  }
}
walk(psd.children);
