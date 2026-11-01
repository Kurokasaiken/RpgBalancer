import sharp from 'sharp';
for (const [src, out] of [
  ['public/mockups/hud-lab/attach/vine-cut.png', 'public/mockups/hud-lab/attach/vine-cut.png'],
  ['public/mockups/hud-lab/attach/gem-cut.png', 'public/mockups/hud-lab/attach/gem-cut.png'],
]) {
  const t = await sharp(src).trim({ threshold: 10 }).png().toBuffer();
  const m = await sharp(t).metadata();
  await sharp(t).png().toFile(out);
  console.log(out, m.width + 'x' + m.height);
}
