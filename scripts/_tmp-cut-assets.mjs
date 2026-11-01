import sharp from 'sharp';
// helper: dark-navy bg → alpha (chroma-key-ish: keep only pixels far from bg color)
async function cutNavy(src, out, opts = {}) {
  const { data, info } = await sharp(src).raw().toBuffer({ resolveWithObject: true });
  const px = new Uint8ClampedArray(data.length / info.channels * 4);
  const bgR = 10, bgG = 22, bgB = 34, tol = opts.tol ?? 42;
  let n = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const d = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
    const a = d > tol ? 255 : 0;
    px[n * 4] = r; px[n * 4 + 1] = g; px[n * 4 + 2] = b; px[n * 4 + 3] = a;
    n++;
  }
  await sharp(px, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png().toFile(out);
}
// gem: crop center square then cut bg
const gm = await sharp('.mw/specs/hud-zanara/assets/emerald-gem-v2-0.png').metadata();
const gemSq = Math.min(gm.width, gm.height);
const gemCrop = await sharp('.mw/specs/hud-zanara/assets/emerald-gem-v2-0.png')
  .extract({ left: Math.round((gm.width - gemSq) / 2), top: 0, width: gemSq, height: gemSq }).png().toBuffer();
await cutNavy(gemCrop, 'public/mockups/hud-lab/attach/gem-cut.png', { tol: 50 });
// vine: cut bg (it has internal navy gaps — cut only outer silhouette via flood-free approach: keep any pixel not navy)
await cutNavy('.mw/specs/hud-zanara/assets/filigree-vine-0.png', 'public/mockups/hud-lab/attach/vine-cut.png', { tol: 38 });
console.log('done');
