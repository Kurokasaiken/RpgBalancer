import sharp from 'sharp';
const SRC = '.mw/specs/hud-zanara/assets/roster-plaque-0.png';
// rows ~230px apart; row 2 band ≈ y 275..500
const row = await sharp(SRC).extract({ left: 0, top: 275, width: 559, height: 225 }).png().toBuffer();
const { data, info } = await sharp(row).raw().toBuffer({ resolveWithObject: true });
const px = new Uint8ClampedArray((data.length / info.channels) * 4);
const [br, bg_, bb] = [10, 22, 34]; const tol = 46;
let n = 0;
for (let i = 0; i < data.length; i += info.channels) {
  const r = data[i], g = data[i + 1], b = data[i + 2];
  const d = Math.abs(r - br) + Math.abs(g - bg_) + Math.abs(b - bb);
  px[n * 4] = r; px[n * 4 + 1] = g; px[n * 4 + 2] = b; px[n * 4 + 3] = d > tol ? 255 : 0;
  n++;
}
await sharp(px, { raw: { width: info.width, height: info.height, channels: 4 } })
  .trim({ threshold: 8 }).png().toFile('public/mockups/hud-lab/attach/row-asset.png');
const fm = await sharp('public/mockups/hud-lab/attach/row-asset.png').metadata();
console.log('row asset:', fm.width, 'x', fm.height);
