import sharp from 'sharp';
const C = 'public/mockups/hud-lab/crops';
const items = [
  ['brand', `${C}/brand/zanara-v1.webp`],
  ['resources', `${C}/resources/zanara-v1.webp`],
  ['roster', `${C}/roster/zanara-v1.webp`],
  ['panel', `${C}/panel/zanara-v1.webp`],
  ['nav', `${C}/nav/zanara-v1.webp`],
  ['cornerBL', `${C}/cornerBL/zanara-v1.webp`],
  ['cornerBR', `${C}/cornerBR/zanara-v1.webp`],
  ['seal', `${C}/seal/mockup1-classic.webp`],
];
const CELL_W = 520, CELL_H = 340, COLS = 2;
const cells = [];
for (const [label, src] of items) {
  const img = await sharp(src).resize({ width: CELL_W - 20, height: CELL_H - 50, fit: 'inside' }).png().toBuffer();
  const labelSvg = Buffer.from(`<svg width="${CELL_W}" height="${CELL_H}"><rect width="100%" height="100%" fill="#0a1622"/><text x="12" y="26" font-size="20" font-family="monospace" fill="#7dd3fc">${label} (zanara-v1)</text></svg>`);
  const cell = await sharp(labelSvg).composite([{ input: img, top: 40, left: 10 }]).png().toBuffer();
  cells.push({ input: cell });
}
const rows = Math.ceil(items.length / COLS);
const out = sharp({ create: { width: CELL_W * COLS, height: CELL_H * rows, channels: 3, background: '#0a1622' } });
await out.composite(cells.map((c, i) => ({ input: c.input, top: Math.floor(i / COLS) * CELL_H, left: (i % COLS) * CELL_W }))).png().toFile('public/mockups/hud-lab/attach/all-slots-sheet.png');
console.log('done');
