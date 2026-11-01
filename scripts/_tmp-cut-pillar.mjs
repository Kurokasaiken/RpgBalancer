import sharp from 'sharp';
// cut the RIGHT pillar variant (center ~ x 380-560 of 768) from roster-pillar-0
const SRC = '.mw/specs/hud-zanara/assets/roster-pillar-0.png';
const m = await sharp(SRC).metadata();
// right pillar occupies x≈300-560
const tile = await sharp(SRC).extract({ left: 295, top: 0, width: 280, height: m.height }).png().toBuffer();
const { data, info } = await sharp(tile).raw().toBuffer({ resolveWithObject: true });
const px = new Uint8ClampedArray((data.length / info.channels) * 4);
let n = 0;
for (let i = 0; i < data.length; i += info.channels) {
  const r = data[i], g = data[i + 1], b = data[i + 2];
  const d = Math.abs(r - 10) + Math.abs(g - 22) + Math.abs(b - 34);
  px[n * 4] = r; px[n * 4 + 1] = g; px[n * 4 + 2] = b; px[n * 4 + 3] = d > 46 ? 255 : 0;
  n++;
}
await sharp(px, { raw: { width: info.width, height: info.height, channels: 4 } })
  .trim({ threshold: 8 }).png().toFile('public/mockups/hud-lab/attach/pillar-cut.png');
const fm = await sharp('public/mockups/hud-lab/attach/pillar-cut.png').metadata();
console.log('pillar:', fm.width, 'x', fm.height);
