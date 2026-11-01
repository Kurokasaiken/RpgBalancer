import sharp from 'sharp';
for (let i = 0; i < 4; i++) {
  const src = `public/mockups/hud-lab/attach/sheet-row-${i}.png`;
  const { data, info } = await sharp(src).raw().toBuffer({ resolveWithObject: true });
  const px = new Uint8ClampedArray((data.length / info.channels) * 4);
  let n = 0;
  for (let j = 0; j < data.length; j += info.channels) {
    const r = data[j], g = data[j + 1], b = data[j + 2];
    const d = Math.abs(r - 10) + Math.abs(g - 22) + Math.abs(b - 34);
    // soft edge: ramp alpha between tol 30..70 to avoid hard halos
    const a = d <= 30 ? 0 : d >= 70 ? 255 : Math.round(((d - 30) / 40) * 255);
    px[n * 4] = r; px[n * 4 + 1] = g; px[n * 4 + 2] = b; px[n * 4 + 3] = a;
    n++;
  }
  await sharp(px, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png().toFile(src);
}
console.log('rows alpha-cut');
