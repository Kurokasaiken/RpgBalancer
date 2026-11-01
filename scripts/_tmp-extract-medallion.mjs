import sharp from 'sharp';
const C = 'public/mockups/hud-lab/crops/roster/zanara-v3.webp';
// medallion band only: exclude spine (x<18) and plaque connector (x>78): detect within x 18..78
const W = 90, H = 90, L = 18, T = 160;
const tile = await sharp(C).extract({ left: L, top: T, width: W, height: H }).png().toBuffer();
const { data, info } = await sharp(tile).raw().toBuffer({ resolveWithObject: true });
let pts = [];
for (let y = 2; y < 80; y++) for (let x = 18; x < 78; x++) {
  const i = (y * W + x) * info.channels;
  const r = data[i], g = data[i + 1], b = data[i + 2];
  if (r > 145 && g > 100 && b < 115 && r - b > 55) pts.push([x, y]);
}
const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
const ro = Math.min((Math.max(...xs) - Math.min(...xs)) / 2, (Math.max(...ys) - Math.min(...ys)) / 2);
console.log(`center (${cx.toFixed(1)},${cy.toFixed(1)}) r≈${ro.toFixed(1)} n=${pts.length}`);
const cxI = Math.round(cx), cyI = Math.round(cy), roI = Math.round(ro), ri = Math.round(ro * 0.68);
const mask = Buffer.from(
  `<svg width="${W}" height="${H}"><path fill="white" fill-rule="evenodd" ` +
  `d="M${cxI} ${cyI} m-${roI} 0 a${roI} ${roI} 0 1 0 ${roI * 2} 0 a${roI} ${roI} 0 1 0 -${roI * 2} 0 ` +
  `M${cxI} ${cyI} m-${ri} 0 a${ri} ${ri} 0 1 1 ${ri * 2} 0 a${ri} ${ri} 0 1 1 -${ri * 2} 0"/></svg>`
);
const L2 = Math.max(0, cxI - roI - 1), T2 = Math.max(0, cyI - roI - 1);
const W2 = Math.min(W - L2, roI * 2 + 2), H2 = Math.min(H - T2, roI * 2 + 2);
await sharp(tile).composite([{ input: mask, blend: 'dest-in' }])
  .extract({ left: L2, top: T2, width: W2, height: H2 }).png()
  .toFile('public/mockups/hud-lab/attach/ring-only.png');
console.log('done', L2, T2, W2, H2);
