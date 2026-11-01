import sharp from 'sharp';
const src = 'src/assets/ui/idleVillage/wanderlust-logo.png';
await sharp(src).extract({ left: 480, top: 50, width: 150, height: 224 }).png()
  .toFile('public/mockups/hud-lab/attach/emblem-crop.png');
for (const w of [128, 64, 40]) {
  await sharp('public/mockups/hud-lab/attach/emblem-crop.png').resize({ width: w }).png()
    .toFile(`public/mockups/hud-lab/attach/emblem-${w}.png`);
}
console.log('done');
