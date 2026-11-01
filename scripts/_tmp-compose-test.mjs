import sharp from 'sharp';
// composite test: dark enamel bg + real portrait + ring on top
const bg = await sharp({ create: { width: 100, height: 100, channels: 4, background: { r: 5, g: 53, b: 44, alpha: 1 } } }).png().toBuffer();
const portrait = await sharp('public/assets/portraits/portrait female magician.png')
  .resize(52, 52, { fit: 'cover' }).png().toBuffer();
// portrait circular
const circle = Buffer.from('<svg width="52" height="52"><circle cx="26" cy="26" r="26" fill="white"/></svg>');
const portraitMasked = await sharp(portrait).composite([{ input: circle, blend: 'dest-in' }]).png().toBuffer();
const ring = await sharp('public/mockups/hud-lab/attach/ring-only.png').resize(76, 76).png().toBuffer();
const out = await sharp(bg)
  .composite([
    { input: portraitMasked, top: 24, left: 24 },
    { input: ring, top: 12, left: 12 },
  ]).png().toFile('test-results/medallion-composite.png');
console.log('done');
